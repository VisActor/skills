# 风神图表定义与能力

## 保存结构

外部首次建图：

```json
{"type":"chart","position":{"x":0,"y":0,"width":640,"height":360},"options":{"sourceType":"aeolus","sourceInfo":{"url":"<风神图表助手地址>","method":"get"}}}
```

这是图表导入/同步配置，不是数据抓取配置。`sourceInfo.url` 必须交给 Aeolus plugin；不要先 fetch 成 rows，不要补 standard `data`，不要让 LLM 重新选择内置模板或生成内置 `mappingSpec`。若直接创建飞书卡片，也可使用 record 顶层 `{url, option}` 让宿主完成同一插件解析流程。

编辑态：`attribute.temp = "aeolus"`，`attribute.data.type = "aeolus"`。运行时解析后 `data.value` 还会包含实际 `chartType` 和插件提供的数据/元信息；URL 核心字段为：

```ts
{ url: string; requestUrl?: string; dashboardTempQuery?: boolean; chartType?: string; ... }
```

`requestUrl` 同步时优先，缺失回退 `url`；它由插件/运行时产生，模型不得自行拼接。任何 token 或临时鉴权字段不得进入 Skill 输出。

## 当前已知 Aeolus chart type

表格：`table`, `raw_table`, `pivot_table`, `trend_table`, `okr_table`。

柱条：`column`, `column_percent`, `column_parallel`, `bar`, `bar_percent`, `bar_parallel`。

趋势/构成：`line`, `area`, `area_percent`, `pie`, `annular`, `rose`, `scatter`, `circle_views`。

组合：`double_axis`, `bilateral`, `combination`。

地图：`map`, `scatter_map`, `gis_map`, `gis_mark_map`, `gis_heat_map`, `gis_pulse_map`, `gis_trace_map`, `gis_bar_map`。

指标/专用：`measure_card`, `comparative_measure_card`, `measure_trend`, `word_cloud`, `histogram`, `funnel`, `radar`, `sankey`, `gauge`, `progress`, `waterfall`, `waterfall_change`, `extend`。

是否真正可加载/编辑还取决于目标宿主注册的 Aeolus plugin；枚举存在不是运行时可用证明。

## 明确能力集合

| 能力 | 风神类型 |
| --- | --- |
| barLink | `column`, `column_percent`, `bar`, `bar_percent`；代码注释提及 dual-axis，但当前能力常量不含 `double_axis`，按不支持处理 |
| barWidth | 上述 + `column_parallel`, `bar_parallel`, `waterfall`, `waterfall_change`, `combination`, `double_axis`, `bilateral` |
| seriesLabel | `column`, `column_percent`, `bar`, `bar_percent`, `line`, `area`, `area_percent`, `waterfall`, `waterfall_change`, `double_axis` |
| totalLabel | `column`, `column_percent`, `bar`, `bar_percent`, `area`, `area_percent`, `waterfall`, `waterfall_change`, `double_axis` |
| trendLine / partition | `scatter` |
| polar edit | `radar`, `pie`, `rose` |
| no axes | `gauge`, `progress`, `word_cloud`, `sankey`, `funnel` |
| no normal label | `word_cloud` |
| no legend | `map`, `scatter_map`, `word_cloud`, `gauge`, `progress`, `waterfall`, `waterfall_change` |
| no ordinary type switch | `gauge`, `progress`, `map`, `scatter_map` |
| complete diff marker | `column`, `column_parallel`, `bar`, `bar_parallel`, `line`, `area`, `double_axis`, `waterfall`, `waterfall_change` 及 percentage variants |

## 与内置同名图的差异

- 风神 `double_axis` 不支持本地 `syncAxisDomain` 和本地 stackType 编辑。
- 风神 waterfall 在编辑 UI 中可能关闭常规 legend，即使本地 waterfall 可显示。
- 风神 scatter/histogram 属于 value-chart marker 路径，但实际字段、size/group、数据编辑取决于 plugin 返回结构。
- 风神表格、组合图、透视图和地图没有对应的内置模板字段模型，必须按插件 modelSpec 编辑，不能生成内置 mappingSpec 假装支持。
- Aeolus `chartType` 缺失时只承诺布局、来源、主题等外层能力；不生成 series 专属配置。

## 同步和失败策略

同步要求合法 URL、插件、当前用户权限、live source 和宿主数据同步能力。解析/同步失败保留既有 browserData 快照和样式；提示重新授权或打开源数据，不让用户在对话中粘贴 token。

同步必须保持 `temp:"aeolus"` 和 `data.type:"aeolus"`，重新触发 Aeolus parser 更新既有图表。禁止把同步实现成“下载风神数据 → 转 standard → 重建内置图”；那会丢失风神 chart type、插件 modelSpec 和可视化查询语义。
