# column

柱图使用 type: bar，xField 为类别，yField 为数值。保留零基线和完整类别。

读取 [完整原生示例](../chart-examples/direct-column.spec.json)，替换数据、单位、字段、字体及当前空间；这是合成数据，不是人物事实。

所有示例使用 VChart 2.1.7，animation: false。原始 spec 文件生成内嵌 JSON；对深拷贝创建图表，完整接入见 [图表桥接](../chart-bridge.md)。完整系列由图表承担，独立事实和标题由 HTML 承担。

包含零值或极值时，可参考 [零值与极值示例](../chart-examples/zero-extreme-column.spec.json)：零值保留类别和数值标签，最大值保留外部标签空间。

未观测、未出赛、不适用不是数值0。参考 [缺失与真实零值示例](../chart-examples/missing-value-column.spec.json)：原始事实保留 null 及原因，绘图 values 只包含有观测值的记录，底部 band 轴的完整 `domain` 保留时间缺口；真实0仍显示0标签。图旁用可读文字说明缺失类别，不能用0或小正数占位，更不能靠隐藏标签掩盖伪造的值。

JSON spec 的标签字体直接放在 `label.style`。不要编造 `label.format: [{rule, visible, style}]` 条件规则数组；配置被忽略时，字体和隐藏条件都可能失效。比较原始事实、绘图 values、实际标签与 tooltip，确认缺失与0分别成立。

次数本身可以为0，但场均值/率的分母为0时结果未定义。来源表用0占位时，事实记录保留原始标记和说明，绘图语义转为 null/不适用；不能将未发生观测解释为一次取值为0的观测。
