import { at, lerp, linearScale, mixScale, radiusForArea } from "../../runtime/geometry.mjs";
import { blendNodes, createPlayer } from "../../runtime/motion.mjs";
import { distributionLayout, groupLayout, maskSlots, silhouetteLayout } from "../../runtime/units.mjs";

// 改写入口：记录、类别颜色、量值域与面积标定；类别变化时同步 HTML 图例和筛选项。
export const unitExample = {
  rows: Array.from({ length: 60 }, (_, i) => ({
    id: "项目 " + String(i + 1).padStart(2, "0"),
    group: i < 30 ? "A" : i < 50 ? "B" : "C",
    weight: i < 30 ? 2 + i % 4 : i < 50 ? 10 + i % 6 : 28 + i % 10,
    value: 20 + ((i * 3 + Math.floor(i / 11)) % 7) * 10,
  })),
  colors: { A: "#297c6c", B: "#be633c", C: "#7c74a8" },
  domain: [0, 100], countArea: 64, areaPerUnit: 5,
};

// 轮廓边界可加少量散开运动；数据布局之间直接对应，面积仍只由权重决定。
export function blendUnits(a, b, t) {
  if (t <= 0) return a;
  if (t >= 1) return b;
  const nodes = blendNodes(a.nodes, b.nodes, t);
  const arc = a.mode === "cover" || b.mode === "cover" ? Math.sin(Math.PI * t) * 22 : 0;
  if (t > 0 && t < 1 && arc) for (const [id, node] of nodes) {
    // 任意稳定字符串 ID 都能得到固定方向，不依赖编号格式或当前筛选后的序号。
    let hash = 0;
    for (const char of id) hash = (Math.imul(hash, 31) + char.codePointAt(0)) >>> 0;
    const angle = (hash % 360) * Math.PI / 180;
    node.x += Math.cos(angle) * arc;
    node.y += Math.sin(angle) * arc;
  }
  return { ...b, nodes, scale: mixScale(a.scale, b.scale, t), axisOpacity: lerp(a.axisOpacity, b.axisOpacity, t) };
}

/**
 * 同批记录的轮廓、分布、计数与权重重组；独立接线示例。
 * 用法：mountUnits(document.querySelector("#unit-example"))，返回 dispose()。
 * root 提供 #units（Canvas）与叠放的 #unit-axis（SVG，viewBox 0 0 860 460）、
 * #unit-summary / #unit-status / #unit-detail、#record-select、#group-filter、#unit-buttons。
 * 按钮 data-mode 为 cover / distribution / groups / weights；类别选项为 all / A / B / C。
 * 先改 unitExample；unitPose 选布局，blendUnits 保留 ID，renderUnits 绘制。
 * slots 改主题轮廓；value/weight 的单位文字在 renderUnits 和 updateDetail，按题材改写。
 * 本例轮廓、数据、布局和颜色仅示范接线；字符串渲染只用于固定文本。
 */
export function mountUnits(root, config = unitExample) {
  const $ = (selector) => root.querySelector(selector);
  const listeners = new AbortController();
  const listen = (target, type, handler) => target.addEventListener(type, handler, { signal: listeners.signal });
  const { rows: projects, colors, domain, countArea, areaPerUnit } = config;
  const areaScaleNote = $("[data-unit-area-scale]");
  if (areaScaleNote) areaScaleNote.textContent = "圆面积 = 服务时长 × " + areaPerUnit + " 像素²/小时。";
  const allGroups = Object.keys(colors);
  const slots = maskSlots(35, 25, (x, y) => {
    const distance = Math.abs(x - 0.5);
    return distance > 0.03 && distance < 0.43 && y > 0.22 - distance * 0.3 && y < 0.88 - distance * 0.3;
  });
  let unitMode = "cover", filter = "all", currentUnits = null, unitMoving = false;
  const selectedProjects = () => projects.filter((row) => filter === "all" || row.group === filter);
  function unitPose(mode) {
    const rows = selectedProjects(), groups = filter === "all" ? allGroups : [filter];
    let nodes, scale = linearScale(domain, [65, 825]);
    if (mode === "cover") nodes = silhouetteLayout(rows, slots, { x: 185, y: 20, width: 475, height: 400, countArea });
    else if (mode === "distribution") {
      const distribution = distributionLayout(rows, groups, { width: 860, height: 460, domain, countArea });
      nodes = distribution.nodes; scale = distribution.scale;
    } else nodes = groupLayout(rows, groups, { width: 860, height: 460, weighted: mode === "weights", countArea, areaPerUnit });
    return { mode, groups, nodes, scale, rows, axisOpacity: mode === "distribution" ? 1 : 0 };
  }
  const canvas = $("#units"), context = canvas.getContext("2d");
  function fitCanvas() {
    const dpr = devicePixelRatio || 1;
    canvas.width = Math.round(860 * dpr);
    canvas.height = Math.round(460 * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  fitCanvas();
  function renderUnits(pose, frame) {
    currentUnits = pose;
    unitMoving = frame.moving;
    root.toggleAttribute("data-unit-moving", frame.moving);
    context.clearRect(0, 0, 860, 460);
    for (const node of pose.nodes.values()) {
      context.globalAlpha = node.opacity;
      context.fillStyle = colors[node.row.group];
      context.beginPath();
      context.arc(node.x, node.y, radiusForArea(node.area), 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
    const parts = [];
    if (pose.mode !== "cover" && !frame.moving) {
      pose.groups.forEach((group, index) => {
        const lane = (460 - 100) / pose.groups.length;
        const y = pose.mode === "distribution" ? 45 + (index + 1) * lane : 62 + index * lane;
        parts.push('<text x="26" y="' + y + '" fill="' + colors[group] + '">' + group + "</text>");
      });
    }
    if (pose.axisOpacity) {
      parts.push('<g opacity="' + pose.axisOpacity + '">');
      for (let i = 0; i <= 5; i++) {
        const value = lerp(domain[0], domain[1], i / 5);
        const x = at(pose.scale, value);
        parts.push('<text x="' + x + '" y="432" text-anchor="middle" fill="#61716a">' + value + "</text>");
      }
      parts.push('<text x="825" y="453" text-anchor="end" fill="#61716a">测量值 / 模拟单位</text></g>');
    }
    $("#unit-axis").innerHTML = parts.join("");
    $("#unit-status").textContent = frame.moving ? "连接进行中" : "完整阅读状态";
    if (!frame.moving) {
      const total = pose.rows.reduce((sum, row) => sum + row.weight, 0);
      const breakdown = pose.groups.map((group) => {
        const members = pose.rows.filter((row) => row.group === group);
        return group + " 类：" + (pose.mode === "weights" ? members.reduce((sum, row) => sum + row.weight, 0) + " 小时" : members.length + " 项");
      }).join("；");
      $("#unit-summary").textContent = pose.mode === "cover"
        ? pose.rows.length + " 项模拟记录组成书页轮廓；轮廓位置不表示数据。"
        : pose.mode === "weights" ? (pose.groups.length === 1 ? breakdown : "共 " + total + " 小时。" + breakdown)
          : "每圆一项，颜色表示类别。" + breakdown;
    }
  }
  const uPlayer = createPlayer(unitPose(unitMode), { blend: blendUnits, render: renderUnits, duration: 850 });
  function unitGo(mode, options) {
    unitMode = mode;
    $("#unit-buttons").querySelectorAll("button").forEach((button) =>
      button.setAttribute("aria-pressed", String(button.dataset.mode === mode)));
    uPlayer.goTo(unitPose(mode), options);
  }
  function updateDetail() {
    const row = selectedProjects().find((item) => item.id === $("#record-select").value);
    $("#unit-detail").textContent = row ? row.id + " · " + row.group + " 类 · 测量值 " + row.value + " · 服务时长 " + row.weight + " 小时" : "当前没有项目。";
  }
  function updateRecordOptions() {
    const previous = $("#record-select").value;
    const rows = selectedProjects();
    $("#record-select").replaceChildren(...rows.map((row) => new Option(row.id, row.id)));
    if (rows.some((row) => row.id === previous)) $("#record-select").value = previous;
    updateDetail();
  }
  listen($("#unit-buttons"), "click", (event) => {
    if (event.target.dataset.mode) unitGo(event.target.dataset.mode);
  });
  listen($("#group-filter"), "change", (event) => {
    filter = event.target.value; updateRecordOptions(); unitGo(unitMode);
  });
  listen($("#record-select"), "change", updateDetail);
  listen(canvas, "click", (event) => {
    if (unitMoving) return;
    const bounds = canvas.getBoundingClientRect();
    const x = (event.clientX - bounds.left) * 860 / bounds.width;
    const y = (event.clientY - bounds.top) * 460 / bounds.height;
    const hit = [...currentUnits.nodes.values()].filter((node) => node.opacity > 0.9)
      .map((node) => ({ node, distance: Math.hypot(x - node.x, y - node.y) }))
      .sort((a, b) => a.distance - b.distance)[0];
    if (hit && hit.distance <= Math.max(10, radiusForArea(hit.node.area))) {
      $("#record-select").value = hit.node.id; updateDetail();
    }
  });
  listen(window, "resize", () => { fitCanvas(); const frame = uPlayer.sample(); renderUnits(frame.pose, frame); });

  updateRecordOptions();
  unitGo("cover", { immediate: true });
  return { dispose() {
    listeners.abort();
    uPlayer.dispose();
  } };
}
