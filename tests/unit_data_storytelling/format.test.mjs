import test from "node:test";
import assert from "node:assert/strict";
import { createValueFormat } from "../../skills/unit-data-storytelling/assets/mechanics/format.mjs";

test("matching prose and chart readouts share a fixed unit and precision across magnitudes", () => {
  const f = createValueFormat({ unit: "万件", divisor: 10000, digits: 2 });
  assert.equal(f.number(12500), "1.25");
  assert.equal(f.format(12500), "1.25 万件");
  assert.equal(f.format(12500000), "1,250.00 万件");
  assert.equal(f.divisor, 10000);
  assert.ok(Object.isFrozen(f));
});

test("missing values remain distinct from zero and invalid calculations fail explicitly", () => {
  const f = createValueFormat({ unit: "件", digits: 0 });
  assert.deepEqual([f.format(null), f.number(undefined), f.format(0)], ["—", "—", "0 件"]);
  for (const value of [NaN, Infinity, -Infinity, "12", ""]) assert.throws(() => f.number(value), /finite numeric/);
});

test("display rounding suppresses negative zero without hiding meaningful negative values", () => {
  const f = createValueFormat({ digits: 2, signDisplay: "exceptZero", locale: "en-US" });
  assert.deepEqual([-0, -0.004, -0.015, 1].map(f.number), ["0.00", "0.00", "-0.02", "+1.00"]);
});

test("percentage conversion is explicit rather than inferred from the number", () => {
  const ratio = createValueFormat({ divisor: 0.01, unit: "%", separator: "", digits: 1 });
  const points = createValueFormat({ unit: "个百分点", digits: 1 });
  assert.equal(ratio.format(0.125), "12.5%");
  assert.equal(points.format(12.5), "12.5 个百分点");
});

test("invalid format configuration and conversion overflow fail before showing a misleading value", () => {
  for (const options of [{ divisor: 0 }, { divisor: -1 }, { digits: 1.5 }, { digits: 21 }, { unit: 2 }])
    assert.throws(() => createValueFormat(options), /Value format/);
  assert.throws(() => createValueFormat({ divisor: Number.MIN_VALUE }).number(1), /finite numeric/);
});
