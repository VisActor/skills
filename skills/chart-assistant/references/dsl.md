# 图表助手 DSL 完整契约

本文列出开发阶段使用的 DSL。新建业务标注默认使用 `target`、`reference-line` 和 `marker.quadrant`，完整输入与实际能力边界见 [语义标注](semantic-marker-anchors.md)；旧定位仅用于已有配置或显式自由几何。

## 1. 三层协议，不要混用

| 层                 | 结构                         | 用途                                     | 数据值形态                                                        |
| ------------------ | ---------------------------- | ---------------------------------------- | ----------------------------------------------------------------- |
| 外部首次建图       | `ICommonChartAssistantData`  | 服务端、URL 或第三方系统向编辑器传入元素 | 标准数据 `value` 为对象                                           |
| 编辑器完整状态     | `ILayerData[]`               | 创建、编辑、复制、保存、恢复             | `attribute.data.value` 可读对象或字符串，保存态通常为 JSON 字符串 |
| 飞书 add-on record | record object 的 JSON 字符串 | OpenAPI 的 `add_ons.record`              | 包装 `browserData`、`commonOption` 或 `url`                       |

内置模板的最终事实源是 `ILayerData[]`。`commonOption` 经 `loadCommonOption()` 转成编辑态；`browserData` 经 `loadLasted()` 恢复。不要把 `ILayerData[]` 塞进 `commonOption`。

### 1.1 输出协议选择

- 原始/已读取的 standard 数据首次建内置图：输出 `ICommonChartAssistantData`，由运行时补齐布局和身份，不区分宿主。
- 已有 readback/导出的编辑态或用户明确要求 ILayerData 时：输出 `ILayerData[]`，复用可靠布局与身份；仅要求多元素画布不意味着手工构造保存态。
- 风神可视化查询及其他受支持 URL 导入：飞书 record 使用 `{url, option}`；本地画布的风神入口使用 commonOption chart 的 sourceType/sourceInfo，不把 URL 当 standard 行数据。
- 写入飞书按所选模式包装为 `{browserData:layerData}`、`{commonOption,option}` 或 `{url,option}`，生成时只选一种。
- OpenAPI 的 `add_ons.record` 最终始终是上述 record object 的 JSON 字符串；不能把裸 `ILayerData[]` 直接当作 `record` 字符串。辅助脚本可以接收裸数组并代为包装，不改变 OpenAPI 协议本身。

## 2. `ILayerData[]`

```ts
interface ILayerData {
  id: string | number;
  type: 'chart' | string;
  theme?: string;
  canvasStyle?: {
    themeMode?: 'light' | 'dark' | 'system';
    backgroundColor?: string;
    gridVisible?: boolean;
    gridColor?: string;
    gridSize?: number;
    gridGap?: number;
    fontFamily?: string;
    fontSize?: number;
  };
  elements: IElementData[];
}

interface IElementData {
  rect: { x: number; y: number; width: number; height: number };
  anchor?: { x: number; y: number };
  id: string | number;
  type:
    | 'chart'
    | 'table'
    | 'text'
    | 'rect'
    | 'oval'
    | 'diamond'
    | 'callout'
    | 'straightLine'
    | 'elbowLine'
    | 'curveLine'
    | 'chartConnectorLine'
    | 'image'
    | 'svg'
    | string;
  attribute: Record<string, unknown>;
  groupedId?: string;
  groupLevel?: number;
}
```

要求：layer ID 和 element ID 在 record 内唯一；`rect.width/height > 0`；生成新元素时使用稳定 UUID；不要复制来源 block/component instance 的只读 ID。

## 3. 图表 `attribute`

```ts
interface ChartAttribute {
  temp: TemplateChartType | 'aeolus' | 'vizData' | string;
  data: StandardData | AeolusData | OtherSupportedData;
  layout: ILayoutData;
  color: string[];
  modelSpec: IModelSpec[];
  zIndex: number;

  mappingSpec?: Record<string, string | string[]>;
  sourceBinding?: SourceBinding;
  theme?: string | object;
  enableEditorTheme?: boolean;
  keepStyle?: boolean;
  graphicOpacity?: number;
  fontFamily?: string;
  fontSize?: number;
  dataTransposed?: boolean;
  transposed?: boolean;
  templateVersion?: 'v1.0' | 'v2.0' | string;
  dataGroupSpec?: Record<string, object>;
  markStyle?: object[];
  marker?: MarkerConfig;
  barLink?: BarLinkConfig;
  trendLine?: object;
  partitionArea?: Record<string, object>;
  stackType?: 'no_stack' | 'stack' | 'stack_percent';
  syncAxisDomain?: boolean;
  butterflyAxisPosition?: 'center' | 'both' | 'left' | 'right';
  markZIndexRange?: { dataGroup?: [number, number]; mark?: [number, number] };
  originalOptions?: object;
  source?: ISource;
  insights?: object[];
  isInsightsLatest?: boolean;
}
```

`keepStyle` 表示数据源变换时尽量保留现有配置；`graphicOpacity` 是整个 chart element 的透明度。`seriesSpec` 以及 root-level `title/label/seriesLabel/totalLabel/tooltip/crosshair` 是历史兼容字段，读取时保留、迁移时归并，新生成数据不得以它们作为主路径。`[key:string]:any` 只为插件/历史前向兼容，不授权 LLM 发明字段。

`layout/color/modelSpec/zIndex` 是完整保存态的重要组成；从零构造时如果没有可靠布局元数据，优先走 `commonOption` 让运行时初始化布局，或使用经过真实编辑器导出的 fixture。不要伪造 component layout ID。

### 3.1 `temp`

- 内置：`bar`、`barGroup`、`barPercent`、`horizontalBar`、`horizontalBarGroup`、`horizontalBarPercent`、`area`、`areaPercent`、`line`、`pie`、`rose`、`scatter`、`dualAxis`、`waterfall`、`waterfallDecrease`、`gauge`、`wordCloud`、`radar`、`funnel`、`sankey`、`treemap`、`sunburst`、`circlePacking`、`mekko`、`mekkoPercent`、`heatmap`。
- 导入适配：`vchartSpec`、`vseedDsl`。
- 风神：`aeolus`，并继续读取实际 `chartType`。
- 外部：`vizData` 或插件注册值；不能据此承诺全部编辑能力。

### 3.2 标准数据

公共类型：

```ts
type StandardData = {
  type: 'standard';
  value: StandardDataContent | string;
};

interface StandardDataContent {
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
}
```

公共输入示例：

```json
{
  "type": "standard",
  "value": {
    "columns": ["月份", "产品", "销售额"],
    "rows": ["1月", "1月", "2月", "2月"],
    "data": [
      { "月份": "1月", "产品": "A", "销售额": 120 },
      { "月份": "1月", "产品": "B", "销售额": 90 },
      { "月份": "2月", "产品": "A", "销售额": 140 },
      { "月份": "2月", "产品": "B", "销售额": 110 }
    ]
  }
}
```

保存态示例：

```json
{
  "type": "standard",
  "value": "{\"columns\":[\"月份\",\"产品\",\"销售额\"],\"rows\":[\"1月\",\"1月\",\"2月\",\"2月\"],\"data\":[{\"月份\":\"1月\",\"产品\":\"A\",\"销售额\":120},{\"月份\":\"1月\",\"产品\":\"B\",\"销售额\":90},{\"月份\":\"2月\",\"产品\":\"A\",\"销售额\":140},{\"月份\":\"2月\",\"产品\":\"B\",\"销售额\":110}]}"
}
```

Parser 会补缺失的 `columns/rows`，但模型应显式提供它们以固定字段顺序和维度。`columnFormats/Filters/Sorts` 必须和 `columns` 按索引一一对应。无效值保留在快照并用 `invalidCells` 标识，不要静默填零。

`ColumnFormat`、`FormatConfig`、三类 `DataFilter` 的完整字段与编辑定位规则见 [data-and-formatting.md](data-and-formatting.md)。

### 3.3 `mappingSpec`

`mappingSpec` 的 value 只能引用真实字段名。常用通道：

| 家族              | 通道                                              |
| ----------------- | ------------------------------------------------- |
| 柱/线/面积/瀑布   | `x` 业务维度、`y` 指标；横向柱也不交换 mapping 通道，仅模板交换物理轴 |
| 饼/玫瑰/漏斗/层级 | `category`, `value`                               |
| 散点              | `x`, `y`, `size`, `group`, `label`                |
| 双轴              | `x`, `leftY`, `rightY`                            |
| 桑基              | `source`, `target`, `value`                       |
| 词云              | `keyword`, `frequency`                            |
| Mekko             | `x`, `y`, `bandWidth`                             |
| 热力图            | `x`, `y`, `value`                                 |

维度、指标、系列是 LLM 的语义判断，不由 DSL 自动推断保证。年份、编码即使是数字也常是维度。

### 3.4 `modelSpec`

```ts
interface IModelSpec {
  id: string | number;
  specKey: string;
  specIndex: number;
  spec: Record<string, unknown>;
}
```

结构化编辑常用 `specKey`：`axes`、`title`、`legends`、`region`、`series`、`tooltip`、`crosshair`。运行时也会识别并保存 `player`、`dataZoom`、`scrollBar` 组件，但当前 Skill 只承诺保留已有 raw spec，不把它们当成可离线合成的结构化编辑组件。`id` 是运行时组件 `userId`；`specIndex` 是同一 `specKey` 规范化数组中的零基运行时索引，不是数据列或系列字段序号。

有 `id` 时默认严格按 ID 匹配，只有显式兼容模式才回退到 `specKey + specIndex`。编辑已有数据必须复用真实 identity；从零创建使用 commonOption。公共组件使用当前内置模板已验证的 ID；series 通常物化后读取，最小 standard `barGroup` 和两列 standard `pie` 可在已验证的数据与映射边界内使用 `series-0`，具体条件、完整字段和失败策略见 [model-spec.md](model-spec.md)。组件内部的 label/grid/legend item/mark ID 见 [element-editing.md](element-editing.md)。

例：对一个已确认真实 identity 的 series 开启 series label：

```json
{ "id": "series-sales", "specKey": "series", "specIndex": 0, "spec": { "seriesLabel": { "visible": true } } }
```

例：MBB rich title 与 tooltip：

```json
[
  {
    "id": "chart_title",
    "specKey": "title",
    "specIndex": 0,
    "spec": {
      "visible": true,
      "_initialize_": false,
      "textType": "rich",
      "text": [
        { "text": "核心市场增长领先，但二线市场差距扩大", "fontSize": 24, "fontWeight": "600" },
        { "text": "\n2026 Q2｜销售额", "fontSize": 12, "fill": "#64748B" }
      ],
      "textStyle": { "align": "left" }
    }
  },
  { "id": "tooltip", "specKey": "tooltip", "specIndex": 0, "spec": { "visible": true } }
]
```

### 3.5 样式优先级

从高到低：单图元 `markStyle` → 指定分组 `dataGroupSpec[group]` → `dataGroupSpec.EDITOR_ALL_DATA_GROUP` → `modelSpec.series` → theme/template 默认值。修改某一层时保留其他层；不要为了改颜色清空整个 `modelSpec`。

`dataGroupSpec` 同时支持 group 级 mark 和 label，并非只存颜色。其 group key、`EDITOR_ALL_DATA_GROUP`、可写 mark/label union、迁移与碰撞规则见 [element-editing.md](element-editing.md)。

### 3.6 marker 与专属字段

- `marker.markLine`：业务 `reference-line`、增长线、总计差异、层级差异、分区线；旧水平/垂直值线仍保留。
- `marker.markArea`：区域标注。
- `marker.markPoint`：点标注。
- `marker.quadrant`：单个四象限对象，包含两业务阈值和四个固定业务区样式，不是数组。
- `trendLine`：散点趋势线的 canonical 顶层字段；`marker.trendLine` 是部分智能编辑入口。
- `partitionArea`：散点分区面。
- `barLink`：柱/条系列连接，不放进 `modelSpec.seriesLabel`。
- `syncAxisDomain`：仅本地 `dualAxis`。
- `butterflyAxisPosition`：仅本地 `butterfly`，控制类目轴位置，默认 `center`；只影响布局，不改数据与映射。`center` 时轴标题/轴线/刻度线/网格线与水平对齐不提供配置。
- `markZIndexRange`：本地 `scatter` 气泡/单点层级。

业务定位与年度声明见 [semantic-marker-anchors.md](semantic-marker-anchors.md)；样式、旧坐标单位及 addable 规则见 [markers.md](markers.md)。新建差异 marker 用 from/to 业务目标，不只凭原始行手写最终 coordinates。

## 4. 非图表元素

`commonOption` 支持 `table`、`text`、直线/折线/曲线、`chartConnectorLine`、矩形、椭圆、菱形、callout、图片和 SVG。它们转换到 `ILayerData[]` 后使用 `rect + attribute`。图片/SVG URL 是视觉资源，不是数据源，不参与同步。

表格支持 `ListTable`、`PivotTable`、`PivotChart` 的 VTable spec；`ListTable` 也可使用标准数据。表格不是 `TemplateChartType`，不要写进图表 `temp`。

这些元素的完整 attribute、连接引用、单元格身份和编辑边界见 [components.md](components.md)。仅列出 type 不代表模型可以发明 attribute。

## 5. `ICommonChartAssistantData`

```ts
interface ICommonChartAssistantData {
  source?: {
    appName: string;
    showSource?: boolean;
    sourceName?: string | { zh?: string; en?: string };
    pageUrl?: string | { zh?: string; en?: string };
    sourceName_en?: string; // deprecated，只兼容读取
    pageUrl_en?: string; // deprecated，只兼容读取
  };
  elements: IElementsOption[];
  theme?: string;
}
```

### 5.1 element 外壳不可混写

`commonOption.elements[]` 是首次建图的统一推荐协议。每个元素的公共外壳是：

```ts
interface CommonOptionElementShell {
  id?: string | number;
  type: ElementType;
  position?: { x: number; y: number; width: number; height: number };
  options?: Record<string, unknown>;
}
```

图表和表格必须有 `options`。图表的 `chartType/data/config` 以及
`enableDataEdit/enableTypeChange/enableEditorTheme/zIndex` 都写在 `options` 内；文本、图形和线条的绘制属性也写在 `options` 内。

以下是无效的混合结构，禁止生成或写卡：

```json
{
  "elements": [
    { "chartType": "barGroup", "data": {}, "config": {} },
    { "type": "text", "attribute": { "text": "说明" } }
  ]
}
```

它既不是合法 `ICommonChartAssistantData`，也不是完整 `ILayerData[]`。正确结构是：

```json
{
  "elements": [
    {
      "type": "chart",
      "position": { "x": 0, "y": 0, "width": 720, "height": 420 },
      "options": {
        "chartType": "barGroup",
        "data": { "type": "standard", "value": { "columns": [], "rows": [], "data": [] } },
        "config": {},
        "enableDataEdit": true,
        "enableTypeChange": true,
        "enableEditorTheme": true,
        "zIndex": 0
      }
    },
    {
      "type": "text",
      "position": { "x": 0, "y": 432, "width": 720, "height": 48 },
      "options": { "text": "注：按同口径汇总。", "zIndex": 1 }
    }
  ]
}
```

`position` 在类型上可省略，但多个元素从零生成时必须显式布局，不能依赖多个相同的默认矩形。唯一例外是使用 [语义 target](semantic-chart-connectors.md) 的 `chartConnectorLine`，其端点由引用图表计算，无需矩形布局。`id` 可由运行时生成；若调用方需要跨元素引用，则从一开始生成 record 内唯一的稳定 UUID。

反向规则同样成立：`browserData`/`ILayerData` 元素使用 `rect + attribute`，不能把 `position + options` 原样塞进保存态。

新生成多语言来源使用 `sourceName/pageUrl` 对象；`sourceName_en/pageUrl_en` 仅保留旧 record，不主动写入。

图表元素四种入口：

1. `{ spec: VChartSpec }`：原始 VChart；默认不应用编辑器主题。
2. `{ chartType, data, config? }`：内置模板；推荐首次建图入口。
3. `{ sourceType: "aeolus", sourceInfo }`：风神 URL。
4. `{ sourceType: "vseedDsl", vseedDsl }`：VSeed DSL。

共享 option：`enableEditorTheme?`、`enableDataEdit?`、`enableTypeChange?`、`zIndex?`。对于 VChart Spec，类型切换必须显式 `enableTypeChange: true`；转换后成为 standard + 内置模板的 snapshot，不再被原始 Spec 刷新覆盖。

`options.config` 不是任意配置袋；白名单、config 对旧顶层字段的优先级、显式 `null` 清空和数据/模板转换行为见 [special-logic.md](special-logic.md)。

## 6. `sourceBinding`

```ts
type SourceBinding =
  | { mode: 'live'; kind: 'commonOption' | 'commonUrl' | 'dataSource' }
  | { mode: 'snapshot'; detachedFrom: 'vchartSpec' };
```

`live` 允许合法的 source-sync；`snapshot` 拒绝来源刷新。这是物化后 chart attribute 字段，不在 commonOption config 白名单中，首次生成不要手工塞入 config。URL/source config 先按来源协议保存，物化后核实实际绑定和同步资格。已有保存态保留真实绑定；旧数据缺失时由运行时兼容判断。当前 snapshot 的 detachedFrom 仅表达 VChartSpec 转换，不为普通上传数据或 Sheet 派生快照虚构此来源；不承诺同步的离线数据不保留可重放源绑定，真实出处可另放 pageUrl。

## 7. 最小可维护示例：柱图、系列标签和连接线

以下是保存态核心片段。真实 `browserData` 还应包含编辑器计算或可信 fixture 中的 `layout`。

```json
{
  "temp": "bar",
  "data": {
    "type": "standard",
    "value": "{\"columns\":[\"月份\",\"销售额-A\",\"销售额-B\"],\"rows\":[\"1月\",\"2月\"],\"data\":[{\"月份\":\"1月\",\"销售额-A\":120,\"销售额-B\":90},{\"月份\":\"2月\",\"销售额-A\":140,\"销售额-B\":110}]}"
  },
  "mappingSpec": { "x": "月份", "y": ["销售额-A", "销售额-B"] },
  "modelSpec": [
    { "id": "series-sales", "specKey": "series", "specIndex": 0, "spec": { "seriesLabel": { "visible": true } } }
  ],
  "barLink": { "enable": true },
  "color": ["#2563EB", "#94A3B8"],
  "zIndex": 0
}
```

这里的 `series-sales` 代表已由当前图表运行时读取的真实 `userId`，不是推荐命名规则。若使用两级维度映射，内置柱图会关闭 series label；这时不要声称已成功开启。`barLink` 的完整字段、支持模板和 `line-/area-/label-` 单元素 key 见 [bar-link.md](bar-link.md)。

## 8. `dataVersion`

`dataVersion` 属于 record，不属于 `ILayerData`。缺失时运行时使用当前 `CurrentSaveDataVersion`。新数据默认省略；旧数据迁移时传其真实原始版本。不要从文档示例或辅助脚本复制固定版本，因为示例可能早于当前运行时。

## 9. 校验清单

- 按模式检查：commonOption 为非空 elements，使用 position/options；browserData 为非空 ILayerData[]，每层和元素有唯一 ID，使用 rect/attribute；URL record 仅提供受支持 URL 与 option，待加载后再核实图表状态。
- 内置 chart 的 chartType/data（保存态为 temp/data）合法；原生 spec、Aeolus 和 VSeed 入口按各自字段检查，不强求内置 chartType/data。
- 保存态 standard JSON 字符串能解析。
- `columns` 唯一且覆盖 mapping 字段；rows/data/format/filter/sort 对齐。
- `modelSpec` 项的 `specKey/specIndex/id` 合法，不重复覆盖同一组件。
- 专属能力经过模板或风神矩阵验证。
- live source 的 URL/config 齐全，sourceBinding 在物化后核实；不把生成 URL 或绑定声明当成同步验证。snapshot 不自动同步。
- 不含 token、cookie、secret 或临时鉴权字段。
