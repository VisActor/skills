import { at, clamp01, keyed, lerp, linearScale } from "../../runtime/geometry.mjs";
import { blendNodes, blendWithAnnotations } from "../../runtime/motion.mjs";
import { createStage } from "../../runtime/stage.mjs";
import { reserveStageExit } from "../../runtime/scroll.mjs";
import { createSvgLayer, setSvgAttributes, svgElement } from "../../runtime/svg.mjs";

// 新记录占新行，旧记录不变成另一条记录，也不与新记录相加。
// 改 records / stops / axis 后重写正文；domain 覆盖全体，保持共同零点。
// 此构图容纳七条短名称记录；更多记录需重新安排行距与阅读范围。
// 来源主张、时期顺序不是连续观测；不连接为尺长曲线。
export const recordExample = {
  metric: "一尺长度", unit: "厘米", baselineId: "qin", axis: { max: 42, ticks: [0, 10, 20, 30, 40] },
  records: [
    { id: "qin", label: "战国秦", detail: "量器推算", value: 23.2, period: "秦", source: "国博：青铜方斗说明" },
    { id: "west-han", label: "西汉", detail: "研究参考", value: 23.0, period: "两汉", source: "白云翔，2014" },
    { id: "east-han", label: "东汉", detail: "研究参考", value: 23.4, period: "两汉", source: "白云翔，2014" },
    { id: "tang-small", label: "唐 · 小尺", detail: "地方志综述", value: 24.57, period: "唐", source: "台州地区志" },
    { id: "tang-large", label: "唐 · 大尺", detail: "地方志综述", value: 29.58, period: "唐", source: "台州地区志" },
    { id: "yuan-building", label: "元 · 营造尺", detail: "营建用途", value: 31.5, period: "元", source: "熊长云《元尺考》，2023" },
    { id: "yuan-clothing", label: "元 · 裁衣尺", detail: "裁衣用途", value: 38.9, period: "元", source: "熊长云《元尺考》，2023" },
  ],
  stops: [
    { id: "reference", visible: ["qin"], focus: ["qin"] },
    { id: "han", visible: ["qin", "west-han", "east-han"], focus: ["west-han", "east-han"] },
    { id: "tang", visible: ["qin", "west-han", "east-han", "tang-small", "tang-large"], focus: ["tang-small", "tang-large"] },
    { id: "yuan", visible: ["qin", "west-han", "east-han", "tang-small", "tang-large", "yuan-building", "yuan-clothing"], focus: ["yuan-building", "yuan-clothing"] },
    { id: "difference", visible: ["qin", "west-han", "east-han", "tang-small", "tang-large", "yuan-building", "yuan-clothing"], focus: ["yuan-building", "yuan-clothing"], pair: ["yuan-building", "yuan-clothing"] },
  ],
};
const plot = { left: 205, right: 865, center: 318, rowGap: 62 };
const format = n => new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2 }).format(n);
let nextInstance = 0;

export function createRecordModel(config = recordExample) {
  const records = keyed(config.records), stops = keyed(config.stops);
  if (!records.size || !stops.size || !records.has(config.baselineId) ||
    config.records.some(row => !Number.isFinite(row.value) || row.value < 0))
    throw new Error("Record comparison needs distinct nonnegative records and an existing baseline");
  const max = config.axis?.max ?? Math.max(1, ...config.records.map(row => row.value)) * 1.15;
  const ticks = config.axis?.ticks ?? [0, max / 2, max];
  if (!Number.isFinite(max) || max <= 0 || config.records.some(row => row.value > max) ||
    !ticks.length || ticks.some((v, i) => !Number.isFinite(v) || v < 0 || v > max || (i && v <= ticks[i - 1])))
    throw new Error("Record axis must start at zero and cover every record with ordered ticks");
  let prior = [];
  for (const stop of config.stops) {
    if (!Array.isArray(stop.visible) || new Set(stop.visible).size !== stop.visible.length ||
      !stop.visible.includes(config.baselineId) || stop.visible.some(id => !records.has(id)) ||
      prior.some(id => !stop.visible.includes(id)) ||
      !Array.isArray(stop.focus) || stop.focus.some(id => !stop.visible.includes(id)) ||
      (stop.pair && (stop.pair.length !== 2 || new Set(stop.pair).size !== 2 ||
        stop.pair.some(id => !stop.visible.includes(id)))))
      throw new Error("Record stops retain earlier records and compare distinct visible ids");
    prior = stop.visible;
  }
  return { ...config, records, stops, ticks, scale: linearScale([0, max], [plot.left, plot.right]),
    format, amount: value => format(value) + " " + config.unit };
}

export function recordPose(id, model = createRecordModel()) {
  const stop = model.stops.get(id);
  if (!stop) throw new Error("Unknown record reading: " + id);
  const visible = model.records.size ? [...model.records.keys()].filter(key => stop.visible.includes(key)) : [];
  const nodes = keyed([...model.records.values()].map((row, index) => {
    const slot = visible.indexOf(row.id), shown = slot >= 0;
    return { id: row.id, row, y: plot.center + (shown ? slot - (visible.length - 1) / 2 : index - (model.records.size - 1) / 2) * plot.rowGap,
      reveal: shown ? 1 : 0, focus: stop.focus.includes(row.id) ? 1 : 0 };
  }));
  const annotations = new Map();
  if (stop.pair) {
    const [a, b] = stop.pair.map(key => model.records.get(key));
    const key = a.id + "/" + b.id;
    annotations.set(key, { id: key, a, b, value: Math.abs(b.value - a.value), opacity: 1 });
  }
  return { id, nodes, annotations };
}

export function blendRecords(from, to, t) {
  return blendWithAnnotations(from, to, t, (a, b, p) => {
    const retiring = [...a.nodes].some(([id, node]) => node.reveal > b.nodes.get(id).reveal);
    const move = retiring ? clamp01((p - .55) / .45) : clamp01(p / .35);
    const reveal = retiring ? clamp01(p / .5) : clamp01((p - .35) / .65);
    const nodes = blendNodes(a.nodes, b.nodes, p, ["focus"]);
    for (const [id, node] of nodes) {
      node.y = lerp(a.nodes.get(id).y, b.nodes.get(id).y, move);
      node.reveal = lerp(a.nodes.get(id).reveal, b.nodes.get(id).reveal, reveal);
    }
    return { ...b, nodes };
  });
}

export function recordGeometry(model, pose) {
  return [...pose.nodes.values()].map(node => {
    const zero = at(model.scale, 0), end = at(model.scale, node.row.value);
    // reveal 是入场遮罩；完整几何和数据始终不变，未就位时不显示端点读数。
    return { ...node, zero, end, width: end - zero, clipWidth: (end - zero) * node.reveal,
      labelOpacity: clamp01((node.reveal - .94) / .06) };
  });
}

export function mountRecords(root, { config = recordExample, duration = 1150 } = {}) {
  const model = createRecordModel(config), $ = selector => root.querySelector(selector), svg = $("svg");
  const prefix = "records-" + ++nextInstance, defs = svgElement("defs"), grid = svgElement("g", { class: "axis" });
  svg.append(defs, grid);
  for (const tick of model.ticks) {
    const x = at(model.scale, tick);
    grid.append(svgElement("line", { x1: x, x2: x, y1: 65, y2: 566, class: tick === 0 ? "zero" : "" }),
      svgElement("text", { x, y: 600, "text-anchor": "middle" }, model.format(tick)));
  }
  grid.append(svgElement("text", { x: plot.right, y: 640, "text-anchor": "end", class: "axis-title" }, model.metric + " / " + model.unit));
  const baseline = model.records.get(model.baselineId), baselineX = at(model.scale, baseline.value);
  const reference = svgElement("line", { x1: baselineX, x2: baselineX, stroke: "var(--reference)", "stroke-dasharray": "4 5", "stroke-width": 1.3 });
  svg.append(reference);
  const labels = new Map(), clips = new Map();
  const marks = createSvgLayer(svg, {
    create(node) {
      const clipId = prefix + "-" + labels.size;
      labels.set(node.id, clipId);
      const clip = svgElement("clipPath", { id: clipId }), boundary = svgElement("rect");
      clip.append(boundary); defs.append(clip); clips.set(node.id, boundary);
      const g = svgElement("g", { "data-record": node.id }), bar = svgElement("rect", { "clip-path": "url(#" + clipId + ")" });
      g.append(svgElement("text", { x: plot.left - 23, y: -3, "text-anchor": "end", class: "record-name" }),
        svgElement("text", { x: plot.left - 23, y: 20, "text-anchor": "end", class: "record-detail" }),
        bar, svgElement("text", { y: 6, class: "record-value" }));
      return g;
    },
    update(g, node) {
      const isBase = node.id === model.baselineId, h = lerp(14, 24, node.focus);
      setSvgAttributes(g, { transform: "translate(0 " + node.y + ")", opacity: clamp01(node.reveal * 5) });
      setSvgAttributes(g.children[0], { fill: node.focus ? "var(--accent)" : "var(--ink)" });
      g.children[0].textContent = node.row.label;
      g.children[1].textContent = node.row.detail;
      setSvgAttributes(g.children[2], { x: node.zero, y: -h / 2, width: node.width, height: h,
        fill: isBase ? "var(--reference)" : "var(--accent)", opacity: isBase ? .9 : lerp(.33, .94, node.focus) });
      setSvgAttributes(clips.get(node.id), { x: node.zero, y: -20, width: node.clipWidth, height: 40 });
      setSvgAttributes(g.children[3], { x: node.end + 13, opacity: node.labelOpacity, fill: node.focus ? "var(--accent)" : "var(--muted)" });
      g.children[3].textContent = "约 " + model.format(node.row.value);
    },
  });
  let current;
  const comparisons = createSvgLayer(svg, {
    create() { const g = svgElement("g"); g.append(svgElement("path"), svgElement("text")); return g; },
    update(g, note) {
      const a = current.nodes.get(note.a.id), b = current.nodes.get(note.b.id);
      const x1 = at(model.scale, note.a.value), x2 = at(model.scale, note.b.value), y = (a.y + b.y) / 2;
      setSvgAttributes(g, { opacity: note.opacity });
      setSvgAttributes(g.children[0], { d: "M" + x1 + "," + (a.y + 17) + "V" + y + "H" + x2 + "V" + (b.y - 17),
        fill: "none", stroke: "var(--accent)", "stroke-width": 1.5 });
      setSvgAttributes(g.children[1], { x: Math.max(x1, x2) + 22, y: y + 7, fill: "var(--accent)", class: "gap" });
      g.children[1].textContent = "差 " + model.amount(note.value);
    },
  });
  root.querySelectorAll("[data-record-value]").forEach(el => {
    const row = model.records.get(el.dataset.recordValue);
    if (!row) throw new Error("Unknown record text binding");
    el.textContent = model.format(row.value);
  });
  root.querySelectorAll("[data-pair-gap]").forEach(el => {
    const pair = model.stops.get(el.dataset.pairGap)?.pair;
    if (!pair) throw new Error("Unknown record pair binding");
    el.textContent = model.format(Math.abs(model.records.get(pair[1]).value - model.records.get(pair[0]).value));
  });
  function render(pose, frame) {
    current = pose;
    const rows = recordGeometry(model, pose), visible = rows.filter(row => row.reveal > 0);
    marks.render(rows); comparisons.render(pose.annotations);
    setSvgAttributes(reference, { y1: Math.min(...visible.map(row => row.y)) - 28, y2: Math.max(...visible.map(row => row.y)) + 28 });
    svg.dataset.state = pose.id; svg.dataset.moving = String(frame.moving);
    if (!frame.moving) svg.setAttribute("aria-label", "共同零点，每条记录独立比较。" +
      visible.map(row => row.row.label + "约 " + model.amount(row.row.value)).join("；"));
  }
  const exit = reserveStageExit({ sticky: $(".record-stage"), readingEnd: $("[data-reading-end]"), spacer: $(".reading-tail"), releaseRatio: .4 });
  const stage = createStage({ element: svg, steps: [...root.querySelectorAll("[data-state]")].map(element => ({ element, id: element.dataset.state })),
    layout: id => recordPose(id, model), blend: blendRecords, render, duration, viewportRatio: .56 });
  document.fonts.ready.then(() => stage.refresh());
  return { sample: stage.sample, dispose() { stage.dispose(); exit.dispose(); marks.dispose(); comparisons.dispose(); defs.remove(); grid.remove(); reference.remove(); } };
}
