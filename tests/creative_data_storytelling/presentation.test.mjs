import test from "node:test";
import assert from "node:assert/strict";
import { createValueFormat } from "../../skills/creative-data-storytelling/assets/runtime/format.mjs";
import { createSvgLayer, setSvgAttributes, svgElement } from "../../skills/creative-data-storytelling/assets/runtime/svg.mjs";
import { blendNodes } from "../../skills/creative-data-storytelling/assets/runtime/motion.mjs";

test("matching prose and chart readouts share a fixed unit and precision across magnitudes", () => {
  const f = createValueFormat({ unit: "万件", divisor: 10000, digits: 2 });
  assert.equal(f.number(12500), "1.25");
  assert.equal(f.format(12500), "1.25 万件");
  assert.equal(f.format(12500000), "1,250.00 万件");
  assert.equal(f.divisor, 10000);
  assert.ok(Object.isFrozen(f));
});

test("missing values remain distinct from zero and invalid calculations fail explicitly", () => {
  const f = createValueFormat({ unit: "件", digits: 0 });
  assert.deepEqual([f.format(null), f.number(undefined), f.format(0)], ["—", "—", "0 件"]);
  for (const value of [NaN, Infinity, -Infinity, "12", ""]) assert.throws(() => f.number(value), /finite numeric/);
});

test("display rounding suppresses negative zero without hiding meaningful negative values", () => {
  const f = createValueFormat({ digits: 2, signDisplay: "exceptZero", locale: "en-US" });
  assert.deepEqual([-0, -0.004, -0.015, 1].map(f.number), ["0.00", "0.00", "-0.02", "+1.00"]);
});

test("percentage conversion is explicit rather than inferred from the number", () => {
  const ratio = createValueFormat({ divisor: 0.01, unit: "%", separator: "", digits: 1 });
  const points = createValueFormat({ unit: "个百分点", digits: 1 });
  assert.equal(ratio.format(0.125), "12.5%");
  assert.equal(points.format(12.5), "12.5 个百分点");
});

test("invalid format configuration and conversion overflow fail before showing a misleading value", () => {
  for (const options of [{ divisor: 0 }, { divisor: -1 }, { digits: 1.5 }, { digits: 21 }, { unit: 2 }])
    assert.throws(() => createValueFormat(options), /Value format/);
  assert.throws(() => createValueFormat({ divisor: Number.MIN_VALUE }).number(1), /finite numeric/);
});

// A small DOM contract double; real SVG rendering is separately exercised in the browser demo.
class Element extends EventTarget {
  constructor(document, namespaceURI, tagName) {
    super();
    Object.assign(this, { ownerDocument: document, namespaceURI, tagName, attributes: new Map(),
      childNodes: [], parentNode: null, textContent: "", insertions: 0 });
  }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  removeAttribute(name) { this.attributes.delete(name); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  get firstChild() { return this.childNodes[0] ?? null; }
  get nextSibling() {
    const siblings = this.parentNode?.childNodes ?? [];
    return siblings[siblings.indexOf(this) + 1] ?? null;
  }
  appendChild(node) { return this.insertBefore(node, null); }
  insertBefore(node, before) {
    if (node === before) return node;
    node.remove();
    const index = before === null ? this.childNodes.length : this.childNodes.indexOf(before);
    assert.ok(index >= 0);
    this.childNodes.splice(index, 0, node);
    node.parentNode = this;
    this.insertions++;
    return node;
  }
  remove() {
    if (this.parentNode) {
      const siblings = this.parentNode.childNodes;
      siblings.splice(siblings.indexOf(this), 1);
      this.parentNode = null;
    }
  }
}

function fixture() {
  const document = { createElementNS: (namespace, tag) => new Element(document, namespace, tag) };
  const root = svgElement("svg", {}, undefined, document);
  const decoration = svgElement("title", {}, "Context", document);
  root.appendChild(decoration);
  let created = 0, clicked;
  const layer = createSvgLayer(root, {
    create(row) {
      created++;
      const node = svgElement("circle", { "data-id": row.id }, undefined, document);
      node.addEventListener("click", () => { clicked = layer.data(row.id).value; });
      return node;
    },
    update(node, row) { setSvgAttributes(node, { cx: row.x, opacity: row.opacity }); },
  });
  return { document, root, decoration, layer, get created() { return created; }, get clicked() { return clicked; } };
}

test("SVG updates keep the same node and listener while event data follows the current record", () => {
  const f = fixture();
  f.layer.render([{ id: "a", x: 10, value: 1 }]);
  const node = f.layer.get("a"), insertions = f.layer.element.insertions;
  f.layer.render([{ id: "a", x: 30, value: 2 }]);
  node.dispatchEvent(new Event("click"));
  assert.equal(f.layer.get("a"), node);
  assert.equal(node.getAttribute("cx"), "30");
  assert.equal(f.clicked, 2);
  assert.equal(f.created, 1);
  assert.equal(f.layer.element.insertions, insertions);
});

test("SVG reordering and removal affect only the owned layer and retain surviving identities", () => {
  const f = fixture(), rows = [{ id: "a", x: 10 }, { id: "b", x: 20 }];
  f.layer.render(rows);
  const [a, b] = [f.layer.get("a"), f.layer.get("b")];
  f.layer.render([...rows].reverse());
  assert.deepEqual(f.layer.element.childNodes, [b, a]);
  f.layer.render([rows[1]]);
  assert.equal(a.parentNode, null);
  assert.equal(f.layer.get("b"), b);
  assert.deepEqual(f.root.childNodes, [f.decoration, f.layer.element]);
});

test("duplicate display identities are rejected before changing the current DOM", () => {
  const f = fixture();
  f.layer.render([{ id: "a", x: 10 }]);
  assert.throws(() => f.layer.render([{ id: "a", x: 20 }, { id: "a", x: 30 }]), /unique/);
  assert.equal(f.layer.get("a").getAttribute("cx"), "10");
});

test("fading exits remain until the interpolated pose removes them", () => {
  const f = fixture();
  const a = new Map([["a", { id: "a", x: 10, opacity: 1 }], ["b", { id: "b", x: 20, opacity: 1 }]]);
  const b = new Map([["b", { id: "b", x: 40, opacity: 1 }], ["c", { id: "c", x: 50, opacity: 1 }]]);
  f.layer.render(a);
  const retained = f.layer.get("b");
  f.layer.render(blendNodes(a, b, 0.5, ["x", "opacity"]));
  assert.equal(f.layer.get("a").getAttribute("opacity"), "0.5");
  assert.equal(f.layer.get("c").getAttribute("opacity"), "0.5");
  f.layer.render(b);
  assert.equal(f.layer.get("a"), undefined);
  assert.equal(f.layer.get("b"), retained);
});

test("attribute patches preserve omitted styles, remove null values and keep zero", () => {
  const f = fixture();
  const node = svgElement("text", { fill: "red", stroke: "blue", opacity: 1 }, "<tspan>literal</tspan>", f.document);
  setSvgAttributes(node, { opacity: 0, fill: null });
  assert.equal(node.getAttribute("opacity"), "0");
  assert.equal(node.getAttribute("fill"), null);
  assert.equal(node.getAttribute("stroke"), "blue");
  assert.equal(node.textContent, "<tspan>literal</tspan>");
  assert.equal(node.childNodes.length, 0);
  assert.throws(() => setSvgAttributes(node, { x: NaN }), /NaN or infinite/);
});

test("disposing the layer preserves its siblings and stops later writes", () => {
  const f = fixture();
  f.layer.render([{ id: "a", x: 1 }]);
  f.layer.dispose();
  f.layer.render([{ id: "b", x: 2 }]);
  f.layer.dispose();
  assert.deepEqual(f.root.childNodes, [f.decoration]);
  assert.equal(f.created, 1);
  assert.equal(f.layer.data("a"), undefined);
});
