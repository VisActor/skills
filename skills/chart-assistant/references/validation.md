# 交付校验与完成检查

对最终产物执行适用检查：新建commonOption用结构与新建默认检查，已有图局部编辑只用结构检查；URL record和browserData不强转commonOption。业务键定位、局部修正和待定请求分别读对应章节。普通配置校验不附加渲染门禁。

## commonOption 交付前校验

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

## 局部修正时保留完整表达

修正标注、数据映射或校验错误时，必须保留用户原需求（含参考图）中的图型、数据含义、分组/系列身份、配色对应关系和图例。可以调整数据结构，但不能为满足某一字段或计算能力而静默牺牲其他表达；不固定长表或宽表。若能力限制使要求不能同时满足，说明具体冲突和未完成项，不把局部正确当成整图完成。计算口径继续按 [差异标注口径](semantic-marker-anchors.md#3-差异from--to) 判断，不因改映射而替换。交付前对照原需求核对上述表达及标注是否同时保留；结构校验通过不代表完整还原通过，也不因此额外要求业务任务运行渲染。

## 唯一定位与请求完成检查

凡请求按业务键定位差异／点标注、单点样式或图表联动，先对最终数据形状及实际映射逐个核对目标 `match`（差异需分别核对 from/to）：每个目标必须恰好对应一个可视业务对象，完整键包括必要的维度、组和指标。匹配 0 个是缺失，超过 1 个是歧义；保留重复原始行并不使同名对象可唯一定位。无可靠区分字段时，不用行号、数组位置或内部 ID 冒充业务维度，也不静默求和、去重或取首行。只有用户确认可重放的分组／汇总口径后才能按该口径重建目标；要求保留原始记录时不能以未经授权的汇总图替代。

逐项对照用户显式要求和最终 JSON／回复。若目标不唯一且定位是请求的必要部分，先说明缺少的区分字段或汇总口径并澄清；独立可完成的基础图可交付，但必须明确标注／样式／联动未完成，不得将配置结构通过或基础图生成称为完整请求通过。

## 待定请求的交付前检查

请求有未完成部分时，写卡或交付前将最终 JSON 中的标题/轴标题/标注文字、回复正文及备选方案一起核对；结构校验通过不能替代此检查。

所有交付都先核对文字证据：仅有起止两年数据只能支持端点变化和有年度声明的 CAGR，不能证明中间“持续/逐年”增长。标题、副标题及最终解释不能补造未提供的单位或指标含义；绘图过程、格式字段名和重复标注说明留在必要的交付说明中，不填入图表副标题。动态标注的手算预期须与实际 `content` 和边界口径一致，未观察运行时计算则明确只是预期。

1. 区分已完成、模板不支持、缺少口径三种状态。已知模板不支持的能力直接说明，不暗示补齐口径后原模板就能支持；用户独立授权的基础图或其他可完成部分继续交付。
2. 对文字中的每个新增单位、差值、增长率或倍数，核对原始数据依据及对应的已授权分析意图。原始数值可照常展示，用户独立授权且口径完整的比较可保留；删除为待定部分自行挑选的替代比较，包括解释原因和“可以改用……”中的量化示例。未知单位省略，只有下一步需要时才询问。
3. 重新检查清理后的整份交付：只报告实际完成项、不支持项和必要澄清，不把检查过程写进答案。备选方案只说明待确认的表达方式，不预先填入未经确认的计算结果。

散点不支持差异标注；确认比较口径后也只能使用 [散点标注能力](markers.md#散点标注能力) 中已支持的表达。

交付时只说明影响决策的信息：模板、字段映射、启用能力、source/sync 语义、MBB preset、卡片位置和验证结果。失败时说明具体不满足项，不用“可能不支持”掩盖已知边界。

包含点标注时，按 [布局交付](point-marker-layout.md#4-保存与交付) 报告实际渲染与保存验证范围；报告配置修改与回读结果。
