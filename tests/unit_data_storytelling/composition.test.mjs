import test from "node:test";
import assert from "node:assert/strict";
import { createTransition } from "../../skills/unit-data-storytelling/assets/mechanics/motion.mjs";
import { at, linearScale } from "../../skills/unit-data-storytelling/assets/mechanics/geometry.mjs";
import { maskSlots } from "../../skills/unit-data-storytelling/assets/mechanics/units.mjs";
import { samples, makePose, blendStudy, makeView, blendView, makeAggregateView,
  blendExtraction, blendGroupMove, blendReorder }
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

test("aggregate targets retain every source group, exact totals and fractional remainders", () => {
  for (const sample of Object.keys(samples)) {
    const denominator = samples[sample].reduce((sum, row) => sum + row.months, 0);
    const total = makeAggregateView(sample, "totals"), share = makeAggregateView(sample, "share");
    for (const [pose, quantum] of [[total, 10], [share, 5]]) {
      assert.equal(pose.nodes.size, 0);
      assert.equal(pose.meta.denominator, denominator);
      for (const kind of ["phone", "lamp"]) {
        const members = samples[sample].filter((row) => row.kind === kind);
        const sum = members.reduce((value, row) => value + row.months, 0);
        const expected = pose === total ? sum : sum / denominator * 100;
        const units = [...pose.aggregates.values()].filter((unit) => unit.group === kind);
        assert.ok(Math.abs(units.reduce((value, unit) => value + unit.amount, 0) - expected) < 1e-10);
        assert.ok(units.every((unit) => Math.abs(unit.fraction * quantum - unit.amount) < 1e-10));
        assert.deepEqual(units[0].members, members.map((row) => row.id));
      }
    }
    assert.ok([...total.aggregates.keys()].every((id) => !share.aggregates.has(id)
      && !samples[sample].some((row) => row.id === id)));
  }
});

test("source records gather and new measure units unfold from their group instead of only fading", () => {
  const from = makeView("A", "groups"), to = makeView("A", "totals");
  const middle = blendView(from, to, .45);
  for (const kind of ["phone", "lamp"]) {
    const old = [...from.nodes.values()].filter((node) => samples.A.find((r) => r.id === node.id).kind === kind);
    assert.ok(old.every((node) => middle.nodes.get(node.id).opacity > 0));
    const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    assert.ok(distance(middle.nodes.get(old[0].id), middle.nodes.get(old.at(-1).id)) < distance(old[0], old.at(-1)));
    const unit = [...to.aggregates.values()].filter((node) => node.group === kind).at(-1);
    const visible = middle.aggregates.get(unit.id);
    assert.ok(visible.opacity > 0 && distance(visible, unit) > 10);
    assert.equal(middle.guides.get(kind).opacity, 1);
  }
});

test("changing to shares keeps true source totals and complete group counts visible", () => {
  const from = makeView("B", "totals"), to = makeView("B", "share");
  const facts = [...from.guides].filter(([, guide]) => ["category", "count", "total"].includes(guide.role) && guide.opacity === 1);
  for (const t of [.01, .4, .8, .99]) {
    const pose = blendView(from, to, t);
    assert.ok(facts.every(([id, guide]) => pose.guides.get(id).text === guide.text && pose.guides.get(id).opacity === 1));
  }
});

test("a direct subset to total brings omitted source records into the aggregate handoff", () => {
  const from = makeView("A", "local"), to = makeView("A", "totals");
  const middle = blendView(from, to, .4);
  assert.ok(samples.A.every((row) => middle.nodes.get(row.id)?.opacity > 0));
  assert.equal(blendView(middle, to, 1), to);
});

test("summary routes and rapid retargeting preserve both visible layers without pose jumps", () => {
  const targets = ["A", "B"].flatMap((sample) => [...views, "totals", "share"]
    .map((view) => makeView(sample, view, { slots })));
  for (const from of targets) for (const to of targets) {
    if (!from.aggregates.size && !to.aggregates.size) continue;
    const transition = createTransition(from, { blend: blendView, duration: 1000 });
    transition.target(to, 0);
    const current = transition.sample(430).pose;
    transition.target(from, 430);
    assert.deepEqual(transition.sample(430).pose, current);
    const next = transition.sample(430.01).pose;
    for (const layer of ["nodes", "aggregates", "guides"]) {
      for (const [id, a] of current[layer]) {
        const b = next[layer].get(id);
        assert.ok(b && Math.hypot(b.x - a.x, b.y - a.y) < .002 && Math.abs(b.opacity - a.opacity) < .002);
      }
      assert.ok([...next[layer].values()].every((n) => [n.x, n.y, n.opacity].every(Number.isFinite)
        && n.opacity >= 0 && n.opacity <= 1));
    }
    assert.equal(transition.sample(1430).pose, from);
  }
});

// Operation inputs can belong to another work: no demo sample IDs or field names.
function externalFrame() {
  return {
    nodes: new Map(["first-record", "second-record"].map((id, index) => [id,
      { id, x: 20 + index * 60, y: 60, area: 25, opacity: 1, imageScale: 1 }])),
    guides: new Map([["caption", { id: "caption", group: "objects", role: "category",
      text: "Collection", x: 20, y: 30, opacity: 1 }]]),
    scale: linearScale([0, 10], [0, 100]), numeric: 1, axisOpacity: 1,
    groupOrigins: new Map([["objects", { x: 20, y: 60 }]]), meta: {},
  };
}

test("extraction is usable with an external record frame and survives reverse retargeting", () => {
  const from = externalFrame(), to = externalFrame();
  to.nodes.delete("first-record");
  to.scale = linearScale([5, 10], [0, 100]);
  to.nodes.get("second-record").x = at(to.scale, 8);
  const transition = createTransition(from, { blend: blendExtraction, duration: 1000 });
  transition.target(to, 0);
  const current = transition.sample(400).pose;
  transition.target(from, 400);
  const returned = transition.sample(400.001).pose;
  assert.ok(Math.abs(current.nodes.get("second-record").x - at(current.scale, 8)) < 1e-10
    && Math.abs(returned.nodes.get("second-record").x - current.nodes.get("second-record").x) < .001
    && returned.guides.get("caption").opacity === 1 && transition.sample(1400).pose === from);
});

test("group motion consumes the caller's grouping and moves labels with those records", () => {
  const from = externalFrame(), to = externalFrame();
  to.groupOrigins.set("objects", { x: 120, y: 90 });
  for (const layer of [to.nodes, to.guides]) for (const node of layer.values()) {
    node.x += 100; node.y += 30;
  }
  const pose = blendGroupMove(from, to, .4, () => "objects");
  const dx = pose.nodes.get("first-record").x - from.nodes.get("first-record").x;
  assert.ok(Math.abs(pose.nodes.get("second-record").x - from.nodes.get("second-record").x - dx) < 1e-10
    && Math.abs(pose.guides.get("caption").x - from.guides.get("caption").x - dx) < 1e-10
    && pose.guides.get("caption").text === "Collection");
});

test("a work can change reordering paths without replacing identities or endpoint geometry", () => {
  const from = externalFrame(), to = externalFrame();
  to.numeric = 0; to.axisOpacity = 0;
  to.nodes.get("first-record").x = 80;
  to.nodes.get("second-record").x = 20;
  const route = (a, b) => ({ control1: { x: a.x, y: 0 }, control2: { x: b.x, y: 0 } });
  const current = blendReorder(from, to, .5, route);
  assert.ok(current.nodes.size === from.nodes.size
    && [...current.nodes.values()].every((node) => from.nodes.has(node.id) && node.y < 60)
    && blendReorder(from, to, 0, route) === from && blendReorder(from, to, 1, route) === to);
});
