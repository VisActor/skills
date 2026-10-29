import json
import sys
from pathlib import Path
from types import SimpleNamespace

import pytest

SCRIPTS = Path(__file__).resolve().parents[2] / 'skills/person-poster/scripts'
sys.path.insert(0, str(SCRIPTS))


def test_failed_review_blocks_shared_policy(tmp_path):
    from delivery_policy import check_exportable
    (tmp_path / 'review').mkdir()
    (tmp_path / 'review/review.json').write_text(json.dumps({
        'technicalPassed': False, 'errors': ['low contrast']}))
    assert any('Review failed' in error for error in check_exportable(tmp_path))


def test_low_level_export_cannot_bypass_failed_review(tmp_path, monkeypatch):
    import export_html_png as exporter
    (tmp_path / 'index.html').write_text('<main>Draft</main>')
    (tmp_path / 'manifest.json').write_text('{"html":"index.html","png":"preview.png"}')
    (tmp_path / 'review').mkdir()
    (tmp_path / 'review/review.json').write_text('{"technicalPassed":false,"errors":["small"]}')
    monkeypatch.setattr(exporter, 'load_playwright', lambda *a: pytest.fail('must not launch browser'))
    with pytest.raises(ValueError, match='Review failed'):
        exporter.export_png(SimpleNamespace(html=str(tmp_path / 'index.html'),
                                           output=str(tmp_path / 'preview.png'), draft=False, bundle=None))
    assert not (tmp_path / 'preview.png').exists()


@pytest.mark.parametrize('name', ['preview.png', 'assets/source.png', '../outside.png'])
def test_draft_output_is_confined(tmp_path, name):
    from delivery_policy import check_export_target
    (tmp_path / 'index.html').write_text('<main>Draft</main>')
    (tmp_path / 'manifest.json').write_text('{"html":"index.html","png":"preview.png"}')
    with pytest.raises(ValueError, match='draft'):
        check_export_target(tmp_path, tmp_path / 'index.html', tmp_path / name, draft=True)


def test_draft_cannot_replace_declared_input(tmp_path):
    from delivery_policy import check_export_target
    (tmp_path / 'draft').mkdir()
    (tmp_path / 'draft/source.png').write_bytes(b'original')
    (tmp_path / 'index.html').write_text('<img src="draft/source.png">')
    (tmp_path / 'manifest.json').write_text('{"html":"index.html","png":"preview.png"}')
    with pytest.raises(ValueError, match='input'):
        check_export_target(tmp_path, tmp_path / 'index.html', tmp_path / 'draft/source.png', draft=True)
    assert (tmp_path / 'draft/source.png').read_bytes() == b'original'


def test_status_without_receipt_is_read_only(tmp_path):
    from delivery_policy import delivery_status
    before = list(tmp_path.iterdir())
    assert delivery_status(tmp_path)['status'] == 'draft'
    assert list(tmp_path.iterdir()) == before


def test_failed_receipt_is_blocked(tmp_path):
    from delivery_policy import delivery_status
    (tmp_path / 'delivery-check.json').write_text('{"passed":false,"errors":["low contrast"]}')
    assert delivery_status(tmp_path) == {'status': 'blocked', 'errors': ['low contrast']}


def test_handoff_does_not_promote_image_or_handwritten_acceptance(tmp_path):
    from delivery_policy import delivery_handoff
    (tmp_path / 'delivery-check.json').write_text('{"passed":false,"errors":["Reading failed"]}')
    (tmp_path / 'preview.png').write_bytes(b'unverified')
    (tmp_path / 'acceptance.json').write_text('{"technical":{"status":"passed"}}')
    before = {p.name: p.read_bytes() for p in tmp_path.iterdir()}
    result = delivery_handoff(tmp_path)
    assert result['status'] == 'blocked'
    assert 'Reading failed' in result['errors']
    assert '未完成' in result['summary']
    assert result['artifacts'] == [{'file': 'preview.png', 'label': '未验证图片'}]
    assert result['formalArtifacts'] == []
    assert result['diagnosticArtifacts'] == result['artifacts']
    assert before == {p.name: p.read_bytes() for p in tmp_path.iterdir()}


def test_old_success_requires_current_contract(tmp_path):
    from delivery_policy import delivery_status
    (tmp_path / 'delivery-check.json').write_text('{"passed":true,"deliveryFingerprint":{}}')
    assert delivery_status(tmp_path)['status'] == 'draft'
    assert 'contract' in delivery_status(tmp_path)['errors'][0]


def test_package_excludes_loose_final_image_and_keeps_diagnostics(tmp_path):
    from delivery_policy import delivery_package
    (tmp_path / 'delivery-check.json').write_text('{"passed":false,"errors":["Reading failed"]}')
    (tmp_path / 'preview.png').write_bytes(b'unverified')
    (tmp_path / 'draft').mkdir()
    from diagnostic_preview import create_diagnostic_preview
    from PIL import Image
    Image.new('RGB', (1200,900), 'blue').save(tmp_path / 'draft/preview.png')
    create_diagnostic_preview(tmp_path, tmp_path / 'draft/preview.png')
    result = delivery_package(tmp_path)
    assert result['status'] == 'blocked' and result['formalArtifacts'] == []
    assert result['reply'].startswith('正式交付未完成。')
    assert [a['file'] for a in result['diagnosticArtifacts']] == ['draft/诊断草稿-未完成.png']
    assert [a['file'] for a in result['unverifiedArtifacts']] == ['preview.png']


def test_replaced_diagnostic_report_is_not_recommended(tmp_path):
    from delivery_policy import delivery_package
    from diagnostic_preview import REPORT_NAME, create_diagnostic_preview
    from PIL import Image
    (tmp_path/'draft').mkdir()
    Image.new('RGB',(1200,900),'blue').save(tmp_path/'draft/preview.png')
    create_diagnostic_preview(tmp_path,tmp_path/'draft/preview.png')
    (tmp_path/'delivery-check.json').write_text('{"passed":false,"errors":["Reading failed"]}')
    (tmp_path/REPORT_NAME).write_bytes((tmp_path/'draft/preview.png').read_bytes())
    package=delivery_package(tmp_path)
    assert not any(item['file']==REPORT_NAME for item in package['diagnosticArtifacts'])
    assert any(item['file']==REPORT_NAME for item in package['unverifiedArtifacts'])
    assert package['formalArtifacts']==[]


def test_blocked_actions_and_diagnostic_identity_precede_constraint_request(tmp_path):
    from delivery_policy import delivery_package
    from diagnostic_preview import create_diagnostic_preview
    from PIL import Image
    (tmp_path / 'delivery-check.json').write_text('{"passed":false,"errors":["Reading failed"]}')
    (tmp_path / 'index.html').write_text('<main>Original</main>')
    (tmp_path / 'draft').mkdir()
    Image.new('RGB', (2400, 1800), 'white').save(tmp_path / 'draft/preview.png')
    create_diagnostic_preview(tmp_path, tmp_path / 'draft/preview.png')
    result = delivery_package(tmp_path)
    assert result['allowedActions'] == ['share-diagnostic', 'request-constraint-change', 'repair-and-recheck', 'stop']
    assert result['diagnosticArtifacts'][0]['file'] == 'draft/诊断草稿-未完成.png'
    assert '2400×2106' in result['reply'] and '2400×1800' in result['reply']
    assert result['reply'].index('诊断草稿-未完成.png') < result['reply'].index(result['nextAction'])
    assert result['formalArtifacts'] == []
