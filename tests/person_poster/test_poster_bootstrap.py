import json
import sys
from pathlib import Path

import pytest

SCRIPTS = Path(__file__).resolve().parents[2] / 'skills/person-poster/scripts'
sys.path.insert(0, str(SCRIPTS))
from browser_runtime import browser_launch_options  # noqa: E402
from init_bundle import initialize_bundle  # noqa: E402


@pytest.mark.poster_browser
@pytest.mark.parametrize('mode', ['empty','two','two-real','second-fails','empty-mount','broken-image'])
def test_bootstrap_observable_readiness_instances_and_failure(tmp_path, mode):
    from playwright.sync_api import sync_playwright
    initialize_bundle(tmp_path, width=600, height=400)
    specs = {} if mode in ('empty','broken-image') else {'a':{'animation':False},'b':{'animation':False}}
    (tmp_path/'charts.generated.js').write_text('window.__INFOGRAPHIC_CHARTS__='+json.dumps(specs)+';')
    html = (tmp_path/'index.html').read_text()
    mounts = ''.join(f'<div id="chart-{key}" data-chart-id="{key}" style="width:100px;height:100px"></div>' for key in specs)
    if mode == 'empty-mount':
        mounts = mounts.replace('width:100px','width:0px',1)
    if mode == 'broken-image':
        mounts += '<img src="missing.png">'
    mock = '''<script>window.released=0;window.VChart={default:class{
      constructor(spec,{dom}){this.dom=dom;this.canvas=document.createElement('canvas');dom.append(this.canvas)}
      async renderAsync(){if(window.failSecond && this.dom.id==='chart-b')throw Error('synthetic second failure')}
      release(){window.released++;this.canvas.remove()}
    }};</script>'''
    if mode == 'two-real':
        import shutil
        runtime = SCRIPTS.parents[2] / 'tests/browser/node_modules/@visactor/vchart/build/index.min.js'
        shutil.copy2(runtime,tmp_path/'runtime.js')
        mock = '<script src="runtime.js"></script>'
        specs = {key:{'type':'bar','animation':False,'data':{'values':[{'x':'A','y':9}]},'xField':'x','yField':'y'} for key in specs}
        (tmp_path/'charts.generated.js').write_text('window.__INFOGRAPHIC_CHARTS__='+json.dumps(specs)+';')
    if mode == 'second-fails':
        mock = '<script>window.failSecond=true</script>'+mock
    html = html.replace('</main>',mounts+'</main>').replace('<script src="charts.generated.js">',mock+'<script src="charts.generated.js">')
    (tmp_path/'index.html').write_text(html)
    with sync_playwright() as p:
        browser = p.chromium.launch(**browser_launch_options())
        page = browser.new_page()
        page.goto((tmp_path/'index.html').as_uri())
        if mode in ('empty','two','two-real'):
            page.wait_for_function('window.__INFOGRAPHIC_READY__ === true')
            assert page.evaluate('window.__POSTER_INSTANCES__.length') == len(specs)
            page.evaluate('window.bootstrapPoster()')
            assert page.locator('canvas').count() == len(specs)
        else:
            page.wait_for_function('!!window.__INFOGRAPHIC_ERROR__')
            assert page.evaluate('window.__INFOGRAPHIC_READY__') is False
            assert page.evaluate('(window.__POSTER_INSTANCES__||[]).length') == 0
            assert page.locator('canvas').count() == 0
        browser.close()
