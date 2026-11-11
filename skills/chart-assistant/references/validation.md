# 交付校验与完成检查

执行工具按实际输入类型校验，模型直接复用结果，不为同一产物追加完整复核。已有图局部编辑不套新建默认规则；URL record和browserData不强转commonOption。业务键定位失败、局部修正或待定请求只处理对应问题。普通配置任务不附加渲染门禁。

## commonOption 交付前校验

必要结构检查应由执行出口对实际提交的最终输入完成一次：[图片导出客户端](../scripts/export-image.mjs)已接入包内[结构校验器](../scripts/common-option-validation.mjs)，选择保存态输入时不校验record中的旧commonOption。其他写卡工具已有相同覆盖时直接复用；未覆盖时由调用端对同一最终输入执行一次，不再追加人工逐字段复核。只生成配置时按DSL规则生成，不默认启动导出或写卡。

以下命令用于独立调试或缺少自动校验的调用端，不是每次交付的前置步骤。在Skill根目录运行，`chart.json` 是裸commonOption或包含commonOption的record；保存态和URL模式不使用此命令：

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

可选调试新建默认设计时保留 `--new`；已有图的局部编辑移除它，避免改变原样式。结构检查区分列类型与数值格式枚举。新建默认检查覆盖standard内置图的轴标题父级可见性、已有rich标题的文字层级及轴/图例/普通标签的字体继承；生成时轴标题可见则设置父轴 `visible:true`，用户明确隐藏轴则保留 `visible:false`。新建默认检查不自动接入导出，不覆盖全部MBB规则，也不证明视觉效果。

用户明确指定字体时，由调用端结合原始请求向 `validateNewChartDefaults(commonOption, 'commonOption', { authorizedStylePaths: [...] })` 传入获准修改的精确字段路径，例如 `commonOption.elements[0].options.config.modelSpec[0].spec.text[0].fontSize`。不接受通配符或整块豁免，不向产品 JSON 添加授权字段，也不能为了校验通过自行声称用户已授权；记录覆盖的请求依据。其他样式、枚举和可见性仍正常检查。

交付文件名和链接直接复用工具实际返回的结果，不手工重拼URL/token或凭记忆抄写。工具未提供可访问性结果且用户需要在线访问时，再用当前身份做一次目标查询；不可读取时保留失败原因并提供已有可用附件/本地路径，不把上传成功等同下载成功。补交保留原始内容，重新生成时明确标为新产物。

遇到本层占比内容与普通模板冲突时，按 [内容、模板与边界检查](semantic-marker-anchors.md#30-本层内容模板与边界的生成检查) 修正；先保留用户比较口径和指定图型的约束，不能为了校验通过静默换口径。静态检查不覆盖未知模型的实际百分比状态和端点几何。

层级差异标注按数据、模板和已知层序检查两端类别、指标与边界：底层 `start` 可能同为 0%，顶层 `end` 可能同为 100%，不要照搬其他层的边界。保留用户指定边界，其他层累计边界相等也不自动换目标。未知层序不凭 mapping 顺序猜测；使用已知模板契约或已有运行时元数据，仍无法确定时说明所需信息。完整对照见 [上下层边界示例](semantic-marker-anchors.md#30-本层内容模板与边界的生成检查)。

遇到 `unsupported key title/label` 时，按 [普通标题最小配置](model-spec.md#普通标题最小配置) 改到 `modelSpec`，保留业务意图，不仅删除字段。只修报错字段后重新提交受影响产物；多元素画布中的线条按协议给出正宽高。结构校验失败的文件不能写卡或作为有效完整record交付。没有脚本或等价工具时按[DSL](dsl.md)生成，注明未自动校验，不追加人工全量白名单检查或声称校验通过。此校验仅适用于commonOption，不强转URL record或browserData。

写卡工具校验与写入使用同一最终record；校验后改写内容时由执行出口检查新输入，不把中间文件的结果移用于其他内容。旧枚举 `category`/`number` 格式按[ColumnFormat](data-and-formatting.md#2-columnformat)改写；table保存态字段如 `showHeader` 混入 `options.config` 时按[表格组件](components.md)移出白名单层。工具已完成这些检查时不再串联独立预检。

结构校验覆盖config白名单、模型协议、列格式及可确定的本层内容/模板冲突。生成时按[模型协议](model-spec.md)使用可靠identity、非空标题和 `visible:true`，新标题省略 `_initialize_`，已有占位标题不保留 `true`；默认设计按[MBB规则](mbb.md#11-默认设计配置验收)生成。工具结果只证明其覆盖范围；结构或保存配置结果不证明标题已在真实卡片中展示。

## 局部修正时保留完整表达

修正标注、数据映射或校验错误时，必须保留用户原需求（含参考图）中的图型、数据含义、分组/系列身份、配色对应关系和图例。可以调整数据结构，但不能为满足某一字段或计算能力而静默牺牲其他表达；不固定长表或宽表。若能力限制使要求不能同时满足，说明具体冲突和未完成项，不把局部正确当成整图完成。计算口径继续按 [差异标注口径](semantic-marker-anchors.md#3-差异from--to) 判断，不因改映射而替换。结构校验通过不代表完整还原通过，也不因此额外要求业务任务运行渲染。

## 唯一定位与请求完成检查

凡请求按业务键定位差异／点标注、单点样式或图表联动，按最终数据形状与实际映射生成完整目标 `match`（差异分别生成from/to），采用运行时已有定位结果，不重复调用同一检查：每个目标必须恰好对应一个可视业务对象，完整键包括必要的维度、组和指标。匹配0个是缺失，超过1个是歧义；保留重复原始行并不使同名对象可唯一定位。无可靠区分字段时，不用行号、数组位置或内部ID冒充业务维度，也不静默求和、去重或取首行。只有用户确认可重放的分组／汇总口径后才能按该口径重建目标；要求保留原始记录时不能以未经授权的汇总图替代。

若目标不唯一且定位是请求的必要部分，说明缺少的区分字段或汇总口径并澄清；独立可完成的基础图可交付，但必须明确标注／样式／联动未完成，不得将配置结构通过或基础图生成称为完整请求通过。

## 待定请求的交付前检查

沿用[SKILL的事实表达边界](../SKILL.md#协议与表达边界)，仅说明实际完成项、不支持项和必要缺口。已知模板不支持的能力直接说明，不暗示补齐口径后原模板就能支持；独立可完成部分继续交付。

标题、标注和说明只使用原始事实或已授权且口径完整的计算结果。仅有起止两年数据只能支持端点变化和有年度声明的CAGR，不能证明中间“持续/逐年”增长；未知单位省略，不补造指标含义。绘图过程与格式字段名留在必要交付说明中，不填入副标题。动态标注的预期遵从实际 `content` 和边界口径，未观察运行时计算则明确只是预期。备选方案只说明待确认的表达方式，不预填待定部分的替代量化结论。

散点不支持差异标注；确认比较口径后也只能使用 [散点标注能力](markers.md#散点标注能力) 中已支持的表达。

交付时只说明影响决策的信息：模板、字段映射、启用能力、source/sync 语义、MBB preset、卡片位置和验证结果。失败时说明具体不满足项，不用“可能不支持”掩盖已知边界。

包含点标注时，按 [布局交付](point-marker-layout.md#4-保存与交付) 说明实际执行的配置、渲染或保存范围，复用工具已有结果。
