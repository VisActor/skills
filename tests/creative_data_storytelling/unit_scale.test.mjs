import test from "node:test";
import assert from "node:assert/strict";
import { at } from "../../skills/creative-data-storytelling/assets/runtime/geometry.mjs";
import { createTransition } from "../../skills/creative-data-storytelling/assets/runtime/motion.mjs";
import {
  unitScaleExample, createUnitScaleModel, unitScalePose, unitScaleGeometry,
  unitScaleReading, blendUnitScale,
} from "../../skills/creative-data-storytelling/assets/examples/unit-scale/scene.mjs";

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);

test("subdivision preserves the physical total and original object at every frame", () => {
  const model = createUnitScaleModel(), a = unitScalePose("reference", model), b = unitScalePose("parts", model);
  for (const t of [0, .15, .4, .7, 1]) {
    const pose = blendUnitScale(a, b, t), { units, end, zero } = unitScaleGeometry(model, pose);
    near((end - zero) / pose.scale.k, model.base.value);
    near(model.part * model.base.divisions, model.base.value);
    assert.equal(units[0].id, "reference-0");
    assert.equal(units[0].reveal, 1);
    assert.ok(units.slice(1).every(node => node.reveal === 0));
  }
});

test("repetition expands the view before adding quantities and retains a truthful visible total", () => {
  const model = createUnitScaleModel(), a = unitScalePose("parts", model), b = unitScalePose("multiple", model);
  const early = blendUnitScale(a, b, .3);
  assert.equal(early.copies, 1);
  assert.ok(early.scale.k < a.scale.k);
  for (const t of [.2, .4, .5, .6, .8, 1]) {
    const pose = blendUnitScale(a, b, t), geometry = unitScaleGeometry(model, pose);
    near(geometry.units.reduce((sum, node) => sum + node.value * node.reveal, 0), pose.copies * model.base.value);
    near((geometry.end - geometry.zero) / pose.scale.k, pose.copies * model.base.value);
    for (const node of geometry.units) near(node.width / pose.scale.k, model.base.value);
    if (pose.copies > 1) { near(pose.scale.k, b.scale.k); near(pose.scale.b, b.scale.b); }
  }
});

test("reverse removes extra copies before approaching the original reference", () => {
  const model = createUnitScaleModel(), a = unitScalePose("multiple", model), b = unitScalePose("parts", model);
  const early = blendUnitScale(a, b, .35);
  assert.ok(early.copies < a.copies && early.copies > 1);
  assert.deepEqual(early.scale, a.scale);
  for (const t of [.4, .5, .6, .7, .8, 1]) {
    const pose = blendUnitScale(a, b, t);
    if (pose.scale.k > a.scale.k + 1e-8) near(pose.copies, 1);
  }
});

test("comparison records keep independent identities and the same scale as the reference", () => {
  const model = createUnitScaleModel(), a = unitScalePose("multiple", model), b = unitScalePose("compare", model);
  for (const t of [0, .25, .5, .75, 1]) {
    const pose = blendUnitScale(a, b, t), { units, comparisons } = unitScaleGeometry(model, pose);
    const ids = new Set(units.map(unit => unit.id));
    for (const row of comparisons) {
      assert.equal(ids.has(row.id), false);
      near(row.width / pose.scale.k, row.row.value);
      near(row.x, at(pose.scale, 0));
    }
    near(units.reduce((sum, unit) => sum + unit.value * unit.reveal, 0), model.total);
  }
  assert.equal(unitScaleReading(model).gap, 12);
});

test("replacement quantities update all relations, including partial reference units and reversed rankings", () => {
  const config = structuredClone(unitScaleExample);
  config.base = { value: 12, name: "盒", divisions: 12, partName: "件" };
  config.multiple = { copies: 6, name: "箱" };
  config.records[0].value = 42; config.records[1].value = 18;
  const model = createUnitScaleModel(config), reading = unitScaleReading(model);
  assert.equal(model.total, 72);
  assert.deepEqual(reading.values, [3.5, 1.5]);
  assert.equal(reading.gap, 2);
  const { units, comparisons } = unitScaleGeometry(model, unitScalePose("compare", model));
  near(comparisons[0].width / units[0].width, 3.5);
  near(comparisons[1].width / units[0].width, 1.5);
});

test("interruption restarts from the sampled pose and all connections settle without more scrolling", () => {
  const initial = unitScalePose("reference"), final = unitScalePose("compare");
  const transition = createTransition(initial, { blend: blendUnitScale, duration: 1000 });
  transition.target(final, 0);
  const middle = transition.sample(490).pose;
  transition.target(unitScalePose("parts"), 490);
  assert.deepEqual(transition.sample(490).pose, middle);
  assert.equal(transition.sample(1490).moving, false);
  near(transition.sample(1490).pose.copies, 1);
  transition.target(final, 1490);
  assert.deepEqual(transition.sample(2490).pose, final);
});

test("invalid conversion and record inputs are rejected before rendering", () => {
  for (const divisions of [0, 1.5, 121]) {
    assert.throws(() => createUnitScaleModel({ ...unitScaleExample, base: { ...unitScaleExample.base, divisions } }), /subdivisions/);
  }
  assert.throws(() => createUnitScaleModel({ ...unitScaleExample, records: [unitScaleExample.records[0], unitScaleExample.records[0]] }), /unique/);
  assert.throws(() => createUnitScaleModel({ ...unitScaleExample, records: unitScaleExample.records.map(row => ({ ...row, value: -1 })) }), /nonnegative/);
  assert.throws(() => unitScalePose("missing"), /Unknown/);
});

test("conversion-only data needs no comparison records or comparison reading", () => {
  const config = {
    base: { value: 1000, name: "升", divisions: 10, partName: "分升" },
    multiple: { copies: 5, name: "桶" },
    layout: { width: 1100, height: 620, left: 160, right: 970, baseline: 250, axisY: 430 },
  };
  const model = createUnitScaleModel(config), reading = unitScaleReading(model);
  assert.deepEqual(reading.values, []);
  assert.equal(reading.gap, null);
  assert.equal(model.total, 5000);
  for (const [before, after] of [["reference", "parts"], ["parts", "multiple"], ["multiple", "parts"]]) {
    const a = unitScalePose(before, model), b = unitScalePose(after, model);
    for (const t of [0, .25, .5, .75, 1]) {
      const pose = blendUnitScale(a, b, t), geometry = unitScaleGeometry(model, pose);
      assert.deepEqual(geometry.comparisons, []);
      assert.equal(geometry.zero, 160);
      assert.equal(geometry.units[0].y, 250);
      near(geometry.units.reduce((sum, node) => sum + node.value * node.reveal, 0), pose.copies * model.base.value);
      assert.ok(geometry.end <= model.layout.right);
    }
  }
  assert.throws(() => unitScalePose("compare", model), /needs two comparison records/);
  assert.deepEqual(createUnitScaleModel({ ...config, records: [] }).records, []);
});

test("unit comparison layout moves marks and preserves shared-scale ratios", () => {
  const model = createUnitScaleModel({ ...unitScaleExample,
    layout: { width: 1100, height: 680, left: 180, right: 980, baseline: 270, axisY: 460,
      comparisonTop: 230, comparisonRowGap: 130 } });
  const pose = unitScalePose("compare", model), geometry = unitScaleGeometry(model, pose);
  assert.deepEqual(geometry.comparisons.map(row => row.y), [230, 360]);
  assert.equal(geometry.units[0].y, 599);
  near(geometry.comparisons[1].width / geometry.comparisons[0].width, 3);
  near(at(pose.scale, model.comparisonTicks.at(-1) * 1.05), model.layout.right);
});

test("unit layout fails visibly when the drawing does not fit instead of compressing text", () => {
  for (const layout of [{ right: 1000 }, { baseline: 500 }, { comparisonRowGap: 30 }, { left: NaN }]) {
    assert.throws(() => createUnitScaleModel({ ...unitScaleExample, layout }), /Unit scale layout/);
  }
  assert.throws(() => createUnitScaleModel({ ...unitScaleExample, records: [unitScaleExample.records[0]] }), /either no comparison records or two/);
});
