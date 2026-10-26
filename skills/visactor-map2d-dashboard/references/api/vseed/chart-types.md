# chart-types

[API 索引](index.md)

- [Area](chart-types.md#area)
- [AreaPercent](chart-types.md#areapercent)
- [Bar](chart-types.md#bar)
- [BarParallel](chart-types.md#barparallel)
- [BarPercent](chart-types.md#barpercent)
- [BoxPlot](chart-types.md#boxplot)
- [CirclePacking](chart-types.md#circlepacking)
- [Column](chart-types.md#column)
- [ColumnParallel](chart-types.md#columnparallel)
- [ColumnPercent](chart-types.md#columnpercent)
- [Donut](chart-types.md#donut)
- [DualAxis](chart-types.md#dualaxis)
- [Funnel](chart-types.md#funnel)
- [Heatmap](chart-types.md#heatmap)
- [HierarchySankey](chart-types.md#hierarchysankey)
- [Histogram](chart-types.md#histogram)
- [Line](chart-types.md#line)
- [Pie](chart-types.md#pie)
- [PivotTable](chart-types.md#pivottable)
- [RaceBar](chart-types.md#racebar)
- [RaceColumn](chart-types.md#racecolumn)
- [RaceDonut](chart-types.md#racedonut)
- [RaceLine](chart-types.md#raceline)
- [RacePie](chart-types.md#racepie)
- [RaceScatter](chart-types.md#racescatter)
- [Radar](chart-types.md#radar)
- [Rose](chart-types.md#rose)
- [RoseParallel](chart-types.md#roseparallel)
- [Sankey](chart-types.md#sankey)
- [Scatter](chart-types.md#scatter)
- [Sunburst](chart-types.md#sunburst)
- [Table](chart-types.md#table)
- [TreeMap](chart-types.md#treemap)

类型引用沿用源码模块名，包的公开导出以索引为准：

```typescript
import type { Animation } from '../../properties/config/animation'
import type {
  AnnotationArea,
  AnnotationDifferenceLine,
  AnnotationHorizontalLine,
  AnnotationPoint,
  AnnotationVerticalLine,
  AreaStyle,
  BackgroundColor,
  Brush,
  Color,
  Dataset,
  Label,
  Legend,
  LineStyle,
  PointStyle,
  Theme,
  Tooltip,
  XBandAxis,
  YLinearAxis,
  CrosshairLine,
  Sort,
  SortLegend,
  DimensionLinkage,
  ColumnDimension,
  ColumnMeasure,
  Page,
  RegionPadding,
  LineAreaAnimation,
} from '../../properties'
import type {
  AnnotationArea,
  AnnotationDifferenceLine,
  AnnotationHorizontalLine,
  AnnotationPoint,
  AnnotationVerticalLine,
  BackgroundColor,
  Brush,
  BarStyle,
  Color,
  CrosshairRect,
  Dataset,
  Label,
  Legend,
  CornerRadius,
  StackCornerRadius,
  Theme,
  Tooltip,
  XBandAxis,
  YLinearAxis,
  Sort,
  SortLegend,
  BarMaxWidth,
  PolynomialRegressionLine,
  DimensionLinkage,
  ColumnMeasure,
  ColumnDimension,
  Page,
  RegionPadding,
  BarLikeAnimation,
} from '../../properties'
import type {
  AnnotationArea,
  AnnotationDifferenceLine,
  AnnotationHorizontalLine,
  AnnotationPoint,
  AnnotationVerticalLine,
  BackgroundColor,
  Brush,
  BarStyle,
  Color,
  CrosshairRect,
  Dataset,
  Label,
  Legend,
  CornerRadius,
  StackCornerRadius,
  Theme,
  Tooltip,
  XBandAxis,
  YLinearAxis,
  SortLegend,
  Sort,
  BarMaxWidth,
  BarGapInGroup,
  DimensionLinkage,
  ColumnMeasure,
  ColumnDimension,
  Page,
  RegionPadding,
  BarLikeAnimation,
} from '../../properties'
import type {
  AnnotationArea,
  AnnotationDifferenceLine,
  AnnotationHorizontalLine,
  AnnotationPoint,
  AnnotationVerticalLine,
  BackgroundColor,
  Brush,
  BarStyle,
  Color,
  CrosshairRect,
  Dataset,
  Label,
  Legend,
  CornerRadius,
  StackCornerRadius,
  Theme,
  Tooltip,
  XLinearAxis,
  YBandAxis,
  Sort,
  SortLegend,
  BarMaxWidth,
  BarGapInGroup,
  DimensionLinkage,
  BarDimension,
  BarMeasure,
  Page,
  RegionPadding,
  BarLikeAnimation,
} from '../../properties'
import type {
  AnnotationArea,
  AnnotationDifferenceLine,
  AnnotationHorizontalLine,
  AnnotationPoint,
  AnnotationVerticalLine,
  BackgroundColor,
  Brush,
  Color,
  Dataset,
  Label,
  Legend,
  Page,
  LineStyle,
  PointStyle,
  Theme,
  Tooltip,
  CrosshairLine,
  XBandAxis,
  YLinearAxis,
  Sort,
  SortLegend,
  DimensionLinkage,
  LineMeasure,
  LineDimension,
  RegionPadding,
  LineAreaAnimation,
} from '../../properties'
import type {
  AnnotationArea,
  AnnotationHorizontalLine,
  AnnotationPoint,
  AnnotationVerticalLine,
  AreaStyle,
  BackgroundColor,
  Brush,
  BarGapInGroup,
  BarMaxWidth,
  BarStyle,
  Color,
  CrosshairRect,
  CornerRadius,
  StackCornerRadius,
  Dataset,
  DimensionLinkage,
  DualAxisDimension,
  DualAxisMeasure,
  Label,
  Legend,
  Page,
  LineStyle,
  PointStyle,
  Sort,
  SortLegend,
  Theme,
  Tooltip,
  XBandAxis,
  YLinearAxis,
} from '../../properties'
import type {
  AnnotationArea,
  AnnotationHorizontalLine,
  AnnotationPoint,
  AnnotationVerticalLine,
  AreaStyle,
  BackgroundColor,
  Brush,
  Color,
  Dataset,
  Label,
  Legend,
  LineStyle,
  PointStyle,
  Theme,
  Tooltip,
  XBandAxis,
  YLinearAxis,
  CrosshairLine,
  Sort,
  SortLegend,
  DimensionLinkage,
  ColumnDimension,
  ColumnMeasure,
  Page,
  RegionPadding,
  LineAreaAnimation,
} from '../../properties'
import type {
  AnnotationArea,
  AnnotationHorizontalLine,
  AnnotationPoint,
  AnnotationVerticalLine,
  BackgroundColor,
  Brush,
  BarStyle,
  Color,
  CrosshairRect,
  Dataset,
  HistogramDimension,
  Label,
  Legend,
  Page,
  CornerRadius,
  StackCornerRadius,
  Theme,
  Tooltip,
  YLinearAxis,
  HistogramMeasure,
  XLinearAxis,
  KdeRegressionLine,
  EcdfRegressionLine,
  DimensionLinkage,
} from '../../properties'
import type {
  AnnotationArea,
  AnnotationHorizontalLine,
  AnnotationPoint,
  AnnotationVerticalLine,
  BackgroundColor,
  Brush,
  BarStyle,
  Color,
  CrosshairRect,
  Dataset,
  Label,
  Legend,
  CornerRadius,
  StackCornerRadius,
  Theme,
  Tooltip,
  XBandAxis,
  YLinearAxis,
  Sort,
  SortLegend,
  BarMaxWidth,
  DimensionLinkage,
  ColumnMeasure,
  ColumnDimension,
  Page,
  RegionPadding,
  BarLikeAnimation,
} from '../../properties'
import type {
  AnnotationArea,
  AnnotationHorizontalLine,
  AnnotationPoint,
  AnnotationVerticalLine,
  BackgroundColor,
  Brush,
  BarStyle,
  Color,
  CrosshairRect,
  Dataset,
  Label,
  Legend,
  CornerRadius,
  StackCornerRadius,
  Theme,
  Tooltip,
  XLinearAxis,
  YBandAxis,
  Sort,
  SortLegend,
  BarMaxWidth,
  DimensionLinkage,
  BarDimension,
  BarMeasure,
  Page,
  RegionPadding,
  BarLikeAnimation,
} from '../../properties'
import type {
  AnnotationArea,
  AnnotationHorizontalLine,
  AnnotationPoint,
  AnnotationVerticalLine,
  BackgroundColor,
  Brush,
  BoxPlotDimension,
  BoxPlotMeasure,
  BoxPlotStyle,
  Color,
  CrosshairRect,
  Dataset,
  DimensionLinkage,
  Label,
  Legend,
  OutlierStyle,
  Sort,
  SortLegend,
  Theme,
  Tooltip,
  WhiskersConfig,
  XBandAxis,
  YLinearAxis,
  Page,
} from '../../properties'
import type {
  AnnotationArea,
  AnnotationHorizontalLine,
  AnnotationPoint,
  AnnotationVerticalLine,
  BackgroundColor,
  Brush,
  Color,
  Dataset,
  Label,
  Legend,
  Page,
  LineStyle,
  PointStyle,
  Theme,
  Tooltip,
  CrosshairLine,
  XBandAxis,
  YLinearAxis,
  Sort,
  SortLegend,
  DimensionLinkage,
  Player,
  LineDimension,
  LineMeasure,
} from '../../properties'
import type {
  AnnotationArea,
  AnnotationHorizontalLine,
  AnnotationPoint,
  AnnotationVerticalLine,
  BackgroundColor,
  Brush,
  Color,
  Dataset,
  Label,
  Legend,
  ScatterDimension,
  ScatterMeasure,
  PointStyle,
  Theme,
  Tooltip,
  CrosshairLine,
  YLinearAxis,
  XLinearAxis,
  LinearRegressionLine,
  LowessRegressionLine,
  PolynomialRegressionLine,
  LogisticRegressionLine,
  DimensionLinkage,
  Page,
  ScatterAnimation,
} from '../../properties'
import type {
  BackgroundColor,
  Color,
  ColorLegend,
  Dataset,
  Label,
  Page,
  FunnelDimension,
  FunnelMeasure,
  Theme,
  Tooltip,
} from '../../properties'
import type {
  BackgroundColor,
  Color,
  Dataset,
  DonutDimension,
  Legend,
  DonutMeasure,
  PieLabel,
  Theme,
  Tooltip,
  Page,
  PieLikeAnimation,
  PieStyle,
  CenterText,
} from '../../properties'
import type {
  BackgroundColor,
  Color,
  Dataset,
  HierarchyDimension,
  HierarchyMeasure,
  Label,
  Legend,
  Page,
  Theme,
  Tooltip,
} from '../../properties'
import type {
  BackgroundColor,
  Color,
  Dataset,
  HierarchyDimension,
  HierarchyMeasure,
  Label,
  Page,
  Theme,
  Tooltip,
} from '../../properties'
import type { BackgroundColor, Color, Dataset, HierarchyDimension, Label, Page, Theme, Tooltip } from '../../properties'
import type {
  BackgroundColor,
  Color,
  Dataset,
  Label,
  Legend,
  Theme,
  Tooltip,
  Page,
  AreaStyle,
  LineStyle,
  PointStyle,
  RadarDimension,
  RadarMeasure,
  RadarAnimation,
} from '../../properties'
import type {
  BackgroundColor,
  Color,
  Dataset,
  Legend,
  DonutMeasure,
  PieLabel,
  Theme,
  Tooltip,
  Page,
  Player,
  RaceDonutDimension,
} from '../../properties'
import type {
  BackgroundColor,
  Color,
  Dataset,
  Legend,
  PieMeasure,
  PieLabel,
  Theme,
  Tooltip,
  Page,
  Player,
  RacePieDimension,
} from '../../properties'
import type {
  BackgroundColor,
  Color,
  Dataset,
  PieDimension,
  Legend,
  PieMeasure,
  PieLabel,
  Theme,
  Tooltip,
  Page,
  PieLikeAnimation,
  PieStyle,
} from '../../properties'
import type {
  BackgroundColor,
  Color,
  Dataset,
  SankeyDimension,
  SankeyMeasure,
  Label,
  Legend,
  Page,
  Theme,
  Tooltip,
} from '../../properties'
import type {
  BarDimension,
  BarLikeAnimation,
  BarMaxWidth,
  BarMeasure,
  DimensionLinkage,
  RegionPadding,
  Sort,
  SortLegend,
} from '../../properties'
import type {
  BarMaxWidth,
  RaceColumnDimension,
  DimensionLinkage,
  Sort,
  SortLegend,
  Player,
  AnnotationArea,
  AnnotationHorizontalLine,
  AnnotationPoint,
  AnnotationVerticalLine,
  BackgroundColor,
  Brush,
  BarStyle,
  Color,
  CrosshairRect,
  Dataset,
  Label,
  Legend,
  CornerRadius,
  StackCornerRadius,
  Theme,
  Tooltip,
  Page,
  ColumnMeasure,
  XBandAxis,
  YLinearAxis,
} from '../../properties'
import type { BodyCellStyle, DimensionTree, MeasureTree, Page, TotalType } from '../../properties'
import type { BodyCellStyle, Page, TableDimension, TableMeasure, PivotTableTotals } from '../../properties'
import type { Brush } from '../../properties'
import type {
  Brush,
  RoseDimension,
  RoseMeasure,
  PieLabel,
  Page,
  BackgroundColor,
  Color,
  Dataset,
  Legend,
  Theme,
  Tooltip,
  PieLikeAnimation,
} from '../../properties'
import type {
  Color,
  ColorLegend,
  HeatmapDimension,
  HeatmapMeasure,
  BackgroundColor,
  Dataset,
  Label,
  Page,
  Theme,
  Tooltip,
} from '../../properties'
import type { HierarchyMeasure } from 'src/types/properties/measures/hierarchyMeasure'
import type { Locale } from '../../i18n'
import type {
  RaceBarDimension,
  BarMaxWidth,
  DimensionLinkage,
  Sort,
  SortLegend,
  Player,
  AnnotationArea,
  AnnotationHorizontalLine,
  AnnotationPoint,
  AnnotationVerticalLine,
  BackgroundColor,
  Brush,
  BarStyle,
  Color,
  CrosshairRect,
  Dataset,
  Label,
  Legend,
  CornerRadius,
  StackCornerRadius,
  Theme,
  Tooltip,
  XLinearAxis,
  YBandAxis,
  Page,
  RaceBarMeasure,
} from '../../properties'
import type {
  RoseParallelDimension,
  RoseParallelMeasure,
  PieLabel,
  Page,
  BackgroundColor,
  Color,
  Dataset,
  Legend,
  Theme,
  Tooltip,
  PieLikeAnimation,
} from '../../properties'
import type {
  ScatterMeasure,
  Player,
  Sort,
  AnnotationArea,
  AnnotationHorizontalLine,
  AnnotationPoint,
  AnnotationVerticalLine,
  BackgroundColor,
  Brush,
  Color,
  CrosshairLine,
  Dataset,
  Label,
  Legend,
  Page,
  PointStyle,
  Theme,
  Tooltip,
  XLinearAxis,
  YLinearAxis,
  RaceScatterDimension,
} from '../../properties'
import {
  type AnnotationArea,
  type AnnotationDifferenceLine,
  type AnnotationHorizontalLine,
  type AnnotationPoint,
  type AnnotationVerticalLine,
  type BackgroundColor,
  type Brush,
  type BarStyle,
  type Color,
  type CrosshairRect,
  type Dataset,
  type Label,
  type Legend,
  type CornerRadius,
  type StackCornerRadius,
  type Theme,
  type Tooltip,
  type XLinearAxis,
  type YBandAxis,
  type Page,
} from '../../properties'
import { type BackgroundColor, type Dataset, type Theme } from '../../properties'
import { type Locale } from '../../i18n'
```

## Area

源码：[packages/vseed/src/types/chartType/area/area.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/types/chartType/area/area.ts#L59)

包导出：`Area`

````typescript
/**
 * @recommend
 * - 推荐字段配置: `1`个指标, `2`个维度
 * - 支持数据重塑: 至少`1`个指标, `0`个维度
 * @encoding
 * 面积图支持以下视觉通道:
 * `xAxis`  : x轴通道, 支持`多个维度`, 按维度值映射至x轴
 * `yAxis`  : y轴通道, 支持`多个指标`, 按指标值映射至y轴
 * `color`  : 颜色通道, 支持`多个维度`或 `一个指标`, 维度颜色用于区分不同的数据系列, 指标颜色用于线性映射指标值到图形颜色
 * `tooltip`: 提示通道, 支持`多个维度`与 `多个指标`, 会在鼠标悬停在数据点上时展示
 * `label`  : 标签通道, 支持`多个维度`与 `多个指标`, 会在数据点上展示数据标签
 *
 * @description 面积图, 适用于展示数据随时间变化的趋势及累积关系, 通过填充区域增强数据对比. X轴为类目轴(分类数据), Y轴为数值轴(连续数据).
 * 适用场景:
 * - 展示单一数据系列的趋势变化
 * - 强调总量随时间的累积效果
 * - 对比多个数据系列的总量差异
 * @warning
 * 数据要求:
 * - 至少1个指标字段（度量）
 * - 第一个维度字段映射到X轴，其余维度字段会与指标名称(存在多个指标时)合并, 作为图例项展示.
 * - 所有指标会自动合并为一个指标
 * 默认开启的功能:
 * - 模块开启堆叠
 * - 默认开启图例、坐标轴、区域填充、数据标签、提示信息
 */
export interface Area {
  /**
   * 面积图
   * @description 面积图，展示数据趋势及累积关系的图表类型
   * @type {'area'}
   * @example
   * ```js {2}
   * {
   *   chartType: 'area',
   *   dataset: [{month:'1月', value:100}, {month:'2月', value:150}, {month:'3月', value:120}],
   * }
   * ```
   */
  chartType: 'area'
  /**
   * 数据集
   * @description 符合TidyData规范的且已经聚合的数据集，用于定义图表的数据来源和结构, 用户输入的数据集并不需要进行任何处理, VSeed带有强大的数据重塑功能, 会自行进行数据重塑, 面积图的数据最终会被转换为2个维度, 1个指标.
   * @type {Array<Record<string|number, any>>}
   * @example [{month:'1月', value:100}, {month:'2月', value:150}, {month:'3月', value:120}]
   */
  dataset: Dataset
  /**
   * 维度
   * @description 第一个维度被映射到X轴, 其余维度会与指标名称(存在多个指标时)合并, 作为图例项展示.
   * @example [{ id: 'month', alias: '月份' }, { id: 'year', alias: '年份' }]
   */
  dimensions?: ColumnDimension[]
  /**
   * 指标
   * @description 面积图的指标会自动合并为一个指标, 映射到Y轴, 指标名称会与其余维度合并, 作为图例项展示.
   * @example [{id: 'value', alias: '数值'}]
   */
  measures?: ColumnMeasure[]
  /**
   * 分页
   * @description 分页配置，用于配置图表的分页功能
   */
  page?: Page
  /**
   * 图表的背景颜色
   * @default transparent 默认为透明背景
   * @description 背景颜色可以是颜色字符串, 例如'red', 'blue', 也可以是hex, rgb或rgba'#ff0000', 'rgba(255,0,0,0.5)'
   */
  backgroundColor?: BackgroundColor
  /**
   * 颜色
   * @description 颜色配置, 用于定义图表的颜色方案, 包括颜色列表, 颜色映射, 颜色渐变等.
   */
  color?: Color
  /**
   * 标签
   * @description 标签配置, 用于定义图表的数据标签, 包括数据标签的位置, 格式, 样式等.
   */
  label?: Label
  /**
   * 图例
   * @description 图例配置, 用于定义图表的图例, 包括图例的位置, 格式, 样式等.
   */
  legend?: Legend
  /**
   * 绘图区内边距
   * @description 映射到 VChart 的 region[0].padding，用于为标注、标签等绘图区外扩元素预留空间。
   */
  regionPadding?: RegionPadding
  /**
   * 提示信息
   * @description 提示信息配置, 用于定义图表的提示信息, 包括提示信息的位置, 格式, 样式等.
   */
  tooltip?: Tooltip
  /**
   * 框选
   * @description 框选配置，用于开启/关闭 brush 框选能力
   */
  brush?: Brush
  /**
   * 动画配置
   * @description 图表动画配置，按图表类型约束可选效果
   */
  animation?: LineAreaAnimation
  /**
   * x轴
   * @description 类目轴, x轴配置, 用于定义图表的x轴, 包括x轴的位置, 格式, 样式等.
   */
  xAxis?: XBandAxis
  /**
   * y轴
   * @description 数值轴, y轴配置, 用于定义图表的y轴, 包括y轴的位置, 格式, 样式等.
   */
  yAxis?: YLinearAxis
  /**
   * 垂直提示线
   * @description  鼠标移动到图表上时, 显示的垂直提示线
   */
  crosshairLine?: CrosshairLine
  /**
   * @description X轴排序配置, 支持根据维度或指标排序, 以及自定义排序顺序
   * @example
   * sort: {
   *   orderBy: 'profit',
   *   order: 'asc',
   * }
   * sort: {
   *   customOrder:['2019', '2020', '2021']
   * }
   */
  sort?: Sort
  /**
   * @description 图例排序配置, 支持根据维度或指标排序, 以及自定义排序顺序
   * @example
   * sortLegend: {
   *   orderBy: 'profit',
   *   order: 'asc',
   * }
   * sortLegend: {
   *   customOrder:['2019', '2020', '2021']
   * }
   */
  sortLegend?: SortLegend
  /**
   * 图表的主题, 主题是优先级较低的功能配置, 包含所有图表类型共用的通用配置, 与单类图表类型共用的图表配置
   * @default light 默认为亮色主题
   * @description 内置light与dark两种主题, 用户可以通过Builder自定义主题
   * @example 'dark'
   * @example 'light'
   * @example 'customThemeName'
   */
  theme?: Theme
  /**
   * @description 点图元样式配置, 用于定义图表的点图元样式, 包括点图元的颜色, 边框等.
   * 支持全局样式或条件样式配置
   * 数据筛选器
   * 若配置selector, 提供数值 selector, 局部数据 selector, 条件维度 selector, 条件指标 selector 共四类数据匹配能力
   * 若未配置selector, 则样式全局生效.
   */
  pointStyle?: PointStyle | PointStyle[]
  /**
   * @description 线图元样式配置, 用于定义图表的线图元样式, 包括线图元的颜色, 透明度, 曲线等.
   * 支持全局样式或条件样式配置
   * 数据筛选器
   * 若配置selector, 提供数值 selector, 局部数据 selector, 条件维度 selector, 条件指标 selector 共四类数据匹配能力
   * 若未配置selector, 则样式全局生效.
   */
  lineStyle?: LineStyle | LineStyle[]
  /**
   * @description 面积图元样式配置, 用于定义图表的面积图元样式, 包括面积图元的颜色, 透明度, 边框等.
   * 支持全局样式或条件样式配置
   * 数据筛选器
   * 若配置selector, 提供数值 selector, 局部数据 selector, 条件维度 selector, 条件指标 selector 共四类数据匹配能力
   * 若未配置selector, 则样式全局生效.
   */
  areaStyle?: AreaStyle | AreaStyle[]
  /**
   * @description 标注点配置, 根据选择的数据, 定义图表的标注点, 包括标注点的位置, 格式, 样式等.
   */
  annotationPoint?: AnnotationPoint | AnnotationPoint[]
  /**
   * @description 维度值标注线，竖直方向展示，能够设置标注线的位置, 样式等
   */
  annotationVerticalLine?: AnnotationVerticalLine | AnnotationVerticalLine[]
  /**
   * @description 数值标注线(包括均值线、最大值线、最小值线等)，水平方向展示，能够设置标注线的位置, 样式等，如需绘制均值线等数值对应的标注线请使用该配置
   */
  annotationHorizontalLine?: AnnotationHorizontalLine | AnnotationHorizontalLine[]
  /**
   * 标注区域
   * @description 标注区域配置, 根据选择的数据, 定义图表的标注区域, 包括标注区域的位置, 样式等.
   */
  annotationArea?: AnnotationArea | AnnotationArea[]
  /**
   * 差异标注线
   * @description 根据两个选中的数据点，绘制差异标注线并自动计算差异文本。
   */
  annotationDifferenceLine?: AnnotationDifferenceLine | AnnotationDifferenceLine[]
  /**
   * @description 当图表开启透视功能或者指标组合的是否，是否开启维度联动功能
   * 当hover 到某个维度值时，联动高亮其他图表中相同维度值的数据
   */
  dimensionLinkage?: DimensionLinkage
  /**
   * 语言
   * @description 图表语言配置, 支持'zh-CN'与'en-US'两种语言, 另外可以调用 intl.setLocale('zh-CN') 方法设置语言
   * @default 'zh-CN'
   */
  locale?: Locale
}
````

## AreaPercent

源码：[packages/vseed/src/types/chartType/areaPercent/areaPercent.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/types/chartType/areaPercent/areaPercent.ts#L56)

包导出：`AreaPercent`

```typescript
/**
 * @description 百分比面积图，适用于展示多类别占比随时间变化的趋势，Y轴以百分比形式展示占比关系
 * 适用场景:
 * - 时间序列的构成变化分析
 * - 多类别占比趋势对比
 * - 累积占比与单一类别占比同时展示
 * @encoding
 * 百分比面积图支持以下视觉通道:
 * `xAxis`  : x轴通道, 支持`多个维度`, 按维度值映射至x轴
 * `yAxis`  : y轴通道, 支持`多个指标`, 按指标值映射至y轴
 * `color`  : 颜色通道, 支持`多个维度`或 `一个指标`, 维度颜色用于区分不同的数据系列, 指标颜色用于线性映射指标值到图形颜色
 * `tooltip`: 提示通道, 支持`多个维度`与 `多个指标`, 会在鼠标悬停在数据点上时展示
 * `label`  : 标签通道, 支持`多个维度`与 `多个指标`, 会在数据点上展示数据标签
 * @warning
 * 数据要求:
 * - 至少1个指标字段（度量）
 * - 第一个维度会放至Y轴, 其余维度会与指标名称(存在多个指标时)合并, 作为图例项展示.
 * - 所有指标会自动合并为一个指标
 * 默认开启的功能:
 * - 默认开启图例、坐标轴、百分比标签、提示信息、占比计算
 * @recommend
 * - 推荐字段配置: `1`个指标, `2`个维度
 * - 支持数据重塑: 至少`1`个指标, `0`个维度
 */
export interface AreaPercent {
  /**
   * 百分比面积图
   * @description 百分比面积图，以百分比形式展示多类别占比随某个维度的变化
   * @type {'areaPercent'}
   * @example 'areaPercent'
   */
  chartType: 'areaPercent'
  /**
   * 数据集
   * @description 符合TidyData规范的且已经聚合的数据集，用于定义图表的数据来源和结构, 用户输入的数据集并不需要进行任何处理, VSeed带有强大的数据重塑功能, 会自行进行数据重塑, 百分比面积图的数据最终会被转换为2个维度, 1个指标.
   * @type {Array<Record<string|number, any>>}
   * @example [{month:'1月', category:'A', value:30}, {month:'1月', category:'B', value:70}]
   */
  dataset: Dataset
  /**
   * 维度
   * @description 第一个维度被映射到X轴, 其余维度会与指标名称(存在多个指标时)合并, 作为图例项展示.
   * @example [{ id: 'month', alias: '月份' }, { id: 'year', alias: '年份' }]
   */
  dimensions?: ColumnDimension[]
  /**
   * 指标
   * @description 百分比面积图的指标会自动合并为一个指标, 映射到Y轴, 指标名称会与其余维度合并, 作为图例项展示.
   * @example [{id: 'value', alias: '数值占比', format: 'percent'}]
   */
  measures?: ColumnMeasure[]
  /**
   * 分页
   * @description 分页配置，用于配置图表的分页功能
   */
  page?: Page
  /**
   * 图表的背景颜色
   * @default transparent 默认为透明背景
   * @description 背景颜色可以是颜色字符串, 例如'red', 'blue', 也可以是hex, rgb或rgba'#ff0000', 'rgba(255,0,0,0.5)'
   */
  backgroundColor?: BackgroundColor
  /**
   * 颜色
   * @description 颜色配置, 用于定义图表的颜色方案, 包括颜色列表, 颜色映射, 颜色渐变等.
   */
  color?: Color
  /**
   * 标签
   * @description 标签配置, 用于定义图表的数据标签, 包括数据标签的位置, 格式, 样式等.
   */
  label?: Label
  /**
   * 图例
   * @description 图例配置, 用于定义图表的图例, 包括图例的位置, 格式, 样式等.
   */
  legend?: Legend
  /**
   * 绘图区内边距
   * @description 映射到 VChart 的 region[0].padding，用于为标注、标签等绘图区外扩元素预留空间。
   */
  regionPadding?: RegionPadding
  /**
   * 提示信息
   * @description 提示信息配置, 用于定义图表的提示信息, 包括提示信息的位置, 格式, 样式等.
   */
  tooltip?: Tooltip
  /**
   * 框选
   * @description 框选配置，用于开启/关闭 brush 框选能力
   */
  brush?: Brush
  /**
   * 动画配置
   * @description 图表动画配置，按图表类型约束可选效果
   */
  animation?: LineAreaAnimation
  /**
   * x轴
   * @description 类目轴, x轴配置, 用于定义图表的x轴, 包括x轴的位置, 格式, 样式等.
   */
  xAxis?: XBandAxis
  /**
   * y轴
   * @description 数值轴, y轴配置, 用于定义图表的y轴, 包括y轴的位置, 格式, 样式等.
   */
  yAxis?: YLinearAxis
  /**
   * 垂直提示线
   * @description  鼠标移动到图表上时, 显示的垂直提示线
   */
  crosshairLine?: CrosshairLine
  /**
   * @description X轴排序配置, 支持根据维度或指标排序, 以及自定义排序顺序
   * @example
   * sort: {
   *   orderBy: 'profit',
   *   order: 'asc',
   * }
   * sort: {
   *   customOrder:['2019', '2020', '2021']
   * }
   */
  sort?: Sort
  /**
   * @description 图例排序配置, 支持根据维度或指标排序, 以及自定义排序顺序
   * @example
   * sortLegend: {
   *   orderBy: 'profit',
   *   order: 'asc',
   * }
   * sortLegend: {
   *   customOrder:['2019', '2020', '2021']
   * }
   */
  sortLegend?: SortLegend
  /**
   * 图表的主题, 主题是优先级较低的功能配置, 包含所有图表类型共用的通用配置, 与单类图表类型共用的图表配置
   * @default light 默认为亮色主题
   * @description 内置light与dark两种主题, 用户可以通过Builder自定义主题
   * @example 'dark'
   * @example 'light'
   * @example 'customThemeName'
   */
  theme?: Theme
  /**
   * 点图元样式
   * @description 点图元样式配置, 用于定义图表的点图元样式, 包括点图元的颜色, 边框等.
   * 支持全局样式或条件样式配置
   * 数据筛选器
   * 若配置selector, 提供数值 selector, 局部数据 selector, 条件维度 selector, 条件指标 selector 共四类数据匹配能力
   * 若未配置selector, 则样式全局生效.
   */
  pointStyle?: PointStyle | PointStyle[]
  /**
   * 线图元样式
   * @description 线图元样式配置, 用于定义图表的线图元样式, 包括线图元的颜色, 透明度, 曲线等.
   * 支持全局样式或条件样式配置
   * 数据筛选器
   * 若配置selector, 提供数值 selector, 局部数据 selector, 条件维度 selector, 条件指标 selector 共四类数据匹配能力
   * 若未配置selector, 则样式全局生效.
   */
  lineStyle?: LineStyle | LineStyle[]
  /**
   * 面积图元样式
   * @description 面积图元样式配置, 用于定义图表的面积图元样式, 包括面积图元的颜色, 透明度, 边框等.
   * 支持全局样式或条件样式配置
   * 数据筛选器
   * 若配置selector, 提供数值 selector, 局部数据 selector, 条件维度 selector, 条件指标 selector 共四类数据匹配能力
   * 若未配置selector, 则样式全局生效.
   */
  areaStyle?: AreaStyle | AreaStyle[]
  /**
   * 标注点
   * @description 标注点配置, 根据选择的数据, 定义图表的标注点, 包括标注点的位置, 格式, 样式等.
   */
  annotationPoint?: AnnotationPoint | AnnotationPoint[]
  /**
   * @description 维度值标注线，竖直方向展示，能够设置标注线的位置, 样式等
   */
  annotationVerticalLine?: AnnotationVerticalLine | AnnotationVerticalLine[]
  /**
   * @description 数值标注线(包括均值线、最大值线、最小值线等)，水平方向展示，能够设置标注线的位置, 样式等，如需绘制均值线等数值对应的标注线请使用该配置
   */
  annotationHorizontalLine?: AnnotationHorizontalLine | AnnotationHorizontalLine[]
  /**
   * 标注区域
   * @description 标注区域配置, 根据选择的数据, 定义图表的标注区域, 包括标注区域的位置, 样式等.
   */
  annotationArea?: AnnotationArea | AnnotationArea[]
  /**
   * @description 当图表开启透视功能或者指标组合的是否，是否开启维度联动功能
   * 当hover 到某个维度值时，联动高亮其他图表中相同维度值的数据
   */
  dimensionLinkage?: DimensionLinkage
  /**
   * 语言
   * @description 图表语言配置, 支持'zh-CN'与'en-US'两种语言, 另外可以调用 intl.setLocale('zh-CN') 方法设置语言
   * @default 'zh-CN'
   */
  locale?: Locale
}
```

## Bar

源码：[packages/vseed/src/types/chartType/bar/bar.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/types/chartType/bar/bar.ts#L61)

包导出：`Bar`

```typescript
/**
 * @description 条形图，适用于横向数据对比场景，Y轴为类目轴（分类数据），X轴为数值轴（连续数据），柱子横向排列
 * 适用场景:
 * - 数据项名称较长时
 * - 需要展示数据排名对比
 * - 展示正负双向数据
 * @encoding
 * 条形图支持以下视觉通道:
 * `yAxis`  : y轴通道, 支持`多个维度`, 按维度值映射至y轴
 * `xAxis`  : x轴通道, 支持`多个指标`, 按指标值映射至x轴
 * `detail` : 细分通道, 支持`多个维度`, 在同一个颜色系列下展示更细粒度的数据时使用
 * `color`  : 颜色通道, 支持`多个维度`或 `一个指标`, 维度颜色用于区分不同的数据系列, 指标颜色用于线性映射指标值到图形颜色
 * `tooltip`: 提示通道, 支持`多个维度`与 `多个指标`, 会在鼠标悬停在数据点上时展示
 * `label`  : 标签通道, 支持`多个维度`与 `多个指标`, 会在数据点上展示数据标签
 * @warning
 * 数据要求:
 * - 至少1个指标（度量）
 * - 第一个维度会放至Y轴, 其余维度会与指标名称(存在多个指标时)合并, 作为图例项展示.
 * - 所有指标会自动合并为一个指标
 * 默认开启的功能:
 * - 默认开启图例、坐标轴、数据标签、提示信息
 * @recommend
 * - 推荐字段配置: `1`个指标, `2`个维度
 * - 支持数据重塑: 至少`1`个指标, `0`个维度
 */
export interface Bar {
  /**
   * @description 条形图，适用于横向数据对比场景，Y轴为类目轴（分类数据），X轴为数值轴（连续数据），柱子横向排列
   * @type {'bar'}
   * @example 'bar'
   */
  chartType: 'bar'
  /**
   * @description 数据源, 符合TidyData规范的且已经聚合的数据集，用于定义图表的数据来源和结构, 用户输入的数据集并不需要进行任何处理, VSeed带有强大的数据重塑功能, 会自行进行数据重塑, 条形图的数据最终会被转换为2个维度, 1个指标.
   * @type {Array<Record<string|number, any>>}
   * @example [{date:'2020-01-01', value:100}, {date:'2020-01-02', value:200}]
   */
  dataset: Dataset
  /**
   * @description 维度, 第一个维度被映射到Y轴, 其余维度会与指标名称(存在多个指标时)合并, 作为图例项展示.
   * @example [{id: "date", alias: "日期"}, {id: "value", alias: "数值"}]
   */
  dimensions?: BarDimension[]
  /**
   * 指标
   * @description 指标, 条形图指标会自动合并为一个指标, 映射到X轴, 存在多个指标时, 指标名称会与其余维度合并, 作为图例项展示.
   * @example [{id: "value", alias: "数值"}]
   */
  measures?: BarMeasure[]
  /**
   * 分页
   * @description 分页配置，用于配置图表的分页功能
   */
  page?: Page
  /**
   * @description 图表的背景颜色, 默认为透明背景, 背景颜色可以是颜色字符串, 例如'red', 'blue', 也可以是hex, rgb或rgba'#ff0000', 'rgba(255,0,0,0.5)'
   */
  backgroundColor?: BackgroundColor
  /**
   * 颜色
   * @description 颜色配置, 用于定义图表的颜色方案, 包括颜色列表, 颜色映射, 颜色渐变等.
   */
  color?: Color
  /**
   * @description 标签配置, 用于定义图表的数据标签, 包括数据标签的位置, 格式, 样式等.
   */
  label?: Label
  /**
   * @description 图例配置, 用于定义图表的图例, 包括图例的位置, 格式, 样式等.
   */
  legend?: Legend
  /**
   * 绘图区内边距
   * @description 映射到 VChart 的 region[0].padding，用于为标注、标签等绘图区外扩元素预留空间。
   */
  regionPadding?: RegionPadding
  /**
   * @description 提示信息配置, 用于定义图表的提示信息, 包括提示信息的位置, 格式, 样式等.
   */
  tooltip?: Tooltip
  /**
   * 框选
   * @description 框选配置，用于开启/关闭 brush 框选能力
   */
  brush?: Brush
  /**
   * 动画配置
   * @description 图表动画配置，按图表类型约束可选效果
   */
  animation?: BarLikeAnimation
  /**
   * @description x轴, 数值轴, x轴配置, 用于定义图表的x轴, 包括x轴的位置, 格式, 样式等.
   */
  xAxis?: XLinearAxis
  /**
   * @description y轴, 类目轴, y轴配置, 用于定义图表的y轴, 包括y轴的位置, 格式, 样式等.
   */
  yAxis?: YBandAxis
  /**
   * @description 水平提示框配置, 用于定义图表的水平提示框, 包括水平提示框的颜色、标签样式等.
   */
  crosshairRect?: CrosshairRect
  /**
   * @description 柱图圆角的数值或数组，默认 0，不启用圆角。当 stackCornerRadius 为 false 时，每个图元独立绘制圆角；为 true 时，通过 clip 裁剪整组堆叠柱体。数值设置所有角，数组按左上、右上、右下、左下排列，数据为负值时圆角方向自动翻转。设为 0 可关闭。barStyle.barRadius 可覆盖单个图元的圆角；stackCornerRadius 为 true 时，整组圆角统一使用 cornerRadius，不受 barStyle.barRadius 影响。
   * @default 0
   * @example [4, 4, 0, 0]
   */
  cornerRadius?: CornerRadius
  /**
   * @description 是否使用整组堆叠圆角，默认 false。设为 true 时，通过 clip 裁剪整组柱体，圆角值统一读取 cornerRadius，保留堆叠内部的直角连接，并优先于 barStyle.barRadius（包括条件样式）。设为 false 时，cornerRadius 对每个图元单独生效。注意：开启 stackCornerRadius 会引起更新动画重叠的 bug，整组 clip 裁剪路径与图元更新动画不同步，依赖 VChart 修复；需要平滑更新动画时建议保持 false。
   * @default false
   * @example true
   */
  stackCornerRadius?: StackCornerRadius
  /**
   * @description 矩形的最大高度，可以是像素值或者百分比字符串
   */
  barMaxWidth?: BarMaxWidth
  /**
   * @description Y轴排序配置, 支持根据维度或指标排序, 以及自定义排序顺序
   * @example
   * sort: {
   *   orderBy: 'profit',
   *   order: 'asc',
   * }
   * sort: {
   *   customOrder:['2019', '2020', '2021']
   * }
   */
  sort?: Sort
  /**
   * @description 图例排序配置, 支持根据维度或指标排序, 以及自定义排序顺序
   * @example
   * sortLegend: {
   *   orderBy: 'profit',
   *   order: 'asc',
   * }
   * sortLegend: {
   *   customOrder:['2019', '2020', '2021']
   * }
   */
  sortLegend?: SortLegend
  /**
   * @description 图表的主题, 主题是优先级较低的功能配置, 包含所有图表类型共用的通用配置, 与单类图表类型共用的图表配置, 内置light与dark两种主题, 用户可以通过Builder自定义主题
   * @default light 默认为亮色主题
   * @example 'dark'
   * @example 'light'
   * @example 'customThemeName'
   */
  theme?: Theme
  /**
   * @description 矩形图元样式, 条形图样式配置, 用于定义图表的条形图样式, 包括条形图的颜色, 边框, 圆角等.
   * 支持全局样式或条件样式配置
   * 数据筛选器
   * 若配置selector, 提供数值 selector, 局部数据 selector, 条件维度 selector, 条件指标 selector 共四类数据匹配能力
   * 若未配置selector, 则样式全局生效.
   */
  barStyle?: BarStyle | BarStyle[]
  /**
   * @description 标注点配置, 根据选择的数据, 定义图表的标注点, 包括标注点的位置, 格式, 样式等.
   */
  annotationPoint?: AnnotationPoint | AnnotationPoint[]
  /**
   * @description 数值标注线(包括均值线、最大值线、最小值线等)，竖直方向展示，能够设置标注线的位置, 样式等，如需绘制均值线等数值对应的标注线请使用该配置
   */
  annotationVerticalLine?: AnnotationVerticalLine | AnnotationVerticalLine[]
  /**
   * @description 维度值标注线，水平展示，能够设置标注线的位置, 样式等
   */
  annotationHorizontalLine?: AnnotationHorizontalLine | AnnotationHorizontalLine[]
  /**
   * @description 标注区域配置, 根据选择的数据, 定义图表的标注区域, 包括标注区域的位置, 样式等.
   */
  annotationArea?: AnnotationArea | AnnotationArea[]
  /**
   * @description 差异标注线配置，用于绑定两个数据锚点并展示绝对差值或百分比差值。
   */
  annotationDifferenceLine?: AnnotationDifferenceLine | AnnotationDifferenceLine[]
  /**
   * @description 当图表开启透视功能或者指标组合的是否，是否开启维度联动功能
   * 当hover 到某个维度值时，联动高亮其他图表中相同维度值的数据
   */
  dimensionLinkage?: DimensionLinkage
  /**
   * @description 图表语言配置, 支持'zh-CN'与'en-US'两种语言, 另外可以调用 intl.setLocale('zh-CN') 方法设置语言
   * @default 'zh-CN'
   */
  locale?: Locale
}
```

## BarParallel

源码：[packages/vseed/src/types/chartType/barParallel/barParallel.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/types/chartType/barParallel/barParallel.ts#L60)

包导出：`BarParallel`

```typescript
/**
 * @description 并列条形图，适用于多指标横向并行对比场景，多个条形平行排列展示不同指标值
 * 适用场景:
 * - 类别名称较长时的多指标对比
 * - 排名与数值同时展示的横向比较
 * - 多维度数据的并列分析
 * @encoding
 * 并列条形图支持以下视觉通道:
 * `yAxis`  : y轴通道, 支持`多个维度`, 按维度值映射至y轴
 * `xAxis`  : x轴通道, 支持`多个指标`, 按指标值映射至x轴
 * `detail` : 细分通道, 支持`多个维度`, 在同一个颜色系列下展示更细粒度的数据时使用
 * `color`  : 颜色通道, 支持`多个维度`或 `一个指标`, 维度颜色用于区分不同的数据系列, 指标颜色用于线性映射指标值到图形颜色
 * `tooltip`: 提示通道, 支持`多个维度`与 `多个指标`, 会在鼠标悬停在数据点上时展示
 * `label`  : 标签通道, 支持`多个维度`与 `多个指标`, 会在数据点上展示数据标签
 * @warning
 * 数据要求:
 * - 至少1个指标字段（度量）
 * - 第一个维度会放至Y轴, 其余维度会与指标名称(存在多个指标时)合并, 作为图例项展示.
 * - 所有指标会自动合并为一个指标
 * 默认开启的功能:
 * - 默认开启图例、坐标轴、数据标签、提示信息
 * @recommend
 * - 推荐字段配置: `1`个指标, `2`个维度
 * - 支持数据重塑: 至少`1`个指标, `0`个维度
 */
export interface BarParallel {
  /**
   * @description 并列条形图，适用于多指标横向并行对比场景
   * @type {'barParallel'}
   * @example 'barParallel'
   */
  chartType: 'barParallel'
  /**
   * @description 数据源, 符合TidyData规范的且已经聚合的数据集，用于定义图表的数据来源和结构, 用户输入的数据集并不需要进行任何处理, VSeed带有强大的数据重塑功能, 会自行进行数据重塑, 并列条形图的数据最终会被转换为2个维度, 1个指标.
   * @type {Array<Record<string|number, any>>}
   * @example [{category:'A', value1:100, value2:200}, {category:'B', value1:150, value2:250}]
   */
  dataset: Dataset
  /**
   * @description 维度, 第一个维度被映射到Y轴, 其余维度会与指标名称(存在多个指标时)合并, 作为图例项展示.
   * @example [{id: 'category', alias: '类别'}]
   */
  dimensions?: BarDimension[]
  /**
   * @description 指标, 并列条形图指标会自动合并为一个指标, 映射到X轴, 存在多个指标时, 指标名称会与其余维度合并, 作为图例项展示.
   * @example [{id: 'value1', alias: '指标1'}, {id: 'value2', alias: '指标2'}]
   */
  measures?: BarMeasure[]
  /**
   * 分页
   * @description 分页配置，用于配置图表的分页功能
   */
  page?: Page
  /**
   * @description 图表的背景颜色, 默认为透明背景, 背景颜色可以是颜色字符串, 例如'red', 'blue', 也可以是hex, rgb或rgba'#ff0000', 'rgba(255,0,0,0.5)'
   */
  backgroundColor?: BackgroundColor
  /**
   * @description 颜色配置, 用于定义图表的颜色方案, 包括颜色列表, 颜色映射, 颜色渐变等.
   */
  color?: Color
  /**
   * @description 标签配置, 用于定义图表的数据标签, 包括数据标签的位置, 格式, 样式等.
   */
  label?: Label
  /**
   * @description 图例配置, 用于定义图表的图例, 包括图例的位置, 格式, 样式等.
   */
  legend?: Legend
  /**
   * 绘图区内边距
   * @description 映射到 VChart 的 region[0].padding，用于为标注、标签等绘图区外扩元素预留空间。
   */
  regionPadding?: RegionPadding
  /**
   * @description 提示信息配置, 用于定义图表的提示信息, 包括提示信息的位置, 格式, 样式等.
   */
  tooltip?: Tooltip
  /**
   * 框选
   * @description 框选配置，用于开启/关闭 brush 框选能力
   */
  brush?: Brush
  /**
   * 动画配置
   * @description 图表动画配置，按图表类型约束可选效果
   */
  animation?: BarLikeAnimation
  /**
   * @description x轴, 数值轴, x轴配置, 用于定义图表的x轴, 包括x轴的位置, 格式, 样式等.
   */
  xAxis?: XLinearAxis
  /**
   * @description y轴, 类目轴, y轴配置, 用于定义图表的y轴, 包括y轴的位置, 格式, 样式等.
   */
  yAxis?: YBandAxis
  /**
   * @description 水平提示框配置, 用于定义图表的水平提示框, 包括水平提示框的颜色、标签样式等.
   */
  crosshairRect?: CrosshairRect
  /**
   * @description 柱图圆角的数值或数组，默认 0，不启用圆角。当 stackCornerRadius 为 false 时，每个图元独立绘制圆角；为 true 时，通过 clip 裁剪整组堆叠柱体。数值设置所有角，数组按左上、右上、右下、左下排列，数据为负值时圆角方向自动翻转。设为 0 可关闭。barStyle.barRadius 可覆盖单个图元的圆角；stackCornerRadius 为 true 时，整组圆角统一使用 cornerRadius，不受 barStyle.barRadius 影响。
   * @default 0
   * @example [4, 4, 0, 0]
   */
  cornerRadius?: CornerRadius
  /**
   * @description 是否使用整组堆叠圆角，默认 false。设为 true 时，通过 clip 裁剪整组柱体，圆角值统一读取 cornerRadius，保留堆叠内部的直角连接，并优先于 barStyle.barRadius（包括条件样式）。设为 false 时，cornerRadius 对每个图元单独生效。注意：开启 stackCornerRadius 会引起更新动画重叠的 bug，整组 clip 裁剪路径与图元更新动画不同步，依赖 VChart 修复；需要平滑更新动画时建议保持 false。
   * @default false
   * @example true
   */
  stackCornerRadius?: StackCornerRadius
  /**
   * @description 矩形的最大高度，可以是像素值或者百分比字符串
   */
  barMaxWidth?: BarMaxWidth
  /**
   * @description 同一分类下，矩形之间的距离，可以是像素值或者百分比字符串
   */
  barGapInGroup?: BarGapInGroup
  /**
   * @description Y轴排序配置, 支持根据维度或指标排序, 以及自定义排序顺序
   * @example
   * sort: {
   *   orderBy: 'profit',
   *   order: 'asc',
   * }
   * sort: {
   *   customOrder:['2019', '2020', '2021']
   * }
   */
  sort?: Sort
  /**
   * @description 图例排序配置, 支持根据维度或指标排序, 以及自定义排序顺序
   * @example
   * sortLegend: {
   *   orderBy: 'profit',
   *   order: 'asc',
   * }
   * sortLegend: {
   *   customOrder:['2019', '2020', '2021']
   * }
   */
  sortLegend?: SortLegend
  /**
   * @description 图表的主题, 主题是优先级较低的功能配置, 包含所有图表类型共用的通用配置, 与单类图表类型共用的图表配置, 内置light与dark两种主题, 用户可以通过Builder自定义主题
   * @default light 默认为亮色主题
   * @example 'dark'
   * @example 'light'
   * @example 'customThemeName'
   */
  theme?: Theme
  /**
   * @description 矩形图元样式, 条形图样式配置, 用于定义图表的条形图样式, 包括条形图的颜色, 边框, 圆角等.
   * 支持全局样式或条件样式配置
   * 数据筛选器
   * 若配置selector, 提供数值 selector, 局部数据 selector, 条件维度 selector, 条件指标 selector 共四类数据匹配能力
   * 若未配置selector, 则样式全局生效.
   */
  barStyle?: BarStyle | BarStyle[]
  /**
   * @description 标注点配置, 根据选择的数据, 定义图表的标注点, 包括标注点的位置, 格式, 样式等.
   */
  annotationPoint?: AnnotationPoint | AnnotationPoint[]
  /**
   * @description 数值标注线(包括均值线、最大值线、最小值线等)，竖直方向展示，能够设置标注线的位置, 样式等，如需绘制均值线等数值对应的标注线请使用该配置
   */
  annotationVerticalLine?: AnnotationVerticalLine | AnnotationVerticalLine[]
  /**
   * @description 维度值标注线，水平展示，能够设置标注线的位置, 样式等
   */
  annotationHorizontalLine?: AnnotationHorizontalLine | AnnotationHorizontalLine[]
  /**
   * @description 标注区域配置, 根据选择的数据, 定义图表的标注区域, 包括标注区域的位置, 样式等.
   */
  annotationArea?: AnnotationArea | AnnotationArea[]
  /**
   * @description 差异标注线配置，用于绑定两个数据锚点并展示绝对差值或百分比差值。
   */
  annotationDifferenceLine?: AnnotationDifferenceLine | AnnotationDifferenceLine[]
  /**
   * @description 当图表开启透视功能或者指标组合的是否，是否开启维度联动功能
   * 当hover 到某个维度值时，联动高亮其他图表中相同维度值的数据
   */
  dimensionLinkage?: DimensionLinkage
  /**
   * @description 图表语言配置, 支持'zh-CN'与'en-US'两种语言, 另外可以调用 intl.setLocale('zh-CN') 方法设置语言
   * @default 'zh-CN'
   */
  locale?: Locale
}
```

## BarPercent

源码：[packages/vseed/src/types/chartType/barPercent/barPercent.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/types/chartType/barPercent/barPercent.ts#L58)

包导出：`BarPercent`

```typescript
/**
 * @description 百分比条形图，适用于横向展示各类别占比关系的场景，X轴以百分比形式展示数据占比
 * 适用场景:
 * - 类别名称较长时的占比对比
 * - 多维度数据的横向构成分析
 * - 排名与占比同时展示的场景
 * @encoding
 * 百分比条形图支持以下视觉通道:
 * `yAxis`  : y轴通道, 支持`多个维度`, 按维度值映射至y轴
 * `xAxis`  : x轴通道, 支持`多个指标`, 按指标值映射至x轴
 * `detail` : 细分通道, 支持`多个维度`, 在同一个颜色系列下展示更细粒度的数据时使用
 * `color`  : 颜色通道, 支持`多个维度`或 `一个指标`, 维度颜色用于区分不同的数据系列, 指标颜色用于线性映射指标值到图形颜色
 * `tooltip`: 提示通道, 支持`多个维度`与 `多个指标`, 会在鼠标悬停在数据点上时展示
 * `label`  : 标签通道, 支持`多个维度`与 `多个指标`, 会在数据点上展示数据标签
 * @warning
 * 数据要求:
 * - 至少1个维度字段和1个度量字段
 * - 所有类别占比之和为100%
 * - 支持多系列堆叠展示占比关系
 * 默认开启的功能:
 * - 默认开启图例、坐标轴、百分比标签、提示信息、占比计算
 * @recommend
 * - 推荐字段配置: `1`个指标, `2`个维度
 * - 支持数据重塑: 至少`1`个指标, `0`个维度
 */
export interface BarPercent {
  /**
   * @description 百分比条形图，以横向百分比形式展示各类别数据占比关系
   * @type {'barPercent'}
   * @example 'barPercent'
   */
  chartType: 'barPercent'
  /**
   * @description 数据源, 符合TidyData规范的且已经聚合的数据集，用于定义图表的数据来源和结构, 用户输入的数据集并不需要进行任何处理, VSeed带有强大的数据重塑功能, 会自行进行数据重塑, 百分比条形图的数据最终会被转换为2个维度, 1个指标.
   * @type {Array<Record<string|number, any>>}
   * @example [{category:'A', value:30}, {category:'B', value:70}]
   */
  dataset: Dataset
  /**
   * @description 维度, 第一个维度会放至Y轴, 其余维度会与指标名称(存在多个指标时)合并, 作为图例项展示.
   * @type {Dimensions}
   * @example [{id: 'category', alias: '类别'}]
   */
  dimensions?: BarDimension[]
  /**
   * @description 指标, 指标会自动合并为一个指标, 映射到X轴, 存在多个指标时, 指标名称会与其余维度合并, 作为图例项展示.
   * @type {MeasureTree}
   * @example [{id: 'value', alias: '数值占比', format: 'percent'}]
   */
  measures?: BarMeasure[]
  /**
   * 分页
   * @description 分页配置，用于配置图表的分页功能
   */
  page?: Page
  /**
   * @description 图表的背景颜色, 默认为透明背景, 背景颜色可以是颜色字符串, 例如'red', 'blue', 也可以是hex, rgb或rgba'#ff0000', 'rgba(255,0,0,0.5)'
   */
  backgroundColor?: BackgroundColor
  /**
   * @description 颜色配置, 用于定义图表的颜色方案, 包括颜色列表, 颜色映射, 颜色渐变等.
   */
  color?: Color
  /**
   * @description 标签配置, 用于定义图表的数据标签, 包括数据标签的位置, 格式, 样式等.
   */
  label?: Label
  /**
   * @description 图例配置, 用于定义图表的图例, 包括图例的位置, 格式, 样式等.
   */
  legend?: Legend
  /**
   * 绘图区内边距
   * @description 映射到 VChart 的 region[0].padding，用于为标注、标签等绘图区外扩元素预留空间。
   */
  regionPadding?: RegionPadding
  /**
   * @description 提示信息配置, 用于定义图表的提示信息, 包括提示信息的位置, 格式, 样式等.
   */
  tooltip?: Tooltip
  /**
   * 框选
   * @description 框选配置，用于开启/关闭 brush 框选能力
   */
  brush?: Brush
  /**
   * 动画配置
   * @description 图表动画配置，按图表类型约束可选效果
   */
  animation?: BarLikeAnimation
  /**
   * @description x轴, 数值轴, x轴配置, 用于定义图表的x轴, 包括x轴的位置, 格式, 样式等.
   */
  xAxis?: XLinearAxis
  /**
   * @description y轴, 类目轴, y轴配置, 用于定义图表的y轴, 包括y轴的位置, 格式, 样式等.
   */
  yAxis?: YBandAxis
  /**
   * @description 水平提示框配置, 用于定义图表的水平提示框, 包括水平提示框的颜色、标签样式等.
   */
  crosshairRect?: CrosshairRect
  /**
   * @description 柱图圆角的数值或数组，默认 0，不启用圆角。当 stackCornerRadius 为 false 时，每个图元独立绘制圆角；为 true 时，通过 clip 裁剪整组堆叠柱体。数值设置所有角，数组按左上、右上、右下、左下排列，数据为负值时圆角方向自动翻转。设为 0 可关闭。barStyle.barRadius 可覆盖单个图元的圆角；stackCornerRadius 为 true 时，整组圆角统一使用 cornerRadius，不受 barStyle.barRadius 影响。
   * @default 0
   * @example [4, 4, 0, 0]
   */
  cornerRadius?: CornerRadius
  /**
   * @description 是否使用整组堆叠圆角，默认 false。设为 true 时，通过 clip 裁剪整组柱体，圆角值统一读取 cornerRadius，保留堆叠内部的直角连接，并优先于 barStyle.barRadius（包括条件样式）。设为 false 时，cornerRadius 对每个图元单独生效。注意：开启 stackCornerRadius 会引起更新动画重叠的 bug，整组 clip 裁剪路径与图元更新动画不同步，依赖 VChart 修复；需要平滑更新动画时建议保持 false。
   * @default false
   * @example true
   */
  stackCornerRadius?: StackCornerRadius
  /**
   * @description 矩形的最大高度，可以是像素值或者百分比字符串
   */
  barMaxWidth?: BarMaxWidth
  /**
   * @description Y轴排序配置, 支持根据维度或指标排序, 以及自定义排序顺序
   * @example
   * sort: {
   *   orderBy: 'profit',
   *   order: 'asc',
   * }
   * sort: {
   *   customOrder:['2019', '2020', '2021']
   * }
   */
  sort?: Sort
  /**
   * @description 图例排序配置, 支持根据维度或指标排序, 以及自定义排序顺序
   * @example
   * sortLegend: {
   *   orderBy: 'profit',
   *   order: 'asc',
   * }
   * sortLegend: {
   *   customOrder:['2019', '2020', '2021']
   * }
   */
  sortLegend?: SortLegend
  /**
   * 图表的主题, 主题是优先级较低的功能配置, 包含所有图表类型共用的通用配置, 与单类图表类型共用的图表配置
   * @default light 默认为亮色主题
   * @description 内置light与dark两种主题, 用户可以通过Builder自定义主题
   * @example 'dark'
   * @example 'light'
   * @example 'customThemeName'
   */
  theme?: Theme
  /**
   * 矩形图元样式
   * @description 条形图样式配置, 用于定义图表的条形图样式, 包括条形图的颜色, 边框, 圆角等.
   * 支持全局样式或条件样式配置
   * 数据筛选器
   * 若配置selector, 提供数值 selector, 局部数据 selector, 条件维度 selector, 条件指标 selector 共四类数据匹配能力
   * 若未配置selector, 则样式全局生效.
   */
  barStyle?: BarStyle | BarStyle[]
  /**
   * 标注点
   * @description 标注点配置, 根据选择的数据, 定义图表的标注点, 包括标注点的位置, 格式, 样式等.
   */
  annotationPoint?: AnnotationPoint | AnnotationPoint[]
  /**
   * 标注垂直线
   * @description 数值标注线(包括均值线、最大值线、最小值线等)，竖直方向展示，能够设置标注线的位置, 样式等，如需绘制均值线等数值对应的标注线请使用该配置
   */
  annotationVerticalLine?: AnnotationVerticalLine | AnnotationVerticalLine[]
  /**
   * 标注水平线
   * @description 维度值标注线，水平展示，能够设置标注线的位置, 样式等
   */
  annotationHorizontalLine?: AnnotationHorizontalLine | AnnotationHorizontalLine[]
  /**
   * 标注区域
   * @description 标注区域配置, 根据选择的数据, 定义图表的标注区域, 包括标注区域的位置, 样式等.
   */
  annotationArea?: AnnotationArea | AnnotationArea[]
  /**
   * @description 当图表开启透视功能或者指标组合的是否，是否开启维度联动功能
   * 当hover 到某个维度值时，联动高亮其他图表中相同维度值的数据
   */
  dimensionLinkage?: DimensionLinkage
  /**
   * 语言
   * @description 图表语言配置, 支持'zh-CN'与'en-US'两种语言, 另外可以调用 intl.setLocale('zh-CN') 方法设置语言
   * @default 'zh-CN'
   */
  locale?: Locale
}
```

## BoxPlot

源码：[packages/vseed/src/types/chartType/boxPlot/boxPlot.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/types/chartType/boxPlot/boxPlot.ts#L53)

包导出：`BoxPlot`

```typescript
/**
 * @description 箱线图，适用于展示数据分布情况，X轴为类目轴（分类数据），Y轴为数值轴（连续数据），箱体纵向排列
 * 适用场景:
 * - 数据项名称较短时
 * - 需要直观比较不同类别的数值大小
 * - 展示时间序列数据变化趋势
 * @encoding
 * 箱线图支持以下视觉通道:
 * `xAxis`  : x轴通道, 支持`多个维度`, 按维度值映射至x轴
 * `yAxis`  : y轴通道, 支持`多个指标`, 按指标值映射至y轴
 * `color`  : 颜色通道, 支持`多个维度`或 `一个指标`, 维度颜色用于区分不同的数据系列, 指标颜色用于线性映射指标值到图形颜色
 * `tooltip`: 提示通道, 支持`多个维度`与 `多个指标`, 会在鼠标悬停在数据点上时展示
 * `label`  : 标签通道, 支持`多个维度`与 `多个指标`, 会在数据点上展示数据标签
 * @warning
 * 数据要求:
 * - 至少1个数值字段（度量）
 * - 第一个维度会放至X轴, 其余维度会与指标名称(存在多个指标时)合并, 作为图例项展示
 * - 所有指标会自动合并为一个指标
 * 默认开启的功能:
 * - 默认开启图例、坐标轴、数据标签、提示信息
 * @recommend
 * - 推荐字段配置: `1`个指标, `1`个维度
 * - 支持数据重塑: 至少`1`个指标, `0`个维度
 */
export interface BoxPlot {
  /**
   * @description 箱型图，适用于展示数据分布情况，X轴为类目轴（分类数据），Y轴为数值轴（连续数据），箱体纵向排列
   * @type {'boxPlot'}
   * @example 'boxPlot'
   */
  chartType: 'boxPlot'
  /**
   * @description 符合TidyData规范的且已经聚合的数据集，用于定义图表的数据来源和结构, 用户输入的数据集并不需要进行任何处理, VSeed带有强大的数据重塑功能, 会自行进行数据重塑, 柱状图的数据最终会被转换为2个维度, 1个指标.
   * @type {Array<Record<string|number, any>>}
   * @example [{category:'A', value:100}, {category:'B', value:200}]
   */
  dataset: Dataset
  /**
   * @description 箱线图的第一个维度被映射到X轴, 其余维度会与指标名称(存在多个指标时)合并, 作为图例项展示
   * @example [{id: "category", alias: "类别"}]
   */
  dimensions?: BoxPlotDimension[]
  /**
   * @description 箱线图的所有指标会自动合并为一个指标, 映射到Y轴, 存在多个指标时, 指标名称会与其余维度合并, 作为图例项展示.
   * @example [{id: "value", alias: "数值"}]
   */
  measures?: BoxPlotMeasure[]
  /**
   * @description 分页配置, 用于指定分页的字段名, 必须是维度
   */
  page?: Page
  /**
   * @description 图表的背景颜色, 背景颜色可以是颜色字符串, 默认为透明背景, 例如'red', 'blue', 也可以是hex, rgb或rgba'#ff0000', 'rgba(255,0,0,0.5)'
   */
  backgroundColor?: BackgroundColor
  /**
   * @description 颜色配置, 用于定义图表的颜色方案, 包括颜色列表, 颜色映射, 颜色渐变等.
   */
  color?: Color
  /**
   * @description 标签配置, 用于定义图表的数据标签, 包括数据标签的位置, 格式, 样式等.
   */
  label?: Label
  /**
   * @description 图例配置, 用于定义图表的图例, 包括图例的位置, 格式, 样式等.
   */
  legend?: Legend
  /**
   * @description 提示信息配置, 用于定义图表的提示信息, 包括提示信息的位置, 格式, 样式等.
   */
  tooltip?: Tooltip
  /**
   * 框选
   * @description 框选配置，用于开启/关闭 brush 框选能力
   */
  brush?: Brush
  /**
   * @description x轴, 类目轴, x轴配置, 用于定义图表的x轴, 包括x轴的位置, 格式, 样式等.
   */
  xAxis?: XBandAxis
  /**
   * @description y轴, 数值轴, y轴配置, 用于定义图表的y轴, 包括y轴的位置, 格式, 样式等.
   */
  yAxis?: YLinearAxis
  /**
   * @description X轴排序配置, 支持根据维度或指标排序, 以及自定义排序顺序
   * @example
   * sort: {
   *   orderBy: 'profit',
   *   order: 'asc',
   * }
   * sort: {
   *   customOrder:['2019', '2020', '2021']
   * }
   */
  sort?: Sort
  /**
   * @description 图例排序配置, 支持根据维度或指标排序, 以及自定义排序顺序
   * @example
   * sortLegend: {
   *   orderBy: 'profit',
   *   order: 'asc',
   * }
   * sortLegend: {
   *   customOrder:['2019', '2020', '2021']
   * }
   */
  sortLegend?: SortLegend
  /**
   * @description 图表的主题, 主题是优先级较低的功能配置, 包含所有图表类型共用的通用配置, 与单类图表类型共用的图表配置, 内置light与dark两种主题, 用户可以通过Builder自定义主题
   * @default light 默认为亮色主题
   * @example 'dark'
   * @example 'light'
   * @example 'customThemeName'
   */
  theme?: Theme
  /**
   * @description 垂直提示框配置, 用于定义图表的垂直提示框, 包括垂直提示框的颜色、标签样式等.
   */
  crosshairRect?: CrosshairRect
  /**
   * @description 箱线图箱体的样式配置，支持全局或选择器粒度生效
   */
  boxPlotStyle?: BoxPlotStyle | BoxPlotStyle[]
  /**
   * @description 异常点的样式配置，支持全局或选择器粒度生效
   */
  outlierStyle?: OutlierStyle | OutlierStyle[]
  /**
   * @description 直方图的须长配置，支持标量值和长度为2 的数组
   * 当值为标量的时候，使用 whiskers * IQR 来计算上界值和下界值
   * 当值为2元数组的时候，whiskers[0] 需要在[0, 0.25)之间，表示下界值取对应的百分位数；
   * whiskers[1] 需要在(0.75, 1]之间，表示上界值取对应的百分位数；
   */
  whiskers?: WhiskersConfig
  /**
   * @description 标注点配置, 根据选择的数据, 定义图表的标注点, 包括标注点的位置, 格式, 样式等.
   */
  annotationPoint?: AnnotationPoint | AnnotationPoint[]
  /**
   * @description 维度值标注线，竖直方向展示，能够设置标注线的位置, 样式等
   */
  annotationVerticalLine?: AnnotationVerticalLine | AnnotationVerticalLine[]
  /**
   * @description 数值标注线(包括均值线、最大值线、最小值线等)，水平方向展示，能够设置标注线的位置, 样式等，如需绘制均值线等数值对应的标注线请使用该配置
   */
  annotationHorizontalLine?: AnnotationHorizontalLine | AnnotationHorizontalLine[]
  /**
   * @description 标注区域配置, 根据选择的数据, 定义图表的标注区域, 包括标注区域的位置, 样式等.
   */
  annotationArea?: AnnotationArea | AnnotationArea[]
  /**
   * @description 当图表开启透视功能或者指标组合的是否，是否开启维度联动功能
   * 当hover 到某个维度值时，联动高亮其他图表中相同维度值的数据
   */
  dimensionLinkage?: DimensionLinkage
  /**
   * @description 图表语言配置, 支持'zh-CN'与'en-US'两种语言, 另外可以调用 intl.setLocale('zh-CN') 方法设置语言
   * @default 'zh-CN'
   */
  locale?: Locale
  /**
   * @description 箱线图的最大宽度，可以设置绝对的像素值，也可以使用百分比（如 '10%'）
   */
  boxMaxWidth?: string | number
  /**
   * @description 分组箱线图中各个分组内的间距，可以设置绝对的像素值，也可以使用百分比（如 '10%'）。
   */
  boxGapInGroup?: string | number
}
```

## CirclePacking

源码：[packages/vseed/src/types/chartType/circlePacking/circlePacking.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/types/chartType/circlePacking/circlePacking.ts#L29)

包导出：`CirclePacking`

```typescript
/**
 * @description 圆形打包图，用于展示层级数据，通过圆的大小表示数值大小
 * 适用场景:
 * - 展示层级数据的占比分布
 * - 强调数据的包含关系
 * @encoding
 * 圆形打包图支持以下视觉通道:
 * `color`: 颜色通道, 支持`多个维度`或 `一个指标`
 * `label`: 标签通道, 支持`多个维度`与 `多个指标`
 * `tooltip`: 提示通道, 支持`多个维度`与 `多个指标`
 * @warning
 * 数据要求:
 * - 至少1个数值字段（度量）用于映射圆的大小
 * - 至少1个维度字段用于层级划分
 */
export interface CirclePacking {
  /**
   * 圆形打包图
   * @description 圆形打包图，展示层级数据的占比关系
   * @type {'circlePacking'}
   * @example 'circlePacking'
   */
  chartType: 'circlePacking'
  /**
   * 数据集
   * @description 符合TidyData规范的且已经聚合的数据集，用于定义图表的数据来源和结构
   * @type {Array<Record<string|number, any>>}
   * @example [{category:'A', value:30}, {category:'B', value:70}]
   */
  dataset: Dataset
  /**
   * 维度
   * @description 维度配置，用于定义数据的层级结构
   * @example [{id: 'category', alias: '类别'}]
   */
  dimensions?: HierarchyDimension[]
  /**
   * 指标
   * @description 指标配置，用于定义圆的大小
   * @example [{id: 'value', alias: '数值'}]
   */
  measures?: HierarchyMeasure[]
  /**
   * 分页配置
   * @description 用于指定分页的字段名, 必须是维度
   */
  page?: Page
  /**
   * 图表的背景颜色
   * @default transparent 默认为透明背景
   * @description 背景颜色可以是颜色字符串, 例如'red', 'blue', 也可以是hex, rgb或rgba'#ff0000', 'rgba(255,0,0,0.5)'
   */
  backgroundColor?: BackgroundColor
  /**
   * 颜色
   * @description 颜色配置, 用于定义图表的颜色方案, 包括颜色列表, 颜色映射, 颜色渐变等.
   */
  color?: Color
  /**
   * 标签
   * @description 标签配置, 用于定义图表的数据标签, 包括数据标签的位置, 格式, 样式等.
   */
  label?: Label
  /**
   * 提示信息
   * @description 提示信息配置, 用于定义图表的提示信息, 包括提示信息的位置, 格式, 样式等.
   */
  tooltip?: Tooltip
  /**
   * 图表的主题
   * @default light 默认为亮色主题
   * @description 内置light与dark两种主题, 用户可以通过Builder自定义主题
   * @example 'dark'
   * @example 'light'
   */
  theme?: Theme
  /**
   * 语言
   * @description 图表语言配置, 支持'zh-CN'与'en-US'两种语言
   * @default 'zh-CN'
   */
  locale?: Locale
}
```

## Column

源码：[packages/vseed/src/types/chartType/column/column.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/types/chartType/column/column.ts#L59)

包导出：`Column`

```typescript
/**
 * @description 柱状图，适用于纵向数据对比场景，X轴为类目轴（分类数据），Y轴为数值轴（连续数据），柱子纵向排列
 * 适用场景:
 * - 数据项名称较短时
 * - 需要直观比较不同类别的数值大小
 * - 展示时间序列数据变化趋势
 * @encoding
 * 柱状图支持以下视觉通道:
 * `xAxis`  : x轴通道, 支持`多个维度`, 按维度值映射至x轴
 * `yAxis`  : y轴通道, 支持`多个指标`, 按指标值映射至y轴
 * `detail` : 细分通道, 支持`多个维度`, 在同一个颜色系列下展示更细粒度的数据时使用
 * `color`  : 颜色通道, 支持`多个维度`或 `一个指标`, 维度颜色用于区分不同的数据系列, 指标颜色用于线性映射指标值到图形颜色
 * `tooltip`: 提示通道, 支持`多个维度`与 `多个指标`, 会在鼠标悬停在数据点上时展示
 * `label`  : 标签通道, 支持`多个维度`与 `多个指标`, 会在数据点上展示数据标签
 * @warning
 * 数据要求:
 * - 至少1个数值字段（度量）
 * - 第一个维度会放至X轴, 其余维度会与指标名称(存在多个指标时)合并, 作为图例项展示
 * - 所有指标会自动合并为一个指标
 * 默认开启的功能:
 * - 默认开启图例、坐标轴、数据标签、提示信息
 * @recommend
 * - 推荐字段配置: `1`个指标, `2`个维度
 * - 支持数据重塑: 至少`1`个指标, `0`个维度
 */
export interface Column {
  /**
   * @description 柱状图，适用于纵向数据对比场景，X轴为类目轴（分类数据），Y轴为数值轴（连续数据），柱子纵向排列
   * @type {'column'}
   * @example 'column'
   */
  chartType: 'column'
  /**
   * @description 符合TidyData规范的且已经聚合的数据集，用于定义图表的数据来源和结构, 用户输入的数据集并不需要进行任何处理, VSeed带有强大的数据重塑功能, 会自行进行数据重塑, 柱状图的数据最终会被转换为2个维度, 1个指标.
   * @type {Array<Record<string|number, any>>}
   * @example [{category:'A', value:100}, {category:'B', value:200}]
   */
  dataset: Dataset
  /**
   * @description 柱状图的第一个维度被映射到X轴, 其余维度会与指标名称(存在多个指标时)合并, 作为图例项展示
   * @example [{id: "category", alias: "类别"}]
   */
  dimensions?: ColumnDimension[]
  /**
   * @description 柱状图的所有指标会自动合并为一个指标, 映射到Y轴, 存在多个指标时, 指标名称会与其余维度合并, 作为图例项展示.
   * @example [{id: "value", alias: "数值"}]
   */
  measures?: ColumnMeasure[]
  /**
   * @description 分页配置, 用于指定分页的字段名, 必须是维度
   */
  page?: Page
  /**
   * @description 图表的背景颜色, 背景颜色可以是颜色字符串, 默认为透明背景, 例如'red', 'blue', 也可以是hex, rgb或rgba'#ff0000', 'rgba(255,0,0,0.5)'
   */
  backgroundColor?: BackgroundColor
  /**
   * @description 颜色配置, 用于定义图表的颜色方案, 包括颜色列表, 颜色映射, 颜色渐变等.
   */
  color?: Color
  /**
   * @description 标签配置, 用于定义图表的数据标签, 包括数据标签的位置, 格式, 样式等.
   */
  label?: Label
  /**
   * @description 图例配置, 用于定义图表的图例, 包括图例的位置, 格式, 样式等.
   */
  legend?: Legend
  /**
   * 绘图区内边距
   * @description 映射到 VChart 的 region[0].padding，用于为标注、标签等绘图区外扩元素预留空间。
   */
  regionPadding?: RegionPadding
  /**
   * @description 提示信息配置, 用于定义图表的提示信息, 包括提示信息的位置, 格式, 样式等.
   */
  tooltip?: Tooltip
  /**
   * 框选
   * @description 框选配置，用于开启/关闭 brush 框选能力
   */
  brush?: Brush
  /**
   * 动画配置
   * @description 图表动画配置，按图表类型约束可选效果
   */
  animation?: BarLikeAnimation
  /**
   * @description x轴, 类目轴, x轴配置, 用于定义图表的x轴, 包括x轴的位置, 格式, 样式等.
   */
  xAxis?: XBandAxis
  /**
   * @description y轴, 数值轴, y轴配置, 用于定义图表的y轴, 包括y轴的位置, 格式, 样式等.
   */
  yAxis?: YLinearAxis
  /**
   * @description X轴排序配置, 支持根据维度或指标排序, 以及自定义排序顺序
   * @example
   * sort: {
   *   orderBy: 'profit',
   *   order: 'asc',
   * }
   * sort: {
   *   customOrder:['2019', '2020', '2021']
   * }
   */
  sort?: Sort
  /**
   * @description 图例排序配置, 支持根据维度或指标排序, 以及自定义排序顺序
   * @example
   * sortLegend: {
   *   orderBy: 'profit',
   *   order: 'asc',
   * }
   * sortLegend: {
   *   customOrder:['2019', '2020', '2021']
   * }
   */
  sortLegend?: SortLegend
  /**
   * @description 图表的主题, 主题是优先级较低的功能配置, 包含所有图表类型共用的通用配置, 与单类图表类型共用的图表配置, 内置light与dark两种主题, 用户可以通过Builder自定义主题
   * @default light 默认为亮色主题
   * @example 'dark'
   * @example 'light'
   * @example 'customThemeName'
   */
  theme?: Theme
  /**
   * @description 垂直提示框配置, 用于定义图表的垂直提示框, 包括垂直提示框的颜色、标签样式等.
   */
  crosshairRect?: CrosshairRect
  /**
   * @description 柱图圆角的数值或数组，默认 0，不启用圆角。当 stackCornerRadius 为 false 时，每个图元独立绘制圆角；为 true 时，通过 clip 裁剪整组堆叠柱体。数值设置所有角，数组按左上、右上、右下、左下排列，数据为负值时圆角方向自动翻转。设为 0 可关闭。barStyle.barRadius 可覆盖单个图元的圆角；stackCornerRadius 为 true 时，整组圆角统一使用 cornerRadius，不受 barStyle.barRadius 影响。
   * @default 0
   * @example [4, 4, 0, 0]
   */
  cornerRadius?: CornerRadius
  /**
   * @description 是否使用整组堆叠圆角，默认 false。设为 true 时，通过 clip 裁剪整组柱体，圆角值统一读取 cornerRadius，保留堆叠内部的直角连接，并优先于 barStyle.barRadius（包括条件样式）。设为 false 时，cornerRadius 对每个图元单独生效。注意：开启 stackCornerRadius 会引起更新动画重叠的 bug，整组 clip 裁剪路径与图元更新动画不同步，依赖 VChart 修复；需要平滑更新动画时建议保持 false。
   * @default false
   * @example true
   */
  stackCornerRadius?: StackCornerRadius
  /**
   * @description 柱子的最大宽度，可以是像素值或者百分比字符串
   */
  barMaxWidth?: BarMaxWidth
  /**
   * @description 矩形图元样式, 柱状图样式配置, 用于定义图表的柱状图样式, 包括柱状图的颜色, 边框, 圆角等.
   * 支持全局样式或条件样式配置
   * 数据筛选器
   * 若配置selector, 提供数值 selector, 局部数据 selector, 条件维度 selector, 条件指标 selector 共四类数据匹配能力
   * 若未配置selector, 则样式全局生效.
   */
  barStyle?: BarStyle | BarStyle[]
  /**
   * @description 标注点配置, 根据选择的数据, 定义图表的标注点, 包括标注点的位置, 格式, 样式等.
   */
  annotationPoint?: AnnotationPoint | AnnotationPoint[]
  /**
   * @description 维度值标注线，竖直方向展示，能够设置标注线的位置, 样式等
   */
  annotationVerticalLine?: AnnotationVerticalLine | AnnotationVerticalLine[]
  /**
   * @description 数值标注线(包括均值线、最大值线、最小值线等)，水平方向展示，能够设置标注线的位置, 样式等，如需绘制均值线等数值对应的标注线请使用该配置
   */
  annotationHorizontalLine?: AnnotationHorizontalLine | AnnotationHorizontalLine[]
  /**
   * @description 标注区域配置, 根据选择的数据, 定义图表的标注区域, 包括标注区域的位置, 样式等.
   */
  annotationArea?: AnnotationArea | AnnotationArea[]
  /**
   * @description 差异标注线配置，用于绑定两个数据锚点并展示绝对差值或百分比差值。
   */
  annotationDifferenceLine?: AnnotationDifferenceLine | AnnotationDifferenceLine[]
  /**
   * 多项式回归线
   * @description 多项式回归线配置, 包括多项式的阶数、回归线的样式等.
   */
  polynomialRegressionLine?: PolynomialRegressionLine | PolynomialRegressionLine[]
  /**
   * @description 当图表开启透视功能或者指标组合的是否，是否开启维度联动功能
   * 当hover 到某个维度值时，联动高亮其他图表中相同维度值的数据
   */
  dimensionLinkage?: DimensionLinkage
  /**
   * @description 图表语言配置, 支持'zh-CN'与'en-US'两种语言, 另外可以调用 intl.setLocale('zh-CN') 方法设置语言
   * @default 'zh-CN'
   */
  locale?: Locale
}
```

## ColumnParallel

源码：[packages/vseed/src/types/chartType/columnParallel/columnParallel.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/types/chartType/columnParallel/columnParallel.ts#L59)

包导出：`ColumnParallel`

```typescript
/**
 * @description 并列柱状图，适用于多指标并行对比场景，多个柱子并列排列展示不同指标值
 * 适用场景:
 * - 同一维度下多指标并行对比
 * - 多维度数据的横向比较
 * - 指标间关联性分析
 * @encoding
 * 并列柱状图支持以下视觉通道:
 * `xAxis`  : x轴通道, 支持`多个维度`, 按维度值映射至x轴
 * `yAxis`  : y轴通道, 支持`多个指标`, 按指标值映射至y轴
 * `detail` : 细分通道, 支持`多个维度`, 在同一个颜色系列下展示更细粒度的数据时使用
 * `color`  : 颜色通道, 支持`多个维度`或 `一个指标`, 维度颜色用于区分不同的数据系列, 指标颜色用于线性映射指标值到图形颜色
 * `tooltip`: 提示通道, 支持`多个维度`与 `多个指标`, 会在鼠标悬停在数据点上时展示
 * `label`  : 标签通道, 支持`多个维度`与 `多个指标`, 会在数据点上展示数据标签
 * @warning
 * 数据要求:
 * - 至少1个指标字段（度量）
 * - 第一个维度会放至X轴, 其余维度会与指标名称(存在多个指标时)合并, 作为图例项展示.
 * - 所有指标会自动合并为一个指标
 * 默认开启的功能:
 * - 默认开启图例、坐标轴、数据标签、提示信息、指标排序
 * @recommend
 * - 推荐字段配置: `1`个指标, `2`个维度
 * - 支持数据重塑: 至少`1`个指标, `0`个维度
 */
export interface ColumnParallel {
  /**
   * @description 并列柱状图，适用于多指标并行对比场景
   * @example 'columnParallel'
   */
  chartType: 'columnParallel'
  /**
   * @description 数据集, 符合TidyData规范的且已经聚合的数据集，用于定义图表的数据来源和结构, 用户输入的数据集并不需要进行任何处理, VSeed带有强大的数据重塑功能, 会自行进行数据重塑, 并列柱状图的数据最终会被转换为2个维度, 1个指标.
   * @example [{category:'A', value1:100, value2:200}, {category:'B', value1:150, value2:250}]
   */
  dataset: Dataset
  /**
   * @description 维度, 第一个维度被映射到X轴, 其余维度会与指标名称(存在多个指标时)合并, 作为图例项展示.
   * @example [{id: 'category', alias: '类别'}]
   */
  dimensions?: ColumnDimension[]
  /**
   * @description 指标, 并列柱状图的所有指标会自动合并为一个指标, 映射到Y轴, 存在多个指标时, 指标名称会与其余维度合并, 作为图例项展示.
   * @example [{id: 'value1', alias: '指标1'}, {id: 'value2', alias: '指标2'}]
   */
  measures?: ColumnMeasure[]
  /**
   * @description 分页配置, 用于指定分页的字段名, 必须是维度
   */
  page?: Page
  /**
   * @description 图表的背景颜色, 背景颜色可以是颜色字符串, 例如'red', 'blue', 也可以是hex, rgb或rgba'#ff0000', 'rgba(255,0,0,0.5)'
   * @default transparent 默认为透明背景
   */
  backgroundColor?: BackgroundColor
  /**
   * @description 颜色配置, 用于定义图表的颜色方案, 包括颜色列表, 颜色映射, 颜色渐变等.
   */
  color?: Color
  /**
   * @description 标签配置, 用于定义图表的数据标签, 包括数据标签的位置, 格式, 样式等.
   */
  label?: Label
  /**
   * @description 图例配置, 用于定义图表的图例, 包括图例的位置, 格式, 样式等.
   */
  legend?: Legend
  /**
   * 绘图区内边距
   * @description 映射到 VChart 的 region[0].padding，用于为标注、标签等绘图区外扩元素预留空间。
   */
  regionPadding?: RegionPadding
  /**
   * @description 提示信息配置, 用于定义图表的提示信息, 包括提示信息的位置, 格式, 样式等.
   */
  tooltip?: Tooltip
  /**
   * 框选
   * @description 框选配置，用于开启/关闭 brush 框选能力
   */
  brush?: Brush
  /**
   * 动画配置
   * @description 图表动画配置，按图表类型约束可选效果
   */
  animation?: BarLikeAnimation
  /**
   * @description x轴, 类目轴, x轴配置, 用于定义图表的x轴, 包括x轴的位置, 格式, 样式等.
   */
  xAxis?: XBandAxis
  /**
   * @description y轴, 数值轴, y轴配置, 用于定义图表的y轴, 包括y轴的位置, 格式, 样式等.
   */
  yAxis?: YLinearAxis
  /**
   * @description 垂直提示框配置, 用于定义图表的垂直提示框, 包括垂直提示框的颜色、标签样式等.
   */
  crosshairRect?: CrosshairRect
  /**
   * @description 柱图圆角的数值或数组，默认 0，不启用圆角。当 stackCornerRadius 为 false 时，每个图元独立绘制圆角；为 true 时，通过 clip 裁剪整组堆叠柱体。数值设置所有角，数组按左上、右上、右下、左下排列，数据为负值时圆角方向自动翻转。设为 0 可关闭。barStyle.barRadius 可覆盖单个图元的圆角；stackCornerRadius 为 true 时，整组圆角统一使用 cornerRadius，不受 barStyle.barRadius 影响。
   * @default 0
   * @example [4, 4, 0, 0]
   */
  cornerRadius?: CornerRadius
  /**
   * @description 是否使用整组堆叠圆角，默认 false。设为 true 时，通过 clip 裁剪整组柱体，圆角值统一读取 cornerRadius，保留堆叠内部的直角连接，并优先于 barStyle.barRadius（包括条件样式）。设为 false 时，cornerRadius 对每个图元单独生效。注意：开启 stackCornerRadius 会引起更新动画重叠的 bug，整组 clip 裁剪路径与图元更新动画不同步，依赖 VChart 修复；需要平滑更新动画时建议保持 false。
   * @default false
   * @example true
   */
  stackCornerRadius?: StackCornerRadius
  /**
   * @description 柱子的最大宽度，可以是像素值或者百分比字符串
   */
  barMaxWidth?: BarMaxWidth
  /**
   * @description 同一分类下，柱子之间的距离，可以是像素值或者百分比字符串
   */
  barGapInGroup?: BarGapInGroup
  /**
   * @description X轴排序配置, 支持根据维度或指标排序, 以及自定义排序顺序
   * @example
   * sort: {
   *   orderBy: 'profit',
   *   order: 'asc',
   * }
   * sort: {
   *   customOrder:['2019', '2020', '2021']
   * }
   */
  sort?: Sort
  /**
   * @description 图例排序配置, 支持根据维度或指标排序, 以及自定义排序顺序
   * @example
   * sortLegend: {
   *   orderBy: 'profit',
   *   order: 'asc',
   * }
   * sortLegend: {
   *   customOrder:['2019', '2020', '2021']
   * }
   */
  sortLegend?: SortLegend
  /**
   * @description 图表的主题, 主题是优先级较低的功能配置, 包含所有图表类型共用的通用配置, 与单类图表类型共用的图表配置, 内置light与dark两种主题, 用户可以通过Builder自定义主题
   * @default light 默认为亮色主题
   * @example 'dark'
   * @example 'light'
   * @example 'customThemeName'
   */
  theme?: Theme
  /**
   * @description 矩形图元样式, 并列柱状图样式配置, 用于定义图表的并列柱状图样式, 包括并列柱状图的颜色, 边框, 圆角等.
   * 支持全局样式或条件样式配置
   * 数据筛选器
   * 若配置selector, 提供数值 selector, 局部数据 selector, 条件维度 selector, 条件指标 selector 共四类数据匹配能力
   * 若未配置selector, 则样式全局生效.
   */
  barStyle?: BarStyle | BarStyle[]
  /**
   * 标注点
   * @description 标注点配置, 根据选择的数据, 定义图表的标注点, 包括标注点的位置, 格式, 样式等.
   */
  annotationPoint?: AnnotationPoint | AnnotationPoint[]
  /**
   * @description 维度值标注线，竖直方向展示，能够设置标注线的位置, 样式等
   */
  annotationVerticalLine?: AnnotationVerticalLine | AnnotationVerticalLine[]
  /**
   * @description 数值标注线(包括均值线、最大值线、最小值线等)，水平方向展示，能够设置标注线的位置, 样式等，如需绘制均值线等数值对应的标注线请使用该配置
   */
  annotationHorizontalLine?: AnnotationHorizontalLine | AnnotationHorizontalLine[]
  /**
   * 标注区域
   * @description 标注区域配置, 根据选择的数据, 定义图表的标注区域, 包括标注区域的位置, 样式等.
   */
  annotationArea?: AnnotationArea | AnnotationArea[]
  /**
   * @description 差异标注线配置，用于绑定两个数据锚点并展示绝对差值或百分比差值。
   */
  annotationDifferenceLine?: AnnotationDifferenceLine | AnnotationDifferenceLine[]
  /**
   * @description 当图表开启透视功能或者指标组合的是否，是否开启维度联动功能
   * 当hover 到某个维度值时，联动高亮其他图表中相同维度值的数据
   */
  dimensionLinkage?: DimensionLinkage
  /**
   * 语言
   * @description 图表语言配置, 支持'zh-CN'与'en-US'两种语言, 另外可以调用 intl.setLocale('zh-CN') 方法设置语言
   * @default 'zh-CN'
   */
  locale?: Locale
}
```

## ColumnPercent

源码：[packages/vseed/src/types/chartType/columnPercent/columnPercent.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/types/chartType/columnPercent/columnPercent.ts#L57)

包导出：`ColumnPercent`

```typescript
/**
 * @description 百分比柱状图，适用于展示各类别占比关系的场景，Y轴以百分比形式展示数据占比
 * 适用场景:
 * - 不同类别数据的占比对比
 * - 多维度数据的构成分析
 * - 时间序列的占比变化趋势
 * @encoding
 * 百分比柱状图支持以下视觉通道:
 * `xAxis`  : x轴通道, 支持`多个维度`, 按维度值映射至x轴
 * `yAxis`  : y轴通道, 支持`多个指标`, 按指标值映射至y轴
 * `detail` : 细分通道, 支持`多个维度`, 在同一个颜色系列下展示更细粒度的数据时使用
 * `color`  : 颜色通道, 支持`多个维度`或 `一个指标`, 维度颜色用于区分不同的数据系列, 指标颜色用于线性映射指标值到图形颜色
 * `tooltip`: 提示通道, 支持`多个维度`与 `多个指标`, 会在鼠标悬停在数据点上时展示
 * `label`  : 标签通道, 支持`多个维度`与 `多个指标`, 会在数据点上展示数据标签
 * @warning
 * 数据要求:
 * - 至少1个指标字段（度量）
 * - 第一个维度会放至X轴, 其余维度会与指标名称(存在多个指标时)合并, 作为图例项展示.
 * - 所有指标会自动合并为一个指标
 * 默认开启的功能:
 * - 默认开启图例、坐标轴、百分比标签、提示信息、占比计算
 * @recommend
 * - 推荐字段配置: `1`个指标, `2`个维度
 * - 支持数据重塑: 至少`1`个指标, `0`个维度
 */
export interface ColumnPercent {
  /**
   * 百分比柱状图
   * @description 百分比柱状图，以百分比形式展示各类别数据占比关系
   * @type {'columnPercent'}
   * @example 'columnPercent'
   */
  chartType: 'columnPercent'
  /**
   * 数据集
   * @description 符合TidyData规范的且已经聚合的数据集，用于定义图表的数据来源和结构, 用户输入的数据集并不需要进行任何处理, VSeed带有强大的数据重塑功能, 会自行进行数据重塑, 百分比柱状图的数据最终会被转换为2个维度, 1个指标.
   * @type {Array<Record<string|number, any>>}
   * @example [{category:'A', value:30}, {category:'B', value:70}]
   */
  dataset: Dataset
  /**
   * 维度
   * @description 第一个维度被映射到X轴, 其余维度会与指标名称(存在多个指标时)合并, 作为图例项展示.
   * @example [{id: 'category', alias: '类别'}]
   */
  dimensions?: ColumnDimension[]
  /**
   * 指标
   * @description 百分比柱状图指标会自动合并为一个指标, 映射到Y轴, 存在多个指标时, 指标名称会与其余维度合并, 作为图例项展示.
   * @example [{id: 'value', alias: '数值占比', format: 'percent'}]
   */
  measures?: ColumnMeasure[]
  /**
   * @description 分页配置, 用于指定分页的字段名, 必须是维度
   */
  page?: Page
  /**
   * @description 图表的背景颜色, 默认为透明背景, 背景颜色可以是颜色字符串, 例如'red', 'blue', 也可以是hex, rgb或rgba'#ff0000', 'rgba(255,0,0,0.5)'
   */
  backgroundColor?: BackgroundColor
  /**
   * @description 颜色配置, 用于定义图表的颜色方案, 包括颜色列表, 颜色映射, 颜色渐变等.
   */
  color?: Color
  /**
   * @description 标签配置, 用于定义图表的数据标签, 包括数据标签的位置, 格式, 样式等.
   */
  label?: Label
  /**
   * @description 图例配置, 用于定义图表的图例, 包括图例的位置, 格式, 样式等.
   */
  legend?: Legend
  /**
   * 绘图区内边距
   * @description 映射到 VChart 的 region[0].padding，用于为标注、标签等绘图区外扩元素预留空间。
   */
  regionPadding?: RegionPadding
  /**
   * @description 提示信息配置, 用于定义图表的提示信息, 包括提示信息的位置, 格式, 样式等.
   */
  tooltip?: Tooltip
  /**
   * 框选
   * @description 框选配置，用于开启/关闭 brush 框选能力
   */
  brush?: Brush
  /**
   * 动画配置
   * @description 图表动画配置，按图表类型约束可选效果
   */
  animation?: BarLikeAnimation
  /**
   * @description x轴, 类目轴, x轴配置, 用于定义图表的x轴, 包括x轴的位置, 格式, 样式等.
   */
  xAxis?: XBandAxis
  /**
   * @description y轴, 数值轴, y轴配置, 用于定义图表的y轴, 包括y轴的位置, 格式, 样式等.
   */
  yAxis?: YLinearAxis
  /**
   * @description 垂直提示框配置, 用于定义图表的垂直提示框, 包括垂直提示框的颜色、标签样式等.
   */
  crosshairRect?: CrosshairRect
  /**
   * @description 柱图圆角的数值或数组，默认 0，不启用圆角。当 stackCornerRadius 为 false 时，每个图元独立绘制圆角；为 true 时，通过 clip 裁剪整组堆叠柱体。数值设置所有角，数组按左上、右上、右下、左下排列，数据为负值时圆角方向自动翻转。设为 0 可关闭。barStyle.barRadius 可覆盖单个图元的圆角；stackCornerRadius 为 true 时，整组圆角统一使用 cornerRadius，不受 barStyle.barRadius 影响。
   * @default 0
   * @example [4, 4, 0, 0]
   */
  cornerRadius?: CornerRadius
  /**
   * @description 是否使用整组堆叠圆角，默认 false。设为 true 时，通过 clip 裁剪整组柱体，圆角值统一读取 cornerRadius，保留堆叠内部的直角连接，并优先于 barStyle.barRadius（包括条件样式）。设为 false 时，cornerRadius 对每个图元单独生效。注意：开启 stackCornerRadius 会引起更新动画重叠的 bug，整组 clip 裁剪路径与图元更新动画不同步，依赖 VChart 修复；需要平滑更新动画时建议保持 false。
   * @default false
   * @example true
   */
  stackCornerRadius?: StackCornerRadius
  /**
   * @description 柱子的最大宽度，可以是像素值或者百分比字符串
   */
  barMaxWidth?: BarMaxWidth
  /**
   * @description X轴排序配置, 支持根据维度或指标排序, 以及自定义排序顺序
   * @example
   * sort: {
   *   orderBy: 'profit',
   *   order: 'asc',
   * }
   * sort: {
   *   customOrder:['2019', '2020', '2021']
   * }
   */
  sort?: Sort
  /**
   * @description 图例排序配置, 支持根据维度或指标排序, 以及自定义排序顺序
   * @example
   * sortLegend: {
   *   orderBy: 'profit',
   *   order: 'asc',
   * }
   * sortLegend: {
   *   customOrder:['2019', '2020', '2021']
   * }
   */
  sortLegend?: SortLegend
  /**
   * @description  图表的主题, 主题是优先级较低的功能配置, 包含所有图表类型共用的通用配置, 与单类图表类型共用的图表配置, 内置light与dark两种主题, 用户可以通过Builder自定义主题
   * @default light 默认为亮色主题
   * @example 'dark'
   * @example 'light'
   * @example 'customThemeName'
   */
  theme?: Theme
  /**
   * @description 矩形图元样式, 用于定义图表的矩形图元样式, 包括矩形图元的颜色, 边框, 圆角等.
   * 支持全局样式或条件样式配置
   * 数据筛选器
   * 若配置selector, 提供数值 selector, 局部数据 selector, 条件维度 selector, 条件指标 selector 共四类数据匹配能力
   * 若未配置selector, 则样式全局生效.
   */
  barStyle?: BarStyle | BarStyle[]
  /**
   * @description 标注点配置, 根据选择的数据, 定义图表的标注点, 包括标注点的位置, 格式, 样式等.
   */
  annotationPoint?: AnnotationPoint | AnnotationPoint[]
  /**
   * @description 维度值标注线，竖直方向展示，能够设置标注线的位置, 样式等
   */
  annotationVerticalLine?: AnnotationVerticalLine | AnnotationVerticalLine[]
  /**
   * @description 数值标注线(包括均值线、最大值线、最小值线等)，水平方向展示，能够设置标注线的位置, 样式等，如需绘制均值线等数值对应的标注线请使用该配置
   */
  annotationHorizontalLine?: AnnotationHorizontalLine | AnnotationHorizontalLine[]
  /**
   * @description 标注区域配置, 根据选择的数据, 定义图表的标注区域, 包括标注区域的位置, 样式等.
   */
  annotationArea?: AnnotationArea | AnnotationArea[]
  /**
   * @description 当图表开启透视功能或者指标组合的是否，是否开启维度联动功能
   * 当hover 到某个维度值时，联动高亮其他图表中相同维度值的数据
   */
  dimensionLinkage?: DimensionLinkage
  /**
   * @description 图表语言配置, 支持'zh-CN'与'en-US'两种语言, 另外可以调用 intl.setLocale('zh-CN') 方法设置语言
   * @default 'zh-CN'
   */
  locale?: Locale
}
```

## Donut

源码：[packages/vseed/src/types/chartType/donut/donut.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/types/chartType/donut/donut.ts#L43)

包导出：`Donut`

```typescript
/**
 * @description 环形图，适用于展示单一维度数据的占比关系，中心留有空白区域可展示汇总信息
 * 适用场景:
 * - 需要同时展示整体数据和各部分占比
 * - 强调数据的整体与部分关系
 * - 中心区域需要展示关键指标或标题
 * @encoding
 * 环形图支持以下视觉通道:
 * `angle`  : 角度通道, 支持`多个指标`, 按指标值映射至扇形角度
 * `detail` : 细分通道, 支持`多个维度`, 在同一个颜色系列下展示更细粒度的数据时使用
 * `color`  : 颜色通道, 支持`多个维度`或 `一个指标`, 维度颜色用于区分不同的数据系列, 指标颜色用于线性映射指标值到图形颜色
 * `tooltip`: 提示通道, 支持`多个维度`与 `多个指标`, 会在鼠标悬停在数据点上时展示
 * `label`  : 标签通道, 支持`多个维度`与 `多个指标`, 会在数据点上展示数据标签
 * @warning
 * 数据要求:
 * - 至少1个指标字段（度量）
 * - 所有维度会与指标名称(存在多个指标时)合并, 作为图例项展示.
 * - 所有指标会自动合并为一个指标
 * 默认开启的功能:
 * - 默认开启图例、数据标签、提示信息、占比计算；中心文本需显式配置 centerText
 * @recommend
 * - 推荐字段配置: `1`个指标, `2`个维度
 * - 支持数据重塑: 至少`1`个指标, `0`个维度
 */
export interface Donut {
  /**
   * 环形图
   * @description 环形图，中心留有空白区域的饼图变体
   * @type {'donut'}
   * @example 'donut'
   */
  chartType: 'donut'
  /** @description 外半径占可用半径的比例，范围 (0, 1]，默认 0.8。 */
  outerRadius?: number
  /** @description 内半径占可用半径的比例，范围 [0, outerRadius)。默认外半径的 80%。 */
  innerRadius?: number
  /** @description 起始角度，单位为度，默认 -90。 */
  startAngle?: number
  /** @description 结束角度，默认 startAngle + 360；跨度必须在 (0, 360]。 */
  endAngle?: number
  /** @description 扇区边框、圆角和悬停效果。 */
  pieStyle?: PieStyle
  /** @description 固定中心主副文本；配置后默认开启，不随扇区交互变化。 */
  centerText?: CenterText
  /**
   * 数据集
   * @description 符合TidyData规范的且已经聚合的数据集，用于定义图表的数据来源和结构, 用户输入的数据集并不需要进行任何处理, VSeed带有强大的数据重塑功能, 会自行进行数据重塑, 环形图的数据最终会被转换为1个维度, 1个指标.
   * @type {Array<Record<string|number, any>>}
   * @example [{category:'A', value:30}, {category:'B', value:70}]
   */
  dataset: Dataset
  /**
   * 维度
   * @description 环形图的所有维度会与指标名称(存在多个指标时)合并成1个维度, 映射到饼图的角度, 并作为图例项展示.
   * @example [{id: 'category', alias: '类别'}]
   */
  dimensions?: DonutDimension[]
  /**
   * 指标
   * @description 环形图的所有指标会自动合并为一个指标, 映射到饼图的半径, 存在多个指标时, 指标名称会与其余维度合并, 并作为图例项展示.
   * @example [{id: 'value', alias: '数值占比', format: 'percent'}]
   */
  measures?: DonutMeasure[]
  /**
   * @description 分页配置, 用于指定分页的字段名, 必须是维度
   */
  page?: Page
  /**
   * 图表的背景颜色
   * @default transparent 默认为透明背景
   * @description 背景颜色可以是颜色字符串, 例如'red', 'blue', 也可以是hex, rgb或rgba'#ff0000', 'rgba(255,0,0,0.5)'
   */
  backgroundColor?: BackgroundColor
  /**
   * 颜色
   * @description 颜色配置, 用于定义图表的颜色方案, 包括颜色列表, 颜色映射, 颜色渐变等.
   */
  color?: Color
  /**
   * 标签
   * @description 标签配置, 用于定义图表的数据标签, 包括数据标签的位置, 格式, 样式等.
   */
  label?: PieLabel
  /**
   * 图例
   * @description 图例配置, 用于定义图表的图例, 包括图例的位置, 格式, 样式等.
   */
  legend?: Legend
  /**
   * 提示信息
   * @description 提示信息配置, 用于定义图表的提示信息, 包括提示信息的位置, 格式, 样式等.
   */
  tooltip?: Tooltip
  /**
   * 框选
   * @description 框选配置，用于开启/关闭 brush 框选能力
   */
  brush?: Brush
  /**
   * 动画配置
   * @description 图表动画配置，按图表类型约束可选效果
   */
  animation?: PieLikeAnimation
  /**
   * 图表的主题, 主题是优先级较低的功能配置, 包含所有图表类型共用的通用配置, 与单类图表类型共用的图表配置
   * @default light 默认为亮色主题
   * @description 内置light与dark两种主题, 用户可以通过Builder自定义主题
   * @example 'dark'
   * @example 'light'
   * @example 'customThemeName'
   */
  theme?: Theme
  /**
   * 语言
   * @description 图表语言配置, 支持'zh-CN'与'en-US'两种语言, 另外可以调用 intl.setLocale('zh-CN') 方法设置语言
   * @default 'zh-CN'
   */
  locale?: Locale
}
```

## DualAxis

源码：[packages/vseed/src/types/chartType/dualAxis/dualAxis.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/types/chartType/dualAxis/dualAxis.ts#L63)

包导出：`DualAxis`

```typescript
/**
 * @description 双轴图，适用于展示两个不同量级或不同单位指标的对比关系，包含主坐标轴和次坐标轴
 * 适用场景:
 * - 不同量级指标的对比分析
 * - 相关性指标的趋势比较
 * - 需要同时展示数值和增长率等复合指标
 * - 支持不同类型图表组合（如折线图+柱状图/ 折线图+面积图/ 面积图+柱状图）
 * @encoding
 * 双轴图支持以下视觉通道:
 * `xAxis`          : x轴通道, 支持`多个维度`, 按维度值映射至x轴
 * `primaryYAxis`   : 主轴y轴通道, 支持`多个指标`, 将指标映射至主轴
 * `secondaryYAxis` : 次轴y轴通道, 支持`多个指标`, 将指标映射至次轴
 * `detail`         : 细分通道, 支持`多个维度`, 在同一个颜色系列下展示更细粒度的数据时使用
 * `color`          : 颜色通道, 支持`多个维度`或 `一个指标`, 维度颜色用于区分不同的数据系列, 指标颜色用于线性映射指标值到图形颜色
 * `tooltip`        : 提示通道, 支持`多个维度`与 `多个指标`, 会在鼠标悬停在数据点上时展示
 * `label`          : 标签通道, 支持`多个维度`与 `多个指标`, 会在数据点上展示数据标签
 * @warning
 * 数据要求:
 * - 至少1个指标字段（度量）
 * - 支持指标组, 第一组指标会放置(主轴)左轴, 第二组指标会放置(次轴)右轴
 * - 第一个维度会放至X轴, 其余维度会与指标名称(存在多个指标时)合并, 作为图例项展示.
 * - 两组指标字段可分别映射到左右两个Y轴, 一个指标组内的所有会自动合并为一个指标
 * 默认开启的功能:
 * - 默认开启坐标轴、图例、数据标签、提示信息
 * @recommend
 * - 推荐字段配置: `2`个指标, `2`个维度
 * - 支持数据重塑: 至少`1`个指标, `0`个维度
 */
export interface DualAxis {
  /** @description 动画开关与图表切换形变配置 */
  animation?: Animation
  /**
   * @description 双轴图，展示两个不同量级指标对比关系的复合图表
   * @example 'dualAxis'
   */
  chartType: 'dualAxis'
  /**
   * @description 数据集, 符合TidyData规范的且已经聚合的数据集，用于定义图表的数据来源和结构, 用户输入的数据集并不需要进行任何处理, VSeed带有强大的数据重塑功能, 会自行进行数据重塑, 双轴图的数据最终会被转换为2个维度, 1或2个指标(取决于用户是否配置了指标组).
   * @example [{month:'1月', value:100, growth:0.2}, {month:'2月', value:150, growth:0.5}]
   */
  dataset: Dataset
  /**
   * @description 维度, 第一个维度会放至X轴, 其余维度会与指标名称(存在多个指标时)合并, 作为图例项展示.
   * @example [{id: 'month', alias: '月份'}]
   */
  dimensions?: DualAxisDimension[]
  /**
   * @description 双轴图指标
   * 对于encoding中映射到primaryYAxis和secondaryYAxis的指标,
   * 可以通过设置`parentId`属性, 将指标进行分组，不同分组的指标会显示到不同子图中，
   * 也可以设置`chartType`属性，来指定不同指标组的图表类型。
   * @example [{ id: 'value', encoding: 'primaryYAxis' }, { id: 'growth', encoding: 'secondaryYAxis' }]
   */
  measures?: DualAxisMeasure[]
  /**
   * @description 分页配置
   */
  page?: Page
  /**
   * @description 用于定义双轴图的两根轴的刻度是否对齐, 当measures有多组时, alignTicks可以配置为数组, 每项对应一个双轴图的刻度是否对齐.
   * @example {"chartType":"dualAxis","dataset":[{"date":"2019","profit":10,"sales":100},{"date":"2020","profit":30,"sales":200},{"date":"2021","profit":30,"sales":300},{"date":"2022","profit":50,"sales":500}],"alignTicks":[false,true],"dualMeasures":[{"primaryMeasures":[{"id":"profit"}],"secondaryMeasures":[{"id":"sales"}]},{"primaryMeasures":[{"id":"profit"}],"secondaryMeasures":[{"id":"sales"}]}]}
   */
  alignTicks?: boolean | boolean[]
  /**
   * @description 双轴图的主Y轴配置, 用于定义双轴图的主Y轴, 包括主Y轴的位置, 样式等. 当measures有多组时, primaryYAxis可以配置为数组, 每项对应一个双轴图的主Y轴.
   */
  primaryYAxis?: YLinearAxis | YLinearAxis[]
  /**
   * @description 双轴图的次Y轴配置, 用于定义双轴图的次Y轴, 包括次Y轴的位置, 样式等. 当measures有多组时, secondaryYAxis可以配置为数组, 每项对应一个双轴图的次Y轴.
   */
  secondaryYAxis?: YLinearAxis | YLinearAxis[]
  /**
   * @description x轴, 类目轴, x轴配置, 用于定义图表的x轴, 包括x轴的位置, 格式, 样式等.
   */
  xAxis?: XBandAxis
  /**
   * @default transparent 默认为透明背景
   * @description 图表的背景颜色, 背景颜色可以是颜色字符串, 例如'red', 'blue', 也可以是hex, rgb或rgba'#ff0000', 'rgba(255,0,0,0.5)'
   */
  backgroundColor?: BackgroundColor
  /**
   * @description 颜色配置, 用于定义图表的颜色方案, 包括颜色列表, 颜色映射, 颜色渐变等.
   */
  color?: Color
  /**
   * @description 标签配置, 用于定义图表的数据标签, 包括数据标签的位置, 格式, 样式等.
   */
  label?: Label
  /**
   * @description 图例配置, 用于定义图表的图例, 包括图例的位置, 格式, 样式等.
   */
  legend?: Legend
  /**
   * @description 提示信息配置, 用于定义图表的提示信息, 包括提示信息的位置, 格式, 样式等.
   */
  tooltip?: Tooltip
  /**
   * 框选
   * @description 框选配置，用于开启/关闭 brush 框选能力
   */
  brush?: Brush
  /**
   * 垂直提示框
   * @description 垂直提示框配置, 用于定义图表的垂直提示框, 包括垂直提示框的颜色、标签样式等.
   */
  crosshairRect?: CrosshairRect
  /**
   * @description 柱图圆角的数值或数组，默认 0，不启用圆角。当 stackCornerRadius 为 false 时，每个图元独立绘制圆角；为 true 时，通过 clip 裁剪整组堆叠柱体。数值设置所有角，数组按左上、右上、右下、左下排列，数据为负值时圆角方向自动翻转。设为 0 可关闭。barStyle.barRadius 可覆盖单个图元的圆角；stackCornerRadius 为 true 时，整组圆角统一使用 cornerRadius，不受 barStyle.barRadius 影响。
   * @default 0
   * @example [4, 4, 0, 0]
   */
  cornerRadius?: CornerRadius
  /**
   * @description 是否使用整组堆叠圆角，默认 false。设为 true 时，通过 clip 裁剪整组柱体，圆角值统一读取 cornerRadius，保留堆叠内部的直角连接，并优先于 barStyle.barRadius（包括条件样式）。设为 false 时，cornerRadius 对每个图元单独生效。注意：开启 stackCornerRadius 会引起更新动画重叠的 bug，整组 clip 裁剪路径与图元更新动画不同步，依赖 VChart 修复；需要平滑更新动画时建议保持 false。
   * @default false
   * @example true
   */
  stackCornerRadius?: StackCornerRadius
  /**
   * @description X轴排序配置, 支持根据维度或指标排序, 以及自定义排序顺序
   * @example
   * sort: {
   *   orderBy: 'profit',
   *   order: 'asc',
   * }
   * sort: {
   *   customOrder:['2019', '2020', '2021']
   * }
   */
  sort?: Sort
  /**
   * @description 图例排序配置, 支持根据维度或指标排序, 以及自定义排序顺序
   * @example
   * sortLegend: {
   *   orderBy: 'profit',
   *   order: 'asc',
   * }
   * sortLegend: {
   *   customOrder:['2019', '2020', '2021']
   * }
   */
  sortLegend?: SortLegend
  /**
   * @description 图表的主题, 主题是优先级较低的功能配置, 包含所有图表类型共用的通用配置, 与单类图表类型共用的图表配置, 内置light与dark两种主题, 用户可以通过Builder自定义主题
   * @default light 默认为亮色主题
   * @example 'dark'
   * @example 'light'
   * @example 'customThemeName'
   */
  theme?: Theme
  /**
   * @description 柱子的最大宽度，可以是像素值或者百分比字符串
   */
  barMaxWidth?: BarMaxWidth
  /**
   * @description 同一分类下，柱子之间的距离，可以是像素值或者百分比字符串
   */
  barGapInGroup?: BarGapInGroup
  /**
   * 矩形图元样式
   * @description 条形图样式配置, 用于定义图表的条形图样式, 包括条形图的颜色, 边框, 圆角等.
   * 支持全局样式或条件样式配置
   * 数据筛选器
   * 若配置selector, 提供数值 selector, 局部数据 selector, 条件维度 selector, 条件指标 selector 共四类数据匹配能力
   * 若未配置selector, 则样式全局生效.
   */
  barStyle?: BarStyle | BarStyle[]
  /**
   * 线图元样式
   * @description 线图元样式配置, 用于定义图表的线图元样式, 包括线图元的颜色, 透明度, 曲线等.
   * 支持全局样式或条件样式配置
   * 数据筛选器
   * 若配置selector, 提供数值 selector, 局部数据 selector, 条件维度 selector, 条件指标 selector 共四类数据匹配能力
   * 若未配置selector, 则样式全局生效.
   */
  lineStyle?: LineStyle | LineStyle[]
  /**
   * 点图元样式
   * @description 点图元样式配置, 用于定义图表的点图元样式, 包括点图元的颜色, 边框等.
   * 支持全局样式或条件样式配置
   * 数据筛选器
   * 若配置selector, 提供数值 selector, 局部数据 selector, 条件维度 selector, 条件指标 selector 共四类数据匹配能力
   * 若未配置selector, 则样式全局生效.
   */
  pointStyle?: PointStyle | PointStyle[]
  /**
   * 面积图元样式
   * @description 面积图元样式配置, 用于定义图表的面积图元样式, 包括面积图元的颜色, 透明度, 边框等.
   * 支持全局样式或条件样式配置
   * 数据筛选器
   * 若配置selector, 提供数值 selector, 局部数据 selector, 条件维度 selector, 条件指标 selector 共四类数据匹配能力
   * 若未配置selector, 则样式全局生效.
   */
  areaStyle?: AreaStyle | AreaStyle[]
  /**
   * @description 标注点配置, 根据选择的数据, 定义图表的标注点, 包括标注点的位置, 格式, 样式等.
   */
  annotationPoint?: AnnotationPoint | AnnotationPoint[]
  /**
   * @description 维度值标注线，竖直方向展示，能够设置标注线的位置, 样式等
   */
  annotationVerticalLine?: AnnotationVerticalLine | AnnotationVerticalLine[]
  /**
   * @description 数值标注线(包括均值线、最大值线、最小值线等)，水平方向展示，能够设置标注线的位置, 样式等，如需绘制均值线等数值对应的标注线请使用该配置
   */
  annotationHorizontalLine?: AnnotationHorizontalLine | AnnotationHorizontalLine[]
  /**
   * @description 标注区域配置, 根据选择的数据, 定义图表的标注区域, 包括标注区域的位置, 样式等.
   */
  annotationArea?: AnnotationArea | AnnotationArea[]
  /**
   * @description 当图表开启透视功能或者指标组合的是否，是否开启维度联动功能
   * 当hover 到某个维度值时，联动高亮其他图表中相同维度值的数据
   */
  dimensionLinkage?: DimensionLinkage
  /**
   * @description 国际化配置, 图表语言配置, 支持'zh-CN'与'en-US'两种语言, 另外可以调用 intl.setLocale('zh-CN') 方法设置语言
   * @default 'zh-CN'
   */
  locale?: Locale
}
```

## Funnel

源码：[packages/vseed/src/types/chartType/funnel/funnel.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/types/chartType/funnel/funnel.ts#L40)

包导出：`Funnel`

```typescript
/**
 * @description 漏斗图，用于展示单一维度数据的占比关系
 * 适用场景:
 * 漏斗图适用场景:
 * - 适合用来分析具有多个连续、规范化步骤的流程，并清晰地展示在每个环节的数据流失或转化情况
 * @encoding
 * 漏斗图支持以下视觉通道:
 * `size`   : 大小通道, 支持`多个指标`, 按指标值映射至漏斗宽度
 * `detail` : 细分通道, 支持`多个维度`, 在同一个颜色系列下展示更细粒度的数据时使用
 * `color`  : 颜色通道, 支持`多个维度`或 `一个指标`, 维度颜色用于区分不同的数据系列, 指标颜色用于线性映射指标值到图形颜色
 * `tooltip`: 提示通道, 支持`多个维度`与 `多个指标`, 会在鼠标悬停在数据点上时展示
 * `label`  : 标签通道, 支持`多个维度`与 `多个指标`, 会在数据点上展示数据标签
 * @warning
 * 数据要求:
 * - 至少1个数值字段（指标）
 * - 所有维度会与指标名称(存在多个指标时)合并成一个维度, 作为图例项展示
 * - 所有指标会自动合并为一个指标
 * 默认开启的功能:
 * - 默认开启图例、数据标签、提示信息、占比计算
 * @recommend
 * - 推荐字段配置: `1`个指标, `1`个维度
 * - 支持数据重塑: 至少`1`个指标, `0`个维度
 */
export interface Funnel {
  /**
   * 漏斗图
   * @description 漏斗图，展示单一维度数据的占比关系
   * @type {'funnel'}
   * @example 'funnel'
   */
  chartType: 'funnel'
  /**
   * 数据集
   * @description 符合TidyData规范的且已经聚合的数据集，用于定义图表的数据来源和结构, 用户输入的数据集并不需要进行任何处理, VSeed带有强大的数据重塑功能, 会自行进行数据重塑, 饼图的数据最终会被转换为1个维度, 1个指标.
   * @type {Array<Record<string|number, any>>}
   * @example [{category:'A', value:30}, {category:'B', value:70}]
   */
  dataset: Dataset
  /**
   * 维度
   * @description 漏斗图的所有维度会与指标名称(存在多个指标时)合并成一个维度,并作为图例项展示
   * @example [{id: 'category', alias: '类别'}]
   */
  dimensions?: FunnelDimension[]
  /**
   * 指标
   * @description 漏斗图的所有指标会自动合并为一个指标, 存在多个指标时, 指标名称会与其余维度合并, 作为图例项展示.
   * @example [{id: 'value', alias: '数值占比', format: 'percent'}]
   */
  measures?: FunnelMeasure[]
  /**
   * @description 分页配置
   */
  page?: Page
  /**
   * 图表的背景颜色
   * @default transparent 默认为透明背景
   * @description 背景颜色可以是颜色字符串, 例如'red', 'blue', 也可以是hex, rgb或rgba'#ff0000', 'rgba(255,0,0,0.5)'
   */
  backgroundColor?: BackgroundColor
  /**
   * @description 线性渐变颜色配置, 用于定义图表的颜色方案
   */
  color?: Color
  /**
   * @description 标签配置, 用于定义图表的数据标签, 包括数据标签的位置, 格式, 样式等.
   */
  label?: Label
  /**
   * @description 颜色图例配置, 用于定义图表的图例, 包括图例的位置, 格式, 样式等.
   */
  legend?: ColorLegend
  /**
   * 提示信息
   * @description 提示信息配置, 用于定义图表的提示信息, 包括提示信息的位置, 格式, 样式等.
   */
  tooltip?: Tooltip
  /**
   * 框选
   * @description 框选配置，用于开启/关闭 brush 框选能力
   */
  brush?: Brush
  /**
   * 图表的主题, 主题是优先级较低的功能配置, 包含所有图表类型共用的通用配置, 与单类图表类型共用的图表配置
   * @default light 默认为亮色主题
   * @description 内置light与dark两种主题, 用户可以通过Builder自定义主题
   * @example 'dark'
   * @example 'light'
   * @example 'customThemeName'
   */
  theme?: Theme
  /**
   * 语言
   * @description 图表语言配置, 支持'zh-CN'与'en-US'两种语言, 另外可以调用 intl.setLocale('zh-CN') 方法设置语言
   * @default 'zh-CN'
   */
  locale?: Locale
}
```

## Heatmap

源码：[packages/vseed/src/types/chartType/heatmap/heatmap.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/types/chartType/heatmap/heatmap.ts#L42)

包导出：`Heatmap`

```typescript
/**
 * @description 热力图，通过二维矩阵的颜色深浅展示数据的分布和强弱关系
 * 适用场景:
 * - 大规模二维数据的密度和强度展示
 * - 分类与数值的关联分析
 * - 时间序列与类别的交叉对比
 * @encoding
 * 热力图支持以下视觉通道:
 * `xAxis`      : x轴通道, 支持`多个维度`, 按维度值映射至x轴
 * `yAxis`      : y轴通道, 支持`多个维度`, 按维度值映射至y轴
 * `detail` : 细分通道, 支持`多个维度`, 在同一个颜色系列下展示更细粒度的数据时使用
 * `color`  : 颜色通道, 支持`一个指标`, 按指标值映射至颜色
 * `tooltip`: 提示通道, 支持`多个维度`与 `多个指标`, 会在鼠标悬停在数据点上时展示
 * `label`  : 标签通道, 支持`多个维度`与 `多个指标`, 会在数据点上展示数据标签
 * @warning
 * 数据要求:
 * - 至少2个维度字段，用于确定热力图的行和列
 * - 至少1个数值字段（度量），用于映射颜色深浅
 * - 支持多个指标时，通常选择一个指标进行颜色映射
 * 默认开启的功能:
 * - 默认开启图例、坐标轴、数据标签、提示信息、数值缩放
 * @recommend
 * - 推荐字段配置: `1`个指标, `2`个维度
 * - 支持数据重塑: 至少`1`个指标, `0`个维度
 */
export interface Heatmap {
  /** @description 动画开关与图表切换形变配置 */
  animation?: Animation
  /**
   * 热力图
   * @description 热力图，通过二维矩阵的颜色深浅展示数据的分布和强弱关系
   * @type {'heatmap'}
   * @example 'heatmap'
   */
  chartType: 'heatmap'
  /**
   * 数据集
   * @description 符合TidyData规范的且已经聚合的数据集，用于定义图表的数据来源和结构, 用户输入的数据集并不需要进行任何处理, VSeed带有强大的数据重塑功能, 会自行进行数据重塑, 热力图的数据最终会被转换为2个维度, 1个指标.
   * @type {Array<Record<string|number, any>>}
   * @example [{month:'1月', value:100}, {month:'2月', value:150}, {month:'3月', value:120}]
   */
  dataset: Dataset
  /**
   * 维度
   * @description 热力图的第一个维度被映射到角度轴, 其余维度会与指标名称(存在多个指标时)合并, 作为图例项展示.
   * @example [{id: 'category', alias: '类别'}]
   */
  dimensions?: HeatmapDimension[]
  /**
   * 指标
   * @description 热力图的指标会自动合并为一个指标, 映射到半径轴, 存在多个指标时, 指标名称会与其余维度合并, 作为图例项展示.
   * @example [{id: 'value', alias: '数值'}]
   */
  measures?: HeatmapMeasure[]
  /**
   * @description 分页配置
   */
  page?: Page
  /**
   * 图表的背景颜色
   * @default transparent 默认为透明背景
   * @description 背景颜色可以是颜色字符串, 例如'red', 'blue', 也可以是hex, rgb或rgba'#ff0000', 'rgba(255,0,0,0.5)'
   */
  backgroundColor?: BackgroundColor
  /**
   * 颜色
   * @description 颜色配置, 用于定义图表的颜色方案, 包括颜色列表, 颜色映射, 颜色渐变等.
   */
  color?: Color
  /**
   * @description 热力图标签配置, 用于定义图表的数据标签, 自动开启标签反色, 确保标签可读性.
   */
  label?: Label
  /**
   * 图例
   * @description 热力图的颜色图例配置, 用于定义图表的图例, 包括图例的位置, 格式, 样式等.
   */
  legend?: ColorLegend
  /**
   * 提示信息
   * @description 热力图的提示信息配置, 用于定义图表的提示信息, 包括提示信息的位置, 格式, 样式等.
   */
  tooltip?: Tooltip
  /**
   * 框选
   * @description 框选配置，用于开启/关闭 brush 框选能力
   */
  brush?: Brush
  /**
   * 图表的主题, 主题是优先级较低的功能配置, 包含所有图表类型共用的通用配置, 与单类图表类型共用的图表配置
   * @default light 默认为亮色主题
   * @description 内置light与dark两种主题, 用户可以通过Builder自定义主题
   * @example 'dark'
   * @example 'light'
   * @example 'customThemeName'
   */
  theme?: Theme
  /**
   * 语言
   * @description 图表语言配置, 支持'zh-CN'与'en-US'两种语言, 另外可以调用 intl.setLocale('zh-CN') 方法设置语言
   * @default 'zh-CN'
   */
  locale?: Locale
}
```

## HierarchySankey

源码：[packages/vseed/src/types/chartType/hierarchySankey/hierarchySankey.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/types/chartType/hierarchySankey/hierarchySankey.ts#L32)

包导出：`HierarchySankey`

```typescript
/**
 * @description 层级桑基图，用于展示层级流向数据，通过树形节点与流向连线表示层级关系与流量大小
 * 适用场景:
 * - 展示从上游到下游的层级流转关系
 * - 强调树形结构中的流量分配与路径传递
 * @encoding
 * 层级桑基图支持以下视觉通道:
 * `hierarchy`: 层级通道, 支持`多个维度`
 * `size`: 大小通道, 支持`一个指标`
 * `label`: 标签通道, 支持`多个维度`与 `多个指标`
 * `tooltip`: 提示通道, 支持`多个维度`与 `多个指标`
 * @warning
 * 数据要求:
 * - 至少1个维度字段用于构造层级结构
 * - 至少1个数值字段（度量）用于映射流量大小
 * - advanced pipeline 需要将 tidyData 转换为 VChart 支持的树形 children 结构
 */
export interface HierarchySankey {
  /**
   * 层级桑基图
   * @description 层级桑基图，展示层级结构中的流向关系和流量大小
   * @type {'hierarchySankey'}
   * @example 'hierarchySankey'
   */
  chartType: 'hierarchySankey'
  /**
   * 数据集
   * @description 符合 TidyData 规范且已经聚合的数据集，用于定义图表的数据来源和结构
   * @type {Array<Record<string|number, any>>}
   * @example [{region: '华北', province: '河北', value: 30}, {region: '华南', province: '广东', value: 70}]
   */
  dataset: Dataset
  /**
   * 维度
   * @description 维度配置，用于定义层级结构，支持 hierarchy / label / tooltip 通道
   * @example [{id: 'region', alias: '区域'}, {id: 'province', alias: '省份'}]
   */
  dimensions?: HierarchyDimension[]
  /**
   * 指标
   * @description 指标配置，用于定义流量大小，支持 size / label / tooltip 通道
   * @example [{id: 'value', alias: '流量'}]
   */
  measures?: HierarchyMeasure[]
  /**
   * 分页配置
   * @description 用于指定分页的字段名, 必须是维度
   */
  page?: Page
  /**
   * 图表的背景颜色
   * @default transparent 默认为透明背景
   * @description 背景颜色可以是颜色字符串, 例如 'red', 'blue', 也可以是 hex, rgb 或 rgba, 如 '#ff0000', 'rgba(255,0,0,0.5)'
   */
  backgroundColor?: BackgroundColor
  /**
   * 颜色
   * @description 颜色配置, 用于定义图表的颜色方案, 包括颜色列表, 颜色映射, 颜色渐变等
   */
  color?: Color
  /**
   * 标签
   * @description 标签配置, 用于定义图表的数据标签, 包括位置, 格式, 样式等
   */
  label?: Label
  /**
   * 图例
   * @description 图例配置, 用于定义层级桑基图颜色图例的显示、位置与样式
   */
  legend?: Legend
  /**
   * 提示信息
   * @description 提示信息配置, 用于定义图表的提示信息, 包括内容, 格式, 样式等
   */
  tooltip?: Tooltip
  /**
   * 图表的主题
   * @default light 默认为亮色主题
   * @description 内置 light 与 dark 两种主题, 用户可以通过 Builder 自定义主题
   * @example 'dark'
   * @example 'light'
   */
  theme?: Theme
  /**
   * 语言
   * @description 图表语言配置, 支持 'zh-CN' 与 'en-US' 两种语言
   * @default 'zh-CN'
   */
  locale?: Locale
}
```

## Histogram

源码：[packages/vseed/src/types/chartType/histogram/histogram.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/types/chartType/histogram/histogram.ts#L39)

包导出：`Histogram`

```typescript
/**
 * @description 直方图，适用于展示数据分布情况的场景，X轴为数值轴（连续数据），Y轴为数值轴（连续数据），柱子纵向排列
 * 适用场景:
 * - 展示数据的分布情况，如频率分布、概率分布等
 * - 分析数据的集中趋势和离散程度
 * - 识别数据中的异常值和模式
 * @encoding
 * 直方图支持以下视觉通道:
 * `xAxis`  : x轴通道, 支持`一个维度`, 按维度值分箱计算后显示到x轴
 */
export interface Histogram {
  /**
   * @description 直方图，适用于展示数据分布情况
   */
  chartType: 'histogram'
  /**
   * @description 符合TidyData规范的且已经聚合的数据集，用于定义图表的数据来源和结构, 用户输入的数据集并不需要进行任何处理, VSeed带有强大的数据重塑功能, 会自行进行数据重塑, 柱状图的数据最终会被转换为2个维度, 1个指标.
   * @type {Array<Record<string|number, any>>}
   * @example [{category:'A', value:100}, {category:'B', value:200}]
   */
  dataset: Dataset
  /**
   * @description 直方图通常不需要维度
   * @example [{id: "category", alias: "类别"}]
   */
  dimensions?: HistogramDimension[]
  /**
   * @description 直方图仅支持一个维度，并且数据为离散数据
   * @example [{id: "value", alias: "数值"}]
   */
  measures?: HistogramMeasure[]
  /**
   * @description 分页配置
   */
  page?: Page
  /**
   * @description 图表的背景颜色, 背景颜色可以是颜色字符串, 默认为透明背景, 例如'red', 'blue', 也可以是hex, rgb或rgba'#ff0000', 'rgba(255,0,0,0.5)'
   */
  backgroundColor?: BackgroundColor
  /**
   * @description 颜色配置, 用于定义图表的颜色方案, 包括颜色列表, 颜色映射, 颜色渐变等.
   */
  color?: Color
  /**
   * @description 标签配置, 用于定义图表的数据标签, 包括数据标签的位置, 格式, 样式等.
   */
  label?: Label
  /**
   * @description 图例配置, 用于定义图表的图例, 包括图例的位置, 格式, 样式等.
   */
  legend?: Legend
  /**
   * @description 提示信息配置, 用于定义图表的提示信息, 包括提示信息的位置, 格式, 样式等.
   */
  tooltip?: Tooltip
  /**
   * 框选
   * @description 框选配置，用于开启/关闭 brush 框选能力
   */
  brush?: Brush
  /**
   * @description x轴, 数值轴, x轴配置, 用于定义图表的x轴, 包括x轴的位置, 格式, 样式等.
   */
  xAxis?: XLinearAxis
  /**
   * @description y轴, 数值轴, y轴配置, 用于定义图表的y轴, 包括y轴的位置, 格式, 样式等.
   */
  yAxis?: YLinearAxis
  /**
   * @description 垂直提示框配置, 用于定义图表的垂直提示框, 包括垂直提示框的颜色、标签样式等.
   */
  crosshairRect?: CrosshairRect
  /**
   * @description 柱图圆角的数值或数组，默认 0，不启用圆角。当 stackCornerRadius 为 false 时，每个图元独立绘制圆角；为 true 时，通过 clip 裁剪整组堆叠柱体。数值设置所有角，数组按左上、右上、右下、左下排列，数据为负值时圆角方向自动翻转。设为 0 可关闭。barStyle.barRadius 可覆盖单个图元的圆角；stackCornerRadius 为 true 时，整组圆角统一使用 cornerRadius，不受 barStyle.barRadius 影响。
   * @default 0
   * @example [4, 4, 0, 0]
   */
  cornerRadius?: CornerRadius
  /**
   * @description 是否使用整组堆叠圆角，默认 false。设为 true 时，通过 clip 裁剪整组柱体，圆角值统一读取 cornerRadius，保留堆叠内部的直角连接，并优先于 barStyle.barRadius（包括条件样式）。设为 false 时，cornerRadius 对每个图元单独生效。注意：开启 stackCornerRadius 会引起更新动画重叠的 bug，整组 clip 裁剪路径与图元更新动画不同步，依赖 VChart 修复；需要平滑更新动画时建议保持 false。
   * @default false
   * @example true
   */
  stackCornerRadius?: StackCornerRadius
  /**
   * @description 直方图分箱数量, 用于定义直方图的分箱矩形（柱子）的数量
   */
  binCount?: number
  /**
   * @description 分箱步长，用于计算分箱的宽度，也会影响最终直方图中矩形（柱子）的宽度。如果同时设置了 binCount 和 binStep，则以 binStep 为准
   */
  binStep?: number
  /**
   * @description 直方图分箱值类型, 用于定义直方图的分箱矩形（柱子）值类型, 默认为'count'
   * @default 'count'
   */
  binValueType?: 'count' | 'percentage'
  /**
   * @description 图表的主题, 主题是优先级较低的功能配置, 包含所有图表类型共用的通用配置, 与单类图表类型共用的图表配置, 内置light与dark两种主题, 用户可以通过Builder自定义主题
   * @default light 默认为亮色主题
   * @example 'dark'
   * @example 'light'
   * @example 'customThemeName'
   */
  theme?: Theme
  /**
   * @description 矩形图元样式, 柱状图样式配置, 用于定义图表的柱状图样式, 包括柱状图的颜色, 边框, 圆角等.
   * 支持全局样式或条件样式配置
   * 数据筛选器
   * 若配置selector, 提供数值 selector, 局部数据 selector, 条件维度 selector, 条件指标 selector 共四类数据匹配能力
   * 若未配置selector, 则样式全局生效.
   */
  barStyle?: BarStyle | BarStyle[]
  /**
   * @description 标注点配置, 根据选择的数据, 定义图表的标注点, 包括标注点的位置, 格式, 样式等.
   */
  annotationPoint?: AnnotationPoint | AnnotationPoint[]
  /**
   * @description 数值标注线(分箱值)，竖直方向展示，能够设置标注线的位置, 样式等，如需分箱值对应的标注线，可以使用该配置
   */
  annotationVerticalLine?: AnnotationVerticalLine | AnnotationVerticalLine[]
  /**
   * @description 数值标注线(包括均值线、最大值线、最小值线等)，水平方向展示，能够设置标注线的位置, 样式等，如需绘制分箱值对应的标注线请使用该配置；注意分箱值受`binValueType` 影响
   */
  annotationHorizontalLine?: AnnotationHorizontalLine | AnnotationHorizontalLine[]
  /**
   * @description 标注区域配置, 根据选择的数据, 定义图表的标注区域, 包括标注区域的位置, 样式等.
   */
  annotationArea?: AnnotationArea | AnnotationArea[]
  /**
   * @description 核密度回归线配置, 用于展示数据的趋势和分布情况
   */
  kdeRegressionLine?: KdeRegressionLine | KdeRegressionLine[]
  /**
   * @description 经验累积分布函数回归线配置, 用于展示数据的累积分布情况
   */
  ecdfRegressionLine?: EcdfRegressionLine | EcdfRegressionLine[]
  /**
   * @description 当图表开启透视功能或者指标组合的是否，是否开启维度联动功能
   * 当hover 到某个维度值时，联动高亮其他图表中相同维度值的数据
   */
  dimensionLinkage?: DimensionLinkage
  /**
   * @description 图表语言配置, 支持'zh-CN'与'en-US'两种语言, 另外可以调用 intl.setLocale('zh-CN') 方法设置语言
   * @default 'zh-CN'
   */
  locale?: Locale
}
```

## Line

源码：[packages/vseed/src/types/chartType/line/line.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/types/chartType/line/line.ts#L55)

包导出：`Line`

```typescript
/**
 * @description 折线图，适用于展示数据随时间或有序类别变化的趋势，通过线段连接数据点形成趋势线
 * 适用场景:
 * - 展示时间序列数据的变化趋势
 * - 比较多个数据系列的趋势对比
 * - 分析数据的增长或下降规律
 * @encoding
 * 折线图支持以下视觉通道:
 * `x`      : x轴通道, 支持`多个维度`, 按维度值映射至x轴
 * `y`      : y轴通道, 支持`多个指标`, 按指标值映射至y轴
 * `color`  : 颜色通道, 支持`多个维度`或 `一个指标`, 维度颜色用于区分不同的数据系列, 指标颜色用于线性映射指标值到图形颜色
 * `tooltip`: 提示通道, 支持`多个维度`与 `多个指标`, 会在鼠标悬停在数据点上时展示
 * `label`  : 标签通道, 支持`多个维度`与 `多个指标`, 会在数据点上展示数据标签
 * @warning
 * 数据要求:
 * - 至少1个数值字段（度量）
 * - 第一个维度会放至X轴, 其余维度会与指标名称(存在多个指标时)合并, 作为图例项展示
 * - 所有指标会自动合并为一个指标
 * 默认开启的功能:
 * - 默认开启图例、坐标轴、数据点标记、提示信息、趋势线
 * @recommend
 * - 推荐字段配置: `1`个指标, `2`个维度
 * - 支持数据重塑: 至少`1`个指标, `0`个维度
 */
export interface Line {
  /**
   * @description 折线图，适用于展示数据随时间或有序类别变化的趋势
   * @type {string}
   * @example 'line'
   */
  chartType: 'line'
  /**
   * @description 数据源, 符合TidyData规范的且已经聚合的数据集，用于定义图表的数据来源和结构, 用户输入的数据集并不需要进行任何处理, VSeed带有强大的数据重塑功能, 会自行进行数据重塑, 折线图的数据最终会被转换为2个维度, 1个指标.
   * @type {Array<Record<string|number, any>>}
   * @example [{month:'1月', value:100}, {month:'2月', value:150}, {month:'3月', value:120}]
   */
  dataset: Dataset
  /**
   * @description 维度, 折线图的第一个维度被映射到X轴, 其余维度会与指标名称(存在多个指标时)合并, 作为图例项展示
   * @example [{id: "month", alias: "月份"}]
   */
  dimensions?: LineDimension[]
  /**
   * @description 指标, 折线图的所有指标会自动合并为一个指标, 映射到Y轴, 存在多个指标时, 指标名称会与其余维度合并, 作为图例项展示.
   * @example [{id: "value", alias: "数值"}]
   */
  measures?: LineMeasure[]
  /**
   * @description 分页配置
   */
  page?: Page
  /**
   * 图表的背景颜色
   * @description 图表的背景颜色, 默认为透明背景, 背景颜色可以是颜色字符串, 例如'red', 'blue', 也可以是hex, rgb或rgba'#ff0000', 'rgba(255,0,0,0.5)'
   */
  backgroundColor?: BackgroundColor
  /**
   * 颜色
   * @description 颜色配置, 用于定义图表的颜色方案, 包括颜色列表, 颜色映射, 颜色渐变等.
   */
  color?: Color
  /**
   * 标签
   * @description 标签配置, 用于定义图表的数据标签, 包括数据标签的位置, 格式, 样式等.
   */
  label?: Label
  /**
   * 图例
   * @description 图例配置, 用于定义图表的图例, 包括图例的位置, 格式, 样式等.
   */
  legend?: Legend
  /**
   * 绘图区内边距
   * @description 映射到 VChart 的 region[0].padding，用于为标注、标签等绘图区外扩元素预留空间。
   */
  regionPadding?: RegionPadding
  /**
   * 提示信息
   * @description 提示信息配置, 用于定义图表的提示信息, 包括提示信息的位置, 格式, 样式等.
   */
  tooltip?: Tooltip
  /**
   * 框选
   * @description 框选配置，用于开启/关闭 brush 框选能力
   */
  brush?: Brush
  /**
   * 动画配置
   * @description 图表动画配置，按图表类型约束可选效果
   */
  animation?: LineAreaAnimation
  /**
   * x轴
   * @description 类目轴, x轴配置, 用于定义图表的x轴, 包括x轴的位置, 格式, 样式等.
   */
  xAxis?: XBandAxis
  /**
   * y轴
   * @description 数值轴, y轴配置, 用于定义图表的y轴, 包括y轴的位置, 格式, 样式等.
   */
  yAxis?: YLinearAxis
  /**
   * 垂直提示线
   * @description  鼠标移动到图表上时, 显示的垂直提示线
   */
  crosshairLine?: CrosshairLine
  /**
   * @description X轴排序配置, 支持根据维度或指标排序, 以及自定义排序顺序
   * @example
   * sort: {
   *   orderBy: 'profit',
   *   order: 'asc',
   * }
   * sort: {
   *   customOrder:['2019', '2020', '2021']
   * }
   */
  sort?: Sort
  /**
   * @description 图例排序配置, 支持根据维度或指标排序, 以及自定义排序顺序
   * @example
   * sortLegend: {
   *   orderBy: 'profit',
   *   order: 'asc',
   * }
   * sortLegend: {
   *   customOrder:['2019', '2020', '2021']
   * }
   */
  sortLegend?: SortLegend
  /**
   * 图表的主题, 主题是优先级较低的功能配置, 包含所有图表类型共用的通用配置, 与单类图表类型共用的图表配置
   * @default light 默认为亮色主题
   * @description 内置light与dark两种主题, 用户可以通过Builder自定义主题
   * @example 'dark'
   * @example 'light'
   * @example 'customThemeName'
   */
  theme?: Theme
  /**
   * 点图元样式
   * @description 点图元样式配置, 用于定义图表的点图元样式, 包括点图元的颜色, 边框等.
   * 支持全局样式或条件样式配置
   * 数据筛选器
   * 若配置selector, 提供数值 selector, 局部数据 selector, 条件维度 selector, 条件指标 selector 共四类数据匹配能力
   * 若未配置selector, 则样式全局生效.
   */
  pointStyle?: PointStyle | PointStyle[]
  /**
   * 线图元样式
   * @description 线图元样式配置, 用于定义图表的线图元样式, 包括线图元的颜色, 透明度, 曲线等.
   * 支持全局样式或条件样式配置
   * 数据筛选器
   * 若配置selector, 提供数值 selector, 局部数据 selector, 条件维度 selector, 条件指标 selector 共四类数据匹配能力
   * 若未配置selector, 则样式全局生效.
   */
  lineStyle?: LineStyle | LineStyle[]
  /**
   * 标注点
   * @description 标注点配置, 根据选择的数据, 定义图表的标注点, 包括标注点的位置, 格式, 样式等.
   */
  annotationPoint?: AnnotationPoint | AnnotationPoint[]
  /**
   * @description 维度值标注线，竖直方向展示，能够设置标注线的位置, 样式等
   */
  annotationVerticalLine?: AnnotationVerticalLine | AnnotationVerticalLine[]
  /**
   * @description 数值标注线(包括均值线、最大值线、最小值线等)，水平方向展示，能够设置标注线的位置, 样式等，如需绘制均值线等数值对应的标注线请使用该配置
   */
  annotationHorizontalLine?: AnnotationHorizontalLine | AnnotationHorizontalLine[]
  /**
   * 标注区域
   * @description 标注区域配置, 根据选择的数据, 定义图表的标注区域, 包括标注区域的位置, 样式等.
   */
  annotationArea?: AnnotationArea | AnnotationArea[]
  /**
   * 差异标注线
   * @description 根据两个选中的数据点，绘制差异标注线并自动计算差异文本。
   */
  annotationDifferenceLine?: AnnotationDifferenceLine | AnnotationDifferenceLine[]
  /**
   * @description 当图表开启透视功能或者指标组合的是否，是否开启维度联动功能
   * 当hover 到某个维度值时，联动高亮其他图表中相同维度值的数据
   */
  dimensionLinkage?: DimensionLinkage
  /**
   * 语言
   * @description 图表语言配置, 支持'zh-CN'与'en-US'两种语言, 另外可以调用 intl.setLocale('zh-CN') 方法设置语言
   * @default 'zh-CN'
   */
  locale?: Locale
}
```

## Pie

源码：[packages/vseed/src/types/chartType/pie/pie.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/types/chartType/pie/pie.ts#L43)

包导出：`Pie`

```typescript
/**
 * @description 饼图，适用于展示单一维度数据的占比关系，通过扇形面积大小表示各类别占比
 * 适用场景:
 * - 展示分类数据的占比分布
 * - 强调数据的整体与部分关系
 * - 类别数量较少（建议不超过6个）的占比分析
 * @encoding
 * 饼图支持以下视觉通道:
 * `angle`  : 角度通道, 支持`多个指标`, 按指标值映射至扇形角度
 * `detail` : 细分通道, 支持`多个维度`, 在同一个颜色系列下展示更细粒度的数据时使用
 * `color`  : 颜色通道, 支持`多个维度`或 `一个指标`, 维度颜色用于区分不同的数据系列, 指标颜色用于线性映射指标值到图形颜色
 * `tooltip`: 提示通道, 支持`多个维度`与 `多个指标`, 会在鼠标悬停在数据点上时展示
 * `label`  : 标签通道, 支持`多个维度`与 `多个指标`, 会在数据点上展示数据标签
 * @warning
 * 数据要求:
 * - 至少1个数值字段（度量）
 * - 所有维度会与指标名称(存在多个指标时)合并成一个维度, 作为图例项展示
 * - 所有指标会自动合并为一个指标
 * 默认开启的功能:
 * - 默认开启图例、数据标签、提示信息、占比计算
 * @recommend
 * - 推荐字段配置: `1`个指标, `1`个维度
 * - 支持数据重塑: 至少`1`个指标, `0`个维度
 */
export interface Pie {
  /**
   * 饼图
   * @description 饼图，展示单一维度数据的占比关系
   * @type {'pie'}
   * @example 'pie'
   */
  chartType: 'pie'
  /** @description 外半径占可用半径的比例，范围 (0, 1]，默认 0.8。 */
  outerRadius?: number
  /** @description 内半径占可用半径的比例，范围 [0, outerRadius)。默认 0。 */
  innerRadius?: number
  /** @description 起始角度，单位为度，默认 -90。 */
  startAngle?: number
  /** @description 结束角度，默认 startAngle + 360；跨度必须在 (0, 360]。 */
  endAngle?: number
  /** @description 扇区边框、圆角和悬停效果。 */
  pieStyle?: PieStyle
  /**
   * 数据集
   * @description 符合TidyData规范的且已经聚合的数据集，用于定义图表的数据来源和结构, 用户输入的数据集并不需要进行任何处理, VSeed带有强大的数据重塑功能, 会自行进行数据重塑, 饼图的数据最终会被转换为1个维度, 1个指标.
   * @type {Array<Record<string|number, any>>}
   * @example [{category:'A', value:30}, {category:'B', value:70}]
   */
  dataset: Dataset
  /**
   * 维度
   * @description 饼图的所有维度会与指标名称(存在多个指标时)合并成一个维度, 映射到角度, 并作为图例项展示
   * @example [{id: 'category', alias: '类别'}]
   */
  dimensions?: PieDimension[]
  /**
   * 指标
   * @description 饼图的所有指标会自动合并为一个指标, 映射到半径轴, 存在多个指标时, 指标名称会与其余维度合并, 作为图例项展示.
   * @example [{id: 'value', alias: '数值占比', format: 'percent'}]
   */
  measures?: PieMeasure[]
  /**
   * @description 分页配置, 用于指定分页的字段名, 必须是维度
   */
  page?: Page
  /**
   * 图表的背景颜色
   * @default transparent 默认为透明背景
   * @description 背景颜色可以是颜色字符串, 例如'red', 'blue', 也可以是hex, rgb或rgba'#ff0000', 'rgba(255,0,0,0.5)'
   */
  backgroundColor?: BackgroundColor
  /**
   * 颜色
   * @description 颜色配置, 用于定义图表的颜色方案, 包括颜色列表, 颜色映射, 颜色渐变等.
   */
  color?: Color
  /**
   * 标签
   * @description 标签配置, 用于定义图表的数据标签, 包括数据标签的位置, 格式, 样式等.
   */
  label?: PieLabel
  /**
   * 图例
   * @description 图例配置, 用于定义图表的图例, 包括图例的位置, 格式, 样式等.
   */
  legend?: Legend
  /**
   * 提示信息
   * @description 提示信息配置, 用于定义图表的提示信息, 包括提示信息的位置, 格式, 样式等.
   */
  tooltip?: Tooltip
  /**
   * 框选
   * @description 框选配置，用于开启/关闭 brush 框选能力
   */
  brush?: Brush
  /**
   * 动画配置
   * @description 图表动画配置，按图表类型约束可选效果
   */
  animation?: PieLikeAnimation
  /**
   * 图表的主题, 主题是优先级较低的功能配置, 包含所有图表类型共用的通用配置, 与单类图表类型共用的图表配置
   * @default light 默认为亮色主题
   * @description 内置light与dark两种主题, 用户可以通过Builder自定义主题
   * @example 'dark'
   * @example 'light'
   * @example 'customThemeName'
   */
  theme?: Theme
  /**
   * 语言
   * @description 图表语言配置, 支持'zh-CN'与'en-US'两种语言, 另外可以调用 intl.setLocale('zh-CN') 方法设置语言
   * @default 'zh-CN'
   */
  locale?: Locale
}
```

## PivotTable

源码：[packages/vseed/src/types/chartType/pivotTable/pivotTable.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/types/chartType/pivotTable/pivotTable.ts#L27)

包导出：`PivotTable`

```typescript
/**
 * @description 透视表格，适用于多维度数据交叉分析场景，可灵活配置行、列维度和指标计算方式
 * 适用场景:
 * - 复杂多维数据统计分析
 * - 数据钻取与聚合展示
 * - 业务报表生成与数据探索
 * @encoding
 * 透视表支持以下视觉通道:
 * `row`    : 行维度, 支持`多个维度`, 按维度值在行上进行分组
 * `column` : 列维度, 支持`多个维度`, 按维度值在列上进行分组
 * `detail` : 细分通道, 支持`多个指标`, 在单元格中展示指标值
 * @warning
 * 数据要求:
 * - 至少1个行维度 或 1个列维度 或 1个指标
 * - 数据必须已聚合
 * - 数据可被分组
 * 默认开启的功能:
 * - 默认开启行列排序、数据筛选、聚合计算、小计/总计
 * @recommend
 * - 推荐字段配置: `1`个指标, `1`个维度
 * - 支持数据重塑: 至少`1`个指标, `0`个维度
 */
export interface PivotTable {
  /**
   * @description 透视表，适用于多维度数据交叉分析场景
   * @type {'pivotTable'}
   * @example 'pivotTable'
   */
  chartType: 'pivotTable'
  /**
   * @description 符合TidyData规范的且已经聚合的数据集，用于定义图表的数据来源和结构, 用户输入的数据集并不需要进行任何处理, VSeed带有强大的数据重塑功能, 会自行进行数据重塑, 透视表的数据最终会被转换对应的树形结构, 用户无需手动进行数据处理.
   * @type {Array<Record<string|number, any>>}
   * @example [{region:'华东', product:'A', sales:1000}, {region:'华东', product:'B', sales:1500}]
   */
  dataset: Dataset
  /**
   * @description 透视表的行维度和列维度，会自动对数据进行处理为树形结构, 并映射到行和列轴,
   * @type {Dimensions}
   * @example [{id: 'region', alias: '地区', isRow: true}, {id: 'product', alias: '产品', isColumn: true}]
   */
  dimensions?: TableDimension[]
  /**
   * @description 透视表支持多个维度指标
   * @type {Measures}
   * @example [{id: 'sales', alias: '销售额', aggregation: 'sum'}]
   */
  measures?: TableMeasure[]
  /**
   * @description 分页配置, 用于指定分页的字段名, 必须是维度
   */
  page?: Page
  /**
   * @default transparent 默认为透明背景
   * @description 背景颜色可以是颜色字符串, 例如'red', 'blue', 也可以是hex, rgb或rgba'#ff0000', 'rgba(255,0,0,0.5)'
   */
  backgroundColor?: BackgroundColor
  /**
   * @description 表格的边框颜色
   */
  borderColor?: string
  /**
   * @description 表格体的字体大小
   */
  bodyFontSize?: number
  /**
   * @description 表格体的字体颜色
   */
  bodyFontColor?: string
  /**
   * @description 表格体的背景颜色
   */
  bodyBackgroundColor?: string
  /**
   * @description 行表头、列表头的字体大小
   */
  headerFontSize?: number
  /**
   * @description 行表头、列表头的字体颜色
   */
  headerFontColor?: string
  /**
   * @description 行表头、列表头的背景颜色
   */
  headerBackgroundColor?: string
  /**
   * @description 鼠标悬浮在行、列表头的单元格时的背景颜色, 用于突出显示鼠标所在的行列交叉的单元格
   */
  hoverHeaderBackgroundColor?: string
  /**
   * @description 鼠标悬浮在行、列表头的单元格时, 用于突出显示鼠标所在的行与列的所有单元格
   */
  hoverHeaderInlineBackgroundColor?: string
  /**
   * @description 选中的单元格的边框颜色, 用于突出显示选中的单元格
   */
  selectedBorderColor?: string
  /**
   * @description 选中的单元格的背景颜色, 用于突出显示选中的单元格
   */
  selectedBackgroundColor?: string
  /**
   * @description 设置表格正文部分单元格的特殊样式
   */
  bodyCellStyle?: BodyCellStyle | BodyCellStyle[]
  /**
   * @description 指标是否作为列展示，当为 true 时指标在列方向展开，为 false 时在行方向展开
   * @default true
   * @example true
   */
  indicatorsAsCol?: boolean
  /**
   * @description 透视表的总计和小计配置
   * @example { row: { showGrandTotals: true, showSubTotals: true, subTotalsDimensions: ['category'] } }
   */
  totals?: PivotTableTotals
  /**
   * 图表的主题, 主题是优先级较低的功能配置, 包含所有图表类型共用的通用配置, 与单类图表类型共用的图表配置
   * @default light 默认为亮色主题
   * @description 内置light与dark两种主题, 用户可以通过Builder自定义主题
   * @example 'dark'
   * @example 'light'
   * @example 'customThemeName'
   */
  theme?: Theme
  /**
   * 语言
   * @description 图表语言配置, 支持'zh-CN'与'en-US'两种语言, 另外可以调用 intl.setLocale('zh-CN') 方法设置语言
   * @default 'zh-CN'
   */
  locale?: Locale
}
```

## RaceBar

源码：[packages/vseed/src/types/chartType/raceBar/raceBar.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/types/chartType/raceBar/raceBar.ts#L36)

包导出：`RaceBar`

```typescript
/**
 * @description 动态条形图 (Race Bar Chart)
 * 适用于展示数据随时间变化的排名情况
 */
export interface RaceBar {
  /**
   * @description 动态条形图，适用于展示数据随时间变化的排名情况
   * @type {'raceBar'}
   */
  chartType: 'raceBar'
  /**
   * @description 数据源
   */
  dataset: Dataset
  /**
   * @description 维度
   */
  dimensions?: RaceBarDimension[]
  /**
   * @description 指标
   */
  measures?: RaceBarMeasure[]
  /**
   * @description 播放器配置, 用于指定时间维度, 动态条形图的核心配置
   */
  player?: Player
  /**
   * @description 排序配置, 动态条形图通常需要根据数值动态排序
   */
  sort?: Sort
  /**
   * @description 分页配置
   */
  page?: Page
  /**
   * @description 背景颜色
   */
  backgroundColor?: BackgroundColor
  /**
   * @description 颜色配置
   */
  color?: Color
  /**
   * @description 标签配置
   */
  label?: Label
  /**
   * @description 图例配置
   */
  legend?: Legend
  /**
   * @description 提示信息配置
   */
  tooltip?: Tooltip
  /**
   * @description 框选配置
   */
  brush?: Brush
  /**
   * @description x轴配置，为数值轴，展示指标值
   */
  xAxis?: XLinearAxis
  /**
   * @description y轴配置，为类目轴，展示维度值，柱子竖向排列
   */
  yAxis?: YBandAxis
  /**
   * @description 水平提示框配置
   */
  crosshairRect?: CrosshairRect
  /**
   * @description 柱图圆角的数值或数组，默认 0，不启用圆角。当 stackCornerRadius 为 false 时，每个图元独立绘制圆角；为 true 时，通过 clip 裁剪整组堆叠柱体。数值设置所有角，数组按左上、右上、右下、左下排列，数据为负值时圆角方向自动翻转。设为 0 可关闭。barStyle.barRadius 可覆盖单个图元的圆角；stackCornerRadius 为 true 时，整组圆角统一使用 cornerRadius，不受 barStyle.barRadius 影响。
   * @default 0
   * @example [4, 4, 0, 0]
   */
  cornerRadius?: CornerRadius
  /**
   * @description 是否使用整组堆叠圆角，默认 false。设为 true 时，通过 clip 裁剪整组柱体，圆角值统一读取 cornerRadius，保留堆叠内部的直角连接，并优先于 barStyle.barRadius（包括条件样式）。设为 false 时，cornerRadius 对每个图元单独生效。注意：开启 stackCornerRadius 会引起更新动画重叠的 bug，整组 clip 裁剪路径与图元更新动画不同步，依赖 VChart 修复；需要平滑更新动画时建议保持 false。
   * @default false
   * @example true
   */
  stackCornerRadius?: StackCornerRadius
  /**
   * @description 矩形的最大高度
   */
  barMaxWidth?: BarMaxWidth
  /**
   * @description 图例排序配置
   */
  sortLegend?: SortLegend
  /**
   * @description 主题
   */
  theme?: Theme
  /**
   * @description 条形图样式配置
   */
  barStyle?: BarStyle | BarStyle[]
  /**
   * @description 标注点配置
   */
  annotationPoint?: AnnotationPoint | AnnotationPoint[]
  /**
   * @description 数值标注线
   */
  annotationVerticalLine?: AnnotationVerticalLine | AnnotationVerticalLine[]
  /**
   * @description 维度值标注线
   */
  annotationHorizontalLine?: AnnotationHorizontalLine | AnnotationHorizontalLine[]
  /**
   * @description 标注区域配置
   */
  annotationArea?: AnnotationArea | AnnotationArea[]
  /**
   * @description 维度联动配置
   */
  dimensionLinkage?: DimensionLinkage
  /**
   * @description 语言配置
   */
  locale?: Locale
}
```

## RaceColumn

源码：[packages/vseed/src/types/chartType/raceColumn/raceColumn.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/types/chartType/raceColumn/raceColumn.ts#L45)

包导出：`RaceColumn`

```typescript
/**
 * @description 动态柱状图 (Race Column Chart)
 * 适用于展示数据随时间变化的排名情况，柱子竖向排列
 * 适用场景：
 * - 数据项名称较长时
 * - 需要直观比较不同类别的数值大小并展示其随时间的变化排序
 * - 展示时间序列数据变化趋势，并动态更新柱子排序
 * @note
 * 动态柱状图：
 * - X轴为类目轴（分类数据），展示维度值
 * - Y轴为数值轴（连续数据），展示指标值
 * - 支持通过播放器控制时间维度，动态展示数据变化
 * - 柱子在动画中根据数值大小动态排序
 */
export interface RaceColumn {
  /**
   * @description 动态柱状图，适用于展示数据随时间变化的排名情况
   * @type {'raceColumn'}
   */
  chartType: 'raceColumn'
  /**
   * @description 符合TidyData规范的且已经聚合的数据集
   * @type {Array<Record<string|number, any>>}
   * @example [{category:'A', value:100, date: '2020'}, {category:'B', value:200, date: '2020'}]
   */
  dataset: Dataset
  /**
   * 维度
   * @description 第一个维度映射到player，第二个维度映射到X轴
   */
  dimensions?: RaceColumnDimension[]
  /**
   * 指标
   * @description 动态柱状图的所有指标会自动合并为一个指标, 映射到Y轴, 存在多个指标时, 指标名称会与其余维度合并, 作为图例项展示.
   * @example [{id: "value", alias: "数值"}]
   */
  measures?: ColumnMeasure[]
  /**
   * @description 播放器配置，用于指定时间维度，是动态柱状图的核心配置
   * 通过播放器控制时间维度的播放进度，实现数据的动态更新和排序变化
   */
  player?: Player
  /**
   * @description 排序配置，动态柱状图通常需要根据数值动态排序
   * 控制柱子在X轴上的排序方式
   */
  sort?: Sort
  /**
   * @description 分页配置，用于处理数据量较大的场景
   */
  page?: Page
  /**
   * @description 背景颜色配置
   */
  backgroundColor?: BackgroundColor
  /**
   * @description 颜色配置，用于区分不同的维度或指标
   */
  color?: Color
  /**
   * @description 标签配置，用于在柱子上显示数据标签
   */
  label?: Label
  /**
   * @description 图例配置
   */
  legend?: Legend
  /**
   * @description 提示信息配置，用于鼠标悬停时展示详细信息
   */
  tooltip?: Tooltip
  /**
   * @description 框选配置，用于支持框选交互
   */
  brush?: Brush
  /**
   * @description X轴配置，为类目轴，展示维度值，柱子竖向排列
   */
  xAxis?: XBandAxis
  /**
   * @description Y轴配置，为数值轴，展示指标值
   */
  yAxis?: YLinearAxis
  /**
   * @description 十字线配置，用于展示数据的精确值
   */
  crosshairRect?: CrosshairRect
  /**
   * @description 柱图圆角的数值或数组，默认 0，不启用圆角。当 stackCornerRadius 为 false 时，每个图元独立绘制圆角；为 true 时，通过 clip 裁剪整组堆叠柱体。数值设置所有角，数组按左上、右上、右下、左下排列，数据为负值时圆角方向自动翻转。设为 0 可关闭。barStyle.barRadius 可覆盖单个图元的圆角；stackCornerRadius 为 true 时，整组圆角统一使用 cornerRadius，不受 barStyle.barRadius 影响。
   * @default 0
   * @example [4, 4, 0, 0]
   */
  cornerRadius?: CornerRadius
  /**
   * @description 是否使用整组堆叠圆角，默认 false。设为 true 时，通过 clip 裁剪整组柱体，圆角值统一读取 cornerRadius，保留堆叠内部的直角连接，并优先于 barStyle.barRadius（包括条件样式）。设为 false 时，cornerRadius 对每个图元单独生效。注意：开启 stackCornerRadius 会引起更新动画重叠的 bug，整组 clip 裁剪路径与图元更新动画不同步，依赖 VChart 修复；需要平滑更新动画时建议保持 false。
   * @default false
   * @example true
   */
  stackCornerRadius?: StackCornerRadius
  /**
   * @description 矩形的最大宽度配置
   */
  barMaxWidth?: BarMaxWidth
  /**
   * @description 图例排序配置
   */
  sortLegend?: SortLegend
  /**
   * @description 主题配置
   */
  theme?: Theme
  /**
   * @description 柱形样式配置，可以为单个样式或数组形式
   */
  barStyle?: BarStyle | BarStyle[]
  /**
   * @description 标注点配置，用于在特定数据点上添加标记
   */
  annotationPoint?: AnnotationPoint | AnnotationPoint[]
  /**
   * @description 数值标注线，竖向标注线，标记特定的X轴数值
   */
  annotationVerticalLine?: AnnotationVerticalLine | AnnotationVerticalLine[]
  /**
   * @description 维度值标注线，横向标注线，标记特定的Y轴类别
   */
  annotationHorizontalLine?: AnnotationHorizontalLine | AnnotationHorizontalLine[]
  /**
   * @description 标注区域配置，用于突出显示特定的数据范围
   */
  annotationArea?: AnnotationArea | AnnotationArea[]
  /**
   * @description 维度联动配置，支持多个图表间的维度联动交互
   */
  dimensionLinkage?: DimensionLinkage
  /**
   * @description 语言配置
   */
  locale?: Locale
}
```

## RaceDonut

源码：[packages/vseed/src/types/chartType/raceDonut/raceDonut.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/types/chartType/raceDonut/raceDonut.ts#L30)

包导出：`RaceDonut`

```typescript
/**
 * @description 动态环形图 (Race Donut Chart)
 * 适用于展示数据随时间变化的占比关系，中心留有空白区域可展示汇总信息
 * 适用场景：
 * - 需要同时展示整体数据和各部分占比随时间的变化
 * - 强调数据的整体与部分关系
 * - 中心区域需要展示关键指标或标题
 * @note
 * 动态环形图：
 * - 角度映射指标值，颜色映射维度值
 * - 支持通过播放器控制时间维度，动态展示占比变化
 * - 相比饼图，中心区域留白，视觉上更轻量
 */
export interface RaceDonut {
  /**
   * @description 动态环形图，适用于展示数据随时间变化的占比关系
   * @type {'raceDonut'}
   */
  chartType: 'raceDonut'
  /**
   * @description 数据源
   */
  dataset: Dataset
  /**
   * @description 维度
   */
  dimensions?: RaceDonutDimension[]
  /**
   * @description 指标
   */
  measures?: DonutMeasure[]
  /**
   * @description 分页配置
   */
  page?: Page
  /**
   * @description 播放器配置, 用于指定时间维度, 动态环形图的核心配置
   */
  player?: Player
  /**
   * @description 背景颜色
   */
  backgroundColor?: BackgroundColor
  /**
   * @description 颜色配置
   */
  color?: Color
  /**
   * @description 标签配置
   */
  label?: PieLabel
  /**
   * @description 图例配置
   */
  legend?: Legend
  /**
   * @description 提示信息配置
   */
  tooltip?: Tooltip
  /**
   * @description 框选配置
   */
  brush?: Brush
  /**
   * @description 主题配置
   */
  theme?: Theme
  /**
   * @description 语言配置
   */
  locale?: Locale
}
```

## RaceLine

源码：[packages/vseed/src/types/chartType/raceLine/raceLine.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/types/chartType/raceLine/raceLine.ts#L42)

包导出：`RaceLine`

```typescript
/**
 * @description 动态折线图 (Race Line Chart)
 * 适用于展示数据随时间变化的趋势，通过线段连接数据点形成趋势线
 * 适用场景:
 * - 展示多个数据系列随时间的变化趋势
 * - 比较不同类别的增长或下降规律
 * - 观察数据在时间维度上的波动情况
 * @note
 * 动态折线图：
 * - X轴通常为时间轴或类目轴，展示维度值
 * - Y轴为数值轴，展示指标值
 * - 支持通过播放器控制时间维度，动态展示折线的延伸过程
 */
export interface RaceLine {
  /**
   * @description 动态折线图，适用于展示数据随时间变化的趋势
   * @type {'raceLine'}
   */
  chartType: 'raceLine'
  /**
   * @description 数据源
   */
  dataset: Dataset
  /**
   * @description 维度
   */
  dimensions?: LineDimension[]
  /**
   * @description 指标
   */
  measures?: LineMeasure[]
  /**
   * @description 分页配置
   */
  page?: Page
  /**
   * @description 播放器配置, 用于指定时间维度, 动态折线图的核心配置
   */
  player?: Player
  /**
   * @description 背景颜色
   */
  backgroundColor?: BackgroundColor
  /**
   * @description 颜色配置
   */
  color?: Color
  /**
   * @description 标签配置
   */
  label?: Label
  /**
   * @description 图例配置
   */
  legend?: Legend
  /**
   * @description 提示信息配置
   */
  tooltip?: Tooltip
  /**
   * @description 框选配置
   */
  brush?: Brush
  /**
   * @description x轴配置，为类目轴，展示维度值
   */
  xAxis?: XBandAxis
  /**
   * @description y轴配置，为数值轴，展示指标值
   */
  yAxis?: YLinearAxis
  /**
   * @description 垂直提示线配置
   */
  crosshairLine?: CrosshairLine
  /**
   * @description X轴排序配置
   */
  sort?: Sort
  /**
   * @description 图例排序配置
   */
  sortLegend?: SortLegend
  /**
   * @description 主题配置
   */
  theme?: Theme
  /**
   * @description 点图元样式配置
   */
  pointStyle?: PointStyle | PointStyle[]
  /**
   * @description 线图元样式配置
   */
  lineStyle?: LineStyle | LineStyle[]
  /**
   * @description 标注点配置
   */
  annotationPoint?: AnnotationPoint | AnnotationPoint[]
  /**
   * @description 维度值标注线配置
   */
  annotationVerticalLine?: AnnotationVerticalLine | AnnotationVerticalLine[]
  /**
   * @description 数值标注线配置
   */
  annotationHorizontalLine?: AnnotationHorizontalLine | AnnotationHorizontalLine[]
  /**
   * @description 标注区域配置
   */
  annotationArea?: AnnotationArea | AnnotationArea[]
  /**
   * @description 维度联动配置
   */
  dimensionLinkage?: DimensionLinkage
  /**
   * @description 语言配置
   */
  locale?: Locale
}
```

## RacePie

源码：[packages/vseed/src/types/chartType/racePie/racePie.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/types/chartType/racePie/racePie.ts#L31)

包导出：`RacePie`

```typescript
/**
 * @description 动态饼图 (Race Pie Chart)
 * 适用于展示数据随时间变化的占比关系，通过扇形面积大小表示各类别占比
 * 适用场景：
 * - 展示分类数据的占比分布随时间的变化
 * - 强调数据的整体与部分关系在时间维度上的演变
 * - 观察不同类别在总量中的占比波动
 * @note
 * 动态饼图：
 * - 角度映射指标值，颜色映射维度值
 * - 支持通过播放器控制时间维度，动态展示占比变化
 * - 扇形面积随数据变化动态调整
 */
export interface RacePie {
  /**
   * @description 动态饼图，适用于展示数据随时间变化的占比关系
   * @type {'racePie'}
   */
  chartType: 'racePie'
  /**
   * @description 数据源
   */
  dataset: Dataset
  /**
   * @description 维度
   */
  dimensions?: RacePieDimension[]
  /**
   * @description 指标
   */
  measures?: PieMeasure[]
  /**
   * @description 分页配置
   */
  page?: Page
  /**
   * @description 播放器配置, 用于指定时间维度, 动态饼图的核心配置
   */
  player?: Player
  /**
   * @description 背景颜色
   */
  backgroundColor?: BackgroundColor
  /**
   * @description 颜色配置
   */
  color?: Color
  /**
   * @description 标签配置
   */
  label?: PieLabel
  /**
   * @description 图例配置
   */
  legend?: Legend
  /**
   * @description 提示信息配置
   */
  tooltip?: Tooltip
  /**
   * @description 框选配置
   */
  brush?: Brush
  /**
   * @description 主题配置
   */
  theme?: Theme
  /**
   * @description 语言配置
   */
  locale?: Locale
}
```

## RaceScatter

源码：[packages/vseed/src/types/chartType/raceScatter/raceScatter.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/types/chartType/raceScatter/raceScatter.ts#L39)

包导出：`RaceScatter`

```typescript
/**
 * @description 动态散点图 (Race Scatter Chart)
 * 适用于展示数据随时间变化的分布情况，通过数据点的位置表示两个指标的数值
 * 适用场景：
 * - 分析数据在二维空间中的分布特征并展示其随时间的动态变化
 * - 展示多个变量之间的相关性随时间的演变
 * - 观察数据点在二维空间中的运动轨迹
 * @note
 * 动态散点图：
 * - X轴和Y轴均为数值轴（连续数据），支持多个指标映射
 * - 支持通过播放器控制时间维度，动态展示数据变化
 * - 通过数据点的位置变化直观展示数据的动态变化
 */
export interface RaceScatter {
  /**
   * @description 动态散点图，适用于展示数据随时间变化的分布情况
   * @type {'raceScatter'}
   */
  chartType: 'raceScatter'
  /**
   * @description 数据源，符合TidyData规范的数据集
   */
  dataset: Dataset
  /**
   * @description 维度，用于区分不同的数据系列和进行图例展示
   */
  dimensions?: RaceScatterDimension[]
  /**
   * @description 指标，至少需要2个指标分别映射至X轴和Y轴
   */
  measures?: ScatterMeasure[]
  /**
   * @description 播放器配置，用于指定时间维度，是动态散点图的核心配置
   * 通过播放器控制时间维度的播放进度，实现数据的动态更新
   */
  player?: Player
  /**
   * @description 排序配置，用于控制维度值的排序方式
   */
  sort?: Sort
  /**
   * @description 分页配置，用于处理数据量较大的场景
   */
  page?: Page
  /**
   * @description 背景颜色配置
   */
  backgroundColor?: BackgroundColor
  /**
   * @description 散点图指标的大小, 用于定义散点图中数据点的大小 或 大小范围
   * - 若大小范围是一个数字, 例如10, 表示数据点的大小范围固定为10
   * - 若大小范围是一个长度为2的数组, 例如[10, 40], 表示数据点的大小范围在10到40之间
   * - 与sizeRange互斥, 优先级低于 size
   */
  size?: number | number[]
  /**
   * @description 散点图指标的大小范围, 用于定义散点图中数据点的大小范围,
   * - 若大小范围是一个长度为2的数组, 例如[10, 40], 表示数据点的大小范围在10到40之间
   * - 若大小范围是一个数字, 例如10, 表示数据点的大小范围固定为10
   * - 与sizeRange互斥, 优先级高于 size
   */
  sizeRange?: number | number[]
  /**
   * @description 颜色配置，用于区分不同的维度或指标
   */
  color?: Color
  /**
   * @description 标签配置，用于在数据点上显示数据标签
   */
  label?: Label
  /**
   * @description 图例配置
   */
  legend?: Legend
  /**
   * @description 提示信息配置，用于鼠标悬停时展示详细信息
   */
  tooltip?: Tooltip
  /**
   * @description 框选配置，用于支持框选交互
   */
  brush?: Brush
  /**
   * @description X轴配置，为数值轴，展示第一个指标值
   */
  xAxis?: XLinearAxis
  /**
   * @description Y轴配置，为数值轴，展示第二个指标值
   */
  yAxis?: YLinearAxis
  /**
   * @description 十字线配置，用于展示数据的精确位置
   */
  crosshairLine?: CrosshairLine
  /**
   * @description 主题配置
   */
  theme?: Theme
  /**
   * @description 数据点样式配置，可以为单个样式或数组形式，支持全局样式或条件样式配置
   */
  pointStyle?: PointStyle | PointStyle[]
  /**
   * @description 标注点配置，用于在特定数据点上添加标记
   */
  annotationPoint?: AnnotationPoint | AnnotationPoint[]
  /**
   * @description 数值标注线，竖向标注线，标记特定的X轴数值
   */
  annotationVerticalLine?: AnnotationVerticalLine | AnnotationVerticalLine[]
  /**
   * @description 数值标注线，横向标注线，标记特定的Y轴数值
   */
  annotationHorizontalLine?: AnnotationHorizontalLine | AnnotationHorizontalLine[]
  /**
   * @description 标注区域配置，用于突出显示特定的数据范围
   */
  annotationArea?: AnnotationArea | AnnotationArea[]
  /**
   * @description 语言配置
   */
  locale?: Locale
}
```

## Radar

源码：[packages/vseed/src/types/chartType/radar/radar.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/types/chartType/radar/radar.ts#L44)

包导出：`Radar`

```typescript
/**
 * @description 雷达图，适用于多维度数据的对比分析，通过多轴坐标系展示各维度的数值分布
 * 适用场景:
 * - 多维度数据的综合表现对比
 * - 多个对象在多个指标上的性能评估
 * - 分类数据的多维度特征展示
 * @encoding
 * 雷达图支持以下视觉通道:
 * `angle`  : 角度通道, 支持`多个维度`, 按维度值映射至角度轴
 * `radius` : 半径通道, 支持`多个指标`, 按指标值映射至半径轴
 * `color`  : 颜色通道, 支持`多个维度`或 `一个指标`, 维度颜色用于区分不同的数据系列, 指标颜色用于线性映射指标值到图形颜色
 * `tooltip`: 提示通道, 支持`多个维度`与 `多个指标`, 会在鼠标悬停在数据点上时展示
 * `label`  : 标签通道, 支持`多个维度`与 `多个指标`, 会在数据点上展示数据标签
 * @warning
 * 数据要求:
 * - 至少1个数值字段（度量）
 * - 第一个维度作为雷达图的各个维度轴，其他维度作为不同的系列进行对比
 * - 支持多个指标分别作为不同的系列展示
 * 默认开启的功能:
 * - 默认开启图例、雷达坐标系、数据标签、提示信息、数值缩放
 * @recommend
 * - 推荐字段配置: `1`个指标, `1`个维度
 * - 支持数据重塑: 至少`1`个指标, `0`个维度
 */
export interface Radar {
  /**
   * 雷达图
   * @description 雷达图，通过多轴坐标系展示多维度数据对比关系
   * @type {'radar'}
   * @example 'radar'
   */
  chartType: 'radar'
  /**
   * 数据集
   * @description 符合TidyData规范的且已经聚合的数据集，用于定义图表的数据来源和结构, 用户输入的数据集并不需要进行任何处理, VSeed带有强大的数据重塑功能, 会自行进行数据重塑, 玫瑰图的数据最终会被转换为2个维度, 1个指标.
   * @type {Array<Record<string|number, any>>}
   * @example [{month:'1月', value:100}, {month:'2月', value:150}, {month:'3月', value:120}]
   */
  dataset: Dataset
  /**
   * 维度
   * @description 雷达图的第一个维度被映射到角度轴, 其余维度会与指标名称(存在多个指标时)合并, 作为图例项展示.
   * @example [{id: 'category', alias: '类别'}]
   */
  dimensions?: RadarDimension[]
  /**
   * 指标
   * @description 雷达图的指标会自动合并为一个指标, 映射到半径轴, 存在多个指标时, 指标名称会与其余维度合并, 作为图例项展示.
   * @example [{id: 'value', alias: '数值'}]
   */
  measures?: RadarMeasure[]
  /**
   * @description 分页配置, 用于指定分页的字段名, 必须是维度
   */
  page?: Page
  /**
   * 图表的背景颜色
   * @default transparent 默认为透明背景
   * @description 背景颜色可以是颜色字符串, 例如'red', 'blue', 也可以是hex, rgb或rgba'#ff0000', 'rgba(255,0,0,0.5)'
   */
  backgroundColor?: BackgroundColor
  /**
   * 颜色
   * @description 颜色配置, 用于定义图表的颜色方案, 包括颜色列表, 颜色映射, 颜色渐变等.
   */
  color?: Color
  /**
   * 标签
   * @description 标签配置, 用于定义图表的数据标签, 包括数据标签的位置, 格式, 样式等.
   */
  label?: Label
  /**
   * 图例
   * @description 图例配置, 用于定义图表的图例, 包括图例的位置, 格式, 样式等.
   */
  legend?: Legend
  /**
   * 提示信息
   * @description 提示信息配置, 用于定义图表的提示信息, 包括提示信息的位置, 格式, 样式等.
   */
  tooltip?: Tooltip
  /**
   * 框选
   * @description 框选配置，用于开启/关闭 brush 框选能力
   */
  brush?: Brush
  /**
   * 动画配置
   * @description 图表动画配置，按图表类型约束可选效果
   */
  animation?: RadarAnimation
  /**
   * 图表的主题, 主题是优先级较低的功能配置, 包含所有图表类型共用的通用配置, 与单类图表类型共用的图表配置
   * @default light 默认为亮色主题
   * @description 内置light与dark两种主题, 用户可以通过Builder自定义主题
   * @example 'dark'
   * @example 'light'
   * @example 'customThemeName'
   */
  theme?: Theme
  /**
   * @description 点图元样式配置, 用于定义图表的点图元样式, 包括点图元的颜色, 边框等.
   * 支持全局样式或条件样式配置
   * 数据筛选器
   * 若配置selector, 提供数值 selector, 局部数据 selector, 条件维度 selector, 条件指标 selector 共四类数据匹配能力
   * 若未配置selector, 则样式全局生效.
   */
  pointStyle?: PointStyle | PointStyle[]
  /**
   * @description 线图元样式配置, 用于定义图表的线图元样式, 包括线图元的颜色, 透明度, 曲线等.
   * 支持全局样式或条件样式配置
   * 数据筛选器
   * 若配置selector, 提供数值 selector, 局部数据 selector, 条件维度 selector, 条件指标 selector 共四类数据匹配能力
   * 若未配置selector, 则样式全局生效.
   */
  lineStyle?: LineStyle | LineStyle[]
  /**
   * @description 面积图元样式配置, 用于定义图表的面积图元样式, 包括面积图元的颜色, 透明度, 边框等.
   * 支持全局样式或条件样式配置
   * 数据筛选器
   * 若配置selector, 提供数值 selector, 局部数据 selector, 条件维度 selector, 条件指标 selector 共四类数据匹配能力
   * 若未配置selector, 则样式全局生效.
   */
  areaStyle?: AreaStyle | AreaStyle[]
  /**
   * 语言
   * @description 图表语言配置, 支持'zh-CN'与'en-US'两种语言, 另外可以调用 intl.setLocale('zh-CN') 方法设置语言
   * @default 'zh-CN'
   */
  locale?: Locale
}
```

## Rose

源码：[packages/vseed/src/types/chartType/rose/rose.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/types/chartType/rose/rose.ts#L42)

包导出：`Rose`

```typescript
/**
 * @description 堆叠玫瑰图，适用于多维度数据对比场景，通过极坐标系下的扇形弧度和半径展示数据大小
 * 适用场景:
 * - 多维度数据的分布对比
 * - 周期性数据的强弱比较
 * - 分类数据的数值与占比同时展示
 * @encoding
 * 堆叠玫瑰图支持以下视觉通道:
 * `angle`  : 角度通道, 支持`多个维度`, 按维度值映射至角度轴
 * `radius` : 半径通道, 支持`多个指标`, 按指标值映射至半径轴
 * `detail` : 细分通道, 支持`多个维度`, 在同一个颜色系列下展示更细粒度的数据时使用
 * `color`  : 颜色通道, 支持`多个维度`或 `一个指标`, 维度颜色用于区分不同的数据系列, 指标颜色用于线性映射指标值到图形颜色
 * `tooltip`: 提示通道, 支持`多个维度`与 `多个指标`, 会在鼠标悬停在数据点上时展示
 * `label`  : 标签通道, 支持`多个维度`与 `多个指标`, 会在数据点上展示数据标签
 * @warning
 * 数据要求:
 * - 至少1个数值字段（度量）
 * - 第一个维度会放至角度轴, 其余维度会与指标名称(存在多个指标时)合并, 作为图例项展示
 * - 所有指标会自动合并为一个指标
 * 默认开启的功能:
 * - 默认开启图例、极坐标系、数据标签、提示信息、数值缩放
 * @recommend
 * - 推荐字段配置: `1`个指标, `1`个维度
 * - 支持数据重塑: 至少`1`个指标, `0`个维度
 */
export interface Rose {
  /**
   * 堆叠玫瑰图
   * @description 堆叠玫瑰图，通过极坐标系展示多维度数据对比关系
   * @type {'rose'}
   * @example 'rose'
   */
  chartType: 'rose'
  /**
   * 数据集
   * @description 符合TidyData规范的且已经聚合的数据集，用于定义图表的数据来源和结构, 用户输入的数据集并不需要进行任何处理, VSeed带有强大的数据重塑功能, 会自行进行数据重塑, 玫瑰图的数据最终会被转换为2个维度, 1个指标.
   * @type {Array<Record<string|number, any>>}
   * @example [{month:'1月', value:100}, {month:'2月', value:150}, {month:'3月', value:120}]
   */
  dataset: Dataset
  /**
   * 维度
   * @description 玫瑰图的第一个维度被映射到角度轴, 其余维度会与指标名称(存在多个指标时)合并, 作为图例项展示.
   * @example [{id: 'category', alias: '类别'}]
   */
  dimensions?: RoseDimension[]
  /**
   * 指标
   * @description 玫瑰图的指标会自动合并为一个指标, 映射到半径轴, 存在多个指标时, 指标名称会与其余维度合并, 作为图例项展示.
   * @example [{id: 'value', alias: '数值'}]
   */
  measures?: RoseMeasure[]
  /**
   * @description 分页配置, 用于指定分页的字段名, 必须是维度
   */
  page?: Page
  /**
   * 图表的背景颜色
   * @default transparent 默认为透明背景
   * @description 背景颜色可以是颜色字符串, 例如'red', 'blue', 也可以是hex, rgb或rgba'#ff0000', 'rgba(255,0,0,0.5)'
   */
  backgroundColor?: BackgroundColor
  /**
   * 颜色
   * @description 颜色配置, 用于定义图表的颜色方案, 包括颜色列表, 颜色映射, 颜色渐变等.
   */
  color?: Color
  /**
   * 标签
   * @description 标签配置, 用于定义图表的数据标签, 包括数据标签的位置, 格式, 样式等.
   */
  label?: PieLabel
  /**
   * 图例
   * @description 图例配置, 用于定义图表的图例, 包括图例的位置, 格式, 样式等.
   */
  legend?: Legend
  /**
   * 提示信息
   * @description 提示信息配置, 用于定义图表的提示信息, 包括提示信息的位置, 格式, 样式等.
   */
  tooltip?: Tooltip
  /**
   * 框选
   * @description 框选配置，用于开启/关闭 brush 框选能力
   */
  brush?: Brush
  /**
   * 动画配置
   * @description 图表动画配置，按图表类型约束可选效果
   */
  animation?: PieLikeAnimation
  /**
   * 图表的主题, 主题是优先级较低的功能配置, 包含所有图表类型共用的通用配置, 与单类图表类型共用的图表配置
   * @default light 默认为亮色主题
   * @description 内置light与dark两种主题, 用户可以通过Builder自定义主题
   * @example 'dark'
   * @example 'light'
   * @example 'customThemeName'
   */
  theme?: Theme
  /**
   * 语言
   * @description 图表语言配置, 支持'zh-CN'与'en-US'两种语言, 另外可以调用 intl.setLocale('zh-CN') 方法设置语言
   * @default 'zh-CN'
   */
  locale?: Locale
}
```

## RoseParallel

源码：[packages/vseed/src/types/chartType/roseParallel/roseParallel.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/types/chartType/roseParallel/roseParallel.ts#L42)

包导出：`RoseParallel`

```typescript
/**
 * @description 分组玫瑰图，适用于多维度数据对比场景，通过极坐标系下的扇形弧度和半径展示数据大小
 * 适用场景:
 * - 多维度数据的分布对比
 * - 周期性数据的强弱比较
 * - 分类数据的数值与占比同时展示
 * @encoding
 * 分组玫瑰图支持以下视觉通道:
 * `angle`  : 角度通道, 支持`多个维度`, 按维度值映射至角度轴
 * `radius` : 半径通道, 支持`多个指标`, 按指标值映射至半径轴
 * `detail` : 细分通道, 支持`多个维度`, 在同一个颜色系列下展示更细粒度的数据时使用
 * `color`  : 颜色通道, 支持`多个维度`或 `一个指标`, 维度颜色用于区分不同的数据系列, 指标颜色用于线性映射指标值到图形颜色
 * `tooltip`: 提示通道, 支持`多个维度`与 `多个指标`, 会在鼠标悬停在数据点上时展示
 * `label`  : 标签通道, 支持`多个维度`与 `多个指标`, 会在数据点上展示数据标签
 * @warning
 * 数据要求:
 * - 至少1个数值字段（度量）
 * - 第一个维度会放至角度轴, 其余维度会与指标名称(存在多个指标时)合并, 作为图例项展示
 * - 所有指标会自动合并为一个指标
 * 默认开启的功能:
 * - 默认开启图例、极坐标系、数据标签、提示信息、数值缩放
 * @recommend
 * - 推荐字段配置: `1`个指标, `1`个维度
 * - 支持数据重塑: 至少`1`个指标, `0`个维度
 */
export interface RoseParallel {
  /**
   * 分组玫瑰图
   * @description 分组玫瑰图，通过极坐标系展示多维度数据对比关系
   * @type {'roseParallel'}
   * @example 'roseParallel'
   */
  chartType: 'roseParallel'
  /**
   * 数据集
   * @description 符合TidyData规范的且已经聚合的数据集，用于定义图表的数据来源和结构, 用户输入的数据集并不需要进行任何处理, VSeed带有强大的数据重塑功能, 会自行进行数据重塑, 玫瑰图的数据最终会被转换为2个维度, 1个指标.
   * @type {Array<Record<string|number, any>>}
   * @example [{month:'1月', value:100}, {month:'2月', value:150}, {month:'3月', value:120}]
   */
  dataset: Dataset
  /**
   * 维度
   * @description 玫瑰图的第一个维度被映射到角度轴, 其余维度会与指标名称(存在多个指标时)合并, 作为图例项展示.
   * @example [{id: 'category', alias: '类别'}]
   */
  dimensions?: RoseParallelDimension[]
  /**
   * 指标
   * @description 玫瑰图的指标会自动合并为一个指标, 映射到半径轴, 存在多个指标时, 指标名称会与其余维度合并, 作为图例项展示.
   * @example [{id: 'value', alias: '数值'}]
   */
  measures?: RoseParallelMeasure[]
  /**
   * @description 分页配置, 用于指定分页的字段名, 必须是维度
   */
  page?: Page
  /**
   * 图表的背景颜色
   * @default transparent 默认为透明背景
   * @description 背景颜色可以是颜色字符串, 例如'red', 'blue', 也可以是hex, rgb或rgba'#ff0000', 'rgba(255,0,0,0.5)'
   */
  backgroundColor?: BackgroundColor
  /**
   * 颜色
   * @description 颜色配置, 用于定义图表的颜色方案, 包括颜色列表, 颜色映射, 颜色渐变等.
   */
  color?: Color
  /**
   * 标签
   * @description 标签配置, 用于定义图表的数据标签, 包括数据标签的位置, 格式, 样式等.
   */
  label?: PieLabel
  /**
   * 图例
   * @description 图例配置, 用于定义图表的图例, 包括图例的位置, 格式, 样式等.
   */
  legend?: Legend
  /**
   * 提示信息
   * @description 提示信息配置, 用于定义图表的提示信息, 包括提示信息的位置, 格式, 样式等.
   */
  tooltip?: Tooltip
  /**
   * 框选
   * @description 框选配置，用于开启/关闭 brush 框选能力
   */
  brush?: Brush
  /**
   * 动画配置
   * @description 图表动画配置，按图表类型约束可选效果
   */
  animation?: PieLikeAnimation
  /**
   * 图表的主题, 主题是优先级较低的功能配置, 包含所有图表类型共用的通用配置, 与单类图表类型共用的图表配置
   * @default light 默认为亮色主题
   * @description 内置light与dark两种主题, 用户可以通过Builder自定义主题
   * @example 'dark'
   * @example 'light'
   * @example 'customThemeName'
   */
  theme?: Theme
  /**
   * 语言
   * @description 图表语言配置, 支持'zh-CN'与'en-US'两种语言, 另外可以调用 intl.setLocale('zh-CN') 方法设置语言
   * @default 'zh-CN'
   */
  locale?: Locale
}
```

## Sankey

源码：[packages/vseed/src/types/chartType/sankey/sankey.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/types/chartType/sankey/sankey.ts#L35)

包导出：`Sankey`

```typescript
/**
 * @description 桑基图，用于展示 source 到 target 的流向关系，通过连线宽度表示流量大小。
 * 适用场景:
 * - 展示普通 node-link 结构的流向关系
 * - 展示多个 source 维度、多 target 维度拼接后的路径流转
 * @encoding
 * 桑基图支持以下视觉通道:
 * `source`: 起点通道, 支持`多个维度`
 * `target`: 终点通道, 支持`多个维度`
 * `color`: 颜色通道, 支持`多个维度`
 * `size`: 大小通道, 支持`一个指标`
 * `label`: 标签通道, 支持`多个维度`与 `多个指标`
 * `tooltip`: 提示通道, 支持`多个维度`与 `多个指标`
 * @warning
 * 数据要求:
 * - 至少1个 source 维度或默认维度可映射为 source
 * - 至少1个 target 维度
 * - 至少1个数值字段（度量）用于映射流量大小
 * - advanced pipeline 需要将 tidyData 转换为普通 sankey 可消费的 source / target / value 结构
 */
export interface Sankey {
  /**
   * 桑基图
   * @description 桑基图，展示普通 source-target 流向关系和流量大小
   * @type {'sankey'}
   * @example 'sankey'
   */
  chartType: 'sankey'
  /**
   * 数据集
   * @description 符合 TidyData 规范且已经聚合的数据集，用于定义图表的数据来源和结构
   * @type {Array<Record<string|number, any>>}
   * @example [{fromRegion: '华北', toRegion: '华东', value: 30}]
   */
  dataset: Dataset
  /**
   * 维度
   * @description 维度配置，用于定义 source / target 节点结构，支持 source / target / color / detail / label / tooltip / row / column 通道
   * @example [{id: 'fromRegion', alias: '来源区域'}, {id: 'toRegion', alias: '去向区域', encoding: 'target'}]
   */
  dimensions?: SankeyDimension[]
  /**
   * 指标
   * @description 指标配置，用于定义流量大小，支持 size / detail / label / tooltip 通道
   * @example [{id: 'sales', alias: '销售额'}]
   */
  measures?: SankeyMeasure[]
  /**
   * 分页配置
   * @description 用于指定分页的字段名, 必须是维度
   */
  page?: Page
  /**
   * 图表的背景颜色
   * @default transparent 默认为透明背景
   */
  backgroundColor?: BackgroundColor
  /**
   * 颜色
   * @description 颜色配置, 用于定义图表的颜色方案
   */
  color?: Color
  /**
   * 标签
   * @description 标签配置, 用于定义图表的数据标签
   */
  label?: Label
  /**
   * 图例
   * @description 图例配置, 用于定义图形桑基图颜色图例的显示、位置与样式
   */
  legend?: Legend
  /**
   * 提示信息
   * @description 提示信息配置, 用于定义图表的提示信息
   */
  tooltip?: Tooltip
  /**
   * 图表的主题
   * @default light 默认为亮色主题
   */
  theme?: Theme
  /**
   * 语言
   * @description 图表语言配置, 支持 'zh-CN' 与 'en-US'
   * @default 'zh-CN'
   */
  locale?: Locale
}
```

## Scatter

源码：[packages/vseed/src/types/chartType/scatter/scatter.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/types/chartType/scatter/scatter.ts#L53)

包导出：`Scatter`

```typescript
/**
 * @description 散点图，适用于展示数据的分布情况，通过点的位置表示数据的数值
 * 适用场景:
 * - 分析数据的分布特征, 如数据的中心趋势, 分布范围, 异常值等
 * @encoding
 * 散点图支持以下视觉通道:
 * `xAxis`  : x轴通道, 支持`多个指标`, 按指标值映射至x轴
 * `yAxis`  : y轴通道, 支持`多个指标`, 按指标值映射至y轴
 * `color`  : 颜色通道, 支持`多个维度`或 `一个指标`, 维度颜色用于区分不同的数据系列, 指标颜色用于线性映射指标值到图形颜色
 * `tooltip`: 提示通道, 支持`多个维度`与 `多个指标`, 会在鼠标悬停在数据点上时展示
 * `label`  : 标签通道, 支持`多个维度`与 `多个指标`, 会在数据点上展示数据标签
 * @warning
 * 数据要求:
 * - 至少2个数值字段（度量）
 * - 第一个指标字段会放至X轴, 其余指标会进行合并, 映射至Y轴
 * - 指标名称和维度名称会合并, 作为图例项展示
 * 默认开启的功能:
 * - 默认开启图例、坐标轴、数据点标记、提示信息、趋势线
 * @recommend
 * - 推荐字段配置: `2`个指标, `1`个维度
 * - 支持数据重塑: 至少`1`个指标, `0`个维度
 */
export interface Scatter {
  /**
   * 散点图
   * @description 散点图，适用于展示数据的分布情况，通过点的位置表示数据的数值
   * @type {'scatter'}
   * @example 'scatter'
   */
  chartType: 'scatter'
  /**
   * 数据集
   * @description 符合TidyData规范的且已经聚合的数据集，用于定义图表的数据来源和结构, 用户输入的数据集并不需要进行任何处理, VSeed带有强大的数据重塑功能, 会自行进行数据重塑, 折线图的数据最终会被转换为2个维度, 1个指标.
   * @type {Array<Record<string|number, any>>}
   * @example [{month:'1月', value:100}, {month:'2月', value:150}, {month:'3月', value:120}]
   */
  dataset: Dataset
  /**
   * 维度
   * @description 散点图的第一个维度被映射到X轴, 其余维度会与指标名称(存在多个指标时)合并, 作为图例项展示
   * @example [{id: "month", alias: "月份"}]
   */
  dimensions?: ScatterDimension[]
  /**
   * @description 散点图指标
   * @example
   * [
   *   {
   *     id: 'profit', alias: '利润', encoding: 'xAxis'
   *   },
   *   {
   *     id: 'sales', alias: '销售额', encoding: 'yAxis'
   *   }
   * ]
   */
  measures?: ScatterMeasure[]
  /**
   * @description 分页配置, 用于指定分页的字段名, 必须是维度
   */
  page?: Page
  /**
   * @description 散点图指标的大小, 用于定义散点图中数据点的大小 或 大小范围
   * - 若大小范围是一个数字, 例如10, 表示数据点的大小范围固定为10
   * - 若大小范围是一个长度为2的数组, 例如[10, 40], 表示数据点的大小范围在10到40之间
   * - 与sizeRange互斥, 优先级低于 size
   */
  size?: number | number[]
  /**
   * @description 散点图指标的大小范围, 用于定义散点图中数据点的大小范围,
   * - 若大小范围是一个长度为2的数组, 例如[10, 40], 表示数据点的大小范围在10到40之间
   * - 若大小范围是一个数字, 例如10, 表示数据点的大小范围固定为10
   * - 与sizeRange互斥, 优先级高于 size
   */
  sizeRange?: number | number[]
  /**
   * 图表的背景颜色
   * @default transparent 默认为透明背景
   * @description 背景颜色可以是颜色字符串, 例如'red', 'blue', 也可以是hex, rgb或rgba'#ff0000', 'rgba(255,0,0,0.5)'
   */
  backgroundColor?: BackgroundColor
  /**
   * 颜色
   * @description 颜色配置, 用于定义图表的颜色方案, 包括颜色列表, 颜色映射, 颜色渐变等.
   */
  color?: Color
  /**
   * 标签
   * @description 标签配置, 用于定义图表的数据标签, 包括数据标签的位置, 格式, 样式等.
   */
  label?: Label
  /**
   * 图例
   * @description 图例配置, 用于定义图表的图例, 包括图例的位置, 格式, 样式等.
   */
  legend?: Legend
  /**
   * 提示信息
   * @description 提示信息配置, 用于定义图表的提示信息, 包括提示信息的位置, 格式, 样式等.
   */
  tooltip?: Tooltip
  /**
   * 框选
   * @description 框选配置，用于开启/关闭 brush 框选能力
   */
  brush?: Brush
  /**
   * 动画配置
   * @description 图表动画配置，按图表类型约束可选效果
   */
  animation?: ScatterAnimation
  /**
   * x轴
   * @description 数值轴, x轴配置, 用于定义图表的x轴, 包括x轴的位置, 格式, 样式等.
   */
  xAxis?: XLinearAxis
  /**
   * y轴
   * @description 数值轴, y轴配置, 用于定义图表的y轴, 包括y轴的位置, 格式, 样式等.
   */
  yAxis?: YLinearAxis
  /**
   * 垂直提示线
   * @description  鼠标移动到图表上时, 显示的垂直提示线
   */
  crosshairLine?: CrosshairLine
  /**
   * 图表的主题, 主题是优先级较低的功能配置, 包含所有图表类型共用的通用配置, 与单类图表类型共用的图表配置
   * @default light 默认为亮色主题
   * @description 内置light与dark两种主题, 用户可以通过Builder自定义主题
   * @example 'dark'
   * @example 'light'
   * @example 'customThemeName'
   */
  theme?: Theme
  /**
   * 点图元样式
   * @description 点图元样式配置, 用于定义图表的点图元样式, 包括点图元的颜色, 边框等.
   * 支持全局样式或条件样式配置
   * 数据筛选器
   * 若配置selector, 提供数值 selector, 局部数据 selector, 条件维度 selector, 条件指标 selector 共四类数据匹配能力
   * 若未配置selector, 则样式全局生效.
   */
  pointStyle?: PointStyle | PointStyle[]
  /**
   * 标注点
   * @description 标注点配置, 根据选择的数据, 定义图表的标注点, 包括标注点的位置, 格式, 样式等.
   */
  annotationPoint?: AnnotationPoint | AnnotationPoint[]
  /**
   * 标注垂直线
   * @description 数值标注线(包括均值线、最大值线、最小值线等)，竖直方向展示，能够设置标注线的位置, 样式等，如需绘制x轴度量均值线等数值对应的标注线请使用该配置
   */
  annotationVerticalLine?: AnnotationVerticalLine | AnnotationVerticalLine[]
  /**
   * 标注水平线
   * @description 数值标注线(包括均值线、最大值线、最小值线等)，竖直方向展示，能够设置标注线的位置, 样式等，如需绘制y轴度量均值线等数值对应的标注线请使用该配置
   */
  annotationHorizontalLine?: AnnotationHorizontalLine | AnnotationHorizontalLine[]
  /**
   * 标注区域
   * @description 标注区域配置, 根据选择的数据, 定义图表的标注区域, 包括标注区域的位置, 样式等.
   */
  annotationArea?: AnnotationArea | AnnotationArea[]
  /**
   * 线性回归线
   * @description 线性回归线配置, 包括线性回归线的样式等.
   */
  linearRegressionLine?: LinearRegressionLine | LinearRegressionLine[]
  /**
   * 局部加权回归线配置项
   * @description 局部加权回归线配置项, 包括局部加权回归线的样式等.
   */
  lowessRegressionLine?: LowessRegressionLine | LowessRegressionLine[]
  /**
   * 多项式回归线
   * @description 多项式回归线配置, 包括多项式的阶数、回归线的样式等.
   */
  polynomialRegressionLine?: PolynomialRegressionLine | PolynomialRegressionLine[]
  /**
   * 逻辑回归线
   * @description 逻辑回归线配置, 包括逻辑回归线的样式等.
   */
  logisticRegressionLine?: LogisticRegressionLine | LogisticRegressionLine[]
  /**
   * @description 当图表开启透视功能或者指标组合的是否，是否开启维度联动功能
   * 当hover 到某个维度值时，联动高亮其他图表中相同维度值的数据
   */
  dimensionLinkage?: DimensionLinkage
  /**
   * 语言
   * @description 图表语言配置, 支持'zh-CN'与'en-US'两种语言, 另外可以调用 intl.setLocale('zh-CN') 方法设置语言
   * @default 'zh-CN'
   */
  locale?: Locale
}
```

## Sunburst

源码：[packages/vseed/src/types/chartType/sunburst/sunburst.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/types/chartType/sunburst/sunburst.ts#L20)

包导出：`Sunburst`

```typescript
/**
 * @description 旭日图，用于展示层级数据，通过扇形面积大小表示数值大小
 * 适用场景:
 * - 展示多层级数据的占比分布
 * - 强调层级关系和占比
 * @encoding
 * 旭日图支持以下视觉通道:
 * `color`: 颜色通道, 支持`多个维度`或 `一个指标`
 * `label`: 标签通道, 支持`多个维度`与 `多个指标`
 * `tooltip`: 提示通道, 支持`多个维度`与 `多个指标`
 * @warning
 * 数据要求:
 * - 至少1个数值字段（度量）用于映射面积
 * - 至少1个维度字段用于层级划分
 */
export interface Sunburst {
  /**
   * 旭日图
   * @description 旭日图，展示层级数据的占比关系
   * @type {'sunburst'}
   * @example 'sunburst'
   */
  chartType: 'sunburst'
  /**
   * 数据集
   * @description 符合TidyData规范的且已经聚合的数据集，用于定义图表的数据来源和结构
   * @type {Array<Record<string|number, any>>}
   * @example [{category:'A', value:30}, {category:'B', value:70}]
   */
  dataset: Dataset
  /**
   * 维度
   * @description 维度配置，用于定义数据的层级结构
   * @example [{id: 'category', alias: '类别'}]
   */
  dimensions?: HierarchyDimension[]
  /**
   * 指标
   * @description 指标配置，用于定义扇形的大小（面积）
   * @example [{id: 'value', alias: '数值'}]
   */
  measures?: HierarchyMeasure[]
  /**
   * 分页配置
   * @description 用于指定分页的字段名, 必须是维度
   */
  page?: Page
  /**
   * 图表的背景颜色
   * @default transparent 默认为透明背景
   * @description 背景颜色可以是颜色字符串, 例如'red', 'blue', 也可以是hex, rgb或rgba'#ff0000', 'rgba(255,0,0,0.5)'
   */
  backgroundColor?: BackgroundColor
  /**
   * 颜色
   * @description 颜色配置, 用于定义图表的颜色方案, 包括颜色列表, 颜色映射, 颜色渐变等.
   */
  color?: Color
  /**
   * 标签
   * @description 标签配置, 用于定义图表的数据标签, 包括数据标签的位置, 格式, 样式等.
   */
  label?: Label
  /**
   * 提示信息
   * @description 提示信息配置, 用于定义图表的提示信息, 包括提示信息的位置, 格式, 样式等.
   */
  tooltip?: Tooltip
  /**
   * 图表的主题
   * @default light 默认为亮色主题
   * @description 内置light与dark两种主题, 用户可以通过Builder自定义主题
   * @example 'dark'
   * @example 'light'
   */
  theme?: Theme
  /**
   * 语言
   * @description 图表语言配置, 支持'zh-CN'与'en-US'两种语言
   * @default 'zh-CN'
   */
  locale?: Locale
}
```

## Table

源码：[packages/vseed/src/types/chartType/table/table.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/types/chartType/table/table.ts#L23)

包导出：`Table`

```typescript
/**
 * @description 表格，适用于详细数据展示场景，行列分明，便于查看具体数值
 * 适用场景:
 * - 需要展示详细数据明细
 * - 数据项需要精确比对
 * - 展示多维度数据属性
 * @encoding
 * 仅支持配置维度树与指标树, 默认encoding到column
 * @warning
 * 数据要求:
 * - 至少1个维度字段
 * - 至少1个度量字段
 * - 维度字段会作为表格的列标题
 * 默认开启的功能:
 * - 默认开启排序、筛选、分页功能
 * @recommend
 * - 推荐字段配置: `任意`个指标, `任意`个维度
 * - 支持数据重塑: 至少`任意`个指标, `任意`个维度
 */
export interface Table {
  /**
   * @description 标准表格组件，用于展示详细数据
   * @type {'table'}
   * @example 'table'
   */
  chartType: 'table'
  /**
   * @description 符合TidyData规范的且已经聚合的数据集，用于定义图表的数据来源和结构, 用户输入的数据集并不需要进行任何处理, 一个字段对应一列, 一个记录对应一行
   * @type {Array<Record<string|number, any>>}
   * @example [{id: 1, name: "A", value: 100}, {id: 2, name: "B", value: 200}]
   */
  dataset: Dataset
  /**
   * @description 表格的每个维度会对应一列
   * @type {Dimensions}
   * @example [{id: "name", alias: "名称"}]
   */
  dimensions?: DimensionTree
  /**
   * @description 表格的每个指标会对应一行, 并且天生支持指标组合.
   * @type {MeasureTree}
   * @example [{id: "value", alias: "数值"}]
   */
  measures?: MeasureTree
  /**
   * @description 分页配置, 用于指定分页的字段名, 必须是维度
   */
  page?: Page
  /**
   * @default transparent 默认为透明背景
   * @description 背景颜色可以是颜色字符串, 例如'red', 'blue', 也可以是hex, rgb或rgba'#ff0000', 'rgba(255,0,0,0.5)'
   */
  backgroundColor?: BackgroundColor
  /**
   * @description 表格的边框颜色
   */
  borderColor?: string
  /**
   * @description 表格体的字体大小
   */
  bodyFontSize?: number
  /**
   * @description 表格体的字体颜色
   */
  bodyFontColor?: string
  /**
   * @description 表格体的背景颜色
   */
  bodyBackgroundColor?: string
  /**
   * @description 列表头的字体大小
   */
  headerFontSize?: number
  /**
   * @description 列表头的字体颜色
   */
  headerFontColor?: string
  /**
   * @description 列表头的背景颜色
   */
  headerBackgroundColor?: string
  /**
   * @description 鼠标悬浮在列表头的单元格时的背景颜色, 用于突出显示鼠标所在的单元格
   */
  hoverHeaderBackgroundColor?: string
  /**
   * @description 鼠标悬浮在列表头的时, 整行的单元格的背景颜色, 用于突出显示鼠标所在的行
   */
  hoverHeaderInlineBackgroundColor?: string
  /**
   * @description 选中的单元格的边框颜色, 用于突出显示选中的单元格
   */
  selectedBorderColor?: string
  /**
   * @description 选中的单元格的背景颜色, 用于突出显示选中的单元格
   */
  selectedBackgroundColor?: string
  /**
   * @description 设置表格正文部分单元格的特殊样式
   */
  bodyCellStyle?: BodyCellStyle | BodyCellStyle[]
  /**
   * @description 显示汇总行的类型，仅对度量列生效
   * - 'sum': 显示求和行
   * - 'avg': 显示平均值行
   * - 'max': 显示最大值行
   * - 'min': 显示最小值行
   * - 'count': 显示计数行
   * @example 'sum'
   */
  totals?: TotalType
  /**
   * @default light 默认为亮色主题
   * @description 图表的主题, 主题是优先级较低的功能配置, 包含所有图表类型共用的通用配置, 与单类图表类型共用的图表配置, 内置light与dark两种主题, 用户可以通过Builder自定义主题
   * @example 'dark'
   * @example 'light'
   * @example 'customThemeName'
   */
  theme?: Theme
  /**
   * @description 图表语言配置, 支持'zh-CN'与'en-US'两种语言, 另外可以调用 intl.setLocale('zh-CN') 方法设置语言
   * @default 'zh-CN'
   */
  locale?: Locale
}
```

## TreeMap

源码：[packages/vseed/src/types/chartType/treeMap/treeMap.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/types/chartType/treeMap/treeMap.ts#L29)

包导出：`TreeMap`

```typescript
/**
 * @description 矩形树图，用于展示层级数据，通过矩形面积大小表示数值大小
 * 适用场景:
 * - 展示层级数据的占比分布
 * - 强调数据的整体与部分关系
 * @encoding
 * 矩形树图支持以下视觉通道:
 * `color`: 颜色通道, 支持`多个维度`或 `一个指标`
 * `label`: 标签通道, 支持`多个维度`与 `多个指标`
 * `tooltip`: 提示通道, 支持`多个维度`与 `多个指标`
 * @warning
 * 数据要求:
 * - 至少1个数值字段（度量）用于映射面积
 * - 至少1个维度字段用于层级划分
 */
export interface TreeMap {
  /**
   * 矩形树图
   * @description 矩形树图，展示层级数据的占比关系
   * @type {'treeMap'}
   * @example 'treeMap'
   */
  chartType: 'treeMap'
  /**
   * 数据集
   * @description 符合TidyData规范的且已经聚合的数据集，用于定义图表的数据来源和结构
   * @type {Array<Record<string|number, any>>}
   * @example [{category:'A', value:30}, {category:'B', value:70}]
   */
  dataset: Dataset
  /**
   * 维度
   * @description 维度配置，用于定义数据的层级结构
   * @example [{id: 'category', alias: '类别'}]
   */
  dimensions?: HierarchyDimension[]
  /**
   * 指标
   * @description 指标配置，用于定义扇形的大小（面积）
   * @example [{id: 'value', alias: '数值'}]
   */
  measures?: HierarchyMeasure[]
  /**
   * 分页配置
   * @description 用于指定分页的字段名, 必须是维度
   */
  page?: Page
  /**
   * 图表的背景颜色
   * @default transparent 默认为透明背景
   * @description 背景颜色可以是颜色字符串, 例如'red', 'blue', 也可以是hex, rgb或rgba'#ff0000', 'rgba(255,0,0,0.5)'
   */
  backgroundColor?: BackgroundColor
  /**
   * 颜色
   * @description 颜色配置, 用于定义图表的颜色方案, 包括颜色列表, 颜色映射, 颜色渐变等.
   */
  color?: Color
  /**
   * 标签
   * @description 标签配置, 用于定义图表的数据标签, 包括数据标签的位置, 格式, 样式等.
   */
  label?: Label
  /**
   * 提示信息
   * @description 提示信息配置, 用于定义图表的提示信息, 包括提示信息的位置, 格式, 样式等.
   */
  tooltip?: Tooltip
  /**
   * 图表的主题
   * @default light 默认为亮色主题
   * @description 内置light与dark两种主题, 用户可以通过Builder自定义主题
   * @example 'dark'
   * @example 'light'
   */
  theme?: Theme
  /**
   * 语言
   * @description 图表语言配置, 支持'zh-CN'与'en-US'两种语言
   * @default 'zh-CN'
   */
  locale?: Locale
}
```
