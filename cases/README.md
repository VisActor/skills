# 固定测试任务

这里保存可交给成熟 Agent 执行的固定提示词、输入数据和验收要点。使用 Codex、Claude Code 或支持加载 Skill 的其他 Agent 运行任务，再检查结果；仓库不提供模型 API harness 或统一任务执行器。

## 目录约定

```text
cases/<skill-name>/<case-name>/
  README.md      # 任务说明和验收要点，完成后供检查使用
  prompt.md      # 交给 Agent 的固定任务
  inputs/        # 完整输入
  fixtures.json  # 输入文件的来源说明和 SHA-256
```

每个用例独立携带输入；README 使用用例的语言，无需重复维护中英文版本。输入应为可公开使用或模拟的数据。`fixtures.json` 用于校验输入完整性，输入有意更新时同步更新校验值。

## chart-storytelling

| 用例 | 任务 |
| --- | --- |
| [story-retention-html](chart-storytelling/story-retention-html/README.md) | 订阅留存与分群差异的 HTML 故事 |
| [story-regional-scrolly](chart-storytelling/story-regional-scrolly/README.md) | 营收、利润率与主图联动的滚动故事 |
| [story-retention-deck](chart-storytelling/story-retention-deck/README.md) | 支持键盘翻页的留存 Web-PPT |
| [story-supply-assets](chart-storytelling/story-supply-assets/README.md) | 供应链风险分析与 SVG 素材引用 |
| [story-vegas-feature](chart-storytelling/story-vegas-feature/README.md) | 模拟赛事经营专题与图片降级处理 |

## person-poster

| 用例 | 任务 |
| --- | --- |
| [locked-layout-delivery](person-poster/locked-layout-delivery/README.md) | 锁定文字/字号/画布的已有海报，验证阅读失败时的交付说明 |
| [career-evidence](person-poster/career-evidence/README.md) | 玛丽·居里真实肖像与诺贝尔奖份额，原生图表、HTML 和 PNG |

editorial-magazine 和 life-chronicle 暂无固定任务；可提供自己的提示词和素材调试。

## 执行和验收

按[本地调试指南](../docs/debugging.md)建立 `.cache/skill-dev/<skill-name>/<run-name>/` 工作目录，安装待测 Skill，只将 `prompt.md` 和 `inputs/` 复制给 Agent。验收说明和校验清单留在仓库中，完成后再检查。

记录 Skill commit 或本地修改、Agent/模型、提示词、输入、最终文件，以及能够导出的会话/工具日志和截图。无法导出的日志注明缺失；不要声称存在完整执行记录。检查数据与口径、任务要求、渲染和实际交互，允许多种正确的叙事与设计。

固定任务不在 CI 中调用模型。脚本回归与固定浏览器检查在 [tests/](../tests/)，精选效果展示在 [examples/](../examples/README.md)。
