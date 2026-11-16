import test from "node:test";
import assert from "node:assert/strict";
import { frequencyExample, createFrequency, consecutiveRuns } from "../../skills/creative-data-storytelling/assets/examples/frequency-and-runs/scene.mjs";
import { contributionExample, createContribution } from "../../skills/creative-data-storytelling/assets/examples/count-to-contribution/scene.mjs";
import { createTransition } from "../../skills/creative-data-storytelling/assets/runtime/motion.mjs";

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);
const area = nodes => [...nodes.values()].reduce((sum, n) => sum + n.width * n.height, 0);

test("equal event-day counts retain different runs and the same date identities", () => {
  const model = createFrequency(frequencyExample);
  assert.deepEqual(model.summaries.map(g => [g.count, g.runs.length, g.longest]), [[6, 6, 1], [6, 1, 6]]);
  const poses = ["count", "calendar", "runs"].map(model.layout);
  const identities = [...poses[0].nodes.keys()];
  for (const pose of poses) assert.deepEqual([...pose.nodes.keys()], identities);
  const calendar = poses[1], runs = poses[2];
  near(calendar.nodes.get("A:10").x - calendar.nodes.get("A:6").x,
    4 * (calendar.nodes.get("B:10").x - calendar.nodes.get("B:9").x));
  const aFirst = runs.nodes.get("A:2"), bFirst = runs.nodes.get("B:9");
  near(aFirst.x - aFirst.width / 2, bFirst.x - bFirst.width / 2);
  near(aFirst.width, bFirst.width);
  assert.ok(runs.nodes.get("A:6").y > aFirst.y);
  near(runs.nodes.get("B:14").y, bFirst.y);
});

test("unknown observations and date gaps break runs; zero-event groups remain valid", () => {
  assert.deepEqual(consecutiveRuns([
    { day: 1, outOfStock: true }, { day: 2, outOfStock: null },
    { day: 3, outOfStock: true }, { day: 4, outOfStock: true }, { day: 6, outOfStock: true },
  ]).map(run => run.map(row => row.day)), [[1], [3, 4], [6]]);
  const model = createFrequency({ days: 8, groups: [
    { id: "north", name: "北站", color: "#333", outOfStock: [2, 4, 5], unknown: [3] },
    { id: "south", name: "南站", color: "#888", outOfStock: [] },
  ] });
  assert.deepEqual(model.summaries.map(g => [g.count, g.runs.length, g.longest]), [[3, 2, 2], [0, 0, 0]]);
  assert.equal(model.byId.get("north:3").outOfStock, null);
  for (const pose of ["count", "calendar", "runs"].map(model.layout))
    for (const n of pose.nodes.values()) assert.ok([n.x, n.y, n.width, n.height].every(Number.isFinite));
  assert.throws(() => createFrequency({ ...frequencyExample, groups: [
    { ...frequencyExample.groups[0], unknown: [2] }, frequencyExample.groups[1],
  ] }), /disjoint/);
});

test("frequency transitions preserve adjacent dates within a run and reverse from current geometry", () => {
  const model = createFrequency(frequencyExample), start = model.layout("calendar"), end = model.layout("runs");
  for (const t of [.2, .5, .8]) {
    const pose = model.blend(start, end, t);
    near(pose.nodes.get("B:9").y, pose.nodes.get("B:14").y);
    assert.ok(pose.nodes.get("B:14").x > pose.nodes.get("B:9").x);
  }
  const player = createTransition(start, { blend: model.blend, duration: 1000 });
  player.target(end, 0);
  const before = player.sample(430).pose;
  player.target(start, 430);
  assert.deepEqual(player.sample(430).pose.nodes, before.nodes);
  assert.deepEqual(player.sample(1430).pose.nodes, start.nodes);
});

test("a daily window that cannot fit rejects invalid card geometry", () => {
  assert.throws(() => createFrequency({ ...frequencyExample, days: 300 }), /do not fit/);
});

test("cover area uses one scale across groups and keeps identities through concentration", () => {
  const model = createContribution(contributionExample);
  assert.deepEqual(model.totals.map(g => [g.count, g.reads]), [[6, 90], [4, 150]]);
  const count = model.layout("count"), weighted = model.layout("contribution"), concentrated = model.layout("concentration");
  for (const pose of [weighted, concentrated]) {
    assert.deepEqual(new Set(pose.nodes.keys()), new Set(count.nodes.keys()));
    for (const row of model.records) {
      const n = pose.nodes.get(row.id);
      near(n.width * n.height, row.reads * model.unitArea);
    }
  }
  near(area(count.nodes), area(weighted.nodes));
  const head = concentrated.nodes.get(model.head.id);
  near(head.area, area(concentrated.nodes) - head.area);
});

test("share comparison has two complete denominators with equal total displayed area", () => {
  const model = createContribution(contributionExample), shares = model.layout("shares");
  near(area(shares.reference), area(shares.nodes));
  const areaFor = (nodes, group) => [...nodes.values()].filter(n => model.byId.get(n.id).group === group)
    .reduce((sum, n) => sum + n.area, 0);
  near(areaFor(shares.reference, "B") / area(shares.reference), .4);
  near(areaFor(shares.nodes, "B") / area(shares.nodes), .625);
});

test("different records, a zero contribution and a new head derive readings without fixed book IDs", () => {
  const model = createContribution({ groups: [
    { id: "x", name: "展览", color: "#000" }, { id: "y", name: "讲座", color: "#888" },
  ], records: [
    { id: "zero", name: "未参与", group: "x", reads: 0 }, { id: "top", name: "重头", group: "x", reads: 80 },
    { id: "other", name: "另一项", group: "y", reads: 20 },
  ] });
  assert.deepEqual([model.head.id, model.total, model.remainder, model.readings.headShare], ["top", 100, 20, "80%"]);
  assert.ok(model.layout("count").nodes.get("zero").area > 0);
  assert.equal(model.layout("contribution").nodes.get("zero").area, 0);
  near(area(model.layout("shares").nodes), area(model.layout("shares").reference));
});

test("area interpolation remains proportional to rectangle area and interruptions do not jump", () => {
  const model = createContribution(contributionExample), start = model.layout("count"), end = model.layout("contribution");
  for (const t of [.1, .4, .75, .99]) {
    const pose = model.blend(start, end, t);
    for (const n of pose.nodes.values()) {
      near(n.width * n.height, n.area);
      near(n.height / n.width, 1.4);
    }
    near(area(pose.nodes), area(start.nodes));
  }
  const player = createTransition(start, { blend: model.blend, duration: 1000 });
  player.target(end, 0);
  const sampled = player.sample(375).pose;
  player.target(model.layout("concentration"), 375);
  assert.deepEqual(player.sample(375).pose.nodes, sampled.nodes);
  const last = player.sample(1375).pose;
  assert.deepEqual(last.nodes, model.layout("concentration").nodes);
});

test("settled book groups stay within the canvas and rectangles do not overlap", () => {
  const model = createContribution(contributionExample);
  for (const mode of ["count", "contribution", "concentration", "shares"]) {
    const pose = model.layout(mode);
    for (const map of [pose.nodes, pose.reference]) {
      const visible = [...map.values()].filter(n => n.opacity > 0 && n.area > 0);
      for (const [i, a] of visible.entries()) {
        assert.ok(a.x >= a.width / 2 && a.x + a.width / 2 <= model.plot.width);
        assert.ok(a.y >= a.height / 2 && a.y + a.height / 2 <= model.plot.height);
        for (const b of visible.slice(i + 1))
          assert.ok(Math.abs(a.x - b.x) >= (a.width + b.width) / 2 - .001 ||
            Math.abs(a.y - b.y) >= (a.height + b.height) / 2 - .001, `${mode}: ${a.id} overlaps ${b.id}`);
      }
    }
  }
});
