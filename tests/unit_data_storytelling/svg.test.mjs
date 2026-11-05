import test from "node:test";
import assert from "node:assert/strict";
import { createSvgLayer, imageBox, imageSlots, loadImages, setSvgAttributes, svgElement }
  from "../../skills/unit-data-storytelling/assets/mechanics/svg.mjs";
import { pixelSlots, slotLayout } from "../../skills/unit-data-storytelling/assets/mechanics/units.mjs";

// Only the DOM operations used by the keyed renderer. Actual SVG painting and
// image rendering are checked separately in a browser, not asserted here.
class Element {
  constructor(ownerDocument, tag) { this.ownerDocument = ownerDocument; this.tag = tag; this.children = []; this.attrs = {}; }
  setAttribute(name, value) { this.attrs[name] = value; }
  removeAttribute(name) { delete this.attrs[name]; }
  appendChild(child) { child.remove(); this.children.push(child); child.parent = this; return child; }
  remove() {
    if (this.parent) this.parent.children.splice(this.parent.children.indexOf(this), 1);
    this.parent = null;
  }
}
const doc = { createElementNS(_namespace, tag) { return new Element(this, tag); } };
const pose = (ids) => new Map(ids.map((id, i) => [id, { id, x: i * 20, y: 10, opacity: 1, area: 16 }]));
const parent = () => svgElement("g", {}, doc);

test("rendering preserves the outer element and binding while position and glyph change", () => {
  const root = parent();
  let mounts = 0;
  const layer = createSvgLayer(root, {
    mount() { mounts++; }, update: (g, _n, ctx) => setSvgAttributes(g, { "data-glyph": ctx.glyph }),
  });
  layer.draw(pose(["a"]), { glyph: "dot" });
  const original = root.children[0];
  const next = pose(["a"]); next.get("a").x = 80;
  layer.draw(next, { glyph: "image" });
  assert.deepEqual([root.children[0] === original, mounts, original.attrs.transform, original.attrs["data-glyph"]],
    [true, 1, "translate(80 10)", "image"]);
});

test("independent replacement removes old elements instead of inheriting their identity", () => {
  const root = parent(), layer = createSvgLayer(root, { update() {} });
  layer.draw(pose(["old-a", "old-b"]));
  const old = [...root.children];
  layer.draw(pose(["new-a"]));
  assert.deepEqual([root.children.map((g) => g.attrs["data-unit-id"]), old.every((g) => g.parent === null)], [["new-a"], true]);
});

test("caller-controlled drawing order changes without replacing retained elements", () => {
  const root = parent(), layer = createSvgLayer(root, { update() {} });
  layer.draw(pose(["a", "b"]));
  const [a, b] = root.children;
  layer.draw(pose(["b", "a"]));
  assert.deepEqual(root.children, [b, a]);
});

test("invalid input does not partially erase the previously readable frame", () => {
  const root = parent(), layer = createSvgLayer(root, { update() {} });
  layer.draw(pose(["a"]));
  const original = root.children[0], bad = pose(["b"]);
  bad.get("b").x = NaN;
  assert.throws(() => layer.draw(bad), /Invalid drawing/);
  assert.equal(root.children[0], original);
});

test("disposal removes only owned elements and rejects later rendering", () => {
  const root = parent(), external = svgElement("text", {}, doc);
  root.appendChild(external);
  const layer = createSvgLayer(root, { update() {} });
  layer.draw(pose(["a"])); layer.dispose(); layer.dispose();
  assert.deepEqual(root.children, [external]);
  assert.throws(() => layer.draw(pose(["a"])), /disposed/);
});

test("image anchors move the local box without altering the data position", () => {
  assert.deepEqual(imageBox(24, 40, { anchorX: .5, anchorY: 1 }), { x: -12, y: -40, width: 24, height: 40 });
  assert.throws(() => imageBox(0, 40), /positive dimensions/);
});

test("image preparation deduplicates assets and retains decoded dimensions", async (t) => {
  const original = globalThis.Image, requested = [];
  t.after(() => { if (original === undefined) delete globalThis.Image; else globalThis.Image = original; });
  globalThis.Image = class {
    naturalWidth = 24; naturalHeight = 40;
    async decode() { requested.push(this.src); }
  };
  const images = await loadImages(["a.svg", "a.svg", "b.svg"]);
  assert.deepEqual([requested, images.get("a.svg").naturalHeight], [["a.svg", "b.svg"], 40]);
});

test("image preparation reports the failed asset rather than silently substituting a dot", async (t) => {
  const original = globalThis.Image;
  t.after(() => { if (original === undefined) delete globalThis.Image; else globalThis.Image = original; });
  globalThis.Image = class { async decode() { throw new Error("bad bytes"); } };
  await assert.rejects(() => loadImages(["missing.svg"]), /Unable to decode image: missing.svg/);
});

test("pixel sampling centers a nonsquare source without stretching its distances", () => {
  const data = new Uint8ClampedArray(2 * 4 * 4).fill(255);
  const points = pixelSlots({ width: 2, height: 4, data }, { step: 1 });
  assert.deepEqual([points[0], points[1], points[2], points.at(-1)], [
    { x: .375, y: .125 }, { x: .625, y: .125 }, { x: .375, y: .375 }, { x: .625, y: .875 },
  ]);
});

test("alpha and caller color selection operate on source pixels without adding records", () => {
  const raster = { width: 3, height: 1, data: new Uint8ClampedArray([
    255, 0, 0, 255, 0, 0, 255, 255, 0, 0, 0, 0,
  ]) };
  const opaque = pixelSlots(raster, { step: 1 });
  const red = pixelSlots(raster, { step: 1, accept: (r, _g, _b, a) => r > 200 && a > 128 });
  const nodes = slotLayout([{ id: "real-record" }], red, { bounds: { x: 0, y: 0, width: 100, height: 100 } });
  assert.deepEqual([opaque.length, red.length, [...nodes.keys()]], [2, 1, ["real-record"]]);
});

test("optional source colors preserve sampled coordinates and independent RGBA values", () => {
  const raster = { width: 3, height: 1, data: new Uint8ClampedArray([
    40, 109, 112, 255, 204, 225, 212, 160, 0, 0, 0, 0,
  ]) };
  const plain = pixelSlots(raster, { step: 1 });
  const colored = pixelSlots(raster, { step: 1, includeColor: true });
  raster.data.fill(0);
  assert.deepEqual(colored, plain.map((point, i) => ({ ...point,
    rgba: [[40, 109, 112, 255], [204, 225, 212, 160]][i],
  })));
});

test("source image colors do not become record colors or extra records in slot layout", () => {
  const slots = pixelSlots({ width: 2, height: 1, data: [40, 109, 112, 255, 204, 225, 212, 255] },
    { step: 1, includeColor: true });
  const records = [{ id: "real-record", category: "lamp" }];
  const options = { bounds: { x: 0, y: 0, width: 100, height: 100 } };
  assert.deepEqual(slotLayout(records, slots, options),
    slotLayout(records, slots.map(({ x, y }) => ({ x, y })), options));
});

test("malformed pixels and invalid sampling steps fail before producing positions", () => {
  for (const [raster, options] of [
    [{ width: 2, height: 2, data: [] }, {}],
    [{ width: 1, height: 1, data: [0, 0, 0, 255] }, { step: 0 }],
  ]) assert.throws(() => pixelSlots(raster, options), /Pixel sampling/);
});

test("browser sampling bounds the raster and reports unreadable or empty material", (t) => {
  const original = globalThis.document;
  t.after(() => { if (original === undefined) delete globalThis.document; else globalThis.document = original; });
  const canvas = {}, draws = [];
  let failure = false, alpha = 255;
  canvas.getContext = () => ({
    drawImage: (...args) => draws.push(args),
    getImageData: () => {
      if (failure) throw new Error("tainted");
      return { width: canvas.width, height: canvas.height,
        data: new Uint8ClampedArray(canvas.width * canvas.height * 4).fill(alpha) };
    },
  });
  globalThis.document = { createElement: () => canvas };
  const image = { naturalWidth: 20, naturalHeight: 40, src: "source.svg" };
  const points = imageSlots(image, { size: 8, step: 1 });
  assert.deepEqual([canvas.width, canvas.height, draws[0].slice(1), points.length], [4, 8, [0, 0, 4, 8], 32]);
  assert.deepEqual(imageSlots(image, { size: 8, step: 1, includeColor: true })[0].rgba, [255, 255, 255, 255]);
  failure = true;
  assert.throws(() => imageSlots(image), /CORS-readable.*source.svg/);
  failure = false; alpha = 0;
  assert.throws(() => imageSlots(image), /mask is empty/);
});
