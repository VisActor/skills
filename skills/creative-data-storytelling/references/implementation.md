# 实现参考：按当前问题取用

本页将已确定的解释过程落实为布局、过渡与绘制。设计阶段按[选择表](design.md#从追问选择表达)理解相关参照；实现时优先取用适用的运行接口与示例实现，按需要改编。

## 将解释过程接入作品

- 改编示例时，从 `inspect <id>` 的 `adapt` 确认改动范围，用 `root`、`read.code.file` 与 `entryLines` 定位相关的数据、布局、过渡或绘制代码；调整页面装配时再读 `read.layout`。采用本例时连同 `copyAlongside` 复制所需依赖和素材，保持相对目录或同步修改引用。
- 对象 ID、正文读数、图形几何与强调从自己的数据生成。沿用示例结构时，仍按实际对象数量、标签与数值范围调整；修改编码则同步修改轴、标注和运动，保留选定的解释关系。
- 接入已有舞台时，使用前段当前对象与姿态作为起点，将后续状态接入同一更新入口；同一属性由一套控制机制驱动。独立舞台可分别控制，身份色与主题前后协调，可比较的量值使用一致口径；改用其他指标时交代变化。
- 将正文与图形放进整篇的[阅读空间](design.md#主画面与阅读空间)，保留需要的交互，移除演示作者说明和重复入口。停留与退出按实际正文安排；原演示的页面高度不直接当作新作品参数。

完整片段与基础示例沿用同一接入方式。重新设计的构图也可借用其中的尺度、对象匹配或过渡；下表定位实际需要的运行接口，各接口页保留必要的调用示范。

## 按实现问题取用代码

| 当前实现问题 | 接口说明与接法 |
| --- | --- |
| 滚动选择状态，连接自动完成 | [createStage / observeSteps](implementation-stage.md#文字滚动与舞台更新) |
| 末段正文仍在阅读，舞台已经滚走 | [reserveStageExit 与 reading-tail](implementation-stage.md#最后画面读完再退出) |
| 独立播放、中断与反向 | [createPlayer](implementation-stage.md#自动完成的衔接动画) |
| 图文共用读数；稳定更新 SVG | [createValueFormat / createSvgLayer](implementation-rendering.md#共用读数格式与-svg-更新) |
| 最终检查中的越界或遮挡测量 | [measureBounds / checkBounds](implementation-rendering.md#实际占位与空间诊断) |
| 轴、标记与素材同步映射或缩放 | [共同尺度、插值与锚点](implementation-geometry.md#几何) |
| 保留历史并聚焦局部 | [显露范围与定位窗口](implementation-geometry.md#历史与当前从同一状态生成) |
| 可加总部分展开或接入基底 | [accumulationSegments](implementation-geometry.md#组成与累积的区间几何) |
| 两期量值转为增减比较 | [端点到差值](implementation-geometry.md#两期端点到差值) |
| 同批单元重组、分布或权重布局 | [布局、身份与槽位](implementation-geometry.md#主题轮廓与单元重组) |
| 解释标注随对象交接 | [blendWithAnnotations](implementation-geometry.md#让解释标注与对象一起交接) |
| 叙事与简洁探索共用入口 | [控制交接与控件](implementation-stage.md#探索交接与控件) |
| 静态 HTML、主题样式、预览与交付 | [工具与交付](implementation-delivery.md) |

每个示例集中在 `assets/examples/<id>/`：`scene.mjs` 提供数据与动画，`index.html` 提供页面装配与设计解释，专用素材在 `images/`。

## 直接复用与参考的边界

- [assets/runtime/](../assets/runtime/) 是可直接复制、导入的控制与计算模块。先读接口，只有排错或扩展时再查源码。相对依赖为 `stage → motion / scroll`、`motion / units / svg → geometry`，其他模块无内部依赖。
- 目录的 `kind: story` 表示完整解释片段，`kind: mechanism` 表示局部机制。`inspect` 的本地路径相对返回的 `root`；按 `read` 与 `copyAlongside` 复制本例及所需依赖，无需复制其他示例或总览。
- [示例总览](../assets/examples/index.html)只供浏览导航，各示例在自己的页面运行。局部机制共用 [mechanism.css](../assets/examples/mechanism.css) 的预览与控件样式；需要外观接法时选读，并按作品主题改写。

已有项目工具能可靠承担相同职责时可沿用。页面阅读与交互统一按[作品验收](quality.md)检查，稳定计算或控制行为按实际风险验证。
