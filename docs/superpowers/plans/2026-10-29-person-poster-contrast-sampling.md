# person-poster 跨平台字形采样优化计划

> **For agentic workers:** 用户已授权实施，当前会话已完成本地逐项执行和自审；Ubuntu 新代码复验待提交/推送后执行。不派发子代理，不调用模型API。先保存测量证据，再决定是否接入原生2×采样。步骤用复选框跟踪；本计划不自动授权提交、推送、修改PR状态、合并或发布。

**Goal:** 修复原生图表小字号文字的对比采样不稳定，使现有Ubuntu冒烟矩阵恢复16/16符合预期，同时保持真实低对比、阅读失败和无法测量的拒绝行为。

**Architecture:** 保留“浏览器黑/白/透明文字捕获→实际背景采样→统一验收”的流程。先增加失败诊断，再验证原生高分辨率捕获及CSS面积归一；默认review使用2×浏览器渲染，显式DPR仍可诊断。采样不足继续阻塞，不通过改夹具文字、放宽预期或提高导出尺寸制造通过。

**Tech Stack:** Python3.10+、Pillow、Python Playwright/Chromium、原生VChart2.1.7；现有pytest、Node回归和Ubuntu24.04 CI，不新增运行依赖。

## Global Constraints

- 源码基线：`66184226095e8705c390aec9d1e2a8506a6fae50`。失败运行`40805341409`、job`123222819977`，实际合并测试SHA为`e0b68517ed9de5bc2a81a2abdf2e94fb6fdd325e`。
- 固定阅读基线：600 CSS px宽、最小12 CSS px。截图DPR不改变阅读字号，不修改`READING_POLICY`。
- 对比最低值：普通字4.5:1、大字3:1；实心字形黑白通道差门槛230不变。至少3个实际采样像素，且面积按3 CSS px²归一，不因2×图像多出像素而降低门槛。
- `unmeasured`不是通过。不存在足够实心字形、复杂绘制或捕获不一致时，技术状态继续失败；不增加忽略名单。
- 运行逻辑不得按“其余”、`waffle`、case id、夹具路径或Linux专名分支。特定文字只可出现在回归输入与故障记录中。
- 不将插值放大的旧PNG当高分辨率捕获；DOM与Canvas必须在目标DPR原生渲染。不能只改DPR却继续`scale='css'`。
- 不默认固定/下载某个中文字体。字体配置只有经证据证明是必要原因时才作为补充修复，并记录用途与来源。
- 保留`poster-chart-matrix`的14图、中文类别、零值和长标签覆盖；保留“只允许已知阅读失败”的严格断言，不把额外contrast错误加入允许列表。
- 实施影响运行Skill，形成新的候选；此前80文件不变的结论只属于旧候选。5条展示案例及其预览保持原样，不把本轮回归写成豆包独立任务通过。
- 本地Mac及现有Ubuntu CI验证；PP03、PP15、受限任务和其他上架字段仍保持原结论，不恢复暂缓的宿主测试。
- 单个实验使用`.cache/skill-dev/person-poster/contrast-sampling-20261029/`，按inputs/outputs/screenshots/logs/notes.md组织。原CI证据目录`ci-smoke-40805341409/`只读；每次smoke输出目录必须是新的。
- 不写模型调用或新的宿主批处理框架；复用现有smoke runner和浏览器测试。新增浏览器回归必须标记`poster_browser`。

## 已确认事实与未确认部分

原[失败job](https://github.com/VisActor/skills/actions/runs/40805341409/job/123222819977?pr=323)的Python浏览器回归70项、Node20项通过；smoke15/16通过。唯一失败为`poster-chart-matrix`，其原生spec、就绪、数据、几何、非空、资源和页面异常检查全部通过。

`review.json`有两条错误：92项文字低于600px/12px阅读基线，以及`Text contrast measurement incomplete`。前一项是密集API夹具的设计预期，后一项不在允许范围。`contrast.json`的低对比列表为空，未测项为`No solid glyph samples: 其余`；该图例原字号12px，阅读字号6px。实际CI局部图中该文字可见。

当前`inspect_contrast.py`按黑白差≥230筛选，少于3像素即未测量；`root.screenshot(scale='css')`每CSS像素只保留一个像素。**尚未证明**不足的最终原因是字体栅格化、字框映射还是绘制更新，因此2×方案必须通过Task1的证据关卡。

参考：[Playwright screenshot scale](https://playwright.dev/python/docs/api/class-locator#locator-screenshot)、[device scale factor](https://playwright.dev/python/docs/api/class-browser#browser-new-context-option-device-scale-factor)。版本以执行环境和锁文件为准。

## 文件边界

|文件|职责及允许改动|
|---|---|
|`skills/person-poster/scripts/contrast_probe.js`|输出root高宽、字框、声明字体与绘制属性；保持临时绘制及恢复|
|`skills/person-poster/scripts/inspect_contrast.py`|捕获、像素坐标映射、CSS面积归一、失败证据与采样策略版本|
|`skills/person-poster/scripts/review_bundle.py`|传入诊断目录，原生DPR默认值及报告采样摘要；600px预览仍为CSS截图|
|`tests/person_poster/test_contrast.py`|确定性像素测试及原生DOM/图表浏览器回归|
|`tests/person_poster/test_bundle.py`|新策略的成功夹具与旧策略报告拒绝|
|`tests/person_poster/test_workflow.py`|旧采样策略不能导出/完成；使用现有policy比较入口|
|`tests/person_poster/test_readability.py`|保留并复验DPR不改变阅读基线，不放宽断言|
|`skills/person-poster/references/render-and-acceptance.md`|解释采样分辨率、阅读尺度、未测量和旧报告重跑要求|
|`docs/validation/person-poster-contrast-2026-10-29.md`|实施后记录实际SHA、检查结果、远端证据和剩余限制，不收录原始日志|

默认不改`tests/browser/cases/person-poster/poster-chart-matrix/`、`person_poster_smoke.py`或CI工作流。现有artifact已递归收集`workspace/outputs/`，可直接携带新诊断文件。Task1若证实必须修改字体或字框，先更新本计划的对应任务及依据，再实施；不附带无关重构。

## Task 1：增加失败取证，确定进入哪条修复路线

**Files:** 修改`contrast_probe.js`、`inspect_contrast.py`、`review_bundle.py`；扩展`tests/person_poster/test_contrast.py`。

**Interfaces:** 保持`analyze(snapshot, black, white, background) -> dict`。将`inspect_contrast(page, selector, *, debug_dir: Path | None = None) -> dict`作为向后兼容扩展。snapshot增加`rootHeight`及图表文字声明的`fontFamily`；它不冒充实际解析出的回退字体。

- [x] 记录HEAD、Skill文件哈希/工作diff、OS、Chromium/Python/Pillow/Playwright版本。保留原run、head、合并SHA和artifact校验值；复制必要输入，不覆盖旧证据。
- [x] 先加像素级失败测试，要求报告包含实际样本数和未测原因，并保持失败，而不是只断言出现一条字符串。构造黑白完全相同的截图，预期样本数0、`passed=False`及非空`unmeasured`。
- [x] 加异常恢复测试：第三次捕获抛出异常后，DOM样式、图表fill/fillOpacity/stroke必须恢复，探针全局变量清除。此恢复测试在旧实现已通过；未将其记为修复前红灯。
- [x] 实现诊断接口。报告增加`sampling`元数据与`sampleFailures`列表：文字/来源/图表、声明字体、字号、字框、横纵采样比例、实心像素数、归一面积、最大黑白差。保留原有passed/lowContrast/unmeasured字段语义。
- [x] 仅采样不足时，将对应矩形的black/white/clear裁图写入当前review的`contrast-debug/`，用序号命名。保留布局外的必要边缘作为诊断上下文，**不将扩大后的背景区域计作字形样本**。目录必须位于本次review输出内，不能覆盖源文件、跟随外部symlink或按文字生成任意路径；仅清理本工具拥有的旧诊断。
- [x] `review_bundle.py`传`debug_dir=out / 'contrast-debug'`。默认不保存全页三张中间图；捕获仍是原生浏览器输出。记录声明字体、加载状态及CI字体配置，不把CSS字体栈称为已解析字体。
- [x] 用现有runner生成新的Mac证据目录，确认原14图和严格期望未改：

```bash
uv run --locked pytest tests/person_poster/test_contrast.py -q
uv run --locked python tests/browser/scripts/smoke.py --skill person-poster --case poster-chart-matrix --output-dir .cache/skill-dev/person-poster/contrast-sampling-20261029/outputs/mac-diagnostic
```

- [x] 在本地实验副本，对同一已生成HTML分别创建DPR1/2的上下文，沿用现有静态服务及ready等待，记录原生捕获；不修改输出HTML或spec，不建立新的正式runner。测试/临时诊断中的捕获核心如下，`page`为对应DPR的已就绪页面，`selector`为`#infographic`，`PROBE`为当前Skill探针：

```python
snapshot = page.evaluate(PROBE, selector)
frames = {}
try:
    for mode in ('black', 'white', 'clear'):
        page.evaluate('(mode) => window.__POSTER_CONTRAST_PROBE__.paint(mode)', mode)
        frames[mode] = page.locator(selector).screenshot(scale='device')
finally:
    page.evaluate("() => {window.__POSTER_CONTRAST_PROBE__.paint('restore'); delete window.__POSTER_CONTRAST_PROBE__;}")
```

按Task2给定公式计算两种捕获的字框内样本面积，并比较其字形是否落在框内；在报告中同时保留失败和成功捕获，不只挑选通过的一次。

- [ ] 在后续实施已获准提交/推送的前提下，让现有Ubuntu CI保存同样的失败裁图；否则保留可审阅诊断diff，明确远端取证尚未执行，不宣称Linux根因已闭环。

**取证关卡：**

|观察|后续动作|
|---|---|
|字形确在测量框内，1×缺实心像素，原生2×提供足够归一面积|进入Task2、Task3|
|字形偏离记录的采样框|修正并测试坐标映射；不能靠扩大框或降低230补偿|
|实际缺字、字体未就绪或字体配置错误|先修复必要字体加载/配置；保留通用测量检查|
|透明、描边、遮挡或恢复不正确|维持失败并修正相应绘制/恢复；不能假定2×解决|

Mac未复现Linux失败可以记录为平台差异，不虚构失败测试。若原生2×仍不足，停止该路线，依据诊断更新计划，不无限尝试更高DPR或把未测项改成passed。

## Task 2：实现横纵映射和CSS面积归一，保持门槛

**Files:** 修改`inspect_contrast.py`，测试在`tests/person_poster/test_contrast.py`。

**Interfaces:** `analyze`使用`scale_x=image.width/capture.width`、`scale_y=image.height/capture.height`，无裁切边缘时capture尺寸等于root尺寸；字框加上root相对clip的偏移。每个文本继续使用其实际字框；`solid_area_css=len(pixels)/(scale_x*scale_y)`，至少3实际像素且达到3 CSS px²才可判定对比。截图高宽不一致、根尺寸无效或无法确认映射时拒绝测量。

- [x] 增加以下确定性测试，先看到2×下11像素被当前实现错误接受；测试输入模拟截图与CSS区域，不依赖某台机器的字体：

```python
@pytest.mark.parametrize('scale,count,passed', [(.5,2,False),(.5,3,True),(1,2,False),(1,3,True),(2,11,False),(2,12,True)])
def test_solid_area_is_normalized_in_css_pixels(scale, count, passed):
    from PIL import Image
    from inspect_contrast import analyze
    side = int(8 * scale)
    black = Image.new('RGB', (side, side), 'black')
    white = black.copy()
    for i in range(count):
        white.putpixel((i % side, i // side), (255,255,255))
    background = Image.new('RGB', (side, side), 'white')
    snapshot = {'rootWidth':8,'rootHeight':8,'unmeasured':[], 'texts':[
        {'source':'dom','text':'sample','color':[0,0,0], 'fontSizePx':24,
         'bold':False,'rects':[{'x':0,'y':0,'width':8,'height':8}]}]}
    report = analyze(snapshot, black, white, background)
    assert report['passed'] is passed
    assert bool(report['unmeasured']) is not passed
```

- [x] 加入横纵比例不同的坐标测试及分数坐标测试，验证字框边缘取整不丢掉有效像素；不同尺寸的三张捕获必须抛出明确错误。
- [x] 修改采样循环的x/y映射与面积门槛：

```python
scale_x = width / capture['width']
scale_y = height / capture['height']
solid_area_css = len(pixels) / (scale_x * scale_y)
if len(pixels) < 3 or solid_area_css < CONTRAST_POLICY['minimumSolidAreaCssPx2']:
    unknown.append('No solid glyph samples: ' + text['text'][:100])
    continue
```

- [x] 保持最差有效像素的背景对比计算，不改为平均值，不排除低对比像素；230、4.5、3.0与大字定义保持原值。既有未知绘制项仍在unmeasured内。
- [x] 测试报告对2×原生图像记录12像素=3 CSS px²；插值PNG不作为浏览器回归输入，也不用于宣称解决字形问题。
- [x] 运行`uv run --locked pytest tests/person_poster/test_contrast.py -q`，确认面积边界、真实背景与恢复测试全部符合预期。

## Task 3：接入原生2×捕获，隔离阅读尺度

**Files:** 修改`inspect_contrast.py`、`review_bundle.py`；扩展`test_contrast.py`与`test_readability.py`。

**Interfaces:** 默认review浏览器上下文`device_scale_factor=2`；对比捕获使用显式整数clip的`page.screenshot(full_page=True, clip=clip, scale='device')`，见实施取证更新。直接API调用仍使用传入page的DPR，不重播会话或悄悄重建图表；显式DPR1不足时仍返回unmeasured。`capture_display_preview`继续固定600px、`scale='css'`，不改阅读策略。

- [x] 增加默认review的集成测试，断言`contrast`采样比例为2、600px预览仍宽600、CSS画布及阅读字号不变。覆盖显式DPR1/2，不能用图片分辨率代替阅读字号。
- [x] 将review CLI的默认DPR从1改为2，并更新help；显式参数仍保留。捕获改为device像素，并将实际采样元数据写入`contrast.json`及review摘要。
- [x] 通过在目标DPR创建浏览器上下文，使DOM和VChart原生Canvas一起重绘；不只放大Canvas外框或处理已有PNG。校验Canvas backing store与CSS mount尺寸的比例，原生图表实例/数据/挂载仍一致。
- [x] 对照既有布局检查与本次渲染，核对CSS根尺寸、必需节点/图表mount边界及内容一致；DPR媒体查询或字体变化造成场景/布局不一致时记录失败，不沿用旧位置采样。保持字体就绪和确定性图表ready等待。
- [x] 新增原生VChart小字号中文图例回归：12px文字、分数位置、实心深字浅底；2×须有足够归一面积。输入包含多组中文和英文，不只测试“其余”。高对比仍测不到时保留失败，不能放宽测试到“任意结果都正确”。
- [x] 保留并扩展反例：浅字浅条内标签继续低对比失败；空白/透明或完全遮挡导致无样本时不能passed；异常时恢复全部绘制状态。原有`smartInvert=False/True`测试继续执行，不删除断言。
- [x] 运行：

```bash
uv run --locked pytest tests/person_poster/test_contrast.py tests/person_poster/test_readability.py -q
uv run --locked python tests/browser/scripts/smoke.py --skill person-poster --case poster-chart-matrix --output-dir .cache/skill-dev/person-poster/contrast-sampling-20261029/outputs/mac-native-2x
```

**通过条件：** 该API夹具仍被review判定阅读不合格，字号仍按600px计算；contrast无新增低对比/未测项；smoke原断言自行通过。若字框或字形证据不支持2×路线，回到Task1的关卡，不修改expectations使其变绿。

## Task 4：使旧策略报告失效并补齐说明

**Files:** 修改`inspect_contrast.py`的策略版本、`test_bundle.py`、`test_workflow.py`与`references/render-and-acceptance.md`。

**Interfaces:** `CONTRAST_POLICY.version`更新为`rendered-glyph-background-v2`；其600/4.5/3.0字段不变。现有`delivery_policy.checked_review`及`validate_poster_bundle`已精确比较策略字典，复用这一路径，不新增成功旁路。

新策略字段明确为：

```python
CONTRAST_POLICY = {
    'version': 'rendered-glyph-background-v2',
    'displayWidthCssPx': 600,
    'normalMinimum': 4.5,
    'largeMinimum': 3.0,
    'solidDeltaMinimum': 230,
    'minimumSolidAreaCssPx2': 3,
}
```

Task2先在同一常量中加入归一计算所需字段，Task4切换版本并完成旧报告拒绝测试；这些任务全部完成前不提交一个被当作正式可用的新候选。采样代码从同一常量读取230和3，避免出现第二套可漂移配置。

- [x] 增加旧报告拒绝测试（复用既有策略拒绝行为，未声称修复前红灯）：创建原本符合当前工作流的成功记录，将其contrastPolicy改为v1，要求export/verify拒绝并提示重跑review；不能只测版本字符串变了。
- [x] 更新测试的合法成功报告至v2，保留一份明确v1输入用于拒绝用例。禁止将旧报告直接批量改成v2。
- [x] 给新策略记录CSS面积归一语义；不无故升级仓库Release版本或其他不相关协议版本。修复若最终只涉及诊断、未改变采样行为，则不宣称实施了v2原生采样。
- [x] 文档明确：2×是采样精度、600px是阅读尺度；声明字体栈不等于实际回退字体；未测量继续阻塞；旧bundle重跑review后才能重新export/finish。5条历史案例仍以其制作提交和公开输入复现，不自动改写其acceptance或预览。
- [x] 运行：

```bash
uv run --locked pytest tests/person_poster/test_bundle.py tests/person_poster/test_workflow.py tests/person_poster/test_contrast.py tests/person_poster/test_readability.py -q
uv run --locked ruff check skills/person-poster tests/person_poster
```

## Task 5：完整复验与可审阅交接

**Files:** 实施后的当前diff、`docs/validation/person-poster-contrast-2026-10-29.md`；本地实验日志和结果留在忽略目录。

- [x] 运行人物海报全部Python回归、相关Node回归和完整smoke，避免只检查华夫图：

```bash
uv run --locked pytest tests/person_poster -q
node --test tests/test_browser_assets.mjs tests/test_browser_checks.mjs tests/test_story_vseed.cjs tests/test_person_poster_runtime.mjs
uv run --locked python tests/browser/scripts/smoke.py --output-dir .cache/skill-dev/person-poster/contrast-sampling-20261029/outputs/mac-full-smoke
git diff --check
```

- [x] 实际查看600px阅读图、华夫图局部和失败采样裁图；核对PNG取样坐标、字体大小和原生倍率，不凭technicalPassed代替查看。
- [x] 普通测试中的新像素分析用例不依赖浏览器；新浏览器用例均带`poster_browser`。本次没有新增Node/npm依赖或模型调用，不因失败取消检查或提高超时。
- [x] 用户已授权提交/推送本轮修复时，提交具体可审阅diff并让现有PR运行Ubuntu CI；未授权时仅交接准备好的diff和本地证据，明确远端验收仍未完成。不能把Mac通过记作Linux通过，不能把旧run重试当新代码验证。
- [ ] 核对**新run的实际head与合并SHA**、Ubuntu smoke16/16、Node20项及Python既有与新增用例全部通过；用实际计数替代预估70。成功含预期失败夹具，不意味着16张合格交付海报。
- [x] 比较新旧`poster-chart-matrix`：14图API检查全部通过，阅读仍按600/12失败，contrast没有未测项；没有更改夹具或放宽断言。显式DPR1若仍有采样不足，应如实记录能力边界；默认2×的稳定性须有Ubuntu实际证据。
- [x] 使用实际SHA/工作diff、环境和run链接填写公开验证摘要；原始日志、字体配置输出及裁图保存在本地。记录实际耗时，单步不超过现有120秒，CI browser不超过现有15分钟；不通过增加超时掩盖性能回退。
- [x] 检查变更只涉及本计划文件，示例、原始输入、事实/素材门槛及其他Skill保持原样。不合并PR、不改发布计划、不提交市场申请。

## 交付与停止条件

1. 有可解释、可复核的字形取样证据，而不只是CI变绿。
2. 默认原生2×路线在Mac及Ubuntu有效；低对比、阅读失败、未知绘制及恢复检查均保持有效。
3. 采样面积按CSS归一，旧报告被拒绝，历史失败记录不回填通过。
4. Ubuntu16/16 smoke符合原期望；若远端取证未获执行条件，明确交接“本地完成、远端未验证”。
5. 原生2×仍不足、映射不一致或性能超出现有边界时，停止宣称修复完成，保存证据并更新计划；不尝试无限倍率、不改word/case特判或验收阈值。

本计划仅解决对比采样及相关CI问题。PP03、PP15、受限失败处理和上架申请准备继续沿用既有未决结论。

## 实施取证更新（2026-10-29）

Mac原14图夹具在1×通过；“其余”为30个实心像素，原生2×为236个、归一59 CSS px²。实际Canvas backing store由548×380变为1096×760，CSS边界不变；此证据不冒充Linux复现。

分数位置回归发现另一处确定的映射问题：locator截图会包含向外取整的CSS边缘，1200px根宽在x=0.25时得到2402px原生图像；直接以图宽/root宽推算比例会得到2.001667，并遗漏截图原点偏移。按取证关卡修正方案：使用公开`page.screenshot(full_page=True, clip=整数文档坐标, scale='device')`，显式记录clip尺寸及root相对clip的CSS偏移，再分别映射x/y。截取前后根位置变化或clip不完整时拒绝；不依赖Playwright私有取整实现，不把外扩背景计入样本。后续原生捕获步骤据此替代`root.screenshot`，其余阈值与门槛不变。

两次独立页面加载的布局检查与预览统一使用目标DPR（默认2），比较CSS根尺寸、必需元素的边界与文字。另增加Canvas实际像素密度检查，避免1×Canvas被浏览器放大后误称原生2×。现有原生DPR1 API调用继续可诊断；无法测量仍失败。

## 本地实施结论（2026-10-29）

Task 1–4 本地部分及 Task 5 本地回归完成。Task 1 使用新的 `mac-baseline` 输出目录保存旧实现基线，随后使用 `mac-native-2x` 与 `mac-full-smoke`，没有覆盖任何原证据。像素红灯为10失败/2通过，其中2×11像素确被旧实现误收；新浏览器元数据/诊断断言曾4失败/5通过。异常恢复在旧实现本已通过。旧策略拒绝测试验证现有比较入口，不虚构其红灯过程。

全部人物回归388通过，普通CI组577及110子测试通过，Node20通过，完整smoke16/16符合原期望；Ruff通过。实际查看阅读图、局部与负例裁图。记录见[实施验证报告](../../validation/person-poster-contrast-2026-10-29.md)。已勾选的交接项在当前未提交条件下完成；两个远端取证/验收复选项仍未完成。新代码Ubuntu的字体栈、采样裁图（如失败）及预算须随新run核对，本地结果不代替Linux结果。本轮尚未提交或推送，也未恢复豆包宿主测试。
