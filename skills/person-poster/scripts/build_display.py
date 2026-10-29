#!/usr/bin/env python3
"""Build declared text and native chart payloads; rendered review is still required."""
from __future__ import annotations

import argparse
import copy
import json
import re
import tempfile
from pathlib import Path
from urllib.parse import unquote, urlsplit

from display_contract import dataset_paths, evidence_path
from runtime_contract import runtime_config
from sync_display import SourceElements, sync_display
from verify_evidence import pointer, read_local

GENERATED = 'charts.generated.js'


def unique(items, title):
    if not isinstance(items, list) or any(not isinstance(x, dict) or not isinstance(x.get('id'), str)
                                         or not x['id'].strip() for x in items):
        raise ValueError(f'{title} needs an array of nonempty ids')
    result = {x['id']: x for x in items}
    if len(result) != len(items):
        raise ValueError(f'Duplicate {title} id')
    return result


def build_display(root: Path) -> dict:
    root = root.resolve()
    manifest, data = read_local(root, 'manifest.json'), read_local(root, 'data.json')
    mapping = read_local(root, manifest['displayBindings'])
    declared = unique(manifest.get('charts', []), 'manifest chart')
    charts = unique(mapping.get('charts'), 'chart mapping')
    if set(charts) != set(declared):
        raise ValueError('Chart mapping/manifest coverage differs')
    html_path = evidence_path(root, manifest['html'])
    source = html_path.read_text(encoding='utf-8')
    parsed = SourceElements(source)
    if charts:
        loaded = any(n['tag'] == 'script' and (src := dict(n['attrs']).get('src'))
                     and not urlsplit(src).scheme and not src.startswith('//')
                     and (html_path.parent / unquote(urlsplit(src).path)).resolve() == root / GENERATED
                     for n in parsed.nodes)
        if not loaded:
            raise ValueError('Load charts.generated.js with a relative script src before rendering charts')
        if any(n['tag'] == 'script' and not dict(n['attrs']).get('src')
               and re.search(r'\b(?:window\.)?__INFOGRAPHIC_CHARTS__\s*=',
                             source[n['openEnd']:n['closeStart']]) for n in parsed.nodes):
            raise ValueError('Remove handwritten chart assignment; use charts.generated.js')
    originals = {'manifest.json', 'data.json', manifest['displayBindings'], manifest['html']}
    if (root / 'fact-review.json').exists():
        originals.add('fact-review.json')
        for check in read_local(root, 'fact-review.json').get('checks', []):
            if isinstance(check, dict) and isinstance(check.get('evidence'), str):
                originals.add(check['evidence'])
    from source_evidence import source_paths
    protected = set(originals)
    if (root / 'fact-review.json').exists():
        protected.update(source_paths(root, read_local(root, 'fact-review.json')))
    for group, keys in [('assets', ('file', 'sourceFile')), ('dependencies', ('file',))]:
        for item in manifest.get(group, []):
            protected.update(item[key] for key in keys if isinstance(item.get(key), str))
    outputs, specs = {}, {}
    if manifest.get('managedRuntime') is True:
        for runtime in ('render_charts.js', 'poster_bootstrap.js'):
            if runtime in protected:
                raise ValueError('Managed runtime path conflicts with an original input')
            outputs[runtime] = Path(__file__).with_name(runtime).read_bytes()

    for key, item in declared.items():
        name = item['spec']
        if name in protected or name in outputs or name == GENERATED:
            raise ValueError('Chart spec paths must be unique and cannot overwrite other inputs')
        spec = copy.deepcopy(read_local(root, name))
        expected, covered = dataset_paths(spec), set()
        links = charts[key].get('data')
        if not isinstance(links, list):
            raise ValueError(f'Chart {key}: data mappings must be an array')
        for link in links:
            target = link['specPointer']
            if target not in expected or target in covered:
                raise ValueError(f'Chart {key}: not a unique native dataset pointer: {target}')
            values = pointer(data, link['dataPointer'])
            if not isinstance(values, list):
                raise ValueError(f'Chart {key}: values must be an array')
            pointer(spec, target.rsplit('/', 1)[0])['values'] = copy.deepcopy(values)
            covered.add(target)
        if not expected or covered != expected:
            raise ValueError(f'Chart {key}: unmapped native datasets')
        outputs[name] = (json.dumps(spec, ensure_ascii=False, indent=2) + '\n').encode()
        specs[key] = spec
    if GENERATED in protected:
        raise ValueError('Generated chart payload cannot overwrite a declared input')
    payload = json.dumps(specs, ensure_ascii=True, allow_nan=False).replace('<', '\\u003c')
    config = json.dumps(runtime_config(manifest), ensure_ascii=True).replace('<', '\\u003c')
    outputs[GENERATED] = ('window.__INFOGRAPHIC_CHARTS__ = ' + payload + ';\n' +
                          'window.__POSTER_CONFIG__ = ' + config + ';\n').encode()

    if manifest.get('managedRuntime') is not True:
        outputs[GENERATED] = ('window.__INFOGRAPHIC_CHARTS__ = ' + payload + ';\n').encode()
    # Stage only text/spec and claim evidence, never copy large photos or old reports.
    with tempfile.TemporaryDirectory(prefix='.poster-build-', dir=root.parent) as temporary:
        stage = Path(temporary)
        for name in originals:
            original = evidence_path(root, name)
            destination = stage / original.relative_to(root)
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(original.read_bytes())
        for name, content in outputs.items():
            destination = (stage / name).resolve()
            if not destination.is_relative_to(stage):
                raise ValueError('Build output escapes bundle')
            # Validate original spec paths as well as staged paths before writing.
            if name != GENERATED:
                evidence_path(root, name)
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(content)
        synced = sync_display(stage, apply=True)
        outputs[manifest['html']] = (stage / manifest['html']).read_bytes()
        targets = {}
        for name, content in outputs.items():
            target = (root / name).resolve()
            if not target.is_relative_to(root) or (root / name).is_symlink():
                raise ValueError('Build output escapes bundle or uses a symlink')
            if not target.exists() or target.read_bytes() != content:
                targets[name] = target
        # All declarations validated first. A write error is a failed build, never ready.
        for index, (name, target) in enumerate(targets.items()):
            candidate = stage / f'commit-{index}'
            candidate.write_bytes(outputs[name])
            target.parent.mkdir(parents=True, exist_ok=True)
            candidate.replace(target)
    return {'bindings': synced['bindings'], 'charts': len(specs), 'changedFiles': list(targets),
            'nextAction': 'Run layout/review; source truth, visible coverage and visual quality remain unverified.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--bundle', type=Path, required=True)
    args = parser.parse_args()
    try:
        print(json.dumps(build_display(args.bundle), ensure_ascii=False))
        return 0
    except (OSError, ValueError, KeyError, IndexError, TypeError) as error:
        print(json.dumps({'passed': False, 'errors': [str(error)]}, ensure_ascii=False))
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
