# adapters

[API 索引](index.md)

- [InMemoryAdapter](adapters.md#inmemoryadapter)
- [InMemoryQueryAdapter](adapters.md#inmemoryqueryadapter)
- [IndexedDBAdapter](adapters.md#indexeddbadapter)
- [StoredDataset](adapters.md#storeddataset)

类型引用沿用源码模块名，包的公开导出以索引为准：

```typescript
import type { DatasetColumn, DatasetSource, QueryAdapter } from '../../types'
import type { DatasetSchema } from '../../types/DataSet'
import type { DatasetSource, StorageAdapter } from '../../types'
import { type DataRow } from '../../data-loader'
```

## InMemoryAdapter

源码：[packages/vquery/src/adapters/storage-adapter/inmemoryAdapter.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/adapters/storage-adapter/inmemoryAdapter.ts#L11)

包导出：`InMemoryAdapter`

```typescript
export declare class InMemoryAdapter implements StorageAdapter {
  constructor()
  open: () => Promise<void>
  close: () => Promise<void>
  writeDataset: (datasetId: string, datasetSchema: DatasetSchema, datasetSource?: DatasetSource) => Promise<void>
  readDataset: (datasetId: string) => Promise<{
    datasetSource?: DatasetSource
    datasetSchema: DatasetSchema
  } | null>
  deleteDataset: (datasetId: string) => Promise<void>
  listDatasets: () => Promise<StoredDataset[]>
}
```

## InMemoryQueryAdapter

源码：[packages/vquery/src/adapters/query-adapter/inMemoryQueryAdapter.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/adapters/query-adapter/inMemoryQueryAdapter.ts#L19)

包导出：`InMemoryQueryAdapter`

```typescript
export declare class InMemoryQueryAdapter implements QueryAdapter {
  open: () => Promise<void>
  close: () => Promise<void>
  loadDataset: (datasetId: string, columns: DatasetColumn[], source: DatasetSource) => Promise<void>
  dropDataset: (datasetId: string) => Promise<void>
  query: (sql: string) => Promise<{
    dataset: DataRow[]
    table: InMemoryTable
  }>
  getSchema: (datasetId: string) => Promise<
    {
      cid: number
      name: string
      type: import('../../types').DataType
      notnull: boolean
      dflt_value: null
      pk: boolean
    }[]
  >
}
```

## IndexedDBAdapter

源码：[packages/vquery/src/adapters/storage-adapter/indexeddbAdapter.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/adapters/storage-adapter/indexeddbAdapter.ts#L11)

包导出：`IndexedDBAdapter`

```typescript
export declare class IndexedDBAdapter implements StorageAdapter {
  constructor(dbName?: string)
  open: () => Promise<void>
  close: () => Promise<void>
  writeDataset: (datasetId: string, datasetSchema: DatasetSchema, datasetSource?: DatasetSource) => Promise<void>
  readDataset: (datasetId: string) => Promise<{
    datasetSource?: DatasetSource
    datasetSchema: DatasetSchema
  } | null>
  deleteDataset: (datasetId: string) => Promise<void>
  listDatasets: () => Promise<
    {
      datasetId: string
      dataSource?: DatasetSource
      datasetSchema: DatasetSchema
    }[]
  >
}
```

参数默认值（来自源码）：

```typescript
// constructor
dbName = 'vquery'
```

## StoredDataset

源码：[packages/vquery/src/adapters/storage-adapter/inmemoryAdapter.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/adapters/storage-adapter/inmemoryAdapter.ts#L5)

关联声明，未从包入口独立导出。

```typescript
type StoredDataset = {
  datasetId: string
  datasetSchema: DatasetSchema
  datasetSource?: DatasetSource
}
```
