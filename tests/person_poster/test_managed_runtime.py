import json
import shutil
import sys
from pathlib import Path

import pytest

SCRIPTS = Path(__file__).resolve().parents[2] / 'skills/person-poster/scripts'
sys.path.insert(0, str(SCRIPTS))
from build_display import build_display  # noqa: E402
from init_bundle import initialize_bundle  # noqa: E402
from validate_bundle import validate_bundle  # noqa: E402

# This module needs the locked npm VChart runtime installed by the browser job.
pytestmark = pytest.mark.poster_browser


def managed_bundle(root, *, local=True):
    initialize_bundle(root, width=1200, height=1600)
    manifest = json.loads((root / 'manifest.json').read_text())
    if local:
        shutil.copy2(SCRIPTS.parents[2] / 'tests/browser/node_modules/@visactor/vchart/build/index.min.js', root / 'runtime.js')
        manifest['dependencies'] = [{'name': '@visactor/vchart', 'file': 'runtime.js', 'version': '2.1.7'}]
    manifest['charts'] = [{'id': key, 'spec': f'charts/{key}.json', 'mount': f'#chart-{key}'} for key in ['a', 'b']]
    (root / 'charts').mkdir()
    data = {'count': 9, 'a': [{'x': 'Alpha', 'y': 9}], 'b': [{'x': 'Beta', 'y': 6}]}
    for key in ['a', 'b']:
        (root / f'charts/{key}.json').write_text(json.dumps({'type': 'bar', 'animation': False, 'padding': {'top': 64}, 'color': ['#e0e0e0'],
            'data': {'values': []}, 'xField': 'x', 'yField': 'y', 'axes': [{'orient': 'bottom', 'visible': False},
            {'orient': 'left', 'visible': False}], 'label': {'visible': True, 'position': 'top', 'smartInvert': False,
              'style': {'fontSize': 32, 'fill': '#000', 'stroke': False}}}))
    mapping = {'version': 1, 'dom': [{'id': 'count', 'kind': 'value', 'dataPointer': '/count',
                                     'format': {'style': 'decimal', 'places': 0}}],
        'charts': [{'id': key, 'data': [{'specPointer': '/data/values', 'dataPointer': '/' + key}]} for key in ['a', 'b']]}
    for name, value in [('manifest.json', manifest), ('data.json', data), ('input.json', data), ('display-map.json', mapping),
        ('fact-review.json', {'status': 'passed', 'comparisons': [{'dataPointer': '',
          'evidence': {'file': 'input.json', 'pointer': '', 'source': 'synthetic original input'}}]})]:
        (root / name).write_text(json.dumps(value))
    html = (root / 'index.html').read_text().replace('</main>',
        '<p id="count" data-required style="margin:0;position:absolute;left:60px;top:40px;font:32px/1.4 Arial"></p>'
        + ''.join(f'<div id="chart-{key}" data-chart-id="{key}" data-required style="position:absolute;left:60px;'
                  f'top:{160+i*500}px;width:1080px;height:400px"></div>' for i, key in enumerate(['a', 'b'])) + '</main>')
    (root / 'index.html').write_text(html)
    return manifest


def test_managed_loader_is_a_valid_static_runtime(tmp_path):
    managed_bundle(tmp_path)
    build_display(tmp_path)
    result = validate_bundle(tmp_path, require_png=False)
    assert result.ok, result.errors


def test_real_charts_use_init_build_review_and_sync_without_handwritten_boot(tmp_path):
    import poster_workflow as workflow
    managed_bundle(tmp_path)
    assert workflow.execute(tmp_path, 'preflight') == 0
    assert workflow.execute(tmp_path, 'build') == 0
    assert workflow.execute(tmp_path, 'review') == 0
    report = json.loads((tmp_path / 'review/review.json').read_text())
    assert report['technicalPassed'] and len(report['chartSpecMatches']) == 2
    assert '<script src="runtime.js"' not in (tmp_path / 'index.html').read_text()
    data = json.loads((tmp_path / 'data.json').read_text())
    data['count'] = data['a'][0]['y'] = 12
    for name in ['data.json', 'input.json']:
        (tmp_path / name).write_text(json.dumps(data))
    assert workflow.execute(tmp_path, 'build') == 0
    assert '>12</p>' in (tmp_path / 'index.html').read_text()
    assert json.loads((tmp_path / 'charts/a.json').read_text())['data']['values'][0]['y'] == 12
    with pytest.raises(ValueError, match='Inputs changed'):
        workflow.checked_review(tmp_path)
    from browser_runtime import browser_launch_options
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser = p.chromium.launch(**browser_launch_options())
        try:
            page = browser.new_page(viewport={'width': 1200, 'height': 1600})
            page.goto((tmp_path / 'index.html').as_uri())
            page.wait_for_function('window.__INFOGRAPHIC_READY__ === true')
            assert page.evaluate('window.__POSTER_INSTANCES__.length') == 2
            assert page.locator('[data-chart-id] canvas').count() == 2
            assert page.evaluate('window.__POSTER_INSTANCES__[0].getSpec().data.values[0].y') == 12
        finally:
            browser.close()


@pytest.mark.parametrize('change', ['bridge', 'order', 'config', 'dependency-version'])
def test_managed_flag_does_not_waive_actual_contract(tmp_path, change):
    managed_bundle(tmp_path)
    build_display(tmp_path)
    if change == 'bridge':
        (tmp_path / 'render_charts.js').write_text('// replaced')
    elif change == 'order':
        path = tmp_path / 'index.html'
        path.write_text(path.read_text().replace('src="render_charts.js"', 'src="poster_bootstrap.js"'))
    elif change == 'config':
        path = tmp_path / 'charts.generated.js'
        path.write_text(path.read_text().replace('runtime.js', 'unreviewed.js'))
    else:
        path = tmp_path / 'manifest.json'
        manifest = json.loads(path.read_text())
        manifest['dependencies'][0]['version'] = '0.0.0'
        path.write_text(json.dumps(manifest))
    assert not validate_bundle(tmp_path, require_png=False).ok


@pytest.mark.parametrize('mode', ['cdn-blocked', 'missing-mount', 'second-fails'])
def test_managed_failure_clears_ready_and_instances(tmp_path, mode):
    from browser_runtime import browser_launch_options
    from delivery_policy import check_export_target
    from playwright.sync_api import sync_playwright
    from runtime_contract import VCHART_URL
    managed_bundle(tmp_path, local=False)
    build_display(tmp_path)
    if mode == 'missing-mount':
        path = tmp_path / 'index.html'
        path.write_text(path.read_text().replace('id="chart-b"', 'id="gone"'))
    elif mode == 'second-fails':
        path = tmp_path / 'charts.generated.js'
        text = path.read_text()
        offset = text.index('window.__POSTER_CONFIG__')
        specs = json.loads(text[:offset].split('=', 1)[1].strip().removesuffix(';'))
        specs['b']['type'] = 'unknown-chart-type'
        path.write_text('window.__INFOGRAPHIC_CHARTS__=' + json.dumps(specs) + ';\n' + text[offset:])
    with sync_playwright() as p:
        browser = p.chromium.launch(**browser_launch_options())
        try:
            page = browser.new_page(viewport={'width': 1200, 'height': 1600})
            runtime = SCRIPTS.parents[2] / 'tests/browser/node_modules/@visactor/vchart/build/index.min.js'
            page.route(VCHART_URL, lambda route: route.abort() if mode == 'cdn-blocked' else route.fulfill(path=str(runtime)))
            page.goto((tmp_path / 'index.html').as_uri())
            page.wait_for_function('!!window.__INFOGRAPHIC_ERROR__')
            assert page.evaluate('window.__INFOGRAPHIC_READY__') is False
            assert page.evaluate('(window.__POSTER_INSTANCES__ || []).length') == 0
            assert page.locator('canvas').count() == 0
        finally:
            browser.close()
    with pytest.raises(ValueError):
        check_export_target(tmp_path, tmp_path / 'index.html', tmp_path / 'preview.png', draft=False)
