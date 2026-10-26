# Standard 功能与验收矩阵

基准为仓库 `practices/standard/src`，对照页面为 `/VBI/vbi/practices/standard.html`。交互直接复用 Standard 的字段列表、四槽、菜单、筛选编辑器、DnD、工具栏与翻译，不维护缩减版本。独立 HTML 只替换外壳与渲染适配，VBI DSL / Builder 仍拥有全部分析状态。

用户明确覆盖了部分外围入口：移除 CSV 上传、宣传 / 数据源信息条、自定义预览 / 状态文件按钮、色板、配置查看区、图表标题 / 副标题、结果数量 / 悬停说明 / 成功状态与 Live Preview 标签；通过已连接数据源、宿主状态接口和配置品牌色替代。以下用例已按这一约束更新，核心分析能力不缩减。

## 功能分析与测试用例

| ID         | Standard 功能 / 入口      | 操作与通过条件                                                                                                                                                                        |
| ---------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DATA-01    | supermarket CSV / schema  | 内嵌原 CSV 全部 9,959 行、20 列（16 维度、4 度量），保留 BOM 清理、日期和数值类型；销售额 16,068,954.125、利润 2,147,538.925，与独立 CSV 计算一致                                     |
| FIELD-01   | FieldList 搜索            | 搜索可定位全部字段，清空恢复；展开后所有字段可到达；不存在关键词明确空态                                                                                                              |
| FIELD-02   | 字段类型 / 角色过滤       | 维度、度量及各 schema 类型可过滤、组合与重置，字段身份不变                                                                                                                            |
| FIELD-03   | 点击字段                  | 数值进度量、其他进维度；已存在字段按 Standard 防重规则处理                                                                                                                            |
| DND-01     | schema → 四槽             | 鼠标真实拖动分别进入 dimensions / measures / where / having；核对实际 DSL 节点及默认聚合、条件                                                                                        |
| DND-02     | 跨角色使用                | 数值字段能作维度；字符串 / 日期能作计数、去重计数、min、max；不把 schema 角色误当禁止拖入规则                                                                                         |
| DND-03     | 排序与插入                | 同槽头、中、尾插入、重排；原位置放回不改变 DSL；取消 / 拖出不误删                                                                                                                     |
| DND-04     | 跨槽移动                  | 四槽任意方向按 Standard 转换并删除原节点；不能复制后遗留旧节点                                                                                                                        |
| DIM-01     | 别名 / 删除               | 重命名校验空值，取消不改变；菜单和关闭按钮删除一致，其他字段保留                                                                                                                      |
| DIM-02     | 日期聚合                  | 年、季、月、周、日、时、分、秒与原始值，DSL / seed / 可见标签一致                                                                                                                     |
| DIM-03     | 编码与排序                | 当前图型的全部支持编码、推荐标识、升 / 降 / 清除排序；切图后推荐编码跟随 Builder                                                                                                      |
| MEA-01     | 数值聚合                  | sum/count/countDistinct/avg/min/max/variance/variancePop/stddev/median/quantile 实际查询正确；分位 P1/5/25/50/75/90/95/99                                                             |
| MEA-02     | 非数值聚合                | 仅展示 Standard 支持的 count/countDistinct/min/max；错误数值聚合不可选                                                                                                                |
| MEA-03     | 编码 / 排序 / 别名 / 删除 | 多指标独立配置，主副轴 / size / color 等随图型变化；删除不影响其他节点                                                                                                                |
| FMT-01     | 数值格式                  | auto/custom、数值/百分比/科学计数、前后缀、倍率、符号、小数位、千分位及清除，保存恢复后不丢失                                                                                         |
| WHERE-01   | 字符串过滤                | =/!=/in/not in/like/not like/ilike/not ilike/is null/is not null；按源值验证，空值与零不混淆                                                                                          |
| WHERE-02   | 数值过滤                  | 六个比较、集合、区间 / 非区间、左右开闭、null；先过滤再聚合，与原始行计算对照                                                                                                         |
| WHERE-03   | 日期过滤                  | range / relative(last,next) / current(含 offset) / period(year,quarter,month,week,day)；日期选择器和 DSL 一致                                                                         |
| WHERE-04   | 编辑与根逻辑              | 编辑 / 取消 / 删除 / 清空，AND/OR 切换，已保存分组保持语义                                                                                                                            |
| HAVING-01  | 结果过滤                  | 独立字段、聚合、比较、集合、范围与 null；明确聚合后应用，与主指标聚合可以不同                                                                                                         |
| HAVING-02  | 交互与逻辑                | 编辑 / 取消 / 删除 / 清空、AND/OR；跨槽后转换和范围正确                                                                                                                               |
| CHART-01   | 全部图型                  | 遍历 Builder 与 Standard 的全部 31 种图型（下表），每种用合法维度 / 度量实际查询、构建、渲染并检查 Canvas 与错误；侧栏选择后面板保持展开、选中态更新，可主动关闭                      |
| CHART-02   | 表格与透视                | ListTable / PivotTable / PivotChart 正确分支；多行列、多指标、虚拟滚动，透视图图例筛选等价于 Standard                                                                                 |
| CHART-03   | 图型切换                  | 同 VChart 实例 updateSpec；柱 / 条方向切换及条形图与双轴图双向切换逐帧验证真实 morph 路径、无空白与正确终态，同方向切换验证 morph、数据更新验证连续补间；快速连续切换无旧图残留       |
| CHART-04   | 交互                      | tooltip、图例、数据选择、动态竞赛 player / 时间轴、缩放 resize，与实际 Standard 类型行为比较                                                                                          |
| LIMIT-01   | limit                     | 与 Standard 一致的正整数解析、边界与默认 1000 行；真实 Query DSL 与结果数匹配；无本地 slice 冒充 limit                                                                                |
| HISTORY-01 | undo / redo               | 字段、排序、过滤、聚合、图型、limit 的按钮和 Ctrl/Cmd+Z、Ctrl+Y、Cmd+Shift+Z；输入框内不抢原生撤销                                                                                    |
| CSV-01     | 固定数据源                | 按用户要求，无上传按钮、文件输入或上传弹窗；完整内嵌数据与全部字段可用。Standard 默认上传另由其测试覆盖。                                                                             |
| UI-01      | 语言 / 主题               | 设置面板内中英切换、10 套主题（浅 6 / 深 4）、控件与图表同步、分析不重置；工具栏无语言 / 明暗开关；Escape / 关闭 / 面板外点击与焦点归还。                                             |
| UI-02      | 紧凑布局与全屏            | 宣传、数据源条、自定义按钮、配置查看、Live Preview 均移除，图表标题、结果说明与成功状态均移除，署名右对齐且高度不超过 22px；编辑区直接接品牌栏；进出全屏不改变 DSL，Canvas 正确测量。 |
| UI-03      | 表格主题                  | 表格浅深切换可渲染、结果不变。                                                                                                                                                        |
| UI-04      | 堆叠主题                  | 切换浅深色系后柱 / 条描边宽度为零、无染色接缝。                                                                                                                                       |
| STATE-01   | 公开状态接口              | serialize / applyDSL 完整保存恢复字段 ID、别名、编码、聚合、排序、格式、条件、limit、主题、语言；非法恢复保留原配置，不提供额外文件操作按钮。                                         |
| STATE-02   | headless                  | 从已保存 DSL 创建 Builder 并注册连接器，不依赖 DOM 能重建相同 Query / seed                                                                                                            |
| LIFE-01    | 竞争与销毁                | 快速编辑、切数据源、过期结果、空结果、异常、pagehide / BFCache / resize；实例、监听、Observer 与文档释放                                                                              |
| VISUAL-01  | morph 与视觉              | 桌面 / 窄屏实际截图及中间帧；图型切换保持 morph，reduced-motion 最终态，不回退为整页重新入场                                                                                          |
| DIST-01    | 单文件                    | 复制 HTML 到空目录通过 file:// 运行；完整 JS / 样式 / 数据内置，断网可用，无仓库路径或 CDN 依赖                                                                                       |

## 31 种图型

`table`、`pivotTable`、`column`、`columnParallel`、`columnPercent`、`bar`、`barParallel`、`barPercent`、`dualAxis`、`line`、`area`、`areaPercent`、`pie`、`donut`、`rose`、`roseParallel`、`funnel`、`scatter`、`heatmap`、`radar`、`treeMap`、`sunburst`、`circlePacking`、`sankey`、`hierarchySankey`、`raceBar`、`raceColumn`、`raceLine`、`raceScatter`、`racePie`、`raceDonut`。

不能用“按钮存在”证明图型可用，也不能用四个简单图型代替完整验收。没有适合当前字段的图型需要正确空态 / 错误提示；对其能力的验收则必须补齐合法配置实际运行。

每个用例的执行结果和证据由测试报告记录；未执行、失败或只做静态检查的用例均不计通过。Standard 源码变更时重新审查矩阵，不能沿用旧通过声明。
