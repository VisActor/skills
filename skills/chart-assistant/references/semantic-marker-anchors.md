# 语义标注定位 DSL

## 状态与使用条件

本文用于开发阶段的模型生成：新建业务标注默认写 `target`，由图表助手内部完成定位。`marker-target/v1` 是协议说明名，不是要求模型添加的 JSON 字段。已有配置或用户明确要求自由几何时才保留旧定位，样式见 [markers.md](markers.md)。不以是否发布或 Skill 版本作为生成门禁。

- 本地实现包含参考线、区域、点、三类差异、年度 CAGR、独立分区线和两阈值四象限；支持范围仍由实际模板、映射和来源决定，不表示任意组合可用。
- 独立分区线和 quadrant 当前限 standard scatter/bubble、单绘图区；growth 也要求 standard 来源。Aeolus/其他未知转换来源不能照搬 standard 示例；未建立可靠业务字段映射时说明不支持。
- 点标注需唯一可视对象：已覆盖 standard 普通柱/折线、部分堆叠柱/面积、普通散点和长/宽表热力图。不能据此承诺全部点模板、气泡点或所有堆叠边界；热力图需完整业务键及唯一 metric，且不支持 bindAxis。
- 本地实现/测试不代表真实飞书卡片、鼠标操作或全来源同步已验收。按实际结果分别报告生成、渲染、保存与同步，不能用 JSON 合法替代这些验证。

业务 Agent 不需要 Marker Compiler 或编辑器源码；图表助手内部解析 `target`，生成坐标与编辑元数据。不要生成旧草案的 `anchors`、`dimensions/groups` 或通用 `partitions[]/where`。

## 新生成调用契约

API/Agent 默认使用 `markerFormat: "editor-marker-authoring/v1"`、`markerCapabilityVersion: "core-semantic-v1"`，生成结果是 `markerCandidates: [{ collection, candidateId, record }]`；record 直接采用本页的 target 与样式。服务端分配候选/记录身份并校验，Core 负责解析数据、坐标和动态数值。不要返回 `semanticTarget` 中间草案再配 `generatedMarkers.spec`，也不要先生成原生 markLine/markPoint 几何再反提作者。直接交付 commonOption 时仍把记录放在 `options.config.marker`，不把 API 协议字段塞进 marker 记录。

```json
{
  "markerFormat": "editor-marker-authoring/v1",
  "markerCapabilityVersion": "core-semantic-v1",
  "config": { "annotations": { "sourceMode": "userOnly", "authorItems": [{
    "collection": "markPoint",
    "record": { "name": "mark-point", "target": { "match": { "年份": 2024 }, "metric": "A" },
      "itemContent": { "text": { "visible": true, "formatConfig": { "content": "value", "prefix": "当前值：" } } } }
  }] } }
}
```

以上是增强请求的协议与 annotations 配置片段，仍须按实际工具补完整 input；不是单独可调用的请求。显式 S1/S2 旧能力各自限界，但也只走作者记录新路线。point/reference/area 的 source、系列及轴由 Core 实际映射证明，不统一假设为标准柱图；无法定位时保留诊断，不用旧坐标或第一系列兜底。total/growth/hierarchy 仍按下文真实堆叠、指标、边界与年度约束处理，不因默认能力合并而放宽。

## 1. 按用户目的选结构

| 用户想表达                   | marker 内的位置                   | target 怎么写                       |
| ---------------------------- | --------------------------------- | ----------------------------------- |
| 比较两个对象                 | `markLine[]`，原有三类差异 marker | `from`、`to`，每端用 match 指定对象 |
| 某字段等于一个值             | `markLine[]`，`reference-line`    | `field`、`value`                    |
| 目标带 / 时间窗口 / 矩形区域 | `markArea[]`，`mark-area`         | `ranges`，每项为 field、from、to    |
| 给一个数据点加说明           | `markPoint[]`，`mark-point`       | 一个 match 对象                     |
| 一条阈值分区线               | `markLine[]`，`partition-line`    | `field`、`value`                    |
| 两阈值四象限                 | 新增单个 `quadrant` 对象          | `x`、`y` 两个字段阈值               |

目标是与编辑器已有能力对等；简化定位不能缩减计算格式、样式或交互。内容与样式继续沿用 [markers.md](markers.md)。业务定位不输出运行时 series ID、内部字段、百分比坐标或 polygon key；显式自由几何模式仍保留已有字段。以下 JSON 是配置片段，不是整份 record。

## 2. 业务对象：match + metric

差异和点标注用同一种选择器，不要求 LLM 把维度与分组拆成两套字段：

```ts
type KeyValue = string | number | boolean; // 有限数；不含 null、空字符串、对象或数组
type AxisBinding = 'left' | 'right' | 'top' | 'bottom' | 'x' | 'y';
type DataTarget = {
  match: Record<string, KeyValue>; // 至少一项；完整业务维度路径及必要的分组值
  metric?: string; // 业务指标字段；唯一指标或下述唯一堆叠总量可省略
  bindAxis?: AxisBinding; // 仅字段/指标同时绑定多个轴时用于消歧
  boundary?: 'start' | 'end'; // 仅 hierarchy 使用；默认 end
};
```

- 字段角色由当前图表实际映射决定。多级维度写完整路径；有分组就写目标组值，不因为当前数据或图例筛选恰好只剩一组而省略。单维度图才只写一个维度。
- 堆叠总计是例外：它匹配该维度下的总量，不填写被求和的堆叠层字段；如果总计自身还按外层组分别形成，仍要写外层组值。层级标注则必须写所选层。不能用省略组值把分组柱强行合计。
- 指标已知时建议明确写 metric。普通对象仅在当前映射定义唯一指标时可省略；多指标必须补充，不表示“任选一个”。total / growth 另允许定位图表已有的唯一堆叠总量：例如宽表含“月份、A 销售额、B 销售额”，A/B 在同轴同单位上堆叠，此时 match 写月份并省略 metric，表示整个堆叠总量，而非任选 A 或 B。不用某个分量字段冒充总量，不对独立的多个系列新增求和。若存在多轴、多个不可比总量或无可靠总量映射，报告歧义/不支持。映射变化后重新校验，不靠可见 series 恰好唯一消歧。
- 精确匹配原业务字段和值，不用别名、显示文本、内部 `_editor_*` 字段或序号。数值 `1` 与字符串 `"1"` 不同；若源转换已丢失区分信息，报告无法可靠解析，不能假装仍可区分。
- 日期使用数据契约的规范值；不猜本地时区、单位或长宽表变换前的分组。未知映射先补信息。
- 解析只消费图表自身已有的变换结果，不额外聚合、pivot 或改写数据；同一业务键对应多个可视对象仍是歧义。
- 不支持表达式、正则、Top N、动态 max/min。“当前最高柱”先确定真实业务键；同步后仍跟随该对象，不自动改指新的最高柱。

完整目标不依赖首次渲染写回：LLM 按映射填写业务键；编辑器如需补齐确定的默认项，只在创建/编辑命令中完成。只读浏览仅解析，不写卡、不增加撤销记录；不完整输入报告缺项，不以后台规范化为绘制前提。

## 3. 差异：from / to

保留 `growth-line`、`total-diff-line`、`hierarchy-diff-line`。from/to 是有序业务起终点，不随排序交换。

from/to 的端点契约：

- 每端是一个业务对象，用 `match` 写完整业务键：全部维度路径、分组值，以及必要的 `metric`；不使用运行时 series ID、图例显示文本、内部 `_editor_*` 字段或数组序号。
- `match/metric` 只属于 marker target 通道；单元素样式 `markStyle`/`styleMap` 的 `selector/measure` 是另一套定位（见 [element-editing.md](element-editing.md#0-语义-target只补现有-dsl-的定位)），两套字段不互换。
- 任一端在完整业务集合中不存在或匹配不唯一时按 [解析状态](#8-解析状态与同步) 的 error 语义澄清，不换绑近似对象，也不省略分组值把分组对象扩大成整组总量。

```json
{
  "id": "sales-a-q1-q4-diff",
  "name": "total-diff-line",
  "target": {
    "from": { "match": { "季度": "Q1", "产品": "A" }, "metric": "销售额" },
    "to": { "match": { "季度": "Q4", "产品": "A" }, "metric": "销售额" }
  },
  "label": { "visible": true, "formatConfig": { "content": ["percentage"] } },
  "line": { "style": { "stroke": "#666666" } }
}
```

无分组、单维度且唯一指标的图可以写 `from:{match:{季度:"Q1"}}` 与 `to:{match:{季度:"Q4"}}`。

- total / growth 选择可比总量；分组柱的一组是独立总量，堆叠的一个层不能冒充总计。
- hierarchy 的 boundary 只决定线连接本层的哪条边界，默认 end；同一段 start 到 end 合法，完全相同对象和边界则无效。新内容类型比较层自身，不从线的累计高度推导标签数值。
- 层级标注先确定计算对象，再显式选择内容：比较层自身的值或份额用下表的 `layer*`；用户明确比较累计 `start/end` 边界之差时使用 `value`，端点保留指定 `boundary`。这不是新建与旧卡的区别，新建累计边界标注也可使用 `value`。旧卡片的 `value/percentage/pp/percentdiff` 及缺省值保留原公式，不在改样式、保存或同步时替换；只有用户明确切换比较口径时才迁移。

用户要求同一百分比指标的百分点差时，使用 `label.formatConfig.content:["percentPointDiff"]`，例如利润率 20%→30% 为 +10 pp；相对增长 +50% 则是另一种含义。两端须有真实百分比声明及可比较尺度，不能因数值在 0–1、指标名含“率”或模板为百分比图就推断。普通数值或无法确认尺度时不生成该内容。旧 `pp` 仅保留存量兼容，不用于新生成，也不在普通保存时自动替换；无须增加版本字段。比较堆叠层的归一占比仍用下表 `layerShareDiff`。

当前新百分点差支持 standard 来源：指标在 `value.columnFormats` 的对应列声明 `{"dataType":"number","dataFormat":{"dataType":"percent"}}`，原始数值用 `0.2`、`0.3` 表示 20%、30%，两端选择同一指标的唯一业务对象。不要把未声明百分比的整栈业务总量当作百分比；未知来源或聚合尺度不照搬此格式。

| `label.formatConfig.content` 取值 | 含义 | 例子：B 原值 20→60，占比 20%→30% |
| --- | --- | --- |
| `layerValueDiff` | 本层新值减旧值 | +40 |
| `layerGrowthRate` | 本层数值差除以本层旧值 | +200% |
| `layerShareDiff` | 本层新占比减旧占比，单位 pp | +10 pp |
| `layerShareGrowthRate` | 本层占比差除以本层旧占比 | +50% |

- 比较本层原值差选择 `layerValueDiff`，比较本层归一占比差选择 `layerShareDiff`；不因新建或使用百分比模板就忽略用户指定的累计边界口径。用户要求增长率时先辨明是原值、占比还是累计边界的增长。四种 `layer*` 内容仅用于 hierarchy，不能放入 total/growth。
- 占比内容需要两端属于同一值轴、region 和可比较归一组的实际百分比堆叠；普通堆叠有原值不等于运行时已有归一占比。按下节配对模板和内容，未知组合先说明缺项，不猜分母。
- 同一 B 层同一类别 start→end 的本层差为 0，即使线跨越该层的高度；累计边界 `value` 则比较两端边界数值，不能用本层差冒充。若已确认 A 位于最上层，Q1 的 A/B 为 100/50、Q4 为 150/90，则 A 的 end 为 150→240，边界差与整栈差均为 +90；A 自身差为 +50。此层序必须来自实际模板或运行时证据，不能由 `mappingSpec.y` 的字段顺序推定。最终标题、标注与回复使用同一口径；没有边界证据时不宣称具体累计差值已核实。
- 如 B 在 Q1 的累计边界是 20%→50%，Q4 是 40%→80%，本层份额为 30%→40%，`layerShareDiff` 为 +10 pp，而不是顶部累计值之差 +30 pp。
- 当前语义子集对无法唯一解释的正负总计、不同轴/单位/region 和未知转换报告不支持或歧义；不猜净值或端点。这些限制不是永久排除项，须审计旧端点选择/创建/拖动的实际支持；有旧能力及可比依据则补适配，确实不支持才保留正式限制。
- 百分比整栈总计的定位与业务总量分开：零栈边界为 0，全正为 1，全负为 -1；混合正负没有唯一边界时不绘制整条总计/增长标注并保留定义，不能用净值或固定 100% 冒充边界。标签计算仍使用图表实际业务总量，不把定位的 ±1 当作业务值。
- 运行时负责阶梯类型、方向、默认偏移及原始值。年度 CAGR 依数据声明和年份差计算，不要求中间年份齐全；无声明旧类别口径不能冒充年数。零分母等不可计算情况需说明，不擅自换成其他口径。
- 例如年度数据从 2020 的 100 增至 2024 的 146.41，CAGR 为 10%，不是 46.41%；只有两个可见端点也不改变四年周期。运行时统一解析边界值、单位尺度和周期，动态标签使用该结果；模型不增加周期缓存或内部计算字段。

### 按参考图判别差异类型

按参考图还原差异标注，或用户只说“标出差异”而未指明比较对象时，先判别类型再写 from/to。先看差异段位置：端点侧面的竖直差异段通常用 `hierarchy-diff-line`，顶部横向括号通常用 `total-diff-line`。斜向直线只有在比较两个总量端点、年度口径已声明且标签为年化含义时才用 `growth-line`；层边界、同类别系列或阶段贡献段即使以斜线连接，仍按其比较对象和口径选择 hierarchy。形态、连接对象和标签口径必须相互一致，不能只凭其中一个字段定型。

同时支持 total 与 hierarchy 的图类：纵向柱（`bar`、`barGroup`、堆叠柱、`barPercent`）、横向条（`horizontalBar` 系列）、`butterfly`、`line`、`area`/`areaPercent`、`dualAxis`、`waterfall`/`waterfallDecrease`、`mekko`/`mekkoPercent`；`growth-line` 除 Mekko 禁用外范围相同。scatter、histogram 与饼类不支持这些差异标注。

`butterfly` 的差异标注只能在**单侧内部**比较，`from`/`to` 两端必须同属左侧或同属右侧，并绑定该侧的 `relativeSeriesId`；跨中轴比较左右两根柱子不受支持。

形态即类型身份，与运行时默认 connectDirection 一致；按下表默认形态直接定类型，不用比较对象反推：

| 图方向 / 图类 | `total-diff-line` 默认形态 | `hierarchy-diff-line` 默认形态 |
| --- | --- | --- |
| 纵向柱、`line`、`area`/`areaPercent`、`dualAxis`、`waterfall`/`waterfallDecrease`、`mekko`/`mekkoPercent` | 默认 connectDirection=top：从柱顶/数据点向上伸出顶部横括号；整线实线（cornerRadius 6），仅 endSymbol 单箭头 | 默认 connectDirection=right：从层边界向右伸出；multiSegment 三段折线，两侧虚线 [3,3]、中间实线，start+end 双端符号 |
| 横向条形（`horizontalBar` 系列） | 与纵向相反：默认 connectDirection=right，从条末端向右伸出 | 默认 connectDirection=top，在条上方横向连接 |
| 折线/面积 | 连接两条线各自在两个 x 位置的高度 | 连接同一层在两个 x 位置的边界/厚度变化 |
| 瀑布 | 连接累计总量端点（如首柱与总计柱） | “层”是各阶段的正/负贡献段：比较两个阶段的贡献量/段高，不用累计高度冒充段高 |

- 上表方向与形态是运行时默认值；模型不因参考图形态显式复刻 `connectDirection`/`expandDistance`，显式 `connectDirection` 只是样式覆盖，不改变类型身份。
- **分组柱两种类型都可能**：`barGroup` 同类别两个系列的比较，顶部横括号形态用 `total-diff-line`，侧面竖直差异段形态用 `hierarchy-diff-line`；同一比较语义可以用任一类型表达。只有没有参考图、用户也未指定形态时，才按语义默认：堆叠层/同类别系列等层级比较默认 hierarchy，整柱/总量比较默认 total。from/to 始终写完整业务键（分组值与 metric），不能用省略组值把分组柱强行合计。
- **growth-line 与 total 同属总量端点类**，按线型与口径区分：growth 默认是连接两个偏移后端点的直实线（非 type-step 阶梯、无 cornerRadius、无 connectDirection/expandDistance），仅 endSymbol 实心单箭头，跨多个时间类别时呈斜向直线，标签默认 `CAGR`（多年复合年化，端点须满足 §3.1 年度字段声明）；total 是阶梯横括号线，标签默认 `percentage`（两端相对变化）。参考图中 2018→2022、2023→2026 各一条斜向上箭头配 % 标签是两条 growth-line；两根柱子之间的 +120%（(587-267)/267）只是两端增长率，形态为侧面竖段时是 `hierarchy-diff-line` + `layerGrowthRate`，为顶部括号时是 `total-diff-line` + `percentage`，都不是 CAGR——同数据 2010→2017 的 CAGR 约 +11.9%/年。
- 标签内容可辅助复核：`layerValueDiff`/`layerGrowthRate`/`layerShareDiff`/`layerShareGrowthRate` 仅用于 hierarchy；total/growth 使用 `value`/`abs`/`percentage`/`percentPointDiff`/`CAGR`。hierarchy 的累计边界差也使用 `value`，旧卡片的 `percentage/pp/percentdiff` 等保留原公式。因此内容类型只能单向佐证（出现 layer* 必为 hierarchy），不能因 `value` 反推 total 或改为本层差。
- **标注类型与标签口径是两次独立判断**：仅更换 marker 类型不会修正标签分母。按参考图识别百分比数值标签时先核算分母：差值 ÷ 另一端点原值 = 增长率（`layerGrowthRate`）；同类别同堆叠组内两端占比之差（等值于差值 ÷ 该类别总量）= 占比差（`layerShareDiff`，带 pp 后缀）；差值本身 = `layerValueDiff`。例如 Production 185 与 Development 103 的差值 82 若以同年总量 303 为分母约为 27%，但参考图未明确分母时这只是候选口径，必须确认后再生成。占比内容只在百分比模板（`barPercent`/`areaPercent`/`mekkoPercent`）上可用，普通 `bar`/`barGroup` 上会报“占比内容要求两端属于可比较的实际百分比堆叠及同一值轴”。非百分比图上想表达“差额/类别总量”时，参考图也构成图型与表达约束；只有用户明确接受百分比图时才切换模板。否则说明当前动态计算缺口，不能用增长率冒充，也不能为满足标注而丢失分组、配色或图例，见 [局部修正时保留完整表达](workflow.md#局部修正时保留完整表达)。
- 反例：单系列两根柱之间（如 2010:267→2017:587 的 +120%）差异竖段画在端点侧面时仍是 `hierarchy-diff-line`（标签 `layerGrowthRate`），不因“两柱总量比较”写成 total；分组柱同类别两系列上方的顶部横括号是 `total-diff-line`，不因“同类别两系列”写成 hierarchy。形态无法从参考图确认时，说明缺项并核对，不按对象猜类型。

### 3.0 本层内容、模板与边界的生成检查

生成 `hierarchy-diff-line` 时依次完成三项检查：

1. **确定比较口径并配对模板。** 下表是 standard 内置模板无额外模型覆盖时的组合；保存态检查当前 `attribute.temp`，新建检查 `options.chartType`。`stackType:"stack"` 只表示堆叠，不会把普通模板变成百分比模板。

   | 比较意图 | `content` | 可直接选用的模板 |
   | --- | --- | --- |
   | 本层原值差 / 原值增长率 | `layerValueDiff` / `layerGrowthRate` | `bar`、`barGroup`、`horizontalBar` 系列、`line`、`area`、`dualAxis`、`waterfall`/`waterfallDecrease`、`mekko`，也可用于对应百分比模板的原值比较 |
   | 本层归一占比差 / 占比增长率 | `layerShareDiff` / `layerShareGrowthRate` | `barPercent`、`areaPercent`、`mekkoPercent` |
   | 明确指定的累计 start/end 边界差 | `value`，同时保留两端 `boundary` | 支持 hierarchy 且能确定可比边界的模板；核对实际层序、轴和数值尺度，不把本层原值当累计值 |

   用户未固定模板且明确要占比时，选对应百分比模板并保留原始数值，归一由运行时完成。用户明确要求保留普通堆叠并比较占比时，说明当前组合不支持，询问是否接受百分比图；不能自行改成原值差或换图。双轴、导入 spec、URL 图和模型覆盖不按这张表猜实际 percent，须核对运行时实际系列、轴及归一组。

2. **选择有意义的连接边界。** `boundary` 控制累计位置，`content` 决定比较本层还是累计边界，二者分别确定。百分比图的最上层 `end` 往往两端都是 100%，最下层 `start` 往往都是 0；两端位置相同会让差异段退化，即使本层标签计算正确。仅在比较本层且未指定边界时，按实际堆叠顺序选能表达变化的边界：最上层通常选 `start`，最下层通常选 `end`。用户比较累计边界时，换边界会改变计算对象，不能为了避免重合而自动更换；指定边界须保留并说明重合。不要仅凭 `mappingSpec.y` 的顺序猜视觉层序；不确定时依据模板契约或已有运行时元数据核对；仍无法确定时说明缺项，不为此自动安装或启动渲染环境。若所比较的两条累计边界相等，如实表达零变化，不制造非零线段。

   对照示例（以下层序已在对应示例中渲染核对，不推广为所有模板的固定层序）：

   | 示例与实际层位置 | 两端边界 | 连接位置 | 错选另一边界的结果 |
   | --- | --- | --- | --- |
   | [Development：百分比柱/面积图最底层](../examples/semantic-bottom-layer-share.json)，2008→2012 | `end/end` | 2.6369%→33.9934% | `start/start` 都是 0%，差异段退化 |
   | [Labor：Mekko 百分比图最顶层](../examples/semantic-mekko-layer-share.json)，BU 1→BU 2 | `start/start` | 56.7568%→57.8125% | `end/end` 都是 100%，差异段退化 |

   不要把 Mekko 示例的 `start` 直接套到 Development。底层示例保留动态 `layerShareDiff`（+31.36 pp）；仅将内容改为 `layerShareGrowthRate` 时为 +1189.13%，连接边界仍为 `end/end`。`areaPercent` 改为 `barPercent` 后同样核对实际层序和端点。

3. **核对计算与配置。** 先用原始数据核算预期值，再保留动态 `content`，不把计算结果写死到 `label.text`。交付前运行 [commonOption 校验](workflow.md#commonoption-交付前校验)；核对动态内容类型、预期值及业务端点/边界；不把 `ready` 或存在标签当作视觉正确的证明，也不要求业务任务运行渲染验收。静态校验只拒绝可确定的配置冲突，不证明实际轴、分母及边界可比。

例：Development 在 2008 年为 `1.3/(40+8+1.3)`，2012 年为 `103/(15+185+103)`。占比差约 `+31.36 pp`，占比增长率约 `+1189.13%`，柱/面积占比图分别用 `barPercent`/`areaPercent`。Mekko 的 Labor 在 BU 1 为 `32/(32+42)`，BU 2 为 `27/(27+37)`，结果为 `-1.06 pp` / `-2.44%`；在本例实际最上层选两端 `start`，见 [Mekko 占比差完整配置](../examples/semantic-mekko-layer-share.json)。此处分母仅解释已知全正、同组示例，不推广为混合正负或未知归一组公式。

### 3.1 年度字段声明

在 standard data 的 `value.columnFormats` 中，为 `value.columns` 的年度列按相同索引声明 `{"dataType":"date","timeUnit":"year"}`。例如 `value` 子树：

```json
{
  "columns": ["年份", "销售额"],
  "columnFormats": [{ "dataType": "date", "timeUnit": "year" }, { "dataType": "number" }],
  "rows": [],
  "data": [
    { "年份": 2020, "销售额": 100 },
    { "年份": 2024, "销售额": 146.41 }
  ]
}
```

- 年份值为 1–9999 的整数或四位十进制年份字符串；原始类型保持，match 使用同类型值。不将其当时间戳，不凭 `YYYY` 显示格式或“年份”列名推断粒度。
- 2020→2024 的周期为 `abs(2024-2020)=4`，比值按 from/to 顺序；缺行、排序、筛选、反转不改变周期。相同年份、坏值、冲突或不唯一时间维度不回退 1 期。
- 用户请求 CAGR 而类别仅为 BU 1/BU 2 等非时间对象时，先请求真实起止年份或年度映射，不按两行算一年，也不未经确认生成 layerGrowthRate/percentage 等替代。澄清和可选方案遵守 [缺口处理](workflow.md#3-模板验证)：不把未经确认的其他比较作为该 CAGR 请求的替代结论写进标题或正文；口径完整且用户独立授权的其他比较可继续，不为非百分比数据建议百分点差。
- 年度声明是数据语义，不是 marker 局部参数。模型生成年度增长图时必须同时给出声明与 from/to，不写死 CAGR 文案。编辑页面设置相同声明后手工创建也得到相同结果。
- 三类差异的 CAGR 适用格式共享此规则；并非只有 growth-line 使用 CAGR。未声明的旧配置保持原类目间隔兼容；非年度新语义路径不得把类别期数称为年化，月/季/日年化待独立约定。
- 格式/图型组合以实际编辑器能力为准，不从年度计算支持推导所有模板都支持三类差异。CAGR 使用动态 `label.formatConfig.content:["CAGR"]`，不写死计算结果。

## 4. 直线：field / value，必要时 bindAxis

`reference-line` 是新的业务定位名称，内部按实际轴转成原有 h-line 或 v-line，并非新增底层绘制类型。

```ts
type FieldValueTarget = {
  field: string;
  value: number | string;
  bindAxis?: AxisBinding;
};
```

```json
{
  "id": "sales-target",
  "name": "reference-line",
  "target": { "field": "销售额", "value": 2000 },
  "label": { "visible": true, "text": "销售目标" },
  "line": { "style": { "stroke": "#666666", "lineDash": [4, 4] } }
}
```

字段唯一绑定轴时不用指定方向；例如日期事件写 `target:{field:"日期",value:"2026-06-18"}`。同一字段绑定左右两个轴，用户选择右轴后，可完整表达为：

```json
{
  "id": "right-sales-target",
  "name": "reference-line",
  "target": { "field": "销售额", "value": 2000, "bindAxis": "right" }
}
```

bindAxis 复用既有轴绑定的名称与方向含义，不新增 axisId 协议；这里将它放在各自 target 内，便于差异两端和区域两范围分别消歧。新模式不再同时设置 marker 根部的 bindAxis，避免两处冲突；旧模式的根部 bindAxis 不变。

- left/right/top/bottom 是实际轴朝向；x/y 只限定水平/垂直方向，不等于第几个轴。与字段绑定取交集后必须唯一；不唯一需进一步明确，不能取第一条。
- 字段与 bindAxis 冲突报配置错误。多 region 且仍不唯一时首版报告不支持，不引入内部 region ID。
- 没有 bindAxis 时，转置后跟随字段实际轴。显式 right 等约束若在转置后不再成立，不静默忽略；需在用户的映射/转置编辑中重新确认或修改绑定。
- 数值按源单位填写有限 number，例如利润率 20% 在 0–1 数据中写 0.2；不用 `"20%"` 或 `"2,000"`。分类/时间字符串必须符合已有数据契约，不做隐式时区转换。
- 不自动设置阈值，不默认用均值/中位数。合法但超出轴域的线为已解析但不可见，保留 target，域变化后可恢复，不扩轴域硬塞进去。

### 4.1 双轴图的绑定规则

以销售额绑定主轴、利润率绑定副轴为例：直立图通常是左/右轴，转置后通常是下/上轴；以当前实际映射为准，不把指标顺序、series 序号或轴标题当作绑定依据。

| 情况                            | 新 DSL 的处理                                                                                        |
| ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 利润率只绑定一个轴              | 写 field/metric 即可自动找到副轴，不必机械添加 bindAxis                                              |
| 同一字段绑定多个轴              | 写 target.bindAxis 消歧；纵向双值轴用 left/right，横向用 bottom/top                                  |
| 写 bindAxis:y，但左右都有候选   | 仍有歧义；y 不是“左轴”的别名，x 也不是“下轴”的别名                                                   |
| 日期轴同时服务多个系列          | 若实际只有一条共享日期轴，仍是唯一轴；多个系列不等于多个轴                                           |
| 比较两个季度的利润率            | from/to 都指定利润率；当前已实现子集要求同一实际值轴、同一绘图区且单位可比，范围外按旧能力审计后补齐 |
| 比较左轴销售额与右轴利润率      | 不生成差异线；能够连线不代表差值或增长率有意义                                                       |
| 利润率目标带 + 日期窗口         | 各 range 独立选轴，可组成同绘图区的二维区域                                                          |
| 左轴销售额范围 + 右轴利润率范围 | 两项都是同一空间方向，不能充当二维矩形                                                               |

示例：明确要求在右轴比较 Q1 与 Q4 的利润率（放入 markLine 数组）：

```json
{
  "id": "profit-rate-q1-q4",
  "name": "total-diff-line",
  "target": {
    "from": { "match": { "季度": "Q1" }, "metric": "利润率", "bindAxis": "right" },
    "to": { "match": { "季度": "Q4" }, "metric": "利润率", "bindAxis": "right" }
  },
  "label": { "visible": true, "formatConfig": { "content": ["percentPointDiff"] } }
}
```

该示例只在模板支持此类差异、两端确实属于右轴且利润率有真实百分比声明并采用相同尺度时成立。无显式方向要求时可省略两个 bindAxis，按 metric 跟随实际轴；不能因双轴而额外询问运行时 series ID。

bindAxis 是当前物理方向约束，不是永久的“主轴/副轴”身份：不带它的 target 可随转置重新找轴；显式 right 在转置后不再成立时不能在只读解析中擅自改为 top，需要在用户编辑中更新或确认。轴反转只影响 scale，不把 right 改成 left。原始业务数值不随绑定切换换单位或取整。

上述是新协议的输入规则。转换成旧 spec 时，值线/区域的绑定和差异端点的系列引用由图表助手内部生成，业务 Agent 不填写内部字段。

## 5. 区域：一项或两项 ranges

```ts
type FieldRange = {
  field: string;
  from: number | string;
  to: number | string;
  bindAxis?: AxisBinding; // 与 FieldValueTarget 相同；每项单独消歧
};
type AreaTarget = { ranges: [FieldRange] | [FieldRange, FieldRange] };
```

一项表示沿该轴的带状区域，另一轴铺满；两项必须分别绑定同一 region 的两个不同轴，形成矩形。范围是标注位置，不是数据筛选。

```json
{
  "id": "margin-target-band",
  "name": "mark-area",
  "target": { "ranges": [{ "field": "利润率", "from": 0.2, "to": 0.3 }] },
  "area": { "style": { "fill": "#2563EB", "fillOpacity": 0.08 } },
  "label": { "visible": true, "text": "目标区间" }
}
```

- 数值/时间 from 小于 to，反转轴不改变输入顺序。分类区间按实际 domain 顺序，from 等于 to 可覆盖一个完整 band；首尾 band 全部包含。
- 使用真实 scale，包含时间、log 和反转轴；log 非正值是非法输入，不当普通越界裁剪。
- 部分超域时绘制交集并提示裁剪，原 target 不变；全超域为已解析但不可见。不存在的分类值是匹配失败，不是普通数值越界。
- 初始 ranges 子集不支持开放端、任意多边形、跨 region 或同轴两范围；已有编辑器确实支持的自由定位由原 DSL 保留，并列入对等验证，不当作永久删减。
- 已验收区域规则：首次手工拖动区域或边界转为旧百分比自由定位并移除 target；拖到哪里框哪里，不吸附类别，撤销恢复 ranges。只改样式和文字不解除 target，四侧标签位于矩形外侧。

## 6. 点：一个业务对象

`mark-point` 使用 `target:DataTarget`，文本、引导线和目标符号保留原有 `itemContent/itemLine/targetSymbol`。

需要数值随数据更新时使用 `itemContent.text.formatConfig: { "content": "value", "prefix": "当前值：" }`，省略 `itemContent.text.text` 和 `label.text`；省略 `target.aggregate` 时，值绑定 target 的真实 metric 原始值，不使用堆叠累计值，也不重新选择全局极值。若说明生成时选中的最大/最小点，前缀写“生成时最大值点，当前值为”等，不能在排序变化后仍断言它是当前全局极值。普通固定说明继续使用显式 text，历史静态文字不自动改写。

柱图总值点显式使用 `target.aggregate: "sum"`，定位已核验整栈的总值端点，动态 `content: "value"` 显示该整栈总值。`match` 指定业务分组，`metric` 选择所属整栈；省略 metric 时必须能唯一确定整栈，不能选择第一个系列或自行猜测汇总范围。该能力仅限可核验的柱图，不扩展到折线、面积、散点或热力图。例如：

```json
{
  "id": "march-total",
  "name": "mark-point",
  "target": { "match": { "月份": "3月" }, "metric": "销售额", "aggregate": "sum" },
  "itemContent": { "type": "text", "text": { "formatConfig": { "content": "value", "prefix": "当前总值：" } } }
}
```

```json
{
  "id": "march-event",
  "name": "mark-point",
  "target": { "match": { "月份": "3月" }, "metric": "销售额" },
  "itemContent": { "type": "text", "offsetX": 35, "offsetY": -24, "text": { "type": "rich", "text": [{ "text": "促销结束" }] } },
  "itemLine": { "type": "type-do", "visible": true }
}
```

线/散点定位数据点，柱的成员原始值点定位实际柱段中心，显式 `aggregate: "sum"` 定位总值端点；多图元或无法唯一映射时报告不支持。不新增中心/上下边等方位枚举，文本偏移仍用现有字段；不因此扩大各模板的 mark-point 能力。

上面的偏移只是候选。新建点说明按 [点标注配置](point-marker-layout.md) 保留业务 target，检查偏移和引线字段；有用户截图或明确位置反馈时再针对性调整，不默认循环渲染或承诺自动避让。

## 7. 分区：单条阈值线或两阈值四象限

独立 `partition-line` 使用 FieldValueTarget，仍放在 markLine 数组中。需要四象限时，用单个 `marker.quadrant`，只给两个阈值与所需的区域样式，不组装 line ID、region ID 或 where 条件图。

```ts
type PartitionAreaStyle = {
  stroke?: string | false;
  lineWidth?: number;
  lineDash?: number | number[];
  strokeOpacity?: number;
  fill?: string | false | null;
  fillOpacity?: number; // 保留旧关闭值及透明度 0
  texture?: string | null;
  textureColor?: string | null;
  textureSize?: number | null;
  texturePadding?: number | null;
};
// 内容沿用现有 PartitionLine 的非定位字段：
// line、startSymbol、endSymbol、zIndex、interactive；不含 id/name/x/x1/y/y1/bindAxis。
type QuadrantLineStyle = Pick<PartitionLine, 'line' | 'startSymbol' | 'endSymbol' | 'zIndex' | 'interactive'>;
type Quadrant = {
  id: string;
  target: { x: FieldValueTarget; y: FieldValueTarget };
  lines?: { x?: QuadrantLineStyle; y?: QuadrantLineStyle }; // 仅样式，无新 target
  regions?: Partial<Record<'highHigh' | 'highLow' | 'lowHigh' | 'lowLow', { style?: PartitionAreaStyle }>>;
};
```

示例（这是 quadrant 对象，不是数组项；两指标都是 0–1 尺度）：

```json
{
  "id": "growth-margin-quadrants",
  "target": {
    "x": { "field": "增长率", "value": 0.1 },
    "y": { "field": "利润率", "value": 0.2 }
  },
  "regions": {
    "highHigh": { "style": { "stroke": "#2563EB", "lineWidth": 1 } }
  }
}
```

- 生成时 x/y 分别填写当前横轴/纵轴的业务字段；保存后以字段为准，转置仍跟随这两个业务字段，x/y 槽位不自动交换。highHigh 的第一个 high 永远指 target.x.field，第二个指 target.y.field，不能把它当成固定“右上方”。
- low 表示小于阈值，high 表示大于等于阈值；等值归 high，轴反转和转置不改变业务归属。气泡 size 不参与分区。
- 两阈值须能唯一绑定同一 region 的两条不同连续数值轴，且各自严格位于轴域内部，才能形成四个非零面积区域。超域或落在域端点时整组不可见并说明原因，不退化成两区。
- runtime 派生两条现有 partition-line 和四块实际 partitionArea。派生线身份由 quadrant.id 与 x/y 确定，区域身份由 quadrant.id 与四个固定键确定；不要求模型生成 polygon key。调整阈值、排序/反转或域变化后重建内部 polygon 关联，不能串区着色。
- 未配置区域样式时使用现有默认。区域名称/文字不是现有 partitionArea 能力，不额外发明 label；要求图内名称时按下节“四角名称”生成，业务解释也可放富标题。
- 同一图只配置一个 quadrant，首版限一个受支持的 scatter/bubble 绘图区；Aeolus 需其实际图型与运行时能力验证。不能与同 region 的独立/旧分区线或 legacy partitionArea 混合切割；普通参考线可以共存。
- 两阈值结构不强行表达通用多阈值或任意斜线。旧编辑器已有的自由分区能力通过已有 DSL 或后续业务表达适配保留，并进入覆盖清单；当前四象限子集通过不能代替全分区通过。不新增没有实际旧能力依据的 where 引擎。
- 相关性分析不自动等于四象限，阈值需用户或业务依据支持；不承诺动态均值/分位数阈值。

上述 PartitionAreaStyle 对应源码 PartitionAreaSpec.style，由独立分区面与 quadrant 区域共用；两者仅定位方式不同。区域样式允许颜色与 fill:false/null，fillOpacity 使用数字；省略使用默认值，false/null/0 不等于省略，不能写 fill:true 或布尔 fillOpacity。

区域工具条关闭填充可写 fill:null、关闭描边写 stroke:false，纹理四字段关闭时可为 null；这些值由上述类型保留。

### 7.1 四象限名称的四角布局

只要求“说明各区策略”不等于要求图内名称。长策略说明优先放在紧邻图表的正文，以两项阈值条件对应各区；保留图内业务分区及数据点，不自动添加四个说明框。明确要求图内名称时使用简短名称，长解释仍可另列；固定角落不具备避让气泡的能力，不能用缩短文字就承诺无遮挡。

用户要求显示四象限名称但未另指定位置时，默认放在**绘图区内部的四个外角**，留一致内边距；横排、浅色底框，名称不连接任何气泡，也不靠长引线或阈值交点定位。用户明确指定的其他位置、样式优先；只要求分割线或区域着色时不额外添加名称。

名称由用户业务语义决定，不能把示意图中的重复文字复制到四处。以下示例的 x 向右增大、y 向上增大，阈值 x=0.5、y=-8，名称对应：

| 绘图区角落 | 业务区域 | 示例文案 |
| --- | --- | --- |
| 左上 | lowHigh | 低x高y |
| 右上 | highHigh | 高x高y |
| 左下 | lowLow | 双低 |
| 右下 | highLow | 高x低y |

两阈值仍使用单个 `marker.quadrant`。当前名称使用另外四个 `marker.markPoint[]` 的自由文本位置，是绘图区装饰，不是数据点 `target`，也不是 `quadrant.regions.*.label`。这是明确的角落布局规则，不将业务阈值转换成百分比。完整配置见 [气泡四象限名称示例](../examples/bubble-quadrant-corner-labels.json)。

生成配置时显式覆盖点标注默认项：`position.x/y` 取角点的 `"0%"/"100%"`，`regionRelative:true`；`itemContent.offsetX/offsetY` 向内偏移（示例为 12px），`refX/refY:0` 清除沿引线方向的默认位移，`autoRotate:false`。`text.style.textAlign` 用 left/right、`textBaseline` 用 top/bottom，`text.dx/dy:0`；每个名称用一条完整富文本，不设置窄宽度或逐字换行。`text.padding` 设置框内留白，`text.labelBackground` 设置浅色底框；`itemLine`、其首尾符号及 `targetSymbol` 均显式隐藏。`refX/refY` 是当前运行时透传且编辑器工厂已使用的字段，公共 MarkPointSpec 类型尚未列出；不要将它们误写进 text.style。

固定角落文字不具备与 quadrant 的自动关联：轴反转、转置后需按实际业务区域重新安排名称；阈值失效隐藏或删除 quadrant 时也需同步处理这四个独立文本，不能承诺自动随组隐藏/删除。小卡片、长名称和靠近域边缘的阈值可能导致文字越区；按已知尺寸选择偏移与横排配置，用户反馈拥挤时再针对性调整，不默认启动图面检查。不能将固定位置方案描述为全生命周期语义标签支持。

配置检查：四个名称各定义一次、语义与当前轴向对应、位置与对齐朝向绘图区内、无引线及目标符号。示例仅用四行示意数据说明表达，不替换用户完整数据；实际边界、换行和尺寸变化由开发视觉回归验证。

## 8. 解析状态与同步

三种内部处理状态即可；它们是诊断结果，不是让 LLM 写入 DSL 的字段：

| 状态            | 含义                                                                | 行为                                                 |
| --------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| pending         | 数据请求、变换或布局尚未就绪                                        | 暂不绘制，等待就绪；源加载失败需报告错误，不无限等待 |
| ready + visible | 目标已确定且有可见位置                                              | 绘制；范围裁剪附提示，保存原定义                     |
| ready + hidden  | 业务对象已确认或字段/轴位置可解析，但被临时筛选隐藏或超出当前可见域 | 不绘制，保留目标，条件恢复后重绘；不报配置失败       |
| error           | 字段/目标不存在、定位缺项或歧义、非法值/计算、能力不支持            | 保留定义并给可操作说明，不猜坐标或改绑               |

隐藏原因至少区分 filtered、out-of-domain。match 对象的身份需在完整业务集合中确认：源已完成加载但目标被删除是 error，不能与临时图例隐藏混淆；若来源只提供筛选后的数据、不能证明对象存在，则不能谎称已成功解析。field/value 与 ranges 直接解析轴及 scale，不要求数据中恰好存在等于数值阈值的 datum；分类值仍须属于真实 domain。

四象限作为一个整体返回状态，任一阈值未就绪/错误则整组待定/失败，不用剩余的线冒充完整分区。多个独立标注可分别成功失败。pending、error 不报完整成功；hidden 不当生成错误，但新建交付必须告诉用户该标注当前未显示及原因。

散点的 X/Y 是两个不同指标，不天然存在“两点总量”。用户请求散点总量差时，明确散点不支持差异标注；支持的线、区域、分区、位置点四类见 [散点标注能力](markers.md#散点标注能力)。需要其他表达时先确认比较指标与业务汇总口径，补齐口径也不使散点支持差异阶梯；按 [缺口处理](workflow.md#3-模板验证) 保留待定部分，不能在标题、正文或标注中用 X/Y 差值、倍数、连线或点说明替代总量差。

## 9. 保存与编辑共同规则

### 编辑态标注列表

编辑态列表可查看全部标注及异常原因。正常可定位项可选中定位并打开样式面板；不可见/异常项只展示配置与原因，不虚构画布位置，也不提供重新选择目标的 UI。浏览态不弹提示，无法绘制时保留定义但不展示图形。

普通作者标注可删除并撤销；异常项批量删除不包含趋势线或独立分区样式。趋势线动作是“隐藏”并保留定义；独立 partitionArea 的动作是“重置样式”，不删除分割线或区域拓扑。四象限子项用于选中改样式，删除从父项执行并说明整组范围；撤销恢复整组。用户明确删除后不应因普通同源同步复活；临时缺失而未删除的目标恢复时可重新显示。

这些是编辑操作，不需要模型在 DSL 中额外生成列表、异常状态或历史副本。

### 持久化与几何

- 新建图放 `elements[].options.config.marker`；保存/编辑态放 `elements[].attribute.marker`，飞书 record 包装不变。quadrant 是新 authoring 子字段，不是现有顶层 partitionArea 的另一种写法。
- 同一标注的 target 与旧几何互斥：coordinates、点 position/coordinate、区域/分区线 x/x1/y/y1 等。样式内的 label.position 和文本偏移仍可使用；其余样式按现有类型允许的字段保留。
- 保存 target、id 与用户内容/样式，坐标和 polygon 等只在内部派生；复用现有保存及编辑命令，不另建一套标注状态系统。
- id 在当前 chart 元素的标注集合中唯一；quadrant 派生 id 由运行时保证不与已有绘制对象冲突。复制整个图在新的元素作用域解析，不要求跨 record 的所有图共享一套 marker ID。
- 改颜色、线宽、文案、标签偏移不改变 target。差异端点/阈值可唯一反解时更新业务目标，否则拒绝并提示；点拖动保留业务目标和旧版偏移。区域按已验收第 5 节首次拖动转自由定位，不额外要求手动切换。其他显式手动模式保存旧定位，四象限整体转换不能留下半个语义组。
- 四象限的线和区域可分别改样式：保存到原 quadrant 的 lines.x/y 或 regions.<业务区>.style，不创建旧 partitionArea 或独立分区线。删除任一组成部分按整组删除，编辑界面明确该范围；一次撤销恢复整组，一次重做删除整组。不要求 LLM 填子图形 ID，运行时负责把选中对象路由回正确业务槽位，拒绝过期选择的写入。
- Sheet direct-live 的数据、URL、range 与风神原图同步流程不变；解析标注不会额外聚合或提升同步资格。source-sync 保留目标并重算，显式 data-replace + clearEditorConfig 仍按原流程清空。
- 静态 label.text 不自动改数字；需要随数据变化使用现有 formatConfig，不改既有 formatter 优先级。
- 默认及显式标签布局继续由图表助手处理，包括最小柱高对应的端点修正、总计差异避让和绘制后的标签位置修正；不要求模型填写这些内部偏移。显式导出图片由运行时等待必要布局稳定；普通配置交付不要求导出或渲染。
- 重绘不写回规范化字段、不创建撤销历史；只读浏览无需写权限。数据、映射、布局、筛选、target 或样式改变后使旧派生结果失效，不复用旧坐标兜底。
- 旧 coordinates 不自动反推 target；基础图出现不代表标注成功，仍需检查实际标注与诊断。

新建业务标注采用这里的 target。其他 modelSpec/markStyle 编辑的 identity 要求不变。
