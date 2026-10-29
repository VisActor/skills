#!/usr/bin/env python3
"""Replay source locators and materialize declared data; not a semantic fact oracle."""
from __future__ import annotations

import argparse
import copy
import hashlib
import json
import re
from decimal import ROUND_HALF_UP, Decimal
from html.parser import HTMLParser
from pathlib import Path

from json_values import json_values_equal
from verify_evidence import number, pointer, read_local


def local_file(root: Path, name: str) -> Path:
    if not isinstance(name, str) or not name or Path(name).is_absolute():
        raise ValueError('Source path must be bundle-relative')
    path = (root / name).resolve()
    if not path.is_relative_to(root.resolve()) or not path.is_file() or not path.stat().st_size:
        raise ValueError(f'Source missing, empty or outside bundle: {name}')
    return path


def captured(root: Path, name: str):
    capture_path = local_file(root, name)
    meta = read_local(root, name)
    if meta.get('version') != 1 or meta.get('kind') not in ('web', 'user-input', 'web-export'):
        raise ValueError('Unsupported source capture')
    raw = local_file(root, meta['raw'])
    if raw in (root / 'data.json', root / 'fact-review.json', root / 'evidence-extract.json', capture_path) or raw.is_relative_to(root / 'charts'):
        raise ValueError('Captured raw must be separate from delivery data and records')
    if hashlib.sha256(raw.read_bytes()).hexdigest() != meta.get('sha256'):
        raise ValueError('Original source hash changed; recapture under a new id')
    if not meta.get('source') or not meta.get('capturedAt') or meta.get('format') not in ('html', 'json'):
        raise ValueError('Capture needs original source, time and format')
    if meta['kind'].startswith('web') and not meta.get('finalUrl'):
        raise ValueError('Web source needs actual final URL')
    return meta, raw, capture_path


class Tables(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.tables, self.stack = [], []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'table':
            if self.stack:
                self.stack[-1]['complex'] = True
            table = {'rows': [], 'cells': [], 'complex': False, 'row': None, 'cell': None, 'rowCells': []}
            self.tables.append(table)
            self.stack.append(table)
        elif self.stack:
            table = self.stack[-1]
            if tag == 'tr':
                table['row'] = []
                table['rowCells'] = []
            elif tag in ('td', 'th'):
                try:
                    span = int(attrs.get('colspan', '1'))
                    if not 1 <= span <= 1000:
                        raise ValueError('Unsupported colspan')
                except ValueError:
                    span = 1
                    table['complex'] = True
                if attrs.get('rowspan', '1') != '1':
                    table['complex'] = True
                table['cellSpan'] = span
                table['cell'] = []
            elif tag == 'br' and table['cell'] is not None:
                table['cell'].append(' ')

    def handle_data(self, text):
        if self.stack and self.stack[-1]['cell'] is not None:
            self.stack[-1]['cell'].append(text)

    def handle_endtag(self, tag):
        if not self.stack:
            return
        table = self.stack[-1]
        if tag in ('td', 'th') and table['cell'] is not None:
            if table['row'] is not None:
                text = ' '.join(''.join(table['cell']).split())
                span = table['cellSpan']
                table['rowCells'].append({'text': text, 'startColumn': len(table['row']), 'colspan': span})
                table['row'].extend([text] + [None] * (span - 1))
            table['cell'] = None
        elif tag == 'tr' and table['row'] is not None:
            if table['row']:
                table['rows'].append(table['row'])
                table['cells'].append(table['rowCells'])
            table['row'] = None
        elif tag == 'table':
            self.stack.pop()


def index(value):
    if type(value) is not int or value < 0:
        raise ValueError('Table indexes must be nonnegative integers')
    return value


def parse_value(value, style=None):
    if style is None:
        return value
    if style == 'text':
        return str(value)
    if style not in ('number', 'percent'):
        raise ValueError('Source parse must be number, percent or text')
    if value is None or value in ('', '—', '-'):
        return None
    if type(value) is bool:
        raise ValueError('Boolean is not a source number')
    text = str(value).strip()
    if style == 'percent':
        if not text.endswith('%'):
            raise ValueError('Percent source must include %; use number for an existing ratio')
        text = text[:-1].strip()
    if not re.fullmatch(r'[+-]?(?:(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?', text):
        raise ValueError(f'Not an unambiguous source number: {value!r}')
    result = Decimal(text.replace(',', '')) / (100 if style == 'percent' else 1)
    return float(result) if result != result.to_integral() else int(result)


def source_value(root: Path, source: dict):
    if 'capture' not in source:
        location = source.get('source')
        if not isinstance(location, str) or not location.strip():
            raise ValueError('Evidence needs the actual source URL or user input location')
        if re.search(r'https?://', location, flags=re.I):
            raise ValueError('Web evidence needs capture + raw locator; handwritten extracts cannot certify it')
        path = local_file(root, source['file'])
        if path in (root / 'data.json', root / 'fact-review.json') or path.is_relative_to(root / 'charts'):
            raise ValueError('Evidence must be an original input, not delivery data/spec')
        raw = local_file(root, source.get('raw', source['file']))
        if raw in (root / 'data.json', root / 'fact-review.json', root / 'evidence-extract.json') or raw.is_relative_to(root / 'charts'):
            raise ValueError('Raw evidence must be separate from delivery data and records')
        document = read_local(root, source['file'])
        value = pointer(document, source['pointer'])
        return value, document, {'source': location, 'rawSha256': hashlib.sha256(raw.read_bytes()).hexdigest()}
    meta, raw, _ = captured(root, source['capture'])
    context = source.get('context', {})
    if meta['kind'].startswith('web') and any(not isinstance(context.get(k), str) or not context[k].strip()
            for k in ('entity', 'metric', 'period', 'scope', 'unit')):
        raise ValueError('Web locator needs entity, metric, period, scope and unit context')
    locator = source['locator']
    cell_details = None
    if meta['format'] == 'json':
        document = read_local(root, meta['raw'])
        value = pointer(document, locator['pointer'])
    else:
        document = None
        text = raw.read_text(encoding=source.get('encoding', 'utf-8'))
        table = Tables(text).tables[index(locator['table'])]
        if table['complex']:
            raise ValueError('Selected table has unsupported rowspan/nested/malformed cells; use a structured original or pending review')
        rows = table['rows']
        header = index(locator['headerRow'])
        if any(cell['colspan'] != 1 for cell in table['cells'][header]):
            raise ValueError('Selected table header has merged cells; declare a simple original header row')
        if rows[header] != locator['headers']:
            raise ValueError('Source table headers differ from the declared structure')
        if ('row' in locator) == ('rowKey' in locator):
            raise ValueError('Choose one row index or unique rowKey')
        if 'rowKey' in locator:
            key = locator['rowKey']
            column = index(key['column'])
            matches = [(i, row) for i, row in enumerate(rows) if i != header and len(row) > column and row[column] == key['text']]
            if len(matches) != 1:
                raise ValueError('Source rowKey is missing or ambiguous')
            row_index, row = matches[0]
        else:
            row_index = index(locator['row'])
            if row_index == header:
                raise ValueError('Source value cannot be the table header')
            row = rows[row_index]
        column = index(locator['column'])
        value = row[column]
        cell = next(cell for cell in table['cells'][row_index] if cell['startColumn'] <= column < cell['startColumn'] + cell['colspan'])
        if cell['colspan'] != 1:
            raise ValueError('Selected value lies in a merged cell; numeric/text target must be one original cell')
        cell_details = {'row': row_index, **cell}
    observed = value
    value = parse_value(value, source.get('parse'))
    return value, document, {'source': meta['source'], 'capture': source['capture'],
                            'raw': meta['raw'], 'rawSha256': meta['sha256'],
                            'locator': locator, 'observed': observed, 'context': context,
                            **({'cell': cell_details} if cell_details else {})}


def resolve_comparison(root: Path, comparison: dict):
    value, document, details = source_value(root, comparison['evidence'])
    if 'denominatorEvidence' in comparison and 'denominatorPointer' in comparison:
        raise ValueError('Choose one denominator declaration')
    denominator = None
    if 'denominatorEvidence' in comparison:
        denominator, _, denominator_details = source_value(root, comparison['denominatorEvidence'])
        details['denominator'] = denominator_details
    elif 'denominatorPointer' in comparison:
        if document is None:
            raise ValueError('HTML source denominator needs denominatorEvidence')
        denominator = pointer(document, comparison['denominatorPointer'])
    if 'denominatorEvidence' in comparison or 'denominatorPointer' in comparison:
        denominator = number(denominator)
        value = None if denominator == 0 else number(value) / denominator
    if 'multiplier' in comparison and value is not None:
        value = (value if isinstance(value, Decimal) else number(value)) * number(comparison['multiplier'])
    if 'decimals' in comparison:
        places = comparison['decimals']
        if type(places) is not int or not 0 <= places <= 12:
            raise ValueError('decimals must be an integer from0to12')
        if value is not None:
            value = (value if isinstance(value, Decimal) else number(value)).quantize(Decimal(1).scaleb(-places), rounding=ROUND_HALF_UP)
    if isinstance(value, Decimal):
        value = float(value)
    return value, details


def source_paths(root: Path, review: dict) -> set[str]:
    paths = set()
    for comparison in review.get('comparisons', []):
        for source in (comparison.get('evidence'), comparison.get('denominatorEvidence')):
            if not source:
                continue
            if 'capture' in source:
                meta = read_local(root, source['capture'])
                paths.update((source['capture'], meta['raw']))
            else:
                paths.update((source['file'], source.get('raw', source['file'])))
    return paths


def relationship_errors(data: object, review: dict) -> list[str]:
    errors = []
    relations = review.get('relations', [])
    if not isinstance(relations, list):
        return ['relations must be an array']
    for i, relation in enumerate(relations):
        try:
            numerator = number(pointer(data, relation['numeratorPointer']))
            denominator = number(pointer(data, relation['denominatorPointer']))
            places = relation['decimals']
            if type(places) is not int or not 0 <= places <= 12:
                raise ValueError('Relation decimals must be from0to12')
            expected = None if denominator == 0 else float((numerator / denominator).quantize(
                Decimal(1).scaleb(-places), rounding=ROUND_HALF_UP))
            if not json_values_equal(pointer(data, relation['dataPointer']), expected):
                raise ValueError(f"Same-scope arithmetic mismatch: {relation['dataPointer']}")
        except (KeyError, IndexError, TypeError, ValueError) as error:
            errors.append(f'relations[{i}]: {error}')
    return errors


def materialize_data(root: Path) -> dict:
    root = root.resolve()
    data = copy.deepcopy(read_local(root, 'data.json'))
    review = read_local(root, 'fact-review.json')
    comparisons = review.get('comparisons')
    if not isinstance(comparisons, list) or not comparisons:
        raise ValueError('data needs nonempty comparisons declarations')
    if any((root / name).resolve() in (root / 'data.json', root / 'evidence-extract.json')
           for name in source_paths(root, review)):
        raise ValueError('Data generation cannot overwrite original evidence')
    entries, seen = [], []
    for comparison in comparisons:
        path = comparison['dataPointer']
        if not isinstance(path, str) or (path and not path.startswith('/')):
            raise ValueError('Data targets must use JSON Pointer')
        if any(path == previous or not path or not previous or path.startswith(previous + '/') or previous.startswith(path + '/') for previous in seen):
            raise ValueError('Data targets must be unique and cannot overlap')
        value, details = resolve_comparison(root, comparison)
        entries.append({'dataPointer': path, 'expected': value, **details})
        seen.append(path)
        if not path:
            data = value
        else:
            parent_path, key = path.rsplit('/', 1)
            parent = pointer(data, parent_path)
            key = key.replace('~1', '/').replace('~0', '~')
            if isinstance(parent, list):
                if not key.isdigit() or str(int(key)) != key:
                    raise ValueError('Array target needs a canonical index')
                parent[int(key)] = value
            else:
                parent[key] = value
    errors = relationship_errors(data, review)
    if errors:
        raise ValueError('; '.join(errors))
    content = json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False) + '\n'
    extract = json.dumps({'entries': entries, 'scope': 'Replayed raw locators and calculations; semantics pending independent review.'},
                         ensure_ascii=False, indent=2, allow_nan=False) + '\n'
    (root / 'evidence-extract.json').write_text(extract, encoding='utf-8')
    (root / 'data.json').write_text(content, encoding='utf-8')
    return {'generatedFields': len(entries), 'nextAction': 'Run facts, build and independent source/semantic review.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--bundle', type=Path, required=True)
    parser.add_argument('--tables', metavar='CAPTURE', help='Inspect actual HTML table indexes/rows instead of writing data')
    args = parser.parse_args()
    try:
        if args.tables:
            _, raw, _ = captured(args.bundle.resolve(), args.tables)
            result = [{'table': i, 'complex': t['complex'], 'rows': t['rows'], 'cells': t['cells']}
                      for i, t in enumerate(Tables(raw.read_text()).tables)]
        else:
            result = materialize_data(args.bundle)
        print(json.dumps(result, ensure_ascii=False))
        return 0
    except (OSError, ValueError, KeyError, IndexError, TypeError) as error:
        print(json.dumps({'passed': False, 'errors': [str(error)]}, ensure_ascii=False))
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
