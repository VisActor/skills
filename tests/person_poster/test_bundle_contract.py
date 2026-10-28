import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'skills/person-poster/scripts'))
from bundle_contract import check_build_inputs  # noqa: E402


def test_collects_missing_data_and_fact_references_without_writes(tmp_path):
    values = {'manifest.json': {'html':'index.html','png':'preview.png','canvas':{'width':600,'height':400},
               'displayBindings':'display-map.json','charts':[]}, 'data.json':{}, 'fact-review.json':{'checks':[]},
              'display-map.json':{'dom':[{'id':'scope','kind':'claim','dataPointer':'/deleted','factIds':['missing']}], 'charts':[]}}
    for n,v in values.items():
        (tmp_path/n).write_text(json.dumps(v))
    (tmp_path/'index.html').write_text('<main id="infographic"><p id="scope"></p><script src="charts.generated.js"></script></main>')
    before = {p.name:p.read_bytes() for p in tmp_path.iterdir()}
    result = check_build_inputs(tmp_path)
    assert {'missing-data-pointer','missing-fact-id'} <= {i['code'] for i in result['issues']}
    assert before == {p.name:p.read_bytes() for p in tmp_path.iterdir()}


def test_missing_manifest_fields_are_reported(tmp_path):
    (tmp_path/'manifest.json').write_text('{}')
    result = check_build_inputs(tmp_path)
    assert not result['passed']
    assert any(i['pointer']=='/html' for i in result['issues'])


def test_invalid_manifest_review_preserves_actionable_report(tmp_path):
    from types import SimpleNamespace

    from review_bundle import review
    (tmp_path/'manifest.json').write_text('{}')
    out=tmp_path/'review'
    report=review(SimpleNamespace(bundle=tmp_path,output_dir=out))
    assert report['technicalPassed'] is False
    assert any('manifest' in error.lower() for error in report['errors'])
    assert (out/'review.json').is_file()
