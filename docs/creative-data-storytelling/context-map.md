# 创意数据叙事维护笔记

## 连续片段试作：结构与覆盖

保持“好的叙事编排 + 好的可视化设计”的主线。叙事说明为何接着看，表达选择说明怎样让证据可见；构图可以反过来修订叙事。默认路径是追问与相关参照 → inspect 读取短解释 → 确定自己的设计 → 按需借用代码与接入。

- `references/design.md` 联合组织叙事、表达选择、构图与阅读衔接；选择表用 ID 与关键过程定位连续片段和基础示例。跨示例的条件、取舍、U1–U6 与未覆盖关系保留在这里。
- 示例的具体理由、改编空间与代码入口在各自 HTML 的 `example-notes`；`inspect` 直接提取这部分说明，不要求先经过方法卡。相关过程可以整段借用、取局部或重新设计。
- `references/workflow.md` 保留一份设计稿；取用示例记 ID、沿用内容与必要改动，正文与全文承接仍须具体。
- `references/implementation.md` 负责接入与运行接口，不再另列一套表达或示例目录。运行依赖通常直接复制或导入，按当前阶段读取，不合并全部参考正文。

示例资源已按 `assets/examples/<id>/` 集中：`index.html` 是独立预览及装配，`scene.mjs` 是数据与动画，专用素材在 `images/`。总览只导航；原 `demo.mjs` 的整页装配已移除。目录用 `kind` 区分 15 个完整片段和 7 个局部机制，`inspect` 返回选中项的短解释、条件、改写位置与复制清单。解释只维护在 HTML，不在目录中复制一份；工具不输出装配及动画源码。局部控件样式共用 `mechanism.css`，控制与计算仍共用 `assets/runtime/`，不为每例复制运行模块或新建说明文档。

资源重组阶段只调整组织与直达路径，并给已有差值代码补齐最小预览。独立复制检查覆盖每例所需的脚本、样式与素材；实际浏览器检查覆盖全部独立入口、关键状态和完整片段的滚动衔接。当时未改正在运行的冻结包、未新增模型生成测试，不能据此判断首稿质量提高。局部变更与核验记录位于 `.cache/skill-dev/creative-data-storytelling/asset-reorganization-20261109/`。

当前十五个完整片段覆盖下列部分解释过程，尚不足以代表全部表达范围，也尚未证明能改善独立首稿质量。覆盖按数据关系判断，不按图表名称或题材凑数；同一片段可支持多个方法，方法也可组合。

| 关系 | 已有完整片段 | 仍有的指导与覆盖缺口 |
| --- | --- | --- |
| 时序变化与旧基准比较 | `time-history` | 已接通历史显露和基准回看；不代表所有时序故事 |
| 新记录加入与并行比较 | `record-comparison` | 条形共用零点与量值尺度，旧记录保留、并行记录一起加入；不是累计，未覆盖长列表 |
| 全景中识别并提取对象 | `overview-detail` | 已接通零基线条形比较；局部定位另有设计取舍和基础示例，整体到局部不绑定条形 |
| 素材识别与组成 | `material-composition` | 已接通类别图片、组成区间和参照；不是跨期累计示范 |
| 素材自身尺寸与共同尺度 | `material-height` | 原创矢量立面按可见端点校准高度，时序加入、连续换尺度与差距比较已示范；不代表面积、体积或任意图片均可如此编码 |
| 素材绑定走势、逐一比较参照 | `material-trend` | 静态 SVG 直接标记报价，时间推进后转同比并检验参照；非可加总的成本拆解 |
| 组成展开、增量接入累计 | `material-composition` / `increment-stock` | 组成区间及年度并列柱接成累计轨迹已示范；有移出和负项的净变化仍待覆盖 |
| 同批对象改用指标或比较基准 | `comparison-basis` / `material-trend` | 分母归一化、原价转同比已有完整解释；同容量／同条件筛选仍由作品数据层处理 |
| 序列中的先后、持续与呼应 | `sequence-recurrence` | 完整片段示范有依据的片段复现；`sequence/` 支持共同起点对齐。多主题和密集关系仍待覆盖 |
| 代表与群体、分类与构成 | `person-coverage` / `records-composition` | 前者用百分位示意，不是真实个体跟踪；后者从记录进入带权时期构成。其余分布、权重和重组仍可选 U1–U6 与 `units/` |
| 尺寸适配与功能后果 | `multi-constraint` / `object-fit` | 身体固定看不同约束；同尺度试放后比较样本。二维演示不模拟真实布料、厚度与三维空间 |
| 同量换单位、量级参照 | `unit-scale` | 秒／分／小时示范等分守恒、原份重复、连续缩放及进入独立记录比较；非等分与非线性几何需另设计 |
| 配对记录与去向比较 | `cohort-flow` | 两组共用终点、人数与带宽一致；仅为单段分流，多阶段留存仍未覆盖 |
| 关系与周期 | 暂无 | 选择表已有数据条件；需要独立合适材料再设计，不能用现有片段冒充覆盖 |

优先依据实际失败的关系补片段，不按题材或图表名称追求数量。维护与测试记录保留在 `.cache/skill-dev/creative-data-storytelling/recipe-pilot-20261109/`，不进入运行时流程。

首轮 iPhone／樱花未实际查询片段目录，尚不能据此判断片段支持是否有效。已将短目录查询移入构图步骤，并澄清主图接续局部比较、探索与资料索引的职责；保持原任务和数据复测，记录在 `.cache/skill-dev/creative-data-storytelling/recipe-route-20261109-a25bee/`。多个指导同时调整及单次首稿，不用于宣称因果或普遍提升。

后续按用户要求收紧设计文档，把三份通用设计指导归为 `design.md`，保留方法卡，并将三项短目录直接呈现。详细元数据仍维护在 `catalog.json`；增改片段时同步这份短入口。收紧期间仍运行此前的冻结包，没有中途改任务、数据或运行 skill。前后差异与核验记录在 `.cache/skill-dev/creative-data-storytelling/design-tightening-20261109-5ea2d2/`。

重组后独立复测已完成：iPhone 和樱花都读取了选中片段；iPhone 自行实现，樱花使用了 stage/scroll 等运行模块。前者对比表达更清楚，后者保留了控制器却丢失部分关键证据。读取与调用已发生，不能据此推断作品质量稳定提高。详见 `.cache/skill-dev/creative-data-storytelling/recipe-reorganized-20261109-c4f460/review-20261109.md`。

据此先小范围改写 `time-history`：记录、基准、单位、阅读端点集中配置，轴、端点、差值与正文绑定共用事实；基准线从旧端点延伸到当前端点。设计解释放在已有 HTML 文末，说明读者发现、构图和运动的职责、改写入口及适用条件，不另加规则文件。原例与另一组三段模拟数据已实际浏览器核验，并补充数据换域、端点身份、差值方向和中途返回的行为测试；这里只证明片段可以改写，尚未验证其对独立模型创作的影响。记录位于 `.cache/skill-dev/creative-data-storytelling/history-adaptation-20261109/`。

局部示例的改写整理（2026-11-10）：`units` 改为用完整字符串 ID 决定开场散开方向，显式配置面积系数；`amounts` 的原有量、分项、单位与精度集中，几何、轴和读数共用数据。其余示例将实际假设和改写位置放回现有 JS 文件头及 HTML 的 `#example-notes`，目录只保留入口，不要求通读所有示例。17 项针对行为与独立复制的测试通过，默认数据和替换数据已实际操作浏览器核验；未开展新一轮模型创作测试，不能推断首稿质量改善。变更前快照、仅本轮 diff 与检查记录在 `.cache/skill-dev/creative-data-storytelling/example-refinement-20261110/`。

完整片段补充（2026-11-10）：先补 `material-trend`、`comparison-basis`、`increment-stock`。三段分别从价格走势、比较分母、历史基底组织解释，取用机制与需重写的题材判断分别注明；沿用既有目录、方法卡和运行模块，没有增加通用流程文件。汉堡片段使用 The Economist / ABS 公开记录，采用年度同季观察的基期指数；与 ABC 原作的同比视图明确区分，原创静态 SVG 只编码系列身份。另两段明确使用模拟数据。局部验证只证明数据计算、按需装配与浏览器衔接成立；独立模型是否更会选择和改写，仍须另行测试。快照与本轮检查位于 `.cache/skill-dev/creative-data-storytelling/full-segments-20261110/`。

片段二次改写（2026-11-10）：根据实际阅读反馈，`material-trend` 从末端图片引线改为图像直接标记观测，恢复半年报价与季度 CPI、先经历时间再转同比；`increment-stock` 从两根累计柱改为年度并列柱同零点比较，再保持同批柱段、年份与数量接回累计轨迹。分别验证滞后期匹配、历史标记、换尺度及中间帧数量守恒；这属于示例改写，不能据此推断独立生成质量提高。本轮快照与核验在 `.cache/skill-dev/creative-data-storytelling/segment-redesign-20261110/`。

记录加入与序列呼应补充（2026-11-10）：新增两段解释过程，沿用现有目录与运行模块。尺片段采用已整理来源主张，保持记录独立及固定厘米映射；对白片段使用自写虚构材料，借鉴 Common Threads 的位置与呼应组织，不复制剧情或音频。模型读取入口、HTML 中的适用条件及改写位置同步；局部验证与变更记录位于 `.cache/skill-dev/creative-data-storytelling/record-sequence-20261110/`，不作为独立首稿改善证据。

高楼尺寸片段（2026-11-10）：新增 `material-height`，以五座高楼的竣工顺序提供加入动机，共用地面与建筑高度比例，保留旧对象并原位比较超越幅度。素材为原创简化 SVG，校准可见地面与建筑尖顶，不绘功能性天线。The Skyscraper Center 的 Completion 字段统一提供年份；这是选例，不是完整纪录史。沿用既有运行模块与短入口，原尺示例暂未替换。局部核验及范围 diff 位于 `.cache/skill-dev/creative-data-storytelling/material-height-20261110/`，尚未开展独立模型创作测试。

高楼尺度扩展（2026-11-10）：加入1889年的埃菲尔铁塔与1930年的克莱斯勒大厦，以0–400、0–600、0–900米三个视域演示同一地面上的连续缩放。`axisMax` 随阅读状态配置，轴、素材与标注共用当帧 `pose.scale`；先扩展范围再加入，反向先退出再收近，真实读数不随像素尺寸改变。埃菲尔铁塔采用官网300米主体，不含旗杆与后加天线；分类改为七座地标，不混作最高建筑排名。新增题材与范围属于示例验证，不作为独立首稿改进证据。本轮记录在 `.cache/skill-dev/creative-data-storytelling/material-height-zoom-20261110/`。

示例解释整理（2026-11-10）：九个完整片段在原有 `example-notes` 中收紧为叙事设计、可视化选择、改编空间与代码入口；七个局部机制仅解释所支持的关系和接法。说明链接到已有方法，目录摘要按追问与数据关系描述用途，题材、图形和推进顺序可重新设计。保留判断成立所需的证据与口径，不要求完整复现示例步骤。未改画面、数据或运行模块；此轮仅核对文档、目录和资源，不作为独立生成质量改进证据。范围快照与检查记录位于 `.cache/skill-dev/creative-data-storytelling/example-explanations-20261110/`。

示例读取交接（2026-11-10）：根据尺冻结测试只读摘要、未进入具体解释的证据，收紧为按关系选参照、先读已有短解释、再决定改编范围和代码接入。`inspect` 自动提取所选 HTML 的 `example-notes`，段落和链接随原文更新，不增加运行时说明文件。当前只验证工具和读取路径，尚不能证明模型会深入借鉴或首稿质量提高；本轮快照、差异与核验位于 `.cache/skill-dev/creative-data-storytelling/example-reading-handoff-20261110-hVahu6/`。

基准与倍数开篇（2026-11-10）：新增 `unit-scale`，以秒／分／小时演示认识基准、等分守恒、重复增加份额及进入独立记录比较。原一分钟持续可辨，视域先扩大再接续；时间带随后收拢成分钟参照、共同放大后比较模拟等候时长。沿用现有运行模块、短说明与读取路径，无新增工作流。纯计算检查覆盖守恒、尺度、替换数据与中断；实际浏览器检查覆盖四状态、中间帧、反向、退出、1280×720和1440×900布局。尚未做独立生成测试，不能据此宣称改善尺的首稿。范围快照及核验位于 `.cache/skill-dev/creative-data-storytelling/unit-scale-opening-20261110-7kI4xl/`。

示例读取减负（2026-11-10）：`list` 只列候选与追问；`inspect` 保留 HTML 中的设计解释、数据条件、改写入口及复制清单，省去重复过程摘要与绝对路径展开。自动生成所选 JS 的导出入口行号，帮助定位，仍需读所借过程的布局、过渡与绘制。全目录输出字节减少约62%，三个典型 inspect 输出减少约42%–51%；这些是工具输出大小，不是 token 或实际任务节省量。9项工具测试、独立安装及链接核验通过，示例画面与源码未改。尺与 iPhone 已沿用原任务、输入和 gpt-6-sol / xhigh 启动独立复测；不向作者指定示例或提供旧评审。此轮也包含此前未独立验证的示例补充，不能单独归因于目录精简。范围 diff、冻结包与记录位于 `.cache/skill-dev/creative-data-storytelling/example-context-20261110-v11dYH/`。

阅读路径整理（2026-11-10）：基线已提交为 `a36c380`。尺的首读虽被批量截断，但后来已补回选例要求，仍未进入具体示例；iPhone 则实际读取。此次只收紧五份指导文档的分工与默认改编路径，保留叙事到表达选择、U1–U6 及 A／B／C 推导；示例、运行模块与工具输出不变。未启动独立生成测试，不能判断漏读是否减少或作品质量是否改善。诊断在 `.cache/skill-dev/creative-data-storytelling/example-context-20261110-v11dYH/review-20261110.md`，本轮范围和核验在 `.cache/skill-dev/creative-data-storytelling/reading-route-tightening-20261110-LJa0Bi/`。

示例入口归位（2026-11-11）：移除 `expression-methods.md` 中间层及独立的连续片段目录。跨示例判断并入设计选择表，A／B 推导归 comparison／units，序列的具体推导归对应示例，C 的图像与金额分工归素材指导；未覆盖的 U5、汇总余量、关系、周期与流向保留指导。目录与 `inspect` 将 `method` 字段改为指向设计行的 `design`，说明与代码仍按需读取。示例数据、动画和运行模块未改；范围快照与验证记录在 `.cache/skill-dev/creative-data-storytelling/unified-example-route-20261111-gxRpIY/`。尚未启动独立生成测试，不能判断实际漏读或质量是否改善。

其余示例接入核查（2026-11-11）：检查剩余 15 个示例，仅改 6 个。`overview-detail` 开放标签区、行距与比较位置；`material-composition` 支持指定重点及只取组成片段，半数参照跟随重点起点；`material-trend` 仅在使用同比时要求同期分母，原值可独立取用；history、identity、difference 补齐传入配置的入口。沿用既有分层与短说明，未新增运行文件或工作流步骤。52 项相关行为和目录检查通过，桌面浏览器验证替换数据、局部取用、连接中间态、反向及默认完整片段；尚未验证独立 Agent 的耗时或首稿质量。审查、接入样本与增量 diff 位于 `.cache/skill-dev/creative-data-storytelling/example-adaptation-20261111-1794390850170/`。

示例与测试题材隔离（2026-11-11）：`record-comparison` 原先直接采用尺测试的朝代、量值与来源，现替换为七家虚构图书馆开馆时的每周开放时长。数值、身份、时期、对比与结论均重新设计；旧行让位、新记录显露、共同零点与原端点差值的机制不变，目录及图文绑定同步。高亮说明补入原可视化选择段：按当前追问选择新增项、比较双方或旧参照，关系已清楚时可不加。相关行为/目录测试和语法检查通过，桌面浏览器已检查逐步加入、反向、最终差值及退出。仅更新当前源 skill，旧冻结包和既有测试结果保持原样；后续尺测试应重新冻结，不把这次替换视为以往测试已无题材污染的证明。本轮增量 diff 与检查记录在 `.cache/skill-dev/creative-data-storytelling/record-theme-isolation-20261111-1794395270375/`。

五段解释片段接入（2026-11-12）：新增 `person-coverage`、`multi-constraint`、`object-fit`、`records-composition`、`cohort-flow`。沿用已评议的独立候选，口袋收尾改为两组适配比例，歌曲收尾在同一面积图中补齐两个时期的分类对照。每段保留独立预览、短解释和代码入口；仅共用预览控制、样式与绘图小函数，不连带读取其他段落。说明分别交代叙事、设计理由、改编空间及数据条件，目录与设计选择表直达各段，不新增方法卡或工作流规则。24 项几何、分母、流量与独立复制检查通过；实际 Chrome 检查全部阅读状态、中间态、反向与交互，1440×900 和 1280×800 首尾均复核。此轮验证示例自身及读取接入，未验证整篇滚动舞台或独立模型首稿效果。局部 diff 与浏览器证据在 `.cache/skill-dev/creative-data-storytelling/five-examples-integration-20261112/`。

示例改编与衔接修复（2026-11-12）：`cohort-flow` 将人数与组内比例分开，由同一统计结果生成正文、起点高度、终点读数和百分点差；`object-fit` 共用分组计数与分母，代表样本先缩小落位，其他样本后显出，反向依次收回。两段允许通过 mount 参数传入替换数据。歌曲图改明色带厚度的读法，五段目录简介补充关键动作，人物、轮廓与口袋加入素材检索入口。28 项定向测试通过，包含 80/100 人、20/19 个样本的实际 SVG 输出及回到群体的时序检查；Chrome 复核三段的全部状态、反向和中断、两个桌面尺寸、替换数据与关键中间帧。没有增加工作流规则或新示例，也未开展独立模型创作测试。只含本轮修复的 diff、替换数据副本与证据在 `.cache/skill-dev/creative-data-storytelling/example-reuse-fixes-20261112/`。

目录搜索与兜底（2026-11-12）：22 个示例用可选 `keywords` 收录中英文图形、叙事关系与素材别名，只用于内部检索，不随短目录或 inspect 输出。检索统一大小写、全角和连字符，英文按完整词匹配，多词仍需同时命中；无匹配时明确提示并返回完整短目录。保留形态区别，未将堆积面积图标为河流图。15 项目录、检索、源码隔离与独立复制测试通过；“流向 / Sankey”现命中分流示例，完整短目录仍为 5,559 字节。尚未验证独立模型选例或作品质量；增量 diff、查询结果和前轮兜底记录在 `.cache/skill-dev/creative-data-storytelling/catalog-keywords-20261112-1bJzMd/`。

## 参考作品

| 作品 | 值得回看的设计 | 来源 |
| --- | --- | --- |
| Hamilton · The Pudding | 作者把同一人连续唱出的几句合成一条记录，并标注反复出现的唱词。按角色分组能看出谁唱过同一句话，放回歌曲顺序则能读出前后两次的语境。 | [原作](https://pudding.cool/2017/03/hamilton/index.html) · [作者的设计过程](https://www.datasketch.es/project/an-interactive-visualization-of-every-line-in-hamilton) · [数据说明](https://github.com/sxywu/hamilton/blob/master/src/data/README.md) |
| A love story · The Pudding | 从一对伴侣的故事进入整群受访者，还可以点回一个人的经历。人物图标每个代表一名完成三轮调查的受访者，另绘的统计图才按调查权重计算。 | [原作与文末方法说明](https://pudding.cool/2026/06/love-story/) |
| Common Threads · The Pudding | 《Wicked》里同一个旋律动机在三个情节节点出现。弧线标出呼应的位置，读者可以试听，辨认旋律相同而歌词和处境发生变化的瞬间。 | [从 Unlimited 片段看起](https://pudding.cool/2025/12/motifs/#unlimited) |
| What's driving up burger prices? · ABC News | 先看汉堡价格，再换到同比涨幅，依次引入面包、奶酪、电力和牛肉。牛肉走势与汉堡背离，把读者从“成本涨了多少”带到“谁在决定售价”。 | [原作](https://www.abc.net.au/news/2024-08-05/cost-of-living-interest-rates-burgers/104156654) |
| Sizing chaos · The Pudding | 从一个腰围处于同龄人中位数的女孩讲起，再把不同品牌的尺码放在同一条腰围轴上。回看正文自然滚动、图形保留参照的段落。 | [原作](https://pudding.cool/2026/02/womens-sizing/) |

**转场美术参考。** Shopify Editions Winter ’26 的 Sidekick 段用不规则的纸边露出下一段。这里看的主要是插画的层次、画面边缘与滚动节奏。[Sidekick 段落](https://www.shopify.com/editions/winter2026#sidekick)
