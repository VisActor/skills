import importlib.util
import json
from datetime import datetime, timezone
from pathlib import Path

import pytest

NOW = datetime(2026, 10, 27, 4, 0, tzinfo=timezone.utc)


@pytest.fixture
def timing():
    path = Path(__file__).resolve().parents[2] / 'skills/person-poster/scripts/workflow_timing.py'
    spec = importlib.util.spec_from_file_location('poster_timing_test', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@pytest.mark.parametrize('stage,fragment', [
    ({'endedAt': '2026-10-27T04:02:00Z'}, 'future'),
    ({'startedAt': '2026-10-27T03:59:00Z', 'endedAt': '2026-10-27T03:58:00Z'}, 'before'),
    ({'startedAt': '2026-10-27T03:59:00'}, 'timezone'),
    ({'endedAt': 'yesterday'}, 'ISO'),
    ({'endedAt': 42}, 'ISO'),
    ({'endedAt': '2026-10-27T03:59:00Z', 'recordedAt': '2026-10-27T03:58:00Z'}, 'recordedAt'),
])
def test_invalid_stage_times(timing, stage, fragment):
    assert any(fragment in e for e in timing.validate_timings({'stages': [stage]}, now=NOW))


def test_unknown_parallel_and_offset_times_are_valid(timing):
    record = {'status': 'partial', 'stages': [
        {'startedAt': '2026-10-27T11:58:00+08:00', 'endedAt': None},
        {'startedAt': '2026-10-27T03:57:00Z', 'endedAt': '2026-10-27T03:59:00Z'},
        {'limitations': ['not recorded']},
    ]}
    assert timing.validate_timings(record, now=NOW) == []
    assert timing.validate_timings({'status': 'pending'}, now=NOW) == []


def test_recorder_preserves_retries_and_unknown_history(timing, tmp_path):
    timing.record_stage(tmp_path, 'render', 'start', now=NOW)
    with pytest.raises(ValueError):
        timing.record_stage(tmp_path, 'render', 'start', now=NOW)
    later = NOW.replace(minute=1)
    timing.record_stage(tmp_path, 'render', 'end', now=later)
    timing.record_stage(tmp_path, 'render', 'start', now=later)
    record = json.loads((tmp_path / 'workflow-timings.json').read_text())
    assert record['status'] == 'partial'
    assert len(record['stages']) == 2
    assert record['stages'][0]['endedAt'] == later.isoformat()
    assert record['stages'][1]['attempt'] == 2
    assert record['stages'][1]['endedAt'] is None


def test_recorder_refuses_bad_record_and_orphan_end(timing, tmp_path):
    with pytest.raises(ValueError):
        timing.record_stage(tmp_path, 'render', 'end', now=NOW)
    path = tmp_path / 'workflow-timings.json'
    path.write_text('# historical notes')
    with pytest.raises(ValueError):
        timing.record_stage(tmp_path, 'render', 'start', now=NOW)
    assert path.read_text() == '# historical notes'


def test_validator_checks_existing_timestamps(poster_validator, tmp_path):
    (tmp_path / 'workflow-timings.json').write_text(json.dumps({
        'stages': [{'startedAt': '2099-01-01T00:00:00Z'}]}))
    result = poster_validator.ValidationResult()
    poster_validator.validate_records(tmp_path, result)
    assert any('future' in error for error in result.errors)


@pytest.mark.parametrize('stages', [[], [{'name': 'work'}], [{'startedAt': '2026-10-27T03:59:00Z'}]])
def test_complete_timing_cannot_contain_unknown_intervals(timing, stages):
    assert any('complete' in e for e in timing.validate_timings({'status': 'complete', 'stages': stages}, now=NOW))


def test_recorder_can_extend_observed_complete_history(timing, tmp_path):
    path = tmp_path / 'workflow-timings.json'
    record = {'status': 'complete', 'stages': [{'name': 'research',
              'startedAt': '2026-10-27T03:58:00Z', 'endedAt': '2026-10-27T03:59:00Z'}]}
    assert timing.validate_timings(record, now=NOW) == []
    path.write_text(json.dumps(record))
    timing.record_stage(tmp_path, 'render', 'start', now=NOW)
    result = json.loads(path.read_text())
    assert result['status'] == 'partial'
    assert result['stages'][0] == record['stages'][0]
    assert result['stages'][1]['endedAt'] is None
