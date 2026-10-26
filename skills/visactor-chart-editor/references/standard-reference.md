# Standard 职责对照

模板内嵌从 `practices/standard/src` 编译的原始组件；没有手写另一套简化编辑器。React / Ant Design / DnD Kit / Zustand 与当前仓库的 VBI / VQuery / VSeed 已内嵌；VChart / VTable 的完整 JS 也已内嵌，独立 HTML 不需要源码仓库和开发服务。完整能力、入口和通过条件见[验收矩阵](standard-parity.md)。

| Standard 源码（相对 practices/standard）                       | 模板采用的职责                                                              |
| -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `src/App/components/FieldsPanel.tsx`、`src/components/Fields/` | 完整字段、搜索、分组、类型 / 角色过滤、展开收起                             |
| `src/App/components/ShelfPanel.tsx`、`src/components/Shelves/` | 四槽、多字段、聚合、别名、编码、排序、格式、过滤编辑                        |
| `src/components/Shelves/dnd/`                                  | 真正的字段拖拽、插入、重排、跨槽语义转换                                    |
| `src/components/Filter/`                                       | 字符串、数值、日期 WHERE 与独立聚合的 HAVING                                |
| `src/components/Toolbar/`、`src/components/ChartType/`         | 全部 31 种图型、limit、undo / redo、全屏入口；中英双语 / 主题迁移至外壳设置 |
| `src/utils/`                                                   | 完整 CSV 解析、类型映射和本地连接器；模板不提供上传入口                     |
| `src/hooks/`、`src/model/`、`src/i18n/`                        | 公开 Builder 操作、文档订阅、查询缓存、过期结果保护和翻译                   |

外壳和渲染适配已内嵌在完整 HTML 中。对 `src/components/Render/VSeedRender.tsx` 的明确替换：Standard 每次释放实例，模板改为复用 VChart 并启用 morph，保留 ListTable / PivotTable / PivotChart、原生 tooltip / 图例 / 选择 / player 及透视图图例过滤。查询和领域规则没有移到适配层。模板查询订阅使用公开 `builder.observeDeep` / `unobserveDeep`，替换 Builder 时释放原订阅；首次查询显式执行，过期请求无法覆盖最新结果或缓存。

VBI 的 `instance.bind` 当前只允许 table / pivotTable DSL 绑定 VTable；分面图的 DSL 仍为 column 等 VChart 类型，因此 PivotChart 组合实例通过 `EditorDemo.runtime.instance` 暴露，不误绑为 VChart。普通图与表格均绑定公开 `builder.instance`，释放前解绑。这个限制不影响透视图本身的渲染和原生事件。

完整 HTML 的 `standard-source-manifest` 内含所有 Standard 源文件 SHA256 与三个核心包版本。清单仅记录生成时的源码，Standard 后续改动不会自动同步到模板。更新内嵌运行时时应重新核对来源并运行验收矩阵；清单不能代替真实行为检查。

透视图图例在适配层合并连续更新，原生调用间隔至少 220ms，并在切换配置或释放前取消待执行项。原因是固定 VTable 1.23.1 的 200ms 尾随过滤回调不会随 release 清理；保持相同过滤规则与最新选择，避免快速切图后访问已释放的数据。验收包含离散 / 连续图例事件和紧接着的渲染器切换。

用户指定的界面删减：工具栏通过 `allowSourceChange={false}` 关闭 CSV 上传及其弹窗，Standard 默认仍可上传。宣传区、数据源条、自定义预览 / 状态文件按钮、色板、配置查看区和 Live Preview 标签均从外壳删除；既有数据、Builder 状态接口与分析交互保留。技术性提示在共用翻译源修正；中文过滤和聚合菜单不展示 SQL / 函数名后缀，语义和实际操作保持一致。

按用户要求，模板通过 `VBIStoreProvider hideLocale hideTheme` 隐藏工具栏语言与深浅色开关，迁至工具栏全屏按钮右侧的设置面板。语言仅中文 / English；外壳提供浅色 6 套、深色 4 套主题，调用公开 `locale.setLocale` / `theme.setTheme`，配色应用于 CSS、Ant token 和 VSeed colorScheme。默认 VSeed 原生浅色，分析配置保持不变；Standard 默认工具栏不变。标题、结果说明与成功状态从外壳移除，业务标题仍保存在 `presentation` 供宿主使用。正常状态只有图形与原生图例 / 坐标 / tooltip；重新查询时保留旧图、绘图区置灰并显示贯穿查询与绘制的加载状态，使用 `aria-busy` 与状态区域提供可访问反馈，空态与错误提示继续显示。页脚只保留紧凑右对齐署名。

用户要求主题不改变堆叠边框：渲染适配通过公开 VSeed `barStyle.barBorderWidth: 0` 关闭柱 / 条默认描边，包含堆叠与分面；线图、坐标、tooltip、选中与图例事件沿用原行为。外壳边界使用中性明暗色。

资源加载适配见[内嵌运行时](runtime-loading.md)。React / Ant Design 保持仓库构建的版本与实例一致。VSeed 包含未发布的增量，使用当前仓库构建，所有 JS 内嵌在 HTML 中，默认演示可离线打开。

模板的控件适配只作用于呈现层：共用 CSS 统一浮层 / 菜单和触控尺寸；图型面板及配置槽添加样式类名；拖拽落点改用固定尺寸的透明度 / 缩放过渡。设置弹层通过 `useEditorSettings` 管理定位、可中断的双向动画与焦点恢复。Ant Design 菜单的定位、选择、关闭、键盘操作以及 DnD 的字段语义、排序和落点计算继续沿用原实现。
