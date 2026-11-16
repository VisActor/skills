import test from "node:test";
import assert from "node:assert/strict";
import { connectReading } from "../../skills/creative-data-storytelling/assets/stage-wiring/connect.mjs";
import { createReadingTrack, readingScrollTarget } from "../../skills/creative-data-storytelling/assets/runtime/scroll.mjs";

function fixture() {
  let time = 0, scroll = 0, width = 800, frameId = 0, last;
  const frames = new Map(), listeners = new Map(), observed = [];
  const target = () => ({
    addEventListener(name, fn) { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(fn); },
    removeEventListener(name, fn) { listeners.get(name)?.delete(fn); },
  });
  const view = { ...target(), innerHeight: 600, performance: { now: () => time },
    requestAnimationFrame(fn) { frames.set(++frameId, fn); return frameId; },
    cancelAnimationFrame(id) { frames.delete(id); },
    ResizeObserver: class { constructor(fn) { this.fn=fn; observed.push(this); } observe() { this.active=true; } disconnect() { this.active=false; } },
  };
  const doc = { ...target(), defaultView: view, visibilityState: "visible" };
  const cues = ["a", "b"].map((id, i) => ({ dataset: { storyState: id }, getBoundingClientRect: () => ({ top: i * 800 - scroll }) }));
  const reading = { ownerDocument: doc, querySelectorAll(selector) { assert.equal(selector, "[data-story-state]"); return cues; } };
  const element = { ownerDocument: doc, getBoundingClientRect: () => ({ width, height: 300 }) };
  const options = { reading, element, duration: 100,
    layout: id => ({ id, x: ({ a: 0, b: 1, manual: .4 })[id] * width }),
    blend: (a,b,t) => ({ ...b, x: a.x+(b.x-a.x)*t }),
    render: (pose, frame) => { last={pose,frame}; },
  };
  Object.defineProperty(view, "scrollY", { get: () => scroll });
  view.scrollTo = ({ top }) => { scroll = top; listeners.get("scroll")?.forEach(fn => fn()); };
  return { options, listeners, observed, frames, view, doc, cues, get last() { return last; },
    emit(name, event = {}) { listeners.get(name)?.forEach(fn => fn(event)); },
    scroll(value) { scroll=value; this.emit("scroll"); },
    restorePosition(value) { scroll=value; },
    advance(ms) { time+=ms; },
    resize(value) { width=value; this.emit("resize"); },
    tick(ms=0) { time+=ms; const calls=[...frames.values()]; frames.clear(); calls.forEach(fn=>fn(time)); },
  };
}

test("wiring uses only reading cues, completes after stop, and keeps manual selection until resume", () => {
  const f=fixture(), connection=connectReading(f.options);
  f.tick(); assert.equal(f.last.pose.id,"a");
  f.scroll(800); f.tick(); f.tick(40);
  assert.ok(f.last.pose.x>0 && f.last.pose.x<800);
  f.tick(100); assert.equal(f.last.frame.moving,false);
  connection.explore("manual"); f.tick(100);
  f.scroll(0); f.tick(); assert.equal(connection.stage.sample().targetId,"manual");
  connection.resume(); f.tick(); f.tick(100); assert.equal(f.last.pose.x,0);
  connection.dispose(); assert.equal([...f.listeners.values()].flatMap(s=>[...s]).length,0);
  assert.equal(f.frames.size,0); assert.ok(f.observed.every(o=>!o.active));
});

function navigationFixture(hash = "") {
  const f = fixture(), attrs = new Map(), bounds = { top: 0, bottom: 600 };
  const scope = { ownerDocument: f.doc, getBoundingClientRect: () => bounds,
    getAttribute: name => attrs.get(name) ?? null, setAttribute: (name, value) => attrs.set(name, value), removeAttribute: name => attrs.delete(name) };
  const button = () => Object.assign(new EventTarget(), { disabled: false, click() { this.dispatchEvent(new Event("click")); } });
  const previous = button(), next = button();
  f.doc.querySelector = () => null;
  f.view.location = new URL("https://example.test/story.html?version=2" + hash);
  f.view.history = { state: { kept: true }, replaceState(state, _, url) { this.state = state; f.view.location.href = url; } };
  f.options.navigation = { scope, previous, next, hashFor: ({ id }) => id };
  return { ...f, scope, bounds, previous, next,
    key(key, extra = {}) {
      const event = { key, target: { closest: () => null }, defaultPrevented: false,
        preventDefault() { this.defaultPrevented = true; }, ...extra };
      f.emit("keydown", event); return event;
    },
  };
}

test("navigation reads the new document position synchronously and reverses the same running player", () => {
  const f = navigationFixture(), c = connectReading(f.options);
  f.tick(); f.next.click();
  assert.equal(c.stage.sample().readingIndex, 1);
  assert.equal(f.view.scrollY, 602);
  f.tick(40); const midpoint = c.stage.sample().pose.x;
  f.previous.click();
  assert.equal(c.stage.sample().pose.x, midpoint);
  assert.equal(c.stage.sample().readingIndex, 0);
  f.tick(120); assert.equal(c.stage.sample().pose.x, 0);
  c.dispose(); assert.equal(f.scope.getAttribute("data-reading-navigation"), null);
  assert.equal([...f.listeners.values()].flatMap(s => [...s]).length, 0);
  assert.equal(f.frames.size, 0);
});

test("navigation uses actual clamped position instead of claiming an unreachable state", () => {
  const f = navigationFixture(), scrollTo = f.view.scrollTo;
  f.view.scrollTo = ({ top }) => scrollTo({ top: Math.min(top, 200) });
  const c = connectReading(f.options); c.navigate(1);
  assert.equal(c.stage.sample().targetId, "a");
  assert.throws(() => c.navigate("missing"), /valid step/);
  c.dispose();
});

test("recognized deep links restore both reading and pose; unrelated fragments stay untouched", () => {
  const f = navigationFixture("#b"), c = connectReading(f.options);
  assert.equal(c.stage.sample().targetId, "b");
  assert.equal(c.stage.sample().moving, false);
  assert.equal(f.previous.disabled, false);
  assert.deepEqual(f.view.history.state, { kept: true });
  assert.equal(f.view.location.pathname + f.view.location.search, "/story.html?version=2");
  f.view.location.hash = "#conclusion"; f.emit("hashchange");
  assert.equal(c.stage.sample().targetId, "b");
  assert.equal(f.view.location.hash, "#conclusion"); c.dispose();
  const outside = navigationFixture("#top"), other = connectReading(outside.options);
  assert.equal(outside.view.location.hash, "#top"); other.dispose();
});

test("keyboard navigation is scoped and preserves forms, other stages, dialogs and endpoint exit", () => {
  const f = navigationFixture(), c = connectReading(f.options);
  assert.equal(f.key("ArrowUp").defaultPrevented, false);
  f.bounds.top = 650; f.bounds.bottom = 1250;
  assert.equal(f.key("ArrowDown").defaultPrevented, false);
  f.bounds.top = 0; f.bounds.bottom = 600;
  assert.equal(f.key("ArrowDown", { ctrlKey: true }).defaultPrevented, false);
  assert.equal(f.key("ArrowDown", { target: { closest: selector => selector.startsWith("input") ? {} : null } }).defaultPrevented, false);
  assert.equal(f.key("ArrowDown", { target: { closest: () => ({}) } }).defaultPrevented, false);
  f.doc.querySelector = () => ({});
  assert.equal(f.key("ArrowDown").defaultPrevented, false);
  f.doc.querySelector = () => null;
  assert.equal(f.key("ArrowDown").defaultPrevented, true);
  assert.equal(c.stage.sample().readingIndex, 1);
  assert.equal(f.key("ArrowDown").defaultPrevented, false);
  c.explore("manual");
  assert.equal(f.key("ArrowUp").defaultPrevented, false);
  c.resume(); f.tick();
  assert.equal(f.key("ArrowUp").defaultPrevented, true); c.dispose();
});

test("a manual button jump reaches the selected repeated-id paragraph without restarting its pose", () => {
  const f = navigationFixture(), readings = [];
  f.cues[1].dataset.storyState = "a";
  delete f.options.navigation.hashFor;
  const c = connectReading({ ...f.options, onReading: state => readings.push(state.index) });
  f.tick(); f.next.click();
  assert.equal(c.stage.sample().readingIndex, 1);
  assert.equal(c.stage.sample().moving, false);
  assert.deepEqual(readings, [0, 1]); c.dispose();
});

test("track extent remeasures the viewport and disposal preserves caller-owned children", () => {
  const f = fixture(), children = [];
  const element = { ownerDocument: f.doc, children, append(...nodes) { children.push(...nodes); } };
  f.doc.createElement = () => ({ dataset: {}, style: {}, setAttribute() {},
    remove() { children.splice(children.indexOf(this), 1); } });
  const existing = {}; children.push(existing);
  const track = createReadingTrack({ element, ids: ["a", "b"], extent: ({ index, viewportHeight }) => viewportHeight * (index + 1) });
  assert.deepEqual(track.steps.map(step => step.element.style.height), ["600px", "1200px"]);
  f.view.innerHeight = 500; f.emit("resize");
  assert.deepEqual(track.steps.map(step => step.element.style.height), ["500px", "1000px"]);
  track.dispose(); track.dispose(); assert.deepEqual(children, [existing]);
  assert.throws(() => createReadingTrack({ element, ids: ["a"], extent: () => -1 }), /positive finite/);
  assert.equal([...f.listeners.values()].flatMap(s => [...s]).length, 0);
});

test("navigation targets the interior of measured intervals at any reading line", () => {
  const steps = [100, 460, 1400].map(top => ({ element: { getBoundingClientRect: () => ({ top, height: 170 }) } }));
  assert.equal(readingScrollTarget(steps, 1, { viewportHeight: 650, viewportRatio: .4, scrollY: 1000 }), 1525);
  assert.equal(readingScrollTarget(steps, 2, { viewportHeight: 650, viewportRatio: 0, scrollY: 1000 }), 2562.5);
});

test("wiring follows resize and back/forward restoration, and cleans up an invalid exit", () => {
  const f=fixture(), connection=connectReading(f.options);
  f.scroll(800); f.emit("pageshow"); f.tick(); f.tick(120);
  f.resize(500); f.tick(); assert.equal(f.last.pose.x,500);
  connection.dispose();
  assert.throws(()=>connectReading({...f.options,exit:{}}));
  assert.equal([...f.listeners.values()].flatMap(s=>[...s]).length,0);
});

test("recovery renders the settled pose even when elapsed sampling already reports completion", () => {
  const f = fixture(), connection = connectReading(f.options);
  f.scroll(800); f.tick(); f.tick(30);
  assert.equal(f.last.frame.moving, true);
  f.advance(200);
  assert.equal(connection.stage.sample().moving, false);
  assert.equal(f.last.frame.moving, true);
  f.emit("pageshow"); f.tick();
  assert.equal(f.last.pose.x, 800);
  assert.equal(f.last.frame.moving, false);
  connection.dispose();
});

test("visibility recovery reads a restored position without a scroll event and preserves exploration", () => {
  const f = fixture(), connection = connectReading(f.options);
  f.tick(); f.restorePosition(800);
  f.doc.visibilityState = "hidden"; f.emit("visibilitychange"); f.tick();
  assert.equal(connection.stage.sample().targetId, "a");
  f.doc.visibilityState = "visible"; f.emit("visibilitychange"); f.tick();
  assert.equal(connection.stage.sample().targetId, "b");
  f.tick(100);
  assert.equal(f.last.pose.x, 800);
  connection.explore("manual"); f.tick(100); f.restorePosition(0);
  f.emit("visibilitychange"); f.tick();
  assert.equal(f.last.pose.id, "manual");
  connection.resume(); f.tick(); f.tick(100);
  assert.equal(f.last.pose.id, "a");
  connection.dispose(); f.emit("pageshow");
  assert.equal(f.frames.size, 0);
});

test("stage status distinguishes elapsed sampling from an actually rendered final frame", () => {
  const f = fixture(), c = connectReading(f.options);
  f.tick(); c.explore("manual"); f.tick(30);
  const revision = c.stage.status().target.revision;
  f.advance(200);
  assert.equal(c.stage.sample().moving, false);
  assert.deepEqual(c.stage.status().rendered, { revision, final: false });
  f.tick();
  assert.deepEqual(c.stage.status().rendered, { revision, final: true });
  c.dispose();
});

test("explicit refresh invalidates immediately; a no-change resize notification does not", () => {
  const f = fixture(), c = connectReading(f.options);
  f.tick(); const before = c.stage.status();
  f.observed[0].fn(); f.tick();
  assert.equal(c.stage.status().target.revision, before.target.revision);
  c.stage.refresh();
  assert.ok(c.stage.status().target.revision > c.stage.status().rendered.revision);
  f.tick();
  assert.equal(c.stage.status().rendered.revision, c.stage.status().target.revision);
  f.resize(600); f.tick();
  assert.deepEqual(c.stage.status().size, { width: 600, height: 300 });
  c.dispose();
});

test("an old scheduled animation frame cannot complete a freshly invalidated layout", () => {
  const f = fixture(), c = connectReading(f.options);
  f.tick(); c.explore("manual");
  const old = c.stage.status().target.revision;
  c.stage.refresh(); f.advance(200);
  const [key, callback] = f.frames.entries().next().value;
  f.frames.delete(key); callback();
  assert.equal(c.stage.status().rendered.revision, old);
  assert.ok(c.stage.status().target.revision > old);
  f.tick();
  assert.deepEqual(c.stage.status().rendered, { revision: c.stage.status().target.revision, final: true });
  c.dispose();
});

test("same-state parameter updates produce distinct revisions and status snapshots are detached", () => {
  const f = fixture(), c = connectReading(f.options);
  f.tick(); c.explore("manual"); f.tick(100);
  const first = c.stage.status();
  c.explore("manual");
  assert.ok(c.stage.status().target.revision > first.target.revision);
  first.target.id = "wrong"; first.size.width = 0; first.rendered.final = false;
  f.tick(100);
  assert.equal(c.stage.status().target.id, "manual");
  assert.equal(c.stage.status().size.width, 800);
  c.dispose(); assert.equal(c.stage.status().disposed, true);
});

test("failed layout or render preserves the thrown error and cannot reuse an old completion", () => {
  const f = fixture(); let failure;
  const c = connectReading({ ...f.options,
    layout: (...args) => { if (failure === "layout") throw new Error("bad layout"); return f.options.layout(...args); },
    render: (...args) => { if (failure === "render") throw new Error("bad render"); return f.options.render(...args); },
  });
  f.tick();
  for (const phase of ["layout", "render"]) {
    failure = phase;
    assert.throws(() => c.explore("manual"), new RegExp("bad " + phase));
    assert.equal(c.stage.status().error.phase, phase);
    assert.ok(c.stage.status().target.revision > c.stage.status().rendered.revision);
  }
  failure = null; c.explore("manual"); f.tick(100);
  assert.equal(c.stage.status().error, null);
  assert.deepEqual(c.stage.status().rendered, { revision: c.stage.status().target.revision, final: true });
  c.dispose();
});
