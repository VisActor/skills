# 单元数据叙事：维护交接

[SKILL.md](../../skills/unit-data-storytelling/SKILL.md) 是创作入口，列有完整流程和参考文件。这页记录维护指导时应保留的取舍，以及判断一次改动是否有效的依据。

## 设计取舍

- **把叙事追问和画面证据放在一起。** 从“这一组有多少人”讲到“这些人贡献了多少”时，要让读者看见同一批记录从按人计数变为按贡献量比较。这类问题要一起看[叙事编排](../../skills/unit-data-storytelling/references/narrative-design.md)和[单元设计](../../skills/unit-data-storytelling/references/unit-visualization.md)。
- **核心段落以连续的全出血舞台为主，让读者能沿着已有证据往下看。** 同一批记录重新分组时，可以跟随原来的单元；两批记录没有个体对应关系时，用共同尺度承接比较。开篇可以先让读者认识主题，分析转向另一个问题时也可以换场。
- **实现参考按操作取用。** 确定要提取、重排或汇总后，再从[实现参考](../../skills/unit-data-storytelling/references/implementation.md)找相应片段。示例演示怎样实现这一步，作品的素材、布局和运动路径由作者根据数据选择。

## 复测时关注什么

香港夏夜和 NBA 的人工调整版可供对照设计效果。独立首稿需要单独评估。以往 NBA 和航班首稿里，即使作者读过相关示例，仍出现过图例先于图形换义、读者看不出哪些记录构成汇总的问题。回看转换中途，检查正文指向的对象、图形和标注此时是否说的是同一件事。

把示例拆成较短的片段后，复测中作者读到的示例源码变少了，但用时和首稿质量尚未表现出稳定改善。比较版本时，保留首次交付，记下使用的模型、输入版本，以及作者是否看过成品或收到过反馈。

## 维护入口

- **独立复作**：从[公开示例](../../examples/README.md#unit-data-storytelling)取所选作品的 `prompt.md` 和 `inputs/`，随待测 Skill 提供给创作者，完成后再对照成品。
- **保留可核验的首稿**：维护者可用 [run_tools.py](../../tests/unit_data_storytelling/run_tools.py) 的 `prepare` 生成输入包并在包外保存 `--receipt` 指定的凭据，再用 `verify` 核验、`archive` 归档。保留工具生成的完整输入包，各子命令的参数见 `--help`。
- **验证和留档**：根据[贡献指南](../../CONTRIBUTING.md#select-checks-by-scope)选择检查。逐轮记录、截图和耗时按[本地调试指南](../debugging.md#iterate-and-keep-evidence)保存。
