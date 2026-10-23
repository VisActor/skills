import json

import pytest
from test_dimensions import sync_args

pytestmark = pytest.mark.poster_browser


@pytest.mark.parametrize('sizing', ['height:SIZEpx', 'min-height:SIZEpx',
                                  '--canvas-height:SIZEpx;height:var(--canvas-height)',
                                  'min-height:SIZEpx;height:SIZEpx'])
@pytest.mark.parametrize('trim', [False, True])
def test_measure_apply_reload_is_stable(tmp_path, poster_dimensions, inspect_page, sizing, trim):
    initial, bottom = (800, 300) if trim else (400, 430)
    css = sizing.replace('SIZE', str(initial))
    html = f'''<!doctype html><style>
      body{{margin:0}} #infographic{{position:relative;margin-top:100px;width:600px;{css};}}
      #value{{position:absolute;left:40px;top:{bottom - 40}px;width:300px;height:40px}}
    </style><main id="infographic"><div id="value" data-required="award">Award 123</div></main>'''
    manifest_path = tmp_path / 'manifest.json'
    manifest_path.write_text(json.dumps({'html': 'index.html', 'canvas': {'width': 600, 'height': initial},
                                        'export': {'width': 600, 'height': initial,
                                                   'viewport': {'width': 600, 'height': initial}}}))
    report = inspect_page(html)
    (tmp_path / 'layout.json').write_text(json.dumps(report))
    first = poster_dimensions.sync_dimensions(sync_args(tmp_path, trim=trim))
    assert first['ok'] and first['changed'], first
    html_after = (tmp_path / 'index.html').read_bytes()
    manifest_after = manifest_path.read_bytes()
    measured = inspect_page(html_after.decode())
    assert measured['passed'], measured['errors']
    assert measured['root']['height'] == bottom + 64
    manifest = json.loads(manifest_after)
    assert manifest['canvas']['height'] == manifest['export']['height'] == manifest['export']['viewport']['height'] == bottom + 64
    (tmp_path / 'layout.json').write_text(json.dumps(measured))
    second = poster_dimensions.sync_dimensions(sync_args(tmp_path, trim=trim))
    assert second['ok'] and not second['changed'], second
    assert (tmp_path / 'index.html').read_bytes() == html_after
    assert manifest_path.read_bytes() == manifest_after


def test_sync_preserves_clipping_styles(tmp_path, poster_dimensions, inspect_page):
    html = '''<style>#infographic {position:relative;width:600px;height:400px;overflow:hidden;}
      #value{position:absolute;top:340px;height:40px;width:200px}</style>
      <main id="infographic"><div id="value" data-required="value">Award 123</div></main>'''
    (tmp_path / 'manifest.json').write_text(json.dumps({'html': 'index.html', 'canvas': {'height': 400}}))
    report = inspect_page(html)
    (tmp_path / 'layout.json').write_text(json.dumps(report))
    assert poster_dimensions.sync_dimensions(sync_args(tmp_path))['ok']
    updated = (tmp_path / 'index.html').read_text()
    assert 'overflow:hidden' in updated
    assert inspect_page(updated)['passed']


def test_content_box_padding_is_not_silently_resized(tmp_path, poster_dimensions, inspect_page):
    html = '''<style>#infographic {width:600px;height:400px;padding:20px;}</style>
      <main id="infographic"><div data-required="award">Award 123</div></main>'''
    manifest = tmp_path / 'manifest.json'
    manifest.write_text(json.dumps({'html': 'index.html', 'canvas': {'height': 440}}))
    before = manifest.read_bytes()
    report = inspect_page(html)
    (tmp_path / 'layout.json').write_text(json.dumps(report))
    with pytest.raises(ValueError, match='content-box'):
        poster_dimensions.sync_dimensions(sync_args(tmp_path))
    assert manifest.read_bytes() == before
