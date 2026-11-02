# 图表助手任务流程

## 1. 先定义交付物

| 输入                         | 默认处理                                                              | 交付                                    |
| ---------------------------- | --------------------------------------------------------------------- | --------------------------------------- |
| 用户要求图片 / PNG | 生成并校验 DSL → 托管渲染，见 [图片交付](image-delivery.md) | 真实可下载 PNG，默认透明背景 |
| 飞书文档中的静态图片 | 生成 PNG → 上传/插入普通图片块 → 回读，见 [飞书图片交付](feishu-image-delivery.md) | 文档链接 + 图片块验证结果 |
| 原始数据                     | LLM 识别字段、选模板、生成映射和配置                                  | 首次建图统一为可初始化的 commonOption   |
| 用户指定模板                 | 不重新推荐，只校验数据和编辑能力                                      | 合法 DSL 或明确拒绝原因                 |
| 已有飞书卡片 | 读完整当前 record → 最小编辑 → 按宿主能力原位保存或已授权替换 | 原位结果，或 old/new block ID + 分阶段验证 |
| 已有 `ILayerData[]`          | 结构校验、最小增量编辑                                                | 更新后的 ILayerData[]                   |
| 已有 commonOption            | 校验首次建图协议                                                      | commonOption 或运行时转换结果           |
| Sheet URL + 明确 direct-live | 读取指定 range 后直接作为最终数据，不聚合/改写；保存完整 source       | 可同步且可回显 URL 的 Sheet live DSL    |
| Sheet URL + 聚合/派生要求    | 只有宿主存在可持久化重放变换时才可 live，否则转 snapshot              | 转换后的 DSL + 同步边界                 |
| Base URL                     | 按显式 `enableAggregate` 决定明细或聚合；保存 table/view/field config | Base live source DSL                    |
| 风神可视化查询 URL           | 交给插件解析并同步既有图表，不拉 rows 重新制图                        | Aeolus URL record/DSL                   |
| 参考图片 / 截图              | 逐项提取可见文本、图型组合、配色、图例和画布元素，再选择 DSL          | 经实际图面比对的 card，或待视觉核验配置 |
| Common/share URL             | 判定返回类型和同步边界                                                | URL record 或物化 DSL                   |
| 飞书目标文档（可编辑卡片）   | 先完成 DSL，再写卡片                                                  | block ID + readback 结果                |
| 新建飞书文档并放图表         | 先完成 DSL，再以同一身份创建 Docx 和卡片                              | document URL + block ID + readback 结果 |

原始/standard data 首次建内置图使用 commonOption 让编辑器初始化，不手工编造完整 browserData。风神可视化查询 URL 是例外：飞书卡片可直接使用顶层 URL record，本地画布可使用 `sourceType:"aeolus"` 的 commonOption chart，两者都由插件物化 Aeolus browserData，而不是由 LLM 构建 standard data。已有编辑态 readback、模板 fixture 或真实导出时才直接创建/更新 browserData；这是一条协议生命周期规则，不按 iDA 等宿主分别定义。

### 1.1 参考图片还原

“将这张图变成图表助手卡片”可以是很短的用户 prompt，但执行时必须读取 [参考图片还原](image-reproduction.md)：截图决定可见文字的原语言、图型和堆叠/分组关系、图例和颜色语义，以及气泡框、箭头、文本框等是否是独立画布元素。图片任务不能按“未指定图型时由分析目的推荐模板”的默认路径重设计图表。

纯文本请求优先于上表，输出形式与材料指令边界按 [语言规则](../SKILL.md#语言) 执行。

## 2. 数据理解（LLM 职责）

1. 读取字段名、类型、示例值、缺失、基数、单位和时间粒度。
2. 识别维度、指标、系列、标签、size/group 和层级。字段类型只是证据，不是结论。
3. 检查重复、空值、负值、单位混合、聚合层级和排序语义。
4. 用户指定图表时验证最低字段；未指定时根据分析任务选择模板。
5. 按 [自动洞察与标注](auto-insights.md) 比较原数据中的可比值，筛出值得表达的变化并决定是否标注；分析过程中的差值/增长率计算不等于改写源数据。保留原始记录与数值，不静默聚合、Top N、补零、换单位或新增派生列。展示顺序按 [排序规则](data-and-formatting.md#5-排序规则)：明确业务语义的本地新图可排列完整行并说明；已有图只改要求的排序，direct-live 不重排也不额外生成 `columnSorts`。

## 3. 模板验证

- 字段数和角色满足 catalog。
- mapping 字段真实存在且类型/值域合理。
- 请求的 label/barLink/marker/type switch 在能力矩阵中。
- 百分比、堆叠、双轴、层级或流向语义成立。
- 不满足时只说明“缺什么 + 为什么”，询问会影响当前请求的必要信息；只有当前数据语义支持时才提出可选方案，不在确认前执行，也不必列满备选。该边界覆盖标题、正文和标注：缺少年份映射不能把 CAGR 改成普通增长率；散点总量口径待定时不能将任选 X/Y 差值或倍数写成替代结论。无百分比定义不建议百分点差，未知单位不猜，不借用示例或其他子题的数字。独立明确请求的基础图可继续，采用不依赖待定口径的描述性标题；若整个请求依赖缺失口径，先提问。

## 4. 生成 DSL

1. 构建标准数据；固定 columns/rows。
2. 写 mappingSpec。
3. 新建业务标注按 [semantic-marker-anchors.md](semantic-marker-anchors.md) 写 target，可与 commonOption 一次生成，不等待 series ID。旧配置/显式自由几何才使用旧定位；modelSpec 或单元素样式编辑按 [语义元素定位](element-editing.md#0-语义-target只补现有-dsl-的定位) 生成 target，由支持此入口的实例补齐身份；旧宿主仍先物化 readback。
4. URL-backed 时写 source/sourceBinding。
5. 新建默认应用 MBB 的全部非配色规则：显式生成 rich 主标题，次级说明仅在有事实依据且提供额外信息时生成；配置值轴标题内容、网格、必要标签和图例，其余组件字体字号继承图表助手主题。模型可从原生/default、base、McKinsey、BCG绿、Bain候选选择配色，无需MBB关键词；无依据时原生回退，同组图稳定。用户明确样式优先，已有图表只改用户要求的部分。
6. 对保存态序列化 standard value，校验可逆。

新建点说明或修复点标注重叠时，按 [点标注布局流程](point-marker-layout.md) 生成偏移与引线候选，完成目标、偏移与引线字段检查；不承诺候选位置无重叠。

### 局部修正时保留完整表达

修正标注、数据映射或校验错误时，必须保留用户原需求（含参考图）中的图型、数据含义、分组/系列身份、配色对应关系和图例。可以调整数据结构，但不能为满足某一字段或计算能力而静默牺牲其他表达；不固定长表或宽表。若能力限制使要求不能同时满足，说明具体冲突和未完成项，不把局部正确当成整图完成。计算口径继续按 [差异标注口径](semantic-marker-anchors.md#3-差异from--to) 判断，不因改映射而替换。交付前对照原需求核对上述表达及标注是否同时保留；结构校验通过不代表完整还原通过，也不因此额外要求业务任务运行渲染。

### 唯一定位与请求完成检查

凡请求按业务键定位差异／点标注、单点样式或图表联动，先对最终数据形状及实际映射逐个核对目标 `match`（差异需分别核对 from/to）：每个目标必须恰好对应一个可视业务对象，完整键包括必要的维度、组和指标。匹配 0 个是缺失，超过 1 个是歧义；保留重复原始行并不使同名对象可唯一定位。无可靠区分字段时，不用行号、数组位置或内部 ID 冒充业务维度，也不静默求和、去重或取首行。只有用户确认可重放的分组／汇总口径后才能按该口径重建目标；要求保留原始记录时不能以未经授权的汇总图替代。

逐项对照用户显式要求和最终 JSON／回复。若目标不唯一且定位是请求的必要部分，先说明缺少的区分字段或汇总口径并澄清；独立可完成的基础图可交付，但必须明确标注／样式／联动未完成，不得将配置结构通过或基础图生成称为完整请求通过。

### commonOption 交付前校验

对最终交付的 JSON 校验，而非只检查中间对象。可执行 Node 时，使用包内 [结构校验器](../scripts/common-option-validation.mjs)，在 Skill 根目录运行以下命令，`chart.json` 是待交付的裸 commonOption 或包含 `commonOption` 的 record 文件：

```bash
node --input-type=module - chart.json --new <<'NODE'
import fs from 'node:fs';
import { validateCommonOption, validateNewChartDefaults } from './scripts/common-option-validation.mjs';
const input = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const commonOption = input.commonOption ?? input;
const errors = validateCommonOption(commonOption);
if (process.argv.includes('--new')) errors.push(...validateNewChartDefaults(commonOption));
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('commonOption checks: OK (not a rendering or write verification)');
NODE
```

首次建图保留 `--new`；已有图的局部编辑移除它，避免用新建默认规则改变原样式。结构检查区分列类型与数值格式枚举。新建检查另核对 standard 内置图的轴标题父级可见性、已有 rich 标题的默认文字层级、轴/图例/普通标签的字体继承；轴标题可见时补父轴 `visible:true`，不要通过关闭标题逃避检查，用户明确隐藏轴则保留显式 `visible:false`。它不是全部 MBB 规则检查，也不代替下面的人工语义核对。

用户明确指定字体时，由调用端结合原始请求向 `validateNewChartDefaults(commonOption, 'commonOption', { authorizedStylePaths: [...] })` 传入获准修改的精确字段路径，例如 `commonOption.elements[0].options.config.modelSpec[0].spec.text[0].fontSize`。不接受通配符或整块豁免，不向产品 JSON 添加授权字段，也不能为了校验通过自行声称用户已授权；记录覆盖的请求依据。其他样式、枚举和可见性仍正常检查。

交付文件链接必须原样复用工具实际返回的 URL/token，不手工重拼或凭记忆抄写。提供链接前，用当前身份核对实际文件名与可访问性；不可读取时保留失败原因并提供已有可用附件/本地路径，不把上传成功等同下载成功。补交保留原始内容，重新生成时明确标为新产物。

遇到本层占比内容与普通模板冲突时，按 [内容、模板与边界检查](semantic-marker-anchors.md#30-本层内容模板与边界的生成检查) 修正；先保留用户比较口径和指定图型的约束，不能为了校验通过静默换口径。静态检查不覆盖未知模型的实际百分比状态和端点几何。

层级差异标注按数据、模板和已知层序检查两端类别、指标与边界：底层 `start` 可能同为 0%，顶层 `end` 可能同为 100%，不要照搬其他层的边界。保留用户指定边界，其他层累计边界相等也不自动换目标。未知层序不凭 mapping 顺序猜测；使用已知模板契约或已有运行时元数据，仍无法确定时说明所需信息。完整对照见 [上下层边界示例](semantic-marker-anchors.md#30-本层内容模板与边界的生成检查)。

遇到 `unsupported key title/label` 时，按 [普通标题最小配置](model-spec.md#普通标题最小配置) 改到 `modelSpec`，保留业务意图，不仅删除字段。修正后重新校验，通过后再交付或写卡。对最终文件校验返回非零时不得声称“结构校验通过”或交付该文件作为有效完整 record；尤其检查多元素画布中线条的正宽高。没有脚本执行能力时，按 [DSL](dsl.md) 的 config 白名单逐字段核对，并注明未运行脚本；不要声称自动校验通过。此检查仅适用于 commonOption，不将 URL record 或 browserData 强行转换后套用。

写卡场景加一道同源闸：写入卡片的 record 必须和刚通过校验的是同一个最终文件——不得只对候选/中间文件校验后改写字段再写入，也不得把校验失败的文件降级为“已尽力”写入；校验非零时先修正枚举或白名单键（高频两处：`columnFormats` 的旧枚举 `category`/`number` 格式，按 [ColumnFormat](data-and-formatting.md#2-columnformat) 改写；table 保存态字段如 `showHeader` 混入 `options.config`，按 [表格组件](components.md) 移出白名单层），重新校验通过后再执行写入。

该校验覆盖结构、config 白名单和可确定的本层内容/模板冲突；还需核对 model identity、非空标题文本和 `visible:true`（新标题省略 `_initialize_`，已有占位标题不能保留 `true`）。完整默认设计另按 [配置验收](mbb.md#11-默认设计配置验收) 核对 [富文本标题](model-spec.md#mbb-富文本标题)、值轴标题visible/text、轴标题/刻度/图例/普通标签无新增文字样式覆盖而继承主题、内置配色选择/原生回退及全部适用规则；不能只核对theme和图例。结构通过不代表标题已经在真实卡片中展示，写卡后按 readback 核对保存配置，不将其声称为视觉验收。

## 5. 示例：数据变柱图并开启两项能力

用户：“把月份、产品、销售额变成柱状图，开启系列标签和系列连接线。”

LLM 应：

1. 判断月份为维度、产品为系列、销售额为指标。
2. 校验每个月/产品组合最多一个同口径值；如重复则询问聚合方式。
3. 选择 `bar` 而非 `barGroup`，因为 `barLink` 不支持 group 模板。
4. 将长表 pivot 为宽表或让运行时产生等价 cell-series；不能仅写含糊 `series` key。
5. `mappingSpec = {x:"月份", y:["产品A销售额","产品B销售额"]}`。
6. 用户明确要求系列连接线，且最终模板受支持，因此首次 commonOption 在 `options.config` 写 `barLink:{enable:true}`；它不依赖 series identity。未明确要求时，只有类别顺序可靠、层语义稳定且任务分析相邻累计/构成边界变化才写。
7. 物化并 readback 后，复用真实 series `id/specIndex`，在对应 model 开 `seriesLabel.visible`；只有“单维度 + 单指标”的最小 standard bar 可按已验证规则直接使用 `series-0`。
8. 对上述多分类堆叠，即使 x 使用两级维度导致模板默认关闭，也在每个真实 series 的 modelSpec 显式恢复 `seriesLabel.visible:true`；不能按数组序号猜 ID。单层堆叠或用户明确关闭时不恢复。

完整两阶段结构见 [bar-series-label-and-link-two-phase.json](../examples/bar-series-label-and-link-two-phase.json)。若宿主只允许一次写入且没有物化回调，只能保证 barLink；必须明确系列标签尚待二阶段 patch，不能伪造 `series-0`。

## 6. URL 流程

识别 URL 类型后先分流：

- Sheet direct-live：读取指定 range → 必要结构规范化 → 读取结果直接成为最终 `StandardData.value` → 保存 value 内的完整 `larkSheet` source → 只生成 mapping/样式 → 物化后验证 live binding、URL 回显和同源刷新。
- Sheet 转换模式：若用户要求聚合/pivot/派生，先判断该变换能否被 source config 持久化重放；当前能力不能时转 snapshot，不声称自动同步。
- Base：仅按显式 `enableAggregate` 决定明细或聚合。
- Aeolus 可视化查询：把 URL 交给 Aeolus plugin → 保存/更新 Aeolus 图表快照和 source identity → 同步同一风神图表；不暴露 rows 给内置选图流程。
- Common/share URL：解析返回类型后再决定是 commonOption、standard、VSeed/VizData、editorData 还是 snapshot。

之后再判定手动/自动同步资格，并做同源刷新验证。

普通 `pageUrl` 直接停在“来源展示”；未知 URL 不探测。风神必须拿到插件解析后的 chart type；Sheet/Base 必须保存精确 table/range/view/field config。

## 7. MBB 流程

所有新图先保留数据和映射快照 → 应用全部非配色规则并生成显式rich主标题及必要的次级说明、值轴标题内容、网格及必要标签/图例，并让轴标题/刻度/图例/普通标签字体字号继承图表助手主题 → 按表达需要选择原生/default、base、McKinsey、BCG绿或Bain内置配色，缺少依据时继承原生主题色 → 按业务必要性生成 marker/重点 → 有真实 URL 时再配置 source link → 对比前后不变量 → 完整配置与业务语义检查。配色选择不改变其余默认规则的覆盖范围。

## 8. 文档与卡片流程

已有卡片的修改/替换先走 [已有卡片替换流程](existing-card-replacement.md)，使用完整旧 record，保留人工配置和尺寸；下述初始化 sanitation 只用于新建。

新建卡片区分两种模式：

- 已有文档：解析并验证 `document_id`，确认父 block/index 或追加到根节点。
- 新建文档：只有用户明确要求时执行；确定 title、可选 folder 和 user/bot 身份，创建 Docx 并保存返回的 `document_id`。对新文档根节点插卡时，父 `block_id` 就是 `document_id`。

共同流程：首次建图使用 commonOption；已有 readback 写回使用 browserData；URL 导入使用 url → sanitation → 新卡 record 写入 `__auto_fit_mode:"auto"`、`__auto_fit_size_mode:"manual"`、`__auto_fit_user_resized:true`、`__auto_fit_pending:false`，commonOption/URL/独立 browserData 分别写入 `__auto_fit_trigger:"common_option"` / `"url_sync"` / `"browser_data_init"` → JSON.stringify record → 用稳定 `client_token` 创建 block → readback 核对配置与固定尺寸模式。已有卡片修改/替换保留原尺寸模式，用户明确要求自适应时按要求处理。URL 场景核对来源与同步配置资格；实际打开、交互和同步测试属于开发验证，不是普通写卡必经步骤。

创建文档成功但插卡失败属于部分成功：返回 document URL 和失败原因，复用同一文档重试插卡；未经用户授权不删除已创建文档。文档创建结果不明确时先按运行记录和目标目录核对，不能盲目重试造成重复文档。

## 9. 输出说明

### 待定请求的交付前检查

请求有未完成部分时，写卡或交付前将最终 JSON 中的标题/轴标题/标注文字、回复正文及备选方案一起核对；结构校验通过不能替代此检查。

所有交付都先核对文字证据：仅有起止两年数据只能支持端点变化和有年度声明的 CAGR，不能证明中间“持续/逐年”增长。标题、副标题及最终解释不能补造未提供的单位或指标含义；绘图过程、格式字段名和重复标注说明留在必要的交付说明中，不填入图表副标题。动态标注的手算预期须与实际 `content` 和边界口径一致，未观察运行时计算则明确只是预期。

1. 区分已完成、模板不支持、缺少口径三种状态。已知模板不支持的能力直接说明，不暗示补齐口径后原模板就能支持；用户独立授权的基础图或其他可完成部分继续交付。
2. 对文字中的每个新增单位、差值、增长率或倍数，核对原始数据依据及对应的已授权分析意图。原始数值可照常展示，用户独立授权且口径完整的比较可保留；删除为待定部分自行挑选的替代比较，包括解释原因和“可以改用……”中的量化示例。未知单位省略，只有下一步需要时才询问。
3. 重新检查清理后的整份交付：只报告实际完成项、不支持项和必要澄清，不把检查过程写进答案。备选方案只说明待确认的表达方式，不预先填入未经确认的计算结果。

散点不支持差异标注；确认比较口径后也只能使用 [散点标注能力](markers.md#散点标注能力) 中已支持的表达。

交付时只说明影响决策的信息：模板、字段映射、启用能力、source/sync 语义、MBB preset、卡片位置和验证结果。失败时说明具体不满足项，不用“可能不支持”掩盖已知边界。

包含点标注时，按 [布局交付](point-marker-layout.md#4-保存与交付) 报告实际渲染与保存验证范围；报告配置修改与回读结果。

## 跨图表连接器

首次创建按 [语义连接器](semantic-chart-connectors.md) 一次生成两图及 `options.target.from/to`，使用真实业务字段与指标，省略 `data/points` 和连接器布局矩形。图表仍显式布局；静态校验检查 chartId 引用，运行时检查实际目标唯一性及锚点能力。写后检查连接器解析错误与保存态数量，不能仅凭图表 ready 声称连线完成。


## 标注生成与历史读取

新调用默认 `markerFormat: "editor-marker-authoring/v1"`、`markerCapabilityVersion: "core-semantic-v1"`。推荐、增强和智能编辑只生成 Core 作者记录，预览、保存和重开消费相同 target；不请求旧 `generatedMarkers.spec` 或在模型侧计算运行时坐标。commonOption 仍是直接 DSL 的完整载体，协议字段属于 API 请求而非 marker 记录。历史原生/坐标保存态可继续读取和维护；需要原生 spec 导出时使用 Core 当前作者态的实际导出，不恢复旧生成器。
