# 本地服务与数据接入

由 [看板入口](../../SKILL.md)按需加载，供分析页面和 Dashboard 共用。运行程序位于 `scripts/runtime/`；页面查询、渲染、组合与联动按 [visual-query](../visual-query/guide.md)执行，业务指标、视觉和地图实践由对应场景维护。

## 数据接入判断

按以下顺序判断，命中后采用对应方式：

1. 已有可用的接入方式，优先复用。
2. 数据独立、规模小、容易内嵌，且无需实时刷新时，直接[内嵌到 HTML](../visual-query/references/html-integration.md#静态独立-html-的数据内置)。
3. 需要实时刷新时，使用 server-runtime。
4. 数据规模大、不适合内嵌时，使用 server-runtime，在服务端查询和聚合。
5. 页面运行时需要请求 HTTP 接口时，通过 server-runtime 取数，避免浏览器跨域。
6. 其余场景，根据数据来源和运行环境自行判断。

## 选择数据源

确定使用 server-runtime 后，按数据来源选择运行方式。

| 来源                 | 运行方式与资料                                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 本地或远程 MySQL     | 默认 `VBI_SOURCE_TYPE=mysql`；复用只读事务与参数化 SQL，见 [MySQL 接入](references/mysql.md)。                                       |
| 本地 JSON / CSV      | `VBI_SOURCE_TYPE=file`；每批查询读取文件快照，再由 VQuery 查询，见 [文件数据源](references/data-sources.md#本地文件)。               |
| HTTP / HTTPS 接口    | `VBI_SOURCE_TYPE=http`；服务端取数，支持方法、请求头、请求体和 JSON 行路径，见 [HTTP 数据源](references/data-sources.md#http-接口)。 |
| 其他数据库或接口协议 | `VBI_SOURCE_TYPE=module`；使用本地适配器实现相同的数据源契约，见 [自定义适配器](references/data-sources.md#自定义适配器)。           |

先核对用户的数据位置、字段 schema、认证方式、数据规模和刷新需求。默认文件与 HTTP 模式会完整读取数据，限制 8 MiB；大规模数据应使用数据库查询或自定义适配器。分页、嵌套记录转换、其他数据库驱动查询等通过自定义适配器完成，不把一页响应冒充完整数据。

## 启动与页面接入

Node.js >=24.12.0。在能访问数据源的机器执行；云端容器的 localhost 不代表用户电脑。安装 runtime 的公开 npm 依赖后启动：

```sh
# 从本技能根目录执行
cd references/server-runtime/scripts/runtime
npm ci --ignore-scripts
# 根据所选数据源配置环境变量，或在本目录创建仅供本地使用的 .env。
npm start -- /absolute/path/to/dashboard.html
```

服务默认监听 `127.0.0.1:4317`，端口用 `VBI_PORT` 设置；按终端打印的 URL 打开页面，`Ctrl+C` 停止。配置路径相对于启动时的工作目录，优先使用绝对路径。分发时提供 HTML、声明的资源、服务文件、依赖清单和锁文件。

页面与服务同源，Connector 请求相对路径 `/api/context` 和 `/api/query`。服务端请求上游 HTTP 不受浏览器 CORS 响应头限制；上游鉴权、网络可达性和 TLS 仍需正常满足。不要让页面直接读取本地文件、携带数据库凭据或重复请求上游接口。具体令牌、JSON 注入和响应格式见 [页面与服务协议](references/protocol.md)。

## 职责与资源

- 数据源提供 `context()`、`query(queries)` 和 `close()`；runtime 负责同源校验、HTTP 协议、请求限制与生命周期。文件路径、上游 URL 和认证信息由服务端配置，不从浏览器请求体接收。
- 分析配置由 [VBI API 指南](../api/vbi/guide.md)的 DSL / Builder 描述，查询与 SQL 编译复用 [VQuery API 指南](../api/vquery/guide.md)；图表 Spec 交给 [VSeed API 指南](../api/vseed/guide.md)。适配器不重写业务聚合规则。
- 凭据仅在服务端环境或 `.env` 中，响应与日志不回显凭据或上游错误正文。默认使用只读来源；写入操作需遵循用户当前任务的明确授权。
- 同一查询批次使用一次数据快照。文件/HTTP 模式每批重新取数，页面按 [visual-query 的刷新流程](../visual-query/references/composition.md#刷新订阅与生命周期)处理刷新、过期响应、暂停与恢复；没有后台轮询任务。自定义适配器需明确快照与分页口径。
- runtime 只提供指定 HTML 与其声明的 JSON 注入资源，不开放目录浏览或任意代理。页面使用的本地资源和许可证随产物交付。

## 验证与交付

新增自定义适配器时，验证真实查询、错误恢复、连接关闭与凭据隔离，不只检查服务能否启动。

在浏览器验证所选来源的同源取数、筛选和刷新，以及断线/空数据/取消后的表现；核对页面与来源的汇总口径。交付 HTML、必要资源、服务端配置说明、启动与停止命令；服务需要持续运行时告知地址，只有用户需要长期后台运行时才配置系统服务。
