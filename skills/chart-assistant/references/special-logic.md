# 跨字段特殊逻辑与生命周期

本页集中描述不能从单个类型定义看出的行为。生成或编辑 DSL 前，先判断操作属于首次建图、保存态 patch、换数据、换模板、换源、同步还是类型转换。

## 1. `commonOption` 转换不是字段透传

`options.config` 只有以下编辑态白名单会稳定恢复：

```text
mappingSpec, modelSpec, marker, color, stackType, syncAxisDomain,
theme, templateVersion, dataTransposed, transposed, dataGroupSpec,
markStyle, markZIndexRange, barLink, trendLine, partitionArea
```

规则：

1. 同名值同时出现在 `options.config` 和旧版 options 顶层时，config 优先。
2. `config[key] = null` 是显式清空；只有缺少该 key 或值为 `undefined` 才回退旧顶层字段。
3. 原始 VChart/VTable spec 继续放在 `options.spec`，不能把任意原生 spec 字段塞进 config。
4. `enableDataEdit/enableTypeChange/enableEditorTheme/zIndex` 是共享 options 顶层字段，不属于 config 白名单。
5. standard data 缺少 columns/rows 时运行时会补齐，但模型应显式提供，避免字段顺序和行身份漂移。

## 2. ID 生命周期

| 身份 | 产生位置 | 稳定范围 | 失效条件 |
| --- | --- | --- | --- |
| layer/element ID | 调用方 UUID 或运行时 | 当前保存态 | 模板复制、元素重建 |
| model `id/specIndex` | 当前 VChart runtime | 当前组件结构 | 换模板、series/axis 数量顺序变化 |
| dataGroup key | runtime `dataGroupMap` | 当前 series 分组 | 分组值/series identity/keyIndex 改变 |
| label/grid/legend styleMap key | 当前渲染节点 | 当前渲染快照 | 筛选、排序、采样、分页、同步 |
| `markStyle.id` | 调用方 UUID | 当前覆盖记录 | 删除/重建覆盖；命中仍依赖 datum 字段 |
| marker ID | 调用方 UUID/运行时 | 当前 marker | 删除/重建 marker |
| barLink line/area/label key | 当前绘制 datum/index | 当前连接线快照 | 数据、顺序或连接集合变化 |
| connector target/chartId | element ID | 当前画布 | 元素复制、删除、替换 |

凡是“当前 runtime/渲染快照”身份，都不能从原始表格离线猜。同步后先按业务字段校验，再决定保留、迁移或丢弃局部覆盖。

## 3. 数据更新、替换和换源

- 普通单元格/行列编辑可保留现有 mapping；字段改名只有在运行时明确完成映射迁移时才安全。
- `actionType: "data-replace"` 会删除现有 `mappingSpec`，让运行时重新生成默认映射。若用户要求保持映射，应在替换后用新字段名显式重建并校验。
- 数据不满足目标模板时更新失败，旧可用图表应保留；不要以补零、静默聚合或换图掩盖失败。
- live source 刷新与编辑当前 snapshot 是两种操作。卡片内改数据不等于回写 Sheet/Base/风神。
- 同源刷新也可能使 styleMap、barLink、marker datum 或 dataGroup key 失效；“保留配置”不等于保证每个临时 identity 仍命中。
- 换数保样式时，把视觉样式、业务结论文字和单元素标注分别核对。以编辑器内部逻辑为准：数据变化（`data-change` / 风神 `aeolus-data-update` 链路）时，未被用户手动编辑过的标注文本，其数值部分按新数据自动重算更新（差异标注、直线/值线标注、区域标注的数值文本，机制是文本中的旧数值原地替换为新数值）；用户手动编辑过措辞、或把数值从文本中删除的标注不自动更新，保留用户文本。标准 `data-replace` 换数不触发该重算链路，换数后标注冻结为作者态原样。因此换数后核对标注：会自动更新的数值以新数据为准；用户改过的文本不会自动更新，若其结论与新数据矛盾（含已变化的值、极值、排名或事件判断），由模型判断失真并**直接改写交付配置中的标注文本**（如把失真的标题改为新数据下正确的结论，改标注文本/位置属于配置编辑，模型具备该能力），同时在交付说明中注明更新依据。只列出“已知失真”清单而不在候选配置中给出改写后的文本，视为换数核对未完成；不得把已判定失真的文案原样保留为交付内容。不能静默删除标注后声称“全部保持不变”，也不能在无物化身份时声称已写回真实卡片。单元素标注写回仍需 runtime 物化/readback 身份，缺身份时给出候选配置与缺项说明；数据不满足目标模板时仍按上一条保留旧可用图。

## 4. `keepStyle` 不是绝对保留

`keepStyle` 控制数据源/图表变化时清理编辑态配置的策略：

- `true` 或缺失时，运行时倾向 `keepAll`，并保留 `dataTransposed`。
- `false` 时，换源通常只保留 layout 和 `dataTransposed`；部分同模板类型变化还会额外保留 marker。
- 特殊数据源参与模板切换时可能清除 undo history，不能用撤销能力作为数据恢复保证。

即使 `keepStyle:true`，仍必须验证 mapping 字段、model identity、group key、单元素 key 和 marker datum。它表达“尽量保留”，不是绕过兼容性检查。

## 5. `dataTransposed` 与 `transposed`

- `dataTransposed`：交换标准数据的行列语义，会影响 columns/rows、字段映射和推荐结果。
- `transposed`：交换图表坐标系方向；当前主要用于 line/area 及对应风神类型，不改原始表格。
- 二者都触发 spec 重建。不要因为横向柱图而自动写 `dataTransposed:true`；横向柱的核心是模板和 mapping 方向。

## 6. 模板版本与 record 版本

- `templateVersion` 属于 chart/table attribute，决定模板默认样式分支。存量无值在迁移时按 `v1.0` 补齐；新元素由当前主题/运行时选择当前模板版本。
- `dataVersion` 属于飞书 add-on record，决定保存数据迁移链。新 record 默认省略即按当前保存版本读取。
- 两者不能互换。不要为了得到“最新版样式”篡改旧 browserData 的 `dataVersion` 或 `templateVersion`。

## 6.1 轴、截断和标签的能力联动

- band/linear 轴类型切换只在本地 bar/barGroup/barPercent/horizontal bar 家族、line/area/areaPercent/scatter，以及风神 line/area/area_percent 中开放；其他图不因存在 `linearToBand` 字段就获得能力。
- series/axis break 支持本地 bar 全家族、line/area、dualAxis、waterfall、scatter、Mekko，以及对应风神柱/条/线/面积/双轴/瀑布/散点。Pie、rose、radar、funnel、层级图等禁止生成 break。
- `displayType: all|min|max|minMax|firstLast` 只对 bar/line/area/scatter/mosaic/waterfall/radar/rose series 承诺；不支持的系列使用整体 visible/format 或运行时单标签选择。
- `transformLabel` 只在本地/风神 funnel 的 transform 结构存在时生效；绘制组名以 `transform` 开头的标签会跳过普通 dataGroup label style 应用，不能把 `dataGroupSpec[group].label` 当转化率标签。

## 7. 图表类型转换和来源解绑

VChartSpec/跨类型转换需先在隔离草稿中验证数据和目标模板。成功后：

- 写入目标 `temp`、standard data、目标 `mappingSpec`；
- 清理源专属 `originalOptions/modelSpec/marker/dataGroupSpec/markStyle`，再仅迁移可证明跨类型安全的公共配置；
- 对 VChartSpec 转内置模板写 `sourceBinding:{mode:"snapshot",detachedFrom:"vchartSpec"}`；
- 类型转换失败或提交失败应回滚旧图，不能留下半转换状态。

因此“换图类型”不是只改 `attribute.temp`。若宿主没有转换预检/事务能力，模型只输出转换计划，不直接改保存态。

即使在 bar/barGroup/barPercent/horizontal bar、line、area/areaPercent 这一可互换家族内，模板切换也会清理旧 series mark 配置后重建；title、legend 等公共组件可尝试迁移，但 `series modelSpec/dataGroupSpec/markStyle` 仍需按目标 series 重新绑定。dualAxis 不属于这个简化保留集合。

## 8. 来源、展示 URL 与自动同步

- `source.pageUrl` 只负责来源展示/跳转。
- source config 能加载不等于 live。`sourceBinding` 是物化后的 chart attribute 字段；当前 commonOption `options.config` 白名单不含它，从 commonOption 首次建图时不要把它塞进 config。需要显式绑定时，在物化/readback 后写入 `browserData`；存量缺失时由运行时兼容判断。
- `record.autoSync:true` 只是请求；还需要 live binding、syncable kind、合法 config、插件和权限。
- snapshot 即使保留 URL 也不得 source-sync。同步失败保留旧快照并暴露错误。

## 9. 全局样式、局部样式与批量字体

样式优先级：`markStyle` > 指定 `dataGroupSpec` > `EDITOR_ALL_DATA_GROUP` > `modelSpec.series` > theme/template。

`fontFamily/fontSize` 是批量入口，会同步已知的 title/axis/legend/label/seriesLabel/totalLabel/funnel label/barLink/theme 文本路径；已有单组件或单分组显式样式仍可覆盖。不要为了改全局字体清空 modelSpec。

`graphicOpacity` 是 chart/table 整个 graphic root 的基础透明度，缺失按 1；它与 mark/cell 自身 opacity 叠加。只改整体淡化时写它，不要遍历所有 series 或单元格重写透明度。

外部来源集合 `ExternalLegendSourceTemps`（`aeolus/vizData/vchartSpec/vseedDsl`）可能使用外置图例布局。运行时会保留来源图例占用的 slot，并对 `_outRender_` 做来源兼容处理；编辑已有外部图例时保留真实 legends identity 和 layout。不要把内置模板的图例尺寸/位置默认值覆盖到外部来源，也不要从零生成 `_outRender_`。

## 10. Insights 与 marker 的关联

`insights` 是分析结果，`isInsightsLatest` 是新鲜度状态；它们不直接绘图。marker 可用 `insightId` 关联某条洞察，纹理洞察还可能保存 series/specIndex 信息。删除洞察或重算数据时必须同步校验关联 marker/trendLine；不能只改 `isInsightsLatest` 假装洞察已更新。

Marker 还有两层模板限制：pie/rose/radar/map/progress/wordCloud/funnel/boxPlot/gauge/sankey/treemap/sunburst/circlePacking/heatmap/correlation 等不支持通用 markLine/markArea；基于 datum 自动锚定的 markPoint 只对 bar/waterfall/mosaic/line/area/scatter/heatmap series 明确支持。其余图即使 raw VChart 能渲染某种 marker，也不能据此承诺图表助手的添加、编辑和同步能力。

## 11. 运行时生成字段

以下字段可能由运行时维护，模型编辑已有数据时保留，但从零不应伪造：

- layout component identity、自动 offset、`_originStyle`、`_originValue_`、auto-fit 标记；
- VChart formatter/function 的序列化表示；
- picker node index、series runtime metadata、临时请求/鉴权信息；
- marker 完整编辑 metadata、connector points 和 transient styleMap aliases。

只有 reference 明确允许的 `_editor_axis_orient`、`_editor_spec_size` 等少数编辑字段可按对应能力生成。

## 12. 最小安全操作顺序

```text
读取当前 DSL/来源
→ 判定操作类别
→ 验证模板和数据
→ 解析稳定 identity
→ 生成最小 patch
→ 物化/渲染
→ readback
→ 复核映射、局部 identity、来源与同步状态
```

没有物化能力时，只完成不依赖 runtime identity 的全局/分组级操作；其余返回清晰的前置条件。
