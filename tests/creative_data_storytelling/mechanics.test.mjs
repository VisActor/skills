import test from "node:test";
import assert from "node:assert/strict";
import { accumulationSegments, areaFor, at, keyed, linearScale, mixScale, radiusForArea, visibleDomain } from "../../skills/creative-data-storytelling/assets/runtime/geometry.mjs";
import { blendNodes, blendWithAnnotations, createPlayer, createTransition } from "../../skills/creative-data-storytelling/assets/runtime/motion.mjs";
import { distributionLayout, groupLayout, maskSlots, silhouetteLayout } from "../../skills/creative-data-storytelling/assets/runtime/units.mjs";
import { reserveStageExit, selectStep } from "../../skills/creative-data-storytelling/assets/runtime/scroll.mjs";
import { createStage } from "../../skills/creative-data-storytelling/assets/runtime/stage.mjs";

const rows = [
  { id: "a", group: "A", value: 20, weight: 1 },
  { id: "b", group: "A", value: 20, weight: 4 },
  { id: "c", group: "B", value: 80, weight: 9 },
];
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, a + " != " + b);

function exitFixture({ initialHeight = "", initialPriority = "", spacerTop = 2600 } = {}) {
  let height = initialHeight, priority = initialPriority, frameId = 0;
  const frames = new Map(), listeners = new Map(), observers = [];
  const dimensions = { sticky: 900, top: 18, end: 2500, spacerTop, scroll: 0, position: "sticky" };
  const view = {
    innerHeight: 900,
    getComputedStyle: () => ({ position: dimensions.position, top: `${dimensions.top}px` }),
    requestAnimationFrame(fn) { frames.set(++frameId, fn); return frameId; },
    cancelAnimationFrame(id) { frames.delete(id); },
    addEventListener(name, fn) { listeners.set(name, fn); },
    removeEventListener(name) { listeners.delete(name); },
    ResizeObserver: class {
      constructor(fn) { this.callback = fn; this.elements = []; observers.push(this); }
      observe(element) { this.elements.push(element); }
      disconnect() { this.elements = []; }
    },
  };
  const sticky = { getBoundingClientRect: () => ({ height: dimensions.sticky }) };
  const readingEnd = { getBoundingClientRect: () => ({ bottom: dimensions.end - dimensions.scroll }) };
  const spacer = {
    parentElement: {}, getBoundingClientRect: () => ({ top: dimensions.spacerTop - dimensions.scroll }),
    style: {
      getPropertyValue: () => height, getPropertyPriority: () => priority,
      setProperty(_, value, nextPriority = "") { height = value; priority = nextPriority; },
      removeProperty() { height = ""; priority = ""; },
    },
  };
  const options = { sticky, readingEnd, spacer, view };
  return {
    options, dimensions, view, frames, listeners, observers,
    get height() { return height; }, get priority() { return priority; },
    tick() { const work = [...frames.values()]; frames.clear(); work.forEach((fn) => fn()); },
    reflow() { observers.forEach((observer) => observer.callback()); },
  };
}

test("stage exit keeps the last paragraph at the reading line when the sticky stage releases", () => {
  const f = exitFixture();
  const exit = reserveStageExit(f.options);
  const containerEnd = f.dimensions.spacerTop + Number.parseFloat(f.height);
  const releaseScroll = containerEnd - f.dimensions.sticky - f.dimensions.top;
  close(f.dimensions.end - releaseScroll, 360);
  exit.dispose();
});

test("stage exit remeasurement does not accumulate space or depend on scroll position", () => {
  const f = exitFixture();
  const exit = reserveStageExit(f.options);
  const initial = f.height;
  for (const scroll of [0, 1800, 2600, 300]) {
    f.dimensions.scroll = scroll;
    exit.refresh(); f.reflow(); f.tick();
    assert.equal(f.height, initial);
  }
  exit.dispose();
});

test("stage exit adds no space when the existing final paragraph interval is sufficient", () => {
  const f = exitFixture({ spacerTop: 3200 });
  const exit = reserveStageExit(f.options);
  assert.equal(f.height, "0px");
  exit.dispose();
});

test("stage exit follows graphic and text reflow then releases excess space on resize", () => {
  const f = exitFixture();
  const exit = reserveStageExit(f.options);
  f.dimensions.sticky = 1000;
  f.dimensions.end = 2600;
  f.dimensions.spacerTop = 2650;
  f.reflow(); f.tick();
  assert.equal(f.height, "608px");
  f.dimensions.sticky = 400;
  f.view.innerHeight = 1200;
  f.listeners.get("resize")(); f.tick();
  assert.equal(f.height, "0px");
  exit.dispose();
});

test("stage exit clears its reserve when the layout stops using a sticky stage", () => {
  const f = exitFixture();
  const exit = reserveStageExit(f.options);
  f.dimensions.position = "static";
  exit.refresh(); f.tick();
  assert.equal(f.height, "0px");
  exit.dispose();
});

test("stage exit disposal restores the spacer and removes pending work and observers", () => {
  const f = exitFixture({ initialHeight: "32px", initialPriority: "important" });
  const exit = reserveStageExit(f.options);
  exit.refresh(); exit.dispose(); exit.dispose(); exit.refresh();
  assert.deepEqual({ height: f.height, priority: f.priority, listeners: f.listeners.size,
    frames: f.frames.size, observed: f.observers[0].elements.length },
  { height: "32px", priority: "important", listeners: 0, frames: 0, observed: 0 });
});

test("stage exit rejects invalid geometry and reader placement options", () => {
  const f = exitFixture();
  assert.throws(() => reserveStageExit({ ...f.options, releaseRatio: 1.1 }), /releaseRatio/);
  f.dimensions.top = Number.NaN;
  assert.throws(() => reserveStageExit(f.options), /finite top inset/);
});

function stageFixture({ scrollY = 0, ids = ["a", "b", "c"] } = {}) {
  let time = 0, frameId = 0, width = 800, factor = 1, last;
  const frames = new Map(), listeners = new Map(), observers = [], renders = [], layouts = [];
  const view = {
    innerHeight: 600, performance: { now: () => time },
    requestAnimationFrame(fn) { frames.set(++frameId, fn); return frameId; },
    cancelAnimationFrame(id) { frames.delete(id); },
    addEventListener(name, fn) {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name).add(fn);
    },
    removeEventListener(name, fn) { listeners.get(name)?.delete(fn); },
    ResizeObserver: class {
      constructor(fn) { this.callback = fn; observers.push(this); }
      observe() { this.connected = true; }
      disconnect() { this.connected = false; }
    },
  };
  const element = { ownerDocument: { defaultView: view }, getBoundingClientRect: () => ({ width, height: 400 }) };
  const steps = ids.map((id, i) => ({ id, element: { getBoundingClientRect: () => ({ top: i * 800 - scrollY }) } }));
  const stage = createStage({
    element, steps, duration: 100,
    layout(id, size) {
      layouts.push(id);
      return { id, x: ({ a: 0.1, b: 0.5, c: 0.9, detail: 0.7 })[id] * size.width * factor };
    },
    blend: (a, b, t) => ({ ...b, x: a.x + (b.x - a.x) * t }),
    render(pose, frame) { last = { pose, frame }; renders.push(last); },
  });
  function emit(name) { listeners.get(name)?.forEach((fn) => fn()); }
  return {
    stage, frames, listeners, observers, layouts, renders, get last() { return last; },
    tick(now) {
      time = now;
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach((fn) => fn(now));
    },
    scroll(y) { scrollY = y; emit("scroll"); },
    resize(value) { width = value; emit("resize"); },
    reflow(value) { width = value; observers.forEach((observer) => observer.callback()); },
    setFactor(value) { factor = value; },
  };
}

test("stage paints the current reading state on direct entry without first showing another state", () => {
  const f = stageFixture({ scrollY: 850 });
  assert.equal(f.last.pose.id, "b");
  assert.equal(f.last.frame.moving, false);
  f.tick(0);
  assert.deepEqual(f.layouts, ["b"]);
  f.stage.dispose();
});

test("stage finishes its transition after scrolling stops", () => {
  const f = stageFixture();
  f.tick(0);
  f.scroll(800);
  f.tick(10);
  f.tick(60);
  assert.ok(f.last.pose.x > 80 && f.last.pose.x < 400);
  f.tick(110);
  assert.deepEqual(f.stage.sample(), { readingIndex: 1, targetId: "b", pose: { id: "b", x: 400 }, moving: false, progress: 1 });
  assert.equal(f.frames.size, 0);
  f.stage.dispose();
});

test("stage interruption starts at the visible pose and reverse scroll selects the newest target", () => {
  const f = stageFixture();
  f.tick(0);
  f.scroll(800);
  f.tick(10);
  f.tick(60);
  const visible = f.last.pose.x;
  f.stage.goTo("c");
  assert.equal(f.last.pose.x, visible);
  assert.equal(f.frames.size, 1);
  f.scroll(0);
  f.tick(70);
  f.tick(170);
  assert.equal(f.stage.sample().targetId, "a");
  assert.equal(f.last.pose.x, 80);
  assert.equal(f.last.frame.moving, false);
  f.stage.dispose();
});

test("successive paragraphs may share a state without restarting its animation", () => {
  const f = stageFixture({ ids: ["a", "a", "b"] });
  f.tick(0);
  f.scroll(800);
  f.tick(10);
  assert.deepEqual(f.layouts, ["a"]);
  assert.equal(f.frames.size, 0);
  f.stage.dispose();
});

test("stage recomputes the same state after window resize and container-only reflow", () => {
  const f = stageFixture();
  f.tick(0);
  f.resize(1000);
  f.tick(10);
  assert.equal(f.last.pose.x, 100);
  f.reflow(1200);
  f.tick(20);
  assert.equal(f.last.pose.x, 120);
  assert.equal(f.stage.sample().targetId, "a");
  assert.equal(f.last.frame.moving, false);
  f.stage.dispose();
});

test("exploration keeps its target during scrolling and resizing then resumes at the current paragraph", () => {
  const f = stageFixture();
  f.tick(0);
  f.stage.setReadingEnabled(false);
  f.stage.goTo("detail", { immediate: true });
  f.scroll(1600);
  f.resize(1000);
  f.tick(10);
  assert.equal(f.stage.sample().targetId, "detail");
  assert.equal(f.last.pose.x, 700);
  f.stage.setReadingEnabled(true);
  f.tick(20);
  f.tick(120);
  assert.equal(f.stage.sample().targetId, "c");
  assert.equal(f.last.pose.x, 900);
  f.stage.dispose();
});

test("explicit refresh recomputes changed source or control values without a size change", () => {
  const f = stageFixture();
  f.tick(0);
  f.stage.setReadingEnabled(false);
  f.setFactor(2);
  f.stage.refresh();
  f.tick(10);
  assert.equal(f.last.pose.x, 160);
  assert.equal(f.last.frame.moving, false);
  f.stage.dispose();
});

test("stage disposal releases its listeners, resize observer and animation without later revival", () => {
  const f = stageFixture();
  f.tick(0);
  f.stage.goTo("b");
  f.stage.dispose();
  const count = f.renders.length;
  assert.equal(f.frames.size, 0);
  assert.ok([...f.listeners.values()].every((set) => set.size === 0));
  assert.ok(f.observers.every((observer) => !observer.connected));
  f.stage.setReadingEnabled(true);
  f.stage.goTo("c");
  f.stage.refresh();
  f.scroll(1600);
  f.reflow(1200);
  f.tick(200);
  assert.equal(f.renders.length, count);
});

test("display identity rejects duplicate instances rather than overwriting observations", () => {
  assert.throws(() => keyed([{ id: "a" }, { id: "a" }]), /unique/);
});
test("weight changes area proportionally, including zero", () => {
  const one = radiusForArea(areaFor(1, 8));
  close(radiusForArea(areaFor(4, 8)), one * 2);
  assert.equal(radiusForArea(areaFor(0, 8)), 0);
  assert.throws(() => areaFor(-1, 8), /nonnegative/);
});
test("axis and retained data anchors share one affine transform throughout zoom", () => {
  const a = linearScale([0, 100], [20, 800]), b = linearScale([35, 65], [20, 800]);
  for (const t of [0, 0.13, 0.6, 1]) for (const value of [42, 50, 54]) {
    close(at(mixScale(a, b, t), value), at(a, value) * (1 - t) + at(b, value) * t);
  }
});
test("nodes preserve identities during entries and exits and finish with the target set", () => {
  const node = (id, x) => ({ id, row: { name: id }, x, y: 0, area: 10, opacity: 1 });
  const a = keyed([node("stay", 0), node("leave", 3)]);
  const b = keyed([node("stay", 10), node("enter", 8)]);
  const middle = blendNodes(a, b, 0.5);
  assert.equal(middle.get("stay").x, 5);
  assert.equal(middle.get("leave").opacity, 0.5);
  assert.equal(middle.get("enter").opacity, 0.5);
  assert.equal(middle.get("stay").row, b.get("stay").row);
  assert.deepEqual([...blendNodes(a, b, 1).keys()], ["stay", "enter"]);
  assert.equal(a.get("stay").x, 0);
});
test("interrupted movement restarts from the visible pose and the newest target wins", () => {
  const motion = createTransition(0, { blend: (a, b, t) => a + (b - a) * t, duration: 100 });
  motion.target(10, 0);
  const visible = motion.sample(45).pose;
  motion.target(-5, 45);
  assert.equal(motion.sample(45).pose, visible);
  assert.deepEqual(motion.sample(145), { pose: -5, moving: false, progress: 1 });
});
test("player completes after input stops, maintains one frame, and explicit immediate targets cancel pending frames", () => {
  let now = 0, id = 0, rendered;
  const queue = new Map();
  const player = createPlayer(0, {
    blend: (a, b, t) => a + (b - a) * t, duration: 100,
    render: (pose) => { rendered = pose; }, now: () => now,
    requestFrame: (fn) => { queue.set(++id, fn); return id; },
    cancelFrame: (key) => queue.delete(key),
  });
  function tick(time) {
    now = time;
    const scheduled = [...queue.values()];
    queue.clear();
    scheduled.forEach((fn) => fn(time));
  }
  player.goTo(10);
  tick(25);
  player.goTo(20);
  assert.equal(queue.size, 1);
  tick(125);
  assert.equal(rendered, 20);
  assert.equal(queue.size, 0);
  player.goTo(30);
  player.goTo(30, { immediate: true });
  assert.equal(rendered, 30);
  assert.equal(queue.size, 0);
  player.dispose();
  player.goTo(40);
  assert.equal(rendered, 30);
});
test("count to weight retains centers and one calibration across groups", () => {
  const options = { width: 860, height: 460, areaPerUnit: 5 };
  const count = groupLayout(rows, ["A", "B"], options);
  const weighted = groupLayout(rows, ["A", "B"], { ...options, weighted: true });
  for (const row of rows) {
    assert.equal(count.get(row.id).x, weighted.get(row.id).x);
    assert.equal(count.get(row.id).y, weighted.get(row.id).y);
    assert.equal(weighted.get(row.id).area, row.weight * 5);
  }
});
test("distribution uses measured horizontal anchors; duplicate values stack only vertically", () => {
  const result = distributionLayout(rows, ["A", "B"], { width: 860, height: 460 });
  assert.equal(result.nodes.get("a").x, result.nodes.get("b").x);
  assert.notEqual(result.nodes.get("a").y, result.nodes.get("b").y);
  close(result.nodes.get("c").x, at(result.scale, 80));
});
test("mask assignment is one-to-one, deterministic under row reordering, and refuses insufficient slots", () => {
  const slots = maskSlots(8, 8, (x, y) => x > 0.2 && y > 0.2);
  const box = { x: 0, y: 0, width: 100, height: 100 };
  const a = silhouetteLayout(rows, slots, box);
  assert.deepEqual(a, silhouetteLayout([...rows].reverse(), slots, box));
  assert.equal(new Set([...a.values()].map((p) => p.x + ":" + p.y)).size, rows.length);
  assert.throws(() => silhouetteLayout(rows, slots.slice(0, 2), box), /Insufficient/);
});
test("scroll boundaries have hysteresis while fast travel can skip to the appropriate state", () => {
  assert.equal(selectStep([0, 100, 200], 100, 0, 12), 0);
  assert.equal(selectStep([0, 100, 200], 113, 0, 12), 1);
  assert.equal(selectStep([0, 100, 200], 90, 1, 12), 1);
  assert.equal(selectStep([0, 100, 200], 87, 1, 12), 0);
  assert.equal(selectStep([0, 100, 200], 230, 0, 12), 2);
});

test("locator boundaries derive from the visible main scale throughout a zoom", () => {
  const range = [85, 805];
  const global = linearScale([2012, 2024], range), local = linearScale([2018, 2024], range);
  for (const t of [0, 0.17, 0.5, 0.91, 1]) {
    const scale = mixScale(global, local, t);
    const [lo, hi] = visibleDomain(scale, range);
    close(at(scale, lo), range[0]);
    close(at(scale, hi), range[1]);
    assert.ok(at(global, lo) >= range[0] - 1e-9);
    assert.ok(at(global, hi) <= range[1] + 1e-9);
  }
  visibleDomain(linearScale([0, 10], [100, 0]), [0, 100]).forEach((value, i) => close(value, [0, 10][i]));
  assert.throws(() => visibleDomain({ k: 0, b: 2 }, range), /invertible/);
});

test("additive segments preserve identities, adjacency and amounts when the base changes", () => {
  const records = [{ id: "b", amount: 18 }, { id: "a", amount: 27 }, { id: "c", amount: 0 }];
  const zero = accumulationSegments(0, records), based = accumulationSegments(40, records);
  assert.equal(based.total, 85);
  assert.deepEqual(based.segments.map((item) => item.id), ["b", "a", "c"]);
  based.segments.forEach((segment, i) => {
    assert.equal(segment.row, records[i]);
    close(segment.start, i ? based.segments[i - 1].end : based.base);
    close(segment.end - segment.start, records[i].amount);
    close(segment.start - zero.segments[i].start, 40);
  });
  assert.deepEqual(accumulationSegments(8, []), { base: 8, segments: [], total: 8 });
});

test("additive geometry refuses ambiguous ids, negative amounts and overflowing totals", () => {
  assert.throws(() => accumulationSegments(0, [{ id: "a", amount: 1 }, { id: "a", amount: 2 }]), /unique/);
  assert.throws(() => accumulationSegments(0, [{ id: "a", amount: -1 }]), /nonnegative/);
  assert.throws(() => accumulationSegments(-2, []), /base/);
  assert.throws(() => accumulationSegments(0, [{ id: "a", amount: NaN }]), /finite/);
  assert.throws(() => accumulationSegments(Number.MAX_VALUE, [{ id: "a", amount: Number.MAX_VALUE }]), /finite range/);
});

test("moving the same segments to a cumulative base preserves each encoded length", () => {
  const records = [{ id: "one", amount: 18 }, { id: "two", amount: 27 }, { id: "three", amount: 15 }];
  const layout = (base) => keyed(accumulationSegments(base, records).segments.map((segment, i) => ({
    ...segment, y: i * 30, opacity: 1,
  })));
  const scale = linearScale([0, 110], [85, 805]), from = layout(0), to = layout(40);
  for (const t of [0, 0.23, 0.7, 1]) {
    const pose = blendNodes(from, to, t, ["start", "end", "y", "opacity"]);
    for (const node of pose.values())
      close(at(scale, node.end) - at(scale, node.start), scale.k * node.amount);
  }
  assert.equal(from.get("one").start, 0);
  assert.equal(to.get("one").start, 40);
});

// Same pose contract used by the quantitative renderer: fixed facts, changing scale,
// independently keyed annotations. These checks target the observed stale-pair failure.
function comparison(other, value) {
  const values = [42, value], ids = ["P", other];
  return {
    scale: linearScale([Math.min(...values) - 9, Math.max(...values) + 9], [85, 805]),
    nodes: keyed(ids.map((id, i) => ({ id, value: values[i], y: i, opacity: 1 }))),
    annotations: keyed([{ id: ids.join("/"), ids, values, opacity: 1 }]),
  };
}
const blendComparison = (a, b, t) => blendWithAnnotations(a, b, t, (from, to, progress) => ({
  scale: mixScale(from.scale, to.scale, progress),
  nodes: blendNodes(from.nodes, to.nodes, progress, ["y", "opacity", "value"]),
}));
function assertComparisonReadable(pose) {
  for (const label of pose.annotations.values()) for (const [i, id] of label.ids.entries()) {
    const node = pose.nodes.get(id);
    assert.equal(node.opacity, 1, "visible annotation must refer to fully present objects");
    assert.equal(node.value, label.values[i], "label fact must match the displayed object");
    const x = at(pose.scale, node.value);
    assert.ok(x >= 85 - 1e-9 && x <= 805 + 1e-9, "comparison endpoint must stay in the plot");
  }
}
test("comparison annotations retire before marks move and appear only after the new pair lands", () => {
  const q = comparison("Q", 54), d = comparison("D", 94);
  for (const [a, b] of [[q, d], [d, q]]) {
    for (let i = 0; i <= 100; i++) assertComparisonReadable(blendComparison(a, b, i / 100));
    assert.deepEqual(blendComparison(a, b, 0), a);
    assert.deepEqual(blendComparison(a, b, 1), b);
    assert.equal(blendComparison(a, b, 0.5).annotations.size, 0);
  }
});
test("interrupting an annotation handoff preserves the sampled pose and reaches the latest comparison", () => {
  const q = comparison("Q", 54), d = comparison("D", 94), a = comparison("A", 22);
  for (const interruptAt of [5, 45, 90]) {
    const transition = createTransition(q, { blend: blendComparison, duration: 100 });
    transition.target(d, 0);
    const visible = transition.sample(interruptAt).pose;
    transition.target(a, interruptAt);
    assert.deepEqual(transition.sample(interruptAt).pose, visible);
    for (let elapsed = 0; elapsed <= 100; elapsed++) assertComparisonReadable(transition.sample(interruptAt + elapsed).pose);
    assert.deepEqual(transition.sample(interruptAt + 100).pose, a);
  }
});
test("retained annotations follow geometry, while annotation-free transitions need no extra phases", () => {
  const a = comparison("Q", 54), b = { ...a, scale: linearScale([0, 100], [85, 805]) };
  const middle = blendComparison(a, b, 0.5);
  assert.equal(middle.annotations.get("P/Q").opacity, 1);
  close(middle.scale.k, (a.scale.k + b.scale.k) / 2);
  const from = { value: 0, annotations: new Map() }, to = { value: 10, annotations: new Map() };
  const pose = blendWithAnnotations(from, to, 0.5, (x, y, t) => ({ value: x.value + (y.value - x.value) * t }));
  assert.equal(pose.value, 5);
  assert.throws(() => blendWithAnnotations(a, b, 0.5, () => b, { exitEnd: 0.9, enterStart: 0.8 }), /phases/);
});
