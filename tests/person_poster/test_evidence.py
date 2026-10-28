import json
import sys
from pathlib import Path

import pytest

SCRIPTS = Path(__file__).resolve().parents[2] / 'skills/person-poster/scripts'
sys.path.insert(0, str(SCRIPTS))
from verify_evidence import pointer, verify_evidence  # noqa: E402


def source_bundle(root):
    (root / 'evidence').mkdir()
    (root / 'evidence/source.json').write_text(json.dumps({'games': 3, 'points': 50, 'missedGames': 0}))
    (root / 'data.json').write_text(json.dumps({'games': 3, 'ppg': 16.7, 'unplayedAverage': None}))
    comparisons = [
        {'dataPointer': '/games', 'evidence': {'file': 'evidence/source.json', 'pointer': '/games', 'source': 'user input/table'}},
        {'dataPointer': '/ppg', 'evidence': {'file': 'evidence/source.json', 'pointer': '/points', 'source': 'user input/table'}, 'denominatorPointer': '/games', 'decimals': 1},
        {'dataPointer': '/unplayedAverage', 'evidence': {'file': 'evidence/source.json', 'pointer': '/points', 'source': 'user input/table'}, 'denominatorPointer': '/missedGames', 'decimals': 1}]
    (root / 'fact-review.json').write_text(json.dumps({'status': 'passed', 'comparisons': comparisons}))


def test_source_comparison_and_zero_denominator(tmp_path):
    source_bundle(tmp_path)
    assert verify_evidence(tmp_path)['passed']
    data = json.loads((tmp_path / 'data.json').read_text())
    data.update(ppg=16.6, unplayedAverage=0, unusedEstimate=91)
    (tmp_path / 'data.json').write_text(json.dumps(data))
    report = verify_evidence(tmp_path)
    assert not report['passed']
    assert report['uncoveredNumericFields'] == ['/unusedEstimate']
    assert len([x for x in report['checks'] if not x['passed']]) == 2


@pytest.mark.parametrize('name', ['../outside.json', '/tmp/outside.json', 'evidence/../data.json'])
def test_evidence_cannot_escape_or_self_certify(tmp_path, name):
    source_bundle(tmp_path)
    review = json.loads((tmp_path / 'fact-review.json').read_text())
    review['comparisons'][0]['evidence']['file'] = name
    (tmp_path / 'fact-review.json').write_text(json.dumps(review))
    assert not verify_evidence(tmp_path)['passed']


def test_exact_source_group_covers_numeric_children(tmp_path):
    source_bundle(tmp_path)
    (tmp_path / 'data.json').write_text('{"games":3,"points":50,"missedGames":0}')
    (tmp_path / 'fact-review.json').write_text(json.dumps({'comparisons': [{
        'dataPointer': '', 'evidence': {'file': 'evidence/source.json', 'pointer': '', 'source': 'input'}}]}))
    assert verify_evidence(tmp_path)['passed']


def test_pointer_escaping_and_negative_index():
    assert pointer({'a/b': {'~value': 3}}, '/a~1b/~0value') == 3
    with pytest.raises(ValueError):
        pointer([1, 2], '/-1')
