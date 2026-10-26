# register

[API 索引](index.md)

- [registerAll](register.md#registerall)
- [registerArea](register.md#registerarea)
- [registerAreaPercent](register.md#registerareapercent)
- [registerBar](register.md#registerbar)
- [registerBarParallel](register.md#registerbarparallel)
- [registerBarPercent](register.md#registerbarpercent)
- [registerBoxPlot](register.md#registerboxplot)
- [registerColumn](register.md#registercolumn)
- [registerColumnParallel](register.md#registercolumnparallel)
- [registerColumnPercent](register.md#registercolumnpercent)
- [registerCustomTheme](register.md#registercustomtheme)
- [registerDarkTheme](register.md#registerdarktheme)
- [registerDonut](register.md#registerdonut)
- [registerDualAxis](register.md#registerdualaxis)
- [registerFunnel](register.md#registerfunnel)
- [registerHeatmap](register.md#registerheatmap)
- [registerHierarchySankey](register.md#registerhierarchysankey)
- [registerHistogram](register.md#registerhistogram)
- [registerLightTheme](register.md#registerlighttheme)
- [registerLine](register.md#registerline)
- [registerPie](register.md#registerpie)
- [registerPivotTable](register.md#registerpivottable)
- [registerRadar](register.md#registerradar)
- [registerRose](register.md#registerrose)
- [registerRoseParallel](register.md#registerroseparallel)
- [registerSankey](register.md#registersankey)
- [registerScatter](register.md#registerscatter)
- [registerTable](register.md#registertable)
- [updateAdvanced](register.md#updateadvanced)
- [updateSpec](register.md#updatespec)

类型引用沿用源码模块名，包的公开导出以索引为准：

```typescript
import type { AdvancedPipe, ChartType, SpecPipe } from 'src/types'
import type { CustomThemeConfig } from 'src/types'
```

## registerAll

源码：[packages/vseed/src/builder/register/all.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/builder/register/all.ts#L43)

包导出：`registerAll`

```typescript
/**
 * @description 注册所有内置的图表类型和主题。
 * 包括：表格、透视表、折线图、柱状图、饼图、散点图等所有支持的图表，以及浅色/深色主题。
 * 在初始化应用时调用此函数，以确保所有功能可用。
 */
export declare const registerAll: () => void
```

## registerArea

源码：[packages/vseed/src/builder/register/chartType/area.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/builder/register/chartType/area.ts#L8)

包导出：`registerArea`

```typescript
/**
 * @description 注册 Area Chart 的构建管线。
 * 注册后，Builder 将支持构建 Area Chart 的 Spec 和 Advanced Config。
 */
export declare const registerArea: () => void
```

## registerAreaPercent

源码：[packages/vseed/src/builder/register/chartType/areaPercent.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/builder/register/chartType/areaPercent.ts#L8)

包导出：`registerAreaPercent`

```typescript
/**
 * @description 注册 Area Percent Chart 的构建管线。
 * 注册后，Builder 将支持构建 Area Percent Chart 的 Spec 和 Advanced Config。
 */
export declare const registerAreaPercent: () => void
```

## registerBar

源码：[packages/vseed/src/builder/register/chartType/bar.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/builder/register/chartType/bar.ts#L8)

包导出：`registerBar`

```typescript
/**
 * @description 注册 Bar Chart 的构建管线。
 * 注册后，Builder 将支持构建 Bar Chart 的 Spec 和 Advanced Config。
 */
export declare const registerBar: () => void
```

## registerBarParallel

源码：[packages/vseed/src/builder/register/chartType/barParallel.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/builder/register/chartType/barParallel.ts#L8)

包导出：`registerBarParallel`

```typescript
/**
 * @description 注册 Bar Parallel Chart 的构建管线。
 * 注册后，Builder 将支持构建 Bar Parallel Chart 的 Spec 和 Advanced Config。
 */
export declare const registerBarParallel: () => void
```

## registerBarPercent

源码：[packages/vseed/src/builder/register/chartType/barPercent.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/builder/register/chartType/barPercent.ts#L8)

包导出：`registerBarPercent`

```typescript
/**
 * @description 注册 Bar Percent Chart 的构建管线。
 * 注册后，Builder 将支持构建 Bar Percent Chart 的 Spec 和 Advanced Config。
 */
export declare const registerBarPercent: () => void
```

## registerBoxPlot

源码：[packages/vseed/src/builder/register/chartType/boxplot.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/builder/register/chartType/boxplot.ts#L8)

包导出：`registerBoxPlot`

```typescript
/**
 * @description 注册 Box Plot Chart 的构建管线。
 * 注册后，Builder 将支持构建 Box Plot Chart 的 Spec 和 Advanced Config。
 */
export declare const registerBoxPlot: () => void
```

## registerColumn

源码：[packages/vseed/src/builder/register/chartType/column.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/builder/register/chartType/column.ts#L8)

包导出：`registerColumn`

```typescript
/**
 * @description 注册 Column Chart 的构建管线。
 * 注册后，Builder 将支持构建 Column Chart 的 Spec 和 Advanced Config。
 */
export declare const registerColumn: () => void
```

## registerColumnParallel

源码：[packages/vseed/src/builder/register/chartType/columnParallel.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/builder/register/chartType/columnParallel.ts#L8)

包导出：`registerColumnParallel`

```typescript
/**
 * @description 注册 Column Parallel Chart 的构建管线。
 * 注册后，Builder 将支持构建 Column Parallel Chart 的 Spec 和 Advanced Config。
 */
export declare const registerColumnParallel: () => void
```

## registerColumnPercent

源码：[packages/vseed/src/builder/register/chartType/columnPercent.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/builder/register/chartType/columnPercent.ts#L8)

包导出：`registerColumnPercent`

```typescript
/**
 * @description 注册 Column Percent Chart 的构建管线。
 * 注册后，Builder 将支持构建 Column Percent Chart 的 Spec 和 Advanced Config。
 */
export declare const registerColumnPercent: () => void
```

## registerCustomTheme

源码：[packages/vseed/src/builder/register/theme/custom.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/builder/register/theme/custom.ts#L16)

包导出：`registerCustomTheme`

```typescript
/**
 * @description 注册自定义主题。
 * @param key 主题的唯一标识符
 * @param themeConfig 主题配置对象，或者一个返回配置对象的函数
 * 如果是函数，它将接收包含 lightTheme 和 darkTheme 的对象作为参数，方便基于现有主题进行扩展。
 * @example
 * registerCustomTheme('myTheme', { ... });
 * // 或者基于浅色主题修改
 * registerCustomTheme('myTheme', ({ lightTheme }) => ({ ...lightTheme, ... }));
 */
export declare const registerCustomTheme: (
  key: string,
  themeConfig:
    | CustomThemeConfig
    | ((props: { lightTheme: CustomThemeConfig; darkTheme: CustomThemeConfig }) => CustomThemeConfig),
) => void
```

## registerDarkTheme

源码：[packages/vseed/src/builder/register/theme/dark.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/builder/register/theme/dark.ts#L8)

包导出：`registerDarkTheme`

```typescript
/**
 * @description 注册深色主题 (Dark Theme)。
 * 注册后，可以通过 Builder.getTheme('dark') 获取。
 */
export declare const registerDarkTheme: () => void
```

## registerDonut

源码：[packages/vseed/src/builder/register/chartType/donut.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/builder/register/chartType/donut.ts#L8)

包导出：`registerDonut`

```typescript
/**
 * @description 注册 Donut Chart 的构建管线。
 * 注册后，Builder 将支持构建 Donut Chart 的 Spec 和 Advanced Config。
 */
export declare const registerDonut: () => void
```

## registerDualAxis

源码：[packages/vseed/src/builder/register/chartType/dualAxis.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/builder/register/chartType/dualAxis.ts#L8)

包导出：`registerDualAxis`

```typescript
/**
 * @description 注册 Dual Axis Chart 的构建管线。
 * 注册后，Builder 将支持构建 Dual Axis Chart 的 Spec 和 Advanced Config。
 */
export declare const registerDualAxis: () => void
```

## registerFunnel

源码：[packages/vseed/src/builder/register/chartType/funnel.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/builder/register/chartType/funnel.ts#L8)

包导出：`registerFunnel`

```typescript
/**
 * @description 注册 Funnel Chart 的构建管线。
 * 注册后，Builder 将支持构建 Funnel Chart 的 Spec 和 Advanced Config。
 */
export declare const registerFunnel: () => void
```

## registerHeatmap

源码：[packages/vseed/src/builder/register/chartType/heatmap.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/builder/register/chartType/heatmap.ts#L8)

包导出：`registerHeatmap`

```typescript
/**
 * @description 注册 Heatmap Chart 的构建管线。
 * 注册后，Builder 将支持构建 Heatmap Chart 的 Spec 和 Advanced Config。
 */
export declare const registerHeatmap: () => void
```

## registerHierarchySankey

源码：[packages/vseed/src/builder/register/chartType/hierarchySankey.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/builder/register/chartType/hierarchySankey.ts#L7)

包导出：`registerHierarchySankey`

```typescript
/**
 * @description 注册 HierarchySankey Chart 的构建管线。
 */
export declare const registerHierarchySankey: () => void
```

## registerHistogram

源码：[packages/vseed/src/builder/register/chartType/histogram.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/builder/register/chartType/histogram.ts#L8)

包导出：`registerHistogram`

```typescript
/**
 * @description 注册 Histogram Chart 的构建管线。
 * 注册后，Builder 将支持构建 Histogram Chart 的 Spec 和 Advanced Config。
 */
export declare const registerHistogram: () => void
```

## registerLightTheme

源码：[packages/vseed/src/builder/register/theme/light.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/builder/register/theme/light.ts#L8)

包导出：`registerLightTheme`

```typescript
/**
 * @description 注册浅色主题 (Light Theme)。
 * 注册后，可以通过 Builder.getTheme('light') 获取。
 */
export declare const registerLightTheme: () => void
```

## registerLine

源码：[packages/vseed/src/builder/register/chartType/line.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/builder/register/chartType/line.ts#L8)

包导出：`registerLine`

```typescript
/**
 * @description 注册 Line Chart 的构建管线。
 * 注册后，Builder 将支持构建 Line Chart 的 Spec 和 Advanced Config。
 */
export declare const registerLine: () => void
```

## registerPie

源码：[packages/vseed/src/builder/register/chartType/pie.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/builder/register/chartType/pie.ts#L8)

包导出：`registerPie`

```typescript
/**
 * @description 注册 Pie Chart 的构建管线。
 * 注册后，Builder 将支持构建 Pie Chart 的 Spec 和 Advanced Config。
 */
export declare const registerPie: () => void
```

## registerPivotTable

源码：[packages/vseed/src/builder/register/chartType/pivotTable.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/builder/register/chartType/pivotTable.ts#L8)

包导出：`registerPivotTable`

```typescript
/**
 * @description 注册 Pivot Table Chart 的构建管线。
 * 注册后，Builder 将支持构建 Pivot Table Chart 的 Spec 和 Advanced Config。
 */
export declare const registerPivotTable: () => void
```

## registerRadar

源码：[packages/vseed/src/builder/register/chartType/radar.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/builder/register/chartType/radar.ts#L8)

包导出：`registerRadar`

```typescript
/**
 * @description 注册 Radar Chart 的构建管线。
 * 注册后，Builder 将支持构建 Radar Chart 的 Spec 和 Advanced Config。
 */
export declare const registerRadar: () => void
```

## registerRose

源码：[packages/vseed/src/builder/register/chartType/rose.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/builder/register/chartType/rose.ts#L8)

包导出：`registerRose`

```typescript
/**
 * @description 注册 Rose Chart 的构建管线。
 * 注册后，Builder 将支持构建 Rose Chart 的 Spec 和 Advanced Config。
 */
export declare const registerRose: () => void
```

## registerRoseParallel

源码：[packages/vseed/src/builder/register/chartType/roseParallel.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/builder/register/chartType/roseParallel.ts#L8)

包导出：`registerRoseParallel`

```typescript
/**
 * @description 注册 Rose Parallel Chart 的构建管线。
 * 注册后，Builder 将支持构建 Rose Parallel Chart 的 Spec 和 Advanced Config。
 */
export declare const registerRoseParallel: () => void
```

## registerSankey

源码：[packages/vseed/src/builder/register/chartType/sankey.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/builder/register/chartType/sankey.ts#L4)

包导出：`registerSankey`

```typescript
export declare const registerSankey: () => void
```

## registerScatter

源码：[packages/vseed/src/builder/register/chartType/scatter.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/builder/register/chartType/scatter.ts#L8)

包导出：`registerScatter`

```typescript
/**
 * @description 注册 Scatter Chart 的构建管线。
 * 注册后，Builder 将支持构建 Scatter Chart 的 Spec 和 Advanced Config。
 */
export declare const registerScatter: () => void
```

## registerTable

源码：[packages/vseed/src/builder/register/chartType/table.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/builder/register/chartType/table.ts#L8)

包导出：`registerTable`

```typescript
/**
 * @description 注册 Table Chart 的构建管线。
 * 注册后，Builder 将支持构建 Table Chart 的 Spec 和 Advanced Config。
 */
export declare const registerTable: () => void
```

## updateAdvanced

源码：[packages/vseed/src/builder/register/custom.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/builder/register/custom.ts#L10)

包导出：`updateAdvanced`

```typescript
/**
 * @description 更新指定图表类型的 Advanced Pipeline。
 * 允许用户注入自定义的处理逻辑到高级配置构建流程中。
 * @param chartType 图表类型
 * @param advancedPipe 新的 Advanced Pipe
 */
export declare const updateAdvanced: (chartType: ChartType, advancedPipe: AdvancedPipe) => void
```

## updateSpec

源码：[packages/vseed/src/builder/register/custom.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/builder/register/custom.ts#L19)

包导出：`updateSpec`

```typescript
/**
 * @description 更新指定图表类型的 Spec Pipeline。
 * 允许用户注入自定义的处理逻辑到最终 Spec 构建流程中。
 * @param chartType 图表类型
 * @param specPipe 新的 Spec Pipe
 */
export declare const updateSpec: (chartType: ChartType, specPipe: SpecPipe) => void
```
