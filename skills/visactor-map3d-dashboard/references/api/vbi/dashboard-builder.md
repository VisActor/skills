# dashboard-builder

[API 索引](index.md)

- [DashboardChartBuilder](dashboard-builder.md#dashboardchartbuilder)
- [DashboardChartBuilderOptions](dashboard-builder.md#dashboardchartbuilderoptions)
- [DashboardChartCollectionBuilder](dashboard-builder.md#dashboardchartcollectionbuilder)
- [DashboardChartCollectionDashboardBuilder](dashboard-builder.md#dashboardchartcollectiondashboardbuilder)
- [DashboardInsightBuilder](dashboard-builder.md#dashboardinsightbuilder)
- [DashboardInsightBuilderOptions](dashboard-builder.md#dashboardinsightbuilderoptions)
- [DashboardInsightCollectionBuilder](dashboard-builder.md#dashboardinsightcollectionbuilder)
- [DashboardInsightCollectionDashboardBuilder](dashboard-builder.md#dashboardinsightcollectiondashboardbuilder)
- [DashboardThemeBuilder](dashboard-builder.md#dashboardthemebuilder)
- [DashboardWidgetLayouts (chart-builder.ts)](dashboard-builder.md#dashboardwidgetlayouts-chart-builderts)
- [DashboardWidgetLayouts (insight-builder.ts)](dashboard-builder.md#dashboardwidgetlayouts-insight-builderts)
- [ResourceReference (chart-builder.ts)](dashboard-builder.md#resourcereference-chart-builderts)
- [ResourceReference (insight-builder.ts)](dashboard-builder.md#resourcereference-insight-builderts)
- [VBIDashboardBuilder](dashboard-builder.md#vbidashboardbuilder)
- [VBIDashboardBuilderDependencies](dashboard-builder.md#vbidashboardbuilderdependencies)

类型引用沿用源码模块名，包的公开导出以索引为准：

```typescript
import * as Y from 'yjs'
import type * as Y from 'yjs'
import type { DefaultVBIQueryDSL, DefaultVBISeedDSL } from 'src/chart-builder/adapters/vquery-vseed/types'
import type {
  ObserveCallback,
  VBIDashboardThemeDefinition,
  VBIDashboardResolvedTheme,
  VBIDashboardThemeOption,
} from 'src/types'
import type { VBIChartBuilder } from 'src/chart-builder/builder'
import type { VBIDashboardBreakpoint, VBIDashboardItemLayout, VBIDashboardWidget } from 'src/types'
import type { VBIDashboardBuilderInterface, VBIDashboardBuilderOptions, VBIDashboardDSL } from 'src/types'
import type { VBIDashboardWidget } from 'src/types'
import type { VBIInsightBuilder } from 'src/insight-builder/builder'
import type { VBIResourceRegistry } from 'src/vbi/resources'
import { DashboardChartBuilder } from './chart-builder'
import {
  DashboardChartCollectionBuilder,
  DashboardInsightCollectionBuilder,
  DashboardThemeBuilder,
  UndoManager,
} from './features'
import { DashboardInsightBuilder } from './insight-builder'
```

## DashboardChartBuilder

源码：[packages/vbi/src/dashboard-builder/features/chart/chart-builder.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/dashboard-builder/features/chart/chart-builder.ts#L20)

包导出：`DashboardChartBuilder`

```typescript
export declare class DashboardChartBuilder<TQueryDSL = DefaultVBIQueryDSL, TSeedDSL = DefaultVBISeedDSL> {
  constructor(widget: Y.Map<any>, options?: DashboardChartBuilderOptions<TQueryDSL, TSeedDSL>)
  /** @description 获取仪表盘组件 ID。 */
  getId(): string
  /** @description 解析组件引用的资源构建器；其文档与撤销历史独立于仪表盘。 */
  getBuilder(): VBIChartBuilder<TQueryDSL, TSeedDSL> | undefined
  /** @description 设置组件标题，修改由所属仪表盘的 undoManager 追踪。 */
  setTitle(title: string): this
  /** @description 设置组件描述。 */
  setDescription(description: string): this
  /** @description 设置引用的图表资源或 UUID，不复制或修改资源内容。 */
  setChart(chart: ResourceReference): this
  /** @description 设置本次 add / update 回调提交的断点布局；在 collection 回调外调用不会写入仪表盘。 */
  setLayouts(layouts: DashboardWidgetLayouts): this
  /** @internal */
  getLayouts(): DashboardWidgetLayouts
  /** @description 导出组件的纯 JSON 配置。 */
  toJSON(): VBIDashboardWidget
}
```

参数默认值（来自源码）：

```typescript
// constructor
options = {}
```

## DashboardChartBuilderOptions

源码：[packages/vbi/src/dashboard-builder/features/chart/chart-builder.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/dashboard-builder/features/chart/chart-builder.ts#L16)

关联声明，未从包入口独立导出。

```typescript
export interface DashboardChartBuilderOptions<TQueryDSL = DefaultVBIQueryDSL, TSeedDSL = DefaultVBISeedDSL> {
  getBuilder?: (chartId: string) => VBIChartBuilder<TQueryDSL, TSeedDSL> | undefined
}
```

## DashboardChartCollectionBuilder

源码：[packages/vbi/src/dashboard-builder/features/chart/chart-collection-builder.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/dashboard-builder/features/chart/chart-collection-builder.ts#L21)

包导出：`DashboardChartCollectionBuilder`

```typescript
export declare class DashboardChartCollectionBuilder<
  TQueryDSL = DefaultVBIQueryDSL,
  TSeedDSL = DefaultVBISeedDSL,
  TDashboardBuilder extends DashboardChartCollectionDashboardBuilder<TQueryDSL, TSeedDSL> =
    DashboardChartCollectionDashboardBuilder<TQueryDSL, TSeedDSL>,
> {
  constructor(doc: Y.Doc, dsl: Y.Map<any>, dashboardBuilder: TDashboardBuilder)
  /** @description 新增图表组件，回调必须设置 layouts.lg。组件与各断点布局在同一个 Yjs 事务中写入，可一起撤销。 */
  add(callback: (chart: DashboardChartBuilder<TQueryDSL, TSeedDSL>) => void): TDashboardBuilder
  /** @description 在同一个 Yjs 事务中更新图表组件及布局；未找到组件时抛出错误。 */
  update(widgetId: string, callback: (chart: DashboardChartBuilder<TQueryDSL, TSeedDSL>) => void): TDashboardBuilder
  /** @description 在同一个 Yjs 事务中删除图表组件及全部断点布局，可一起恢复；引用资源不会删除。 */
  remove(widgetId: string): TDashboardBuilder
  /** @description 通过组件 ID 或引用资源 ID 获取组件构建器，未找到时返回 undefined。 */
  get(widgetId: string): DashboardChartBuilder<TQueryDSL, TSeedDSL> | undefined
  /** @description 通过组件 ID 或引用资源 ID 查找第一个匹配的组件。 */
  find(id: string): DashboardChartBuilder<TQueryDSL, TSeedDSL> | undefined
  /** @description 按仪表盘顺序获取全部图表组件构建器。 */
  findAll(): DashboardChartBuilder<TQueryDSL, TSeedDSL>[]
  /** @description 导出全部图表组件的纯 JSON 配置。 */
  toJSON(): VBIDashboardWidget[]
}
```

## DashboardChartCollectionDashboardBuilder

源码：[packages/vbi/src/dashboard-builder/features/chart/chart-collection-builder.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/dashboard-builder/features/chart/chart-collection-builder.ts#L14)

关联声明，未从包入口独立导出。

```typescript
export interface DashboardChartCollectionDashboardBuilder<
  TQueryDSL = DefaultVBIQueryDSL,
  TSeedDSL = DefaultVBISeedDSL,
> {
  getChartBuilder: (chartId: string) => VBIChartBuilder<TQueryDSL, TSeedDSL> | undefined
}
```

## DashboardInsightBuilder

源码：[packages/vbi/src/dashboard-builder/features/insight/insight-builder.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/dashboard-builder/features/insight/insight-builder.ts#L20)

包导出：`DashboardInsightBuilder`

```typescript
export declare class DashboardInsightBuilder<_TQueryDSL = DefaultVBIQueryDSL, _TSeedDSL = DefaultVBISeedDSL> {
  constructor(widget: Y.Map<any>, options?: DashboardInsightBuilderOptions)
  /** @description 获取仪表盘组件 ID。 */
  getId(): string
  /** @description 解析组件引用的资源构建器；其文档与撤销历史独立于仪表盘。 */
  getBuilder(): VBIInsightBuilder | undefined
  /** @description 设置组件标题，修改由所属仪表盘的 undoManager 追踪。 */
  setTitle(title: string): this
  /** @description 设置组件描述。 */
  setDescription(description: string): this
  /** @description 设置引用的洞察资源或 UUID，不复制或修改资源内容。 */
  setInsightId(insight: ResourceReference): this
  /** @description 设置本次 add / update 回调提交的断点布局；在 collection 回调外调用不会写入仪表盘。 */
  setLayouts(layouts: DashboardWidgetLayouts): this
  /** @internal */
  getLayouts(): DashboardWidgetLayouts
  /** @description 导出组件的纯 JSON 配置。 */
  toJSON(): VBIDashboardWidget
}
```

参数默认值（来自源码）：

```typescript
// constructor
options = {}
```

## DashboardInsightBuilderOptions

源码：[packages/vbi/src/dashboard-builder/features/insight/insight-builder.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/dashboard-builder/features/insight/insight-builder.ts#L16)

关联声明，未从包入口独立导出。

```typescript
export interface DashboardInsightBuilderOptions {
  getBuilder?: (insightId: string) => VBIInsightBuilder | undefined
}
```

## DashboardInsightCollectionBuilder

源码：[packages/vbi/src/dashboard-builder/features/insight/insight-collection-builder.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/dashboard-builder/features/insight/insight-collection-builder.ts#L18)

包导出：`DashboardInsightCollectionBuilder`

```typescript
export declare class DashboardInsightCollectionBuilder<
  TQueryDSL = DefaultVBIQueryDSL,
  TSeedDSL = DefaultVBISeedDSL,
  TDashboardBuilder extends DashboardInsightCollectionDashboardBuilder = DashboardInsightCollectionDashboardBuilder,
> {
  constructor(doc: Y.Doc, dsl: Y.Map<any>, dashboardBuilder: TDashboardBuilder)
  /** @description 新增洞察组件，回调必须设置 layouts.lg。组件与各断点布局在同一个 Yjs 事务中写入，可一起撤销。 */
  add(callback: (insight: DashboardInsightBuilder<TQueryDSL, TSeedDSL>) => void): TDashboardBuilder
  /** @description 在同一个 Yjs 事务中更新洞察组件及布局；未找到组件时抛出错误。 */
  update(widgetId: string, callback: (insight: DashboardInsightBuilder<TQueryDSL, TSeedDSL>) => void): TDashboardBuilder
  /** @description 在同一个 Yjs 事务中删除洞察组件及全部断点布局，可一起恢复；引用资源不会删除。 */
  remove(widgetId: string): TDashboardBuilder
  /** @description 通过组件 ID 或引用资源 ID 获取组件构建器，未找到时返回 undefined。 */
  get(widgetId: string): DashboardInsightBuilder<TQueryDSL, TSeedDSL> | undefined
  /** @description 通过组件 ID 或引用资源 ID 查找第一个匹配的组件。 */
  find(id: string): DashboardInsightBuilder<TQueryDSL, TSeedDSL> | undefined
  /** @description 按仪表盘顺序获取全部洞察组件构建器。 */
  findAll(): DashboardInsightBuilder<TQueryDSL, TSeedDSL>[]
  /** @description 导出全部洞察组件的纯 JSON 配置。 */
  toJSON(): VBIDashboardWidget[]
}
```

## DashboardInsightCollectionDashboardBuilder

源码：[packages/vbi/src/dashboard-builder/features/insight/insight-collection-builder.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/dashboard-builder/features/insight/insight-collection-builder.ts#L14)

关联声明，未从包入口独立导出。

```typescript
export interface DashboardInsightCollectionDashboardBuilder {
  getInsightBuilder: (insightId: string) => VBIInsightBuilder | undefined
}
```

## DashboardThemeBuilder

源码：[packages/vbi/src/dashboard-builder/features/theme/theme-builder.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/dashboard-builder/features/theme/theme-builder.ts#L17)

包导出：`DashboardThemeBuilder`

```typescript
/**
 * @description 仪表盘主题构建器。统一管理主题配置、预设、订阅与 VSeed 注册，组件只消费解析结果。
 */
export declare class DashboardThemeBuilder {
  constructor(dsl: Y.Map<any>)
  /**
   * @description 监听本地、撤销和协同同步引起的主题名称或配置变化，返回取消监听的函数。
   * @param callback - 主题变化回调
   */
  observe(callback: ObserveCallback): () => void
  /**
   * @description 设置主题；传入配置时在同一次变更中保存配置并选中，无需预先注册，不修改引用的图表资源。
   * @param theme - 非空主题名称，内置主题使用 light-xxx / dark-xxx 格式
   * @param definition - 可选的完整主题配置，保存于当前 Dashboard
   */
  setTheme(theme: string, definition?: VBIDashboardThemeDefinition): void
  /**
   * @description 在当前 Dashboard 中注册或更新主题配置，不切换当前主题；配置随文档保存和同步。
   * @param theme - 非空主题名称，内置主题使用 light-xxx / dark-xxx 格式
   * @param definition - 完整主题配置
   */
  registerTheme(theme: string, definition: VBIDashboardThemeDefinition): void
  /**
   * @description 读取主题配置，文档配置优先于内置预设；未定义时返回 undefined，返回副本不会影响原配置。
   * @param theme - 主题名称，默认当前主题
   */
  getThemeConfig(theme?: string): VBIDashboardThemeDefinition | undefined
  /** @description 读取文档内全部主题配置的副本，可配合 observe 订阅可选主题列表。 */
  getThemeDefinitions(): Record<string, VBIDashboardThemeDefinition>
  /** @description 获取内置与文档主题的名称、明暗模式和色板，文档内同名配置优先。 */
  getThemeOptions(): VBIDashboardThemeOption[]
  /**
   * @description 解析主题并确保 VSeed 主题可用，返回隔离的运行时名称；未知名称回退 light-default，不修改文档。
   * @param theme - 主题名称，默认当前主题；可用于临时预览其他主题
   */
  resolveTheme(theme?: string): VBIDashboardResolvedTheme
  /** @description 获取主题名称，默认 light-default。 */
  getTheme(): string
  /** @description 导出主题名称。 */
  toJSON(): string
}
```

参数默认值（来自源码）：

```typescript
// getThemeConfig
theme = this.getTheme()

// resolveTheme
theme = this.getTheme()
```

## DashboardWidgetLayouts (chart-builder.ts)

源码：[packages/vbi/src/dashboard-builder/features/chart/chart-builder.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/dashboard-builder/features/chart/chart-builder.ts#L12)

关联声明，未从包入口独立导出。

```typescript
export type DashboardWidgetLayouts = Partial<
  Record<VBIDashboardBreakpoint, Omit<VBIDashboardItemLayout, 'id' | 'widgetId'>>
>
```

## DashboardWidgetLayouts (insight-builder.ts)

源码：[packages/vbi/src/dashboard-builder/features/insight/insight-builder.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/dashboard-builder/features/insight/insight-builder.ts#L12)

关联声明，未从包入口独立导出。

```typescript
export type DashboardWidgetLayouts = Partial<
  Record<VBIDashboardBreakpoint, Omit<VBIDashboardItemLayout, 'id' | 'widgetId'>>
>
```

## ResourceReference (chart-builder.ts)

源码：[packages/vbi/src/dashboard-builder/features/chart/chart-builder.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/dashboard-builder/features/chart/chart-builder.ts#L6)

关联声明，未从包入口独立导出。

```typescript
type ResourceReference =
  | string
  | {
      getUUID: () => string
    }
```

## ResourceReference (insight-builder.ts)

源码：[packages/vbi/src/dashboard-builder/features/insight/insight-builder.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/dashboard-builder/features/insight/insight-builder.ts#L6)

关联声明，未从包入口独立导出。

```typescript
type ResourceReference =
  | string
  | {
      getUUID: () => string
    }
```

## VBIDashboardBuilder

源码：[packages/vbi/src/dashboard-builder/builder.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/dashboard-builder/builder.ts#L26)

包导出：`VBIDashboardBuilder`

```typescript
/** @description 基于 Yjs 的仪表盘构建器。管理组件、布局与主题；引用的图表和洞察资源拥有独立的文档及撤销历史。 */
export declare class VBIDashboardBuilder<
  TQueryDSL = DefaultVBIQueryDSL,
  TSeedDSL = DefaultVBISeedDSL,
> implements VBIDashboardBuilderInterface<TQueryDSL, TSeedDSL> {
  /** @description 所属 Yjs 文档；可对接同步提供者，通过 doc.destroy() 释放文档及撤销监听器。 */
  doc: Y.Doc
  /** @description 仪表盘根共享类型；嵌套组件与布局的本地事务均在撤销追踪范围内。 */
  dsl: Y.Map<any>
  /** @description 仪表盘本地撤销历史，深度追踪 DSL 子类型，默认每个事务独立成一步；远端更新不进入历史。 */
  undoManager: UndoManager
  /** @description 主题配置、预设与主题变化订阅。 */
  theme: DashboardThemeBuilder
  /** @description 图表组件的增删改查及布局提交。 */
  chart: DashboardChartCollectionBuilder<TQueryDSL, TSeedDSL, VBIDashboardBuilder<TQueryDSL, TSeedDSL>>
  /** @description 洞察组件的增删改查及布局提交。 */
  insight: DashboardInsightCollectionBuilder<TQueryDSL, TSeedDSL, VBIDashboardBuilder<TQueryDSL, TSeedDSL>>
  constructor(doc: Y.Doc, dependencies?: VBIDashboardBuilderDependencies<TQueryDSL, TSeedDSL>)
  /** @description 合并远端 Yjs 更新，不记录到本地撤销历史。origin 可用于同步提供者识别和防止回传。 */
  applyUpdate: (update: Uint8Array, transactionOrigin?: unknown) => void
  /** @description 导出 Yjs 更新；传入对端状态向量可仅导出增量。包含撤销/重做产生的文档变更，不包含本地历史栈。 */
  encodeStateAsUpdate: (targetStateVector?: Uint8Array) => Uint8Array
  /** @description 将多个同步修改合并为一个 Yjs 事务和撤销步骤。自定义 origin 需加入 undoManager 的 trackedOrigins；事务不会自动回滚异常。 */
  transact: (callback: () => void, origin?: unknown) => void
  /** @description 获取仪表盘资源 UUID。 */
  getUUID: () => string
  /** @description 从当前 VBI 资源注册表解析图表构建器；资源修改使用图表自身的撤销历史。 */
  getChartBuilder: (chartId: string) => VBIChartBuilder<TQueryDSL, TSeedDSL> | undefined
  /** @description 从当前 VBI 资源注册表解析洞察构建器；资源修改使用洞察自身的撤销历史。 */
  getInsightBuilder: (insightId: string) => VBIInsightBuilder | undefined
  /** @description 校验并导出纯 JSON DSL，Yjs 内部类型不会出现在结果中。 */
  build: () => VBIDashboardDSL
  /** @description 判断仪表盘是否不包含组件。 */
  isEmpty: () => boolean
}
```

参数默认值（来自源码）：

```typescript
// constructor
dependencies = {}
```

## VBIDashboardBuilderDependencies

源码：[packages/vbi/src/dashboard-builder/builder.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/dashboard-builder/builder.ts#L20)

关联声明，未从包入口独立导出。

```typescript
export interface VBIDashboardBuilderDependencies<TQueryDSL = DefaultVBIQueryDSL, TSeedDSL = DefaultVBISeedDSL> {
  builderOptions?: VBIDashboardBuilderOptions<TQueryDSL, TSeedDSL>
  resourceRegistry?: VBIResourceRegistry<TQueryDSL, TSeedDSL>
}
```
