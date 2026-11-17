import { categoricalExample } from "./data.mjs";
import { createCategoricalChange, blend, states } from "./model.mjs";
import { createSvgLayer, svgElement, setSvgAttributes as attr } from "../../runtime/svg.mjs";

export const example = {
  id: "categorical-change", title: "同一群人，回答变了", eyebrow: "模拟调查 · 两次回答，同一批人",
  theme: { paper: "#f2f3ed", ink: "#213b3a", muted: "#506962", accent: "#286b69", line: "#c9d3ca" },
  viewBox: "0 0 1200 520", duration: 1900,
  dataBadge: "模拟调查", dataCaption: "两次回答配对；不推断变化原因或中间经历。",
  states: [{ name: "初次回答" }, { name: "半年后" }],
  mount: mountCategorical,
};

export function mountCategorical(svg, { data = categoricalExample } = {}) {
  const model = createCategoricalChange(data), { readings, categories, attributes } = model;
  const byId = new Map(model.records.map(r => [r.id, r]));
  const category = id => categories.find(c => c.id === id).label;
  let current, selected = null;
  const background = svgElement("g"), legend = svgElement("g"), tracking = svgElement("g");
  svg.append(background, legend);
  const guideRows = categories.map((c, i) => {
    const row = svgElement("g");
    row.append(svgElement("text", { x: 24, class: "category-name" }, c.label),
      svgElement("text", { x: 24, y: 35, class: "category-count" }),
      svgElement("text", { x: 24, y: 67, class: "category-change" }),
      svgElement("line", { x1: 212, x2: 1134, y1: 95, y2: 95, stroke: "#c9d3ca" }));
    background.append(row); return row;
  });
  legend.append(svgElement("text", { x: 212, y: 22, class: "legend-label" }, "颜色 = " + data.attributeLabel));
  attributes.forEach((a, i) => {
    const x = 510 + i * 198;
    legend.append(svgElement("circle", { cx: x, cy: 16, r: 6, fill: a.color }),
      svgElement("text", { x: x + 15, y: 22, class: "legend-label" }, a.label));
  });
  const ring = svgElement("circle", { r: 20, fill: "none", stroke: "#213b3a", "stroke-width": 1.5 });
  const detail = svgElement("text", { x: 212, y: 508, class: "legend-label" });
  tracking.append(ring, detail);
  function track() {
    const node = current?.nodes.get(selected), row = byId.get(selected);
    attr(ring, { opacity: node ? 1 : 0, cx: node?.x ?? 0, cy: node?.y ?? 0 });
    detail.textContent = row ? `${attributes.find(a => a.id === row.attribute).label} · ${category(row.before)} → ${category(row.after)}`
      : current?.progress>.99?`描边：${readings.changed} 人换了回答；可点选查看前后。`:"一人形 = 一人；可点选一位，跟随两次回答。";
  }
  const people = createSvgLayer(svg, {
    create(node) {
      const row = byId.get(node.id), group = svgElement("g", { fill: row.fill, "data-record": node.id,"data-changed":row.before!==row.after, tabindex: 0, role: "button",
        "aria-label": `${attributes.find(a => a.id === row.attribute).label}，${category(row.before)}到${category(row.after)}` });
      group.append(svgElement("circle", { cy: -10, r: 3.5 }),
        svgElement("path", { d: "M-3.6,-4.5Q0,-6 3.6,-4.5L6,3.1Q6.4,4.9 4.3,5L3,1.4L3,10.5Q2.9,12.4 1.1,12.2L0,4.8L-1.1,12.2Q-2.9,12.4 -3,10.5L-3,1.4L-4.3,5Q-6.4,4.9 -6,3.1Z" }));
      const select = () => { selected = selected === row.id ? null : row.id; track(); };
      group.addEventListener("click", select);
      group.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); select(); } });
      return group;
    },
    update(group, n) { const row=byId.get(n.id);attr(group, { transform: `translate(${n.x} ${n.y}) scale(${n.scale})`,
      stroke:row.before!==row.after?"#173a37":"none","stroke-width":.65,"stroke-opacity":Math.max(0,(current.progress-.7)/.3) }); },
  });
  svg.append(tracking);
  return {
    model, pose: index => model.layout(states[index]), blend,
    read(index) {
      const first = readings.before[0], later = readings.after[0], last = categories.length - 1;
      return { name: data.periods[states[index]], title: index ? "人还是这些人，<br>回答已经变了。" : "再次询问，<br>他们还会这样回答吗？",
        description: index ? `${categories[0].label}从 ${first} 人变为 ${later} 人，${categories[last].label}从 ${readings.before[last]} 人变为 ${readings.after[last]} 人。总人数没变，但有 ${readings.changed} 人换了回答。`
          : `${readings.total} 人评价${data.subject ?? "同一问题"}，初次有 ${first} 人回答“${categories[0].label}”。${data.periods.after}，调查再次找到同一批人。`,
        highlights: index ? [`${later} 人`, `${readings.after[last]} 人`, `${readings.changed} 人`] : [`${readings.total} 人`, `${first} 人`], value: "", unit: "", metric: "" };
    },
    copyReady(index, pose) { return Math.abs(pose.progress - index) < .08; },
    render(pose) {
      current = pose; people.render(pose.nodes);
      guideRows.forEach((row, i) => {
        attr(row, { transform: `translate(0 ${pose.rows[i] - 35})` });
        const moving = pose.progress > .001 && pose.progress < .999, after = pose.progress >= .999;
        row.children[1].textContent = moving ? `${readings.before[i]} → ${readings.after[i]}` : `${(after ? readings.after : readings.before)[i]} 人`;
        const delta = readings.after[i] - readings.before[i];
        row.children[2].textContent = after ? `初次 ${readings.before[i]} · ${delta > 0 ? "+" : ""}${delta} 人` : "";
      });
      track();
    },
    dispose() { people.dispose(); background.remove(); legend.remove(); tracking.remove(); },
  };
}
