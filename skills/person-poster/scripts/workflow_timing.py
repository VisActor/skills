#!/usr/bin/env python3
"""Record observed workflow stage times; unknown history stays unknown."""
from __future__ import annotations

import argparse
import json
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path


def validate_timings(record: dict, *, now: datetime | None = None) -> list[str]:
    now = now or datetime.now(timezone.utc)
    stages = record.get('stages', [])
    if not isinstance(stages, list):
        return ['stages must be an array']
    errors = []
    complete = record.get('status') == 'complete'
    if complete and not stages:
        errors.append('complete timing record requires observed stages')
    for index, stage in enumerate(stages):
        prefix = f'stages[{index}]'
        if not isinstance(stage, dict):
            errors.append(f'{prefix} must be an object')
            continue
        if complete and (not stage.get('startedAt') or not stage.get('endedAt')):
            errors.append(f'{prefix}: complete timing record requires startedAt and endedAt; use partial for unknown times')
        times = {}
        for field in ('startedAt', 'endedAt', 'recordedAt'):
            raw = stage.get(field)
            if raw is None:
                continue
            try:
                if not isinstance(raw, str):
                    raise ValueError('expected ISO timestamp or null')
                value = datetime.fromisoformat(raw.replace('Z', '+00:00'))
                if value.tzinfo is None or value.utcoffset() is None:
                    raise ValueError('timestamp requires timezone')
                times[field] = value
                if value > now + timedelta(seconds=5):
                    errors.append(f'{prefix}.{field} is in the future')
            except ValueError as error:
                errors.append(f'{prefix}.{field}: invalid ISO timestamp ({error})')
        start, end, recorded = (times.get(k) for k in ('startedAt', 'endedAt', 'recordedAt'))
        if start and end and end < start:
            errors.append(f'{prefix}.endedAt is before startedAt')
        if recorded and any(t > recorded + timedelta(seconds=5) for t in (start, end) if t):
            errors.append(f'{prefix} stage time exceeds recordedAt')
    return errors


def record_stage(root: Path, name: str, action: str, *, now: datetime | None = None) -> None:
    now = now or datetime.now(timezone.utc)
    if not name.strip() or action not in ('start', 'end'):
        raise ValueError('Supply a stage name and start/end action')
    root = root.resolve()
    path = root / 'workflow-timings.json'
    if path.is_symlink():
        raise ValueError('Refusing to replace a timing-record symlink')
    record = json.loads(path.read_text()) if path.exists() else {'status': 'partial', 'stages': []}
    if not isinstance(record, dict) or not record:
        raise ValueError('Timing record must be a non-empty object')
    errors = validate_timings(record, now=now)
    if errors:
        raise ValueError('; '.join(errors))
    stages = record.setdefault('stages', [])
    matches = [s for s in stages if s.get('name') == name]
    active = [s for s in matches if s.get('startedAt') and not s.get('endedAt')]
    timestamp = now.isoformat()
    if action == 'start':
        if active:
            raise ValueError(f'Stage {name!r} already running; end it before retrying')
        stages.append({'name': name, 'attempt': len(matches) + 1,
                       'startedAt': timestamp, 'endedAt': None, 'recordedAt': timestamp})
    else:
        if len(active) != 1:
            raise ValueError(f'Stage {name!r} needs exactly one recorded start')
        active[0].update(endedAt=timestamp, recordedAt=timestamp)
    record['status'] = 'partial'  # Tool coverage does not prove the entire workflow was timed.
    errors = validate_timings(record, now=now)
    if errors:
        raise ValueError('; '.join(errors))
    root.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', dir=root, delete=False) as file:
            temporary = Path(file.name)
            json.dump(record, file, ensure_ascii=False, indent=2, allow_nan=False)
            file.write('\n')
        temporary.replace(path)
    finally:
        if temporary and temporary.exists():
            temporary.unlink()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--bundle', type=Path, required=True)
    parser.add_argument('action', choices=['start', 'end'])
    parser.add_argument('stage')
    args = parser.parse_args()
    try:
        record_stage(args.bundle, args.stage, args.action)
    except (OSError, ValueError) as error:
        parser.exit(1, f'Timing record error: {error}\n')
    print(f'Recorded {args.action}: {args.stage}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
