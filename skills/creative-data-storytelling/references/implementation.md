# 实现参考：按当前问题取用

按当前实现问题查接口；已从示例进入对应用法时，无需返回本页。

## 改编示例

`inspect <id>` 提供改编范围、源码入口和复制清单；按 `entryLines` 读取所需函数，页面装配变化时再读 HTML。关系不变时可保留模型与过渡，只换绘制和正文；改用不同编码时，相应几何仍需重算。采用代码时连同 `copyAlongside` 复制依赖，保持相对目录或同步修改引用。

## 按实现问题取用代码

| 当前实现问题 | 接口说明与接法 |
| --- | --- |
| 新建滚动舞台 | [基本接入与尺寸](implementation-stage.md#基本接入与尺寸)，再选下方一种正文接法；默认用 `connectReading`，无需先读源码 |
| 正文自然滚动，图形停留 | [自然滚动短例](implementation-stage.md#正文自然滚动)：DOM、绘图区、触发标记与末段退出一起接通 |
| 正文固定，随状态交接 | [固定正文短例](implementation-stage.md#正文固定交接)：阅读轨道、首次显示、换段与退出；与上例共用极小绘图 |
| 已有可靠接线，只需补充或排错 | [底层 createStage / observeSteps 与诊断入口](implementation-stage.md#底层接法与排错) |
| 末段正文仍在阅读，舞台已经滚走 | 按[自然滚动](implementation-stage.md#正文自然滚动)或[固定正文](implementation-stage.md#正文固定交接)核对 `exit` 的结构条件；已有底层接线才单独使用 `reserveStageExit` |
| 独立播放、中断与反向 | [createPlayer](implementation-stage.md#自动完成的衔接动画) |
| 图文共用读数；稳定更新 SVG | [createValueFormat / createSvgLayer](implementation-rendering.md#共用读数格式与-svg-更新) |
| 实际终态、读数和布局的按需检查 | [createInspection](implementation-rendering.md#实际占位与空间诊断)；复用当前浏览器工具操作与取证 |
| 舞台没有按窗口剩余空间布局 | [可用空间接法](implementation-stage.md#可用空间与实际绘图区)；容器尺寸传给作品几何 |
| 轴、标记与素材同步映射或缩放 | [共同尺度、插值与锚点](implementation-geometry.md#几何) |
| 保留历史并聚焦局部 | [显露范围与定位窗口](implementation-geometry.md#历史与当前从同一状态生成) |
| 可加总部分展开或接入基底 | [accumulationSegments](implementation-geometry.md#组成与累积的区间几何) |
| 两期量值转为增减比较 | [端点到差值](implementation-geometry.md#两期端点到差值) |
| 同批单元重组、分布或权重布局 | [布局、身份与槽位](implementation-geometry.md#主题轮廓与单元重组) |
| 解释标注随对象交接 | [blendWithAnnotations](implementation-geometry.md#让解释标注与对象一起交接) |
| 跳章节或进入简洁探索 | [navigate 与 explore / resume](implementation-stage.md#探索交接与控件)：分别处理阅读位置和同舞台的临时控制 |
| 静态 HTML、主题样式、预览与交付 | [工具与交付](implementation-delivery.md) |
| 需要双击可用的单 HTML，保留可编辑源码 | [本地离线打包](implementation-delivery.md#按需打包为单-html) |

每个示例集中在 `assets/examples/<id>/`：`scene.mjs` 提供数据与动画，`index.html` 提供页面装配与设计解释，专用素材在 `images/`。

## 直接复用与参考的边界

- [assets/runtime/](../assets/runtime/) 是可直接复制、导入的控制与计算模块。按所选接法或示例复制清单带齐依赖；先读接口，排错或扩展时再查源码。
- [示例总览](../assets/examples/index.html)只供浏览导航，各示例在自己的页面运行。局部机制共用 [mechanism.css](../assets/examples/mechanism.css) 的预览与控件样式；需要外观接法时选读，并按作品主题改写。

已有项目工具能可靠承担相同职责时可沿用。页面阅读与交互统一按[作品验收](quality.md)检查，稳定计算或控制行为按实际风险验证。
