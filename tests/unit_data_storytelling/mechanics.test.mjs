import test from "node:test";
import assert from "node:assert/strict";
import {
  keyed, linearScale, at, mixScale, areaFor, radiusForArea, lerp,
} from "../../skills/unit-data-storytelling/assets/mechanics/geometry.mjs";
import {
  quantize, gridLayout, groupLayout, stackLayout, maskSlots, slotLayout,
} from "../../skills/unit-data-storytelling/assets/mechanics/units.mjs";
import {
  blendNodes, createTransition, createPlayer, flowPoint,
} from "../../skills/unit-data-storytelling/assets/mechanics/motion.mjs";
import {
  selectStep, observeSteps,
} from "../../skills/unit-data-storytelling/assets/mechanics/scroll.mjs";

const bounds = { x: 10, y: 20, width: 100, height: 100 };
const records = [{ id: "a", weight: 1 }, { id: "b", weight: 4 }];
const node = (id, x, area = 16) => ({ id, x, y: 0, area, opacity: 1 });

test("flow trajectory holds delayed starts and returns exact endpoints", () => {
  const from = { x: 12, y: 34 }, to = { x: 540, y: 270 };
  const options = { amplitude: 80, phase: 2.4, turns: 1.5, delay: .2 };
  assert.deepEqual([flowPoint(from, to, 0, options), flowPoint(from, to, .1, options),
    flowPoint(from, to, 1, options)], [from, from, to]);
});

test("flow trajectory is deterministic and leaves its input poses untouched", () => {
  const from = Object.freeze({ x: 0, y: 0 }), to = Object.freeze({ x: 400, y: 200 });
  const options = Object.freeze({ control1: { x: 50, y: 250 }, control2: { x: 350, y: -50 },
    amplitude: 30, turns: 2, phase: .7 });
  const values = Array.from({ length: 21 }, (_, i) => flowPoint(from, to, i / 20, options));
  assert.deepEqual(values, Array.from({ length: 21 }, (_, i) => flowPoint(from, to, i / 20, options)));
});

test("zero disturbance preserves the chosen Bezier geometry", () => {
  assert.deepEqual(flowPoint({ x: 0, y: 0 }, { x: 80, y: 0 }, .5, {
    control1: { x: 0, y: 80 }, control2: { x: 80, y: 80 },
  }), { x: 40, y: 60 });
});

test("flow rejects invalid channels and an unreachable delayed endpoint", () => {
  for (const options of [{ amplitude: -1 }, { phase: NaN }, { delay: 1 }, { delay: -.1 }]) {
    assert.throws(() => flowPoint({ x: 0, y: 0 }, { x: 1, y: 1 }, .5, options), /Flow needs/);
  }
});

function clock() {
  let time = 0, nextId = 0;
  const queued = new Map();
  return {
    queued,
    now: () => time,
    requestFrame(callback) { const id = ++nextId; queued.set(id, callback); return id; },
    cancelFrame(id) { queued.delete(id); },
    tick(nextTime) {
      time = nextTime;
      const callbacks = [...queued.values()];
      queued.clear();
      callbacks.forEach((callback) => callback(time));
    },
  };
}

test("display identity rejects duplicated instances", () => {
  assert.throws(() => keyed([{ id: "same" }, { id: "same" }]), /unique/);
});

test("interpolated linear scale preserves the position of a shared numeric anchor", () => {
  const a = linearScale([0, 100], [0, 800]);
  const b = linearScale([40, 60], [0, 800]);
  const mixed = mixScale(a, b, 0.25);
  assert.equal(at(mixed, 45), lerp(at(a, 45), at(b, 45), 0.25));
});

test("a degenerate domain is rejected instead of generating invalid positions", () => {
  assert.throws(() => linearScale([10, 10], [0, 100]), /increasing domain/);
});

test("four times the weight gives four times the area and twice the radius", () => {
  const small = areaFor(3, 20), large = areaFor(12, 20);
  assert.deepEqual([large / small, radiusForArea(large) / radiusForArea(small)], [4, 2]);
});

test("area rejects negative weights and overflow", () => {
  for (const args of [[-1, 20], [Number.MAX_VALUE, 2]]) {
    assert.throws(() => areaFor(...args), /nonnegative|finite range/);
  }
});

test("fixed quantity units conserve each source total and expose its remainder", () => {
  const packed = quantize([{ id: "a", value: 12.5 }, { id: "b", value: 5 }], { quantum: 5 });
  assert.deepEqual({
    total: packed.total,
    a: packed.units.filter((u) => u.sourceId === "a").map((u) => [u.amount, u.fraction]),
    b: packed.units.filter((u) => u.sourceId === "b").reduce((sum, u) => sum + u.amount, 0),
  }, { total: 17.5, a: [[5, 1], [5, 1], [2.5, 0.5]], b: 5 });
});

test("floating point noise does not create an extra almost-empty unit", () => {
  const value = 0.1 + 0.2;
  const packed = quantize([{ id: "decimal", value }], { quantum: 0.1 });
  assert.deepEqual([
    packed.units.length,
    Math.abs(packed.units.reduce((sum, u) => sum + u.amount, 0) - value) < 1e-14,
  ], [3, true]);
});

test("a small positive amount remains a fractional unit rather than disappearing as zero", () => {
  const packed = quantize([{ id: "small", value: 1e-18 }], { quantum: 1 });
  assert.deepEqual(packed.units.map((u) => [u.amount, u.fraction]), [[1e-18, 1e-18]]);
});

test("zero is empty while missing, negative and non-finite totals are rejected", () => {
  assert.equal(quantize([{ id: "zero", value: 0 }], { quantum: 1 }).units.length, 0);
  for (const value of [null, undefined, -1, Infinity, NaN]) {
    assert.throws(() => quantize([{ id: "invalid", value }], { quantum: 1 }), /Invalid/);
  }
});

test("aggregate identity survives source ordering but not a change of unit calibration", () => {
  const totals = [{ id: "a", value: 10 }, { id: "b", value: 5 }];
  const ids = (rows, quantum) => quantize(rows, { quantum }).units.map((u) => u.id).sort();
  const original = ids(totals, 5);
  assert.deepEqual([
    JSON.stringify(original) === JSON.stringify(ids([...totals].reverse(), 5)),
    ids(totals, 2.5).some((id) => original.includes(id)),
  ], [true, false]);
});

test("aggregate allocation stops at the explicit budget instead of silently changing the unit", () => {
  assert.throws(() => quantize([{ id: "a", value: 10 }], { quantum: 1, maxUnits: 9 }), /maxUnits/);
});

test("changing area preserves centers when order and reserved cells are retained", () => {
  const count = gridLayout(records, { bounds, cell: 20, areaOf: () => 10 });
  const weighted = gridLayout(records, { bounds, cell: 20, areaOf: (r) => areaFor(r.weight, 10) });
  assert.deepEqual([...weighted.values()].map((n) => [n.x, n.y]), [...count.values()].map((n) => [n.x, n.y]));
});

test("grid capacity and oversize units require an explicit new layout", () => {
  assert.throws(() => gridLayout(records, { bounds: { ...bounds, width: 20, height: 20 }, cell: 20 }), /capacity/);
  assert.throws(() => gridLayout(records, { bounds, cell: 20, areaOf: () => 500 }), /reserved grid cell/);
});

test("grid layout does not change source records", () => {
  const immutable = records.map((record) => Object.freeze({ ...record }));
  gridLayout(immutable, { bounds, cell: 20 });
  assert.deepEqual(immutable, records);
});

test("group regions and internal layouts are independent caller decisions", () => {
  const input = [{ id: "a", group: "left" }, { id: "b", group: "right" }, { id: "c", group: "left" }];
  const result = groupLayout(input, {
    groupBy: (row) => row.group,
    boundsByGroup: new Map([["left", bounds], ["right", { ...bounds, x: 500 }]]),
    layout: (rows, { bounds: region }) => gridLayout([...rows].reverse(), { bounds: region, cell: 20 }),
  });
  assert.deepEqual([...result.values()].map((n) => [n.id, n.x]), [["c", 20], ["a", 40], ["b", 510]]);
});

test("group layout refuses missing regions and dropped or substituted drawing identities", () => {
  const options = { groupBy: () => "group", boundsByGroup: new Map([["group", bounds]]) };
  assert.throws(() => groupLayout(records, { ...options, boundsByGroup: new Map(), layout: () => new Map() }), /Missing layout region/);
  for (const result of [new Map(), new Map([["a", node("a", 0)], ["other", node("other", 1)]]),
    new Map([["a", node("b", 0)], ["b", node("a", 1)]])]) {
    assert.throws(() => groupLayout(records, { ...options, layout: () => result }), /every drawing id/);
  }
});

const stackOptions = {
  bounds: { x: 0, y: 0, width: 200, height: 120 },
  scale: linearScale([0, 10], [15, 185]), valueOf: (row) => row.value,
  crossStart: 100, crossStep: -22, gap: 2, areaOf: () => Math.PI * 5 ** 2,
};

test("axis stacking preserves exact values and uses perpendicular lanes for overlaps", () => {
  const rows = [{ id: "b", value: 5 }, { id: "a", value: 5 }, { id: "c", value: 5.2 }, { id: "d", value: 9 }];
  const result = stackLayout(rows, stackOptions);
  assert.deepEqual([...result.values()].map((n) => [n.id, n.x, n.y]), [
    ["a", 100, 100], ["b", 100, 78], ["c", at(stackOptions.scale, 5.2), 56], ["d", 168, 100],
  ]);
});

test("stack layout is deterministic without modifying source order or values", () => {
  const rows = Object.freeze([Object.freeze({ id: "b", value: 4 }), Object.freeze({ id: "a", value: 4 })]);
  assert.deepEqual(stackLayout(rows, stackOptions), stackLayout([...rows].reverse(), stackOptions));
});

test("vertical stacking accepts a reversed value scale without shifting numeric positions", () => {
  const result = stackLayout([{ id: "a", value: 4 }, { id: "b", value: 4 }], {
    ...stackOptions, axis: "y", scale: linearScale([0, 10], [100, 20]), crossStart: 20, crossStep: 22,
  });
  assert.deepEqual([...result.values()].map((n) => [n.x, n.y]), [[20, 68], [42, 68]]);
});

test("image footprints prevent collisions even when the encoded circular area is small", () => {
  const result = stackLayout([{ id: "a", value: 2 }, { id: "b", value: 3 }], {
    ...stackOptions, crossStep: -32, extentOf: () => ({ width: 40, height: 28 }),
  });
  assert.deepEqual([...result.values()].map((n) => n.y), [100, 68]);
});

test("stack refuses overflowing density or insufficient lane spacing instead of dropping records", () => {
  const rows = Array.from({ length: 8 }, (_, i) => ({ id: String(i), value: 5 }));
  assert.throws(() => stackLayout(rows, stackOptions), /Stack capacity/);
  assert.throws(() => stackLayout(rows.slice(0, 1), { ...stackOptions, crossStep: 5 }), /Lane step/);
});

test("stack refuses out-of-range and missing values or invalid image footprints", () => {
  for (const value of [null, NaN, Infinity]) {
    assert.throws(() => stackLayout([{ id: "bad", value }], stackOptions), /Invalid value/);
  }
  assert.throws(() => stackLayout([{ id: "outside", value: 20 }], stackOptions), /exceeds bounds/);
  assert.throws(() => stackLayout([{ id: "bad", value: 5 }], {
    ...stackOptions, extentOf: () => ({ width: -1, height: 1 }),
  }), /Invalid value/);
});

test("slot assignment is unique and deterministic under input reordering", () => {
  const slots = maskSlots(5, 5, (x, y) => x + y <= 1);
  const a = slotLayout(records, slots, { bounds });
  const b = slotLayout([...records].reverse(), slots, { bounds });
  assert.deepEqual({
    same: JSON.stringify([...a]) === JSON.stringify([...b]),
    positions: new Set([...a.values()].map((n) => JSON.stringify([n.x, n.y]))).size,
  }, { same: true, positions: records.length });
});

test("slot layout includes radius in boundary placement", () => {
  const slots = [{ x: 0, y: 0 }, { x: 1, y: 1 }];
  const pose = slotLayout(records, slots, { bounds, areaOf: () => Math.PI * 25 });
  assert.deepEqual([...pose.values()].map((n) => [n.x, n.y]), [[15, 25], [105, 115]]);
});

test("slot layout does not duplicate records to fill a shape", () => {
  assert.throws(() => slotLayout(records, [{ x: 0, y: 0 }], { bounds }), /Not enough/);
  assert.throws(() => slotLayout(records, [{ x: 0, y: 0 }, { x: 0, y: 0 }], { bounds }), /unique normalized/);
});

test("node blending preserves the moving identity and separately enters and exits records", () => {
  const from = new Map([["keep", node("keep", 0)], ["exit", node("exit", 10)]]);
  const to = new Map([["keep", node("keep", 100, 64)], ["enter", node("enter", 20)]]);
  const middle = blendNodes(from, to, 0.5);
  assert.deepEqual([...middle.values()].map((n) => [n.id, n.x, n.area, n.opacity]), [
    ["keep", 50, 40, 1], ["exit", 10, 16, 0.5], ["enter", 20, 16, 0.5],
  ]);
});

test("node blending returns the complete target without retired records", () => {
  const from = new Map([["old", node("old", 0)]]);
  const to = new Map([["new", node("new", 10)]]);
  assert.equal(blendNodes(from, to, 1), to);
});

test("connecting transition reaches its complete target without further scrolling", () => {
  const transition = createTransition(0, { blend: lerp, duration: 1000 });
  transition.target(10, 0);
  assert.deepEqual(transition.sample(1200), { pose: 10, progress: 1, moving: false });
});

test("a reverse target begins at the current pose instead of restarting from the previous stop", () => {
  const transition = createTransition(0, { blend: lerp, duration: 1000 });
  transition.target(10, 0);
  transition.target(-10, 500);
  assert.deepEqual([transition.sample(500).pose, transition.sample(1500).pose], [5, -10]);
});

test("player paints immediately and settles only on the newest target", () => {
  const time = clock(), seen = [];
  const player = createPlayer(0, { ...time, blend: lerp, render: (pose) => seen.push(pose), duration: 1000 });
  const initial = seen[0];
  player.goTo(10);
  time.tick(500);
  player.goTo(20);
  const pending = time.queued.size;
  time.tick(1500);
  assert.deepEqual([initial, seen.at(-2), seen.at(-1), pending, time.queued.size], [0, 5, 20, 1, 0]);
});

test("disposing the player cancels frames and prevents further painting", () => {
  const time = clock(), seen = [];
  const player = createPlayer(0, { ...time, blend: lerp, render: (pose) => seen.push(pose) });
  player.goTo(10);
  player.dispose();
  player.goTo(20);
  time.tick(1000);
  assert.deepEqual([time.queued.size, seen], [0, [0, 0]]);
});

test("step selection uses a buffer in both directions at reading boundaries", () => {
  assert.deepEqual([
    selectStep([0, 510, 1000], 500, 0),
    selectStep([0, 487, 1000], 500, 0),
    selectStep([0, 511, 1000], 500, 1),
    selectStep([0, 513, 1000], 500, 1),
  ], [0, 1, 1, 0]);
});

test("step selection permits direct forward and backward jumps", () => {
  assert.deepEqual([
    selectStep([-3000, -2000, -1000, 0], 500, 0),
    selectStep([0, 1000, 2000, 3000], 500, 3),
    selectStep([], 500),
  ], [3, 0, -1]);
});

test("step observer yields ownership during exploration and removes its listeners on disposal", (t) => {
  const time = clock(), listeners = new Map(), seen = [];
  const replacements = {
    requestAnimationFrame: time.requestFrame,
    cancelAnimationFrame: time.cancelFrame,
    innerHeight: 1000,
    addEventListener: (name, listener) => listeners.set(name, listener),
    removeEventListener: (name) => listeners.delete(name),
  };
  for (const [name, value] of Object.entries(replacements)) {
    const original = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
    t.after(() => original ? Object.defineProperty(globalThis, name, original) : delete globalThis[name]);
  }
  let positions = [0, 1000];
  const elements = [0, 1].map((i) => ({ getBoundingClientRect: () => ({ top: positions[i] }) }));
  const observer = observeSteps(elements, (index) => seen.push(index));
  time.tick(0);
  observer.setEnabled(false);
  positions = [-1000, 0];
  listeners.get("scroll")();
  time.tick(10);
  observer.setEnabled(true);
  time.tick(20);
  observer.dispose();
  observer.refresh();
  assert.deepEqual([seen, listeners.size, time.queued.size], [[0, 1], 0, 0]);
});
