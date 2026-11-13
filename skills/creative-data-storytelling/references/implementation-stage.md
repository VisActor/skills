# 舞台、播放器与探索接线

已有目标布局与渲染时，按需接入滚动、自动衔接或探索。构图保持由作品决定；接口适用时直接调用运行模块。

## 文字滚动与舞台更新

先按[阅读空间](design.md#主画面与阅读空间)选择正文如何陪伴图形；上下、左右或浮层是布局选择，不需要另写滚动引擎。

| 阅读方式 | 适合的内容与接法 |
| --- | --- |
| 正文自然滚动，图形停留 | 段落需要连续阅读、长短有变化；普通文档流中的正文标记触发 sticky 图形。见 [time-history](../assets/examples/time-history/index.html)。浮动卡片也可沿用这条接线，另安排遮挡与阅读空间。 |
| 正文固定，随状态交接 | 短正文陪伴同一主画面；普通流阅读轨道选态，`createCopyHandoff` 负责固定区换段。图书馆用原位淡入淡出，汉堡另加轻微上移；布局仍由作品决定。 |

新建滚动舞台时，默认直接调用 [connect.mjs](../assets/stage-wiring/connect.mjs) 的 `connectReading`，按下面的接口接入，不必先读模块源码。复制时同时带上 `runtime/{stage,motion,scroll,geometry}.mjs`，保持原目录关系。需要查看整页装配时，再选读[可运行示范](../assets/stage-wiring/index.html)与其 [scene.mjs](../assets/stage-wiring/scene.mjs)；文字、条形图和左右布局都可替换。

下面假定已有 `readingFlow`（本段文字容器）、`graphic`（可测量的图形容器）及作品自己的三个函数：

```javascript
import { connectReading } from "./stage-wiring/connect.mjs";

const connection = connectReading({
  reading: readingFlow, // 只在正文容器中查找 [data-story-state] 触发标记
  element: graphic,
  layout: layoutFor, // (stateId, { width, height }) → 完整目标几何，含必要历史与标注
  blend,            // (from, to, progress) → 本帧几何，可组合 runtime 中的函数
  render,           // (pose, { moving, progress }) → 更新 SVG / Canvas / HTML
  // 需要出口留白时才传 exit；见下文的布局条件。
  exit: { sticky: stagePanel, readingEnd: lastParagraph, spacer: readingTail },
});
const { stage } = connection;
```

触发标记按实际文档位置排序，不同段落可以共用同一个状态 ID；普通解释段落不用设置标记。可用 `cueSelector / idFor` 适配已有正文属性。容器须已有正的宽高，布局与样式由作品提供。初始化直接呈现当前阅读位置的完整状态；后续触发自动过渡，即使停止滚动也会完成，反向与跳转从当前姿态接续。可选 `duration`、`viewportRatio`、`hysteresis` 调整时长和触发边界，不限定章节、图表或渲染方式。

正文固定换段时，`reading` 可改为空的普通流容器，与 sticky 舞台放在同一父区间；传 `track: { ids }` 生成阅读标记。默认每段一视口阅读空间，可用 `extent: ({ id, index, viewportHeight }) => 像素长度` 调整；这是观看空间，不是动画时长。此时 `exit: { sticky: stagePanel, releaseRatio: 0 }` 自动取末段标记与尾部留白，保证完整末段读完再退出。上下、左右或浮层排布只改变 HTML/CSS 与绘图函数。

需要箭头或按键时，加 `navigation: { scope: stagePanel, previous: backButton, next: nextButton }`；按键只在当前舞台生效，保留输入框、对话框与边界处的正常操作。`connection.navigate(indexOrId)` 跳到对应阅读区间，图形仍自动衔接；`onReading({ id, index })` 通知正文已读到哪段，具体内容与显露时机由作品决定。可选 `hashFor: ({ id, index }) => 字符串` 处理本段锚点，`keyboard: false` 关闭按键。不要另写滚轮拦截或按钮状态机。接入实例见 [record-comparison](../assets/examples/record-comparison/scene.mjs) 与五段示例共用的 [segment-preview](../assets/examples/segment-preview.mjs)。

固定正文调用 [copy.mjs](../assets/runtime/copy.mjs) 的 `createCopyHandoff(copyContainer, { duration: 260, offsetY: 0 })`。容器内各段以 `data-copy="状态ID"` 标识，`show(id)` 先淡出再淡入；`offsetY: 5` 可让新段轻微上移，设为 `0` 保持原位。各段共同占位，快速倒回从当前透明度接续，卸载时 `dispose()`。同一状态换数据时，可单次调用 `show(id, { update: () => 更新该段内容 })`，在旧文字退去后更新；不要在每个动画帧里重复提交更新函数。五个片段的动态正文接法见 [segment-preview.mjs](../assets/examples/segment-preview.mjs)。

图文通常在同一次阅读触发中开始交接，正文可先完成，图形继续变化。保持句子完整，关键数字的强调可跟随图内标注，不必为此延后整段正文；确需先观察再揭示答案的段落，再由场景延后 `show`，如[点阵开篇](../assets/examples/opening-particles/scene.mjs)。共享模块不推断证据是否成立。自然滚动正文保持原生阅读，无需接入换段模块。

`connectReading` 组合已有 `createStage` 与可选 `reserveStageExit`，在 `pageshow` 和页面恢复可见时刷新，统一释放监听、尺寸观察和播放器。已有可靠接线时可以继续直接使用 [createStage](../assets/runtime/stage.mjs)，传入 `steps: [{ id, element }]`，无需再套这一层。

窗口或容器尺寸改变时，重新调用 `layout` 并直接落到当前目标状态的新布局。字体、数据或周围文档内容变化后，可调用 `connection.refresh()` 重算布局与出口；直接使用 `createStage` 时用 `stage.refresh()`。无需重新创建播放器。

衔接中 `render` 绘制当帧 `pose`，轴、对象与标签使用同一映射。新增记录需要让位时，旧对象从当前位置移到新位置，新对象按设计接入；保留旧数据但直接重建整幅终态，不会产生这段过程。SVG 可用稳定 ID 更新节点；Canvas 或重绘方案也须画出插值后的几何，不能靠终态节点上的 CSS transition 补出前态。局部接法见 `record-comparison` 的 `blendRecords / recordGeometry`，从[示例入口](design.md#从追问选择表达)定位。

| 操作 | 接法 |
| --- | --- |
| 进入探索或手动控制 | `connection.explore(id)`；`layout` 负责该状态及用户选择，过渡仍由同一播放器完成 |
| 返回叙事 | `connection.resume()`，重新选择当前滚动位置对应的状态 |
| 排查状态未更新 | `stage.sample()` 返回当前阅读索引、请求目标与按时钟推算的姿态；对照最近一次 `render(pose, frame)`，确认目标是否实际绘制，不能只凭 `sample().moving === false` 判断画面到位 |
| 卸载组件 | `connection.dispose()` 一次释放阅读轨道、导航、出口、尺寸观察与动画；仅滚出视口时保留控制器，支持反向阅读 |

只需按钮动画时直接使用 `createPlayer`；已有播放器而只缺滚动选择时使用 `observeSteps`。这些是局部接法，新建完整滚动舞台仍用 `connectReading`。基础模块不推断前后对象对应、历史保留或组成关系，这些仍由[关系几何](implementation-geometry.md)与作品设计决定。

### 最后画面读完再退出

`createStage` 负责状态与动画，sticky 的固定范围由页面布局决定。最后一次触发之后，完整图形应继续陪伴末段正文阅读，再随章节离场；只确认动画完成，无法发现图形已经提前滚出的问题。

`connectReading` 的 `exit` 已调用 [scroll.mjs](../assets/runtime/scroll.mjs) 的 `reserveStageExit`；只有直接使用底层接线时才单独调用它。在正文列末尾放一个空的普通流块，仍位于 sticky 的父容器内；将最后一段实际正文作为 `readingEnd`，而非带大段留白的状态容器：

```javascript
import { reserveStageExit } from "./runtime/scroll.mjs";

const exitSpace = reserveStageExit({
  sticky: stagePanel,       // position: sticky、已设 top，完整画面能容纳在视口内
  readingEnd: lastParagraph,
  spacer: readingTail,      // 正文列末尾的空 div，无 margin / padding / min-height
  releaseRatio: 0.4,        // 末段底部读到视口的此处后，才允许舞台开始退出
});
// 卸载这段作品时 exitSpace.dispose()。
```

它按舞台高度、top 和末段位置补足空间，已有距离足够时不增加；观察尺寸变化，不拦截滚轮。正文列需按普通文档流排列，改变留白不应反过来居中或拉伸前面的正文。接线见 [comparison/scene.mjs](../assets/examples/comparison/scene.mjs) 与示例 HTML 的 `.reading-tail`。仍按实际阅读验证触发时机和动画时长；快速略过不强制等待。

## 自动完成的衔接动画

对[自动完成的衔接](design.md#停留与衔接)，滚动选择完整状态，独立时钟完成连接；只在 scroll 回调里绘制会使停滚停在半帧。若连续操作本身对应可读变量，则单独使用变量值计算状态，不把它与过渡播放进度混作同一时间。

需要独立的动画控制时，直接调用 [motion.mjs](../assets/runtime/motion.mjs) 的 `createPlayer`：采样当前姿态、维持单一时钟循环、支持中断重定向与销毁；作品的几何与渲染通过 `blend` 和 `render` 注入。`createStage` 已在内部使用它。需要查看 SVG／Canvas 接线时，再选读 [amounts/scene.mjs](../assets/examples/amounts/scene.mjs) 或 [units/scene.mjs](../assets/examples/units/scene.mjs) 的 `blend / render`。

```javascript
const player = createPlayer(initialPose, { blend, render, duration: 700 });
// 用户或滚动选择一个完整状态；布局由作品自己的映射产生。
player.goTo(nextPose);
// 组件卸载时再调用 player.dispose()，停止动画调度。
```

播放器让新目标从当前姿态接续，不积压章节。作品提供每帧几何、轴与标注，时长与错峰按运动跨度和阅读需要安排；插值位置不是新观测。若需经过一个参照姿态，将它作为可中断的途经点。页面恢复与滚动边界由上面的舞台接线处理。

## 探索交接与控件

故事状态与读者选择共用数据、布局和过渡入口，控制权分开。进入探索时清理不适用的作者强调，但保留读者明确设置的对照。切换指标／窗口时更新统计、图例、详情和文案，非法组合提示原因。

按[控件选择与外观](material-direction.md#探索控件的选择与外观)实现操作。优先用语义化的 `button`、`select`、`input` 与关联标签；互斥选项可用同名 radio 组成可见的选项组，操作按钮的选中状态与实际数据状态同步。原生选择框可统一闭合外观，展开菜单仍受浏览器与系统影响；需要搜索、多选或完整定制弹层时，再选适合当前技术栈的成熟控件。

需要借用控件外观时，读取 [mechanism.css](../assets/examples/mechanism.css) 中 `.state-controls`、`.segmented`、`.select-wrap` 及[比较](../assets/examples/comparison/index.html)或[单元](../assets/examples/units/index.html)目录的 HTML；`--ui-*` 变量统一局部外观。接线见各自 `scene.mjs` 的 `qGo`、类别过滤与 `unitGo`，均接入同一数据与动画入口。作品只保留能回答探索问题的操作。

确定返回主线、重置与保存选择的行为；不默认实现持久化。控件聚焦、动态正文高度与 scroll anchoring 可能触发舞台跳动，检查实际行为后再局部修正，不全局关闭正常滚动。
