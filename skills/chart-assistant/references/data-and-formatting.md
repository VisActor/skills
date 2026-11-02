# 标准数据、筛选、排序与格式化完整契约

## 1. 标准数据

```ts
type StandardData = { type: 'standard'; value: StandardDataContent | string };
type StandardDataContent = {
  data: Record<string, unknown>[];
  rows: string[];
  columns: string[];
  columnFormats?: ColumnFormat[];
  columnFilters?: DataFilter[];
  columnSorts?: ('ASC' | 'DESC' | 'NORMAL')[];
  originData?: unknown[];
  initialOriginData?: unknown[];
  invalidCells?: { row: number; column: number }[];
  transposedData?: StandardDataContent;
  source?: { url: string; type?: 'lark' | 'larkSheet' | 'larkBase' | string; config?: unknown };
  tableData?: (string | number)[][];
  tableOriginData?: (string | number)[][];
  initialTableOriginData?: (string | number)[][];
};
```

公共 commonOption 的 `IStandardConfigData.value` 只要求 `data`，`columns/rows` 可选；完整编辑/保存态要求把运行时规范化后的 `columns/rows` 保存。`columnFormats/columnFilters/columnSorts` 与 columns 按索引对齐。

`invalidCells.row` 是数据区零基索引（相对包含表头的实际表格行减 1），`column` 是列索引。无效数据不静默改 0。

### Mekko 宽度与轴契约

`mekko/mekkoPercent` 的类别宽度是独立数据编码，不是普通等宽分类柱。用 `mappingSpec.bandWidth` 指向实际规模列；原列名为空字符串时保留 `bandWidth:""` 和原数据，不改列名、不把规模列混入 y 系列。

保留模板原生轴类型和标签隐藏行为；不要给 Mekko 套普通柱图的 `type:"band"` 分类轴。纵向 Mekko 的底轴为 `type:"linear"`，原生 `label.visible:false`、`tick.visible:false`，业务类别由 `mekkoLabel` 显示；需要调整底轴网格/线条时仅合并这些样式，不能顺带开启内部比例刻度。横向图同样保留实际模板配置，不能直接照搬纵向 specIndex。

普通生成检查配置，不自动启动渲染。开发回归验收同时检查数据与渲染：规模11/50/120/40应产生对应宽度比例，不能只确认 bandWidth 字段存在；两种 Mekko 均不得等宽。单位值版高度保留原值，百分比版仅在各类别内部归一化到100%。若需要显示规模数值，配置实际系列的 `mekkoLabel.formatConfig`，不要用打开原生轴标签代替。

## 2. ColumnFormat

```ts
type ColumnFormat = {
  dataType?: 'number' | 'date' | 'text';
  timeUnit?: 'year';
  dataFormat?: FormatConfig;
  editInfo?: { source: 'single' | 'batch'; groupId?: string; updatedAt?: number };
};
```

`editInfo` 是编辑器元信息；新建数据通常省略。`dataType` 影响 scatter/heatmap 等模板的字段解释，不能仅为了显示格式把文本 ID 改成 number。

列类型与显示格式的枚举不同：分类列用 `dataType:"text"`，不是 `"category"`；数值列用 `dataType:"number"`，其普通数值显示使用 `dataFormat.dataType:"digit"`，百分比/千分比按既有语义使用 `"percent"`/`"permil"`，均不能写 `"number"`。也可省略不必要的格式字段，不能把轴类型或列类型复制到格式枚举。

交付前硬核对（校验器会直接判失败，且不得带这些取值写卡）：`dataType` 合法值只有 `number | date | text`，`dataFormat.dataType` 合法值只有 `digit | percent | permil`。旧版或猜测取值 `category`、`number`（作格式）、`string`、`percent`（作列类型）一律改写为上述合法枚举；不确定某列类型时按数据实际内容选 text/number，不引入新枚举。

明确年度语义时同时声明 `dataType:"date", timeUnit:"year"`；这使年度 CAGR 按真实年份差计算，不依赖行数。年份合法值、精确匹配及不可计算情况见[年度字段声明](semantic-marker-anchors.md#31-年度字段声明)，不能仅凭显示格式推断年份。

## 3. FormatConfig

```ts
type FormatContent =
  | 'dimension'
  | 'parentDimension'
  | 'value'
  | 'abs'
  | 'percentage'
  | 'secondaryDimensionPercentage'
  | 'parentPercentage'
  | 'seriesPercentage'
  | 'globalPercentage'
  | 'totalDimPercentage'
  | 'value(percentage)'
  | 'percentage(value)'
  | 'CAGR'
  | 'pp'
  | 'percentPointDiff'
  | 'group'
  | 'percentdiff'
  | 'layerValueDiff'
  | 'layerGrowthRate'
  | 'layerShareDiff'
  | 'layerShareGrowthRate'
  | 'series'
  | 'series(CAGR)'
  | 'CAGR(series)'
  | 'series(percentage)'
  | 'percentage(series)'
  | 'date'
  | 'text'
  | 'x'
  | 'y'
  | 'size'
  | 'rate'
  | 'arrivalRate'
  | 'incrementalRate';
type FormatConfig<T extends string = FormatContent> = {
  prefix?: string;
  postfix?: string;
  unit?: 'none' | 'auto' | 'CN_K' | 'CN_W' | 'CN_BW' | 'CN_QW' | 'CN_Y' | 'K' | 'M' | 'B';
  fixed?: number | 'auto';
  content?: T | T[];
  contentWrap?: boolean;
  separator?: boolean;
  dataType?: 'digit' | 'percent' | 'permil';
  dateFormat?:
    | 'Auto'
    | 'YMD'
    | 'YMD_Slash'
    | 'MDY'
    | 'YMD_CN'
    | 'YMD_CN_E'
    | 'DMY_AbbrM'
    | 'YMD_AbbrM'
    | 'MDY_EN'
    | 'MD_E_CN'
    | 'MD'
    | 'MD_CN'
    | 'MD_AbbrM'
    | 'MD_EN'
    | 'Hm'
    | 'HmA'
    | 'Hms'
    | 'HmsA';
  contentFormat?: Record<
    FormatContent,
    {
      prefix?: string;
      postfix?: string;
      unit?: FormatConfig['unit'];
      fixed?: number | 'auto';
      dataType?: FormatConfig['dataType'];
      separator?: boolean;
    }
  >;
};
```

### 普通数值标签的必要性

趋势或构成图不因存在多个时点就自动打开首尾标签。先看用户是否要求精确值比较；没有此要求且数值在零值、薄层或端点附近拥挤时，可关闭普通标签，保留坐标轴、图例和 tooltip。明确要求的数值不能省略，应调整展示方式并验证可读性。`displayType:"firstLast"` 仅控制候选标签范围，不保证端点文字互不重叠。

普通值标签、系列身份标签和图例分别决策。多系列线图/面积图已有完整图例时，关闭普通值标签后还需检查并显式关闭无增量的 `seriesLabel`；使用实际 series 的 modelSpec，不从字段名猜组件ID。

### 百分比标签的分母

先确定每个百分比的分母，再选 content；图型为百分比堆叠不代表所有占比字段等价。标准多维分类标签中，`percentage` 按第一层维度汇总，`secondaryDimensionPercentage` 按前两层维度组合汇总；不能全局替换已有字段口径。

例如 x=[year,region]，每个年份地区组合一根100%堆叠柱，要求各柱内部构成合计100%时，普通标签使用 `formatConfig:{content:"secondaryDimensionPercentage",fixed:1}`。2020/China 的三项原值49、23、12，以84为分母显示58.3%、27.4%、14.3%；同年所有地区合计350是另一口径，不能用于该柱构成。单层年份分类下的每年构成继续使用 `percentage`。保留原始数值，不预先转百分数或丢掉第二维；更深层维度/其他来源先核对实际支持，不能把前两维口径冒充任意深度。

`value(percentage)`、`percentage(value)`、`series(CAGR)`、`CAGR(series)`、`series(percentage)`、`percentage(series)` 为历史兼容 content，新生成用 content 数组表达组合。具体 label/marker 只允许其子 union；不要把所有 content 写到任意位置。

上表对应源码 `types/common.ts` 的公共 `FormatContentType` union。`group` 表示分组；四个 `layer*` 内容分别表示本层原值差、原值增长率、占比差（pp）、占比增长率，只用于 hierarchy 差异标注，不用于 total/growth。具体口径、零分母等边界见 [语义标注](semantic-marker-anchors.md)；公共 union 不是所有组件都支持所有内容的保证。

### 合计标签精度

合计标签的格式与源数据精度一起确认。用户未要求取整时，不让默认精度把49.3、110.5显示成49、111；此类一位小数数据可在实际 series 的 `totalLabel.formatConfig` 显式设置 `fixed:1`。不改原始数据或为统一外观给所有数值强制相同精度；已有卡片的精度仅在本次授权的格式范围内修改。

### 默认千分位

新建图表的金额、数量等业务数值默认设置 `separator:true`，不限于咨询/MBB 风格。已有卡片的无关编辑保留原格式；用户明确要求关闭时写 `separator:false`。千分位是显示分组，不是千分比，不要改成 `dataType:"permil"`。

- standard data 中，按 `columns` 索引对齐 `columnFormats`，在业务数值列的 `dataFormat` 合并 `separator:true`。保留其余格式字段与原始 `data`；日期、年度、编号和分类编码不因长得像数字而改成 number。
- standard 普通标签的 `value` 使用对应指标列格式；数值轴和总计标签在关联数值列格式一致时继承该格式（双轴按各轴绑定的指标判断）。已在列上定义的单位、精度和千分位，不再复制到这些组件的 `formatConfig`；仅显示原值且没有局部格式要求时，省略整个 `formatConfig`，保留所需 `visible` 和样式。删除重复格式不等于隐藏标签，也不额外打开隐藏标签或改变位置。
- 只有用户要求某处采用不同格式、复合内容需要单独格式，或组件不能继承时，才配置必要的局部字段。多指标格式不一致时数值轴/总计标签不能自动取得统一格式，先确定业务上可共用的单位和精度，再设置实际组件；不能为了统一展示改动原始数据。业务标注及百分比、CAGR、pp 等计算内容按各自契约设置，不能一概删除其 `formatConfig` 或改成原值口径。
- 普通标签/数值轴中，`fixed/unit/separator/dataType` 等组件格式覆盖列格式，`contentFormat[content]` 再覆盖对应内容的格式；顶层 `prefix/postfix` 则装饰整段标签，会在列前后缀之外再次追加，并非覆盖列单位。列已设置 `postfix:"万元"` 时，不再给普通标签或轴设置相同顶层后缀，否则会重复显示单位。需要单独覆盖某个内容的前后缀时使用合法的 `contentFormat[content]`。新生成复合标签时，检查数值 token（如 `value`）是否残留 `separator:false`；只改相应数值 token，不影响 `dimension/series/date/text`。
- standard tooltip 使用指标列格式，scatter 的 `x/y/size` 数值标签也直接使用相应列格式，不走普通标签的组件覆盖链，因此不能只配置坐标轴或标签。风神等导入来源保留来源语义，按其实际支持的组件格式处理，不能为开启千分位转成 standard 或声称全部 tooltip 已覆盖。
- 不同时强加 `fixed:0` 或 `unit:"auto"`。例如原有两位小数、无缩放的 `12345.67` 开启后为 `12,345.67`；原有单位换算仍保留。小于千的数值外观可以不变。

示例：数据列是 `columns:["年份","订单号","销售额"]` 时，列格式可写为：

```json
[
  { "dataType": "date", "timeUnit": "year" },
  { "dataType": "text" },
  { "dataType": "number", "dataFormat": { "separator": true } }
]
```

此时普通值标签和格式一致的数值轴无需再写 `separator:true`。完整单系列 bar 的字段位置见 [示例](../examples/ida-mbb-single-series-bar.json)，其中 `fixed:0` 是该例整数数据的选择，不是千分位默认规则。

例如方案A收入80万元、方案B收入100万元，收入列设置 `dataFormat:{fixed:0,postfix:"万元",separator:true}`，普通标签保留 `label:{visible:true}`，标签与 Tooltip 显示 `80万元`、`100万元`。数值轴默认继承列格式；若轴标题为“收入（万元）”，则按下节仅清除刻度的单位后缀。A 到 B 的差异标注仍按用户要求表达“增加20 万元”；标注的文字与计算内容按标注契约配置，不把普通标签的重复格式复制过去。

### 轴标题与刻度的单位去重

同一根轴的标题与刻度不重复展示同一单位。标题可见且已明确单位时，刻度只保留对应数值；标题未带单位或不可见时，刻度保留单位。只调整该轴，不删除数据列的单位，也不连带修改普通标签、Tooltip、标注或另一根轴；用户明确要求两处保留时遵从。

列单位来自 `prefix/postfix` 时，在实际数值轴 `spec.label.formatConfig.contentFormat.value` 中只将重复的单位字段设为空字符串。显式空字符串表示清除该内容继承的前后缀，省略字段表示继续继承；顶层 `formatConfig.postfix:""` 不能清除列后缀。保留非单位的修饰文字、精度、千分位和缩放。以数据已经按万元存储、列 `postfix:"万元"` 为例，数值轴的 spec 合并：

```json
{
  "title": { "visible": true, "text": "收入（万元）" },
  "label": { "formatConfig": { "contentFormat": { "value": { "postfix": "" } } } }
}
```

此时刻度显示 `0、50、100、150、200`，柱标签与 Tooltip 仍显示 `120万元` 等。双轴分别核对各自的单位，不能跨轴清除。该覆盖依赖支持显式空前后缀的运行时；旧宿主未支持时，标题只写指标名并让刻度保留单位，不能声称空串已生效。

`unit:"none"` 只表示不做数值缩放，不能清除已继承的列 `postfix`。交付前逐轴核对：标题中的单位来自哪一列、刻度实际继承哪个字段、是否在 `contentFormat.value` 清除同一前后缀；不要把“设置了 unit:none”报告为“已去重”。

`unit:"CN_W"/"K"/"M"/"auto"` 或 `dataType:"percent"` 等生成的缩放/百分号不是列 `postfix`，清空后缀不会移除它们。不能为去单位改成 `unit:"none"`、`dataType:"digit"`、改原始数据或乘除数值；现有格式能力不能仅隐藏这些符号时，新建轴标题只写指标名（如“收入”“占比”），让刻度保留缩放/百分号。已有图表仅在获准调整单位展示的范围内处理，明确指定的标题不擅自改写。

## 4. DataFilter

```ts
type ValueDataFilter = {
  type: 'value';
  operator: 'EQUAL' | 'NOT_EQUAL' | 'GREATER' | 'LESS' | 'GREATER_EQUAL' | 'LESS_EQUAL' | 'BETWEEN' | 'NOT_BETWEEN';
  value: number | string | [number | string, number | string];
};
type ContentDataFilter = {
  type: 'content';
  operator:
    | 'EMPTY'
    | 'NOT_EMPTY'
    | 'CONTAINS'
    | 'NOT_CONTAINS'
    | 'IS'
    | 'STARTS_WITH'
    | 'ENDS_WITH'
    | 'DUPLICATE'
    | 'UNIQUE';
  value: string;
};
type DateDataFilter = { type: 'date'; operator: 'YESTERDAY' | 'TODAY' | 'TOMORROW' | 'LAST_7_DAYS' };
type DataFilter = ValueDataFilter | ContentDataFilter | DateDataFilter | Record<string, never>;
```

空对象表示该列无筛选。`BETWEEN/NOT_BETWEEN` 必须传两个边界。日期相对过滤以宿主当前时区执行，生成时若结果需要可复现应改为明确日期范围（若运行时支持）或说明动态语义。

## 5. 排序规则

先决定业务顺序，再选择当前数据来源能执行的方式；排序移动完整行，不能只排维度或某个数值列而错配数据。

- **用户与来源约束优先**：明确指定的顺序/方向优先于默认规则；已有卡片保留未要求修改的排序。流程、漏斗、瀑布贡献和固定业务序列按业务先后排列，不能为好看按数值排序。用户要求与保留 live 来源等约束冲突时，说明冲突再选择处理方式。
- **时间按真实先后**：月份按月序（如 `2月、3 月、10月`），季度按季度序（如 `Q2、Q3、Q4`），跨年按年再按月/季度（如 `2025年12月、2026年1月`），不按字符串或销售额排列。识别时可忽略空格，不改原标签；没有跨年歧义的单年月份不追问年份。跨年仅给 `12月、1月` 且上下文不足、混合日期格式无法唯一解析或混合时间粒度会改变比较时，才询问归属/口径，不能自行补年份或聚合。
- **排名按明确指标**：没有时间/固定顺序约束的排名类柱/条形图，默认按主要指标降序。单指标按该指标；可相加且目标为总量的堆叠图按各类别已映射系列合计，用户指定某系列则按该系列。分组比较按问题选择实际值或差距；差距明确是 `实际−预算`、绝对差还是差距率，不能默认为组内求和。目标未能确定排序指标且选择会改变结论时再询问。100%堆叠不能按归一化后的100%排总量名次。
- **并列与缺失**：并列默认保持原行相对次序，明确次级排序键时按该键；缺失/无效指标不补零、不挤入有效值排名，在本地排序结果末尾保留并说明。合计中的缺失不能静默当0；不完整类别不作完整总量排名。

### 执行方式与边界

`columnSorts` 与 `columns` 按索引对齐：`ASC` 升序、`DESC` 降序、`NORMAL` 不启用该列排序。它是编辑器按已有列重算展示数据的状态，不是“按堆叠总量”“按差距”或任意自定义类别序列的表达式；新建时不能仅附加该字段就声称 commonOption 首次渲染已排序。编辑器排序使用保留的原数据重算当前数据，编辑已有卡片走实际排序命令并核对结果，不手工捏造原数据元信息。

- 只有单个已存在且能正确比较的排序列时才使用该状态，其他列设 `NORMAL`。例如 `columns:["地区","销售额"]` 的销售额降序为 `["NORMAL","DESC"]`。不要同时开启多列来冒充稳定的主次键排序。
- 当前比较器会尝试日期解析或数值比较，不保证中文月份、季度、混合格式、并列和缺失值符合上面的业务规则；`columnFormats.dataType:"date"` 也不是这些排序的保证。按总量/差距排序不能用其中一个系列的 `DESC` 代替。
- 用户提供的本地原始数据首次建图，可按上述已明确的时间或排名语义排列完整行，并简述排序口径；只改变行序，保留字段名、原值、全部记录和映射。计算合计/差距只用于排序比较，不默默新增派生列。已有快照只有本次要求排序时才重排；需保留原行序时不重排。此方式可处理明确的月序、跨年季度及并列/缺失，不宣称同步后会自动重放排序。
- **Sheet direct-live 新建仍禁止额外生成 `columnSorts` 或重排读取结果**，见 [来源与同步](sources-and-sync.md)。需要时间/排名排序时先让来源提供该顺序，或在用户明确接受后转 snapshot；保留数据内的完整 source 不能使本地转换获得自动同步能力。已有 direct-live 的排序状态保留，只有用户同意才清除；风神导入同样沿用来源图表顺序，不提取数据重排重建。

## 6. 数据编辑定位和风险

- 字段级：字段名优先；重名必须 columnIndex。
- 单元格：rowIndex + columnIndex；行列结构操作使用对应索引。
- renameColumn 只按旧字段名同步 mappingSpec；新增列不自动加入 mapping。
- 删除已映射字段必须展示 mapping 影响并确认。
- 同源刷新才可按策略保留 format/filter/sort；换源时要求用户选择保留或丢弃。
- source-sync 不等于把卡片内编辑回写 Sheet/Base/风神。
