# dataset

[API 索引](index.md)

- [Dataset](dataset.md#dataset)
- [DatasetSourceBuilder](dataset.md#datasetsourcebuilder)

类型引用沿用源码模块名，包的公开导出以索引为准：

```typescript
import type { DatasetColumn, DatasetSource, QueryDSL, QueryAdapter, StorageAdapter, VQueryDSL } from '../types'
import type { DatasetSourceType, RawDatasetSource } from '../types'
```

## Dataset

源码：[packages/vquery/src/dataset/dataset.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/dataset/dataset.ts#L4)

包导出：`Dataset`

```typescript
export declare class Dataset {
  constructor(queryAdapter: QueryAdapter, storageAdapter: StorageAdapter, datasetId: string)
  init(temporaryColumns?: DatasetColumn[], temporaryDatasetSource?: DatasetSource): Promise<void>
  createOrReplaceView(columns: DatasetColumn[], datasetSource: DatasetSource): Promise<void>
  query<T extends Record<string, number | string>>(
    queryDSL: QueryDSL<T> | VQueryDSL<T>,
  ): Promise<{
    performance: {
      startAt: string
      endAt: string
      duration: number
    }
    dataset: any[]
    table: any
  }>
  queryBySQL(sql: string): Promise<{
    performance: {
      startAt: string
      endAt: string
      duration: number
    }
    dataset: any[]
    table: any
  }>
  disconnect(): Promise<void>
  get datasetId(): string
}
```

## DatasetSourceBuilder

源码：[packages/vquery/src/data-source-builder/dataSourceBuilder.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/data-source-builder/dataSourceBuilder.ts#L9)

包导出：`DatasetSourceBuilder`

```typescript
export declare class DatasetSourceBuilder {
  constructor(raw: RawDatasetSource)
  static from(raw: RawDatasetSource): DatasetSourceBuilder
  build(): Promise<{
    type: DatasetSourceType
    blob: Blob
  }>
}
```
