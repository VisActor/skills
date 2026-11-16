import { at, clamp01, keyed, lerp, linearScale } from "../../runtime/geometry.mjs";
import { createStage } from "../../runtime/stage.mjs";
import { reserveStageExit } from "../../runtime/scroll.mjs";
import { createSvgLayer, setSvgAttributes, svgElement } from "../../runtime/svg.mjs";

// 自写虚构短剧。用有出处的出现位置与人工确认的呼应关系，不靠词面相似自动连线。
// scene.order 是场次，不是时间长度。先出现记录，再绘制已有依据的关系。
// 改 scenes / occurrences / links / stops；三张短卡片的布局要随数量和文本重排。
export const recurrenceExample = {
  phrase: "到了给我打个电话。",
  scenes: [
    { id: "packing", order: 1, label: "收拾行李" }, { id: "station", order: 2, label: "第一次远行" },
    { id: "new-city", order: 3, label: "抵达新城" }, { id: "holiday", order: 4, label: "假期回家" },
    { id: "doorway", order: 5, label: "再次出发" }, { id: "visit", order: 6, label: "母亲来访" },
    { id: "planning", order: 7, label: "新的计划" }, { id: "airport", order: 8, label: "送母亲远行" },
  ],
  occurrences: [
    { id: "first-call", sceneId: "station", speaker: "母亲", recipient: "女儿", context: ["女儿第一次离家。", "母亲送她到车站。"] },
    { id: "second-call", sceneId: "doorway", speaker: "母亲", recipient: "女儿", context: ["假期结束，女儿返程。", "母亲在门口又说了一遍。"] },
    { id: "returned-call", sceneId: "airport", speaker: "女儿", recipient: "母亲", context: ["母亲准备独自去旅行。", "这次，女儿送她出发。"] },
  ],
  links: [
    { id: "first-repeat", from: "first-call", to: "second-call", basis: "同一句叮嘱在另一场景中再次出现" },
    { id: "roles-reversed", from: "second-call", to: "returned-call", basis: "原话再次出现，说话人与听话人互换" },
  ],
  stops: [
    { id: "first", throughId: "first-call", focusId: "first-call" },
    { id: "repeat", throughId: "second-call", focusId: "second-call" },
    { id: "reverse", throughId: "returned-call", focusId: "returned-call" },
    { id: "whole", throughId: "returned-call", focusId: null },
  ],
};
const plot = { left: 74, right: 870, lineY: 385, cardY: 135, cardWidth: 252 };

export function createRecurrenceModel(config = recurrenceExample) {
  const scenes = keyed(config.scenes), occurrences = keyed(config.occurrences), links = keyed(config.links), stops = keyed(config.stops);
  if (config.scenes.length < 2 || !occurrences.size || !stops.size || !config.phrase ||
    config.scenes.some((scene, i, rows) => !Number.isFinite(scene.order) || (i && scene.order <= rows[i - 1].order)))
    throw new Error("Recurrence needs ordered scenes, a phrase and distinct records");
  let previousOrder = -Infinity;
  const rows = config.occurrences.map((row, index) => {
    const scene = scenes.get(row.sceneId);
    if (!scene || scene.order <= previousOrder || !row.speaker || !row.recipient ||
      !Array.isArray(row.context) || row.context.length !== 2)
      throw new Error("Occurrences need increasing source scenes, speakers and two short context lines");
    previousOrder = scene.order;
    return { ...row, scene, index };
  });
  const byId = keyed(rows);
  for (const link of links.values()) {
    if (!byId.has(link.from) || !byId.has(link.to) || byId.get(link.from).index >= byId.get(link.to).index || !link.basis)
      throw new Error("Recurrence links need ordered existing endpoints and an explicit evidence basis");
  }
  let previousIndex = -1;
  for (const stop of stops.values()) {
    const last = byId.get(stop.throughId), focused = stop.focusId == null ? null : byId.get(stop.focusId);
    if (!last || last.index < previousIndex || (stop.focusId != null && (!focused || focused.index > last.index)))
      throw new Error("Recurrence stops reveal existing occurrences in order and focus visible records");
    previousIndex = last.index;
  }
  return { ...config, scenes, rows, byId, links, stops,
    x: linearScale([config.scenes[0].order, config.scenes.at(-1).order], [plot.left, plot.right]) };
}

export function recurrencePose(id, model = createRecurrenceModel()) {
  const stop = model.stops.get(id);
  if (!stop) throw new Error("Unknown recurrence reading: " + id);
  return { id, through: model.byId.get(stop.throughId).index + 1,
    emphasis: keyed(model.rows.map(row => ({ id: row.id, value: stop.focusId == null || stop.focusId === row.id ? 1 : .3 }))) };
}

export function blendRecurrence(from, to, t) {
  if (t <= 0) return from;
  if (t >= 1) return to;
  return { ...to, through: lerp(from.through, to.through, t),
    emphasis: keyed([...to.emphasis.values()].map(row => ({ id: row.id, value: lerp(from.emphasis.get(row.id).value, row.value, t) }))) };
}

export function recurrenceGeometry(model, pose) {
  const nodes = model.rows.map(row => {
    const reveal = clamp01((pose.through - row.index) / .58);
    return { id: row.id, row, x: at(model.x, row.scene.order), y: plot.lineY, reveal,
      cardY: plot.cardY + 17 * (1 - reveal), emphasis: pose.emphasis.get(row.id).value };
  });
  const byId = keyed(nodes);
  const links = [...model.links.values()].map(link => {
    const a = byId.get(link.from), b = byId.get(link.to);
    // 先完成两个出现位置，再画呼应；反向时先收回弧线，随后退回出现记录。
    const draw = clamp01((pose.through - b.row.index - .58) / .42);
    return { ...link, fromX: a.x, toX: b.x, y: plot.lineY,
      bend: Math.min(155, (b.x - a.x) * .42), draw: a.reveal === 1 && b.reveal === 1 ? draw : 0 };
  });
  return { nodes, links };
}

export function mountRecurrence(root, { config = recurrenceExample, duration = 1350 } = {}) {
  const model = createRecurrenceModel(config), $ = selector => root.querySelector(selector), svg = $("svg");
  const base = svgElement("g", { class: "sequence-base" });
  base.append(svgElement("line", { x1: plot.left, x2: plot.right, y1: plot.lineY, y2: plot.lineY }));
  for (const scene of model.scenes.values()) {
    const x = at(model.x, scene.order);
    base.append(svgElement("circle", { cx: x, cy: plot.lineY, r: 14 }),
      svgElement("text", { x, y: plot.lineY + 6, "text-anchor": "middle", class: "scene-number" }, String(scene.order)),
      svgElement("text", { x, y: 557, "text-anchor": "middle", class: "scene-name" }, scene.label));
  }
  base.append(svgElement("text", { x: plot.left, y: 610, class: "axis-note" }, "按场次排列 · 间距不表示时长"));
  svg.append(base);
  const arcs = createSvgLayer(svg, {
    create() { const p = svgElement("path", { pathLength: 1, "stroke-dasharray": 1, fill: "none", class: "recurrence-arc" }); return p; },
    update(path, link) {
      setSvgAttributes(path, { d: "M" + link.fromX + "," + link.y + "C" + link.fromX + "," + (link.y + link.bend) +
        " " + link.toX + "," + (link.y + link.bend) + " " + link.toX + "," + link.y,
        "stroke-dashoffset": 1 - link.draw, opacity: link.draw > 0 ? 1 : 0, "data-link": link.id });
    },
  });
  const cards = createSvgLayer(svg, {
    create(node) {
      const g = svgElement("g", { "data-occurrence": node.id }), card = svgElement("g");
      card.append(svgElement("rect", { x: -plot.cardWidth / 2, width: plot.cardWidth, height: 184, rx: 4, class: "quote-paper" }),
        svgElement("text", { x: 0, y: 33, "text-anchor": "middle", class: "speaker" }, node.row.speaker + " → " + node.row.recipient),
        svgElement("text", { x: 0, y: 72, "text-anchor": "middle", class: "phrase" }, "“" + config.phrase + "”"),
        svgElement("line", { x1: -88, x2: 88, y1: 94, y2: 94, class: "card-rule" }),
        svgElement("text", { x: 0, y: 126, "text-anchor": "middle", class: "context" }, node.row.context[0]),
        svgElement("text", { x: 0, y: 152, "text-anchor": "middle", class: "context" }, node.row.context[1]));
      g.append(svgElement("line", { class: "card-stem" }),
        svgElement("circle", { cx: 0, cy: plot.lineY, r: 14, class: "appearance" }),
        svgElement("text", { x: 0, y: plot.lineY + 6, "text-anchor": "middle", class: "appearance-number" }, String(node.row.scene.order)), card);
      return g;
    },
    update(g, node) {
      setSvgAttributes(g, { transform: "translate(" + node.x + " 0)", opacity: node.reveal });
      setSvgAttributes(g.children[0], { x1: 0, x2: 0, y1: node.cardY + 184, y2: plot.lineY - 16 });
      setSvgAttributes(g.children[3], { transform: "translate(0 " + node.cardY + ")", opacity: .72 + .28 * node.emphasis });
      setSvgAttributes(g.children[3].children[0], { "stroke-width": 1 + node.emphasis });
      setSvgAttributes(g.children[3].children[1], { fill: node.emphasis > .6 ? "var(--accent)" : "var(--ink)" });
    },
  });
  function render(pose, frame) {
    const geometry = recurrenceGeometry(model, pose);
    arcs.render(geometry.links); cards.render(geometry.nodes);
    svg.dataset.state = pose.id; svg.dataset.moving = String(frame.moving);
    if (!frame.moving) svg.setAttribute("aria-label", "同一句对白在已展示场次中的呼应：" +
      geometry.nodes.filter(row => row.reveal === 1).map(node => "第 " + node.row.scene.order + " 场，" +
        node.row.speaker + "对" + node.row.recipient + "说：" + config.phrase).join("；"));
  }
  const exit = reserveStageExit({ sticky: $(".recurrence-stage"), readingEnd: $("[data-reading-end]"), spacer: $(".reading-tail"), releaseRatio: .4 });
  const stage = createStage({ element: svg, steps: [...root.querySelectorAll("[data-state]")].map(element => ({ element, id: element.dataset.state })),
    layout: id => recurrencePose(id, model), blend: blendRecurrence, render, duration, viewportRatio: .56 });
  document.fonts.ready.then(() => stage.refresh());
  return { sample: stage.sample, dispose() { stage.dispose(); exit.dispose(); arcs.dispose(); cards.dispose(); base.remove(); } };
}
