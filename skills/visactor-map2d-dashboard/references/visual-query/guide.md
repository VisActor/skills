# 查询、可视化与页面组合

单图、指标卡、表格与普通分析页面直接使用本篇；构建 Dashboard 时，由调用方提供布局与视觉要求。本篇只依赖通用能力与 API 文档，不引用具体场景技能、模板或其他 package 的实现。展示场景与数据来源分别选择。

## 通用工作流

1. 确认分析问题、字段 schema、粒度、聚合、去重、单位与时间范围。类型转换与字段映射在接入边界完成；聚合、筛选、排序通过 Builder 描述，由查询层执行。用可核对的数据建立预期结果。
2. 为实际来源注册 Connector，以 `discoverSchema()` 提供 schema、`query()` 执行传入的查询 DSL。内置 JSON / CSV 使用 VQuery；数据库、文件和服务端 HTTP 接入按需读取 [server-runtime](../server-runtime/guide.md)。
3. 用 Chart Builder 配置图表类型、维度、指标、编码和筛选。调用 `await chart.buildVSeed()`，得到查询结果 `dataset` 与可视化配置；保留维度和度量的字段 ID。
4. 用 VSeed Builder 将 seed 构建为 VChart / VTable Spec，由渲染器绘制。HTML 指标、文字或其他视图也可消费相同结果；绘制函数接收 seed，避免各视图内部重复查询。
5. 在页面中组织容器、资源关系和交互范围。分析条件通过 Builder 修改，经统一刷新路径重新查询并更新已有实例；纯视觉变化复用当前结果。处理过期响应、空结果、加载失败、尺寸变化和资源释放。

已有数据源、Builder 或宿主页面时沿用其公开接入，只执行本次任务涉及的步骤。

## 调用链与职责

```text
Chart Builder 描述分析
  → buildVSeed()
    → Connector.query() → VQuery / 数据源执行
    → 包含 dataset 的 VSeed DSL
  → VSeed Builder 构建 Spec
  → VChart / VTable 渲染，或 HTML 消费查询结果
```

`build()` 导出分析 DSL，`buildVQuery()` 只生成查询配置；Connector 的 `query()` 只返回 `{ dataset }`，`buildVSeed()` 才是获取数据与 VSeed 配置的统一入口。数据库 SQL 由查询层编译，坐标轴、图形、透视布局和命中由渲染器处理。页面负责组合、呈现与交互接入。

统一流程允许多条不同口径的查询。同一结果可以服务多个视图；只有数据源、字段、聚合、筛选、粒度和快照范围一致时才复用。全量汇总不能由截断明细估算，跨重叠分组的去重数不能直接相加。

可保存的分析配置、Dashboard 布局与资源引用归所属 DSL，由公开 Builder 操作；请求、缓存、计时器、悬停和动画属于运行时。联动定义、衍生公式及其依赖若尚无对应 DSL 能力，须说明当前恢复边界，不能把最终筛选值或 Insight 文本当成完整可恢复定义。

## 按任务读取参考

| 当前任务                                                        | 参考                                                |
| --------------------------------------------------------------- | --------------------------------------------------- |
| 数据接入、统一查询、字段映射、结果复用、Spec 与实例更新         | [查询与渲染](references/query-and-render.md)        |
| 图型切换、Morph、reuse、过渡异常与中间帧验收                    | [Morph 与更新策略](references/morph-transitions.md) |
| 页面资源关系、筛选作用域、联动、自动刷新、取消、保存恢复        | [组合与联动](references/composition.md)             |
| 单文件 HTML、浏览器依赖、内置数据、图表 / 普通表 / 透视表教程   | [HTML 接入](references/html-integration.md)         |
| 主页与分析明细的表格 token、Canvas 主题、选中态与完整结果滚动   | [表格主题与适配器](references/table-theme.md)       |
| 本地服务、数据库、文件、HTTP 与自定义数据源适配器               | [server-runtime 指南](../server-runtime/guide.md)   |
| 实例、Chart / Dashboard / Insight Builder、Connector 与资源 API | [分析配置 API](../api/vbi/guide.md)                 |
| 数据集、查询 DSL、SQL 编译与查询适配器 API                      | [数据查询 API](../api/vquery/guide.md)              |
| 可视化 DSL、Spec、主题、编码与 Pipeline API                     | [可视化配置 API](../api/vseed/guide.md)             |

参考按当前任务选读；字号、动画参数、主辅关系、地图、实时反馈与具体业务口径由宿主或场景指南维护。

## 验证与交付

- 面向用户使用「Dashboard 看板」「轻量看板」「地图看板」及业务目标说明方案。页面标题、控件、加载提示和交付说明使用业务语言，默认不添加技术品牌、库名、Logo 或 “Powered by”；占位品牌替换为用户业务名称，保留数据来源、统计口径与必需的第三方署名。
- 技术名称用于实现、API 查阅和必要的安装启动说明；用户询问技术栈或提出集成要求时，如实说明所用组件、版本与限制。
- 核对筛选前后聚合、去重、分母、时间边界与字段 ID；在不创建 UI 的情况下，同一 Builder 仍应能返回正确结果。
- 在实际页面验证查询复用、图表更新、联动作用域、连续筛选、空结果与错误恢复。后台刷新失败时，不把旧结果标为新范围；局部查看结束后恢复对应范围。
- 涉及图型过渡时，按 [Morph 与更新策略](references/morph-transitions.md)验收中间过程及独立目标图终态，不能只凭最终画面正确判断动画通过。
- 检查窄屏尺寸、键盘入口、减少动态效果与资源释放。承诺持久化的配置，做 JSON 往返及新实例恢复，明确 Connector、原始数据和额外展示配置的接入方式。
- 交付 HTML 或宿主改动、必要数据与启动说明；使用 server-runtime 时说明服务地址与停止方式。Dashboard 的视觉质量另按所选场景验收。
