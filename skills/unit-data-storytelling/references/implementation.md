# 单元表达的实现参考

实现承接设计稿中的追问、数据关系、表达选择与连接。先沿[表达与衔接](unit-visualization.md#从叙事追问推导表达与衔接)确定操作，再按下方接口直接调用所需模块。布局、编码、运动路径与各层交接由作品设计；舞台控制器负责滚动、时钟、刷新和清理。只有接线不清楚、调试或扩展接口时，再查看对应示例或源码。

## 渲染与数据分工

SVG 适合需要逐个交互、清晰文本和路径的单元；Canvas 适合大量频繁重绘的符号；HTML 适合正文、图片和记录详情。可以组合，也可以只用一种。用真实数量与最密集状态判断表现，不以某个固定点数作为技术分界。

静态单元图可直接计算布局并绘制；需要动态变化或交互时，将三层分开：

- **源记录与派生数据**：对象身份、观测时期、属性、来源、权重和总体。详情读取这里，保留真实数值。
- **阅读状态**：本步追问与比较关系、参与集合、历史参照、分组/排序、编码、量值尺度、关联正文段落与图例。
- **绘制姿态**：每个绘制实例的 `x / y / area / opacity` 等。插值改变姿态，不把过渡数值写回源数据。

正文关键读数与图内标签取自同一份计算结果，共享单位与格式，见[统一读数](#统一读数)。动态实现为每个状态计算完整结果，直接进入、反向返回与顺序抵达应一致。累积历史来自该状态的数据选择，不能只靠“每次前进追加一些点”的副作用维持。

一个源对象可有多个绘制实例。需要同时展示多标签时，可用 `JSON.stringify([entityId, role])`；需要同时比较两期时，再加观测窗口。只更新同一实例的观测时保持实例 ID，另存观测与来源；ID 编码由数据关系决定。机器中的 ID 延续，还需要读者可见的强调、标签或参照。

## 文字、图例、轴和单元一起交接

接线前，把选定操作落实到绘制层：提取改变参与集合，重排改变位置，换权重改变对应通道，缩放同步尺度与锚点。正文与参照按其解释职责交接；同一 SVG 或 Canvas 内也可以分别更新，不必为每层建立独立组件。

| 内容 | 连接中怎样处理 |
| --- | --- |
| 仍有效的对象与参照 | 类别、单位、比较基准、必要历史及仍成立的统计继续可读；尺度或位置变化时，同步相应几何 |
| 正在变化的对象 | 只更新本次操作涉及的实例与通道；绑定标签跟随当前姿态并避让，名称、时期与真实数值仍来自源记录 |
| 正文与引导 | 自然流动的正文继续经过；原位正文与图形变化交叠推进，追问和操作可先引导，结果判断随证据成立 |
| 失效或离场的内容 | 单独退出或替换。提取局部时，退出记录不因选中对象放大而一起变大；退出动作由其职责决定，不继承另一批对象的新编码 |
| 新增读数与结果 | 依据的对象、尺度和标注位置可读时进入；一次只延后尚未成立的结果，仍有效的旧读数可带明确时期保留 |

例如，同批记录改权重时，数量统计与分类可能一直有效；总体提取局部时，选中对象展开，其余保留为背景还是退出，由下一追问决定。持续参照、正文和结果不共用一个 `moving` 显隐开关：各层可以同时演进或局部错开，不能先清空辅助内容、等所有单元落定后一起恢复。

状态可包装为 `{ nodes, guides, scale, ... }`：`guides` 按稳定 ID 存放名称、端点和读数的姿态，原始文本与数值不随像素位置插值。整组移动时共享组锚点的位移；绑定某个端点的标签从当前端点计算位置。只更新涉及的坐标或内容，不在目标改变时清空重建整层。新增或失效标注单独交接；`moving` 只用于确实需要等证据到位的结果。中途换目标时，从当前可见姿态接续，并取消过时的文字任务。

图例含义在变时，明确交接标定，不能只延续同一种颜色。Canvas 命中检测基于当前可见姿态，详情返回其关联观测，不从未来终点的位置寻找记录。

## 可按需取用的模块

先读所需接口与本页最小用法，将模块及其本地依赖复制到作品后直接 `import`；无需通读 `assets/` 或改写模块内部。模块均为无第三方依赖的 ES modules。页面结构、布局函数、符号与运动分别由作品提供，可组合这些模块，也可沿用项目已有的等效工具。

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

分组容器的面积本身没有数据意义。换时期比较时，格距和单位若改变，需要清楚交接；同屏比较应保持可比。

### 量值轴与分布

横向位置可由 `at(scale, record.value)` 得到，纵向用于分组和避让。精确值堆叠、分箱堆叠与蜂群各有取舍：精确堆叠不挪动量值位置，蜂群更紧凑但可能需要横向避让，分箱改变了可读精度。按问题选择，标定与详情保持一致。

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

占比先按正确分母计算，并处理分母为零和缺失。每份表示多少比例要写清。改标定会生成新的绘制身份；若设计需要平滑重新标定，单独安排份额的分裂、合并与量值守恒，不能直接把新旧槽位当同一人。本版未封装通用的多对一份额运动。

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

`slotLayout` 只按稳定 ID 分配实际记录，每条占一个不同槽位；槽位不足会报错，不复制记录填形。若轮廓需要更密的装饰点，独立绘制，进入统计画面时再交接真实单位。采样不保证符号互不重叠、路径最短或形象可辨；按实际记录数、符号尺寸与显示区域检查。稀疏记录可以简化母形或换静态素材，无需强求点阵造型。

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

先按[更新关系](unit-visualization.md#由前后关系设计运动)准备对应，再将[视觉操作](unit-visualization.md#设计旧结构怎样打开新结构怎样形成)落实到通道：布局给出完整状态，运动计划决定从当前画面怎样形成该状态，播放器只运行计划。按操作选择或组合实现，相同关系可以复用；具体构图与节奏由作品调整，不能用一个“换图”分支代替全部过程。

例如，局部提取可让退出先启动、尺度展开随后跟进，两者重叠；分类重排可按类别分束、组内错峰，类别名称随分区到位；数值缩放则让全部锚点与轴共用空间进度。正文在连接开始时交接追问，已有名称和有效参照继续绘制；只有依赖尚未形成集合的结果需要等待。各层共用帧循环，按自身职责更新。时长与错峰参数由两端距离、密度和阅读职责决定，不规定全篇共用的阶段比例。

下面示范同批记录脱离旧位置读数、按新类别重排时如何接入轨迹。`motionById` 由作品按群组和两端构图生成并缓存；量值仍在被读取的轴向缩放使用[共同尺度](#量值轴与分布)，不附加这样的曲线。

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

**从记录转为汇总份额时，沿来源群组交接。** 源记录层保留到对应汇总可辨，新份额层用独立 ID 与正确标定生成；类别名称和分区作为两层共有的参照。可以在对应组旁形成份额，再将空间交给汇总比较；也可以由来源群组收拢、让汇总沿共同基线展开。两层的进入退出按群组安排，旧量值轴单独交接。中间姿态只说明汇总过程，完整数量和比例在新标定就位后读取。`quantize` 负责计算份额，不会自动完成这一编排。

整批更替时，旧记录和新记录分别处理进入退出；它们可以共享作品设计的运动场、分组节奏或局部揭示方式。需要艺术衔接时再增加独立的临时层，其元素使用自己的 ID 和角色，不进入统计、记录详情或个体轨迹。期间明确当前在换样本，在终点恢复新时期、样本量和读数。几何位置可用于安排路径，不能据此把旧人认作新人；无需额外粒子的设计直接处理两批记录即可。

将控制点、错峰和稳定随机参数在开始连接时计算一次。每帧采样同一计划；快速换目标时，从播放器当前姿态生成下一计划，包括仍可见的临时层。`t = 0` 保持当前画面，`t = 1` 返回完整目标并清除全部临时和退出元素。不要只重算终点而丢掉中间姿态，也不要让旧计划在新目标后继续写入画面。

### 滚动选状态，时钟完成连接

依据[叙事阶段确定的舞台边界](narrative-design.md#先划解释段落再决定舞台)设置容器。可让视觉容器在一段解释的父容器内 `position: sticky`；正文按文档顺序经过或在舞台内交接。同台变化更新参与集合、尺度与几何，并交接说明；父容器结束后，完整的收束画面随页面离开，下一段正文或舞台接入正常文档流。

将触发标记、状态更新和图内说明限定在所属舞台；播放器与渲染器可以复用，状态归属仍需明确，普通图文无需接入播放器。开篇若与第一项证据共用舞台，初始状态就是设计好的引入画面；若单独排在前面，后续舞台在自己的位置接入。

在舞台入口及需要图形回应的位置放触发标记，例如 `data-story-state="population"`。继续解释同一画面的文字无需增加标记；多个标记也可指向同一状态。正文段落和图形状态分别组织，允许多段解释共用一幅图，不以一个 `copy` 字段限制解释长度。触发位置和段落间距来自阅读与观察需要，不统一按一屏分段。自然流动的正文要与图形回应的位置对齐；原位交接的正文要保留完整可读区间，避免画面未到位就宣布下一项结论。

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

交付前合并为一次完整阅读；若[流程中确有待验证的设计疑问](../SKILL.md#从当前任务进入)，在该片段实现时提前检查相关维度。直接使用实际页面、真实数量与正文，判断构图和承接是否支持追问。修订后只复查受影响部分，无需逐段开检查流程、穷举组合或另做评审页面。

- **数据与表达。** 按用到的编码核对总体、分母、身份、量值及缺失/余量处理。沿设计稿的追问，指出[数据关系怎样成为可见证据](unit-visualization.md#从叙事追问推导表达与衔接)，判断画面操作是否帮助推进认识；按[叙事标准](narrative-design.md#什么算好的叙事)与[视觉检查](unit-visualization.md#单元可视化的阅读检查)定位问题，调整表达、顺序或主张。
- **连续阅读与交互。** 在真实浏览器正常向下读，观察关键连接的开始、中途、落定与离场：有效参照持续可读，正文及时引导，新读数与证据相符，重点比较留有阅读机会，自然换场接得上。另试关键连接的反向和快速改目标，核对实际提供的跳转、详情或探索返回；不以逐节点停滚截图代替正常阅读。
- **实际画面。** 在桌面与笔记本可用高度检查真实正文和最拥挤的构图，关注极值、长标签、素材边缘及注释遮挡；按[样式检查](visual-style.md#用真实画面检查样式)核对字形和数字排版，同时观察运动与操作是否流畅。疑似遮挡或越界可用[空间诊断](#按需空间诊断)定位；局部修正后回看相邻内容。

在已有记录中保留关键结果、必要证据与实际观察范围；设计改变则回写设计稿。区分计算核对、浏览器观察、编辑判断与读者反馈；未做实际读者测试，不把作者自查写成读者已经理解。

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

需要组合代码参考时，再按本次难点读取匹配函数及必要调用处；没有匹配示范的操作，依据[运动编排](#update-与运动编排)单独设计。下面是接线入口，不是可用设计的全集：

| 实现难点 | 示例入口 |
| --- | --- |
| 全域与局部怎样分配空间，提取时如何先选择再展开 | [composition-model.mjs](../assets/examples/composition-model.mjs) 的 `makeView` 中 `space` 只改变同一筛选结果的尺度与符号占位；`blendView` 的 `extracting / spatial` 让退出与展开交叠，并用同一进度更新保留对象和轴 |
| 已形成的群组怎样连同有效读数一起移动，再按个体属性展开 | 同文件 `makeView` 为 `groups / compare` 保留组锚点；`blendView` 的 `groupOrigins` 给组内单元、名称和数量同一位移。改看 `duration` 时再解除整组约束，重排个体；`composition.mjs` 的 `captionLayer` 保留标注节点并更新其姿态 |
| 分类重排怎样显出旧集合分成新群组 | 同文件 `blendView` 中目标为 `groups / compare` 的分支按类别设计路径、按记录安排错峰；已排好的同一群组先走整组位移分支。类别色与 ID 延续，路线参数属于示范 |
| 两批没有逐项对应的记录怎样更替 | 同文件 `blendStudy` 的仅存在于 `from / to` 的分支，以及 `fieldPoint`：两批使用独立 ID 和路径，退出与汇入交叠；调用方延续有效的类别与基准 |
| 单元、轴、标注和说明共同更新 | [composition.mjs](../assets/examples/composition.mjs) 的 `render` 使用同一尺度并将标注绑定当前单元；`showCopy` 在连接开始时交接说明。素材轮廓采样见 `start`，候选位置与实际记录数分开 |
| 滚动选择、同图换文、反向返回与自然离场 | [reading.mjs](../assets/examples/reading.mjs) 调用 `createStage`，`onStep / showReading` 选择正文，`render` 分层绘制；`showSampleSummary` 在同批重排时保留统计，只在独立样本更替时等待完整集合。同图换文不重启动画，停留与离场由文档流安排 |

需要观察效果时再打开[组合示例](../assets/examples/index.html)或[滚动阅读示例](../assets/examples/reading.html)。组合示例的「类别数量 → 群组靠近 → 使用月数」可观察整组移位与组内重排的差别；「提取」可对照全域与局部的空间取舍。通过已有静态预览环境加载 ES modules，保留相邻的 `mechanics/` 目录；取用代码不要求先启动演示。示例的合成数据、控件、顺序、布局和路径用于说明接线，作品自行设计。
