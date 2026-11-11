import test from "node:test";
import assert from "node:assert/strict";
import { foodWaste, shareScale, materialPose, blendMaterialPose } from "../../skills/creative-data-storytelling/assets/examples/material-composition/scene.mjs";
import { createTransition } from "../../skills/creative-data-storytelling/assets/runtime/motion.mjs";

test("composition intervals share one scale and meet without losing the total", () => {
  for (const shares of [[60, 28, 12], [25, 25, 50], [0, 40, 60]]) {
    const data = { ...foodWaste, rows: foodWaste.rows.map((row, i) => ({ ...row, share: shares[i] })) };
    const nodes = [...materialPose("shares", data).nodes.values()];
    let end = shareScale.x;
    for (const node of nodes) {
      assert.ok(Math.abs(node.x - end) < 1e-8);
      assert.ok(Math.abs(node.width / shareScale.width * 100 - node.row.share) < 1e-8);
      assert.equal(node.imageX, node.x + node.width / 2);
      assert.equal(node.labelX, node.imageX);
      end = node.x + node.width;
    }
    assert.ok(Math.abs(end - shareScale.x - shareScale.width) < 1e-8);
  }
});

test("invalid share totals and negative quantities are not silently normalized", () => {
  for (const shares of [[40, 28, 12], [-1, 1, 100], [NaN, 28, 12]]) {
    const data = { ...foodWaste, rows: foodWaste.rows.map((row, i) => ({ ...row, share: shares[i] })) };
    assert.throws(() => materialPose("shares", data), /100% total/);
  }
});

test("quantitative labels appear only once their geometry has arrived", () => {
  const a = materialPose("places"), b = materialPose("shares");
  const moving = blendMaterialPose(a, b, 0.5), arriving = blendMaterialPose(a, b, 0.9);
  assert.equal(moving.annotations.size, 0);
  assert.ok(arriving.annotations.get("shares-of-total").opacity > 0);
  for (const [id, node] of arriving.nodes) assert.equal(node.width, b.nodes.get(id).width);
  const reversing = blendMaterialPose(b, a, 0.2);
  assert.equal(reversing.annotations.size, 0);
});

test("redirecting an unfinished scene keeps object identity and the sampled pose", () => {
  const transition = createTransition(materialPose("places"), { blend: blendMaterialPose, duration: 1000 });
  transition.target(materialPose("shares"), 0);
  const middle = transition.sample(450).pose;
  transition.target(materialPose("majority"), 450);
  assert.deepEqual(transition.sample(450).pose, middle);
  const final = transition.sample(1500);
  assert.equal(final.moving, false);
  assert.deepEqual([...final.pose.nodes.keys()], [...middle.nodes.keys()]);
  assert.deepEqual([...final.pose.nodes.values()].map((node) => node.row.share), foodWaste.rows.map((row) => row.share));
});

test("composition can highlight a different category without renaming it to home", () => {
  const data = { ...foodWaste, focusId: "late", rows: foodWaste.rows.map((row, i) =>
    ({ ...row, id: ["first", "second", "late"][i], share: [15, 25, 60][i] })) };
  const from = materialPose("shares", data), to = materialPose("majority", data);
  for (const t of [0, .25, .5, .9, 1]) {
    const pose = blendMaterialPose(from, to, t);
    assert.equal(pose.nodes.get("late").imageOpacity, 1);
    assert.equal(pose.nodes.get("late").x, shareScale.x + .4 * shareScale.width);
    assert.equal(pose.nodes.get("late").width, .6 * shareScale.width);
  }
  assert.equal(to.nodes.get("first").imageOpacity, .55);
});

test("composition-only fragment works without a focus but a majority claim still needs evidence", () => {
  const data = { rows: foodWaste.rows.map((row, i) => ({ ...row, id: "kind-" + i, share: [25, 40, 35][i] })) };
  const places = materialPose("places", data), shares = materialPose("shares", data);
  assert.deepEqual([...places.nodes.keys()], [...shares.nodes.keys()]);
  assert.equal([...shares.nodes.values()].reduce((sum, node) => sum + node.width, 0), shareScale.width);
  assert.throws(() => materialPose("majority", data), /focusId/);
  assert.throws(() => materialPose("majority", { ...data, focusId: "kind-1" }), /50%/);
});
