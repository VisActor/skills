# 实现参考：按当前问题取用

本页负责把已选的表达接成可运行作品。表达与完整片段的选择见[设计指导](design.md)；构图已清楚时，可直接使用下方问题索引，无需重走设计流程。

## 将选中片段接入作品

- 采用已有片段实现时，读所借过程涉及的数据、布局、过渡与绘制，以它为改写起点；`inspect <id>` 的 `adapt` 和 `read.code.entryLines` 帮助定位函数，行号索引不替代过程本身。页面装配再读 `read.layout`。复制 `copyAlongside` 所列依赖和素材时保留相对目录，或同步修改引用；运行模块通常直接导入，无需读源码。
- 对象 ID、正文读数、图形几何与强调从自己的数据生成。沿用示例结构时，仍按实际对象数量、标签与数值范围调整；修改编码则同步修改轴、标注和运动，保留选定的解释关系。
- 接入已有舞台时，使用前段当前对象与姿态作为起点，将后续状态接入同一更新入口；同一属性由一套控制机制驱动。独立舞台可分别控制，身份色与主题前后协调，可比较的量值使用一致口径；改用其他指标时交代变化。
- 将正文与图形放进整篇的[阅读空间](design.md#主画面与阅读空间)，保留需要的交互，移除演示作者说明和重复入口。停留与退出按实际正文安排；原演示的页面高度不直接当作新作品参数。

选择片段后不必再读全部局部示例；只有遇到具体接线问题时，定位下表对应项。

## 按实现问题取用代码

| 当前实现问题 | 接口说明与直接调用 | 需要具体接法时选读 |
| --- | --- | --- |
| 滚动选择状态，连接自动完成 | [createStage / observeSteps](implementation-stage.md#文字滚动与舞台更新) | [comparison/scene.mjs](../assets/examples/comparison/scene.mjs)：尺度、标注与阅读状态共用入口 |
| 末段正文仍在阅读，舞台已经滚走 | [reserveStageExit](implementation-stage.md#最后画面读完再退出) | comparison 的末段正文、sticky 外层与 `.reading-tail` |
| 独立播放、中断与反向 | [createPlayer](implementation-stage.md#自动完成的衔接动画) | [amounts/scene.mjs](../assets/examples/amounts/scene.mjs)：同批区间移动 |
| 图文使用同一读数；稳定更新 SVG | [createValueFormat / createSvgLayer](implementation-rendering.md#共用读数格式与-svg-更新) | [difference/scene.mjs](../assets/examples/difference/scene.mjs)：数据、几何与读数接线 |
| 最终检查中的越界或遮挡测量 | [measureBounds / checkBounds](implementation-rendering.md#实际占位与空间诊断) | comparison 的作者工具；按作品声明实际需测的空间关系 |
| 共同尺度比较、轴与标记同步缩放 | [身份与几何](implementation-geometry.md#几何) | comparison：零基线条形的连续提取与端点差值；可按数据关系换用其他标记 |
| 同量等分、重复份额与观看范围交接 | [单位与量级的条件](expression-methods.md#同量换单位与量级参照) | [unit-scale/scene.mjs](../assets/examples/unit-scale/scene.mjs)：原份身份不变，等分保总量，先扩视域再接入份数；反向先收回新增，正文与几何共用换算 |
| 同一对象改用分母或标准化尺度 | [比较口径的条件](expression-methods.md#改变比较口径) | [comparison-basis/scene.mjs](../assets/examples/comparison-basis/scene.mjs)：共用总量与分母、均分份额、单位和标签交接 |
| 保留历史并聚焦局部 | [显露范围与定位窗口](implementation-geometry.md#历史与当前从同一状态生成) | [history/scene.mjs](../assets/examples/history/scene.mjs) |
| 从原日期换到共同起点，比较时长或偏移 | [尺度与插值](implementation-geometry.md#几何) | [sequence/scene.mjs](../assets/examples/sequence/scene.mjs) 每行只平移起点，保留行内间隔 |
| 可加总部分展开或接入基底 | [accumulationSegments](implementation-geometry.md#组成与累积的区间几何) | amounts：非负分段展开与合并；[increment-stock/scene.mjs](../assets/examples/increment-stock/scene.mjs) 将年度并列柱原位抬升接成累计轨迹，保留年份和每段数量 |
| 新记录加入已有比较 | [新记录加入共同尺度](expression-methods.md#新记录加入共同尺度) | [record-comparison/scene.mjs](../assets/examples/record-comparison/scene.mjs)：固定量值映射，独立行加入与重排，真实条长和入场遮罩分开 |
| 序列中逐次显露呼应 | [序列可视化](expression-methods.md#序列可视化) | [sequence-recurrence/scene.mjs](../assets/examples/sequence-recurrence/scene.mjs)：出现位置固定，两端就位后绘连接；关系来自显式标注 |
| 两期量值转为增减比较 | [端点到差值](implementation-geometry.md#两期端点到差值) | difference：两端区间移到零参照 |
| 素材、数据点与标签共同移位 | [共同锚点](implementation-geometry.md#几何) | [identity/scene.mjs](../assets/examples/identity/scene.mjs) |
| 素材自身长度承担量值 | [图像与实物参与表达](expression-methods.md#objects) | [material-height/scene.mjs](../assets/examples/material-height/scene.mjs)：以可见端点校准素材；`pose.scale` 同帧驱动刻度、素材与标注，先扩展范围再加入，反向先退出再收近 |
| 把素材识别、数量编码与阅读节奏接成一段 | [图像与实物参与表达](expression-methods.md#objects) | [material-composition/scene.mjs](../assets/examples/material-composition/scene.mjs)：图片随组成区间移动；[material-trend/scene.mjs](../assets/examples/material-trend/scene.mjs)：图片直接标记观测，时间推进后转同比、逐条加入参照 |
| 同批单元重组、分布或权重布局 | [布局、身份与槽位](implementation-geometry.md#主题轮廓与单元重组) | [units/scene.mjs](../assets/examples/units/scene.mjs) |
| 解释标注随对象交接 | [blendWithAnnotations](implementation-geometry.md#让解释标注与对象一起交接) | comparison / amounts / identity 的 blend 与 render |
| 叙事与简洁探索共用入口 | [控制交接与控件](implementation-stage.md#探索交接与控件) | comparison 的比较控件、units 的筛选与详情 |
| 静态 HTML、主题样式、预览与交付 | [工具与交付](implementation-delivery.md) | 按需取用 Tailwind 与现有预览器 |

每个示例集中在 `assets/examples/<id>/`：`scene.mjs` 文件头标出改写入口，正文提供目标布局、过渡和绘制；`index.html` 提供页面装配及 `#example-notes` 的设计解释，专用素材在 `images/`。表达取舍与解释读取见[片段选用](design.md#选用连续片段)，不必先读总览页。

## 直接复用与参考的边界

- [assets/runtime/](../assets/runtime/) 是可直接复制、导入的控制与计算模块。先读接口，只有排错或扩展时再查源码。相对依赖为 `stage → motion / scroll`、`motion / units / svg → geometry`，其他模块无内部依赖。
- 目录的 `kind: story` 表示完整解释片段，`kind: mechanism` 表示局部机制。`inspect` 的本地路径相对返回的 `root`；按 `read` 与 `copyAlongside` 复制本例及所需依赖，无需复制其他示例或总览。
- [示例总览](../assets/examples/index.html)只供浏览导航，各示例在自己的页面运行。局部机制共用 [mechanism.css](../assets/examples/mechanism.css) 的预览与控件样式；需要外观接法时选读，并按作品主题改写。

已有项目工具能可靠承担相同职责时可沿用。页面阅读与交互统一按[作品验收](quality.md)检查，稳定计算或控制行为按实际风险验证。
