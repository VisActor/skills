# sql-compiler

[API 索引](index.md)

- [CompileQueryOptions](sql-compiler.md#compilequeryoptions)
- [CompiledQuery](sql-compiler.md#compiledquery)
- [QueryDialect](sql-compiler.md#querydialect)
- [QueryTable](sql-compiler.md#querytable)
- [compileQuery](sql-compiler.md#compilequery)
- [convertDSLToDuckDB](sql-compiler.md#convertdsltoduckdb)
- [convertDSLToMysql](sql-compiler.md#convertdsltomysql)

类型引用沿用源码模块名，包的公开导出以索引为准：

```typescript
import type { CompileQueryOptions, CompiledQuery } from './types'
import type { DatasetColumn, QueryDSL } from '../types'
import type { Dialect, RawBuilder, Kysely, SelectQueryBuilder } from 'kysely'
import type { QueryDSL } from '../types'
import type { QueryTable, CompileQueryOptions } from './types'
import type { SelectItem } from '../types/dsl/Select'
```

## CompileQueryOptions

源码：[packages/vquery/src/sql-builder/types.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/sql-builder/types.ts#L10)

包导出：`CompileQueryOptions`

```typescript
export interface CompileQueryOptions {
  table: QueryTable
  dialect?: QueryDialect
  /** Full logical source schema, used to align string collations across engines. */
  columns?: DatasetColumn[]
}
```

## CompiledQuery

源码：[packages/vquery/src/sql-builder/types.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/sql-builder/types.ts#L17)

包导出：`CompiledQuery`

```typescript
export interface CompiledQuery {
  sql: string
  parameters: readonly unknown[]
}
```

## QueryDialect

源码：[packages/vquery/src/sql-builder/types.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/sql-builder/types.ts#L5)

包导出：`QueryDialect`

```typescript
export type QueryDialect = 'mysql' | 'duckdb'
```

## QueryTable

源码：[packages/vquery/src/sql-builder/types.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/sql-builder/types.ts#L6)

包导出：`QueryTable`

```typescript
export type QueryTable =
  | string
  | {
      database: string
      name: string
    }
```

## compileQuery

源码：[packages/vquery/src/sql-builder/compileQuery.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/sql-builder/compileQuery.ts#L10)

包导出：`compileQuery`

```typescript
export declare const compileQuery: <T>(dsl: QueryDSL<T>, options: CompileQueryOptions) => CompiledQuery
```

## convertDSLToDuckDB

源码：[packages/vquery/src/sql-builder/convertDSLToDuckDB.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/sql-builder/convertDSLToDuckDB.ts#L6)

包导出：`convertDSLToDuckDB`

```typescript
export declare const convertDSLToDuckDB: <T, TableName extends QueryTable = QueryTable>(
  dsl: QueryDSL<T>,
  table: TableName,
  options?: Omit<CompileQueryOptions, 'table' | 'dialect'>,
) => string
```

参数默认值（来自源码）：

```typescript
// convertDSLToDuckDB
options = {}
```

## convertDSLToMysql

源码：[packages/vquery/src/sql-builder/convertDSLToMysql.ts](https://github.com/VisActor/VBI/blob/main/packages/vquery/src/sql-builder/convertDSLToMysql.ts#L6)

包导出：`convertDSLToMysql`

```typescript
export declare const convertDSLToMysql: <T, TableName extends QueryTable = QueryTable>(
  dsl: QueryDSL<T>,
  table: TableName,
  options?: Omit<CompileQueryOptions, 'table' | 'dialect'>,
) => string
```

参数默认值（来自源码）：

```typescript
// convertDSLToMysql
options = {}
```
