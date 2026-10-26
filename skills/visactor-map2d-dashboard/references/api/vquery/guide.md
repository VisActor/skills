# VQuery 数据与查询

由 [统一入口](../../../SKILL.md)按需加载。本篇说明查询工作流；[API 索引](index.md)区分 Node、浏览器与默认入口的公开导出。

## 选择执行方式

- 内存数据集：使用 `VQuery` 创建数据集、提供列 schema 与 CSV / JSON 来源，连接 `Dataset` 后执行查询。按环境选择存储适配器，IndexedDB 依赖浏览器支持，不假定 Node 与浏览器导出完全相同。
- 外部数据库：使用 `compileQuery()` 将查询 DSL、实际表标识、方言和完整逻辑 schema 编译为 `{ sql, parameters }`，由宿主数据库驱动绑定参数并执行。编译器本身不管理数据库连接或执行 SQL。
- 在 [VBI](../vbi/guide.md)中接入时，Connector 承接公开 Builder 生成的查询，返回保持字段 ID 的结果；不要忽略筛选条件后返回整表，也不要在页面事件中重写查询规则。

## 查询口径与生命周期

- 使用实际列名和类型，核对 `select`、`where`、`groupBy`、`having`、`orderBy` 与 `limit`。原始行筛选与聚合后筛选分别用 `where` / `having`，不互相替代。
- 聚合和去重交由查询层完成；去重结果不能跨重叠分组合并相加。比率与比较基于同一数据范围，零分母、空值、负值与时间边界按业务口径处理。
- `compileQuery()` 使用完整 schema 进行语义校验与方言处理。执行时保留参数绑定，数据库权限、只读事务、超时和连接释放归运行服务。
- 数据集更新、临时连接与查询结果遵循当前 API；完成后关闭数据集或查询实例，避免遗留存储与查询资源。
- 页面连续查询时防止旧结果覆盖新筛选。缓存与加载状态属于宿主，不写进查询 DSL。

## 按需查阅 API

| 任务                                | 文档                            |
| ----------------------------------- | ------------------------------- |
| VQuery 初始化、数据集管理与继承成员 | [runtime](runtime.md)           |
| Dataset 与数据源 Builder            | [dataset](dataset.md)           |
| SQL 编译、方言和参数化结果          | [sql-compiler](sql-compiler.md) |
| 存储与查询适配器                    | [adapters](adapters.md)         |
| DSL、schema 与查询类型              | [types](types.md)               |
| URL 与数据来源工具                  | [utils](utils.md)               |

核对汇总、去重、筛选组合与时间边界，确认实际数据库或数据集结果与上层页面一致。服务端数据库、文件与 HTTP 接入按需查阅 [server-runtime 参考指南](../../server-runtime/guide.md)，需要串联查询、渲染和页面交互时阅读 [visual-query](../../visual-query/guide.md)，具体 Spec API 再读 [VSeed](../vseed/guide.md)。
