# 人物海报 Skill 迁移至原生 VChart 的实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> 执行约定：上述技能须实际可用才可调用；不可用时按本文件顺序执行并自查，不假定它们已安装。计划不要求并行代理，也不授权提交、推送或发布。

**Goal:** 将人物数据信息图能力迁入本仓库的 `skills/person-poster/`，直接使用公开的原生 VChart spec，保留可编辑 HTML、高清 PNG、人物素材处理及事实与视觉验收流程，消除对内部 VInfo 包及源码仓库的使用期和维护期依赖。

**Architecture:** 页面继续由 HTML/CSS 排版，完整系列直接由 VChart 渲染。原生 spec 文件是图表配置唯一来源，HTML 内嵌该文件内容并直接创建 VChart 实例；不增加自定义图表 DSL、Schema 转换 SDK 或跨 Skill 导入。静态检查负责产物连接与有限结构检查，浏览器和人工验收负责运行效果与可读性。

**Tech Stack:** HTML/CSS、原生 VChart `2.1.7`、Python `3.10+`（Skill 使用期）、Pillow、Python Playwright/Chromium；仓库维护环境沿用 Python `3.12+`、uv、pytest、ruff 和现有 Node Playwright 浏览器测试设施。

**状态：** 目标目录迁移已实施，本地验证记录见 [迁移结果](../../migration/person-poster.md)。原计划保留供追溯；详细步骤的复选框保留原始计划形式，不作为执行状态。任务标题及迁移结果记录实际完成状态和差异。用户最新要求源目录保持不动，取消原入口切换。

## 全局约束

- 用户已确定采用原生 VChart，随后授权在目标目录实施；源目录保持不动。
- 源目录：源仓库中的 `vinfo-person-poster/`。调查时源提交为 `543a4f2373b17d06a146bd388a8ba409f68368c3`，工作区无未提交变更；实施时重新核实。
- 目标仓库：`VisActor/skills`；下文相对路径均以此为根。
- 新名称、目录、frontmatter 和默认提示词统一为 `person-poster`，中文显示名保持“人物数据信息图”。
- 执行时遵循目标仓库 `AGENTS.md`：贡献分支从最新 `origin/develop` 建立，默认使用 `codex/` 前缀；不覆盖已有修改，不擅自提交或发布。
- 每个 Skill 单独复制后可运行；不依赖兄弟 Skill、维护目录、内部源码或预先安装的 VInfo 包。
- 固定公开运行时版本；默认 URL 为 `https://unpkg.com/@visactor/vchart@2.1.7/build/index.min.js`。必须在实施中验证该实际文件及 UMD 导出，不把文档地址视为网络验证结果。
- 仅制作人物海报；不迁移 Page Schema/VStory，也不增加 VSeed、VTable 或通用网页应用框架。
- 保留关系优先选图、真实人物素材、事实核对、简洁文案、统一视觉及实际 PNG 验收原则。
- 图表完整系列由 VChart 编码；不以 HTML 矩形重做柱图、饼图等来规避迁移。
- 不把旧 SDK 的全部特性包装成新的兼容层；明确记录不能直接保留的能力，不静默丢失。
- 测试、固定任务和报告放在 Skill 目录之外；不为 Markdown 段落、旧 SDK 类型快照或固定美学偏好编写锁定测试。
- 来源目录先保留，目标验收完成后再处理旧入口；不在本次迁移中删除内部 SDK 或修改其他 Skill。

## 已确认的依赖与范围

| 现状 | 迁移决定 |
| --- | --- |
| `chart-bridge.md` 引用内部 `@dp/vinfo-graphics@0.13.0` 并调用 `toVChartSpec` | 原生 spec 直接传入 VChart，删除转换调用和内部脚本 |
| VChart 使用旧 `2.0.23-alpha.0` 地址 | 对齐目标仓库已有的公开 `2.1.7`，重新渲染验证 |
| `validate_bundle.py` 要求同时存在 VChart 和 VInfo 脚本 | 只检查实际 VChart 依赖及产物引用，允许有来源记录的本地同版本副本 |
| `validate_poster_bundle.py` 绑定 VInfo JSON Schema | 替换为原生 spec 最小结构检查，明确不提供完整 VChart 类型验证 |
| `review_bundle.py` 读取 `charts[].schema` 并比较内嵌数据 | 全部统一为 `charts[].spec`，继续检查文件与内嵌 spec 一致 |
| 图表文档及类型快照由源仓库脚本生成 | 重写为精简原生参考，停止同步内部 SDK 类型 |
| 页面布局、素材准备、截图与事实校验已自包含 | 定向迁移，按实际接口调整，不重写整个生产系统 |

不包含：`life-chronicle` 的内部运行时替换、整个 skills 仓库去内部依赖、VInfo SDK 开源、历史海报批量升级、自动发布和修改用户已安装的 Skill。`life-chronicle/references/runtime.md` 中已发现内部包引用，作为独立后续事项记录。

## 文件职责与新产物契约

| 路径 | 操作与职责 |
| --- | --- |
| `skills/person-poster/SKILL.md`、`agents/openai.yaml` | 迁入并更新名称、边界、图表流程、交付格式 |
| `skills/person-poster/references/{chart-bridge,chart-design,charts,render-and-acceptance,manifest-contract}.md` | 重写原生 spec 接入、样式参考、就绪与产物说明 |
| `skills/person-poster/references/chart-types/*.md` | 替换 12 类 VInfo 参考；保留按信息关系检索的索引 |
| `skills/person-poster/references/chart-examples/{direct-column,reference-column,long-label-bar}.spec.json` | 原生 VChart 完整 JSON 示例，替换原 `.schema.json` |
| `skills/person-poster/scripts/{validate_bundle,validate_poster_bundle,review_bundle,preflight}.py` | 调整 spec、运行时及依赖检查 |
| `skills/person-poster/scripts/{export_html_png,inspect_html_layout,sync_manifest_dimensions,inspect_subject,prepare_subject}.py`、`macos_foreground.swift` | 保留生产职责，仅修正受迁移影响的接口和可移植性 |
| `skills/person-poster/scripts/requirements.txt` | 删除已无调用的 jsonschema，保留实际依赖 |
| `tests/person_poster/` | 行为回归、独立复制和产物连接测试 |
| `tests/browser/cases/person-poster/`、`tests/browser/scripts/person_poster_smoke.py` | 固定浏览器输入及构建适配，不进入 Skill |
| `tests/browser/scripts/{smoke.py,check-browser.mjs}` | 接入 poster engine，保留 story engine 行为 |
| `cases/person-poster/` | 固定 Agent 任务、公开输入及验收说明 |
| `docs/migration/person-poster.md`、`docs/migration/person-poster-provenance.json` | 迁移决策、来源清单、检查证据与限制 |
| `README.md`、`README.zh-CN.md`、测试/用例索引 | 同步安装、运行条件与真实覆盖情况 |

不迁入 `references/type-details/`、`chart-contract.schema.json`、`chart-contract-source.json`、旧 `resource-snapshot.json`，也不迁入源仓库的 SDK 契约生成脚本与资源同步脚本。其他说明文档逐项检查并保留有效原则。

新产物使用以下条目；`chartType` 作为旧 SDK 枚举不再保留，原生类型由 spec 决定：

```json
{
  "charts": [{
    "id": "career-series",
    "spec": "charts/career-series.spec.json",
    "mount": "[data-chart-id=\"career-series\"]"
  }],
  "dependencies": [{
    "url": "https://unpkg.com/@visactor/vchart@2.1.7/build/index.min.js",
    "version": "2.1.7"
  }]
}
```

- 保留 `window.__INFOGRAPHIC_CHARTS__`、`__INFOGRAPHIC_READY__`、`__INFOGRAPHIC_ERROR__` 的既有名称，前者现在存储原生 spec 映射。
- 新 Skill 只生成新格式；收到旧 bundle 时给出迁移说明，不能把旧 VInfo schema 直接解释为 VChart spec。
- JSON spec 是默认路径；分类映射、预计算标签优先通过数据字段表达，不对 JSON 字符串执行 `eval`。本次不引入可执行 spec 文件或回调序列化系统。
- 无图表作品允许 `charts: []` 和空 spec 映射，省略 VChart 脚本，仍等待图片和字体。
- VChart 可能修改传入对象；实例使用 spec 的深拷贝，原始内嵌 spec 保持不变以供一致性检查。

## 任务 1（已完成；差异见迁移结果）：固定迁移来源与独立包边界

**文件：** 创建 `skills/person-poster/`、`docs/migration/person-poster-provenance.json` 和 `docs/migration/person-poster.md`。

**输入：** 已核实的源目录及提交。**输出：** 可追溯的文件清单、移入目标的独立工作副本。

- [ ] 核对两仓库状态，记录源提交及逐文件 SHA-256；源目录如有新变更，更新记录，不覆盖用户修改。
- [ ] 在目标贡献分支中复制上述保留文件，排除缓存、输出、测试、内部生成快照；不操作全局安装目录。
- [ ] provenance 记录 `sourceCommit`、`sourceSkill`、`files`（每项含 `sourcePath`、`targetPath`、`sourceSha256`、`action`），不写机器绝对路径或内部访问凭据。
- [ ] 更新 Skill 名称和默认提示词。检查迁入代码与资源的现有许可、署名和可公开分发状态；明确限制只影响对应文件，不以“CDN 能访问”代替分发依据。
- [ ] 检查相对链接、本地 import、字体与素材引用；修复指向排除文件的入口。此时不宣称迁移完成或可用。

**验收：** 只修改目标迁移文件，来源可追溯，无隐藏的兄弟 Skill 导入；源目录保持原样。

## 任务 2（已完成；差异见迁移结果）：建立原生 spec 与运行时接入

**文件：** 三份 `.spec.json` 示例，`chart-bridge.md`、`manifest-contract.md`、`render-and-acceptance.md`、`chart-design.md`。

**输入：** 原有数据和图表设计策略。**输出：** 文件 → 内嵌原生 spec → VChart 的唯一生成路径。

- [ ] 验证公开固定版本 UMD 可加载、构造器和 `renderAsync()` 可用，将版本和网络结果写入迁移记录；失败时解决来源问题，不切回内部 CDN。
- [ ] 用以下最小原生 spec 验证普通柱图，再逐项改写直接读数、弱坐标参照及长标签横条三个示例，保留原合成数据及比较口径。

```json
{
  "type": "bar",
  "animation": false,
  "background": "transparent",
  "data": [{"id": "career", "values": [
    {"period": "A", "value": 9},
    {"period": "B", "value": 13}
  ]}],
  "xField": "period",
  "yField": "value"
}
```

- [ ] 将接入说明改为以下核心调用；外层维持现有字体、图片 decode 和错误传播逻辑。字体与图片完成后才创建图表，所有 `renderAsync()` 成功后才设置 ready。

```javascript
for (const [id, sourceSpec] of Object.entries(window.__INFOGRAPHIC_CHARTS__)) {
  const spec = structuredClone(sourceSpec);
  spec.animation = false;
  const mount = document.getElementById(`chart-${id}`);
  if (!mount || mount.clientWidth === 0 || mount.clientHeight === 0) {
    throw new Error(`Missing or empty chart mount: ${id}`);
  }
  const chart = new VChart.default(spec, { dom: mount });
  await chart.renderAsync();
}
```

- [ ] 从 `.spec.json` 文件生成内嵌映射，不手写两份；沿用 `<` 转义，补充包含分号、中文、引号和 `</script>` 的字符串验证，避免正则截断或关闭脚本标签。
- [ ] 保留截图稳定条件、字体覆盖检查、外层定位盒与内层图表 mount 分离。失败时 `ready` 保持 false，错误记录可供导出器读取。
- [ ] 迁移说明明确：旧 bundle 不自动兼容；需转换配置并重新渲染验证，而非改扩展名。

**验收：** 三个示例直接使用 VChart，无 VInfo 全局对象；文件和内嵌 spec 一致，字体/图片/图表未完成或失败时不报成功。

## 任务 3（已完成；差异见迁移结果）：改写图表知识与能力覆盖

**文件：** `references/chart-types/*.md`、`charts.md`、`chart-design.md`、`SKILL.md` 及其余受影响说明。

**输入：** 原有 12 类图表的语义与公开 VChart API。**输出：** 精简、可执行的原生配置指导；维护记录中的能力映射表。

| 原有关系/类型 | 原生配置方向与验收重点 |
| --- | --- |
| column / bar | `type: bar`，横向用 direction 与字段方向；验证基线、顺序、零值、极值及长标签 |
| grouped-column / grouped-bar | bar 多分类字段与 seriesField；验证每个分组、颜色和图例映射 |
| stacked-column / stacked-bar | bar 堆叠与 seriesField；验证合计、顺序、正负值；百分比口径仅按输入需求处理 |
| line / area | 原生 line / area；验证时间排序、不等间隔的轴语义及缺失数据 |
| pie | 原生 pie；验证组成分母、扇区与标签，圆环使用公开配置 |
| scatter | 原生 scatter；验证双数值轴与点数据映射 |
| treemap | 原生 treemap；验证层级输入、面积与标签 |
| waffle | 先用 VChart scatter/common 表达显式网格单元数据；验证单元数量、单位、余数和组别，不假设存在原生 `type: waffle` |

- [ ] 每类只保留信息关系、字段映射、必要配置和已验证示例；删除内部类型名称、SDK 默认行为和自动生成引用链。
- [ ] 重写字体、标签、轴、legend 和颜色配置，不能把 `customizedTheme`、`legend`、`categoryField/valueField` 等旧字段机械改名。
- [ ] 华夫图现有内部实现确实使用 common/scatter 与扩展标记。新实现只提供基于公开 API 的网格数据示例，不复制内部转换器，不创建通用华夫转换 SDK。
- [ ] 图标、纹理、排名装饰、自定义形状逐项列出“原生支持 / 当前 JSON 路线不覆盖 / 独立事实装饰”。独立装饰可由 HTML/SVG 承担，不能替代完整系列的数据图形。
- [ ] 若某类无法达到原信息表达，记录具体缺口和可用替代关系；该项不得标记为等价迁移，涉及删减原有图表类型时先与用户确认范围。
- [ ] 更新其余说明中的 schema、版本、文件名和字段引用，保留事实核对和视觉设计原则。

**验收：** 12 类关系均有明确去向；所有宣称可用的示例均进入实际浏览器验证。参考文件不是内部 SDK 的删名前缀版本。

## 任务 4（已完成；差异见迁移结果）：调整校验、review 与运行环境

**文件：** `scripts/{validate_bundle,validate_poster_bundle,review_bundle,preflight}.py`、`requirements.txt`、`tests/person_poster/{conftest,test_chart_specs,test_bundle,test_review}.py`。

**接口：** `validate_chart_spec(spec: object) -> list[str]` 取代旧 `validate_chart_config`；`validate_bundle(root: Path, *, require_png: bool = True) -> ValidationResult` 与 CLI 保留；manifest 路径读取统一为 `charts[].spec`，review 报告改为 `chartSpecMatches`。

- [ ] 先写行为回归并确认旧实现不能通过新契约。最小测试表达如下，测试加载器从 `skills/person-poster/scripts/` 加载模块，不从内部仓库导入。

```python
def test_native_spec_accepts_extension_fields(poster_validator):
    spec = {"type": "bar", "animation": False,
            "data": [{"id": "d", "values": [{"label": "A", "value": 9}]}],
            "xField": "label", "yField": "value",
            "bar": {"style": {"cornerRadius": 2}}}
    assert poster_validator.validate_chart_spec(spec) == []

def test_old_vinfo_schema_is_not_native_spec(poster_validator):
    assert poster_validator.validate_chart_spec({
        "chartType": "column", "categoryField": "label", "valueField": "value"
    })
```

- [ ] 最小检查只要求 JSON 对象、非空 `type`、本 Skill 约定的本地数据块与 `values` 数组、明确禁用动画；支持数据位于顶层或 series，允许 treemap 嵌套数据，不以旧 12 个枚举封死 VChart 类型。
- [ ] 不构建完整 VChart JSON Schema，也不以未知字段黑名单假装验证全部原生 API。字段含义、图表是否编码正确及标签可读性由示例测试和实际浏览器验收补足。
- [ ] 更新 bundle 连接检查：spec 文件存在且位于 bundle 内、ID 唯一、mount 对应、运行时来源记录、无图表分支。检查 `..` 和符号链接越界，不能仅检查绝对路径前缀。
- [ ] 删除对 VInfo 脚本的必需判断；同版本本地 VChart 副本不能因文件名不同而误判，使用实际 script 引用与 manifest dependency 路径对应关系。
- [ ] 更新 review 的 spec 比较与报告字段。比较未被 VChart 修改的原始映射；另在浏览器测试中核实实际传给实例的数据，不以“存在映射”证明已经渲染。
- [ ] 无残余调用后删除 jsonschema requirement、preflight 检查及环境说明；保留 Pillow、Python Playwright/Chromium 的真实探测。
- [ ] 补充有图表/无图表、缺运行时、缺 spec、重复 ID、内嵌不一致、异常字符串、旧格式提示、路径越界、动画未关闭的回归。不要把网络可达性加入纯 Python 单元测试。

```bash
uv run pytest tests/person_poster -q
uv run ruff check skills/person-poster/scripts tests/person_poster
```

**验收：** 新格式通过、缺失连接失败、旧格式明确报错；不会拒绝仅因含有合法原生扩展字段的 spec，不再依赖 jsonschema。

## 任务 5（已完成；差异见迁移结果）：独立安装与固定浏览器验证

**文件：** `tests/person_poster/test_portable_install.py`、`tests/browser/scripts/person_poster_smoke.py`、现有 smoke/check-browser 入口、`tests/test_smoke_runner.py`、浏览器用例与索引；按实际依赖需要更新 `pyproject.toml`、`uv.lock` 和 CI。

**输入：** 任务 2–4 的 Skill 副本。**输出：** 不依赖内部网络的可重复技术证据。

- [ ] 独立复制到带空格的临时目录，从另一工作目录执行脚本；覆盖 CLI 帮助、素材检查、pre-export 校验。测试不得靠源仓库或全局 Skill 补齐文件。
- [ ] 接入现有 browser runner 的 `poster` engine，新增 `build_poster(case: dict, workspace: Path) -> None` 适配，将 `inputs/bundle.json` 描述的平铺输入复制为产物目录。该函数仅存在于测试工具，不成为海报生成器。
- [ ] runner 增加 person-poster 的输入检查和分发；`check-browser.mjs` 增加 poster 分支。将现有“必须存在 canvas”检查移入有图表分支，确保无图表海报也可测试，保持 story 分支原验证。
- [ ] 维护三个用例目录：`poster-chart-matrix`（12 类关系和三个重点样式）、`poster-html-only`（纯事实海报）、`poster-render-failure`（缺运行时或渲染异常的负例）。各含 `config.json`、`expectations.json`、平铺 `inputs/`，预期失败需由测试显式断言，不能被记为成功成品。
- [ ] 使用目标现有 npm 固定版本资产做确定性 smoke，记录这是本地资产测试；另做一次真实公开 CDN 加载检查，分别记录结果。模拟阻断内部域名并检查请求列表中没有内部资源请求。
- [ ] 检查页面/资源错误、ready/error、实际构造的 spec、图表数及画布非空；检查关键柱值/排序、分组和堆叠对应关系，不能仅截图非空就通过。
- [ ] 验证源 spec 未因运行时修改；每张图表保存局部截图。无图表用例应成功导出且无 VChart 请求；失败用例 ready 不得为 true，导出进程必须非零退出。
- [ ] 在一个代表性 bundle 上实际运行 Python preflight、review、export 和 complete 校验。CI 如纳入此链路，需要把 Python Playwright 加入维护依赖并安装对应浏览器，不能假定 Node Playwright 安装已经满足 Python 版本。
- [ ] 检查 PNG 为 CSS 尺寸的 2 倍，并实际查看 600px 阅读宽度截图与主图局部，记录字体、长标签、零值和极值检查结果。

```bash
uv run pytest tests/person_poster tests/test_smoke_runner.py tests/test_portable_install.py -q
npm ci --prefix tests/browser --ignore-scripts
node tests/browser/node_modules/playwright/cli.js install chromium
uv run python tests/browser/scripts/smoke.py --skill person-poster
```

**验收：** 新旧 smoke 分支可分别运行；不存在“日志失败但 PNG 被当作完成”的路径。技术用例使用合成数据和图形，不宣称它们证明真实人物海报质量。

## 任务 6（已完成；差异见迁移结果）：固定人物任务、文档和迁移收尾

**文件：** `cases/person-poster/career-evidence/`、两份根 README、`cases/README.md`、浏览器双语索引及两份迁移记录。

- [ ] 新建一个固定任务：用户已给定的人物图片、可比系列和若干独立事实，要求人物轮廓与图表融为整体，输出 HTML/PNG。输入使用可公开分发的真实人物图片与有来源的数据，或明确的获授权插画任务；记录出处和输入 SHA-256。不要把内部历史产物直接当公开样例。
- [ ] `prompt.md` 与 `inputs/` 提供给执行 Agent；验收点留在 README 外部检查。用例必须检查人物身份/素材、统计范围、完整图表、阅读尺度与可编辑性，允许多种正确构图。
- [ ] 在 `.cache/skill-dev/person-poster/<run-name>/` 单独安装新 Skill 运行一次代表任务，记录版本/本地 diff、宿主、输入、产物、可取得日志及实际截图。不得加载旧 Skill 或内部包补救。
- [ ] 技术、事实、视觉三项分别记录结论；若素材或网络缺失，记录具体缺口，不宣称完整验收。只有实际查看通过的输出才考虑另行收录到 `examples/`。
- [ ] 更新 README 的功能、安装命令、运行要求与覆盖状态：`npx skills add VisActor/skills --skill person-poster`，发布前注明尚未在远端可安装，不让本地完成等同于公开发布。
- [ ] 完成 `docs/migration/person-poster.md`：能力映射、原生 spec 格式变化、旧 bundle 处理、验证命令/结果、视觉限制，以及独立的 life-chronicle 后续事项。
- [ ] 对 Skill 运行目录扫描内部依赖，命中项逐一解释或移除。扫描仅针对本次目录，不要求其他既有 Skill 在本次清零。

```bash
rg -n '@dp/|VInfoGraphics|toVChartSpec|sf-unpkg-src|unpkg\.byted-static|code\.byted|vinfo-person-poster|chart-contract|type-details' skills/person-poster
uv run ruff check skills tests .github/scripts
uv run pytest tests -q
node --test tests/test_browser_assets.mjs tests/test_browser_checks.mjs tests/test_story_vseed.cjs
uv run python tests/browser/scripts/smoke.py
git diff --check
```

- [ ] 运行目录扫描预期无旧接口/私有依赖残留；纯迁移历史留在 `docs/migration/`。只在新增修复或出现失败后重复相关验证。
- [ ] 仓库 release 打包从已提交 Git 树取文件。未获提交授权时只运行打包逻辑回归，不声称 HEAD 发布包已包含未提交 Skill；后续获授权提交后用现有 `.github/scripts/package_skills.py` 验证该精确提交。
- [ ] 目标通过后提出源入口切换：内部副本停止独立维护或改成指向公开上游的说明。删除旧目录和修改源同步脚本作为明确的收尾变更处理，未执行前不宣称已经完成“物理搬走”。

**验收：** 目标独立包、确定性测试、一次真实生成和文档互相一致；源目录仍可恢复原流程。提交、PR、发布及全局安装更新均需后续明确指令。

## 完成判定

- [x] `skills/person-poster/` 可独立安装，无内部包、内部 CDN、兄弟 Skill 和源码仓库依赖。
- [x] 所有图表从原生 `.spec.json` 直接渲染，未建立替代 DSL 或内部 SDK 兼容层。
- [x] 12 类原有图表关系的保留或限制已有实测记录，三种核心柱/条图样式通过。
- [x] spec 文件、manifest、内嵌映射、实际渲染和最终 PNG 对应；失败和无图表路径均有验证。
- [x] 代表性完整海报通过技术、事实和视觉三类验收，保留可编辑产物与证据。
- [x] 两份 README、用例索引、迁移记录与实际结果一致；既有 Skill 测试保持通过。

## 风险与应对

| 风险 | 应对 |
| --- | --- |
| 原生配置复杂度增加 | 精简关系索引、少量完整示例和当前图表截图复验，不重新发明简化 Schema |
| 移除内部默认样式后视觉退化 | 明确字体/轴/标签/颜色配置，先验证主图再嵌入整页，不要求历史像素一致 |
| JSON 无法表达某些函数回调 | 优先预计算数据字段；记录不覆盖特性，不偷偷 eval 或扩建配置协议 |
| VChart 会忽略部分错误字段 | 有限静态检查加实际 spec/数据核对与截图，不宣称静态完整类型安全 |
| 目标和源长期双维护 | 验收后确定公开目录为唯一维护源，源仓库切换单独完成 |
| 公共 CDN 在某环境不可达 | 明确失败或使用同版本、可追溯的本地副本；离线交付保留运行时文件 |

## 依据与计划自查

- 本地依据：源 Skill 入口、图表桥接/契约/校验/review 脚本、源 `src/converters/waffle.ts`；目标 `AGENTS.md`、浏览器 runner、`tests/browser/package.json` 与现有 CI。
- 公开依据：[VChart 2.1.7 发布记录](https://github.com/VisActor/VChart/releases/tag/v2.1.7)、[VChart 获取方式](https://visactor.io/vchart/guide/tutorial_docs/Basic/How_to_Get_VChart)。版本选择来自目标已有 pin，不自动追随 latest。
- 计划覆盖检查：名称/文件迁移 → 任务 1；原生接入 → 任务 2；能力与资料 → 任务 3；校验与依赖 → 任务 4；独立性及浏览器 → 任务 5；生成质量、文档与切换 → 任务 6。
- 本计划制定时未执行迁移；现已完成目标实现与本地验证，结果见迁移记录。此处记录提交准备前的实施状态；源目录保持不动，提交与 PR 由后续明确授权执行。
