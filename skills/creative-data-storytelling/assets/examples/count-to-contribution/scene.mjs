import { lerp } from "../../runtime/geometry.mjs";
import { blendNodes } from "../../runtime/motion.mjs";
import { createSvgLayer, svgElement, setSvgAttributes } from "../../runtime/svg.mjs";
import { createCopyHandoff } from "../../runtime/copy.mjs";
import { connectReading } from "../../stage-wiring/connect.mjs";

// One observation window, the same books. Reads are events, not people or quality.
// Adapted from the unit example; the packing belongs to this small cover collection,
// while reading, interruption, copy handoff and exit use the shared runtime.
export const contributionExample = {
  groups: [{ id: "A", name: "城市书写", color: "#8bc5bd" }, { id: "B", name: "自然随笔", color: "#efac78" }],
  records: [15, 15, 15, 15, 15, 15, 120, 10, 10, 10].map((reads, i) => ({
    id: `work-${i + 1}`, name: ["街角", "夜行", "窗外", "雨巷", "来信", "慢城", "山间", "林语", "潮汐", "旷野"][i],
    group: i < 6 ? "A" : "B", reads,
  })),
};
const aspect = 1.4;
const percent = fraction => `${Math.round(fraction * 1000) / 10}%`;

// Largest first, testing corners of already placed rectangles. Same cover aspect,
// no cropping or area distortion. For long lists, choose a different composition.
export function packBooks(rows, areaOf, limit = 300) {
  const sizes = rows.map(row => ({ id: row.id, area: areaOf(row) })).map(r => ({
    ...r, width: Math.sqrt(r.area / aspect), height: Math.sqrt(r.area * aspect),
  })).sort((a, b) => b.area - a.area);
  const width = Math.max(limit, ...sizes.map(r => r.width)), placed = [], gap = 10;
  for (const item of sizes) {
    const candidates = [{ x: 0, y: 0 }, ...placed.flatMap(r => [
      { x: r.x + r.width + gap, y: r.y }, { x: r.x, y: r.y + r.height + gap },
    ])].filter(p => p.x + item.width <= width + .001 && placed.every(r =>
      p.x >= r.x + r.width + gap - .001 || p.x + item.width + gap <= r.x + .001 ||
      p.y >= r.y + r.height + gap - .001 || p.y + item.height + gap <= r.y + .001));
    candidates.sort((a, b) => a.y - b.y || a.x - b.x);
    if (!candidates.length) throw new Error("No cover placement available");
    placed.push({ ...item, ...candidates[0] });
  }
  const w = Math.max(0, ...placed.map(r => r.x + r.width)), h = Math.max(0, ...placed.map(r => r.y + r.height));
  return { width: w, height: h, nodes: placed.map(r => ({ ...r,
    x: r.x + r.width / 2 - w / 2, y: r.y + r.height / 2 - h / 2 })) };
}

export function createContribution({ records, groups, layout: space = {} }) {
  if (!Array.isArray(groups) || groups.length !== 2 || new Set(groups.map(g => g.id)).size !== 2 ||
      groups.some(g => !g.id || !g.name || !g.color) || !Array.isArray(records) || !records.length ||
      new Set(records.map(r => r.id)).size !== records.length ||
      records.some(r => !r.id || !r.name || !Number.isFinite(r.reads) || r.reads < 0 || !groups.some(g => g.id === r.group)))
    throw new Error("Contribution needs unique named records, two known groups and nonnegative reads");
  const plot = { width: 1000, height: 680, leftCenter: 290, rightCenter: 730, centerY: 365,
    packWidth: 300, maxWidth: 310, maxHeight: 270, ...space };
  if (Object.values(plot).some(n => !Number.isFinite(n) || n <= 0) || plot.rightCenter <= plot.leftCenter ||
      plot.maxWidth >= plot.rightCenter - plot.leftCenter || plot.leftCenter < plot.maxWidth / 2 ||
      plot.rightCenter + plot.maxWidth / 2 > plot.width)
    throw new Error("Contribution layout needs two separated cover areas within the canvas");
  const byId = new Map(records.map(r => [r.id, r]));
  const buckets = groups.map(g => records.filter(r => r.group === g.id));
  const totals = groups.map((g, i) => ({ ...g, count: buckets[i].length, reads: buckets[i].reduce((sum, r) => sum + r.reads, 0) }));
  const total = records.reduce((sum, r) => sum + r.reads, 0);
  if (!total) throw new Error("Contribution needs a positive total; zero readings remain visible in the count view");
  const head = [...records].sort((a, b) => b.reads - a.reads)[0], remainder = total - head.reads;
  const unitArea = 100000 / total, equalArea = 100000 / records.length;
  const packed = {
    count: buckets.map(rows => packBooks(rows, () => equalArea, plot.packWidth)),
    contribution: buckets.map(rows => packBooks(rows, r => r.reads * unitArea, plot.packWidth)),
    concentration: [[head], records.filter(r => r.id !== head.id)].map(rows => packBooks(rows, r => r.reads * unitArea, plot.packWidth)),
  };
  // One fit factor for all groups and views; fitting clouds independently would
  // erase the difference. White space and the enclosing rectangle encode nothing.
  const fit = Math.min(1, ...Object.values(packed).flat().flatMap(p =>
    [plot.maxWidth / Math.max(1, p.width), plot.maxHeight / Math.max(1, p.height)]));
  const readings = { count: records.length, total, head: head.reads, rest: remainder,
    headName: head.name, others: records.length - 1, headShare: percent(head.reads / total) };
  totals.forEach((g, i) => Object.assign(readings, {
    [`group${i}Name`]: g.name, [`group${i}Count`]: g.count, [`group${i}Reads`]: g.reads,
    [`group${i}CountShare`]: percent(g.count / records.length), [`group${i}ReadShare`]: percent(g.reads / total),
  }));
  function place(pack, cx, cy, factor, opacity = 1) {
    return pack.nodes.map(n => ({ ...n, x: cx + n.x * factor, y: cy + n.y * factor,
      area: n.area * factor ** 2, width: n.width * factor, height: n.height * factor, opacity }));
  }
  function layout(id) {
    if (!["count", "contribution", "concentration", "shares"].includes(id)) throw new Error("Unknown contribution state: " + id);
    const shares = Number(id === "shares"), nodes = new Map(), reference = new Map(), labels = new Map();
    const factor = fit * (shares ? .62 : 1), selected = packed[shares ? "contribution" : id];
    const label = (id, x, y, text, role = "name", anchor = "middle") =>
      labels.set(id, { id, x, y, text, role, anchor, opacity: 1 });
    selected.forEach((pack, i) => {
      const cx = i ? plot.rightCenter : plot.leftCenter;
      place(pack, cx, shares ? plot.height - 165 : plot.centerY, factor).forEach(n => nodes.set(n.id, n));
      const concentrated = id === "concentration";
      const name = concentrated ? i ? `其余 ${records.length - 1} 本` : `《${head.name}》` : groups[i].name;
      const value = concentrated ? i ? remainder : head.reads : id === "count" ? totals[i].count : totals[i].reads;
      label(concentrated ? `concentration:${i}` : `group:${groups[i].id}`, cx, shares ? 50 : 95, name);
      label(`reading:${id}:${i}`, cx, shares ? plot.height - 272 : 155,
        shares ? percent(totals[i].reads / total) : `${value} ${id === "count" ? "本" : "次"}`, "number");
      if (shares) label(`count-share:${i}`, cx, 112, percent(totals[i].count / records.length), "number");
    });
    records.forEach(r => reference.set(r.id, { ...nodes.get(r.id), opacity: 0 }));
    if (shares) {
      packed.count.forEach((pack, i) => place(pack, i ? plot.rightCenter : plot.leftCenter, 225, factor)
        .forEach(n => reference.set(n.id, n)));
      label("count-denominator", 25, 172, "书目", "measure", "start");
      label("count-total", 25, 202, `${records.length} 本`, "caption", "start");
      label("read-denominator", 25, plot.height - 198, "阅读", "measure", "start");
      label("read-total", 25, plot.height - 168, `${total} 次`, "caption", "start");
    }
    label(`encoding:${id}`, plot.width / 2, plot.height - 35,
      shares ? "两行各为 100% · 总封面面积相同" : id === "count" ? "等大封面 · 一本对应一条记录" : "封面面积表示阅读次数 · 颜色仍表示题材", "caption");
    return { id, nodes, reference, labels, shares };
  }
  function blend(from, to, t) {
    if (t <= 0) return from;
    if (t >= 1) return to;
    const interpolate = (a, b) => {
      const result = blendNodes(a, b, t, ["x", "y", "area", "opacity"]);
      for (const [id, n] of result) {
        n.width = Math.sqrt(n.area / aspect); n.height = Math.sqrt(n.area * aspect);
        if (a.get(id).x !== b.get(id).x || a.get(id).y !== b.get(id).y)
          n.y -= 18 * Math.sin(Math.PI * t);
      }
      return result;
    };
    const labels = blendNodes(from.labels, to.labels, t, ["x", "y", "opacity"]);
    for (const [id, item] of labels) {
      if (!to.labels.has(id)) item.opacity *= Math.max(0, 1 - t / .25);
      if (!from.labels.has(id)) item.opacity *= Math.max(0, (t - .55) / .45);
    }
    return { id: to.id, nodes: interpolate(from.nodes, to.nodes), reference: interpolate(from.reference, to.reference),
      labels, shares: lerp(from.shares, to.shares, t) };
  }
  return { records, groups, byId, totals, total, head, remainder, readings, plot,
    unitArea: unitArea * fit ** 2, layout, blend };
}

export function mountContribution(root, { config = contributionExample, duration = 1300, ending = "concentration" } = {}) {
  if (!["concentration", "shares"].includes(ending)) throw new Error("Choose concentration or shares as the final question");
  const model = createContribution(config), $ = selector => root.querySelector(selector);
  const svg = $("svg[data-visual]"), stage = $(".contribution-stage"), panels = $(".reading-panels");
  svg.setAttribute("viewBox", `0 0 ${model.plot.width} ${model.plot.height}`);
  for (const el of root.querySelectorAll("[data-ending]")) if (el.dataset.ending !== ending) el.remove();
  for (const el of root.querySelectorAll("[data-value]")) {
    if (!(el.dataset.value in model.readings)) throw new Error("Unknown contribution reading: " + el.dataset.value);
    el.textContent = model.readings[el.dataset.value];
  }
  const cover = {
    create(node) {
      const row = model.byId.get(node.id), category = model.groups.find(g => g.id === row.group);
      const g = svgElement("g", { "data-record": node.id }), art = svgElement("g");
      art.append(svgElement("rect", { x: -50, y: -70, width: 100, height: 140, fill: category.color }),
        svgElement("path", { d: "M-41 -70V70M-33 56H40", stroke: "#153334", "stroke-opacity": .35, "stroke-width": 2, fill: "none" }),
        svgElement("path", { d: row.group === model.groups[0].id ? "M-24 34V-7H-5V34M2 34V-26H24V34M-24 9H-5M2 -10H24" : "M-30 34L-6 -9L21 34ZM6 34L24 6L38 34Z",
          fill: "none", stroke: "#153334", "stroke-width": 3 }),
        svgElement("text", { x: 4, y: -43, "text-anchor": "middle", class: "cover-title" }, row.name));
      g.append(art, svgElement("title", {}, `${row.name} · ${category.name} · ${row.reads} 次阅读`));
      return g;
    },
    update(g, node) {
      setSvgAttributes(g, { transform: `translate(${node.x} ${node.y})`, opacity: node.opacity,
        "pointer-events": node.opacity < .01 ? "none" : "auto" });
      g.firstElementChild.setAttribute("transform", `scale(${node.width / 100})`);
    },
  };
  const reference = createSvgLayer(svg, { ...cover, attributes: { "aria-label": "同批书目的数量参照副本" } });
  const marks = createSvgLayer(svg, cover);
  const divider = svgElement("path", { d: `M25 328H${model.plot.width - 45}`, stroke: "var(--rule)", opacity: 0 });
  svg.append(divider);
  const labels = createSvgLayer(svg, {
    create() { return svgElement("text"); },
    update(text, n) { text.textContent = n.text; setSvgAttributes(text, { x: n.x, y: n.y, class: n.role, "text-anchor": n.anchor, opacity: n.opacity }); },
  });
  const ids = [...panels.querySelectorAll("[data-copy]")].map(el => el.dataset.copy);
  const copy = createCopyHandoff(panels), previous = $("[data-prev]"), next = $("[data-next]"), finish = $("[data-finish]");
  const connection = connectReading({ element: svg, reading: $(".scroll-track"), track: { ids },
    exit: { sticky: stage, releaseRatio: 0 }, viewportRatio: 0, duration,
    navigation: { scope: stage, previous, next },
    onReading({ id, index }) {
      copy.show(id); next.hidden = index === ids.length - 1; finish.hidden = !next.hidden;
      $("[data-position]").textContent = `${index + 1} / ${ids.length}`;
    },
    layout: model.layout, blend: model.blend,
    render(pose, frame) {
      reference.render(pose.reference); marks.render(pose.nodes); labels.render(pose.labels);
      divider.setAttribute("opacity", pose.shares);
      stage.dataset.state = pose.id; stage.dataset.moving = String(frame.moving);
      if (!frame.moving) svg.setAttribute("aria-label", pose.id === "concentration"
        ? `${model.head.name} ${model.head.reads} 次阅读，其余 ${model.records.length - 1} 本合计 ${model.remainder} 次`
        : model.totals.map(g => `${g.name} ${g.count} 本，${g.reads} 次阅读`).join("；"));
    },
  });
  root.ownerDocument.fonts?.ready.then(() => connection.refresh());
  return { model, sample: connection.stage.sample, dispose() {
    connection.dispose(); copy.dispose(); marks.dispose(); reference.dispose(); labels.dispose(); divider.remove();
  } };
}
