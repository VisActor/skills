import test from "node:test";
import assert from "node:assert/strict";
import { createCopyHandoff } from "../../skills/creative-data-storytelling/assets/runtime/copy.mjs";

function fixture() {
  let time = 0, frameId = 0;
  const frames = new Map();
  const panels = ["question", "answer"].map((id, index) => {
    const attrs = new Map();
    return { dataset: { copy: id }, hidden: index > 0, inert: false,
      style: { gridArea: "", alignSelf: "", opacity: "", visibility: "", pointerEvents: "", translate: "" },
      getAttribute: key => attrs.get(key) ?? null,
      setAttribute: (key, value) => attrs.set(key, value),
      removeAttribute: key => attrs.delete(key),
    };
  });
  const view = { performance: { now: () => time },
    requestAnimationFrame(fn) { frames.set(++frameId, fn); return frameId; },
    cancelAnimationFrame(id) { frames.delete(id); },
  };
  const element = { style: { display: "" }, ownerDocument: { defaultView: view }, querySelectorAll: () => panels };
  return { element, panels, frames,
    tick(ms) { time += ms; const work = [...frames.values()]; frames.clear(); work.forEach(fn => fn(time)); },
    visible() { return panels.filter(panel => panel.style.visibility === "visible").map(panel => panel.dataset.copy); },
  };
}

test("first state displays immediately while all panels retain layout space", () => {
  const f = fixture(), copy = createCopyHandoff(f.element);
  copy.show("answer");
  assert.deepEqual(f.visible(), ["answer"]);
  assert.equal(f.frames.size, 0);
  assert.ok(f.panels.every(panel => !panel.hidden && panel.style.gridArea === "1 / 1"));
  assert.equal(f.panels[0].getAttribute("aria-hidden"), "true");
  assert.equal(f.panels[0].inert, true);
  copy.dispose();
});

test("old copy retires before new copy appears and repeated render calls do not restart it", () => {
  const f = fixture(), copy = createCopyHandoff(f.element, { duration: 200 });
  copy.show("question"); copy.show("answer");
  f.tick(40); copy.show("answer");
  assert.deepEqual(f.visible(), ["question"]);
  assert.ok(Number(f.panels[0].style.opacity) < 1);
  f.tick(80); copy.show("answer");
  assert.deepEqual(f.visible(), ["answer"]);
  assert.ok(Number(f.panels[1].style.opacity) < 1);
  f.tick(80);
  assert.equal(f.panels[1].style.opacity, "1");
  assert.equal(f.frames.size, 0);
  copy.dispose();
});

test("reversing a partially revealed answer resumes from its current opacity", () => {
  const f = fixture(), copy = createCopyHandoff(f.element, { duration: 200 });
  copy.show("question"); copy.show("answer"); f.tick(125);
  const opacity = f.panels[1].style.opacity;
  copy.show("question");
  assert.equal(f.panels[1].style.opacity, opacity);
  f.tick(200);
  assert.deepEqual(f.visible(), ["question"]);
  assert.equal(f.panels[0].style.opacity, "1");
  assert.equal(f.frames.size, 0);
  copy.dispose();
});

test("returning before the answer appears cancels its reveal", () => {
  const f = fixture(), copy = createCopyHandoff(f.element, { duration: 200 });
  copy.show("question"); copy.show("answer"); f.tick(30);
  copy.show("question"); f.tick(200);
  assert.deepEqual(f.visible(), ["question"]);
  assert.equal(f.panels[1].getAttribute("aria-hidden"), "true");
  copy.dispose();
});

test("disposing cancels pending frames and restores caller styles and visibility", () => {
  const f = fixture();
  f.element.style.display = "flex";
  f.panels[1].setAttribute("aria-hidden", "true");
  const copy = createCopyHandoff(f.element);
  copy.show("question"); copy.show("answer"); f.tick(30);
  copy.dispose(); copy.dispose();
  assert.equal(f.frames.size, 0);
  assert.equal(f.element.style.display, "flex");
  assert.deepEqual(f.panels.map(panel => panel.hidden), [false, true]);
  assert.deepEqual(f.panels.map(panel => panel.getAttribute("aria-hidden")), [null, "true"]);
  assert.ok(f.panels.every(panel => Object.values(panel.style).every(value => value === "")));
  copy.show("answer");
  assert.equal(f.frames.size, 0);
});

test("invalid ids fail explicitly, and immediate updates can settle a running handoff", () => {
  const f = fixture();
  assert.throws(() => createCopyHandoff(f.element, { duration: -1 }), /duration/);
  assert.throws(() => createCopyHandoff(f.element, { offsetY: NaN }), /offsetY/);
  const copy = createCopyHandoff(f.element);
  assert.throws(() => copy.show("absent"), /Unknown copy panel/);
  copy.show("question"); copy.show("answer"); f.tick(30);
  copy.show("answer", { immediate: true });
  assert.equal(f.panels[1].style.opacity, "1");
  assert.equal(f.frames.size, 0);
  copy.dispose();
});

test("optional incoming lift settles at the original anchor and restores caller translation", () => {
  const f = fixture(); f.panels[1].style.translate = "2px 3px";
  const copy = createCopyHandoff(f.element, { duration: 200, offsetY: 6 });
  copy.show("question"); copy.show("answer"); f.tick(120);
  assert.deepEqual(f.visible(), ["answer"]);
  assert.ok(parseFloat(f.panels[1].style.translate.split(' ')[1]) > 0);
  f.tick(80); assert.equal(f.panels[1].style.translate, "0 0px");
  copy.dispose(); assert.equal(f.panels[1].style.translate, "2px 3px");
});

test("same-state content changes only after the old wording fades, and only once", () => {
  const f = fixture(), copy = createCopyHandoff(f.element, { duration: 200 });
  let text = "phone", calls = 0;
  copy.show("answer");
  copy.show("answer", { update() { text = "wallet"; calls++; } });
  f.tick(40); assert.equal(text, "phone");
  f.tick(80); assert.equal(text, "wallet");
  f.tick(80); assert.equal(calls, 1);
  copy.dispose();
});

test("a superseded content update cannot overwrite the newer reading target", () => {
  const f = fixture(), copy = createCopyHandoff(f.element, { duration: 200 });
  const updates = [];
  copy.show("question");
  copy.show("answer", { update: () => updates.push("stale") }); f.tick(40);
  copy.show("question", { update: () => updates.push("current") }); f.tick(200);
  assert.deepEqual(updates, ["current"]);
  assert.deepEqual(f.visible(), ["question"]);
  copy.dispose();
});
