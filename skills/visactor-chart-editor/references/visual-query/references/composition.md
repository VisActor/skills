# 页面组合与联动

从 [visual-query](../guide.md) 按需阅读。单图查询、字段映射与渲染实例见 [查询与渲染](query-and-render.md)；本文负责多个分析与视图之间的关系、筛选作用域、刷新及恢复。

## 资源关系与布局

Dashboard 的组件通过 `chartId` / `insightId` 引用资源。通过同一 VBI 实例创建的 Chart、Insight Builder 会自动注册为资源，组件引用不会复制资源内容。

```javascript
const dashboard = VBI.dashboard.create(VBI.dashboard.createEmpty())
dashboard.chart.add((widget) => {
  widget
    .setChart(trendBuilder)
    .setTitle('销售趋势')
    .setLayouts({
      lg: { x: 0, y: 0, w: 8, h: 4 },
      xs: { x: 0, y: 0, w: 12, h: 4 },
    })
  document.querySelector('#trend-panel').dataset.widget = widget.getId()
})
```

新增组件提供 `lg` 布局；`setLayouts()` 在组件集合的 `add` / `update` 回调中提交。在集合回调外调用它不会写入 Dashboard 布局。完整接口通过 [VBI API 指南](../../api/vbi/guide.md)中的 Dashboard Builder API 查阅。

UI 从 `dashboard.build().layout[breakpoint]` 读取布局，按 `widgetId` 找到容器，将 `x/y/w/h` 映射为 CSS Grid 的列、行和跨度。列数、行高及断点对应的样式由宿主明确配置，CSS 与 DSL 的断点要保持一致；各场景模板的具体网格比例按当前任务选择。

Insight 中保存的文本或图片引用应由 UI 读取并展示。不要同时在 Insight 和 HTML 中维护相同内容，否则修改资源后画面可能仍显示旧内容。

**验证：** 检查宽屏和窄屏的组件对应关系；修改 Insight 内容后确认展示随资源更新。移除 UI 后，资源引用及布局仍可从 Dashboard DSL 读取。

## 筛选作用域与配置恢复

### 筛选规则先于事件回调

先列出交互来源、受影响的 Builder / 视图及保持原口径的内容，再绑定事件。查询使用稳定资源 ID，结果按 summary、trend、details 等业务名称组织，避免依赖并行结果的数组位置。

| 交互                     | 更新范围                                         | 查询行为                                  |
| ------------------------ | ------------------------------------------------ | ----------------------------------------- |
| 全局筛选                 | 声明范围内的汇总、图形、明细、比较查询与 Insight | 修改相关 Builder 后重新查询               |
| 独立卡片筛选或下钻       | 当前卡片或明确声明的下游视图                     | 只重查受影响的分析                        |
| 悬停、逐项查看           | 当前作用域的临时显示值                           | 使用当前查询缓存，退出恢复相同范围汇总    |
| 配色、布局或紧凑视图切换 | 对应呈现属性                                     | 查询语义相同时复用 seed，更新 Spec 或尺寸 |

主图是否控制全部指标、小图是否只控制自身，由场景定义；布局位置和卡片大小不自动改变联动方向。局部查看不覆盖区间结论。对比期查询共享地区、类别等条件，时间范围按各自周期设置，不能把本期日期直接套给基期。

全局与局部分析口径不同的场景，在标题、说明或控件附近明确表达。

原始行范围通过 `whereFilter` 表达，聚合后的分组筛选通过 `havingFilter` 表达；Connector 执行收到的查询条件，不忽略条件返回整表，也不在页面事件中重复聚合。具体筛选 API 按需查阅 [VBI](../../api/vbi/guide.md) 与 [VQuery](../../api/vquery/guide.md)。

多个筛选共同存在时，保存所管理条件的 ID，并通过 `whereFilter.update()` / `remove()` 或条件分组维护自己的部分。只有调用方拥有全部筛选条件时才适合 `clear()` 后重建，避免清除恢复配置中的其他条件。控件初始值也应从恢复后的状态读取，不能在首次渲染时用默认值覆盖已保存筛选。

例如以下两个条件由同一控件拥有：`chart` 为 Chart Builder，`ids` 为此控件在该图表上的条件 ID；`order_day` 使用与 schema 一致的 UTC 日序号。恢复时先关联已有条件 ID，再初始化控件。真实字段和时间粒度按当前数据源确定。

```javascript
chart.doc.transact(() => {
  const date = (node) => node.setOperator('between').setValue({ min: firstDay, max: lastDay })
  if (ids.date) chart.whereFilter.update(ids.date, date)
  else
    chart.whereFilter.add('order_day', (node) => {
      date(node)
      ids.date = node.getId()
    })
  if (region) {
    const area = (node) => node.setOperator('eq').setValue(region)
    if (ids.region) chart.whereFilter.update(ids.region, area)
    else
      chart.whereFilter.add('region', (node) => {
        area(node)
        ids.region = node.getId()
      })
  } else if (ids.region) {
    chart.whereFilter.remove(ids.region)
    delete ids.region
  }
})
```

当前 Dashboard DSL 保存组件、资源引用和布局；图表 DSL 保存最终筛选条件。它们不会自动记录“地区控件作用于哪些图表”这样的联动规则。若联动需要成为可恢复的 VBI 能力，应补齐所属 DSL 与 Builder，不能将多份最终条件当作联动定义。

### 同时保存 Dashboard 和资源

```javascript
const saved = {
  dashboard: dashboard.build(),
  resources: VBI.resources.snapshot(),
}
// saved 可经 JSON.stringify 保存，再经 JSON.parse 读取。
// 恢复时，在目标运行环境中先注册所需 connectorId 对应的连接器。
VBI.resources.register({
  charts: Object.values(saved.resources.charts),
  insights: Object.values(saved.resources.insights),
})
const restored = VBI.dashboard.create(saved.dashboard)
```

单图保存 `chartBuilder.build()`，使用 `VBI.chart.create(savedChartDSL)` 恢复。资源快照涵盖当前实例的全部已注册 Chart 和 Insight，可能包含辅助查询；它不自动表达这些查询与指标卡之间的计算关系。需要隔离多个看板的资源时，可使用 `createVBI()` 创建各自的资源实例。

导出文件不包含数据连接器实现、原始数据、外部图片文件，以及页面临时补充的 seed / spec 配置。Insight 的相对图片地址在新环境中也需要可解析。明确产品要求恢复哪些分析与展示设置，并保存相应配置；仅有基础 DSL 不能保证整张页面被完整复现。

**验证：** 将配置经过一次 JSON 序列化往返，在没有原页面 Builder 和闭包数据的新资源实例中恢复。注册连接器与资源后，检查资源引用、查询结果、筛选值及布局，再验证自定义指标和特殊图形是否也能按承诺恢复。

## 刷新订阅与生命周期

保持一条刷新路径：控件修改 Builder → 合并变更 → 查询 → 构建 Spec → 更新相关视图。订阅驱动的页面中，控件只修改 Builder；不要同时再触发一套完整渲染。最小 HTML 教程使用显式事件刷新，接入 DSL 订阅时移除重复的显式刷新调用。

- 嵌套筛选使用 `observeDeep(callback)`，`observe(callback)` 只监听顶层键；二者均不触发首次渲染，初始化由页面主动执行。发布版本的等价 `chart.dsl.observeDeep(callback)` 也可用。解绑时分别使用 `unobserve` / `unobserveDeep` 并传入相同回调。
- 同一图表的多步修改放入 `chart.doc.transact()`，不同图表的订阅通知在同轮微任务合并。图表各自的事务不构成跨图表事务。
- 允许连续筛选时递增请求版本，向 `buildVSeed({ signal })` 传递取消信号，并由 Connector 透传给请求。取消后仍检查版本，因为数据源可能没有终止执行；过期响应不能提交指标、缓存或图形。将图表的异步更新串行提交，提交前核对版本，页面销毁后禁止提交。
- 查询开始时取消待执行悬停任务；新结果生效后替换缓存并恢复对应范围的汇总。悬停处理去重，延迟参数按场景决定，原生 Tooltip 不必等待指标联动；退出、刷新、范围变化和卸载都清理待执行回调。
- 自动刷新在上一轮完成后再调度，避免请求重叠。明确暂停的是自动取数、局部动画还是两者；恢复时按当前 Builder 配置取数。刷新周期、反馈最短时长和数字动画时长由场景维护。
- 批量请求按数据源实际能力执行；使用 server-runtime 时遵守 [批次协议](../../server-runtime/references/protocol.md)。`Promise.all` 只保证并发，多个批次不自动共享数据库快照；比较查询需要一致截止点时在本轮开始统一确定。
- 控件与受影响区域提供 loading / busy、空数据、失败和重试状态。后台失败保留上次成功结果时说明其范围，不能展示为新条件下的成功结果；首次失败有明确恢复入口。
- VChart / VTable 实例更新、尺寸调整见 [渲染实例与空结果](query-and-render.md#渲染实例与空结果)。重复刷新不重复绑定事件；事件回调读取当前有效结果。语义未变的格式化回调保持稳定引用，避免无意义重建。
- 卸载时解除 DSL 订阅、图表和原生事件监听，断开 ResizeObserver，取消请求、计时器和动画帧，释放实例。减少动态效果偏好影响呈现，不改变查询口径或真实数值。

## 验证组合行为

用可核对的数据验证全局与局部筛选、比较周期和指标分母，观察 Connector 调用次数：相同结果的多个视图以及纯视觉切换不重复取数。连续改变条件时最终范围一致，旧请求与悬停不能回写。验证空结果、断线重试、暂停恢复、尺寸变化和卸载；承诺保存的配置在新 VBI 实例经过 JSON 往返后恢复。

卡片动效、主辅联动、窄屏设计，以及地图导航、实时反馈与业务范围，按宿主或场景指南的要求验收。
