import { at, keyed, lerp, linearScale } from "../../runtime/geometry.mjs";
import { blendNodes, blendWithAnnotations } from "../../runtime/motion.mjs";
import { createStage } from "../../runtime/stage.mjs";
import { reserveStageExit } from "../../runtime/scroll.mjs";
import { createSvgLayer, setSvgAttributes, svgElement } from "../../runtime/svg.mjs";

// 同一批对象从总量到人均。分段是平均份额，不是假装掌握了每个居民的借阅记录。
// 改写入口：数据和 quantum → basisPose 的几何 → HTML 的问题、正文、单位和排版。
// 此片段为讲清除数，用 5 万人一份；不可整分或份数过多时，应改用直接归一化等表达。
export const basisExample = {
  rows: [
    { id: "qinghe", name: "青河区", amount: 120, population: 40, color: "#315d78" },
    { id: "hewan", name: "河湾区", amount: 90, population: 15, color: "#b95c43" },
  ],
  quantum: 5, amountUnit: "万册", populationUnit: "万人", rateUnit: "册 / 人",
};
const format = value => new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 1 }).format(value);
const plot = { left: 145, right: 900, rowTop: 190, rowStep: 245 };

export function createBasisModel(config = basisExample) {
  keyed(config.rows);
  if (config.rows.length < 2 || !Number.isFinite(config.quantum) || config.quantum <= 0)
    throw new Error("Basis comparison needs at least two records and a positive population quantum");
  const rows = config.rows.map(row => {
    if (!Number.isFinite(row.amount) || row.amount < 0 || !Number.isFinite(row.population) || row.population <= 0)
      throw new Error("Basis values must be nonnegative; population must be positive: " + row.id);
    const parts = row.population / config.quantum;
    if (!Number.isInteger(parts) || parts < 1 || parts > 40)
      throw new Error("Equal-share drawing requires 1–40 whole population groups; choose a different quantum or drawing");
    return { ...row, parts, share: row.amount / parts, rate: row.amount / row.population };
  });
  const axis = value => {
    const high = (value || 1) * 1.15, targetStep = high / 4, power = 10 ** Math.floor(Math.log10(targetStep));
    const step = [1, 2, 5, 10].find(n => n * power >= targetStep) * power, max = Math.ceil(high / step) * step;
    return { max, ticks: Array.from({ length: Math.round(max / step) + 1 }, (_, i) => i * step) };
  };
  const rawAxis = axis(Math.max(...rows.map(row => row.amount))), rateAxis = axis(Math.max(...rows.map(row => row.rate)));
  const rawMax = rawAxis.max, rateMax = rateAxis.max;
  return { ...config, rows, byId: new Map(rows.map(row => [row.id, row])), rawMax, rateMax, rawTicks: rawAxis.ticks, rateTicks: rateAxis.ticks,
    rawScale: linearScale([0, rawMax], [plot.left, plot.right]), rateScale: linearScale([0, rateMax], [plot.left, plot.right]),
  };
}

export function basisPose(id, model = createBasisModel()) {
  if (!["total", "population", "shares", "rate"].includes(id)) throw new Error("Unknown basis reading: " + id);
  const isRate = id === "rate", divided = id === "shares" || isRate;
  const nodes = new Map(), annotations = new Map();
  model.rows.forEach((row, i) => {
    const y = plot.rowTop + i * plot.rowStep;
    for (let part = 0; part < row.parts; part++) {
      const selected = part === 0;
      nodes.set(`${row.id}/${part}`, { id: `${row.id}/${part}`, row, part,
        x: isRate && selected ? plot.left : at(model.rawScale, part * row.share),
        width: isRate && selected ? at(model.rateScale, row.rate) - plot.left : at(model.rawScale, row.share) - plot.left,
        y, opacity: divided && !selected ? (isRate ? 0 : 0.2) : 1,
      });
    }
    const basis = isRate ? "rate" : divided ? "share" : "amount";
    annotations.set(`${row.id}/${basis}`, { id: `${row.id}/${basis}`, row, basis, y, opacity: 1 });
  });
  return { id, nodes, annotations, rate: isRate ? 1 : 0, denominator: id !== "total" ? 1 : 0, divisions: divided ? 1 : 0 };
}

export function blendBasis(a, b, t) {
  return blendWithAnnotations(a, b, t, (from, to, p) => ({ ...to,
    nodes: blendNodes(from.nodes, to.nodes, p, ["x", "y", "width", "opacity"]),
    rate: lerp(from.rate, to.rate, p), denominator: lerp(from.denominator, to.denominator, p), divisions: lerp(from.divisions, to.divisions, p),
  }));
}

export function basisReading(model, row, basis) {
  if (basis === "amount") return `${format(row.amount)} ${model.amountUnit}`;
  if (basis === "population") return `${format(row.population)} ${model.populationUnit}`;
  if (basis === "share") return `${format(row.share)} ${model.amountUnit}`;
  if (basis === "rate") return `${format(row.rate)} ${model.rateUnit}`;
  throw new Error("Unknown basis reading field: " + basis);
}

export function mountBasis(root, { config = basisExample, duration = 1550 } = {}) {
  const model = createBasisModel(config), $ = selector => root.querySelector(selector), svg = $("svg");
  root.querySelectorAll("[data-record]").forEach(el => {
    const row = model.byId.get(el.dataset.record);
    if (!row) throw new Error("Unknown basis prose record: " + el.dataset.record);
    el.textContent = basisReading(model, row, el.dataset.field ?? "amount");
  });
  const axes = svgElement("g", { class: "axis" }), rawAxis = svgElement("g"), rateAxis = svgElement("g");
  for (const [group, ticks, scale, unit] of [[rawAxis, model.rawTicks, model.rawScale, model.amountUnit], [rateAxis, model.rateTicks, model.rateScale, model.rateUnit]]) {
    for (const value of ticks) {
      const x = at(scale, value);
      group.append(svgElement("line", { x1: x, x2: x, y1: 140, y2: 590 }), svgElement("text", { x, y: 628, "text-anchor": "middle" }, format(value)));
    }
    group.append(svgElement("text", { x: plot.left, y: 84 }, unit));
  }
  axes.append(rawAxis, rateAxis); svg.append(axes);
  // 零基线是两种单位的共同空间参照；分母交接中始终保留。
  const zero = svgElement("line", { x1: plot.left, x2: plot.left, y1: 140, y2: 590, stroke: "#84949c", "stroke-width": 1.5 }); svg.append(zero);
  const names = svgElement("g"), populations = svgElement("g");
  model.rows.forEach((row, i) => {
    const y = plot.rowTop + i * plot.rowStep;
    names.append(svgElement("text", { x: plot.left, y: y - 28, fill: row.color, class: "district" }, row.name));
    const g = svgElement("g", { transform: `translate(${plot.left},${y + 90})` });
    g.append(svgElement("rect", { width: 260, height: 40, rx: 20, fill: "#e4e9e9" }),
      svgElement("text", { x: 18, y: 27, class: "population" }, `常住人口 ${basisReading(model, row, "population")}`));
    populations.append(g);
  });
  svg.append(names);
  let current;
  const bars = createSvgLayer(svg, { create() { return svgElement("rect", { height: 58 }); }, update(rect, node) {
    setSvgAttributes(rect, { x: node.x, y: node.y, width: node.width, opacity: node.opacity,
      fill: node.row.color, stroke: "#f3f6f4", "stroke-width": current.divisions * 2 });
  } });
  svg.append(populations);
  const labels = createSvgLayer(svg, { create() { const g = svgElement("g"); g.append(svgElement("text", { class: "value" }), svgElement("text", { class: "basis-caption" })); return g; },
    update(g, item) {
      const first = current.nodes.get(`${item.row.id}/0`), last = current.nodes.get(`${item.row.id}/${item.row.parts - 1}`);
      const end = item.basis === "amount" ? last.x + last.width : first.x + first.width;
      setSvgAttributes(g, { opacity: item.opacity });
      setSvgAttributes(g.children[0], { x: end + 16, y: item.y + 38, fill: item.row.color });
      g.children[0].textContent = basisReading(model, item.row, item.basis);
      setSvgAttributes(g.children[1], { x: plot.left + 5, y: item.y + 164 });
      g.children[1].textContent = item.basis === "share" ? `平均分给每 ${format(model.quantum)} ${model.populationUnit}`
        : item.basis === "rate" ? "全部借阅量 ÷ 常住人口" : "";
    } });
  function render(pose, frame) {
    current = pose;
    const rawOpacity = pose.rate === 0 ? 1 : Math.max(0, 1 - pose.rate * 5);
    setSvgAttributes(rawAxis, { opacity: rawOpacity });
    setSvgAttributes(rateAxis, { opacity: Math.max(0, (pose.rate - 0.8) * 5) });
    setSvgAttributes(populations, { opacity: pose.denominator });
    bars.render(pose.nodes); labels.render(pose.annotations);
    svg.dataset.state = pose.id; svg.dataset.moving = String(frame.moving);
    if (!frame.moving) svg.setAttribute("aria-label", [...pose.annotations.values()].map(item =>
      `${item.row.name}，${basisReading(model, item.row, item.basis)}`).join("；"));
  }
  const exit = reserveStageExit({ sticky: $(".basis-stage"), readingEnd: $("[data-reading-end]"), spacer: $(".reading-tail"), releaseRatio: 0.4 });
  const stage = createStage({ element: svg, steps: [...root.querySelectorAll("[data-state]")].map(element => ({ element, id: element.dataset.state })),
    layout: id => basisPose(id, model), blend: blendBasis, render, duration, viewportRatio: 0.55 });
  document.fonts.ready.then(() => stage.refresh());
  return { sample: stage.sample, dispose() { stage.dispose(); exit.dispose(); bars.dispose(); labels.dispose(); axes.remove(); names.remove(); populations.remove(); zero.remove(); } };
}
