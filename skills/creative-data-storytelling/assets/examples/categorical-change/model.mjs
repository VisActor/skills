import { clamp01, lerp } from "../../runtime/geometry.mjs";

export const states = ["before", "after"];
export const geometry = { width: 1200, start: 212, end: 1134, pitch: 43, laneHeight: 38, minHeight: 460 };

// Two matched observations. The independent attribute keeps its meaning and color.
export function createCategoricalChange({ categories, attributes, records }, { width = 1200, height = 520 } = {}) {
  if (![width, height].every(n => Number.isFinite(n) && n > 0) || width <= geometry.start + 66)
    throw new Error("Drawing width must leave positive space after the label and end margins; height must be positive");
  const named = rows => Array.isArray(rows) && rows.length > 0 &&
    rows.every(row => typeof row.id === "string" && row.id && typeof row.label === "string" && row.label) &&
    new Set(rows.map(row => row.id)).size === rows.length;
  if (!named(categories) || categories.length < 2)
    throw new Error("Categories need at least two distinct IDs and labels");
  if (!named(attributes) || attributes.some(row => !/^#[a-f\d]{6}$/i.test(row.color)))
    throw new Error("Attributes need distinct IDs, labels and hex colors");
  const categoryIds = new Set(categories.map(row => row.id));
  const attributeIndex = new Map(attributes.map((row, index) => [row.id, index]));
  if (!Array.isArray(records) || !records.length || records.some(row =>
    typeof row.id !== "string" || !row.id || !categoryIds.has(row.before) ||
    !categoryIds.has(row.after) || !attributeIndex.has(row.attribute)) ||
    new Set(records.map(row => row.id)).size !== records.length)
    throw new Error("Records need unique IDs, two known categories and one known attribute");
  // Order only schedules the drawing; IDs are never parsed for data or position.
  const people = records.map((row, order) => ({ ...row, order, fill: attributes[attributeIndex.get(row.attribute)].color }));
  const readings = {
    total: people.length,
    before: categories.map(category => people.filter(row => row.before === category.id).length),
    after: categories.map(category => people.filter(row => row.after === category.id).length),
    attributes: attributes.map(attribute => people.filter(row => row.attribute === attribute.id).length),
    changed: people.filter(row => row.before !== row.after).length,
  };
  // Both observations share one pitch. A larger group must occupy more space.
  const plot = { ...geometry, width, end: width - 66 };
  const columns = Math.ceil(Math.max(...readings.before, ...readings.after) / 3);
  const pitch = Math.min(geometry.pitch, (plot.end - plot.start) / columns);
  const scale = Math.min(1.4, pitch / 18);

  function layout(state, { height: availableHeight = height } = {}) {
    let height = availableHeight;
    if (!states.includes(state)) throw new Error("Unknown distribution state: " + state);
    if (!Number.isFinite(height) || height <= 0) throw new Error("Layout height must be positive");
    height = Math.max(geometry.minHeight, 144 + (categories.length - 1) * 150, height);
    const rows = categories.map((_, index) => 96 + (height - 192) * index / (categories.length - 1));
    const nodes = new Map();
    categories.forEach((category, groupIndex) => {
      const members = people.filter(row => row[state] === category.id)
        .sort((a, b) => attributeIndex.get(a.attribute) - attributeIndex.get(b.attribute) || a.order - b.order);
      members.forEach((row, index) => nodes.set(row.id, {
        ...row, group: category.id,
        x: plot.start + (Math.floor(index / 3) + .5) * pitch,
        y: rows[groupIndex] + (index % 3 - 1) * geometry.laneHeight, scale,
      }));
    });
    return { state, nodes, rows, height, counts: [...readings[state]], progress: states.indexOf(state) };
  }
  return { categories, attributes, records: people, readings, plot, layout };
}

const bezier = (a, b, p, c1, c2) => {
  const q = 1 - p;
  return q ** 3 * a + 3 * q * q * p * c1 + 3 * q * p * p * c2 + p ** 3 * b;
};

// Cross-group motion connects matched observations; paths are not measured journeys.
export function blend(from, to, progress) {
  const t = clamp01(progress);
  if (t === 0) return from;
  if (t === 1) return to;
  if (from.nodes.size !== to.nodes.size || [...from.nodes.keys()].some(id => !to.nodes.has(id)))
    throw new Error("Distribution change requires the same matched IDs in both observations");
  const nodes = new Map();
  for (const [id, b] of to.nodes) {
    const a = from.nodes.get(id);
    const delay = b.order % 11 / 11 * .14;
    const p = clamp01((t - delay) / (1 - delay));
    const dx = b.x - a.x, dy = b.y - a.y;
    let x, y;
    if (a.group !== b.group) {
      const bend = Math.sign(dy) * (52 + b.order % 29);
      x = bezier(a.x, b.x, p, lerp(a.x, b.x, .3) + bend, lerp(a.x, b.x, .7) + bend);
      y = bezier(a.y, b.y, p, a.y + dy * .16, b.y - dy * .16);
    } else {
      x = lerp(a.x, b.x, p);
      y = lerp(a.y, b.y, p) + Math.sin(Math.PI * p) * Math.min(12, Math.abs(dx) * .08) * Math.sign(dx);
    }
    nodes.set(id, { ...b, x, y, scale: lerp(a.scale, b.scale, p), group: p < .5 ? a.group : b.group });
  }
  return { state: to.state, nodes, rows: from.rows.map((y, index) => lerp(y, to.rows[index], t)),
    height: lerp(from.height, to.height, t), counts: to.counts, progress: lerp(from.progress, to.progress, t) };
}
