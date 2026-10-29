import test from "node:test";
import assert from "node:assert/strict";
import { createTransition } from "../../skills/unit-data-storytelling/assets/mechanics/motion.mjs";
import { at } from "../../skills/unit-data-storytelling/assets/mechanics/geometry.mjs";
import { maskSlots } from "../../skills/unit-data-storytelling/assets/mechanics/units.mjs";
import { samples, makePose, blendStudy, makeView, blendView }
  from "../../skills/unit-data-storytelling/assets/examples/composition-model.mjs";

test("both organizations preserve the sample, including the larger independent batch", () => {
  for (const sample of Object.keys(samples)) {
    for (const layout of ["groups", "duration"]) {
      assert.deepEqual([...makePose(sample, layout).nodes.keys()].sort(), samples[sample].map((r) => r.id).sort());
    }
  }
});

test("replacement has exact endpoints, independent identities and no leftover units", () => {
  const a = makePose("A", "groups"), b = makePose("B", "duration");
  assert.equal(blendStudy(a, b, 0), a);
  assert.equal(blendStudy(a, b, 1), b);
  assert.equal([...a.nodes.keys()].some((id) => b.nodes.has(id)), false);
  for (let step = 1; step < 20; step++) {
    const middle = blendStudy(a, b, step / 20);
    assert.ok([...middle.nodes.values()].every((n) => [n.x, n.y, n.opacity, n.area].every(Number.isFinite) && n.opacity >= 0 && n.opacity <= 1));
  }
});

test("rapid reversal begins at the sampled visible frame and settles on the latest complete target", () => {
  const a = makePose("A", "groups"), b = makePose("B", "duration");
  const transition = createTransition(a, { blend: blendStudy, duration: 1000 });
  transition.target(b, 0);
  const before = transition.sample(380).pose;
  transition.target(a, 380);
  assert.deepEqual(transition.sample(380).pose, before);
  const after = transition.sample(380.001).pose;
  for (const [id, old] of before.nodes) {
    const node = after.nodes.get(id);
    assert.ok(node && Math.hypot(node.x - old.x, node.y - old.y) < .001 && Math.abs(node.opacity - old.opacity) < .001);
  }
  assert.deepEqual(transition.sample(1380), { pose: a, progress: 1, moving: false });
});

const slots = maskSlots(10, 10, () => true);
const views = ["local", "whole", "groups", "compare", "duration", "focus", "shape"];

test("expansion and extraction preserve source identities; shapes do not create records", () => {
  for (const sample of Object.keys(samples)) {
    const poses = Object.fromEntries(views.map((view) => [view, makeView(sample, view, { slots })]));
    const ids = (pose) => [...pose.nodes.keys()].sort();
    assert.deepEqual(views.map((view) => ids(poses[view])), views.map((view) =>
      (view === "local" ? samples[sample].slice(0, 4)
        : view === "focus" ? samples[sample].filter((r) => r.months >= 12) : samples[sample]).map((r) => r.id).sort()));
  }
});

test("numeric zoom shares its moving scale and keeps valid category and axis references", () => {
  const from = makeView("A", "duration"), to = makeView("A", "focus");
  for (const t of [.01, .25, .5, .99]) {
    const pose = blendView(from, to, t);
    assert.ok(samples.A.filter((r) => to.nodes.has(r.id))
      .every((r) => Math.abs(pose.nodes.get(r.id).x - at(pose.scale, r.months)) < 1e-10));
    assert.deepEqual([pose.axisOpacity, pose.guides.get("phone").opacity, pose.guides.get("lamp").opacity], [1, 1, 1]);
  }
});

test("excluded records leave in place and are absent at the complete zoom target", () => {
  const from = makeView("A", "duration"), to = makeView("A", "focus");
  const pose = blendView(from, to, .5);
  const retired = [...from.nodes].filter(([id]) => !to.nodes.has(id));
  assert.ok(retired.every(([id, a]) => {
    const b = pose.nodes.get(id);
    return b.x === a.x && b.y === a.y && b.area === a.area && b.opacity < a.opacity;
  }) && blendView(from, to, 1) === to);
});

test("retargeting a numeric replacement or expansion preserves every visible node and guide", () => {
  for (const [initialView, incomingView] of [["duration", "duration"], ["local", "whole"]]) {
    const start = makeView("A", initialView), incoming = makeView("B", incomingView);
    const target = makeView("A", "focus");
    const transition = createTransition(start, { blend: blendView, duration: 1000 });
    transition.target(incoming, 0);
    const before = transition.sample(470).pose;
    transition.target(target, 470);
    assert.deepEqual(transition.sample(470).pose, before);
    const next = transition.sample(470.001).pose;
    assert.ok([...before.nodes].every(([id, a]) => {
      const b = next.nodes.get(id);
      return b && Math.hypot(a.x - b.x, a.y - b.y) < .001 && Math.abs(a.opacity - b.opacity) < .001
        && Math.abs(a.imageScale - b.imageScale) < .001;
    }));
    assert.equal(transition.sample(1470).pose, target);
  }
});

test("any example target can be reached directly and then reversed without invalid geometry", () => {
  const poses = views.map((view) => makeView("B", view, { slots }));
  for (const from of poses) for (const to of poses) {
    const middle = blendView(from, to, .4);
    assert.ok([...middle.nodes.values()].every((n) => [n.x, n.y, n.area, n.opacity, n.imageScale].every(Number.isFinite)));
    assert.equal(blendView(middle, from, 1), from);
  }
});

test("context and expanded focus keep identical records and values on their own common scale", () => {
  for (const sample of Object.keys(samples)) {
    const context = makeView(sample, "focus", { space: "context" });
    const expanded = makeView(sample, "focus", { space: "expand" });
    assert.deepEqual([...context.nodes.keys()], [...expanded.nodes.keys()]);
    for (const row of samples[sample].filter((r) => context.nodes.has(r.id))) {
      assert.equal(context.nodes.get(row.id).x, at(context.scale, row.months));
      assert.equal(expanded.nodes.get(row.id).x, at(expanded.scale, row.months));
    }
  }
});

test("an interrupted extraction or space change keeps retained anchors on the moving scale", () => {
  const start = makeView("B", "duration");
  const focused = makeView("B", "focus");
  const context = makeView("B", "focus", { space: "context" });
  const transition = createTransition(start, { blend: blendView, duration: 1000 });
  transition.target(focused, 0);
  const current = transition.sample(340).pose;
  transition.target(context, 340);
  assert.deepEqual(transition.sample(340).pose, current);
  for (const now of [341, 500, 820, 1339, 1340]) {
    const pose = transition.sample(now).pose;
    for (const row of samples.B.filter((r) => context.nodes.has(r.id))) {
      assert.ok(Math.abs(pose.nodes.get(row.id).x - at(pose.scale, row.months)) < 1e-10);
    }
    assert.equal(pose.axisOpacity, 1);
  }
  assert.equal(transition.sample(1340).pose, context);
});

test("expanded focus reserves room for the actual image footprints", () => {
  for (const sample of Object.keys(samples)) {
    const nodes = [...makeView(sample, "focus").nodes.values()];
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j], sum = a.imageScale + b.imageScale;
      assert.ok(Math.abs(a.x - b.x) >= 28.8 * sum / 2 || Math.abs(a.y - b.y) >= 36 * sum / 2);
    }
  }
});

test("formed groups retain their internal geometry and valid guides while moving together", () => {
  for (const sample of Object.keys(samples)) {
    for (const [start, end] of [["groups", "compare"], ["compare", "groups"]]) {
      const from = makeView(sample, start), to = makeView(sample, end);
      for (const t of [.01, .3, .7, .99]) {
        const pose = blendView(from, to, t);
        for (const kind of ["phone", "lamp"]) {
          const members = samples[sample].filter((row) => row.kind === kind);
          const reference = members[0].id;
          const dx = pose.nodes.get(reference).x - from.nodes.get(reference).x;
          const dy = pose.nodes.get(reference).y - from.nodes.get(reference).y;
          for (const { id } of members) {
            const a = from.nodes.get(id), b = pose.nodes.get(id);
            assert.ok(Math.abs(b.x - a.x - dx) < 1e-9 && Math.abs(b.y - a.y - dy) < 1e-9);
          }
          for (const [id, a] of from.guides) if (a.group === kind) {
            const b = pose.guides.get(id);
            assert.ok(Math.abs(b.x - a.x - dx) < 1e-9 && Math.abs(b.y - a.y - dy) < 1e-9);
            assert.deepEqual([b.text, b.opacity], [a.text, 1]);
          }
        }
      }
    }
  }
});

test("changing individual arrangement preserves valid counts; changed selections get independent readouts", () => {
  const from = makeView("B", "compare"), to = makeView("B", "duration");
  const counts = [...from.guides].filter(([, guide]) => guide.role === "count");
  for (const t of [.1, .5, .9]) {
    const pose = blendView(from, to, t);
    for (const [id, a] of counts) assert.deepEqual(
      [pose.guides.get(id).text, pose.guides.get(id).opacity], [a.text, 1]);
  }
  const selection = makeView("B", "focus");
  const selectedCountIds = [...selection.guides].filter(([, g]) => g.role === "count").map(([id]) => id);
  assert.ok(counts.every(([id]) => !selectedCountIds.includes(id)));
});

test("a group move can be interrupted into another arrangement without snapping marks or guides", () => {
  const from = makeView("B", "groups"), to = makeView("B", "compare");
  const transition = createTransition(from, { blend: blendView, duration: 1000 });
  transition.target(to, 0);
  const current = transition.sample(420).pose;
  const next = makeView("B", "duration");
  transition.target(next, 420);
  assert.deepEqual(transition.sample(420).pose, current);
  const after = transition.sample(420.001).pose;
  for (const part of ["nodes", "guides"]) for (const [id, a] of current[part]) {
    const b = after[part].get(id);
    assert.ok(b && Math.hypot(a.x - b.x, a.y - b.y) < .001 && Math.abs(a.opacity - b.opacity) < .001);
  }
  assert.equal(transition.sample(1420).pose, next);
});
