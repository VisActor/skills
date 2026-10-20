from __future__ import annotations

import json
import subprocess
from pathlib import Path

import pytest

REFERENCE = (
    Path(__file__).resolve().parents[1]
    / "skills/vchart-skill/references/examples/treemap/hierarchy-treemap.js"
)


def probe(rows: list[dict], hierarchy: list[str], value: str) -> dict:
    runtime = r"""
const fs = require('node:fs');
const vm = require('node:vm');
const input = JSON.parse(fs.readFileSync(0, 'utf8'));
const helpers = vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8') + '; ({createTreemapSpec, createTreemapTooltip});', {});
try {
  const spec = helpers.createTreemapSpec(input.rows, input.options);
  spec.tooltip = helpers.createTreemapTooltip(spec.categoryField, spec.valueField);
  const leaves = [];
  function visit(nodes) {for (const node of nodes) node.children ? visit(node.children) : leaves.push(node);}
  visit(spec.data.values);
  const row = input.rows[0];
  const result = {leaves, values: spec.data.values};
  if (row) {
    const forms = [row, {datum:[{unrelated:'ancestor'},row]}, {datum:row}];
    result.callbacks = forms.map(node => ({
      title: spec.tooltip.mark.title.value(node),
      details: spec.tooltip.mark.content.map(item => item.value(node)),
    }));
  }
  process.stdout.write(JSON.stringify(result));
} catch(error) {process.stdout.write(JSON.stringify({error:String(error.message)}));}
"""
    result = subprocess.run(
        ["node", "-e", runtime, str(REFERENCE)],
        input=json.dumps(
            {
                "rows": rows,
                "options": {
                    "hierarchyFields": hierarchy,
                    "valueField": value,
                },
            }
        ),
        capture_output=True,
        text=True,
        check=True,
        timeout=10,
    )
    return json.loads(result.stdout)


@pytest.mark.parametrize("hierarchy", [["region", "item"], ["region", "division", "item"]])
def test_reference_preserves_leaf_data_at_different_depths(hierarchy: list[str]) -> None:
    rows = [
        {"region": "East", "division": "X", "item": "One", "size": 12},
        {"region": "East", "division": "Y", "item": "Two", "size": 4},
        {"region": "West", "division": "Y", "item": "Three", "size": 4},
    ]
    observed = probe(rows, hierarchy, "size")
    assert observed["leaves"] == rows


def test_optional_tooltip_reads_original_records_not_internal_keys() -> None:
    rows = [
        {"team": "Red", "product": "First", "revenue": 6},
        {"team": "Red", "product": "Next", "revenue": 4},
    ]
    observed = probe(rows, ["team", "product"], "revenue")
    expected = {
        "title": "First",
        "details": ["6"],
    }
    assert observed["callbacks"] == [expected, expected, expected]


def test_empty_rows_keep_values_empty() -> None:
    assert probe([], ["group", "name"], "amount") == {"leaves": [], "values": []}


@pytest.mark.parametrize("amount", [None, "", "invalid"])
def test_reference_rejects_missing_or_invalid_amounts(amount: object) -> None:
    result = probe(
        [{"group": "G", "name": "N", "amount": amount}],
        ["group", "name"],
        "amount",
    )
    assert result == {"error": "Invalid numeric value for amount."}
