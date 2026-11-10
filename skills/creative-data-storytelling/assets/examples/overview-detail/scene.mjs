import { at, keyed, lerp, linearScale, mixScale } from "../../runtime/geometry.mjs";
import { blendNodes, blendWithAnnotations } from "../../runtime/motion.mjs";
import { createStage } from "../../runtime/stage.mjs";
import { reserveStageExit } from "../../runtime/scroll.mjs";
import { createSvgLayer, svgElement, setSvgAttributes } from "../../runtime/svg.mjs";

// 改写入口：journeys / comparisonIds 选择记录，detailStoryPose 决定排列和尺度。
// mountDetailStory 接受 { rows, selected, duration }；HTML 重写选择理由和正文，data-gap 自动绑定差额。
// 本例行距适配 12 行；更长名称/更多记录应连同 viewBox、标签区与正文比例调整。
export const journeys = [
  ["south", "南园路", 16, 2.4], ["east", "东门路", 22, 3.2], ["park", "公园路", 27, 4.1],
  ["river", "河岸路", 31, 5], ["west", "西桥路", 33, 4.7], ["pine", "松林路", 34, 5.8],
  ["lake", "湖滨路", 37, 6.2], ["north", "北站路", 39, 5.6], ["market", "集市路", 41, 6.8],
  ["hill", "山坡路", 43, 5], ["dock", "码头路", 48, 7.3], ["outer", "外环路", 55, 8.4],
].map(([id, label, minutes, km]) => ({ id, label, minutes, km }));
export const comparisonIds = ["river", "hill"];
const range = [185, 900];

export function detailStoryPose(mode, rows = journeys, selected = comparisonIds) {
  if (!["overview", "select", "compare"].includes(mode)) throw new Error("Unknown detail state: " + mode);
  if (rows.length < 2 || rows.some((row) => !row.id || !Number.isFinite(row.minutes) || row.minutes < 0) ||
    new Set(rows.map((row) => row.id)).size !== rows.length || selected.length !== 2 ||
    new Set(selected).size !== 2 || selected.some((id) => !rows.some((row) => row.id === id)))
    throw new Error("Detail comparison needs nonnegative minutes, distinct records and two existing, distinct selected ids");
  const pair = selected.map((id) => rows.find((row) => row.id === id));
  const zoom = mode === "compare" ? 1 : 0;
  const nodes = keyed(rows.map((row, i) => {
    const index = selected.indexOf(row.id), picked = index !== -1;
    return { id: row.id, row, y: zoom && picked ? 175 + index * 160 : 53 + i * 32,
      opacity: mode === "overview" || picked ? 1 : mode === "select" ? 0.3 : 0,
      barHeight: picked && mode !== "overview" ? (zoom ? 32 : 20) : 14,
      focus: picked && mode !== "overview" ? 1 : 0 };
  }));
  const values = rows.map((row) => row.minutes), pairValues = pair.map((row) => row.minutes);
  // Length encodes minutes: keep zero fixed while the upper bound and row layout change.
  const domain = [0, Math.max(10, Math.ceil(Math.max(...(zoom ? pairValues : values)) / 10) * 10)];
  const annotations = new Map();
  if (mode === "select") annotations.set("selected-distance", { id: "selected-distance", opacity: 1 });
  if (mode === "compare") annotations.set("time-gap", { id: "time-gap", opacity: 1 });
  return { mode, scale: linearScale(domain, range), nodes, zoom, annotations };
}

export function blendDetailStory(a, b, t) {
  return blendWithAnnotations(a, b, t, (from, to, progress) => ({
    ...to, scale: mixScale(from.scale, to.scale, progress), zoom: lerp(from.zoom, to.zoom, progress),
    nodes: blendNodes(from.nodes, to.nodes, progress, ["y", "opacity", "barHeight", "focus"]),
  }), { exitEnd: 0.12, enterStart: 0.82 });
}

export function mountDetailStory(root, { rows = journeys, selected = comparisonIds, duration = 1250 } = {}) {
  const $ = (selector) => root.querySelector(selector), svg = $("svg");
  const byId = keyed(rows), [a, b] = selected.map((id) => byId.get(id));
  if (!a || !b) throw new Error("Missing comparison record");
  $("[data-gap]").textContent = Math.abs(b.minutes - a.minutes);
  const tickLayer = createSvgLayer(svg, {
    attributes: { class: "axis", "aria-hidden": "true" },
    create() { const g = svgElement("g"); g.append(svgElement("line", { y1: 30, y2: 430 }),
      svgElement("text", { y: 468, "text-anchor": "middle" })); return g; },
    update(g, tick) {
      setSvgAttributes(g, { transform: `translate(${tick.x} 0)`, opacity: tick.opacity });
      g.classList.toggle("zero", tick.value === 0);
      g.children[1].textContent = tick.value;
    },
  });
  const markLayer = createSvgLayer(svg, {
    create(node) {
      const g = svgElement("g", { "data-route": node.id });
      g.append(svgElement("text", { x: 20, class: "name" }),
        svgElement("rect"), svgElement("text", { class: "value" }), svgElement("text", { class: "distance" }));
      return g;
    },
    update(g, node) {
      const color = node.id === selected[0] ? "var(--river)" : node.id === selected[1] ? "var(--hill)" : "var(--muted)";
      setSvgAttributes(g, { opacity: node.opacity, transform: `translate(0 ${node.y})` });
      g.children[0].textContent = node.row.label;
      setSvgAttributes(g.children[0], { y: 5, fill: node.focus ? color : "var(--ink)" });
      setSvgAttributes(g.children[1], { x: node.zero, y: -node.barHeight / 2,
        width: node.x - node.zero, height: node.barHeight, fill: color });
      setSvgAttributes(g.children[2], { x: node.x + 17, y: 5, fill: color });
      g.children[2].textContent = node.row.minutes;
      setSvgAttributes(g.children[3], { x: node.zoom > 0.5 ? 20 : 100, y: node.zoom > 0.5 ? 30 : 5,
        opacity: node.distanceOpacity, fill: color });
      g.children[3].textContent = `${node.row.km} 公里`;
    },
  });
  const bracket = svgElement("g", { opacity: 0, class: "gap" });
  const connectors = svgElement("path", { fill: "none", stroke: "var(--muted)", "stroke-dasharray": "3 6" });
  const rule = svgElement("path", { fill: "none", stroke: "var(--ink)", "stroke-width": 1.5 });
  const label = svgElement("text", { y: 244, "text-anchor": "middle" });
  bracket.append(connectors, rule, label); svg.append(bracket);
  svg.append(svgElement("text", { x: 900, y: 510, "text-anchor": "end", class: "axis-title" }, "单程通勤 / 分钟"));
  const hi = Math.ceil(Math.max(...rows.map((row) => row.minutes)) / 5) * 5 + 10;
  const ticks = Array.from({ length: hi / 5 + 1 }, (_, i) => i * 5);
  function render(pose, frame) {
    tickLayer.render(ticks.map((value) => ({ id: String(value), value, x: at(pose.scale, value),
      opacity: value % 10 === 0 ? 1 : pose.zoom })).filter((tick) => tick.x >= range[0] - 0.1 && tick.x <= range[1] + 0.1));
    const distanceOpacity = pose.annotations.get("selected-distance")?.opacity ?? pose.annotations.get("time-gap")?.opacity ?? 0;
    markLayer.render([...pose.nodes.values()].map((node) => ({ ...node, zoom: pose.zoom,
      zero: at(pose.scale, 0), x: at(pose.scale, node.row.minutes),
      distanceOpacity: selected.includes(node.id) ? distanceOpacity : 0 })));
    const left = at(pose.scale, a.minutes), right = at(pose.scale, b.minutes), centerY = 265;
    const first = pose.nodes.get(a.id), second = pose.nodes.get(b.id);
    setSvgAttributes(connectors, { d: `M${left},${first.y + first.barHeight / 2 + 6}V${centerY}M${right},${second.y - second.barHeight / 2 - 6}V${centerY}` });
    setSvgAttributes(rule, { d: `M${left},${centerY - 5}V${centerY + 5}M${left},${centerY}H${right}M${right},${centerY - 5}V${centerY + 5}` });
    setSvgAttributes(label, { x: (left + right) / 2 });
    label.textContent = `相差 ${Math.abs(b.minutes - a.minutes)} 分钟`;
    setSvgAttributes(bracket, { opacity: pose.annotations.get("time-gap")?.opacity ?? 0 });
    svg.dataset.state = pose.mode; svg.dataset.moving = String(frame.moving);
    if (!frame.moving) svg.setAttribute("aria-label", pose.mode === "compare"
      ? `${a.label} ${a.minutes} 分钟，${b.label} ${b.minutes} 分钟，相差 ${Math.abs(b.minutes - a.minutes)} 分钟`
      : `${rows.length} 条模拟通勤记录，条长表示分钟，共同零基线，纵向排列路线。当前${pose.mode === "select" ? "强调两条选中路线" : "展示全体"}`);
  }
  const exit = reserveStageExit({ sticky: $(".detail-stage"), readingEnd: $("[data-reading-end]"), spacer: $(".reading-tail"), releaseRatio: 0.4 });
  const stage = createStage({ element: svg,
    steps: [...root.querySelectorAll("[data-state]")].map((element) => ({ element, id: element.dataset.state })),
    layout: (id) => detailStoryPose(id, rows, selected), blend: blendDetailStory, render, duration, viewportRatio: 0.57,
  });
  document.fonts.ready.then(() => stage.refresh());
  return { sample: stage.sample, dispose() { stage.dispose(); exit.dispose(); tickLayer.dispose(); markLayer.dispose(); bracket.remove(); } };
}
