import { at, keyed, linearScale, mixScale } from "../../runtime/geometry.mjs";
import { blendNodes, blendWithAnnotations, createPlayer } from "../../runtime/motion.mjs";
import { createValueFormat } from "../../runtime/format.mjs";
import { createSvgLayer, setSvgAttributes, svgElement } from "../../runtime/svg.mjs";

// 改写入口：记录、比较对象与两个视域。images/ 与 HTML 的 data-object-image 使用同一 ID。
export const identityExample = {
  rows: [
    { id: "glass", name: "玻璃杯", value: 24, color: "#297c6c" },
    { id: "mug", name: "陶瓷杯", value: 42, color: "#be633c" },
    { id: "travel", name: "随行杯", value: 68, color: "#527267" },
  ],
  selected: ["glass", "travel"], domains: { all: [0, 90], pair: [20, 75] },
  ticks: Array.from({ length: 10 }, (_, i) => i * 10), unit: "元",
};

/**
 * 同一对象姿态同时驱动 HTML 图片与 SVG 证据；独立接线示例。
 * 用法：mountIdentity(root, config = identityExample)，返回 dispose()。
 * root 提供 #identity（viewBox 0 0 860 430）、#identity-summary、#identity-buttons；
 * 按钮 data-mode 为 all / pair，图片 data-object-image 对应 config.rows 中的 ID。
 * HTML 图片层与 SVG 共用无内边距的比例容器；图片绝对定位并使用 translate(-50%, -100%)。
 * identityPose / blendIdentity / renderIdentity 展示共同锚点，图片本身不编码价格。
 * 改 identityExample 的数据/范围、identityPose 的图片偏移与大小、HTML 的素材和正文。
 * 异容器或裁切时需换算坐标；普通配图无需进入共同姿态。
 */
export function mountIdentity(root, config = identityExample) {
  const $ = (selector) => root.querySelector(selector);
  const listeners = new AbortController();
  const listen = (target, type, handler) => target.addEventListener(type, handler, { signal: listeners.signal });
  const { rows: identityRows, selected, domains, ticks, unit } = config;
  const identitySize = { width: 860, height: 430 };
  const identityFormat = createValueFormat({ unit, digits: 0 });
  const identitySvg = $("#identity");
  const identityImages = new Map([...root.querySelectorAll("[data-object-image]")]
    .map((image) => [image.dataset.objectImage, image]));
  if (selected.length !== 2 || new Set(selected).size !== 2 ||
      selected.some((id) => !identityRows.some((row) => row.id === id)) ||
      identityRows.some((row) => !identityImages.has(row.id)))
    throw new Error("Identity example needs two existing selected IDs and an HTML image for every record");
  function identityPose(mode) {
    const pair = mode === "pair";
    const rows = pair ? selected.map((id) => identityRows.find((row) => row.id === id)) : identityRows;
    return {
      mode, scale: linearScale(domains[mode], [100, 760]),
      nodes: keyed(rows.map((row) => ({ id: row.id, row, y: pair ? 222 : 280,
        imageWidth: 112, imageGap: 18, opacity: 1 }))),
      annotations: pair ? keyed([{ id: selected.join("/"), ids: rows.map((row) => row.id),
        value: Math.abs(rows[1].value - rows[0].value), opacity: 1 }]) : new Map(),
    };
  }
  function blendIdentity(a, b, t) {
    return blendWithAnnotations(a, b, t, (from, to, progress) => ({
      ...to, scale: mixScale(from.scale, to.scale, progress),
      nodes: blendNodes(from.nodes, to.nodes, progress, ["y", "imageWidth", "imageGap", "opacity"]),
    }));
  }
  const identityTicks = createSvgLayer(identitySvg, {
    create() {
      const node = svgElement("g");
      node.append(svgElement("line", { y1: 382, y2: 388, stroke: "#a4b4aa" }),
        svgElement("text", { y: 411, "text-anchor": "middle", fill: "#61716a" }));
      return node;
    },
    update(node, row) {
      setSvgAttributes(node.children[0], { x1: row.x, x2: row.x });
      setSvgAttributes(node.children[1], { x: row.x });
      node.children[1].textContent = identityFormat.number(row.value);
    },
  });
  identitySvg.append(svgElement("line", { x1: 100, x2: 760, y1: 382, y2: 382, stroke: "#a4b4aa" }),
    svgElement("text", { x: 40, y: 32, fill: "#61716a" }, "模拟价格 / " + identityFormat.unit));
  const identityMarks = createSvgLayer(identitySvg, {
    create(row) {
      const node = svgElement("g", { "data-object": row.id });
      node.append(svgElement("line", { y2: 382, stroke: "#d7dfd7", "stroke-dasharray": "2 5" }),
        svgElement("circle", { r: 6 }),
        svgElement("text", { "text-anchor": "middle" }),
        svgElement("text", { "text-anchor": "middle", fill: "#61716a" }));
      return node;
    },
    update(node, item) {
      setSvgAttributes(node, { opacity: item.opacity });
      setSvgAttributes(node.children[0], { x1: item.x, x2: item.x, y1: item.y + 55 });
      setSvgAttributes(node.children[1], { cx: item.x, cy: item.y, fill: item.row.color });
      setSvgAttributes(node.children[2], { x: item.x, y: item.y + 24 });
      setSvgAttributes(node.children[3], { x: item.x, y: item.y + 45 });
      node.children[2].textContent = item.row.name;
      node.children[3].textContent = identityFormat.format(item.row.value);
    },
  });
  const identityAnnotations = createSvgLayer(identitySvg, {
    create() {
      const node = svgElement("g");
      node.append(svgElement("path", { fill: "none", stroke: "#9c4327", "stroke-width": 2 }),
        svgElement("text", { y: 348, "text-anchor": "middle", fill: "#9c4327" }));
      return node;
    },
    update(node, item) {
      setSvgAttributes(node, { opacity: item.opacity });
      setSvgAttributes(node.children[0], { d: `M${item.left} 306v16H${item.right}v-16` });
      setSvgAttributes(node.children[1], { x: (item.left + item.right) / 2 });
      node.children[1].textContent = "相差 " + identityFormat.format(item.value);
    },
  });
  function renderIdentity(pose, frame) {
    const items = [...pose.nodes.values()].map((node) => ({ ...node, x: at(pose.scale, node.row.value) }));
    identityMarks.render(items);
    identityTicks.render(ticks
      .map((value) => ({ id: String(value), value, x: at(pose.scale, value) }))
      .filter((tick) => tick.x >= 100 && tick.x <= 760));
    for (const [id, image] of identityImages) image.hidden = !pose.nodes.has(id);
    for (const item of items) {
      // Both layers fill this unpadded surface at the SVG viewBox aspect ratio.
      // Percentages map the same viewBox anchor to HTML; no second animation clock.
      const image = identityImages.get(item.id);
      image.style.left = `${item.x / identitySize.width * 100}%`;
      image.style.top = `${(item.y - item.imageGap) / identitySize.height * 100}%`;
      image.style.width = `${item.imageWidth / identitySize.width * 100}%`;
      image.style.opacity = item.opacity;
    }
    identityAnnotations.render([...pose.annotations.values()].map((annotation) => ({ ...annotation,
      left: at(pose.scale, pose.nodes.get(annotation.ids[0]).row.value),
      right: at(pose.scale, pose.nodes.get(annotation.ids[1]).row.value),
    })));
    identitySvg.dataset.moving = String(frame.moving);
    if (!frame.moving) identitySvg.dataset.state = pose.mode;
    const comparison = [...pose.annotations.values()][0];
    $("#identity-summary").textContent = frame.moving
      ? "图片、名称与价格点使用同一帧的对象位置；停止操作后会自动到位。"
      : comparison ? comparison.ids.map((id) => {
        const row = pose.nodes.get(id).row;
        return row.name + " " + identityFormat.format(row.value);
      }).join("，") + "，相差 " + identityFormat.format(comparison.value) + "。观察范围缩小，两件样品的价格没有改变。"
        : "图片负责识别样品，横向位置表达模拟价格。可以快速切换或反向，观察各层是否仍然对应。";
  }
  const identityPlayer = createPlayer(identityPose("all"), { blend: blendIdentity, render: renderIdentity, duration: 1100 });
  listen($("#identity-buttons"), "click", (event) => {
    const mode = event.target.dataset.mode;
    if (!mode) return;
    $("#identity-buttons").querySelectorAll("button").forEach((button) =>
      button.setAttribute("aria-pressed", String(button.dataset.mode === mode)));
    identityPlayer.goTo(identityPose(mode));
  });

  identityPlayer.goTo(identityPose("all"), { immediate: true });
  return { dispose() {
    listeners.abort();
    [identityPlayer, identityTicks, identityMarks, identityAnnotations].forEach((controller) => controller.dispose());
  } };
}
