import copy
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'skills/person-poster/scripts'))
from delivery_policy import usage_errors  # noqa: E402


def material(root):
    (root / 'photo-source.txt').write_text('Synthetic permission: display with credit; credit supplied.')
    manifest = {'assets': [{'file': 'portrait.jpg', 'kind': 'bitmap',
        'sourceFile': 'portrait.jpg', 'sourcePage': 'https://example.org/photo',
        'usageStatus': 'verified', 'usageTerms': 'Synthetic permission for this display with credit'}]}
    acceptance = {'usage': {'status': 'passed', 'assets': [
        {'file': 'portrait.jpg', 'status': 'passed', 'basis': 'Synthetic permission and credit checked',
         'evidence': 'photo-source.txt'}]}}
    return manifest, acceptance


@pytest.mark.parametrize('status', ['unknown', 'restricted', None])
def test_acceptance_cannot_promote_unverified_material(tmp_path, status):
    manifest, acceptance = material(tmp_path)
    manifest['assets'][0]['usageStatus'] = status
    assert usage_errors(tmp_path, manifest, acceptance)


@pytest.mark.parametrize('terms', ['unknown', ' UNKNOWN ', 'pending', 'unverified', '未知', ''])
def test_verified_label_does_not_override_explicit_unknown_terms(tmp_path, terms):
    manifest, acceptance = material(tmp_path)
    manifest['assets'][0]['usageTerms'] = terms
    assert usage_errors(tmp_path, manifest, acceptance)


def test_specific_evidence_and_conditions_can_pass(tmp_path):
    manifest, acceptance = material(tmp_path)
    assert usage_errors(tmp_path, manifest, acceptance) == []
    acceptance['usage']['assets'].append(copy.deepcopy(acceptance['usage']['assets'][0]))
    assert usage_errors(tmp_path, manifest, acceptance)


@pytest.mark.parametrize('path', ['missing.txt', '../outside.txt'])
def test_evidence_must_exist_inside_bundle(tmp_path, path):
    manifest, acceptance = material(tmp_path)
    acceptance['usage']['assets'][0]['evidence'] = path
    assert usage_errors(tmp_path, manifest, acceptance)


def test_no_bitmap_does_not_require_material_record(tmp_path):
    assert usage_errors(tmp_path, {'assets': []}, {}) == []


def test_formal_entrypoints_share_material_gate(tmp_path, monkeypatch):
    import json
    from types import SimpleNamespace

    import delivery_policy as policy
    import poster_workflow as workflow
    manifest, acceptance = material(tmp_path)
    manifest.update({'html': 'index.html', 'delivery': 'html'})
    manifest['assets'][0]['usageStatus'] = 'unknown'
    acceptance.update({key: {'status': 'passed'} for key in ['technical', 'factual', 'visual']})
    for name, value in [('manifest.json', manifest), ('acceptance.json', acceptance),
                        ('fact-review.json', {'status': 'passed'}),
                        ('preflight.json', {'passed': True, 'python': {'executable': sys.executable}})]:
        (tmp_path / name).write_text(json.dumps(value))
    (tmp_path / 'index.html').write_text('<main>Fixture</main>')
    monkeypatch.setattr(policy, 'checked_review', lambda root: {})
    monkeypatch.setattr(workflow, 'checked_review', lambda root: {})
    monkeypatch.setattr(policy, 'verify_evidence', lambda root: {'errors': []})
    monkeypatch.setattr(workflow, 'verify_evidence', lambda root: {'errors': []})
    monkeypatch.setattr(workflow, 'validate_bundle', lambda *a, **k: SimpleNamespace(errors=[]))
    assert any('usageStatus' in e for e in policy.check_exportable(tmp_path))
    with pytest.raises(ValueError, match='usageStatus'):
        policy.check_export_target(tmp_path, tmp_path / 'index.html', tmp_path / 'preview.png', draft=False)
    assert any('usageStatus' in e for e in workflow.verify_ready(tmp_path))
    assert workflow.execute(tmp_path, 'finish') == 1
    assert json.loads((tmp_path / 'delivery-package.json').read_text())['formalArtifacts'] == []
