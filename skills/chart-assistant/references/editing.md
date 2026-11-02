# 编辑 DSL 与能力边界

## 1. 写入位置

| 意图 | canonical path |
| --- | --- |
| 标题/轴/图例/region/series/tooltip/crosshair | `attribute.modelSpec[]` 对应 `specKey` |
| 字段映射 | `attribute.mappingSpec` |
| 全局 theme/色板 | layer `theme` + chart `attribute.theme/color` |
| 单一分组/图例项样式 | `attribute.dataGroupSpec[group]` |
| 单个 mark 样式 | `attribute.markStyle[]` |
| 标注 | `attribute.marker` |
| 散点趋势线/分区 | `attribute.trendLine`, `partitionArea` |
| 柱条连接线 | `attribute.barLink` |
| 堆叠策略 | `attribute.stackType` |
| 双轴同步域 | `attribute.syncAxisDomain` |
| 组件位置/尺寸（图例、标题、region 等） | `attribute.layout[]` 条目（按 id 或 specKey+specIndex 命中已有条目，不新增） |

仅改 `modelSpec` 的 `orient/position` 不会移动已被手工布局钉住的组件（已保存的 layout 条目优先）；移动组件或改尺寸必须同写 layout 条目，`offset` 是画布绝对像素值：

```json
"layout": [{"id": "legend-discrete", "layout": {"y": {"offset": 258}}}]
```

历史 root-level `title/label/seriesLabel/totalLabel/tooltip/crosshair` 只用于兼容读取；新增编辑归并到 `modelSpec`。

`dataGroupSpec[group]` 可同时包含 group 级 `bar/line/point/...` mark 与 `label/outsideLabel/transformLabel/...`；值形态如 `{"产品B实际": {"bar": {"style": {"fill": "#00B42A"}}}}`。group key 必须来自运行时 `dataGroupMap`。完整定义见 [element-editing.md](element-editing.md)。

## 2. 五种“标签/线”不可混淆

1. `modelSpec.series.spec.label`：每个 mark 的数值/分类标签。
2. `modelSpec.series.spec.seriesLabel`：在系列端点/区域显示系列名称。
3. `modelSpec.series.spec.totalLabel`：堆叠总计。
4. `seriesLabel.label.styleMap[*].line`：系列标签与图形之间的引导线。
5. `attribute.barLink`：相邻柱/条之间连接相同堆叠边界的系列连接线。

用户说“开启系列标签和系列连接线”应同时写 `seriesLabel.visible = true` 与 `barLink.enable = true`，而不是开启引导线。

`barLink.spec` 的完整类型和单条 line/area/label key 见 [bar-link.md](bar-link.md)。

## 3. `modelSpec` 合并

更新同一组件时保留真实 `id/specKey/specIndex` 并深合并 `spec`；有 `id` 时默认严格按 ID 匹配。完整规则见 [model-spec.md](model-spec.md)。不要用一个只含 `seriesLabel` 的新数组替换所有 series/axis/title 配置。

```json
{
  "id":"series-sales",
  "specKey":"series",
  "specIndex":0,
  "spec":{
    "label":{"visible":true,"position":"inside"},
    "seriesLabel":{"visible":true},
    "totalLabel":{"visible":false}
  }
}
```

此处 `series-sales` 是示意为“已从当前 model 读取到的 userId”，不能照抄为新图的默认 ID。

## 4. 通用组件

- 标题：`specKey: title`；支持 visible、rich text、text/subtext style。结论标题不要拆成多个互相覆盖的 title model。
- 坐标轴：`specKey: axes`；按 orient/id 区分，常见配置 visible、title、label、grid、domainLine、tick、min/max、zero。非轴图禁止生成。
- 图例：`specKey: legends`；支持 visible、position、item/style。wordCloud/gauge 与部分风神类型不支持常规图例。
- region：背景、堆叠顺序、tooltip/crosshair 开关等。
- tooltip：`specKey: tooltip`，至少可配置 visible，内容/样式透传。
- crosshair：`specKey: crosshair`，字段为 x/y 或 category/value；仅实际模板产生对应 field 时启用。
- player/dataZoom/scrollBar：属于可保存的 raw runtime component，但没有当前 Skill 承诺的结构化编辑 schema；默认只保留已有配置。

## 5. 模板开关集合

- `seriesLabel`：bar、barPercent、horizontalBar、horizontalBarPercent、area、areaPercent、line、waterfall、waterfallDecrease、dualAxis、mekko、mekkoPercent。
- `totalLabel`：bar、barPercent、horizontalBar、horizontalBarPercent、area、areaPercent、waterfall、waterfallDecrease、dualAxis、mekko、mekkoPercent。
- `barLink`：bar、barPercent、horizontalBar、horizontalBarPercent。
- barWidth：上述 barLink 类型 + barGroup、horizontalBarGroup、waterfall、waterfallDecrease、dualAxis。
- trendLine：scatter。
- stackType：dualAxis、waterfall、waterfallDecrease、rose。
- complete diff marker：bar 家族、line、area 家族、waterfall 家族、dualAxis、mekko 家族；scatter 走 value/partition marker 路径。
- percentage formatter：barPercent、horizontalBarPercent、areaPercent、mekkoPercent。
- growth line 禁用：mekko、mekkoPercent。

## 6. marker

先读 [markers.md](markers.md)；它定义全部 marker 类型、坐标单位和运行时生成边界。单个 label/grid/legend item/mark 编辑见 [element-editing.md](element-editing.md)。

先调用/模拟模板的 addable 检查，再添加：

- 普通水平/垂直线：大多数笛卡尔图。
- markArea/markPoint：依赖图表坐标和可选 mark。
- hierarchyDiffLine、totalDiffLine、growthLine：仅完整差异 marker 集合，且受具体数据层级限制。
- partitionLine/partitionArea：scatter。

标注配置应带唯一 ID；洞察生成的 marker 可通过 `insightId` 与 `insights` 关联。删除洞察时同步清理关联 marker。

## 7. 数据编辑

标准数据支持：转置、字段重命名/格式/筛选/排序、单元格更新、清空/粘贴、增删行列。执行规则：

- 字段操作优先按字段名；重名字段必须带 columnIndex。
- 单元格按 rowIndex + columnIndex；结构操作按行/列索引。
- 字段改名可按旧字段名自动更新 mappingSpec；其他数据编辑不自动重写 mapping。
- 删除已映射字段必须预览 mappingSpec 影响并确认。
- Sheet/Base/风神 live source 的“同步来源”和“编辑当前快照”是两种不同操作；不得静默回写外部源。
- 同源刷新可按运行时策略保留 columnFormats/Filters/Sorts；换源时不能默认沿用。

## 8. 图表类型切换

- 内置 standard 图表通常允许在满足目标模板数据要求时切换。
- treemap、sunburst、circlePacking、wordCloud 不承诺普通类型切换。
- VChart Spec 必须显式 `enableTypeChange: true`，且先做数据/字段/系列转换预检。
- 转换不允许静默聚合、补零、重排或猜多轴关系；不确定时让用户选字段。
- 转换成功后是 snapshot。标题、图例、tooltip、region、theme/color 尽可能保留；不兼容轴/series 专属样式重建。

## 9. 最小修改

编辑已有图表时保持：`temp`、data、mappingSpec、source/sourceBinding、未涉及的 modelSpec、dataGroupSpec、markStyle、marker、MBB theme。只有用户要求换图/换源时才改这些不变量，并说明 live → snapshot 等后果。

## 10. 拒绝条件

- 模板不在能力集合却要求相应字段。
- mapping 引用不存在或重名未消歧字段。
- 对 no-axis 图生成 axes，对 no-legend 图生成 legends。
- 把风神同名图当内置模板。
- 用 VChartSpec 规避校验。
- 对 snapshot 执行 source-sync。

跨字段的 `commonOption.config` 白名单、`keepStyle`、数据替换清映射、template/data version、类型转换清理与 ID 失效规则见 [special-logic.md](special-logic.md)。画布级 table/text/graphic/line/connector 编辑见 [components.md](components.md)。
