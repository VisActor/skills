import { at, lerp, linearScale, mixScale, radiusForArea } from "../runtime/geometry.mjs";
import { blendNodes, createPlayer } from "../runtime/motion.mjs";
import { distributionLayout, groupLayout, maskSlots, silhouetteLayout } from "../runtime/units.mjs";

/**
 * 同批记录的轮廓、分布、计数与权重重组；独立接线示例。
 * 用法：mountUnits(document.querySelector("#unit-example"))，返回 dispose()。
 * root 提供 #units（Canvas）与叠放的 #unit-axis（SVG，viewBox 0 0 860 460）、
 * #unit-summary / #unit-status / #unit-detail、#record-select、#group-filter、#unit-buttons。
 * 按钮 data-mode 为 cover / distribution / groups / weights；类别选项为 all / A / B / C。
 * unitPose 选择布局，blendUnits 保留 ID，renderUnits 绘制；详情回到真实记录。
 * 本例轮廓、数据、布局和颜色仅示范接线；字符串渲染只用于固定文本。
 */
export function mountUnits(root) {
  const $ = (selector) => root.querySelector(selector);
  const listeners = new AbortController();
  const listen = (target, type, handler) => target.addEventListener(type, handler, { signal: listeners.signal });
  const colors = { A: "#297c6c", B: "#be633c", C: "#7c74a8" };
  const projects = Array.from({ length: 60 }, (_, i) => ({
    id: "项目 " + String(i + 1).padStart(2, "0"),
    group: i < 30 ? "A" : i < 50 ? "B" : "C",
    weight: i < 30 ? 2 + i % 4 : i < 50 ? 10 + i % 6 : 28 + i % 10,
    value: 20 + ((i * 3 + Math.floor(i / 11)) % 7) * 10,
  }));
  const slots = maskSlots(35, 25, (x, y) => {
    const distance = Math.abs(x - 0.5);
    return distance > 0.03 && distance < 0.43 && y > 0.22 - distance * 0.3 && y < 0.88 - distance * 0.3;
  });
  let unitMode = "cover", filter = "all", currentUnits = null, unitMoving = false;
  const selectedProjects = () => projects.filter((row) => filter === "all" || row.group === filter);
  function unitPose(mode) {
    const rows = selectedProjects(), groups = filter === "all" ? ["A", "B", "C"] : [filter];
    let nodes, scale = linearScale([0, 100], [65, 825]);
    if (mode === "cover") nodes = silhouetteLayout(rows, slots, { x: 185, y: 20, width: 475, height: 400 });
    else if (mode === "distribution") {
      const distribution = distributionLayout(rows, groups, { width: 860, height: 460 });
      nodes = distribution.nodes; scale = distribution.scale;
    } else nodes = groupLayout(rows, groups, { width: 860, height: 460, weighted: mode === "weights" });
    return { mode, groups, nodes, scale, rows, axisOpacity: mode === "distribution" ? 1 : 0 };
  }
  function blendUnits(a, b, t) {
    // Artistic release is used only across the cover boundary and vanishes at endpoints.
    // A redirect snapshots any offset already present; ordinary data transitions stay direct.
    const nodes = blendNodes(a.nodes, b.nodes, t);
    const arc = a.mode === "cover" || b.mode === "cover" ? Math.sin(Math.PI * t) * 22 : 0;
    if (t > 0 && t < 1 && arc) for (const [id, node] of nodes) {
      const index = Number(id.slice(-2));
      node.x += Math.cos(index * 2.39) * arc;
      node.y += Math.sin(index * 2.39) * arc;
    }
    return { ...b, nodes, scale: mixScale(a.scale, b.scale, t), axisOpacity: lerp(a.axisOpacity, b.axisOpacity, t) };
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
      for (let value = 0; value <= 100; value += 20) {
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
        return group + "：" + (pose.mode === "weights" ? members.reduce((sum, row) => sum + row.weight, 0) + " 小时" : members.length + " 项");
      }).join("；");
      $("#unit-summary").textContent = pose.mode === "cover"
        ? pose.rows.length + " 项模拟记录组成书页轮廓；轮廓位置不表示数据。"
        : pose.mode === "weights" ? "圆面积 = 服务时长 × 5 像素²/小时。共 " + total + " 小时。" + breakdown
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
