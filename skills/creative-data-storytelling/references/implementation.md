# 实现参考：按当前问题取用

关键构图与前后关系确定后，按下表读取相关说明或独立示例；无需通读全部文件。构图未定先看[可视化设计](visualization-design.md)，阅读空间与节奏见[舞台与运动](stage-and-motion.md)。

## 按实现问题取用代码

| 当前实现问题 | 接口说明与直接调用 | 需要具体接法时选读 |
| --- | --- | --- |
| 滚动选择状态，连接自动完成 | [createStage / observeSteps](implementation-stage.md#文字滚动与舞台更新) | [comparison.mjs](../assets/examples/comparison.mjs)：尺度、标注与阅读状态共用入口 |
| 独立播放、中断与反向 | [createPlayer](implementation-stage.md#自动完成的衔接动画) | [amounts.mjs](../assets/examples/amounts.mjs)：同批区间移动 |
| 图文使用同一读数；稳定更新 SVG | [createValueFormat / createSvgLayer](implementation-rendering.md#共用读数格式与-svg-更新) | [difference.mjs](../assets/examples/difference.mjs)：数据、几何与读数接线 |
| 检查具体对象的越界或遮挡 | [measureBounds / checkBounds](implementation-rendering.md#实际占位与空间诊断) | comparison 的作者工具；只检测声明的空间关系 |
| 共同尺度比较、轴与标记同步缩放 | [身份与几何](implementation-geometry.md#几何) | comparison：提取对象与比较标注 |
| 保留历史并聚焦局部 | [显露范围与定位窗口](implementation-geometry.md#历史与当前从同一状态生成) | [history.mjs](../assets/examples/history.mjs) |
| 可加总部分展开或接入基底 | [accumulationSegments](implementation-geometry.md#组成与累积的区间几何) | amounts：非负分段展开与合并 |
| 两期量值转为增减比较 | [端点到差值](implementation-geometry.md#两期端点到差值) | difference：两端区间移到零参照 |
| 素材、数据点与标签共同移位 | [共同锚点](implementation-geometry.md#几何) | [identity.mjs](../assets/examples/identity.mjs) |
| 同批单元重组、分布或权重布局 | [布局、身份与槽位](implementation-geometry.md#主题轮廓与单元重组) | [units.mjs](../assets/examples/units.mjs) |
| 解释标注随对象交接 | [blendWithAnnotations](implementation-geometry.md#让解释标注与对象一起交接) | comparison / amounts / identity 的 blend 与 render |
| 叙事与简洁探索共用入口 | [控制交接与控件](implementation-stage.md#探索交接与控件) | comparison 的比较控件、units 的筛选与详情 |
| 静态 HTML、主题样式、预览与交付 | [工具与交付](implementation-delivery.md) | 按需取用 Tailwind 与现有预览器 |

示例各自包含输入要求、模拟数据、目标布局、过渡和绘制；只读所选文件即可了解接法。先确认数据条件和接口边界，超出范围时自行计算或选用其他工具。

## 直接复用与参考的边界

- [assets/runtime/](../assets/runtime/) 是可直接复制、导入的控制与计算模块。先读接口，只有排错或扩展时再查源码。相对依赖为 `stage → motion / scroll`、`motion / units / svg → geometry`，其他模块无内部依赖。
- `assets/examples/` 的各个 `.mjs` 是局部装配参考，记录、构图、尺度和状态顺序属于该示例。按自己的设计取用接法；不为复用示例改变叙事。
- [演示页](../assets/examples/index.html) 直接调用上述示例模块，供观察动态效果。`demo.mjs` 只装配页面，普通创作无需读取它或整份 HTML；需要控件样式时再查相关片段。

同一属性由一套控制机制驱动；已有项目工具能可靠承担相同职责时可沿用。页面阅读与交互统一按[评价与阅读检查](quality.md)验收，稳定计算或控制行为按实际风险验证。
