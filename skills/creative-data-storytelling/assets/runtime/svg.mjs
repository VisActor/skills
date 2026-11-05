import { keyed } from "./geometry.mjs";

const SVG_NS = "http://www.w3.org/2000/svg";

// Text is written as text, not parsed as SVG markup. Layout and styling belong to the work.
export function svgElement(tag, attributes = {}, text, document = globalThis.document) {
  const element = document.createElementNS(SVG_NS, tag);
  setSvgAttributes(element, attributes);
  if (text !== undefined) element.textContent = String(text);
  return element;
}

// This is a patch: omitted attributes stay; null/undefined explicitly remove an attribute.
export function setSvgAttributes(element, attributes) {
  for (const [name, value] of Object.entries(attributes)) {
    if (typeof value === "number" && !Number.isFinite(value))
      throw new Error("SVG attribute " + name + " must not be NaN or infinite");
    if (value === null || value === undefined) element.removeAttribute(name);
    else element.setAttribute(name, String(value));
  }
  return element;
}

// Own one group. Call render with the CURRENT interpolated pose, including fading exits.
// create runs once per entering id; update runs for each visible frame, without its own clock.
export function createSvgLayer(parent, { create, update, attributes = {} }) {
  if (parent?.namespaceURI !== SVG_NS || typeof create !== "function" || typeof update !== "function")
    throw new Error("SVG layer requires an SVG parent and create/update functions");
  const element = svgElement("g", attributes, undefined, parent.ownerDocument);
  parent.appendChild(element);
  const nodes = new Map();
  let records = new Map(), disposed = false;
  function render(rows) {
    if (disposed) return;
    const next = keyed(rows instanceof Map ? rows.values() : rows);
    for (const [id, row] of next) {
      let node = nodes.get(id);
      if (!node) {
        node = create(row);
        if (node?.namespaceURI !== SVG_NS || node.parentNode)
          throw new Error("SVG create must return a new, unattached SVG element for " + id);
        nodes.set(id, node);
        element.appendChild(node);
      }
      update(node, row);
    }
    for (const [id, node] of nodes) {
      if (!next.has(id)) { node.remove(); nodes.delete(id); }
    }
    // Reorder only when needed; unchanged frames retain the same DOM and event listeners.
    let cursor = element.firstChild;
    for (const id of next.keys()) {
      const node = nodes.get(id);
      if (node === cursor) cursor = cursor.nextSibling;
      else element.insertBefore(node, cursor);
    }
    records = next;
  }
  return {
    element, render,
    get: (id) => nodes.get(id),
    data: (id) => records.get(id),
    dispose() {
      if (disposed) return;
      disposed = true;
      element.remove();
      nodes.clear();
      records.clear();
    },
  };
}
