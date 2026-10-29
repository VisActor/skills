import { at, radiusForArea } from "../mechanics/geometry.mjs";
import { createStage } from "../mechanics/stage.mjs";
import { createValueFormat } from "../mechanics/format.mjs";
import { createSvgLayer, setSvgAttributes, svgElement } from "../mechanics/svg.mjs";
import { samples, source, scale, regions, makePose, blendStudy } from "./composition-model.mjs";

// Local wiring choices: prose passages and graphic targets have separate ids.
// The first two passages observe the same pose; a later question changes it.
const states = {
  count: { sample: "A", organization: "groups",
    description: "格距相同，位置用于区分类别；每条记录保留自己的身份。" },
  duration: { sample: "A", organization: "duration",
    description: "横向位置对应真实月数；纵向堆叠只负责避让，同一个点仍是同一条记录。" },
  "other-sample": { sample: "B", organization: "duration",
    description: "类别与横轴保持可比，但这批记录与上一批没有个体对应。" },
};
const countFormat = createValueFormat({ digits: 0 });
function summaryFor(sample) {
  const rows = samples[sample];
  return `样本 ${sample}，${countFormat.number(rows.length)} 条记录：手机 ${countFormat.number(rows.filter((r) => r.kind === "phone").length)}，台灯 ${countFormat.number(rows.filter((r) => r.kind === "lamp").length)}。`;
}
const readings = {
  count: { title: "先看这批记录的数量。", paragraphs: [
    "一点是一条设备记录。先把手机与台灯分别排开，看两类各有多少条记录。",
    "两类使用相同格距，行列只负责排布；数量提供一个起点，接下来还可以观察每条记录中的使用月数。",
  ] },
  "count-question": { title: "数量更多，是否也用得更久？", paragraphs: [
    "手机记录多于台灯，这幅排列支持的是数量比较。点离起点的距离只是排布，不能据此判断设备用了多久。",
    "要回答使用时长，还得查看同批记录的月数。先记住两类数量；继续向下时，再把横向位置交给月数，重新观察这批点。",
  ] },
  duration: { title: "使用月数怎样分布？", paragraphs: [
    "沿用设备分类，把每条记录按使用月数重新排列。横向位置承担月数，纵向堆叠只负责避让。",
    "观察两类记录的范围与重叠。数量多，只说明样本里记录多，不能替代对使用时长的比较。",
  ] },
  "other-sample": { title: "换一批记录，沿用月数基准。", paragraphs: [
    "保留设备类别与月数轴，看看另一批样本是否也有相近的分布。先认准共同基准，再观察新记录怎样展开。",
    "两批样本并未追踪同一台设备。这里比较的是分布，运动路径不表示某台设备的经历。",
  ] },
};
const stage = document.querySelector("#reading-stage");
const chart = document.querySelector("#reading-chart");
const copy = document.querySelector("#state-copy");
const sampleCaption = document.querySelector("#sample-caption");
const names = { phone: "手机", lamp: "台灯" };
const colors = { phone: "#286d70", lamp: "#b75e3e" };
const cues = [...document.querySelectorAll("#reading-flow [data-story-state]")];
let active = cues[0].dataset.storyState;
let activeReading = cues[0].dataset.reading, lastReading = null, activeIndex = 0;
let direction = 1, replacingSamples = [];
const textAnimations = new Set();

function cancelTextAnimations() {
  for (const animation of textAnimations) animation.cancel();
  textAnimations.clear();
  copy.querySelectorAll(".outgoing").forEach((panel) => panel.remove());
}

// The prose explains the question and operation, so it can arrive while units
// are moving. Only the sample-dependent readout below waits for its evidence.
function showReading() {
  if (lastReading === activeReading) return;
  const initial = lastReading === null;
  lastReading = activeReading;
  cancelTextAnimations();
  const previous = copy.querySelector(".current");
  if (previous) {
    previous.className = "caption-panel outgoing";
    previous.setAttribute("aria-hidden", "true");
    previous.querySelector("h2").removeAttribute("id");
  }
  const panel = document.createElement("div");
  panel.className = "caption-panel current";
  panel.dataset.reading = activeReading;
  const title = document.createElement("h2");
  title.id = "state-title";
  title.textContent = readings[activeReading].title;
  panel.append(title);
  for (const text of readings[activeReading].paragraphs) {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    panel.append(paragraph);
  }
  copy.append(panel);
  if (initial) { previous?.remove(); return; }

  // A local text handoff, overlapping the longer graphic change. This duration
  // and short displacement belong to this study, not a global motion preset.
  const animate = (element, frames, onFinish) => {
    const animation = element.animate(frames, { duration: 320, easing: "ease-out" });
    textAnimations.add(animation);
    animation.finished.then(() => {
      textAnimations.delete(animation);
      onFinish?.();
    }, (error) => {
      textAnimations.delete(animation);
      if (error.name !== "AbortError") console.error("Text handoff failed", error);
    });
  };
  if (previous) animate(previous, [
    { opacity: 1, transform: "translateY(0)" },
    { opacity: 0, transform: `translateY(${-direction * 12}px)` },
  ], () => previous.remove());
  animate(panel, [
    { opacity: 0, transform: `translateY(${direction * 12}px)` },
    { opacity: 1, transform: "translateY(0)" },
  ]);
}

function label(text, attrs) {
  const element = svgElement("text", attrs);
  element.textContent = text;
  return element;
}

const axes = svgElement("g");
const guides = document.querySelector("#reading-guides");
for (const [kind, bounds] of regions) {
  // Headers stay in their own band's top area, clear of the previous axis ticks.
  const headerY = bounds.y + 12;
  guides.appendChild(label(names[kind], { x: bounds.x, y: headerY,
    "text-anchor": "end", class: "category" }));
  const baseline = bounds.y + bounds.height + 1;
  axes.appendChild(svgElement("path", { d: `M${at(scale, 0)} ${baseline}H${at(scale, 24)}`,
    stroke: "#b5c3bb", fill: "none" }));
  for (let month = 0; month <= 24; month += 4) {
    const x = at(scale, month);
    axes.appendChild(label(countFormat.number(month), { x, y: baseline + 26, "text-anchor": "middle", class: "axis-value" }));
  }
  axes.appendChild(label("使用月数", { x: 950, y: headerY, "text-anchor": "end" }));
}
guides.appendChild(axes);

const layer = createSvgLayer(document.querySelector("#reading-units"), {
  mount(group) { group.appendChild(svgElement("circle")); },
  update(group, node) {
    setSvgAttributes(group.firstElementChild, {
      r: radiusForArea(node.area), fill: colors[source.get(node.id).kind],
    });
  },
});

function poseFor(id) {
  const state = states[id];
  return makePose(state.sample, state.organization);
}

function showSampleSummary(frame) {
  // Only this readout depends on the incoming collection being complete.
  // Reordering the same sample preserves its valid count throughout motion.
  const sample = states[active].sample;
  const replacing = frame.moving && replacingSamples.length > 0;
  const summary = replacing
    ? `样本 ${replacingSamples.join("、")} → 样本 ${sample} · 两批记录独立`
    : summaryFor(sample);
  if (sampleCaption.textContent !== summary) sampleCaption.textContent = summary;
  return summary;
}

function render(pose, frame) {
  layer.draw(pose.nodes);
  // Category labels stay mounted. The month axis follows its encoding, not
  // moving: duration -> other-sample keeps it fully visible throughout.
  axes.setAttribute("opacity", pose.axisOpacity);
  showReading(); // The question/operation can guide the ongoing graphic change.
  const summary = showSampleSummary(frame);

  chart.setAttribute("aria-busy", String(frame.moving));
  stage.dataset.phase = frame.moving ? "connecting" : "settled";
  stage.dataset.target = active;
  stage.dataset.reading = activeReading;
  chart.setAttribute("aria-label", frame.moving
    ? `${summary} 按设备分类观察记录。`
    : `${summary}${states[active].description}`);
}

let controller;
try {
  // Duration is chosen for this small study, not a recommended story default.
  controller = createStage({
    element: chart,
    steps: cues.map((element) => ({ id: element.dataset.storyState, element })),
    // This study keeps a fixed viewBox. A pixel layout can use the supplied size.
    layout: poseFor, blend: blendStudy, render, duration: 900,
    onStep(index, { id, previousId, pose }) {
      direction = index >= activeIndex ? 1 : -1;
      activeIndex = index;
      activeReading = cues[index].dataset.reading;
      if (id !== previousId) {
        replacingSamples = [...new Set([...pose.nodes]
          .filter(([, node]) => node.opacity > .001)
          .map(([key]) => source.get(key).sample))]
          .filter((sample) => sample !== states[id].sample);
      }
      active = id;
    },
  });
  // Natural document flow owns exit; retain state for reverse reading.
  window.addEventListener("pagehide", (event) => {
    if (!event.persisted) { controller.dispose(); layer.dispose(); cancelTextAnimations(); }
  });
} catch (error) {
  controller?.dispose();
  layer.dispose();
  cancelTextAnimations();
  const output = document.querySelector("#error");
  output.hidden = false;
  output.textContent = `示例无法启动：${error.message}`;
  console.error(error);
}
