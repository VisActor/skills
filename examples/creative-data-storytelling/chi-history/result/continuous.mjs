import { clamp, lerp, smooth } from "./geometry.mjs";
import { continuityIds, continuityLayout } from "./continuity-layout.mjs";
import {
  introCount,
  labels,
  kinds,
  colors,
  scenes,
  historySources,
} from "./continuous-content.mjs";
import { introMarkup, meterMarkup } from "./continuous-details.mjs";
import {
  selectChapter,
  createReadingTransition,
} from "./continuous-motion.mjs";
import { setupExplorer } from "./continuous-explorer.mjs";
const lastChapter = scenes.length - 1;
const $ = (s) => document.querySelector(s);
const stage = $("#stage"),
  story = $("#scroll-story"),
  svg = $("#rulers"),
  dialog = $("#source-dialog");
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
let rows = [],
  allRows = [],
  sources,
  current = 0,
  visibleIds = [],
  previousFocus,
  raf = false,
  dimensions = { width: 0, height: 0 },
  motion,
  selected = -1,
  quietMotion = reduced.matches;
const nodes = new Map();
const escape = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const num = (v) => Number(v.toFixed(2)).toString();
function jumpTo(index) {
  selectTarget(index);
  window.scrollTo({
    top:
      story.offsetTop +
      ((story.offsetHeight - stage.offsetHeight) * index) / lastChapter,
    behavior: "instant",
  });
}
function renderCopy(index) {
  const s = scenes[index];
  if (stage.dataset.chapter !== String(index)) {
    current = index;
    stage.dataset.chapter = String(index);
    $("#eyebrow").textContent = s.tag;
    $("#headline").innerHTML = s.title;
    $("#description").innerHTML = s.copy;
    $("#next").innerHTML = s.next + ' <span aria-hidden="true">↓</span>';
    document.querySelectorAll(".chapter-rail [data-chapter]").forEach((b) => {
      if (Number(b.dataset.chapter) === index)
        b.setAttribute("aria-current", "step");
      else b.removeAttribute("aria-current");
    });
  }
  $("#copy").style.opacity = "1";
}
function createRows() {
  $("#row-clips").innerHTML = rows
    .map(
      (r, i) =>
        `<clipPath id="clip-${i}" clipPathUnits="userSpaceOnUse"><rect width="0" height="1"/></clipPath>`,
    )
    .join("");
  $("#ruler-objects").innerHTML = rows
    .map(
      (
        r,
        i,
      ) => `<g class="record-hit" data-record-id="${r.id}" role="button" tabindex="-1" aria-label="${escape(labels[i])}，一尺约${num(r.chi_cm)}厘米，查看来源" aria-hidden="true">
    <rect class="hit-area" fill="transparent"/>
    <rect class="record-focus" rx="2"/>
    <g class="record-paint" clip-path="url(#clip-${i})"><rect class="record-body" fill="${colors[i]}"/><rect class="record-sheen" fill="url(#continuous-sheen)"/><rect class="record-grain" fill="url(#continuous-grain)"/><rect class="record-outline" fill="none" stroke="${colors[i]}" stroke-opacity=".3" stroke-width=".7"/><path class="record-ticks" fill="none" stroke="#f4ead5" stroke-width="1"/></g>
    <g class="record-labels"><text class="record-period" font-family="Songti SC,STSong,serif" text-anchor="end" fill="${colors[i]}">${labels[i]}</text><text class="record-kind" text-anchor="end" font-size="10" fill="#747264">${kinds[i]}</text><text class="record-value" font-family="Georgia,serif" fill="#253c39">${num(r.chi_cm)}</text><text class="record-unit" font-size="9" fill="#716e62">约 厘米 / 尺</text></g></g>`,
    )
    .join("");
  rows.forEach((r, i) => {
    const group = $(`[data-record-id="${r.id}"]`);
    nodes.set(r.id, {
      group,
      clip: $(`#clip-${i} rect`),
      paint: group.querySelector(".record-paint"),
      body: [...group.querySelectorAll(".record-paint rect")],
      ticks: group.querySelector(".record-ticks"),
      hit: group.querySelector(".hit-area"),
      focus: group.querySelector(".record-focus"),
      labels: group.querySelector(".record-labels"),
      period: group.querySelector(".record-period"),
      kind: group.querySelector(".record-kind"),
      value: group.querySelector(".record-value"),
      unit: group.querySelector(".record-unit"),
    });
  });
}
function attrs(node, values) {
  for (const [key, value] of Object.entries(values))
    node.setAttribute(key, String(value));
}
function drawRow(layout) {
  const n = nodes.get(layout.id),
    { x, y, width: w, height: h, emphasis: e, reveal } = layout;
  attrs(n.group, {
    transform: `translate(${x} ${y})`,
    opacity: reveal,
    "aria-hidden": reveal < 0.01,
    tabindex: reveal > 0.98 ? 0 : -1,
  });
  n.group.style.pointerEvents = reveal > 0.98 ? "auto" : "none";
  attrs(n.group, {
    "data-cm": rows.find((r) => r.id === layout.id).chi_cm,
    "data-full-width": w,
  });
  // Introduce the whole ruler: a partial horizontal wipe would encode a false length.
  attrs(n.clip, { width: w, height: h });
  n.body.forEach((r) => attrs(r, { width: w, height: h }));
  attrs(n.paint, { opacity: lerp(0.56, 1, e) });
  let ticks = "";
  for (let i = 1; i < 10; i++)
    ticks += `M${(w * i) / 10} 0v${h * (i === 5 ? 0.45 : 0.28)}`;
  attrs(n.ticks, { d: ticks });
  attrs(n.hit, {
    x: -100,
    y: -5,
    width: w + 180,
    height:
      current >= introCount + 4 ? Math.max(h + 10, 18) : Math.max(h + 26, 32),
  });
  attrs(n.focus, { x: -8, y: -7, width: w + 16, height: h + 14 });
  attrs(n.period, {
    x: -24,
    y: h / 2 + 5,
    "font-size": current >= introCount + 4 ? lerp(13, 17, e) : lerp(16, 23, e),
  });
  const compact = current >= introCount + 4;
  const detailOpacity = compact ? 0 : smooth((e - 0.65) / 0.35);
  attrs(n.kind, {
    x: -24,
    y: h / 2 + 24,
    opacity: detailOpacity,
    "aria-hidden": detailOpacity < 0.01,
  });
  attrs(n.value, {
    x: w + 16,
    y: h / 2 + 6,
    "font-size": current >= introCount + 4 ? lerp(15, 20, e) : lerp(18, 27, e),
  });
  attrs(n.unit, {
    x: w + 17,
    y: h / 2 + 23,
    opacity: detailOpacity,
    "aria-hidden": detailOpacity < 0.01,
  });
  attrs(n.labels, { opacity: lerp(0.9, 1, e) });
}
function drawAxis() {
  const { width: W, height: H } = dimensions,
    x = W * 0.19,
    scale = (W * 0.66) / 40,
    y = H * 0.886;
  let markup = `<path d="M${x} ${H * 0.486}V${y}" stroke="#426359" stroke-opacity=".55" stroke-width="1"/><text x="${x - 17}" y="${y + 23}" text-anchor="end" font-size="10" fill="#716e62">厘米</text>`;
  for (let cm = 0; cm <= 40; cm += 5) {
    const xx = x + cm * scale;
    markup += `<path d="M${xx} ${H * 0.492}V${y - 10}" stroke="#253c39" stroke-opacity="${cm ? ".09" : "0"}" stroke-dasharray="2 7"/><path d="M${xx} ${y - 3}v7" stroke="#716e62" stroke-opacity=".55"/><text x="${xx}" y="${y + 23}" text-anchor="middle" font-family="Georgia,serif" font-size="11" fill="#716e62">${cm}</text>`;
  }
  $("#guides").innerHTML = markup;
}
function renderAnnotations(p, layouts) {
  const W = dimensions.width,
    H = dimensions.height,
    index = Math.round(p),
    opacity = clamp((0.5 - Math.abs(p - index)) * 5);
  let content = "";
  if (index === 1 || index === 2) {
    const previous = layouts[index - 1],
      now = layouts[index];
    const a = previous.x + previous.width,
      b = now.x + now.width,
      yy = now.y + H * 0.079;
    const difference =
      Math.abs(rows[index].chi_cm - rows[index - 1].chi_cm) * 10;
    content = `<g opacity="${opacity}"><path d="M${a} ${previous.y + previous.height + 4}V${yy}M${b} ${now.y + now.height + 4}V${yy}M${a} ${yy}H${b}" stroke="#9b4936" stroke-opacity=".6" stroke-dasharray="2 4" fill="none"/><text x="${Math.max(a, b) + 17}" y="${yy + 4}" fill="#9b4936" font-size="11">参考值相差 ${num(difference)} 毫米</text></g>`;
  } else if (index === 3 || index === 4) {
    const x = W * 0.88;
    content = `<g opacity="${opacity}"><path d="M${x - 5} ${H * (index === 3 ? 0.7 : 0.68)}h5v${H * (index === 3 ? 0.148 : 0.19)}h-5" fill="none" stroke="#9b4936" stroke-opacity=".5"/><text x="${x + 13}" y="${H * 0.755}" font-size="11" fill="#9b4936">同代</text><text x="${x + 13}" y="${H * 0.78}" font-size="11" fill="#9b4936">并行</text></g>`;
  }
  $("#annotations").innerHTML = content;
}
function readingPose(index) {
  return {
    intro: clamp(index, 0, 2),
    history: Number(index >= introCount),
    layouts: continuityLayout(
      rows,
      1,
      1,
      clamp(index - introCount, 0, lastChapter - introCount),
    ),
    arts: [
      Number(index === 0 || index === 3),
      Number(index === 6),
      Number(index === 7),
      Number(index === 8),
    ],
    meter: Number(index === 9 || index === 10),
    meterUnit: Number(index >= 10),
    closing: Number(index === lastChapter),
    tone: clamp((index - 5) / 6),
  };
}
function selectTarget(index, immediate = false) {
  if (!motion) return;
  const previous = selected;
  selected = index;
  const duration =
    quietMotion || immediate
      ? 0
      : previous <= 2 && index <= 2
        ? Math.max(previous, index) === 2
          ? 2100
          : 1250
        : 820;
  motion.target(readingPose(index), performance.now(), duration);
  renderCopy(index);
  schedule();
}
function render(now) {
  raf = false;
  if (!rows.length || !dimensions.width) return;
  const raw =
    clamp(
      (window.scrollY - story.offsetTop) /
        (story.offsetHeight - stage.offsetHeight),
    ) * lastChapter;
  const target = selectChapter(raw, selected, lastChapter);
  if (target !== selected) selectTarget(target, selected < 0);
  const { pose, moving, progress } = motion.sample(now);
  const hp = clamp(selected - introCount, 0, lastChapter - introCount);
  const layouts = pose.layouts.map((row) => ({
    ...row,
    x: row.x * dimensions.width,
    y: row.y * dimensions.height,
    width: row.width * dimensions.width,
    height: row.height * dimensions.height,
  }));
  layouts.forEach(drawRow);
  const historical = pose.history;
  stage.dataset.animating = String(moving);
  stage.dataset.targetChapter = String(selected);
  stage.setAttribute("aria-busy", String(moving));
  svg.style.opacity = historical;
  svg.style.visibility = historical < 0.01 ? "hidden" : "visible";
  svg.style.pointerEvents = historical > 0.98 ? "auto" : "none";
  svg.setAttribute("aria-hidden", historical < 0.01);
  if (historical < 0.98)
    nodes.forEach((n) => n.group.setAttribute("tabindex", "-1"));
  $(".plot-heading").style.opacity = historical;
  $(".plot-heading").setAttribute("aria-hidden", historical < 0.01);
  $("#intro-graphic").style.opacity = 1 - historical;
  $("#intro-graphic").setAttribute("aria-hidden", historical > 0.99);
  if (historical < 1)
    $("#intro-content").innerHTML = introMarkup(
      pose.intro,
      dimensions.width,
      dimensions.height,
      rows[0].chi_cm,
    );
  renderAnnotations(hp, layouts);
  $("#annotations").style.opacity = moving
    ? String(smooth((progress - 0.7) / 0.3))
    : "1";
  ["qin", "tang", "yuan", "qing"].forEach((name, i) => {
    const el = $("#" + name + "-art"),
      opacity = pose.arts[i];
    el.style.opacity = opacity;
    el.style.transform = quietMotion
      ? "none"
      : "translate(" + (1 - opacity) * 18 + "px," + (1 - opacity) * 4 + "px)";
  });
  $("#meter-detail").hidden = pose.meter < 0.01;
  $("#meter-detail").style.opacity = pose.meter;
  if (pose.meter > 0.01)
    $("#meter-content").innerHTML = meterMarkup(
      rows[pose.meterUnit < 0.5 ? 10 : 11].chi_cm,
      pose.meterUnit >= 0.5,
    );
  $("#closing-detail").hidden = pose.closing < 0.01;
  $("#closing-detail").style.opacity = pose.closing;
  const tone = pose.tone;
  stage.style.backgroundColor =
    "rgb(" +
    lerp(238, 235, tone) +
    "," +
    lerp(233, 225, tone) +
    "," +
    lerp(221, 213, tone) +
    ")";
  $("#progress").style.transform = "scaleX(" + raw / lastChapter + ")";
  const shown =
    historical > 0.01
      ? layouts.filter((r) => r.reveal > 0.01).map((r) => r.id)
      : [];
  if (shown.join() !== visibleIds.join() || !stage.dataset.ready) {
    visibleIds = shown;
    $("#source-footnote").innerHTML = shown.length
      ? "已出现 " +
        shown.length +
        " 条参考记录<span>推算 / 研究 / 制度定义 · 查看依据 ↗</span>"
      : "十寸成尺 · 十尺成丈<span>同一尺制内部换算 · 查看依据 ↗</span>";
    $("#graphic-desc").textContent =
      rows
        .filter((r) => shown.includes(r.id))
        .map(
          (r) =>
            labels[rows.indexOf(r)] +
            "：一尺" +
            (r.approximate || r.exact_fraction_cm ? "约" : "") +
            num(r.chi_cm) +
            "厘米。",
        )
        .join("") + "全部使用同一厘米比例和零点。";
  }
  stage.dataset.ready = "true";
  if (moving) schedule();
}
function schedule() {
  if (!raf) {
    raf = true;
    requestAnimationFrame(render);
  }
}
function resize() {
  dimensions = { width: stage.clientWidth, height: stage.clientHeight };
  svg.setAttribute("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`);
  $("#intro-graphic").setAttribute(
    "viewBox",
    `0 0 ${dimensions.width} ${dimensions.height}`,
  );
  drawAxis();
  schedule();
}
function openSources(id = null, all = false) {
  const shown = id
    ? allRows.filter((r) => r.id === id)
    : all
      ? allRows
      : rows.filter((r) => visibleIds.includes(r.id));
  const sourceLink = (s) =>
    '<a href="' +
    escape(s.url) +
    '" target="_blank" rel="noopener noreferrer">' +
    escape(s.title) +
    " ↗</a>";
  $("#source-title").textContent = all
    ? "十八条主选记录"
    : "这把尺，从哪里来？";
  let content =
    "<p>每条记录是一项有来源的参考量值。器物推算、研究考证、地方志综述与制度定义不等同；纵向顺序不是等比例年代轴。</p>";
  if (!shown.length)
    content +=
      "<p>十寸成尺，十尺成丈：本页采用同一尺制内部的通行十进关系，不主张所有历史时期和地方从无例外。序章借秦参考值演示计算。</p>" +
      ["moe-chi", "moe-zhang"]
        .map((id) => "<p>" + sourceLink(sources.get(id)) + "</p>")
        .join("") +
      "<p>序章23.2厘米的秦尺参考值：" +
      sourceLink(sources.get(rows[0].source_id)) +
      "。" +
      escape(rows[0].note) +
      "</p>";
  content += shown
    .map((r) => {
      const s = sources.get(r.source_id);
      const name = labels[rows.indexOf(r)] || r.period + " · " + r.system_name;
      return (
        '<article class="source-record"><h3>' +
        escape(name) +
        "<small>一尺" +
        (r.approximate ? "约 " : " ") +
        (r.exact_fraction_cm
          ? r.exact_fraction_cm.numerator +
            "/" +
            r.exact_fraction_cm.denominator
          : num(r.chi_cm)) +
        " 厘米</small></h3><p>" +
        escape(r.note) +
        "</p><p>" +
        sourceLink(s) +
        '</p><p class="source-meta">' +
        escape(s.author || s.publisher) +
        " · " +
        escape(r.locator) +
        "<br>" +
        escape(s.access) +
        '</p><p class="source-meta">同尺制派生：一寸约' +
        num(r.derived.cun_cm) +
        "厘米；一丈约" +
        num(r.derived.zhang_m) +
        "米。</p></article>"
      );
    })
    .join("");
  const history = historySources[current - introCount];
  if (history)
    content +=
      '<article class="source-record"><h3>这一幕的解释依据</h3><p>' +
      escape(history.note) +
      "</p>" +
      sourceLink(history) +
      "</article>";
  content +=
    '<p>场景配图为艺术示意，不是量值证据。主图固定0—40厘米，微小差值直接在原尺旁注明。部分原件仍待补核；器物推算、研究估值、地方志综述与制度定义需按各条来源分别理解。</p><p><a href="./evidence.json" download>下载逐条证据</a> · <a href="./measurements.json" download>下载尺长与来源数据</a></p>';
  $("#source-content").innerHTML = content;
  previousFocus = document.activeElement;
  dialog.showModal();
  document.body.style.overflow = "hidden";
  $("#close-sources").focus();
}
async function boot() {
  const response = await fetch("./measurements.json");
  if (!response.ok) throw new Error("数据加载失败：HTTP " + response.status);
  const data = await response.json();
  allRows = data.records.core;
  rows = continuityIds.map((id) => {
    const r = data.records.core.find((v) => v.id === id);
    if (!r) throw new Error("缺少主选记录：" + id);
    return r;
  });
  sources = new Map(data.sources.map((s) => [s.id, s]));
  motion = createReadingTransition(readingPose(0));
  createRows();
  $(".chapter-rail").innerHTML = scenes
    .map(
      (s, i) =>
        '<button data-chapter="' +
        i +
        '" aria-label="' +
        s.nav +
        '"><span>' +
        s.nav +
        "</span><i></i></button>",
    )
    .join("");
  setupExplorer(allRows, openSources);
  $("#restart").addEventListener("click", () => jumpTo(0));
  $("#read-again").addEventListener("click", () => jumpTo(0));
  document
    .querySelectorAll(".chapter-rail [data-chapter]")
    .forEach((b) =>
      b.addEventListener("click", () => jumpTo(Number(b.dataset.chapter))),
    );
  $("#next").addEventListener("click", () =>
    current < lastChapter
      ? jumpTo(current + 1)
      : $("#reading-copy").scrollIntoView({
          behavior: quietMotion ? "instant" : "smooth",
        }),
  );
  $("#sources").addEventListener("click", () => openSources());
  $("#source-footnote").addEventListener("click", () => openSources());
  $("#all-data").addEventListener("click", () => openSources(null, true));
  $("#close-sources").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    document.body.style.overflow = "";
    previousFocus?.focus?.({ preventScroll: true });
  });
  $("#ruler-objects").addEventListener("click", (e) => {
    const r = e.target.closest("[data-record-id]");
    if (r) openSources(r.dataset.recordId);
  });
  $("#ruler-objects").addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      const r = e.target.closest("[data-record-id]");
      if (r) {
        e.preventDefault();
        openSources(r.dataset.recordId);
      }
    }
  });
  addEventListener("keydown", (e) => {
    if (
      dialog.open ||
      e.altKey ||
      e.ctrlKey ||
      e.metaKey ||
      e.shiftKey ||
      /INPUT|TEXTAREA|SELECT|BUTTON|A/.test(
        document.activeElement?.tagName || "",
      ) ||
      document.activeElement?.hasAttribute("data-record-id")
    )
      return;
    if (window.scrollY > story.offsetHeight - stage.offsetHeight + 20) return;
    if (["ArrowDown", "PageDown"].includes(e.key)) {
      e.preventDefault();
      if (current < lastChapter) jumpTo(current + 1);
      else $("#reading-copy").scrollIntoView();
    }
    if (["ArrowUp", "PageUp"].includes(e.key)) {
      e.preventDefault();
      jumpTo(Math.max(0, current - 1));
    }
    if (e.key === "Home") {
      e.preventDefault();
      jumpTo(0);
    }
  });
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", resize);
  function updateMotion(value) {
    quietMotion = value;
    $("#motion-toggle").setAttribute("aria-pressed", String(value));
    $("#motion-toggle").textContent = value ? "恢复动态" : "减弱动态";
    if (value) selectTarget(Math.max(0, selected), true);
  }
  $("#motion-toggle").addEventListener("click", () =>
    updateMotion(!quietMotion),
  );
  reduced.addEventListener("change", (event) => updateMotion(event.matches));
  updateMotion(quietMotion);
  addEventListener("visibilitychange", () => {
    if (!document.hidden) schedule();
  });
  new ResizeObserver(resize).observe(stage);
  resize();
}
boot().catch((error) => {
  console.error(error);
  $("#load-error").hidden = false;
  $("#load-error").textContent = "暂时无法绘制尺长：" + error.message;
});
