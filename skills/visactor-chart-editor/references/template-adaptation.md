# 模板适配与维护

先复制并运行[完整 HTML](../templates/template.html)，保存默认态，再改业务。模板中的 `page-config` 是可读 JSON，`source-data` 是完整 CSV 的 JSON 字符串；不要从压缩代码重写编辑器。

| 入口                                       | 业务适配                                       | 保留机制                                                                                 |
| ------------------------------------------ | ---------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `#page-config`                             | title、appearance、accent、schema、chart       | schema 与源列顺序一致；chart 指定 chartType、dimensions / measures、limit、locale、theme |
| `#source-data`                             | JSON.stringify(完整 CSV)，转义 `<` 为 `\u003c` | RFC 风格引号、BOM、空行、null 与零、完整数据范围；date 列统一 YYYY-MM-DD 以正确比较范围  |
| CSS `.forma-*`、`--accent`                 | 宿主布局、排印、业务品牌                       | 字段与四槽完整可到达、长字段可读、移动端独立滚动                                         |
| `EditorDemo.builder`                       | 当前公开 VBI Builder                           | 字段、聚合、排序、编码、格式、过滤组、limit / history 均由 Builder 管理                  |
| `EditorDemo.serialize()` / `applyDSL(dsl)` | 完整状态包与已验证的 DSL 恢复                  | 先验证再替换、过期导入丢弃、失败不破坏当前状态                                           |
| `EditorDemo.runtime`                       | 原生渲染实例与 resize / dispose                | latest-wins 串行更新、morph、错误 / 空态、Observer 和实例释放                            |

`chart.dimensions` / `measures` 是字段配置数组，元素使用 `field`，按需加 `alias`、`encoding`、`aggregate`、`sort`，指标还支持 `format`。例如 `{"field":"revenue","aggregate":{"func":"sum"}}`。更换 schema 时也替换初始字段，不能保留演示字段。模板按用户要求移除 CSV 上传；默认使用内嵌数据，业务连接器由宿主接入。修改图型 / 指标不会擅自清除无关 HAVING 条件。

查询通过 `builder.observeDeep` 订阅图表 DSL 的深层变化，字段、聚合、筛选、数据源配置与撤销重做变化后自动重新查询；绑定后显式触发首次查询，替换 Builder 或退出时用同一回调 `unobserveDeep`。同一事务通知一次，连续操作只提交最新请求，旧请求不得覆盖结果、缓存或提前结束 loading。

查询由本地连接器 → VQuery 执行 → `builder.buildVSeed()` → VSeed Builder → VChart / VTable。渲染前不另写 JS 聚合、不本地 slice 冒充 limit、不从 DOM 反推领域状态。业务条件需要保存时直接写入完整 DSL。演示连接器 ID `localDataConnector` 已注册；动态源按公共接入能力适配。

日期维度默认按日分组。`to_year` 至 `to_second` 的八种日期聚合返回维度标签，连接器保留字符串原值（年份也保留字符串）；数值指标仍按指标类型归一化。维护时运行 `DIM-02` 验收，检查八种粒度的日期单元格、销售额汇总和按日分组结果。

运行时内嵌当前仓库的 VBI / VQuery / VSeed（包版本为 0.7.0，VSeed 含尚未发布的 morph 增量）；同时内嵌本地安装的 VChart 2.1.7 与 VTable 1.23.1。新业务默认沿用版本，版本升级后完整复测。脚本失败显示可理解错误；空查询移除旧图，保留有效配置；查询失败清除旧结果并反馈原因，修正后恢复。

`serialize()` 返回的状态包结构为 `{version:2, chart:完整VBIChartDSL, presentation:{title,accent,appearance}}`，不含源数据或连接器实现。独立重放须注册同源连接器，不能把状态导出称为完整数据备份。`applyDSL` 支持空图表，非法连接器 / 字段 / DSL 保留原配置。

## 模板维护边界

当前技能以完整的 `templates/template.html` 为可运行入口，不包含构建或测试工程。业务适配优先修改可读的配置、数据和 CSS；不要从压缩代码重写编辑器，也不要假设改动 Standard 源码后模板会自动更新。

外壳样式、初始化与局部等待反馈直接维护完整 HTML 中的 CSS、`startup-runtime` 和 `control-feedback`；设置弹层的定位、动画、焦点与监听清理由内嵌运行时的 `useEditorSettings` 集中管理，避免另一份启动脚本与交付文件分叉。需要改变核心运行时能力时，先确认仓库公开 API 与模板内嵌版本，再维护完整 HTML，保留 DOM、公开宿主接口、资源许可和实例生命周期，并按验收矩阵验证行为。

渲染适配替换原因与 API 约束见[Standard 对照](standard-reference.md)。表格直接使用 Standard / VSeed 完整主题与 PivotChart 交互，不注入仅适用于平面 ListTable 的公共 DashboardTable 副本。其他体验必须通过[验收矩阵](standard-parity.md)，任何额外移除 / 重写在交付中记录原因、替代行为和验证证据。

按用户明确要求，模板不提供宣传标题、数据源信息条、预览 / 导入 DSL / 保存按钮、CSV 上传、底部色板、配置查看区、图表标题 / 副标题、结果数量 / 悬停说明 / 成功状态与 Live Preview 标签。替代行为是直接使用已连接数据源、通过 `page-config.appearance` 选择默认主题、`page-config.accent` 覆盖初始品牌色（用户选择主题后采用该主题色）、通过公开状态接口供宿主保存恢复。Standard 工具栏以 `allowSourceChange={false}` 关闭上传；Standard 自身默认行为不变。验证这些入口已消失，同时四槽、过滤、31 图型、history、主题、全屏、morph 和窄屏仍可用。

模板内嵌外观主题，浅色 6 套、深色 4 套，默认 `classic-light`。设置入口位于工具栏全屏按钮右侧，语言仅中英，不保留独立明暗开关。主题明暗和语言使用公开 Builder；色系属于宿主呈现配置，不写入分析 DSL。`presentation.appearance` 供宿主记录当前外观，`applyDSL()` 只恢复分析 DSL；独立重放时将外观写入 `page-config.appearance`。

当前完整内嵌所有运行时 JS，不探测或请求 CDN。详见[内嵌运行时](runtime-loading.md)。替换未发布代码时必须使用包含对应修正的构建；未来外置资源需确认版本已发布并重新验收。

图型选择与工具栏合为顶部一行，位于字段列表和配置槽上方，复用 Standard 的 `ChartTypeSelector`、分组元数据和 Builder 操作。工具栏传 `showChartType={false}` 避免重复入口，选择器传 `closeOnSelect={false}`；Standard 默认仍在选中后关闭。面板支持连续选择、关闭按钮、Esc 与点击外部关闭，主动关闭返回触发按钮焦点；通过 `placement="bottomLeft"` 向下展开并与入口左边缘对齐，空间不足时沿用 Ant Design 自动调整，全屏时浮层挂到全屏容器内。入口布局与面板保持属于 UI 状态，不写入 DSL。验收应覆盖位置、连续选择、Canvas 悬停隔离、中英、窄屏和全屏。

字段颜色直接消费 Ant Design 语义 token：维度使用 `colorPrimaryText / colorPrimaryBg / colorPrimaryBgHover / colorPrimaryBorder`，指标使用对应 `colorSuccess*`。ChartEditor 的 `colorSuccess` 固定为绿色种子 `#52c41a`，由深浅色算法生成各状态，小字号字段文字使用浅色深一阶、深色浅一阶的文本 token；维度跟随当前主题的 `colorPrimary`。字段列表、槽位标签、悬停和拖拽预览保持同一身份色；图型图标和字段箭头不叠加独立底色，交互反馈作用于整个按钮或标签；外层容器使用中性色边框，图表色盘不受字段角色色影响。验收应覆盖十套主题、拖拽身份色及桌面单行 / 窄屏双行工具栏。

### 数据感知的动画边界

继承 VSeed 的维度组合配对，不在模板重写 morph 身份。正常饼 / 环继续使用路径变形；含零 / 负值的退化扇区使用原生淡入，避免引擎把零角度路径展开成大圆。热力等图型进入雷达时使用协调淡入，避免只有点变形而线 / 面独立出现。保留原数据、最终视觉、显式动画配置及减少动态效果设置；过程验收见 [Morph 分析](morph-analysis.md)。

### 图表过渡动画开关

设置面板使用用户文案“图表过渡动画”，默认开启。页面配置可用 `morph: false`（或保存配置中的 `presentation.morph`）关闭；该设置映射到 VSeed `animation.morph`，无需改写生成的 spec。关闭保留普通动画，系统减少动态效果优先。保存配置必须保留此选择；恢复后及关闭再开启后的第一次图型切换都要检查中间帧。

设置面板不使用分割线，以留白组织语言、图表过渡动画和主题。图型入口及选项卡使用 Ant Design Button 原生悬停 / 点击反馈，右侧使用 DownOutlined。

### 本地设置持久化

语言、主题和图表过渡动画写入 localStorage，键为 `visactor-chart-editor:settings:v1:<location.pathname>`，不同导出的 HTML 路径独立保存。启动优先使用经过校验的本地设置，其次使用页面配置，最后使用默认值；只接受中英文、已存在的主题 ID 和布尔开关。损坏缓存、禁止存储或容量不足不阻止页面加载与交互。分析字段、查询结果和数据源不写入此缓存。保留页面自定义 accent，直到用户主动选择主题。验收应覆盖修改与刷新恢复、无效缓存和不可用存储。

初始化使用独立加载卡片，阶段、失败重试、首帧和入场衔接的约定见[内嵌运行时](runtime-loading.md)。新业务必须保留真实就绪门槛，不能把读取脚本成功当作数据或图表已经可用。

## 数据与图片导出

工具栏图型入口与其它按钮桌面为 28px 高，窄屏或粗指针触控设备为 44px；数据、图片菜单采用原生 Ant Design Dropdown。导出属于宿主呈现能力，不改变 DSL 或渲染 spec。

CSV / Excel / 复制数据使用当前 VSeed 的查询结果和维度、指标元数据，按当前字段顺序输出别名列头，包含当前过滤、聚合、排序和 limit；不导出完整原始数据、不导出内部重塑字段。CSV 带 UTF-8 BOM、处理引号与换行，并将公式样式字符串作为文本；Excel 为真正的 `.xlsx`，保留数值类型。复制数据为带列头的 TSV，便于粘贴到表格。

图片使用 VChart / VTable / PivotChart 的公开 `exportCanvas()`，仅导出当前绘图区（表格为当前视口），以当前主题底色合成 PNG，不包含工具栏。无数据、查询或渲染未就绪时禁用导出；剪贴板不受支持时禁用复制，权限被拒时保留下载入口并显示提示，不弹出额外权限流程。全屏下菜单和反馈挂载到全屏容器。减少动态效果同步到 Ant Design 的 motion token，避免关闭 CSS 动画后菜单停留在不可见的初始状态。

验收时断网操作真实下载和剪贴板，解析 CSV / XLSX，独立计算默认与过滤汇总，检查数值类型、中文引号换行、空值、公式文本、limit、三类表格/图表、分面图、深色英文、窄屏、全屏、忙态与权限拒绝。
