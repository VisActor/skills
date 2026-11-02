# 统计分布与持续业务评价（开发宿主协议）

本配方需要本轮新增的 native `histogram`／`boxPlot` 模板或 `businessContext.version:1` 解析能力。它们是开发中的宿主能力，不能据包版本号或 Skill 已加载推定线上已注册。生成前核对目标宿主能力；未确认时询问是否使用支持该协议的开发宿主，或提供明确的静态降级方案并说明无法持续重算。旧宿主不能静默丢掉协议后仍宣称可编辑。真实生产宿主与来源同步验收单独保留，不因示例或结构检查通过而关闭。

## 1. 原始样本直方图

原值保留在 `options.data.type:"standard"`，`config.mappingSpec:{value:"原值列"}`。必须确认频数或密度、全部分箱边界和闭合规则，不以“自动分箱”补猜算法。

```json
{"statistics":{"kind":"histogram","input":"samples","measure":"count","boundaries":[0,1,3],"closure":"left-closed-last-inclusive"}}
```

区间是左闭右开，最后一区间包含右边界。边界必须有限、严格递增、至少两个；每个样本必须是有限数值且位于覆盖范围内。空值不补零，越界样本不静默丢弃。`measure:"density"` 表示频数÷总频数÷区间宽度，纵轴使用频率密度及倒数单位，面积之和为 1；不得拿不等宽箱的频数高度当密度。确认边界后改数自动重算频数／密度，派生箱不替换原始样本。

示例：[原始样本频数](../../../examples/business/statistical-protocol/histogram-samples.json)。

## 2. 给定分箱直方图

绑定三个不同字段：`mappingSpec:{binStart:"起点",binEnd:"终点",count:"频数"}`，配置 `statistics:{kind:"histogram",input:"bins",measure:"count"|"density"}`。每箱正宽，按起点排序后连续且不重叠；频数为非负安全整数，总频数也须可准确计算；密度模式总频数必须大于零。当前不接受不连续箱或只有“箱名＋密度”缺少频数的输入；缺失分箱或频数需澄清。原分箱行保持原样，排序仅发生在派生绘制数据中。

示例：[不等宽给定箱密度](../../../examples/business/statistical-protocol/histogram-bins.json)。

## 3. 给定五数箱线图

`statistics:{kind:"boxPlot",input:"fiveNumber"}`；`mappingSpec` 显式绑定 `category/min/q1/median/q3/max` 六个不同字段。类别非空且唯一，五数有限并满足 `min≤q1≤median≤q3≤max`。`min/max` 是用户提供的下须／上须，不默认解释为全部样本极值；不重算已给定五数。若用户给了独立的异常点列，可另绑定 `mappingSpec.outliers`，每格是 JSON 有限数字数组（无异常点用 `[]`），每个值必须严格小于下须或大于上须；异常点参与共同数值域。没有该列时不得从五数凭空推导异常点。

示例：[给定五数](../../../examples/business/statistical-protocol/box-five-number.json)。

## 4. 原始样本箱线图

`mappingSpec:{value:"原值列",group:"分类列"}`；`group` 可省略表示单样本组。必须明确以下全部算法字段，未提供时澄清，不能静默采用某个四分位定义：

```json
{"statistics":{"kind":"boxPlot","input":"samples","quartileMethod":"linear-r7","whiskerMethod":"tukey","whiskerMultiplier":1.5}}
```

`quartileMethod` 允许 `linear-r7`、`linear-r6`、`tukey-hinges`，需逐图标注口径。R7 对排序样本使用位置 `(n−1)p` 的线性插值（Excel `PERCENTILE.INC`）；R6 使用 `(n+1)p` 插值（Excel `PERCENTILE.EXC`），每组至少 3 个样本；Tukey hinges 分别取上下半部的中位数，奇数样本的两半均包含总体中位数，偶数样本各取独立半部。`whiskerMethod:"tukey"` 必须配 `whiskerMultiplier:1.5`：须取 `Q1−1.5×IQR` 至 `Q3+1.5×IQR` 内最小／最大真实样本值，范围外样本为异常点。`whiskerMethod:"min-max"` 不允许倍数，须为所有样本的真实最小／最大，派生异常点为空。四分位与须口径可明确组合；缺省、任意倍数、加权样本或自定义公式均拒绝。分类原值可以是数值或文本，但不能混用数值 `1` 与文本 `"1"` 的同名类别。

回复中若给出四分位、IQR、栅栏、真实须或异常点的具体数字，按每组排序样本重新核对 `IQR=Q3−Q1`、下栅栏 `Q1−1.5×IQR`、上栅栏 `Q3+1.5×IQR`，再从栅栏内原样本取真实须；逐项核对文字数字与算法配置及原样本。无法复核的派生数字不要写入说明；若用户明确要求数字，标记该部分未完成，不把省略数字称为完整交付。结构校验通过不代表说明文字正确。

示例：[R7／Tukey 样本](../../../examples/business/statistical-protocol/box-samples.json)。

四类统计模板都保持原数据及算法配置，改数派生重算。统计图字段改名只在可信的一对一位置映射成立时事务迁移 `mappingSpec`；列交换、重复或歧义在更改原表前拒绝。`histogram`、`boxPlot` 是模板 ID，不能使用普通 `bar` 加统计字段冒充协议。新模板当前轴数组顺序为 `axis-bottom/specIndex:0`、`axis-left/specIndex:1`，与普通柱图不同；已物化图优先沿用真实身份。统计图不添加普通系列标签或差异标记，不承诺任意聚合或直接来源同步。

## 5. 层级差异标记持续评价

对 standard `hierarchy-diff-line`、`total-diff-line`、`growth-line` 的业务双端绑定明确方向，也可对 native bullet 的每个类别明确 `actualField/targetField/metricDirection`。不自动推断整组柱色、标题或经营结论。差异标记的 `target.from` 是 reference，`target.to` 是 actual；每端保留完整业务 `match/metric`，不按排序交换、不存第二套端点。比较内容继续使用已有差异/增长计算与明确的非正基准策略。

```json
{"businessContext":{"version":1,"comparisons":[{"markerId":"q1-budget-difference","metricDirection":"high"}]}}
```

`metricDirection` 仅允许 `high/low/unknown`，markerId 非空且唯一。high：actual 高于 reference 有利；low：actual 低于 reference 有利；相等中性。unknown 或缺少绑定不判好坏，不从“收入／费用”名字推断。评价只读两个真实原值，负基准不使方向反转，也不取累计坐标、边界或差异率符号。缺失／歧义端点须诊断，不改绑其他对象。

子弹图逐类绑定示例：`{"businessContext":{"version":1,"comparisons":[],"bulletComparisons":[{"category":"费用甲","actualField":"实际","targetField":"目标","metricDirection":"low"}]}}`。类别值及两个字段须与原 standard 表逐一对应；换序、改数后仍按原类别重算，只改变实际柱默认轮廓，不覆盖目标/区间填充或单项作者样式。经营解释文字只采用用户明确提供的事实与文案，可放在既有标题/说明中；系统不得根据有利色自动编写“改善原因”或行动建议。数据变化后若原话失实，应提示用户核对文案，不把静态说明称为动态结论。

数据改动自动重算受管理标记默认色，方向配置可持久化和撤销。当前采用既有咨询主题 favorable/unfavorable 色槽，中性用 mutedText；作者明确的线色、标签色、符号色、局部段样式和显式 0 优先，自动色只存在运行时，不写回作者配置。未知方向保留原默认样式。自定义覆盖可能弱化评价颜色时保留覆盖，并在解释中说明；不要新增静态“达成／超支”文本冒充动态评价。

示例：[高好](../../../examples/business/continuous-evaluation/high.json)、[低好](../../../examples/business/continuous-evaluation/low.json)、[未指定](../../../examples/business/continuous-evaluation/unknown.json)。三例数据和数学内容相同，仅方向不同。主题标题仍按基准比较的稳定标题规则处理。

## 6. 交付检查

核对算法／字段绑定、原值及单位；对缺失算法或非法输入先澄清，不自行修数。结构、真实渲染、改数、撤销重做、保存重开、导出、目标宿主和来源同步分别记录。示例是可移植配置，不是模型首答、外部宿主或来源同步通过的证据。复跑使用冻结 Skill 和目标宿主能力；纯模型会话不能声称已完成编辑器动作。
