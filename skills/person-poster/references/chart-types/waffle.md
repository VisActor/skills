# waffle

以原生 scatter 方形符号绘制显式网格数据，不存在 type: waffle。此例总量 100，每格 10，共 10 格，7 格代表 70；按实际单位展开数据，保留原始分母与舍入说明。mount 宽高与网格比例匹配，避免 symbol 太大导致重叠。不用 HTML 重画系列。

读取 [完整原生示例](../chart-examples/waffle.spec.json)，替换数据、单位、字段、字体及当前空间；这是合成数据，不是人物事实。

所有示例使用 VChart 2.1.7，animation: false。原始 spec 文件生成内嵌 JSON；对深拷贝创建图表，完整接入见 [图表桥接](../chart-bridge.md)。完整系列由图表承担，独立事实和标题由 HTML 承担。
