# 模板适配与维护入口

先运行[完整模板](../templates/template.html)，核对默认范围、一个国家、分析与返回，再替换业务。模板内保留数据、样式、加载器和应用模块；依赖版本以 `DashboardResources` 为准，资源边界见[加载指南](resource-loading.md)。

## 按职责修改

| 职责       | 现有入口                                                                       | 维护边界                                               |
| ---------- | ------------------------------------------------------------------------------ | ------------------------------------------------------ |
| 数据适配   | `source-csv`、`csvParse`、`source`、`schema`                                   | 正确解析 CSV、稳定 ID、源值空值与逐行派生字段          |
| 地理身份   | `geography-data`、`countryLabel`                                               | 真实几何与代表位置，不覆盖源地域或伪造城市坐标         |
| 业务查询   | `summaryMeasures`、`makeBuilder`、`applyConditions`、`view`                    | Builder 描述聚合、条件、分位及排行，复用同范围结果     |
| 主屏呈现   | `refreshMain`、`requestMain`、`mainText`、`drawOverviewCharts`                 | 指标、发现与证据同步，复用图表实例，版本保护与原位更新 |
| 深入分析   | `metricDefs`、`openAnalysis`、`renderModal`、`renderAnalysisSummary`           | 问题、比较基准、检验与发现；保留局部范围及返回         |
| 完整证据   | `analysisColumns`、`sourceById`、`exportRaw`                                   | 通过稳定 ID 还原原始字段，完整 VTable 与导出           |
| 外观与控件 | 根 CSS、`setTheme`、`bindAppearanceControls`、`createSelectControl`            | token 与状态统一，业务、相机和外观分别管理             |
| 三维表现   | `createGlobe`、`setData`、`setMetric`、`setSurface`                            | 只消费业务结果，真实遮挡、按需绘制与 GPU 释放          |
| 启动与释放 | `DashboardLoading`、`completeInitialPresentation`、`dispose`、`releaseDataset` | 就绪交接、失败恢复、异步取消与幂等清理                 |

具体控件外观和时序继承[设计契约](design.md)，不复制参数到新业务配置。替换文案需覆盖启动、页面、弹窗、可访问名称及导出。维护源码时保留 CSS 级联顺序，不修改嵌入的第三方运行时。

## 数据与可重算证据

源 CSV 在 `application/json` 中保存字符串，先 JSON.parse 再解析 CSV，格式化不能改变源字段或增加记录。schema 声明原始与派生字段，显示名称、源字段、查询别名和内部 ID 分开；缺失字段显式失败，不能补默认零掩盖漏投影。

记录查询可返回完整稳定 ID，再由 `sourceById` 还原源记录；查不到 ID 应报错。原始空值与展示兜底分开，独立读取源数据核对完整、缺失与合法零，不因 HTML 变短而删源记录。当前示例事实与数值基线见[地图与数据](map-and-data.md)。

所有跨行统计由公开 Builder 表达：包括比率的分子分母、median／quantile、having、sort 与 limit；Three.js 和 DOM 只消费结果。查询缓存只适用于同一数据、schema 与连接器，更新后失效；复用连接，不反复装载数据。

## 问题、方法与交互

按[分析与决策](metric-analysis/guide.md)及[空间分析](metric-analysis/map.md)确定比较或检验，再扩展查询、图型与摘要。`metricDefs` 和默认分组图提供业务接入示例；改一段 `finding` 文字不能替代新增证据，现有模板不代表已实现全部诊断方法。

分析捕获入口国家和指标固有条件，如 AQI>100 的风险子集。样本门槛与 Top N 只限制对应展示，全部分组和完整证据仍可达；敏感性比较须保留原始基准。来源分类与数值分箱不混用，分位与样本量按完整范围计算。

`requestMain`／`requestModal` 保留版本保护；关闭、重开或切换后，旧查询和退场回调不能覆盖新状态。图表与表格原位更新，完整记录不因分片映射被截断；临时 Builder、图表和等待任务按[组合指南](visual-query/references/composition.md)释放。分析关闭保留主屏实例、国家、视角与入口焦点。

## 初始化与降级

`ready` 表示数据可用，`presented` 表示首屏已开始呈现，两者分别管理。加载期间保留尺寸并禁用场景交互；数据与图表、地图可用帧及 GPU 预热或明确降级就绪后，`completeInitialPresentation` 一次性交接，再启动入场和数据柱生长。

候选资源回退归加载器，最终失败才进入错误态；不把中间换源误报为失败。总期限、重试、后台与减少动态沿用现有机制。初始化中途退出、WebGL 失败或 contextlost 都走真实降级，可用的筛选、分析与明细继续运行，不能用静态图片冒充三维可交互。

## 图形性能与释放

- 地形、实例柱、边界与点位共用真实坐标和高度。柱高保持固定业务尺度，数据变化才更新高度缓冲，主题更新材质，相机变化只更新投影／光照；装饰光效不改统计值。
- 复用纹理和图层批次，预处理分片让出主线程。高程精度、DPR 与绘图策略由现有配置管理，性能对比使用同画质、同视角和实际绘制帧，不能只数 draw call 或沿用旧 FPS。
- pointermove 合并到已有 RAF，点击精确拾取；指针离开、拖动或后台清除悬停任务。使用同一 canvas rect 转换点击和提示位置，保留真实地形的背面遮挡。
- 静态地球缓存仅在相机稳定且静态层不变时使用，回放颜色同时重建地形深度。视角、投影、地形、变换、buffer 尺寸、主题／背景及颜色处理变化使其失效；新增移动层须更新静态／动态图层列表。缓存有内存上限，预热或捕获失败回退直绘，共享 geometry 由原拥有者释放。
- 统一暂停时钟覆盖后台、离屏、弹窗、手动暂停与减少动态，不累积恢复跳变，不增加第二条连续 RAF。样式变化不应重建 renderer 或重复上传地表。
- 销毁先标记过期并取消请求、等待、观察与动画，再释放 controls、几何、材质、纹理、缓存、renderer、图表、Builder、连接器和数据集。异步每次返回或让步后检查状态，释放尚未赋给公开 globe 的临时资源。

图表和表格按[HTML 接入](visual-query/references/html-integration.md)及[公共表格适配](visual-query/references/table-theme.md)维护；公共资源复制为内联内容，交付仍为单 HTML。

## AQI 分布诊断示例

“样本 AQI 均值”入口先比较国家样本均值与中位数，散点两轴共用数值尺度、点大小编码 n；国家 n 门槛只限制图形，完整分组可达。“尾部检验”以当前已确认范围的 P90 为界，对照原均值与保留 AQI≤P90 的均值，明确实际排除量及并列值影响；不把敏感性结果改写为清洗后的指标。

“核对高于P90的记录”仅缩小证据表，保留原范围与对照图。国家分组选中后进入检验保留该范围，搜索变化重新计算基准。VTable 记录可选择，首条尾部样本默认可核对；“应用国家并定位”才提交主页国家并定位代表位置，没有城市坐标时不伪造城市定位。无尾部记录、空结果或未标注国家明确处理；来源等级、数值分布与子指数原有路径仍可用。
