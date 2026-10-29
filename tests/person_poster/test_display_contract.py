import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'skills/person-poster/scripts'))
from display_contract import check_display, format_display_value  # noqa: E402


def bundle(root, bindings=None, data=None):
    for name, value in {'manifest.json': {'displayBindings': 'display-map.json', 'charts': []},
                        'data.json': data or {'count': 12},
                        'display-map.json': {'version': 1, 'dom': bindings or [{
                            'id': 'count', 'kind': 'value', 'dataPointer': '/count',
                            'format': {'style': 'decimal', 'places': 0}}], 'charts': []}}.items():
        (root / name).write_text(json.dumps(value))


def snapshot(text='12', **extra):
    return {'dom': [{'id': 'count', 'text': text, 'visible': True, 'nested': False}],
            'unboundText': [], 'unmeasured': [], 'chartSpecs': {}, **extra}


@pytest.mark.parametrize(('value', 'fmt', 'expected'), [
    (1234, {'style': 'decimal', 'places': 0, 'grouping': True}, '1,234'),
    (.125, {'style': 'percent', 'places': 1}, '12.5%'),
    (-1.25, {'style': 'decimal', 'places': 1}, '-1.3'),
    (None, {'style': 'decimal', 'places': 0}, '—'),
    ('2021–2023', {'style': 'text'}, '2021–2023'),
])
def test_format(value, fmt, expected):
    assert format_display_value(value, fmt) == expected


@pytest.mark.parametrize('value', [True, [], float('inf'), '12'])
def test_decimal_rejects_non_numbers(value):
    with pytest.raises(ValueError):
        format_display_value(value, {'style': 'decimal', 'places': 0})


def test_actual_display_must_match_data(tmp_path):
    bundle(tmp_path)
    assert check_display(tmp_path, snapshot())['passed']
    assert not check_display(tmp_path, snapshot('13'))['passed']
    assert not check_display(tmp_path, snapshot(unboundText=[{'text': '7'}]))['passed']


@pytest.mark.parametrize('change', [
    {'visible': False}, {'nested': True}, {'id': 'other'}, {'text': '0'},
])
def test_binding_cannot_hide_missing_or_wrong_text(tmp_path, change):
    bundle(tmp_path)
    s = snapshot()
    s['dom'][0].update(change)
    assert not check_display(tmp_path, s)['passed']


def test_duplicate_dom_id_and_bad_pointer(tmp_path):
    bundle(tmp_path)
    s = snapshot()
    s['dom'] *= 2
    assert not check_display(tmp_path, s)['passed']
    bundle(tmp_path, [{'id': 'count', 'kind': 'value', 'dataPointer': '/missing', 'format': {'style': 'text'}}])
    assert not check_display(tmp_path, snapshot())['passed']


@pytest.mark.parametrize('text', ['12 次', '１２次'])
def test_digit_label_is_not_an_exemption(tmp_path, text):
    bundle(tmp_path, [{'id': 'count', 'kind': 'label', 'text': text}])
    assert not check_display(tmp_path, snapshot(text))['passed']


def test_claim_needs_exact_text_and_saved_evidence(tmp_path):
    bundle(tmp_path, [{'id': 'count', 'kind': 'claim', 'dataPointer': '/claim', 'factIds': ['scope']}],
           {'claim': '仅联赛常规赛'})
    review = {'checks': [{'id': 'scope', 'claim': '仅联赛常规赛', 'status': 'passed',
                         'source': 'synthetic input', 'observed': '仅联赛常规赛', 'evidence': 'source.txt'}]}
    (tmp_path / 'fact-review.json').write_text(json.dumps(review))
    assert not check_display(tmp_path, snapshot('仅联赛常规赛'))['passed']
    (tmp_path / 'source.txt').write_text('仅联赛常规赛')
    assert check_display(tmp_path, snapshot('仅联赛常规赛'))['passed']
    assert not check_display(tmp_path, snapshot('全部比赛'))['passed']


def test_all_chart_values_mapped_and_order_and_null_preserved(tmp_path):
    data = [{'year': 'A', 'value': None}, {'year': 'B', 'value': 7}]
    bundle(tmp_path, data={'count': 12, 'series': data})
    (tmp_path / 'manifest.json').write_text(json.dumps({'displayBindings': 'display-map.json', 'charts': [{'id': 'trend'}]}))
    mapping = json.loads((tmp_path / 'display-map.json').read_text())
    mapping['charts'] = [{'id': 'trend', 'data': [{'specPointer': '/data/0/values', 'dataPointer': '/series'}]}]
    (tmp_path / 'display-map.json').write_text(json.dumps(mapping))
    spec = {'data': [{'values': data}]}
    s = snapshot(chartSpecs={'trend': spec})
    assert check_display(tmp_path, s)['passed']
    spec['data'][0]['values'] = list(reversed(data))
    assert not check_display(tmp_path, s)['passed']
    spec['data'][0]['values'] = [{'year': 'A', 'value': 0}, data[1]]
    assert not check_display(tmp_path, s)['passed']
    spec['data'][0]['values'] = data
    spec['data'].append({'values': [99]})
    assert any('unmapped' in e for e in check_display(tmp_path, s)['errors'])


@pytest.mark.poster_browser
@pytest.mark.parametrize('dpr', [1, 2])
def test_browser_measures_unbound_nested_pseudo_svg_and_small_text(tmp_path, dpr):
    from display_contract import DISPLAY_SCRIPT
    from inspect_readability import READING_SCRIPT, reading_report
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(device_scale_factor=dpr)
        page.set_content('''<style>#root{width:1200px;font-size:14px}.pseudo::after{content:"99"}</style>
          <main id="root"><span data-display-id="count">12</span><p>7</p>
          <p data-display-id="all">Claim <b>nested</b></p><i class="pseudo"></i>
          <svg width="100" height="40"><text y="20">SVG fact</text></svg>
          <p data-display-id="hidden" style="display:none">Hidden</p></main>''')
        s = page.evaluate(DISPLAY_SCRIPT, '#root')
        assert any(t['text'] == '7' for t in s['unboundText'])
        assert any(t['text'] == 'nested' for t in s['unboundText'])
        assert any('Generated content' in e for e in s['unmeasured'])
        assert any('SVG text' in e for e in s['unmeasured'])
        assert next(t for t in s['dom'] if t['id'] == 'all')['nested']
        assert not next(t for t in s['dom'] if t['id'] == 'hidden')['visible']
        r = reading_report(page.evaluate(READING_SCRIPT, '#root'), 600, 12)
        assert not r['passed']
        assert next(t for t in r['smallText'] if t['text'] == '12')['readingFontSizePx'] == 7
        browser.close()


def test_claim_raw_evidence_change_invalidates_fingerprint(tmp_path):
    from review_fingerprint import fingerprint
    bundle(tmp_path)
    manifest = json.loads((tmp_path / 'manifest.json').read_text())
    manifest['html'] = 'index.html'
    (tmp_path / 'manifest.json').write_text(json.dumps(manifest))
    (tmp_path / 'index.html').write_text('<main>test</main>')
    (tmp_path / 'fact-review.json').write_text('{"checks":[{"evidence":"raw.txt"}]}')
    (tmp_path / 'raw.txt').write_text('original')
    before = fingerprint(tmp_path)
    (tmp_path / 'raw.txt').write_text('changed')
    assert fingerprint(tmp_path) != before
