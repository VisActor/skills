# runtime

[API 索引](index.md)

- [VQuery (VQuery.ts)](runtime.md#vquery-vqueryts)
- [VQuery (browser, default)](runtime.md#vquery-browser-default)
- [VQuery (node)](runtime.md#vquery-node)

类型引用沿用源码模块名，包的公开导出以索引为准：

```typescript
import type { RawDatasetSource, DatasetColumn, QueryAdapter, StorageAdapter } from './types'
import type { VQueryOptions } from './types'
import { Dataset } from './dataset/dataset'
import { VQuery as VQueryCore } from './VQuery'
```

## VQuery (VQuery.ts)

源码：[packages/vquery/src/VQuery.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/VQuery.ts#L5)

关联声明，未从包入口独立导出。

```typescript
export declare class VQuery {
  constructor(queryAdapter: QueryAdapter, storageAdapter: StorageAdapter)
  createDataset(datasetId: string, columns?: DatasetColumn[], rawDatasetSource?: RawDatasetSource): Promise<void>
  updateDatasetSource(datasetId: string, columns?: DatasetColumn[], rawDatasetSource?: RawDatasetSource): Promise<void>
  dropDataset(datasetId: string): Promise<void>
  connectDataset(
    datasetId: string,
    temporaryColumns?: DatasetColumn[],
    temporaryRawDatasetSource?: RawDatasetSource,
  ): Promise<Dataset>
  hasDataset(datasetId: string): Promise<boolean>
  listDatasets(): Promise<
    {
      datasetId: string
      datasetSchema: import('./types').DatasetSchema
      datasetSource?: import('./types').DatasetSource
    }[]
  >
  close(): Promise<void>
}
```

参数默认值（来自源码）：

```typescript
// createDataset
columns = []

// updateDatasetSource
columns = []
```

## VQuery (browser, default)

源码：[packages/vquery/src/vquery-browser.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/vquery-browser.ts#L6)

包导出：`VQuery`

继承的公开成员见：[VQuery (VQuery.ts)](runtime.md#vquery-vqueryts)。

```typescript
export declare class VQuery extends VQueryCore {
  constructor({ enableIndexedDB }?: VQueryOptions)
}
```

参数默认值（来自源码）：

```typescript
// constructor
{ enableIndexedDB = false } = {}
```

## VQuery (node)

源码：[packages/vquery/src/vquery-node.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/vquery-node.ts#L6)

包导出：`VQuery`

继承的公开成员见：[VQuery (VQuery.ts)](runtime.md#vquery-vqueryts)。

```typescript
export declare class VQuery extends VQueryCore {
  constructor({ enableIndexedDB }?: VQueryOptions)
}
```

参数默认值（来自源码）：

```typescript
// constructor
{ enableIndexedDB = false } = {}
```
