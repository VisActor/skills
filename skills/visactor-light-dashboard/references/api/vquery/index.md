# @visactor/vquery API

适用版本：`0.7.1`。
包含 TypeScript 公开导出、接口声明与使用说明；实现代码、private / protected 成员不属于此 API。

## 分类

- [adapters](adapters.md)
- [dataset](dataset.md)
- [runtime](runtime.md)
- [sql-compiler](sql-compiler.md)
- [types](types.md)
- [utils](utils.md)

## 公开导出（45）

| 导出                       | 入口条件               | 声明                                                                                                     |
| -------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------- |
| `CompileQueryOptions`      | browser, default, node | [CompileQueryOptions](sql-compiler.md#compilequeryoptions)                                               |
| `CompiledQuery`            | browser, default, node | [CompiledQuery](sql-compiler.md#compiledquery)                                                           |
| `DataType`                 | browser, default, node | [DataType](types.md#datatype)                                                                            |
| `Dataset`                  | browser, default, node | [Dataset](dataset.md#dataset)                                                                            |
| `DatasetColumn`            | browser, default, node | [DatasetColumn](types.md#datasetcolumn)                                                                  |
| `DatasetSchema`            | browser, default, node | [DatasetSchema](types.md#datasetschema)                                                                  |
| `DatasetSource`            | browser, default, node | [DatasetSource](types.md#datasetsource)                                                                  |
| `DatasetSourceBuilder`     | browser, default, node | [DatasetSourceBuilder](dataset.md#datasetsourcebuilder)                                                  |
| `DatasetSourceType`        | browser, default, node | [DatasetSourceType](types.md#datasetsourcetype)                                                          |
| `DatasetSourceValue`       | browser, default, node | [DatasetSourceValue](types.md#datasetsourcevalue)                                                        |
| `GroupBy`                  | browser, default, node | [GroupBy](types.md#groupby)                                                                              |
| `Having`                   | browser, default, node | [Having](types.md#having)                                                                                |
| `HavingAggregateFunction`  | browser, default, node | [HavingAggregateFunction](types.md#havingaggregatefunction)                                              |
| `HavingAggregation`        | browser, default, node | [HavingAggregation](types.md#havingaggregation)                                                          |
| `HavingClause`             | browser, default, node | [HavingClause](types.md#havingclause)                                                                    |
| `HavingComparisonOperator` | browser, default, node | [HavingComparisonOperator](types.md#havingcomparisonoperator)                                            |
| `HavingGroup`              | browser, default, node | [HavingGroup](types.md#havinggroup)                                                                      |
| `HavingLeaf`               | browser, default, node | [HavingLeaf](types.md#havingleaf)                                                                        |
| `HavingOperator`           | browser, default, node | [HavingOperator](types.md#havingoperator)                                                                |
| `InMemoryAdapter`          | node                   | [InMemoryAdapter](adapters.md#inmemoryadapter)                                                           |
| `InMemoryQueryAdapter`     | browser, default, node | [InMemoryQueryAdapter](adapters.md#inmemoryqueryadapter)                                                 |
| `IndexedDBAdapter`         | browser, default       | [IndexedDBAdapter](adapters.md#indexeddbadapter)                                                         |
| `OrderBy`                  | browser, default, node | [OrderBy](types.md#orderby)                                                                              |
| `QueryAdapter`             | browser, default, node | [QueryAdapter](types.md#queryadapter)                                                                    |
| `QueryDSL`                 | browser, default, node | [QueryDSL](types.md#querydsl)                                                                            |
| `QueryDialect`             | browser, default, node | [QueryDialect](sql-compiler.md#querydialect)                                                             |
| `QueryResult`              | browser, default, node | [QueryResult](types.md#queryresult)                                                                      |
| `QueryTable`               | browser, default, node | [QueryTable](sql-compiler.md#querytable)                                                                 |
| `RawDatasetSource`         | browser, default, node | [RawDatasetSource](types.md#rawdatasetsource)                                                            |
| `Select`                   | browser, default, node | [Select](types.md#select)                                                                                |
| `StorageAdapter`           | browser, default, node | [StorageAdapter](types.md#storageadapter)                                                                |
| `TidyDatum`                | browser, default, node | [TidyDatum](types.md#tidydatum)                                                                          |
| `VQuery`                   | browser, default, node | [VQuery (node)](runtime.md#vquery-node) · [VQuery (browser, default)](runtime.md#vquery-browser-default) |
| `VQueryDSL`                | browser, default, node | [VQueryDSL](types.md#vquerydsl)                                                                          |
| `VQueryOptions`            | browser, default, node | [VQueryOptions](types.md#vqueryoptions)                                                                  |
| `Where`                    | browser, default, node | [Where](types.md#where)                                                                                  |
| `WhereClause`              | browser, default, node | [WhereClause](types.md#whereclause)                                                                      |
| `WhereGroup`               | browser, default, node | [WhereGroup](types.md#wheregroup)                                                                        |
| `WhereLeaf`                | browser, default, node | [WhereLeaf](types.md#whereleaf)                                                                          |
| `compileQuery`             | browser, default, node | [compileQuery](sql-compiler.md#compilequery)                                                             |
| `convertDSLToDuckDB`       | browser, default, node | [convertDSLToDuckDB](sql-compiler.md#convertdsltoduckdb)                                                 |
| `convertDSLToMysql`        | browser, default, node | [convertDSLToMysql](sql-compiler.md#convertdsltomysql)                                                   |
| `isBase64Url`              | browser, default, node | [isBase64Url](utils.md#isbase64url)                                                                      |
| `isHttpUrl`                | browser, default, node | [isHttpUrl](utils.md#ishttpurl)                                                                          |
| `isUrl`                    | browser, default, node | [isUrl](utils.md#isurl)                                                                                  |
