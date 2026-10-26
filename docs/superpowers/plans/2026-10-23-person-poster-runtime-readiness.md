# Person Poster Runtime Readiness Implementation Plan

**Goal:** 准备可复现的跨平台安装与人物海报验证流程，保持独立 Skill 和现有输出契约。

**Architecture:** 延续现有 Python、Playwright 和原生 VChart 路线，补齐安装说明并统一可选安装入口的版本范围。实际宿主评测由成熟 Agent 执行；平台申请材料和原始证据留在本地忽略目录。

**Tech Stack:** Python 3.10+、Pillow >=10.0,<13、Playwright >=1.59,<2、Chromium、VChart 2.1.7。

## Global Constraints

- Skill 独立复制后可运行；不引入模型 API harness、宿主专用批量运行器或兄弟 Skill 依赖。
- 不以本机脚本回归替代其他操作系统或 Agent 的真实端到端结果。
- 保留已有用户文件；代码提交按用户授权执行，推送、发布和版本标签另按相应授权处理。
- 内部平台材料保存在 `.cache/skill-dev/person-poster/`，不进入公开文档。
- 根据用户已确认的准备顺序在当前会话执行，不新增代理任务；测试和代码只针对本次变更。

## Task 1: 安装与依赖声明

**Files:** `skills/person-poster/references/environment.md`（新增）；`references/render-and-acceptance.md`、`SKILL.md`、根目录两个 README（更新）。

- [x] 明确 POSIX shell 与 Windows PowerShell 的解释器、venv 路径和调用方式；不要求修改 PowerShell 执行策略。
- [x] 声明浏览器系统库、字体、网络、工作目录、外部图像服务和可选 Swift 的边界；不宣称未实测平台已支持。
- [x] 依赖缺失时优先复用已有环境，安装后使用同一解释器执行 preflight、review 和完整校验。
- [x] 检查新增文档引用存在，根 README 中英文入口一致。

## Task 2: 统一可选安装入口

**Files:** `skills/person-poster/scripts/export_html_png.py`、`inspect_html_layout.py`；新增 `tests/person_poster/test_installation.py`。

- [x] 在导出脚本定义共享常量 `DEFAULT_PLAYWRIGHT_PACKAGE = "playwright>=1.59,<2"`，布局脚本导入该常量作为默认参数。
- [x] 缺失依赖的诊断使用相同范围；保留用户显式指定 `--playwright-package` 的兼容行为。
- [x] 测试 mock 安装命令，不真实访问包源；验证同一解释器、版本范围、带空格路径和显式覆盖。
- [x] 运行 `uv run pytest tests/person_poster/test_installation.py tests/person_poster/test_person_poster_portability.py -q` 和 `uv run ruff check skills/person-poster/scripts tests/person_poster`。

## Task 3: 可执行的自测准备

- [x] 本地记录任务清单、环境矩阵、逐条 Query、前置条件、预期与未执行状态；生成给 Agent 的输入包时排除预期答案。
- [x] 用现有公开固定输入制作摄影与剪影两条首轮测试任务，记录文件校验值；剪影任务只证明此图片，不代表所有姿态。
- [x] 保留未提交 diff 与候选 Skill 副本。候选包标为本地测试包，不作为正式 Release 或市场版本。
- [x] 对候选副本执行本机 preflight，检查字体样本；记录 OS/CPU、依赖版本、完成项和未完成项。
- [ ] 在真实宿主核对安装入口和已有验证记录；没有版本、输出与会话证据的历史任务不能计为通过。

## Task 4: 上架材料交接

- [x] 整理自评报告草稿、申请表文案及仍需 Owner 决定的发布范围等事项，所有未实测结论明确为未执行。
- [ ] 完成材料后，再进行必要的外部安装／上传授权；正式提交以完整实测证据为前提。
