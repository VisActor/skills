import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'skills/person-poster/scripts'))
from capture_source import capture_source  # noqa: E402
from source_evidence import materialize_data  # noqa: E402
from verify_evidence import resolve_evidence_value, verify_evidence  # noqa: E402


def test_http_capture_preserves_response_redirect_and_timeout(tmp_path, monkeypatch):
    import threading
    from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

    import capture_source as capture_module
    content = b'{"rows":[9.0,null]}'
    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            if self.path == '/redirect':
                self.send_response(302)
                self.send_header('Location', '/raw')
                self.end_headers()
            else:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(content)
        def log_message(self, *args):
            pass
    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    original = capture_module.urlopen
    def checked_open(request, *, timeout):
        assert timeout == 30
        return original(request, timeout=timeout)
    monkeypatch.setattr(capture_module, 'urlopen', checked_open)
    base = f'http://127.0.0.1:{server.server_port}'
    try:
        meta = capture_source(tmp_path, 'redirect', url=base + '/redirect')
    finally:
        server.shutdown()
        server.server_close()
        thread.join()
    assert meta['kind'] == 'web' and meta['requestedUrl'] == base + '/redirect'
    assert meta['finalUrl'] == base + '/raw'
    assert meta['contentType'] == 'application/json'
    assert (tmp_path / meta['raw']).read_bytes() == content


def test_same_scope_relation_rejects_conflicting_published_average(tmp_path):
    setup_table(tmp_path)
    review = json.loads((tmp_path / 'fact-review.json').read_text())
    review['relations'] = [{'dataPointer': '/average', 'numeratorPointer': '/points',
                            'denominatorPointer': '/games', 'decimals': 1}]
    (tmp_path / 'data.json').write_text('{"average":21,"points":210,"games":10}')
    (tmp_path / 'fact-review.json').write_text(json.dumps(review))
    before = (tmp_path / 'data.json').read_bytes()
    with pytest.raises(ValueError, match='Same-scope arithmetic mismatch'):
        materialize_data(tmp_path)
    assert (tmp_path / 'data.json').read_bytes() == before
    assert not (tmp_path / 'evidence-extract.json').exists()


def test_source_bytes_and_locator_invalidate_review_fingerprint(tmp_path):
    from review_fingerprint import fingerprint
    setup_table(tmp_path)
    (tmp_path / 'manifest.json').write_text('{"html":"index.html","displayBindings":"display-map.json"}')
    (tmp_path / 'display-map.json').write_text('{"dom":[],"charts":[]}')
    (tmp_path / 'index.html').write_text('<main>Test</main>')
    before = fingerprint(tmp_path)
    raw = tmp_path / 'evidence/stats/raw.html'
    raw.write_bytes(raw.read_bytes() + b'<!-- source changed -->')
    assert fingerprint(tmp_path) != before


def setup_table(root):
    original = root.parent / (root.name + '-source.html')
    original.write_text('<table><tr><th>scope</th><th>games</th><th>points</th></tr>'
                        '<tr><td>career</td><td>10</td><td>200</td></tr></table>')
    capture_source(root, 'stats', input_file=original)
    def evidence(column, metric):
        return {'capture': 'evidence/stats/capture.json', 'parse': 'number',
                'locator': {'table': 0, 'headerRow': 0, 'headers': ['scope', 'games', 'points'],
                            'rowKey': {'column': 0, 'text': 'career'}, 'column': column},
                'context': {'entity': 'Synthetic athlete', 'metric': metric, 'period': 'career',
                            'scope': 'regular season', 'unit': metric}}
    comparison = {'dataPointer': '/average', 'evidence': evidence(2, 'points'),
                  'denominatorEvidence': evidence(1, 'games'), 'decimals': 1}
    (root / 'data.json').write_text('{"average":21,"label":"unchanged"}')
    (root / 'fact-review.json').write_text(json.dumps({'status': 'passed', 'comparisons': [comparison]}))
    return comparison


def test_data_is_generated_from_actual_table_and_rechecked(tmp_path):
    comparison = setup_table(tmp_path)
    assert resolve_evidence_value(tmp_path, comparison) == 20
    assert not verify_evidence(tmp_path)['passed']
    materialize_data(tmp_path)
    assert json.loads((tmp_path / 'data.json').read_text()) == {'average': 20, 'label': 'unchanged'}
    assert verify_evidence(tmp_path)['passed']
    assert (tmp_path / 'evidence-extract.json').is_file()
    (tmp_path / 'evidence/stats/raw.html').write_text('<table>handwritten replacement</table>')
    assert not verify_evidence(tmp_path)['passed']


@pytest.mark.parametrize('change', ['header', 'row', 'column', 'duplicate', 'raw-hash'])
def test_bad_locator_or_capture_never_partially_writes(tmp_path, change):
    comparison = setup_table(tmp_path)
    review = json.loads((tmp_path / 'fact-review.json').read_text())
    locator = review['comparisons'][0]['evidence']['locator']
    if change == 'header':
        locator['headers'] = ['different']
    elif change == 'row':
        locator['rowKey']['text'] = 'missing'
    elif change == 'column':
        locator['column'] = 10
    elif change == 'duplicate':
        review['comparisons'].append(comparison)
    else:
        (tmp_path / 'evidence/stats/raw.html').write_text('replaced')
    (tmp_path / 'fact-review.json').write_text(json.dumps(review))
    before = (tmp_path / 'data.json').read_bytes()
    with pytest.raises((ValueError, IndexError)):
        materialize_data(tmp_path)
    assert (tmp_path / 'data.json').read_bytes() == before


def test_uncaptured_web_extract_cannot_certify_itself(tmp_path):
    (tmp_path / 'data.json').write_text('{"count":9}')
    (tmp_path / 'summary.json').write_text('{"count":9}')
    (tmp_path / 'fact-review.json').write_text(json.dumps({'comparisons': [{
        'dataPointer': '/count', 'evidence': {'file': 'summary.json', 'pointer': '/count',
        'source': 'https://example.org/official-table'}}]}))
    assert not verify_evidence(tmp_path)['passed']


def test_value_string_still_requires_source(tmp_path):
    (tmp_path / 'data.json').write_text('{"count":"9"}')
    (tmp_path / 'fact-review.json').write_text('{"comparisons":[]}')
    (tmp_path / 'manifest.json').write_text('{"displayBindings":"display-map.json"}')
    (tmp_path / 'display-map.json').write_text(json.dumps({'dom': [
        {'id': 'count', 'kind': 'value', 'dataPointer': '/count', 'format': {'style': 'text'}}]}))
    report = verify_evidence(tmp_path)
    assert not report['passed']
    assert report['uncoveredValuePointers'] == ['/count']


def test_zero_denominator_and_json_group(tmp_path):
    source = tmp_path.parent / (tmp_path.name + '.json')
    source.write_text('{"points":200,"games":0,"rows":[{"n":9.0},{"n":null}]}')
    capture_source(tmp_path, 'stats', input_file=source)
    e = {'capture': 'evidence/stats/capture.json', 'locator': {'pointer': '/points'}}
    checks = [{'dataPointer': '/average', 'evidence': e, 'denominatorPointer': '/games', 'decimals': 1},
              {'dataPointer': '/rows', 'evidence': {**e, 'locator': {'pointer': '/rows'}}}]
    (tmp_path / 'fact-review.json').write_text(json.dumps({'comparisons': checks}))
    (tmp_path / 'data.json').write_text('{"average":0,"rows":[]}')
    materialize_data(tmp_path)
    assert json.loads((tmp_path / 'data.json').read_text()) == {'average': None, 'rows': [{'n': 9.0}, {'n': None}]}
    assert verify_evidence(tmp_path)['passed']


def test_colspan_summary_replays_from_original_html(tmp_path):
    original = tmp_path.parent / (tmp_path.name + '-merged.html')
    original.write_text('<table><tr><th>scope</th><th>season</th><th>games</th><th>rate</th></tr>'
                        '<tr><td colspan="2">career</td><td>10</td><td>.524</td></tr>'
                        '<tr><td colspan="4">An unrelated footer</td></tr></table>')
    capture_source(tmp_path, 'merged', input_file=original)
    evidence = {'capture': 'evidence/merged/capture.json', 'parse': 'number', 'locator': {
        'table': 0, 'headerRow': 0, 'headers': ['scope', 'season', 'games', 'rate'],
        'rowKey': {'column': 0, 'text': 'career'}, 'column': 3}}
    (tmp_path / 'data.json').write_text('{"rate":0}')
    (tmp_path / 'fact-review.json').write_text(json.dumps({'comparisons': [{'dataPointer': '/rate', 'evidence': evidence}]}))
    materialize_data(tmp_path)
    assert json.loads((tmp_path / 'data.json').read_text()) == {'rate': .524}
    assert verify_evidence(tmp_path)['passed']
    evidence['locator']['column'] = 1
    (tmp_path / 'fact-review.json').write_text(json.dumps({'comparisons': [{'dataPointer': '/rate', 'evidence': evidence}]}))
    before = (tmp_path / 'data.json').read_bytes()
    with pytest.raises(ValueError, match='merged'):
        materialize_data(tmp_path)
    assert (tmp_path / 'data.json').read_bytes() == before


@pytest.mark.parametrize(('raw', 'style', 'expected'), [
    ('.524', 'number', .524), ('-.5', 'number', -.5), ('+.50', 'number', .5),
    ('.5%', 'percent', .005), ('9.0', 'number', 9), ('1,234.5', 'number', 1234.5),
])
def test_unambiguous_decimal_syntax(raw, style, expected):
    from source_evidence import parse_value
    assert parse_value(raw, style) == expected


@pytest.mark.parametrize('raw', ['NaN', 'Infinity', '1,23', '.5 kg', '.', True])
def test_ambiguous_numbers_still_fail(raw):
    from source_evidence import parse_value
    with pytest.raises(ValueError):
        parse_value(raw, 'number')


@pytest.mark.parametrize('cells', [
    '<td rowspan="2">career</td><td>10</td><td>200</td>',
    '<td>career<table><tr><td>nested</td></tr></table></td><td>10</td><td>200</td>',
    '<td colspan="invalid">career</td><td>10</td><td>200</td>',
    '<td>career</td><td>10</td><td colspan="2">200</td>',
])
def test_unsupported_table_structure_never_partially_materializes(tmp_path, cells):
    setup_table(tmp_path)
    original = tmp_path.parent / (tmp_path.name + '-unsupported.html')
    original.write_text('<table><tr><th>scope</th><th>games</th><th>points</th></tr><tr>' + cells + '</tr></table>')
    capture_source(tmp_path, 'unsupported', input_file=original)
    review = json.loads((tmp_path / 'fact-review.json').read_text())
    review['comparisons'][0]['evidence']['capture'] = 'evidence/unsupported/capture.json'
    review['comparisons'][0]['denominatorEvidence']['capture'] = 'evidence/unsupported/capture.json'
    (tmp_path / 'fact-review.json').write_text(json.dumps(review))
    before = (tmp_path / 'data.json').read_bytes()
    with pytest.raises(ValueError, match='unsupported|merged'):
        materialize_data(tmp_path)
    assert (tmp_path / 'data.json').read_bytes() == before
    assert not (tmp_path / 'evidence-extract.json').exists()
