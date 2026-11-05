import { at, keyed, radiusForArea } from "./geometry.mjs";

function checkBounds({ x, y, width, height }) {
  if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) {
    throw new Error("Layout bounds need finite coordinates and positive dimensions");
  }
}

// Each source row is a total, not a person. Quantum is part of the drawing id:
// re-quantizing must not silently preserve an apparent individual identity.
export function quantize(records, { quantum, maxUnits = 10000 }) {
  keyed(records);
  if (!Number.isFinite(quantum) || quantum <= 0 ||
      !Number.isSafeInteger(maxUnits) || maxUnits < 1) {
    throw new Error("quantize requires a positive quantum and a positive integer allocation limit");
  }
  const units = [];
  let total = 0;
  for (const record of records) {
    const value = record.value;
    if (!Number.isFinite(value) || value < 0) {
      throw new Error("Invalid nonnegative total for " + record.id);
    }
    total += value;
    if (!Number.isFinite(total)) throw new Error("Combined total exceeds finite range");
    if (value === 0) continue;
    const ratio = value / quantum;
    const nearest = Math.round(ratio);
    const tolerance = 8 * Number.EPSILON * Math.max(1, ratio);
    const count = Math.max(1, Math.abs(ratio - nearest) <= tolerance ? nearest : Math.ceil(ratio));
    if (!Number.isSafeInteger(count) || units.length + count > maxUnits) {
      throw new Error("Unit allocation exceeds maxUnits; choose an explicit coarser quantum or budget");
    }
    for (let index = 0; index < count; index++) {
      const amount = index === count - 1 ? value - quantum * index : quantum;
      units.push({
        id: JSON.stringify(["aggregate", record.id, quantum, index]),
        sourceId: record.id,
        kind: "aggregate",
        amount,
        fraction: Math.min(1, amount / quantum),
      });
    }
  }
  return { units, quantum, total };
}

// Input order is an editorial/layout choice made by the caller. No fixed groups,
// page regions or automatic per-state resizing are supplied by this mechanism.
export function gridLayout(records, { bounds, cell, areaOf = () => 16 }) {
  keyed(records);
  checkBounds(bounds);
  if (!Number.isFinite(cell) || cell <= 0) throw new Error("Grid cell must be positive");
  const columns = Math.floor(bounds.width / cell);
  const rows = Math.floor(bounds.height / cell);
  if (records.length > columns * rows) {
    throw new Error("Grid capacity exceeded; revise bounds, density or explicit aggregation");
  }
  const nodes = new Map();
  for (const [index, record] of records.entries()) {
    const area = areaOf(record);
    if (radiusForArea(area) * 2 > cell) {
      throw new Error("Unit exceeds reserved grid cell: " + record.id);
    }
    nodes.set(record.id, {
      id: record.id,
      x: bounds.x + (index % columns + 0.5) * cell,
      y: bounds.y + (Math.floor(index / columns) + 0.5) * cell,
      area,
      opacity: 1,
    });
  }
  return nodes;
}

// The caller supplies both group regions and a layout function. No panel order,
// group sizes or category semantics are inferred here.
export function groupLayout(records, { groupBy, boundsByGroup, layout }) {
  keyed(records);
  if (typeof groupBy !== "function" || typeof layout !== "function" ||
      !(boundsByGroup instanceof Map)) {
    throw new Error("Group layout needs groupBy, a bounds Map and a layout callback");
  }
  const groups = new Map();
  for (const record of records) {
    const key = groupBy(record);
    if (!boundsByGroup.has(key)) throw new Error("Missing layout region for group " + String(key));
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  }
  const nodes = new Map();
  for (const [key, rows] of groups) {
    const bounds = boundsByGroup.get(key);
    checkBounds(bounds);
    const result = layout(rows, { key, bounds });
    if (!(result instanceof Map) || result.size !== rows.length ||
        rows.some((row) => result.get(row.id)?.id !== row.id)) {
      throw new Error("Group layout must preserve every drawing id exactly once: " + String(key));
    }
    for (const [id, node] of result) nodes.set(id, node);
  }
  return nodes;
}

// Exact numeric positions with perpendicular lanes, not a beeswarm. Footprints
// are centered rectangles; they can reserve room for images as well as circles.
// Only endpoint placement is checked, not intersections along animation paths.
export function stackLayout(records, {
  valueOf, scale, bounds, crossStart, crossStep, axis = "x", gap = 0,
  areaOf = () => 16,
  extentOf = (_record, area) => ({ width: radiusForArea(area) * 2, height: radiusForArea(area) * 2 }),
}) {
  keyed(records);
  checkBounds(bounds);
  if (typeof valueOf !== "function" || typeof extentOf !== "function" ||
      !["x", "y"].includes(axis) ||
      ![scale?.k, scale?.b, crossStart, crossStep, gap].every(Number.isFinite) ||
      scale.k === 0 || crossStep === 0 || gap < 0) {
    throw new Error("Stack layout needs a value accessor, finite scale, signed lane step and nonnegative gap");
  }
  const horizontal = axis === "x";
  const items = records.map((record) => {
    const value = valueOf(record), area = areaOf(record);
    radiusForArea(area);
    const { width, height } = extentOf(record, area);
    const main = at(scale, value);
    if (![value, main, width, height].every(Number.isFinite) || width < 0 || height < 0) {
      throw new Error("Invalid value or centered footprint on " + record.id);
    }
    return { record, area, main, width, height,
      along: horizontal ? width : height, across: horizontal ? height : width };
  }).sort((a, b) => a.main - b.main || (a.record.id < b.record.id ? -1 : 1));
  if (items.some((item) => item.across + gap > Math.abs(crossStep))) {
    throw new Error("Lane step cannot contain the reserved footprint and gap");
  }
  const laneEnds = [], nodes = new Map();
  for (const item of items) {
    const left = item.main - item.along / 2;
    let lane = laneEnds.findIndex((end) => left >= end + gap);
    if (lane < 0) lane = laneEnds.length;
    laneEnds[lane] = item.main + item.along / 2;
    const cross = crossStart + lane * crossStep;
    const x = horizontal ? item.main : cross;
    const y = horizontal ? cross : item.main;
    if (x - item.width / 2 < bounds.x || x + item.width / 2 > bounds.x + bounds.width ||
        y - item.height / 2 < bounds.y || y + item.height / 2 > bounds.y + bounds.height) {
      throw new Error("Stack capacity or numeric range exceeds bounds at " + item.record.id +
        "; revise the reserved space, scale or explicit aggregation");
    }
    nodes.set(item.record.id, { id: item.record.id, x, y, area: item.area, opacity: 1 });
  }
  return nodes;
}

// contains(x, y) supplies a normalized shape.
export function maskSlots(columns, rows, contains) {
  if (!Number.isSafeInteger(columns) || !Number.isSafeInteger(rows) ||
      columns < 2 || rows < 2 || typeof contains !== "function") {
    throw new Error("Mask sampling needs a predicate and at least two rows and columns");
  }
  const slots = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      const point = { x: x / (columns - 1), y: y / (rows - 1) };
      if (contains(point.x, point.y)) slots.push(point);
    }
  }
  return slots;
}

// Read RGBA samples, not data records. Coordinates occupy a centered square so
// a square target preserves the source aspect ratio, including transparent space.
// The predicate selects the intended mask; this does not remove a background.
export function pixelSlots({ width, height, data }, {
  step = 4, accept = (_r, _g, _b, alpha) => alpha >= 128, includeColor = false,
} = {}) {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1 ||
      data?.length !== width * height * 4 || !Number.isSafeInteger(step) || step < 1 ||
      typeof accept !== "function") {
    throw new Error("Pixel sampling needs RGBA dimensions, a positive integer step and a predicate");
  }
  const side = Math.max(width, height), slots = [];
  for (let y = Math.min(Math.floor(step / 2), height - 1); y < height; y += step) {
    for (let x = Math.min(Math.floor(step / 2), width - 1); x < width; x += step) {
      const offset = (y * width + x) * 4;
      if (accept(data[offset], data[offset + 1], data[offset + 2], data[offset + 3])) {
        const point = { x: (x + .5 + (side - width) / 2) / side,
          y: (y + .5 + (side - height) / 2) / side };
        if (includeColor) point.rgba = [data[offset], data[offset + 1], data[offset + 2], data[offset + 3]];
        slots.push(point);
      }
    }
  }
  return slots;
}

// Deterministic unique assignment, not optimal transport or collision solving.
export function slotLayout(records, slots, { bounds, areaOf = () => 16 }) {
  keyed(records);
  checkBounds(bounds);
  if (slots.length < records.length) throw new Error("Not enough unique slots for the records");
  if (new Set(slots.map((p) => JSON.stringify([p.x, p.y]))).size !== slots.length ||
      slots.some((p) => !Number.isFinite(p.x) || !Number.isFinite(p.y) ||
        p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1)) {
    throw new Error("Slots must be unique normalized coordinates");
  }
  const ordered = [...records].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const areas = ordered.map(areaOf);
  const margin = areas.reduce((max, area) => Math.max(max, radiusForArea(area)), 0);
  if (margin * 2 > Math.min(bounds.width, bounds.height)) {
    throw new Error("A unit exceeds the available slot-layout bounds");
  }
  return new Map(ordered.map((record, index) => {
    const slot = slots[ordered.length === 1 ? Math.floor(slots.length / 2)
      : Math.floor(index * (slots.length - 1) / (ordered.length - 1))];
    return [record.id, {
      id: record.id,
      x: bounds.x + margin + slot.x * (bounds.width - margin * 2),
      y: bounds.y + margin + slot.y * (bounds.height - margin * 2),
      area: areas[index],
      opacity: 1,
    }];
  }));
}
