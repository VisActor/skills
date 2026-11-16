import test from "node:test";
import assert from "node:assert/strict";
import { materialOpening, materialOpeningFacts } from "../../skills/creative-data-storytelling/assets/examples/opening-material/scene.mjs";
import { createTrendModel, trendPose, blendTrend } from "../../skills/creative-data-storytelling/assets/examples/material-trend/scene.mjs";
import { referenceOpening } from "../../skills/creative-data-storytelling/assets/examples/opening-reference/scene.mjs";
import { createRecordModel, recordPose, blendRecords } from "../../skills/creative-data-storytelling/assets/examples/record-comparison/scene.mjs";
import { createWaitingModel, waitingPose, blendWaiting } from "../../skills/creative-data-storytelling/assets/examples/opening-question/scene.mjs";
import { createTransition } from "../../skills/creative-data-storytelling/assets/runtime/motion.mjs";
import { createParticleModel, particlePose, blendParticles } from "../../skills/creative-data-storytelling/assets/examples/opening-particles/scene.mjs";
import { at } from "../../skills/creative-data-storytelling/assets/runtime/geometry.mjs";

test("material opening uses a raw-only slice and keeps the first observation through its handoff", () => {
  const model = createTrendModel(materialOpening), cover = trendPose('cover', model), start = trendPose('start', model);
  const middle = blendTrend(cover, start, .5), id = model.primary.points[0].id;
  assert.equal(model.rows.length, 1);
  assert.equal(model.rateScale, null);
  assert.equal(cover.nodes.get(id).row.value, start.nodes.get(id).row.value);
  assert.ok(middle.nodes.get(id).x > start.nodes.get(id).x && middle.nodes.get(id).x < cover.nodes.get(id).x);
});

test("material opening derives its difference from the last displayed price, not later unused observations", () => {
  const config = structuredClone(materialOpening);
  config.series[0].observations[0].value = 4.25;
  config.stops.at(-1).throughId = 'burger-2023-2';
  assert.equal(materialOpeningFacts(config).difference, 7.45 - 4.25);
});

test("reference opening keeps the same measured width while old and new rows rearrange", () => {
  const model = createRecordModel(referenceOpening), a = recordPose('reference', model), b = recordPose('arrivals', model);
  assert.equal(model.records.size, 3);
  const middle = blendRecords(a, b, .5);
  assert.equal(middle.nodes.get('cedar').row.value, 42);
  assert.equal(middle.nodes.get('cedar').reveal, 1);
  assert.ok(middle.nodes.get('cedar').y < a.nodes.get('cedar').y);
});

test("waiting summary and threshold are derived from the actual independent records", () => {
  const model = createWaitingModel();
  assert.deepEqual(model.groups.map(g => [g.mean, g.tail, g.values.length]), [[30, 2, 10], [20, 2, 10]]);
  const a = waitingPose('question', model), b = waitingPose('evidence', model);
  assert.deepEqual([...a.nodes.keys()], [...b.nodes.keys()]);
  assert.equal(new Set([...b.nodes.values()].map(n => n.id)).size, 20);
});

test("different samples preserve denominator, threshold inclusion and mean references", () => {
  const model = createWaitingModel({ unit: '分钟', threshold: 40, max: 80,
    groups: [{ id: 'early', label: '早期', values: [5, 15, 40, 60] }, { id: 'late', label: '后期', values: [10, 10, 40] }] });
  assert.deepEqual(model.groups.map(g => [g.mean, g.tail, g.values.length]), [[30, 2, 4], [20, 1, 3]]);
  const pose = waitingPose('evidence', model, { width: 900, height: 320 });
  assert.equal(pose.nodes.get('early/2').tail, true);
  assert.equal(pose.means.get('early').group.mean, 30);
});

test("interrupted opening returns from the current pose instead of resetting the summary", () => {
  const a = waitingPose('question'), b = waitingPose('evidence');
  const player = createTransition(a, { blend: blendWaiting, duration: 1000 });
  player.target(b, 0);
  const middle = player.sample(440).pose;
  player.target(a, 440);
  assert.deepEqual(player.sample(440).pose, middle);
  assert.deepEqual(player.sample(1440).pose, a);
});

const figureSlots = Array.from({ length: 400 }, (_, i) => ({
  x: i % 20 / 19, y: Math.floor(i / 20) / 19, color: i % 3 ? [255, 249, 235] : [25, 40, 36],
}));

test("particle figure and distribution preserve each record without inventing units", () => {
  const model = createParticleModel(), a = particlePose('figure', model, figureSlots), b = particlePose('distribution', model, figureSlots);
  assert.equal(model.below, 159);
  assert.deepEqual([...a.nodes.keys()].sort(), [...b.nodes.keys()].sort());
  assert.equal(a.nodes.size, 360);
  for (const [id, node] of b.nodes) {
    assert.equal(node.row.value, a.nodes.get(id).row.value);
    assert.equal(node.x, at(b.scale, node.row.value));
  }
});

test("particle layout accepts a different record count and scale, rejecting a too-small figure", () => {
  const model = createParticleModel({ rows: [{ id: 'book-a', value: 120 }, { id: 'book-b', value: 400 }, { id: 'book-c', value: 120 }],
    domain: [0, 700], threshold: 200, unit: '页', color: [45, 65, 75] });
  const pose = particlePose('distribution', model, figureSlots, { width: 640, height: 480 });
  assert.equal(model.below, 2);
  assert.equal(model.share, 2 / 3);
  assert.equal(pose.nodes.size, 3);
  assert.equal(pose.nodes.get('book-a').x, pose.nodes.get('book-c').x);
  assert.notEqual(pose.nodes.get('book-a').y, pose.nodes.get('book-c').y);
  assert.throws(() => particlePose('figure', model, figureSlots.slice(0, 2)), /enough distinct/);
});

test("particle reassembly keeps the current coordinates on interruption and completes in reverse", () => {
  const model = createParticleModel(), a = particlePose('figure', model, figureSlots), b = particlePose('distribution', model, figureSlots);
  const player = createTransition(a, { blend: blendParticles, duration: 1000 });
  player.target(b, 0);
  const middle = player.sample(410).pose;
  assert.notEqual(middle.nodes.get('panda-030').x, a.nodes.get('panda-030').x);
  assert.equal(middle.nodes.size, a.nodes.size);
  player.target(a, 410);
  assert.deepEqual(player.sample(410).pose, middle);
  assert.deepEqual(player.sample(1410).pose, a);
});
