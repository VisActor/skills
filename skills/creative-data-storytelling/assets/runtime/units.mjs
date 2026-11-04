// Optional layouts: reuse only when these arrangements fit the chosen design.
import { areaFor, at, keyed, linearScale, radiusForArea } from "./geometry.mjs";

function ordered(rows) {
  keyed(rows);
  return [...rows].sort((a, b) => a.id.localeCompare(b.id));
}

// One pixel area calibration across comparable states. Slots reserve the largest
// count/weight radius, so toggling weight does not arbitrarily move centers.
export function groupLayout(rows, groups, {
  width, height, weighted = false, countArea = 64, areaPerUnit = 5,
}) {
  const sorted = ordered(rows);
  if (!groups.length || new Set(groups).size !== groups.length)
    throw new Error("Groups must be nonempty and unique");
  if (sorted.some((row) => !groups.includes(row.group)))
    throw new Error("Every record needs a declared group");
  const maxArea = Math.max(countArea, ...sorted.map((row) => areaFor(row.weight, areaPerUnit)));
  const gap = radiusForArea(maxArea) * 2 + 6;
  const columns = Math.max(1, Math.floor((width - 100) / gap));
  const lane = (height - 100) / groups.length;
  const nodes = new Map();
  for (const [index, group] of groups.entries()) {
    const members = sorted.filter((row) => row.group === group);
    const rowCount = Math.ceil(members.length / columns);
    if (rowCount * gap > lane - 24) throw new Error("Unit layout needs more height, less density, or a new shared calibration");
    for (const [i, row] of members.entries()) {
      nodes.set(row.id, {
        id: row.id, row, x: 65 + (i % columns) * gap,
        y: 62 + index * lane + Math.floor(i / columns) * gap,
        area: weighted ? areaFor(row.weight, areaPerUnit) : countArea, opacity: 1,
      });
    }
  }
  return nodes;
}

// Exact-value stacks: vertical stacking is count/avoidance, not another measure.
// This deliberately does not pretend to be a universal beeswarm algorithm.
export function distributionLayout(rows, groups, {
  width, height, domain = [0, 100], countArea = 64,
}) {
  const sorted = ordered(rows), scale = linearScale(domain, [65, width - 35]);
  const lane = (height - 100) / groups.length;
  const gap = radiusForArea(countArea) * 2 + 3, stacks = new Map(), nodes = new Map();
  for (const row of sorted) {
    const group = groups.indexOf(row.group);
    if (group < 0 || !Number.isFinite(row.value)) throw new Error("Distribution requires a declared group and finite value");
    const bucket = JSON.stringify([row.group, row.value]);
    const count = stacks.get(bucket) ?? 0;
    if ((count + 1) * gap > lane - 18) throw new Error("Exact-value stack exceeds its lane; change layout or shared calibration");
    stacks.set(bucket, count + 1);
    nodes.set(row.id, {
      id: row.id, row, x: at(scale, row.value), y: 45 + (group + 1) * lane - count * gap,
      area: countArea, opacity: 1,
    });
  }
  return { nodes, scale };
}

export function maskSlots(columns, rows, contains) {
  if (!Number.isInteger(columns) || !Number.isInteger(rows) || columns < 2 || rows < 2)
    throw new Error("Mask grid needs at least two rows and columns");
  const slots = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < columns; x++) {
    const point = { x: x / (columns - 1), y: y / (rows - 1) };
    if (contains(point.x, point.y)) slots.push(point);
  }
  return slots;
}

export function silhouetteLayout(rows, slots, { x, y, width, height, countArea = 64 }) {
  const sorted = ordered(rows);
  if (slots.length < sorted.length) throw new Error("Insufficient unique silhouette slots; simplify the shape or separate decoration");
  if (new Set(slots.map((p) => p.x + ":" + p.y)).size !== slots.length ||
      slots.some((p) => !Number.isFinite(p.x) || !Number.isFinite(p.y)))
    throw new Error("Silhouette slots must be unique finite coordinates");
  return new Map(sorted.map((row, i) => {
    const slot = slots[sorted.length === 1 ? Math.floor(slots.length / 2)
      : Math.floor(i * (slots.length - 1) / (sorted.length - 1))];
    return [row.id, {
      id: row.id, row, x: x + slot.x * width, y: y + slot.y * height,
      area: countArea, opacity: 1,
    }];
  }));
}
