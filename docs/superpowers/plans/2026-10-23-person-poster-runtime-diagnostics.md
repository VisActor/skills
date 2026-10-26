# Person Poster Runtime Diagnostics Implementation Plan

**Goal:** 缩短驱动启动与可选 Swift 参数兼容故障的诊断路径，保持探针无安装、无宿主修改的边界。

**Architecture:** 延续已授权的上架准备与失败修复任务。preflight 区分依赖导入、驱动启动、浏览器启动和字体检查；仅驱动启动失败时通过公开的 Python Playwright CLI 收集有界诊断。恢复使用任务内独立环境。Swift 适配器接受常规参数和宿主转发的 `--` 后两个参数，其余图像处理及保护条件不变。

**Tech Stack:** Python 3.10+、Playwright >=1.59,<2、Pillow >=10,<13；可选 macOS 14+ / Swift。

## 范围与取舍

- 不复制宿主内部包、不构造全局缓存软链接、不硬编码用户路径或宿主版本；这些操作使修复依赖某台机器。
- 不自动安装；诊断失败报告包含失败阶段、CLI 退出码及有界输出，不收集环境变量或凭据。
- 保留正常 preflight 成功路径，新增 CLI 诊断仅在驱动启动异常时运行，最长等待 15 秒。
- 不把宿主驱动故障声称为已修复：代码修复的是错误分类和恢复流程；真实宿主的新候选复验仍必需。
- 不新增图表或布局规则：现有规则已经要求查类型示例、真实渲染与修复；当前失败已被 review 捕获并修复。
- 测试位于 tests/person_poster；宿主证据和新候选放在新的忽略实验目录，不覆盖首轮证据。
- 代码提交按用户授权执行，推送和发布另按相应授权处理；不修改用户原有 ZIP。评测隔离是独立任务，不通过删除其他技能解决。

## Task 1：探针分阶段诊断

Files: scripts/preflight.py；tests/person_poster/test_preflight.py。

- [x] 测试驱动启动失败与浏览器缺失被分到不同阶段；依赖导入失败不调用 CLI。
- [x] 实现 probe_driver()：使用同一 sys.executable 执行 `-m playwright --version`；capture_output、UTF-8 replacement、timeout=15；限制输出长度并保留真实退出码。无 shell、安装或环境修改。
- [x] 失败记录 failureStage；驱动问题指向独立环境恢复，浏览器问题指向该解释器的 Chromium 安装，字体问题不误报驱动缺失。
- [x] 测试 CLI 非零退出、超时、路径含空格及异常输出；运行真实成功探针检查无回退开销。

## Task 2：Swift 参数兼容

Files: scripts/macos_foreground.swift；tests/person_poster/test_macos_foreground.py。

- [x] 在实际 Swift 编译的适配器上验证常规参数与 `--` 参数，不调用 Vision：均应走到输入图片校验。
- [x] 解析参数分隔符后恰好两个位置参数；错误数量仍失败。保留 macOS 版本、非空输出目录和 EXIF 方向保护。
- [x] 非空目录回归确认已有标记文件不变；无 macOS / Swift 的环境明确 skip，不冒充跨平台通过。

## Task 3：恢复说明与验证

Files: references/environment.md；references/subject-preparation.md。

- [x] 记录驱动与浏览器错误的不同恢复路线；任务内 venv 失败时报告宿主阻塞，禁止反复修补私有路径。
- [x] 可选 Swift 的标准调用、分隔符与动态库加载失败边界；保留完整日志及真实退出码，不用管道最后一项判断运行成功。
- [x] `uv run pytest tests/person_poster -m 'not poster_browser' -q`。
- [x] `uv run ruff check skills/person-poster/scripts tests/person_poster` 与 `git diff --check`。
- [x] 新实验目录内运行实际 preflight，生成新候选和摘要；不得沿用旧候选的实测通过结论。
