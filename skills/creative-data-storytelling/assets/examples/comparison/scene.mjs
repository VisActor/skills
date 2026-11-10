import { at, keyed, linearScale, mixScale } from "../../runtime/geometry.mjs";
import { blendNodes, blendWithAnnotations } from "../../runtime/motion.mjs";
import { createStage } from "../../runtime/stage.mjs";
import { reserveStageExit } from "../../runtime/scroll.mjs";
import { createValueFormat } from "../../runtime/format.mjs";
import { createSvgLayer, setSvgAttributes, svgElement } from "../../runtime/svg.mjs";
import { measureBounds, checkBounds } from "../../runtime/bounds.mjs";

// 改写入口：comparisonSamples 是原始量值；quantitativePose 的 P/Q、domain 与行位置选择比较。
// renderQuantitative 的刻度/颜色及 HTML 正文同步调整；条长编码非负量，共用零基线。
export const comparisonSamples = [
  { id: "A", value: 22 }, { id: "P", value: 42 }, { id: "Q", value: 54 },
  { id: "B", value: 68 }, { id: "C", value: 84 }, { id: "D", value: 94 },
];
const sampleById = keyed(comparisonSamples);
const plotRange = [85, 770];

export function quantitativePose(mode, compareId = "Q") {
  if (!["overview", "locate", "compare", "explore"].includes(mode)) throw new Error("Unknown comparison state: " + mode);
  if (!sampleById.has(compareId) || compareId === "P") throw new Error("Comparison needs a distinct existing sample");
  const local = mode === "compare" || mode === "explore";
  const selected = ["P", mode === "explore" ? compareId : "Q"];
  const values = selected.map((id) => sampleById.get(id).value);
  const domain = [0, local ? Math.ceil(Math.max(...values) / 10) * 10 : 100];
  const nodes = new Map();
  comparisonSamples.forEach((row, i) => {
    if (local && !selected.includes(row.id)) return;
    nodes.set(row.id, {
      id: row.id, row, value: row.value,
      y: local ? (row.id === "P" ? 140 : 230) : 57 + i * 48,
      barHeight: local ? 34 : mode === "locate" && selected.includes(row.id) ? 24 : 18,
      opacity: mode === "locate" && !selected.includes(row.id) ? 0.35 : 1,
    });
  });
  const annotations = local ? keyed([{ id: selected.join("/"), ids: selected, values, opacity: 1 }]) : new Map();
  return { mode, selected, nodes, scale: linearScale(domain, plotRange), annotations };
}

export function blendQuantitative(a, b, t) {
  return blendWithAnnotations(a, b, t, (from, to, progress) => ({
    ...to, scale: mixScale(from.scale, to.scale, progress),
    nodes: blendNodes(from.nodes, to.nodes, progress, ["y", "barHeight", "opacity", "value"]),
  }));
}

/**
 * 总体 → 识别 → 局部比较；固定模拟构图的独立接线示例。
 * 用法：mountComparison(document.querySelector("#comparison-example"))，返回 dispose()。
 * root 提供 #quant（viewBox 0 0 860 440）、.reading-step、#quant-buttons、
 * #quant-summary / #quant-status、#scroll-mode。探索控件 #comparison-controls、#compare-with、
 * #return-story 与探索按钮可整组省略；#check-bounds / #bounds-result / #bounds-details 是可选作者工具。
 * .sticky 是固定图形的外层，[data-reading-end] 是末段正文，.reading-tail 是正文列末尾的空块。
 * 数据与完整状态在 quantitativePose，连续几何在 blendQuantitative，绘制在 renderQuantitative。
 * 核心是 quantitativePose → blendQuantitative → renderQuantitative。
 * 下方滚动/探索接线和作者测量各自标明；只取核心时用 createPlayer 接状态按钮即可。
 */
export function mountComparison(root) {
  const $ = (selector) => root.querySelector(selector);
  const listeners = new AbortController();
  const listen = (target, type, handler) => target.addEventListener(type, handler, { signal: listeners.signal });
  const samples = comparisonSamples, bySample = sampleById;
  let qMode = "overview", compareId = "Q";

  const qFormat = createValueFormat({ unit: "克", digits: 0 });
  const qSvg = $("#quant"), qDefs = svgElement("defs"), qClip = svgElement("clipPath", { id: "plot-clip" });
  qClip.appendChild(svgElement("rect", { x: 10, y: 20, width: 830, height: 315 }));
  qDefs.appendChild(qClip);
  qSvg.append(qDefs, svgElement("text", { x: 85, y: 417, fill: "#64796e" }, "样品重量 / " + qFormat.unit));
  const qTicks = createSvgLayer(qSvg, {
    create() {
      const node = svgElement("g");
      node.append(svgElement("line", { y1: 30, y2: 350, stroke: "#dce3d7" }),
        svgElement("text", { y: 378, "text-anchor": "middle", fill: "#64796e" }));
      return node;
    },
    update(node, row) {
      setSvgAttributes(node.children[0], { x1: row.x, x2: row.x,
        stroke: row.value === 0 ? "#7d9385" : "#dce3d7", "stroke-width": row.value === 0 ? 1.5 : 1 });
      setSvgAttributes(node.children[1], { x: row.x });
      node.children[1].textContent = qFormat.number(row.value);
    },
  });
  const qMarks = createSvgLayer(qSvg, {
    attributes: { "clip-path": "url(#plot-clip)", "data-layer": "samples" },
    create(row) {
      const node = svgElement("g", { "data-sample": row.id });
      node.append(svgElement("rect"), svgElement("text"), svgElement("text"));
      return node;
    },
    update(node, row) {
      setSvgAttributes(node, { opacity: row.opacity });
      setSvgAttributes(node.children[0], { x: row.zero, y: row.y - row.barHeight / 2,
        width: row.x - row.zero, height: row.barHeight, fill: row.color });
      setSvgAttributes(node.children[1], { x: row.zero - 18, y: row.y + 5, "text-anchor": "end" });
      node.children[1].textContent = row.id;
      setSvgAttributes(node.children[2], { x: row.x + 12, y: row.y + 5, fill: row.color });
      node.children[2].textContent = qFormat.number(row.row.value);
    },
  });
  const qAnnotations = createSvgLayer(qSvg, {
    create(row) {
      const node = svgElement("g", { "data-comparison": row.id, stroke: "#be633c" });
      node.append(svgElement("path", { fill: "none", "stroke-width": 1, "stroke-dasharray": "3 5" }),
        svgElement("path", { fill: "none", "stroke-width": 2 }),
        svgElement("text", { y: 205, "text-anchor": "middle", stroke: "none", fill: "#9c4327" }));
      return node;
    },
    update(node, row) {
      setSvgAttributes(node, { opacity: row.opacity });
      setSvgAttributes(node.children[0], { d: row.ends.map((end) => `M${end.x} ${end.y}V185`).join("") });
      setSvgAttributes(node.children[1], { d: "M" + row.left + " 179v12M" + row.left + " 185H" + row.right + "M" + row.right + " 179v12" });
      setSvgAttributes(node.children[2], { x: (row.left + row.right) / 2 });
      node.children[2].textContent = "相差 " + qFormat.format(Math.abs(row.values[1] - row.values[0]));
    },
  });
  function renderQuantitative(pose, frame) {
    const ticks = [];
    for (let value = 0; value <= 110; value += 10) {
      const x = at(pose.scale, value);
      if (x >= plotRange[0] - 0.1 && x <= plotRange[1] + 0.1) ticks.push({ id: String(value), value, x });
    }
    qTicks.render(ticks);
    qMarks.render([...pose.nodes.values()].map((node) => ({ ...node, zero: at(pose.scale, 0), x: at(pose.scale, node.value),
      color: node.id === "P" ? "#297c6c" : node.id === "Q" ? "#be633c" : "#6f8376" })));
    qAnnotations.render([...pose.annotations.values()].map((annotation) => ({ ...annotation,
      ends: annotation.ids.map((id, i) => { const node = pose.nodes.get(id);
        return { x: at(pose.scale, node.value), y: node.y + (i === 0 ? 1 : -1) * (node.barHeight / 2 + 5) }; }),
      left: at(pose.scale, Math.min(...annotation.values)), right: at(pose.scale, Math.max(...annotation.values)) })));
    $("#quant-status").textContent = frame.moving ? "连接进行中" : "完整阅读状态";
    if (frame.moving) {
      $("#quant-summary").textContent = "比较对象与尺度正在交接；差值在对应对象就位后出现。";
    } else {
      const values = pose.selected.map((id) => bySample.get(id).value);
      $("#quant-summary").textContent = pose.annotations.size
        ? pose.selected.join(" 与 ") + " 相差 " + qFormat.format(Math.abs(values[1] - values[0])) + "；零点保留，尺度改变，重量不变。"
        : pose.mode === "locate" ? "先在总体中识别 " + pose.selected.map((id) => id + "（" + qFormat.number(bySample.get(id).value) + "）").join("和") + "。"
          : "六个模拟样品的条长表示重量，共用零基线；纵向只负责排列。";
    }
  }
  // 可选：文字滚动与末段停留；按钮演示也复用同一 render/blend。
  const exitSpace = reserveStageExit({
    sticky: $(".sticky"), readingEnd: $("[data-reading-end]"), spacer: $(".reading-tail"),
  });
  const qStage = createStage({
    element: $("#quant"),
    steps: [...root.querySelectorAll(".reading-step")].map((element, i) => ({
      element, id: ["overview", "locate", "compare"][i],
    })),
    // This specimen uses a fixed SVG viewBox; responsive work can use layout's size argument.
    layout: (mode) => quantitativePose(mode, compareId),
    blend: blendQuantitative,
    render(pose, frame) {
      renderQuantitative(pose, frame);
      $("#quant").dataset.moving = String(frame.moving);
      if (!frame.moving) {
        qMode = pose.mode;
        if ($("#comparison-controls")) $("#comparison-controls").hidden = qMode !== "explore";
        $("#quant-buttons").querySelectorAll("button").forEach((button) =>
          button.setAttribute("aria-pressed", String(button.dataset.mode === qMode)));
      }
    },
  });
  function qGo(mode, options) { qStage.goTo(mode, options); }
  // Optional author tool; sample only on request, never in the animation loop.
  if ($("#check-bounds")) listen($("#check-bounds"), "click", () => {
    if (qStage.sample().moving) {
      $("#bounds-result").textContent = "当前正在衔接，落位后可重新检查。";
      return;
    }
    const labels = [...qSvg.querySelectorAll("text")].map((element, i) => ({ id: "label-" + i, element }));
    const measured = measureBounds(qSvg, labels);
    const report = checkBounds(measured, [
      { type: "inside", ids: labels.map((item) => item.id), within: "$stage" },
      { type: "separate", ids: labels.map((item) => item.id) },
    ]);
    $("#bounds-result").textContent = `检查当前文字边界：${report.checked} 个关系，${report.candidates.length} 个候选问题，${report.skipped.length} 个关系未测量。只检查指定关系，仍需查看画面。`;
    $("#bounds-details").textContent = JSON.stringify({ measured, report }, null, 2);
  });
  qStage.setReadingEnabled(false);
  listen($("#scroll-mode"), "change", (event) => qStage.setReadingEnabled(event.target.checked));
  listen($("#quant-buttons"), "click", (event) => {
    const mode = event.target.dataset.mode;
    if (!mode) return;
    $("#scroll-mode").checked = false;
    qStage.setReadingEnabled(false);
    qGo(mode);
  });
  // 可选：探索只换比较伙伴；去掉 HTML 的整组探索控件和 explore 按钮即可省去这段操作。
  if ($("#compare-with")) {
    $("#compare-with").replaceChildren(...samples.filter((row) => row.id !== "P").map((row) => new Option(row.id, row.id)));
    $("#compare-with").value = compareId;
    listen($("#compare-with"), "change", (event) => { compareId = event.target.value; qGo("explore"); });
    listen($("#return-story"), "click", () => qGo("overview"));
  }

  qGo("overview", { immediate: true });
  return { dispose() {
    listeners.abort();
    [exitSpace, qStage, qTicks, qMarks, qAnnotations].forEach((controller) => controller.dispose());
  } };
}
