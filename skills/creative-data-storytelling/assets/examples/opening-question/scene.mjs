import { at, clamp01, keyed, lerp, linearScale } from "../../runtime/geometry.mjs";
import { blendNodes } from "../../runtime/motion.mjs";
import { createSvgLayer, setSvgAttributes, svgElement } from "../../runtime/svg.mjs";
import { connectReading } from "../../stage-wiring/connect.mjs";
import { createCopyHandoff } from "../../runtime/copy.mjs";

// 两批独立样本：同一批从摘要展开到记录，不配对两期中的个人。
export const waitingExample = {
  unit: "分钟", threshold: 60, max: 70,
  groups: [
    { id: "before", label: "调整前", values: [10, 12, 14, 18, 20, 28, 34, 40, 60, 64] },
    { id: "after", label: "调整后", values: [2, 4, 6, 8, 10, 12, 14, 20, 60, 64] },
  ],
};

export function createWaitingModel(config = waitingExample) {
  if (config.groups?.length !== 2 || !Number.isFinite(config.max) ||
    !Number.isFinite(config.threshold) || config.threshold <= 0 || config.threshold > config.max)
    throw new Error("Waiting opening compares two samples on one positive scale and an explicit threshold");
  keyed(config.groups);
  const groups = config.groups.map(group => {
    if (!group.values?.length || group.values.some(value => !Number.isFinite(value) || value < 0 || value > config.max))
      throw new Error("Waiting sample needs finite nonnegative values within the scale");
    const values = [...group.values].sort((a, b) => a - b);
    return { ...group, values, mean: values.reduce((sum, value) => sum + value, 0) / values.length,
      tail: values.filter(value => value >= config.threshold).length };
  });
  return { ...config, groups, difference: groups[0].mean - groups[1].mean };
}

export function waitingPose(id, model = createWaitingModel(), size = { width: 1100, height: 420 }) {
  if (!["question", "evidence"].includes(id)) throw new Error("Unknown opening state: " + id);
  const { width, height } = size;
  if (!(width >= 700 && height >= 280)) throw new Error("Waiting opening needs at least 700 × 280 px for its plot");
  const evidence = id === "evidence" ? 1 : 0;
  const scale = linearScale([0, model.max], [126, width - 132]);
  const means = new Map(), nodes = new Map();
  model.groups.forEach((group, index) => {
    const rowY = height * (.35 + index * .32), heroX = width * (.28 + index * .44), heroY = height * .52;
    const x = at(scale, group.mean), duplicates = new Map();
    means.set(group.id, { id: group.id, group, x: evidence ? x : heroX, y: evidence ? rowY - 35 : heroY,
      size: evidence ? 30 : 100, labelX: evidence ? 49 : heroX, labelY: evidence ? rowY + 6 : heroY - 91,
      unitX: evidence ? x + 28 : heroX, unitY: evidence ? rowY - 35 : heroY + 35, rowY });
    group.values.forEach((value, recordIndex) => {
      const stack = duplicates.get(value) ?? 0; duplicates.set(value, stack + 1);
      const key = `${group.id}/${recordIndex}`;
      nodes.set(key, { id: key, value, groupId: group.id, x: at(scale, value), y: rowY - stack * 18,
        opacity: evidence, tail: value >= model.threshold });
    });
  });
  return { id, means, nodes, evidence, scale, width, height };
}

export function blendWaiting(from, to, t) {
  if (t <= 0) return from;
  if (t >= 1) return to;
  const entering = to.evidence > from.evidence;
  const move = entering ? clamp01(t / .7) : clamp01((t - .25) / .75);
  const reveal = entering ? clamp01((t - .5) / .5) : clamp01(t / .4);
  return { ...to, evidence: lerp(from.evidence, to.evidence, reveal),
    means: blendNodes(from.means, to.means, move, ["x", "y", "size", "labelX", "labelY", "unitX", "unitY", "rowY"]),
    nodes: blendNodes(from.nodes, to.nodes, reveal, ["x", "y", "opacity"]) };
}

export function mountQuestionOpening(root, { config = waitingExample, duration = 1250 } = {}) {
  const model = createWaitingModel(config), $ = selector => root.querySelector(selector), svg = $("svg");
  const format = value => new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 1 }).format(value);
  root.querySelectorAll('[data-mean]').forEach(el => el.textContent = format(model.groups.find(g => g.id === el.dataset.mean).mean));
  root.querySelectorAll('[data-tail]').forEach(el => { const group = model.groups.find(g => g.id === el.dataset.tail); el.textContent = `${group.tail} / ${group.values.length}`; });
  root.querySelectorAll('[data-difference]').forEach(el => el.textContent = format(model.difference));
  root.querySelectorAll('[data-threshold]').forEach(el => el.textContent = format(model.threshold));
  root.querySelectorAll('[data-unit]').forEach(el => el.textContent = model.unit);
  const backdrop = svgElement("g"), shade = svgElement("rect", { fill: "var(--tail)", opacity: .07 });
  const threshold = svgElement("line", { stroke: "var(--tail)", "stroke-dasharray": "3 5" });
  const scope = svgElement("text", { class: "scope", "text-anchor": "end" }, `等候 ≥ ${config.threshold} ${config.unit}`);
  const axis = svgElement("g", { class: "axis" }); backdrop.append(shade, threshold, scope, axis); svg.append(backdrop);
  const stems = createSvgLayer(svg, { create() { return svgElement("line", { stroke: "var(--ink)", "stroke-width": 1.5 }); },
    update(el, mark) { setSvgAttributes(el, { x1: at(pose.scale, mark.group.mean), x2: at(pose.scale, mark.group.mean),
      y1: mark.rowY - 24, y2: mark.rowY + 18, opacity: pose.evidence }); } });
  const dots = createSvgLayer(svg, { create() { return svgElement("circle", { r: 7 }); },
    update(el, dot) { setSvgAttributes(el, { cx: dot.x, cy: dot.y, opacity: dot.opacity,
      fill: dot.tail ? "var(--tail)" : "var(--point)", "data-record": dot.id }); } });
  const means = createSvgLayer(svg, { create() {
    const g = svgElement("g"); g.append(svgElement("text", { class: "mean", "text-anchor": "middle" }),
      svgElement("text", { class: "group-label", "text-anchor": "middle" }),
      svgElement("text", { class: "unit" }), svgElement("text", { class: "mean-prefix", "text-anchor": "end" }, "平均")); return g;
  }, update(g, mark) {
    setSvgAttributes(g, { "data-summary": mark.id });
    setSvgAttributes(g.children[0], { x: mark.x, y: mark.y, "font-size": mark.size }); g.children[0].textContent = format(mark.group.mean);
    setSvgAttributes(g.children[1], { x: mark.labelX, y: mark.labelY }); g.children[1].textContent = mark.group.label;
    setSvgAttributes(g.children[2], { x: mark.unitX, y: mark.unitY, "text-anchor": pose.evidence > .5 ? "start" : "middle" });
    g.children[2].textContent = config.unit;
    setSvgAttributes(g.children[3], { x: mark.x - 29, y: mark.y, opacity: pose.evidence });
  } });
  const counts = createSvgLayer(svg, { create() { return svgElement("text", { class: "tail-count", "text-anchor": "end" }); },
    update(el, mark) { setSvgAttributes(el, { x: pose.width - 3, y: mark.rowY + 6, opacity: pose.evidence }); el.textContent = `${mark.group.tail} / ${mark.group.values.length}`; } });
  let pose, sizeKey;
  const copy = createCopyHandoff($('.copy')), next = $('[data-next]'), finish = $('[data-finish]');
  const connection = connectReading({ element: svg, reading: $('.scroll-track'), track: { ids: ['question', 'evidence'] },
    exit: { sticky: $('.question-stage'), releaseRatio: 0 }, viewportRatio: 0, duration,
    navigation: { scope: $('.question-stage'), previous: $('[data-prev]'), next },
    layout(id, size) { return waitingPose(id, model, size); }, blend: blendWaiting,
    render(current, frame) {
      pose = current;
      const key = pose.width + '/' + pose.height, x1 = at(pose.scale, config.max), tailX = at(pose.scale, config.threshold);
      if (key !== sizeKey) {
        sizeKey = key; setSvgAttributes(svg, { viewBox: `0 0 ${pose.width} ${pose.height}` });
        axis.replaceChildren();
        for (let tick = 0; tick <= config.max; tick += 10) {
          const x = at(pose.scale, tick), y = pose.height - 40;
          axis.append(svgElement('line', { x1: x, x2: x, y1: y - 8, y2: y - 2 }),
            svgElement('text', { x, y: y + 21, 'text-anchor': 'middle' }, tick));
        }
        axis.append(svgElement('text', { x: x1 + 22, y: pose.height - 19 }, config.unit));
      }
      setSvgAttributes(backdrop, { opacity: pose.evidence });
      setSvgAttributes(shade, { x: tailX, y: 34, width: x1 - tailX, height: pose.height - 92 });
      setSvgAttributes(threshold, { x1: tailX, x2: tailX, y1: 34, y2: pose.height - 58 });
      setSvgAttributes(scope, { x: x1, y: 22 });
      stems.render(pose.means); dots.render(pose.nodes); means.render(pose.means); counts.render(pose.means);
      const nextCopy = frame.moving ? 'question' : pose.id;
      copy.show(nextCopy);
      next.hidden = nextCopy === 'evidence'; finish.hidden = !next.hidden;
      $('[data-reading-guide]').textContent = nextCopy === 'question'
        ? '两批独立样本 · 比较平均等候' : '每个圆点是一人 · 两期不做个人配对';
      svg.dataset.state = pose.id; svg.dataset.moving = String(frame.moving);
      if (!frame.moving) svg.setAttribute('aria-label', model.groups.map(g => `${g.label}，平均${format(g.mean)}${config.unit}` +
        (pose.id === 'evidence' ? `，${g.values.length}人中${g.tail}人等候至少${config.threshold}${config.unit}` : '')).join('；'));
    } });
  document.fonts.ready.then(() => connection.refresh());
  return { sample: connection.stage.sample, dispose() { connection.dispose(); copy.dispose(); stems.dispose(); dots.dispose(); means.dispose(); counts.dispose(); backdrop.remove(); } };
}
