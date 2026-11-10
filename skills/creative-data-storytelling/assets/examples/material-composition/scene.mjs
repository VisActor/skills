import { keyed } from "../../runtime/geometry.mjs";
import { blendNodes, blendWithAnnotations } from "../../runtime/motion.mjs";
import { createStage } from "../../runtime/stage.mjs";
import { reserveStageExit } from "../../runtime/scroll.mjs";
import { createValueFormat } from "../../runtime/format.mjs";
import { createSvgLayer, svgElement, setSvgAttributes } from "../../runtime/svg.mjs";

/**
 * 一段有素材、组成编码与阅读节奏的完整装配参考，不是运行模块或整页模板。
 * 入口见同目录 index.html。独立取用时保留 runtime 的相对依赖。
 * 数据/图片：foodWaste；主题：HTML 的 CSS 变量；节奏：mount 的 duration 与正文间距。
 * 改 foodWaste 的分项与图片后，同步 materialPose 的 home 强调、半数参照及 HTML 的 data-home-share。
 * 三种场景的图片尺寸服务于识别，色带长度才表示占比；更换比较问题时一起改正文与参照。
 */
export const foodWaste = {
  year: 2022, totalBillionTonnes: 1.05,
  source: "https://www.unep.org/en/news-and-stories/press-release/world-squanders-over-1-billion-meals-day-un-report",
  rows: [
    { id: "home", label: "家庭", share: 60, image: "images/home.webp", imageAspect: 4 / 3, introX: 185, introWidth: 335, shareWidth: 405 },
    { id: "service", label: "餐饮服务", share: 28, image: "images/service.webp", imageAspect: 4 / 3, introX: 520, introWidth: 298, shareWidth: 234 },
    { id: "retail", label: "零售", share: 12, image: "images/retail.webp", imageAspect: 4 / 3, introX: 835, introWidth: 263, shareWidth: 158 },
  ],
};

export const shareScale = { x: 30, width: 940, y: 338, height: 28 };
const percent = createValueFormat({ unit: "%", separator: "", digits: 0 });

// Presentation geometry only. Source shares remain unchanged, including in connecting frames.
export function materialPose(mode, data = foodWaste) {
  if (!["places", "shares", "majority"].includes(mode)) throw new Error("Unknown material story state: " + mode);
  const rows = data.rows;
  if (rows.some((row) => !Number.isFinite(row.share) || row.share < 0) ||
      Math.abs(rows.reduce((sum, row) => sum + row.share, 0) - 100) > 1e-8)
    throw new Error("This composition needs nonnegative, disjoint shares with one denominator and a 100% total");
  const grouped = mode !== "places";
  let start = 0;
  const nodes = keyed(rows.map((row) => {
    const width = shareScale.width * row.share / 100;
    const x = shareScale.x + shareScale.width * start / 100;
    start += row.share;
    return {
      id: row.id, row,
      x: grouped ? x : row.introX, width: grouped ? width : 0,
      imageX: grouped ? x + width / 2 : row.introX,
      imageWidth: grouped ? row.shareWidth : row.introWidth,
      imageBottom: grouped ? 316 : 335,
      labelX: grouped ? x + width / 2 : row.introX,
      bandOpacity: grouped ? 1 : 0,
      imageOpacity: mode === "majority" && row.id !== "home" ? 0.55 : 1,
      opacity: 1,
    };
  }));
  const annotations = new Map();
  if (grouped) annotations.set("shares-of-total", { id: "shares-of-total", opacity: 1 });
  if (mode === "majority") annotations.set("half-of-total", { id: "half-of-total", opacity: 1 });
  return { mode, nodes, annotations };
}

export function blendMaterialPose(from, to, progress) {
  return blendWithAnnotations(from, to, progress, (a, b, t) => ({
    ...b, nodes: blendNodes(a.nodes, b.nodes, t, [
      "x", "width", "imageX", "imageWidth", "imageBottom", "labelX", "bandOpacity", "imageOpacity", "opacity",
    ]),
  }), { exitEnd: 0.13, enterStart: 0.82 });
}

export function mountMaterialStory(root, { data = foodWaste, duration = 1250 } = {}) {
  const $ = (selector) => root.querySelector(selector);
  const svg = $("#material-chart");
  const colors = getComputedStyle(root);
  const colorFor = (id) => colors.getPropertyValue("--" + id).trim();
  const byId = keyed(data.rows);
  const total = createValueFormat({ divisor: 0.1, digits: 1 });
  $("[data-total]").textContent = total.number(data.totalBillionTonnes);
  $("[data-home-share]").textContent = percent.format(byId.get("home").share);
  $("[data-other-share]").textContent = percent.format(100 - byId.get("home").share);
  const listeners = new AbortController();
  const imageLayer = createSvgLayer(svg, {
    attributes: { "data-layer": "scenes" },
    create(row) {
      return svgElement("image", { href: new URL(row.row.image, import.meta.url).href,
        preserveAspectRatio: "xMidYMax meet", "aria-hidden": "true" });
    },
    update(image, node) {
      const h = node.imageWidth / node.row.imageAspect;
      setSvgAttributes(image, { x: node.imageX - node.imageWidth / 2, y: node.imageBottom - h,
        width: node.imageWidth, height: h, opacity: node.imageOpacity });
    },
  });
  const bandLayer = createSvgLayer(svg, {
    attributes: { "data-layer": "shares" },
    create(row) { return svgElement("rect", { fill: colorFor(row.id), y: shareScale.y, height: shareScale.height }); },
    update(rect, node) { setSvgAttributes(rect, { x: node.x, width: node.width, opacity: node.bandOpacity }); },
  });
  const labels = createSvgLayer(svg, {
    create() {
      const g = svgElement("g", { "text-anchor": "middle" });
      g.append(svgElement("text", { y: 401, class: "category" }), svgElement("text", { y: 456, class: "value" }));
      return g;
    },
    update(g, node) {
      setSvgAttributes(g, { transform: `translate(${node.labelX} 0)` });
      g.children[0].textContent = node.row.label;
      const textColor = colors.getPropertyValue("--" + node.id + "-ink").trim() || colorFor(node.id);
      setSvgAttributes(g.children[1], { opacity: node.readoutOpacity, style: "fill:" + textColor });
      g.children[1].textContent = percent.format(node.row.share);
    },
  });
  const guide = svgElement("g", { "aria-hidden": "true", opacity: 0, "data-guide": "half" });
  const halfX = shareScale.x + shareScale.width / 2;
  guide.append(svgElement("line", { x1: halfX, x2: halfX, y1: shareScale.y, y2: shareScale.y + shareScale.height,
    stroke: colors.getPropertyValue("--paper").trim(), "stroke-width": 3 }),
  svgElement("line", { x1: halfX, x2: halfX, y1: 368, y2: 384, stroke: colorFor("home"), "stroke-width": 1.5 }),
  svgElement("text", { x: halfX, y: 408, "text-anchor": "middle", class: "half-label" }, "一半 · 50%"));
  svg.append(guide);
  const extent = svgElement("g", { "aria-hidden": "true", opacity: 0 });
  extent.append(svgElement("text", { x: shareScale.x, y: 500, class: "axis-note" }, "0"),
    svgElement("text", { x: shareScale.x + shareScale.width, y: 500, class: "axis-note", "text-anchor": "end" }, "全部 · 100%"));
  svg.append(extent);

  function render(pose, frame) {
    const readoutOpacity = pose.annotations.get("shares-of-total")?.opacity ?? 0;
    imageLayer.render(pose.nodes);
    bandLayer.render(pose.nodes);
    labels.render([...pose.nodes.values()].map((node) => ({ ...node, readoutOpacity })));
    setSvgAttributes(guide, { opacity: pose.annotations.get("half-of-total")?.opacity ?? 0 });
    setSvgAttributes(extent, { opacity: readoutOpacity });
    svg.dataset.state = pose.mode;
    svg.dataset.moving = String(frame.moving);
    if (!frame.moving) {
      const description = pose.mode === "places"
        ? "三处场景，共同构成零售与消费环节的食物废弃物。"
        : data.rows.map((row) => row.label + "占 " + percent.format(row.share)).join("，") + "。";
      svg.setAttribute("aria-label", description);
      $("#chart-description").textContent = pose.mode === "places" ? description : "全球零售与消费环节 · 色带长度表示占比";
    }
  }
  const exit = reserveStageExit({ sticky: $(".stage-panel"), readingEnd: $("[data-reading-end]"),
    spacer: $(".reading-tail"), releaseRatio: 0.4 });
  const stage = createStage({ element: svg,
    steps: [...root.querySelectorAll("[data-story-state]")].map((element) => ({ element, id: element.dataset.storyState })),
    layout: (id) => materialPose(id, data), blend: blendMaterialPose, render, duration, viewportRatio: 0.59,
  });
  // Navigation stays ordinary document scrolling; it does not become a second animation controller.
  root.querySelectorAll(".continue").forEach((link) => link.addEventListener("click", (event) => {
    event.preventDefault();
    const destination = root.querySelector(link.getAttribute("href"));
    destination.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", link.getAttribute("href"));
  }, { signal: listeners.signal }));
  document.fonts.ready.then(() => stage.refresh());
  return { sample: stage.sample, dispose() {
    listeners.abort(); stage.dispose(); exit.dispose();
    imageLayer.dispose(); bandLayer.dispose(); labels.dispose(); guide.remove(); extent.remove();
  } };
}
