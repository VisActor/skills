"""Bind rendered text and chart datasets to recorded facts; not a source-truth oracle."""
from __future__ import annotations

import re
from decimal import ROUND_HALF_UP, Decimal, InvalidOperation
from pathlib import Path

from json_values import json_values_equal
from verify_evidence import pointer, read_local

DISPLAY_VERSION = 1
DISPLAY_SCRIPT = Path(__file__).with_name('display_probe.js').read_text(encoding='utf-8')


def format_display_value(value: object, formatting: dict) -> str:
    if not isinstance(formatting, dict) or formatting.get('style') not in ('text', 'decimal', 'percent'):
        raise ValueError('Use text, decimal or percent format')
    style = formatting['style']
    if style != 'text':
        places = formatting.get('places')
        if type(places) is not int or not 0 <= places <= 12 or type(formatting.get('grouping', False)) is not bool:
            raise ValueError('Format needs integer places 0..12 and optional boolean grouping')
    if value is None:
        return '—'
    if style == 'text':
        if not isinstance(value, str):
            raise ValueError('text format requires a string')
        return value
    if type(value) not in (int, float):
        raise ValueError('Numeric format requires a finite JSON number')
    number = Decimal(str(value))
    if not number.is_finite():
        raise ValueError('Numeric format requires a finite JSON number')
    if style == 'percent':
        number *= 100
    try:
        number = number.quantize(Decimal(1).scaleb(-places), rounding=ROUND_HALF_UP)
    except InvalidOperation as error:
        raise ValueError('Number cannot be represented with this format') from error
    result = format(number, f"{',' if formatting.get('grouping') else ''}.{places}f")
    return result + ('%' if style == 'percent' else '')


def evidence_path(root: Path, name: str) -> Path:
    if not isinstance(name, str) or not name or Path(name).is_absolute():
        raise ValueError('Claim evidence must be bundle-relative')
    path = (root / name).resolve()
    if not path.is_relative_to(root.resolve()) or not path.is_file() or not path.stat().st_size:
        raise ValueError(f'Claim evidence missing or outside bundle: {name}')
    return path


def dataset_paths(spec, prefix='') -> set[str]:
    """Find native datasets, including per-series datasets in combination charts."""
    found = set()
    if isinstance(spec, dict):
        for key, value in spec.items():
            path = prefix + '/' + key.replace('~', '~0').replace('/', '~1')
            if key == 'data':
                entries = value if isinstance(value, list) else [value]
                for i, entry in enumerate(entries):
                    if isinstance(entry, dict) and 'values' in entry:
                        found.add(path + (f'/{i}' if isinstance(value, list) else '') + '/values')
            found.update(dataset_paths(value, path))
    elif isinstance(spec, list):
        for i, value in enumerate(spec):
            found.update(dataset_paths(value, prefix + f'/{i}'))
    return found


def _unique(items, title):
    if not isinstance(items, list) or any(not isinstance(i, dict) or not isinstance(i.get('id'), str)
                                         or not i['id'].strip() for i in items):
        raise ValueError(f'{title} must be an array with nonempty ids')
    result = {i['id']: i for i in items}
    if len(result) != len(items):
        raise ValueError(f'Duplicate {title} id')
    return result


def check_display(root: Path, snapshot: dict) -> dict:
    errors, bindings, labels = [], [], []
    unbound, unknown = snapshot.get('unboundText', []), snapshot.get('unmeasured', [])
    try:
        manifest = read_local(root, 'manifest.json')
        if not manifest.get('displayBindings'):
            raise ValueError('Missing displayBindings; migrate the bundle before formal delivery')
        mapping = read_local(root, manifest['displayBindings'])
        if mapping.get('version') != DISPLAY_VERSION:
            raise ValueError('Unsupported display binding version')
        data = read_local(root, 'data.json')
        entries = _unique(mapping.get('dom'), 'display mapping')
        actual = _unique(snapshot.get('dom'), 'rendered display')
        if set(entries) != set(actual):
            errors.append(f'Display id coverage differs: missing={sorted(set(entries)-set(actual))}, '
                          f'extra={sorted(set(actual)-set(entries))}')
        for key, entry in entries.items():
            try:
                node = actual[key]
                if node.get('visible') is not True or node.get('nested'):
                    raise ValueError('Binding must be visible direct text without nested elements (br allowed)')
                kind = entry.get('kind')
                if kind == 'label':
                    expected = entry['text']
                    if not isinstance(expected, str) or re.search(r'[0-9０-９]', expected):
                        raise ValueError('Labels cannot contain digits; use value or claim')
                    labels.append({'id': key, 'text': expected})
                elif kind in ('value', 'claim'):
                    value = pointer(data, entry['dataPointer'])
                    if kind == 'value':
                        expected = format_display_value(value, entry.get('format'))
                    else:
                        if not isinstance(value, str):
                            raise ValueError('Claim pointer must resolve to a string')
                        expected = value
                        ids = entry.get('factIds')
                        if not isinstance(ids, list) or not ids or any(not isinstance(i, str) for i in ids):
                            raise ValueError('Claim needs nonempty factIds')
                        facts = _unique(read_local(root, 'fact-review.json').get('checks'), 'fact check')
                        for fact_id in ids:
                            fact = facts[fact_id]
                            if fact.get('claim') != expected or fact.get('status') != 'passed':
                                raise ValueError('Claim text/status differs from checked fact')
                            if any(not isinstance(fact.get(k), str) or not fact[k].strip() for k in ('source', 'observed')):
                                raise ValueError('Claim needs source and observed evidence')
                            evidence_path(root, fact.get('evidence'))
                else:
                    raise ValueError('Unknown binding kind')
                if node.get('text') != expected:
                    raise ValueError(f'Display text mismatch: expected {expected!r}, rendered {node.get("text")!r}')
                bindings.append({'id': key, 'kind': kind, 'text': node['text'], 'passed': True})
            except (OSError, ValueError, KeyError, IndexError, TypeError) as error:
                errors.append(f'Display {key}: {error}')
        charts = _unique(mapping.get('charts'), 'chart mapping')
        declared = _unique(manifest.get('charts', []), 'manifest chart')
        specs = snapshot.get('chartSpecs', {})
        if set(charts) != set(declared) or set(specs) != set(declared):
            errors.append('Chart mapping/runtime/manifest coverage differs')
        for key, entry in charts.items():
            try:
                spec = specs[key]
                expected_paths, covered = dataset_paths(spec), set()
                if not isinstance(entry.get('data'), list):
                    raise ValueError('Chart data mappings must be an array')
                for link in entry['data']:
                    path = link['specPointer']
                    if path not in expected_paths or path in covered:
                        raise ValueError(f'Not a unique native dataset pointer: {path}')
                    covered.add(path)
                    left, right = pointer(spec, path), pointer(data, link['dataPointer'])
                    if not json_values_equal(left, right):
                        raise ValueError(f'Chart values differ: {path}')
                if covered != expected_paths or not expected_paths:
                    raise ValueError(f'Chart has unmapped or missing datasets: {sorted(expected_paths-covered)}')
                bindings.append({'id': key, 'kind': 'chart', 'passed': True})
            except (ValueError, KeyError, IndexError, TypeError) as error:
                errors.append(f'Chart {key}: {error}')
    except (OSError, ValueError, KeyError, IndexError, TypeError) as error:
        errors.append(str(error))
    if unbound:
        errors.append(f'Unbound visible text: {len(unbound)} items')
    if unknown:
        errors.append(f'Unmeasured display text: {len(unknown)} items')
    return {'version': DISPLAY_VERSION, 'passed': not errors, 'errors': errors, 'bindings': bindings,
            'unboundText': unbound, 'unmeasured': unknown, 'labelsForSemanticReview': labels,
            'scope': 'Display consistency only; labels, chart annotations and source truth need independent semantic review'}
