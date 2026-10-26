# 文件与 HTTP 数据源

来源选择、安装和启动见 [server-runtime](../guide.md)，页面协议见 [protocol](protocol.md)。以下命令在 `scripts/runtime/` 目录执行。环境变量也可写入本目录 `.env`，不要把包含鉴权信息的示例复制到 HTML。

## 通用配置

文件和 HTTP 模式必须提供 `VBI_SOURCE_SCHEMA`：JSON 数组，字段名唯一，类型为 `number`、`string`、`date`、`datetime` 或 `timestamp`。实际字段与业务口径需先核对，不能用推测的列名填充。数字转换、CSV 解析、过滤和聚合复用 VQuery。

`VBI_SOURCE_ID` 默认 `local-data`；`VBI_SOURCE_FORMAT` 为 `json` / `csv`。文件默认根据 `.csv` 扩展名选择，否则使用 JSON；HTTP 默认 JSON。JSON 默认要求顶层为记录对象数组；包裹响应用 `VBI_SOURCE_ROWS_POINTER` 指向数组，遵循 JSON Pointer，例如 `/data/items`，键名中的 `/` 与 `~` 分别用 `~1`、`~0`。

每个 API 查询批次只加载一次来源数据，批次内的所有 DSL 使用该份数据；下一批重新加载。文件/HTTP 模式在服务端内存中执行查询，适合小型完整数据集；大数据或需要上游聚合时使用自定义适配器，不在页面自行汇总截断响应。

## 本地文件

```sh
VBI_SOURCE_TYPE=file \
VBI_SOURCE_FILE=/absolute/path/to/sales.csv \
VBI_SOURCE_SCHEMA='[{"name":"region","type":"string"},{"name":"sales","type":"number"}]' \
npm start -- /absolute/path/to/dashboard.html
```

数据路径由进程环境配置；浏览器不能选择任意服务器文件。JSON 输入必须是记录数组或通过 JSON Pointer 提取为记录数组；CSV 的表头与 schema 对齐。日期格式、单位、时区和缺失值在源数据与页面口径中明确，runtime 不制造业务字段。

## HTTP 接口

```sh
VBI_SOURCE_TYPE=http \
VBI_HTTP_URL=https://api.example.com/sales \
VBI_SOURCE_ROWS_POINTER=/data/items \
VBI_SOURCE_SCHEMA='[{"name":"region","type":"string"},{"name":"sales","type":"number"}]' \
npm start -- /absolute/path/to/dashboard.html
```

默认 GET。按上游约定设置 `VBI_HTTP_METHOD`、`VBI_HTTP_HEADERS`（JSON 对象，值为字符串）和 `VBI_HTTP_BODY`（原始请求体文本）。POST JSON 时在请求头明确 `Content-Type: application/json`；鉴权 token 只放在环境或 `.env` 中。CSV 接口设置 `VBI_SOURCE_FORMAT=csv`。

请求在 Node.js 服务端执行，不依赖上游的浏览器 CORS 响应头。仅支持 HTTP / HTTPS，保留 TLS 校验，上游请求 4 秒超时且不自动跟随重定向；配置最终地址。失败不把上游错误正文返回页面。

内置模式读取一份完整响应，不自动处理分页、游标、嵌套记录展开、接口特有签名或增量协议。这些能力通过本地适配器对接；正常接口响应中缺少预期数组时明确失败，不以空值掩盖字段路径错误。

## 自定义适配器

`VBI_SOURCE_TYPE=module`，`VBI_SOURCE_MODULE=/absolute/path/to/adapter.mjs`。这是用户维护的服务端代码，不接收浏览器传入的模块路径。模块导出 `createSource(env)`，同步或异步返回以下契约：

```javascript
export async function createSource(env) {
  // 在此连接实际数据库或 HTTP 客户端，凭据仅从服务端配置读取。
  const client = await connectToSource(env)
  return {
    async context() {
      return { sourceId: 'business-data', schema: await client.discoverSchema(), now: new Date().toISOString() }
    },
    async query(queries) {
      // 按输入顺序返回 [{ dataset: [...] }]；执行实际 DSL，不忽略筛选。
      return executeQueries(client, queries)
    },
    async close() {
      await client.close()
    },
  }
}
```

`connectToSource` 和 `executeQueries` 表示待按实际驱动实现的边界，不是 runtime 内置函数。复用 [VQuery API 指南](../../api/vquery/guide.md)的查询/SQL 编译能力；需要将校验错误返回 400 时使用 runtime 的 `errors.mjs` 导出的 `QueryError`，其消息应只包含可公开的校验说明。

适配器自行处理分页、请求签名、协议映射、快照一致性、超时和连接释放；支持其他数据库时使用对应驱动并绑定参数。对齐 Builder 的字段 ID、过滤、聚合与结果顺序。不得把上游返回的一页数据标记为全量或声称内置 MySQL 驱动支持其他数据库。
