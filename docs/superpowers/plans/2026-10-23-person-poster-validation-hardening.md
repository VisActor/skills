# Person Poster 验收与尺寸同步优化计划

> 执行方式：按任务在当前会话逐项实施、测试和复核；无需额外子代理或未安装的执行技能。本计划已获用户授权并执行，结果见文末执行记录。未经用户要求，不提交、不推送、不发布。

**Goal:** 修复人物海报验收的祖先容器裁切漏检、HTML-only 交付被强制要求 PNG、尺寸同步重复增高三个已复现缺陷。

**Architecture:** 保持现有独立 Skill、Python 检查脚本和浏览器 smoke 结构。由 manifest 明确交付模式，布局检查提供实际几何证据，尺寸同步仅根据内容边界计算必要尺寸；回归分别验证错误能被拦截和正常产物不被误拒绝。

**Tech Stack:** Python 3.10+、Pillow、Python Playwright/Chromium、pytest、ruff；沿用现有 Node.js 浏览器 smoke 和 VChart 2.1.7。

## 全局约束

- 运行文件只依赖 `skills/person-poster/` 内部文件，不导入兄弟 Skill 或维护目录。
- 测试放在 `tests/person_poster/`，浏览器固定输入放在 `tests/browser/cases/person-poster/<case>/inputs/`。
- 不增加运行依赖，不更换图表库，不修改人物素材处理与视觉构图流程。
- 保留现有工作区改动。后续若创建贡献分支，从最新 `origin/develop` 开始，并先安全保留当前未提交成果；计划阶段不切换分支。
- Python 测试使用 `uv run pytest`，Python 静态检查使用 `uv run ruff check`。
- 不把测试用例名称、人物身份、固定文本或 fixture 路径写入运行规则。
- 默认交付仍为 HTML + PNG；静态、事实和视觉验收继续分别记录。
- 测试证据放在本任务新建的 `.cache/skill-dev/person-poster/<run-name>/`，保留 Skill 快照、日志、截图和 notes.md。
- 不自动提交，不创建发布版本记录，不改 release plan。

## 已确认事实与方案选择

基线为 `5dde1ab` 及当前未提交的 person-poster 新增内容。审查证据保存在 `.cache/skill-dev/person-poster/review-20261023/`，执行前检查工作区是否又有变化。

已复现：

1. 600×400 根节点内，一个 100px 宽、`overflow:hidden` 的父容器包住 400px 宽的必需文字，数字不可见，但 `review_bundle.py` 返回 `technicalPassed: true`。
2. 省略 manifest.png 时，pre-export 和 complete 均返回 `Missing or invalid manifest field: png`。当前名为 HTML-only 的 smoke 实际验证的是“无图表且仍导出 PNG”。
3. 内容不变，按默认参数连续测量并同步根节点高度，得到 400 → 416 → 432 → 448px。

选择“针对性实现 + 明确契约 + 失败回归”。仅修改三个条件判断不足以消除交付歧义；统一重写全部生产脚本没有必要，也会增加迁移风险。

## 设计与兼容决策

### 1. 祖先容器裁切

在现有 required 元素循环中保留自身溢出和根边界检查，补充从父元素到根节点的逐轴裁切检查。

- 对计算样式为 `hidden`、`clip`、`auto`、`scroll` 的轴检查祖先实际可见区域；静态 PNG 不会通过滚动容器补全内容。
- 使用祖先 client box，正确计入边框与滚动条；普通平移和轴对齐缩放要映射到 viewport 坐标。
- 复用 `overflowTolerance`，在相应轴超过容差才报错。`overflow:visible` 不因子元素超出父框而报错。
- 错误应定位必需元素、裁切祖先和轴，不能只返回笼统的布局失败。
- 不通过修改 CSS、去掉 `data-required` 或增大 manifest 消除报错。
- 旋转、skew、clip-path、mask 和 canvas 内部文字不在本轮精确检测范围；对遇到的复杂裁切明确记录检测限制，视觉验收仍必需。不声称支持任意 CSS 遮挡检测。

### 2. HTML-only 与 PNG 交付

新增 manifest 可选字段 `delivery`，值为 `html` 或 `html+png`，缺省为 `html+png`，非法值直接报错。

| delivery | phase | PNG 字段和文件 |
| --- | --- | --- |
| 缺省 / html+png | pre-export | 字段必须有效；允许文件尚未存在 |
| 缺省 / html+png | complete | 字段有效且文件存在 |
| html | pre-export / complete | 字段可省略；若提供则检查路径合法性，不要求文件存在 |

不根据 PNG 缺失自动推断 HTML-only，否则损坏的默认产物会被误放行。`delivery` 与是否存在图表独立：HTML-only 同样可以包含 VChart。

保留 `validate_bundle(root, *, require_png=True)` 调用方式。参数继续表达是否处于最终检查阶段；实际 PNG 要求由阶段与 delivery 共同决定。review 仍执行 pre-export，最终 HTML-only 验收仍运行 complete。

### 3. 尺寸同步幂等

尺寸以 CSS 像素记录，内容 bottom 先减去 root.top，避免页面外边距影响目标高度。默认同步只扩展；显式 `--trim-blank-tail` 才允许缩短。

建议计算规则：

```python
extra = max(0, bottom_safe_px) or max(0, height_slack_px)
content_target = max(
    item['rect']['bottom'] - root['top']
    + max(extra, item.get('bottomSafePx', 0))
    for item in measured_items
)
target = math.ceil(max(root['height'], root['scrollHeight'], content_target))
```

布局报告为 required 元素记录实际使用的 `bottomSafePx`，decorative 元素记 0；同步脚本消费同一证据，避免检查要求 64/96px、修复只留 16px 的循环。旧报告缺少该字段时仍按 CLI 余量计算。

- 没有可用内容项时，默认取已测根节点高度与 scrollHeight 的较大值，不额外加余量，并返回缺少内容测量的提示。
- trim 缺少内容测量时拒绝裁短；满足阈值时使用相对内容底边及安全距离。缩短后必须重新测量，第二次应不再变化。
- 只因根节点有溢出，不能删除父容器的裁切样式；本轮不扩大 CSS 改写器能力。支持的根节点尺寸写法必须有浏览器回归。
- 对无法实际更新的 CSS 写法，不报告已成功同步 HTML；说明限制并要求人工调整后重测。

## Task 1：拦截祖先容器造成的必需内容裁切

**Files:**
- Modify: `skills/person-poster/scripts/inspect_html_layout.py`
- Modify: `skills/person-poster/references/render-and-acceptance.md`
- Modify: `tests/browser/scripts/person_poster_smoke.py`
- Modify: `tests/browser/scripts/smoke.py`（校验新增 expectation 类型）
- Modify: `tests/test_smoke_runner.py`
- Create: `tests/browser/cases/person-poster/poster-ancestor-clipping/{config.json,expectations.json,inputs/bundle.json,inputs/page.html}`
- Create: `tests/person_poster/test_layout_checks.py`

**Interfaces:** 保留 `inspect_layout(args) -> dict`。新增失败继续进入 `errors[]`；`review_bundle.py` 沿用已有错误汇总，不新增另一套裁切判断。

- [x] 从审查复现构建固定 HTML 输入，保存 400px 文字被 100px 父容器裁切的情况。expectations 添加 `reviewFailureContains: ["clipped by ancestor"]`；该字段缺省为空，非字符串数组拒绝加载。
- [x] 新 smoke 分支要求 review 非零退出、technicalPassed=false、包含指定错误且无最终 preview.png；不把异常崩溃当成预期成功。浏览器阶段仍验证 ready 与无脚本错误。
- [x] 用新增浏览器回归运行修复前代码，确认裁切未被检出导致失败，保留失败日志；固定 smoke 在修复后验证完整拒绝路径。
- [x] 在 `inspect_layout` 的浏览器 evaluate 中新增祖先遍历，比较 required rect 与各裁切轴的 client box；错误格式包含 `clipped by ancestor`、元素标识、祖先标识及轴。
- [x] 增加正反浏览器断言：横向裁切、纵向裁切、嵌套祖先、滚动容器、完整位于 client box、overflow:visible、边框、轴对齐缩放、容差内边界。测试用临时 HTML，测试输入不进入 Skill。
- [x] 在布局报告 items 中补 `bottomSafePx`，值来自当前已有的安全区判断；required/decorative 分别记录，供 Task 3 使用。
- [x] 运行定向检查并查看失败用例的阅读图，确认报错位置与真正消失的内容一致；文档说明覆盖范围和复杂裁切限制。

断言形式：

```python
assert report['passed'] is False
assert any('clipped by ancestor' in error for error in report['errors'])
assert visible_report['passed'] is True
```

验证命令：

```bash
uv run pytest tests/person_poster/test_layout_checks.py tests/test_smoke_runner.py -q
uv run python tests/browser/scripts/smoke.py --skill person-poster --output-dir .cache/skill-dev/person-poster/validation-hardening-layout/outputs
```

## Task 2：落实独立的交付模式

**Files:**
- Modify: `skills/person-poster/scripts/validate_bundle.py`
- Modify: `skills/person-poster/SKILL.md`
- Modify: `skills/person-poster/references/manifest-contract.md`
- Modify: `skills/person-poster/references/render-and-acceptance.md`
- Modify: `tests/person_poster/test_bundle.py`
- Modify: `tests/person_poster/test_person_poster_portability.py`
- Modify: `tests/browser/scripts/person_poster_smoke.py`
- Modify: `tests/browser/cases/person-poster/poster-html-only/{inputs/bundle.json,expectations.json}`
- Create: `tests/browser/cases/person-poster/poster-no-charts-png/{config.json,expectations.json,inputs/bundle.json,inputs/page.html}`
- Create: `tests/browser/cases/person-poster/poster-charts-html-only/{config.json,expectations.json,inputs/bundle.json,inputs/page.html}`
- Modify: `tests/test_smoke_runner.py`

**Interfaces:** 新增 manifest `delivery: "html" | "html+png"`；默认值 `html+png`。保留现有 Python 入口及 phase 名称。

- [x] 在 `test_bundle.py` 用现有 `write_bundle` 写失败测试：设置 `delivery='html'`、删除 png 字段，在 pre-export/complete 两阶段都应通过；带图表和不带图表分别覆盖。

```python
@pytest.mark.parametrize('charts', [True, False])
@pytest.mark.parametrize('require_png', [True, False])
def test_html_delivery_without_png(poster_validator, tmp_path, charts, require_png):
    manifest = write_bundle(tmp_path, charts=charts)
    manifest['delivery'] = 'html'
    manifest.pop('png')
    (tmp_path / 'manifest.json').write_text(json.dumps(manifest))
    result = poster_validator.validate_bundle(tmp_path, require_png=require_png)
    assert result.ok, result.errors
```

- [x] 补默认和显式 html+png 缺文件仍失败、非法 delivery 失败、html 模式提供越界 png 路径仍失败；先运行确认新增正向测试在旧代码上失败。
- [x] 校验 delivery 枚举；仅在 html+png 模式强制 png 字段与 complete 文件存在。html 模式若提供 png，沿用安全相对路径检查。
- [x] smoke builder 从 bundle.json 读取 delivery，默认 html+png，生成对应 manifest；production pipeline 仅为 html+png 执行 export 和 PNG 尺寸检查，所有成功用例均执行 preflight/review/complete。
- [x] expectations 增加布尔 `pngExpected`；runner 校验类型并根据预期检查 PNG 是否存在，不能只依赖生成结果里的 delivery 自证通过。
- [x] 原 poster-html-only 改为真正不生成 PNG；新增 poster-no-charts-png 保留原无图表 PNG 覆盖；poster-charts-html-only 使用已有柱图 spec 验证含图表的 HTML-only，数据在 case inputs 中配置。
- [x] 独立安装测试复制完整 Skill 后分别执行默认 PNG 模式与 HTML-only complete。将新 manifest 字段、默认值和最终验收命令同步到 Skill 文档。

验证命令：

```bash
uv run pytest tests/person_poster/test_bundle.py tests/person_poster/test_person_poster_portability.py tests/test_smoke_runner.py -q
uv run python tests/browser/scripts/smoke.py --skill person-poster --output-dir .cache/skill-dev/person-poster/validation-hardening-delivery/outputs
```

## Task 3：让尺寸同步达到稳定结果

**Files:**
- Modify: `skills/person-poster/scripts/sync_manifest_dimensions.py`
- Modify: `skills/person-poster/references/render-and-acceptance.md`
- Create: `tests/person_poster/test_dimensions.py`
- Create: `tests/person_poster/test_dimensions_browser.py`

**Interfaces:** 保留 `target_height_from_report(...) -> tuple[int, bool]` 和 `sync_dimensions(args) -> dict`。消费 Task 1 的可选 `items[].bottomSafePx`，兼容旧报告。

- [x] 添加纯计算失败回归：400px 根节点、内容相对底边 80px，默认同步应保持 400px；真正溢出到 430px、余量 16px 时应得到 446px；用新尺寸再算应保持 446px。
- [x] 补 root.top 非零、footer 96px 安全区、缺少内容测量、旧报告、显式 trim、取整和连续同步测试。新报告含非有限几何值时应明确失败，不写 manifest。

```python
report = {'root': {'top': 100, 'height': 400, 'scrollHeight': 400},
          'items': [{'kind': 'required', 'rect': {'bottom': 180}}]}
height, trimmed = target_height_from_report(
    report, bottom_safe_px=0, height_slack_px=16)
assert (height, trimmed) == (400, False)
```

- [x] 按设计中的相对内容底边规则调整计算；不再对已经含留白的 scrollHeight 无条件增加余量。显式 trim 与默认扩展分别处理。
- [x] 建立真实浏览器“测量 → apply → 重载 → 测量 → apply”回归，覆盖固定 px 高度、min-height 和现有 CSS 变量路径；第二次返回 `changed:false`，HTML 和 manifest 文件字节均保持不变。
- [x] 验证 canvas、export.height、export.viewport.height 与实际根节点一致；只有最终 PNG 的像素尺寸乘 DPR。
- [x] 保留横向溢出、文字遮挡和祖先裁切阻断；尺寸工具不能通过增高绕过 Task 1 检查。未知 CSS 写法或无法同步时明确失败，不宣称完成。
- [x] 文档明确默认不裁短、trim 的测量要求，以及重新检查实际 DOM 的步骤。

验证命令：

```bash
uv run pytest tests/person_poster/test_dimensions.py tests/person_poster/test_dimensions_browser.py -q
```

## Task 4：整体验证与覆盖说明

**Files:**
- Modify: `README.md`、`README.zh-CN.md`
- Modify: `tests/browser/cases/README.md`、`tests/browser/cases/README.zh-CN.md`
- Modify: `docs/migration/person-poster.md`（追加实际修复与验证结果，保留历史记录）

- [x] 区分“无图表 PNG”“HTML-only”“含图表 HTML-only”“预期渲染失败”“预期布局失败”，更新实际 smoke 覆盖说明。
- [x] 检查 CI 已执行的 `pytest tests` 与 smoke 自动发现机制确实包含新增文件；如现有发现足够，不新增独立工作流。
- [x] 运行整体验证；测试统计只记录实际结果，不预填通过。

```bash
uv run pytest tests -q
uv run ruff check skills tests .github/scripts
node --test tests/test_browser_assets.mjs tests/test_browser_checks.mjs tests/test_story_vseed.cjs tests/test_person_poster_runtime.mjs
uv run python tests/browser/scripts/smoke.py --output-dir .cache/skill-dev/person-poster/validation-hardening-final/outputs
git diff --check
```

- [x] 实际查看祖先裁切用例截图、正常海报阅读图及尺寸同步前后图，分别记录自动检查与人工观察；不以技术通过证明审美或事实正确。
- [x] 检查 Skill 独立复制、原有 chart matrix、失败导出和 story smoke 无回归。
- [x] 交付变更说明、验证记录和剩余限制；保留未提交工作区，等待用户后续要求。

## 完成标准

1. 已复现的祖先裁切被定位为技术失败，完整可见内容不被误报。
2. 明确 HTML-only 的带图表及无图表产物均可通过 complete，且不生成最终 PNG；旧默认产物缺 PNG 仍失败。
3. 已经满足安全距离的产物重复同步不改变文件；需要扩展的产物一次同步后稳定。
4. 文档、运行脚本和固定测试使用同一套交付与尺寸语义。
5. 定向失败回归、独立安装检查、现有全仓测试和 smoke 均通过，证据可追溯。

## 计划自检

- 三个审查问题分别对应 Task 1–3，覆盖文档与测试由 Task 4 收口。
- 新增运行契约只有 delivery 和布局报告中的可选 bottomSafePx；默认行为及现有入口保留。
- 图表与交付模式相互独立；pre-export 不冒充 HTML-only 的最终验收。
- 尺寸算法使用根节点相对坐标，明确区分默认扩展和主动裁短。
- 本计划不安排自动提交、发布、模型调用或无关重构。

## 执行记录（2026-10-23）

- 三项修复、文档与回归均已完成；没有提交、推送或发布。
- 全仓 Python：337 项测试、110 项子测试；Node：20 项；浏览器 smoke：8 项；ruff 和 diff 检查均通过。
- 真实浏览器复测：高度 400 → 494 后保持 494，后两次 changed:false；单元及浏览器回归还验证 HTML/manifest 文件字节不变。
- 发现 CI 普通回归任务未安装 Chromium，因此在既有 browser 任务运行 poster_browser 标记测试，普通任务排除该标记。
- 为避免新规则误报，补充绝对定位逃逸检查；对 inline/max-height 覆盖以及带 padding/border 的 content-box 自动尺寸改写明确拒绝，保留人工修改与复测路径。
- 所有证据在 `.cache/skill-dev/person-poster/validation-hardening-20261023/`；人工查看仅覆盖合成用例截图，不宣称重新验证真实人物海报质量。
