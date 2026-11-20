import { at, lerp, linearScale } from "../../runtime/geometry.mjs";
import { createPlayer } from "../../runtime/motion.mjs";
import { svgElement } from "../../runtime/svg.mjs";

// HKO station, June through August: the longest uninterrupted run with Tmin >= 28°C.
// Both runs lie in July. Endpoints are inclusive dates; a missing day breaks a run.
export const runs = [
  { year: 2022, first: 9, last: 29, color: "#97603a" },
  { year: 2024, first: 20, last: 26, color: "#28695a" },
];
const nights = (run) => run.last - run.first + 1;

/**
 * 改写 runs 的两条记录；本例 first/last 是同一个七月内的日号，含首尾两天。
 * 跨月时先改用完整日期/连续日偏移，再同步 x、日期标签与两套 makeAxis；不能直接混用日号。
 * mountSequence 的行距和轴位置服务于两行构图；缺测先拆段。对齐只平移，格宽与间隔保留。
 */
export function mountSequence(root) {
  const plot = root.querySelector("svg");
  const summary = root.querySelector("[aria-live]");
  const buttons = [...root.querySelectorAll("button[data-origin]")];
  const x = linearScale([1, 32], [144, 812]);
  const dayWidth = at(x, 2) - at(x, 1);
  const rows = runs.map((run, i) => {
    const y = 35 + i * 68;
    plot.append(
      svgElement("text", { x: 16, y: y + 13, fill: run.color, "font-weight": 650 }, run.year + " 年"),
      svgElement("text", { x: 16, y: y + 35, fill: "#53665e" }, "7 月 " + run.first + "–" + run.last + " 日"),
    );
    const strip = svgElement("g", { fill: run.color });
    for (let day = run.first; day <= run.last; day++) {
      const tile = svgElement("rect", { x: (day - run.first) * dayWidth + 1, y, width: dayWidth - 2, height: 31, rx: 2 });
      tile.append(svgElement("title", {}, run.year + " 年 7 月 " + day + " 日"));
      strip.append(tile);
    }
    plot.append(strip);
    return strip;
  });

  function makeAxis(label, ticks, format) {
    const axis = svgElement("g", { fill: "#53665e" });
    axis.append(svgElement("text", { x: 16, y: 183 }, label));
    axis.append(svgElement("line", { x1: at(x, 1), x2: at(x, 32), y1: 156, y2: 156, stroke: "#b6c1b7" }));
    for (const tick of ticks) {
      const center = at(x, tick) + dayWidth / 2;
      axis.append(svgElement("line", { x1: center, x2: center, y1: 156, y2: 161, stroke: "#819389" }));
      axis.append(svgElement("text", { x: center, y: 183, "text-anchor": "middle" }, format(tick)));
    }
    plot.append(axis);
    return axis;
  }
  const calendar = makeAxis("七月日期", [1, 5, 10, 15, 20, 25, 31], (n) => n + " 日");
  const elapsed = makeAxis("从第一夜起", [1, 7, 14, 21, 28], (n) => "第 " + n + " 夜");
  const [a, b] = runs;
  const readings = [
    "两段热夜的结束日期，在各自的七月只差 " + Math.abs(a.last - b.last) + " 天。",
    a.year + " 年持续 " + nights(a) + " 夜，" + b.year + " 年持续 " + nights(b)
      + " 夜，相差 " + Math.abs(nights(a) - nights(b)) + " 夜。",
  ];
  const player = createPlayer(0, {
    duration: 950,
    blend: lerp,
    render(progress, frame) {
      // Move each strip as one piece. Every date keeps its physical width and its original label.
      rows.forEach((strip, i) => {
        const left = lerp(at(x, runs[i].first), at(x, 1), progress);
        strip.setAttribute("transform", "translate(" + left + " 0)");
      });
      calendar.setAttribute("opacity", Math.max(0, 1 - 5 * progress));
      elapsed.setAttribute("opacity", Math.max(0, 5 * progress - 4));
      const reading = frame.moving ? "每一格始终代表同一夜。" : readings[progress];
      if (summary.textContent !== reading) summary.textContent = reading;
    },
  });
  const events = new AbortController();
  for (const button of buttons) {
    button.addEventListener("click", () => {
      if (button.getAttribute("aria-pressed") === "true") return;
      buttons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      player.goTo(button.dataset.origin === "onset" ? 1 : 0);
    }, { signal: events.signal });
  }
  player.goTo(0, { immediate: true });
  return { dispose() { events.abort(); player.dispose(); } };
}
