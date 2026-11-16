# 读数、渲染与占位

实现图文共用读数、SVG 更新或排查空间时读本页。舞台调度见[舞台接线](implementation-stage.md)，布局计算见[关系几何](implementation-geometry.md)。

## 渲染选择

连续舞台优先采用 SVG：精确尺度、路径、素材与可单独交互的标记由同一姿态更新；Canvas 可承担大量重复单元；HTML 承担正文、控件与语义详情。按实际规模测量，不规定未经验证的数量阈值。Canvas 的可访问性、命中检测与文本需另行设计。

ECharts 等整图配置库不作为连续舞台的默认实现，以免各状态重新生成独立图表。D3 的尺度、布局或数据绑定可按需使用；已有库能保留所需对象和过渡时也可沿用。素材可用静态图片配合 SVG 定位，不需要把艺术细节全部手绘成路径，也不用图片替代可测量的轴与标记。

## 数据、布局和控制分开

静态图可由整理后的数据直接计算几何并渲染；需要动态变化或交互时，再接入状态与控制机制：

```text
来源记录与口径 → 选择对象／观测 → 完整阅读状态 → 目标几何
                                     ↑            ↓
滚动选择／探索输入 ───────────────────┘     当前姿态 → 时间过渡
                                                   ↓
                                         图形、素材、轴与说明
```

文件数和字段名自定。目标几何独立计算，动画不改写数据事实。正文关键读数与图内标签取自同一份计算结果，并共用当前解释所选的显示单位、换算系数和精度设置，用同一格式化函数生成对应文本。计算和图形几何使用未舍入的数值，格式化只用于显示。动态更新时，年份、数值与相关说明随当前状态同步；静态图保留自身的比较口径。小作品不需要框架或多层抽象。

将[主题颜色](material-direction.md#主题与颜色)和[文字角色](material-direction.md#中英文与数字的排版)集中配置。HTML 与 SVG 可直接引用同一组 CSS 变量，Canvas 在初始化或主题改变时读取这些值；避免在样式表和渲染代码中分别维护同一色值或字体。类别与颜色的对应也由同一份配置提供，具体变量名按作品选择。

### 共用读数格式与 SVG 更新

[format.mjs](../assets/runtime/format.mjs) 的 `createValueFormat` 固定本段解释的显示单位、换算系数与精度；不会随每个数字大小自动换单位。`number(value)` 返回读数，`format(value)` 另附单位；`null / undefined` 显示缺失符号，非法计算结果报错，避免当成零。

[svg.mjs](../assets/runtime/svg.mjs) 的 `createSvgLayer` 接受 keyed Map 或含唯一 `id` 的记录序列，管理一个独立 `<g>`：进入时调用 `create`，后续帧只 `update`，当帧姿态不再包含该 ID 时才移除。`create` 返回新建 SVG 元素，可带作品自己的子元素和事件；节点与事件保留，事件中用 `marks.data(id)` 读取当前记录。它沿用现有播放器，不另开时钟；已有 D3 join 等更新机制时无需叠加使用。

`setSvgAttributes` 只更新传入属性，`null / undefined` 移除属性；`svgElement(tag, attributes, text)` 将文本作为文字写入。[端点到差值](implementation-geometry.md#两期端点到差值)将格式化、稳定节点与播放器接在同一段代码里；[comparison/scene.mjs](../assets/examples/comparison/scene.mjs) 的 `renderQuantitative` 另示范轴、点和标注分别更新。

### 实际占位与空间诊断

出现目标、画面或尺寸不同步时，先区分两种观测：`connection.stage.status()` 的 `target: { id, revision }` 是请求；`rendered: { revision, final }` 是最近一次同步 render 成功返回的记录，同一 revision 且 final 为真才表示该请求已提交终态。`size / error / disposed` 辅助定位；同一状态换参数或显式刷新也会使旧绘制失效。`stage.sample()` 按时钟返回当帧姿态与 moving，时间已到不保证终态实际画过；以上都不代替图文与素材的视觉验收。

简单页面沿用浏览器观察或 DOM 测量即可。[bounds.mjs](../assets/runtime/bounds.mjs) 可独立调用；需要诊断终态、过期帧／尺寸或异步更新时，再用 [inspection.mjs](../assets/runtime/inspection.mjs) 的 `createInspection`。只声明本次有风险的读数、对象与空间关系，不配置全页测试；未调用时不扫描页面。诊断在开发时按需启用，正式成品默认不带检查实例或面板，舞台自身的状态与错误记录保留。

```javascript
import { createInspection } from "./runtime/inspection.mjs";

const inspection = createInspection(connection, {
  root: stagePanel, // connection 来自 connectReading；复制 inspection.mjs 与 bounds.mjs
  checks: ({ target }) => ({
    targets: [
      { id: "answer", element: "#answer", expected: answerFor(target.id) },
      { id: "controls", element: "#controls" },
    ], // answerFor 从当前数据与口径计算，不从 DOM 反抄预期值
    bounds: [{ type: "separate", ids: ["answer"], from: ["controls"] }],
  }),
});
// 浏览器实际滚动/操作后，明确期待的状态；同一状态换数据可加 after: 操作前的 revision。
const report = await inspection.capture({ target: "comparison", timeout: 2500 });
// 浏览器默认读下方 DOM 简报；report 保留详细测量供代码定位，仍看实际画面。
// 卸载时 inspection.dispose()。
```

`checks` 在本次目标实际画完后求值；选择器或元素函数每次测量重新解析。`expected` 来自数据与口径，可为字符串或有限数值，默认核对 textContent，控件可传 `read: el => el.value`。与渲染共用计算只验证状态同步，数据正确性沿用独立核验，不重复实现每个公式。非当前状态的项标记 `when: false`；需要核对集合时再加 `groups: [{ id, elements: 选择器, expected: 数据ID数组, key: el => el.dataset.id }]`，检查挂载身份、数量与重复，不证明编码或可见性。

采集等待指定 `target` 的实际终态、容器尺寸一致和声明对象的两次稳定观测；只等待声明对象用到的 HTML 图片或文字字体。`captured` 表示已采集，读数错误、缺失和越界仍会报告；不等于通过。未完成区分 `timeout / superseded / error / disposed`，超时的 `pending` 给出未满足条件及最后观测值，不推断根因。同一条件未改变时先定位，不重复采集、延长超时或为通过检查而改正常动画。

`script#story-inspection[type="application/json"]` 默认只发布状态、实际窗口、检查覆盖和问题简报；未声明的内容不在覆盖内。`capture` 仍返回详细结果，调试时传 `detail: true` 也可将完整 JSON 发布到该节点。支持页面脚本的工具可设置 `data-request='{"target":"comparison"}'` 并派发 `story-inspect`；只读工具沿用开发预览按钮，再读取节点。核对 `captureId` 与目标，避免读旧报告；[工程演示](../assets/stage-wiring/index.html?inspect)已有按钮接法。

- 底层 `measureBounds(root, targets)` 返回 `stage / viewport / items`，全部是**相对 root 外边界左上角的渲染后 CSS 像素**。HTML 与 SVG 已通过浏览器实际边界统一，不能再当作 SVG viewBox 坐标或 Canvas 设备像素。每项使用唯一 `id`；Canvas 等绘制器可直接调用底层接口并传 `{ id, box: { x, y, width, height }, visible }`，提供已换算的舞台相对边界，结果标明 `supplied`。
- `inside` 检查 `ids` 是否位于 `within` 内，可用 `padding` 留边；`within` 可以是另一个已测量对象、`$stage` 或 `$viewport`。`separate` 检查两组对象；省略 `from` 则检查 `ids` 组内各对，可用 `gap` 保留矩形间距。只检查声明的关系，有意覆盖的素材不加入分离规则。
- 返回 `checked / candidates / skipped`，不提供“视觉通过”评分。缺失元素与隐藏元素分别记录；未知 ID 报错。默认容忍 0.5 CSS 像素误差，可通过第三参数 `{ tolerance }` 调整。

选择实际承载数据的局部标记或标签，不能只拿全屏 SVG／Canvas 容器与正文比较；背景延展在正文下方可能是有意设计。需要时按相同方式加入导航、图标题或标签之间的规则；正常滚出视口的正文不要求始终位于 `$viewport` 内。

在当前字体和素材实际显示后采样，重排后只复查受影响处。`checked` 为零或对象在 `skipped` 中，不能当成“无重叠”。边界是轴对齐矩形，并非着色区域：透明素材、描边、裁剪等仍需看图；Canvas 需由绘制器提供内容边界。
