# @visactor/vbi API

适用版本：`0.7.1`。
包含 TypeScript 公开导出、接口声明与使用说明；实现代码、private / protected 成员不属于此 API。

## 分类

- [chart-builder](chart-builder.md)
- [dashboard-builder](dashboard-builder.md)
- [insight-builder](insight-builder.md)
- [types](types.md)
- [vbi](vbi.md)

## 公开导出（108）

| 导出                                | 入口条件 | 声明                                                                                        |
| ----------------------------------- | -------- | ------------------------------------------------------------------------------------------- |
| `BuildVSeedOptions`                 | default  | [BuildVSeedOptions](types.md#buildvseedoptions)                                             |
| `ChartInstanceBuilder`              | default  | [ChartInstanceBuilder](chart-builder.md#chartinstancebuilder)                               |
| `ChartTypeBuilder`                  | default  | [ChartTypeBuilder](chart-builder.md#charttypebuilder)                                       |
| `DashboardChartBuilder`             | default  | [DashboardChartBuilder](dashboard-builder.md#dashboardchartbuilder)                         |
| `DashboardChartCollectionBuilder`   | default  | [DashboardChartCollectionBuilder](dashboard-builder.md#dashboardchartcollectionbuilder)     |
| `DashboardInsightBuilder`           | default  | [DashboardInsightBuilder](dashboard-builder.md#dashboardinsightbuilder)                     |
| `DashboardInsightCollectionBuilder` | default  | [DashboardInsightCollectionBuilder](dashboard-builder.md#dashboardinsightcollectionbuilder) |
| `DashboardThemeBuilder`             | default  | [DashboardThemeBuilder](dashboard-builder.md#dashboardthemebuilder)                         |
| `DimensionsBuilder`                 | default  | [DimensionsBuilder](chart-builder.md#dimensionsbuilder)                                     |
| `HavingFilterBuilder`               | default  | [HavingFilterBuilder](chart-builder.md#havingfilterbuilder)                                 |
| `LimitBuilder`                      | default  | [LimitBuilder](chart-builder.md#limitbuilder)                                               |
| `LocaleBuilder`                     | default  | [LocaleBuilder](chart-builder.md#localebuilder)                                             |
| `MeasuresBuilder`                   | default  | [MeasuresBuilder](chart-builder.md#measuresbuilder)                                         |
| `ObserveCallback`                   | default  | [ObserveCallback](types.md#observecallback)                                                 |
| `ObserveDeepCallback`               | default  | [ObserveDeepCallback](types.md#observedeepcallback)                                         |
| `ThemeBuilder`                      | default  | [ThemeBuilder](chart-builder.md#themebuilder)                                               |
| `UndoManager`                       | default  | [UndoManager](chart-builder.md#undomanager)                                                 |
| `UndoManagerOptions`                | default  | [UndoManagerOptions](chart-builder.md#undomanageroptions)                                   |
| `VBI`                               | default  | [VBI](vbi.md#vbi)                                                                           |
| `VBIChartBuildVQueryContext`        | default  | [VBIChartBuildVQueryContext](types.md#vbichartbuildvquerycontext)                           |
| `VBIChartBuildVSeedContext`         | default  | [VBIChartBuildVSeedContext](types.md#vbichartbuildvseedcontext)                             |
| `VBIChartBuilder`                   | default  | [VBIChartBuilder](chart-builder.md#vbichartbuilder)                                         |
| `VBIChartBuilderAdapters`           | default  | [VBIChartBuilderAdapters](types.md#vbichartbuilderadapters)                                 |
| `VBIChartBuilderInterface`          | default  | [VBIChartBuilderInterface](types.md#vbichartbuilderinterface)                               |
| `VBIChartBuilderOptions`            | default  | [VBIChartBuilderOptions](types.md#vbichartbuilderoptions)                                   |
| `VBIChartDSL`                       | default  | [VBIChartDSL](types.md#vbichartdsl)                                                         |
| `VBIChartDSLInput`                  | default  | [VBIChartDSLInput](types.md#vbichartdslinput)                                               |
| `VBIChartInstance`                  | default  | [VBIChartInstance](types.md#vbichartinstance)                                               |
| `VBIChartInstanceOff`               | default  | [VBIChartInstanceOff](types.md#vbichartinstanceoff)                                         |
| `VBIChartInstanceOn`                | default  | [VBIChartInstanceOn](types.md#vbichartinstanceon)                                           |
| `VBIChartNamespace`                 | default  | [VBIChartNamespace](vbi.md#vbichartnamespace)                                               |
| `VBIChartQueryBuilder`              | default  | [VBIChartQueryBuilder](types.md#vbichartquerybuilder)                                       |
| `VBIChartResourceNamespace`         | default  | [VBIChartResourceNamespace](vbi.md#vbichartresourcenamespace)                               |
| `VBIChartSeedBuilder`               | default  | [VBIChartSeedBuilder](types.md#vbichartseedbuilder)                                         |
| `VBIConnector`                      | default  | [VBIConnector](types.md#vbiconnector)                                                       |
| `VBIConnectorFactory`               | default  | [VBIConnectorFactory](vbi.md#vbiconnectorfactory)                                           |
| `VBIConnectorLike`                  | default  | [VBIConnectorLike](vbi.md#vbiconnectorlike)                                                 |
| `VBIConnectorNamespace`             | default  | [VBIConnectorNamespace](vbi.md#vbiconnectornamespace)                                       |
| `VBIDSLLocale`                      | default  | [VBIDSLLocale](types.md#vbidsllocale)                                                       |
| `VBIDSLTheme`                       | default  | [VBIDSLTheme](types.md#vbidsltheme)                                                         |
| `VBIDashboardBreakpoint`            | default  | [VBIDashboardBreakpoint](types.md#vbidashboardbreakpoint)                                   |
| `VBIDashboardBreakpoints`           | default  | [VBIDashboardBreakpoints](types.md#vbidashboardbreakpoints)                                 |
| `VBIDashboardBuilder`               | default  | [VBIDashboardBuilder](dashboard-builder.md#vbidashboardbuilder)                             |
| `VBIDashboardBuilderInterface`      | default  | [VBIDashboardBuilderInterface](types.md#vbidashboardbuilderinterface)                       |
| `VBIDashboardBuilderOptions`        | default  | [VBIDashboardBuilderOptions](types.md#vbidashboardbuilderoptions)                           |
| `VBIDashboardDSL`                   | default  | [VBIDashboardDSL](types.md#vbidashboarddsl)                                                 |
| `VBIDashboardDSLInput`              | default  | [VBIDashboardDSLInput](types.md#vbidashboarddslinput)                                       |
| `VBIDashboardItemLayout`            | default  | [VBIDashboardItemLayout](types.md#vbidashboarditemlayout)                                   |
| `VBIDashboardLayout`                | default  | [VBIDashboardLayout](types.md#vbidashboardlayout)                                           |
| `VBIDashboardMeta`                  | default  | [VBIDashboardMeta](types.md#vbidashboardmeta)                                               |
| `VBIDashboardNamespace`             | default  | [VBIDashboardNamespace](vbi.md#vbidashboardnamespace)                                       |
| `VBIDashboardResolvedTheme`         | default  | [VBIDashboardResolvedTheme](types.md#vbidashboardresolvedtheme)                             |
| `VBIDashboardThemeDefinition`       | default  | [VBIDashboardThemeDefinition](types.md#vbidashboardthemedefinition)                         |
| `VBIDashboardThemeOption`           | default  | [VBIDashboardThemeOption](types.md#vbidashboardthemeoption)                                 |
| `VBIDashboardWidget`                | default  | [VBIDashboardWidget](types.md#vbidashboardwidget)                                           |
| `VBIDimension`                      | default  | [VBIDimension](types.md#vbidimension)                                                       |
| `VBIDimensionAggregate`             | default  | [VBIDimensionAggregate](types.md#vbidimensionaggregate)                                     |
| `VBIDimensionGroup`                 | default  | [VBIDimensionGroup](types.md#vbidimensiongroup)                                             |
| `VBIDimensionTree`                  | default  | [VBIDimensionTree](types.md#vbidimensiontree)                                               |
| `VBIHavingAggregate`                | default  | [VBIHavingAggregate](types.md#vbihavingaggregate)                                           |
| `VBIHavingClause`                   | default  | [VBIHavingClause](types.md#vbihavingclause)                                                 |
| `VBIHavingFilter`                   | default  | [VBIHavingFilter](types.md#vbihavingfilter)                                                 |
| `VBIHavingGroup`                    | default  | [VBIHavingGroup](types.md#vbihavinggroup)                                                   |
| `VBIInsightBuilder`                 | default  | [VBIInsightBuilder](insight-builder.md#vbiinsightbuilder)                                   |
| `VBIInsightBuilderInterface`        | default  | [VBIInsightBuilderInterface](types.md#vbiinsightbuilderinterface)                           |
| `VBIInsightDSL`                     | default  | [VBIInsightDSL](types.md#vbiinsightdsl)                                                     |
| `VBIInsightDSLInput`                | default  | [VBIInsightDSLInput](types.md#vbiinsightdslinput)                                           |
| `VBIInsightNamespace`               | default  | [VBIInsightNamespace](vbi.md#vbiinsightnamespace)                                           |
| `VBIInsightResourceNamespace`       | default  | [VBIInsightResourceNamespace](vbi.md#vbiinsightresourcenamespace)                           |
| `VBIInstance`                       | default  | [VBIInstance](vbi.md#vbiinstance)                                                           |
| `VBIMeasure`                        | default  | [VBIMeasure](types.md#vbimeasure)                                                           |
| `VBIMeasureFormat`                  | default  | [VBIMeasureFormat](types.md#vbimeasureformat)                                               |
| `VBIMeasureGroup`                   | default  | [VBIMeasureGroup](types.md#vbimeasuregroup)                                                 |
| `VBIMeasureTree`                    | default  | [VBIMeasureTree](types.md#vbimeasuretree)                                                   |
| `VBIQueryProps`                     | default  | [VBIQueryProps](types.md#vbiqueryprops)                                                     |
| `VBIQueryResult`                    | default  | [VBIQueryResult](types.md#vbiqueryresult)                                                   |
| `VBIResourceNamespace`              | default  | [VBIResourceNamespace](vbi.md#vbiresourcenamespace)                                         |
| `VBIResourceRegisterInput`          | default  | [VBIResourceRegisterInput](vbi.md#vbiresourceregisterinput)                                 |
| `VBIResourceRegisterResult`         | default  | [VBIResourceRegisterResult](vbi.md#vbiresourceregisterresult)                               |
| `VBIResourceSnapshot`               | default  | [VBIResourceSnapshot](vbi.md#vbiresourcesnapshot)                                           |
| `VBISchema`                         | default  | [Schema](types.md#schema)                                                                   |
| `VBISort`                           | default  | [VBISort](types.md#vbisort)                                                                 |
| `VBISortOrder`                      | default  | [VBISortOrder](types.md#vbisortorder)                                                       |
| `VBIWhereClause`                    | default  | [VBIWhereClause](types.md#vbiwhereclause)                                                   |
| `VBIWhereDateBounds`                | default  | [VBIWhereDateBounds](types.md#vbiwheredatebounds)                                           |
| `VBIWhereDateFilter`                | default  | [VBIWhereDateFilter](types.md#vbiwheredatefilter)                                           |
| `VBIWhereDateInput`                 | default  | [VBIWhereDateInput](types.md#vbiwheredateinput)                                             |
| `VBIWhereDatePeriod`                | default  | [VBIWhereDatePeriod](types.md#vbiwheredateperiod)                                           |
| `VBIWhereDatePredicate`             | default  | [VBIWhereDatePredicate](types.md#vbiwheredatepredicate)                                     |
| `VBIWhereDateUnit`                  | default  | [VBIWhereDateUnit](types.md#vbiwheredateunit)                                               |
| `VBIWhereFilter`                    | default  | [VBIWhereFilter](types.md#vbiwherefilter)                                                   |
| `VBIWhereGroup`                     | default  | [VBIWhereGroup](types.md#vbiwheregroup)                                                     |
| `VBIWhereScalarFilter`              | default  | [VBIWhereScalarFilter](types.md#vbiwherescalarfilter)                                       |
| `WhereFilterBuilder`                | default  | [WhereFilterBuilder](chart-builder.md#wherefilterbuilder)                                   |
| `buildVQuery`                       | default  | [buildVQuery](chart-builder.md#buildvquery)                                                 |
| `createEmptyChart`                  | default  | [createEmptyChart](vbi.md#createemptychart)                                                 |
| `createEmptyDashboard`              | default  | [createEmptyDashboard](vbi.md#createemptydashboard)                                         |
| `createEmptyInsight`                | default  | [createEmptyInsight](vbi.md#createemptyinsight)                                             |
| `createVBI`                         | default  | [createVBI](vbi.md#createvbi)                                                               |
| `defaultVBIChartBuilderAdapters`    | default  | [defaultVBIChartBuilderAdapters](chart-builder.md#defaultvbichartbuilderadapters)           |
| `findTreeNodesBy`                   | default  | [findTreeNodesBy](types.md#findtreenodesby)                                                 |
| `id`                                | default  | [id](types.md#id)                                                                           |
| `isVBIFilter`                       | default  | [isVBIFilter](types.md#isvbifilter)                                                         |
| `isVBIHavingFilter`                 | default  | [isVBIHavingFilter](types.md#isvbihavingfilter)                                             |
| `isVBIHavingGroup`                  | default  | [isVBIHavingGroup](types.md#isvbihavinggroup)                                               |
| `isVBIWhereGroup`                   | default  | [isVBIWhereGroup](types.md#isvbiwheregroup)                                                 |
| `preorderTraverse`                  | default  | [preorderTraverse](types.md#preordertraverse)                                               |
| `resolveVBIChartBuilderAdapters`    | default  | [resolveVBIChartBuilderAdapters](chart-builder.md#resolvevbichartbuilderadapters)           |
