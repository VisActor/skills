import json
import sys
from pathlib import Path

import pytest

SCRIPTS = Path(__file__).resolve().parents[2] / 'skills/person-poster/scripts'
sys.path.insert(0, str(SCRIPTS))
from build_display import build_display  # noqa: E402


def bundle(root):
    def save(name, value):
        (root / name).write_text(json.dumps(value))
    save('manifest.json', {'html': 'index.html', 'displayBindings': 'display-map.json',
                          'charts': [{'id': 'trend', 'spec': 'trend.spec.json'}]})
    save('data.json', {'count': 12, 'series': [{'year': 'A', 'value': 12}, {'year': 'B', 'value': None}]})
    save('display-map.json', {'version': 1, 'dom': [{'id': 'count', 'kind': 'value',
         'dataPointer': '/count', 'format': {'style': 'decimal', 'places': 0}}],
         'charts': [{'id': 'trend', 'data': [{'specPointer': '/data/0/values', 'dataPointer': '/series'}]}]})
    save('trend.spec.json', {'type': 'bar', 'data': [{'values': []}]})
    (root / 'index.html').write_text('<html><body><strong id="count"></strong>'
                                    '<script src="charts.generated.js"></script></body></html>')


def test_build_syncs_dom_spec_and_generated_payload(tmp_path):
    bundle(tmp_path)
    assert build_display(tmp_path)['bindings'] == 1
    assert 'data-display-id="count">12</strong>' in (tmp_path / 'index.html').read_text()
    spec = json.loads((tmp_path / 'trend.spec.json').read_text())
    assert spec['data'][0]['values'][-1]['value'] is None
    data = json.loads((tmp_path / 'data.json').read_text())
    data['count'] = data['series'][0]['value'] = 13
    (tmp_path / 'data.json').write_text(json.dumps(data))
    build_display(tmp_path)
    assert '>13</strong>' in (tmp_path / 'index.html').read_text()
    payload = (tmp_path / 'charts.generated.js').read_text()
    assert json.loads(payload.split(' = ', 1)[1].rstrip(';\n'))['trend']['data'][0]['values'] == data['series']
    assert build_display(tmp_path)['changedFiles'] == []


def test_visible_literal_is_not_mistaken_for_inline_assignment(tmp_path):
    bundle(tmp_path)
    data = json.loads((tmp_path / 'data.json').read_text())
    data['count'] = 'window.__INFOGRAPHIC_CHARTS__ = literal'
    (tmp_path / 'data.json').write_text(json.dumps(data))
    mapping = json.loads((tmp_path / 'display-map.json').read_text())
    mapping['dom'][0]['format'] = {'style': 'text'}
    (tmp_path / 'display-map.json').write_text(json.dumps(mapping))
    build_display(tmp_path)
    assert not build_display(tmp_path)['changedFiles']


@pytest.mark.parametrize('invalid', ['missing', 'duplicate', 'nested', 'label', 'unmapped-chart'])
def test_invalid_build_does_not_change_any_render_input(tmp_path, invalid):
    bundle(tmp_path)
    if invalid in ('missing', 'duplicate', 'nested'):
        text = {'missing': '<div></div>', 'duplicate': '<b id="count"></b><i id="count"></i>',
                'nested': '<b id="count"><i>12</i></b>'}[invalid]
        (tmp_path / 'index.html').write_text(text)
    else:
        mapping = json.loads((tmp_path / 'display-map.json').read_text())
        if invalid == 'label':
            mapping['dom'] = [{'id': 'count', 'kind': 'label', 'text': '12'}]
        else:
            mapping['charts'] = []
        (tmp_path / 'display-map.json').write_text(json.dumps(mapping))
    before = {p.name: p.read_bytes() for p in tmp_path.iterdir()}
    with pytest.raises(ValueError):
        build_display(tmp_path)
    assert {p.name: p.read_bytes() for p in tmp_path.iterdir()} == before


@pytest.mark.poster_browser
def test_generated_payload_runs_in_browser_and_escapes_script_text(tmp_path):
    from browser_runtime import browser_launch_options
    from playwright.sync_api import sync_playwright
    bundle(tmp_path)
    data = json.loads((tmp_path / 'data.json').read_text())
    data['series'][0]['year'] = '</script><img src=x>'
    (tmp_path / 'data.json').write_text(json.dumps(data))
    build_display(tmp_path)
    payload = (tmp_path / 'charts.generated.js').read_text()
    assert '</script>' not in payload
    with sync_playwright() as p:
        browser = p.chromium.launch(**browser_launch_options())
        page = browser.new_page()
        page.goto((tmp_path / 'index.html').as_uri())
        assert page.locator('[data-display-id=count]').inner_text() == '12'
        assert page.evaluate('window.__INFOGRAPHIC_CHARTS__.trend.data[0].values') == data['series']
        browser.close()


def test_build_cannot_overwrite_numeric_source_used_as_spec(tmp_path):
    bundle(tmp_path)
    (tmp_path/'fact-review.json').write_text(json.dumps({'checks':[],'comparisons':[
        {'dataPointer':'/series','evidence':{'file':'trend.spec.json','pointer':'/data/0/values','source':'original user input'}}]}))
    before={p.name:p.read_bytes() for p in tmp_path.iterdir()}
    with pytest.raises(ValueError,match='overwrite'):
        build_display(tmp_path)
    assert before=={p.name:p.read_bytes() for p in tmp_path.iterdir()}
