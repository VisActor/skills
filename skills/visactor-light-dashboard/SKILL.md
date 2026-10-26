---
name: visactor-light-dashboard
description: 创建支持业务判断与进一步分析的小而美的 Dashboard，适用于经营概览、指标监测和专题分析。Powered by VisActor。
---

# 轻量 Dashboard

新建默认复制完整模板，先运行，再做最小业务适配。继承适用的排版、图表样式、筛选联动、动效和生命周期。用户指定风格或宿主约束优先；移除或重写能力时，记录原因及替代行为，并验证其余体验没有退化。

围绕使用者的问题组织指标、图表、发现与探索路径。分析深度取决于任务和可用证据；简单问题可以用一张图回答。修改已有页面时沿用已确认的分析目标，只处理请求涉及的部分。

## 1. 明确问题与数据条件

明确谁使用、要判断什么，以及页面支持的决策或后续核查。检查数据粒度、字段、时间覆盖、比较基准和缺失情况，区分能够回答的问题与需要补充的证据，见[分析设计](references/insight.md)。

## 2. 组织分析与探索路径

围绕主要问题选择比较、贡献、分布、交叉分组等适用分析；每张图增加新的比较、定位、解释或核对依据。首页突出主要发现和必要证据，结论区分观察事实、可能解释与待验证假设。数据支持时给出下一步核查或验证方式。

按问题选择图形与阅读顺序；有进一步分析价值时，按[指标深入分析](references/metric-analysis/guide.md)设计入口、后续问题、明细核对与返回路径。

## 3. 选择并适配模板

从[模板列表](references/templates.md)与[可视总览](templates/index.html)选择接近任务的基座，按[模板接入](references/template-integration.md)替换数据、口径、查询和文案，再调整布局与图形。模板是实现参考，各页面的指标与分析路径按当前问题设计。

继承所选模板的排版、主题、控件、动效和响应式行为；用户要求与宿主规范优先。查询、渲染与联动使用 [visual-query](references/visual-query/guide.md)，数据源按 [server-runtime](references/server-runtime/guide.md)选择。可恢复的分析条件、布局与资源引用通过所属 DSL 和公开 Builder 管理，临时交互与具体绘制留在 UI。

独立模板以单个 HTML 维护，样式和脚本内嵌并按职责分段；直接编辑对应文件，不增加独立 CSS/JS 维护源或生成同步层。

## 4. 验证分析与体验

按[验收标准](references/acceptance.md)核对数字、范围、比较依据和结论边界，确认深入操作提供新证据；再验证受影响的交互及桌面、窄屏呈现。交付时简述已验证结果与数据限制。

## 按需参考

| 任务                         | 资料                                                                                                                                     |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 设计分析、撰写发现与决策依据 | [分析设计](references/insight.md)                                                                                                        |
| 选择与维护实现基座           | [模板列表](references/templates.md) · [模板接入](references/template-integration.md)                                                     |
| 调整阅读顺序、布局与视觉     | [布局](references/layout.md) · [配色与材质](references/design.md)                                                                        |
| 设计指标卡与时间趋势         | [指标卡](references/metric-card.md) · [趋势](references/trend.md)                                                                        |
| 调整筛选控件                 | [筛选](references/filter.md) · [Select 接入](references/filter-select.md)                                                                |
| 配置图表、查询与状态         | [VBI](references/api/vbi/guide.md) · [VQuery](references/api/vquery/guide.md) · [VSeed](references/api/vseed/guide.md) |
