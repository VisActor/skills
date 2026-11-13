# 舞台、正文与控制接线

构图与阅读顺序由作品决定；这里连接已有画面、正文和滚动，不提供整页模板。

<a id="文字滚动与舞台更新"></a>

## 选择正文接法

按[阅读空间](design.md#主画面与阅读空间)选一条，先接通再按需看导航或排错。上下、左右和浮层都能沿用同一运行能力。

| 阅读方式 | 何时使用 | 最短接法 |
| --- | --- | --- |
| 正文自然滚动，图形停留 | 段落长短有变化，需要连续阅读；浮动卡片也属于这类 | [普通流正文、触发标记与退出](#正文自然滚动) |
| 正文固定，随状态交接 | 短正文陪伴同一主画面，可原位淡入或轻微位移 | [阅读轨道、正文交接与退出](#正文固定交接) |

## 基本接入与尺寸

默认调用 [connectReading](../assets/stage-wiring/connect.mjs)，无需先读源码。复制 `assets/stage-wiring/connect.mjs` 与 `assets/runtime/{stage,motion,scroll,geometry}.mjs`，保持目录关系；采用下方空间样式时带上 `stage-wiring/layout.css`，固定正文另带 `runtime/copy.mjs`。下文路径均相对此复制目录。

`connectReading` 负责滚动选态、自动完成过渡、绘图区尺寸观察和配置后的退出；不需要再添加同职责的播放器、尺寸监听或退出控制。初始化呈现当前阅读位置的完整状态；停滚后过渡继续完成，倒回或跳转从当前姿态接续。`duration` 控制动画时长，`viewportRatio / hysteresis` 控制触发位置与边界，不决定段落长度。

### 可用空间与实际绘图区

分别安排舞台、图文区域与图内构图。[layout.css](../assets/stage-wiring/layout.css) 提供可选的空间分配：`data-stage-space` 占窗口扣除 `--stage-top / --stage-bottom` 后的高度（默认各 24px）；标题、正文、图例与控件占内容高度，直接子元素 `data-stage-plot` 得到剩余空间。图形可单独限高并居中，不把这个上限套到整个全出血舞台。辅助内容挤占主图时重新安排内容，不能让图容器没有高度。

将实际图容器传给 `element`。`layout(id, { width, height })` 接收它的 CSS 像素尺寸；构图仍清楚时可保留固定 `viewBox` 等比适配，如 [time-history](../assets/examples/time-history/index.html)。原构图不再适合时，按实际宽高、记录数与标签重排，并同步 `viewBox`，如 [record-comparison](../assets/examples/record-comparison/index.html)。标记、轴与标签共用映射；容器变大不意味着把行距铺满。

尺寸变化会自动重算并落到当前状态的新布局；字体、数据或周边文档改变而尺寸未变时，调用 `connection.refresh()`。刷新不替作品重选构图，也不会自动切换正文接法。页面恢复时模块自动刷新；只有卸载作品时才 `dispose()`，滚出视口时保留控制器以支持倒回。

### 两个接法共用的极小绘图

下面保存为 `plot.mjs`，与所选 HTML 同级。它只演示一条模拟用时从 12 变到 28 分钟；作品替换数据和绘图，不沿用这两段文案作为叙事。两种接法共用它，避免各自重写控制器。

```javascript
// plot.mjs
import { lerp } from "./runtime/geometry.mjs";

export function createPlot(element) {
  element.innerHTML = `<svg role="img" aria-label="模拟用时，共同尺度为零到四十分钟">
    <path stroke="currentColor" fill="none"/>
    <rect x="40" height="24" fill="#347868"/>
    <text font-size="18"/><text x="40" font-size="16">0</text>
    <text font-size="16" text-anchor="end">40 分钟</text></svg>`;
  const svg = element.querySelector("svg"), axis = svg.querySelector("path");
  const bar = svg.querySelector("rect"), [value, zero, end] = svg.querySelectorAll("text");
  const values = { start: 12, later: 28 };
  return {
    layout(id, { width, height }) {
      if (!(id in values) || width < 240 || height < 120)
        throw new Error("需要已知状态和至少 240 × 120 的绘图区，请调整内容安排");
      return { id, width, height, value: values[id], length: (width - 120) * values[id] / 40 };
    },
    blend(from, to, t) { return { ...to, length: lerp(from.length, to.length, t) }; },
    render(pose, frame) {
      const { width, height, length } = pose, y = height / 2;
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      axis.setAttribute("d", `M40,${y + 28}H${width - 80}`);
      bar.setAttribute("y", y - 12); bar.setAttribute("width", length);
      value.setAttribute("x", 48 + length); value.setAttribute("y", y + 6);
      value.textContent = frame.moving ? "" : `${pose.value} 分钟`;
      for (const label of [zero, end]) label.setAttribute("y", y + 52);
      end.setAttribute("x", width - 80);
    },
  };
}
```

`layout` 给出完整目标，`blend` 计算当帧几何，`render` 更新原对象。这里读数在条形到位后出现；作品可按证据需要选择时机。新增记录、共同尺度变化与复杂标注见[关系几何](implementation-geometry.md)；稳定 SVG 更新见[渲染参考](implementation-rendering.md#共用读数格式与-svg-更新)。

## 正文自然滚动

保存为 HTML，与上面的 `plot.mjs` 一起通过本地服务打开。短例用两列展示父子关系，列宽、正文位置和留白按作品改写。

```html
<!doctype html>
<html lang="zh-CN">
<meta charset="utf-8"><title>自然滚动接线</title>
<link rel="stylesheet" href="./stage-wiring/layout.css">
<style>
  body { margin: 0; font: 18px/1.7 system-ui; color: #243b35; }
  header, footer { padding: 2rem; }
  .chapter { display: grid; grid-template-columns: minmax(16rem, 1fr) minmax(0, 2fr); gap: 4vw; align-items: start; padding: 0 2rem; }
  article { padding: 30vh 0; } article:last-of-type { padding-bottom: 0; }
  #panel { padding: 1rem; background: #f3f4ee; }
</style>
<header>向下阅读，图形持续停留。</header>
<section class="chapter">
  <div id="reading">
    <article><h2 data-story-state="start">初态</h2><p>一条模拟用时记录。</p></article>
    <article><h2 data-story-state="later">后态</h2><p id="reading-end">滚动触发变化；停下后动画仍会完成。这段读完，舞台才退出。</p></article>
    <div id="tail" aria-hidden="true"></div>
  </div>
  <div id="panel" data-stage-space>
    <h2>模拟用时</h2><div id="plot" data-stage-plot></div>
  </div>
</section>
<footer>后续普通图文。</footer>
<script type="module">
  import { connectReading } from "./stage-wiring/connect.mjs";
  import { createPlot } from "./plot.mjs";
  const q = selector => document.querySelector(selector);
  const connection = connectReading({
    reading: q("#reading"), element: q("#plot"), ...createPlot(q("#plot")),
    exit: { sticky: q("#panel"), readingEnd: q("#reading-end"), spacer: q("#tail") },
  });
  addEventListener("pagehide", event => { if (!event.persisted) connection.dispose(); });
</script>
</html>
```

正文与 sticky 面板共用章节父区间。标记按文档位置选态，不同段落可用同一 ID，普通解释不必设标记；可用 `cueSelector / idFor` 适配已有属性。`readingEnd` 指实际末段文字，不能用带大量留白的 article；`spacer` 是同一父区间内、正文列末尾的空块，无额外 margin、padding 或 min-height。正文列保持普通流，留白增长不能重新居中前文。

这里 `exit` 默认让末段底部读到视口 40% 处后才允许舞台退出，可按阅读位置调整 `releaseRatio`；已有空间足够时不会额外增加。它保障几何上的停留，不拦截快速略过，也不强制等动画。自然滚动正文无需 `createCopyHandoff`。

## 正文固定交接

同样使用 `plot.mjs`。下面改为正文在上、图在下；空轨道与 sticky 面板叠在同一网格区域，轨道撑起普通流阅读空间。

```html
<!doctype html>
<html lang="zh-CN">
<meta charset="utf-8"><title>固定正文接线</title>
<link rel="stylesheet" href="./stage-wiring/layout.css">
<style>
  body { margin: 0; font: 18px/1.7 system-ui; color: #243b35; }
  header, footer { padding: 2rem; }
  .chapter { display: grid; align-items: start; padding: 0 2rem; }
  #panel, #track { grid-area: 1 / 1; min-width: 0; }
  #track { pointer-events: none; }
  #panel { padding: 1rem; background: #f3f4ee; }
  #copy h2 { margin: 0; } #copy p { margin: .5rem 0 1rem; }
</style>
<header>正文留在舞台内，随阅读状态交接。</header>
<section class="chapter">
  <div id="panel" data-stage-space>
    <div id="copy">
      <section data-copy="start"><h2>初态</h2><p>一条模拟用时记录。</p></section>
      <section data-copy="later" hidden><h2>后态</h2><p>正文和图形同时开始交接；同一条形继续变化。</p></section>
    </div>
    <div id="plot" data-stage-plot></div>
  </div>
  <div id="track" aria-hidden="true"></div>
</section>
<footer>读过最后状态后，普通图文继续。</footer>
<script type="module">
  import { connectReading } from "./stage-wiring/connect.mjs";
  import { createCopyHandoff } from "./runtime/copy.mjs";
  import { createPlot } from "./plot.mjs";
  const q = selector => document.querySelector(selector);
  const copy = createCopyHandoff(q("#copy"), { offsetY: 0 });
  const connection = connectReading({
    reading: q("#track"), element: q("#plot"), ...createPlot(q("#plot")),
    track: { ids: ["start", "later"], extent: ({ index, viewportHeight }) => viewportHeight * (index === 0 ? .8 : 1.1) },
    onReading: ({ id }) => copy.show(id),
    exit: { sticky: q("#panel"), releaseRatio: 0 },
  });
  addEventListener("pagehide", event => {
    if (!event.persisted) { connection.dispose(); copy.dispose(); }
  });
</script>
</html>
```

先创建 `copy`，再接舞台；初始化会调用 `onReading`，首次 `show` 直接显示当前正文，后续交接保留各段占位。`track.ids` 与 `data-copy` 对应；`extent` 给每段阅读空间，不是动画时长，按真实内容调整，省略时每段默认一视口。生成的末段标记和留白自动交给 `exit`，无需自行补最后一屏。

`show(id)` 在阅读状态变化时调用，默认 260ms 原位淡出淡入；可用 `offsetY: 5` 加轻微位移。同一状态换数据时，单次 `show(id, { update: () => 更新正文 })` 在旧文退去后修改内容，不在每帧调用。通常图文在同一次触发中开始交接，关键强调可随后跟上图内证据；确需先观察再给答案时，由场景决定延后显示，如[点阵开篇](../assets/examples/opening-particles/scene.mjs)。模块不判断结论是否已获支持。

## 探索交接与控件

| 意图 | 接法与控制权 |
| --- | --- |
| 跳到另一阅读章节 | `connection.navigate(indexOrId)` 改变滚动位置，同步正文与图形；不能用 `explore` 代替 |
| 在同一舞台试参数 | 先更新作品的选择，再 `connection.explore(id)`；`layout` 读取该选择，滚动暂不覆盖它 |
| 从同舞台探索回主线 | `connection.resume()` 恢复当前滚动位置的阅读状态；作品决定重置还是保留选择 |

另设独立比较区时，无需使用 `explore / resume`。共用舞台时同步统计、图例与文案，清理不适用的作者强调，保留读者明确设置的对照。

需要箭头或按键时，在 `connectReading` 中加 `navigation: { scope: stagePanel, previous: backButton, next: nextButton }`。按键只在当前舞台生效，保留输入框、对话框与边界操作；`keyboard: false` 可关闭按键，`hashFor: ({ id }) => id` 可绑定章节锚点。初始化与锚点恢复都可能触发 `onReading`，回调使用已建立的正文对象，不依赖尚未赋值的 `connection`。不另写滚轮拦截或按钮状态机。

控件视觉与语义用法见[控件选择与外观](material-direction.md#探索控件的选择与外观)；可借用 [mechanism.css](../assets/examples/mechanism.css) 的 `.state-controls / .segmented / .select-wrap`。聚焦、动态正文高度或 scroll anchoring 引发跳动时局部排查，不全局关闭正常滚动。

## 底层接法与排错

以下只用于已有控制器或具体故障；新建舞台使用上面一条接法即可。排查目标状态与实际终态不一致时，直达[运行状态与诊断](implementation-rendering.md#实际占位与空间诊断)，不必默认接入检查面板。

已有可靠接线可直接使用 [createStage](../assets/runtime/stage.mjs)，提供 `element`、`steps: [{ id, element }]`、`layout / blend / render`；刷新用 `stage.refresh()`，卸载用 `stage.dispose()`。已有播放器、只缺滚动选择时才用 [observeSteps](../assets/runtime/scroll.mjs)。

### 最后画面读完再退出

`createStage` 本身不安排 sticky 区间。直接用底层接线时，按自然滚动短例中的 DOM 条件调用；已有 `connectReading.exit` 则不再调用一次：

```javascript
import { reserveStageExit } from "./runtime/scroll.mjs";
const exitSpace = reserveStageExit({
  sticky: stagePanel, readingEnd: lastParagraph, spacer: readingTail, releaseRatio: .4,
});
// 组件卸载时 exitSpace.dispose()。
```

### 自动完成的衔接动画

只需要独立按钮动画时使用 [createPlayer](../assets/runtime/motion.mjs)。它维护单一时钟，从当前姿态重定向，不积压目标；`createStage` 已内置它。作品仍提供每帧几何与渲染：

```javascript
import { createPlayer } from "./runtime/motion.mjs";
const player = createPlayer(initialPose, { blend, render, duration: 700 });
player.goTo(nextPose);
// 组件卸载时 player.dispose()。
```

`render` 画当帧姿态，轴、对象与标签共用映射；保留旧数据却重建整幅终态不会产生连续过程。若滚动本身代表一个可读变量，另用该变量计算状态，不把它和只负责连接的动画进度混为一谈。
