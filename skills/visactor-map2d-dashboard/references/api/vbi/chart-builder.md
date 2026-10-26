# chart-builder

[API 索引](index.md)

- [ChartInstanceBuilder](chart-builder.md#chartinstancebuilder)
- [ChartTypeBuilder](chart-builder.md#charttypebuilder)
- [DimensionsBuilder](chart-builder.md#dimensionsbuilder)
- [HavingFilterBuilder](chart-builder.md#havingfilterbuilder)
- [LimitBuilder](chart-builder.md#limitbuilder)
- [LocaleBuilder](chart-builder.md#localebuilder)
- [MeasuresBuilder](chart-builder.md#measuresbuilder)
- [ThemeBuilder](chart-builder.md#themebuilder)
- [UndoManager](chart-builder.md#undomanager)
- [UndoManagerOptions](chart-builder.md#undomanageroptions)
- [VBIChartBuilder](chart-builder.md#vbichartbuilder)
- [WhereFilterBuilder](chart-builder.md#wherefilterbuilder)
- [buildVQuery](chart-builder.md#buildvquery)
- [defaultVBIChartBuilderAdapters](chart-builder.md#defaultvbichartbuilderadapters)
- [resolveVBIChartBuilderAdapters](chart-builder.md#resolvevbichartbuilderadapters)

类型引用沿用源码模块名，包的公开导出以索引为准：

```typescript
import * as Y from 'yjs'
import type * as Y from 'yjs'
import type {
  BuildVSeedOptions,
  VBIChartDSL,
  VBIChartBuilderAdapters,
  VBIChartBuilderInterface,
  VBIChartBuilderOptions,
  ObserveCallback,
  ObserveDeepCallback,
} from 'src/types'
import type { ChartTypeBuilder } from '../chart-type'
import type { DefaultVBIQueryDSL, DefaultVBISeedDSL } from './types'
import type { DefaultVBIQueryDSL, DefaultVBISeedDSL } from 'src/chart-builder/adapters/vquery-vseed'
import type { ObserveCallback } from 'src/types'
import type { ObserveDeepCallback, VBIDimension, VBIDimensionGroup, VBIDimensionTree } from 'src/types'
import type { ObserveDeepCallback, VBIMeasure, VBIMeasureGroup, VBIMeasureTree } from 'src/types'
import type { VBIChartBuilderAdapters } from 'src/types'
import type { VBIChartBuilderInterface, VBIChartDSL } from 'src/types'
import type { VBIChartInstance, VBIChartInstanceOn, VBIChartInstanceOff } from 'src/types'
import type { VBIHavingGroup, ObserveDeepCallback } from 'src/types'
import type { VBIWhereGroup, ObserveDeepCallback } from 'src/types'
import type { VQueryDSL } from '@visactor/vquery'
import { DimensionNodeBuilder } from './dim-node-builder'
import {
  DimensionsBuilder,
  MeasuresBuilder,
  HavingFilterBuilder,
  WhereFilterBuilder,
  ChartTypeBuilder,
  ChartInstanceBuilder,
  ThemeBuilder,
  LocaleBuilder,
  LimitBuilder,
  UndoManager,
} from './features'
import { HavingFilterNodeBuilder } from './having-node-builder'
import { HavingGroupBuilder } from './having-group-builder'
import { MeasureNodeBuilder } from './mea-node-builder'
import { WhereFilterNodeBuilder } from './where-node-builder'
import { WhereGroupBuilder } from './where-group-builder'
```

## ChartInstanceBuilder

源码：[packages/vbi/src/chart-builder/features/instance/instance-builder.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/chart-builder/features/instance/instance-builder.ts#L8)

包导出：`ChartInstanceBuilder`

```typescript
/** @description 管理图表的本地渲染实例及原生事件代理，不参与 DSL、协同同步或撤销历史。 */
export declare class ChartInstanceBuilder {
  constructor(doc: Y.Doc, chartType: ChartTypeBuilder)
  /**
   * @description 绑定运行时实例并返回当前实例构建器。table / pivotTable 使用 VTable，其余类型使用 VChart。重复绑定替换引用，undefined 解绑；同一实例不能绑定到两个构建器。切换图表类型或销毁文档时自动解绑，事件清理和 release 由调用方负责。
   * @param instance - 已创建的 VChart / VTable 实例，或 undefined
   */
  bind(instance: VBIChartInstance | undefined): this
  /** @description 获取绑定实例，未绑定时返回 undefined。类型参数可指定调用方已知的 IVChart 或 BaseTableAPI 等原生类型。 */
  get<T extends VBIChartInstance = VBIChartInstance>(): T | undefined
  /** @description 代理当前实例的原生 on，保留参数、返回值和 this；VTable 返回监听器 ID。必须先 bind，重新绑定后需重新注册监听器。 */
  on: VBIChartInstanceOn
  /** @description 代理当前实例的原生 off；VChart 接收事件名及回调，VTable 接收监听器 ID。未绑定时抛出错误。 */
  off: VBIChartInstanceOff
}
```

## ChartTypeBuilder

源码：[packages/vbi/src/chart-builder/features/chart-type/chart-type-builder.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/chart-builder/features/chart-type/chart-type-builder.ts#L18)

包导出：`ChartTypeBuilder`

```typescript
/**
 * @description 图表类型构建器，用于切换和获取图表类型。支持表格、柱状图、折线图、饼图、散点图等多种图表类型
 */
export declare class ChartTypeBuilder {
  /**
   * @description 构造函数
   */
  constructor(doc: Y.Doc, dsl: Y.Map<any>)
  /**
   * @description 监听图表类型变化
   * @param callback - 回调函数
   */
  /**
   * @description 监听图表类型变化，返回取消监听的函数
   * @param callback - 回调函数
   * @returns 取消监听的函数
   */
  observe(callback: ObserveCallback): () => void
  /**
   * @description 设置图表类型
   * @param chartType - 图表类型
   */
  changeChartType(chartType: string): void
  /**
   * @description 获取当前图表类型
   */
  getChartType(): string
  /**
   * @description 获取当前图表类型支持的维度编码
   */
  getSupportedDimensionEncodings(): import('./dimension-encoding').SupportedDimensionEncoding[]
  /**
   * @description 根据当前图表类型，按维度顺序返回推荐的维度编码
   * @param dimensionCount - 维度数量，默认使用当前 DSL 中的维度数量
   */
  getRecommendedDimensionEncodings(dimensionCount?: number): import('./dimension-encoding').SupportedDimensionEncoding[]
  /**
   * @description 获取当前图表类型支持的指标编码
   */
  getSupportedMeasureEncodings(): import('./measure-encoding').SupportedMeasureEncoding[]
  /**
   * @description 根据当前图表类型，按指标顺序返回推荐的指标编码
   * @param measureCount - 指标数量，默认使用当前 DSL 中的指标数量
   */
  getRecommendedMeasureEncodings(measureCount?: number): import('./measure-encoding').SupportedMeasureEncoding[]
  /**
   * @description 导出为 JSON
   */
  toJSON(): string
  /**
   * @description 获取所有支持的图表类型
   */
  getAvailableChartTypes(): string[]
}
```

## DimensionsBuilder

源码：[packages/vbi/src/chart-builder/features/dimensions/dim-builder.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/chart-builder/features/dimensions/dim-builder.ts#L11)

包导出：`DimensionsBuilder`

```typescript
/**
 * @description 维度构建器，用于添加、修改、删除维度配置。维度是数据的分类字段，如：时间、地区、产品类别
 */
export declare class DimensionsBuilder {
  constructor(doc: Y.Doc, dsl: Y.Map<any>)
  /**
   * @description 添加一个维度
   * @param field - 字段名
   * @param callback - 回调函数
   */
  add(field: string, callback: (node: DimensionNodeBuilder) => void): DimensionsBuilder
  /**
   * @description 删除指定 ID 的维度
   * @param id - 维度 ID
   */
  remove(id: string): DimensionsBuilder
  /**
   * @description 更新指定维度 ID 的配置
   * @param id - 维度 ID
   * @param callback - 回调函数
   */
  update(id: string, callback: (node: DimensionNodeBuilder) => void): DimensionsBuilder
  /**
   * @description 按回调条件查找第一个维度，行为与 Array.find 一致
   * @param predicate - 查找条件
   */
  find(predicate: (node: DimensionNodeBuilder, index: number) => boolean): DimensionNodeBuilder | undefined
  /**
   * @description 获取所有维度
   */
  findAll(): DimensionNodeBuilder[]
  /**
   * @description 导出所有维度为 JSON 数组
   */
  toJSON(): VBIDimension[]
  /**
   * @description 监听维度变化，返回取消监听的函数
   * @param callback - 回调函数
   * @returns 取消监听的函数
   */
  observe(callback: ObserveDeepCallback): () => void
  static isDimensionNode(node: VBIDimensionTree[0]): node is VBIDimension
  static isDimensionGroup(node: VBIDimensionTree[0]): node is VBIDimensionGroup
}
```

## HavingFilterBuilder

源码：[packages/vbi/src/chart-builder/features/havingFilter/having-builder.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/chart-builder/features/havingFilter/having-builder.ts#L11)

包导出：`HavingFilterBuilder`

```typescript
/**
 * @description Having 过滤构建器，用于添加、修改、删除分组后过滤条件。Having 过滤在数据聚合后生效，用于筛选分组结果
 */
export declare class HavingFilterBuilder {
  constructor(doc: Y.Doc, dsl: Y.Map<any>)
  getConditions(): Y.Array<any>
  /**
   * @description 添加一个 Having 过滤条件
   * @param field - 字段名
   * @param callback - 回调函数
   */
  add(field: string, callback: (node: HavingFilterNodeBuilder) => void): HavingFilterBuilder
  /**
   * @description 添加一个 Having 分组
   * @param op - 逻辑操作符
   * @param callback - 回调函数
   */
  addGroup(op: 'and' | 'or', callback: (group: HavingGroupBuilder) => void): HavingFilterBuilder
  /**
   * @description 更新指定 ID 的过滤条件
   * @param id - 过滤条件 ID
   * @param callback - 回调函数
   */
  update(id: string, callback: (node: HavingFilterNodeBuilder) => void): HavingFilterBuilder
  /**
   * @description 更新指定 ID 的分组
   * @param id - 分组 ID
   * @param callback - 回调函数
   */
  updateGroup(id: string, callback: (group: HavingGroupBuilder) => void): HavingFilterBuilder
  /**
   * @description 删除指定 ID 的条件或指定索引的项
   * @param idOrIndex - ID 或索引
   */
  remove(idOrIndex: string | number): HavingFilterBuilder
  /**
   * @description 按回调条件查找第一个条件（过滤或分组），行为与 Array.find 一致
   * @param predicate - 查找条件
   */
  find(
    predicate: (entry: HavingFilterNodeBuilder | HavingGroupBuilder, index: number) => boolean,
  ): HavingFilterNodeBuilder | HavingGroupBuilder | undefined
  /**
   * @description 清空所有 Having 过滤条件
   */
  clear(): this
  /**
   * @description 导出完整的 Having 过滤配置
   */
  toJSON(): VBIHavingGroup
  /**
   * @description 监听过滤条件变化，返回取消监听的函数
   * @param callback - 回调函数
   * @returns 取消监听的函数
   */
  observe(callback: ObserveDeepCallback): () => void
  /**
   * @description 判断是否为分组节点
   */
  static isGroup(yMap: Y.Map<any>): boolean
  /**
   * @description 判断是否为叶子节点
   */
  static isNode(yMap: Y.Map<any>): boolean
}
```

## LimitBuilder

源码：[packages/vbi/src/chart-builder/features/limit/limit-builder.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/chart-builder/features/limit/limit-builder.ts#L7)

包导出：`LimitBuilder`

```typescript
/**
 * @description 数据量限制构建器，用于设置和获取当前 limit
 */
export declare class LimitBuilder {
  /**
   * @description 构造函数
   */
  constructor(_doc: Y.Doc, dsl: Y.Map<any>)
  /**
   * @description 监听 limit 变化，返回取消监听的函数
   * @param callback - 回调函数
   * @returns 取消监听的函数
   */
  observe(callback: ObserveCallback): () => void
  /**
   * @description 设置 limit
   * @param limit - 数据量限制
   */
  setLimit(limit: number): void
  /**
   * @description 获取当前 limit
   */
  getLimit(): number | undefined
  /**
   * @description 导出为 JSON
   */
  toJSON(): number | undefined
}
```

## LocaleBuilder

源码：[packages/vbi/src/chart-builder/features/locale/locale-builder.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/chart-builder/features/locale/locale-builder.ts#L7)

包导出：`LocaleBuilder`

```typescript
/**
 * @description 语言构建器，用于设置和获取当前语言
 */
export declare class LocaleBuilder {
  /**
   * @description 构造函数
   */
  constructor(_doc: Y.Doc, dsl: Y.Map<any>)
  /**
   * @description 监听语言变化，返回取消监听的函数
   * @param callback - 回调函数
   * @returns 取消监听的函数
   */
  observe(callback: ObserveCallback): () => void
  /**
   * @description 设置语言
   * @param locale - 语言名称
   */
  setLocale(locale: string): void
  /**
   * @description 获取当前语言
   */
  getLocale(): string
  /**
   * @description 导出为 JSON
   */
  toJSON(): string
}
```

## MeasuresBuilder

源码：[packages/vbi/src/chart-builder/features/measures/mea-builder.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/chart-builder/features/measures/mea-builder.ts#L11)

包导出：`MeasuresBuilder`

```typescript
/**
 * @description 度量构建器，用于添加、修改、删除度量配置。度量是数据的数值字段，如：销售额、利润、数量
 */
export declare class MeasuresBuilder {
  constructor(doc: Y.Doc, dsl: Y.Map<any>)
  /**
   * @description 添加一个度量
   * @param field - 字段名
   * @param callback - 回调函数
   */
  add(field: string, callback: (node: MeasureNodeBuilder) => void): MeasuresBuilder
  /**
   * @description 删除指定 ID 的度量
   * @param id - 度量 ID
   */
  remove(id: string): MeasuresBuilder
  /**
   * @description 更新度量配置
   * @param id - 度量 ID
   * @param callback - 回调函数
   */
  update(id: string, callback: (node: MeasureNodeBuilder) => void): MeasuresBuilder
  /**
   * @description 按回调条件查找第一个度量，行为与 Array.find 一致
   * @param predicate - 查找条件
   */
  find(predicate: (node: MeasureNodeBuilder, index: number) => boolean): MeasureNodeBuilder | undefined
  /**
   * @description 获取所有度量
   */
  findAll(): MeasureNodeBuilder[]
  /**
   * @description 导出所有度量为 JSON 数组
   */
  toJSON(): VBIMeasure[]
  /**
   * @description 监听度量变化
   * @param callback - 回调函数
   */
  /**
   * @description 监听度量变化，返回取消监听的函数
   * @param callback - 回调函数
   * @returns 取消监听的函数
   */
  observe(callback: ObserveDeepCallback): () => void
  static isMeasureNode(node: VBIMeasureTree[0]): node is VBIMeasure
  static isMeasureGroup(node: VBIMeasureTree[0]): node is VBIMeasureGroup
}
```

## ThemeBuilder

源码：[packages/vbi/src/chart-builder/features/theme/theme-builder.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/chart-builder/features/theme/theme-builder.ts#L7)

包导出：`ThemeBuilder`

```typescript
/**
 * @description 主题构建器，用于设置和获取当前主题
 */
export declare class ThemeBuilder {
  /**
   * @description 构造函数
   */
  constructor(_doc: Y.Doc, dsl: Y.Map<any>)
  /**
   * @description 监听主题变化，返回取消监听的函数
   * @param callback - 回调函数
   * @returns 取消监听的函数
   */
  observe(callback: ObserveCallback): () => void
  /**
   * @description 设置主题
   * @param theme - 主题名称
   */
  setTheme(theme: string): void
  /**
   * @description 获取当前主题
   */
  getTheme(): string
  /**
   * @description 导出为 JSON
   */
  toJSON(): string
}
```

## UndoManager

源码：[packages/vbi/src/chart-builder/features/undo-manager/undo-manager.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/chart-builder/features/undo-manager/undo-manager.ts#L14)

包导出：`UndoManager`

```typescript
/**
 * @description 撤销/重做管理器，提供基于 YJS 的撤销和重做功能，支持栈管理和历史清除操作
 */
export declare class UndoManager {
  /**
   * @description 构造函数
   * @param scope - YJS 文档或类型作用域，用于定义撤销/重做的追踪范围
   */
  constructor(scope: Y.Doc | Y.AbstractType<any> | Y.AbstractType<any>[], options?: UndoManagerOptions)
  /**
   * @description 撤销上一次修改
   * @returns 是否成功撤销
   */
  undo(): boolean
  /**
   * @description 重做被撤销的修改
   * @returns 是否成功重做
   */
  redo(): boolean
  /**
   * @description 检查是否有可撤销的操作
   * @returns 是否可以撤销
   */
  canUndo(): boolean
  /**
   * @description 检查是否有可重做的操作
   * @returns 是否可以重做
   */
  canRedo(): boolean
  /**
   * @description 清除历史记录
   * @param clearUndoStack - 是否清除撤销栈，默认 true
   * @param clearRedoStack - 是否清除重做栈，默认 true
   */
  clear(clearUndoStack?: boolean, clearRedoStack?: boolean): void
  /** @description 结束当前历史分组，下一次修改作为新的撤销步骤。 */
  stopCapturing(): void
  /** @description 开始追踪指定来源的本地事务。 */
  addTrackedOrigin(origin: unknown): void
  /** @description 停止追踪指定来源的本地事务，不影响已有历史。 */
  removeTrackedOrigin(origin: unknown): void
  /** @description 订阅历史新增、合并、撤销、重做和清空，返回取消订阅函数；回调中可读取 canUndo / canRedo。 */
  observe(callback: () => void): () => void
  /** @description 停止追踪并释放监听器；销毁所属 Y.Doc 时也会自动释放。 */
  destroy(): void
}
```

参数默认值（来自源码）：

```typescript
// constructor
options = {}
```

## UndoManagerOptions

源码：[packages/vbi/src/chart-builder/features/undo-manager/undo-manager.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/chart-builder/features/undo-manager/undo-manager.ts#L4)

包导出：`UndoManagerOptions`

```typescript
/** @description 撤销历史选项。只记录本地事务；默认追踪 origin 为 null 的事务。 */
export interface UndoManagerOptions {
  /** @description 合并相邻操作的时间窗口（毫秒）；0 表示每个事务独立成一步。 */
  captureTimeout?: number
  /** @description 需要记录的本地事务来源，可包含 origin 对象或其构造函数。 */
  trackedOrigins?: Set<unknown>
}
```

## VBIChartBuilder

源码：[packages/vbi/src/chart-builder/builder.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/chart-builder/builder.ts#L36)

包导出：`VBIChartBuilder`

```typescript
export declare class VBIChartBuilder<
  TQueryDSL = DefaultVBIQueryDSL,
  TSeedDSL = DefaultVBISeedDSL,
> implements VBIChartBuilderInterface<TQueryDSL, TSeedDSL> {
  doc: Y.Doc
  dsl: Y.Map<any>
  adapters: VBIChartBuilderAdapters<TQueryDSL, TSeedDSL>
  chartType: ChartTypeBuilder
  /** @description 图表运行时实例的绑定、获取与原生事件代理。 */
  instance: ChartInstanceBuilder
  measures: MeasuresBuilder
  dimensions: DimensionsBuilder
  havingFilter: HavingFilterBuilder
  whereFilter: WhereFilterBuilder
  theme: ThemeBuilder
  locale: LocaleBuilder
  limit: LimitBuilder
  /** @description 图表撤销历史，每个 Yjs 事务独立成一步；连续 add / update 不按时间合并，doc.transact 可显式合并多个修改。 */
  undoManager: UndoManager
  constructor(doc: Y.Doc, options?: VBIChartBuilderOptions<TQueryDSL, TSeedDSL>, dsl?: Y.Map<any>)
  applyUpdate: (update: Uint8Array, transactionOrigin?: any) => void
  encodeStateAsUpdate: (targetStateVector?: Uint8Array) => Uint8Array<ArrayBufferLike>
  getUUID: () => string
  buildVSeed: (options?: BuildVSeedOptions) => Promise<TSeedDSL>
  buildVQuery: () => TQueryDSL
  build: () => VBIChartDSL
  /** @description 订阅图表 DSL 顶层字段变化，与 dsl.observe 语义一致；不包含嵌套字段修改，也不触发首次渲染。 */
  observe(callback: ObserveCallback): void
  /** @description 取消指定的图表 DSL 顶层订阅，传入 observe 时使用的同一回调。 */
  unobserve(callback: ObserveCallback): void
  /** @description 订阅整个图表 DSL 的深层变化，包括嵌套筛选、字段、本地编辑、撤销重做及协同更新；同一事务通知一次，不包含运行时实例变化，也不触发首次渲染。 */
  observeDeep(callback: ObserveDeepCallback): void
  /** @description 取消指定的图表 DSL 深层订阅，传入 observeDeep 时使用的同一回调。 */
  unobserveDeep(callback: ObserveDeepCallback): void
  isEmpty: () => boolean
  getSchema: () => Promise<
    {
      name: string
      type: string
    }[]
  >
}
```

参数默认值（来自源码）：

```typescript
// buildVSeed
options = {}
```

## WhereFilterBuilder

源码：[packages/vbi/src/chart-builder/features/whereFilter/where-builder.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/chart-builder/features/whereFilter/where-builder.ts#L11)

包导出：`WhereFilterBuilder`

```typescript
/**
 * @description Where 过滤构建器，用于添加、修改、删除行级过滤条件。Where 过滤在数据查询前生效，用于筛选原始数据
 */
export declare class WhereFilterBuilder {
  constructor(doc: Y.Doc, dsl: Y.Map<any>)
  getConditions(): Y.Array<any>
  /**
   * @description 添加一个 Where 过滤条件
   * @param field - 字段名
   * @param callback - 回调函数
   */
  add(field: string, callback: (node: WhereFilterNodeBuilder) => void): WhereFilterBuilder
  /**
   * @description 添加一个 Where 分组
   * @param op - 逻辑操作符
   * @param callback - 回调函数
   */
  addGroup(op: 'and' | 'or', callback: (group: WhereGroupBuilder) => void): WhereFilterBuilder
  /**
   * @description 更新指定 ID 的过滤条件
   * @param id - 过滤条件 ID
   * @param callback - 回调函数
   */
  update(id: string, callback: (node: WhereFilterNodeBuilder) => void): WhereFilterBuilder
  /**
   * @description 更新指定 ID 的分组
   * @param id - 分组 ID
   * @param callback - 回调函数
   */
  updateGroup(id: string, callback: (group: WhereGroupBuilder) => void): WhereFilterBuilder
  /**
   * @description 删除指定 ID 的条件或指定索引的项
   * @param idOrIndex - ID 或索引
   */
  remove(idOrIndex: string | number): WhereFilterBuilder
  /**
   * @description 按回调条件查找第一个条件（过滤或分组），行为与 Array.find 一致
   * @param predicate - 查找条件
   */
  find(
    predicate: (entry: WhereFilterNodeBuilder | WhereGroupBuilder, index: number) => boolean,
  ): WhereFilterNodeBuilder | WhereGroupBuilder | undefined
  /**
   * @description 清空所有 Where 过滤条件
   */
  clear(): this
  /**
   * @description 导出完整的 Where 过滤配置
   */
  toJSON(): VBIWhereGroup
  /**
   * @description 监听过滤条件变化，返回取消监听的函数
   * @param callback - 回调函数
   * @returns 取消监听的函数
   */
  observe(callback: ObserveDeepCallback): () => void
  /**
   * @description 判断是否为分组节点
   */
  static isGroup(yMap: Y.Map<any>): boolean
  /**
   * @description 判断是否为叶子节点
   */
  static isNode(yMap: Y.Map<any>): boolean
}
```

## buildVQuery

源码：[packages/vbi/src/chart-builder/pipeline/vqueryDSL/index.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/chart-builder/pipeline/vqueryDSL/index.ts#L12)

包导出：`buildVQuery`

```typescript
export declare const buildVQuery: (vbiDSL: VBIChartDSL, builder: VBIChartBuilderInterface<any, any>) => VQueryDSL
```

## defaultVBIChartBuilderAdapters

源码：[packages/vbi/src/chart-builder/adapters/vquery-vseed/index.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/chart-builder/adapters/vquery-vseed/index.ts#L10)

包导出：`defaultVBIChartBuilderAdapters`

```typescript
export declare const defaultVBIChartBuilderAdapters: VBIChartBuilderAdapters<DefaultVBIQueryDSL, DefaultVBISeedDSL>
```

## resolveVBIChartBuilderAdapters

源码：[packages/vbi/src/chart-builder/adapters/vquery-vseed/index.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/chart-builder/adapters/vquery-vseed/index.ts#L15)

包导出：`resolveVBIChartBuilderAdapters`

```typescript
export declare const resolveVBIChartBuilderAdapters: <TQueryDSL = DefaultVBIQueryDSL, TSeedDSL = DefaultVBISeedDSL>(
  adapters?: Partial<VBIChartBuilderAdapters<TQueryDSL, TSeedDSL>>,
) => VBIChartBuilderAdapters<TQueryDSL, TSeedDSL>
```
