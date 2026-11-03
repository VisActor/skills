# 读数、渲染与占位

实现图文共用读数、SVG 更新或排查空间时读本页。舞台调度见[舞台接线](implementation-stage.md)，布局计算见[关系几何](implementation-geometry.md)。

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

`setSvgAttributes` 只更新传入属性，`null / undefined` 移除属性；`svgElement(tag, attributes, text)` 将文本作为文字写入。[端点到差值](implementation-geometry.md#两期端点到差值)将格式化、稳定节点与播放器接在同一段代码里；[comparison.mjs](../assets/examples/comparison.mjs) 的 `renderQuantitative` 另示范轴、点和标注分别更新。

### 实际占位与空间诊断

HTML 标题、SVG 标签、图片与定位条共用舞台时，可直接用 [bounds.mjs](../assets/runtime/bounds.mjs) 读取实际边界；按自己的构图声明需要保持的空间关系。测量只读当前画面，不改样式、不重排对象，也不启动浏览器或动画：

```javascript
import { measureBounds, checkBounds } from "./runtime/bounds.mjs";

const labels = [...graphic.querySelectorAll("[data-label]")]
  .map((element) => ({ id: element.dataset.label, element }));
const measured = measureBounds(graphic, [
  ...labels, { id: "locator", element: graphic.querySelector(".locator") },
]);
const report = checkBounds(measured, [
  { type: "inside", ids: labels.map((item) => item.id), within: "$stage" },
  { type: "separate", ids: labels.map((item) => item.id), from: ["locator"], gap: 4 },
]);
// report.candidates 给出具体对象及越界方向／重叠量；回到画面判断是否需修正。
```

- `measureBounds(root, targets)` 返回 `stage / viewport / items`，全部是**相对 root 外边界左上角的渲染后 CSS 像素**。HTML 与 SVG 已通过浏览器实际边界统一，不能再当作 SVG viewBox 坐标或 Canvas 设备像素。每项使用唯一 `id`；也可传 `{ id, box: { x, y, width, height }, visible }`，由 Canvas 等绘制器提供已换算的舞台相对边界，结果会标明 `supplied`。
- `inside` 检查 `ids` 是否位于 `within` 内，可用 `padding` 留边；`within` 可以是另一个已测量对象、`$stage` 或 `$viewport`。`separate` 检查两组对象；省略 `from` 则检查 `ids` 组内各对，可用 `gap` 保留矩形间距。只检查声明的关系，有意覆盖的素材不加入分离规则。
- 返回 `checked / candidates / skipped`，不提供“视觉通过”评分。缺失元素与隐藏元素分别记录；未知 ID 报错。默认容忍 0.5 CSS 像素误差，可通过第三参数 `{ tolerance }` 调整。

需要排查空间或核实可用面积时，在现有阅读检查中采样；页面重排后重新测量，不逐帧运行或增加单独验收阶段。边界是轴对齐矩形，并非实际着色区域：透明图片、斜线、描边、阴影、裁剪和不规则遮罩仍需看实际画面；未声明的关系、未采样的中间帧也不在结果中。演示页的“作者工具：当前占位”仅展示接法，正式作品无需带上该面板。

## 渲染选择

SVG 适合精确尺度、路径、少量至中等数量可单独交互的标记；Canvas 可承担大量重复单元；HTML 承担正文、控件与语义详情。按实际规模测量，不规定未经验证的数量阈值。Canvas 的可访问性、命中检测与文本需另行设计。

能用已有库可靠表达时可以用库；需要自定义身份和时间编排时，可直接算几何。不要为了统一技术把艺术细节全部手绘成复杂 SVG，也不要用图片替代可测量的轴与标记。
