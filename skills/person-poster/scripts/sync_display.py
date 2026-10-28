#!/usr/bin/env python3
"""Preview/apply declared display text to static HTML; never certifies rendered output."""
from __future__ import annotations

import argparse
import html
import json
from html.parser import HTMLParser
from pathlib import Path

from display_contract import check_display, evidence_path, format_display_value
from verify_evidence import pointer, read_local

VOID = set('area base br col embed hr img input link meta param source track wbr'.split())


class SourceElements(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=False)
        self.source, self.nodes, self.stack = source, [], []
        self.offsets = [0]
        for line in source.splitlines(keepends=True):
            self.offsets.append(self.offsets[-1] + len(line))
        self.feed(source)
        self.close()
        if self.stack:
            raise ValueError('Unclosed HTML elements; repair source before syncing')

    def source_offset(self):
        line, column = self.getpos()
        return self.offsets[line - 1] + column

    def handle_starttag(self, tag, attrs):
        start = self.source_offset()
        node = {'tag': tag, 'attrs': attrs, 'start': start,
                'openEnd': start + len(self.get_starttag_text()), 'children': [],
                'foreign': tag in ('svg', 'math') or any(n['tag'] in ('svg', 'math') for n in self.stack)}
        self.nodes.append(node)
        if self.stack:
            self.stack[-1]['children'].append(tag)
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        foreign = tag in ('svg', 'math') or any(n['tag'] in ('svg', 'math') for n in self.stack)
        if tag not in VOID and not foreign:
            raise ValueError('Use explicit closing tags for non-void HTML elements')
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.stack.pop()['closeStart'] = self.offsets[self.getpos()[0] - 1] + self.getpos()[1]

    def handle_endtag(self, tag):
        if not self.stack or self.stack[-1]['tag'] != tag:
            raise ValueError(f'Unbalanced HTML closing tag: {tag}')
        self.stack.pop()['closeStart'] = self.source_offset()


def sync_display(root: Path, *, apply=False) -> dict:
    root = root.resolve()
    manifest = read_local(root, 'manifest.json')
    mapping = read_local(root, manifest['displayBindings'])
    data = read_local(root, 'data.json')
    path = evidence_path(root, manifest['html'])
    source = path.read_text(encoding='utf-8')
    parsed = SourceElements(source)
    edits, snapshot = [], []
    for entry in mapping['dom']:
        key = entry['id']
        targets = [n for n in parsed.nodes if any(k in ('id', 'data-display-id') and v == key for k, v in n['attrs'])]
        if len(targets) != 1:
            raise ValueError(f'Display {key}: need one data-display-id or same-name HTML id; found {len(targets)}')
        node = targets[0]
        attrs = dict(node['attrs'])
        if len(attrs) != len(node['attrs']) or attrs.get('data-display-id', key) != key:
            raise ValueError(f'Display {key}: duplicate attributes or conflicting binding')
        if node['foreign'] or node['tag'] in VOID | {'script', 'style', 'textarea', 'title', 'svg'} or any(t != 'br' for t in node['children']):
            raise ValueError(f'Display {key}: target must contain only direct text/br')
        kind = entry['kind']
        if kind == 'label':
            text = entry['text']
        elif kind == 'claim':
            text = pointer(data, entry['dataPointer'])
        elif kind == 'value':
            text = format_display_value(pointer(data, entry['dataPointer']), entry.get('format'))
        else:
            raise ValueError(f'Display {key}: unsupported kind {kind}')
        if not isinstance(text, str):
            raise ValueError(f'Display {key}: expected string')
        snapshot.append({'id': key, 'text': text, 'visible': True, 'nested': False})
        edits.append((node['openEnd'], node['closeStart'], html.escape(text, quote=False).replace('\n', '<br>')))
        if 'data-display-id' not in attrs:
            edits.append((node['openEnd'] - 1, node['openEnd'] - 1,
                          ' data-display-id="' + html.escape(key, quote=True) + '"'))
    specs = {item['id']: read_local(root, item['spec']) for item in manifest.get('charts', [])}
    checked = check_display(root, {'dom': snapshot, 'chartSpecs': specs})
    if not checked['passed']:
        raise ValueError('; '.join(checked['errors']))
    # All declarations and source targets are checked before touching the file.
    result = source
    for start, end, replacement in sorted(edits, reverse=True):
        result = result[:start] + replacement + result[end:]
    changed = result != source
    if apply and changed:
        path.write_text(result, encoding='utf-8')
    return {'changed': changed, 'applied': apply and changed, 'bindings': len(snapshot),
            'html': str(path), 'nextAction': 'Run layout/review: unbound text, visibility, reading and factual truth are not certified by sync.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--bundle', required=True, type=Path)
    parser.add_argument('--apply', action='store_true', help='Write checked text and missing binding attributes; default is preview')
    args = parser.parse_args()
    try:
        print(json.dumps(sync_display(args.bundle, apply=args.apply), ensure_ascii=False))
        return 0
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(json.dumps({'passed': False, 'errors': [str(error)]}, ensure_ascii=False))
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
