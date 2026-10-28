"""Exact JSON value semantics across Python and browser number representations."""
from decimal import Decimal
from math import isfinite


def _validate(value):
    if type(value) not in (dict, list, str, int, float, bool, type(None)):
        raise ValueError('Expected a JSON value')
    if type(value) is float and not isfinite(value):
        raise ValueError('Non-finite JSON number')
    if isinstance(value, dict):
        if any(type(key) is not str for key in value):
            raise ValueError('JSON object keys must be strings')
        for item in value.values():
            _validate(item)
    if isinstance(value, list):
        for item in value:
            _validate(item)


def _equal(left, right):
    if type(left) in (int, float) and type(right) in (int, float):
        return Decimal(str(left)) == Decimal(str(right))
    if type(left) is not type(right):
        return False
    if isinstance(left, dict):
        return left.keys() == right.keys() and all(_equal(left[k], right[k]) for k in left)
    if isinstance(left, list):
        return len(left) == len(right) and all(_equal(a, b) for a, b in zip(left, right))
    return left == right


def json_values_equal(left: object, right: object) -> bool:
    _validate(left)
    _validate(right)
    return _equal(left, right)
