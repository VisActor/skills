# column

柱图使用 type: bar，xField 为类别，yField 为数值。保留零基线和完整类别。

读取 [完整原生示例](../chart-examples/direct-column.spec.json)，替换数据、单位、字段、字体及当前空间；这是合成数据，不是人物事实。

所有示例使用 VChart 2.1.7，animation: false。原始 spec 文件生成内嵌 JSON；对深拷贝创建图表，完整接入见 [图表桥接](../chart-bridge.md)。完整系列由图表承担，独立事实和标题由 HTML 承担。

包含零值或极值时，可参考 [零值与极值示例](../chart-examples/zero-extreme-column.spec.json)：零值保留类别和数值标签，最大值保留外部标签空间。
