# 内置模板总表

## 使用规则

每个模板定义必须回答：用途、必需字段、可选字段、接受的数据形状、不适用场景、编辑能力、限制/联动、最小映射和 MBB 策略。详细定义分在三个 catalog；本页用于选择和交叉校验。

标准数据有两种常见形状：

- 宽表：第一列或前两列是维度，其余数值列各自成为系列。例：`月份, A销售额, B销售额`。
- 长表：维度、系列、指标分列。外部 `commonOption` 可接收；转换后必须检查实际 `mappingSpec` 和 parser 结果。不要假设所有模板都自动完成 pivot。

## 模板与字段角色

| 模板 | 主要任务 | 必需映射 | 可选映射 |
| --- | --- | --- | --- |
| `bar` | 堆叠/多系列纵向比较 | `x`, `y` | 第二维度 |
| `barGroup` | 独立或并列纵向比较 | `x`, `y` | 第二维度 |
| `overlapBar` | 参照列与对比列（可多列）的重叠纵向对照 | `x`, `y`（2~4 个指标，参照 → 对比） | — |
| `barPercent` | 100% 纵向构成 | `x`, `y` | 第二维度 |
| `horizontalBar` | 横向堆叠/多系列比较 | `x`, `y` | 第二维度 |
| `horizontalBarGroup` | 独立或并列横向比较 | `x`, `y` | 第二维度 |
| `overlapHorizontalBar` | 参照列与对比列（可多列）的重叠横向对照 | `x`, `y`（2~4 个指标，参照 → 对比） | — |
| `horizontalBarPercent` | 100% 横向构成 | `x`, `y` | 第二维度 |
| `butterfly` | 左右对称比较两侧指标 | `x`, `leftY`, `rightY` | 每侧多指标即为该侧堆叠层 |
| `dumbbell` | 同一对象多个端点值的差距与方向 | `x`, `y`（2~6 个端点指标） | — |
| `bullet` | 实际值对目标与评价区间的达成情况 | `x`, `y`（实际 → 目标 → 至多 3 个递增阈值） | — |
| `smallMultiples` | 多指标并列面板共用尺度比较 | `x`, `y`（1~6 个同单位指标） | `series`（1~2 个文本维度，面板内分组/堆叠） |
| `line` | 时间/有序趋势 | `x`, `y` | 第二维度 |
| `area` | 趋势与累计量级 | `x`, `y` | 第二维度 |
| `areaPercent` | 随时间的 100% 构成 | `x`, `y` | 第二维度 |
| `scatter` | 相关性、分布、气泡 | `x`, `y` | `label`, `size`, `group` |
| `dualAxis` | 不同量纲组合 | `x`, `leftY`, `rightY` | 多指标 |
| `waterfall` | 起点、增减贡献、终点 | `x`, `y` | 多指标/总计语义 |
| `waterfallDecrease` | 递减贡献/桥图 | `x`, `y` | 多指标 |
| `pie` | 少量类别构成（默认环图） | `category`, `value` | 无 |
| `rose` | 极坐标类别比较 | `category`, `value` | 多指标 |
| `radar` | 多维画像 | `category`, `value` | 多系列 |
| `funnel` | 阶段规模/转化 | `category`, `value` | 无 |
| `gauge` | 已有仪表 spec/外部来源 | 取决于来源 | 目标/阈值 |
| `wordCloud` | 关键词频次 | `keyword`, `frequency` | 无 |
| `sankey` | 流向和流量 | `source`, `target`, `value` | 多层流向 |
| `mekko` | 宽度与高度双变量 | `x`, `y`, `bandWidth` | 多指标 |
| `mekkoPercent` | 宽度与 100% 构成 | `x`, `y`, `bandWidth` | 多指标 |
| `heatmap` | 二维分类矩阵 | `x`, `y`, `value` | 无 |
| `treemap` | 层级构成 | `category[]`（最多 3 个字段）, `value` | 无 |
| `sunburst` | 环形层级构成 | `category[]`（最多 3 个字段）, `value` | 无 |
| `circlePacking` | 层级规模关系 | `category[]`（最多 3 个字段）, `value` | 无 |

三种横向柱图的映射仍是 `x` 填业务维度、`y` 填数值指标；模板根据 horizontal 方向交换最终视觉轴，不要反写映射。层级图超过 3 个 category 字段会在构建数据时截断；生成前须让用户明确选择保留的层级，详见层级 catalog。

`vchartSpec` 和 `vseedDsl` 是导入适配器，不是默认推荐模板。

## 编辑能力矩阵

符号：✓ 当前内置能力集合明确支持；— 不支持/不适用；△ 依赖实际 series/model 或仅部分能力。

| 模板 | 轴 | 图例 | 常规标签 | 系列标签 | 总计标签 | barLink | 宽度 | 完整差异 marker | 特殊能力 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `bar` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 多级分类默认可能关闭；多堆叠分类时手动开启 |
| `barGroup` | ✓ | ✓ | ✓ | — | — | — | ✓ | ✓ | 并列 |
| `overlapBar` | ✓ | ✓ | ✓ | — | — | — | ✓ | ✓ | 参照背景 + 主数据前景 |
| `barPercent` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 百分比 formatter；多堆叠分类时手动开启 |
| `horizontalBar` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 横向；多堆叠分类时手动开启 |
| `horizontalBarGroup` | ✓ | ✓ | ✓ | — | — | — | ✓ | ✓ | 并列横向 |
| `overlapHorizontalBar` | ✓ | ✓ | ✓ | — | — | — | ✓ | ✓ | 横向参照背景 + 主数据前景 |
| `horizontalBarPercent` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 百分比 formatter；多堆叠分类时手动开启 |
| `butterfly` | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | 双 region 左右对称；数据全为正值；差异 marker 仅同侧比较、不跨中轴；不支持 barLink |
| `dumbbell` | ✓ | ✓ | ✓ | — | — | — | — | — | 2~6 端点；端点标签同组批量编辑；区域/线/点标注 |
| `bullet` | ✓ | ✓ | ✓ | — | — | — | — | — | 实际/目标/递增阈值；坐标系转置；目标标记宽×高；区域/线/点标注 |
| `smallMultiples` | ✓ | — | ✓ | — | — | — | — | — | 面板图型 7 种；每行 1~4 面板；系列通道分组/堆叠；共享数值刻度 |
| `line` | ✓ | ✓ | ✓ | ✓ | — | — | — | ✓ | 点/线样式 |
| `area` | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | ✓ | 面积/点/线 |
| `areaPercent` | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | ✓ | 百分比 |
| `scatter` | ✓ | ✓ | ✓ | — | — | — | — | △ | trendLine、partition、size、zIndex |
| `dualAxis` | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | syncAxisDomain、左右轴 |
| `waterfall` | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | stackType、正负/总计 |
| `waterfallDecrease` | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | 递减 |
| `pie` | — | ✓ | ✓ | — | — | — | — | — | 内外标签、半径 |
| `rose` | ✓ | ✓ | ✓ | — | — | — | — | — | stackType、半径/角度 |
| `radar` | ✓ | ✓ | ✓ | — | — | — | — | — | 雷达轴/面积 |
| `funnel` | — | ✓ | ✓ | — | — | — | — | — | outerLabel、transformLabel |
| `gauge` | — | — | △ | — | — | — | — | — | 模板本身不从标准数据生成 spec |
| `wordCloud` | △ | — | — | — | — | — | — | — | 字号、旋转、mask |
| `sankey` | — | ✓ | ✓ | — | — | — | — | — | 节点/边/方向 |
| `mekko` | ✓ | ✓ | ✓ | ✓ | ✓ | — | △ | ✓ | mekkoLabel、mekkoLine；无 growth line |
| `mekkoPercent` | ✓ | ✓ | ✓ | ✓ | ✓ | — | △ | ✓ | 百分比；无 growth line |
| `heatmap` | ✓ | ✓ | ✓ | — | — | — | — | — | 色阶/值域 |
| `treemap` | — | ✓ | ✓ | — | — | — | — | — | 不承诺普通类型切换 |
| `sunburst` | — | ✓ | ✓ | — | — | — | — | — | 不承诺普通类型切换 |
| `circlePacking` | — | ✓ | ✓ | — | — | — | — | — | 不承诺类型切换；drill 关闭 |

`wordCloud` 在 no-axis 集合之外，但没有常规 axis 编辑语义；不要给它生成笛卡尔轴。

## 选择约束

- 类别比较：只有一个可见数据组时，少量类别用 `barGroup`；标签长或类别多用 `horizontalBarGroup`。简单宽表可用单个 `y` 字段预判，长表/第二维度必须先核对物化后的 series 基数。多个可见数据组时，独立并列比较用 group、可相加的构成或总量用 `bar`/`horizontalBar`；部分占整体才用 percent。`barLink`、`seriesLabel`、`totalLabel` 是普通模板的显式能力例外，不可用时应说明后改选普通模板。
- 左右对称比较两个指标（人口金字塔、正反面评价、两期对比等）使用 `butterfly`，映射写 `x` + `leftY` + `rightY`；
  **两侧数据都填正值**，向左生长由模板内部的轴 `inverse` 实现，不要为了绘图构造负数。
  一侧给多个字段即为该侧的堆叠层，两侧各自独立累计、各自显示总计标签。
  左右共享同一数值域，保证量级可比。类目轴位置由 `butterflyAxisPosition` 控制，
  可选 `center`（默认）、`both`、`left`、`right`。`butterfly` 支持完整差异 marker，但**仅用于同一侧内部比较**，
  不跨中轴连接左右两根柱子；用户要求跨侧差异时说明该限制。`butterfly` 不支持 `barLink`（左右分属两个
  region，连接线无法跨区），用户要求时说明限制，不要静默忽略。
- 对 `bar`、`barPercent`、`horizontalBar`、`horizontalBarPercent`：`barLink` 默认关闭；只有用户明确要求，或类别顺序可靠、层含义稳定且任务明确分析相邻累计/构成边界变化时，首次创建才在 `options.config` 显式设置 `barLink:{enable:true}`。随后在每个实际 series 的 `modelSpec.spec` 显式设置 `seriesLabel.visible:true`。`barLink` 不依赖 identity，seriesLabel 必须先物化/readback 获取真实 `id/specIndex`；不能按 `mappingSpec.y` 的字段个数或数组序号猜 series。无序类别、排名快照、层集合不一致、单层、并列 group、密集或难解释的正负/零基数不自动开启。
- 时间趋势：`line` 优先；强调累计规模用 `area`；份额变化用 `areaPercent`。
- 关系：两个数值指标才用 `scatter`；第三数值映射 `size`，类别映射 `group`。
- 构成：饼图只用于少量类别和单一时间切片，默认以 `pie` 的 `innerRadius:0.5` 生成环图，并省略 `outerRadius` 以继承宿主主题和布局默认值；用户明确要求实心或参考图明确实心时才用 `innerRadius:0`。类别多时改排序条形图。
- 流程：连续阶段规模用 funnel；来源到去向用 sankey；增减桥接用 waterfall。
- 层级：矩形空间效率用 treemap；层级路径用 sunburst；包容和规模用 circlePacking。
- `gauge` 的本地模板当前 `getSpec()` 返回空对象且数据校验恒真，因此不能把它当成“给一个 value 就能可靠生成”的普通标准数据模板。优先使用已有 spec、VSeed/风神来源或经运行时验证的 fixture。

## 详细目录

- [template-catalog-cartesian.md](template-catalog-cartesian.md)
- [template-catalog-specialized.md](template-catalog-specialized.md)
- [template-catalog-hierarchy.md](template-catalog-hierarchy.md)
