# VisActor Skills

[English](README.md) | [简体中文](README.zh-CN.md)

面向 VisActor 可视化生态的 Agent Skills。通过可独立安装的 Skills 制作数据故事、杂志图文和人物志海报。VChart 和 VTable Skill 在各自的库仓库中维护。

## Skills

### 本仓库维护

| Skill | 能力 |
| --- | --- |
| [chart-storytelling](skills/chart-storytelling/SKILL.md) | 分析报告、业务简报与数据专题，结合图表滚动叙事与标注，输出 HTML 数据故事或 Web-PPT |
| [editorial-magazine](skills/editorial-magazine/SKILL.md) | 杂志风图文：新闻、生平、穿搭、旅行、时序故事与科普，导出 HTML / PNG |
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

**VisActor Skills 可在 Claude Code、Codex、WorkBuddy、豆包工作等支持 Agent Skills 的工具中使用。** 模型与工具执行能力由宿主 Agent 提供，你可以通过对话让 Agent 协助安装，也可以使用命令行或手动导入。

## 安装

### 推荐：让 Agent 协助安装

在你使用的 Agent 工具中新建对话，复制下面的提示词即可：

```text
请帮我安装 chart-storytelling Skill：
https://github.com/VisActor/skills/tree/main/skills/chart-storytelling

请获取完整 Skill 目录，包括 SKILL.md、参考资料、模板和脚本，
按当前客户端支持的方式安装，并检查安装后能否发现和调用。
如果有需要我完成的确认或导入步骤，请告诉我。
```

安装本仓库的其他 Skill 时，将提示词中的名称和 GitHub 地址末尾的 `chart-storytelling` 替换为上方“本仓库维护”列表中的 Skill 名称。例如，业务看板使用 [visactor-light-dashboard](https://github.com/VisActor/skills/tree/main/skills/visactor-light-dashboard)。安装完成后，新建任务并指定该 Skill 即可使用。

如果 Agent 无法访问 GitHub 或完成安装，可使用下面的手动导入方式。

### 命令行安装：Codex / Claude Code

在你准备使用 Skills 的项目目录中执行：

```bash
npx skills add VisActor/skills --skill chart-storytelling
npx skills add VisActor/skills --skill editorial-magazine
npx skills add VisActor/skills --skill life-chronicle
npx skills add VisActor/skills --skill person-poster
npx skills add VisActor/skills --skill visactor-light-dashboard
npx skills add VisActor/skills --skill visactor-map2d-dashboard
npx skills add VisActor/skills --skill visactor-chart-editor
npx skills add VisActor/skills --skill visactor-map3d-dashboard
```

如需图表和表格能力，从对应仓库安装：

```bash
npx skills add VisActor/VChart --skill vchart-development-assistant
npx skills add VisActor/VTable --skill vtable-development-assistant
```

如果之前安装了 `data-storytelling`，请移除该安装副本，再安装 `chart-storytelling`。

按照安装器提示选择 Codex 或 Claude Code。每个 Skill 都可以按需单独安装。更多安装选项见 [Skills CLI 说明](https://github.com/vercel-labs/skills#usage)。

### 手动导入：WorkBuddy / 豆包工作

在 [GitHub Releases](https://github.com/VisActor/skills/releases) 中选择最新的 `skills-v*` 正式版本，在 **Assets** 中下载所需 Skill 的 ZIP，例如 `chart-storytelling.zip` 或 `visactor-light-dashboard.zip`。每个 ZIP 对应一个完整 Skill；不要选整个仓库的 **Source code (zip)**，也不要只上传 `SKILL.md`。

这条安装路径不需要运行 `npx`。如果客户端要求选择文件夹，先将 ZIP 解压到同名文件夹，再选择直接包含 `SKILL.md` 的那一层，保留包内所有参考资料、模板和脚本。

#### WorkBuddy

1. 打开左侧 **专家·技能·连接器 → 技能**。
2. 点击 **添加技能 → 上传技能**，选择下载的单 Skill 包，按界面提示完成导入。
3. 在 **已安装** 中确认该 Skill 已启用，然后新建任务，指定 Skill 名称并提供数据。

入口说明见 [WorkBuddy 官方技能指南](https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Skills-Market)。

#### 豆包工作

1. 打开豆包工作的 **技能·连接器·伙伴**，进入技能管理页。
2. 使用本地技能导入入口（**上传技能**），按文件选择器要求选择 ZIP 或解压后的完整 Skill 文件夹，完成导入。
3. 新建工作任务，从技能选择入口选中该 Skill，或在需求中明确写出 Skill 名称，并提供任务数据。

豆包工作支持导入本地技能文件和在对话中指定技能，见[飞书官方功能介绍](https://www.feishu.cn/content/article/7677519271848610746)。不同客户端版本的入口名称可能有所变化，以当前界面为准。

导入后可以先发送：“请使用 chart-storytelling，读取它的 SKILL.md，确认配套脚本和模板可访问，并检查当前环境是否满足运行要求。”确认可用后再提交实际任务。需要更新时，从新的正式 Release 下载对应 Skill 包，通过客户端的技能管理入口更新安装副本。

### 运行要求

- 具备文件读写、命令执行及自身模型访问权限的宿主 Agent；命令行安装还需要 Node.js 和 npm。
- 浏览器和网络连接，用于预览生成的 HTML 并加载外部资源。

| Skill | 运行依赖 |
| --- | --- |
| chart-storytelling | Python 3.10+（标准库）和 Node.js（校验 JavaScript）；从 unpkg 加载固定版本的 VSeed、VChart、VTable 与 GSAP |
| editorial-magazine | Python 3.10+、其 [requirements.txt](skills/editorial-magazine/requirements.txt) 中的依赖，以及用于导出 PNG 的 Chromium/Chrome；字体从 CDN 加载，支持系统回退 |
| life-chronicle | Python 3.10+、其 [requirements.txt](skills/life-chronicle/requirements.txt) 中的依赖，以及用于导出 PNG 的 Chromium/Chrome；固定版本的 VInfo 与字体 CDN，详见[环境说明](skills/life-chronicle/references/environment.md) |
| person-poster | Python 3.10+、Pillow、Python Playwright/Chromium；公开 VChart 2.1.7 CDN 或有来源记录的同版本本地副本，见 [requirements.txt](skills/person-poster/scripts/requirements.txt) 和含 POSIX/PowerShell 安装及能力边界的[环境说明](skills/person-poster/references/environment.md) |

图片检索、生图与抠图使用宿主能力，素材要求以所选 Skill 为准。杂志模板中的占位素材需要在交付前替换。VChart/VTable Skill 的运行要求见各自仓库。

Person Poster 通过 `poster_workflow.py` 完成空画布初始化、来源重放、构建、布局检查和交付核验。正式交付需要展示绑定、来源数值比对及逐位图使用依据；阅读与对比检查基于实际页面，失败产物仅作为 `draft/` 中带标识的诊断图。旧 bundle 须迁移并重新验收，见[展示契约](skills/person-poster/references/display-bindings.md)、[证据说明](skills/person-poster/references/evidence-checks.md)和[渲染说明](skills/person-poster/references/render-and-acceptance.md)。工具检查不认证来源真伪、图片权利、视觉质量或宿主最终回复。

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

固定任务覆盖 chart-storytelling 与 person-poster；浏览器 smoke 覆盖故事 HTML/Web-PPT，以及人物海报的图表示例（含类别配色、标签边界及缺失值与真实零值区分）、带图表及无图表的 HTML-only 交付、无图表 PNG、祖先裁切拒绝与失败导出路径。密集海报图表用例明确预期600px阅读基线失败，仅验证API/导出行为，另有 Python 浏览器回归覆盖600px下的 DOM/图表文本。smoke 另覆盖受管理图表启动、展示绑定、未绑定文字、遮挡与粗排阅读失败。受限排版固定 Agent 任务检查失败处理；真实宿主结果单独记录，不代表已满足上架条件。editorial-magazine 和 life-chronicle 已有脚本回归，尚无固定任务或浏览器 smoke。任务完成后检查数据准确性、要求和实际交互，允许不同的正确视觉表达。Agent 任务不在 CI 中运行。

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
