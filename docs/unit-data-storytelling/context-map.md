# 单元数据叙事：维护上下文

供继续开发、复盘和评估此 Skill 时读取。普通创作任务从 [SKILL.md](../../skills/unit-data-storytelling/SKILL.md) 进入；运行时不引用本文件，本文件也不进入 Skill 安装包。

## 当前维护入口

- 运行时：`skills/unit-data-storytelling/`，后续修改以本仓库为准。
- 机制与维护工具回归：`tests/unit_data_storytelling/`；独立安装检查：`tests/test_portable_install.py`。
- 实验、首稿、截图和过程记录：`.cache/skill-dev/unit-data-storytelling/`，不提交。
- 固定任务：[NBA](../../cases/unit-data-storytelling/nba/README.md)、[香港夏天](../../cases/unit-data-storytelling/hong-kong-summer/README.md)、[航班延误](../../cases/unit-data-storytelling/flight-delays/README.md)；[中国人口](../../cases/unit-data-storytelling/china-population/README.md)保留输入，暂停复测。仅提供 `prompt.md` 与 `inputs/`，不提供案例 README 或作品。
- [公开作品](../../examples/README.md#unit-data-storytelling)：完整的香港与 NBA 故事，以及 NBA 开篇、PF 比较两段试作。用于设计参考，不等同于当前 Skill 的独立首稿；运行时不引用这些成品。

## 已确定的方向与取舍

1. **好的作品 = 好的叙事编排 + 好的可视化设计。** 两者共同推演：叙事追问、数据关系、构图和衔接应相互支持。不要把叙事退化为若干独立图表旁的结论。
2. **核心数据叙事以连续演进的全出血舞台为主。** 保持有用的对象与参照，让展开、比较、重组和视角变化能被看见；换场依据是解释关系，不是章节编号。舞台优先也不意味着强塞所有内容到同一容器。
3. **聚焦有明确含义的单元。** 区分真实记录、固定量单元与装饰粒子；运动不能虚构跨期身份。必要的常规趋势和汇总图可辅助解释，设计范围不由演示选项限定。
4. **开篇先建立主题感与阅读动机。** 简洁、有辨识度，再接第一项证据；不让读者一开始理解复杂编码。点阵标志只是可选方法，并非必须重复的开篇。
5. **衔接要把关系演出来。** 既看完整构图，也看中途对象、轴、正文、标签的交接；避免全部隐藏后再出现。有解释意义的画面可以停留，连接过程自动完成。保留有效历史和参照不等于始终堆满全部数据。
6. **减轻创作者的机械工作。** 叙事和单元表达是设计主干，其余参考按需读取；模块优先看接口，遇到接线或扩展问题再查对应源码。冻结输入、校验和归档由维护者负责，不要求创作者重复做一套流程。
7. **复盘不直接变成更多规则。** 先区分指导缺失、指导模糊、执行未采用、实现问题和材料限制。修复应覆盖一类关系，避免写成某个题材的固定顺序、布局或动画预设。

## 文件职责

| 文件 | 负责什么 |
| --- | --- |
| [SKILL.md](../../skills/unit-data-storytelling/SKILL.md) | 定位、作品／章节／舞台／阅读状态、入口和工作流程 |
| [narrative-design.md](../../skills/unit-data-storytelling/references/narrative-design.md) | 选择发现、组织追问与证据、开篇、叙事顺序、舞台边界、收束与探索 |
| [unit-visualization.md](../../skills/unit-data-storytelling/references/unit-visualization.md) | 单元含义、编码、空间组织、前后数据关系与运动选择 |
| [material-direction.md](../../skills/unit-data-storytelling/references/material-direction.md) | 素材职责、来源、形式、批量一致性及单元呈现 |
| [visual-style.md](../../skills/unit-data-storytelling/references/visual-style.md) | 中英文层级、已有字体选择、数字、配色、间距与实际可读性 |
| [implementation.md](../../skills/unit-data-storytelling/references/implementation.md) | 可调用接口、状态与画面交接、实现难点索引、合并检查 |
| [assets/mechanics/](../../skills/unit-data-storytelling/assets/mechanics/) | 可组合的布局、运动、滚动、舞台、SVG、格式化和边界诊断模块 |
| [assets/examples/](../../skills/unit-data-storytelling/assets/examples/) | 合成数据的构图与滚动接线示例；具体布局和路径属于示例，不是作品模板 |

设计原则留在对应参考页，实现接口留在 implementation；此页只保留维护决定和证据索引，不再复制完整规则。

## 最近状态与证据边界

截至 2026-10-29：

- 已加入 `createStage`、`createValueFormat` 和标准库预览工具，承担常见接线、格式化与交付工作；已有历史浏览器检查，但这不证明独立作品质量会自动提高。
- 已加入可选 `bounds.mjs`：测量 HTML／SVG 的可见矩形或显式提供的 Canvas 边界，只检查声明的包含／分离关系。不负责排版或美感评分，不扫描全部粒子；不可测对象保持跳过。
- 新目录的 94 项 Node 机制测试和 18 项针对性 Python 测试通过，独立打包后模块测试和两处示例入口的资源审计通过。作品迁入另外检查输入哈希、本地资源和实际浏览器画面；不是重新完成一轮独立质量评测。
- 历史香港、NBA 的人工指导版本说明连贯编排和有表现力的衔接能够实现，但它们不是独立首稿能力的证明。多轮独立测试的质量并未稳定提升，不能把规则增加、文件读得更多或代码检查通过当作成功指标。
- 最近航班复测显示部分减负措施被采用；整体耗时和图文解释仍有改进空间。单次复测同时改变了指导与交付方式，不能据此归因于某一项修改。

## 继续迭代时关注

- 核心差异、增量或关系是否真正由构图呈现，而不只是正文与数字告诉读者结论。
- 关键转换是否保留能比较的证据，图形、标定和辅助元素是否在同一解释过程中交接。
- 实现支持是否让创作者更容易完成整段解释；避免为一个失败继续叠加阅读要求、演示或检查。
- 比较独立首稿与人工优化版本时，注明上下文和反馈差异。复测保留原首稿，用冻结的任务、数据和 Skill，评审答案不交给创作者。

检查入口见 [CONTRIBUTING.md](../../CONTRIBUTING.md#select-checks-by-scope)。按变更范围选择检查；文档整理不需要重新生成完整故事或运行全仓库测试。

可选维护工具 [run_tools.py](../../tests/unit_data_storytelling/run_tools.py) 的 `prepare`、`verify`、`archive` 用于冻结输入、完整性检查和保存首稿；它不调用模型。输入采用 `prompt.md` 与 `inputs/`，输出包包含 `TASK.md`、`inputs/`、`skill/`；校验凭据和评审资料放在创作者工作区之外。各子命令的参数通过 `--help` 查阅。

## 历史记录

完整旧上下文已保存在本地 `.cache/skill-dev/unit-data-storytelling/history/context-map.original.md`；同目录 `index.json` 记录原位置和哈希。历史作品与会话线索保留在该索引中，原目录不删。精选输入与作品已分别收录于 `cases/` 和 `examples/`，其复制清单与验证证据留在本地 `.cache/skill-dev/unit-data-storytelling/case-showcase-migration-20261029/`。

该历史副本不随公开仓库分发；在没有本地历史的环境中，使用本页的当前决定和可核验测试，不把旧路径、版本号、端口或当时的“下一步”当作现状。未来复盘只更新当前结论和必要索引，详细运行记录继续放在本地实验目录。
