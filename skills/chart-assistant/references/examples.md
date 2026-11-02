# Examples 使用索引

## 预算与实际

[季度预算比较](../examples/business/baseline-comparison/common-option.json)：960×540 的完整 commonOption，Q1 预算 100、实际 120，动态本层差额／差异率为 +20／+20%；合计预算 400、实际 420，合计率 +5%。实际深色、预算浅灰通过语义分组样式定位，不猜 series ID。标题保持稳定主题，不写死合计结论。适用输入、零负基准、百分点、纹理和编辑边界见 [基准比较配方](business/recipes/baseline-comparison.md)。

## 单项与分组语义定位

[业务 target 样例](../examples/semantic-element-targets.json) 包含单柱与标签、完整指标组、轴标签与网格线、多维单对象（产品A×Q2×实际）的 Prompt、基础 commonOption 和 patch。单对象案例演示柱与标签各写一条含 `markName` 的 `markStyle` 语义条目，禁止改用 `dataGroupSpec` 整组着色降格。样式沿旧字段；首次加载将 patch 合并到 options.config，已有实例只提交 patch。运行时补齐内部身份后再保存，不能把基础图的出现当成单项编辑已完成。

## 虚实折线与排序

- [单对象虚实折线](../examples/solid-dashed-line.json)：3—9月销售数据，5月共享接点，6—9月虚线；显式关闭系列标签和图例，用标题次行说明线型。身份只适用于此标准宽表 line 结构，验证范围见 [专题](solid-dashed-line.md)。
- [多对象虚实折线](../examples/solid-dashed-line-multi-object.json)：两对象分别拆实际/预测列；先创建数据，再按实际 groupKey 和 model identity 合并样式，并按实际图例项索引设置连续/分段符号。不是可原样写卡的完整 record。
- 条形图指标/总量/差距排序及月份季度跨年示例见 [排序决策与执行](data-and-formatting.md#5-排序规则)；是否可以重排先按数据来源判断。

## 蝴蝶图左右对称比较

[人口结构蝴蝶图](../examples/butterfly-population-pyramid.json)：760×460 的 standard `butterfly` 完整 commonOption，`leftY`/`rightY` 分别映射女性与男性。**两侧数据都是正值**，向左生长由模板内部的轴 `inverse` 实现；左右值轴共享同一数值域，两侧量级可直接比较。`butterflyAxisPosition:"center"` 把类目轴放在两区中间，改成 `both`/`left`/`right` 只影响布局，不动数据与映射。

示例同时给 `series-left` 与 `series-right` 配置柱背景；这两个 series 分属不同 region，图表级样式不能只写其中一个。

一侧填多个字段即为该侧堆叠层，两侧各自累计、互不抵消。替换业务数据时保持两侧同量纲，否则共享数值域会让较小一侧几乎不可见。

## 本层标签内容示例

[本层占比差](../examples/semantic-layer-label-content.json)：百分比堆叠柱 B 原值 20→60、占比 20%→30%，显式选择 `layerShareDiff`，预期 +10 pp。切换 `layerValueDiff` 为 +40、`layerGrowthRate` 为 +200%、`layerShareGrowthRate` 为 +50%。下方累计边界 record 使用另一计算口径，不因新建而改成本层格式。

[Mekko 本层占比差](../examples/semantic-mekko-layer-share.json)：使用 `mekkoPercent`，Labor 的 BU 1→BU 2 占比差为 -1.06 pp；该层实际位于最上层，使用 `boundary:start` 避免两端 end 均为 100%。改用 `layerShareGrowthRate` 时预期 -2.44%。

[Development 底层占比差](../examples/semantic-bottom-layer-share.json)：`areaPercent` 完整配置，2008→2012 的 Development 实际位于最底层，使用 `end/end` 连接 2.6369%→33.9934%，标签 +31.36 pp。可改为 `barPercent`；内容改为 `layerShareGrowthRate` 时为 +1189.13%。与上方 Mekko 顶层 `start/start` 对照使用，不能照搬边界。

## 点标注文字布局

[China 点说明与折线引线](../examples/semantic-point-callout-layout.json)：760×440 的 standard scatter 完整 commonOption，`target.match` 定位 China，`itemContent.offsetX=-58/offsetY=28` 是文字移到左下方的候选，`itemLine.type=type-do` 连接目标。此偏移不承诺在其他尺寸、字体或数据下无重叠；按 [点标注配置](point-marker-layout.md) 生成偏移与引线，用户反馈冲突时再针对性调整。已有显式偏移或手动位置应保留。

## 参考图片中的画布气泡框

[分组堆叠产能图与画布 callout](../examples/image-grouped-stacked-callout.json)：用 `options.spec` 的 VChart `common` 表达一根客户预测柱和一根由当前/新增产能构成的堆叠柱；示例包含一个独立画布 `callout`，不是 `mark-point`。仅作为图片还原的协议示例，必须在目标运行时渲染并按 [参考图片还原](image-reproduction.md) 调整位置、尺寸和字体。

## 语义标注完整 record

[气泡四象限名称](../examples/bubble-quadrant-corner-labels.json)：四行最小示意数据，x=0.5、y=-8；quadrant 管分区，四个无引线 markPoint 管角落文字。布局规则及反转、删除等限制见 [四角布局](semantic-marker-anchors.md#71-四象限名称的四角布局)。替换业务数据时重新确定阈值与名称。

以下是完整 record，可按能力边界替换业务数据和 target。

| 示例                                                               | 内容与已知边界                                                                                   |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| [基础标注](../examples/semantic-basic-annotations.json)            | 参考线、包裹 Q2–Q3 柱子的区域、Q4 点说明；区域高度是固定 0–120，不承诺随柱高自动求最大值         |
| [年度复合增长](../examples/semantic-annual-growth.json)            | 年份数据声明、动态 CAGR，2020→2024 为四年、10% |
| [总计与层级差异](../examples/semantic-total-versus-hierarchy.json) | 整栈总量与 A 层结束边界均使用动态 `value`；本例已确认 A 为上层，两者都为 +90，而非 A 自身差 +50。不要将该层序推广为字段顺序规则；只有改为比较 A 自身时才选 `layerValueDiff` |
| [单条分区线](../examples/semantic-partition-threshold.json)        | standard scatter 的增长率 0.1 阈值，不生成四象限                                                 |
| [业务四象限](../examples/semantic-business-quadrant.json)          | standard scatter 的 0.1/0.2 两阈值，highHigh 浅绿色，不生成 polygon key                          |

Examples 是协议样例，不是可无条件复制的模板。先读每个文件的 `kind/precondition/note`。

新建业务标注优先使用 [语义标注 Reference](semantic-marker-anchors.md) 中的 target、reference-line、年度声明和 quadrant 示例，按其中实际能力边界替换业务字段和值。它们是作者语义配置片段；API/Agent 默认协议为 `editor-marker-authoring/v1`、能力为 `core-semantic-v1`，不依赖开发 query。放入 commonOption 的 `options.config.marker` 或保存态的 `attribute.marker`，不要与同一标注的旧 coordinates 拼接。下表的 coordinate 和两阶段分区示例仅作旧配置/显式自由几何参考。

| 文件                                                | 覆盖目标                                                                            | 可直接作为最终 DSL                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `examples/common-option-bar.json`                   | 从零创建并让运行时生成 identity/layout                                              | 是，作为 commonOption record 片段                                                |
| `examples/ida-mbb-single-series-bar.json`           | 完整季度销售 commonOption：rich title、轴标题、普通标签、context 色与 Q4 单柱 focus | 是；单 datum match 只因其满足单维度单指标 standard `barGroup` 窄规则             |
| `examples/mbb-single-mark-emphasis.json`            | 物化后按 datum 突出 Q4 单柱；展示通用 brandFocus 重点编码                           | 否；必须复用当前 runtime 返回的 match，不能复制字段/索引到其他图                 |
| `examples/ida-common-option-with-text.json`         | iDA 宿主示例；演示通用 `position + options` element 外壳                            | 是；`ida-light` 仅适用于明确要求 iDA 主题的场景，不隐含 `source.appName`                                            |
| `examples/bar-series-label-and-link.json`           | 已物化 bar browserData、seriesLabel、totalLabel、barLink                            | 仅可信 fixture 场景；identity 来自 readback                                      |
| `examples/bar-series-label-and-link-two-phase.json` | 从零创建后 readback，再开 seriesLabel                                               | 是，按 phase 顺序执行；phase 2 的 identity 用 readback 替换                      |
| `examples/model-spec-multi-component.json`          | 多轴、图例、标题、series 与 crosshair 的 identity；演示标签字段归属 series 条目、crosshair 独立组件 | 否，是已有图的 patch                                                             |
| `examples/single-axis-legend-elements.json`         | 单轴标签、单网格线、单图例项                                                        | 否，key 必须来自当前 runtime                                                     |
| [bottom-center-legend-spacing.json](../examples/bottom-center-legend-spacing.json) | 新建默认图例下方居中（bottom/middle），顶部16px留白 | 图例 modelSpec 配置片段，需合并到完整配置 |
| `examples/bottom-left-legend-spacing.json`          | 用户明确要求图例左下方；保留显式位置覆盖，非新建默认                          | 否，是已有图的最小 patch                                                         |
| `examples/group-label-and-mark.json`                | `dataGroupSpec` 的 all/group label 与 mark                                          | 否，groupKey 必须来自 dataGroupMap                                               |
| `examples/single-label-and-mark.json`               | 普通 label、seriesLabel 引导线、单 markStyle                                        | 否，identity/key/match 必须已物化                                                |
| `examples/label-variants.json`                      | total、pie 内外、funnel outer/transform、hierarchy/Mekko label                      | 否，每个 case 使用各自 runtime identity                                          |
| `examples/bar-link-style-map.json`                  | barLink 全局配置与单条 line/area/label 覆盖                                         | 否，node key 必须来自当前 runtime                                                |
| `examples/marker-intents.json`                      | 当前语义 target、阈值与标签口径的意图推理；含分组完整业务键的差异端点；非穷举                                  | 否，先确认业务字段与尺度，再按 semantic-marker-anchors 转为配置                  |
| `examples/scatter-quadrant-two-phase.json`          | 相关性/四象限决策，以及业务阈值到两条分区线和四个 polygon 的两阶段流程              | phase 1 可直接建图；phase 2 必须使用当前 runtime 返回的百分比和 polygon identity |
| `examples/diff-marker-coordinate-generation.json`   | 已有 coordinates 的非堆叠 growth 兼容结构                                | 仅旧定位维护时按 [兼容规则](legacy-marker-coordinates.md) 使用；新建读语义 target 示例                                       |
| `examples/sheet-live-card-record.json`              | Sheet live commonOption + autoSync 请求                                             | 条件成立后可作为 record object                                                   |
| `examples/aeolus-url-card-record.json`              | 风神 URL record + autoSync 请求                                                     | 条件成立后可作为 record object                                                   |
| `examples/create-doc-and-card-two-phase.json`       | 新建 Docx 后在根节点插入图表助手卡片                                                | 是，按 phase 顺序执行并替换运行时返回值；record 需 stringify                     |
| `examples/mixed-canvas-components.json`             | table/text/graphic/line 的 commonOption 与连接引用                                  | 基础元素可用；连接目标 ID 必须真实存在                                           |
| `examples/common-option-config-precedence.json`     | config 白名单、旧顶层兼容和显式清空                                                 | 是，用于解释合并结果，不是完整卡片 record                                        |

缺少真实 identity 时，优先参考 commonOption 示例，不要从 patch 示例复制 `axis-bottom`、`series-sales`、styleMap key、barLink node key 或 group key。飞书 `add_ons.record` 最终仍需对 record object 执行 `JSON.stringify`。

## 原生配色与默认制图规范

- [native-default-presentation.json](../examples/native-default-presentation.json)：选择原生候选色板，沿用原生主题，以原生 context/重点语义色强调 Q4，并完整生成富标题、轴标题，组件字号继承主题。
- [native-default-multi-series.json](../examples/native-default-multi-series.json)：选择原生候选色板的多系列图，省略 theme/color 覆盖以保留宿主色板；保留固定主标题，无增量信息时省略副标题，并应用轴标题、主题字体继承和图例规则。
- [green-presentation.json](../examples/green-presentation.json)：选择 BCG 绿色候选色板，保持与原生示例相同的完整非配色规范；绿色重点与浅绿 context 成套使用。

## 自动发现与瀑布方向色

- [auto-insight-quarterly-dip.json](../examples/auto-insight-quarterly-dip.json)：需要精确表达回落幅度且已有表达不足时，用Q1→Q2总计差异线和Q2重点色；不是无标注提示时必须套用的默认配置。
- [waterfall-semantic-colors.json](../examples/waterfall-semantic-colors.json)：单指标普通瀑布的总计、增加、扣减颜色。
- [waterfall-decrease-semantic-colors.json](../examples/waterfall-decrease-semantic-colors.json)：e总计独立，正输入映射扣减色。

- [same-color-bar-label.json](../examples/same-color-bar-label.json)：单维单指标横条，显式同色重点的柱外标签例外；灰色图形与灰色文字分别配置，华南柱及标签保留橙色。多维必须物化身份，不套用此例。

## 跨图表语义连接器

- [橙子饼图与品种堆叠柱](../examples/semantic-connector-orange-breakdown.json)：两条 `vh` 连接器，覆盖指标系列定位；61 与 67 不作数值一致的拆解。
- [PC 环图与横向条形图](../examples/semantic-connector-pc-breakdown.json)：两条 `hv` 连接器，覆盖空字段名和横向锚点映射。

两例可一次提交 commonOption，内部等待图元就绪后转成手动配置。生成与错误边界见 [semantic-chart-connectors.md](semantic-chart-connectors.md)。
