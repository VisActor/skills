# vbi

[API 索引](index.md)

- [VBI](vbi.md#vbi)
- [VBIChartNamespace](vbi.md#vbichartnamespace)
- [VBIChartResourceNamespace](vbi.md#vbichartresourcenamespace)
- [VBIConnectorFactory](vbi.md#vbiconnectorfactory)
- [VBIConnectorLike](vbi.md#vbiconnectorlike)
- [VBIConnectorNamespace](vbi.md#vbiconnectornamespace)
- [VBIDashboardNamespace](vbi.md#vbidashboardnamespace)
- [VBIInsightNamespace](vbi.md#vbiinsightnamespace)
- [VBIInsightResourceNamespace](vbi.md#vbiinsightresourcenamespace)
- [VBIInstance](vbi.md#vbiinstance)
- [VBIResourceNamespace](vbi.md#vbiresourcenamespace)
- [VBIResourceRegisterInput](vbi.md#vbiresourceregisterinput)
- [VBIResourceRegisterResult](vbi.md#vbiresourceregisterresult)
- [VBIResourceSnapshot](vbi.md#vbiresourcesnapshot)
- [createEmptyChart](vbi.md#createemptychart)
- [createEmptyDashboard](vbi.md#createemptydashboard)
- [createEmptyInsight](vbi.md#createemptyinsight)
- [createVBI](vbi.md#createvbi)

类型引用沿用源码模块名，包的公开导出以索引为准：

```typescript
import type { DefaultVBIQueryDSL, DefaultVBISeedDSL } from 'src/chart-builder/adapters/vquery-vseed/types'
import type { VBIChartBuilder } from 'src/chart-builder/builder'
import type { VBIChartBuilderOptions } from 'src/types'
import type { VBIChartBuilderOptions, VBIChartDSL, VBIChartDSLInput } from 'src/types'
import type { VBIChartDSL } from 'src/types'
import type { VBIChartDSL, VBIChartDSLInput, VBIInsightDSL, VBIInsightDSLInput } from 'src/types'
import type { VBIChartNamespace } from './chart'
import type { VBIConnector, VBIConnectorId } from 'src/types/connector/connector'
import type { VBIConnectorId } from 'src/types/connector/connector'
import type { VBIConnectorNamespace } from './connectors'
import type { VBIDashboardBuilder } from 'src/dashboard-builder/builder'
import type { VBIDashboardBuilderOptions, VBIDashboardDSL, VBIDashboardDSLInput } from 'src/types'
import type { VBIDashboardDSL, VBIDashboardLayout } from 'src/types'
import type { VBIDashboardNamespace } from './dashboard'
import type { VBIInsightBuilder } from 'src/insight-builder/builder'
import type { VBIInsightDSL } from 'src/types'
import type { VBIInsightDSL, VBIInsightDSLInput } from 'src/types'
import type { VBIInsightNamespace } from './insight'
import type { VBIInstance } from './types'
import type { VBIInstance } from './vbi/index'
import type { VBIResourceNamespace } from './resources'
```

## VBI

源码：[packages/vbi/src/vbi.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/vbi.ts#L5)

包导出：`VBI`

```typescript
/** @description 默认 VBI 实例，适合直接使用全局共享的 Builder 与资源能力。 */
export declare const VBI: VBIInstance
```

## VBIChartNamespace

源码：[packages/vbi/src/vbi/types/chart.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/vbi/types/chart.ts#L7)

包导出：`VBIChartNamespace`

```typescript
/** @description VBI 实例上的图表命名空间，负责创建图表 Builder 和空图表 DSL。 */
export interface VBIChartNamespace<TQueryDSL = DefaultVBIQueryDSL, TSeedDSL = DefaultVBISeedDSL> {
  /** @description 使用图表 DSL 创建 VBIChartBuilder。 */
  create(
    vbi: VBIChartDSLInput,
    builderOptions?: VBIChartBuilderOptions<TQueryDSL, TSeedDSL>,
  ): VBIChartBuilder<TQueryDSL, TSeedDSL>
  /** @description 创建一个最小可用的图表 DSL。 */
  createEmpty(connectorId: VBIConnectorId, uuid?: string): VBIChartDSL
}
```

## VBIChartResourceNamespace

源码：[packages/vbi/src/vbi/types/resources.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/vbi/types/resources.ts#L28)

包导出：`VBIChartResourceNamespace`

```typescript
/** @description VBI 实例上的图表资源命名空间。 */
export interface VBIChartResourceNamespace {
  /** @description 注册单个图表资源。 */
  register(chart: VBIChartDSLInput): VBIChartDSL
  /** @description 获取已注册的图表资源 DSL。 */
  get(uuid: string): VBIChartDSL | undefined
  /** @description 获取所有已注册的图表资源 DSL。 */
  list(): VBIChartDSL[]
  /** @description 判断指定图表资源是否已注册。 */
  has(uuid: string): boolean
  /** @description 注销指定图表资源。 */
  unregister(uuid: string): boolean
}
```

## VBIConnectorFactory

源码：[packages/vbi/src/vbi/types/connectors.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/vbi/types/connectors.ts#L4)

包导出：`VBIConnectorFactory`

```typescript
/** @description 延迟创建 VBIConnector 的工厂函数。 */
export type VBIConnectorFactory = () => Promise<VBIConnector>
```

## VBIConnectorLike

源码：[packages/vbi/src/vbi/types/connectors.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/vbi/types/connectors.ts#L6)

包导出：`VBIConnectorLike`

```typescript
/** @description 可注册到 VBI 实例的连接器值，支持直接传入连接器或异步工厂。 */
export type VBIConnectorLike = VBIConnector | VBIConnectorFactory
```

## VBIConnectorNamespace

源码：[packages/vbi/src/vbi/types/connectors.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/vbi/types/connectors.ts#L9)

包导出：`VBIConnectorNamespace`

```typescript
/** @description VBI 实例上的连接器命名空间。 */
export interface VBIConnectorNamespace {
  /** @description 注册连接器。 */
  register(id: VBIConnectorId, connector: VBIConnectorLike): void
  /** @description 获取连接器。 */
  get(id: VBIConnectorId): Promise<VBIConnector>
  /** @description 判断连接器是否已注册。 */
  has(id: VBIConnectorId): boolean
  /** @description 注销连接器。 */
  unregister(id: VBIConnectorId): boolean
}
```

## VBIDashboardNamespace

源码：[packages/vbi/src/vbi/types/dashboard.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/vbi/types/dashboard.ts#L6)

包导出：`VBIDashboardNamespace`

```typescript
/** @description VBI 实例上的仪表盘命名空间，负责创建 Dashboard Builder 和空 dashboard DSL。 */
export interface VBIDashboardNamespace<TQueryDSL = DefaultVBIQueryDSL, TSeedDSL = DefaultVBISeedDSL> {
  /** @description 使用 dashboard DSL 创建 VBIDashboardBuilder。 */
  create(
    dashboard: VBIDashboardDSLInput,
    builderOptions?: VBIDashboardBuilderOptions<TQueryDSL, TSeedDSL>,
  ): VBIDashboardBuilder<TQueryDSL, TSeedDSL>
  /** @description 创建一个空 dashboard DSL。 */
  createEmpty(uuid?: string): VBIDashboardDSL
}
```

## VBIInsightNamespace

源码：[packages/vbi/src/vbi/types/insight.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/vbi/types/insight.ts#L5)

包导出：`VBIInsightNamespace`

```typescript
/** @description VBI 实例上的 insight 命名空间，负责创建 Insight Builder 和空 insight DSL。 */
export interface VBIInsightNamespace {
  /** @description 使用 insight DSL 创建 VBIInsightBuilder。 */
  create(insight: VBIInsightDSLInput): VBIInsightBuilder
  /** @description 创建一个空 insight DSL。 */
  createEmpty(uuid?: string): VBIInsightDSL
}
```

## VBIInsightResourceNamespace

源码：[packages/vbi/src/vbi/types/resources.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/vbi/types/resources.ts#L42)

包导出：`VBIInsightResourceNamespace`

```typescript
/** @description VBI 实例上的 insight 资源命名空间。 */
export interface VBIInsightResourceNamespace {
  /** @description 注册单个 insight 资源。 */
  register(insight: VBIInsightDSLInput): VBIInsightDSL
  /** @description 获取已注册的 insight 资源 DSL。 */
  get(uuid: string): VBIInsightDSL | undefined
  /** @description 获取所有已注册的 insight 资源 DSL。 */
  list(): VBIInsightDSL[]
  /** @description 判断指定 insight 资源是否已注册。 */
  has(uuid: string): boolean
  /** @description 注销指定 insight 资源。 */
  unregister(uuid: string): boolean
}
```

## VBIInstance

源码：[packages/vbi/src/vbi/types/vbi.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/vbi/types/vbi.ts#L9)

包导出：`VBIInstance`

```typescript
/** @description createVBI 返回的 VBI 实例，是访问 chart、insight、dashboard 等能力的统一入口。 */
export interface VBIInstance<TQueryDSL = DefaultVBIQueryDSL, TSeedDSL = DefaultVBISeedDSL> {
  /** @description 连接器注册、获取和释放 API。 */
  connectors: VBIConnectorNamespace
  /** @description 图表和 insight 资源注册 API，用于 dashboard 引用共享资源。 */
  resources: VBIResourceNamespace
  /** @description 图表 Builder 创建 API。 */
  chart: VBIChartNamespace<TQueryDSL, TSeedDSL>
  /** @description Insight Builder 创建 API。 */
  insight: VBIInsightNamespace
  /** @description Dashboard Builder 创建 API。 */
  dashboard: VBIDashboardNamespace<TQueryDSL, TSeedDSL>
}
```

## VBIResourceNamespace

源码：[packages/vbi/src/vbi/types/resources.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/vbi/types/resources.ts#L56)

包导出：`VBIResourceNamespace`

```typescript
/** @description VBI 实例上的资源命名空间，用于注册可被 dashboard 引用的共享资源。 */
export interface VBIResourceNamespace {
  /** @description 图表资源管理 API。 */
  chart: VBIChartResourceNamespace
  /** @description Insight 资源管理 API。 */
  insight: VBIInsightResourceNamespace
  /** @description 批量注册图表和 insight 资源。 */
  register(resources: VBIResourceRegisterInput): VBIResourceRegisterResult
  /** @description 清空当前 VBI 实例的所有图表和 insight 资源。 */
  clear(): void
  /** @description 导出当前 VBI 实例可引用资源的 DSL 快照。 */
  snapshot(): VBIResourceSnapshot
}
```

## VBIResourceRegisterInput

源码：[packages/vbi/src/vbi/types/resources.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/vbi/types/resources.ts#L4)

包导出：`VBIResourceRegisterInput`

```typescript
/** @description 批量注册到 VBI 实例资源表的资源输入。 */
export interface VBIResourceRegisterInput {
  /** @description 待注册的图表资源。 */
  charts?: VBIChartDSLInput[]
  /** @description 待注册的 insight 资源。 */
  insights?: VBIInsightDSLInput[]
}
```

## VBIResourceRegisterResult

源码：[packages/vbi/src/vbi/types/resources.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/vbi/types/resources.ts#L12)

包导出：`VBIResourceRegisterResult`

```typescript
/** @description 批量注册完成后的规范化资源结果。 */
export interface VBIResourceRegisterResult {
  /** @description 已规范化并注册的图表资源。 */
  charts: VBIChartDSL[]
  /** @description 已规范化并注册的 insight 资源。 */
  insights: VBIInsightDSL[]
}
```

## VBIResourceSnapshot

源码：[packages/vbi/src/vbi/types/resources.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/vbi/types/resources.ts#L20)

包导出：`VBIResourceSnapshot`

```typescript
/** @description VBI 实例中当前可引用资源的 DSL 快照。 */
export interface VBIResourceSnapshot {
  /** @description 当前已注册的图表资源，以 uuid 为键。 */
  charts: Record<string, VBIChartDSL>
  /** @description 当前已注册的 insight 资源，以 uuid 为键。 */
  insights: Record<string, VBIInsightDSL>
}
```

## createEmptyChart

源码：[packages/vbi/src/vbi/create-empty-chart.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/vbi/create-empty-chart.ts#L5)

包导出：`createEmptyChart`

```typescript
export declare const createEmptyChart: (connectorId: VBIConnectorId, uuid?: string) => VBIChartDSL
```

参数默认值（来自源码）：

```typescript
// createEmptyChart
uuid = id.resourceUUID()
```

## createEmptyDashboard

源码：[packages/vbi/src/vbi/create-empty-dashboard.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/vbi/create-empty-dashboard.ts#L16)

包导出：`createEmptyDashboard`

```typescript
export declare const createEmptyDashboard: (uuid?: string) => VBIDashboardDSL
```

参数默认值（来自源码）：

```typescript
// createEmptyDashboard
uuid = id.resourceUUID()
```

## createEmptyInsight

源码：[packages/vbi/src/vbi/create-empty-insight.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/vbi/create-empty-insight.ts#L4)

包导出：`createEmptyInsight`

```typescript
export declare const createEmptyInsight: (uuid?: string) => VBIInsightDSL
```

参数默认值（来自源码）：

```typescript
// createEmptyInsight
uuid = id.resourceUUID()
```

## createVBI

源码：[packages/vbi/src/vbi/create-vbi.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/vbi/create-vbi.ts#L16)

包导出：`createVBI`

```typescript
/**
 * @description 创建一个独立的 VBI 实例。
 *
 * 每个实例都有自己的资源注册表，适合在同一应用中隔离不同仪表盘或测试上下文。
 */
export declare function createVBI(): VBIInstance<DefaultVBIQueryDSL, DefaultVBISeedDSL>

/**
 * @description 创建一个使用自定义 QueryDSL 和 SeedDSL 的 VBI 实例。
 *
 * @param defaultBuilderOptions 默认图表 Builder 配置，会传递给 chart 和 dashboard 中创建的图表 Builder。
 */
export declare function createVBI<TQueryDSL, TSeedDSL>(
  defaultBuilderOptions: VBIChartBuilderOptions<TQueryDSL, TSeedDSL>,
): VBIInstance<TQueryDSL, TSeedDSL>
```
