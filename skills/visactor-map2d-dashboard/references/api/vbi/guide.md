# VBI 分析配置

由 [统一入口](../../../SKILL.md)按需加载。本篇说明工作流与职责，接口签名见 [API 索引](index.md)。

## 工作流与边界

- 使用 `createVBI()` 创建隔离实例，或在需要共享资源时使用默认 `VBI`。同一看板的 Chart、Dashboard 与 Insight 使用同一实例和稳定资源 ID。
- Connector 提供实际 schema 并执行收到的查询 DSL。字段、维度、指标、聚合、排序和筛选通过公开 Chart Builder 配置；先核对字段 ID、数据粒度、去重方式和单位。
- `buildVQuery()` 获取查询配置；`buildVSeed()` 查询数据并构建可视化 DSL，再交给 [VSeed 参考指南](../vseed/guide.md)生成渲染 Spec。需要数据集管理或 SQL 编译时补读 [VQuery 参考指南](../vquery/guide.md)。
- Dashboard Builder 管理组件、资源引用、布局与主题；新增组件提供 `layouts.lg`，在组件集合 `add` / `update` 回调中设置布局。页面根据布局渲染，不另建一套可保存的领域状态。
- Insight Builder 保存洞察内容。结论与衍生指标来自同一查询范围，文本快照不能代替可重算的指标公式与依赖。
- 保存 Dashboard 时同时保留其引用的 Chart / Insight 资源；在新实例先注册资源，再恢复 Dashboard。Connector、外部数据与运行时实例需由宿主重新接入。
- 使用公开订阅、撤销和协同接口。按事务表达一次领域操作，清理订阅与渲染资源；网络请求、计时器、临时展开状态和动画归 UI。

## 按需查阅 API

| 任务                             | 文档                                      |
| -------------------------------- | ----------------------------------------- |
| 实例、Connector 与资源管理       | [vbi](vbi.md)                             |
| 指标、维度、筛选、聚合与图表配置 | [chart-builder](chart-builder.md)         |
| 组件、响应式布局、主题与撤销     | [dashboard-builder](dashboard-builder.md) |
| 洞察内容与状态操作               | [insight-builder](insight-builder.md)     |
| DSL 与公共类型                   | [types](types.md)                         |

交付时核对查询口径和字段映射；承诺持久化的配置验证 JSON 往返及新实例恢复。能力须能仅通过 DSL 与 Builder 独立使用。从查询到页面呈现的跨库流程见 [visual-query](../../visual-query/guide.md)；完整 Dashboard 再按宿主或独立场景技能的要求验收。
