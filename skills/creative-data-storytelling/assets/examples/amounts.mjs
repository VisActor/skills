import { accumulationSegments, at, keyed, lerp, linearScale } from "../runtime/geometry.mjs";
import { blendNodes, blendWithAnnotations, createPlayer } from "../runtime/motion.mjs";

/**
 * 同一批非负分段展开、平移并接入基底；独立接线示例。
 * 用法：mountAmounts(document.querySelector("#amount-example"))，返回 dispose()。
 * root 提供 #amounts（viewBox 0 0 860 440）、#amount-summary、#amount-buttons；
 * 按钮的 data-mode 为 whole / parts / base / total。
 * amountPose 生成带身份的区间，blendAmounts 插值端点与位置，renderAmounts 用共同尺度绘制。
 * 可加总性、基底、顺序、方向和标签由作品确定；字符串渲染只用于本例固定文本。
 */
export function mountAmounts(root) {
  const $ = (selector) => root.querySelector(selector);
  const listeners = new AbortController();
  const listen = (target, type, handler) => target.addEventListener(type, handler, { signal: listeners.signal });
  // Additive specimen: segment identity and length survive unfolding and translation.
  // The same 60 units can be explained as parts, then added to a separate base of 40.
  const additions = [
    { id: "first", name: "第一批", amount: 18, color: "#297c6c" },
    { id: "second", name: "第二批", amount: 27, color: "#be633c" },
    { id: "third", name: "第三批", amount: 15, color: "#7c74a8" },
  ];
  const amountScale = linearScale([0, 110], [85, 805]);
  function amountPose(mode) {
    const based = mode === "base" || mode === "total", separated = mode === "parts" || mode === "base";
    const result = accumulationSegments(based ? 40 : 0, additions);
    const nodes = keyed(result.segments.map((segment, i) => ({
      ...segment, y: separated ? 70 + (i + (based ? 1 : 0)) * 75 : 160, opacity: 1,
    })));
    if (based) nodes.set("base", {
      id: "base", row: { name: "原有", color: "#82938a" },
      start: 0, end: 40, amount: 40, y: separated ? 70 : 160, opacity: 1,
    });
    const annotations = [{
      id: "total-" + result.total, kind: "total", value: result.total,
      text: based ? "累计 " + result.total : "新增 " + result.total, opacity: 1,
    }];
    if (separated) for (const node of nodes.values())
      annotations.push({ id: "part-" + node.id, kind: "part", nodeId: node.id,
        text: node.row.name + " · " + node.amount, opacity: 1 });
    return { mode, nodes, annotations: keyed(annotations), seams: separated ? 1 : 0.1 };
  }
  function blendAmounts(a, b, t) {
    return blendWithAnnotations(a, b, t, (from, to, progress) => ({
      ...to, nodes: blendNodes(from.nodes, to.nodes, progress, ["start", "end", "y", "opacity"]),
      seams: lerp(from.seams, to.seams, progress),
    }));
  }
  function renderAmounts(pose, frame) {
    const parts = ['<text x="85" y="28" fill="#61716a">可加总的模拟数量 · 同一长度尺度</text>'];
    for (let v = 0; v <= 100; v += 20) {
      const x = at(amountScale, v);
      parts.push('<line x1="' + x + '" x2="' + x + '" y1="42" y2="355" stroke="#e7ebe3"/>' +
        '<text x="' + x + '" y="385" text-anchor="middle" fill="#61716a">' + v + "</text>");
    }
    for (const node of pose.nodes.values()) {
      const x = at(amountScale, node.start), width = at(amountScale, node.end) - x;
      parts.push('<g data-segment="' + node.id + '" opacity="' + node.opacity + '"><rect x="' + x +
        '" y="' + node.y + '" width="' + width + '" height="30" fill="' + node.row.color + '"/>' +
        '<line x1="' + (x + width) + '" x2="' + (x + width) + '" y1="' + node.y + '" y2="' +
        (node.y + 30) + '" stroke="#fffdf7" opacity="' + pose.seams + '"/></g>');
    }
    for (const label of pose.annotations.values()) {
      if (label.kind === "total") {
        const x = at(amountScale, label.value);
        parts.push('<g opacity="' + label.opacity + '"><line x1="' + x + '" x2="' + x +
          '" y1="49" y2="355" stroke="#61716a" stroke-dasharray="3 5"/><text x="' + (x - 7) +
          '" y="413" text-anchor="end">' + label.text + "</text></g>");
      } else {
        const node = pose.nodes.get(label.nodeId);
        parts.push('<text x="' + at(amountScale, node.start) + '" y="' + (node.y - 11) +
          '" opacity="' + label.opacity + '">' + label.text + "</text>");
      }
    }
    $("#amounts").innerHTML = parts.join("");
    $("#amount-summary").textContent = frame.moving ? "各段移动时长度不变；标注在对应关系清楚后交接。"
      : pose.mode === "whole" ? "先读本期新增的整体：60。颜色对应其中三个批次。"
        : pose.mode === "parts" ? "同一组增量展开，仍占据原来的连续数量区间：18、27、15。"
          : pose.mode === "base" ? "接上原有 40：每段从上一累计端点起步，最终到 100。"
            : "相同各段合回累计带；总量为 100，分项仍在，没有另造一根替代柱。";
  }
  const aPlayer = createPlayer(amountPose("whole"), { blend: blendAmounts, render: renderAmounts, duration: 1050 });
  function amountGo(mode, options) {
    $("#amount-buttons").querySelectorAll("button").forEach((button) =>
      button.setAttribute("aria-pressed", String(button.dataset.mode === mode)));
    aPlayer.goTo(amountPose(mode), options);
  }
  listen($("#amount-buttons"), "click", (event) => {
    if (event.target.dataset.mode) amountGo(event.target.dataset.mode);
  });

  amountGo("whole", { immediate: true });
  return { dispose() {
    listeners.abort();
    aPlayer.dispose();
  } };
}
