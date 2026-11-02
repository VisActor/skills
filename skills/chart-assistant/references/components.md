# 画布元素与非图表组件完整契约

本页描述 `ILayerData[].elements[]` 中除 chart 内部 model 之外的可持久化元素。图表内部的轴、标题、图例、region、series、tooltip、crosshair 见 [model-spec.md](model-spec.md)。

## 1. 共同结构、身份和布局

```ts
interface ElementBase {
  id: string | number;
  type: ElementType;
  rect: { x:number; y:number; width:number; height:number };
  anchor?: { x:number; y:number };
  attribute: Record<string, unknown>;
  groupedId?: string;
  groupLevel?: number;
}
```

- `id` 在当前 record 内唯一，是画布元素身份；从零生成保存态时使用 UUID。`commonOption` 可省略 element `id`，运行时会生成。
- `rect` 是画布布局事实源，宽高必须大于 0。某些 attribute 还保存内部坐标，它们不能替代 `rect`。
- `anchor` 缺失时按 `{x:0,y:0}`；`groupedId` 指向当前直接组，`groupLevel:0` 表示未成组。
- 模板复制会重新生成所有元素 ID，并重写 `chartConnectorLine.attribute.data[*].chartId`；不要保留对旧图表 ID 的连接。
- `zIndex` 是最终数值。`toTop/toBottom/levelUp/levelDown` 只是编辑命令，不是保存态值。

`commonOption.elements[]` 使用 `position + options`；转换后成为 `rect + attribute`。文本会把 position 补入 `attribute.x/y/width/height`，图形会补入 `attribute.graphic`，线条把相对 start/end/control points 平移到画布绝对坐标。缺失 position 时当前转换默认 `640×360`，基础元素自身另有 `100×100` 兜底；为避免宿主差异，模型应显式给出 position。

## 2. Table

首次建表入口：

```ts
type TableOption = {
  id?: string;
  type: "table";
  position?: Rect;
  options:
    | { tableType:"ListTable"|"PivotTable"|"PivotChart"; spec?:object; viewMode?:"scroll"|"zoom" }
    | { tableType:"ListTable"; data:StandardData; config?:object };
};
```

保存态核心字段：

```ts
type TableCellStyle = {
  bgColor?: string;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  fontWeight?: "normal"|"bold"|"bolder"|"lighter"|number;
  textAlign?: "left"|"center"|"right"|"start"|"end";
  textBaseline?: "top"|"middle"|"bottom";
  borderColor?: string;
  borderLineWidth?: number|[number,number,number,number];
  borderLineDash?: number[];
  autoWrapText?: boolean;
};
type TableStylePatch = TableCellStyle | false;
interface TableAttribute {
  temp: "listTable"|"vtableSpec"|"aeolus"|"vizData"|string;
  layout: { x1:number; x2:number; y1:number; y2:number; dx?:number; dy?:number };
  data?: unknown;
  keepStyle?: boolean;
  dataTransposed?: boolean;
  graphicOpacity?: number;
  chartType?: string;
  showHeader: boolean;
  columns?: unknown[];
  records?: unknown[];
  theme?: {
    theme?:"standard"|"classic"|"simple";
    bodyStyle?:TableCellStyle; headerStyle:TableCellStyle;
    rowHeaderStyle:TableCellStyle; cornerHeaderStyle:TableCellStyle;
    enableFirstRowHeader?:boolean; enableFirstColumnHeader?:boolean;
  };
  title?: object;
  viewMode?: "scroll"|"zoom";
  colVisible?:Record<string,{col:number;visible:boolean}>;
  rowVisible?:Record<string,{row:number;visible:boolean}>;
  colWidth?:Record<string,{col:number;width:number}>;
  pivotColumnWidth?:Record<string,{col?:number;dimensions:unknown[];width:number;isRowHeader?:boolean}>;
  rowHeight?:Record<string,{row:number;height:number}>;
  colStyle?:Record<string,{col:number;style:TableStylePatch}>;
  rowStyle?:Record<string,{row:number;style:TableStylePatch}>;
  cellStyle?: Record<string,{col:number;row:number;style:TableStylePatch}>;
  contentRowStyle?: Record<string,{row:number;colStart:number;colEnd:number;style:TableStylePatch}>;
  contentColStyle?: Record<string,{col:number;rowStart:number;rowEnd:number;style:TableStylePatch}>;
  enableConditionFormat?: boolean;
  conditionFormat?: unknown[];
  chartOptions?: Record<string,{col:number;row:number;options?:object}>;
  legends?: {visible?:boolean};
  tooltip?: {visible?:boolean};
  originalOptions?: object;
  templateVersion?: "v1.0"|"v2.0"|string;
  resetEditorSpec?: boolean;
  zIndex?: number;
}
```

特殊规则：

- 单元格样式对应源码 `table/spec-process/interface.ts` 的 TableCellStyle；背景写 `bgColor`、文字色写 `color`，不套用图表的 `fill`。四边线宽数组按上、右、下、左排列；不把源码扩展索引签名作为任意样式字段入口。
- 行/列/内容行列/单元格的局部覆盖通过编辑更新合并。重置时保留目标坐标并写 `style:false`，例如 `cellStyle[key]:{col:0,row:0,style:false}`；运行时删除该 key，并清理同一映射内指向相同目标的其他 key。内容行/列按 row/col 匹配清理，不以区间边界区分重置目标。`{}` 是空增量，不表示重置；theme 的四类样式只接收 TableCellStyle，不接受 false。
- 重置单元格样式同时清理对应 PivotChart `chartOptions` 覆盖，实际图表 key 会加上行头/列头层数。运行时兼容映射项直接为 false 的旧删除输入，但新编辑应保留坐标并写 `style:false`，以便关联清理；false 是更新命令，不是最终保存的单元格样式。
- `viewMode` 缺失或非法时规范为 `scroll`；旧布尔值 `true/false` 只作 `zoom/scroll` 兼容读取，新数据写字符串。
- CommonOption 的标准数据入口写 `tableType:"ListTable"`，物化保存态会规范为内部模板名 `temp:"listTable"`；不要把两种命名互换。
- 首次创建的 table `options.config` 只接受校验器 config 白名单键（`mappingSpec/modelSpec/marker/color/...`，与图表同一白名单，见 [交付前校验](workflow.md#commonoption-交付前校验)）；保存态专属字段（`showHeader/columns/records/theme/colWidth/...`）属于物化 `TableAttribute`，禁止凭源码类型定义写进首次创建的 `options.config`——校验器按 unsupported key 判失败。首行表头语义用标准数据的表头行或 `theme.enableFirstRowHeader` 表达，需要隐藏表头时先核对宿主是否支持该编辑，不支持则说明缺项而不是造键。
- `keepStyle/dataTransposed/templateVersion` 与图表采用同一数据模板生命周期语义；`graphicOpacity` 作用于整个 table graphic root，通常写 `0..1`，不等于单元格背景透明度。
- `cellStyle` 身份是保存的 `col + row`；行列增删、透视展开或源同步后必须重新校验。行列级覆盖同理，不把对象 key 当业务 ID。
- `colVisible/rowVisible/colWidth/rowHeight/colStyle/rowStyle` 都以保存的行列索引命中；对象 key 只是编辑器生成的存储 key。`pivotColumnWidth` 以维度路径定位，不能退化为当前可视列号。
- `theme.bodyStyle/headerStyle/rowHeaderStyle/cornerHeaderStyle` 分别控制正文、列表头、行头和角头；`enableFirstRowHeader/enableFirstColumnHeader` 会改变首行/首列语义，不能只当配色开关。
- `chartOptions` 的 key 约定为单元格位置（通常 `col_row`），其 `options` 是 PivotChart 单元格内图表 patch，不是独立 chart element。
- `resetEditorSpec` 是编辑命令/一次性重置意图；最终保存态不应依赖它持续生效。
- 原生 VTable spec 保存在 `originalOptions`；标准数据 ListTable 保存为数据驱动模板。二者的编辑能力不能互相假定。

## 3. Text

```ts
interface TextAttribute {
  text?: string|string[];
  textConfig?: unknown[];
  fill?: string; stroke?: string;
  characterBackground?: string;
  fontFamily?: string; fontSize?: number; fontWeight?: string; fontStyle?: string;
  underline?: number; characterLineWidth?: number;
  characterTextAlign?: "start"|"center"|"end";
  textAlign?: "left"|"center"|"right";
  textBaseline?: "top"|"middle"|"bottom";
  lineHeight?: number|string; whiteSpace?: "normal"|"no-wrap";
  maxLineWidth?: number;
  scaleX?: number; scaleY?: number;
  x?: number; y?: number; width?: number; height?: number;
  background?: string|null;
  zIndex?: number;
}
```

`textConfig` 存在时 `text` 不生效。元素位置仍由外层 `rect` 管理；attribute 中的 x/y/width/height 是渲染文字属性，编辑已有状态时保留，不应为了移动元素同时随意改两套坐标。

## 4. Rect、Oval、Diamond、Callout、Image、SVG

保存态统一为：

```ts
interface GraphicAttribute {
  type: "rect"|"oval"|"diamond"|"callout"|"image"|"svg";
  graphic: {
    angle?:number; cornerRadius?:number;
    fill?:string; fillOpacity?:number; stroke?:string; strokeOpacity?:number;
    lineWidth?:number; lineDash?:number[];
    width?:number; height?:number; x?:number; y?:number;
    image?:string; anchor?:[number,number]; padding?:number;
    shapePoints?:{x:number;y:number}[];
    svgFill?:string|null; svgStroke?:string|null;
    texture?:string|null; textureColor?:string|null;
    textureSize?:number|null; texturePadding?:number|null;
    colorConfigurable?:boolean;
  };
  text: TextAttribute & {
    graphicAlign?:"left"|"center"|"right";
    graphicBaseline?:"top"|"middle"|"bottom";
  };
  zIndex?:number;
  isResized?:boolean;
}
```

- `attribute.type` 应与 element `type` 一致；切换图形类型是编辑命令，保存后两处都使用目标类型。
- image/SVG 的 `graphic.image` 是视觉资源 URL，不是 live data source，不参与图表自动同步。
- 只有 `colorConfigurable:true` 的 SVG 才保证 `svgFill/svgStroke` 改色有效。
- callout/diamond 等几何内部点由运行时维护；没有可靠 fixture 时不要自行生成 `shapePoints`。

### 4.1 画布图形选择准则

画布元素按视觉语义选择，不能因为都含文字或都靠近数据就统一写成 `callout` 或 `marker`。

| 对象 | 元素类型 | 用途 |
| --- | --- | --- |
| 无容器的文字 | `text` | 标题、注释、固定说明 |
| 矩形/圆角框 | `rect` | 标签底、框选、区域强调 |
| 椭圆/圆形 | `oval` | 徽章、圆形强调 |
| 菱形 | `diamond` | 菱形决策节点或几何强调 |
| 带尾巴气泡 | `callout` | 指向性说明与对话框 |
| 直线/折线/曲线 | `straightLine` / `elbowLine` / `curveLine` | 固定版式的连线、箭头和引线 |
| 图片/图标 | `image` / `svg` | 品牌、图例外素材或其他非数据视觉资源 |
| 跟随数据对象的说明 | `marker.markPoint` | 图表内的 datum 锚定标注，不属于画布元素 |

选择时先问“对象是否必须随 datum 重排或刷新而移动”：是则使用 `marker.markPoint` + `target`；否则按外观和版式选择画布 element，并显式写 `position` 与 `zIndex`。连接两个画布对象时，用第 5 节的 line element；不要把固定画布连线伪造为 datum marker。

### 4.2 `callout` 与图表点标注的边界

`callout` 是独立画布图形，适合参考图中带气泡轮廓和尾巴的文字框。它和图表不共享数据 target，位置由自身 `position`、文字、`graphic` 样式与 `zIndex` 决定；生成 commonOption 时写 `type:"callout"`、明确 `position`，并在 `options` 内重复 `type:"callout"`。默认尾巴在左下，不能据此认为它已指向数据。

尾巴调整使用 `graphic.shapePoints[0]`：`x/y` 是相对于 callout 自身宽高的归一化尖端坐标，允许落在 `0..1` 之外。先根据渲染后的图元位置确定目标方向，再将尖端放在对应一侧，例如目标在右下方时通常为 `x > 1, y > 1`。无边框气泡必须显式写 `lineWidth: 0`：路径默认描边宽度为 4，即使 stroke 与 fill 同色也会钝化很窄的尾端。该配置是固定画布锚点，不会随 datum 自动移动；需要随数据刷新保持锚定时，改用 `marker.markPoint` + `target`，或在数据更新后重新布局并更新 callout。

```json
{
  "id": "capacity-callout-2028",
  "type": "callout",
  "position": { "x": 360, "y": 170, "width": 150, "height": 92 },
  "options": {
    "type": "callout",
    "graphic": { "fill": "#21B4E8", "lineWidth": 0, "shapePoints": [{ "x": 1.12, "y": 1.34 }] },
    "text": { "text": "+196K", "fill": "#FFFFFF", "fontSize": 20, "textAlign": "center", "textBaseline": "middle" },
    "zIndex": 10
  }
}
```

`marker.markPoint` 是图表内、以业务 `target` 跟随数据对象的说明，适合“给 Q4 柱/China 点加注释”；它不会生成画布气泡轮廓，也不能替代图片中的 callout。没有数据锚点、须随画布排版的气泡框不得降级为 `mark-point`。反过来，要求随数据刷新仍指向某个 datum 的说明不得用固定坐标 callout 冒充。

## 5. StraightLine、ElbowLine、CurveLine

```ts
interface LineAttribute {
  type:"straightLine"|"elbowLine"|"curveLine";
  line?:{stroke?:string;lineWidth?:number;strokeOpacity?:number;lineDash?:number[];maxCurveSize?:number};
  text:{isInitialized?:boolean;positionRatio?:number;[key:string]:unknown};
  startSymbol:{originSymbolType:string;size?:number;fill?:string;stroke?:string;lineWidth?:number};
  endSymbol:{originSymbolType:string;size?:number;fill?:string;stroke?:string;lineWidth?:number};
  startPoint:{x:number;y:number}; endPoint:{x:number;y:number};
  startConnect:{target:string|number;ratio:number}|null;
  endConnect:{target:string|number;ratio:number}|null;
  controlPoints:{x:number;y:number}[];
  zIndex?:number;
}
```

- `startConnect/endConnect.target` 引用画布 element ID；复制、删除或替换目标元素时必须重写或清空。
- 普通线即使是竖线或横线，`commonOption.elements[].position` 的 `width` 和 `height` 也都必须大于 0；线的方向由 `startPoint/endPoint` 表达，不能把外层矩形的某一边设为 0。交付完整画布前运行 commonOption 结构校验，失败时修正后再交付。
- `ratio` 是目标边界上的运行时连接比例，不是数据坐标。
- `maxCurveSize` 仅 elbowLine 生效；curveLine 的 controlPoints 由当前几何决定。无法取得布局时，优先创建不连接的直线，不猜控制点。

## 6. ChartConnectorLine

它连接两张图表中的两个数据图元，与普通画布线不同。首次创建使用 [语义连接器 target](semantic-chart-connectors.md)，将两图和连接器一次生成；运行时取得真实锚点，模型不生成 datum 或 points。

以下仅用于已有手动配置的兼容编辑，不是首次生成格式：

```ts
interface ChartConnectorLineAttribute {
  points:[Point,Point,Point];
  data:[{
    chartId:string;
    data:Record<string,unknown>;
    position:string;
    type:"bar"|"waterfall"|"line"|"area"|"radar"|"scatter"|"funnel"|"pie"|"rose";
  }, /* 同结构 */];
  style:{lineStyle?:object;startSymbol?:object;endSymbol?:object};
  lineType:"line"|"hv"|"vh"|string;
  zIndex?:number;
}
```

上面的 `data + points` 是已有手动配置的兼容结构；实际 datum 由运行时取得。转换成功后，图表更新、转置、移动与删除继续走既有手动连接器逻辑，target 不持续接管端点。

## 7. 生成与编辑边界

- 从零创建 chart/table/text/basic graphic 可用 `commonOption`，让运行时生成 element ID 和缺省属性。
- 从零创建普通 line 的连接关系，必须有稳定目标 element ID；chartConnectorLine 使用语义 target 引用同画布 chart ID，内部等待图元就绪后创建，不要求模型先物化。
- 编辑已有元素只深合并目标 attribute，保留未知兼容字段、连接引用、group 和 zIndex。
- Skill 不承诺任意插件 element type；未知 type 只可原样透传，不根据 `[key:string]:any` 发明结构。
