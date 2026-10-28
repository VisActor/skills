import sys
from pathlib import Path
from types import SimpleNamespace

import pytest

SCRIPTS = Path(__file__).resolve().parents[2] / 'skills/person-poster/scripts'
sys.path.insert(0, str(SCRIPTS))
from inspect_html_layout import inspect_layout  # noqa: E402


def layout(root, body):
    path = root / 'index.html'
    path.write_text('<style>body{margin:0}#infographic{position:relative;width:600px;height:400px;'
                    'background:white}span{font:32px/1.4 Arial}</style><main id="infographic">'
                    + body + '</main>')
    return inspect_layout(SimpleNamespace(html=str(path), manifest=None, selector='#infographic',
        serve=False, screenshot_mode=False, install_playwright=False, install_browser=False,
        viewport_width=600, viewport_height=400, device_scale_factor=1, wait_until='load',
        timeout=5000, settle_ms=0, ready_expression='', required_selector='[data-required]',
        decorative_selector='[data-decorative]', bottom_safe_px=64, footer_safe_px=96,
        min_overlap_area=24, overflow_tolerance=3))


@pytest.mark.poster_browser
@pytest.mark.parametrize('pointer', ['auto', 'none'])
def test_unmarked_unit_is_occluded(tmp_path, pointer):
    result = layout(tmp_path, '<span data-display-id="unit" style="position:absolute;left:40px;top:80px">kg</span>'
        f'<section id="cover" style="position:absolute;left:30px;top:100px;width:180px;height:80px;'
        f'background:white;pointer-events:{pointer}"></section>')
    assert result['passed'] is False, result
    assert any('occluded' in error and 'unit' in error and 'cover' in error for error in result['errors'])


@pytest.mark.poster_browser
@pytest.mark.parametrize('body', [
    '<section style="position:absolute;left:30px;top:60px;background:#eee;width:250px;height:120px"></section>'
    '<span style="position:absolute;left:40px;top:80px">Foreground text</span>',
    '<section style="background:#eee;padding:40px"><span>Hello <b>world</b></span></section>',
    '<span style="position:absolute;left:40px;top:80px">kg</span>'
    '<section style="position:absolute;left:30px;top:100px;width:180px;height:80px;background:transparent"></section>',
    '<span style="position:absolute;left:40px;top:80px;z-index:2">kg</span>'
    '<section style="position:absolute;left:30px;top:100px;width:180px;height:80px;background:white;z-index:1"></section>',
    '<span style="display:block;width:180px;margin:40px">A normal wrapped line of text</span>',
    '<section style="padding:40px"><span style="display:block;font:48px/1 Arial">12</span>'
    '<span style="display:block;font:48px/1 Arial">34</span></section>',
])
def test_backgrounds_transparency_nesting_and_lines_are_not_occlusion(tmp_path, body):
    result = layout(tmp_path, body)
    assert result['passed'], result
    assert result['visibility']['texts']


@pytest.mark.poster_browser
def test_unbound_text_overlap_and_ancestor_clip(tmp_path):
    result = layout(tmp_path, '<section style="position:absolute;left:20px;top:20px;width:80px;height:25px;overflow:hidden">'
        '<span>Long clipping text</span></section>'
        '<span style="position:absolute;left:100px;top:100px">Alpha</span>'
        '<span style="position:absolute;left:100px;top:105px">Beta</span>')
    assert not result['passed']
    assert any('clipped by ancestor' in error for error in result['errors'])
    assert any('text overlap' in error for error in result['errors'])


@pytest.mark.poster_browser
@pytest.mark.parametrize('effect', ['opacity:.5', 'transform:rotate(10deg)', 'clip-path:inset(2px)'])
def test_complex_text_is_unmeasured(tmp_path, effect):
    result = layout(tmp_path, f'<span style="position:absolute;left:50px;top:60px;{effect}">Complex</span>')
    assert not result['passed']
    assert result['visibility']['unmeasured']


@pytest.mark.poster_browser
def test_hit_testing_does_not_change_pixels_or_inline_styles():
    from browser_runtime import browser_launch_options
    from inspect_html_layout import VISIBILITY_SCRIPT
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser = p.chromium.launch(**browser_launch_options())
        try:
            page = browser.new_page()
            page.set_content('<main id="infographic" style="width:600px;height:300px;pointer-events:none">'
                             '<span style="font:32px Arial">Visible</span></main>')
            before = page.content(), page.locator('main').screenshot()
            report = page.evaluate(VISIBILITY_SCRIPT, {'selector': '#infographic', 'minOverlapArea': 24, 'overflowTolerance': 3})
            assert report['passed'], report
            assert (page.content(), page.locator('main').screenshot()) == before
        finally:
            browser.close()
