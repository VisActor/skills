---
name: visactor-map3d-dashboard
description: 创建富有立体感的三维地图 Dashboard，在地球上分析地域差异，联动证据、记录与后续行动。用于明确的三维地图或地球需求。Powered by VisActor。
---

# 三维地图 Dashboard

新建默认复制完整模板，先运行，再做最小业务适配。继承适用的排版、图表样式、筛选联动、动效和生命周期。用户指定风格或宿主约束优先；移除或重写能力时，记录原因及替代行为，并验证其余体验没有退化。

围绕用户要做的判断组织空间分析，交付单个 HTML。新建从[完整模板](templates/template.html)起步，继承地球、外观、控件和生命周期；已有页面沿用宿主。业务数据和轻量地理索引保留在文件内，外部运行时与大型纹理按[资源加载](references/resource-loading.md)管理。用户目标优先，示例业务与固定卡片结构按分析需要适配。

## 1. 确定问题与证据

先明确使用者、待判断的问题与可采取的行动。按[分析与决策](references/metric-analysis/guide.md)选择比较基准、分析方法、验证证据和记录核对路径，按[空间分析](references/metric-analysis/map.md)检查位置、覆盖和地域尺度。普通外观维护只读取涉及的呈现指南。

模板以城市 AQI 静态样本示范数据链路，字段、来源与限制见[地图与数据](references/map-and-data.md)。没有日期、人口和城市坐标时，只能分析来源样本的分布与差异；不生成时间趋势、人口暴露或虚构城市点位。更换业务后重新判断这些能力，结论随范围重算。

## 2. 接入并组织分析

- 按[模板适配](references/template-adaptation.md)替换 schema、字段映射、指标与证据查询；优先复用已有接入，其余按 [server-runtime](references/server-runtime/guide.md)选择。
- 使用 [visual-query](references/visual-query/guide.md) 的 Builder → VQuery → VSeed → VChart / VTable 链路。地球消费聚合结果，可保存的业务公式、关系与条件由 DSL / Builder 管理；相机、悬停与动效归呈现层。
- 概览突出主要发现，深入分析增加分布、比较、解释或敏感性检验。图表类型由问题选择，有后续价值才开放入口；全量分组和证据可达，Top N 只限制展示。模板默认摘要不能作为分析深度的完成标准。
- 明确事实、假设与未知，给出证据支持的下一步；数据不足时说明缺口，不从样本排名直接推断原因或治理效果。

## 3. 呈现与交付

继承[空间构图与外观](references/design.md)，维护主题或动画时再查[token 入口](references/design-tokens.md)。具体数值由 HTML 维护；地图编码、图例和统计口径一致，装饰与真实数据层可辨。主题、筛选、相机和动效各自保持状态，三维不可用时保留可用的分析与明细。

按[验收标准](references/acceptance.md)核对分析质量、数字、空间拾取、实际交互和降级。报告本次证据及未验证项，不沿用历史评分或性能结论。
