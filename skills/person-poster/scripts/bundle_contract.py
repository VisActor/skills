"""Read-only build-input diagnostics; generated payloads need not exist yet."""
from pathlib import Path

from display_contract import dataset_paths, format_display_value
from sync_display import SourceElements
from verify_evidence import pointer, read_local


def check_build_inputs(root: Path) -> dict:
    issues = []
    def issue(code, file, path, message):
        issues.append({'code': code, 'file': file, 'pointer': path, 'message': str(message),
                       'nextAction': 'Repair this declaration or restore its intended source; do not delete visible requirements to pass.'})
    def read(name):
        try:
            return read_local(root, name)
        except (OSError, ValueError, TypeError) as error:
            issue('invalid-input', str(name), '', error)
            return {}
    manifest = read('manifest.json')
    if not isinstance(manifest, dict):
        issue('invalid-manifest', 'manifest.json', '', 'Expected an object')
        manifest = {}
    for key in ['html', 'displayBindings'] + ([] if manifest.get('delivery') == 'html' else ['png']):
        name = manifest.get(key)
        if not isinstance(name, str) or not name or Path(name).is_absolute() or not (root / name).resolve().is_relative_to(root.resolve()):
            issue('invalid-manifest-field', 'manifest.json', '/' + key, 'Expected a bundle-relative path')
    canvas = manifest.get('canvas', {})
    if not isinstance(canvas, dict) or any(type(canvas.get(k)) is not int or canvas[k] <= 0 for k in ('width','height')):
        issue('invalid-canvas', 'manifest.json', '/canvas', 'Expected positive integer CSS width/height')
    data, facts = read('data.json'), read('fact-review.json')
    mapping = read(manifest['displayBindings']) if isinstance(manifest.get('displayBindings'), str) else {}
    if not isinstance(mapping, dict):
        issue('invalid-mapping', 'display-map.json', '', 'Expected an object')
        mapping = {}
    fact_ids = {f.get('id') for f in facts.get('checks', []) if isinstance(f, dict)} if isinstance(facts, dict) else set()
    nodes = []
    try:
        html = (root / manifest['html']).resolve()
        if not html.is_relative_to(root.resolve()):
            raise ValueError('HTML path outside bundle')
        nodes = SourceElements(html.read_text(encoding='utf-8')).nodes
    except (OSError, ValueError, KeyError, TypeError) as error:
        issue('invalid-html', 'manifest.json', '/html', error)
    entries = mapping.get('dom', [])
    if not isinstance(entries, list):
        issue('invalid-mapping', manifest.get('displayBindings', 'display-map.json'), '/dom', 'Expected array')
        entries = []
    seen = set()
    for i, entry in enumerate(entries):
        where = '/dom/' + str(i)
        if not isinstance(entry, dict) or not isinstance(entry.get('id'), str):
            issue('invalid-binding', 'display-map.json', where, 'Expected binding with id')
            continue
        key = entry['id']
        if key in seen:
            issue('duplicate-binding', 'display-map.json', where, key)
        seen.add(key)
        targets = [n for n in nodes if any(k in ('id', 'data-display-id') and v == key for k,v in n['attrs'])]
        if len(targets) != 1:
            issue('invalid-target', 'display-map.json', where, f'{key}: expected one HTML target, found {len(targets)}')
        if entry.get('kind') in ('value', 'claim'):
            try:
                value = pointer(data, entry['dataPointer'])

            except (ValueError, KeyError, IndexError, TypeError) as error:
                issue('missing-data-pointer', 'display-map.json', where + '/dataPointer', f'{entry.get("dataPointer")}: {error}')
        if entry.get('kind') == 'value':
            try:
                value = pointer(data, entry['dataPointer'])
            except (ValueError, KeyError, IndexError, TypeError):
                pass
            else:
                try:
                    format_display_value(value, entry.get('format'))
                except (ValueError, TypeError) as error:
                    issue('invalid-format', 'display-map.json', where + '/format', error)
        if entry.get('kind') == 'claim':
            ids = entry.get('factIds', [])
            if not isinstance(ids, list) or not ids:
                issue('missing-fact-id', 'display-map.json', where + '/factIds', 'Expected nonempty fact ids')
            else:
                for fact_id in ids:
                    if not isinstance(fact_id, str) or fact_id not in fact_ids:
                        issue('missing-fact-id', 'display-map.json', where + '/factIds', fact_id)
    charts = mapping.get('charts', [])
    if not isinstance(charts, list):
        issue('invalid-mapping', 'display-map.json', '/charts', 'Expected array')
        charts = []
    declared = manifest.get('charts', [])
    if not isinstance(declared, list):
        issue('invalid-charts', 'manifest.json', '/charts', 'Expected array')
        declared = []
    by_id = {c.get('id'): c for c in declared if isinstance(c, dict) and isinstance(c.get('id'), str)}
    if len(by_id) != len(declared):
        issue('invalid-charts', 'manifest.json', '/charts', 'Missing or duplicate chart ids')
    mapped_ids = [c['id'] for c in charts if isinstance(c, dict) and isinstance(c.get('id'), str)]
    if len(set(mapped_ids)) != len(charts) or set(mapped_ids) != set(by_id):
        issue('chart-coverage', 'display-map.json', '/charts', 'Chart mapping/manifest ids differ')
    native_paths = {}
    for key, chart in by_id.items():
        try:
            native_paths[key] = dataset_paths(read_local(root, chart['spec']))
        except (OSError, ValueError, KeyError, TypeError) as error:
            issue('invalid-spec', 'manifest.json', '/charts/' + key, error)
    for i, chart in enumerate(charts):
        links = chart.get('data', []) if isinstance(chart, dict) else []
        if not isinstance(links, list):
            issue('invalid-chart-mapping', 'display-map.json', f'/charts/{i}/data', 'Expected array')
            continue
        mapped = []
        for j, link in enumerate(links):
            try:
                pointer(data, link['dataPointer'])
                mapped.append(link['specPointer'])
            except (ValueError, KeyError, IndexError, TypeError) as error:
                issue('missing-data-pointer', 'display-map.json', f'/charts/{i}/data/{j}', error)
        if isinstance(chart, dict) and chart.get('id') in native_paths and (
                set(mapped) != native_paths[chart['id']] or len(mapped) != len(set(mapped))):
            issue('invalid-chart-mapping', 'display-map.json', f'/charts/{i}/data', 'Expected unique native dataset pointers')
    return {'passed': not issues, 'errors': [f"{i['file']}{i['pointer']}: {i['message']}" for i in issues], 'issues': issues}
