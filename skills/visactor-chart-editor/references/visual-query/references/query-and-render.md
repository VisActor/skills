# 查询与渲染

从 [visual-query](../guide.md) 按需阅读，适用于单图、指标卡、表格和 Dashboard。浏览器模块加载与完整示例见 [HTML 接入](html-integration.md)，页面资源关系与联动见 [组合与联动](composition.md)。下面片段假定已导入 VBI、VQuery、VSeed 的 Builder / registerAll 及所需渲染器，并准备好相应数据源、Builder 与容器。

## 1. 固定构建链路，逐层检查结果

默认链路是：`Chart Builder → buildVSeed() → VSeed Builder → VChart`。

| 层次               | 职责                                      | 排查时检查                                 |
| ------------------ | ----------------------------------------- | ------------------------------------------ |
| VBI                | 管理图表 DSL，通过 Builder 配置查询与编码 | `build()` 中的维度、度量、筛选、排序和编码 |
| Connector / VQuery | 执行查询，返回分组、聚合后的结果          | `buildVQuery()` 与实际返回的数据           |
| VSeed              | 将含数据的 VSeed DSL 构建为渲染配置       | `seed.dataset`、字段 ID 与生成的 spec      |
| VChart / UI        | 绘图、DOM、交互与尺寸管理                 | 容器大小、渲染实例及交互反馈               |

```javascript
// chartBuilder 已通过公开 Builder API 配置，连接器已注册。
registerAll()
const chartDSL = chartBuilder.build()
const queryDSL = chartBuilder.buildVQuery()
const seed = await chartBuilder.buildVSeed()
const spec = Builder.from(seed).build()
const chart = new VChart(spec, { dom: document.querySelector('#chart') })
chart.renderSync()
```

`build()` 与 `buildVQuery()` 不执行查询；`buildVSeed()` 会调用连接器。调试时先确认 `chartDSL` 和 `queryDSL` 的语义，再检查数据与视觉配置，避免通过修改图形样式掩盖查询问题。表格使用对应的 VTable 渲染链路，或直接让 HTML 消费查询结果。

**验证：** 用一组可手算的数据检查分组、聚合和筛选，确认结果正确后再增加视觉定制。

## 2. 用 Connector 隔离数据来源

图表通过 `connectorId` 关联数据源。连接器提供 `discoverSchema()`，并执行 `query()` 收到的 `queryDSL`。本地演示可委托 VQuery；更换数据源时，只要字段及查询语义保持一致，就可以保留图表的分析配置。

```javascript
// connectorId、schema、rawDataset 由当前数据源提供。
const query = new VQuery()
const source = { type: 'json', rawDataset }
if (await query.hasDataset(connectorId)) {
  await query.updateDatasetSource(connectorId, schema, source)
} else {
  await query.createDataset(connectorId, schema, source)
}
VBI.connectors.register(connectorId, {
  discoverSchema: async () => schema,
  query: async ({ queryDSL }) => {
    const dataset = await query.connectDataset(connectorId)
    try {
      return await dataset.query(queryDSL)
    } finally {
      await dataset.disconnect()
    }
  },
})
```

本例用 `hasDataset()` 兼容已有数据集；存储行为以使用版本和选项为准，启用 IndexedDB 持久化时也要处理刷新后保留的数据集。更新时同时传入 `schema` 和 `source`，查询连接在 `finally` 中释放。

数据库、本地文件或上游 HTTP 通过 [server-runtime](../../server-runtime/guide.md) 提供同源查询，Connector 按 [页面与服务协议](../../server-runtime/references/protocol.md)传输 Builder 生成的查询 DSL、返回 dataset。数据库 SQL 交给 VQuery 编译及驱动执行；文件解析使用 VQuery 的数据源能力。接入层可做类型和字段映射，业务聚合由查询层执行。页面若还直接读取原始数组计算标签、前沿或参考值，这些依赖也需要随数据源一起处理；仅替换连接器不会自动替换页面闭包中的数据。

**验证：** 检查首次加载、刷新后的更新，以及筛选后返回的数据；确认连接器没有忽略传入的查询条件。

## 3. 用图表 Builder 为自定义 UI 查询数据

指标卡、排行榜、进度条和 HTML 表格可以使用 `table` 类型的 Builder 获取数据，不必为了接入 VBI 将它们全部绘制成图表。

```javascript
const summary = VBI.chart.create(VBI.chart.createEmpty(connectorId))
summary.chartType.changeChartType('table')
summary.measures
  .add('sales', (node) => node.setAlias('销售额').setAggregate({ func: 'sum' }))
  .add('orders', (node) => node.setAlias('订单数').setAggregate({ func: 'sum' }))
const summarySeed = await summary.buildVSeed()
// summarySeed.dataset 交给指标卡消费，无需创建 VChart / VTable 实例。
```

不添加维度可获取整体汇总，添加 `region`、`product` 等维度可获取分组结果。排行的排序通过度量 Builder 的 `setSort()` 表达；需要限制查询结果条数时使用图表的 limit 能力。

客单价、毛利率、前周期增长率等计算要明确指标口径，例如 `sum(profit) / sum(sales)` 与 `avg(profit / sales)` 含义不同。如果这些公式及其依赖需要作为 VBI 能力保存、恢复和复用，应在所属 DSL 与 Builder 中建模。当前示例中的页面除法和周期比较并未因此自动成为可序列化指标；不要假定现有 DSL 已提供对应公式字段。

**验证：** 在不创建 UI 的情况下运行同一 Builder，仍能得到正确的基础聚合结果；派生指标另外检查计算口径和零分母处理。

## 4. 一次查询，生成多个视图

主趋势、迷你趋势、指标文本和明细表可以复用同一查询结果。只有字段、分组、筛选、统计粒度和数据快照相符时才复用；不同口径使用各自的 Builder 查询。

将查询与绘制分开：查询函数返回 seed，绘制函数接收 seed，避免每个视图内部再次调用 `buildVSeed()`。

```javascript
const seed = await trendBuilder.buildVSeed()
function buildTrendSpec(seed, compact) {
  return Builder.from({
    ...seed,
    legend: { enable: false },
    xAxis: { visible: !compact },
    yAxis: { visible: !compact },
  }).build()
}
const mainSpec = buildTrendSpec(seed, false)
const miniSpec = buildTrendSpec(seed, true)
// 分别交给两个容器的渲染实例；数据查询只发生一次。
```

每个视图创建自己的配置。浅拷贝仍共享 `dataset` 及其他嵌套对象；需要排序、截取或修改嵌套属性时创建对应副本，避免一个视图污染另一个视图。独立查询可以通过 `Promise.all` 并发执行，但相同查询优先复用结果。

同一图表资源可以对应多个 Dashboard widget；在 `dashboard.chart.add()` 的回调中保存各自的 `widget.getId()`，不能按图表 ID 查找某一个 widget 后复用其 ID。每个视图保存自己的渲染实例与事件清理函数，避免重复绑定 `chart.instance` 覆盖主视图。

**验证：** 记录一次刷新中的连接器调用次数；切换紧凑样式等纯视觉选项时，不应无故重新查询。筛选改变后重新获取数据，避免复用过期结果。

## 5. 保留查询字段 ID，在 UI 边界映射名称

VBI 查询结果的列名是维度、度量的生成 ID。传给 VSeed 的数据应保留这些 ID；自定义 UI 可以根据 Builder DSL 显式映射为业务字段。

```javascript
// 接上文的 summary / summarySeed：每个业务字段只有一个度量。
const dsl = summary.build()
const salesId = dsl.measures.find((node) => 'field' in node && node.field === 'sales').id
const ordersId = dsl.measures.find((node) => 'field' in node && node.field === 'orders').id
const rows = summarySeed.dataset.map((row) => ({
  sales: row[salesId],
  orders: row[ordersId],
}))
```

示例中的 `rowsOf()` 适用于平铺且业务字段唯一的维度、度量。对于同一字段的 `sum` / `avg` 等多个度量，按 `field` 生成对象键会覆盖值，应分别保留度量 ID 或映射为 `salesSum`、`salesAvg` 等明确名称。使用维度或度量分组时，还需处理其 `children`，不要直接照搬平铺映射。

**验证：** 自定义 UI 显示的数值与 seed 中对应 ID 的数值一致；适配过程只映射字段，不做二次聚合数据。

## 6. 按层次定制视觉，保留分析语义

| 内容                                             | 优先归属           |
| ------------------------------------------------ | ------------------ |
| 维度、度量、聚合、筛选、排序、编码               | VBI DSL 与 Builder |
| 颜色、坐标轴、图例、标签、线点样式               | VSeed 配置         |
| VSeed 尚未覆盖的精细刻度、特殊标记、组合绘制     | VChart spec 定制   |
| 卡片、按钮、页面装饰、入场动画、焦点与无障碍交互 | HTML / CSS / UI    |

优先使用当前层已经支持的配置。对生成的 spec 进行补充时，将代码集中到明确的渲染函数中，例如散点图的 `decorate(seed)`；在升级依赖后检查所依赖的坐标轴、series 和 mark 结构。

查询后修改 seed 或 spec 不会回写 VBI DSL。因此要区分纯视觉处理与分析范围变化：渐变、标签偏移可以在渲染层处理；“最近七天”若是该图表需要恢复的数据范围，应通过该图表的筛选表达，不能仅依赖 `seed.dataset.slice(-7)`。

Pareto 前沿的计算范围、参考模型选择、派生指标公式属于分析语义；线宽、标记颜色和标签位置属于视觉表达。需要跨集成复用时分别确定归属，避免将领域规则藏在渲染适配器中。

**验证：** 分别检查默认生成结果与定制后的结果；确认样式定制未改变查询语义，导出范围与用户看到的数据范围一致。

## 渲染实例与空结果

`await chart.buildVSeed()` 返回包含 `dataset` 的 VSeed DSL；`connector.query()` 仅返回 `{ dataset }`，`buildVQuery()` 仅生成查询配置。统一调用链不要求增加新的 `query()` 包装 API，也不表示必须将全部图表合成一条查询。

VSeed Builder 将 seed 构建为 VChart / VTable 的配置，绘制、坐标轴、命中与透视布局由对应渲染器完成。需要异步准备的 VSeed 配置先按 [VSeed API 指南](../../api/vseed/guide.md)调用 `prepare()`。自定义 HTML 指标消费查询结果，无需创建 Canvas。

同类视图复用实例：VChart 使用 `await instance.updateSpec(spec)`，VTable 使用 `await instance.updateOption(options)`；渲染器类型发生变化时释放旧实例，再创建匹配的实例。首次创建 VChart 后按需绑定 `chart.instance`，通过公开接口连接图表事件。同一轮结果同时更新图形、指标与范围说明，字段 ID、系列和分类键保持稳定。

实例复用不等于复用内部模型或图元。需要图型切换与原生 morph 时，按 [Morph 与更新策略](morph-transitions.md)配置公开更新参数：动画更新避免图元 reuse 抢先，DSL 图型改变时按需重建内部模型，单纯数据更新保留普通补间；不为动画二次改写 VSeed 生成的 spec。双轴等组合图不能只按顶层引擎 type 判断，验收须覆盖中间过程。

查询为空时清理或隐藏旧视图并显示空状态；按所用版本的渲染能力处理空 dataset，不能把上一轮图形标成新筛选结果。区分无数据、加载失败和真实零值；未知日期不擅自补零。查询失败可保留上次成功结果，但明确标注其范围与未更新状态。

尺寸变化时更新渲染器，容器保留明确尺寸；卸载时释放实例。刷新调度、取消和事件清理统一见 [组合与联动](composition.md#刷新订阅与生命周期)。

## 集成回归检查

在实际宿主页面中，查询与渲染行为按 [验证与交付](../guide.md#验证与交付)进行浏览器验收。
