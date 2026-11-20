import { lerp, linearScale, mixScale, at } from "../../runtime/geometry.mjs";
import { blendNodes } from "../../runtime/motion.mjs";

// Equal-sized INDEPENDENT samples of parcel processing time. No cross-batch tracking.
const regular = [4, 5, 6, 6, 7, 7, 8, 8, 8, 8, 9, 9, 10, 10, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14];
export const distributionExample = {
  batches: [{ id: "A", name: "第一批", values: regular },
    { id: "B", name: "第二批", values: [...regular.slice(0, 20), 15, 18, 22, 24] },
    { id: "C", name: "第三批", values: [...regular.slice(0, 18), 20, 22, 24, 26, 28, 30] }],
  threshold: 20,
};
const median = (values) => { const a = [...values].sort((x, y) => x - y), n = a.length; return (a[Math.floor((n - 1) / 2)] + a[Math.floor(n / 2)]) / 2; };
export function createDistribution({ batches, threshold }) {
  if (!Array.isArray(batches) || batches.length !== 3 || new Set(batches.map((b) => b?.id)).size !== 3 || !Number.isFinite(threshold) || threshold < 0 || batches.some((b) => !b || typeof b.id !== "string" || !b.id || typeof b.name !== "string" || !b.name || !Array.isArray(b.values) || !b.values.length || b.values.some((v) => !Number.isFinite(v) || v < 0)))
    throw new Error("Use three distinct nonempty comparable batches and finite nonnegative hours.");
  const records = batches.flatMap((b) => b.values.map((hours, i) => ({ id: `${b.id}:${i}`, batch: b.id, hours })));
  const byId = new Map(records.map((r) => [r.id, r]));
  const summaries = batches.map((b) => ({ ...b, count: b.values.length, mean: b.values.reduce((s, v) => s + v, 0) / b.values.length,
    median: median(b.values), tail: b.values.filter((v) => v >= threshold).length }));
  const first = summaries[0], last = summaries.at(-1);
  const selected = records.filter((r) => r.batch === last.id).sort((a, b) => b.hours - a.hours)[0];
  const fullEnd = Math.ceil(Math.max(threshold, ...records.map((r) => r.hours)) / 6) * 6 + 6;
  const focusStart = Math.max(0, threshold - 2);
  const focusEnd = Math.max(focusStart + 6, Math.max(...first.values, ...last.values) + 2);
  const readings = { selected: selected.hours, threshold, count: last.count, tail: last.tail,
    firstMean: first.mean.toFixed(1), lastMean: last.mean.toFixed(1), firstMedian: first.median, lastMedian: last.median };
  function layout(id) {
    if (!["case", "history", "compare", "tail"].includes(id)) throw new Error("Unknown distribution state: " + id);
    const domain = id === "tail" ? [focusStart, focusEnd] : [0, fullEnd];
    const scale = linearScale(domain, [170, 900]), nodes = new Map(), guides = new Map(), rows = new Map();
    // One mark size across visible batches; repeated hours fit below the row heading.
    const visibleBatches = id === "history" ? summaries : [first, last];
    const tallest = Math.max(1, ...visibleBatches.flatMap(b => {
      const counts = new Map();
      for (const value of b.values) if (id !== "tail" || value >= threshold)
        counts.set(value, (counts.get(value) ?? 0) + 1);
      return [...counts.values()];
    }));
    const radius = id === "case" ? 32 : Math.min(id === "tail" ? 11 : 7, 65 / (1 + (tallest - 1) * 18 / 7));
    const pitch = radius * 18 / 7;
    summaries.forEach((b, i) => {
      const y = id === "history" ? 150 + i * 178 : id === "case" ? 330 : i === 0 ? 235 : i === 2 ? 465 : 350;
      const visible = id === "history" || (id !== "case" && i !== 1), stacks = new Map();
      rows.set(b.id, { y, opacity: Number(visible) });
      for (const record of records.filter((r) => r.batch === b.id)) {
        const stack = stacks.get(record.hours) ?? 0; stacks.set(record.hours, stack + 1);
        const show = id === "case" ? record.id === selected.id : visible && (id !== "tail" || record.hours >= threshold);
        nodes.set(record.id, { id: record.id, x: at(scale, record.hours), y: y - stack * pitch,
          radius, opacity: Number(show) });
      }
      guides.set(b.id, { id: b.id, x: 45, y: y + 5, text: b.name, role: "name", opacity: Number(visible || id === "case" && i === 2) });
      const key = `${b.id}:${id === "tail" ? "tail" : id === "compare" ? "count" : "summary"}`;
      guides.set(key, { id: key, x: 170, y: y - 90, text: id === "tail" ? `≥ ${threshold} 小时：${b.tail} / ${b.count} 件`
        : id === "compare" ? `${b.count} 件` : `${b.count} 件 · 均值 ${b.mean.toFixed(1)} · 中位数 ${b.median}`, role: "reading", opacity: Number(visible) });
    });
    guides.set("selected", { id: "selected", x: at(scale, selected.hours), y: 285,
      text: `${selected.hours} 小时`, role: "number", opacity: Number(id === "case") });
    return { id, nodes, guides, scale, domain, rows, threshold: Number(id === "tail"), means: Number(id === "compare") };
  }
  function statistics(pose) {
    return summaries.flatMap(batch => ["mean", "median"].map(kind => {
      const row = pose.rows.get(batch.id);
      return { id: `${kind}:${batch.id}`, kind, value: batch[kind], x: at(pose.scale, batch[kind]),
        top: row.y - 65, bottom: row.y + 24, labelY: row.y + (kind === "mean" ? -75 : 52),
        opacity: pose.means * row.opacity };
    }));
  }
  function blend(from, to, t) {
    if (t <= 0) return from;
    if (t >= 1) return to;
    const scale = mixScale(from.scale, to.scale, t);
    const nodes = blendNodes(from.nodes, to.nodes, t, ["x", "y", "radius", "opacity"]);
    for (const [id, node] of nodes) {
      // Every visible point and the axis use ONE interpolated scale.
      node.x = at(scale, byId.get(id).hours);
      if (to.id === "tail" && byId.get(id).hours < threshold) node.opacity = from.nodes.get(id).opacity * Math.max(0, 1 - t * 4);
    }
    const guides = blendNodes(from.guides, to.guides, t, ["x", "y", "opacity"]);
    for (const [id, guide] of guides) {
      const a = from.guides.get(id), b = to.guides.get(id);
      const definition = to.guides.get(id) ?? from.guides.get(id);
      Object.assign(guide, { text: definition.text, role: definition.role });
      if (!b) { guide.y = a.y - 16 * t; guide.opacity = a.opacity * Math.max(0, 1 - t / .45); }
      if (!a) { guide.y = b.y + 16 * (1 - t); guide.opacity = b.opacity * Math.max(0, (t - .3) / .7); }
    }
    const rows = new Map([...to.rows].map(([id, b]) => { const a = from.rows.get(id); return [id, { y: lerp(a.y, b.y, t), opacity: lerp(a.opacity, b.opacity, t) }]; }));
    return { id: to.id, nodes, guides, scale, domain: [(170 - scale.b) / scale.k, (900 - scale.b) / scale.k], rows,
      threshold: lerp(from.threshold, to.threshold, t), means: lerp(from.means, to.means, t) };
  }
  return { records, byId, summaries, selected, readings, threshold, layout, blend, statistics };
}
