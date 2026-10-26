# treemap

children 保存层级，叶节点 value 决定面积。父节点合计不可与子节点再次重复计数；面积代表数量，标签可读性仍需截图核对。

读取 [完整原生示例](../chart-examples/treemap.spec.json)，替换数据、单位、字段、字体及当前空间；这是合成数据，不是人物事实。

所有示例使用 VChart 2.1.7，animation: false。原始 spec 文件生成内嵌 JSON；对深拷贝创建图表，完整接入见 [图表桥接](../chart-bridge.md)。完整系列由图表承担，独立事实和标题由 HTML 承担。
