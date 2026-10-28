---
name: person-poster
description: '创建、编辑和优化人物主导、数据密集、视觉统一的人物数据信息图与生涯海报，输出可编辑 HTML 和高清 PNG。适用于运动员、音乐人、演员、创作者、历史人物等人物专题，或参考人物剪影周围编排数据的杂志式信息图。仅有人物姓名不构成触发条件；单张统计图、普通人物介绍文章、以及明确要求 Page Schema/VStory 的任务不走此流程。'
---

# 人物数据信息图

以人物轮廓组织数据，以数据关系选择图表，以一套视觉语言贯穿整页。目标是可分享的人物数据海报，布局使用 HTML/CSS，完整图表使用原生 VChart spec，最终 PNG 从实际 HTML 导出。

新建或完整重构的设计起点：**实际查看用户本次提供的参考和已取得的人物原图**。从图中理解形状如何承载事实、素材边界如何改变证据空间；没有参考时按 [视觉校准](references/quality-reference.md) 用当前事实完成真实尺寸草稿。按当前事实编写 HTML/CSS 与必要的语义图形，整页由当前主证据、照片轮廓及原生裁边决定。普通局部编辑按用户要求执行。

## 独立包与使用边界

- 生成：默认交付高清 PNG，并保留完整可编辑 bundle。明确要求 HTML-only 时设 `manifest.delivery: "html"` 并省略 PNG；缺省或 `"html+png"` 仍要求最终 PNG。交付模式与是否包含图表独立；咨询任务只给分析。
- 编辑：沿用用户指定的成品及其人物、数据口径和视觉系统，按要求修改；修改字体或图标不默认重做数据与构图。
- 本包直接提供人物海报流程、原生 VChart 图表资料和生产工具。用户明确要求 Page Schema/VStory 或仅一张普通统计图时，说明本包的输出范围，不加载其他 skill；本 skill 不宣称 HTML 海报是 Page Schema 渲染。
- 解析本文件的**实际路径**作为 `SKILL_DIR`。所有说明和脚本都在该目录内；可以单独复制、安装和发布。不需要其他 skill、仓库源码、历史 `output/` 样例、前次聊天或固定临时环境。图表运行时默认使用固定版本 CDN，字体和人物素材按当前作品准备，不预装资源库。Python/Pillow、Playwright/Chromium 与网络要求见 [渲染与验收](references/render-and-acceptance.md)。

## 核心工作流

生产命令统一使用包内 `poster_workflow.py`，不要在环境失败后绕开流程另画 SVG 或只截图就宣称成品。起点先执行：

```bash
python3 "$SKILL_DIR/scripts/poster_workflow.py" preflight --bundle "$BUNDLE" --prepare-env
```

`--prepare-env` 允许一次任务独立 venv/依赖/Chromium 恢复；依赖安装和运行目录说明见 [环境](references/environment.md)。后续命令自动复用 preflight 成功的解释器。仍失败时保留具体错误、明确未完成项和草稿状态；不修改宿主缓存，也不跳过事实/图表/验收要求。

仅新建作品在环境就绪后初始化标准空画布，尺寸按当前作品选择：

```bash
python3 "$SKILL_DIR/scripts/poster_workflow.py" init --bundle "$BUNDLE" --width 1200 --height 1800
```

init只提供空根和契约，不决定构图、不写事实或通过记录，拒绝覆盖已有输入。已有海报尤其受限编辑直接review，不运行init/build。新建作品保留初始化的相对脚本入口；build生成载荷并刷新受管理桥接。启动脚本负责图片/字体等待、实例登记和ready/错误信号，无需另写Playwright或手工设置ready。

位图在manifest记录当前用途的`usageStatus`与真实`usageTerms`，具体字段及旧稿迁移见[素材契约](references/manifest-contract.md#素材状态与旧记录迁移)。unknown/restricted不能由acceptance的passed覆盖；缺字段的旧稿可诊断，正式交付前实际复核。用户要求官方/原始来源时，无法取得就说明阻塞并请求允许替代，不自行改用第三方后称满足要求。


0. **确认可执行环境。** 以上preflight成功后推进，不重复安装。仅失败时按报告读取 [环境恢复](references/environment.md)。素材能力盘点一次，参考资料到对应阶段再读；工具耗时自动记录，可观察的资料/布局阶段用 `workflow_timing.py start/end` 现场记录，漏记保持未知。
1. **确定人物叙事与证据。** 从现有要求确定人物、主题、统计截止日期、受众和尺寸。缺失且会改变方案的信息才询问；可推断的选择直接推进。阅读 [数据与人物素材](references/data-and-assets.md) 和 [来源比对](references/evidence-checks.md)，先保存实际源表/原文到 `evidence/`，通过原表定位声明与`poster_workflow.py data`生成 `data.json`（固定受限原稿不调用生成）；`fact-review.json` 的 comparisons 连接交付数值与源表。排版前执行`poster_workflow.py facts --bundle "$BUNDLE"`，解决差异与未覆盖字段，再核对年龄基准、首次/最高的完整限定、组成分母和派生标签；未上图字段也需核对，不需要的未核实数字删除。数值比对通过不证明文字表述或来源真实，不能把混合来源统称为官方核实。
2. **优先取得真实人物图片，再细化构图。** 阅读 [构图与视觉系统](references/composition-and-style.md)。素材优先级为用户提供或明确指定的合适图片 → 搜索并核实的真实人物图片。默认可分享作品优先选择有明确复用条件的真实图片；保存来源页与使用依据，未知就明确限制，不能把搜索所得图片写成用户已授权。先确认图片中的人物、时期与场景，保存原图及出处，再根据实际姿态、叙事和数据量选择构图家族；缺少全身照时可以改用半身或胸像。需要透明人物时，按 [人物素材准备](references/subject-preparation.md) 运行包内脚本：透明原图直接复用；不透明原图交由任意可用能力抠图，再验证、裁边并重新计算轮廓。保留原貌，检查最终人物后再定精确坐标。AI 人物素材仅用于用户明确要求的 AI 插画/重绘场景；真实图片不足时说明缺口，不自动改用 AI 肖像。姓名、数字、图表和必需文字保持独立可编辑。

   先按参考与叙事选路线：人物轮廓跨区承接数据用剪影；背景中的场景本身提供信息才保留照片，并围绕摄影边界构图。背景颜色接近版面不构成保留场景的理由。剪影必须实际去除背景，并查看结果及 HTML 引用的文件；`prepare_subject.py` 接收透明图或原尺寸灰度mask，保留原图RGB。无现成分割工具时查看素材文档的可选系统能力，仍不可用则寻找可信透明素材或明确交付草稿。
3. **由证据和素材共同分配空间。** 为主证据预留真实标签与图形所需的宽高，再安排人物及其他事实。把半身/胸像的原生裁边与画布边、照片边或共享证据带衔接；人物尺度与画布高度一起选择。将参考中的数字主次、分组和图形关系落实到当前输入，需要整页层级校准时查看 [视觉校准](references/quality-reference.md)。不沿用参考坐标。
4. **先做全内容粗排和阅读检查。** 读取 [展示事实绑定](references/display-bindings.md)，让实际文字、数值和图表数据连接核实记录；先为直接文字片段写入同名 `id` 占位，数值/说法来自data.json，固定文案来自映射；使用 `poster_workflow.py build --bundle "$BUNDLE"` 先集中检查引用，再核查来源、同步DOM与图表、运行粗排。build-check.json分别记录生成与layout结果；引用错误先修复声明，阅读失败先修布局，不手写另一份载荷或另行截图。图表HTML加载相对路径的charts.generated.js，不再手写内嵌spec；目标缺失就修HTML，不清空映射。所有标题、单位、限定、脚注都进入草稿，不能只用几个代表字号。人物、主证据与必要领域图形共同确定空间，见 [领域图形](references/domain-graphics.md)。build后查看 `layout-review/display.png`：固定600px宽度下全部文字至少12px；失败先删重复内容、增加证据区空间/高度或调整分栏，再细排。不能删必需信息或用2×像素数解释小字；用户要求单页时拆页须另行取得同意。`layout`复用最终检查标准，但不代替最终review。将实际取舍简记在 `design-brief.md`。
5. **先验证关键图表，再完成排版。** 原始缺失/不适用值与真实零值分开。有未观测分类时先读 [缺失值示例](references/chart-types/column.md)：次数可以为0，但以0为分母的场均值/比率未定义，保留 null；缺失分类保留缺口和说明，不填0或小正数；必要标签与口径说明在实际阅读宽度可读。 阅读 [图表设计](references/chart-design.md)、[图表接入](references/chart-bridge.md) 和 [渲染与验收](references/render-and-acceptance.md)。完整系列使用图表，独立事实与纯事件使用 HTML。柱/条图按设计文档选取对应配置，替换当前数据、字段、颜色与空间；其他类型查 [本地图表资料](references/charts.md)。明确时间/数值/原始顺序并在实际输出核对。静态图中每个人名/类别与数值必须能直接对应，同色图例不能承担多个人物的唯一身份映射。主图先看局部，再嵌入整页复验。图表配置以spec为源，values来自已核查data.json，运行载荷由build生成；字体、标签、颜色与整页一致；长名称与小色段分别安排名称和数值，类别强调按身份绑定颜色。
6. **对照参考验收，再导出成品。** 依次运行下方 review/export/verify。固定600px阅读宽度、全部可见文字至少12px；`contrast.json` 根据文字实际覆盖的图片/图形背景检查对比，不只核对配置颜色。修复小字、低对比和不可测项，再实际查看 `review/display.png`、总览和主图局部。姓名与必要文字避开脸、手、关键器具；不能因为脚本通过就称“无遮挡”。逐图记录标签/身份配色/实际落点与截图观察，未看或失败不得写视觉通过。技术状态仅pending/passed/failed；`data-decorative`不豁免文字，人工说明不能覆盖原始失败。记录素材使用依据，查看2x PNG后执行verify；HTML-only仍需review与verify。技术通过不等同于事实或视觉通过。

```bash
python3 "$SKILL_DIR/scripts/poster_workflow.py" review --bundle "$BUNDLE"
# 实际查看阅读图与主图局部，修复后重跑review。补齐事实和素材记录。
python3 "$SKILL_DIR/scripts/poster_workflow.py" export --bundle "$BUNDLE"
# 查看最终PNG，更新acceptance的technical/factual/visual/usage结论。
python3 "$SKILL_DIR/scripts/poster_workflow.py" finish --bundle "$BUNDLE"
```

export及底层正式导出共用当前review、来源数值和素材依据检查；verify检查完整交付并绑定输入与核查记录。finish复用verify生成delivery-package.json和完整delivery-reply.md；最终回复使用该回复的完成状态、失败原因及实际文件清单，再补充观察。blocked/draft以“正式交付未完成”开头，正式文件列表为空；意外存在的正式文件名PNG不进入清单，也不复制诊断图充当成品。修改HTML/spec/素材/数据或证据会使相应旧结论失效。失败先修复，未解决就明确草稿和缺口，不能改调底层截图或以结构校验成功宣称完成。工具自动记录真实命令耗时；未观察的资料/布局阶段保持未知，不在收尾集中补计时。

遇到用户锁定文字/字号/尺寸且检查失败：保持输入，执行下列失败出口，并以“草稿/未完成”收尾，说明冲突并请求允许改变限制。原样导出要求不豁免阅读验收，披露跳过检查也不能称任务完成。

先呈现finish列出的带身份诊断图与失败，再请求调整；不以选择问题替代已有诊断。只使用package的allowedActions，不提供“知情豁免后正式交付”，用户接收原样草稿也不改变blocked。工具协议不能强制宿主遵守，最终聊天状态与实际图片仍须核查。

```bash
python3 "$SKILL_DIR/scripts/poster_workflow.py" draft --bundle "$BUNDLE"
python3 "$SKILL_DIR/scripts/poster_workflow.py" finish --bundle "$BUNDLE"
```

原始诊断截图保留draft/preview.png作内部证据；向用户只展示finish列出的draft/诊断草稿-未完成.png。该报告图在海报外增加DRAFT标识，不改变原稿画布，报告图尺寸包含外框，不能称原样导出成品；正式失败状态不变。不要另写截图脚本生成“成品”。已有原稿的受限编辑先review，不调用会修改内容的build。

## 产物与证据

默认保存到 `output/[人物或主题]-person-poster/`：

```text
index.html                  整页可编辑布局与文字
preview.png                 浏览器导出的最终图片
manifest.json               尺寸、图表、资产与来源映射
charts.generated.js         build从原生spec生成的图表载荷
delivery-package.json       finish核验后的正式/诊断/未验证文件清单
delivery-reply.md           与清单同状态的完整最终说明
draft/preview.png           内部原始诊断截图，不默认分享
draft/诊断草稿-未完成.png    带可见外框的诊断报告图
build-check.json            引用、构建及阅读阶段的实际结果
display-map.json            实际文字、数值及图表数据与核实记录的连接
layout-review/              全内容粗排的阅读图、展示绑定及其他检查
data.json                   事实/系列、单位、截止日期、来源与限定
design-brief.md             叙事、构图、保护区与视觉系统
layout-inspection.json      真实布局检查结果
acceptance.json             技术检查、PNG 人工验收及限制
fact-review.json            数值、标签、统计基准与来源的核对记录
workflow-timings.json       实际阶段时间、重试与未记录部分
preflight.json              环境检查与实际工具耗时
review/                     总览、DOM 局部截图、文字与图表数据、检查报告
assets/                     人物原图与派生素材、字体、图标，按需保存生图 prompt
charts/*.spec.json        存在完整图表时创建
```

`design-brief.md` 简短记录决策，不写成可见版面文案。保留来源于元数据；可见图中只放理解数值所需的单位、时间与口径，或用户要求的来源文字。

## 只在需要时读取

- 开始执行、环境失败、重复调用或生产耗时排查： [高效生产顺序](references/production-flow.md)。
- 人物姿态、版面密度、字体或图标选择： [构图与视觉系统](references/composition-and-style.md)。
- 荣誉仍是文字列表、缺少领域识别或不清楚符号如何表达事实： [领域图形](references/domain-graphics.md)。
- 需要局部图形或图表配置： [领域图形](references/domain-graphics.md)、[图表设计](references/chart-design.md)。按当前事实实现，数据、单位、字体覆盖与最终空间均在当前作品中复验。
- 需要对照完整层级与连续阅读： [视觉校准](references/quality-reference.md)。围绕当前素材与事实检查，不依赖包内范例。
- 柱图美观度、完整类别、坐标参照和交付尺度上的可读性： [图表设计](references/chart-design.md)。
- 缺少数据、口径冲突、人物素材或抠图边界问题： [数据与人物素材](references/data-and-assets.md)。
- 实际 alpha、不透明原图、抠图结果接收与裁边： [人物素材准备](references/subject-preparation.md)。
- 图表接入、字体加载、截图、布局修复与 manifest： [渲染与验收](references/render-and-acceptance.md)。
- 理解姚明/麦当娜的可复用决策，或检查新领域迁移是否变成套版： [实践与迁移](references/practice-notes.md)。

不要为了收集更多数字而扩大主题、为了填满画布发明事实、或为了复刻构图照搬参考图中的错误数据。人物主导、可读密度和整体统一要在同一张最终 PNG 上同时成立。
