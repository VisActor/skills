# 单个可视元素编辑契约

单元素编辑有四层身份，必须先判断目标属于哪一层：

1. 组件：`modelSpec[].id/specKey/specIndex`，见 `model-spec.md`。
2. 数据分组：`dataGroupSpec[groupKey]`，由运行时 series field 的分组值生成。
3. 组件内部图元：`styleMap[key]`，key 由运行时渲染结构或数据身份生成。
4. series 数据 mark：`attribute.markStyle[]`，通过 series + mark + datum 字段匹配，不靠数组位置。

没有已有身份时，按下面的语义输入生成业务 `target`，由图表实例解析后交给原编辑逻辑。不能猜内部 key，也不能把单项请求扩大成整组或全部。

## 0. 语义 target：只补现有 DSL 的定位

模型保留原来的样式字段，在现有配置位置增加业务身份：

| 原位置 | 生成方式 | 实例编译后的保存结构 |
| --- | --- | --- |
| `modelSpec[]` | `{specKey,target,spec}`，不同时写 `id/specIndex` | 原生组件 identity + 原 `spec` |
| `markStyle[]` | `{markName,target,style}`，可保留覆盖记录 `id` | 原生系列、图元及 `itemKeys/itemKeyMap` |
| 任一受支持 `styleMap` | `[{target,value}]`；`value` 仍是该 map 的原配置 | `{[实际key]:value}` |
| `dataGroupSpec` | `[{target,value}]`；`value` 仍是原分组配置 | `{[groupKey]:value}` |

`target` 不包含 `chartId/kind/role/scope`，图表与目标种类由外层位置确定。数据目标使用 `selector:{原始字段:原始值}` 和可选 `measure:"原始指标列名"`；父 series 可只用 measure，子 styleMap 继承父系列。不得使用 Marker 的 `match/metric` 替代 `selector/measure`。

原生 series id/specIndex 不等于业务指标编号。`models` 中列出某个 id 只说明组件存在；没有业务绑定时，不能由名称或数组顺序推断归属，父系列应使用 `target.measure` 让 Core 解析。例如类别 B 的 24 来自指标“系列 1”，不代表它属于 `series-1`；普通标签字号与字重修改应为：

```json
{"modelSpec":[{"specKey":"series","target":{"measure":"系列 1"},"spec":{"label":{"styleMap":[{"target":{"selector":{"类别":"类别 B"}},"value":{"style":{"fontSize":18,"fontWeight":"bold"}}}]}}}]}
```

单标签样式请求不附加整个系列 `label.visible:true`。语义编译定位当前已渲染标签；不要把同一 patch 中的整体显隐修改当成已经渲染的事实。

例如放入 `options.config`（已有图则作为对应 chart 的输入 patch）：

```json
{
  "markStyle":[{"markName":"bar","target":{"selector":{"季度":"Q4"},"measure":"销售额"},"style":{"fill":"#3370FF"}}],
  "modelSpec":[{"specKey":"series","target":{"measure":"销售额"},"spec":{"label":{"styleMap":[{"target":{"selector":{"季度":"Q4"}},"value":{"style":{"fill":"#E53935","fontWeight":"bold"}}}]}}}]
}
```

分组示例：`{"dataGroupSpec":[{"target":{"measure":"销售额"},"value":{"bar":{"style":{"fill":"#3370FF"}},"label":{"style":{"fontWeight":"bold"}}}}]}`。这会修改销售额完整组，不能额外加 `季度:Q4` 后仍让编译器扩大到全部季度。

可选定位字段按原路径区分：

| 路径 | target |
| --- | --- |
| `modelSpec` series | `selector?`、`measure?`，至少一项 |
| `modelSpec` axes | `field` 或 `measure`，可用 `orient` 消歧 |
| `modelSpec` legends | `field` 或 `measure` |
| 普通标签、总计标签 styleMap | `selector`、可选 `measure` |
| 层级节点标签与多层轴标签 | `path:[{field:"区域",value:"华东"},{field:"产品",value:"产品A"}]`，字段顺序必须与当前层级一致 |
| 轴标签、网格 styleMap | `{value:原始tick值}`，必须已渲染 |
| 图例 item styleMap | `{value:原始图例值}` 或 `{measure:指标名}`，二选一 |
| `seriesLabel.label.styleMap` | `selector?`、`measure?`、可选 `position:"start"或"end"`；受管模板取 styleKey，普通系列沿现有节点身份 |
| `mekkoLabel.styleMap` | 分类 `selector`，可选 `measure` |
| `barLink.spec.styleMap` | `{from:业务selector,to:业务selector,measure?,part:"line"或"area"或"label"}` |
| axes `breaks[]` 的已有条目 | `{target:{range:[区间起值,区间终值]},...原条目增量}`，只定位已存在截断 |

当前数据字段适配限定已核验的 standard 来源；其他来源缺乏映射时明确返回 `UNSUPPORTED_SOURCE`，不猜字段。层级业务 `path` 使用按原始字段顺序排列的 `{field,value}` 数组，不将树节点显示文本视为唯一身份；只有来源及实际节点都可验证时才生成 key。父层级 series 用 measure 定位，节点条件放子标签 path。轴刻度与图例项依赖当前可见组件；未开启标签、不存在网格 tick 或多目标歧义不能靠新增索引处理。

模式仍沿现有编辑器：饼图扇区和漏斗阶段走 `dataGroupSpec`；漏斗普通/转换标签走组配置，转换标签使用 `transformLabel`；漏斗外部标签不支持单标签编辑，只保留已有整体 `outerLabel` 配置。线/面积本体没有单图形模式，数据点可以用 `markStyle` 的 `point`。不能把不支持的 markStyle 偷换成分组通道。

旧 ID 和对象 map 继续兼容；同一 map 输入不能混用对象与数组。同一条 markStyle 的 target 不与原生匹配字段混用，已有覆盖记录 id 不得重定向到另一对象。重复原生 key、源类型碰撞、目标不存在或范围扩大均返回诊断；失败不能忽略后声称编辑完成。

首次加载时宿主隔离语义项，待实例就绪编译；已有实例可调用 `resolveSemanticTargets(patch)`，仅当 `success:true` 才把返回的原生 patch 交给原有更新方法。成功保存只保留原生 ID/map；不持续保存 target 或随数据更新自动重放。缺少此入口的宿主仍可交付语义配置并说明运行时尚未执行，不能假定旧宿主认识数组。

完整生成样例见 [semantic-element-targets.json](../examples/semantic-element-targets.json)。这些是现有编辑字段的输入扩展，不改变 Marker 或通用连接线的 target/更新行为。

### 0.1 组件归属与单对象路由

element 编辑任务常只加载本页，以下速查内联自 [model-spec.md](model-spec.md)，完整定义以该页为准：

- `modelSpec` 条目必须显式写 `specKey`，只取组件集合键：`series`、`axes`、`legends`、`title`、`tooltip`、`crosshair`、`region`。不存在 `"bar"`、`"label"`、`"axis"` 等猜测键；省略 `specKey` 的条目同样非法。
- 全部标签类字段归属 `specKey:"series"` 条目：`label`（普通数值标签）、`seriesLabel`、`totalLabel`、`transformLabel`、`outerLabel`、`outsideLabel`/`insiderLabel`、`mekkoLabel`；轴标签在 `axes` 条目的 `spec.label`，图例项在 `legends` 条目的 `spec.item`。
- `crosshair` 是独立组件（模板 ID `crosshair-0`），不是轴的子字段，不要写进 `axes` 条目的 `spec`。

单元素/单数据点样式：

- 单个图形写 `markStyle` 语义条目 `{markName,target,style}`；`markName` **必填**（柱 `"bar"`、点 `"point"`、普通值标签 `"text"` 等）。缺 `markName` 的条目无法确定目标图元，会被核心按不支持的模式拒绝，不能靠补 `id` 或改用其他字段绕过。
- 单对象请求不得用 `dataGroupSpec` 整组着色降格满足；整组请求也不枚举 `markStyle`。
- `selector/measure` 在当前数据中匹配不到唯一对象时澄清并报告诊断，不放宽条件、不省略分组值把目标扩大到整组或相邻对象。

## 1. Axis label

路径：`modelSpec[axis].spec.label.styleMap[key]`；运行时图元名为 `axis-label`。

```ts
type AxisLabelItem = {
  visible?:boolean;
  text?:string|string[]|{type:"rich";text:unknown[]}|unknown[];
  style?:TextStyle;
};
```

key 策略：

- 普通单层轴：当前渲染 label 在父容器中的零基索引字符串，如 `"0"`、`"3"`。
- 多层轴：`${layerIndex}-${labelIndex}`，两个索引均来自当前渲染节点层级。
- key 是渲染身份，不是轴值。筛选、排序、分页、多层级展开、数据同步后可能改变。
- 编辑已有图表时复用现有 styleMap key；新建时可写 `styleMap:[{target:{value:原始tick值},value:原配置}]`，由实例解析 key。

单个轴标签改文案只影响显示，不改数据和 mapping；不应利用它伪造数据含义。若要按轴值稳定格式化，应改整体 `formatConfig`，而不是批量猜索引。

## 2. Axis grid line

路径：`modelSpec[axis].spec.grid.styleMap[key]`。

```ts
type AxisGridItem = { visible?:boolean;style?:LineStyle } | false;
```

key 是 `axis-grid-line` 在当前 grid mark 子节点中的零基索引，保存为字符串键。它与 tick/label 的视觉序号通常对应，但不是数据值协议；轴域、tickCount、尺寸或采样变化会使其失效。阈值线应使用 value line marker，不应用单条 grid style 假装阈值。

## 3. Axis title 与 break

- 轴标题不是 styleMap：写 `modelSpec[axis].spec.title`。
- 轴截断写 `modelSpec[axis].spec.breaks[]`；`range` 是归一化后的轴范围，`gap` 是像素或百分比。
- break 数组项当前没有稳定业务 ID。编辑已有项按原数组保留；从零创建必须依据实际轴域由运行时换算。MBB 柱图不得用 break 夸大差异。

## 4. Legend item

路径：`modelSpec[legend].spec.item.styleMap[key]`。

```ts
type LegendItemOverride = {
  label?:{text?:string|string[];style?:TextStyle};
  shape?:{style?:{visible?:boolean;symbolType?:string;size?:number;fill?:string;fillOpacity?:number}};
} | false;
```

key 是当前 legend 容器过滤后的 `legendItem` 零基可视索引。它不是系列名或数据分组值；legend 排序、筛选、分页、聚合、数据同步后可能改变。编辑已有 styleMap 可复用；若业务要求“始终把系列 A 变灰”，优先写 `dataGroupSpec["A"]`，不要写 `item.styleMap["1"]`。

Legend title 走 `modelSpec[legend].spec.title`，不是 item styleMap。`defaultSelected` 属于交互选择状态，不应用于 MBB 静态强调。

`shape.style.symbolType` 可使用自定义SVG path字符串。虚实折线的默认填充 `roundLine` 不会因继承 `lineDash` 就显出虚线；按 [虚实图例符号](solid-dashed-line.md#图例符号也要区分虚实) 用连续/分段填充路径设置各真实图例项，保留对象颜色。当前公开 shape 样式字段不包含 `lineDash`，不要将公共 LineStyle 全部套入图例形状。

图例整体布局与单图例项编辑分开处理：`spec.padding` 是组件四周留白，数组顺序为 `[top,right,bottom,left]`；`spec.item.spaceRow/spaceCol` 是多个图例项之间的行列间距。新建图表需要离散图例时默认放在绘图区下方并居中，写 `orient:"bottom"`、`position:"middle"`、`padding:[16,0,0,0]`，不应增大 `spaceRow` 或写绝对 `x/y/offset`。编辑已有业务布局或用户明确设置时保持原意；明确要求左对齐时仍写 `position:"start"`。

## 5. 普通数据 label

路径通常是 `modelSpec[series].spec.label.styleMap[key]`；按系列/分组编辑则走 `dataGroupSpec[group].label`。

```ts
type LabelItem = {
  visible?:boolean;text?:string|string[]|{type:"rich";text:unknown[]}|unknown[];
  style?:TextStyle;formatConfig?:FormatConfig;offset?:number;space?:number;
  line?:{visible?:boolean;type?:string;style?:LineStyle};forceVisible?:boolean;
} | false;
```

运行时优先构造数据身份 key：

- 常规笛卡尔：`seriesField + dimensionFields` 的值，以 `_` 拼接。
- scatter：`seriesField + dimensionFields + measureFields`。
- sankey：`seriesField + depth + index + key + layer`。
- hierarchy：优先 drill field；否则 seriesField + hierarchy dimension fields。
- range bar：seriesField + range 的两个端点字段。
- 无法取得数据身份时回退为 `${labelGroupIndex}-${textIndex}`。

这些规则依赖模板转换后的真实 series 字段；值本身含 `_` 时还可能产生碰撞。因此 LLM 不应从原始数据独立复刻 key。语义输入由宿主调用现有 `getLabelStyleMapIds` 链路生成 key；已有身份仍可直接保存首选数据 key。

对象形式 map 的 key 在计划编译（prepare）时会与当前运行时数据身份核验：`label/outsideLabel/insiderLabel` 的 styleMap 含不匹配当前数据的 key 时整个计划被拒绝并返回诊断，提示改用 `[{target,value}]` 数组形式——该 key 若落盘，本会被图表重建时的过期条目清理静默移除（保存态变空、渲染无效果、回执却成功）。新计划的索引 key 必须指向实际存在且属于目标系列的标签，编译后转换为原生身份；存量读取仍沿既有迁移链路处理。服务端生成阶段只允许对象形式复用输入中同系列已保存的 key；新增定位一律使用 `[{target,value}]` 数组，错误类别名 key 会进入有限修正轮。

`displayType: all|min|max|minMax|firstLast` 是整体选择策略；它比写大量 `visible:false` 更稳定。单点 `forceVisible` 只用于防重叠后仍必须出现的关键标签。

## 6. Series label

路径：`modelSpec[series].spec.seriesLabel.label.styleMap[key]`。

保存 key 统一遵循 [labels.md 的 Series label 规则](labels.md#3-series-label)：standard DualAxis/Mekko/MekkoPercent 使用运行时拾取或 readback 返回的稳定业务指标 key。`${position}-${index}`（例如 `end-0`）是图形 ID，也仅作为未接入模板/旧配置的兼容键；渲染顺序不能代替受管模板的稳定身份。不要让 LLM 生成内部 key；拾取无法确定唯一稳定 key 时，不做该单项覆盖。只开启能力时写：

```json
{"seriesLabel":{"visible":true,"position":"end"}}
```

需要单条连接线时才在已物化 key 下写 `line.visible/style`。Series label 的连接线不是 `barLink`。

## 7. Total label

路径：`modelSpec[series].spec.totalLabel.styleMap[key]`。

先区分普通分段值与堆叠合计值。例如类别 C 的三段为 40、28、35，用户指定的标签 103 是合计，应写 `totalLabel`，不能写普通 `label`。显示数值只用于结合当前数据判断标签种类，不作为业务身份，也不要在工具转述中丢掉用户给出的数值。

语义输入必须给父 series 一个当前输入中可验证的身份：使用真实指标 `measure`，或复用已有 `id/specIndex`；不能写 `target:{}`，也不能将“当前唯一图表”视为“唯一系列”。子 `styleMap` 用分类 selector 定位合计；运行时会解析实际承载合计标签的系列，不必猜测最后一个系列或内部 key。例如仅将类别 C 的合计 103 设红：

```json
{"modelSpec":[{"specKey":"series","target":{"measure":"系列 1"},"spec":{"totalLabel":{"styleMap":[{"target":{"selector":{"类别":"类别 C"}},"value":{"style":{"fill":"#E53935"}}}]}}}]}
```

其中 `系列 1`、`类别`、`类别 C` 必须来自当前输入；不能照抄示例中的名称。若现有输入不能区分普通标签与合计标签，先澄清，不以整体改色或另一类标签代替。

key 优先级：

1. 稳定数据 key：`totalLabel:${seriesIndex}:${dataKey}`。
2. 当前完整索引：`${seriesIndex}-${componentIndex}-${labelIndex}-${textIndex}`。
3. 兼容旧 key：`${componentIndex}-${labelIndex}-${textIndex}` 或 `${labelIndex}-${textIndex}`。

新写入优先由运行时产生第 1 种；不要自己枚举四段索引。百分比堆叠、瀑布和多个 totalLabel component 会使简单 `"0"` key 命中错误对象。

## 8. Pie/Rose、Funnel、Mekko、Hierarchy label

- pie/rose：整体分别写 `outsideLabel` / `insiderLabel`；单标签仍用运行时数据 key。外部 label 的 `line` 是引导线。
- funnel：普通值写 `label`，外部写 `outerLabel`，转化层写 `transformLabel`；只有 transform funnel 才生成 transformLabel。
- mekko：`mekkoLabel.styleMap` 复用运行时 picked label key；`mekkoLine` 是独立系列组件配置。
- treemap/sunburst/circlePacking：叶节点写 `label`，父节点写 `nonLeafLabel`；数据 key 来自 drill/path 身份，不能只用显示文本，因为不同父节点可有同名子节点。

## 9. 数据分组：`dataGroupSpec`

```ts
type DataGroupSpec = {
  EDITOR_ALL_DATA_GROUP?: DataGroupItem;
  [groupKey:string]: DataGroupItem|undefined;
};
type DataGroupItem = {
  bar?:MarkConfig;barBackground?:MarkConfig;line?:MarkConfig;point?:MarkConfig;area?:MarkConfig;
  pie?:MarkConfig;rose?:MarkConfig;word?:MarkConfig;funnel?:MarkConfig;transform?:MarkConfig;
  node?:MarkConfig;link?:MarkConfig;cell?:MarkConfig;leaf?:MarkConfig;nonLeaf?:MarkConfig;
  sunburst?:MarkConfig;circlePacking?:MarkConfig;
  label?:ChartLabel;outsideLabel?:ChartLabel;insiderLabel?:ChartLabel;
  outerLabel?:ChartLabel;transformLabel?:ChartLabel;nonLeafLabel?:ChartLabel;
  mekkoLabel?:ChartLabel;mekkoLine?:Record<string,unknown>;
};
type MarkConfig = {visible?:boolean;style?:Record<string,unknown>};
```

### 9.1 `dataGroupSpec` 的身份不是 `id`

`dataGroupSpec` 的 group 级 label 和 mark **都没有独立 `id` 字段**。它们的持久化身份是对象路径组成的复合键：

- group mark：`(groupKey, markName)`，例如 `("产品A", "bar")`。
- group label：`(groupKey, labelKind)`，例如 `("产品A", "label")` 或 `("产品A", "outsideLabel")`。
- 全部分组 fallback：`("EDITOR_ALL_DATA_GROUP", markName | labelKind)`。

因此更新同一个分组标签必须深合并 `dataGroupSpec[groupKey][labelKind]`，更新同一个分组图元必须深合并 `dataGroupSpec[groupKey][markName]`；不要为它们生成 UUID，也不要额外写 `id/index`。`groupKey` 自身就是第一层身份，必须来自运行时 `dataGroupMap`。

虽然 `SeriesLabelSpec` 类型中含有 `styleMap`，当前分组标签的应用链只把 `dataGroupSpec[groupKey][labelKind]` 当作整组配置；单个 datum 标签的稳定覆盖仍写在对应 series 的 `modelSpec[].spec[labelKind].styleMap[labelId]`。不要把 `dataGroupSpec[groupKey].label.styleMap` 当成已承诺的单标签通道。

如果意图是“产品 A 的所有柱和标签”，写 group mark + group label；如果意图是“产品 A 在 2025 年这一根柱/一个标签”，分别使用 `markStyle[]` 与 series label `styleMap[labelId]`。标签也可按下文 `markStyle` 的 `markName:"text"` 命中普通值标签；其匹配身份同样来自当前 runtime，不把标签 ID 当成系列 ID。

group key 规则：

1. 运行时读取每个 series 的真实 `seriesField`。
2. 普通 series 从原始 datum 的 `datum[seriesField]` 去重；Sankey 使用运行时 `getSeriesKeys()`。
3. 每个分组同时在运行时记录 `seriesId`、`seriesType`、`axisOrient` 和该 series 内的 `keyIndex`，但持久化顶层 key 仍是分组值的字符串属性键。
4. `EDITOR_ALL_DATA_GROUP` 是保留字，表示所有分组 fallback，不是实际数据值。

`groupKey` 不是 UUID，也不是 model ID。宽表多指标图中它常是指标/系列名；长表图中常是系列字段取值。必须从物化后的 `dataGroupMap` 读取，不能只凭 columns 猜。两个 series 若产生相同 groupKey，会落到同一对象属性并有碰撞风险，必须用实际运行时验证。

数据刷新后若新旧 key 不同，运行时只会在能用相同 `seriesId + keyIndex` 对齐时迁移旧配置。重排系列、插入分组、换源或改变 series identity 会破坏对齐；同步后必须复核。字段改名和分组值改名是不同操作。

作用域与优先级：

- `dataGroupSpec[groupKey].bar/line/point/...`：该组 mark。
- `dataGroupSpec[groupKey].label/outsideLabel/...`：该组 label。
- `dataGroupSpec.EDITOR_ALL_DATA_GROUP`：无具体 override 时的全部组 fallback。
- 单 datum `markStyle/styleMap` 高于 group；group 高于 `modelSpec.series`。

重置某组 mark 使用编辑命令态 `{[markName]:false}`；持久化时清理为缺失字段/规范对象。Area group reset 会联动 line/point，line reset 会联动 point，需由运行时执行。

## 10. 单个 series mark：`markStyle`

```ts
interface IMarkStyle {
  /** 任意 record 内唯一 ID；用于更新/删除这条覆盖，不负责语义匹配。 */
  id:string;
  seriesType:string;
  /** 运行时 series.getSpecIndex()。 */
  seriesIndex:number;
  markName:"bar"|"barBackground"|"line"|"area"|"point"|"pie"|"rose"|"text"|
           "funnel"|"transform"|"node"|"link"|"cell"|"leaf"|"nonLeaf"|"sunburst"|
           "circlePacking"|string;
  /** 用于匹配 datum 的真实字段名。 */
  itemKeys:string[];
  /** 每个 itemKey 的目标值。 */
  itemKeyMap:Record<string,unknown>;
  style:FillStyle|LineStyle|SymbolStyle|TextStyle|Record<string,unknown>;
}
```

`id` 可用 UUID；真正命中由 `seriesType + seriesIndex + markName + itemKeys/itemKeyMap` 决定。`itemKeys` 应来自 runtime series key fields，不能只写可能重复的显示类别。数值型 `itemKeyMap` 在转换中可能被解释成 scale index，因此必须由运行时 picker/compiler 产生；不要把任意数值业务 ID 手写为索引。

一个可离线确定的窄例外是当前内置 standard parser 的“单维度 + 单指标 + 单 series `barGroup`”：

```json
{
  "seriesType":"bar","seriesIndex":0,"markName":"bar",
  "itemKeys":["_editor_dimension_field","_editor_type_field"],
  "itemKeyMap":{"_editor_dimension_field":"Q4","_editor_type_field":"销售额"},
  "style":{"fill":"#0A345E"}
}
```

该结构中 `_editor_dimension_field` 是唯一维度的运行时字段，`_editor_type_field` 的值是唯一指标列名。只有同时满足上述形状、目标维度值为字符串可稳定匹配、没有多维度/多指标/双轴/导入 spec/风神/复合 parser 时才可在首次 commonOption 中直接生成；任何条件变化都回到 materialize/picker。不要把这两个内部字段推广成所有图表的公共业务字段。

上例颜色仅演示原生 clarity-light 的 focus。宿主已有主色或用户颜色时继承其语义，不强刷该色；新图可按表达需要选择内置配色，用户明确颜色和已有编辑优先。focus/compare/context/favorable/unfavorable/warning 按 [语义色](mbb.md#7-语义色) 选择，并写入支持的 style 字段，不把角色名当成新增 DSL key。

所有新图均适用的“突出最高柱/最后一期/关键点”属于单 datum markStyle，但只有结论支持时才应用。先由 LLM 根据业务结论确定目标 selector/measure，再由 runtime 解析匹配字段；两步不能颠倒。目标恰好位于数组末尾不代表可以用 `seriesIndex` 或 datum index 直接命中，`seriesIndex` 只定位系列。

修改优先级：`markStyle` > `dataGroupSpec[group]` > `dataGroupSpec.EDITOR_ALL_DATA_GROUP` > `modelSpec.series` > theme/template。删除一条单 mark 覆盖使用命令态 `{markStyle:{[id]:false}}`；持久化完成后仍应是数组，不把 false map 保存为最终 DSL。

### 多维显式高亮的两阶段交付

例如“只将产品 A、Q2、实际这根柱及数值标签标红，预算和其他柱保持默认”：完整业务目标是 `产品=A + 季度=Q2 + 指标=实际`；不得只按 Q2、120 或实际系列命中，也不能因为需要物化就交付无高亮图并称完成。

1. 保留全部数据和上述待完成目标，先用受支持 mapping 初始化基础图；若任务允许写卡，初始卡只是中间结果。
2. 从当前物化 datum、series 和 picker 取得实际 `seriesIndex/itemKeys/itemKeyMap`，核对完整业务条件只匹配一个 datum。业务字段可能已转换，不能把原始列名或手拼内部字段假装成运行时身份；数值键尤其不能直接当 scale index。
3. 为该柱应用 `markName:"bar"`，为其普通值标签应用 `markName:"text"`，各用独立覆盖 ID、相同已验证身份；不写全组红色、不改预算及其他柱。若显式同色与默认柱内位置冲突，按 [标签可读性](labels.md#同色标签可读性) 处理。
4. 回读确认两个覆盖及原始数据都保留；排序、筛选或同步后是否仍唯一命中属于另行运行验证，不凭配置声称通过。

旧宿主缺少语义解析方法且没有物化/picker 或可用身份回读时，明确“指定单柱及标签高亮尚未完成”，不要猜身份、静默漏项或宣称要求已全部完成。支持本节语义扩展的宿主可直接接收 `markStyle[].target.selector/measure`，不必让模型取得内部匹配字段。`target.match` 仍不是此通道字段，不能混用 Marker 语法。

## 11. Marker 内部元素

Marker 本身用 marker `id` 定位。线、起止 symbol、label、label background、mark area、point leader line/target symbol 是该 marker spec 的嵌套字段，不再建立新的公共业务 ID。区域多标签使用 label 数组索引，编辑已有状态应保留顺序；新增/删除由 marker editor 执行。

完整字段和坐标规则见 `markers.md`。差异 marker 的两个 datum 用 `refRelativeSeriesId` + 实际 datum 身份定位，不能用 label/styleMap key 替代。

## 12. BarLink 内部元素

`barLink` 的单条线、填充面和标签使用 `barLink.spec.styleMap`，key 分别是 `line-${datumId}`、`area-${datumId}`、`label-${datumId}`。通常 `datumId` 缺失而回退为当前连接数据的零基绘制索引，所以这些 key 也是运行时快照身份，不是 series ID 或 groupKey。完整字段、生成规则和同步失效风险见 [bar-link.md](bar-link.md)。

## 13. 生成原则

- 全局意图写组件级字段；分组意图写 `dataGroupSpec`；单 datum 意图才写 styleMap/markStyle。
- 默认完整非配色规范不意味着重置已有人工作图。新图显式生成rich主/次级标题和值轴标题visible/text；轴标题、刻度、图例、普通标签省略新增fontSize/fontFamily等文字样式覆盖，继承图表助手主题，用户明确字号优先；编辑已有元素时仅改授权字段，保留已有字体、位置、目标和配色。
- 索引型 key 都是当前渲染快照身份，源同步/排序/筛选后必须重新校验。
- 能使用稳定数据 key 时使用运行时生成的 key；不自行用字符串拼接猜测。
- 单元素编辑 examples 仅在标注为“已物化 identity”时可直接套结构，示例 ID 不可复制到别的数据。
