import pytest


def native_spec():
    return {
        "type": "bar", "animation": False,
        "data": [{"id": "d", "values": [{"label": "A", "value": 9}]}],
        "xField": "label", "yField": "value",
        "bar": {"style": {"cornerRadius": 2}},
    }


def test_native_spec_accepts_extension_fields(poster_validator):
    assert poster_validator.validate_chart_spec(native_spec()) == []


def test_old_schema_is_not_native_spec(poster_validator):
    assert poster_validator.validate_chart_spec({"chartType": "column", "data": []})


@pytest.mark.parametrize("spec", [None, [], {}, {"type": "bar"},
    {"type": "bar", "animation": True, "data": [{"values": []}]},
    {"type": "bar", "animation": False, "data": [{"url": "remote.csv"}]}])
def test_invalid_or_nonlocal_spec(poster_validator, spec):
    assert poster_validator.validate_chart_spec(spec)


def test_nested_and_series_data(poster_validator):
    tree = {"type": "treemap", "animation": False,
            "data": [{"values": [{"name": "root", "children": [{"name": "A", "value": 2}]}]}]}
    assert poster_validator.validate_chart_spec(tree) == []
    common = {"type": "common", "animation": False,
              "series": [{"type": "scatter", "data": [{"values": [{"x": 1, "y": 2}]}]}]}
    assert poster_validator.validate_chart_spec(common) == []
