# 页面与服务协议

运行方式与来源选择见 [server-runtime](../guide.md)。所有数据源对页面提供相同协议，页面通过 VBI Connector 对接。

## 会话与请求

HTML 使用 `<meta name="vbi-session" content="__VBI_SESSION_TOKEN__">` 声明会话占位符。服务提供页面时注入临时令牌，所有 API 请求通过 `X-VBI-Token` 请求头传入；重启服务后重新加载页面。页面与 API 均从服务打印的 `http://127.0.0.1:端口/页面名` 打开，避免混用 `localhost` 和 `127.0.0.1`。

```javascript
const token = document.querySelector('meta[name="vbi-session"]').content
const context = await fetch('/api/context', { headers: { 'X-VBI-Token': token } }).then((response) => response.json())
const query = async (queries, signal) => {
  const response = await fetch('/api/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-VBI-Token': token },
    body: JSON.stringify({ queries }),
    signal,
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error)
  return result.results
}
```

`context.schema` 提供真实字段与类型；用 `context.sourceId` 注册 Connector。`query()` 传入 Builder 生成的 DSL，结果保持字段 ID，不发送 SQL、文件路径、上游 URL 或凭据。完整 Builder 与 Connector API 通过 [VBI](../../api/vbi/guide.md)和 [VQuery](../../api/vquery/guide.md)API 文档查阅。

## 接口与约束

- `GET /api/context` → `{ sourceId, schema, now }`。MySQL 返回数据库会话时钟；文件/HTTP 返回服务端 ISO 时间。`now` 是服务时钟，不代表业务数据最新日期或数据已经成功刷新。
- `POST /api/query` 接收 `{ queries: VQueryDSL[] }`，返回 `{ results: [{ dataset: [...] }] }`。数组顺序与输入一致，同一批次读取一次来源快照。
- 请求体上限 64 KiB，每批 1–10 条 DSL，并发最多 3。MySQL 查询及 HTTP 上游请求限制 4 秒；文件/HTTP 响应上限 8 MiB。限制失败时由页面提示缩小查询或调整服务端适配器。
- Host、Origin、跨站请求标识与会话令牌按现有本机同源规则校验。SQL/DSL 校验错误返回 400；数据源失败返回 503，消息不包含连接凭据或上游正文；页面保留上次结果并提供重试。
- HTML 使用 `no-store`；关闭时释放连接、HTTP 监听与信号处理。浏览器取消请求不等于已经取消数据库或自定义适配器中的工作，适配器需自行设置超时和释放资源。

## 页面与资源注入

需要本地 JSON 展示资源时，在 HTML 中声明空的数据脚本：

```html
<script type="application/json" id="chart-data" data-src="./chart-data.json"></script>
```

runtime 相对于 HTML 解析 `data-src`，读取 JSON、转义 `<` 后注入该 script；页面从对应节点 `textContent` 解析。只有双引号属性、`type="application/json"` 且内容为空的 script 参与注入，普通 script 保持原样。

这种注入用于静态地图、配置等页面资源，启动时读取一次；会刷新的业务数据通过所选数据源查询。路径由 HTML 作者声明，runtime 不包含地图或具体行业的资源规则。
