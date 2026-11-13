import { blendNodes } from "../../runtime/motion.mjs";
import { createSvgLayer, svgElement, setSvgAttributes } from "../../runtime/svg.mjs";
import { createCopyHandoff } from "../../runtime/copy.mjs";
import { connectReading } from "../../stage-wiring/connect.mjs";

// Equal event-day totals can hide different experiences. Keep each day's identity
// through count, calendar and run length. Derived from the unit example; rendering
// and reading use this Skill's runtime. The two-store story is an editable example.
export const frequencyExample = {
  days: 28,
  groups: [
    { id: "A", name: "甲店", color: "#286d70", outOfStock: [2, 6, 10, 14, 18, 22] },
    { id: "B", name: "乙店", color: "#ac5035", outOfStock: [9, 10, 11, 12, 13, 14] },
  ],
};

// Only neighboring, observed event-days join. An unobserved day breaks the run.
export function consecutiveRuns(rows) {
  const runs = [];
  for (const row of [...rows].sort((a, b) => a.day - b.day)) {
    if (row.outOfStock !== true) continue;
    const previous = runs.at(-1)?.at(-1);
    if (previous && row.day === previous.day + 1) runs.at(-1).push(row);
    else runs.push([row]);
  }
  return runs;
}

export function createFrequency({ days, groups, layout: space = {} }) {
  if (!Number.isInteger(days) || days < 1 || !Array.isArray(groups) || groups.length !== 2 ||
      groups.some(g => !g.id || !g.name || !g.color) || new Set(groups.map(g => g.id)).size !== 2)
    throw new Error("Frequency comparison needs a positive daily window and two named, distinct groups");
  const plot = { width: 1100, height: 450, left: 225, right: 1050, firstY: 135, rowGap: 185, ...space };
  if (Object.values(plot).some(n => !Number.isFinite(n)) || plot.left < 0 || plot.right > plot.width ||
      plot.right <= plot.left || plot.firstY <= 0 || plot.rowGap <= 0 || plot.firstY + plot.rowGap >= plot.height)
    throw new Error("Frequency layout needs finite bounds with room for two rows");
  const records = groups.flatMap(group => {
    const events = group.outOfStock, unknown = group.unknown ?? [];
    if (!Array.isArray(events) || !Array.isArray(unknown) ||
        new Set([...events, ...unknown]).size !== events.length + unknown.length ||
        [...events, ...unknown].some(day => !Number.isInteger(day) || day < 1 || day > days))
      throw new Error("Event and unknown days must be distinct, disjoint and inside the observed window");
    return Array.from({ length: days }, (_, i) => ({ id: `${group.id}:${i + 1}`, group: group.id,
      day: i + 1, outOfStock: unknown.includes(i + 1) ? null : events.includes(i + 1) }));
  });
  const byId = new Map(records.map(r => [r.id, r]));
  const summaries = groups.map(group => {
    const rows = records.filter(r => r.group === group.id), runs = consecutiveRuns(rows);
    return { ...group, rows, runs, count: rows.filter(r => r.outOfStock === true).length,
      longest: Math.max(0, ...runs.map(run => run.length)) };
  });
  const runById = new Map();
  summaries.forEach(group => group.runs.forEach((run, index) => run.forEach((row, position) =>
    runById.set(row.id, { index, position }))));
  const longest = Math.max(1, ...summaries.map(g => g.longest));
  const span = plot.right - plot.left, timeStep = span / days;
  const countStep = Math.min(85, span / Math.max(1, ...summaries.map(g => g.count)));
  const runStep = Math.min(85, span / longest);
  const stackStep = Math.min(27, (plot.rowGap - 35) / Math.max(1, ...summaries.map(g => g.runs.length)));
  if (Math.min(timeStep, countStep, runStep, stackStep) <= 3)
    throw new Error("Frequency cards do not fit: enlarge the layout or use a shorter daily window");
  const readings = { days };
  summaries.forEach((g, i) => Object.assign(readings, {
    [`group${i}Name`]: g.name, [`group${i}Count`]: g.count,
    [`group${i}Runs`]: g.runs.length, [`group${i}Longest`]: g.longest,
    [`group${i}Start`]: g.runs[0]?.[0].day ?? "—", [`group${i}End`]: g.runs[0]?.at(-1).day ?? "—",
  }));

  function layout(id) {
    if (!["count", "calendar", "runs"].includes(id)) throw new Error("Unknown frequency state: " + id);
    const nodes = new Map(), labels = new Map(), bands = new Map();
    const label = (key, x, y, text, role, anchor = "start") =>
      labels.set(key, { id: key, x, y, text, role, anchor, opacity: 1 });
    summaries.forEach((group, index) => {
      const centerY = plot.firstY + index * plot.rowGap;
      const active = group.rows.filter(r => r.outOfStock === true);
      group.rows.forEach(row => {
        const run = runById.get(row.id), event = row.outOfStock === true;
        const step = id === "calendar" ? timeStep : id === "runs" ? runStep : countStep;
        const x = id === "calendar" || !event ? plot.left + (row.day - .5) * timeStep
          : plot.left + step / 2 + (id === "runs" ? run.position : active.indexOf(row)) * step;
        const y = id === "runs" && event
          ? centerY + (run.index - (group.runs.length - 1) / 2) * stackStep : centerY;
        nodes.set(row.id, { id: row.id, x, y, width: id === "count" ? Math.min(58, step - 3) : step - 3,
          height: id === "runs" ? Math.min(23, stackStep - 3) : 54,
          opacity: event || id === "calendar" ? 1 : 0, dayLabel: id === "runs" ? 0 : 1 });
      });
      group.runs.forEach((run, index) => {
        const first = nodes.get(run[0].id), last = nodes.get(run.at(-1).id);
        const key = `run:${group.id}:${index}`;
        bands.set(key, { id: key, x: (first.x + last.x) / 2, y: centerY + 37,
          width: last.x - first.x + first.width, color: group.color,
          opacity: Number(id === "calendar" && run.length > 1) });
        if (id === "calendar" && run.length > 1)
          label(key, (first.x + last.x) / 2, centerY + 70, `连续 ${run.length} 天`, "run-label", "middle");
      });
      label(`name:${group.id}`, 40, centerY - 5, group.name, "group-name");
      label(`reading:${group.id}:${id === "runs" ? "runs" : "count"}`, 40, centerY + 30,
        id === "runs" ? `${group.runs.length} 次 · 最长 ${group.longest} 天` : `缺货 ${group.count} 天`, "reading");
    });
    if (id === "calendar") {
      label("axis:date", plot.left, 32, `观察窗口：第 1—${days} 天`, "caption");
    } else if (id === "runs") {
      label("axis:duration", plot.left, plot.height - 48, "缺货开始后的第几天", "caption");
      for (let day = 1; day <= longest; day++)
        label(`duration:${day}`, plot.left + (day - .5) * runStep, plot.height - 15, day, "tick", "middle");
    }
    return { id, nodes, labels, bands };
  }

  function blend(from, to, t) {
    if (t <= 0) return from;
    if (t >= 1) return to;
    const nodes = blendNodes(from.nodes, to.nodes, t, ["x", "y", "width", "height", "opacity", "dayLabel"]);
    // Neighboring dates share a gentle bend; no unobserved days are invented.
    for (const [id, node] of nodes) {
      const a = from.nodes.get(id), b = to.nodes.get(id);
      if (a.x !== b.x || a.y !== b.y) node.y -= 14 * Math.sin(Math.PI * t);
    }
    const labels = blendNodes(from.labels, to.labels, t, ["x", "y", "opacity"]);
    for (const [id, item] of labels) {
      if (!to.labels.has(id)) item.opacity *= Math.max(0, 1 - t / .25);
      if (!from.labels.has(id)) item.opacity *= Math.max(0, (t - .55) / .45);
    }
    const bands = blendNodes(from.bands, to.bands, t, ["x", "y", "width", "opacity"]);
    return { id: to.id, nodes, labels, bands };
  }
  return { records, byId, summaries, readings, plot, layout, blend };
}

export function mountFrequency(root, { config = frequencyExample, duration = 1250 } = {}) {
  const model = createFrequency(config), $ = selector => root.querySelector(selector);
  const svg = $("svg[data-visual]"), stage = $(".frequency-stage"), panels = $(".reading-panels");
  svg.setAttribute("viewBox", `0 0 ${model.plot.width} ${model.plot.height}`);
  for (const element of root.querySelectorAll("[data-value]")) {
    if (!(element.dataset.value in model.readings)) throw new Error("Unknown frequency reading: " + element.dataset.value);
    element.textContent = model.readings[element.dataset.value];
  }
  const glyphs = createSvgLayer(svg, {
    create(node) {
      const row = model.byId.get(node.id), category = model.summaries.find(g => g.id === row.group);
      const g = svgElement("g", { "data-record": node.id });
      g.append(svgElement("rect", { fill: row.outOfStock ? category.color : row.outOfStock === null ? "none" : "#e1e5dd",
        stroke: row.outOfStock === null ? "#81908a" : "none", "stroke-dasharray": row.outOfStock === null ? "3 3" : null, rx: 2 }),
      svgElement("path", { stroke: "#fffdf7", "stroke-opacity": .5 }),
      svgElement("text", { "text-anchor": "middle", "dominant-baseline": "middle", class: "day",
        style: `fill:${row.outOfStock ? "#fffdf7" : "#586962"}` }, row.day),
      svgElement("title", {}, `${category.name} · 第 ${row.day} 天 · ${row.outOfStock === null ? "未知" : row.outOfStock ? "缺货" : "有货"}`));
      return g;
    },
    update(g, node) {
      setSvgAttributes(g, { transform: `translate(${node.x} ${node.y})`, opacity: node.opacity,
        "pointer-events": node.opacity < .01 ? "none" : "auto" });
      setSvgAttributes(g.children[0], { x: -node.width / 2, y: -node.height / 2, width: node.width, height: node.height });
      setSvgAttributes(g.children[1], { d: `M${-node.width / 2} ${-node.height / 2 + 8}h${node.width}`, opacity: node.dayLabel });
      setSvgAttributes(g.children[2], { y: 5, opacity: node.dayLabel });
    },
  });
  const bands = createSvgLayer(svg, {
    create() { return svgElement("path", { fill: "none", "stroke-width": 2 }); },
    update(path, n) { setSvgAttributes(path, { d: `M${n.x - n.width / 2} ${n.y - 5}v6h${n.width}v-6`, stroke: n.color, opacity: n.opacity }); },
  });
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
      $("[data-key]").textContent = id === "runs" ? "每格 = 一天 · 每行 = 一次连续缺货"
        : id === "count" ? "每张卡 = 一个缺货日 · 数字为日号"
        : "深色缺货 · 浅色有货" + (model.records.some(r => r.outOfStock === null) ? " · 虚框未知" : " · 数字为日号");
    },
    layout: model.layout, blend: model.blend,
    render(pose, frame) {
      glyphs.render(pose.nodes); bands.render(pose.bands); labels.render(pose.labels);
      stage.dataset.state = pose.id; stage.dataset.moving = String(frame.moving);
      if (!frame.moving) svg.setAttribute("aria-label", model.summaries.map(g =>
        `${g.name}缺货 ${g.count} 天，分为 ${g.runs.length} 次，最长 ${g.longest} 天`).join("；"));
    },
  });
  root.ownerDocument.fonts?.ready.then(() => connection.refresh());
  return { model, sample: connection.stage.sample, dispose() {
    connection.dispose(); copy.dispose(); glyphs.dispose(); bands.dispose(); labels.dispose();
  } };
}
