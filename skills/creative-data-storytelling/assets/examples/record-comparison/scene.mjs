import { at, clamp01, keyed, lerp, linearScale } from "../../runtime/geometry.mjs";
import { blendNodes, blendWithAnnotations } from "../../runtime/motion.mjs";
import { connectReading } from "../../stage-wiring/connect.mjs";
import { createCopyHandoff } from "../../runtime/copy.mjs";
import { createSvgLayer, setSvgAttributes, svgElement } from "../../runtime/svg.mjs";

// 新记录占新行，旧记录不变成另一条记录，也不与新记录相加。
// 改 records / stops / axis / layout 后重写正文；domain 覆盖全体，保持共同零点。
// stops.visible 选择当前所需记录，可收起再恢复；layout 为名称和行数留空间，不自动压小字体。
// 模拟各馆开馆时公布的每周开放时长；新馆加入不是旧馆时长更新，不连成同一对象的轨迹。
export const recordExample = {
  metric: "开馆时每周开放时长", unit: "小时", baselineId: "cedar", axis: { max: 105, ticks: [0, 20, 40, 60, 80, 100] },
  records: [
    { id: "cedar", label: "青杉馆", detail: "2016 · 综合馆", value: 42 },
    { id: "maple", label: "枫桥馆", detail: "2018 · 社区馆", value: 30 },
    { id: "harbor", label: "海湾馆", detail: "2020 · 综合馆", value: 56 },
    { id: "family", label: "童阅馆", detail: "2022 · 亲子馆", value: 28 },
    { id: "study", label: "书桌馆", detail: "2022 · 自习馆", value: 84 },
    { id: "garden", label: "花园馆", detail: "2025 · 社区馆", value: 35 },
    { id: "night", label: "星灯馆", detail: "2025 · 夜读馆", value: 98 },
  ],
  stops: [
    { id: "reference", visible: ["cedar"], focus: ["cedar"] },
    { id: "arrivals", visible: ["cedar", "maple", "harbor"], focus: ["maple", "harbor"] },
    { id: "branches", visible: ["cedar", "maple", "harbor", "family", "study"], focus: ["family", "study"] },
    { id: "latest", visible: ["cedar", "maple", "harbor", "family", "study", "garden", "night"], focus: ["garden", "night"] },
    { id: "difference", visible: ["cedar", "garden", "night"], focus: ["garden", "night"], pair: ["garden", "night"] },
  ],
};
const defaultLayout = { width: 1200, height: 490, left: 200, right: 985,
  top: 30, bottom: 398, center: 215, rowGap: 50 };
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
  for (const stop of config.stops) {
    if (!Array.isArray(stop.visible) || !stop.visible.length || new Set(stop.visible).size !== stop.visible.length ||
      stop.visible.some(id => !records.has(id)) ||
      !Array.isArray(stop.focus) || stop.focus.some(id => !stop.visible.includes(id)) ||
      (stop.pair && (stop.pair.length !== 2 || new Set(stop.pair).size !== 2 ||
        stop.pair.some(id => !stop.visible.includes(id)))))
      throw new Error("Record stops need known visible ids, visible focus and distinct visible comparison pairs");
  }
  const plot = { ...defaultLayout, ...config.layout };
  const halfSpan = (Math.max(...config.stops.map(stop => stop.visible.length)) - 1) * plot.rowGap / 2 + 28;
  if (!Object.values(plot).every(Number.isFinite) || plot.width <= 0 || plot.height <= 0 ||
      plot.left < 23 || plot.right <= plot.left || plot.right >= plot.width ||
      plot.top < 0 || plot.bottom + 80 > plot.height || plot.rowGap < 44 ||
      plot.center - halfSpan < plot.top || plot.center + halfSpan > plot.bottom)
    throw new Error("Record layout needs room for visible rows, labels and axes; adjust plot bounds, center or rowGap");
  return { ...config, records, stops, ticks, layout: plot, scale: linearScale([0, max], [plot.left, plot.right]),
    format, amount: value => format(value) + " " + config.unit };
}

export function recordPose(id, model = createRecordModel()) {
  const stop = model.stops.get(id);
  if (!stop) throw new Error("Unknown record reading: " + id);
  const plot = model.layout;
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
  // 网格围绕当前比较组展开；横向尺度不变，不把少量记录与轴分置画布两端。
  const halfSpan = (visible.length - 1) * plot.rowGap / 2 + 28;
  return { id, nodes, annotations, frame: { top: plot.center - halfSpan, bottom: plot.center + halfSpan } };
}

export function blendRecords(from, to, t) {
  return blendWithAnnotations(from, to, t, (a, b, p) => {
    const retiring = [...a.nodes].some(([id, node]) => node.reveal > b.nodes.get(id).reveal);
    const arriving = [...a.nodes].some(([id, node]) => node.reveal < b.nodes.get(id).reveal);
    const mixed = retiring && arriving;
    // 收起退出行 → 保留行就位 → 显露加入行；被中断时仍从当前几何接续。
    const move = mixed ? clamp01((p - .3) / .3) : retiring ? clamp01((p - .55) / .45) : clamp01(p / .35);
    const exit = clamp01(p / (mixed ? .28 : .5));
    const enter = mixed ? clamp01((p - .65) / .35) : clamp01((p - .35) / .65);
    const nodes = blendNodes(a.nodes, b.nodes, p, ["focus"]);
    for (const [id, node] of nodes) {
      node.y = lerp(a.nodes.get(id).y, b.nodes.get(id).y, move);
      const before = a.nodes.get(id).reveal, after = b.nodes.get(id).reveal;
      node.reveal = lerp(before, after, after < before ? exit : enter);
    }
    return { ...b, nodes, frame: {
      top: lerp(a.frame.top, b.frame.top, move), bottom: lerp(a.frame.bottom, b.frame.bottom, move),
    } };
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
  const $ = selector => root.querySelector(selector), svg = $("svg");
  let model = createRecordModel(config), plot = model.layout, sizeKey;
  const prefix = "records-" + ++nextInstance, defs = svgElement("defs"), grid = svgElement("g", { class: "axis" });
  const gridLines = [], tickLabels = [];
  let axisTitle;
  svg.append(defs, grid);
  const reference = svgElement("line", { stroke: "var(--reference)", "stroke-dasharray": "4 5", "stroke-width": 1.3 });
  svg.append(reference);
  function fit(size) {
    const key = size.width + '/' + size.height;
    if (key === sizeKey) return;
    sizeKey = key;
    if (!config.layout) {
      const top = 30, bottom = size.height - 80, count = Math.max(...config.stops.map(stop => stop.visible.length));
      model = createRecordModel({ ...config, layout: { ...size, left: 182, right: size.width - 135,
        top, bottom, center: (top + bottom) / 2, rowGap: Math.min(76, (bottom - top - 58) / Math.max(1, count - 1)) } });
    }
    plot = model.layout;
    setSvgAttributes(svg, { viewBox: `0 0 ${plot.width} ${plot.height}` });
    grid.replaceChildren();
    gridLines.length = tickLabels.length = 0;
    for (const tick of model.ticks) {
      const x = at(model.scale, tick);
      const line = svgElement('line', { x1:x, x2:x, class:tick===0?'zero':'' });
      const label = svgElement('text', { x, 'text-anchor':'middle' }, model.format(tick));
      gridLines.push(line); tickLabels.push(label); grid.append(line, label);
    }
    axisTitle = svgElement('text', { x:plot.right, 'text-anchor':'end', class:'axis-title' }, model.metric+' / '+model.unit);
    grid.append(axisTitle);
    const baselineX = at(model.scale, model.records.get(model.baselineId).value);
    setSvgAttributes(reference, { x1:baselineX, x2:baselineX });
  }
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
      setSvgAttributes(g, { transform: "translate(0 " + node.y + ")", opacity: clamp01(node.reveal * 5),
        "data-value": node.row.value, "data-reveal": node.reveal });
      setSvgAttributes(g.children[0], { x:plot.left-23, fill: isBase ? "var(--reference)" : node.focus ? "var(--accent)" : "var(--ink)" });
      setSvgAttributes(g.children[1], { x:plot.left-23 });
      g.children[0].textContent = node.row.label;
      g.children[1].textContent = node.row.detail;
      setSvgAttributes(g.children[2], { x: node.zero, y: -h / 2, width: node.width, height: h,
        fill: isBase ? "var(--reference)" : "var(--accent)", opacity: isBase ? .9 : lerp(.33, .94, node.focus) });
      setSvgAttributes(clips.get(node.id), { x: node.zero, y: -20, width: node.clipWidth, height: 40 });
      setSvgAttributes(g.children[3], { x: node.end + 13, opacity: node.labelOpacity, fill: isBase ? "var(--reference)" : node.focus ? "var(--accent)" : "var(--muted)" });
      g.children[3].textContent = model.format(node.row.value);
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
      setSvgAttributes(g.children[1], { x: (x1 + x2) / 2, y: y - 9, "text-anchor": "middle", fill: "var(--accent)", class: "gap" });
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
  const readings = [...root.querySelectorAll('.reading-panels [data-record-value], .reading-panels [data-pair-gap]')];
  const readingOpacity = readings.map(el => el.style.opacity);
  function render(pose, frame) {
    current = pose;
    const rows = recordGeometry(model, pose), visible = rows.filter(row => row.reveal > 0);
    marks.render(rows); comparisons.render(pose.annotations);
    for (const line of gridLines) setSvgAttributes(line, { y1: pose.frame.top, y2: pose.frame.bottom });
    for (const label of tickLabels) setSvgAttributes(label, { y: pose.frame.bottom + 32 });
    setSvgAttributes(axisTitle, { y: pose.frame.bottom + 68 });
    // Keep the sentence complete; strengthen its numbers as the matching marks become readable.
    for (const el of readings) {
      const pair = model.stops.get(el.dataset.pairGap)?.pair;
      const opacity = pair ? pose.annotations.get(pair.join('/'))?.opacity ?? 0
        : rows.find(row => row.id === el.dataset.recordValue)?.labelOpacity ?? 0;
      el.style.opacity = String(.7 + .3 * opacity);
    }
    setSvgAttributes(reference, { y1: pose.frame.top, y2: pose.frame.bottom,
      opacity: pose.nodes.get(model.baselineId).reveal });
    svg.dataset.state = pose.id; svg.dataset.moving = String(frame.moving);
    if (!frame.moving) svg.setAttribute("aria-label", "共同零点，每条记录独立比较。" +
      visible.map(row => row.row.label + " " + model.amount(row.row.value)).join("；"));
  }
  // Reading time belongs to the reader; elapsed time only completes the connection.
  const stage = $(".record-stage"), track = $(".scroll-track"), previous = $("[data-prev]"), next = $("[data-next]"), finish = $("[data-finish]"), position = $("[data-position]");
  const readingPanels = $(".reading-panels");
  const panels = config.stops.map(stop => [...root.querySelectorAll('[data-step]')].find(el => el.dataset.step === stop.id));
  if (!stage || !track || !readingPanels || !previous || !next || !finish || panels.some(panel => !panel))
    throw new Error("Record preview needs a scroll-track, one data-step panel per stop and navigation controls");
  panels.forEach(panel => { panel.dataset.copy = panel.dataset.step; });
  const copy = createCopyHandoff(readingPanels);
  function showReading({ id, index }) {
    const last = index === panels.length - 1, active = document.activeElement;
    copy.show(id);
    next.hidden = last; finish.hidden = !last;
    if (position) position.textContent = `${index + 1} / ${panels.length}`;
    if (last && active === next) finish.focus({ preventScroll: true });
    else if (!last && active === finish) next.focus({ preventScroll: true });
  }
  const connection = connectReading({ element: svg, reading: track,
    track: { ids: config.stops.map(stop => stop.id) }, viewportRatio: 0, duration,
    exit: { sticky: stage, releaseRatio: 0 },
    navigation: { scope: stage, previous, next }, onReading: showReading,
    layout(id, size) { fit(size); return recordPose(id, model); },
    blend: blendRecords, render });
  document.fonts.ready.then(() => connection.refresh());
  return { sample: connection.stage.sample, dispose() {
    connection.dispose(); copy.dispose();
    readings.forEach((el, i) => { el.style.opacity = readingOpacity[i]; });
    marks.dispose(); comparisons.dispose(); defs.remove(); grid.remove(); reference.remove();
  } };
}
