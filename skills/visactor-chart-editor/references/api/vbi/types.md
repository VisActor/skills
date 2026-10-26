# types

[API 索引](index.md)

- [BuildVSeedOptions](types.md#buildvseedoptions)
- [ObserveCallback](types.md#observecallback)
- [ObserveDeepCallback](types.md#observedeepcallback)
- [Schema](types.md#schema)
- [VBIChartBuildVQueryContext](types.md#vbichartbuildvquerycontext)
- [VBIChartBuildVSeedContext](types.md#vbichartbuildvseedcontext)
- [VBIChartBuilderAdapters](types.md#vbichartbuilderadapters)
- [VBIChartBuilderInterface](types.md#vbichartbuilderinterface)
- [VBIChartBuilderOptions](types.md#vbichartbuilderoptions)
- [VBIChartDSL](types.md#vbichartdsl)
- [VBIChartDSLInput](types.md#vbichartdslinput)
- [VBIChartInstance](types.md#vbichartinstance)
- [VBIChartInstanceOff](types.md#vbichartinstanceoff)
- [VBIChartInstanceOn](types.md#vbichartinstanceon)
- [VBIChartQueryBuilder](types.md#vbichartquerybuilder)
- [VBIChartSeedBuilder](types.md#vbichartseedbuilder)
- [VBIConnector](types.md#vbiconnector)
- [VBIDSLLocale](types.md#vbidsllocale)
- [VBIDSLTheme](types.md#vbidsltheme)
- [VBIDashboardBreakpoint](types.md#vbidashboardbreakpoint)
- [VBIDashboardBreakpoints](types.md#vbidashboardbreakpoints)
- [VBIDashboardBuilderInterface](types.md#vbidashboardbuilderinterface)
- [VBIDashboardBuilderOptions](types.md#vbidashboardbuilderoptions)
- [VBIDashboardDSL](types.md#vbidashboarddsl)
- [VBIDashboardDSLInput](types.md#vbidashboarddslinput)
- [VBIDashboardItemLayout](types.md#vbidashboarditemlayout)
- [VBIDashboardLayout](types.md#vbidashboardlayout)
- [VBIDashboardMeta](types.md#vbidashboardmeta)
- [VBIDashboardResolvedTheme](types.md#vbidashboardresolvedtheme)
- [VBIDashboardThemeDefinition](types.md#vbidashboardthemedefinition)
- [VBIDashboardThemeOption](types.md#vbidashboardthemeoption)
- [VBIDashboardWidget](types.md#vbidashboardwidget)
- [VBIDimension](types.md#vbidimension)
- [VBIDimensionAggregate](types.md#vbidimensionaggregate)
- [VBIDimensionGroup](types.md#vbidimensiongroup)
- [VBIDimensionTree](types.md#vbidimensiontree)
- [VBIHavingAggregate](types.md#vbihavingaggregate)
- [VBIHavingBranch](types.md#vbihavingbranch)
- [VBIHavingClause](types.md#vbihavingclause)
- [VBIHavingFilter](types.md#vbihavingfilter)
- [VBIHavingGroup](types.md#vbihavinggroup)
- [VBIInsightBuilderInterface](types.md#vbiinsightbuilderinterface)
- [VBIInsightDSL](types.md#vbiinsightdsl)
- [VBIInsightDSLInput](types.md#vbiinsightdslinput)
- [VBIMeasure](types.md#vbimeasure)
- [VBIMeasureFormat](types.md#vbimeasureformat)
- [VBIMeasureGroup](types.md#vbimeasuregroup)
- [VBIMeasureTree](types.md#vbimeasuretree)
- [VBIQueryProps](types.md#vbiqueryprops)
- [VBIQueryResult](types.md#vbiqueryresult)
- [VBISort](types.md#vbisort)
- [VBISortOrder](types.md#vbisortorder)
- [VBIWhereBranch](types.md#vbiwherebranch)
- [VBIWhereClause](types.md#vbiwhereclause)
- [VBIWhereDateBounds](types.md#vbiwheredatebounds)
- [VBIWhereDateFilter](types.md#vbiwheredatefilter)
- [VBIWhereDateInput](types.md#vbiwheredateinput)
- [VBIWhereDatePeriod](types.md#vbiwheredateperiod)
- [VBIWhereDatePredicate](types.md#vbiwheredatepredicate)
- [VBIWhereDateUnit](types.md#vbiwheredateunit)
- [VBIWhereFilter](types.md#vbiwherefilter)
- [VBIWhereGroup](types.md#vbiwheregroup)
- [VBIWhereScalarFilter](types.md#vbiwherescalarfilter)
- [findTreeNodesBy](types.md#findtreenodesby)
- [id](types.md#id)
- [isVBIFilter](types.md#isvbifilter)
- [isVBIHavingFilter](types.md#isvbihavingfilter)
- [isVBIHavingGroup](types.md#isvbihavinggroup)
- [isVBIWhereGroup](types.md#isvbiwheregroup)
- [preorderTraverse](types.md#preordertraverse)

类型引用沿用源码模块名，包的公开导出以索引为准：

```typescript
import type { BaseTableAPI } from '@visactor/vtable'
import type { BuildVSeedOptions } from './build-vseed'
import type { DashboardChartCollectionBuilder } from 'src/dashboard-builder/features/chart/chart-collection-builder'
import type { DashboardInsightCollectionBuilder } from 'src/dashboard-builder/features/insight/insight-collection-builder'
import type { DashboardThemeBuilder } from 'src/dashboard-builder/features/theme/theme-builder'
import type { DefaultVBIQueryDSL, DefaultVBISeedDSL } from 'src/chart-builder/adapters/vquery-vseed/types'
import type { Doc, Map } from 'yjs'
import type { IVChart } from '@visactor/vchart'
import type { Map } from 'yjs'
import type { Map, Doc } from 'yjs'
import type {
  MeasuresBuilder,
  DimensionsBuilder,
  ChartTypeBuilder,
  ChartInstanceBuilder,
  HavingFilterBuilder,
  WhereFilterBuilder,
  ThemeBuilder,
  LocaleBuilder,
  LimitBuilder,
  UndoManager,
} from 'src/chart-builder/features'
import type { NumFormat } from '@visactor/vseed'
import type { ObserveCallback, ObserveDeepCallback } from './observe'
import type { UndoManager } from 'src/chart-builder/features'
import type { UndoManagerOptions } from 'src/chart-builder/features/undo-manager/undo-manager'
import type { VBIChartBuilder } from 'src/chart-builder/builder'
import type { VBIChartBuilderInterface } from './VBIInterface'
import type { VBIChartBuilderOptions } from './adapter'
import type { VBIChartDSL } from '../chartDSL'
import type { VBIDashboardDSL, VBIDashboardThemeDefinition } from '../dashboardDSL'
import type { VBIInsightBuilder } from 'src/insight-builder/builder'
import type { VBIInsightDSL } from '../insightDSL'
import type { VBIQueryProps, VBIQueryResult } from './query'
import type { VBIWhereDatePredicate } from './date'
import type {
  VBIWhereFilter,
  VBIWhereClause,
  VBIWhereGroup,
  VBIHavingClause,
  VBIHavingFilter,
  VBIHavingGroup,
} from 'src/types/chartDSL'
import type { VQueryDSL } from '@visactor/vquery'
import type { YEvent, YMapEvent, Transaction } from 'yjs'
import { z } from 'zod'
import { zAggregate } from '../measures/aggregate'
```

## BuildVSeedOptions

源码：[packages/vbi/src/types/builder/build-vseed.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/builder/build-vseed.ts#L1)

包导出：`BuildVSeedOptions`

```typescript
export interface BuildVSeedOptions {
  signal?: AbortSignal
}
```

## ObserveCallback

源码：[packages/vbi/src/types/builder/observe.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/builder/observe.ts#L3)

包导出：`ObserveCallback`

```typescript
export type ObserveCallback = (e: YMapEvent<any>, trans: Transaction) => void
```

## ObserveDeepCallback

源码：[packages/vbi/src/types/builder/observe.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/builder/observe.ts#L4)

包导出：`ObserveDeepCallback`

```typescript
export type ObserveDeepCallback = (events: YEvent<any>[], trans: Transaction) => void
```

## Schema

源码：[packages/vbi/src/types/connector/schema.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/connector/schema.ts#L10)

包导出：`VBISchema`

```typescript
export type Schema = z.infer<typeof zSchema>
```

## VBIChartBuildVQueryContext

源码：[packages/vbi/src/types/builder/adapter.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/builder/adapter.ts#L7)

包导出：`VBIChartBuildVQueryContext`

```typescript
export interface VBIChartBuildVQueryContext<TQueryDSL = DefaultVBIQueryDSL, TSeedDSL = DefaultVBISeedDSL> {
  dsl: Map<any>
  vbiDSL: VBIChartDSL
  builder: VBIChartBuilderInterface<TQueryDSL, TSeedDSL>
}
```

## VBIChartBuildVSeedContext

源码：[packages/vbi/src/types/builder/adapter.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/builder/adapter.ts#L13)

包导出：`VBIChartBuildVSeedContext`

```typescript
export interface VBIChartBuildVSeedContext<
  TQueryDSL = DefaultVBIQueryDSL,
  TSeedDSL = DefaultVBISeedDSL,
> extends VBIChartBuildVQueryContext<TQueryDSL, TSeedDSL> {
  options: BuildVSeedOptions
  queryDSL: TQueryDSL
}
```

## VBIChartBuilderAdapters

源码：[packages/vbi/src/types/builder/adapter.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/builder/adapter.ts#L29)

包导出：`VBIChartBuilderAdapters`

```typescript
export interface VBIChartBuilderAdapters<TQueryDSL = DefaultVBIQueryDSL, TSeedDSL = DefaultVBISeedDSL> {
  buildVQuery: VBIChartQueryBuilder<TQueryDSL, TSeedDSL>
  buildVSeed: VBIChartSeedBuilder<TQueryDSL, TSeedDSL>
}
```

## VBIChartBuilderInterface

源码：[packages/vbi/src/types/builder/VBIInterface.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/builder/VBIInterface.ts#L19)

包导出：`VBIChartBuilderInterface`

```typescript
export interface VBIChartBuilderInterface<TQueryDSL = DefaultVBIQueryDSL, TSeedDSL = DefaultVBISeedDSL> {
  doc: Doc
  dsl: Map<any>
  undoManager: UndoManager
  chartType: ChartTypeBuilder
  instance: ChartInstanceBuilder
  measures: MeasuresBuilder
  dimensions: DimensionsBuilder
  havingFilter: HavingFilterBuilder
  whereFilter: WhereFilterBuilder
  theme: ThemeBuilder
  locale: LocaleBuilder
  limit: LimitBuilder
  applyUpdate: (update: Uint8Array, origin?: any) => void
  encodeStateAsUpdate: (targetStateVector?: Uint8Array) => Uint8Array
  getUUID: () => string
  buildVSeed: (options?: BuildVSeedOptions) => Promise<TSeedDSL>
  buildVQuery: () => TQueryDSL
  build: () => VBIChartDSL
  isEmpty: () => boolean
  observe: (callback: ObserveCallback) => void
  unobserve: (callback: ObserveCallback) => void
  observeDeep: (callback: ObserveDeepCallback) => void
  unobserveDeep: (callback: ObserveDeepCallback) => void
}
```

## VBIChartBuilderOptions

源码：[packages/vbi/src/types/builder/adapter.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/builder/adapter.ts#L34)

包导出：`VBIChartBuilderOptions`

```typescript
export interface VBIChartBuilderOptions<TQueryDSL = DefaultVBIQueryDSL, TSeedDSL = DefaultVBISeedDSL> {
  adapters?: Partial<VBIChartBuilderAdapters<TQueryDSL, TSeedDSL>>
}
```

## VBIChartDSL

源码：[packages/vbi/src/types/chartDSL/vbi/vbi.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/chartDSL/vbi/vbi.ts#L32)

包导出：`VBIChartDSL`

```typescript
export type VBIChartDSL = z.output<typeof zVBIChartDSL>
```

## VBIChartDSLInput

源码：[packages/vbi/src/types/chartDSL/vbi/vbi.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/chartDSL/vbi/vbi.ts#L31)

包导出：`VBIChartDSLInput`

```typescript
export type VBIChartDSLInput = z.input<typeof zVBIChartDSL>
```

## VBIChartInstance

源码：[packages/vbi/src/types/builder/instance.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/builder/instance.ts#L5)

包导出：`VBIChartInstance`

```typescript
/** @description 图表的运行时实例；仅保存在本地，不写入 DSL、协同更新或撤销历史。 */
export type VBIChartInstance = IVChart | BaseTableAPI
```

## VBIChartInstanceOff

源码：[packages/vbi/src/types/builder/instance.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/builder/instance.ts#L11)

包导出：`VBIChartInstanceOff`

```typescript
/** @description VChart 与 VTable 的原生事件取消签名；按当前绑定的渲染器使用。 */
export type VBIChartInstanceOff = BaseTableAPI['off'] & IVChart['off']
```

## VBIChartInstanceOn

源码：[packages/vbi/src/types/builder/instance.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/builder/instance.ts#L8)

包导出：`VBIChartInstanceOn`

```typescript
/** @description VChart 与 VTable 的原生事件注册签名；按当前绑定的渲染器使用。 */
export type VBIChartInstanceOn = BaseTableAPI['on'] & IVChart['on']
```

## VBIChartQueryBuilder

源码：[packages/vbi/src/types/builder/adapter.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/builder/adapter.ts#L21)

包导出：`VBIChartQueryBuilder`

```typescript
export type VBIChartQueryBuilder<TQueryDSL = DefaultVBIQueryDSL, TSeedDSL = DefaultVBISeedDSL> = (
  context: VBIChartBuildVQueryContext<TQueryDSL, TSeedDSL>,
) => TQueryDSL
```

## VBIChartSeedBuilder

源码：[packages/vbi/src/types/builder/adapter.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/builder/adapter.ts#L25)

包导出：`VBIChartSeedBuilder`

```typescript
export type VBIChartSeedBuilder<TQueryDSL = DefaultVBIQueryDSL, TSeedDSL = DefaultVBISeedDSL> = (
  context: VBIChartBuildVSeedContext<TQueryDSL, TSeedDSL>,
) => Promise<TSeedDSL> | TSeedDSL
```

## VBIConnector

源码：[packages/vbi/src/types/connector/connector.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/connector/connector.ts#L13)

包导出：`VBIConnector`

```typescript
export type VBIConnector = z.infer<typeof zVBIConnector>
```

## VBIDSLLocale

源码：[packages/vbi/src/types/chartDSL/locale/locale.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/chartDSL/locale/locale.ts#L6)

包导出：`VBIDSLLocale`

```typescript
export type VBIDSLLocale = z.infer<typeof zVBIDSLLocale>
```

## VBIDSLTheme

源码：[packages/vbi/src/types/chartDSL/theme/theme.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/chartDSL/theme/theme.ts#L4)

包导出：`VBIDSLTheme`

```typescript
export type VBIDSLTheme = z.infer<typeof zVBIDSLTheme>
```

## VBIDashboardBreakpoint

源码：[packages/vbi/src/types/dashboardDSL/breakpoint.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/dashboardDSL/breakpoint.ts#L16)

包导出：`VBIDashboardBreakpoint`

```typescript
export type VBIDashboardBreakpoint = z.output<typeof zVBIDashboardBreakpoint>
```

## VBIDashboardBreakpoints

源码：[packages/vbi/src/types/dashboardDSL/breakpoint.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/dashboardDSL/breakpoint.ts#L17)

包导出：`VBIDashboardBreakpoints`

```typescript
export type VBIDashboardBreakpoints = z.output<typeof zVBIDashboardBreakpoints>
```

## VBIDashboardBuilderInterface

源码：[packages/vbi/src/types/builder/dashboard.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/builder/dashboard.ts#L33)

包导出：`VBIDashboardBuilderInterface`

```typescript
export interface VBIDashboardBuilderInterface<TQueryDSL = DefaultVBIQueryDSL, TSeedDSL = DefaultVBISeedDSL> {
  doc: Doc
  dsl: Map<any>
  undoManager: UndoManager
  theme: DashboardThemeBuilder
  chart: DashboardChartCollectionBuilder<TQueryDSL, TSeedDSL, VBIDashboardBuilderInterface<TQueryDSL, TSeedDSL>>
  insight: DashboardInsightCollectionBuilder<TQueryDSL, TSeedDSL, VBIDashboardBuilderInterface<TQueryDSL, TSeedDSL>>
  applyUpdate: (update: Uint8Array, origin?: any) => void
  encodeStateAsUpdate: (targetStateVector?: Uint8Array) => Uint8Array
  transact: (callback: () => void, origin?: unknown) => void
  getUUID: () => string
  getChartBuilder: (chartId: string) => VBIChartBuilder<TQueryDSL, TSeedDSL> | undefined
  getInsightBuilder: (insightId: string) => VBIInsightBuilder | undefined
  build: () => VBIDashboardDSL
  isEmpty: () => boolean
}
```

## VBIDashboardBuilderOptions

源码：[packages/vbi/src/types/builder/dashboard.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/builder/dashboard.ts#L27)

包导出：`VBIDashboardBuilderOptions`

```typescript
export interface VBIDashboardBuilderOptions<TQueryDSL = DefaultVBIQueryDSL, TSeedDSL = DefaultVBISeedDSL> {
  chart?: VBIChartBuilderOptions<TQueryDSL, TSeedDSL>
  /** @description 本地撤销配置；默认每个事务独立成一步，不记录远端同步。 */
  undoManager?: UndoManagerOptions
}
```

## VBIDashboardDSL

源码：[packages/vbi/src/types/dashboardDSL/dashboard.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/dashboardDSL/dashboard.ts#L17)

包导出：`VBIDashboardDSL`

```typescript
export type VBIDashboardDSL = z.output<typeof zVBIDashboardDSL>
```

## VBIDashboardDSLInput

源码：[packages/vbi/src/types/dashboardDSL/dashboard.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/dashboardDSL/dashboard.ts#L16)

包导出：`VBIDashboardDSLInput`

```typescript
export type VBIDashboardDSLInput = z.input<typeof zVBIDashboardDSL>
```

## VBIDashboardItemLayout

源码：[packages/vbi/src/types/dashboardDSL/layout.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/dashboardDSL/layout.ts#L16)

包导出：`VBIDashboardItemLayout`

```typescript
export type VBIDashboardItemLayout = z.output<typeof zVBIDashboardItemLayout>
```

## VBIDashboardLayout

源码：[packages/vbi/src/types/dashboardDSL/layout.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/dashboardDSL/layout.ts#L17)

包导出：`VBIDashboardLayout`

```typescript
export type VBIDashboardLayout = z.output<typeof zVBIDashboardLayout>
```

## VBIDashboardMeta

源码：[packages/vbi/src/types/dashboardDSL/meta.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/dashboardDSL/meta.ts#L15)

包导出：`VBIDashboardMeta`

```typescript
export type VBIDashboardMeta = z.output<typeof zVBIDashboardMeta>
```

## VBIDashboardResolvedTheme

源码：[packages/vbi/src/types/builder/dashboard.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/builder/dashboard.ts#L13)

包导出：`VBIDashboardResolvedTheme`

```typescript
export interface VBIDashboardResolvedTheme {
  name: string
  chartTheme: string
  baseTheme: 'light' | 'dark'
  definition?: VBIDashboardThemeDefinition
}
```

## VBIDashboardThemeDefinition

源码：[packages/vbi/src/types/dashboardDSL/theme.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/dashboardDSL/theme.ts#L21)

包导出：`VBIDashboardThemeDefinition`

```typescript
export type VBIDashboardThemeDefinition = z.output<typeof zVBIDashboardThemeDefinition>
```

## VBIDashboardThemeOption

源码：[packages/vbi/src/types/builder/dashboard.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/builder/dashboard.ts#L20)

包导出：`VBIDashboardThemeOption`

```typescript
export interface VBIDashboardThemeOption {
  name: string
  baseTheme: 'light' | 'dark'
  label?: string
  colors: string[]
}
```

## VBIDashboardWidget

源码：[packages/vbi/src/types/dashboardDSL/widget.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/dashboardDSL/widget.ts#L21)

包导出：`VBIDashboardWidget`

```typescript
export type VBIDashboardWidget = z.output<typeof zVBIDashboardWidget>
```

## VBIDimension

源码：[packages/vbi/src/types/chartDSL/dimensions/dimensions.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/chartDSL/dimensions/dimensions.ts#L22)

包导出：`VBIDimension`

```typescript
export type VBIDimension = z.infer<typeof zVBIDimensionSchema>
```

## VBIDimensionAggregate

源码：[packages/vbi/src/types/chartDSL/dimensions/aggregate.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/chartDSL/dimensions/aggregate.ts#L18)

包导出：`VBIDimensionAggregate`

```typescript
export type VBIDimensionAggregate = z.infer<typeof zDimensionAggregate>
```

## VBIDimensionGroup

源码：[packages/vbi/src/types/chartDSL/dimensions/dimensions.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/chartDSL/dimensions/dimensions.ts#L23)

包导出：`VBIDimensionGroup`

```typescript
export type VBIDimensionGroup = {
  alias: string
  children: (VBIDimension | VBIDimensionGroup)[]
}
```

## VBIDimensionTree

源码：[packages/vbi/src/types/chartDSL/dimensions/dimensions.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/chartDSL/dimensions/dimensions.ts#L27)

包导出：`VBIDimensionTree`

```typescript
export type VBIDimensionTree = z.infer<typeof zVBIDimensionTree>
```

## VBIHavingAggregate

源码：[packages/vbi/src/types/chartDSL/havingFilter/having.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/chartDSL/havingFilter/having.ts#L5)

包导出：`VBIHavingAggregate`

```typescript
export type VBIHavingAggregate = z.infer<typeof zAggregate>
```

## VBIHavingBranch

源码：[packages/vbi/src/types/chartDSL/havingFilter/having.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/chartDSL/havingFilter/having.ts#L17)

关联声明，未从包入口独立导出。

```typescript
type VBIHavingBranch = {
  id: string
  op: z.infer<typeof zHavingLogicalOperator>
  conditions: VBIHavingClause[]
}
```

## VBIHavingClause

源码：[packages/vbi/src/types/chartDSL/havingFilter/having.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/chartDSL/havingFilter/having.ts#L24)

包导出：`VBIHavingClause`

```typescript
export type VBIHavingClause = VBIHavingFilter | VBIHavingGroup
```

## VBIHavingFilter

源码：[packages/vbi/src/types/chartDSL/havingFilter/having.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/chartDSL/havingFilter/having.ts#L15)

包导出：`VBIHavingFilter`

```typescript
export type VBIHavingFilter = z.infer<typeof zVBIHavingFilter>
```

## VBIHavingGroup

源码：[packages/vbi/src/types/chartDSL/havingFilter/having.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/chartDSL/havingFilter/having.ts#L23)

包导出：`VBIHavingGroup`

```typescript
export type VBIHavingGroup = VBIHavingBranch
```

## VBIInsightBuilderInterface

源码：[packages/vbi/src/types/builder/insight.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/builder/insight.ts#L5)

包导出：`VBIInsightBuilderInterface`

```typescript
export interface VBIInsightBuilderInterface {
  doc: Doc
  dsl: Map<any>
  undoManager: UndoManager
  applyUpdate: (update: Uint8Array, origin?: any) => void
  encodeStateAsUpdate: (targetStateVector?: Uint8Array) => Uint8Array
  getUUID: () => string
  setContent: (content: string) => VBIInsightBuilderInterface
  build: () => VBIInsightDSL
  isEmpty: () => boolean
}
```

## VBIInsightDSL

源码：[packages/vbi/src/types/insightDSL/insight.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/insightDSL/insight.ts#L10)

包导出：`VBIInsightDSL`

```typescript
export type VBIInsightDSL = z.output<typeof zVBIInsightDSL>
```

## VBIInsightDSLInput

源码：[packages/vbi/src/types/insightDSL/insight.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/insightDSL/insight.ts#L9)

包导出：`VBIInsightDSLInput`

```typescript
export type VBIInsightDSLInput = z.input<typeof zVBIInsightDSL>
```

## VBIMeasure

源码：[packages/vbi/src/types/chartDSL/measures/measures.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/chartDSL/measures/measures.ts#L53)

包导出：`VBIMeasure`

```typescript
export type VBIMeasure = z.infer<typeof zVBIMeasure>
```

## VBIMeasureFormat

源码：[packages/vbi/src/types/chartDSL/measures/measures.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/chartDSL/measures/measures.ts#L14)

包导出：`VBIMeasureFormat`

```typescript
export type VBIMeasureFormat =
  | {
      autoFormat: true
    }
  | ({
      autoFormat?: false
    } & NumFormat)
```

## VBIMeasureGroup

源码：[packages/vbi/src/types/chartDSL/measures/measures.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/chartDSL/measures/measures.ts#L54)

包导出：`VBIMeasureGroup`

```typescript
export type VBIMeasureGroup = {
  alias: string
  children: (VBIMeasure | VBIMeasureGroup)[]
}
```

## VBIMeasureTree

源码：[packages/vbi/src/types/chartDSL/measures/measures.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/chartDSL/measures/measures.ts#L58)

包导出：`VBIMeasureTree`

```typescript
export type VBIMeasureTree = z.infer<typeof zVBIMeasureTree>
```

## VBIQueryProps

源码：[packages/vbi/src/types/connector/query.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/connector/query.ts#L19)

包导出：`VBIQueryProps`

```typescript
export type VBIQueryProps = z.infer<typeof zVBIQueryProps>
```

## VBIQueryResult

源码：[packages/vbi/src/types/connector/query.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/connector/query.ts#L10)

包导出：`VBIQueryResult`

```typescript
export type VBIQueryResult = z.infer<typeof zVBIQueryResult>
```

## VBISort

源码：[packages/vbi/src/types/chartDSL/sort.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/chartDSL/sort.ts#L9)

包导出：`VBISort`

```typescript
export type VBISort = z.infer<typeof zVBISort>
```

## VBISortOrder

源码：[packages/vbi/src/types/chartDSL/sort.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/chartDSL/sort.ts#L8)

包导出：`VBISortOrder`

```typescript
export type VBISortOrder = z.infer<typeof zVBISortOrder>
```

## VBIWhereBranch

源码：[packages/vbi/src/types/chartDSL/whereFilter/filters.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/chartDSL/whereFilter/filters.ts#L50)

关联声明，未从包入口独立导出。

```typescript
type VBIWhereBranch = {
  id: string
  op: z.infer<typeof zWhereLogicalOperator>
  conditions: VBIWhereClause[]
}
```

## VBIWhereClause

源码：[packages/vbi/src/types/chartDSL/whereFilter/filters.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/chartDSL/whereFilter/filters.ts#L57)

包导出：`VBIWhereClause`

```typescript
export type VBIWhereClause = VBIWhereFilter | VBIWhereGroup
```

## VBIWhereDateBounds

源码：[packages/vbi/src/types/chartDSL/whereFilter/date.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/chartDSL/whereFilter/date.ts#L5)

包导出：`VBIWhereDateBounds`

```typescript
export type VBIWhereDateBounds = '[)' | '[]'
```

## VBIWhereDateFilter

源码：[packages/vbi/src/types/chartDSL/whereFilter/filters.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/chartDSL/whereFilter/filters.ts#L25)

包导出：`VBIWhereDateFilter`

```typescript
export type VBIWhereDateFilter = {
  id: string
  field: string
  op: 'date'
  value: VBIWhereDatePredicate
}
```

## VBIWhereDateInput

源码：[packages/vbi/src/types/chartDSL/whereFilter/date.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/chartDSL/whereFilter/date.ts#L3)

包导出：`VBIWhereDateInput`

```typescript
export type VBIWhereDateInput = string | Date
```

## VBIWhereDatePeriod

源码：[packages/vbi/src/types/chartDSL/whereFilter/date.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/chartDSL/whereFilter/date.ts#L7)

包导出：`VBIWhereDatePeriod`

```typescript
export type VBIWhereDatePeriod =
  | {
      unit: 'year'
      year: number
    }
  | {
      unit: 'quarter'
      year: number
      quarter: 1 | 2 | 3 | 4
    }
  | {
      unit: 'month'
      year: number
      month: number
    }
  | {
      unit: 'week'
      year: number
      week: number
    }
  | {
      unit: 'day'
      date: VBIWhereDateInput
    }
```

## VBIWhereDatePredicate

源码：[packages/vbi/src/types/chartDSL/whereFilter/date.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/chartDSL/whereFilter/date.ts#L14)

包导出：`VBIWhereDatePredicate`

```typescript
export type VBIWhereDatePredicate =
  | {
      type: 'range'
      start: VBIWhereDateInput
      end: VBIWhereDateInput
      bounds?: VBIWhereDateBounds
    }
  | {
      type: 'relative'
      mode: 'last' | 'next'
      amount: number
      unit: VBIWhereDateUnit
      complete?: boolean
    }
  | {
      type: 'current'
      unit: VBIWhereDateUnit
      offset?: number
    }
  | ({
      type: 'period'
    } & VBIWhereDatePeriod)
```

## VBIWhereDateUnit

源码：[packages/vbi/src/types/chartDSL/whereFilter/date.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/chartDSL/whereFilter/date.ts#L4)

包导出：`VBIWhereDateUnit`

```typescript
export type VBIWhereDateUnit = 'year' | 'quarter' | 'month' | 'week' | 'day'
```

## VBIWhereFilter

源码：[packages/vbi/src/types/chartDSL/whereFilter/filters.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/chartDSL/whereFilter/filters.ts#L32)

包导出：`VBIWhereFilter`

```typescript
export type VBIWhereFilter = VBIWhereScalarFilter | VBIWhereDateFilter
```

## VBIWhereGroup

源码：[packages/vbi/src/types/chartDSL/whereFilter/filters.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/chartDSL/whereFilter/filters.ts#L56)

包导出：`VBIWhereGroup`

```typescript
export type VBIWhereGroup = VBIWhereBranch
```

## VBIWhereScalarFilter

源码：[packages/vbi/src/types/chartDSL/whereFilter/filters.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/types/chartDSL/whereFilter/filters.ts#L18)

包导出：`VBIWhereScalarFilter`

```typescript
export type VBIWhereScalarFilter = {
  id: string
  field: string
  op: string
  value?: unknown
}
```

## findTreeNodesBy

源码：[packages/vseed/src/pipeline/utils/tree/traverse.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/pipeline/utils/tree/traverse.ts#L35)

包导出：`findTreeNodesBy`

```typescript
export declare const findTreeNodesBy: <Node, K extends string = 'children'>(
  nodes: Node[] | undefined,
  callback: (node: Node) => boolean,
  childrenKey?: K,
) => Node[]
```

参数默认值（来自源码）：

```typescript
// findTreeNodesBy
nodes = []

// findTreeNodesBy
childrenKey = 'children' as K
```

## id

源码：[packages/vbi/src/utils/id.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/utils/id.ts#L3)

包导出：`id`

```typescript
export declare const id: {
  uuid: () => string
  resourceUUID: () => string
}
```

## isVBIFilter

源码：[packages/vbi/src/utils/filter-guards.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/utils/filter-guards.ts#L10)

包导出：`isVBIFilter`

```typescript
export declare function isVBIFilter(clause: VBIWhereClause): clause is VBIWhereFilter
```

## isVBIHavingFilter

源码：[packages/vbi/src/utils/filter-guards.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/utils/filter-guards.ts#L18)

包导出：`isVBIHavingFilter`

```typescript
export declare function isVBIHavingFilter(clause: VBIHavingClause): clause is VBIHavingFilter
```

## isVBIHavingGroup

源码：[packages/vbi/src/utils/filter-guards.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/utils/filter-guards.ts#L22)

包导出：`isVBIHavingGroup`

```typescript
export declare function isVBIHavingGroup(clause: VBIHavingClause): clause is VBIHavingGroup
```

## isVBIWhereGroup

源码：[packages/vbi/src/utils/filter-guards.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/utils/filter-guards.ts#L14)

包导出：`isVBIWhereGroup`

```typescript
export declare function isVBIWhereGroup(clause: VBIWhereClause): clause is VBIWhereGroup
```

## preorderTraverse

源码：[packages/vseed/src/pipeline/utils/tree/traverse.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/pipeline/utils/tree/traverse.ts#L9)

包导出：`preorderTraverse`

```typescript
export declare const preorderTraverse: <Node, K extends string = 'children'>(
  tree: Node[],
  callback: (node: Node) => boolean,
  childrenKey?: K,
) => void
```

参数默认值（来自源码）：

```typescript
// preorderTraverse
childrenKey = 'children' as K
```
