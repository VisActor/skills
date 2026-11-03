import test from "node:test";
import assert from "node:assert/strict";
import { createStage } from "../../skills/unit-data-storytelling/assets/mechanics/stage.mjs";

function stageFixture({ scrollY = 0, ids = ["a", "b", "c"] } = {}) {
  let time = 0, frameId = 0, width = 800, factor = 1, last;
  const frames = new Map(), listeners = new Map(), observers = [], renders = [], layouts = [], passages = [];
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
    onStep(index, frame) { passages.push({ index, ...frame }); },
    layout(id, size) {
      layouts.push(id);
      return { id, x: ({ a: 0.1, b: 0.5, c: 0.9, detail: 0.7 })[id] * size.width * factor };
    },
    blend: (a, b, t) => ({ ...b, x: a.x + (b.x - a.x) * t }),
    render(pose, frame) { last = { pose, frame }; renders.push(last); },
  });
  function emit(name) { listeners.get(name)?.forEach((fn) => fn()); }
  return {
    stage, frames, listeners, observers, layouts, renders, passages, get last() { return last; },
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
  assert.deepEqual(f.stage.sample(), { targetId: "b", pose: { id: "b", x: 400 }, moving: false, progress: 1 });
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

test("a new prose passage shares an in-flight target without restarting its clock", () => {
  const f = stageFixture({ ids: ["a", "b", "b"] });
  f.tick(0);
  f.scroll(800);
  f.tick(10);
  f.tick(50);
  f.scroll(1600);
  f.tick(60);
  assert.deepEqual(f.passages.map((passage) => [passage.index, passage.id]), [[0, "a"], [1, "b"], [2, "b"]]);
  assert.equal(f.passages.at(-1).moving, true);
  assert.deepEqual(f.layouts, ["a", "b"]);
  f.tick(110);
  assert.equal(f.last.frame.moving, false);
  assert.equal(f.last.pose.x, 400);
  f.stage.dispose();
});

test("direct entry also selects matching prose before the first rendered frame", () => {
  const f = stageFixture({ scrollY: 850 });
  assert.deepEqual(f.passages.map(({ index, id, previousId, moving }) => ({ index, id, previousId, moving })),
    [{ index: 1, id: "b", previousId: null, moving: false }]);
  f.tick(0);
  assert.equal(f.passages.length, 1);
  f.stage.dispose();
});

test("invalid stage structure fails before installing observers", () => {
  const element = { getBoundingClientRect: () => ({ width: 800, height: 400 }) };
  const base = { element, layout: () => ({}), blend: () => ({}), render() {}, view: { innerHeight: 600 } };
  for (const steps of [[], [{ id: "", element }], [{ id: "a", element }, { id: "b", element }]])
    assert.throws(() => createStage({ ...base, steps }), /Stage needs/);
  assert.throws(() => createStage({ ...base, steps: [{ id: "a", element }], viewportRatio: 2 }), /viewportRatio/);
});
