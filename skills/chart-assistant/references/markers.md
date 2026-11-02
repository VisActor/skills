# Marker 与分析标注完整契约

新建业务标注先读 [semantic-marker-anchors.md](semantic-marker-anchors.md)，默认用 `target`；API/Agent 缺省协议为 `editor-marker-authoring/v1`、能力为 `core-semantic-v1`，新生成不走旧 spec 或坐标兜底。本文补充共享样式、存储位置及旧定位兼容；下列 coordinates、position 和百分比几何只用于旧配置或显式自由几何，不是新建业务标注的前置步骤。

Marker 的持久化位置分为四类，不能都塞进 `marker.markLine`：

```ts
interface MarkerConfig {
  markLine?: MarkLineSpec[];
  markArea?: MarkerAreaSpec[];
  markPoint?: MarkPointSpec[];
  quadrant?: Quadrant; // 单个业务四象限；完整类型见语义标注 Reference
  trendLine?: TrendLine; // 智能编辑/洞察入口
}
interface ChartAttribute {
  marker?: MarkerConfig;
  trendLine?: TrendLine; // canonical UI 状态
  partitionArea?: Record<string, PartitionAreaSpec>;
}
```

## 1. 类型全集与存储位置

| `name` / 能力                      | 保存位置                 | 适用性                                                 |
| ---------------------------------- | ------------------------ | ------------------------------------------------------ |
| `h-line`                           | `marker.markLine[]`      | 笛卡尔数值轴的水平值线                                 |
| `v-line`                           | `marker.markLine[]`      | 笛卡尔数值/时间/分类轴的垂直值线                       |
| `reference-line`                   | `marker.markLine[]`      | 按 target.field/value 定位；方向由实际字段轴决定       |
| `growth-line`                      | `marker.markLine[]`      | 完整差异 marker 图；Mekko 禁用                         |
| `total-diff-line`                  | `marker.markLine[]`      | 完整差异 marker 图；比较两个总量/整柱端点              |
| `hierarchy-diff-line`              | `marker.markLine[]`      | 完整差异 marker 图；比较层级/段：堆叠层、分组柱同类别两系列、瀑布阶段贡献段 |
| `partition-line`                   | `marker.markLine[]`      | scatter/风神 scatter                                   |
| `mark-area`                        | `marker.markArea[]`      | 支持坐标区域的图                                       |
| `mark-point`                       | `marker.markPoint[]`     | 具备可定位绘图区的图；其他 marker 不支持时 UI 仅保留它 |
| `trend-line`                       | 顶层 `trendLine`         | scatter/风神 scatter                                   |
| `partition-area`                   | 顶层 `partitionArea[id]` | scatter 象限/区域                                      |
| `quadrant`                         | `marker.quadrant` 单对象 | standard scatter/bubble 两阈值四象限                   |
| `vertical-area`, `horizontal-area` | 内部方向语义             | 不作为独立数组；由 `mark-area` 坐标表达                |

按参考图还原 `total-diff-line`/`hierarchy-diff-line`/`growth-line` 时，默认形态是强佐证，不单独决定类型：纵向图中 total 默认是跨接两端点上方的顶部横括号（整线实线、仅末端单箭头），hierarchy 默认是端点侧面的差异竖段（三段折线、两侧虚线中间实线、首尾双符号），growth 默认是跨时间类别的直实线斜线（非阶梯横括号）且标签默认 `CAGR`；横向条形图方向对应旋转。斜线还须核对比较对象和年化口径，层份额/段值不能因形态改为 growth。无参考图时才按语义默认（层级比较→hierarchy、总量比较→total）。完整判别表见 [按参考图判别差异类型](semantic-marker-anchors.md#按参考图判别差异类型)。

Scatter/直方图属于 value-chart 路径，不支持 growth/total/hierarchy diff；scatter 额外支持 partition。非完整差异集合、非 value-chart 的其他模板默认只承诺 point。图表助手运行时内部负责最终 addable 校验；模型不调用这一内部方法，也不以获取该方法为生成前置条件。

### 散点标注能力

内置散点图的标注菜单包含以下四类；说明支持范围时按这四类表述，不用趋势线或分区能力代替完整清单。

| 菜单名称 | 对应能力 |
| --- | --- |
| 线标注 | 参考线 `reference-line`；既有水平/垂直线 `h-line` / `v-line` |
| 区域标注 | `mark-area` |
| 分区标注 | `partition-line`，以及满足阈值条件的 `quadrant` |
| 位置点标注 | `mark-point` |

散点不支持增长差异、总量差异、层级差异标注（`growth-line` / `total-diff-line` / `hierarchy-diff-line`）。`trendLine` 是单独的趋势拟合能力，不是这四类标注的替代清单；分区样式 `partitionArea` 也不能代替普通区域标注 `mark-area`。具体定位、阈值和来源约束仍按相应 Reference 核对。

## 2. 公共线标注

```ts
type SymbolEndpoint = {
  visible?: boolean;
  style?: SymbolStyle;
  size?: number;
  originSymbolType?: 'arrow' | 'solidArrow' | 'hollowArrow' | 'solidCircle' | 'hollowCircle';
  symbolType?: string;
};
type MarkerLabel = {
  visible?: boolean;
  text?: string | string[];
  style?: TextStyle;
  position?: string;
  containerTextAlign?: 'auto' | 'start' | 'center' | 'end' | 'left' | 'right' | string;
  formatConfig?: FormatConfig;
  labelBackground?: { visible?: boolean; padding?: number | number[]; style?: FillStyle };
};
type CommonMarker = {
  id: string;
  bindAxis?: 'left' | 'right' | 'top' | 'bottom' | 'x' | 'y' | string;
  zIndex?: number;
  interactive?: boolean;
  startSymbol?: SymbolEndpoint;
  endSymbol?: SymbolEndpoint;
  label?: MarkerLabel;
  line?: { style?: LineStyle };
  insightId?: string;
};
type HLine = CommonMarker & { name: 'h-line'; y: number | string };
type VLine = CommonMarker & { name: 'v-line'; x: number | string };
```

`h-line.y` / `v-line.x` 是轴上的数据值，不是像素。双轴必须写 `bindAxis`，否则默认轴可能错误。值线方向由实际目标轴决定。

## 3. 差异标注的共享样式与旧配置保留

新建业务差异统一使用 [target.from/to](semantic-marker-anchors.md#3-差异from--to)，与 `commonOption` 一次交付；图表助手内部解析定位并生成编辑元数据。标签内容、百分点差、层级比较及年度 CAGR 以该语义文档为准，不要求模型先获取 series ID 或构造 `coordinates`。

`hierarchy-diff-line` 的形态不决定标签口径：本层原值差用 `layerValueDiff`，明确指定的累计边界差用 `value` 并保留 `boundary`，两者都可新建。不能把“连接 A 层 end”自动解释成“A 自身的差”，也不能因示例使用 `value` 就迁移为 `layerValueDiff`。累计值须依据实际层序确认，不能按字段顺序猜测；完整规则见上述语义文档。

三类差异标注继续使用第 2 节的 `line`、`label`、首尾符号等公共样式，展示字段按定位路径区分：

| 字段 | 适用范围与含义 |
| --- | --- |
| `offset` | 新建 `growth-line` 的展示偏移：有限像素数值或百分比字符串，运行时沿指标轴派生两端偏移，保留业务目标。 |
| `coordinatesOffset` | 旧 coordinates 配置中的两端 `{x, y}` 展示偏移，也是运行时派生字段；数值表示像素，百分比字符串表示相对绘图区的偏移。新建 target 不直接填写此字段。 |
| `type: "type-step"` | `total-diff-line`、`hierarchy-diff-line` 的折线连接类型；旧 spec 必须声明，语义 target 的生成规则见语义文档。 |
| `connectDirection` | 两类 step 差异的连接方向：`top`、`bottom`、`left`、`right`。方向属于展示配置，不用于指定比较对象或轴绑定。默认值随图方向与差异类型不同：纵向图 total 默认 `top`、hierarchy 默认 `right`；横向条形图相反，total 默认 `right`、hierarchy 默认 `top`。 |
| `expandDistance` | 两类 step 差异沿连接方向的扩展距离；公共类型为字符串，百分比（如 `"30%"`）相对于绘图区宽度/高度，也可写像素数值。 |

两类 step 差异的默认形态即类型身份，按参考图直接定型：纵向图中 `total-diff-line` 是跨接两端点上方的顶部横括号，整线实线（cornerRadius 6）、仅 endSymbol 单箭头；`hierarchy-diff-line` 是端点侧面的差异竖段，multiSegment 三段折线、两侧虚线 `[3,3]` 中间实线、start+end 双端符号；横向条形图两者方向对应旋转。这些是运行时默认值，模型按参考图形态判别类型并填写业务 target，不复刻默认 `connectDirection`/`expandDistance`；显式改方向只是样式覆盖，不改变类型。完整判别规则见 [按参考图判别差异类型](semantic-marker-anchors.md#按参考图判别差异类型)。

不要求模型复刻默认偏移或避让算法；运行时负责默认布局；Skill 检查显式样式配置，不承诺标签无重叠，也不为此强制渲染。

零 padding 或小画布上，层级差异的默认扩展距离（绘图区剩余空间加固定值）会把差异段和标签推出画布外；此时显式给像素数值的 `expandDistance`（如 `40`）把标签收敛进画布内。

编辑已有配置时：

- 同一标注的 `target` 与定位字段 `coordinates` 互斥；`coordinatesOffset` 属于旧定位的展示偏移，维护旧配置时保留；语义 target 的增长线偏移使用 `offset`。
- 仅改样式、文案或指定的格式项时，保留原有 `id`、定位及其他编辑元数据；不自动将旧 `coordinates` 反推为 `target`，不在普通保存时替换旧 `pp/percentdiff` 公式。
- 只有需要维护已有 `coordinates` 定位时，才读取 [旧差异 coordinates 维护](legacy-marker-coordinates.md)。无法可靠恢复目标身份时说明缺项，不用邻项、数组序号或猜测坐标补齐。
- 自由文本 `position`、区域 `positions` 等自由几何是各自的定位方式，不等于差异 `coordinates`，不因此触发旧差异构造流程。

## 4. 区域标注的旧自由几何与共享样式

```ts
type MarkerAreaSpec = {
  id: string;
  name: 'mark-area';
  zIndex?: number;
  interactive?: boolean;
  bindAxis?: string;
  x: string;
  x1: string;
  y: string;
  y1: string; // region 百分比，如 "15%"
  area?: { style?: FillStyle };
  label?: MarkerLabel | MarkerLabel[];
  insightId?: string;
};
```

`x/x1` 从 region 左到右，`y/y1` 从上到下，均为百分比字符串，不是数据值。业务意图若是“数值 80–100 的目标带”，应让运行时根据轴域换算，不能把 `80` 写成 `"80%"`。`vertical-area`/`horizontal-area` 保存时仍为 `name:"mark-area"`。

## 5. 点标注的旧位置与共享样式

新建数据点说明或调整重叠时，按 [点标注布局流程](point-marker-layout.md) 使用以下偏移和引线样式，完成配置检查；业务目标仍使用 target，下面的 position 只用于旧位置和显式自由文本。

语义柱图点默认表示成员原始值，锚定实际柱段中心。只有明确说明柱图总值时，使用 `target.aggregate: 'sum'`：锚定已核验整栈的总值端点，动态 `content: 'value'` 读取总值；`metric` 用于选择所属整栈，省略 metric 时必须能唯一确定整栈。省略 aggregate 仍表示成员原始值，不随堆叠自动改成总值。契约与示例见 [点：一个业务对象](semantic-marker-anchors.md#6-点一个业务对象)。

```ts
type MarkPointSpec = {
  id: string;
  name: 'mark-point';
  position: { x: string; y: string };
  regionRelative?: true;
  itemContent?: {
    position?: 'top' | 'bottom' | 'middle' | 'insideTop' | 'insideBottom' | 'insideMiddle';
    offsetX?: number;
    offsetY?: number;
    confine?: boolean;
    autoRotate?: boolean;
    type: 'text';
    text?: {
      visible?: boolean;
      labelBackground?: { visible?: boolean; style?: FillStyle };
      type: 'rich';
      text?: Array<TextStyle & { text: string }>;
      containerTextAlign?: 'left' | 'right' | 'center';
      padding?: number;
      style?: TextStyle;
      dx?: number;
      dy?: number;
    };
  };
  itemLine?: {
    type?: 'type-s' | 'type-do' | 'type-po' | 'type-op' | 'type-arc';
    arcRatio?: number;
    visible?: boolean;
    decorativeLine?: { visible?: boolean; length?: number };
    startSymbol?: { visible?: boolean; style?: SymbolStyle };
    endSymbol?: { visible?: boolean; style?: SymbolStyle };
    line?: { visible?: boolean; style?: LineStyle };
  };
  targetSymbol?: { offset?: number; visible?: boolean; style?: SymbolStyle };
  insightId?: string;
};
```

position 是 region 百分比。追随数据点的新标注使用业务 target，不能用固定百分比冒充数据定位。明确要求绘图区角落名称时可以使用这种自由文本位置，按 [四角布局](semantic-marker-anchors.md#71-四象限名称的四角布局) 配置无引线样式；百分比角点随绘图区尺寸变化，但不会自动跟随业务象限换角。

## 6. Scatter 趋势线与分区

```ts
type TrendLine = {
  visible?: boolean;
  calculateMethod?: 'linear' | 'exponential' | 'logarithmic' | 'power';
  line?: { style?: LineStyle };
  zIndex?: number;
  insightId?: string;
  label?: {
    visible?: boolean;
    autoRotate?: boolean;
    position?:
      | 'start'
      | 'startTop'
      | 'startBottom'
      | 'insideStart'
      | 'insideStartTop'
      | 'insideStartBottom'
      | 'middle'
      | 'insideMiddleTop'
      | 'insideMiddleBottom'
      | 'end'
      | 'endTop'
      | 'endBottom'
      | 'insideEnd'
      | 'insideEndTop'
      | 'insideEndBottom';
    style?: TextStyle;
  };
};
type PartitionLine = {
  id: string;
  name: 'partition-line';
  zIndex?: number;
  interactive?: boolean;
  x: string;
  x1: string;
  y: string;
  y1: string;
  line?: { style?: LineStyle };
  startSymbol?: SymbolEndpoint;
  endSymbol?: SymbolEndpoint;
};
type PartitionAreaSpec = {
  positions: { x: string; y: string }[];
  style?: PartitionAreaStyle;
};
```

`PartitionAreaStyle` 与四象限区域共用 [semantic-marker-anchors.md 的实际类型](semantic-marker-anchors.md#7-分区单条阈值线或两阈值四象限)：`stroke` 为 `string|false`，`fill` 为 `string|false|null`，`fillOpacity` 为 number；还支持其中列明的线宽、虚线、描边透明度与纹理字段。省略使用默认/已有值，`false`、`null` 和透明度 0 的关闭/透明语义不能丢弃。两者差异在定位：独立区域用 positions，四象限由业务阈值派生区域。

趋势线由运行时汇总可转数值的 x/y 点并计算回归；LLM 不伪造回归方程。指数/对数/幂回归必须满足数值域；样本过少、离群值主导或 x/y 非连续数值时不加。

### 6.1 关系分析与象限分析的选择

- 用户问相关方向、强弱或拟合关系：优先 scatter/bubble，可选 `trendLine`；没有业务阈值时不生成四象限。
- 用户问分群、优先级、资源配置或行动策略，且 x/y 阈值都有依据：生成四象限。
- 用户问异常或聚类：优先保留连续空间并标少量点；除非阈值本身就是分析定义，否则不加象限。
- size 只决定气泡大小，不参与阈值判断或象限归属。

### 6.2 旧自由分区的两阶段生成

新建业务四象限使用 `marker.quadrant`，不执行本节百分比与 polygon identity 生成过程。本节用于已有两条自由线及区域的兼容编辑。

`PartitionLine.x/x1/y/y1` 和 `PartitionAreaSpec.positions` 都是相对于最终 region 的百分比字符串。业务阈值必须经过最终轴 scale 映射，不能把 `xThreshold: 10` 直接写成 `x: "10%"`。

1. 先用 `commonOption` 物化 scatter/bubble，取得最终 x/y scale、domain、inverse/transposed 状态和 region。
2. 运行时将 x/y 业务阈值转换成 region 百分比。只有线性、非反转轴时，才可用 domain 做简单换算；nice domain、对数轴、反转轴或其他 scale 必须调用当前 runtime scale 转换。
3. 竖直阈值线写 `{x:p,x1:p,y:"0%",y1:"100%"}`；水平阈值线写 `{x:"0%",x1:"100%",y:q,y1:q}`。注意 region 的 y 百分比从上向下增长，数值轴通常相反。
4. 两条线渲染后，由运行时 polygon cut 结果生成四个 `partitionArea`。area key 是切割线索引集合的序列化结果，只用于更新命中，不是稳定的“高高/高低”业务 ID；线移动、删除、重建或同步后必须重新读取。

`partitionArea` 只保存 polygon `positions` 和样式，没有象限名称字段。图内名称按 [四角布局](semantic-marker-anchors.md#71-四象限名称的四角布局) 用独立文本标注，解释性旁注也可放 rich title；不要向 `partitionArea` 发明 `label/name/quadrant` 字段。完整两阶段示例见 [scatter-quadrant-two-phase.json](../examples/scatter-quadrant-two-phase.json)。

### 6.3 阈值与旧自由几何同步约束

- 首选固定的业务目标、政策界限、风险线或外部基准。
- 均值/中位数/分位数只有用户明确采用，并且显示计算口径时才能使用；LLM 不静默推导。
- live Sheet/Base/Aeolus 同步后，即使业务阈值不变，axis domain 变化也可能改变百分比位置。只有同步链路会重新物化 scale、换算线位置并重建 polygon identity 时才承诺分区同步。
- 宿主不能重算时，不持久化动态四象限；保留普通散点/趋势线，或让用户选择 snapshot。

## 7. 生成与配置检查

每个 marker 有 record 内唯一 ID；洞察 marker 同时维护 `insightId` 与 `insights`。`_originValue_`、`_editor_marker_label_`、智能解读 metadata、stack 临时字段是运行时字段：编辑已有状态时保留，从零生成时由运行时补齐。

模型根据模板能力和业务字段生成 DSL；运行时负责实际 series/轴绑定、端点解析、addable 校验与 spec 派生。开发回归测试检查实际渲染、保存/重开，以及承诺范围内的尺寸或数据更新。内部校验不是要求独立 Skill 调用方执行的步骤。仅 JSON schema 通过不代表差异标注可用。
