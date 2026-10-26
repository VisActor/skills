# VisActor Skills

[English](README.md) | [简体中文](README.zh-CN.md)

面向 VisActor 可视化生态的 Agent Skills。通过可独立安装的 Skills 制作数据故事、杂志图文和人物志海报。VChart 和 VTable Skill 在各自的库仓库中维护。

## Skills

### 本仓库维护

| Skill | 能力 |
| --- | --- |
| [chart-storytelling](skills/chart-storytelling/SKILL.md) | 分析报告、业务简报与数据专题，结合图表滚动叙事与标注，输出 HTML 数据故事或 Web-PPT |
| [editorial-magazine](skills/editorial-magazine/SKILL.md) | 杂志图文：新闻、生平、穿搭、旅行、时序故事与科普，导出 HTML / PNG |
| [life-chronicle](skills/life-chronicle/SKILL.md) | 人物生平海报：照片墙、中心网格、照片环与可编辑时间线 |
| [person-poster](skills/person-poster/SKILL.md) | 人物主导的数据信息图，原生 VChart 图表、可编辑 HTML 与高清 PNG |
| [visactor-light-dashboard](skills/visactor-light-dashboard/SKILL.md) | 经营概览、指标监测与专题分析，支持筛选联动和进一步探索 |
| [visactor-map2d-dashboard](skills/visactor-map2d-dashboard/SKILL.md) | 二维地图看板，联动地域、指标、事件与明细 |
| [visactor-chart-editor](skills/visactor-chart-editor/SKILL.md) | 自助图表编辑器，支持字段拖拽、图型切换与实时数据探索 |
| [visactor-map3d-dashboard](skills/visactor-map3d-dashboard/SKILL.md) | 三维地球看板，分析地域差异并联动证据与记录 |

### VisActor 相关 Skills

图表与表格 Skill 在各自的库仓库中维护，可直接从源仓库安装：

| Skill | 能力 | 仓库 |
| --- | --- | --- |
| [VChart Skill](https://github.com/VisActor/VChart/blob/develop/skills/vchart-development-assistant/SKILL.md) | 图表生成、问题诊断、图片还原和 React 集成 | [VisActor/VChart](https://github.com/VisActor/VChart) |
| [VTable Skill](https://github.com/VisActor/VTable/blob/develop/skills/vtable-development-assistant/SKILL.md) | 明细表、透视表与透视图、交互和问题诊断 | [VisActor/VTable](https://github.com/VisActor/VTable) |

每个 Skill 都包含完整指令、本地参考资料、模板和脚本。无需额外安装 VisActor CLI、MCP 服务，也无需为 Skill 单独配置模型 Key 或访问 VisActor 托管 API。模型能力由宿主 Agent 提供。

**推荐直接在 Codex 或 Claude Code 中使用 Skills。** 模型访问与工具执行由你使用的 Agent 提供。其他兼容的 Agent 也可以尝试使用，目前不提供专门的接入说明。

## 安装

在你准备使用 Skills 的项目目录中执行：

```bash
npx skills add VisActor/skills --skill chart-storytelling
npx skills add VisActor/skills --skill editorial-magazine
npx skills add VisActor/skills --skill life-chronicle
npx skills add ./skills/visactor-light-dashboard
npx skills add ./skills/visactor-map2d-dashboard
npx skills add ./skills/visactor-chart-editor
npx skills add ./skills/visactor-map3d-dashboard
```

`person-poster` 可从包含该 Skill 的工作副本安装：`npx skills add ./skills/person-poster`。晋级到 `main` 后可使用默认分支命令 `npx skills add VisActor/skills --skill person-poster`；默认分支安装不依赖发布标签。

如需图表和表格能力，从对应仓库安装：

```bash
npx skills add VisActor/VChart --skill vchart-development-assistant
npx skills add VisActor/VTable --skill vtable-development-assistant
```

如果之前安装了 `data-storytelling`，请移除该安装副本，再安装 `chart-storytelling`。

按照安装器提示选择 Codex 或 Claude Code。每个 Skill 都可以按需单独安装。更多安装选项见 [Skills CLI 说明](https://github.com/vercel-labs/skills#usage)。

运行要求：

- Node.js 和 npm，用于安装；具备文件读写、命令执行及自身模型访问权限的宿主 Agent。
- 浏览器和网络连接，用于预览生成的 HTML 并加载外部资源。

| Skill | 运行依赖 |
| --- | --- |
| chart-storytelling | Python 3.10+（标准库）和 Node.js（校验 JavaScript）；从 unpkg 加载固定版本的 VSeed、VChart、VTable 与 GSAP |
| editorial-magazine | Python 3.10+、其 [requirements.txt](skills/editorial-magazine/requirements.txt) 中的依赖，以及用于导出 PNG 的 Chromium/Chrome；字体从 CDN 加载，支持系统回退 |
| life-chronicle | Python 3.10+、其 [requirements.txt](skills/life-chronicle/requirements.txt) 中的依赖，以及用于导出 PNG 的 Chromium/Chrome；固定版本的 VInfo 与字体 CDN，详见[环境说明](skills/life-chronicle/references/environment.md) |
| person-poster | Python 3.10+、Pillow、Python Playwright/Chromium；公开 VChart 2.1.7 CDN 或有来源记录的同版本本地副本，见 [requirements.txt](skills/person-poster/scripts/requirements.txt) 和含 POSIX/PowerShell 安装及能力边界的[环境说明](skills/person-poster/references/environment.md) |

图片检索、生图与抠图使用宿主能力，素材要求以所选 Skill 为准。杂志模板中的占位素材需要在交付前替换。VChart/VTable Skill 的运行要求见各自仓库。

## 使用

安装后，在 Agent 中指定所需 Skill，并提供你的数据。例如：

- “使用 chart-storytelling，向增长负责人解释这个 CSV 的留存变化，生成可分享的 HTML 故事。”
- “使用 editorial-magazine，把这篇文章及其来源整理成可编辑 HTML 和 PNG 杂志组图。”
- “使用 life-chronicle，根据这些有来源的事件和照片制作人物志海报，时间线文字需要可编辑。”

chart-storytelling 由当前 Agent 生成 VSeed 配置，再用本地脚本组装；不依赖托管图表生成服务。图片生成使用宿主能力，没有生图工具时采用计划声明的 fallback。Web-PPT 是浏览器演示稿，不是 `.pptx`。

生成的 JavaScript/HTML 是可执行代码。请在本地预览自己生成或已审查的产物；测试浏览器并不是用于执行任意不可信提交的安全沙箱。

## 案例展示

[案例目录](examples/README.md) 已收录 CO₂ 滚动故事、Las Vegas Web-PPT、6组杂志图文案例和4组人物志案例，包含提示词、图片或页面结果，以及输入与复现限制。

## 开发与维护

本节面向需要修改 Skills 或运行本地测试的贡献者。默认分支 `main` 提供面向用户的稳定版本；日常开发和贡献 PR 使用 `develop`，经过验证后通过 `develop` → `main` 的 PR 发布。请先阅读 [贡献指南](CONTRIBUTING.md)。

### 仓库结构

| 路径 | 内容 |
| --- | --- |
| `skills/<skill-name>/` | 可独立安装的运行内容：`SKILL.md`、参考资料、模板／资源与脚本 |
| `tests/<skill_name>/` | 按 Skill 组织的确定性 Python 回归测试；为兼容 Python 导入，连字符改为下划线 |
| `tests/test_*` | 共用工具与安装检查，以及 Node.js 浏览器／Story 集成测试 |
| `examples/<skill-name>/<case-name>/` | 面向用户的精选案例：提示词、输入、结果与预览 |
| `cases/<skill-name>/<case-name>/` | 固定 Agent 任务的提示词、输入与验收要点 |
| `tests/browser/cases/<skill-name>/<case-id>/` | 固定浏览器用例的配置、输入与验收标准 |
| `tests/browser/scripts/` | 浏览器 smoke 构建与检查；依赖固定在 `tests/browser/` |
| `.cache/skill-dev/<skill-name>/<run-name>/` | 已忽略的本地工作目录、产物、截图与日志 |
| `docs/` | 贡献者参考文档；`docs/migration/` 为历史迁移记录 |

每个运行时 Skill 都需要自包含，不依赖 `tests/`、`cases/`、`examples/` 或另一个 Skill 的本地目录。新增 Skill 与选择验证范围的约定见[贡献指南](CONTRIBUTING.md#adding-or-updating-a-skill)。

### 从本地仓库安装

在本地仓库根目录执行，安装当前工作副本中的 Skill：

```bash
npx skills add ./skills/chart-storytelling
npx skills add ./skills/editorial-magazine
npx skills add ./skills/life-chronicle
npx skills add ./skills/person-poster
```

也可以将 Skill 的完整目录复制到 Agent 的技能目录中，包括参考资料、模板和脚本，不要只复制 `SKILL.md`。Codex 和 Claude Code 的调试工作区准备方式见 [本地调试指南](docs/debugging.md)。修改 Skill 后，请先更新安装副本，再重新测试。

### 回归测试

Python 维护环境要求 Python 3.12+ 和 [uv](https://docs.astral.sh/uv/)：

```bash
uv sync --locked
uv run pytest tests -q
uv run ruff check skills tests
```

固定浏览器用例按 Skill 集中在 [tests/browser/cases/](tests/browser/cases/README.zh-CN.md)，每个用例的配置、输入和验收文件放在一起。按指南准备浏览器后，用 `uv run python tests/browser/scripts/smoke.py` 执行全部用例，也可通过 `--skill chart-storytelling` 或 `--case story-ppt` 单独选择。这些检查不调用模型。

### Skill 任务调试

使用 Codex、Claude Code 或其他兼容的成熟 Agent 执行[固定任务](cases/README.md)，也可以提供自己的提示词和输入。按[本地调试指南](docs/debugging.md)建立已忽略的 `.cache/skill-dev/<skill-name>/<run-name>/` 工作目录，保留产物、截图及可导出的日志。仓库不提供模型 API harness 或统一 Agent 执行器。

固定任务覆盖 chart-storytelling 与 person-poster；浏览器 smoke 覆盖故事 HTML/Web-PPT，以及人物海报的图表示例、带图表及无图表的 HTML-only 交付、无图表 PNG、祖先裁切拒绝与失败导出路径。person-poster 另已完成一次真实人物输入的同会话生成验证，不等同于独立盲测。editorial-magazine 和 life-chronicle 已有脚本回归，尚无固定任务或浏览器 smoke。任务完成后检查数据准确性、要求和实际交互，允许不同的正确视觉表达。Agent 任务不在 CI 中运行。

## 版本管理

本仓库维护的 Skills 按整个仓库统一管理版本，每次正式发布使用 Git tag 标识包含 Skill 指令、参考资料、模板和脚本的版本快照。VChart 和 VTable Skill 的版本由各自仓库管理。

日常修改通过 Git commit 标识，不需要每次调整 Skill 都创建发布 tag。

正式 Skills 版本使用 `skills-vMAJOR.MINOR.PATCH`：补丁版本用于兼容修复，次版本用于新增 Skill 或兼容能力，主版本用于移除、重命名或不兼容的使用方式调整。

默认安装跟随 `main`，因此可能在正式发版前获取到变化。发布意图写在 `.github/release-plan.json`：面向 main 的 PR 自动预检，合并一个发生变化且非空的版本计划后，等待 main CI 通过再自动发布。`version: null` 或版本未变化时不发版。发布后保留计划文件，不自动清空，后续合并不会因此重复发布。具体操作见[发布流程](CONTRIBUTING.md#publishing-skills)，已发布版本见 [Releases](https://github.com/VisActor/skills/releases)。

正式 Skills Release 附带 `skills-manifest.json` 和每个 Skill 的独立 ZIP。下游分发平台可通过清单里的内容指纹判断哪些 Skill 发生变化，无需让各 Skill 跟随仓库版本一起更新。具体格式见[发布产物接口](docs/release-artifacts.md)。

反馈问题或复现结果时，请记录发布 tag 或 commit SHA；分支内容会随开发变化。VTable `1.26.8` 等依赖版本表示底层库的版本，不是 Skill 的发布版本。历史 VMind SDK 的 tag 保持不变，仍归属于原 SDK。

## VMind 历史版本

原 VMind SDK 不再维护，其代码和文档仍可通过 [历史发布版本](https://github.com/VisActor/skills/releases) 获取。

[MIT 许可证](LICENSE)
