import sys
from pathlib import Path

import pytest

SCRIPTS = Path(__file__).resolve().parents[2] / 'skills/person-poster/scripts'
sys.path.insert(0, str(SCRIPTS))
from inspect_contrast import analyze, contrast_ratio, inspect_contrast  # noqa: E402


def test_relative_luminance():
    assert contrast_ratio((0, 0, 0), (255, 255, 255)) == 21
    assert 1.64 < contrast_ratio((240, 234, 217), (216, 180, 90)) < 1.66


def pixel_snapshot(width=8, height=8):
    return {'rootWidth': width, 'rootHeight': height, 'unmeasured': [], 'texts': [
        {'source': 'dom', 'text': 'sample', 'color': [0, 0, 0], 'fontSizePx': 24,
         'bold': False, 'rects': [{'x': 0, 'y': 0, 'width': width, 'height': height}]}]}


@pytest.mark.parametrize('scale,count,passed', [
    (.5, 2, False), (.5, 3, True), (1, 2, False), (1, 3, True),
    (2, 11, False), (2, 12, True),
])
def test_solid_area_is_normalized_in_css_pixels(scale, count, passed):
    from PIL import Image
    side = int(8 * scale)
    black = Image.new('RGB', (side, side), 'black')
    white = black.copy()
    for i in range(count):
        white.putpixel((i % side, i // side), (255, 255, 255))
    report = analyze(pixel_snapshot(), black, white, Image.new('RGB', black.size, 'white'))
    assert report['passed'] is passed
    assert bool(report['unmeasured']) is not passed
    entry = report['texts'][0] if passed else report['sampleFailures'][0]
    assert entry['samples'] == count
    assert entry['solidAreaCssPx2'] == count / (scale * scale)


def test_no_samples_keeps_failure_with_observed_diagnostics():
    from PIL import Image
    frame = Image.new('RGB', (8, 8), 'white')
    report = analyze(pixel_snapshot(), frame, frame, frame)
    assert not report['passed']
    assert report['unmeasured'] == ['No solid glyph samples: sample']
    assert report['sampleFailures'][0]['samples'] == 0
    assert report['sampleFailures'][0]['maximumDelta'] == 0


def test_separate_vertical_scale_and_fractional_rectangles():
    from PIL import Image
    black = Image.new('RGB', (16, 24), 'black')
    white = black.copy()
    snapshot = pixel_snapshot()
    snapshot['texts'][0]['rects'] = [{'x': 1.25, 'y': 3.25, 'width': 2.5, 'height': 2.5}]
    for y in range(10, 15):
        for x in range(3, 7):
            white.putpixel((x, y), (255, 255, 255))
    report = analyze(snapshot, black, white, Image.new('RGB', black.size, 'white'))
    assert report['passed'], report
    assert report['sampling']['scaleX'] == 2
    assert report['sampling']['scaleY'] == 3
    assert report['texts'][0]['solidAreaCssPx2'] == pytest.approx(20 / 6)


@pytest.mark.parametrize('field,value', [('rootWidth', 0), ('rootHeight', float('nan'))])
def test_invalid_capture_geometry_rejects(field, value):
    from PIL import Image
    snapshot = pixel_snapshot()
    snapshot[field] = value
    frame = Image.new('RGB', (8, 8), 'white')
    with pytest.raises(ValueError, match='dimensions'):
        analyze(snapshot, frame, frame, frame)


def test_mismatched_capture_sizes_reject():
    from PIL import Image
    frame = Image.new('RGB', (8, 8), 'white')
    with pytest.raises(ValueError, match='sizes differ'):
        analyze(pixel_snapshot(), frame, frame.resize((16, 16)), frame)


def test_capture_padding_is_not_counted_as_text():
    from PIL import Image
    snapshot = pixel_snapshot()
    snapshot['capture'] = {'width': 10, 'height': 10, 'offsetX': 1, 'offsetY': 1}
    black = Image.new('RGB', (20, 20), 'black')
    white = black.copy()
    for x in range(20):
        white.putpixel((x, 0), (255, 255, 255))
    report = analyze(snapshot, black, white, Image.new('RGB', black.size, 'white'))
    assert not report['passed']
    assert report['sampleFailures'][0]['samples'] == 0
    assert report['sampling']['scaleX'] == 2


@pytest.mark.poster_browser
@pytest.mark.parametrize('dpr', [1, 2])
def test_actual_image_background_and_restore(dpr):
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(device_scale_factor=dpr)
        page.set_content('''<style>body{margin:0}main{width:600px;height:300px;background:#111}
          p{margin:0;font:700 36px sans-serif;position:absolute;top:30px;left:30px;color:white}
          </style><main id="infographic"><img style="width:300px;height:150px"
          src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='150'><rect width='300' height='150' fill='white'/></svg>">
          <p>Title on photograph</p><p style="top:200px;font-size:24px">Readable footer</p></main>''')
        before = page.locator('main').screenshot(scale='css')
        report = inspect_contrast(page, '#infographic')
        after = page.locator('main').screenshot(scale='css')
        assert before == after
        assert not report['unmeasured']
        assert [x['text'] for x in report['lowContrast']] == ['Title on photograph']
        assert report['lowContrast'][0]['minimumObserved'] == 1
        browser.close()


@pytest.mark.poster_browser
@pytest.mark.parametrize('smart_invert', [False, True])
def test_native_chart_label_actual_inside_background(smart_invert):
    from playwright.sync_api import sync_playwright
    runtime = SCRIPTS.parents[2] / 'tests/browser/node_modules/@visactor/vchart/build/index.min.js'
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.set_content('<main id="infographic" style="width:600px;height:300px;background:#111"><div id="c" data-chart-id="c" style="width:600px;height:300px"></div></main>')
        page.add_script_tag(path=str(runtime))
        page.evaluate('''async (smartInvert) => {
          const chart = new VChart.default({type:'bar',direction:'horizontal',animation:false,
            background:'transparent',data:{values:[{category:'Alpha',value:100}]},
            xField:'value',yField:'category',color:['#D8B45A'],
            label:{visible:true,position:'inside',smartInvert,style:{fontSize:30,fill:'#F0EAD9',stroke:false}},
            axes:[{orient:'bottom',visible:false},{orient:'left',visible:false}]}, {dom:'c'});
          await chart.renderAsync();window.__POSTER_INSTANCES__=[chart];
        }''', smart_invert)
        before = page.locator('main').screenshot(scale='css')
        report = inspect_contrast(page, '#infographic')
        assert not report['unmeasured'], report
        assert report['passed'] is smart_invert, report
        if not smart_invert:
            assert any(x['text'] == '100' and x['minimumObserved'] < 1.66 for x in report['lowContrast']), report
        assert page.locator('main').screenshot(scale='css') == before
        browser.close()


def render_small_legend(page, offset=0):
    runtime = SCRIPTS.parents[2] / 'tests/browser/node_modules/@visactor/vchart/build/index.min.js'
    page.set_content(f'''<style>body{{margin:0}}main{{position:relative;left:{offset}px;
      top:{offset}px;width:1200px;height:420px;background:#f6f3eb}}</style>
      <main id="infographic"><div id="c" data-chart-id="c" style="width:548px;height:380px"></div></main>''')
    page.add_script_tag(path=str(runtime))
    page.evaluate('''async () => {
      const chart = new VChart.default({type:'scatter',animation:false,background:'transparent',
        data:{values:[{x:0,y:0,category:'已完成'},{x:1,y:0,category:'其余'},
                     {x:2,y:0,category:'中文Text'}]},xField:'x',yField:'y',seriesField:'category',
        size:28,shape:'square',axes:[{orient:'bottom',visible:false},{orient:'left',visible:false}],
        legends:{visible:true,orient:'bottom',item:{label:{style:{fontSize:12,fill:'#606773'}}}}},
        {dom:'c'});
      await chart.renderAsync();window.__POSTER_INSTANCES__=[chart];
    }''')


@pytest.mark.poster_browser
@pytest.mark.parametrize('offset', [0, .25, .75])
def test_small_native_chinese_legend_uses_native_pixels(offset):
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(device_scale_factor=2)
        render_small_legend(page, offset)
        before = page.locator('main').screenshot(scale='css')
        report = inspect_contrast(page, '#infographic')
        assert report['passed'], report
        assert {x['text'] for x in report['texts']} == {'已完成', '其余', '中文Text'}
        assert report['sampling']['scaleX'] == 2
        assert report['sampling']['scaleY'] == 2
        assert all(x['solidAreaCssPx2'] >= 3 for x in report['texts'])
        assert page.locator('main').screenshot(scale='css') == before
        browser.close()


@pytest.mark.poster_browser
def test_capture_exception_restores_dom_and_chart_paint(monkeypatch):
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(device_scale_factor=2)
        render_small_legend(page)
        page.locator('main').evaluate('e=>e.insertAdjacentHTML("afterbegin", \'<p style="color:#123456">Scope</p>\')')
        root = page.locator('main')
        before = root.screenshot(scale='css')
        original = type(page).screenshot
        calls = 0

        def broken(target, *args, **kwargs):
            nonlocal calls
            calls += 1
            if calls == 3:
                raise RuntimeError('capture failed')
            return original(target, *args, **kwargs)

        with monkeypatch.context() as patch:
            patch.setattr(type(page), 'screenshot', broken)
            with pytest.raises(RuntimeError, match='capture failed'):
                inspect_contrast(page, '#infographic')
        assert root.screenshot(scale='css') == before
        assert page.evaluate('typeof window.__POSTER_CONTRAST_PROBE__') == 'undefined'
        browser.close()


@pytest.mark.poster_browser
def test_upsampled_canvas_cannot_claim_native_capture():
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(device_scale_factor=2)
        render_small_legend(page)
        page.evaluate('()=>{const s=window.__POSTER_INSTANCES__[0].getStage();s.setDpr(1);s.render()}')
        report = inspect_contrast(page, '#infographic')
        assert not report['passed']
        assert 'Chart canvas below native capture resolution: c' in report['unmeasured']
        browser.close()


@pytest.mark.poster_browser
def test_missing_glyph_samples_write_only_local_diagnostic_crops(tmp_path):
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.set_content('''<main id="infographic" style="position:relative;width:600px;height:200px;background:white">
          <p style="margin:0;font-size:24px">../outside</p>
          <div style="position:absolute;inset:0;background:white"></div></main>''')
        debug = tmp_path / 'contrast-debug'
        report = inspect_contrast(page, '#infographic', debug_dir=debug)
        assert not report['passed'] and report['unmeasured']
        assert report['sampleFailures'][0]['samples'] == 0
        assert {f.name for f in debug.iterdir()} == {
            'sample-0001-black.png', 'sample-0001-white.png', 'sample-0001-clear.png'}
        assert {f.parent for f in tmp_path.rglob('*.png')} == {debug}
        assert page.evaluate('typeof window.__POSTER_CONTRAST_PROBE__') == 'undefined'
        debug.rename(tmp_path / 'old-debug')
        debug.symlink_to(tmp_path / 'old-debug', target_is_directory=True)
        with pytest.raises(ValueError, match='symlink'):
            inspect_contrast(page, '#infographic', debug_dir=debug)
        browser.close()
