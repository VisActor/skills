# 单元表达的实现参考

按设计稿选定的[视觉操作](unit-visualization.md#从叙事追问推导表达与衔接)查本页接口。作品提供布局、编码与编舞，控制器负责滚动、时钟、刷新和清理；结构变化按[运动编排](#update-与运动编排)落实，源码按所需接口或操作取用。

## 渲染与数据分工

SVG 适合需要逐个交互、清晰文本和路径的单元；Canvas 适合大量频繁重绘的符号；HTML 适合正文、图片和记录详情。可以组合，也可以只用一种。用真实数量与最密集状态判断表现，不以某个固定点数作为技术分界。

静态单元图可直接计算布局并绘制；需要动态变化或交互时，将三层分开：

- **源记录与派生数据**：对象身份、观测时期、属性、来源、权重和总体。详情读取这里，保留真实数值。
- **阅读状态**：本步追问与比较关系、参与集合、历史参照、分组/排序、编码、量值尺度、关联正文段落与图例。
- **绘制姿态**：每个绘制实例的 `x / y / area / opacity` 等。插值改变姿态，不把过渡数值写回源数据。

正文关键读数与图内标签取自同一份计算结果，共享单位与格式，见[统一读数](#统一读数)。动态实现为每个状态计算完整结果，直接进入、反向返回与顺序抵达应一致。累积历史来自该状态的数据选择，不能只靠“每次前进追加一些点”的副作用维持。

一个源对象可有多个绘制实例。需要同时展示多标签时，可用 `JSON.stringify([entityId, role])`；需要同时比较两期时，再加观测窗口。只更新同一实例的观测时保持实例 ID，另存观测与来源；ID 编码由数据关系决定。机器中的 ID 延续，还需要读者可见的强调、标签或参照。

## 文字、图例、轴和单元一起交接

状态可包装为 `{ nodes, guides, scale, ... }`，各层共享帧循环、分别更新；同一 SVG 或 Canvas 即可实现，不必另建组件。

- **单元与尺度**：只更新操作涉及的实例与通道。缩放时轴、阈值和保留对象共用尺度；退出者沿用自己的尺寸与编码，不跟着选中对象放大。
- **名称、图例与读数**：`guides` 按稳定 ID 保存姿态。整组移动共享组锚点位移，端点标签从当前端点计算位置；文本、时期和真实数值取自源数据。延续有效参照，只交接新增或失效项，不因目标改变清空整层。图例含义变化时交接标定，仅保留同色不足以说明含义。
- **正文与结果**：自然流动的正文继续经过；原位正文随状态触发（如 `onStep`）接住追问，与图形交叠推进。新增结果在对应对象、尺度和标注位置可读时进入；仍成立的旧读数可注明时期继续保留。

各层不共用一个 `moving` 显隐开关，不能先清空辅助内容、等单元落定后一起恢复。中途换目标从当前可见姿态接续，取消过时文字任务。Canvas 命中检测也基于当前姿态，详情返回关联观测，不使用未来终点找记录。

## 可按需取用的模块

将所需模块及其本地依赖复制到作品后直接 `import`，无需通读 `assets/`。这些无第三方依赖的 ES modules 可组合使用，也可沿用项目已有的等效工具。

| 模块 | 提供什么 | 适用边界 |
| --- | --- | --- |
| [stage.mjs](../assets/mechanics/stage.mjs) | `createStage({ element, steps, layout, blend, render, onStep? })`，见[舞台接入](#滚动选状态时钟完成连接) | 默认的滚动接线入口；不提供页面布局、章节顺序或编舞 |
| [format.mjs](../assets/mechanics/format.mjs) | `createValueFormat({ unit, divisor, digits, locale, ... })`，见[统一读数](#统一读数) | 统一显示换算与精度；统计口径和原始几何由调用方决定 |
| [geometry.mjs](../assets/mechanics/geometry.mjs) | `keyed` 校验绘制身份；`linearScale / at / mixScale` 线性尺度；`areaFor / radiusForArea` 面积计算 | 数值与几何基础，不决定分组、分母或美术 |
| [units.mjs](../assets/mechanics/units.mjs) | `quantize` 固定量拆分；`gridLayout` 格距；`groupLayout` 调用方指定分区；`stackLayout` 精确轴向堆叠；`maskSlots / pixelSlots / slotLayout` 轮廓采样与分配 | 不自动选标定或页面分区，不是通用蜂群、碰撞求解或最优路径算法 |
| [svg.mjs](../assets/mechanics/svg.mjs) | `createSvgLayer(parent, { mount, update })` 按 ID 保留绘制组，`layer.draw(pose, context)` 更新；`svgElement / setSvgAttributes` 元素操作；`imageBox / loadImages / imageSlots` 素材接口，见[用法](#素材单元) | 符号、编码、样式和交互由回调提供；采样需可读取像素的已准备素材，不执行抠图 |
| [motion.mjs](../assets/mechanics/motion.mjs) | `blendNodes` 按身份插值；`flowPoint` 可配置曲线与扰动；`createTransition / createPlayer` 时钟与帧循环 | 提供轨迹采样和打断，不自动决定构图、身份关系或运动风格 |
| [scroll.mjs](../assets/mechanics/scroll.mjs) | `selectStep` 带边界缓冲的状态选择；`observeSteps` 滚动/窗口观察 | 已由舞台控制器接入；独立控制滚动时再直接使用 |
| [bounds.mjs](../assets/mechanics/bounds.mjs) | `measureBounds(root, targets)` 测量实际占位；`checkBounds(snapshot, rules)` 检查指定关系，见[空间诊断](#按需空间诊断) | 排查越界、重叠或间距；只读当前画面，不自动排版或评分 |

现有布局返回 `Map<id, { id, x, y, area, opacity }>`，可直接接 `blendNodes`。自定义布局只需为所插值通道提供完整数值，不必复用现有坐标或排列。若作品需要图片尺寸、旋转、复杂路径等额外通道，可扩展姿态和 `blend`；源记录、语义与渲染仍分别管理。

### 统一读数

同一指标的正文、图内标注和详情复用同一个格式器。`number(value)` 只返回数字，`format(value)` 附带单位；默认缺失值为 `—`。量值坐标与统计始终使用原值，不从格式化字符串反算。

```js
import { createValueFormat } from "./mechanics/format.mjs";
const amount = createValueFormat({ unit: "万件", divisor: 10000, digits: 1, locale: "zh-CN" });
amount.number(total); // 正文和标签的对应读数共享同一 total
amount.format(total);
```

`divisor` 是显式显示换算，`digits` 是小数位；还可设 `useGrouping / signDisplay / missing / separator`。比例、百分点及不同分母分别定义，不能只改格式器单位来切换统计含义。

## 布局与权重

### 同批记录：数量与分量

下面仅演示几何准备。`records` 为已有的作品记录，包含稳定 `id` 与可信 `duration`，`bounds` 为设计确定的图形空间。文件路径假定已将机制放在作品的 `mechanics/` 下。

```js
import { areaFor } from "./mechanics/geometry.mjs";
import { gridLayout } from "./mechanics/units.mjs";

const countPose = gridLayout(records, {
  bounds, cell: reservedCell, areaOf: () => equalArea,
});
const durationPose = gridLayout(records, {
  bounds, cell: reservedCell,
  areaOf: (record) => areaFor(record.duration, pixelsSquaredPerMinute),
});
```

两次传入同一顺序、区域和格距，中心就保持不变。用完整比较范围的最大面积决定 `reservedCell`，避免变大后遮挡；容纳不下会报错，调用者需重新安排空间或明确聚合，机制不会悄悄缩小单元。`areaFor` 使用面积比例，圆半径须由 `radiusForArea` 求出；零权重仍是源记录，可由列表或详情访问。

分组时由设计确定各组区域，再分别布局；排序先按真实属性完成。`groupLayout(records, { groupBy, boundsByGroup, layout })` 接收分组函数、`Map<分组键, bounds>` 和内部布局回调 `layout(rows, { key, bounds })`。回调可以调用格子、堆叠或自己的算法，返回包含这组全部 ID 的姿态 Map；遗漏分区、丢失或替换 ID 会报错。区域的位置与大小都由作品决定。

### 量值轴与分布

横向位置可由 `at(scale, record.value)` 得到，纵向用于分组和避让。具体排布按[分布设计](unit-visualization.md#分布变化与历史参照)选择。

`stackLayout` 提供一种精确堆叠：量值方向不偏移，垂直方向按所需宽高占据槽道。`axis: "y"` 则保持纵向量值、横向避让。它按量值位置和稳定 ID 排列，不改变源记录；密度或极值超出区域时明确报错，调用者再调整空间或表达。

```js
import { stackLayout } from "./mechanics/units.mjs";

const pose = stackLayout(records, {
  bounds, scale, valueOf: (record) => record.duration,
  axis: "x", crossStart: baselineY, crossStep: -laneHeight, gap: gapPixels,
  areaOf: () => unitArea,
  // 默认按圆形预留边界；这里为居中的图片预留实际宽高。
  extentOf: () => ({ width: imageWidth, height: imageHeight }),
});
```

`crossStart` 是第一行中心，`crossStep` 的正负决定堆叠方向，绝对值应容纳与量值轴垂直方向的最大占位及间隙。`extentOf` 返回居中的占位矩形；底部等非中心锚点需预留能包住实际符号的居中范围，或使用对应的自定义布局。该算法只保证目标姿态中预留矩形不碰撞，不处理标签避让、路径碰撞或最紧密排布。

先处理真实密度、极值、相邻值和最大权重；需要更紧凑的蜂群或复杂布局时采用合适算法。固定随机种子或缓存目标位置，避免每帧重新求解导致漂移。布局在数据、尺寸或编码变化时计算，动画帧主要插值与绘制。

聚焦局部时，在一个绘制周期内计算 `scale = mixScale(oldScale, newScale, spatialProgress)`，轴刻度、阈值与保留对象的锚点都用这一尺度。`spatialProgress` 可直接是动画进度，也可由当前操作安排开始与收束时机。位置量值仍在被读取时，不再对这些锚点分别添加错峰或曲线，否则它们会暂时偏离同一把尺。

提取时把退出记录和保留记录分开：退出者可按旧尺寸在原位置淡出，保留者和参照共同展开；退出与缩放可以短暂交叠，退出对象在旧坐标失去读数意义前退出阅读重点。若中断前的点尚未到轴上，从当前可见位置接续到目标，同时衔接参照，不能在新动画第一帧强行吸附到轴。若同时换数值与尺度，分别维护两种变化；运动位置不是新的事实观测。

### 汇总量与余量

```js
import { quantize, gridLayout } from "./mechanics/units.mjs";

const packed = quantize(totals, { quantum: amountPerUnit, maxUnits: 10000 });
const pose = gridLayout(packed.units, {
  bounds, cell,
  areaOf: (unit) => fullUnitArea * unit.fraction,
});
```

`totals` 接口为 `{ id, value }[]`，只要求调用前适配，不限定源表字段。结果的每份含 `sourceId / amount / fraction`，能回查原类别；最后一份保留余量。例如总量 12.5、每份 5，得到 5、5、2.5，对应两个完整面积与一个半面积。也可用完整槽位的部分填充，但不要同时按面积和填充重复缩小。

`maxUnits` 是防止意外分配的数量上限，不是性能实测阈值。增加上限或改标定都是显式决定。缺失值不能直接传作零；零没有份额，负值需要另行设计正负量语义，本函数不支持。

占比先按正确分母计算，并处理分母为零和缺失。每份表示多少比例要写清。改标定会生成新的绘制身份；若设计需要平滑重新标定，单独安排份额的分裂、合并与量值守恒，不能直接把新旧槽位当同一人。[记录汇总与份额](#记录汇总与份额)演示按来源群组交接独立单位，不是通用的多对一运输或分裂求解器。

### 主题形象与槽位

`maskSlots(columns, rows, contains)` 采样数学形状；已有图片或 SVG 可用 `imageSlots`，它在浏览器中按原比例栅格化，再由 `pixelSlots` 读取 RGBA 像素。透明素材默认选取 alpha ≥ 128 的位置；带底色或需要特定区域时，调用方提供 `accept(r, g, b, alpha)`。这只是选取像素，不分析主体或自动去背景。

```js
import { imageSlots, loadImages } from "./mechanics/svg.mjs";
import { slotLayout } from "./mechanics/units.mjs";

const images = await loadImages([preparedAssetUrl]);
const slots = imageSlots(images.get(preparedAssetUrl), { size: 256, step: 4 });
const pose = slotLayout(records, slots, {
  bounds: squareBounds, areaOf: () => unitArea,
});
```

`size` 是栅格最长边，`step` 是采样间隔，均由素材细节与所需密度决定。槽位归一化到居中的正方形，配合正方形 `bounds` 保持比例；素材原有透明留白保留。已有 RGBA 数据可直接调用 `pixelSlots`，无需浏览器适配层。解码失败、像素不可读或筛选为空会报错。上例使用本地资源；远程图片需另以 CORS 方式解码，且来源允许跨域读取像素，再传给 `imageSlots`。

形象识别依赖内部色块或明暗时，可在 `imageSlots / pixelSlots` 中设置 `includeColor: true`，让位置附带原图的 `rgba`（四通道均为 0–255）供装饰点绘制；默认只返回坐标。`slotLayout` 仍只分配位置，统计单元的颜色由数据编码决定。

`slotLayout` 按稳定 ID 为每条记录分配一个不同槽位，槽位不足会报错。它不生成额外记录，也不处理符号碰撞、最短路径或形象识别；数量与辨识度的取舍见[母形准备](material-direction.md#主题母形的准备)。

### 素材单元

来源选择、成组准备、抠图与生成见[素材指导](material-direction.md)。实现接收已准备的素材及其记录关联、显示框和锚点约定；位置仍由布局计算，素材预加载后再进入相关状态。换图片或切回圆点时延续数据位置与记录身份。

分别处理显示框、量值几何和点击区域。按实际宽高预留空间；`gridLayout` 的圆形面积校验不能代替图片边界检查，图片可通过 `stackLayout` 的 `extentOf` 预留占位，或使用自定义布局。命中检测跟随可见姿态，详情回到对应源记录。

`createSvgLayer(parent, { mount, update })` 使用一个专用 SVG `<g>` 容器：每个 ID 首次出现时运行 `mount(group, node, context)`，以后每帧运行 `update(group, node, context)`。外层组保留身份并更新位置、透明度；内部可以是任意 SVG 元素或 `<image>`。`layer.draw(pose, context)` 的 `context` 由作品提供，适合传源记录索引、编码与交互状态。已退出的 ID 会移除，Map 顺序决定绘制层级，`dispose()` 释放该层的节点。

```js
import { createSvgLayer, svgElement, setSvgAttributes, imageBox, loadImages }
  from "./mechanics/svg.mjs";

await loadImages(assetUrls); // 解码失败给出具体 URL；不静默换成其他符号。
const layer = createSvgLayer(unitsGroup, {
  mount(group) { group.appendChild(svgElement("image")); },
  update(group, node, { recordsById }) {
    const record = recordsById.get(node.id);
    setSvgAttributes(group.firstElementChild, {
      href: record.imageUrl,
      ...imageBox(imageWidth, imageHeight, { anchorX: .5, anchorY: .5 }),
    });
  },
});
layer.draw(pose, { recordsById });
```

`imageBox` 只计算相对数据锚点的局部矩形，`anchorX / anchorY` 为 0—1；它不分析主体边界或执行抠图。上例的图片创建与更新回调可换成圆点、路径、小人或文本，不必修改绘制器。实际点击范围、详情与标签仍需按作品设计，并在连接期避免把尚未到位的几何当作新的统计读数。

## 时间与语义交接

### Update 与运动编排

将设计稿选定的[运动操作](unit-visualization.md#由前后关系设计运动)落实为当前姿态到完整目标的计划：`layout` 给出完整状态，`blend` 决定怎样形成它，播放器只负责运行。按提取、重排、汇总等关系组织群组、尺度与实例通道；ID 的保留、进入、退出只决定哪些对象参与，不能独自决定整段动作。同类关系可复用计划，不必每段重写。

例如，提取局部时，退出者沿用原姿态，保留对象、轴和阈值按[共同尺度](#量值轴与分布)展开，两者可交叠；分类重排时，先按来源与目标类别组织路径，再安排组内错峰，名称随组锚点更新。各操作的函数入口见[接线索引](#按实现难点读取接线例)。

下面演示同批记录脱离旧位置读数、按新类别重排的轨迹接线。`motionById` 按群组和两端构图生成并缓存；量值仍在被读取时使用[共同尺度](#量值轴与分布)，不附加曲线。

```js
import { blendNodes, flowPoint } from "./mechanics/motion.mjs";

function blendScene(from, to, t) {
  const nodes = blendNodes(from, to, t);
  if (t <= 0 || t >= 1) return nodes;
  for (const [id, node] of nodes) {
    if (from.has(id) && to.has(id)) {
      Object.assign(node, flowPoint(from.get(id), to.get(id), t, motionById.get(id)));
    }
  }
  return nodes;
}
```

参数为 `{ control1, control2, amplitude, turns, phase, delay }`：两个控制点选择弯曲路线，`amplitude` 为像素扰动幅度，`turns / phase` 控制局部绕动，`delay` 是归一化进度内的启动延后。扰动在两端归零，目标位置准确。只用需要的参数；曲线路径可替换为力模拟、波动场或作品自定义算法。该函数不求解碰撞、不限制画面边界，也不声明路径有数据意义，实际构图需单独检查。

**汇总接线。** 由 `quantize` 生成独立的目标份额 ID，用其 `sourceId` 对应来源群组；源记录与份额分层保存，详情仍引用各自数据。在来源分区旁形成汇总，或让来源群组收拢后将空间交给新份额；源记录保留到相应汇总可辨，类别标注跟随共有组锚点，旧量值轴单独退出。在 `blend` 中安排这些过程，不将人物与份额按槽位配成同一对象。`quantize` 只计算份额；完整数量与比例在新单位、分母和几何就位后读取。对应函数见[记录汇总与份额](#记录汇总与份额)。

整批更替使用两套独立记录 ID。若运动计划另需临时粒子，单设 ID 与角色，不进入统计或记录详情；可见临时层也纳入中途改目标和结束清理。

将控制点、错峰和稳定随机参数在开始连接时计算一次。每帧采样同一计划；快速换目标时，从播放器当前姿态生成下一计划，包括仍可见的临时层。`t = 0` 保持当前画面，`t = 1` 返回完整目标并清除全部临时和退出元素。不要只重算终点而丢掉中间姿态，也不要让旧计划在新目标后继续写入画面。

### 滚动选状态，时钟完成连接

滚动或拖动本身解释连续变量时，每个停留位置应有明确读数；其余连接由时钟自动完成。下面的 `createStage` 接入离散阅读状态，连续变量控制需另按其参数设计。

按[舞台边界](narrative-design.md#先划解释段落再决定舞台)设置容器，可在父容器内用 `position: sticky` 保留视觉区；正文按文档顺序经过或原位交接。父容器结束后，完整收束画面随页面离场，后续内容接入正常文档流。

触发标记、状态与图内说明归属各自舞台，普通图文无需接入播放器。开篇与第一项证据同台时，以引入画面为初始状态；开篇独立时，后续舞台在自己的位置接入。

在入口及需要图形回应的位置放标记，如 `data-story-state="population"`。继续解释同图无需新增标记，多个标记也可指向同一状态。正文段落与图形状态分开组织，不以一个 `copy` 字段限制解释长度；按阅读需要确定触发点和间距，自然正文对齐图形回应，原位正文保留完整可读区间。

使用 `createStage` 接入当前舞台。`stageElement` 是可测量的视觉容器，`readingFlow` 包含按文档顺序排列的触发标记；作品提供 `layout(id, { width, height })`、`blend(from, to, t)` 与 `render(pose, { progress, moving })`。布局返回完整状态，`blend` 按[运动编排](#update-与运动编排)处理单元、尺度与参照；控制器不替你选择运动风格。

```js
import { createStage } from "./mechanics/stage.mjs";

const cues = [...readingFlow.querySelectorAll("[data-story-state]")];
const stage = createStage({
  element: stageElement,
  steps: cues.map((element) => ({ id: element.dataset.storyState, element })),
  layout: poseFor,
  blend: blendScene,
  render,
  duration: connectionDuration,
});
```

默认触发线为视口高度的 `0.58`，边界缓冲为 `12px`，可通过 `viewportRatio / hysteresis` 调整；间距和阅读时长仍由作品安排。控制器按当前滚动位置首次绘制，停滚后完成连接，中途改目标从当前姿态接续，不排队补播。

自然流动的正文继续经过即可。原位正文可传 `onStep(index, { id, previousId, pose, progress, moving })`：它在首次绘制及阅读段落改变时通知，提供准备进入的图形 ID 与当前姿态。回调更新正文目标，再由 `render` 按[各层职责](#文字图例轴和单元一起交接)绘制。多个段落指向同一图形时会通知正文并重绘当前姿态，保留正在运行的动画时钟；不用再调用 `goTo`。首次回调发生在控制器返回前。

| 控制器接口 | 使用时机 |
| --- | --- |
| `stage.goTo(id, { immediate?, duration? })` | 按钮或探索选择目标；布局仍由 `layout` 计算，正文/控件由调用方更新 |
| `stage.setReadingEnabled(false / true)` | 探索暂时接管画面；恢复后按当前阅读位置选择目标 |
| `stage.refresh()` | 数据、字体或外围排版改变后重新计算当前目标；窗口和容器尺寸变化已自动处理 |
| `stage.sample()` | 读取 `{ targetId, pose, progress, moving }`；目标 ID 不代表动画已完成 |
| `stage.dispose()` | 真正卸载时释放监听与帧循环；暂时滚出视口时保留状态 |

尺寸刷新会按新空间直接重绘当前目标；固定 `viewBox` 作品可在布局函数中沿用自己的逻辑尺寸。`render` 负责绘制，不在其中再次请求目标。若已有独立状态驱动或不需要滚动，可直接用 `createPlayer(initialPose, { blend, render, duration })`，其 `goTo(pose)` 接收完整姿态而非 ID。

`blendNodes` 是数值插值基础：持续 ID 在两端之间移动，新旧 ID 在各自位置淡入或淡出。它没有分组路径、提取过程或汇总操作；这些由传入的 `blendScene` 完成。切换计量单位只需交接失效的标定，不把整个图形和仍有效的参照放进统一的先退后进分支。

### 给完整证据留下阅读区间

播放器保证停滚后抵达目标，不保证目标抵达时舞台还在视口中。触发点、动画耗时、正文位置、下一状态和 sticky 父容器的结束位置要一起安排。

每个重要连接依次核对：开始触发的位置 → 图形与必要说明完整可读的位置 → 下一状态开始或当前舞台退出的位置。普通持续滚动时，后两者之间应有实际可用的阅读区间；第一项证据与舞台末态尤其容易被跳过。不要只在精确滚到触发点后等待动画的测试中确认这一点。

若完整终点刚出现就离场，先根据原因调整：把触发点前移到对象已可辨的位置、简化过长的连接，或给承载比较的正文与图形增加合理的阅读空间。不要只把动画放慢；滚动中的读者可能更早离开。也不要用锁滚轮、强制等待或把所有段落设成相同高度来补救。

调试时记录状态触发、`render` 首次报告 `moving: false`、下一状态触发与舞台开始离场这几个时刻，并同时观察当时的图文和滚动位置。`moving: false` 只说明几何落定，必要标签未就位、正文已离开或视口已被下一段占用，都不算完整证据可读。连接没有移动时，初始完整画面同样需要阅读空间。

用户主动快速跳过仍应抵达最新状态，不排队补播或强制看完。返回关键段时重建完整证据；需要过程帮助理解时可按返回方向重新衔接。滚动标记的边界缓冲只减少抖动，不提供阅读时长。

### 主线与探索

按[叙事设计](narrative-design.md#收尾与简洁探索)确定探索问题和默认状态。进入时 `stage.setReadingEnabled(false)`，用 `stage.goTo(id)` 更新画面，沿用记录详情与图例；控制器继续处理尺寸刷新。退出时恢复希望返回的阅读位置，再 `stage.setReadingEnabled(true)`，由当前段落重新选择目标。画布、SVG 轴和命中区域都使用刷新后的同一坐标，避免探索与滚动争夺画面。

### 本地预览与资源定位

已有预览环境就沿用；没有时，运行随 skill 提供的 [preview.py](../scripts/preview.py)：

```sh
python3 /path/to/skill/scripts/preview.py serve /path/to/artifact --entry index.html
```

服务只监听本机，自动选择空闲端口，输出实际根目录、URL 和静态资源核验结果；显式 `--port` 被占用时会报错，不替换其他服务。模块与数据使用对应 MIME 类型，缺失文件返回 404。无需先读取或另写服务脚本；需要单独定位资源时才将 `serve` 换成 `audit`。

核验跟随 HTML、CSS 与 JS 中的字面量本地引用。动态路径、外部资源和未解析引用单列为待观察项；资源存在不代表 JS 执行、数据正确或画面可读，随下方同一次浏览器检查确认。

## 实现后的检查

交付前用真实数据和正文完整阅读一次；有[影响后续的设计疑问](../SKILL.md#从当前任务进入)时，提前检查该片段。修订后只复查受影响部分。

- **数据与表达。** 核对用到的总体、分母、身份、量值及缺失/余量。按[叙事标准](narrative-design.md#什么算好的叙事)与[视觉标准](unit-visualization.md#什么算好的单元可视化)连看关键段：先保留轴与图例、暂不读结论及详细数值，指出画面的主要关系；再看这些关系怎样逐步回答主问题。若只能逐项读数字，回改编码或构图；辅助图、注释作用不明时，暂去掉它，判断失去哪项理解。
- **连续阅读与交互。** 在真实浏览器正常向下读，观察关键连接的开始、中途、落定与离场。对照设计稿的操作与[动画质量标准](unit-visualization.md#什么算高质量的衔接动画)，指出哪组在被提取、重排或汇总，参照怎样延续，运动主次与节奏是否帮助看清这一过程；若设计承诺的关系只存在于终态或正文，回改连接或两端构图。核对新读数、阅读机会和自然换场，再试关键连接的反向、快速改目标及已有交互；时钟结束、终态截图不能代替过程判断。
- **实际画面。** 在桌面与笔记本可用高度查看真实正文和最拥挤构图：开篇、分析与普通正文的层级是否协调；最终字形、断行、数字与单位是否清晰，更新读数是否抖动或推挤；素材是否可辨、运动中是否遮挡或露底。按[样式指导](visual-style.md)和[素材构图](material-direction.md#把一组素材放入共同构图)定位问题。疑似重叠、越界或间距问题再用[空间诊断](#按需空间诊断)，局部修正后回看相邻内容。

在已有记录中保留关键结果、必要证据与实际观察范围；仅看过终态的连接，不记为已观察过程。设计改变则回写设计稿。区分计算核对、浏览器观察、编辑判断与读者反馈；未做实际读者测试，不把作者自查写成读者已经理解。

### 按需空间诊断

在现有阅读检查中，需要定位具体空间冲突时，直接调用无依赖的 `bounds.mjs`，无需先读源码。下例的元素由作品提供，检查正文、关键标签与图例是否保持所需间距：

```js
import { measureBounds, checkBounds } from "./mechanics/bounds.mjs";

const measured = measureBounds(stageElement, [
  { id: "copy", element: copyElement },
  { id: "key-label", element: keyLabelElement },
  { id: "legend", element: legendElement },
]);
const report = checkBounds(measured, [
  { type: "inside", ids: ["key-label", "legend"], within: "$stage" },
  { type: "separate", ids: ["copy", "key-label", "legend"], gap: 4 },
]);
// report.candidates 列出对象、越界方向或重叠量，回到画面判断是否修正。
```

- `measureBounds` 返回 `stage / viewport / items`，坐标均为相对根容器外边界左上角的渲染后 CSS 像素。HTML 与 SVG 可直接传元素；Canvas 内部对象由绘制器传 `{ id, box: { x, y, width, height }, visible }`，使用当前可见姿态换算后的同一坐标，不能直接传设备像素或逻辑坐标。
- `inside` 可用 `padding` 留边，`within` 可为已测对象、`$stage` 或 `$viewport`；`separate` 检查 `ids` 组内各对，提供 `from` 时检查两组之间。只声明需要分开的对象，有意叠加的单元和素材保留；无需检查全部粒子对。
- 返回 `checked / candidates / skipped`；隐藏或缺失对象记录为跳过，未知 ID 报错。结果是疑似问题，不是视觉通过结论。默认容忍 0.5 CSS 像素误差，可传第三参数 `{ tolerance }` 调整。

字体与素材就绪后，在疑似拥挤的画面或连接中途测量；排版改变后重测相关对象，不逐帧扫描或增加独立验收。边界是轴对齐矩形，透明留白、不规则轮廓、描边和裁剪仍需看实际画面；未声明的关系、未采样的中间帧和图文含义不在诊断范围内。

## 按实现难点读取接线例

实现选定的结构变化前，读取下列对应函数和列出的依赖；已有等效实现可复用。函数位于 [composition-model.mjs](../assets/examples/composition-model.mjs)，按名称定位即可。示例数据和全部布局集中在 `samples / makeView`，需要演示输入或布局做法时再读；页面控件、文案和素材采样不属于动画接入的必读内容。

三个记录操作共用 `recordFrame → blendGuides`：输出 `{ nodes, guides, scale, numeric, axisOpacity, ... }`，保留有效标签，只交接改变总体后的计数。`nodes` 为按 ID 索引的 `{ x, y, area, opacity, imageScale }`；`guides` 保存文字、角色、可选的分组及位置。这是本示例的帧结构，作品可按自身渲染器改造。

### 提取与尺度展开

读 `blendExtraction`、`visibleCenter` 和上述共用帧处理。输入为同批、同量纲的两个数值构图；退出者沿用原尺寸，保留对象与轴共用 `spatial` 进度，反向时补回记录。目标筛选及尺度由调用方准备。

接法：`blend: blendExtraction`。想运行示例输入可用 `makeView("A", "duration") → makeView("A", "focus")`；`space: "context" / "expand"` 对照同一筛选结果保留全域或放大局部。连续段识别、历史选择等按真实数据另行计算。

### 群组移动与分类重排

- **保持组内排列**：读 `blendGroupMove` 和共用帧处理。两端具有相同成员与组内相对位置，`groupOrigins` 给出组锚点；`groupOf(id)` 返回记录所属组，标签带 `group`。单元、名称与有效读数共享组位移。接法：`blend: (a, b, t) => blendGroupMove(a, b, t, groupOf)`。
- **改变组内排列或重新分类**：读 `blendReorder`、`visibleCenter` 和共用帧处理。`routeFor(a, b, id)` 返回本作品选择的 `flowPoint` 路径参数；数量和身份延续，失效的轴退出。接法：`blend: (a, b, t) => blendReorder(a, b, t, routeFor)`。位置仍承担读数的数值缩放用上一节。

演示页分别以 `groups → compare` 和 `whole → groups` 调用两者；`categoryRoute` 仅是两组分束与错峰的一种路线。具体分区、方向、历史编排由作品决定。

### 记录汇总与份额

先读 `makeAggregateView` 中成员、总量、分母与份额的准备，再读 `blendAggregateView` 及 `sourceAnchors`。此例用 `source` 查记录类别、`regions` 提供组范围；改造时接自己的记录索引与分区。记录与新份额保持独立身份，两层沿共有来源锚点交接。

接法：`blend: blendAggregateView`；演示输入为 `groups → totals → share`，可反向或跳转，不规定作品叙事顺序。绘制份额和查询来源只需再看 [composition.mjs](../assets/examples/composition.mjs) 的 `aggregateLayer`。本例汇总完整样本；继续提取贡献者时还需保留成员贡献。

### 独立样本更替

读 `blendStudy` 及其路径函数 `fieldPoint / studyRoute / phaseOf`，接法为 `blend: blendStudy`。两套独立 ID 决定新旧记录；路径函数用本例的 `source` 和 ID 安排类别与错峰，改造时接自己的记录索引和路线。群组、尺度和有效统计由调用方延续，需要同时比较时另保留旧分布。

### 必要的绘制与调用

以上函数都接收 `from, to, t`，返回当前完整帧，兼容 `createPlayer` 或 `createStage`。以提取为例，`before / after` 是调用方已经准备的两端构图，`render` 消费当前帧：

```js
const player = createPlayer(before, { blend: blendExtraction, render });
player.goTo(after, { duration: connectionDuration });
```

- **图形与参照的接线**：读 [composition.mjs](../assets/examples/composition.mjs) 的 `drawEvidence`，同一帧更新单元、汇总层、标注、刻度及阈值。只有需要创建相应 SVG 层时，再看 `captionLayer / aggregateLayer / layer`。
- **正文与滚动的接线**：只有需要这部分时，读 [reading.mjs](../assets/examples/reading.mjs) 的 `createStage` 调用、`onStep / showReading / showSampleSummary`。同图换文不重启动画，同批重排保留有效统计，文档流安排停留与离场。

现有演示直接调用上述函数，可在[组合示例](../assets/examples/index.html)中观察效果；多种操作的接续查 `blendView`。路径、坐标和节奏属于示例设计，不是默认预设。按作品的数据密度与比较方向改造，未覆盖的关系继续按[运动编排](#update-与运动编排)推导；读代码不要求启动或通读演示。
