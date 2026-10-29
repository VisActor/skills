import json
import sys
from pathlib import Path

import pytest

SCRIPTS = Path(__file__).resolve().parents[2] / 'skills/person-poster/scripts'
sys.path.insert(0, str(SCRIPTS))
import poster_workflow as workflow  # noqa: E402
from delivery_policy import delivery_status  # noqa: E402
from inspect_contrast import CONTRAST_POLICY  # noqa: E402
from inspect_html_layout import VISIBILITY_POLICY  # noqa: E402
from inspect_readability import READING_POLICY  # noqa: E402
from review_bundle import compare_layout  # noqa: E402
from review_fingerprint import fingerprint  # noqa: E402


def test_failed_preflight_cannot_export(tmp_path, monkeypatch):
    workflow.save(tmp_path / 'preflight.json', {'passed': False})
    monkeypatch.setattr(workflow.subprocess, 'run', lambda *a, **k: pytest.fail('must not launch export'))
    with pytest.raises(ValueError, match='Preflight failed'):
        workflow.execute(tmp_path, 'export')


def test_command_records_actual_failure(tmp_path, monkeypatch):
    assert workflow.run_tool(tmp_path, 'review', [sys.executable, '-c', 'raise SystemExit(7)']) == 7
    timing = json.loads((tmp_path / 'tool-timings.json').read_text())['commands'][0]
    assert timing['exitCode'] == 7
    assert timing['endedAt'] >= timing['startedAt']


def test_recovery_stops_after_install_error(tmp_path, monkeypatch):
    workflow.save(tmp_path / 'preflight.json', {'passed': False, 'failureStage': 'driver-startup'})
    calls = []
    def run(root, name, cmd):
        calls.append(name)
        return 1 if name in ('preflight', 'install-dependencies') else 0
    monkeypatch.setattr(workflow, 'run_tool', run)
    assert workflow.prepare(tmp_path, sys.executable, True) == 1
    assert calls == ['preflight', 'create-environment', 'install-dependencies']


def test_new_preflight_failure_invalidates_previous_delivery(tmp_path, monkeypatch):
    workflow.save(tmp_path / 'delivery-check.json', {'passed': True})
    monkeypatch.setattr(workflow, 'prepare', lambda *a: 1)
    assert workflow.execute(tmp_path, 'preflight') == 1
    assert delivery_status(tmp_path)['status'] == 'blocked'


def test_edit_invalidates_review(tmp_path):
    workflow.save(tmp_path / 'manifest.json', {'html': 'index.html', 'displayBindings': 'display-map.json'})
    workflow.save(tmp_path / 'display-map.json', {'version': 1, 'dom': [], 'charts': []})
    (tmp_path / 'index.html').write_text('<main>Hello</main><script src="bridge.js"></script>')
    (tmp_path / 'bridge.js').write_text('/* original */')
    (tmp_path / 'review').mkdir()
    workflow.save(tmp_path / 'review/review.json', {'technicalPassed': True, 'errors': [], 'displayVersion': 1, 'display': {'passed': True, 'version': 1}, 'readingPolicy': READING_POLICY, 'contrastPolicy': CONTRAST_POLICY, 'visibilityPolicy': VISIBILITY_POLICY, 'visibility': {'passed': True}, 'sourceFingerprint': fingerprint(tmp_path)})
    workflow.save(tmp_path / 'review/display-check.json', {'passed': True, 'errors': [], 'version': 1})
    workflow.checked_review(tmp_path)
    (tmp_path / 'bridge.js').write_text('/* changed */')
    with pytest.raises(ValueError, match='Inputs changed'):
        workflow.checked_review(tmp_path)


@pytest.mark.parametrize('action', ['export', 'verify'])
def test_old_contrast_policy_blocks_delivery(tmp_path, monkeypatch, action):
    workflow.save(tmp_path / 'preflight.json', {'passed': True, 'python': {'executable': sys.executable}})
    workflow.save(tmp_path / 'manifest.json', {'html': 'index.html', 'displayBindings': 'display-map.json'})
    workflow.save(tmp_path / 'display-map.json', {'version': 1, 'dom': [], 'charts': []})
    (tmp_path / 'index.html').write_text('<main>Scope</main>')
    (tmp_path / 'review').mkdir()
    report = {'technicalPassed': True, 'errors': [], 'displayVersion': 1,
              'display': {'passed': True, 'version': 1}, 'readingPolicy': READING_POLICY,
              'contrastPolicy': CONTRAST_POLICY, 'visibilityPolicy': VISIBILITY_POLICY,
              'visibility': {'passed': True}, 'sourceFingerprint': fingerprint(tmp_path)}
    workflow.save(tmp_path / 'review/review.json', report)
    workflow.save(tmp_path / 'review/display-check.json', {'passed': True, 'errors': [], 'version': 1})
    workflow.checked_review(tmp_path)
    report['contrastPolicy'] = {'version': 'rendered-glyph-background-v1', 'displayWidthCssPx': 600,
                                'normalMinimum': 4.5, 'largeMinimum': 3.0}
    workflow.save(tmp_path / 'review/review.json', report)
    monkeypatch.setattr(workflow, 'run_tool', lambda *a, **k: pytest.fail('must not export'))
    with pytest.raises(ValueError, match='Review policy differs'):
        workflow.execute(tmp_path, action)
    assert not (tmp_path / 'preview.png').exists()


@pytest.mark.parametrize('change', ['position', 'text', 'coverage', 'root'])
def test_independent_review_load_must_match_inspected_scene(change):
    old = {'root': {'x': 0, 'y': 0, 'width': 600, 'height': 400}, 'items': [
        {'kind': 'required', 'label': 'scope', 'text': 'Scope',
         'rect': {'x': 20, 'y': 30, 'width': 100, 'height': 30}}]}
    new = {'root': dict(old['root']), 'required': [
        {'text': 'Scope', 'rect': dict(old['items'][0]['rect'])}]}
    assert compare_layout(old, new) == []
    if change == 'position':
        new['required'][0]['rect']['x'] += 5
    elif change == 'text':
        new['required'][0]['text'] = 'Changed'
    elif change == 'coverage':
        new['required'] = []
    else:
        new['root']['width'] += 20
    assert compare_layout(old, new)


def test_material_needs_specific_local_source_evidence(tmp_path):
    manifest = {'assets': [{'file': 'assets/portrait.png', 'kind': 'bitmap',
                           'sourceFile': 'assets/original.jpg', 'sourcePage': 'https://example.org/photo',
                           'usageStatus': 'verified', 'usageTerms': 'Recorded license'}]}
    acceptance = {'usage': {'status': 'passed', 'assets': []}}
    assert workflow.usage_errors(tmp_path, manifest, acceptance)
    acceptance['usage']['assets'] = [{'file': 'assets/portrait.png', 'status': 'passed',
                                      'basis': 'Source excerpt, author and terms', 'evidence': 'photo-source.txt'}]
    assert workflow.usage_errors(tmp_path, manifest, acceptance)
    (tmp_path / 'photo-source.txt').write_text('Actual source page excerpt saved during research')
    assert not workflow.usage_errors(tmp_path, manifest, acceptance)


@pytest.mark.poster_browser
def test_full_workflow_and_changed_data(tmp_path):
    root = tmp_path / 'bundle'
    root.mkdir()
    assert workflow.execute(root, 'preflight') == 0
    workflow.save(root / 'manifest.json', {'html': 'index.html', 'png': 'preview.png',
                  'canvas': {'width': 600, 'height': 400}, 'charts': [], 'assets': [], 'displayBindings': 'display-map.json'})
    (root / 'index.html').write_text('''<style>body{margin:0}*{box-sizing:border-box}
      #infographic{width:600px;height:400px;padding:40px;background:white;color:black}
      h1{font:700 36px/1.4 sans-serif}</style><main id="infographic"><h1 data-required><span data-display-id="label">Count:</span> <span data-display-id="count">3</span></h1></main>
      <script>window.__INFOGRAPHIC_READY__=true</script>''')
    workflow.save(root / 'display-map.json', {'version': 1, 'dom': [
        {'id': 'label', 'kind': 'label', 'text': 'Count:'},
        {'id': 'count', 'kind': 'value', 'dataPointer': '/count', 'format': {'style': 'decimal', 'places': 0}}], 'charts': []})
    workflow.save(root / 'data.json', {'count': 3})
    (root / 'evidence').mkdir()
    workflow.save(root / 'evidence/input.json', {'count': 3})
    workflow.save(root / 'fact-review.json', {'status': 'passed', 'comparisons': [{
        'dataPointer': '', 'evidence': {'file': 'evidence/input.json', 'pointer': '', 'source': 'synthetic test input'}}]})
    assert workflow.execute(root, 'review') == 0
    assert workflow.execute(root, 'export') == 0
    workflow.save(root / 'acceptance.json', {key: {'status': 'passed'} for key in ('technical', 'factual', 'visual', 'usage')})
    assert workflow.execute(root, 'verify') == 0
    assert (root / 'preview.png').is_file()
    assert json.loads((root / 'delivery-check.json').read_text())['passed']
    assert delivery_status(root)['status'] == 'ready'
    assert workflow.execute(root, 'finish') == 0
    package = json.loads((root / 'delivery-package.json').read_text())
    assert package['status'] == 'ready'
    assert {a['file'] for a in package['formalArtifacts']} == {'index.html', 'preview.png'}
    assert (root / 'delivery-reply.md').read_text().startswith('正式交付已完成。')
    original_source = (root / 'evidence/input.json').read_bytes()
    (root / 'evidence/input.json').write_text('{"count":4}')
    assert delivery_status(root)['status'] == 'draft'
    (root / 'evidence/input.json').write_bytes(original_source)
    acceptance = (root / 'acceptance.json').read_bytes()
    workflow.save(root / 'acceptance.json', {'visual': {'status': 'failed'}})
    assert delivery_status(root)['status'] == 'draft'
    (root / 'acceptance.json').write_bytes(acceptance)
    assert delivery_status(root)['status'] == 'ready'
    receipt = json.loads((root / 'export-check.json').read_text())
    workflow.save(root / 'export-check.json', {'passed': False})
    with pytest.raises(ValueError, match='export receipt'):
        workflow.execute(root, 'verify')
    assert not json.loads((root / 'delivery-check.json').read_text())['passed']
    workflow.save(root / 'export-check.json', receipt)
    workflow.save(root / 'data.json', {'count': 4})
    with pytest.raises(ValueError, match='Inputs changed'):
        workflow.execute(root, 'export')


def test_layout_keeps_final_review_and_records_actual_failure(tmp_path, monkeypatch):
    workflow.save(tmp_path / 'preflight.json', {'passed': True, 'python': {'executable': sys.executable}})
    (tmp_path / 'review').mkdir()
    (tmp_path / 'review/review.json').write_text('original final review')
    def run(root, name, command):
        assert name == 'layout'
        assert command[-2:] == ['--output-dir', str(root / 'layout-review')]
        (root / 'layout-review').mkdir()
        workflow.save(root / 'layout-review/review.json', {'errors': ['Reading text below 12px']})
        return 9
    monkeypatch.setattr(workflow, 'run_tool', run)
    assert workflow.execute(tmp_path, 'layout') == 9
    assert (tmp_path / 'review/review.json').read_text() == 'original final review'
    assert not (tmp_path / 'preview.png').exists()
    assert not (tmp_path / 'export-check.json').exists()
    receipt = json.loads((tmp_path / 'delivery-check.json').read_text())
    assert receipt['errors'] == ['Reading text below 12px']
    assert receipt['exitCode'] == 9


def test_exception_persists_specific_failure(tmp_path):
    workflow.save(tmp_path / 'preflight.json', {'passed': False})
    with pytest.raises(ValueError, match='Preflight failed'):
        workflow.execute(tmp_path, 'review')
    assert 'Preflight failed' in delivery_status(tmp_path)['errors'][0]


def test_hung_tool_has_bounded_failure(tmp_path):
    assert workflow.run_tool(tmp_path, 'review', [sys.executable, '-c', 'import time; time.sleep(30)'], timeout_seconds=.2) == 124
    item = json.loads((tmp_path / 'tool-timings.json').read_text())['commands'][-1]
    assert item['timedOut'] and item['exitCode'] == 124
    assert 'timed out' in (tmp_path / item['log']).read_text()


def test_facts_mismatch_stops_build_without_touching_html(tmp_path, monkeypatch):
    workflow.save(tmp_path / 'data.json', {'count': 121})
    workflow.save(tmp_path / 'source.json', {'count': 123})
    workflow.save(tmp_path / 'fact-review.json', {'status': 'passed', 'comparisons': [{
        'dataPointer': '/count', 'evidence': {'file': 'source.json', 'pointer': '/count', 'source': 'synthetic input'}}]})
    workflow.save(tmp_path / 'manifest.json', {'html':'index.html','png':'preview.png','canvas':{'width':600,'height':400},'displayBindings':'display-map.json','charts':[]})
    workflow.save(tmp_path / 'display-map.json', {'dom':[], 'charts':[]})
    (tmp_path / 'index.html').write_text('original')
    monkeypatch.setattr(workflow, 'build_display', lambda *a: pytest.fail('must not build'))
    assert workflow.execute(tmp_path, 'build') == 1
    assert (tmp_path / 'index.html').read_text() == 'original'
    assert '/count' in json.loads((tmp_path / 'evidence-check.json').read_text())['errors'][0]
    assert delivery_status(tmp_path)['status'] == 'blocked'


def test_missing_facts_is_saved_as_actionable_failure(tmp_path):
    assert workflow.execute(tmp_path, 'facts') == 1
    assert not json.loads((tmp_path / 'evidence-check.json').read_text())['passed']
    assert delivery_status(tmp_path)['status'] == 'blocked'


@pytest.mark.poster_browser
def test_draft_preserves_inputs_failure_and_handoff_status(tmp_path):
    import shutil
    source = Path(__file__).resolve().parents[2] / 'cases/person-poster/locked-layout-delivery/inputs'
    root = tmp_path / 'bundle'
    shutil.copytree(source, root)
    assert workflow.execute(root, 'preflight') == 0
    assert workflow.execute(root, 'review') == 1
    before = {p.name: p.read_bytes() for p in root.iterdir() if p.is_file() and p.name != 'tool-timings.json'}
    assert workflow.execute(root, 'draft') == 0
    assert (root / 'draft/preview.png').is_file()
    assert before == {name: (root / name).read_bytes() for name in before}
    assert delivery_status(root)['status'] == 'blocked'
    assert workflow.execute(root, 'handoff') == 1
    summary = (root / 'delivery-summary.md').read_text()
    assert summary.startswith('草稿/未完成')
    assert 'draft/诊断草稿-未完成.png' in summary
    assert 'draft/preview.png' not in summary
    assert not (root / 'preview.png').exists()
    assert workflow.execute(root, 'finish') == 1
    assert json.loads((root / 'delivery-package.json').read_text())['formalArtifacts'] == []
    assert (root / 'delivery-reply.md').read_text().startswith('正式交付未完成。')


@pytest.mark.poster_browser
def test_initialized_build_syncs_and_keeps_layout_failure_separate(tmp_path):
    workflow.execute(tmp_path, 'init', width=600, height=400)
    assert workflow.execute(tmp_path, 'preflight') == 0
    workflow.save(tmp_path/'data.json', {'count':9.0})
    workflow.save(tmp_path/'source.json', {'count':9})
    workflow.save(tmp_path/'fact-review.json', {'status':'passed', 'checks':[], 'comparisons':[
        {'dataPointer':'/count','evidence':{'file':'source.json','pointer':'/count','source':'synthetic original'}}]})
    workflow.save(tmp_path/'display-map.json', {'version':1,'dom':[
        {'id':'count','kind':'value','dataPointer':'/count','format':{'style':'decimal','places':0}}], 'charts':[]})
    path=tmp_path/'index.html'
    path.write_text(path.read_text().replace('</main>','<p id="count" data-required style="font:32px Arial;margin:40px"></p></main>'))
    assert workflow.execute(tmp_path, 'build') == 0
    assert '>9</p>' in path.read_text()
    assert json.loads((tmp_path/'build-check.json').read_text())['layoutPassed'] is True
    path.write_text(path.read_text().replace('font:32px','font:8px'))
    assert workflow.execute(tmp_path, 'build') == 1
    result=json.loads((tmp_path/'build-check.json').read_text())
    assert result['buildPassed'] is True and result['layoutPassed'] is False
    assert delivery_status(tmp_path)['status']=='blocked'
    before=path.read_bytes()
    workflow.save(tmp_path/'data.json', {})
    assert workflow.execute(tmp_path, 'build') == 1
    assert path.read_bytes()==before
    assert json.loads((tmp_path/'build-check.json').read_text())['phase']=='inputs'
