# `modelSpec` 完整写入契约

`modelSpec` 是图表内部 VChart model 的持久化增量，不是任意配置袋。已有原生身份可直接复用；没有身份时，受支持的 series/axes/legends 可使用 [业务 target 输入](element-editing.md#0-语义-target只补现有-dsl-的定位)，实例编译后仍保存原结构。

每个条目都必须包含 `specKey` 和对象形式的 `spec`。坐标轴写成 `{id:"axis-left",specKey:"axes",specIndex:0,spec:{...轴配置}}`，或受支持的 `{specKey:"axes",target:{field:"原始字段"},spec:{...轴配置}}`；不要把 `{orient:"left",type:"linear",label:...}` 裸轴对象放进 `modelSpec`。裸轴形状仅用于 `options.spec.axes` 的原生 VChart spec；编辑器会按 `specKey` 筛选组件，放错层级可能不报错却忽略轴设置。交付前运行结构校验，不能以加载没有崩溃判定设置已生效。

## 1. 组件身份：`id`、`specKey`、`specIndex`

```ts
interface ModelIdentity {
  /** VChart model 的 userId；不是 DOM ID、element ID 或业务字段名。 */
  id: string | number;
  /** 组件在 VChart spec 中的集合键。 */
  specKey: "axes" | "title" | "legends" | "region" | "series" |
           "tooltip" | "crosshair" | "player" | "dataZoom" | "scrollBar" | string;
  /** 该 specKey 对应规范化数组中的零基索引。 */
  specIndex: number;
}
interface IModelSpec extends ModelIdentity {
  /** 对目标组件做深合并的编辑增量。 */
  spec: Record<string, unknown>;
}
```

### specKey 速查与字段归属

每个 `modelSpec` 条目都必须显式写 `specKey`，它只取运行时组件的集合键，不是系列类型、字段名或自然语言名。不存在 `specKey:"bar"`、`"label"`、`"axis"`、`"xAxis"` 之类的猜测键；只写 `id` 而省略 `specKey` 的条目同样非法。

| specKey | 该条目 `spec` 承载的内容 | 内置模板常见身份 |
| --- | --- | --- |
| `series` | 系列本体样式与**全部标签类字段**：`label`（普通数值标签）、`seriesLabel`、`totalLabel`、`transformLabel`、`outerLabel`、`outsideLabel`/`insiderLabel`、`mekkoLabel` | `series-${runtimeDataId}`，或受支持的业务 target |
| `axes` | 轴标题、刻度、网格、轴线、截断；**不含十字准线** | `axis-left`/`axis-bottom` 等 |
| `legends` | 图例整体与单个图例项 | `legend-discrete`/`legend-color` |
| `title` | 图表标题 | `chart_title` |
| `tooltip` | 悬停提示 | 模板实际身份 |
| `crosshair` | 十字准线 | `crosshair-0` |
| `region` | 绘图区 | `region-0` |

- 普通数值标签没有独立的 label 组件键：`label`、`seriesLabel`、`totalLabel`、`transformLabel`、`outerLabel` 全部写在对应 `specKey:"series"` 条目的 `spec` 中；轴标签在 `axes` 条目的 `spec.label`，图例项在 `legends` 条目的 `spec.item`。
- `crosshair` 是独立组件条目，不是轴的子字段。开启十字准线写 `{id:"crosshair-0",specKey:"crosshair",specIndex:0,spec:{...}}`，不要把 crosshair 配置塞进任一 `axes` 条目的 `spec`，也不要为它发明 `tooltip` 条目的身份。
- `player`/`dataZoom`/`scrollBar` 也是合法集合键但没有结构化编辑类型，按第 4.1 节处理。

确定规则：

1. `id` 取目标运行时 model 的 `userId`，通常来自模板/VChart spec 的组件 `id`。
2. `specKey` 取运行时 model 的 `specKey`。例如坐标轴不是 `axis` 而是 `axes`。
3. `specIndex` 取运行时 `getSpecIndex()`，即组件在同一 `specKey` 集合中的零基位置。它不是数据列索引、图例项索引或系列字段序号。
4. 有 `id` 时，默认匹配逻辑严格比较 `id`；ID 不同不会自动按索引命中。只有调用方显式使用“忽略 ID”兼容模式，才回退到 `specKey + specIndex`。
5. `id` 与 `specKey/specIndex` 必须指向同一组件。布局数据使用同一身份；错配可能导致样式不生效或布局关联到另一组件。

常见模板 ID 不是自然语言名称，也不保证是当前屏幕上的方位。当前内置模板的确定性公共 ID 包括：`chart_title`、`legend-discrete`、`legend-color`、`region-0`、`axis-left`、`axis-right`、`axis-bottom`、`axis-top`、`axis-angle`、`axis-radius`、`crosshair-0`。纵向直角坐标模板默认 axes 顺序为 `axis-left/specIndex:0`、`axis-bottom/specIndex:1`；横条模板仍是这两个身份，但 band/linear 角色与纵向柱图互换。不要写 `title`、`x_axis`、`y_axis`、`legend`、`series` 之类猜测 ID。

**折线/面积图的 `transposed:true` 不等于切换为横条模板。** 该属性旋转轴的实际 `orient`，保留轴身份及 band/linear 角色：默认数值轴仍是 `axis-left/specIndex:0`，转置后出现在底部；分类轴仍是 `axis-bottom/specIndex:1`，转置后出现在左侧。同一完整计划同时设置 `transposed:true` 与“数值轴标题”时，应定位当前真实 linear 轴，不能因它最终出现在底部而把标题写入名字含 bottom 的分类轴。优先依据上下文中的真实组件身份、轴类型与字段归属；已有自定义轴不能套此默认索引。

需要显示轴或轴标题时，父轴的 `spec.visible:true` 与 `title.visible:true` 分别设置；子项可见不会覆盖父轴隐藏。当前横条模板默认隐藏 `axis-bottom` 值轴：需要数值/占比轴时，在 `axis-bottom/specIndex:1` 上显式写 `visible:true`，再配置标题和刻度；左侧仍为分类轴。已有图只改标签格式或局部样式时，保留用户原轴可见性。

series ID 由模板数据对象生成，通用形式为 `series-${runtimeDataId}`，不是业务字段名。对恰好两列、首列为维度且第二列为唯一指标的 standard `barGroup` 或 `pie`，当前转换生成唯一 `runtimeDataId = "0"`；模板系列身份确定为 `id:"series-0", specKey:"series", specIndex:0`，可直接生成配置，无需为获取此身份先渲染。`pie` 的 `mappingSpec` 省略或仅映射这两个字段时，可用该身份设置 `innerRadius` 和普通标签。多个维度、多个指标、mapping 选择其他指标、双轴、瀑布、风神或导入 spec 不在此例外内；使用实际身份或受支持的业务 target，不外推 `series-0`。

LLM 写入策略：

- 编辑已有 `browserData`：原样保留已有 identity，只改 `spec`。
- 从可信导出 fixture 派生：复用 fixture 的 identity，若改变组件数量/顺序则重新物化。
- 从零创建内置图表：优先输出 `commonOption`，让模板生成真实 model 和 layout；物化后再读取 `browserData` 做二次编辑。
- 已知完整 VChart spec：可使用其中显式组件 `id`，`specIndex` 仍按规范化后的实际数组顺序确定。
- 无法确定真实 `id`：不要猜；受支持路径生成 `{specKey,target,spec}`，不同时写 id/specIndex；不支持的来源或组件明确说明需读取身份。`${specKey}-${specIndex}` 只可作为受控转换器的兼容回退，不是通用生成规则。

## 2. 公共 JSON-safe 子类型

```ts
type TextStyle = {
  fill?: string; stroke?: string; lineWidth?: number;
  background?: string; boundsPadding?: number;
  fontFamily?: string; fontSize?: number; fontWeight?: string;
  fontStyle?: string; direction?: "horizontal"|"vertical";
  textAlign?: "auto"|"start"|"middle"|"center"|"end"|"left"|"right";
  textBaseline?: "auto"|"top"|"middle"|"bottom"|"alphabetic"|"ideographic";
  angle?: number; dx?: number; dy?: number; underline?: number;
};
type LineStyle = { visible?:boolean;stroke?:string;lineWidth?:number;strokeOpacity?:number;lineDash?:number[] };
type MarkTextureType = "circle"|"diamond"|"rect"|"vertical-line"|"horizontal-line"|"bias-lr"|"bias-rl"|"grid";
type FillStyle = LineStyle & {
  fill?:string;fillOpacity?:number;cornerRadius?:number;
  texture?:MarkTextureType|null;textureColor?:string|null;
  textureSize?:number|null;texturePadding?:number|null;
};
type SymbolStyle = FillStyle & {
  symbolType?:"circle"|"square"|"diamond"|"triangle"|"rect"|"star"|"cardioid";size?:number;
};
type FormatConfig<T extends string = string> = {
  prefix?:string;postfix?:string;
  unit?:"none"|"auto"|"CN_K"|"CN_W"|"CN_BW"|"CN_QW"|"CN_Y"|"K"|"M"|"B";
  fixed?:number|"auto";content?:T|T[];contentWrap?:boolean;separator?:boolean;
  dataType?:"digit"|"percent"|"permil";dateFormat?:string;
  contentFormat?:Record<string,{prefix?:string;postfix?:string;unit?:string;fixed?:number|"auto";
    dataType?:string;separator?:boolean}>;
};
```

上述样式对应源码 `elements/types/style.ts` 的 TextStyle、UnFillMarkStyle、FillMarkStyle、SymbolMarkStyle；不把源码的扩展索引签名作为任意属性生成入口。文本 `background` 是背景色，`boundsPadding` 是扩充文本包围盒的数值内边距，`underline` 用 1/0 开关。纹理写入实际填充图元的 `style`（例如 `series.spec.bar.style.texture`），不是 series 根字段；关闭时编辑器会写入四个纹理字段的 `null`，尺寸/间距无有效值时也可能为 `null`。省略表示不覆盖，不能把 `null` 泛化到 fill 等其他公共样式字段；分区面有独立类型，见 [markers.md](markers.md#6-scatter-趋势线与分区)。

额外 VChart 样式键只有在目标宿主已验证时才透传。不要输出函数；保存态 formatter/formatMethod 函数由运行时生成，OpenAPI JSON record 无法安全表达。

## 3. AxisModelSpec

```ts
type AxisModelSpec = ModelIdentity & { specKey:"axes"; spec:{
  orient?:"left"|"top"|"right"|"bottom"|"radius"|"angle";
  type:"linear"|"ordinal"|"band"|"point"|"time"|"log"|"symlog";
  base?:number;linearToBand?:boolean;
  label?:{visible?:boolean;style?:TextStyle;_originStyle?:TextStyle;space?:number;
    containerAlign?:"left"|"right"|"center"|"top"|"bottom"|"middle";flush?:boolean;inside?:boolean;
    autoHide?:boolean;autoRotate?:boolean;autoRotateAngle?:number[];overlapStrategy?:"autoHide"|"autoRotate";
    sampling?:boolean;formatConfig?:FormatConfig;
    styleMap?:Record<string,{visible?:boolean;text?:unknown;style?:TextStyle}|false>};
  title?:{visible?:boolean;position?:"start"|"middle"|"end";space?:number;autoRotate?:boolean;
    angle?:number;text?:string|string[];style?:TextStyle};
  domainLine?:{visible?:boolean;onZero?:boolean;style?:LineStyle};
  tick?:{visible?:boolean;tickCount?:number;inside?:boolean;tickSize?:number;alignWithLabel?:boolean;style?:LineStyle};
  grid?:{visible?:boolean;style?:LineStyle;alignWithLabel?:boolean;smooth?:boolean;
    styleMap?:Record<string,{visible?:boolean;style?:LineStyle}|false>};
  min?:number;max?:number;sampling?:boolean;inverse?:boolean;
  breaks?:{gap?:number|string;scopeType?:"count"|"length";range:[number,number];
    breakSymbol?:{visible?:boolean;style?:LineStyle&{size?:number}}}[];
  showAllGroupLayers?:boolean;trimPadding?:boolean;zero?:boolean;
}};
```

`type` 是当前类型定义中的必填项。修改已有轴时应深合并而非重建。`base` 仅用于 log；`min/max/breaks` 仅用于数值轴；新建柱/条图默认 `zero:true`。

### x 轴多层分组标签

新建图表或整体优化时，x 轴存在多层分组，默认只展示最外层分组标签。在实际 x 轴对应的 `modelSpec[].spec` 中显式设置 `showAllGroupLayers:false`；不能只省略该字段，因为多维模板可能默认设为 `true`。内置纵向直角坐标模板通常对应 `axis-bottom/specIndex:1`，已有图或导入图按实际轴身份修改。

只调整标签显示，保留数据、全部分组字段和 `mappingSpec`，不通过删维度、合并类别或改变图型来隐藏内层标签，也不以 `label.visible:false` 关闭整条轴的标签。用户明确要求展示全部层级时才设 `showAllGroupLayers:true`；局部编辑保留用户原有的层级显示设置。

`title.position/angle/autoRotate` 都是布局覆盖，不是展示轴标题的必填字段。首次创建内置模板时，如果用户只要求显示左轴标题，显式开启父轴 `visible:true`，标题只写 `title.visible/text` 及必要样式，省略这些布局字段，让模板和 VChart 决定默认位置。用户明确要求轴标题位于开始、中间或末端时，才生成对应的 `position`。

```json
{"visible":true,"title":{"visible":true,"text":"数值"}}
```

此处“数值”仅演示标题配置结构，不能把示例文案当成实际指标名。新建时根据实际轴绑定字段及 `axisTitleDefaults`（若提供）选择标题；用户明确的标题优先，已有作者标题保留。

## 4. Title、Legend、Region、Tooltip、Crosshair

```ts
type RichTitleItem = TextStyle & {text:string;lineHeight?:number|string};
type TitleModelSpec = ModelIdentity & {specKey:"title";spec:{visible?:boolean;
  textType?:"rich";text?:string|RichTitleItem[];subtext?:string;
  textStyle?:TextStyle&{align?:"left"|"right"|"center"};subtextStyle?:TextStyle;
  _initialize_?:boolean;_auto_offset_y?:boolean;offsetY?:number}};
type LegendModelSpec = ModelIdentity & {specKey:"legends";spec:{
  type?:"color"|"size"|"discrete";visible?:boolean;forceLayout?:"none"|"vertical"|"horizontal";
  orient?:"top"|"bottom"|"left"|"right";position?:"start"|"middle"|"end";padding?:number|number[];
  autoPage?:boolean;maxRow?:number;maxCol?:number;
  item?:{
    label?:{style?:TextStyle};background?:{visible?:boolean;style?:{fill?:string;fillOpacity?:number}};
    spaceRow?:number;spaceCol?:number;spaceColumn?:number;boundsPadding?:number;
    shape?:{visible?:boolean;space?:number;style?:{visible?:boolean;symbolType?:string;size?:number;
      fill?:string;fillOpacity?:number}};
    styleMap?:Record<string,{label?:{text?:string|string[];style?:TextStyle};
      shape?:{style?:{visible?:boolean;symbolType?:string;size?:number;fill?:string;fillOpacity?:number}}}|false>;
  };
  title?:{visible?:boolean;text?:string|string[];textStyle?:TextStyle;
    align?:"start"|"middle"|"end"|"left"|"right"|"center"};
  zIndex?:number;reversed?:boolean;inverse?:boolean;
  background?:{visible?:boolean;padding?:number;style?:{fill?:string;fillOpacity?:number;stroke?:string;
    strokeOpacity?:number;lineWidth?:number;cornerRadius?:number}};
  handlerText?:{visible?:boolean;style?:TextStyle};shapeFollowPoint?:boolean}};
type RegionModelSpec = ModelIdentity & {specKey:"region";spec:{stackInverse?:boolean;style?:FillStyle;clip?:boolean}};
type TooltipModelSpec = ModelIdentity & {specKey:"tooltip";spec:{visible?:boolean;mark?:Record<string,unknown>;
  dimension?:Record<string,unknown>;style?:Record<string,unknown>;enterable?:boolean;showDelay?:number;hideDelay?:number}};
type CrosshairModelSpec = ModelIdentity & {specKey:"crosshair";spec:{visible?:boolean;xField?:Record<string,unknown>;
  yField?:Record<string,unknown>;categoryField?:Record<string,unknown>;valueField?:Record<string,unknown>}};
```

Legend 的复合对象随离散/连续图例不同，只写已知意图所需字段。`padding` 的数组顺序为 `[top,right,bottom,left]`，控制图例组件与相邻布局区域的留白；`item.spaceRow/spaceCol` 只控制图例项彼此间距。新建图表需要离散图例时默认使用底部居中图例：`orient:"bottom"`、`position:"middle"`、`padding:[16,0,0,0]`；用户明确指定位置或编辑已有布局时不套用该默认值；左对齐的显式要求仍使用 `position:"start"`。不要用猜测的坐标模拟间距。Crosshair 只修改实际模板生成的方向字段。Tooltip 内容若需要函数格式化，应让运行时生成。

### 普通标题最小配置

下面仅展示旧配置兼容及用户明确要求普通字符串标题时的合法层级，不是新建图表的默认设计示例。所有新图（无论是否说 MBB）默认使用下节 rich 标题和显式字体层级；将 `modelSpec` 合并进 `commonOption.elements[].options.config`，保留已有映射与其他组件配置：

```json
{
  "modelSpec": [
    {
      "id": "chart_title",
      "specKey": "title",
      "specIndex": 0,
      "spec": {
        "visible": true,
        "text": "各年份地区指标构成"
      }
    }
  ]
}
```

title patch 建议始终显式携带 `visible:true`：仅写 `text` 运行时也会按显示处理（占位标题 `_initialize_` 标记由运行时归一化清除），显式声明可避免与占位标题语义混淆。

错误反例：`options.config = {"title":{"visible":true,"text":"各年份地区指标构成"},"label":{"visible":true}}`。`config.title/config.label` 不在 commonOption 加载白名单中，会被忽略；增加 `visible` 或 `_initialize_` 无法修复错误层级。保存态历史 root-level 兼容字段也不代表 commonOption 的 config 接受同名字段。

普通数值标签应放在对应 series 的 model entry 的 `spec.label` 中，复用实际 `id/specIndex`；多维度、多指标图先物化/readback，不能从标题的固定 ID 推导出固定 series ID。模板默认显示了标签，也不证明 `config.label` 生效。

### MBB 富文本标题

所有新建图表默认使用下面的 rich title 结构，配色可由模型从内置候选池选择，不影响标题规范；不要写 `subtext`。主标题22px、600字重、28px行高；次级说明12px、18px行高；左对齐并继承原生fontFamily。用户指定的主标题原文必须保留，次级说明仅在需要补充时间、范围、指标或单位时填写；已有表达充分时省略次级片段及换行，不编造业务单位。下面是**已确认浅色背景**且含必要次级说明的示例；其中颜色不是所有主题通用的固定值：

```json
{
  "id":"chart_title","specKey":"title","specIndex":0,
  "spec":{
    "visible":true,"textType":"rich",
    "text":[
      {"text":"Q4 销售额达 2,905，较 Q1 增长 196%","fontSize":22,"fontWeight":"600","fill":"#0F172A","lineHeight":28},
      {"text":"\n6 家店铺合计｜季度口径","fontSize":12,"fill":"#64748B","lineHeight":18}
    ],
    "textStyle":{"align":"left"}
  }
}
```

新建图的默认 rich 标题按已确认的实际背景选择前景：浅色背景可使用上述主标题 `#0F172A`／次级说明 `#64748B`；已确认 `clarity-dark` 且实际背景为 `#202226` 时，默认主标题用 `#F8FAFC`、次级说明用 `#CBD5E1`，其余字体层级和结构不变。其他背景使用与实际宿主背景可读的前景；背景未知时不猜主题或背景，不声称已完成主题适配，并将实际背景和图面可读性保留为待核验。仅有主题名称不证明画布背景已同步，也不证明显式 rich item 的 `fill` 会自动反色。

以上仅用于新建且无用户显式配色的默认标题。用户指定配色及已有标题的原文、颜色和字体层级保持，不能凭某个色值认定它是默认样式；切主题不得自动全局重置用户标题或其他图元。若既有标题颜色与新背景冲突，明确说明并按授权范围局部处理，分别核对样式保留和实际可读性。颜色方案须经真实图面验证，规则本身不构成模型或市场验收。

换行符属于 rich `text[]`。`align` 位于 `textStyle`，不是 title spec 根级。当前标题 rich item 没有可点击 URL 字段；不要发明 `href/url/onClick`。

`_initialize_` 是内部模板占位状态。新生成普通或富文本标题只需 `visible:true` 和非空 `text`，省略该字段时运行时会自动派生为 `false`，无需生成 Unicode 转义键。仅有样式、空白文本或未显式开启 `visible:true` 时，不会自动关闭占位状态。已有配置显式传入的值仍被保留：`true` 表示占位标题，浏览态不展示；编辑已有标题时若要将占位内容变成真实标题，应删除旧 `true` 并提供上述字段，或显式改为 `false`。

### 默认字体与轴标题配置

有值轴的新图显式设置轴 `title.visible:true` 和可解释的 `text`；省略新增title.style文字样式覆盖，字体字号继承图表助手主题。单指标使用指标名，多指标同口径可写“数值”，百分比写“占比”；只有已知单位才附加单位。scatter 连续两轴分别解释指标；无轴图型不增加轴。保留模板位置，省略title.position/angle/autoRotate。

轴标题与刻度不重复显示同一单位：标题已带单位时，仅覆盖该轴刻度的单位前后缀，普通标签和 Tooltip 继续使用列格式；字段写法、缩放单位和旧宿主边界见 [轴标题与刻度的单位去重](data-and-formatting.md#轴标题与刻度的单位去重)。

轴标题、刻度 `axes.spec.label`、离散图例项 `legends.spec.item.label`、普通数据标签 `series.spec.label` 或共同 `dataGroupSpec.EDITOR_ALL_DATA_GROUP.label` 默认都省略新增 `fontSize/fontFamily` 等文字样式覆盖，继承图表助手主题，不写固定12px或其他替代字号，也不生成空style。保留必要的visible、内容和formatConfig；用户明确字号时才在对应style设置。深合并已有配置，不因字体继承删除用户样式或强制开启所有标签，不生成猜测series ID；普通label.position/offset不变。

rich主标题及有必要时的次级说明使用本页22/12信息层级；其余组件采用主题字体继承。必须同时核对rich标题、轴标题内容、布局和继承边界，不能只写theme名字后假定完整默认规范已经完成。已有图表编辑及用户明确样式优先，不能为改一处文案重排全图。

### 4.1 `player`、`dataZoom`、`scrollBar`

这三个也是运行时 `ChartComponentKeys`，会获得 component `id/specKey/specIndex` 并进入 `allModelSpec/modelSpec` 保存链路。但当前图表助手没有为它们声明稳定的结构化编辑类型：

- 编辑已有图表时，原样保留其 JSON-safe `spec` 和真实 identity。
- 用户明确要求修改且已有当前组件 spec 时，只对已验证的原生字段做最小深合并。
- 从内置模板零创建时，不主动添加；不能因为 VChart 支持某字段就宣称图表助手编辑面板支持。
- 跨类型转换会把 `dataZoom/scrollBar/player` 视为可能有损的源语义；目标模板没有等价能力时必须警告或拒绝，不静默丢弃。

`indicator`、`brush`、`media` 等未进入公共结构化组件集合；原始 VChartSpec 中可被渲染不等于可写入图表助手 `modelSpec`。

## 5. SeriesModelSpec

```ts
type SeriesModelSpec = ModelIdentity & {specKey:"series";spec:{
  label?:ChartLabel&{overlap?:boolean;smartInvert?:boolean|{interactInvertType:"background"}};
  outsideLabel?:ChartLabel;insiderLabel?:ChartLabel;
  seriesLabel?:{visible?:boolean;position?:"start"|"end"|"both-ends";label?:{
    style?:TextStyle;formatConfig?:FormatConfig<"series"|"CAGR"|"percentage">;space?:boolean;
    styleMap?:Record<string,SeriesLabelItem>}};
  totalLabel?:ChartLabel&{visible?:boolean;
    formatConfig?:FormatConfig<"dimension"|"value"|"percentage"|"incrementalRate">;
    styleMap?:Record<string,LabelItem|false>};
  transformLabel?:ChartLabel;mekkoLabel?:ChartLabel;mekkoLine?:Record<string,unknown>;
  zIndex?:number;type?:"area"|"bar"|"line";_editor_axis_orient?:"left"|"right";
}&SeriesStyle};
```

单个数值标签新增样式使用语义数组，不能把类别名当作 `styleMap` key。例如系列 3 的类别 B 标签变红：

```json
{"modelSpec":[{"specKey":"series","target":{"measure":"系列 3"},"spec":{"label":{"styleMap":[{"target":{"selector":{"类别":"类别 B"}},"value":{"style":{"fill":"red"}}}]}}}]}
```

对象形式只复用当前同系列已保存的实际 key。新增业务定位由运行时解析；生成阶段遇到未声明的对象 key 会进入修正轮。

Label 的完整 discriminated union、position 和 format content 见 [labels.md](labels.md)。`seriesLabel.label.styleMap` 的稳定保存键与图形 ID 不等价，统一按 [Series label 身份规则](labels.md#3-series-label) 复用实际拾取/readback 的 key，不要求 LLM 生成内部身份；totalLabel 优先使用数据 key；一般开关不要猜这些键。

## 6. SeriesStyle 全量字段索引

| 家族 | 可写字段 |
| --- | --- |
| bar | `barWidth`, `barMinHeight`, `barBackground{visible,style}`, `bar{style}`, `barGapInGroup` |
| line | `invalidType`, `line{visible,style.curveType}`, `point{visible,style}` |
| area/radar | line 全部字段 + `area{visible,style.curveType}` |
| waterfall | `bar{style}`, `stackType:'stack'|'group'`, `firstToTotal`, `addLastTotal`, `calculationMode`, `groupBySign` |
| pie | `pie.style{centerOffset,padAngle}`, `innerRadius`, `outerRadius`, `minAngle`, `startAngle`, `endAngle` |
| rose | `rose.style`, `innerRadius`, `outerRadius`, `startAngle`, `endAngle` |
| wordCloud | `word{style,padding}`（style 含 `underline`）, `maskShape`, `wordMask`, `fontSizeRange`, `rotateAngles`, `wordCloudShapeConfig{fillingTimes,fillingRotateAngles}` |
| scatter | `point.style`, `_editor_spec_size`, `size`, `sizeMapping:'area'|'diameter'|'radius'` |
| funnel | `funnel.style`, `transform.style`, `isTransform`, `funnelOrient`, `funnelAlign`, `shape`, `isCone`, `maxSize`, `minSize`, `outerLabel` |
| sankey | `node.style`, `link.style`, `mode`, `direction`, `nodeAlign`, `nodeWidth`, `nodeLayerAdjust` |
| heatmap | `cell.style`, `valueFieldDomain{min,max}` |
| treemap | `splitType`, `gapWidth`, `nodePadding`, `maxDepth`, `minVisibleArea`, `minChildrenVisibleArea`, `drill`, `roam`, `nonLeaf`, `leaf`, `label`, `nonLeafLabel` |
| sunburst | `innerRadius`, `outerRadius`, `startAngle`, `endAngle`, `gap`, `drill`, `sunburst`, `nonLeaf`, `leaf`, `label`, `labelAutoVisible.enable` |
| circlePacking | `layoutPadding`, `drill`, `circlePacking`, `nonLeaf`, `leaf`, `label` |
| mekko | bar 全部字段 + `mekkoLabel`, `mekkoLine{id,visible,style}` |

## 7. 合并与校验

- identity 不变，`spec` 深合并；同一组件最多一项，禁止用局部新数组覆盖整个 `modelSpec`。
- `id` 存在但不匹配时应报错，不静默改用相同 index。
- 更新 series 前同时检查模板能力、实际 series 类型和数据层级。
- `_editor_*`/`_origin*` 字段编辑已有状态时保留；从零只生成这里明确列出的 `_editor_axis_orient`、`_editor_spec_size`。
- JSON record 内禁止函数、`undefined`、循环引用和凭证。

## 新开发宿主：统计与持续评价的保存协议

这两项是 `options.config` 顶层字段，不能放进 `modelSpec[].spec` 或 `mappingSpec`。目标宿主需明确支持本轮新增协议；不据版本号或 Skill 加载推定生产已有。定义见[统计与评价配方](business/recipes/statistical-and-evaluation.md)。

```ts
statistics:
  | {kind:"histogram"; input:"samples"; measure:"count"|"density"; boundaries:number[]; closure:"left-closed-last-inclusive"}
  | {kind:"histogram"; input:"bins"; measure:"count"|"density"}
  | {kind:"boxPlot"; input:"fiveNumber"}
  | {kind:"boxPlot"; input:"samples"; quartileMethod:"linear-r7"; whiskerMethod:"tukey"; whiskerMultiplier:1.5};
businessContext: {version:1; comparisons:{markerId:string; metricDirection:"high"|"low"|"unknown"}[]};
```

statistics 与 native chartType 必须一致；分箱边界或样本箱线算法没有默认补猜。新增 histogram/boxPlot 的 axes 顺序为 axis-bottom:0、axis-left:1，不能套普通柱图的索引。原始数据保持，统计结果只用于运行时派生。

businessContext 仅绑定 standard hierarchy-diff-line 的 marker.id，from/reference、to/actual 复用该 marker 完整业务端点；评价用原值且不改变原数学内容。high 高好、low 低好、相等中性、unknown 不判好坏。默认语义色低于作者显式覆盖，方向保存在作者态，自动色不保存在作者态。业务上下文不是经营评价公式，不自动着整组柱色或更新静态标题；真实宿主和来源同步仍需分别验证。
