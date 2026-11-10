import { at, lerp, linearScale, mixScale, visibleDomain } from "../../runtime/geometry.mjs";
import { createPlayer } from "../../runtime/motion.mjs";

// 改写入口：观测、揭示端点与聚焦范围；纵轴域和刻度一起调整。
export const historyWindowExample = {
  rows: [24, 29, 27, 40, 46, 44, 61].map((value, i) => ({ id: "observation-" + i, time: 2012 + i * 2, value })),
  early: 2016, focus: [2018, 2024], yDomain: [0, 70], yTicks: [0, 20, 40, 60],
};

/**
 * 历史显露 → 完整轨迹 → 局部聚焦；独立接线示例。
 * 用法：mountHistory(document.querySelector("#history-example"))，返回 dispose()。
 * root 提供 #history（viewBox 0 0 860 490）、#history-summary、#history-buttons；
 * 按钮的 data-mode 为 early / all / focus。
 * historyPose 计算当前范围，blendHistory 同步尺度，renderHistory 从当帧尺度反解定位窗。
 * historyWindowExample 换数据与范围；historyPose 的 contextOpacity 决定是否需要定位图。
 * 固定示例可连线；缺测应先断开，不把缺测跨过去画成已有轨迹。
 * 字符串渲染只用于本例固定文本；外部标签用 textContent 或安全属性。
 */
export function mountHistory(root) {
  const $ = (selector) => root.querySelector(selector);
  const listeners = new AbortController();
  const listen = (target, type, handler) => target.addEventListener(type, handler, { signal: listeners.signal });
  // History specimen: a reveal boundary, a changing viewing range and an optional locator.
  // These states are independent targets, not a required narrative sequence.
  const { rows: historyRows, early, focus, yDomain, yTicks } = historyWindowExample;
  const extent = [historyRows[0].time, historyRows.at(-1).time];
  const historyRange = [85, 805], historyY = linearScale(yDomain, [302, 35]);
  const historyGlobal = linearScale(extent, historyRange);
  $("[data-mode='early']").textContent = "显示到 " + early;
  $("[data-mode='focus']").textContent = "聚焦 " + focus.join("—");
  function historyPose(mode) {
    return {
      mode, through: mode === "early" ? early : extent[1],
      scale: mode === "focus" ? linearScale(focus, historyRange) : historyGlobal,
      contextOpacity: mode === "focus" ? 1 : 0,
    };
  }
  function blendHistory(a, b, t) {
    return { ...b, through: lerp(a.through, b.through, t), scale: mixScale(a.scale, b.scale, t),
      contextOpacity: lerp(a.contextOpacity, b.contextOpacity, t) };
  }
  const historyPath = (xScale, yScale) => historyRows.map((row, i) =>
    (i ? "L" : "M") + at(xScale, row.time) + "," + at(yScale, row.value)).join(" ");
  function renderHistory(pose, frame) {
    const right = Math.min(805, Math.max(85, at(pose.scale, pose.through)));
    const parts = ['<defs><clipPath id="history-reveal"><rect x="85" y="20" width="' +
      (right - 85) + '" height="297"/></clipPath></defs>',
    '<text x="85" y="20" fill="#61716a">模拟测量值</text>'];
    for (const value of yTicks) {
      const y = at(historyY, value);
      parts.push('<line x1="85" x2="805" y1="' + y + '" y2="' + y +
        '" stroke="#dce3d7"/><text x="69" y="' + (y + 5) + '" text-anchor="end">' + value + "</text>");
    }
    for (const row of historyRows) {
      const x = at(pose.scale, row.time);
      if (x >= 84.9 && x <= 805.1) parts.push('<text x="' + x +
        '" y="336" text-anchor="middle" fill="#61716a">' + row.time + "</text>");
    }
    parts.push('<g clip-path="url(#history-reveal)"><path data-history-path d="' +
      historyPath(pose.scale, historyY) + '" fill="none" stroke="#297c6c" stroke-width="3"/></g>');
    // The moving boundary is only a reveal device, never a new yearly observation.
    const visibleRows = historyRows.filter((row) => row.time <= pose.through);
    const latest = visibleRows.at(-1);
    for (const row of visibleRows) {
      const x = at(pose.scale, row.time), y = at(historyY, row.value);
      if (x < 84.9 || x > 805.1) continue;
      parts.push('<circle data-observation="' + row.id + '" cx="' + x + '" cy="' + y +
        '" r="' + (row === latest ? 6 : 4) + '" fill="' + (row === latest ? "#be633c" : "#297c6c") + '"/>');
      if (!frame.moving && row === latest) parts.push('<text x="' + (x - 12) +
        '" y="' + (y - 14) + '" text-anchor="end">' + row.time + " · " + row.value + "</text>");
    }
    if (pose.contextOpacity > 0) {
      const miniY = linearScale(yDomain, [440, 394]);
      const [lo, hi] = visibleDomain(pose.scale, historyRange);
      const x = at(historyGlobal, lo), width = at(historyGlobal, hi) - x;
      const miniRight = at(historyGlobal, pose.through);
      parts.push('<defs><clipPath id="history-context-reveal"><rect x="85" y="390" width="' +
        (miniRight - 85) + '" height="56"/></clipPath></defs><g opacity="' + pose.contextOpacity +
        '"><text x="85" y="381" fill="#61716a">完整轨迹中的当前位置</text><g clip-path="url(#history-context-reveal)">' +
        '<path d="' + historyPath(historyGlobal, miniY) + '" fill="none" stroke="#8b9b91" stroke-width="2"/>' +
        '</g><rect data-locator x="' + x + '" y="390" width="' + width +
        '" height="56" fill="#be633c" fill-opacity=".08" stroke="#be633c"/>' +
        '<text x="85" y="470" fill="#61716a">' + extent[0] + '</text><text x="805" y="470" text-anchor="end" fill="#61716a">' + extent[1] + '</text></g>');
    }
    $("#history").innerHTML = parts.join("");
    $("#history-summary").textContent = frame.moving ? "沿已有轨迹接续；缩放过程中，轴与定位窗口使用同一帧的尺度。"
      : pose.mode === "early" ? "已显示到 " + early + " 年：旧记录和当前观测同时保留。"
        : pose.mode === "focus" ? "主图读 " + focus.join("—") + "；下方只定位这段在完整轨迹中的位置。"
          : extent.join("—") + " 的观测全部保留，先前起伏仍可与后续比较。";
  }
  const hPlayer = createPlayer(historyPose("early"), { blend: blendHistory, render: renderHistory, duration: 1100 });
  function historyGo(mode, options) {
    $("#history-buttons").querySelectorAll("button").forEach((button) =>
      button.setAttribute("aria-pressed", String(button.dataset.mode === mode)));
    hPlayer.goTo(historyPose(mode), options);
  }
  listen($("#history-buttons"), "click", (event) => {
    if (event.target.dataset.mode) historyGo(event.target.dataset.mode);
  });

  historyGo("early", { immediate: true });
  return { dispose() {
    listeners.abort();
    hPlayer.dispose();
  } };
}
