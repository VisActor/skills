# 实现参考：按当前问题取用

按当前实现问题查接口；已从示例进入对应用法时，无需返回本页。

## 改编示例

`inspect <id>` 提供改编范围、源码入口和复制清单；按 `entryLines` 读取所需函数，页面装配变化时再读 HTML。关系不变时可保留模型与过渡，只换绘制和正文；改用不同编码时，相应几何仍需重算。采用代码时连同 `copyAlongside` 复制依赖，保持相对目录或同步修改引用。

## 按实现问题取用代码

| 当前实现问题 | 接口说明与接法 |
| --- | --- |
| 新建滚动舞台，接通正文、箭头、动画、尺寸更新和出口 | 默认导入 `assets/stage-wiring/connect.mjs` 的 `connectReading`；[参数与调用示例](implementation-stage.md#文字滚动与舞台更新)，无需先读模块源码 |
| 已有滚动接线，只需补充或排错 | [底层 createStage / observeSteps](implementation-stage.md#文字滚动与舞台更新)；保留可靠接线 |
| 末段正文仍在阅读，舞台已经滚走 | 配置 `connectReading({ exit: ... })`；[几何条件与底层 reserveStageExit](implementation-stage.md#最后画面读完再退出) |
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
