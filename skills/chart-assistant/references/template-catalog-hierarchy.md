# 内置模板定义：层级图与导入适配器

## 层级数据共同规则

`treemap`、`sunburst`、`circlePacking` 接收扁平标准数据并通过 `mappingSpec.category` 的字段数组构建层级树，最多支持 3 个 category 字段：

```json
{
  "columns":["大区","国家","城市","销售额"],
  "data":[
    {"大区":"亚洲","国家":"中国","城市":"上海","销售额":120},
    {"大区":"亚洲","国家":"中国","城市":"北京","销售额":100}
  ]
}
```

```json
{"category":["大区","国家","城市"],"value":"销售额"}
```

规则：category 保持从根到叶顺序；value 使用第一个有效数值字段；重复路径聚合由模板完成。空层级、循环语义、负值或不能聚合的指标必须先处理。

三层是数据构建的硬限制：运行时过滤不存在的字段、去重后，只取前 3 个 category 字段构建树；第 4 层及以后不会保留在树中，不能通过调整展示深度恢复。收到四层或更多层级请求时，先让用户明确选择最多 3 个保留层级及其顺序，再生成映射，并说明省略了哪些层级。例如“大区 → 国家 → 城市 → 门店”须先确认保留“大区 → 国家 → 城市”还是“国家 → 城市 → 门店”等取舍，不得直接输出四字段映射或宣称仅折叠末层。

## `treemap`

- 用途：在有限空间内比较层级叶节点和父级构成。
- 编辑：切分方式、展示深度、节点间距、父/叶节点样式、root/leaf/non-leaf label、图例、tooltip、单节点样式。
- 限制：无坐标轴；普通类型切换不承诺；层级过深或叶子过多会产生不可读小块。
- MBB：最多展示支持结论的 2–3 层；关键节点 focus，其余按父级灰阶；标关键份额而非所有节点。

## `sunburst`

- 用途：强调从中心到外圈的层级路径和各层构成。
- 编辑：内外半径、起止角、层级间隔、父/叶节点样式、label、图例、tooltip、单扇区样式。
- 限制：无坐标轴；不承诺普通类型切换；外圈面积不宜跨层直接比较。
- MBB：层数克制；同一父节点保持色相关系；只标关键路径，并在标题说明分析层级。

## `circlePacking`

- 用途：通过包含关系和圆面积展示层级与规模。
- 编辑：布局 padding、父/叶节点样式、label、图例、tooltip、单节点样式。
- 限制：无坐标轴；不承诺类型切换；运行时关闭 drill；圆面积不利于精确比较。
- MBB：用于结构概览而非精确排名；突出异常大节点，必要时配排序表。

## `vchartSpec`

- 定位：原始 VChart Spec 导入适配器，不是内置模板推荐结果。
- 输入：`commonOption.elements[].options.spec`；可选 `enableEditorTheme/enableDataEdit/enableTypeChange` 和 `options.config` 编辑态补充。
- 编辑：默认只可靠保留原 spec 和外层主题/布局；是否能编辑数据或切换类型必须显式授权且通过转换预检。
- 类型转换：只接受可证明的数据/字段关系；推荐内联扁平 `data[].values`。函数、远程 transform、多数据集歧义、缺失矩阵会拒绝或要求用户审阅。
- 转换结果：成为 standard + 内置模板的 snapshot，`sourceBinding: {mode:"snapshot", detachedFrom:"vchartSpec"}`；原来源不再刷新覆盖。
- 禁止：为了绕过内置模板限制而默认输出任意 VChartSpec。

## `vseedDsl`

- 定位：VSeed DSL 导入和兼容入口。
- 输入：`sourceType: "vseedDsl"` + `vseedDsl`；通常包含 `chartType`, `dataset`, `dimensions`, `measures`。
- 编辑：运行时将其转换为图表助手可渲染结构；编辑能力由转换后的实际 chart type/spec 决定，不能按名称假定全部内置能力。
- URL：VSeed/VizData 中的 `source.url` 可用于来源记录或加载，不自动等于 autoSync。
- 禁止：用户没有提供/要求 VSeed 时，把它当成普通内置模板输出。
