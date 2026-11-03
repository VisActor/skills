# Label 类型全集

本页定义 label 可写字段；单标签 key 的生成规则见 `element-editing.md`，格式字段见 `data-and-formatting.md`。

## 1. 公共结构

```ts
type LabelLine = {visible?:boolean;type?:string;style?:LineStyle};
type LabelStyleMapItem = {
  visible?:boolean;text?:string|string[]|{type:"rich";text:unknown[]}|unknown[];
  style?:TextStyle;formatConfig?:FormatConfig;offset?:number;space?:number;
  line?:LabelLine;forceVisible?:boolean;
};
type ChartLabel = {
  visible?:boolean;style?:TextStyle;
  text?:string|string[]|{type:"rich";text:unknown[]}|unknown[];
  offset?:number;position?:string;formatConfig?:FormatConfig;line?:LabelLine;
  styleMap?:Record<string,LabelStyleMapItem|false>;
  displayType?:"all"|"min"|"max"|"minMax"|"firstLast";
};
```

`false` 表示重置该单标签覆盖。普通 label 在 all 模式下修改连接线会落到每个 `styleMap[id].line`，不能假设存在统一全局 line。

## 2. 各图表位置与 format content

| label 家族 | `position` | `formatConfig.content` |
| --- | --- | --- |
| bar / horizontal bar | `inside`, `inside-top`, `inside-bottom`, `inside-left`, `inside-right`, `outside`, `top`, `bottom`, `left`, `right` | `dimension`, `value`, `percentage`, `secondaryDimensionPercentage`, `seriesPercentage`, `globalPercentage`, `abs` |
| area | `top`, `bottom`, `inside-middle`, `left`, `right`, `top-left`, `top-right`, `bottom-left`, `bottom-right`, `center` | 同 bar |
| line | `top`, `bottom`, `left`, `right`, `top-left`, `top-right`, `bottom-left`, `bottom-right`, `center` | 同 bar |
| pie / rose | `inside`, `outside` | 公共 FormatConfig；outside 可写 `line.style` 与 `line.smooth` |
| sankey | `outside`, `inside-middle` | `dimension`, `value` |
| scatter | 运行时/VChart 支持位置 | `text`, `x`, `y`, `size`；无 size mapping 时不用 `size` |
| funnel | 运行时/VChart 支持位置 | `dimension`, `value`, `rate`, `arrivalRate` |
| waterfall | 公共位置 | bar content + `incrementalRate` |
| heatmap | 公共位置 | `value`, `x`, `y` |
| hierarchy | treemap nonLeaf 可用 `top`, `bottom`, `left`, `right`, `center`；其他由运行时 | `dimension`, `parentDimension`, `value`, `parentPercentage` |

`parentDimension/parentPercentage` 只用于层级语义，尤其 treemap 叶节点；`incrementalRate` 只用于 waterfall；`rate/arrivalRate` 只用于 funnel。

## 3. Series label

虚实折线拆出的时间段不等于独立业务对象。单对象分段图即使不显示图例，也默认显式关闭实际 series 的 `seriesLabel`；普通 `label` 的开关不能代替它。线型说明与多对象处理见 [虚实折线](solid-dashed-line.md#系列名与数值标签分别处理)。

`bar`、`barPercent`、`horizontalBar`、`horizontalBarPercent` 的最终可见堆叠分类/series 超过一个时，反向采用显式开启：对每个实际 series 的 `modelSpec.spec` 写 `{ "seriesLabel": { "visible": true } }`。标准数据中各系列可由唯一的指标列识别时，优先用 `modelSpec[{"specKey":"series","target":{"measure":"产品A"},"spec":{"seriesLabel":{"visible":true}}}]` 这样的业务目标交给支持语义定位的宿主编译；每个指标列分别写一项。宿主不支持语义定位或目标不唯一时，先物化/readback 取得真实 `id/specIndex`，不根据输入列数或数组下标编造。这覆盖多级分类时的模板默认关闭；单层堆叠、group 模板和用户明确关闭不适用。

```ts
type SeriesLabel = {
  visible?:boolean;position?:"start"|"end"|"both-ends";
  label?:{
    style?:TextStyle;
    formatConfig?:FormatConfig<"series"|"CAGR"|"percentage">;
    space?:boolean;
    styleMap?:Record<string,{
      text?:string|string[];style?:TextStyle;
      formatConfig?:FormatConfig<"series"|"CAGR"|"percentage">;
      line?:{visible?:boolean;style?:LineStyle};
    }>;
  };
};
```

styleMap 路径比普通 label 多一层 `.label`。standard DualAxis/Mekko/MekkoPercent 的单项样式使用运行时拾取或 readback 返回的稳定业务指标 key，不根据渲染顺序编造；`${position}-${index}` 仅描述其他未接入模板及旧配置的兼容键，不能一概用于新编辑。`space` 当前真实类型为 boolean，不应写像素数。

系列标签使用 CAGR 时也需按 [semantic-marker-anchors.md](semantic-marker-anchors.md) 声明年度数据语义：2020→2024 是四年而非数据行间隔。实际支持取决于 standard 来源及模板/映射门禁，不因 content 枚举含 CAGR 就推断所有图型可年化；不支持或年份不明确时说明原因，不写死计算文字替代动态标签。

## 4. Total label

```ts
type TotalLabel = ChartLabel & {
  visible?:boolean;
  formatConfig?:FormatConfig<"dimension"|"value"|"percentage"|"incrementalRate">;
  styleMap?:Record<string,{
    text?:string|string[];style?:TextStyle;
    formatConfig?:FormatConfig<"dimension"|"value"|"percentage"|"incrementalRate">;
    line?:{visible?:boolean;style?:LineStyle};
  }|false>;
};
```

Total label key 优先使用 `totalLabel:${seriesIndex}:${dataKey}`；兼容索引 key 见 element-editing。不要把普通 label key 直接用于 totalLabel。

## 5. Pie/Rose 内外标签

`outsideLabel` 与 `insiderLabel` 是独立保存别名，分别代表 `position:'outside'/'inside'`，可同时存在。外部连接线：

```ts
type PieOutsideLine = {style?:LineStyle;smooth?:boolean};
```

按分组设置时写 `dataGroupSpec[group].outsideLabel/insiderLabel`；全系列写 `modelSpec.series.spec`。不要同时在 `label`、`outsideLabel` 写互相冲突的 position。

## 6. Funnel、Mekko、Hierarchy

- `transformLabel`：仅 transform funnel；content 为 `dimension|value|rate`。
- `outerLabel`：支持 `visible/style/line/panel/formatConfig/position`，position 根据 funnelOrient 限定为上下或左右。
- `mekkoLabel`：公共 ChartLabel + `id/space/styleMap`，content 为 `dimension|value|percentage`。
- `nonLeafLabel`：HierarchyLabel；treemap 额外支持 padding/position。

## 7. 作用域选择

- 全系列：`modelSpec.series.spec.<labelType>`。
- 某个数据分组：`dataGroupSpec[groupKey].<labelType>`。
- 单个标签：对应 label 的 `styleMap[key]`。
- 只选择显示最值/首尾：优先 `displayType`，不要生成大量索引项。

同一意图只写最窄且稳定的作用域；单标签 key 不稳定时回退 group 或全系列，而不是猜 key。

## 8. 普通值标签与总计标签去重

先按最终 mapping 计算“有效数据组/堆叠层”，不要按原始 CSV 的列数判断：

- 只有一个有效组或一个可见堆叠层：`label.visible:true`。支持 totalLabel 的堆叠模板同时设 `totalLabel.visible:false`；`barGroup`/`horizontalBarGroup` 不支持 totalLabel，必须省略该字段。此时 total 与 value 相同，不能重复展示。只做去重或数值格式化时，普通 `label` 必须省略 `position/offset`；内置 bar 默认是 `inside`。只有用户明确要求柱外、顶部等位置时，才生成对应的位置覆盖；显式同色的可读性冲突按下节窄例外处理。
- 两个及以上可相加的堆叠层：普通 label 表示分项，totalLabel 才可表示类别总量；若分项已足够支撑结论，仍可关闭 totalLabel。
- 分组而非堆叠、不同单位、不可加指标：不得用 totalLabel 制造“总计”。
- 单系列且图形身份已由轴/标题说明时，通常 `seriesLabel.visible:false`；多系列需要直接标识时才开启。
- pie/rose/funnel/Mekko/area/waterfall 等只要 summary/total 与普通标签内容相同，也遵循相同去重原则。

对于最小单指标 `barGroup`，验证过的 series identity 可写为：

```json
{"id":"series-0","specKey":"series","specIndex":0,"spec":{
  "label":{"visible":true}
}}
```


## 同色标签可读性

用户明确要求某柱及其数值标签同色时，先核对模板标签位置：bar/horizontalBar 默认为 `inside`，无描边或衬底的同色文字会融入柱体。若用户未明确要求柱内位置，可在实际 series 的 `modelSpec.spec.label` 设置 `position:"outside"`；不改请求的颜色，不隐藏数值，不用固定像素偏移代替位置。此例外只解决显式同色造成的冲突，不因普通显示、格式化或默认设计改变标签位置；用户同时要求同色且柱内时，说明当前默认表现缺少对比，并确认是否允许描边或衬底等处理，不宣称所有表现方式都不可能清晰。

“华南柱及数值橙色，其余灰色”需要分别设置图形与文字：图形 fallback 用 `config.color`，全部普通标签 fallback 用 `config.dataGroupSpec.EDITOR_ALL_DATA_GROUP.label.style.fill`，华南单标签用实际 datum 身份的 `markStyle`（`markName:"text"`）。仅设置 color 不会把其余文字变灰。单标签身份仍遵守 [单图元规则](element-editing.md#10-单个-series-markmarkstyle)，多维不套用单维内部字段例外。

可直接生成的单维单指标例子见 [同色重点条形与柱外标签](../examples/same-color-bar-label.json)。该例子是配置契约，不代表任何宿主已完成视觉或保存重开验收。
