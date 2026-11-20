# Label 类型全集

本页定义 label 可写字段及显示／空间判断；先按[数据驱动设计](data-driven-design.md#4-先选标签职责再选显示与位置)区分名称、观测值、总计和解释。单标签 key 见 `element-editing.md`，格式见 `data-and-formatting.md`。用户要求隐藏时明确关闭对应标签，不能因数据可用就全部显示。

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

多系列趋势先判断直接名称是否能减少查找；参考图有线头／线尾名称时显式还原 `seriesLabel`，不能用模板的默认图例替代。`position:"start"/"end"/"both-ends"` 按实际阅读方向选择，端点拥挤时按已支持的引线和单标签样式调整。原图横竖引线、文字方向及名称色义分别核对，不猜保存 key 或未经声明的线型字段。

原图使用错开的横竖引线时，设置 `seriesLabel.line.type:"orthogonal"`；需要全部显示则同时设置 `line.autoVisible:false`。支持此布局的编辑器按多行/富文本实测尺寸保持端点顺序，使用双拐点引线，并分别嵌套向上与向下的通道；转置图采用对应的竖横竖路由。`line.style` 仍控制颜色、粗细和虚线。标签总高度/宽度超过绘图区容量时，应增加图表尺寸或调整字号与内容，不通过隐藏系列或压缩文字伪造完整排布。连线通道也需要图面外侧留白，不能用 `label.space` 保证任意窄容器容纳全部标签。

全局连接线使用 `seriesLabel.line`；单标签覆盖使用 `seriesLabel.label.styleMap[key].line`，未单独指定的字段继承全局设置。历史编辑器保存的 `seriesLabel.label.line` 仍可读取；同时存在时，显式 `seriesLabel.line` 优先于历史路径，再叠加单标签覆盖。切换到单标签模式并拖动只改变位置及必要的连线可见性，不把继承的横竖线型重置为直线。

基础排布在用户 `style.dx/dy` 偏移之前执行；手工拖动的标签保留上下、左右偏移，其他未手工定位的标签按实测边界就近避让，连线按最终文字边界重算。连续拖动已被挤开的标签时，从当前可见位置开始。仅保存用户偏移，自动避让位移属于运行时布局；改数或文字、尺寸变化后重新计算。多个显式定位的标签互相重叠，或容器没有足够空间时，仍需调整位置或图表尺寸；后续局部生成或改数不重置用户偏移。

名称与线色一致时省略 `seriesLabel.label.style.fill`，让直标继承线色；该公共 fill 会覆盖各系列颜色，不能在多个 series 中分别写公共 fill 实现逐项颜色。单项不同样式用 `seriesLabel.label.styleMap:[{target:{measure:"World",position:"end"},value:{style:{fill:"…"}}}]`，按 [元素定位](element-editing.md) 解析，不编造 map key。需要清楚对应线尾时显示实际末点；普通数值标签同样与可见点对应。

虚实折线拆出的时间段不等于独立业务对象。单对象分段图即使不显示图例，也默认显式关闭实际 series 的 `seriesLabel`；普通 `label` 的开关不能代替它。线型说明与多对象处理见 [虚实折线](solid-dashed-line.md#系列名与数值标签分别处理)。

`bar`、`barPercent`、`horizontalBar`、`horizontalBarPercent` 有多个可见堆叠层且需要直接层名时，对每个相关实际 series 显式写 `{ "seriesLabel": { "visible": true } }`，覆盖多级分类时的模板默认关闭。完整图例已足够说明身份或用户要求关闭时，可显式关闭直标；不因层数自动全开。标准数据中各系列可由唯一指标列识别时，优先用 `modelSpec[{"specKey":"series","target":{"measure":"产品A"},"spec":{"seriesLabel":{"visible":true}}}]` 交给支持语义定位的宿主；每个需要显示的指标分别写一项。宿主不支持或目标不唯一时，物化/readback 取得真实 `id/specIndex`，不按输入列数或数组下标编造。group 模板不据此增加未支持的系列标签。

```ts
type SeriesLabel = {
  visible?:boolean;position?:"start"|"end"|"both-ends";
  line?:{visible?:boolean;autoVisible?:boolean;type?:"line"|"orthogonal";style?:LineStyle};
  label?:{
    style?:TextStyle;
    formatConfig?:FormatConfig<"series"|"CAGR"|"percentage">;
    space?:boolean;
    styleMap?:Record<string,{
      text?:string|string[];style?:TextStyle;
      formatConfig?:FormatConfig<"series"|"CAGR"|"percentage">;
      line?:{visible?:boolean;type?:"line"|"orthogonal";style?:LineStyle};
    }>;
  };
};
```

styleMap 路径比普通 label 多一层 `.label`。standard DualAxis/Mekko/MekkoPercent 的单项样式使用运行时拾取或 readback 返回的稳定业务指标 key，不根据渲染顺序编造；`${position}-${index}` 仅描述其他未接入模板及旧配置的兼容键，不能一概用于新编辑。`space` 当前真实类型为 boolean，不应写像素数。

横竖连接线用单项 `seriesLabel.label.styleMap[].value.line:{visible:true,type:"orthogonal"}`；各单项放入所属父 series 的业务 `target.measure`，不要在一个父系列中定位其他指标。共享直标组件汇总各 series 的单项样式；整体位置与默认样式继续遵从共享设置。长名称可在该单项 `text` 中换行，测量、避让和路由由运行时完成。只生成配置时不追加实绘；用户要求看效果或有布局反馈时采用对应图面结果。

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

- 只有一个有效组或一个可见堆叠层：需要直接读数时开启 `label`，用户不要求数值或已充分表达时可关闭。支持 totalLabel 的堆叠模板同时设 `totalLabel.visible:false`；`barGroup`/`horizontalBarGroup` 不支持 totalLabel，必须省略。只做去重／格式化的局部请求保持 `position/offset`；新建／整体优化按下节空间判断选择内部或外部，用户指定位置优先。
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


## 9. 显示内容与空间判断

先决定显示对象和内容，再根据最终格式化文字安排位置。名称、数值、单位可使用普通 label／totalLabel 的 `text` 富文本和 `formatConfig`；轴标签用真实轴的内容／styleMap，点说明用自己的富文本。不要把所有文字都改成点标注，也不要在 JSON 中写 formatter 函数。

- 单图趋势不默认成对显示首尾值；需要阅读最新水平时保留末期单值，不能把这条默认理解为关闭全部标签。密集曲线不默认 `all`。小多图需要比较起止水平／变化时，或用户明确要求两端值时，才用 `displayType:"firstLast"`；它不表示“只显示末值”。只需末值时按已支持的单项定位，或用绑定末期真实业务对象的动态点标签，不猜新的 `displayType` 枚举。相关极值按任务选 `min/max/minMax`，不把最值本身当叙事依据。两期斜率图只放实际起止年份及其端点值，不添加虚构中间时间。
- 折线保留的数值标签与实际可见点对应；线尾名称需要明确落点时也显示末点。仅保留少量点时，可设置 `point.visible:true`、`point.style.fillOpacity/strokeOpacity:0`，再用 `markStyle` 的 `markName:"point"` 和业务 `selector/measure` 将所需点的两项透明度设为1；`visible:false` 不生成可定位的点。此路径已由原生 Node 验证，单图元解析成功后保存原生身份，刷新后“最新一期”需重新选择，不能声称其业务 target 永久随数据跟随。
- 堆叠只需明确重点层值时，仅开启该层普通标签并说明比较目的；其他层仍绘制。“最后一层”不是显示依据，常规构成阅读保留必要分项值与身份。图例／层名负责身份，不需要总量时关闭 totalLabel。`percentage` 的分母须核对该 label 家族的含义。
- 折线／面积图的数值标签靠近对应点，必须移远时加短引线；文字出现在图内但无法辨认所指点仍属于关联问题。
- 柱／条内部可容纳文字与留白且对比度足够时内部显示，横条优先考察 `inside-right`。薄段放不下且并非必显时省略标签，数据段仍绘制；必须显示时优先留在条形内部，用同段色衬底与对比色文字，不改变真实段宽、不遮住相邻必要标签。用户／参考图明确外置或独立短柱适合外置时，外标签靠近图形，必要时加引线，不用长偏移作为薄段默认。
- 单标签 `styleMap` 未声明 `position`，不要写入。模板支持语义点时，独立内标签可使用 `itemContent.position:"insideMiddle"`、`text.labelBackground` 和动态 `text.formatConfig`；省略显式文字，`content:"value"` 读取真实层值。配置见 [点标签布局](point-marker-layout.md#3-近点数值与薄段内标签)。静态说明仍按快照说明更新职责；点目标随数据更新不等于旧静态文字已更新。无边界证据时仅选候选，不承诺任意尺寸自动内外选择或自动省略。
- 邻近端点名称／值保持角色一致，可分别在前端外侧与后端外侧、上／下方布局；文字不重合，引线不穿过相邻标签。明确用户位置及局部编辑位置保留。
- 空间不足时先去冗余、调整相关位置或合理换行，不用减少字号到不可读、隐藏必要值或改数据消除碰撞。

首次创建带局部语义标签覆盖时，目标标签必须先由基础配置生成；将建立标签的系列基础项与局部 `styleMap` 项分开，或在基础图就绪后用 `applySemanticTargets` 提交局部项。基础项身份取已核验模板或当前实例。不能把“开启首尾标签”和“隐藏起点”全部塞入尚待目标编译的同一项，期待目标在基础项未应用时已经存在。已实绘的仅末值方案可先建立 `firstLast` 标签，再按真实起点业务键隐藏起点，保留末值；这不改变 `displayType` 的含义。`TARGET_NOT_RENDERED` 表示局部项未完成，不能因PNG导出成功把模板默认标签当成修正结果。

完整 [两期直标](../examples/data-driven-endpoints.json) 和 [选择性层标签](../examples/data-driven-selective-labels.json) 为特定数据配置参考，不证明其他数据或尺寸的图面效果；不因此给每次生成增加实绘检查。

## 同色标签可读性

用户明确要求某柱及其数值标签同色时，先核对模板标签位置：bar/horizontalBar 默认为 `inside`，无描边或衬底的同色文字会融入柱体。若用户未明确要求柱内位置，可在实际 series 的 `modelSpec.spec.label` 设置 `position:"outside"`；不改请求的颜色，不隐藏数值，不用固定像素偏移代替位置。只改显示或格式的局部请求保持已有位置；新建或整体优化仍按上节判断空间与对比度。用户同时要求同色且柱内时，说明当前表现缺少对比，并确认是否允许描边或衬底等处理，不宣称所有表现方式都不可能清晰。

“华南柱及数值橙色，其余灰色”需要分别设置图形与文字：图形 fallback 用 `config.color`，全部普通标签 fallback 用 `config.dataGroupSpec.EDITOR_ALL_DATA_GROUP.label.style.fill`，华南单标签用实际 datum 身份的 `markStyle`（`markName:"text"`）。仅设置 color 不会把其余文字变灰。单标签身份仍遵守 [单图元规则](element-editing.md#10-单个-series-markmarkstyle)，多维不套用单维内部字段例外。

可直接生成的单维单指标例子见 [同色重点条形与柱外标签](../examples/same-color-bar-label.json)。该例子是配置契约，不代表任何宿主已完成视觉或保存重开验收。
