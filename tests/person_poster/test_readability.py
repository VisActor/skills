import importlib.util
from pathlib import Path

import pytest

SCRIPTS = Path(__file__).resolve().parents[2] / 'skills/person-poster/scripts'


@pytest.fixture
def reading():
    spec = importlib.util.spec_from_file_location('reading', SCRIPTS / 'inspect_readability.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_reading_size_uses_delivery_scale_not_export_dpr(reading):
    snapshot = {'rootWidth': 1200, 'texts': [
        {'text': 'small note', 'fontSizePx': 13},
        {'text': 'readable note', 'fontSizePx': 24},
    ], 'unmeasured': []}
    report = reading.reading_report(snapshot, 600, 12)
    assert not report['passed']
    assert [x['readingFontSizePx'] for x in report['texts']] == [6.5, 12]
    assert [x['text'] for x in report['smallText']] == ['small note']
    assert reading.reading_report(snapshot, 1200, 12)['passed']
    assert reading.reading_report(snapshot, 2400, 12)['displayWidthCssPx'] == 1200


def test_unknown_measurement_cannot_claim_success(reading):
    report = reading.reading_report({'rootWidth': 600, 'texts': [], 'unmeasured': ['rotated text']}, 600, 12)
    assert not report['passed']
    assert report['unmeasured'] == ['rotated text']


@pytest.mark.poster_browser
def test_visible_leaf_text_includes_unmarked_notes_and_css_scaling(reading):
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.set_content('''<main id="infographic" style="width:1200px">
          <p style="font-size:24px">Main <span style="font-size:13px">note</span></p>
          <p style="font-size:24px;transform:scale(.5);transform-origin:top left">scaled</p>
          <p style="font-size:6px;display:none">hidden</p>
          <p style="font-size:6px;opacity:0"><span>transparent</span></p>
          <p data-decorative style="font-size:6px">ornament</p>
          <footer data-decorative><span style="font-size:12px">source note</span></footer>
          <script>ignored script</script></main>''')
        result = reading.reading_report(page.evaluate(reading.READING_SCRIPT, '#infographic'), 600, 12)
        assert {x['text']: x['readingFontSizePx'] for x in result['texts']} == {
            'Main': 12, 'note': 6.5, 'scaled': 6, 'ornament': 3, 'source note': 6}
        browser.close()


@pytest.mark.poster_browser
def test_actual_chart_text_includes_axis_and_value_labels(reading):
    from playwright.sync_api import sync_playwright
    runtime = SCRIPTS.parents[2] / 'tests/browser/node_modules/@visactor/vchart/build/index.min.js'
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.set_content('<main id="infographic" style="width:1200px"><div data-decorative id="chart-a" data-chart-id="a" style="width:600px;height:300px"></div></main>')
        page.add_script_tag(path=str(runtime))
        page.evaluate('''async () => {
          const chart = new VChart.default({type:'bar',animation:false,
            data:{values:[{category:'Alpha',value:17}]},xField:'category',yField:'value',
            label:{visible:true,style:{fontSize:24}},
            axes:[{orient:'bottom',label:{style:{fontSize:10}}}]}, {dom:'chart-a'});
          await chart.renderAsync(); window.__POSTER_INSTANCES__=[chart];
        }''')
        result = reading.reading_report(page.evaluate(reading.READING_SCRIPT, '#infographic'), 600, 12)
        assert any(x['text'] == 'Alpha' and x['readingFontSizePx'] == 5 for x in result['smallText'])
        assert any(x['text'] == '17' and x['readingFontSizePx'] == 12 for x in result['texts'])
        browser.close()


@pytest.mark.poster_browser
def test_custom_diagnostic_cannot_replace_baseline(tmp_path):
    import json
    import subprocess
    import sys

    from PIL import Image

    (tmp_path / 'manifest.json').write_text(json.dumps({
        'html': 'index.html', 'delivery': 'html', 'canvas': {'width': 1200, 'height': 500},
        'charts': [], 'assets': []}))
    (tmp_path / 'index.html').write_text('''<style>
      *{box-sizing:border-box} body{margin:0}
      #infographic{width:1200px;height:500px;padding:60px;background:white}
      h1{font-size:40px;line-height:1.5;margin:0}
      p{font-size:20px;line-height:1.5}
      </style><main id="infographic"><h1 data-required>Title</h1>
      <p data-decorative>Necessary scope note</p></main>
      <script>window.__INFOGRAPHIC_READY__=true</script>''')
    result = subprocess.run([sys.executable, str(SCRIPTS / 'review_bundle.py'),
                             '--bundle', str(tmp_path), '--display-width', '1200',
                             '--min-reading-font-size', '10'], capture_output=True, text=True)
    report = json.loads((tmp_path / 'review/review.json').read_text())
    assert result.returncode == 1, result.stdout + result.stderr
    assert not report['technicalPassed']
    assert report['readability']['smallTextCount'] == 1
    assert report['readability']['displayWidthCssPx'] == 600
    assert report['readability']['minFontSizeCssPx'] == 12
    assert report['contrast']['sampling']['scaleX'] == 2
    assert report['contrast']['sampling']['scaleY'] == 2
    extra = json.loads((tmp_path / 'review/supplemental-readability.json').read_text())
    assert extra['passed'] and extra['displayWidthCssPx'] == 1200
    with Image.open(tmp_path / 'review/display.png') as image:
        assert image.width == 600
