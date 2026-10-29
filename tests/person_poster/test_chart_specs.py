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


def test_colors_typo_warns_without_invalidating_spec(poster_validator):
    spec = native_spec()
    spec['colors'] = ['#6b7683', '#d4af6a']
    assert poster_validator.validate_chart_spec(spec) == []
    assert poster_validator.chart_spec_warnings(spec)


def test_unverified_label_rule_array_warns(poster_validator):
    spec = native_spec() | {'label': {'format': [{'rule': 'datum.value != null', 'visible': False}]}}
    assert poster_validator.validate_chart_spec(spec) == []
    assert any('label.format' in w for w in poster_validator.chart_spec_warnings(spec))


@pytest.mark.parametrize('extra', [{}, {'color': ['#6b7683']},
                                  {'customExtension': {'colors': ['red']}},
                                  {'type': 'custom', 'colors': ['red']}])
def test_color_diagnostics_preserve_valid_extensions(poster_validator, extra):
    spec = native_spec() | extra
    assert poster_validator.chart_spec_warnings(spec) == []


@pytest.mark.parametrize('inner,outer', [(0.62, 0.6), (0.6, 0.6)])
@pytest.mark.parametrize('nested', [False, True])
def test_pie_inverted_or_empty_ring_warns(poster_validator, inner, outer, nested):
    pie = {'type': 'pie', 'innerRadius': inner, 'outerRadius': outer}
    spec = {'type': 'common', 'series': [pie]} if nested else pie
    assert any('innerRadius' in w for w in poster_validator.chart_spec_warnings(spec))


@pytest.mark.parametrize('extra', [
    {}, {'innerRadius': 0.5}, {'innerRadius': 0.5, 'outerRadius': 0.8},
    {'innerRadius': {'field': 'radius'}, 'outerRadius': 0.8},
    {'innerRadius': 0.7, 'outerRadius': {'field': 'radius'}},
    {'innerRadius': 0.7, 'outerRadius': 0.6, 'pie': {'style': {'outerRadius': 0.9}}},
    {'innerRadius': 0.7, 'outerRadius': 0.6, 'pie': {'style': {'innerRadius': 0.2}}},
])
def test_pie_warning_does_not_guess_defaults_or_mark_overrides(poster_validator, extra):
    assert poster_validator.chart_spec_warnings({'type': 'pie'} | extra) == []
