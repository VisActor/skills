import { at, lerp, linearScale } from "../../runtime/geometry.mjs";
import { blendWithAnnotations } from "../../runtime/motion.mjs";
import { createStage } from "../../runtime/stage.mjs";
import { reserveStageExit } from "../../runtime/scroll.mjs";
import { createSvgLayer, svgElement, setSvgAttributes } from "../../runtime/svg.mjs";

// 本段的解释：最近向上，不等于回到原水平。旧轨迹留下，才有回看的证据。
// 改写入口：下面的数据、基准、停留点，以及 index.html 的实际正文与构图。
// 停留点由问题决定，不必四段，也不必经历回落；showComparison 表示此时要比较基准。
// 这只是一个可改写的完整片段，不是通用图表组件。设计取舍见 HTML 文末说明。
export const orders = [72, 85, 94, 100, 61, 73, 85, 93, 97].map((value, i) => ({
  id: `year-${2016 + i}`, year: 2016 + i, value,
}));
export const historyExample = {
  rows: orders, baselineId: "year-2019", metric: "模拟订单量", unit: "万单",
  stops: [
    { id: "before", throughId: "year-2019" },
    { id: "fall", throughId: "year-2020" },
    { id: "recovery", throughId: "year-2024" },
    { id: "compare", throughId: "year-2024", showComparison: true },
  ],
  // 可省略，按全体记录计算固定范围。这里手动留出上下空间；折线用位置编码量值。
  axis: { domain: [40, 110], ticks: [40, 60, 80, 100] },
};
const plot = { left: 75, right: 1020, top: 65, bottom: 470 };
const number = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2 });
let nextHistoryInstance = 0;

// 只集中必须联动的事实和尺度。标题、结论、阶段选择与版式仍由创作者编写。
export function createHistoryModel(config) {
  const { rows, baselineId, stops, metric, unit } = config;
  if (!Array.isArray(rows) || rows.length < 2 || rows.some((row, i) =>
    !row.id || !Number.isFinite(row.value) || !Number.isFinite(row.year) ||
    (i > 0 && row.year <= rows[i - 1].year)) || new Set(rows.map((row) => row.id)).size !== rows.length)
    throw new Error("History needs distinct observations in increasing year order with finite values");
  const byId = new Map(rows.map((row) => [row.id, row])), baseline = byId.get(baselineId);
  if (!baseline) throw new Error("History baselineId must identify an existing observation: " + baselineId);
  if (!Array.isArray(stops) || !stops.length || new Set(stops.map((stop) => stop.id)).size !== stops.length)
    throw new Error("History needs reading stops with distinct ids");
  let previousYear = baseline.year;
  const readings = new Map(stops.map((stop) => {
    const row = byId.get(stop.throughId);
    if (!stop.id || !row || row.year < previousYear)
      throw new Error("History stops must name existing endpoints in order, starting at or after the baseline: " + stop.id);
    previousYear = row.year;
    return [stop.id, { ...stop, row, delta: row.value - baseline.value }];
  }));
  if (typeof metric !== "string" || !metric || typeof unit !== "string")
    throw new Error("History needs a metric label and a unit string");
  const values = rows.map((row) => row.value), low = Math.min(...values), high = Math.max(...values);
  const spread = high - low || Math.max(Math.abs(high) * 0.2, 1);
  const rawStep = spread / 4, power = 10 ** Math.floor(Math.log10(rawStep));
  const step = [1, 2, 5, 10].find((n) => n * power >= rawStep) * power;
  const domain = config.axis?.domain ?? [Math.floor((low - spread * 0.1) / step) * step,
    Math.ceil((high + spread * 0.1) / step) * step];
  if (domain.length !== 2 || !domain.every(Number.isFinite) || domain[0] >= domain[1] || domain[0] > low || domain[1] < high)
    throw new Error("History value domain must be increasing and cover every observation");
  const ticks = config.axis?.ticks ?? Array.from({ length: Math.floor((domain[1] - domain[0]) / step + 1e-9) + 1 },
    (_, i) => domain[0] + i * step);
  if (!ticks.length || ticks.some((value, i) => !Number.isFinite(value) || value < domain[0] || value > domain[1] + 1e-9 ||
    (i > 0 && value <= ticks[i - 1]))) throw new Error("History ticks must increase within the value domain");
  const format = config.formatValue ?? ((value) => number.format(value));
  return { rows, byId, baseline, readings, metric, unit, format, ticks,
    amount: (value) => `${format(value)}${unit ? " " + unit : ""}`,
    scales: { x: linearScale([rows[0].year, rows.at(-1).year], [plot.left, plot.right]),
      y: linearScale(domain, [plot.bottom, plot.top]) } };
}
const defaultHistory = createHistoryModel(historyExample);

export function historyDifference(model, readingId) {
  const reading = model.readings.get(readingId);
  if (!reading) throw new Error("Unknown history reading: " + readingId);
  return reading.delta === 0 ? "与基准持平" : `${reading.delta > 0 ? "高" : "低"} ${model.amount(Math.abs(reading.delta))}`;
}

export function historyStoryPose(mode, model = defaultHistory) {
  const reading = model.readings.get(mode);
  if (!reading) throw new Error("Unknown history reading: " + mode);
  const { baseline } = model, { row } = reading;
  const annotations = new Map();
  const add = (role, record, id) => annotations.set(id, { id, role, row: record, readingId: mode, opacity: 1 });
  add("baseline", baseline, `baseline-${baseline.id}`);
  if (row.id !== baseline.id) add("current", row, `current-${row.id}`);
  // 标注身份包含比较双方，改换端点时旧结论先退场，新结论在几何就位后出现。
  if (reading.showComparison) add("gap", row, `gap-${baseline.id}-${row.id}`);
  return { mode, through: row.year, guide: reading.showComparison ? 1 : 0, annotations };
}

export function blendHistoryStory(a, b, t) {
  return blendWithAnnotations(a, b, t, (from, to, progress) => ({
    ...to, through: lerp(from.through, to.through, progress), guide: lerp(from.guide, to.guide, progress),
  }), { exitEnd: 0.12, enterStart: 0.83 });
}

export function visibleHistory(rows, through) {
  // 移动的是显露边界；中间帧没有虚构的年度记录。
  return rows.filter((row) => row.year <= through);
}

export function mountHistoryStory(root, { config = historyExample, duration = 1400 } = {}) {
  const model = createHistoryModel(config), { rows, baseline, scales: { x, y } } = model;
  const $ = (selector) => root.querySelector(selector), svg = $("svg");
  const steps = [...root.querySelectorAll("[data-state]")].map((element) => ({ element, id: element.dataset.state }));
  if (steps.length !== config.stops.length || steps.some((step, i) => step.id !== config.stops[i].id))
    throw new Error("HTML data-state order must match the configured reading stops");
  root.querySelectorAll("[data-record]").forEach((el) => {
    const row = model.byId.get(el.dataset.record), field = el.dataset.field ?? "amount";
    if (!row || !["year", "value", "amount"].includes(field)) throw new Error("Unknown history text binding: " + el.dataset.record + "/" + field);
    el.textContent = field === "year" ? row.year : field === "value" ? model.format(row.value) : model.amount(row.value);
  });
  root.querySelectorAll("[data-gap]").forEach((el) => { el.textContent = historyDifference(model, el.dataset.gap); });

  const clipId = `history-reveal-${++nextHistoryInstance}`;
  const defs = svgElement("defs"), clip = svgElement("clipPath", { id: clipId });
  const boundary = svgElement("rect", { x: plot.left - 1, y: plot.top - 5, width: 0, height: plot.bottom - plot.top + 10 });
  clip.append(boundary); defs.append(clip); svg.append(defs);
  const grid = svgElement("g", { "aria-hidden": "true", class: "axis" });
  for (const value of model.ticks) {
    grid.append(svgElement("line", { x1: plot.left, x2: plot.right, y1: at(y, value), y2: at(y, value) }),
      svgElement("text", { x: 54, y: at(y, value) + 5, "text-anchor": "end" }, model.format(value)));
  }
  for (const row of rows) grid.append(svgElement("text", { x: at(x, row.year), y: 520, "text-anchor": "middle" }, row.year));
  grid.append(svgElement("text", { x: plot.left, y: 25 }, model.metric + (model.unit ? " / " + model.unit : "")));
  svg.append(grid);
  const path = svgElement("path", { d: rows.map((row, i) => `${i ? "L" : "M"}${at(x, row.year)},${at(y, row.value)}`).join(" "),
    "clip-path": `url(#${clipId})`, fill: "none", stroke: "var(--accent)", "stroke-width": 3.5, "stroke-linejoin": "round" });
  svg.append(path);
  const guide = svgElement("line", { x1: at(x, baseline.year), x2: at(x, baseline.year),
    y1: at(y, baseline.value), y2: at(y, baseline.value), stroke: "var(--ink)", "stroke-dasharray": "5 6", opacity: 0 });
  svg.append(guide);
  const points = createSvgLayer(svg, {
    create() { return svgElement("circle", { stroke: "var(--paper)", "stroke-width": 2 }); },
    update(circle, row) { setSvgAttributes(circle, { cx: at(x, row.year), cy: at(y, row.value),
      r: row.current ? 7 : 4.5, fill: row.current ? "var(--accent)" : "var(--history)" }); },
  });
  const labels = createSvgLayer(svg, {
    create() { return svgElement("g"); },
    update(g, item) {
      g.replaceChildren();
      setSvgAttributes(g, { opacity: item.opacity });
      const { row } = item, rowX = at(x, row.year), rowY = at(y, row.value);
      if (item.role === "gap") {
        const baseY = at(y, baseline.value), edge = rowX + 30;
        g.append(svgElement("path", { d: `M${edge - 6},${baseY}H${edge}V${rowY}H${edge - 6}`,
          stroke: "var(--accent)", "stroke-width": 2, fill: "none" }),
        svgElement("text", { x: edge, y: Math.min(baseY, rowY) - 28, "text-anchor": "end", class: "gap-label" }, historyDifference(model, item.readingId)));
      } else {
        const isBase = item.role === "baseline", roomRight = rowX < plot.right - 140;
        const previous = rows[Math.max(0, rows.indexOf(row) - 1)];
        // 当前端点旁留给差距括线；靠右时把读数放到末段连线下方。
        const labelX = isBase ? rowX : rowX + (roomRight ? 45 : 0);
        const labelY = isBase ? rowY - 22 : roomRight ? rowY + 8 : Math.max(rowY, at(y, previous.value)) + 32;
        const anchor = isBase ? (rowX < plot.left + 100 ? "start" : "middle") : roomRight ? "start" : "end";
        g.append(svgElement("text", { x: labelX, y: labelY,
          "text-anchor": anchor, class: "readout" + (isBase ? "" : " current") }, `${row.year} · ${model.format(row.value)}`));
      }
    },
  });
  function render(pose, frame) {
    setSvgAttributes(boundary, { width: at(x, pose.through) - plot.left + 2 });
    // 基准线从旧端点向当前端点延伸；保留下来的轨迹说明“从哪里比较”。
    setSvgAttributes(guide, { x2: at(x, lerp(baseline.year, pose.through, pose.guide)), opacity: pose.guide > 0 ? 1 : 0 });
    const visible = visibleHistory(rows, pose.through);
    points.render(visible.map((row) => ({ ...row, current: row === visible.at(-1) })));
    labels.render(pose.annotations);
    svg.dataset.state = pose.mode;
    svg.dataset.moving = String(frame.moving);
    if (!frame.moving) svg.setAttribute("aria-label", `${model.metric}，已显示至 ${pose.through} 年。` +
      visible.map((row) => `${row.year} 年 ${model.amount(row.value)}`).join("；") +
      (pose.guide === 1 ? `。与 ${baseline.year} 年相比，${historyDifference(model, pose.mode)}` : ""));
  }
  const exit = reserveStageExit({ sticky: $(".history-stage"), readingEnd: $("[data-reading-end]"),
    spacer: $(".reading-tail"), releaseRatio: 0.4 });
  const stage = createStage({ element: svg, steps,
    layout: (id) => historyStoryPose(id, model), blend: blendHistoryStory, render, duration, viewportRatio: 0.56,
  });
  document.fonts.ready.then(() => stage.refresh());
  return { sample: stage.sample, dispose() {
    stage.dispose(); exit.dispose(); points.dispose(); labels.dispose();
    for (const element of [defs, grid, path, guide]) element.remove();
  } };
}
