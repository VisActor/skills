# 舞台、播放器与探索接线

已有目标布局与渲染时，按需接入滚动、自动衔接或探索。构图保持由作品决定；接口适用时直接调用运行模块。

## 文字滚动与舞台更新

按设计稿为一段解释过程保留一个舞台容器，并让文字按文档顺序滚动。舞台可在父容器内使用 `position: sticky`，文字从侧边或图形空区经过；视觉区域可以铺满，文字列仍保持可读宽度。父容器覆盖这段阅读过程，到其末端时，舞台结束固定并随页面滚出视口；普通图文段落按内容排布，不继承舞台高度或状态控制。

滚动正文、舞台图形和固定标题按实际边界分配空间。正文会经过的区域应避开必须持续可读的标签与控件；可使用专门的文字列，或随阶段释放图形空区。仅调整 `z-index` 会改变谁被盖住，不能解决双方都需要阅读时的空间冲突。

舞台入口提供初始状态的触发标记，其后只在需要图形回应的位置设置标记，其余段落继续解释现有画面。触发位置使用文档中的实际元素，间距按文字阅读和观看变化所需时间安排，不用统一的 `100vh` 文本块、滚轮劫持或强制翻页来替代。触发标记与状态 ID 对应，多段正文可以共享一个 ID；可停留状态无需持续动画。

滚动舞台默认可直接用 [stage.mjs](../assets/runtime/stage.mjs) 的 `createStage` 接入已有布局和渲染。下面假定已有 `readingFlow`（本段文字容器）、`graphic`（可测量的图形容器）及作品自己的三个函数：

```javascript
import { createStage } from "./runtime/stage.mjs";

const stage = createStage({
  element: graphic,
  steps: [...readingFlow.querySelectorAll("[data-story-state]")]
    .map((element) => ({ element, id: element.dataset.storyState })),
  layout: layoutFor, // (stateId, { width, height }) → 完整目标几何，含必要历史与标注
  blend,            // (from, to, progress) → 本帧几何，可组合 runtime 中的函数
  render,           // (pose, { moving, progress }) → 更新 SVG / Canvas / HTML
});
```

`steps` 按实际文档位置排序，不同段落可以共用同一个状态 ID；普通解释段落不用设置标记。容器须已有正的宽高，布局与样式由作品提供。初始化直接呈现当前阅读位置的完整状态；后续触发自动过渡，即使停止滚动也会完成，反向与跳转从当前姿态接续。可选 `duration`、`viewportRatio`、`hysteresis` 调整时长和触发边界，不限定章节、图表或渲染方式。

窗口或容器尺寸改变时，重新调用 `layout` 并直接落到当前目标状态的新布局。字体、数据或周围文档内容变化后，可调用 `stage.refresh()` 重算；无需重新创建播放器。更新图形时沿用已确定的身份与尺度，动态标签按可读关系交接，正文仍按文档顺序阅读。

| 操作 | 接法 |
| --- | --- |
| 进入探索或手动控制 | 先 `stage.setReadingEnabled(false)`，再 `stage.goTo(id)`；`layout` 负责该状态及用户选择，过渡仍由同一播放器完成 |
| 返回叙事 | `stage.setReadingEnabled(true)`，重新选择当前滚动位置对应的状态 |
| 查看是否到位 | `stage.sample()` 返回 `pose / progress / moving / targetId`；`targetId` 是请求目标，`moving: false` 才表示过渡完成 |
| 卸载组件 | `stage.dispose()` 一次释放监听、尺寸观察与动画；仅滚出视口时保留控制器，支持反向阅读 |

只需按钮动画时直接使用 `createPlayer`；已有播放器而只缺滚动选择时使用 `observeSteps`。完整舞台接入用 `createStage` 即可，不同时再接另一套滚动监听。基础模块不推断前后对象对应、历史保留或组成关系，这些仍由[关系几何](implementation-geometry.md)与作品设计决定。

### 最后画面读完再退出

`createStage` 负责状态与动画，sticky 的固定范围由页面布局决定。最后一次触发之后，完整图形应继续陪伴末段正文阅读，再随章节离场；只确认动画完成，无法发现图形已经提前滚出的问题。

需要按实际尺寸预留出口空间时，可调用 [scroll.mjs](../assets/runtime/scroll.mjs) 的 `reserveStageExit`。在正文列末尾放一个空的普通流块，仍位于 sticky 的父容器内；将最后一段实际正文作为 `readingEnd`，而非带大段留白的状态容器：

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

具体实现需要保证：

1. `createPlayer` 只维持一个循环；新目标替换旧目标，不积压待播章节。
2. 反向从当前可见姿态接续，不跳回上一端点。过渡中鼠标详情不能把插值位置当观测值。
3. 相邻状态的触发边界设缓冲区，避免轻微滚动反复切换；导航落在有效区间内，避开恰好位于边界的像素误差。
4. 时间、图形、轴与标签协同。可分阶段显示说明，完整状态中图文必须一致。
5. 浏览器恢复可见时重新采样时间并收敛，窗口尺寸改变时从当前阅读状态重算布局。
6. 时长和错峰由运动跨度、对象数量与阅读需要确定，不固定为某篇案例的参数。

若需要自动经过一个参照姿态，把它作为可中断的途经点；不要强制所有切换绕回全景，也不锁定读者等队列播完。

## 探索交接与控件

故事状态与读者选择共用数据、布局和过渡入口，控制权分开。进入探索时清理不适用的作者强调，但保留读者明确设置的对照。切换指标／窗口时更新统计、图例、详情和文案，非法组合提示原因。

按[控件选择与外观](material-direction.md#探索控件的选择与外观)实现操作。优先用语义化的 `button`、`select`、`input` 与关联标签；互斥选项可用同名 radio 组成可见的选项组，操作按钮的选中状态与实际数据状态同步。原生选择框可统一闭合外观，展开菜单仍受浏览器与系统影响；需要搜索、多选或完整定制弹层时，再选适合当前技术栈的成熟控件。

需要借用控件外观时，读取 [mechanism.css](../assets/examples/mechanism.css) 中 `.state-controls`、`.segmented`、`.select-wrap` 及[比较](../assets/examples/comparison/index.html)或[单元](../assets/examples/units/index.html)目录的 HTML；`--ui-*` 变量统一局部外观。接线见各自 `scene.mjs` 的 `qGo`、类别过滤与 `unitGo`，均接入同一数据与动画入口。作品只保留能回答探索问题的操作。

确定返回主线、重置与保存选择的行为；不默认实现持久化。控件聚焦、动态正文高度与 scroll anchoring 可能触发舞台跳动，检查实际行为后再局部修正，不全局关闭正常滚动。
