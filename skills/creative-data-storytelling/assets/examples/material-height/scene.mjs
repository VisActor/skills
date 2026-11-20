import { at, clamp01, keyed, lerp, linearScale, mixScale } from "../../runtime/geometry.mjs";
import { blendNodes, blendWithAnnotations } from "../../runtime/motion.mjs";
import { createStage } from "../../runtime/stage.mjs";
import { reserveStageExit } from "../../runtime/scroll.mjs";
import { createSvgLayer, setSvgAttributes, svgElement } from "../../runtime/svg.mjs";

// 素材本身的竖直长度编码高度：地面和建筑尖顶必须校准，不能只把图片框设成相同比例。
// 更换 buildings / stops / domain，并重写正文。每个 stop 的 axisMax 决定观看范围。
// 同一帧的轴、素材与标注共用 pose.scale；零点不动，真实高度不随取景改变。
// 本例选择七座地标，不是完整纪录史；横向等距排列不是连续时间轴。
// art.topY / baseY 校准可见高度；不绘旗杆和功能性天线，楼宽及窗格为示意。
export const skylineExample = {
  unit: "米", domain: [0, 900], ticks: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900],
  buildings: [
    { id: "eiffel", name: "埃菲尔铁塔", city: "巴黎", year: 1889, height: 300,
      art: { image: "images/eiffel.svg", width: 420, height: 1000, topY: 0, baseY: 1000 },
      source: "https://www.toureiffel.paris/en/news/history-and-culture/300-330-meters-story-towers-height" },
    { id: "chrysler", name: "克莱斯勒大厦", city: "纽约", year: 1930, height: 319,
      art: { image: "images/chrysler.svg", width: 245, height: 1000, topY: 0, baseY: 1000 },
      source: "https://www.skyscraper.org/tallest-towers/chrysler-building/" },
    { id: "empire", name: "帝国大厦", city: "纽约", year: 1931, height: 381,
      art: { image: "images/empire.svg", width: 320, height: 1000, topY: 0, baseY: 1000 },
      source: "https://www.skyscrapercenter.com/building/wd/261" },
    { id: "willis", name: "威利斯大厦", city: "芝加哥", year: 1974, height: 442.1,
      art: { image: "images/willis.svg", width: 230, height: 1000, topY: 0, baseY: 1000 },
      source: "https://www.skyscrapercenter.com/building/building/169" },
    { id: "petronas", name: "国油双峰塔", city: "吉隆坡", year: 1998, height: 451.9,
      art: { image: "images/petronas.svg", width: 400, height: 1000, topY: 0, baseY: 1000 },
      source: "https://www.skyscrapercenter.com/building/wd/149" },
    { id: "taipei", name: "台北101", city: "台北", year: 2004, height: 508,
      art: { image: "images/taipei.svg", width: 240, height: 1000, topY: 0, baseY: 1000 },
      source: "https://www.skyscrapercenter.com/building/taipei-101/117" },
    { id: "burj", name: "哈利法塔", city: "迪拜", year: 2010, height: 828,
      art: { image: "images/burj.svg", width: 200, height: 1000, topY: 0, baseY: 1000 },
      source: "https://newsletter.ctbuh.org/eblast/BurjKhalifa/BurjKhalifaHeight.html" },
  ],
  stops: [
    { id: "start", through: "eiffel", axisMax: 400, focus: ["eiffel"] },
    { id: "chrysler", through: "chrysler", axisMax: 400, focus: ["chrysler"], pair: ["eiffel", "chrysler"] },
    { id: "empire", through: "empire", axisMax: 400, focus: ["empire"], pair: ["chrysler", "empire"] },
    { id: "chicago", through: "willis", axisMax: 600, focus: ["willis"], pair: ["empire", "willis"] },
    { id: "twins", through: "petronas", axisMax: 600, focus: ["petronas"], pair: ["willis", "petronas"] },
    { id: "half-kilometer", through: "taipei", axisMax: 600, focus: ["taipei"], threshold: 500 },
    { id: "leap", through: "burj", axisMax: 900, focus: ["taipei", "burj"], pair: ["taipei", "burj"] },
    { id: "look-back", through: "burj", axisMax: 900, focus: ["eiffel", "burj"], pair: ["eiffel", "burj"] },
  ],
};
const plot = { ground: 640, top: 62, center: 535, gap: 185, left: 76, right: 1030 };
const number = n => new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 1 }).format(n);
let nextInstance = 0;

export function createSkylineModel(config = skylineExample) {
  const buildings = keyed(config.buildings), stops = keyed(config.stops);
  const domain = config.domain ?? [0, Math.ceil(Math.max(...config.buildings.map(row => row.height)) / 100) * 100];
  if (!buildings.size || !stops.size || domain.length !== 2 || domain[0] !== 0 || !Number.isFinite(domain[1]) || domain[1] <= 0)
    throw new Error("Skyline needs records, stops and a finite zero-based height domain");
  const rows = config.buildings.map((row, index) => {
    const art = row.art;
    if (!Number.isFinite(row.height) || row.height <= 0 || row.height > domain[1] || !Number.isFinite(row.year) ||
      (index && row.year < config.buildings[index - 1].year) || !row.name || !art?.image ||
      ![art.width, art.height, art.topY, art.baseY].every(Number.isFinite) || art.width <= 0 || art.height <= 0 ||
      art.topY < 0 || art.baseY > art.height || art.topY >= art.baseY)
      throw new Error("Buildings need ordered years, in-range heights and calibrated material endpoints");
    return { ...row, index };
  });
  const byId = keyed(rows), ticks = config.ticks ?? [0, domain[1] / 2, domain[1]];
  if (!ticks.length || ticks.some((n, i) => !Number.isFinite(n) || n < 0 || n > domain[1] || (i && n <= ticks[i - 1])))
    throw new Error("Skyline ticks must be ordered and inside the common scale");
  let previousIndex = -1;
  for (const stop of stops.values()) {
    const last = byId.get(stop.through);
    const axisMax = stop.axisMax ?? domain[1];
    if (!last || last.index < previousIndex || !Array.isArray(stop.focus) ||
      stop.focus.some(id => !byId.has(id) || byId.get(id).index > last.index) ||
      (stop.pair && (stop.pair.length !== 2 || stop.pair[0] === stop.pair[1] ||
        stop.pair.some(id => !byId.has(id) || byId.get(id).index > last.index))) ||
      (stop.threshold != null && (!Number.isFinite(stop.threshold) || stop.threshold < 0 || stop.threshold > domain[1])))
      throw new Error("Skyline reading stops retain earlier records and compare visible buildings");
    if (!Number.isFinite(axisMax) || axisMax <= 0 || axisMax > domain[1] ||
      rows.slice(0, last.index + 1).some(row => row.height > axisMax) || (stop.threshold != null && stop.threshold > axisMax))
      throw new Error("Each skyline view must cover all visible heights and references from zero");
    previousIndex = last.index;
  }
  return { ...config, rows, buildings: byId, stops, ticks, domain, number };
}

export function skylinePose(id, model = createSkylineModel()) {
  const stop = model.stops.get(id);
  if (!stop) throw new Error("Unknown skyline state: " + id);
  const count = model.buildings.get(stop.through).index + 1;
  const gap = Math.min(plot.gap, 820 / Math.max(1, count - 1));
  const nodes = keyed(model.rows.map(row => ({ id: row.id, row,
    x: plot.center + (row.index - (count - 1) / 2) * gap,
    reveal: row.index < count ? 1 : 0, focus: stop.focus.includes(row.id) ? 1 : 0 })));
  const annotations = new Map();
  if (stop.pair) {
    const [a, b] = stop.pair.map(key => model.buildings.get(key)), key = a.id + "/" + b.id;
    annotations.set(key, { id: key, kind: "gap", a: a.id, b: b.id, value: b.height - a.height, opacity: 1 });
  }
  if (stop.threshold != null) annotations.set("threshold/" + stop.threshold,
    { id: "threshold/" + stop.threshold, kind: "threshold", value: stop.threshold, opacity: 1 });
  return { id, nodes, annotations, scale: linearScale([0, stop.axisMax ?? model.domain[1]], [plot.ground, plot.top]) };
}

export function blendSkyline(from, to, t) {
  return blendWithAnnotations(from, to, t, (a, b, p) => {
    const retiring = [...a.nodes].some(([id, node]) => node.reveal > b.nodes.get(id).reveal);
    const rescaling = Math.abs(a.scale.k - b.scale.k) > 1e-9;
    const split = rescaling ? .52 : .33;
    const move = retiring ? clamp01((p - .58) / (1 - .58)) : clamp01(p / split);
    const reveal = retiring ? clamp01(p / .52) : clamp01((p - split) / (1 - split));
    const nodes = blendNodes(a.nodes, b.nodes, p, ["focus"]);
    for (const [id, node] of nodes) {
      node.x = lerp(a.nodes.get(id).x, b.nodes.get(id).x, move);
      node.reveal = lerp(a.nodes.get(id).reveal, b.nodes.get(id).reveal, reveal);
    }
    return { ...b, nodes, scale: mixScale(a.scale, b.scale, move) };
  }, { exitEnd: .12, enterStart: .84 });
}

export function skylineGeometry(model, pose) {
  return [...pose.nodes.values()].map(node => {
    const art = node.row.art, roof = at(pose.scale, node.row.height), ground = at(pose.scale, 0);
    const height = ground - roof, materialScale = height / (art.baseY - art.topY);
    const width = art.width * materialScale, imageHeight = art.height * materialScale;
    return { ...node, roof, ground, height, width, imageHeight, materialScale,
      imageY: ground - art.baseY * materialScale,
      clipY: ground - height * node.reveal, clipHeight: height * node.reveal,
      readoutOpacity: clamp01((node.reveal - .96) / .04) };
  });
}

export function skylineTicks(model, pose) {
  return model.ticks.map(value => {
    const y = at(pose.scale, value);
    return { id: String(value), value, y, opacity: value === 0 ? 1 : clamp01((y - plot.top + 12) / 12) };
  }).filter(tick => tick.opacity > 0);
}

export function skylineComparison(model, pose, note) {
  const nodes = keyed(skylineGeometry(model, pose));
  if (note.kind === "threshold") return { ...note, y: at(pose.scale, note.value) };
  const a = nodes.get(note.a), b = nodes.get(note.b), visible = [...nodes.values()].filter(node => node.reveal > 0);
  const left = a.x < b.x ? a : b, right = left === a ? b : a;
  // 长距离回看沿用主图，将括号放在高楼身旁；参照线在素材下层穿过。
  const neighbor = visible.filter(node => node.x < right.x).at(-1) ?? left;
  const x = (neighbor.x + right.x) / 2, small = Math.abs(a.height - b.height) < 110;
  // 长跨度差距的中点可能正好落在别座楼的读数上，沿括号寻找空出的高度带。
  const top = Math.min(a.roof, b.roof), bottom = Math.max(a.roof, b.roof);
  const candidates = [.5, .35, .65, .2, .8].map(t => lerp(top, bottom, t));
  const y = small ? top - 58 : candidates.find(y => visible.every(node => Math.abs(y - (node.roof - 22)) > 44)) ?? candidates[0];
  return { ...note, a, b, x, small, y };
}

export function mountSkyline(root, { config = skylineExample, duration = 1650 } = {}) {
  const model = createSkylineModel(config), $ = selector => root.querySelector(selector), svg = $("svg");
  const defs = svgElement("defs"), prefix = "skyline-" + ++nextInstance, clips = new Map();
  const axis = svgElement("g", { class: "axis", "aria-hidden": "true" });
  axis.append(svgElement("text", { x: plot.left, y: 32, class: "axis-title" }, "地标高度 / " + model.unit));
  svg.append(defs, axis);
  const tickLayer = createSvgLayer(axis, {
    create(tick) {
      const g = svgElement("g", { "data-tick": tick.value });
      g.append(svgElement("line", { x1: plot.left, x2: plot.right, class: tick.value === 0 ? "ground" : "" }),
        svgElement("text", { x: plot.left - 18, y: 6, "text-anchor": "end" }, model.number(tick.value)));
      return g;
    },
    update(g, tick) { setSvgAttributes(g, { transform: `translate(0 ${tick.y})`, opacity: tick.opacity }); },
  });
  const guides = createSvgLayer(svg, {
    create() { return svgElement("path", { fill: "none", class: "comparison-rule" }); },
    update(path, note) {
      setSvgAttributes(path, { opacity: note.opacity, "data-guide": note.id, d: note.kind === "threshold"
        ? `M${plot.left},${note.y}H${plot.right}`
        : `M${note.a.x},${note.a.roof}H${note.x}V${note.b.roof}H${note.b.x}` });
    },
  });
  const images = createSvgLayer(svg, {
    create(node) {
      const clipId = prefix + "-" + clips.size, boundary = svgElement("rect");
      const clip = svgElement("clipPath", { id: clipId }); clip.append(boundary); defs.append(clip); clips.set(node.id, boundary);
      const g = svgElement("g", { "data-building": node.id, "aria-hidden": "true" });
      g.append(svgElement("image", { href: new URL(node.row.art.image, import.meta.url).href,
        "clip-path": `url(#${clipId})`, preserveAspectRatio: "xMidYMid meet" }),
      svgElement("g", { class: "building-caption", "text-anchor": "middle" }),
      svgElement("text", { "text-anchor": "middle", class: "height-value" }));
      g.children[1].append(svgElement("text", { y: 680, class: "building-name" }, node.row.name),
        svgElement("text", { y: 710, class: "building-year" }, String(node.row.year)),
        svgElement("text", { y: 737, class: "building-city" }, node.row.city));
      return g;
    },
    update(g, node) {
      setSvgAttributes(g, { transform: `translate(${node.x} 0)`, opacity: clamp01(node.reveal * 6), display: node.reveal > 0 ? null : "none" });
      setSvgAttributes(g.children[0], { x: -node.width / 2, y: node.imageY, width: node.width, height: node.imageHeight,
        opacity: .7 + .3 * node.focus });
      setSvgAttributes(clips.get(node.id), { x: -node.width / 2 - 1, y: node.clipY, width: node.width + 2, height: node.clipHeight });
      setSvgAttributes(g.children[1], { opacity: clamp01(node.reveal * 2) });
      setSvgAttributes(g.children[1].children[1], { fill: node.focus > .5 ? "var(--accent)" : "var(--muted)" });
      setSvgAttributes(g.children[2], { y: node.roof - 22, opacity: node.readoutOpacity,
        fill: node.focus > .5 ? "var(--accent)" : "var(--ink)" });
      g.children[2].textContent = model.number(node.row.height) + " " + model.unit;
    },
  });
  const readingWidths = new Map();
  const readings = createSvgLayer(svg, {
    create() { const g = svgElement("g", { class: "comparison-reading" }); g.append(svgElement("rect", { rx: 3 }), svgElement("text")); return g; },
    update(g, note) {
      const isThreshold = note.kind === "threshold", x = isThreshold ? plot.left + 15 : note.small ? note.x : note.x - 13;
      const y = isThreshold ? note.y - 18 : note.y, anchor = isThreshold ? "start" : note.small ? "middle" : "end";
      const label = isThreshold ? model.number(note.value) + " " + model.unit : (note.value >= 0 ? "高 " : "低 ") + model.number(Math.abs(note.value)) + " " + model.unit;
      setSvgAttributes(g, { opacity: note.opacity });
      setSvgAttributes(g.children[1], { x, y, "text-anchor": anchor }); g.children[1].textContent = label;
      // 只在新读数出现时测量；动画帧复用宽度，底色避免引线穿字。
      if (!readingWidths.has(label)) readingWidths.set(label, g.children[1].getComputedTextLength());
      const width = readingWidths.get(label);
      setSvgAttributes(g.children[0], { x: x - (anchor === "end" ? width : anchor === "middle" ? width / 2 : 0) - 7,
        y: y - 24, width: width + 14, height: 33 });
    },
  });
  root.querySelectorAll("[data-height]").forEach(el => {
    const row = model.buildings.get(el.dataset.height); if (!row) throw new Error("Unknown height binding"); el.textContent = model.number(row.height);
  });
  root.querySelectorAll("[data-gap]").forEach(el => {
    const pair = model.stops.get(el.dataset.gap)?.pair; if (!pair) throw new Error("Unknown skyline comparison binding");
    el.textContent = model.number(Math.abs(model.buildings.get(pair[1]).height - model.buildings.get(pair[0]).height));
  });
  function render(pose, frame) {
    const notes = [...pose.annotations.values()].map(note => skylineComparison(model, pose, note));
    tickLayer.render(skylineTicks(model, pose));
    guides.render(notes); images.render(skylineGeometry(model, pose)); readings.render(notes);
    svg.dataset.state = pose.id; svg.dataset.moving = String(frame.moving);
    svg.dataset.scaleMax = String((plot.top - pose.scale.b) / pose.scale.k);
    if (!frame.moving) svg.setAttribute("aria-label", "共用地面和高度比例：" +
      skylineGeometry(model, pose).filter(node => node.reveal === 1).map(node => `${node.row.year} 年 ${node.row.name} ${model.number(node.row.height)} ${model.unit}`).join("；"));
  }
  const exit = reserveStageExit({ sticky: $(".skyline-stage"), readingEnd: $("[data-reading-end]"), spacer: $(".reading-tail"), releaseRatio: .4 });
  const stage = createStage({ element: svg, steps: [...root.querySelectorAll("[data-state]")].map(element => ({ element, id: element.dataset.state })),
    layout: id => skylinePose(id, model), blend: blendSkyline, render, duration, viewportRatio: .57 });
  document.fonts.ready.then(() => { readingWidths.clear(); stage.refresh(); });
  return { sample: stage.sample, dispose() { stage.dispose(); exit.dispose(); guides.dispose(); images.dispose(); readings.dispose(); tickLayer.dispose(); defs.remove(); axis.remove(); } };
}
