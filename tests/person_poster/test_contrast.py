import sys
from pathlib import Path

import pytest

SCRIPTS = Path(__file__).resolve().parents[2] / 'skills/person-poster/scripts'
sys.path.insert(0, str(SCRIPTS))
from inspect_contrast import contrast_ratio, inspect_contrast  # noqa: E402


def test_relative_luminance():
    assert contrast_ratio((0, 0, 0), (255, 255, 255)) == 21
    assert 1.64 < contrast_ratio((240, 234, 217), (216, 180, 90)) < 1.66


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
