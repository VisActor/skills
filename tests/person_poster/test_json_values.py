import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'skills/person-poster/scripts'))
from json_values import json_values_equal  # noqa: E402


@pytest.mark.parametrize('left,right,equal', [
    ({'n': 9.0}, {'n': 9}, True), ([0.0, 1000.0, None], [0, 1000, None], True),
    (True, 1, False), (False, 0, False), ({'n': True}, {'n': 1}, False),
    ('9.0', 9, False), (None, 0, False), ([1, 2], [2, 1], False),
    (9.0000000001, 9, False), (9007199254740993, 9007199254740992, False),
    ({'a': 1, 'b': 2}, {'b': 2.0, 'a': 1.0}, True),
])
def test_json_semantics(left, right, equal):
    assert json_values_equal(left, right) is equal


@pytest.mark.parametrize('value', [float('nan'), float('inf'), (1,), {1: 'non-json-key'}])
def test_non_json_values_are_rejected(value):
    with pytest.raises(ValueError):
        json_values_equal(value, value)


@pytest.mark.poster_browser
def test_actual_browser_numeric_round_trip_keeps_binding_valid(tmp_path):
    import json

    from browser_runtime import browser_launch_options
    from display_contract import check_display
    from playwright.sync_api import sync_playwright
    data = [{'v': 9.0}, {'v': 0.0}, {'v': None}]
    for name, value in {
        'manifest.json': {'displayBindings': 'display-map.json', 'charts': [{'id': 'trend'}]},
        'data.json': {'rows': data},
        'display-map.json': {'version': 1, 'dom': [], 'charts': [{'id': 'trend', 'data': [
            {'specPointer': '/data/values', 'dataPointer': '/rows'}]}]},
    }.items():
        (tmp_path / name).write_text(json.dumps(value))
    before = (tmp_path / 'data.json').read_bytes()
    with sync_playwright() as p:
        browser = p.chromium.launch(**browser_launch_options())
        page = browser.new_page()
        rows = page.evaluate('(text) => JSON.parse(text)', json.dumps(data))
        browser.close()
    snapshot = {'dom': [], 'chartSpecs': {'trend': {'data': {'values': rows}}}}
    assert check_display(tmp_path, snapshot)['passed']
    rows[0]['v'] = True
    assert not check_display(tmp_path, snapshot)['passed']
    rows[0]['v'] = 9
    rows.reverse()
    assert not check_display(tmp_path, snapshot)['passed']
    assert (tmp_path / 'data.json').read_bytes() == before
