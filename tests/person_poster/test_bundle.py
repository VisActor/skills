import copy
import json

import pytest
from test_chart_specs import native_spec

URL = 'https://unpkg.com/@visactor/vchart@2.1.7/build/index.min.js'


def write_bundle(root, *, charts=True, text='A; "中文" </script> window.__INFOGRAPHIC_CHARTS__ = literal'):
    spec = native_spec()
    spec['data'][0]['values'][0]['label'] = text
    (root / 'chart.spec.json').write_text(json.dumps(spec))
    manifest = {'html': 'index.html', 'png': 'preview.png',
                'canvas': {'width': 800, 'height': 900},
                'charts': [{'id': 'main', 'spec': 'chart.spec.json', 'mount': '#chart-main'}] if charts else []}
    payload = json.dumps({'main': spec} if charts else {}).replace('<', '\\u003c')
    script = f'<script src="{URL}"></script>' if charts else ''
    (root / 'index.html').write_text(
        f'<div id="infographic"><div id="chart-main"></div></div>{script}'
        f'<script>window.__INFOGRAPHIC_CHARTS__ = {payload};</script>')
    (root / 'manifest.json').write_text(json.dumps(manifest))
    return manifest


@pytest.mark.parametrize('charts', [True, False])
def test_native_bundle_and_escaped_payload(poster_validator, tmp_path, charts):
    write_bundle(tmp_path, charts=charts)
    result = poster_validator.validate_bundle(tmp_path, require_png=False)
    assert result.ok, result.errors
    assert not poster_validator.validate_bundle(tmp_path).ok


@pytest.mark.parametrize('mutation, message', [
    ('duplicate', 'Duplicate chart id'), ('missing-spec', 'Missing chart spec'),
    ('old', 'require conversion'), ('mismatch', 'differs from file'),
    ('runtime', 'require the pinned'), ('escape', 'relative'),
    ('symlink', 'escapes bundle'), ('nan', 'positive number'),
])
def test_invalid_wiring(poster_validator, tmp_path, mutation, message):
    manifest = write_bundle(tmp_path)
    if mutation == 'duplicate':
        manifest['charts'].append(copy.deepcopy(manifest['charts'][0]))
    elif mutation == 'missing-spec':
        manifest['charts'][0]['spec'] = 'absent.json'
    elif mutation == 'old':
        manifest['charts'][0]['schema'] = manifest['charts'][0].pop('spec')
    elif mutation == 'mismatch':
        (tmp_path / 'chart.spec.json').write_text(json.dumps(native_spec()))
    elif mutation == 'runtime':
        p = tmp_path / 'index.html'
        p.write_text(p.read_text().replace(URL, 'missing.js'))
    elif mutation == 'escape':
        manifest['charts'][0]['spec'] = '../outside.json'
    elif mutation == 'symlink':
        external = tmp_path.parent / f'{tmp_path.name}-outside.json'
        external.write_text('{}')
        (tmp_path / 'link.json').symlink_to(external)
        manifest['charts'][0]['spec'] = 'link.json'
    elif mutation == 'nan':
        manifest['canvas']['width'] = float('nan')
    (tmp_path / 'manifest.json').write_text(json.dumps(manifest))
    result = poster_validator.validate_bundle(tmp_path, require_png=False)
    assert any(message in error for error in result.errors), result.errors


def test_local_runtime_can_have_any_filename(poster_validator, tmp_path):
    manifest = write_bundle(tmp_path)
    manifest['dependencies'] = [{'name': '@visactor/vchart', 'version': '2.1.7',
                                 'file': 'runtime.js', 'source': URL}]
    (tmp_path / 'runtime.js').write_text('// Test asset; rendering tested in browser smoke.')
    p = tmp_path / 'index.html'
    p.write_text(p.read_text().replace(URL, 'runtime.js'))
    (tmp_path / 'manifest.json').write_text(json.dumps(manifest))
    result = poster_validator.validate_bundle(tmp_path, require_png=False)
    assert result.ok, result.errors


def test_html_symlink_outside_is_rejected(poster_validator, tmp_path):
    write_bundle(tmp_path)
    outside = tmp_path.parent / f'{tmp_path.name}-outside.html'
    outside.write_text('not a bundle')
    (tmp_path / 'index.html').unlink()
    (tmp_path / 'index.html').symlink_to(outside)
    assert any('escapes bundle' in e for e in poster_validator.validate_bundle(tmp_path).errors)


@pytest.mark.parametrize('charts', [True, False])
@pytest.mark.parametrize('require_png', [True, False])
def test_html_delivery_without_png(poster_validator, tmp_path, charts, require_png):
    manifest = write_bundle(tmp_path, charts=charts)
    manifest['delivery'] = 'html'
    manifest.pop('png')
    (tmp_path / 'manifest.json').write_text(json.dumps(manifest))
    result = poster_validator.validate_bundle(tmp_path, require_png=require_png)
    assert result.ok, result.errors


@pytest.mark.parametrize('delivery', ['html+png', None])
def test_default_delivery_still_requires_png(poster_validator, tmp_path, delivery):
    manifest = write_bundle(tmp_path)
    if delivery is not None:
        manifest['delivery'] = delivery
    (tmp_path / 'manifest.json').write_text(json.dumps(manifest))
    assert poster_validator.validate_bundle(tmp_path, require_png=False).ok
    assert any('Missing PNG' in e for e in poster_validator.validate_bundle(tmp_path).errors)


@pytest.mark.parametrize('delivery', ['', 'pdf', None, [], {}])
def test_invalid_delivery_rejected(poster_validator, tmp_path, delivery):
    manifest = write_bundle(tmp_path)
    manifest['delivery'] = delivery
    (tmp_path / 'manifest.json').write_text(json.dumps(manifest))
    assert any('delivery' in e for e in poster_validator.validate_bundle(tmp_path, require_png=False).errors)


@pytest.mark.parametrize('png,valid', [('unused.png', True), ('../escape.png', False), (None, False)])
def test_optional_html_png_path_is_validated(poster_validator, tmp_path, png, valid):
    manifest = write_bundle(tmp_path)
    manifest.update(delivery='html', png=png)
    (tmp_path / 'manifest.json').write_text(json.dumps(manifest))
    assert poster_validator.validate_bundle(tmp_path).ok is valid
