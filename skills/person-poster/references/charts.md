# 本地图表资料索引

先按关系选择，再只读取选中的 spec 文件。所有类型与依赖配置均在本包中，不读取其他 skill。

| 信息关系 | 可用 spec |
| --- | --- |
| 单系列分类比较、排行、长名称 | [bar](chart-types/bar.md) |
| 单系列时期/年代/赛季数值 | [column](chart-types/column.md) |
| 时间趋势 | [line](chart-types/line.md)、[area](chart-types/area.md) |
| 明确的组成、命中与未命中 | [pie](chart-types/pie.md)、[waffle](chart-types/waffle.md)、[treemap](chart-types/treemap.md) |
| 同时期/类别的多系列比较 | [grouped-bar](chart-types/grouped-bar.md)、[grouped-column](chart-types/grouped-column.md) |
| 多时期/类别的分项总量 | [stacked-bar](chart-types/stacked-bar.md)、[stacked-column](chart-types/stacked-column.md) |
| 两个数值维度的关系 | [scatter](chart-types/scatter.md) |

每类参考链接到完整原生 JSON 示例。只读取所选关系，按实际数据和海报空间调整，不加载其他 Skill 或复制完整 API 手册。

原生配置可查 [VChart 官方配置](https://visactor.io/vchart/option)，运行版本固定为 2.1.7。本地结构检查不覆盖完整 API，新增字段要验证真实渲染。

只有日期与事件不是量化趋势；独立跨维度 KPI 不应强行放入同一比较序列。接入方式见 [图表桥接](chart-bridge.md)。

## 装饰与配置边界

字体、轴、标签、图例、颜色、原生标注直接使用 VChart 配置。独立荣誉图标、人物和背景由 HTML/SVG/位图表达，不重复绘制数据系列。本包不提供自动纹理、排名徽章、图标填充或旧配置转换器；需要这些表达时先验证公开原生 API，否则选择不损失数据语义的简洁样式。

JSON 示例不包含函数回调。优先预计算标签和派生字段；不通过 eval 恢复函数，也不把配置字符串当代码执行。
