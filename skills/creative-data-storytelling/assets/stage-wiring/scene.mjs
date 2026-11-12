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
  const group = svgElement("g"), rect = svgElement("rect", { height: 24, fill: "#497b68" });
  const label = svgElement("text", { x: 16, y: 17, "font-size": 18 }, row.name);
  const value = svgElement("text", { y: 17, "font-size": 17 });
  group.append(rect, label, value); svg.append(group);
  return [row.id, { group, rect, value }];
}));
const axis = svgElement("g"), gap = svgElement("path", { fill: "none", stroke: "#9e5936", "stroke-width": 2 });
svg.prepend(axis); svg.append(gap);
function layout(id) {
  const focus = id !== "all", other = id === "explore" ? selected : "c";
  const pair = rows.filter(row => row.id === "a" || row.id === other);
  const max = focus ? Math.ceil(Math.max(...pair.map(row => row.value)) / 10) * 10 + 5 : 50;
  return { id, other, focus: Number(focus), scale: linearScale([0, max], [70, 640]),
    nodes: keyed(rows.map((row, index) => ({ ...row, y: focus ? (row.id === "a" ? 90 : 180) : 65 + index * 80,
      opacity: !focus || pair.includes(row) ? 1 : 0 }))) };
}
function blend(from, to, t) {
  return { ...to, scale: mixScale(from.scale, to.scale, t), focus: lerp(from.focus, to.focus, t),
    nodes: blendNodes(from.nodes, to.nodes, t, ["y", "opacity"]) };
}
function render(pose, frame) {
  // Every visual element uses the same sampled pose, never the destination alone.
  axis.replaceChildren();
  for (let v = 0; v <= 50; v += 10) {
    const x = at(pose.scale, v); if (x > 640) continue;
    axis.append(svgElement("line", { x1: x, x2: x, y1: 35, y2: 290, stroke: "#d5dcd6" }),
      svgElement("text", { x, y: 315, "text-anchor": "middle", "font-size": 16 }, `${v}`));
  }
  for (const node of pose.nodes.values()) {
    const mark = marks.get(node.id), end = at(pose.scale, node.value), zero = at(pose.scale, 0);
    setSvgAttributes(mark.group, { transform: `translate(0 ${node.y})`, opacity: node.opacity });
    setSvgAttributes(mark.rect, { x: zero, width: end - zero });
    setSvgAttributes(mark.value, { x: end + 8 }); mark.value.textContent = node.value;
  }
  const a = pose.nodes.get("a"), b = pose.nodes.get(pose.other), x1 = at(pose.scale, a.value), x2 = at(pose.scale, b.value);
  setSvgAttributes(gap, { d: `M${x1},${a.y + 28}V${b.y + 45}H${x2}V${b.y + 28}`, opacity: frame.moving ? 0 : pose.focus });
  document.querySelector("#result").textContent = frame.moving ? "" : pose.focus ? `甲与${b.name}相差 ${Math.abs(b.value - a.value)} 分钟` : "三项用时，共同零点 / 分钟";
  svg.dataset.state = pose.id; svg.dataset.complete = String(!frame.moving);
}

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
addEventListener("pagehide", event => { if (!event.persisted) connection.dispose(); });
