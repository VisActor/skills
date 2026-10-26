# 表格主题与完整结果

宿主页面通过语义 token 契约接入表格，保留自身的强调色与表面层次。色板在 CSS 中定义，Canvas 适配器负责把 CSS 颜色解析为 RGBA，VTable 配置不再维护第二套颜色。纯文本、数字和日期的格式仍由业务配置决定。

## 维护入口

- [dashboard-table.css](../assets/dashboard-table.css)：公共语义 token、深色覆盖、表格容器与键盘焦点。
- [dashboard-table.js](../assets/dashboard-table.js)：CSS → Canvas 颜色解析、统一 VTable 主题、模块加载及完整记录更新。

将上述资源作为样式和脚本接入宿主；交付单文件 HTML 时，把内容分别内联到 `style#dashboard-table-tokens` 与 `script#dashboard-table-runtime`。业务数据、列配置和查询由调用方提供，不需要具体场景模板或其他 package 的源码。维护内联副本时先修改公共资源，再由调用方同步并验证副本一致性。

适配器只处理平面 `ListTable` 的表现；`PivotTable` / `PivotChart` 保留 VSeed 输出的布局与交互，按对应表类型另行接入。

## Token 契约

| 用途           | Token                                                                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 宿主输入       | `--ink`、`--muted`、`--accent`、可选 `--dashboard-font-family`；可选 `--strong` 和 `data-mode`                                                  |
| 通用排印与焦点 | `--font-ui`、`--text-primary`、`--text-strong`、`--text-secondary`、`--text-faint`、`--focus-ring`                                              |
| 默认阅读面     | `--table-canvas`、`--table-body`、`--table-stripe`、`--table-header`                                                                            |
| 文本与分隔     | `--table-text`、`--table-header-text`、`--table-divider`、`--table-frame`                                                                       |
| 悬停           | `--table-hover`、`--table-hover-row`                                                                                                            |
| 选中           | `--table-selected`、`--table-selected-row`、`--table-selected-border`、`--table-selection-width`                                                |
| 滚动条         | `--table-scroll-thumb`、`--table-scroll-rail`                                                                                                   |
| 尺寸           | `--table-font-size`、`--table-header-font-size`、`--table-row-height`、`--table-header-height`、`--table-radius`、`--table-overview-max-height` |

默认仅保留弱行分隔，不给每个单元格叠加竖线。表头略高于正文对比，斑马纹仅辅助跟行。悬停跟随整行，选中单元格以主题色浅填充及 1px 细框定位；表头使用 `headerSelectMode: 'cell'`，避免一次点击染满整列。键盘焦点与数据选中分别呈现，减少动态效果时关闭数据过渡。

当前适配器服务平面 `ListTable`。`DashboardTable.load()` 按需加载固定版本 VTable；`DashboardTable.options(base, host)` 负责表现适配，保留 Builder 输出的列、字段格式与数据。`DashboardTable.overview(Builder, columns, rows, host)` 将主页已格式化的汇总行映射为表格，不执行业务聚合；透视表按其表头与聚合结构另做接入，不直接假定此适配器覆盖所有表类型。

通过 `DashboardTable.setRecords(table, records)` 原位替换完整结果并清除过期的单元格选择；分析弹窗连续筛选使用 `DashboardTable.setRecords(table, records, { animate: false })`，避免每次重播 `animationAppear` 造成闪烁；主题切换重新解析宿主 token，使用 `updateTheme()`，不为换色重建表格。主页概览与分析明细各自管理实例、ResizeObserver 和释放，不能将 VTable 混入只负责 VChart 的实例集合。

## 完整数据与布局

主页与分析表格直接消费当前范围的完整查询结果，使用 VTable 虚拟滚动，不做固定 50 行切片或添加上一页、下一页。主页短表按实际行数收缩，长表在限定高度内滚动；分析表保持可展开的固定阅读区域。宽表在自己的容器内横向滚动。

记录数、当前筛选范围与统计粒度保持可见。汇总仍由完整范围的查询计算，不能由可见行估算。服务端需要游标分批取数时说明已加载范围，不能把尚未加载的部分标为完整结果。

验收默认态、行悬停、单元格和表头选中、滚动到末条、筛选清除、窄屏与展开布局。检查 Tab / Shift+Tab 可按顺序进入和离开表格，不能被全量单元格导航困住；对话框内仍能到达关闭与其他控件。切换主题时检查正文、表头、选中和滚动条同步变化；无结果也保留表头与明确反馈。同步检查通过只代表内联副本一致，仍须运行上述交互与视觉验收。配置依据见 [VTable 主题](https://www.visactor.io/vtable/guide/theme_and_style/theme)与[选择样式](https://www.visactor.io/vtable/guide/interaction/select)。
