import { accumulationSegments, at, keyed, lerp, linearScale } from "../../runtime/geometry.mjs";
import { blendNodes, blendWithAnnotations, createPlayer } from "../../runtime/motion.mjs";
import { createValueFormat } from "../../runtime/format.mjs";

// 改写入口：可加总分项与基底、单位和精度。几何、标注与正文从同一份数值生成。
export const amountExample = {
  base: { id: "base", name: "原有", amount: 40, color: "#82938a" },
  additions: [
    { id: "first", name: "第一批", amount: 18, color: "#297c6c" },
    { id: "second", name: "第二批", amount: 27, color: "#be633c" },
    { id: "third", name: "第三批", amount: 15, color: "#7c74a8" },
  ],
  unit: "件", digits: 0,
};

export function createAmountModel(config = amountExample) {
  const { base, additions, unit = "", digits = 0 } = config;
  const format = createValueFormat({ unit, digits });
  keyed([base, ...additions]);
  const added = accumulationSegments(0, additions), total = accumulationSegments(base.amount, additions);
  const rawStep = Math.max(total.total / 5, 10 ** -digits), magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = [1, 2, 5, 10].map((n) => n * magnitude).find((n) => n >= rawStep);
  const maximum = Math.max(step, Math.ceil(total.total / step) * step);
  return { base, additions, added, total, format,
    scale: linearScale([0, maximum + step / 2], [85, 805]),
    ticks: Array.from({ length: Math.round(maximum / step) + 1 }, (_, i) => i * step) };
}

export function amountPose(mode, model = createAmountModel()) {
  if (!["whole", "parts", "base", "total"].includes(mode)) throw new Error("Unknown amount state: " + mode);
  const based = mode === "base" || mode === "total", separated = mode === "parts" || mode === "base";
  const result = based ? model.total : model.added, { base, format } = model;
  const rowStep = Math.min(75, 245 / Math.max(1, model.additions.length));
  const nodes = keyed(result.segments.map((segment, i) => ({
    ...segment, y: separated ? 70 + (i + (based ? 1 : 0)) * rowStep : 160, opacity: 1,
  })));
  if (based) nodes.set(base.id, {
    id: base.id, row: base, start: 0, end: base.amount, amount: base.amount, y: separated ? 70 : 160, opacity: 1,
  });
  const annotations = [{
    id: based ? "cumulative-total" : "added-total", kind: "total", value: result.total,
    text: (based ? "累计 " : "新增 ") + format.format(result.total), opacity: 1,
  }];
  if (separated) for (const node of nodes.values())
    annotations.push({ id: "part-" + node.id, kind: "part", nodeId: node.id,
      text: node.row.name + " · " + format.format(node.amount), opacity: 1 });
  return { mode, nodes, annotations: keyed(annotations), seams: separated ? 1 : 0.1 };
}

export function blendAmounts(a, b, t) {
  return blendWithAnnotations(a, b, t, (from, to, progress) => ({
    ...to, nodes: blendNodes(from.nodes, to.nodes, progress, ["start", "end", "y", "opacity"]),
    seams: lerp(from.seams, to.seams, progress),
  }));
}

/**
 * 同一批非负分段展开、平移并接入基底；独立接线示例。
 * 用法：mountAmounts(root, config?)，返回 dispose()。先改 amountExample，再改 amountPose 的空间。
 * root 提供 #amounts（viewBox 0 0 860 440）、#amount-summary、#amount-buttons；
 * 按钮的 data-mode 为 whole / parts / base / total。
 * 拆分只改排列；接入基底才改累计端点。只取叙事所需状态；标签多时重新安排间距。
 * 固定样例文字用字符串绘制；接入外部标签时改用 textContent 或 createSvgLayer。
 */
export function mountAmounts(root, config = amountExample) {
  const $ = (selector) => root.querySelector(selector), model = createAmountModel(config);
  const { format, scale: amountScale, base, added, total } = model;
  const listeners = new AbortController();
  const listen = (target, type, handler) => target.addEventListener(type, handler, { signal: listeners.signal });
  function renderAmounts(pose, frame) {
    const parts = ['<text x="85" y="28" fill="#61716a">模拟数量 / ' + format.unit + ' · 同一长度尺度</text>'];
    for (const v of model.ticks) {
      const x = at(amountScale, v);
      parts.push('<line x1="' + x + '" x2="' + x + '" y1="42" y2="355" stroke="#e7ebe3"/>' +
        '<text x="' + x + '" y="385" text-anchor="middle" fill="#61716a">' + format.number(v) + "</text>");
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
      : pose.mode === "whole" ? "本期新增合计 " + format.format(added.total) + "，颜色区分各批次。"
        : pose.mode === "parts" ? "展开的是同一批增量：" + model.additions.map((row) => format.format(row.amount)).join("、") + "。总量不变。"
          : pose.mode === "base" ? "接上" + base.name + " " + format.format(base.amount) + "，累计到 " + format.format(total.total) + "。"
            : "各段合回累计带，总量 " + format.format(total.total) + "；分项身份和长度保留。";
  }
  const aPlayer = createPlayer(amountPose("whole", model), { blend: blendAmounts, render: renderAmounts, duration: 1050 });
  function amountGo(mode, options) {
    $("#amount-buttons").querySelectorAll("button").forEach((button) =>
      button.setAttribute("aria-pressed", String(button.dataset.mode === mode)));
    aPlayer.goTo(amountPose(mode, model), options);
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
