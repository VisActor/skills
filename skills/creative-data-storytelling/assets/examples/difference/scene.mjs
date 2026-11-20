import { at, lerp, linearScale } from "../../runtime/geometry.mjs";
import { createPlayer } from "../../runtime/motion.mjs";
import { createValueFormat } from "../../runtime/format.mjs";
import { createSvgLayer, setSvgAttributes, svgElement } from "../../runtime/svg.mjs";

// 改写入口：同口径的两期值；差值域须覆盖零与所有结果，HTML 的刻度和行位置随之调整。
export const differenceExample = {
  rows: [
    { id: "a", name: "甲", before: 40, after: 65 },
    { id: "b", name: "乙", before: 30, after: 18 },
    { id: "c", name: "丙", before: 12, after: 12 },
  ],
  levelDomain: [0, 70], changeDomain: [-15, 30], unit: "件",
};

/**
 * 同口径两期端点 → 以零为参照的有符号差值，包含增加、减少、不变的模拟记录。
 * 用法：const view = mountDifference({ svg, readout, plotRange, rowY, renderAxis, config });
 * 输入：SVG 元素、读数元素、横向像素范围、rowY(id) 行位置函数；
 * renderAxis(scale, reading) 按给定尺度绘轴，scale 为 null 时隐藏轴。
 * view.show("levels" | "change") 选择完整状态，view.dispose() 释放播放器与图层。
 * config 默认 differenceExample；rowY / renderAxis 仍由调用方负责行布局和刻度。
 * 连接时隐藏两端刻度，因为移动中的坐标不再代表任一端的量值；原始记录与行身份保留。
 */
export function mountDifference({ svg, readout, plotRange, rowY, renderAxis, config = differenceExample }) {
  const facts = config.rows.map(row => ({ ...row, delta: row.after - row.before }));
  const reading = createValueFormat({ unit: config.unit, digits: config.digits ?? 0 });
  const levels = linearScale(config.levelDomain, plotRange);
  const changes = linearScale(config.changeDomain, plotRange);
  const describe = (row, mode) => mode === "levels"
    ? `${row.name}：${reading.format(row.before)} → ${reading.format(row.after)}`
    : `${row.name}：${row.delta > 0 ? "+" : ""}${reading.format(row.delta)}`;

  const marks = createSvgLayer(svg, {
    create() {
      const g = svgElement("g", { stroke: "currentColor", "stroke-width": 2 });
      g.append(svgElement("line"), svgElement("circle", { r: 5, fill: "none" }),
        svgElement("circle", { r: 3, fill: "currentColor" }),
        svgElement("text", { stroke: "none", fill: "currentColor" }));
      return g;
    },
    update(g, p) {
      const [line, before, after, label] = g.children;
      setSvgAttributes(line, { x1: p.x0, x2: p.x1, y1: p.y, y2: p.y });
      setSvgAttributes(before, { cx: p.x0, cy: p.y });
      setSvgAttributes(after, { cx: p.x1, cy: p.y });
      setSvgAttributes(label, { x: plotRange[0], y: p.y - 14 });
      label.textContent = p.label;
    },
  });
  function render({ q }) {
    // q 是连接进度，不是观测时间；原始记录不变。
    const mode = q === 0 ? "levels" : q === 1 ? "change" : null;
    marks.render(facts.map(row => ({
      id: row.id, y: rowY(row.id),
      x0: lerp(at(levels, row.before), at(changes, 0), q),
      x1: lerp(at(levels, row.after), at(changes, row.delta), q),
      label: mode ? describe(row, mode) : row.name,
    })));
    renderAxis(mode === "levels" ? levels : mode === "change" ? changes : null, reading);
    readout.textContent = mode ? facts.map(row => describe(row, mode)).join("；") : "";
  }
  const player = createPlayer({ q: 0 }, {
    blend: (from, to, t) => ({ q: lerp(from.q, to.q, t) }), render,
  });
  player.goTo({ q: 0 }, { immediate: true });
  // 由已有滚动或探索入口调用 show("levels") / show("change")。
  const show = mode => player.goTo({ q: mode === "change" ? 1 : 0 });
  return { show, dispose() { player.dispose(); marks.dispose(); } };
}
