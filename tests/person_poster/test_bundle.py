import copy
import json

import pytest
from test_chart_specs import native_spec

URL = 'https://unpkg.com/@visactor/vchart@2.1.7/build/index.min.js'


def write_bundle(root, *, charts=True, text='A; "中文" </script> window.__INFOGRAPHIC_CHARTS__ = literal'):
    spec = native_spec()
    spec['data'][0]['values'][0]['label'] = text
    (root / 'chart.spec.json').write_text(json.dumps(spec))
    manifest = {'html': 'index.html', 'png': 'preview.png',
                'canvas': {'width': 800, 'height': 900},
                'charts': [{'id': 'main', 'spec': 'chart.spec.json', 'mount': '#chart-main'}] if charts else []}
    payload = json.dumps({'main': spec} if charts else {}).replace('<', '\\u003c')
    script = f'<script src="{URL}"></script>' if charts else ''
    (root / 'index.html').write_text(
        f'<div id="infographic"><div id="chart-main"></div></div>{script}'
        f'<script>window.__INFOGRAPHIC_CHARTS__ = {payload};</script>')
    (root / 'manifest.json').write_text(json.dumps(manifest))
    return manifest


@pytest.mark.parametrize('charts', [True, False])
def test_native_bundle_and_escaped_payload(poster_validator, tmp_path, charts):
    write_bundle(tmp_path, charts=charts)
    result = poster_validator.validate_bundle(tmp_path, require_png=False)
    assert result.ok, result.errors
    assert not poster_validator.validate_bundle(tmp_path).ok


def test_generated_external_payload_is_checked_like_inline(poster_validator, tmp_path):
    write_bundle(tmp_path)
    html = (tmp_path / 'index.html').read_text()
    start = html.index('<script>window.__INFOGRAPHIC_CHARTS__')
    payload = html[start + len('<script>'):html.index('</script>', start)]
    (tmp_path / 'charts.generated.js').write_text(payload)
    (tmp_path / 'index.html').write_text(html[:start] + '<script src="charts.generated.js"></script>')
    assert poster_validator.validate_bundle(tmp_path, require_png=False).ok
    (tmp_path / 'charts.generated.js').write_text('window.__INFOGRAPHIC_CHARTS__ = {"main":{}};')
    result = poster_validator.validate_bundle(tmp_path, require_png=False)
    assert any('differs from file' in e for e in result.errors)
    (tmp_path / 'index.html').write_text((tmp_path / 'index.html').read_text() + f'<script>{payload}</script>')
    assert any('one direct JSON' in e for e in poster_validator.validate_bundle(tmp_path, require_png=False).errors)


@pytest.mark.parametrize('mutation, message', [
    ('duplicate', 'Duplicate chart id'), ('missing-spec', 'Missing chart spec'),
    ('old', 'require conversion'), ('mismatch', 'differs from file'),
    ('runtime', 'require the pinned'), ('escape', 'relative'),
    ('symlink', 'escapes bundle'), ('nan', 'positive number'),
])
def test_invalid_wiring(poster_validator, tmp_path, mutation, message):
    manifest = write_bundle(tmp_path)
    if mutation == 'duplicate':
        manifest['charts'].append(copy.deepcopy(manifest['charts'][0]))
    elif mutation == 'missing-spec':
        manifest['charts'][0]['spec'] = 'absent.json'
    elif mutation == 'old':
        manifest['charts'][0]['schema'] = manifest['charts'][0].pop('spec')
    elif mutation == 'mismatch':
        (tmp_path / 'chart.spec.json').write_text(json.dumps(native_spec()))
    elif mutation == 'runtime':
        p = tmp_path / 'index.html'
        p.write_text(p.read_text().replace(URL, 'missing.js'))
    elif mutation == 'escape':
        manifest['charts'][0]['spec'] = '../outside.json'
    elif mutation == 'symlink':
        external = tmp_path.parent / f'{tmp_path.name}-outside.json'
        external.write_text('{}')
        (tmp_path / 'link.json').symlink_to(external)
        manifest['charts'][0]['spec'] = 'link.json'
    elif mutation == 'nan':
        manifest['canvas']['width'] = float('nan')
    (tmp_path / 'manifest.json').write_text(json.dumps(manifest))
    result = poster_validator.validate_bundle(tmp_path, require_png=False)
    assert any(message in error for error in result.errors), result.errors


def test_local_runtime_can_have_any_filename(poster_validator, tmp_path):
    manifest = write_bundle(tmp_path)
    manifest['dependencies'] = [{'name': '@visactor/vchart', 'version': '2.1.7',
                                 'file': 'runtime.js', 'source': URL}]
    (tmp_path / 'runtime.js').write_text('// Test asset; rendering tested in browser smoke.')
    p = tmp_path / 'index.html'
    p.write_text(p.read_text().replace(URL, 'runtime.js'))
    (tmp_path / 'manifest.json').write_text(json.dumps(manifest))
    result = poster_validator.validate_bundle(tmp_path, require_png=False)
    assert result.ok, result.errors


def test_html_symlink_outside_is_rejected(poster_validator, tmp_path):
    write_bundle(tmp_path)
    outside = tmp_path.parent / f'{tmp_path.name}-outside.html'
    outside.write_text('not a bundle')
    (tmp_path / 'index.html').unlink()
    (tmp_path / 'index.html').symlink_to(outside)
    assert any('escapes bundle' in e for e in poster_validator.validate_bundle(tmp_path).errors)


@pytest.mark.parametrize('charts', [True, False])
@pytest.mark.parametrize('require_png', [True, False])
def test_html_delivery_without_png(poster_validator, tmp_path, charts, require_png):
    manifest = write_bundle(tmp_path, charts=charts)
    manifest['delivery'] = 'html'
    manifest.pop('png')
    (tmp_path / 'manifest.json').write_text(json.dumps(manifest))
    result = poster_validator.validate_bundle(tmp_path, require_png=require_png)
    assert result.ok, result.errors


@pytest.mark.parametrize('delivery', ['html+png', None])
def test_default_delivery_still_requires_png(poster_validator, tmp_path, delivery):
    manifest = write_bundle(tmp_path)
    if delivery is not None:
        manifest['delivery'] = delivery
    (tmp_path / 'manifest.json').write_text(json.dumps(manifest))
    assert poster_validator.validate_bundle(tmp_path, require_png=False).ok
    assert any('Missing PNG' in e for e in poster_validator.validate_bundle(tmp_path).errors)


@pytest.mark.parametrize('delivery', ['', 'pdf', None, [], {}])
def test_invalid_delivery_rejected(poster_validator, tmp_path, delivery):
    manifest = write_bundle(tmp_path)
    manifest['delivery'] = delivery
    (tmp_path / 'manifest.json').write_text(json.dumps(manifest))
    assert any('delivery' in e for e in poster_validator.validate_bundle(tmp_path, require_png=False).errors)


@pytest.mark.parametrize('png,valid', [('unused.png', True), ('../escape.png', False), (None, False)])
def test_optional_html_png_path_is_validated(poster_validator, tmp_path, png, valid):
    manifest = write_bundle(tmp_path)
    manifest.update(delivery='html', png=png)
    (tmp_path / 'manifest.json').write_text(json.dumps(manifest))
    assert poster_validator.validate_bundle(tmp_path).ok is valid


def test_chart_color_warning_is_identified_and_nonblocking(poster_validator, tmp_path):
    write_bundle(tmp_path)
    path = tmp_path / 'chart.spec.json'
    spec = json.loads(path.read_text())
    spec['colors'] = ['#6b7683', '#d4af6a']
    path.write_text(json.dumps(spec))
    html = tmp_path / 'index.html'
    html.write_text(f'<div id="infographic"><div id="chart-main"></div></div><script src="{URL}"></script>'
                    '<script>window.__INFOGRAPHIC_CHARTS__ = '
                    + json.dumps({'main': spec}).replace('<', '\\u003c') + ';</script>')
    result = poster_validator.validate_bundle(tmp_path, require_png=False)
    assert result.ok, result.errors
    assert any('chart main:' in warning and 'colors' in warning for warning in result.warnings)


RECORDS = ['fact-review.json', 'acceptance.json', 'workflow-timings.json']


def test_missing_records_warn_and_final_delivery_requires_them(poster_validator, tmp_path):
    write_bundle(tmp_path, charts=False)
    result = poster_validator.validate_bundle(tmp_path, require_png=False)
    assert result.ok
    assert all(any(name in warning for warning in result.warnings) for name in RECORDS)
    result = poster_validator.validate_bundle(tmp_path, require_png=False, require_records=True)
    assert all(any(name in error for error in result.errors) for name in RECORDS)


@pytest.mark.parametrize('name', RECORDS)
@pytest.mark.parametrize('content', ['# Reviewed\nAll correct', '[]', '{}', 'null', '{"status": NaN}'])
def test_existing_invalid_record_fails_even_in_preview(poster_validator, tmp_path, name, content):
    write_bundle(tmp_path, charts=False)
    (tmp_path / name).write_text(content)
    result = poster_validator.validate_bundle(tmp_path, require_png=False)
    assert not result.ok
    assert any(name in error for error in result.errors)


@pytest.mark.parametrize('name', RECORDS)
def test_record_symlink_must_stay_in_bundle(poster_validator, tmp_path, name):
    write_bundle(tmp_path, charts=False)
    outside = tmp_path.parent / f'{tmp_path.name}-record.json'
    outside.write_text('{"status":"pending"}')
    (tmp_path / name).symlink_to(outside)
    result = poster_validator.validate_bundle(tmp_path, require_png=False)
    assert any('escapes bundle' in error for error in result.errors)


def test_record_structure_does_not_assert_semantic_success(poster_validator, tmp_path):
    manifest = write_bundle(tmp_path, charts=False)
    manifest['delivery'] = 'html'
    (tmp_path / 'manifest.json').write_text(json.dumps(manifest))
    for name in RECORDS:
        (tmp_path / name).write_text(json.dumps({'status': 'pending', 'limitations': ['No historical timings']}))
    (tmp_path / 'acceptance.json').write_text(json.dumps({'technical': {'status': 'pending'}}))
    result = poster_validator.validate_bundle(tmp_path, require_records=True)
    assert result.ok, result.errors


@pytest.mark.parametrize('asset,fragment', [
    ({'rasterSource': 'web-sourced'}, 'sourcePage'),
    ({'rasterSource': 'web-sourced', 'sourcePage': 'https://example.com/photo'}, 'usageTerms'),
    ({'rasterSource': 'web-sourced', 'sourcePage': 'file:///tmp/photo', 'usageTerms': 'unknown'}, 'sourcePage'),
    ({'rasterSource': 'web-sourced', 'sourcePage': 'https://example.com/photo',
      'usageTerms': 'unknown', 'bitmapStatus': 'generation-unavailable'}, 'generation failure'),
])
def test_asset_provenance_requires_evidence_fields(poster_validator, tmp_path, asset, fragment):
    manifest = write_bundle(tmp_path, charts=False)
    (tmp_path / 'photo.jpg').write_bytes(b'fixture')
    manifest['assets'] = [{'file': 'photo.jpg', **asset}]
    (tmp_path / 'manifest.json').write_text(json.dumps(manifest))
    result = poster_validator.validate_bundle(tmp_path, require_png=False)
    assert any(fragment in e for e in result.errors), result.errors


def test_unknown_photo_usage_is_valid_but_not_authorized(poster_validator, tmp_path):
    manifest = write_bundle(tmp_path, charts=False)
    (tmp_path / 'photo.jpg').write_bytes(b'fixture')
    manifest['assets'] = [{'file': 'photo.jpg', 'rasterSource': 'web-sourced',
                           'sourcePage': 'https://example.com/photo', 'usageTerms': 'unknown'}]
    (tmp_path / 'manifest.json').write_text(json.dumps(manifest))
    assert poster_validator.validate_bundle(tmp_path, require_png=False).ok


def successful_reading_review():
    from inspect_contrast import CONTRAST_POLICY
    return {'technicalPassed': True, 'errors': [],
            'contrastPolicy': dict(CONTRAST_POLICY),
            'contrast': {'passed': True, 'lowContrastCount': 0, 'unmeasured': []},
            'readingPolicy': {'displayWidthCssPx': 600, 'minFontSizeCssPx': 12,
                              'textCoverage': 'all-visible-dom-and-chart-text-v1'},
            'readability': {'passed': True, 'displayWidthCssPx': 600, 'minFontSizeCssPx': 12,
                            'smallTextCount': 0, 'unmeasured': []}}


@pytest.mark.parametrize('acceptance', [
    {'technicalPassed': True}, {'technical': {'status': 'passed'}},
])
def test_final_technical_claim_requires_successful_review(poster_validator, tmp_path, acceptance):
    write_bundle(tmp_path, charts=False)
    for name in RECORDS:
        (tmp_path / name).write_text(json.dumps(acceptance if name == 'acceptance.json' else {'status': 'partial'}))
    # Preview must permit a fresh review to replace a failed or missing old report.
    assert poster_validator.validate_bundle(tmp_path, require_png=False).ok
    result = poster_validator.validate_bundle(tmp_path, require_png=False, require_records=True)
    assert any('technical claim' in e for e in result.errors)
    (tmp_path / 'review').mkdir()
    report = tmp_path / 'review/review.json'
    report.write_text(json.dumps({'technicalPassed': False, 'errors': ['clipped']}))
    result = poster_validator.validate_bundle(tmp_path, require_png=False, require_records=True)
    assert any('technical claim' in e for e in result.errors)
    report.write_text(json.dumps(successful_reading_review()))
    assert poster_validator.validate_bundle(tmp_path, require_png=False, require_records=True).ok


def test_pending_technical_claim_does_not_require_review(poster_validator, tmp_path):
    write_bundle(tmp_path, charts=False)
    for name in RECORDS:
        (tmp_path / name).write_text(json.dumps({'status': 'partial'}))
    (tmp_path / 'acceptance.json').write_text(json.dumps({'technical': {'status': 'pending'}}))
    assert poster_validator.validate_bundle(tmp_path, require_png=False, require_records=True).ok


def test_final_acceptance_cannot_omit_technical_failure(poster_validator, tmp_path):
    write_bundle(tmp_path, charts=False)
    for name in RECORDS:
        (tmp_path / name).write_text(json.dumps({'status': 'partial'}))
    (tmp_path / 'acceptance.json').write_text(json.dumps({'visualAcceptance': 'passed'}))
    (tmp_path / 'review').mkdir()
    (tmp_path / 'review/review.json').write_text(json.dumps({'technicalPassed': False, 'errors': ['small text']}))
    assert poster_validator.validate_bundle(tmp_path, require_png=False).ok
    result = poster_validator.validate_bundle(tmp_path, require_png=False, require_records=True)
    assert any('explicit technical status' in error for error in result.errors)


@pytest.mark.parametrize('acceptance', [
    {'technical': {'status': 'passed-with-documented-warnings'}},
    {'technical': {'status': 'verified'}},
    {'technicalPassed': 'true'},
    {'technicalPassed': True, 'technical': {'status': 'failed'}},
    {'technicalPassed': False, 'technical': {'status': 'passed'}},
])
def test_final_technical_status_cannot_bypass_raw_failure(poster_validator, tmp_path, acceptance):
    write_bundle(tmp_path, charts=False)
    for name in RECORDS:
        (tmp_path / name).write_text(json.dumps(acceptance if name == 'acceptance.json' else {'status': 'partial'}))
    (tmp_path / 'review').mkdir()
    (tmp_path / 'review/review.json').write_text(json.dumps({'technicalPassed': True, 'errors': []}))
    assert poster_validator.validate_bundle(tmp_path, require_png=False).ok
    assert not poster_validator.validate_bundle(tmp_path, require_png=False, require_records=True).ok


def test_recorded_generation_failure_remains_supported(poster_validator, tmp_path):
    manifest = write_bundle(tmp_path, charts=False)
    (tmp_path / 'fallback.svg').write_text('<svg/>')
    (tmp_path / 'prompt.txt').write_text('Requested illustration')
    manifest['assets'] = [{'file': 'fallback.svg', 'rasterSource': 'fallback-svg',
                           'bitmapStatus': 'generation-unavailable', 'prompt': 'prompt.txt',
                           'imageGenerationFailure': 'Attempted tool returned unavailable; see session log.'}]
    (tmp_path / 'manifest.json').write_text(json.dumps(manifest))
    assert poster_validator.validate_bundle(tmp_path, require_png=False).ok


@pytest.mark.parametrize('report_path,content,valid', [
    ('custom/review.json', json.dumps(successful_reading_review()), True),
    ('custom/review.json', '{"technicalPassed":true,"errors":["overflow"]}', False),
    ('custom/review.json', 'not json', False),
    ('../review.json', '{"technicalPassed":true,"errors":[]}', False),
])
def test_explicit_review_report_is_checked(poster_validator, tmp_path, report_path, content, valid):
    write_bundle(tmp_path, charts=False)
    for name in RECORDS:
        record = {'technicalPassed': True, 'reviewReport': report_path} if name == 'acceptance.json' else {'status': 'partial'}
        (tmp_path / name).write_text(json.dumps(record))
    if not report_path.startswith('..'):
        path = tmp_path / report_path
        path.parent.mkdir(parents=True)
        path.write_text(content)
    result = poster_validator.validate_bundle(tmp_path, require_png=False, require_records=True)
    assert result.ok is valid


@pytest.mark.parametrize('change', [
    {'displayWidthCssPx': 1200}, {'minFontSizeCssPx': 10}, {'passed': False},
    {'smallTextCount': 3}, {'smallTextCount': False}, {'unmeasured': ['SVG note']},
    {'minFontSizeCssPx': True}, {'displayWidthCssPx': 0},
])
def test_final_reading_baseline_cannot_be_relaxed(poster_validator, tmp_path, change):
    write_bundle(tmp_path, charts=False)
    for name in RECORDS:
        (tmp_path / name).write_text(json.dumps({'technicalPassed': True} if name == 'acceptance.json' else {'status': 'partial'}))
    (tmp_path / 'review').mkdir()
    report = successful_reading_review()
    report['readability'].update(change)
    (tmp_path / 'review/review.json').write_text(json.dumps(report))
    result = poster_validator.validate_bundle(tmp_path, require_png=False, require_records=True)
    assert any('reading baseline' in e for e in result.errors)


@pytest.mark.parametrize('missing', ['readingPolicy', 'readability'])
def test_final_reading_coverage_required(poster_validator, tmp_path, missing):
    write_bundle(tmp_path, charts=False)
    for name in RECORDS:
        (tmp_path / name).write_text(json.dumps({'technicalPassed': True} if name == 'acceptance.json' else {'status': 'partial'}))
    (tmp_path / 'review').mkdir()
    report = successful_reading_review()
    del report[missing]
    (tmp_path / 'review/review.json').write_text(json.dumps(report))
    result = poster_validator.validate_bundle(tmp_path, require_png=False, require_records=True)
    assert any('all-visible text coverage' in e for e in result.errors)


@pytest.mark.parametrize('change', [{'passed': False}, {'lowContrastCount': 1},
                                  {'unmeasured': ['unsupported paint']}, {'lowContrastCount': False}])
def test_final_contrast_cannot_be_overruled(poster_validator, tmp_path, change):
    write_bundle(tmp_path, charts=False)
    for name in RECORDS:
        (tmp_path / name).write_text(json.dumps({'technicalPassed': True} if name == 'acceptance.json' else {'status': 'partial'}))
    (tmp_path / 'review').mkdir()
    report = successful_reading_review()
    report['contrast'].update(change)
    (tmp_path / 'review/review.json').write_text(json.dumps(report))
    result = poster_validator.validate_bundle(tmp_path, require_png=False, require_records=True)
    assert any('actual-background' in e for e in result.errors)


def test_old_sampling_policy_cannot_authorize_technical_success(poster_validator, tmp_path):
    write_bundle(tmp_path, charts=False)
    for name in RECORDS:
        (tmp_path / name).write_text(json.dumps({'technicalPassed': True} if name == 'acceptance.json' else {'status': 'partial'}))
    (tmp_path / 'review').mkdir()
    report = successful_reading_review()
    report['contrastPolicy'] = {'version': 'rendered-glyph-background-v1', 'displayWidthCssPx': 600,
                                'normalMinimum': 4.5, 'largeMinimum': 3.0}
    (tmp_path / 'review/review.json').write_text(json.dumps(report))
    result = poster_validator.validate_bundle(tmp_path, require_png=False, require_records=True)
    assert any('actual-background' in e for e in result.errors)
