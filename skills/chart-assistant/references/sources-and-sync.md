# URL、数据来源与同步

## 1. URL 角色总表

| 字段/入口 | 角色 | 首次加载 | 手动同步 | 自动同步 |
| --- | --- | --- | --- | --- |
| `StandardData.value.source` + `larkSheet` | Sheet live data source | 是 | 是 | 条件支持 |
| `StandardData.value.source` + `larkBase` | Base live data source | 是 | 是 | 条件支持 |
| `AeolusData.value.url` | 风神来源/回退请求 | 是 | 条件支持 | 条件支持 |
| `AeolusData.value.requestUrl` | 风神实际请求 | 是 | 随风神 | 随风神 |
| `IChartAeolusOption.sourceInfo.url` | 外部首次建图入口 | 是 | 转换后按 Aeolus source | 同左 |
| record 顶层 `url` | 卡片 URL 导入入口 | 是 | 取决于解析结果 | 取决于解析结果 |
| Common URL `config.data.url` | 通用接口请求 | 是 | 不默认承诺 | 不默认承诺 |
| `ISource.pageUrl` | 来源展示/跳转 | 否 | 否 | 否 |
| VSeed/VizData `source.url` | 来源记录/加载 | 是 | 按运行时 | 不默认承诺 |
| image/svg/resource URL | 视觉资源 | 是 | 否 | 否 |

“条件支持”不是模糊承诺，而是必须同时满足后文资格。

### 1.1 展示来源的硬规则

- 新建时用户未指定来源信息，省略整个 `commonOption.source`，不输出空对象或 `{showSource:false}`。不得因为运行在 iDA、飞书或其他平台，或复制某个示例，就添加宿主名称；`appName` 由用户明确指定或接入层提供，模型不推断。已有来源字段按原值保留，除非用户要求修改。
- 只有拿到可访问的真实来源 URL 时才展示来源：`showSource:true`、可读的 `sourceName`、非空 `pageUrl` 必须同时存在。
- 没有 URL（例如用户只上传本地 CSV）且未指定来源时，省略整个 `commonOption.source`。仅在用户明确要求隐藏已有来源时设置 `showSource:false`；不要传 `pageUrl:""`，不要把文件名、聚合步骤、统计口径或“用户上传”当成来源链接。
- `source.pageUrl` 会在卡片来源区提供“前往源数据”的可点击入口。它不是同步源。
- 标题 rich text 可以用第二行显示来源名称或口径，但 rich text 片段本身不能绑定 URL。若产品要求来源必须可点击，保留卡片来源区；不能通过虚构 `href/url/onClick` 字段把来源伪装进标题。
- 不再为同一来源额外创建 text element；否则会与卡片来源区和标题重复。

## 2. Sheet

```ts
interface ILarkSheetConfig {
  tableId: string;
  rangeStart: string;
  rangeEnd: string;
}
```

```json
{
  "type":"standard",
  "value":{
    "columns":["月份","销售额"],
    "rows":["1月","2月"],
    "data":[{"月份":"1月","销售额":120},{"月份":"2月","销售额":140}],
    "source":{"type":"larkSheet","url":"<sheet-or-wiki-url>","config":{"tableId":"<sheet-id>","rangeStart":"A1","rangeEnd":"B100"}}
  }
}
```

规则：

- 支持 Sheet URL 和包含 Sheet 节点的 Wiki URL；运行时解析 token 和 `tableId`。
- `rangeStart/rangeEnd` 同时存在时必须是合法范围且 start ≤ end；整表读取可由运行时用空/省略范围表达，不能杜撰 `A1:Z9999`。
- Sheet config 不存在 `enableAggregate`；聚合开关只属于 Base。运行时按首行为表头、其余行逐行构造 standard data，不会进入 Base 的聚合分支。
- 用户明确要求“不聚合”“直接使用读取数据”“保持自动同步”或“编辑页回显 Sheet URL”时，进入 **direct-live 模式**。该模式把运行时读到的 range 结果直接作为最终 `StandardData.value`；LLM 只能选择图表模板、字段映射和视觉配置，不得执行 group-by、sum/avg/count、去重合并、Top N、补零、pivot、派生指标或其他数据改写，也不得因重复维度值自行聚合。
- direct-live 允许的结构规范化仅限运行时读取所必需的行为：裁掉尾部全空行/列、把空或重名表头规范为唯一列名、解析单元格标量。它们不改变非空数据行的粒度。新建时不额外生成 columnFilters/columnSorts 或转置；编辑已有卡片时若这些状态已经存在，应说明它们会在同步时保留，只有用户同意才清除。
- direct-live 的 source 必须与最终数据放在同一个 `StandardData.value` 中：`source.type:"larkSheet"`、真实 `source.url`、`config.tableId/rangeStart/rangeEnd` 缺一不可。`commonOption.source.pageUrl` 只是来源跳转，不能替代数据内的 source。物化/readback 后必须确认这些字段仍存在且 `sourceBinding.mode:"live"`；这样同步才能重新读取同一 range，编辑页才能从数据源字段回显 URL。
- 目标模板不能直接消费当前行级形状时，返回“模板不兼容 + 最小替代方案”，让用户选择换模板或退出 direct-live。用户若明确要求聚合/pivot/派生数据，且当前 Sheet source config 无法重放该转换，产物必须标为 snapshot、不得承诺自动同步；可另保留 `pageUrl` 作为来源跳转。
- 首行生成唯一 column name，空/重名表头运行时可能规范化；mapping 必须引用规范化后的字段。
- 当前卡片保存的是数据快照 + source config。同步重新读取源，不能把卡片内单元格编辑默认为写回 Sheet。
- 教程记录的 Sheet 数据上限为 10 MB；真实限制可能随宿主变化，超过时让运行时返回明确错误，不截断后假装完整。

## 3. Base

```ts
interface ILarkBitableConfig {
  tableId: string;
  viewId: string;
  enableAggregate: boolean;
  dimensions: { fieldId: string; fieldName: string; statisticType?: "sum"|"avg"|"max"|"min"|"count" }[];
  metrics: { fieldId: string; fieldName: string; statisticType?: "sum"|"avg"|"max"|"min"|"count" }[];
  enableCount: boolean;
}
```

最低读取条件通常是 `tableId`；聚合/选视图模式要求 `tableId + viewId + 至少一个 dimension`。聚合时 metrics 的 statisticType 决定 sum/avg/max/min/count，`enableCount` 追加计数字段。

复杂字段会由运行时转换成可展示的标量；不能处理的值变成 null，模型不得自行展开人员/附件/数组字段并声称等价。

教程记录的 Base 上限为 10 MB、单次最多 500 条，且可能有数据缓存；超过范围或源更新未反映时应提示分页/缩小视图或清缓存。以目标宿主当前限制为准，不能静默丢弃 500 条以后的数据。

## 4. 风神

保存 `url`、可选 `requestUrl`、`dashboardTempQuery` 和解析后的 chart type。`requestUrl` 优先于 `url`，不由模型拼接。临时查询参数、用户身份和 token 属于运行时，不写入知识文件或输出。

风神可视化查询 URL 表示一个已经在风神定义好的可视化查询/图表。它的职责是让 Aeolus plugin 加载和同步该图表，而不是向 LLM 暴露一份行数据供重新制图：

- 首次建卡使用 record 顶层 `{url, option}`，或 commonOption chart 的 `sourceType:"aeolus" + sourceInfo.url`；不要同时提供 standard `data`、内置 `chartType` 或内置 `mappingSpec`。
- 插件解析后保存 `temp:"aeolus"`、`data.type:"aeolus"`、实际 `chartType` 以及 `url/requestUrl/dashboardTempQuery`。同名 chart type 仍是风神图，不转换成内置模板。
- 同步重新触发 Aeolus 数据解析和图表更新，保持 Aeolus 图表语义与插件 modelSpec；禁止走“fetch URL → 提取 rows → 选择内置模板 → 生成新图”的流程。
- 若 URL 只能返回数据而不能被 Aeolus plugin 识别，它就不是本节的风神可视化查询 URL；不得降级伪装成风神同步，可按 Common URL/普通数据源重新分类并明确同步边界。

教程记录的风神导入上限为 4 MB，且只保存每次同步快照；源图修改要先在风神保存，再同步。未保存的查询链接只能得到当时编辑快照，后续同步未必变化。缓存可能导致结果滞后，先按宿主入口清缓存再判断失败。

## 5. Common URL

Common URL 通常把配置编码在入口 URL 中：

```ts
{
  data: { url: string; method?: "get"|"post"; headers?: object; body?: unknown; dataPath?: string };
  dataType: "commonOption" | "standard" | "vizData" | "vseedDsl" | "editorData";
  options?: { fetchInFe?: boolean; redirectURL?: string };
}
```

区分：入口 URL、实际 `data.url`、点击跳转 `redirectURL`、来源展示 `pageUrl`。Common URL 能加载并不自动意味着宿主保存了可重复鉴权的 live source；只有当前运行时明确识别为 syncable 且保存 `sourceBinding: live` 时才声称可同步。

## 6. record 顶层 URL

飞书卡片可直接传 `{url, option}`。教程明确支持风神可视化查询、图表助手通用链接、图表助手分享链接，以及能返回兼容 common config 的链接。URL 加载后应检查最终保存的是 Aeolus、commonOption、standard、VSeed/VizData 还是 snapshot，再决定同步语义。

## 7. 自动同步资格

```text
record.autoSync === true
AND sourceBinding.mode === "live"
AND source kind 被当前运行时标为 syncable
AND URL/config 可校验
AND 对应插件/数据源服务已注册
AND 当前用户持有源数据权限
```

`autoSync: true` 只是请求，不会让普通 URL 获得同步能力。打开正文卡片并完成首次加载后，浏览态才尝试自动同步。

旧教程主要描述手动同步快照；当前代码已存在浏览态 `autoSync` 路径。对外表述应是“手动同步是基础能力；自动同步只在当前宿主满足完整资格时可用”，不能用旧教程否定新能力，也不能反过来对所有链接承诺自动同步。

## 8. 同步保持项

同源刷新必须保留图表类型、mappingSpec、modelSpec、theme/color、MBB、marker 和元素布局。字段集合变化时：

- 同名字段继续绑定；字段重命名不能按位置猜。
- 缺失映射字段时停止应用并提示，而不是改绑其他列。
- columnFormats/Filters/Sorts 是否沿用由同源策略决定；字段删除时清理或要求确认。
- 同步失败保留旧快照，绝不清空图表。

当前飞书 Sheet/Base 同步在应用新数据前核对完整列名及顺序；任一列改名、增删或换序都停止应用，并提示恢复原字段或重新配置映射。这比“仅检查映射字段”更保守，因为现有筛选、排序和格式仍按列位置保存；在这些状态完成按字段身份迁移前，不能仅凭同名字段就接受换序。

## 9. 权限与安全

读取源数据和写文档是两套权限。遇到 401/403 提示通过宿主重新授权；不要要求用户粘贴 user access token、cookie 或风神 token。未知 URL 不主动探测，除非用户任务明确授权。
