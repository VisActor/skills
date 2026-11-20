# 图表助手任务流程

任务入口、通用约束与默认设计由 [SKILL](../SKILL.md) 定义；本页只处理输入分流和执行顺序。已明确任务时直接进入对应协议，不先通读所有来源、模板和编辑文档。

## 1. 先定义交付物

| 输入/请求 | 执行路径 | 完成证据 |
| --- | --- | --- |
| 原始/已读取standard数据、指定内置模板 | 对应模板字段 → [commonOption](dsl.md#5-icommonchartassistantdata) → 所需交付工具 | 最终合法配置；复用工具的结构校验结果，指定模板不擅自改型 |
| 已有ILayerData或完整record | 最新readback → 当前操作的[编辑协议](editing.md)/[特殊逻辑](special-logic.md) → 最小更新 | 原身份、未修改字段与人工样式保留 |
| 已有飞书卡片 | [读取、原位编辑或已授权替换](existing-card-replacement.md) | 工具的已验证更新结果；替换按专用协议记录old/new身份，不重复询问已接受的身份变化 |
| Sheet/Base/Common URL | [来源角色与同步资格](sources-and-sync.md) | 精确来源配置、live/snapshot及工具返回的实际绑定结果 |
| 风神可视化查询URL | [插件导入与同步](sources-and-sync.md)，再看[风神能力](aeolus.md) | Aeolus来源与既有图表身份；不把URL拆成rows重选内置图 |
| PNG/透明背景图片 | [托管图片交付](image-delivery.md) | 实际保存的PNG，默认透明背景 |
| 飞书静态图片 | PNG → [上传并插入普通图片块](feishu-image-delivery.md) | 文件及插入工具的已验证图片块结果 |
| 飞书可编辑卡片 | 最终配置 → [卡片协议](feishu-doc-card.md) | 工具已验证的block ID、record与尺寸模式；结果不足时一次目标回读 |
| 新文档并插卡 | 明确title/folder/执行身份 → 同身份创建Docx和卡片 | 工具已验证的document URL、block ID与配置结果；只在用户要求新文档时创建 |

只要求文字解释时直接回答，不创建产物。新建内置图不手工构造browserData；已有readback、可信导出fixture或用户提供的ILayerData才沿完整状态编辑。飞书OpenAPI record的包装与序列化由[三层协议](dsl.md#1-三层协议不要混用)定义。

### 1.1 参考图片还原

先读[图片还原](image-reproduction.md)，再选涉及的模板和组件。图片中的语言、图型组合、堆叠/系列关系、颜色、图例、画布元素、相对布局和顺序是验收约束，用户显式要求优先。需要实际渲染比对；缺此能力只交付待视觉核验配置。不能因提示简短走默认推荐而重新设计。

## 2. 数据理解（LLM 职责）

核对字段角色、类型、示例值、缺失/负值、单位、粒度、重复与排序语义；验证模板最低数据要求。保留原始数值，不静默聚合、TopN、补零、换单位或派生指标。允许的结构适配、完整行展示排序和来源限制由[数据协议](data-and-formatting.md)定义。

## 3. 模板验证

核对字段角色、值域、百分比/堆叠/双轴/层级/流向语义和请求能力。缺口先区分“模板不支持”与“口径未提供”，按[待定检查](validation.md#待定请求的交付前检查)处理；独立可完成的基础图可继续，必要目标缺失时不能以基础图代称整个请求完成。

## 4. 生成 DSL

按协议建立标准数据及mapping，再写当前组件的modelSpec与必要标注/来源；应用 [MBB](mbb.md)全部适用默认设计；已有图只改授权部分。新标注[语义target](semantic-marker-anchors.md)可随commonOption生成，模型不预计算坐标。单图元/组件子项编辑走[元素定位](element-editing.md)，旧身份只有在真实可知时使用。

### 局部修正时保留完整表达

按[局部修正检查](validation.md#局部修正时保留完整表达)，同时保留图型、数据含义、分组/系列身份、配色对应、图例与比较口径；不能为修复一个字段牺牲其他要求。

### 唯一定位与请求完成检查

按[唯一定位规则](validation.md#唯一定位与请求完成检查)生成完整业务target，并采用运行时定位结果：0个为缺失，多个为歧义。没有可靠区分字段时不能用行号、取首行或未授权聚合凑唯一目标。

### commonOption 交付前校验

复用[执行出口的一次结构校验](validation.md#commonoption-交付前校验)，检查的是实际提交的最终内容，不独立串联Node预检、人工白名单与MBB复核。工具报错时只修对应字段，重新提交受影响产物；已知非法配置不能写卡或声称完整合法。工具不覆盖必要结构检查时，由调用端对同一最终输入执行一次校验。

## 5. 示例：数据变柱图并开启两项能力

“月份×产品销售额，开启系列标签和连接线”先核对每个月份/产品组合的唯一性；重复时澄清聚合方式。按[barLink](bar-link.md)选支持能力的普通堆叠模板，保持产品系列语义，不能只写含糊series键。

首次配置可写barLink；seriesLabel按[系列标签协议](labels.md#3-series-label)优先使用唯一指标的语义target，旧宿主或目标不唯一时才物化/readback取得真实身份。多级分类默认关闭也要按适用条件恢复；无法完成时说明缺项，不能猜series-0。完整两阶段步骤和可运行数据见[示例](../examples/bar-series-label-and-link-two-phase.json)。

## 6. URL 流程

按[来源协议](sources-and-sync.md)先判URL角色，再判同步资格。Sheet direct-live保留range读取结果，只做允许的表头/空尾/单元格解析，不重排或聚合；保留完整larkSheet source并核对live binding与URL回显。转换能否重放决定live/snapshot。Base仅按显式enableAggregate决定明细/聚合；Aeolus继续由插件导入同步。pageUrl止于溯源；未知URL仅在用户任务明确授权时探测。

## 7. MBB 流程

读[MBB适用章节](mbb.md)，保留数据/映射/来源，按默认设计规则生成标题、轴、标签、图例、配色和必要标注。用户显式样式与已有编辑优先，静态配置结果不能称为图面无重叠。

## 8. 文档与卡片流程

执行[卡片协议](feishu-doc-card.md)的当前分支；已有卡片先走[替换协议](existing-card-replacement.md)。新建卡片的固定尺寸字段、source trigger、sanitation和client_token由该协议单源定义；编辑保留原尺寸/版本/来源及未知字段。创建成功而插卡失败保留文档并返回部分成功；结果不明先核对记录，不能盲目重建或未经授权删除。

## 9. 输出说明

### 待定请求的交付前检查

仅说明影响决策的已完成项、具体限制和必要澄清；事实表达沿用[SKILL](../SKILL.md#协议与表达边界)。

## 跨图表连接器

按[语义连接器](semantic-chart-connectors.md)一次生成两图及业务target，运行时核对唯一性和锚点能力；采用工具返回的解析诊断与最终保存态，结果不足时才补取对应信息，不能只凭图表ready判断成功。

## 标注生成与历史读取

新生成、API默认和原生导出按[标注作者协议](semantic-marker-anchors.md)；历史coordinates按[旧坐标兼容](legacy-marker-coordinates.md)维护，不恢复旧generatedMarkers路线。
