# MySQL 数据源

查询 DSL、SQL 编译与 schema 校验的 API 参考见 [VQuery API 指南](../../api/vquery/guide.md)；本篇维护 MySQL 连接、只读事务与数据库时钟约定；启动流程见 [server-runtime](../guide.md)。

`scripts/runtime` 直接提供 HTML、查询接口和 MySQL 只读执行。启动时指定 HTML，连接参数放在环境变量或 `.env` 中。

## 启动

```sh
# 从本技能根目录执行
cd references/server-runtime/scripts/runtime
npm ci --ignore-scripts
# 将 .env.example 复制为 .env，填写账号、数据库和表名。
npm start -- /absolute/path/to/dashboard.html
```

必须设置 `VBI_MYSQL_USER`、`VBI_MYSQL_DATABASE` 和 `VBI_MYSQL_TABLE`。`VBI_MYSQL_HOST` 默认 `127.0.0.1`，`VBI_MYSQL_PORT` 默认 3306，密码由 `VBI_MYSQL_PASSWORD` 提供。服务只监听本机，默认端口 4317，可用 `VBI_PORT` 调整；按打印的 URL 打开页面，`Ctrl+C` 停止。

runtime 通过 `SHOW COLUMNS` 读取并缓存表结构，映射为 VBI / vquery 的 number、string、date、datetime、timestamp 类型；数据源 ID 使用表名。字段和类型随实际表结构提供，修改表结构后重启服务。

MySQL 会话偏移 `VBI_MYSQL_TIMEZONE` 默认 `+00:00`，按数据语义设置；context 的数据库时钟使用同一会话时间。刷新间隔由页面管理。凭据仅保存在进程环境或本地 `.env` 中，实际 `.env` 不随产物分发。

页面会话、JSON 资源注入与 HTTP 协议见 [页面与服务协议](protocol.md)。

## 接口与验证

- `GET /api/context`：`{sourceId, schema, now}`：实际表名、表结构与数据库会话时钟。
- `POST /api/query`：`{queries: VQueryDSL[]}` → `{results: [{dataset: [...]}]}`。DSL 与完整 schema 交给 vquery 编译，mysql2 绑定执行结果；runtime 不补充业务字段或 limit。
- 每批查询共用只读一致性事务，失败回滚并归还连接。请求体最多 64 KiB、批次 1–10 条、并发最多 3，数据库查询限制 4 秒。校验 Host、Origin 和会话令牌，不接收任意 SQL。
