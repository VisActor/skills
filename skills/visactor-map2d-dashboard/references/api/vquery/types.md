# types

[API 索引](index.md)

- [AggregateFunction](types.md#aggregatefunction)
- [BaseAggregateFunction](types.md#baseaggregatefunction)
- [DataType](types.md#datatype)
- [DatasetColumn](types.md#datasetcolumn)
- [DatasetSchema](types.md#datasetschema)
- [DatasetSource](types.md#datasetsource)
- [DatasetSourceType](types.md#datasetsourcetype)
- [DatasetSourceValue](types.md#datasetsourcevalue)
- [DateAggregateFunction](types.md#dateaggregatefunction)
- [GroupBy](types.md#groupby)
- [Having](types.md#having)
- [HavingAggregateFunction](types.md#havingaggregatefunction)
- [HavingAggregation](types.md#havingaggregation)
- [HavingClause](types.md#havingclause)
- [HavingComparisonOperator](types.md#havingcomparisonoperator)
- [HavingGroup](types.md#havinggroup)
- [HavingLeaf](types.md#havingleaf)
- [HavingOperator](types.md#havingoperator)
- [Operator](types.md#operator)
- [OrderBy](types.md#orderby)
- [QueryAdapter](types.md#queryadapter)
- [QueryDSL](types.md#querydsl)
- [QueryResult](types.md#queryresult)
- [RawDatasetSource](types.md#rawdatasetsource)
- [Select](types.md#select)
- [SelectItem](types.md#selectitem)
- [StorageAdapter](types.md#storageadapter)
- [TidyDatum](types.md#tidydatum)
- [VQueryDSL](types.md#vquerydsl)
- [VQueryOptions](types.md#vqueryoptions)
- [Where](types.md#where)
- [WhereClause](types.md#whereclause)
- [WhereGroup](types.md#wheregroup)
- [WhereLeaf](types.md#whereleaf)

类型引用沿用源码模块名，包的公开导出以索引为准：

```typescript
import type { BaseAggregateFunction } from './Select'
import type { DatasetColumn } from '../DataSet'
import type { DatasetSchema } from '../DataSet'
import type { DatasetSource } from '../DataSource'
import type { GroupBy } from './GroupBy'
import type { Having } from './Having'
import type { OrderBy } from './OrderBy'
import type { QueryResult } from '../QueryResult'
import type { Select } from './Select'
import type { Where } from './Where'
```

## AggregateFunction

源码：[packages/vquery/src/types/dsl/Select.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/types/dsl/Select.ts#L24)

关联声明，未从包入口独立导出。

```typescript
export type AggregateFunction = BaseAggregateFunction | DateAggregateFunction
```

## BaseAggregateFunction

源码：[packages/vquery/src/types/dsl/Select.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/types/dsl/Select.ts#L1)

关联声明，未从包入口独立导出。

```typescript
export type BaseAggregateFunction =
  | 'count'
  | 'count_distinct'
  | 'sum'
  | 'avg'
  | 'min'
  | 'max'
  | 'variance'
  | 'variance_pop'
  | 'stddev'
  | 'median'
  | 'quantile'
```

## DataType

源码：[packages/vquery/src/types/DataSet.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/types/DataSet.ts#L2)

包导出：`DataType`

```typescript
export type DataType = 'number' | 'string' | 'date' | 'datetime' | 'timestamp'
```

## DatasetColumn

源码：[packages/vquery/src/types/DataSet.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/types/DataSet.ts#L4)

包导出：`DatasetColumn`

```typescript
export interface DatasetColumn {
  type: DataType
  name: string
}
```

## DatasetSchema

源码：[packages/vquery/src/types/DataSet.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/types/DataSet.ts#L9)

包导出：`DatasetSchema`

```typescript
export interface DatasetSchema {
  datasetId: string
  datasetAlias: string
  columns: DatasetColumn[]
}
```

## DatasetSource

源码：[packages/vquery/src/types/DataSource.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/types/DataSource.ts#L7)

包导出：`DatasetSource`

```typescript
export interface DatasetSource {
  type: DatasetSourceType
  blob: Blob
}
```

## DatasetSourceType

源码：[packages/vquery/src/types/DataSource.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/types/DataSource.ts#L3)

包导出：`DatasetSourceType`

```typescript
export type DatasetSourceType = 'csv' | 'json'
```

## DatasetSourceValue

源码：[packages/vquery/src/types/DataSource.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/types/DataSource.ts#L5)

包导出：`DatasetSourceValue`

```typescript
export type DatasetSourceValue = string | ArrayBuffer | Blob | TidyDatum[]
```

## DateAggregateFunction

源码：[packages/vquery/src/types/dsl/Select.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/types/dsl/Select.ts#L14)

关联声明，未从包入口独立导出。

```typescript
export type DateAggregateFunction =
  | 'to_year'
  | 'to_quarter'
  | 'to_month'
  | 'to_week'
  | 'to_day'
  | 'to_hour'
  | 'to_minute'
  | 'to_second'
```

## GroupBy

源码：[packages/vquery/src/types/dsl/GroupBy.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/types/dsl/GroupBy.ts#L1)

包导出：`GroupBy`

```typescript
export type GroupBy<T> = Array<keyof T | (string & {})>
```

## Having

源码：[packages/vquery/src/types/dsl/Having.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/types/dsl/Having.ts#L7)

包导出：`Having`

```typescript
export type Having<T> = HavingGroup<T>
```

## HavingAggregateFunction

源码：[packages/vquery/src/types/dsl/Having.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/types/dsl/Having.ts#L39)

包导出：`HavingAggregateFunction`

```typescript
/**
 * Having 聚合函数
 */
export type HavingAggregateFunction = BaseAggregateFunction
```

## HavingAggregation

源码：[packages/vquery/src/types/dsl/Having.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/types/dsl/Having.ts#L41)

包导出：`HavingAggregation`

```typescript
export type HavingAggregation = {
  func: HavingAggregateFunction
  quantile?: number
}
```

## HavingClause

源码：[packages/vquery/src/types/dsl/Having.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/types/dsl/Having.ts#L14)

包导出：`HavingClause`

```typescript
export type HavingClause<T> = HavingLeaf<T> | HavingGroup<T>
```

## HavingComparisonOperator

源码：[packages/vquery/src/types/dsl/Having.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/types/dsl/Having.ts#L49)

包导出：`HavingComparisonOperator`

```typescript
/**
 * Having 比较操作符
 */
export type HavingComparisonOperator =
  | '='
  | '!='
  | '>'
  | '>='
  | '<'
  | '<='
  | 'between'
  | 'not between'
  | 'in'
  | 'not in'
  | 'is null'
  | 'is not null'
```

## HavingGroup

源码：[packages/vquery/src/types/dsl/Having.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/types/dsl/Having.ts#L9)

包导出：`HavingGroup`

```typescript
export type HavingGroup<T> = {
  op: 'and' | 'or'
  conditions: Array<HavingClause<T>>
}
```

## HavingLeaf

源码：[packages/vquery/src/types/dsl/Having.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/types/dsl/Having.ts#L20)

包导出：`HavingLeaf`

```typescript
/**
 * Having 叶子节点
 * 通过 aggr 指定聚合方式，通过 op 指定比较操作符
 */
export type HavingLeaf<T> = {
  [K in keyof T]: {
    [O in HavingComparisonOperator]: {
      field: K
      op: O
      aggr: HavingAggregation
    } & (O extends 'is null' | 'is not null'
      ? {
          value?: never
        }
      : O extends 'in' | 'not in'
        ? {
            value: T[K] | T[K][]
          }
        : O extends 'between' | 'not between'
          ? {
              value: [T[K], T[K]]
            }
          : {
              value: T[K]
            })
  }[HavingComparisonOperator]
}[keyof T]
```

## HavingOperator

源码：[packages/vquery/src/types/dsl/Having.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/types/dsl/Having.ts#L67)

包导出：`HavingOperator`

```typescript
/**
 * Having 操作符（仅比较操作符）
 */
export type HavingOperator = HavingComparisonOperator
```

## Operator

源码：[packages/vquery/src/types/dsl/Where.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/types/dsl/Where.ts#L27)

关联声明，未从包入口独立导出。

```typescript
type Operator =
  | '='
  | '!='
  | '>'
  | '>='
  | '<'
  | '<='
  | 'like'
  | 'not like'
  | 'ilike'
  | 'not ilike'
  | 'in'
  | 'not in'
  | 'between'
  | 'not between'
  | 'is null'
  | 'is not null'
```

## OrderBy

源码：[packages/vquery/src/types/dsl/OrderBy.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/types/dsl/OrderBy.ts#L1)

包导出：`OrderBy`

```typescript
export type OrderBy<T> = Array<{
  field: string | keyof T
  order?: 'asc' | 'desc'
  /** NULL values sort last by default, independent of direction. */
  nulls?: 'first' | 'last'
}>
```

## QueryAdapter

源码：[packages/vquery/src/types/adapters/QueryAdapter.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/types/adapters/QueryAdapter.ts#L5)

包导出：`QueryAdapter`

```typescript
export interface QueryAdapter {
  open: () => Promise<void>
  close: () => Promise<void>
  loadDataset: (datasetId: string, columns: DatasetColumn[], source: DatasetSource) => Promise<void>
  dropDataset: (datasetId: string) => Promise<void>
  getSchema: (fileName: string) => Promise<QueryResult>
  query: (sql: string) => Promise<{
    dataset: any[]
    table: any
  }>
}
```

## QueryDSL

源码：[packages/vquery/src/types/dsl/QueryDSL.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/types/dsl/QueryDSL.ts#L7)

包导出：`QueryDSL`

```typescript
export interface QueryDSL<Table> {
  select: Select<Table>
  where?: Where<Table>
  groupBy?: GroupBy<Table>
  having?: Having<Table>
  orderBy?: OrderBy<Table>
  limit?: number
}
```

## QueryResult

源码：[packages/vquery/src/types/QueryResult.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/types/QueryResult.ts#L1)

包导出：`QueryResult`

```typescript
export type QueryResult = any
```

## RawDatasetSource

源码：[packages/vquery/src/types/DataSource.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/types/DataSource.ts#L12)

包导出：`RawDatasetSource`

```typescript
export interface RawDatasetSource {
  type: DatasetSourceType
  rawDataset: DatasetSourceValue
}
```

## Select

源码：[packages/vquery/src/types/dsl/Select.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/types/dsl/Select.ts#L35)

包导出：`Select`

```typescript
export type Select<T> = Array<keyof T | SelectItem<T>>
```

## SelectItem

源码：[packages/vquery/src/types/dsl/Select.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/types/dsl/Select.ts#L26)

关联声明，未从包入口独立导出。

```typescript
export type SelectItem<T> = {
  field: keyof T
  alias?: string
  aggr?: {
    func: AggregateFunction
    quantile?: number
  }
}
```

## StorageAdapter

源码：[packages/vquery/src/types/adapters/StorageAdapter.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/types/adapters/StorageAdapter.ts#L4)

包导出：`StorageAdapter`

```typescript
export interface StorageAdapter {
  open: () => Promise<void>
  close: () => Promise<void>
  writeDataset: (datasetId: string, datasetSchema: DatasetSchema, datasetSource?: DatasetSource) => Promise<void>
  readDataset: (datasetId: string) => Promise<{
    datasetSchema: DatasetSchema
    datasetSource?: DatasetSource
  } | null>
  deleteDataset: (datasetId: string) => Promise<void>
  listDatasets: () => Promise<
    {
      datasetId: string
      datasetSchema: DatasetSchema
      datasetSource?: DatasetSource
    }[]
  >
}
```

## TidyDatum

源码：[packages/vquery/src/types/DataSource.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/types/DataSource.ts#L1)

包导出：`TidyDatum`

```typescript
export type TidyDatum = Record<string, number | string | null | boolean | undefined>
```

## VQueryDSL

源码：[packages/vquery/src/types/dsl/QueryDSL.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/types/dsl/QueryDSL.ts#L16)

包导出：`VQueryDSL`

```typescript
export type VQueryDSL<Table = Record<string, unknown>> = QueryDSL<Table>
```

## VQueryOptions

源码：[packages/vquery/src/types/VQueryOptions.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/types/VQueryOptions.ts#L1)

包导出：`VQueryOptions`

```typescript
export interface VQueryOptions {
  /** Persist datasets in IndexedDB. Defaults to false; requires IndexedDB support. */
  enableIndexedDB?: boolean
}
```

## Where

源码：[packages/vquery/src/types/dsl/Where.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/types/dsl/Where.ts#L1)

包导出：`Where`

```typescript
export type Where<T> = WhereGroup<T>
```

## WhereClause

源码：[packages/vquery/src/types/dsl/Where.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/types/dsl/Where.ts#L8)

包导出：`WhereClause`

```typescript
export type WhereClause<T> = WhereLeaf<T> | WhereGroup<T>
```

## WhereGroup

源码：[packages/vquery/src/types/dsl/Where.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/types/dsl/Where.ts#L3)

包导出：`WhereGroup`

```typescript
export type WhereGroup<T> = {
  op: 'and' | 'or'
  conditions: Array<WhereClause<T>>
}
```

## WhereLeaf

源码：[packages/vquery/src/types/dsl/Where.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/types/dsl/Where.ts#L10)

包导出：`WhereLeaf`

```typescript
export type WhereLeaf<T> = {
  [K in keyof T]: {
    [O in Operator]: {
      field: K
      op: O
    } & (O extends 'is null' | 'is not null'
      ? {
          value?: never
        }
      : O extends 'in' | 'not in'
        ? {
            value: T[K] | T[K][]
          }
        : O extends 'between' | 'not between'
          ? {
              value: [T[K], T[K]]
            }
          : {
              value: T[K]
            })
  }[Operator]
}[keyof T]
```
