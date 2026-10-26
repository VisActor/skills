---
name: visactor-chart-editor
description: 创建轻巧易用的图表编辑器，拖拽字段、切换图型，即时查看数据。适用于自助制图和数据探索。Powered by VisActor。
---

# 图表编辑器

用于可视化搭建、字段配置与实时数据探索。分析状态归 VBI DSL / Builder，界面只管理搜索、展开、弹层和渲染实例。

新建默认复制完整模板，先运行，再做最小业务适配。继承适用的排版、图表样式、筛选联动、动效和生命周期。用户指定风格或宿主约束优先；移除或重写能力时，记录原因及替代行为，并验证其余体验没有退化。

## 运行与适配

复制 [template.html](templates/template.html)，先验证默认图、一次拖拽、一次过滤和撤销恢复，再按[适配指南](references/template-adaptation.md)修改可读的 `page-config`、`source-data` 或外壳样式。默认完整内嵌 supermarket CSV 的 9,959 条记录、20 个字段。交付一个 HTML，完整内嵌已编译的 Standard 组件、React / Ant Design、VBI / VQuery / VSeed 及 VChart / VTable，无需工程构建或联网。VSeed 使用当前仓库构建，包含尚未发布的修正；暂不使用 CDN，资源约束见[内嵌运行时](references/runtime-loading.md)。

交互与 `practices/standard` 使用同一份源码，职责见[Standard 对照](references/standard-reference.md)。工具栏提供当前查询结果的 CSV / Excel 下载、数据复制，以及当前绘图区的 PNG 下载 / 图片复制。完整搜索与字段筛选、多字段、同槽重排及跨四槽拖拽、日期与数值聚合、编码、排序、格式、WHERE / HAVING、31 种图型、limit、undo / redo、中英双语和主题均应保留。不能缩减成单维度、单指标或少量图型。

- 数据接入按 [server-runtime](references/server-runtime/guide.md)；静态源完整内嵌，动态连接器不把凭据写入 HTML。
- 查询与渲染按 [visual-query](references/visual-query/guide.md)。所有业务编辑调用公开 Builder，WHERE 先过滤再聚合，HAVING 聚合后过滤，不用本地删行冒充查询。
- VChart 切换图型保持同一实例 `updateSpec` + morph。ListTable / PivotTable / PivotChart 保留 Standard 的完整渲染与图例事件；跨渲染器类别或系统减少动态效果偏好变化时重建。不要为了视觉效果删除 tooltip、竞赛时间轴、图例或数据选择。
- 按用户要求保持紧凑工作区：不添加宣传标题、数据源信息条、预览 / 导入 DSL / 保存按钮、CSV 上传入口、色板、配置查看区、图表标题 / 副标题、结果数量 / 悬停说明 / 成功状态或 Live Preview 标签。直接使用已连接数据源；工具栏全屏按钮右侧的设置面板只提供中文和 English，以及浅色 6 套 / 深色 4 套主题，默认 VSeed 原生浅色；工具栏不再单独放语言或深浅色切换。字段和图表交互保留。图表只保留绘图区，`Powered By VisActor` 紧凑排列在页面底部右侧。提示说明用户能做什么，不暴露 Builder、Ant Design、DSL 等实现词语。
- 通过公开接口保留完整 DSL 保存 / 恢复，包含字段 ID、别名、编码、排序、聚合、格式、条件组、limit、主题与语言。标题 / 品牌色 / 外观主题单独存于 `presentation`；默认外观可由业务配置指定，用户在设置中切换。`serialize()` 导出状态包，`applyDSL()` 先验证新 Builder，失败保留原配置；状态包不包含连接器和原始数据。

按[视觉规范](references/design.md)检查编辑密度、图表留白、颜色、长字段和窄屏。额外指标探索按需读取 [metric-analysis](references/metric-analysis/guide.md)，不强制叠加看板弹窗。

## 验收

先读[功能分析与测试矩阵](references/standard-parity.md)，再按[验收执行](references/acceptance.md)进行真实操作、独立数据计算、同视口截图与单文件运行。所有适用用例通过才能结束；切换能力与源码边界见 [Morph 分析](references/morph-analysis.md)。保留 morph 中间帧证据，不能只检查按钮存在或用静态扫描代替运行。

以 `templates/template.html` 为可运行交付入口，直接适配其配置、数据和样式。技能不携带构建脚本、测试工程或历史验收快照；运行时来源清单仅记录生成时的版本，不表示会自动同步仓库源码。

## 公共 API

[VBI](references/api/vbi/guide.md) · [VQuery](references/api/vquery/guide.md) · [VSeed](references/api/vseed/guide.md) · [HTML 接入](references/visual-query/references/html-integration.md)
