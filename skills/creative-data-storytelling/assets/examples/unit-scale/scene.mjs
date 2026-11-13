import { at, clamp01, keyed, lerp, linearScale, mixScale } from "../../runtime/geometry.mjs";
import { blendWithAnnotations } from "../../runtime/motion.mjs";
import { createStage } from "../../runtime/stage.mjs";
import { reserveStageExit } from "../../runtime/scroll.mjs";
import { createSvgLayer, setSvgAttributes, svgElement } from "../../runtime/svg.mjs";

// 改写入口：基准量、等分数、重复份数、可选比较记录与 layout → pose/geometry → HTML 正文与美术。
// 所有值用同一基础单位存储。等分不改总量，重复才增加量；缩放只改像素映射。
// 秒/分/小时是本例题材。可只取拆分、重复或尺度交接，非等分组成需重写区间。
export const unitScaleExample = {
  comparisonTitle: "两次等候",
  base: { value: 60, name: "分钟", divisions: 60, partName: "秒" },
  multiple: { copies: 60, name: "小时" },
  records: [
    { id: "meal", name: "取餐", value: 360, color: "#c16b42" },
    { id: "bus", name: "候车", value: 1080, color: "#366d73" },
  ],
};
const defaultLayout = { width: 960, height: 730, left: 110, right: 855,
  baseline: 332, axisY: 534, comparisonTop: 280, comparisonRowGap: 150 };
const format = n => new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2 }).format(n);
const phase = (t, start, end) => clamp01((t - start) / (end - start));
const states = ["reference", "parts", "multiple", "compare"];

export function createUnitScaleModel(config = unitScaleExample) {
  const { base, multiple, records = [] } = config;
  if (!Number.isFinite(base?.value) || base.value <= 0 || !Number.isInteger(base.divisions) || base.divisions < 2 || base.divisions > 120 ||
      !Number.isInteger(multiple?.copies) || multiple.copies < 2 || multiple.copies > 120)
    throw new Error("Unit scale needs a positive base and 2–120 whole subdivisions and copies; change the drawing for denser quantities");
  if (!base.name || !base.partName || !multiple.name || !Array.isArray(records) || (records.length !== 0 && records.length !== 2))
    throw new Error("Unit scale needs named units and either no comparison records or two; change the drawing for more records");
  keyed(records);
  if (records.some(row => !Number.isFinite(row.value) || row.value < 0 || !row.name || !row.color))
    throw new Error("Comparison records need names, colors and nonnegative finite values in the base unit");
  const plot = { ...defaultLayout, ...config.layout };
  if (!Object.values(plot).every(Number.isFinite) || plot.width <= 0 || plot.height <= 0 ||
      plot.left < 0 || plot.right <= plot.left || plot.right + 60 > plot.width ||
      plot.baseline < 76 || plot.baseline + 115 > plot.axisY || plot.axisY + 40 > plot.height ||
      (records.length && (plot.comparisonTop < 109 || plot.comparisonRowGap < 100 ||
        plot.comparisonTop + plot.comparisonRowGap + 124 > plot.height - 120)))
    throw new Error("Unit scale layout needs a finite plot and room for bars, labels and axes; adjust layout or the drawing");
  const total = base.value * multiple.copies, part = base.value / base.divisions;
  if (!Number.isFinite(total) || part <= 0) throw new Error("Unit scale quantities exceed finite range");
  const maximum = Math.max(total, ...records.map(row => row.value)) * 1.05;
  const comparisonUnits = Math.max(2, ...records.map(row => row.value / base.value));
  const magnitude = 10 ** Math.floor(Math.log10(comparisonUnits / 4));
  const step = [1, 2, 5, 10].find(n => n * magnitude >= comparisonUnits / 4) * magnitude;
  const comparisonMaximum = Math.ceil(comparisonUnits / step) * step * base.value;
  return { ...config, records, layout: plot, total, part, maximum, byId: new Map(records.map(row => [row.id, row])),
    smallScale: linearScale([0, base.value * 1.05], [plot.left, plot.right]),
    wideScale: linearScale([0, maximum], [plot.left, plot.right]),
    comparisonScale: linearScale([0, comparisonMaximum * 1.05], [plot.left, plot.right]),
    comparisonTicks: Array.from({ length: Math.round(comparisonMaximum / base.value / step) + 1 }, (_, i) => i * step * base.value),
  };
}

export function unitScalePose(id, model = createUnitScaleModel()) {
  if (!states.includes(id)) throw new Error("Unknown unit scale state: " + id);
  if (id === "compare" && !model.records.length) throw new Error("The compare state needs two comparison records; omit that reading step when records are absent");
  const plot = model.layout;
  const wide = id === "multiple" || id === "compare", compare = id === "compare";
  const annotations = keyed([{ id: "reading-" + id, kind: id, opacity: 1 }]);
  return { id, scale: compare ? model.comparisonScale : wide ? model.wideScale : model.smallScale, zoom: wide ? 1 : 0,
    copies: wide ? model.multiple.copies : 1, divisions: id === "parts" ? 1 : 0,
    y: compare ? plot.height - 81 : plot.baseline, height: compare ? 5 : 62,
    comparison: compare ? 1 : 0, focus: compare ? 1 : 0, referenceOpacity: compare ? .55 : 1, annotations };
}

export function blendUnitScale(a, b, t) {
  return blendWithAnnotations(a, b, t, (from, to, p) => {
    const adding = to.copies > from.copies + 1e-8, removing = to.copies < from.copies - 1e-8;
    // 先留出新范围，再接续新增份数；反向先收回份数，再靠近原基准。
    const scaleT = adding ? phase(p, 0, .43) : removing ? phase(p, .57, 1) : p;
    const quantityT = adding ? phase(p, .43, 1) : removing ? phase(p, 0, .57) : p;
    const comparisonT = adding ? phase(p, .85, 1) : p;
    return { ...to, scale: mixScale(from.scale, to.scale, scaleT), zoom: lerp(from.zoom, to.zoom, scaleT),
      copies: lerp(from.copies, to.copies, quantityT),
      divisions: lerp(from.divisions, to.divisions, removing ? scaleT : p),
      y: lerp(from.y, to.y, p), height: lerp(from.height, to.height, p),
      referenceOpacity: lerp(from.referenceOpacity, to.referenceOpacity, p), focus: lerp(from.focus, to.focus, p),
      comparison: lerp(from.comparison, to.comparison, comparisonT) };
  });
}

// 份数使用显露范围，完整单份长度始终等于 base.value * 当前尺度。
export function unitScaleGeometry(model, pose) {
  const units = Array.from({ length: model.multiple.copies }, (_, i) => ({
    id: "reference-" + i, value: model.base.value, start: i * model.base.value,
    x: at(pose.scale, i * model.base.value), y: pose.y, height: pose.height,
    width: model.base.value * pose.scale.k, reveal: clamp01(pose.copies - i),
    opacity: i === 0 ? 1 : pose.referenceOpacity, original: i === 0,
  }));
  const comparisons = model.records.map((row, i) => ({ id: row.id, row, value: row.value,
    x: at(pose.scale, 0), y: model.layout.comparisonTop + i * model.layout.comparisonRowGap, height: 58,
    width: row.value * pose.scale.k, reveal: pose.comparison }));
  return { units, comparisons, end: at(pose.scale, pose.copies * model.base.value),
    zero: at(pose.scale, 0), secondEnd: at(pose.scale, model.part) };
}

export function unitScaleReading(model) {
  const values = model.records.map(row => row.value / model.base.value);
  return { parts: model.base.divisions, copies: model.multiple.copies,
    totalParts: model.base.divisions * model.multiple.copies, values,
    gap: values.length ? Math.abs(values[1] - values[0]) : null };
}

export function mountUnitScale(root, { config = unitScaleExample, duration = 2300 } = {}) {
  const model = createUnitScaleModel(config), readings = unitScaleReading(model);
  const $ = selector => root.querySelector(selector), svg = $("svg[data-visual]");
  const plot = model.layout;
  const steps = [...root.querySelectorAll(".copy[data-state]")].map(element => ({ element, id: element.dataset.state }));
  steps.forEach(step => unitScalePose(step.id, model));
  setSvgAttributes(svg, { viewBox: `0 0 ${plot.width} ${plot.height}` });
  root.querySelectorAll("[data-reading]").forEach(el => {
    const key = el.dataset.reading, value = key.startsWith("record:") ?
      model.byId.get(key.slice(7))?.value / model.base.value : readings[key];
    if (!Number.isFinite(value)) throw new Error("Unknown unit scale prose binding: " + key);
    el.textContent = format(value);
  });
  // 装饰表盘只识别时间主题；时长始终由共同零点的水平长度编码。
  let pose;
  const clipId = "unit-window-" + crypto.randomUUID(), defs = svgElement("defs"), clip = svgElement("clipPath", { id: clipId });
  clip.append(svgElement("rect", { x: plot.left, y: 0, width: plot.right - plot.left, height: plot.height })); defs.append(clip); svg.append(defs);
  const guides = svgElement("g", { class: "guides" });
  const axis = svgElement("g", { class: "axis" }); svg.append(guides, axis);
  const units = createSvgLayer(svg, {
    attributes: { "clip-path": `url(#${clipId})` },
    create() { const g = svgElement("g"); g.append(svgElement("rect", { rx: 2 }), svgElement("line")); return g; },
    update(g, row) {
      setSvgAttributes(g, { "data-unit": row.id, "data-value": row.value, "data-reveal": row.reveal,
        opacity: row.opacity, display: row.reveal > 0 ? null : "none" });
      setSvgAttributes(g.children[0], { x: row.x, y: row.y, height: row.height, width: row.width * row.reveal,
        fill: row.original ? "var(--accent)" : "var(--teal)" });
      setSvgAttributes(g.children[1], { x1: row.x, x2: row.x, y1: row.y, y2: row.y + row.height,
        stroke: "var(--paper)", "stroke-width": row.original ? 0 : 1.1 });
    },
  });
  const divisions = svgElement("g", { class: "divisions" });
  const divisionLines = Array.from({ length: model.base.divisions - 1 }, () => svgElement("line", { stroke: "var(--paper)", "stroke-width": 1.2 }));
  divisions.append(...divisionLines); svg.append(divisions);
  const comparison = createSvgLayer(svg, {
    create(row) { const g = svgElement("g"); g.append(svgElement("rect", { rx: 2 }),
      svgElement("text", { class: "record-name" }, row.row.name), svgElement("text", { class: "record-value" }), svgElement("g")); return g; },
    update(g, row) {
      setSvgAttributes(g, { "data-record": row.id, "data-value": row.value, opacity: clamp01(row.reveal * 4), display: row.reveal > 0 ? null : "none" });
      setSvgAttributes(g.children[0], { x: row.x, y: row.y, height: row.height, width: row.width * row.reveal, fill: row.row.color });
      setSvgAttributes(g.children[1], { x: row.x, y: row.y - 16, fill: row.row.color });
      setSvgAttributes(g.children[2], { x: row.x + row.width + 16, y: row.y + 34,
        fill: row.row.color, opacity: phase(row.reveal, .85, 1) });
      g.children[2].textContent = format(row.value / model.base.value) + " " + model.base.name;
      // 只画可分辨的完整基准份额；尾部不足一份按真实长度保留。
      g.children[3].replaceChildren();
      const interval = model.base.value * pose.scale.k, count = Math.ceil(row.value / model.base.value);
      if (interval > 5 && count <= 120) for (let i = 1; i < count; i++) {
        if (i * model.base.value < row.value * row.reveal) g.children[3].append(svgElement("line", {
          x1: row.x + i * interval, x2: row.x + i * interval, y1: row.y, y2: row.y + row.height,
          stroke: "var(--paper)", "stroke-width": 1.1 }));
      }
    },
  });
  const original = svgElement("g", { class: "original-note" });
  original.append(svgElement("path", { fill: "none", stroke: "var(--accent)", "stroke-width": 1.3 }),
    svgElement("text", { fill: "var(--accent)" }, "最初的 1 " + model.base.name));
  svg.append(original);
  const labels = createSvgLayer(svg, {
    create() { return svgElement("g", { class: "reading" }); },
    update(g, note) {
      setSvgAttributes(g, { opacity: note.opacity }); g.replaceChildren();
      const title = note.kind === "reference" ? "1 " + model.base.name : note.kind === "parts" ?
        format(readings.parts) + " " + model.base.partName : note.kind === "compare" ? model.comparisonTitle ?? "记录比较" : "1 " + model.multiple.name;
      g.append(svgElement("text", { x: plot.left, y: note.kind === "compare" ? plot.comparisonTop - 109 : pose.y - 76, class: "main-reading" }, title));
      if (note.kind === "parts") {
        const anchor = plot.left + model.part * pose.scale.k / 2;
        g.append(svgElement("path", { d: `M ${anchor} ${pose.y + pose.height + 8} v 38 h 34`, class: "pointer" }),
          svgElement("text", { x: anchor + 43, y: pose.y + pose.height + 53, class: "part-reading" }, "每一格，1 " + model.base.partName));
      }
      if (note.kind === "multiple")
        g.append(svgElement("text", { x: plot.left, y: pose.y + pose.height + 35, class: "unit-reading" },
          format(readings.copies) + " " + model.base.name + " · " + format(readings.totalParts) + " " + model.base.partName));
      if (note.kind === "compare") {
        const ends = model.records.map(row => at(pose.scale, row.value)).sort((a, b) => a - b), y = plot.comparisonTop + plot.comparisonRowGap + 95;
        g.append(svgElement("path", { d: `M ${ends[0]} ${y - 8} v 8 H ${ends[1]} v -8`, class: "gap-rule" }),
          svgElement("text", { x: (ends[0] + ends[1]) / 2, y: y + 29, "text-anchor": "middle", class: "gap-reading" },
            "相差 " + format(readings.gap) + " " + model.base.name));
      }
    },
  });
  function render(next, frame) {
    pose = next;
    const geometry = unitScaleGeometry(model, pose);
    units.render(geometry.units); comparison.render(geometry.comparisons);
    const minuteWidth = model.base.value * pose.scale.k;
    setSvgAttributes(divisions, { opacity: pose.divisions * clamp01((minuteWidth / model.base.divisions - 2) / 3) });
    divisionLines.forEach((line, i) => {
      const x = at(pose.scale, (i + 1) * model.part);
      setSvgAttributes(line, { x1: x, x2: x, y1: pose.y, y2: pose.y + pose.height });
    });
    guides.replaceChildren(svgElement("line", { x1: geometry.zero, x2: geometry.zero, y1: pose.y - 20, y2: plot.height - 95,
      stroke: "var(--rule)", "stroke-width": 1 }));
    const axisY = lerp(plot.axisY, plot.height - 81, pose.focus);
    axis.replaceChildren(svgElement("line", { x1: plot.left, x2: plot.right, y1: axisY, y2: axisY, stroke: "var(--rule)" }));
    const axes = [
      { values: [0, .25, .5, .75, 1].map(f => f * model.base.value), divisor: model.part, unit: model.base.partName, opacity: 1 - phase(pose.zoom, 0, .35) },
      { values: [0, .25, .5, .75, 1].map(f => f * model.maximum / 1.05), divisor: model.base.value, unit: model.base.name,
        opacity: phase(pose.zoom, .65, 1) * (1 - phase(pose.focus, 0, .35)) },
      { values: model.comparisonTicks, divisor: model.base.value, unit: model.base.name, opacity: phase(pose.focus, .65, 1) },
    ];
    for (const group of axes) if (group.opacity > 0) {
      const g = svgElement("g", { opacity: group.opacity });
      for (const value of group.values) {
        const x = at(pose.scale, value);
        if (x > plot.right + 1) continue;
        g.append(svgElement("line", { x1: x, x2: x, y1: axisY - 5, y2: axisY + 5, stroke: "var(--muted)" }),
          svgElement("text", { x, y: axisY + 31, "text-anchor": "middle" }, format(value / group.divisor)));
      }
      g.append(svgElement("text", { x: plot.right + 16, y: axisY + 6 }, group.unit)); axis.append(g);
    }
    setSvgAttributes(original, { opacity: pose.zoom });
    setSvgAttributes(original.children[0], { d: `M ${plot.left + minuteWidth / 2} ${pose.y - 5} v -26 h 52` });
    setSvgAttributes(original.children[1], { x: plot.left + minuteWidth / 2 + 60, y: pose.y - 24 });
    labels.render(pose.annotations);
    svg.dataset.state = pose.id; svg.dataset.moving = String(frame.moving);
    svg.dataset.copies = String(pose.copies); svg.dataset.scale = String(pose.scale.k);
    svg.setAttribute("aria-label", pose.id === "compare" ? model.records.map(row => `${row.name} ${format(row.value / model.base.value)} ${model.base.name}`).join("，") :
      `当前显露 ${format(pose.copies)} ${model.base.name}，原来的一份保持强调`);
  }
  const exit = reserveStageExit({ sticky: $(".unit-stage"), readingEnd: $("[data-reading-end]"), spacer: $(".reading-tail"), releaseRatio: .4 });
  const stage = createStage({ element: svg,
    steps,
    layout: id => unitScalePose(id, model), blend: blendUnitScale, render, duration, viewportRatio: .54 });
  document.fonts.ready.then(() => stage.refresh());
  return { sample: stage.sample, dispose() { stage.dispose(); exit.dispose(); units.dispose(); comparison.dispose(); labels.dispose(); defs.remove();
    guides.remove(); axis.remove(); divisions.remove(); original.remove(); } };
}
