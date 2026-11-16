import { connectReading } from "./connect.mjs";
import { at, keyed, lerp, linearScale, mixScale } from "../runtime/geometry.mjs";
import { blendNodes } from "../runtime/motion.mjs";
import { svgElement, setSvgAttributes } from "../runtime/svg.mjs";

// Replace this small scene; connect.mjs has no chart, chapter or layout choices.
const rows = [{ id: "a", name: "甲", value: 18 }, { id: "b", name: "乙", value: 42 }, { id: "c", name: "丙", value: 29 }];
const svg = document.querySelector("#graphic");
const reading = document.querySelector(".reading");
let selected = "c";
const marks = new Map(rows.map(row => {
  const group = svgElement("g", { "data-row": row.id }), rect = svgElement("rect", { height: 24, fill: "#497b68" });
  const label = svgElement("text", { x: 16, y: 17, "font-size": 18 }, row.name);
  const value = svgElement("text", { y: 17, "font-size": 17, "data-value": row.id });
  group.append(rect, label, value); svg.append(group);
  return [row.id, { group, rect, value }];
}));
const axis = svgElement("g"), gap = svgElement("path", { fill: "none", stroke: "#9e5936", "stroke-width": 2 });
svg.prepend(axis); svg.append(gap);
function layout(id, { width, height }) {
  if (width < 300 || height < 190) throw new Error("This comparison needs a plot of at least 300 × 190 CSS pixels; adjust the panel's content or layout");
  const focus = id !== "all", other = id === "explore" ? selected : "c";
  const pair = rows.filter(row => row.id === "a" || row.id === other);
  const max = focus ? Math.ceil(Math.max(...pair.map(row => row.value)) / 10) * 10 + 5 : 50;
  const available = height - 100;
  return { id, other, width, height, focus: Number(focus), scale: linearScale([0, max], [58, width - 45]),
    nodes: keyed(rows.map((row, index) => ({ ...row, y: 24 + available * (focus ? (row.id === "a" ? .2 : .65) : index / 3),
      opacity: !focus || pair.includes(row) ? 1 : 0 }))) };
}
function blend(from, to, t) {
  return { ...to, scale: mixScale(from.scale, to.scale, t), focus: lerp(from.focus, to.focus, t),
    nodes: blendNodes(from.nodes, to.nodes, t, ["y", "opacity"]) };
}
function render(pose, frame) {
  // Every visual element uses the same sampled pose, never the destination alone.
  setSvgAttributes(svg, { viewBox: `0 0 ${pose.width} ${pose.height}` });
  axis.replaceChildren();
  for (let v = 0; v <= 50; v += 10) {
    const x = at(pose.scale, v); if (x > pose.width - 40) continue;
    axis.append(svgElement("line", { x1: x, x2: x, y1: 10, y2: pose.height - 40, stroke: "#d5dcd6" }),
      svgElement("text", { x, y: pose.height - 14, "text-anchor": "middle", "font-size": 16 }, `${v}`));
  }
  for (const node of pose.nodes.values()) {
    const mark = marks.get(node.id), end = at(pose.scale, node.value), zero = at(pose.scale, 0);
    setSvgAttributes(mark.group, { transform: `translate(0 ${node.y})`, opacity: node.opacity });
    setSvgAttributes(mark.rect, { x: zero, width: end - zero });
    setSvgAttributes(mark.value, { x: end + 8 }); mark.value.textContent = node.value;
  }
  const a = pose.nodes.get("a"), b = pose.nodes.get(pose.other), x1 = at(pose.scale, a.value), x2 = at(pose.scale, b.value);
  setSvgAttributes(gap, { d: `M${x1},${a.y + 28}V${b.y + 45}H${x2}V${b.y + 28}`, opacity: frame.moving ? 0 : pose.focus });
  // Replace this readout on purpose: inspection resolves selectors at capture time.
  const text = frame.moving ? "" : summary(pose.id, pose.other);
  if (document.querySelector("#result-value")?.textContent !== text)
    document.querySelector("#result").replaceChildren(Object.assign(document.createElement("span"), { id: "result-value", textContent: text }));
  svg.dataset.state = pose.id; svg.dataset.complete = String(!frame.moving);
}
function summary(id, other) {
  const row = rows.find(row => row.id === other);
  return id === "all" ? "三项用时，共同零点 / 分钟" : `甲与${row.name}相差 ${Math.abs(row.value - rows[0].value)} 分钟`;
}

// This optional panel is only for the engineering demo, not a story requirement.
const inspectionTools = document.querySelector("#inspection-tools");
inspectionTools.hidden = !new URLSearchParams(location.search).has("inspect");

const connection = connectReading({ reading, element: svg, layout, blend, render, duration: 850,
  exit: { sticky: document.querySelector(".sticky"), readingEnd: reading.querySelector("[data-reading-end]"), spacer: reading.querySelector(".reading-tail") } });
document.querySelector("#choice").addEventListener("change", event => {
  selected = event.target.value; connection.explore("explore");
  document.querySelector("#mode").textContent = "选择控制，滚动不会覆盖选择";
});
document.querySelector("#resume").addEventListener("click", () => {
  selected = "c"; document.querySelector("#choice").value = selected;
  connection.resume(); document.querySelector("#mode").textContent = "正文控制";
});
let inspection;
if (!inspectionTools.hidden) {
  const { createInspection } = await import("../runtime/inspection.mjs");
  inspection = createInspection(connection, { root: document.querySelector(".sticky"), checks: ({ target }) => {
    const other = target.id === "explore" ? selected : "c";
    const visible = rows.filter(row => target.id === "all" || row.id === "a" || row.id === other);
    const valueIds = visible.map(row => row.id);
    return { targets: [
      { id: "plot", element: "#graphic" },
      { id: "controls", element: ".sticky > .controls" },
      { id: "result", element: "#result-value", expected: summary(target.id, other) },
      ...visible.map(row => ({ id: row.id, element: `[data-value="${row.id}"]`, expected: row.value })),
    ], bounds: [
      { type: "inside", ids: valueIds, within: "plot" },
      { type: "inside", ids: ["plot", "controls", "result"], within: "$viewport" },
      { type: "separate", ids: [...valueIds, "result"], from: ["controls"] },
    ], groups: [{ id: "choices", elements: "#choice option", expected: rows.filter(row => row.id !== "a").map(row => row.id), key: option => option.value }] };
  } });
  document.querySelector("#inspect").addEventListener("click", async () => {
    const out = document.querySelector("#check-summary"); out.textContent = "正在等待指定画面的实际绘制……";
    const report = await inspection.capture({ target: document.querySelector("#inspect-target").value });
    const problems = (report.bounds?.candidates.length ?? 0) + (report.bounds?.skipped.length ?? 0) +
      (report.measured?.items.filter(item => item.status !== "measured" || item.match === false).length ?? 0);
    out.textContent = `采集 ${report.captureId} · ${report.phase} · 更新 ${report.stage.target.revision}` +
      (report.phase === "captured" ? ` · 读数/边界待核对项 ${problems}。结果不代表视觉验收通过。` : " · 未取得指定画面的完整证据。");
  });
}
addEventListener("pagehide", event => { if (!event.persisted) { inspection?.dispose(); connection.dispose(); } });
