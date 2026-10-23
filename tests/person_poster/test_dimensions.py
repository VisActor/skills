import json
from types import SimpleNamespace

import pytest


def layout(height=400, bottom=80, top=0, safe=None):
    item = {'kind': 'required', 'rect': {'bottom': top + bottom}}
    if safe is not None:
        item['bottomSafePx'] = safe
    return {'root': {'top': top, 'height': height, 'scrollHeight': max(height, bottom)},
            'items': [item], 'errors': []}


def target(module, report, **kwargs):
    return module.target_height_from_report(report, bottom_safe_px=0, height_slack_px=16, **kwargs)


@pytest.mark.parametrize('top', [0, 100, -20])
def test_sync_preserves_existing_space(poster_dimensions, top):
    assert target(poster_dimensions, layout(top=top)) == (400, False)


def test_expand_once_and_respect_footer(poster_dimensions):
    assert target(poster_dimensions, layout(bottom=430)) == (446, False)
    assert target(poster_dimensions, layout(height=446, bottom=430)) == (446, False)
    assert target(poster_dimensions, layout(bottom=350, safe=96)) == (446, False)
    assert target(poster_dimensions, layout(bottom=430.2)) == (447, False)


def test_trim_is_explicit_and_stable(poster_dimensions):
    report = layout(height=800, bottom=300, top=100)
    assert target(poster_dimensions, report) == (800, False)
    assert target(poster_dimensions, report, trim_blank_tail=True) == (316, True)
    assert target(poster_dimensions, layout(height=316, bottom=300), trim_blank_tail=True) == (316, False)


def test_empty_measurements_do_not_grow_or_trim(poster_dimensions):
    report = {'root': {'height': 400, 'scrollHeight': 400}, 'items': []}
    assert target(poster_dimensions, report) == (400, False)
    with pytest.raises(ValueError, match='content'):
        target(poster_dimensions, report, trim_blank_tail=True)


@pytest.mark.parametrize('field', ['height', 'scrollHeight', 'top'])
def test_nonfinite_geometry_rejected(poster_dimensions, field):
    report = layout()
    report['root'][field] = float('nan')
    with pytest.raises(ValueError, match='finite'):
        target(poster_dimensions, report)


def sync_args(bundle, **overrides):
    return SimpleNamespace(bundle=str(bundle), layout=str(bundle / 'layout.json'), manifest=None,
                           tolerance=1, bottom_safe_px=0, height_slack_px=16,
                           trim_blank_tail=overrides.get('trim', False), blank_tail_threshold_px=180,
                           update_html_root_height=True, apply=True)


def test_unsupported_css_does_not_write_manifest(poster_dimensions, tmp_path):
    (tmp_path / 'index.html').write_text('<main id="infographic" style="height:400px">A</main>')
    manifest = tmp_path / 'manifest.json'
    manifest.write_text(json.dumps({'html': 'index.html', 'canvas': {'height': 400}}))
    before = manifest.read_bytes()
    (tmp_path / 'layout.json').write_text(json.dumps(layout(bottom=430)))
    with pytest.raises(ValueError, match='Unsupported'):
        poster_dimensions.sync_dimensions(sync_args(tmp_path))
    assert manifest.read_bytes() == before


def test_ancestor_clipping_remains_a_blocker(poster_dimensions):
    report = layout()
    report['errors'] = ['required element clipped by ancestor: value / wrapper (axis y)']
    assert poster_dimensions.blocker_errors(report) == report['errors']


@pytest.mark.parametrize('css', [
    '<style>#infographic {height:400px;}</style><main id="infographic" style="height:300px"></main>',
    '<style>#infographic {height:100vh;}</style>',
    '<style>#infographic {height:400px;max-height:400px;}</style>',
])
def test_unsupported_sizing_is_explicit(poster_dimensions, css):
    with pytest.raises(ValueError, match='Unsupported'):
        poster_dimensions.update_html_root_height(css, 500)


def test_no_content_warning_and_nonfinite_write_protection(poster_dimensions, tmp_path):
    manifest = tmp_path / 'manifest.json'
    manifest.write_text(json.dumps({'html': 'index.html', 'canvas': {'height': 400}}))
    (tmp_path / 'index.html').write_text('<style>#infographic {height:400px;}</style>')
    report = layout()
    report['items'] = []
    (tmp_path / 'layout.json').write_text(json.dumps(report))
    assert poster_dimensions.sync_dimensions(sync_args(tmp_path))['warnings']
    before = manifest.read_bytes()
    report['root']['height'] = float('inf')
    (tmp_path / 'layout.json').write_text(json.dumps(report))
    with pytest.raises(ValueError, match='finite'):
        poster_dimensions.sync_dimensions(sync_args(tmp_path))
    assert manifest.read_bytes() == before
