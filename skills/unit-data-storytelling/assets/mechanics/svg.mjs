import { pixelSlots } from "./units.mjs";

const SVG_NS = "http://www.w3.org/2000/svg";

export function setSvgAttributes(element, attributes) {
  for (const [name, value] of Object.entries(attributes)) {
    if (value === null || value === undefined) element.removeAttribute(name);
    else element.setAttribute(name, String(value));
  }
  return element;
}

export function svgElement(tag, attributes = {}, ownerDocument = globalThis.document) {
  return setSvgAttributes(ownerDocument.createElementNS(SVG_NS, tag), attributes);
}

// A glyph's visual box is separate from its data anchor and statistical area.
export function imageBox(width, height, { anchorX = .5, anchorY = .5 } = {}) {
  if (![width, height, anchorX, anchorY].every(Number.isFinite) || width <= 0 || height <= 0 ||
      anchorX < 0 || anchorX > 1 || anchorY < 0 || anchorY > 1) {
    throw new Error("Image box needs positive dimensions and normalized anchors");
  }
  return { x: -width * anchorX, y: -height * anchorY, width, height };
}

export async function loadImages(urls) {
  const entries = await Promise.all([...new Set(urls)].map(async (url) => {
    const image = new Image();
    image.src = url;
    try {
      await image.decode();
      if (!image.naturalWidth || !image.naturalHeight) throw new Error("Image has no dimensions");
    } catch (cause) {
      throw new Error("Unable to decode image: " + url, { cause });
    }
    return [url, image];
  }));
  return new Map(entries);
}

// Browser adapter for a decoded image (SVG, PNG, etc.). A bounded raster is
// enough for slots; reading the source pixels does not alter the source asset.
export function imageSlots(image, { size = 256, step = 4, accept, includeColor = false } = {}) {
  if (!Number.isSafeInteger(size) || size < 2 || !image?.naturalWidth || !image?.naturalHeight) {
    throw new Error("Image sampling needs a decoded image and integer raster size >= 2");
  }
  const ratio = size / Math.max(image.naturalWidth, image.naturalHeight);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Image sampling needs a Canvas 2D context");
  let pixels;
  try {
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  } catch (cause) {
    throw new Error("Cannot read image pixels; use a local or CORS-readable prepared asset: " + image.src, { cause });
  }
  const slots = pixelSlots(pixels, { step, accept, includeColor });
  if (!slots.length) throw new Error("Image mask is empty; check the selection predicate or sampling step");
  return slots;
}

// Use a dedicated parent group for this layer. The outer group carries position
// and opacity; callbacks own the glyph, source lookup, labels and interaction.
export function createSvgLayer(parent, { mount = () => {}, update }) {
  if (typeof mount !== "function" || typeof update !== "function") {
    throw new Error("SVG layer needs an update callback and an optional mount callback");
  }
  const elements = new Map();
  let disposed = false;
  function draw(nodes, context) {
    if (disposed) throw new Error("Cannot draw a disposed SVG layer");
    if (!(nodes instanceof Map)) throw new Error("SVG layer expects a Map of drawing instances");
    // Validate before touching the existing frame.
    for (const [id, node] of nodes) {
      if (typeof id !== "string" || !id || node?.id !== id ||
          ![node.x, node.y, node.opacity].every(Number.isFinite) ||
          node.opacity < 0 || node.opacity > 1) {
        throw new Error("Invalid drawing identity, position or opacity: " + String(id));
      }
    }
    for (const [id, element] of elements) {
      if (!nodes.has(id)) { element.remove(); elements.delete(id); }
    }
    for (const [id, node] of nodes) {
      let element = elements.get(id);
      if (!element) {
        element = svgElement("g", { "data-unit-id": id }, parent.ownerDocument);
        mount(element, node, context);
        elements.set(id, element);
        parent.appendChild(element);
      }
      setSvgAttributes(element, {
        transform: `translate(${node.x} ${node.y})`, opacity: node.opacity,
      });
      update(element, node, context);
    }
    // Avoid moving stable DOM nodes every frame; order changes remain explicit.
    const wanted = [...nodes.keys()].map((id) => elements.get(id));
    const owned = new Set(elements.values());
    const current = [...parent.children].filter((element) => owned.has(element));
    if (wanted.some((element, index) => element !== current[index])) {
      for (const element of wanted) parent.appendChild(element);
    }
  }
  function dispose() {
    for (const element of elements.values()) element.remove();
    elements.clear();
    disposed = true;
  }
  return { draw, dispose };
}
