import test from "node:test";
import assert from "node:assert/strict";
import { measureBounds, checkBounds } from "../../skills/creative-data-storytelling/assets/runtime/bounds.mjs";

const box = (x, y, width = 30, height = 20) => ({ x, y, width, height });
// DOM contract double. Actual HTML/SVG and font geometry are exercised in browser.
function fixture() {
  const view = { innerWidth: 1280, innerHeight: 720, getComputedStyle: (el) => el.style };
  const document = { defaultView: view };
  const element = (rect, style = {}, parentElement = null) => ({
    ownerDocument: document, isConnected: true, parentElement,
    style: { display: "block", visibility: "visible", opacity: "1", ...style },
    rect, getBoundingClientRect() { return this.rect; }, getClientRects() { return [this.rect]; },
  });
  return { root: element(box(100, 50, 800, 600)), element };
}
function snapshot(entries) {
  return { space: "root-relative-css-px", stage: box(0, 0, 100, 100),
    viewport: box(-100, -50, 1280, 720), items: entries.map(([id, value, status = "measured"]) =>
      ({ id, box: value, status })) };
}

test("HTML and SVG rendered bounds share root-relative CSS pixels", () => {
  const f = fixture();
  const result = measureBounds(f.root, [
    { id: "html", element: f.element(box(120, 75, 200, 40), {}, f.root) },
    { id: "svg", element: f.element(box(450, 155, 80, 25), {}, f.root) },
  ]);
  assert.deepEqual(result.items.map((item) => item.box), [box(20, 25, 200, 40), box(350, 105, 80, 25)]);
  assert.deepEqual(result.viewport, box(-100, -50, 1280, 720));
});

test("remeasuring uses the current rendered root after scrolling or resizing", () => {
  const f = fixture(), el = f.element(box(150, 100));
  const first = measureBounds(f.root, [{ id: "label", element: el }]);
  f.root.rect.y -= 500; el.rect.y -= 500;
  const scrolled = measureBounds(f.root, [{ id: "label", element: el }]);
  assert.deepEqual(scrolled.items[0].box, first.items[0].box);
  assert.equal(scrolled.viewport.y, 450);
  f.root.rect.width = 400; el.rect.width = 15;
  assert.equal(measureBounds(f.root, [{ id: "label", element: el }]).items[0].box.width, 15);
});

test("hidden parents do not produce collisions, while overridden visibility remains measurable", () => {
  const f = fixture(), faded = f.element(box(100, 50, 800, 600), { opacity: "0" }, f.root);
  const invisible = f.element(box(100, 50, 800, 600), { visibility: "hidden" }, f.root);
  const result = measureBounds(f.root, [
    { id: "faded", element: f.element(box(150, 100), {}, faded) },
    { id: "own-hidden", element: f.element(box(150, 100), { visibility: "hidden" }, f.root) },
    { id: "visible-child", element: f.element(box(150, 100), { visibility: "visible" }, invisible) },
  ]);
  assert.deepEqual(result.items.map((item) => item.status), ["hidden", "hidden", "measured"]);
});

test("supplied Canvas boxes remain explicit and missing DOM targets are not zero-sized successes", () => {
  const f = fixture(), result = measureBounds(f.root, [
    { id: "canvas-label", box: box(50, 30, 90, 25) }, { id: "missing", element: null },
  ]);
  assert.deepEqual(result.items[0], { id: "canvas-label", source: "supplied", status: "measured", box: box(50, 30, 90, 25) });
  assert.equal(result.items[1].status, "missing");
});

test("invalid coordinates, duplicate identities, mixed sources and different documents fail clearly", () => {
  const f = fixture();
  assert.throws(() => measureBounds(f.root, [{ id: "a", box: box(NaN, 0) }]), /Invalid bounds/);
  assert.throws(() => measureBounds(f.root, [{ id: "$stage", box: box(0, 0) }]), /unique/);
  assert.throws(() => measureBounds(f.root, [{ id: "a", box: box(0, 0) }, { id: "a", box: box(1, 1) }]), /unique/);
  assert.throws(() => measureBounds(f.root, [{ id: "a", element: f.root, box: box(1, 1) }]), /either/);
  assert.throws(() => measureBounds(f.root, [{ id: "a", element: fixture().root }]), /root document/);
  f.root.rect.width = 0;
  assert.throws(() => measureBounds(f.root, []), /no rendered area/);
});

test("containment reports which edge exceeds a declared area and preserves fractional precision", () => {
  const s = snapshot([["label", box(-3, 90, 50, 14.25)]]);
  const result = checkBounds(s, [{ type: "inside", ids: ["label"], within: "$stage" }]);
  assert.deepEqual(result.candidates[0], { type: "outside", rule: 0, ids: ["label", "$stage"], edges: { left: 3, bottom: 4.25 } });
});

test("containment can reserve inset space in a measured element", () => {
  const s = snapshot([["plot", box(10, 10, 80, 70)], ["label", box(12, 20)]]);
  assert.deepEqual(checkBounds(s, [{ type: "inside", ids: ["label"], within: "plot", padding: 5 }]).candidates[0].edges, { left: 3 });
});

test("declared groups detect overlap but ignore unrelated intentional layering", () => {
  const s = snapshot([["label", box(10, 40)], ["footer", box(0, 50, 100, 20)], ["background", box(0, 0, 100, 100)]]);
  const original = JSON.stringify(s);
  const result = checkBounds(s, [{ type: "separate", ids: ["label"], from: ["footer"] }]);
  assert.deepEqual(result.candidates.map((item) => item.ids), [["label", "footer"]]);
  assert.equal(result.checked, 1);
  assert.equal(JSON.stringify(s), original);
});

test("touching edges are not overlap, optional clearance and tolerance are explicit", () => {
  const s = snapshot([["a", box(0, 0, 20, 20)], ["b", box(20, 0, 20, 20)]]);
  assert.equal(checkBounds(s, [{ type: "separate", ids: ["a", "b"] }]).candidates.length, 0);
  assert.equal(checkBounds(s, [{ type: "separate", ids: ["a", "b"], gap: 4 }]).candidates[0].type, "clearance");
  s.items[1].box.x -= 0.25;
  assert.equal(checkBounds(s, [{ type: "separate", ids: ["a", "b"] }]).candidates.length, 0);
  assert.equal(checkBounds(s, [{ type: "separate", ids: ["a", "b"] }], { tolerance: 0 }).candidates.length, 1);
});

test("unknown ids and invalid rules fail instead of silently omitting requested coverage", () => {
  const s = snapshot([["label", box(0, 0)]]);
  assert.throws(() => checkBounds(s, [{ type: "inside", ids: ["typo"], within: "$stage" }]), /unknown ids/);
  assert.throws(() => checkBounds(s, [{ type: "inside", ids: ["label"], within: "$stage", padding: -1 }]), /nonnegative/);
  assert.throws(() => checkBounds(s, [{ type: "automatic", ids: ["label"] }]), /Unknown bounds rule/);
});

test("missing and hidden targets are separately recorded as skipped, not counted as checked", () => {
  const s = snapshot([["missing", null, "missing"], ["hidden", null, "hidden"]]);
  const result = checkBounds(s, [{ type: "inside", ids: ["missing", "hidden"], within: "$stage" }]);
  assert.deepEqual({ checked: result.checked, candidates: result.candidates }, { checked: 0, candidates: [] });
  assert.deepEqual(result.skipped.map((entry) => entry.unavailable[0].status), ["missing", "hidden"]);
});

test("overlapping groups report each unordered pair once and never compare an item with itself", () => {
  const s = snapshot([["a", box(0, 0)], ["b", box(1, 1)]]);
  const result = checkBounds(s, [{ type: "separate", ids: ["a", "b"], from: ["b", "a"] }]);
  assert.equal(result.checked, 1);
  assert.equal(result.candidates.length, 1);
});
