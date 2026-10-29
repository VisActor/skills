#!/usr/bin/env python3
"""Compare delivered numeric fields to saved source extracts, without judging source truth."""
from __future__ import annotations

import argparse
import json
from decimal import Decimal, InvalidOperation
from pathlib import Path

from json_values import json_values_equal


def read_local(root: Path, name: str):
    if not isinstance(name, str) or not name or Path(name).is_absolute():
        raise ValueError('Evidence file must be bundle-relative')
    path = (root / name).resolve()
    if not path.is_relative_to(root.resolve()):
        raise ValueError('Evidence path escapes bundle')
    def reject_constant(value):
        raise ValueError(f'Non-finite JSON value: {value}')
    return json.loads(path.read_text(encoding='utf-8'), parse_constant=reject_constant)


def pointer(document, path: str):
    if not isinstance(path, str) or (path and not path.startswith('/')):
        raise ValueError('Use a JSON Pointer starting with / (or empty for root)')
    value = document
    for part in path.split('/')[1:] if path else []:
        key = part.replace('~1', '/').replace('~0', '~')
        if isinstance(value, list):
            if not key.isdigit() or str(int(key)) != key:
                raise ValueError('Array pointer requires a nonnegative canonical index')
            value = value[int(key)]
        else:
            value = value[key]
    return value


def numeric_leaves(value, path='') -> set[str]:
    if type(value) in (int, float):
        return {path}
    if isinstance(value, dict):
        return set().union(*(numeric_leaves(v, path + '/' + str(k).replace('~', '~0').replace('/', '~1'))
                             for k, v in value.items()))
    if isinstance(value, list):
        return set().union(*(numeric_leaves(v, path + '/' + str(i)) for i, v in enumerate(value)))
    return set()


def number(value) -> Decimal:
    if type(value) not in (int, float):
        raise ValueError('Calculation source must be a JSON number')
    result = Decimal(str(value))
    if not result.is_finite():
        raise ValueError('Non-finite source number')
    return result


def verify_evidence(root: Path) -> dict:
    root = root.resolve()
    errors, checks, covered = [], [], set()
    data, review = read_local(root, 'data.json'), read_local(root, 'fact-review.json')
    comparisons = review.get('comparisons', [])
    if not isinstance(comparisons, list):
        raise ValueError('fact-review.comparisons must be an array')
    for index, check in enumerate(comparisons):
        try:
            path = check['dataPointer']
            actual = pointer(data, path)
            if path in covered:
                raise ValueError('Duplicate dataPointer')
            from source_evidence import resolve_comparison
            expected, details = resolve_comparison(root, check)
            passed = json_values_equal(actual, expected)
            if (root / 'evidence-extract.json').exists():
                extract = read_local(root, 'evidence-extract.json')
                entry = next((item for item in extract.get('entries', []) if item.get('dataPointer') == path), None)
                if entry is None or not json_values_equal(entry, {'dataPointer': path, 'expected': expected, **details}):
                    raise ValueError('Generated extract changed or is stale; rerun data from original sources')
            covered.add(path)
            covered.update(numeric_leaves(actual, path))
            checks.append({'dataPointer': path, 'actual': actual, 'expected': expected,
                           'passed': passed, 'evidence': check['evidence'], **details})
            if not passed:
                errors.append(f'Source mismatch: {path}: {actual!r} != {expected!r}')
        except (KeyError, IndexError, TypeError, ValueError, OSError, InvalidOperation) as error:
            errors.append(f'comparisons[{index}]: {error}')
    value_pointers = set()
    if (root / 'manifest.json').exists():
        manifest = read_local(root, 'manifest.json')
        if manifest.get('displayBindings'):
            for entry in read_local(root, manifest['displayBindings']).get('dom', []):
                if entry.get('kind') == 'value':
                    target = entry['dataPointer']
                    pointer(data, target)
                    value_pointers.add(target)
    uncovered_values = sorted(path for path in value_pointers if not any(
        path == c['dataPointer'] or not c['dataPointer'] or path.startswith(c['dataPointer'] + '/') for c in checks if c['passed']))
    if uncovered_values:
        errors.append(f'{len(uncovered_values)} displayed value pointers have no passing source comparison')
    from source_evidence import relationship_errors
    errors.extend(relationship_errors(data, review))
    missing = sorted(numeric_leaves(data) - covered)
    if missing:
        errors.append(f'{len(missing)} delivered numeric fields have no source comparison')
    return {'passed': not errors, 'checks': checks, 'uncoveredNumericFields': missing, 'uncoveredValuePointers': uncovered_values, 'errors': errors,
            'scope': 'Source-extract consistency only; inspect original sources, semantic claims and usage conditions separately.'}



def resolve_evidence_value(root: Path, comparison: dict) -> object:
    from source_evidence import resolve_comparison
    return resolve_comparison(root.resolve(), comparison)[0]

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--bundle', type=Path, required=True)
    args = parser.parse_args()
    try:
        result = verify_evidence(args.bundle)
    except (OSError, ValueError, TypeError) as error:
        result = {'passed': False, 'errors': [str(error)]}
    output = args.bundle / 'evidence-check.json'
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(result, ensure_ascii=False))
    return 0 if result['passed'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
