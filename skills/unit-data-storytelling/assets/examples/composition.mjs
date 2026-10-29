import { at, clamp01, radiusForArea } from "../mechanics/geometry.mjs";
import { createPlayer } from "../mechanics/motion.mjs";
import { createSvgLayer, imageBox, imageSlots, loadImages, setSvgAttributes, svgElement } from "../mechanics/svg.mjs";
import { samples, source, regions, makeView, blendView } from "./composition-model.mjs";

const stage = document.querySelector("#stage"), guides = document.querySelector("#guides");
const controls = Object.fromEntries(["layout", "glyph", "space"].map((id) => [id, document.getElementById(id)]));
const status = document.querySelector("#status"), details = document.querySelector("#details");
const colors = { phone: "#286d70", lamp: "#b75e3e" }, names = { phone: "手机", lamp: "台灯" };
const images = Object.fromEntries(Object.keys(names).map((kind) => [kind,
  new URL(`./images/${kind}.svg`, import.meta.url).href]));
const order = ["local", "whole", "groups", "compare", "duration", "focus"];
// Local editorial choices. The mechanisms do not know these questions or order.
const copy = {
  local: ["先认出几条记录。", "四个单元，分别对应四件设备。先认清对象，再展开这批样本。"],
  whole: ["把局部放回整批记录。", "四条局部记录只是其中的一部分。这里保留完整集合，便于再按属性重组。"],
  groups: ["分开两类，比较数量。", "同一批记录按类别重新排齐。格距相同，数量差异由排列显现。"],
  compare: ["把已排好的两组，放近一些。", "保留每组内部的间距与顺序，连同名称和数量一起移动。随后可以按使用月数展开组内记录。"],
  duration: ["数量之外，还能比较用了多久。", "把同一批记录放到使用月数轴上。类别继续保留，纵向堆叠只为避让。"],
  focus: ["把用满一年的设备，展开来看。", "同一批筛选结果，可以保留完整月数范围，也可以展开局部，让每个月之间的差异占据更多空间。"],
  shape: ["轮廓是造型，记录仍是记录。", "素材提供候选位置，每条记录占一个位置。可直接切回任意数据排列；位置本身没有量值含义。"],
};
let sample = "A", player, lastFrame, moving = false, slots, textAnimation;

function label(text, attributes) {
  const element = svgElement("text", attributes);
  element.textContent = text;
  return element;
}

const axes = svgElement("g"), ticks = [];
for (const [, bounds] of regions) {
  const baseline = bounds.y + bounds.height + 1;
  axes.appendChild(svgElement("path", { d: `M120 ${baseline}H910`, stroke: "#b5c3bb", fill: "none" }));
  for (let month = 0; month <= 24; month += 4) {
    const group = svgElement("g");
    group.append(svgElement("path", { d: `M0 ${baseline}v5`, stroke: "#b5c3bb" }),
      label(String(month), { x: 0, y: baseline + 22, "text-anchor": "middle" }));
    axes.append(group);
    ticks.push({ month, group });
  }
  axes.appendChild(label("使用月数", { x: 950, y: bounds.y - 15, "text-anchor": "end" }));
}
guides.appendChild(axes);
const threshold = svgElement("path", { stroke: "#a0b4b0", "stroke-dasharray": "3 5", fill: "none" });
const thresholdLabel = label("满一年 · 12个月", { "font-size": 12 });
guides.append(threshold, thresholdLabel);
const captionLayer = createSvgLayer(guides, {
  mount(group) { group.appendChild(label("", {})); },
  update(group, node) {
    group.firstElementChild.textContent = node.text;
    setSvgAttributes(group.firstElementChild, { class: node.role === "count" ? "count" : "category" });
  },
});
const annotation = svgElement("g", { "pointer-events": "none" });
const leader = svgElement("path", { stroke: "#516967", fill: "none" });
const annotationBox = svgElement("rect", { width: 154, height: 26, rx: 3, fill: "#f5f3ec", opacity: .96 });
const annotationText = label("", { "font-size": 13, fill: "#243c3e" });
annotation.append(leader, annotationBox, annotationText);
document.querySelector("#annotations").append(annotation);

const layer = createSvgLayer(document.querySelector("#units"), {
  mount(group, node) {
    const show = () => {
      if (moving) return;
      const record = source.get(node.id);
      details.textContent = `${record.id} · ${names[record.kind]} · 已使用 ${record.months} 个月。记录值来自合成源表，动画坐标不参与读数。`;
    };
    group.addEventListener("click", show);
    group.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); show(); }
    });
  },
  update(group, node, context) {
    const record = source.get(node.id), glyph = controls.glyph.value;
    if (group.dataset.glyph !== glyph) {
      group.replaceChildren(svgElement(glyph === "image" ? "image" : "circle"));
      group.dataset.glyph = glyph;
    }
    // Local view may enlarge symbols for recognition; within each state the
    // two categories share sizing. Images encode category, never numeric area.
    const factor = node.imageScale;
    setSvgAttributes(group.firstElementChild, glyph === "image"
      ? { ...imageBox(28.8 * factor, 36 * factor), href: images[record.kind] }
      : { r: radiusForArea(node.area), fill: colors[record.kind] });
    setSvgAttributes(group, { role: "button", tabindex: context.moving ? -1 : 0,
      "aria-label": `${record.id}，${names[record.kind]}，已使用 ${record.months} 个月` });
  },
});

function render(pose, frame) {
  lastFrame = { pose, frame };
  moving = frame.moving;
  stage.setAttribute("aria-busy", String(moving));
  layer.draw(pose.nodes, frame);
  captionLayer.draw(pose.guides);
  axes.setAttribute("opacity", pose.axisOpacity);
  for (const { month, group } of ticks) {
    const x = at(pose.scale, month);
    setSvgAttributes(group, { transform: `translate(${x} 0)`,
      opacity: clamp01((x - 100) / 20) * clamp01((930 - x) / 20) });
  }
  const thresholdX = at(pose.scale, 12);
  setSvgAttributes(threshold, { d: `M${thresholdX} 75V480`, opacity: pose.axisOpacity * .7 });
  setSvgAttributes(thresholdLabel, { x: thresholdX + 7, y: 16, opacity: pose.axisOpacity });

  // This source value stays true during movement. Its leader is attached to
  // the visible unit, not its future target or an interpolated fact.
  const record = samples[sample].find((row) => row.months >= 16 && row.months <= 20);
  const node = pose.nodes.get(record.id);
  annotation.setAttribute("opacity", node?.opacity ?? 0);
  if (node) {
    const x = Math.max(30, Math.min(810, node.x - 55));
    // Reserve a label strip above this study's numeric band. Interpolate its
    // placement with the encoding; do not cover another stacked image.
    const category = pose.guides.get(record.kind);
    const labelY = (1 - category.opacity) * Math.max(58, node.y - 52)
      + category.opacity * Math.max(12, category.y - 41);
    const y = (1 - pose.numeric) * labelY
      + pose.numeric * (regions.get(record.kind).y - 39);
    setSvgAttributes(leader, { d: `M${node.x} ${node.y - 9}L${node.x + 20} ${node.y - 30}L${node.x + 20} ${y + 26}` });
    setSvgAttributes(annotationBox, { x, y });
    setSvgAttributes(annotationText, { x: x + 8, y: y + 18 });
    annotationText.textContent = `${record.id} · ${record.months} 个月`;
  }
  if (!moving) {
    const selected = [...pose.nodes.keys()].map((id) => source.get(id));
    const counts = Object.keys(names).map((kind) => `${names[kind]} ${selected.filter((r) => r.kind === kind).length}`).join(" / ");
    status.textContent = `样本 ${sample} · 当前 ${selected.length} / 全部 ${samples[sample].length} 条 · ${counts}${pose.meta.view === "focus" ? " · 筛选：至少 12 个月" : ""}`;
  }
}

function showCopy(view) {
  textAnimation?.cancel();
  const panel = document.querySelector("#copy");
  panel.querySelector("h2").textContent = copy[view][0];
  panel.querySelector("p").textContent = copy[view][1];
  // Prose guides the change immediately. No stage-wide fade or wait-until-done.
  textAnimation = panel.animate([{ transform: "translateY(5px)" }, { transform: "translateY(0)" }],
    { duration: 240, easing: "ease-out" });
  controls.space.disabled = view !== "focus";
  const explanation = document.querySelector("#design-note");
  explanation.textContent = view === "focus"
    ? controls.space.value === "expand"
      ? "局部展开：比较范围仍是满一年的同一批设备。两类同时使用 12—24 月尺度，月份之间的距离加倍，符号也留出辨识空间；12 月参照和记录标注一起移动。"
      : "保留全域：同一批满一年的设备继续放在 0—24 月轴上，便于记住它们在原样本中的位置，但左半段已空出。切换空间安排可比较这一取舍。"
    : view === "compare"
      ? "群组靠近：只改变两组的位置，组内相对位置保持。名称、数量和记录标注随当前图形移动，不等动画结束再出现。切到使用月数，才按每条记录重新排列。"
      : view === "groups"
      ? "按类别重排：颜色与记录身份延续，两类沿不同方向展开再归位。类别名称随着分区形成；弧线与错峰只组织注意力，不表示设备的真实移动。"
      : "可任意切换目标或更替样本，观察对象与参照如何共同演进；局部构图提供同一筛选结果的两种空间安排。";
}

function update(replacement = false) {
  if (replacement) sample = sample === "A" ? "B" : "A";
  const view = controls.layout.value;
  const target = makeView(sample, view, { slots, space: controls.space.value });
  showCopy(view);
  status.textContent = replacement
    ? `正在更替为样本 ${sample} · 两批记录没有个体对应。`
    : `样本 ${sample} · 全部 ${samples[sample].length} 条记录${view === "focus"
      ? ` · 其中 ${target.nodes.size} 条已使用至少 12 个月` : " · 一枚单元始终对应一件设备"}`;
  details.textContent = "连接自动完成；可以中途反向或改目标。点选到位的单元查看原记录。";
  player.goTo(target, { duration: replacement ? 1500 : 1100 });
}

async function start() {
  const loaded = await loadImages(Object.values(images));
  slots = imageSlots(loaded.get(images.phone), { size: 160, step: 5, includeColor: true });
  // Dense mask points are decorative candidates, not additional data records.
  const preview = document.querySelector("#mask-preview");
  for (const point of slots) preview.appendChild(svgElement("circle", {
    cx: point.x * 160, cy: point.y * 160, r: 2,
    fill: `rgb(${point.rgba.slice(0, 3).join(" ")})`, opacity: point.rgba[3] / 255,
  }));
  document.querySelector("#mask-count").textContent = `${slots.length} 个候选位置；数据层仍只使用实际记录数。`;
  showCopy(controls.layout.value);
  player = createPlayer(makeView(sample, controls.layout.value, { slots, space: controls.space.value }),
    { blend: blendView, render });
  controls.layout.addEventListener("change", () => update());
  controls.space.addEventListener("change", () => update());
  controls.glyph.addEventListener("change", () => render(lastFrame.pose, lastFrame.frame));
  document.querySelector("#replace").addEventListener("click", () => update(true));
  for (const [id, direction] of [["previous", -1], ["next", 1]]) {
    document.getElementById(id).addEventListener("click", () => {
      const index = order.indexOf(controls.layout.value);
      controls.layout.value = order[(Math.max(0, index) + direction + order.length) % order.length];
      update();
    });
  }
  document.querySelector("#use-mask").addEventListener("click", () => {
    controls.layout.value = "shape"; update();
    stage.scrollIntoView({ block: "center" });
  });
  // A shared viewBox scales all layers together. Pixel layouts must recompute
  // targets and repaint on resize; refreshing a step observer is insufficient.
  window.addEventListener("pagehide", (event) => {
    if (!event.persisted) { player.dispose(); layer.dispose(); captionLayer.dispose(); textAnimation?.cancel(); }
  });
}

start().catch((error) => {
  const output = document.querySelector("#error");
  output.hidden = false;
  output.textContent = `示例无法启动：${error.message}`;
  console.error(error);
});
