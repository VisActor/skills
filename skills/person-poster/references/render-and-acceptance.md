# 渲染、导出与验收

布局检查现在覆盖root内全部可见DOM文字片段，无需依赖data-required标记；保留原有required/图表检查。`layout-inspection.json.visibility`记录遮挡双方、交叠区域与不可测项：普通不透明覆盖使用真实浏览器命中层叠顺序，临时命中测试样式会恢复；复杂变换、半透明覆盖等不可可靠测量时阻塞。相应策略随review记录，旧报告须重跑。该几何检查不能替代实际看图，也不证明Canvas文字或人物语义无遮挡。

## 正式生产入口与实际对比

使用SKILL入口的 `poster_workflow.py preflight/facts/build/review/export/verify/handoff`。下文独立脚本命令用于诊断；单独导出PNG不代表通过正式交付检查。

review除固定600px/12px外还生成 `contrast.json`，通过临时黑/白字形和透明文字渲染，采样文字实际覆盖的背景；结束后恢复原始样式。普通阅读文字最低4.5:1，大字（600px阅读字号≥24px，或粗体≥18.667px）最低3:1，依据 [W3C文字对比定义](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)。只测实心字形内部以避开抗锯齿边缘；它不是整页无障碍认证或视觉通过证书。

对比采样策略为`rendered-glyph-background-v2`。review默认以原生DPR2渲染DOM及图表，用device像素捕获，显式记录整数截取范围与根元素的分数坐标偏移。黑白通道差仍需达到230；每段文字既需要至少3个实际像素，也需要至少3 CSS px²的实心面积。横纵倍率分别映射，外扩截取边缘不计作文字。图表Canvas实际像素不足目标DPR、捕获被裁切或绘制期间根位置变化均不能放行。

采样DPR不改变阅读尺度：`display.png`仍是固定600px宽CSS截图，12px原字号放在1200px画布上仍按6px阅读字判失败。`--device-scale-factor`可显式诊断其他DPR；1×下小字缺少实心样本时仍保留`unmeasured`，不自动放大已有PNG或降低门槛。布局检查和预览使用相同DPR，并核对两次加载的必需节点及CSS根边界，避免用不同场景互相认证。

采样不足时，`contrast.json.sampleFailures`记录文字/图表、声明字体栈、字框、实际像素数、CSS归一面积和最大黑白差；`review/contrast-debug/`仅保存对应黑/白/透明背景的诊断裁图。声明字体栈不等于已解析的系统回退字体。原有v1报告不能继承通过状态，须由当前Skill重新review，再按实际结果export/finish；旧报告不能手工改版本替代复验。

图内浅字遇浅条优先移到有空间的条外，或改为深字；检查实际标签位置，VChart可能自动反色/回退位置。照片亮部上的浅色姓名通过移动文字/人物、调整构图或提供稳定对比底色解决，不缩小到不可读。对比检查不识别人脸与手，仍需看人物保护区。

渐变字、透明/滤镜/旋转文字、复杂描边依赖等无法可靠测量时记为unmeasured，不能自评覆盖成passed；选择可测、清晰的呈现再复验。修改后需重跑review，最终verify拒绝过期输入指纹及未经检查的成功声明。

## 包内工具与运行环境

先解析 skill 的真实位置，设置：

- `SKILL_DIR`：`person-poster/` 的实际绝对路径。
- `BUNDLE`：当前产物目录的实际路径，不能指向两个历史实践的目录。

使用 Python 3.10+；Pillow 用于人物测量，Playwright 与 Chromium 用于浏览器渲染。选择当前可用环境，不硬编码前次实践的 `/tmp` 路径。独立环境的 POSIX shell／Windows PowerShell 安装命令、网络和系统依赖见 [运行环境与安装](environment.md)。

后续命令中的 `python3` 替换为所选环境的 Python。`.venv` 是运行环境，不属于可分享的成品文件，不打包到海报中。缺少环境或宿主图片能力时说明具体缺失，并交付已完成的源文件，不声称已导出。

固定本次 preflight 成功的解释器路径为 `POSTER_PYTHON`，检查、导出和最终校验均由它执行。模块/版本兼容失败是未完成的技术检查，不能用“前期技术已通过”或“PNG已存在”代替最后的 complete 校验。

先运行 `scripts/preflight.py` 实际验证浏览器与字体样本；生产顺序和阶段读取见 [高效生产顺序](production-flow.md)。它不自动安装，也不绑定供应商。

编写 manifest 前读取包内 [产物契约](manifest-contract.md)；接入图表时读取 [图表接入](chart-bridge.md) 及 [本地图表索引](charts.md)。所有生成、导出与检查均可仅凭当前 skill 目录执行。

人物视觉系统可记录为 `reference-derived-person-editorial` 或明确的自定义 slug，`source` 写对应 bundle 的 `design-brief.md`；无需外部 style registry。按人物和数据选择视觉语言，不以 slug 代替设计决策。

## 可编辑 HTML 与图表

- 根节点固定为 `#infographic`。最终尺寸以实际布局为准；内容测得浮点宽高时，向上取整为最终画布的CSS像素尺寸，并实际写回根节点。根节点、manifest 的canvas/export/viewport使用同一组宽高，2x导出只改变像素密度。
- 图片、图标与采用的自定义字体放在当前 bundle 内，以相对 URL 引用；字体按当前视觉角色选择，采用真实字重及当前作品字符覆盖，不假定 skill 提供字体文件。图表运行时默认使用 [固定版本 CDN](chart-bridge.md#发布-runtime)，在实际浏览器中验证；离线交付时才准备带来源和版本的本地副本。不依赖 `src`、`dist` 或 examples dev server。
- 每张图表有 `charts/[id].spec.json`、同 id 的 manifest 条目、`data-chart-id` mount 与非空 `window.__INFOGRAPHIC_CHARTS__` 条目。内嵌 spec 与文件内容一致；mount 具备明确宽高。
- 编辑交付说明须明确：修改数据/独立spec后运行build生成charts.generated.js，再重新review/export/verify；重新打开HTML不会自动同步JSON。
- 原生 spec 深拷贝后直接创建 VChart，禁用动画。图表 owns 全部数据图形、轴与数值标签，HTML 不重画第二组相同柱条。
- HTML 上为实际必需的标题、指标名/值/单位、里程碑与图表 mount 标注 `data-required`。一组复合数值可标外层；不要父子重复标注。图表 mount 是其内部数据/标签的检查边界，canvas 内部是否完整需要看 PNG。
- 背景、纹理与共享载体位于内容后方，不标成与每段文字竞争的前景装饰。真正前景装饰远离必需信息。

先保留默认图表行为并检查输出，发现问题才作针对性修复：轴标签截断就增加类别宽度/改为宽证据带；数值被自动挪入柱内就检查字体、padding 和标签避让；自定义字体只加载到 HTML 时，还需传给图表 theme/label/axis。避免对所有图表统一禁用避让或手动覆盖位置。

## 确定性就绪

将 `scripts/render_charts.js` 复制到当前 bundle 并用相对 script src 加载。它直接渲染原生 spec，检查 mount、深拷贝配置并等待 renderAsync，不转换配置。然后在当前 HTML 内实现如下次序：

```js
window.__INFOGRAPHIC_READY__ = false;
(async () => {
  try {
    // @font-face 须在可见元素上使用；提前 load 图表专用字体。
    await document.fonts.load('500 24px "PosterDisplay"');
    await document.fonts.ready;
    await Promise.all([...document.images].map(image => image.decode()));
    window.__POSTER_INSTANCES__ = await renderPosterCharts(window.__INFOGRAPHIC_CHARTS__);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    window.__INFOGRAPHIC_READY__ = true;
  } catch (error) {
    window.__INFOGRAPHIC_ERROR__ = String(error);
    console.error(error);
  }
})();
```

将示例字体名、字重、额外字体 load 与 mount id 调整为当前作品的实际值。在此前加载相对路径charts.generated.js，由build从spec文件生成window.__INFOGRAPHIC_CHARTS__。没有图表时保持空对象并省略图表 runtime。错误时 ready 保持 false；不要用固定等待时间或成功的 HTML load 代替完成状态。

## 执行检查与导出

第一次预览优先执行 `scripts/review_bundle.py --bundle "$BUNDLE"`，集中取得布局、总览、DOM 局部截图和实际文字/图表数据。`review.json.technicalPassed` 只代表技术检查，事实与视觉状态仍为 pending，须实际查看证据。给具体区域加 `data-review` 即可定位，无须写临时裁图代码。下列独立命令用于针对性诊断与最终导出。

`readability.json` 逐项记录全部可见 DOM 文本和实际 VChart 文本图元，包含脚注、署名及 `data-decorative` 后代中的文字。`data-decorative` 只描述布局角色，不豁免字号。默认且固定的通过基线是600px阅读宽度、12px最小字级（画布更窄时不放大）；这是工程基线，不是视觉质量评分。可见装饰字也须达标；不需要展示的重复文案可删除，来源长链接可移至元数据，但理解数值必需的口径不能隐藏。

`--display-width` / `--min-reading-font-size` 只生成 `supplemental-display.png` 和 `supplemental-readability.json`，不会替代基线、`display.png` 或改变 `technicalPassed`。不得因失败改阈值或用“高清查看”例外声明通过。最终 passed 校验要求报告含固定 readingPolicy、全部可见文字覆盖及成功的基线结果；旧报告需重新运行。旋转/复杂DOM、SVG文字及图表富文本等无法可靠测量时保持待核验。脚本只校验报告契约，不防范手改报告、也不自动证明事实或视觉正确。

先看构图草稿、容易失败的主图局部，再看完整海报。实际查看 `review/display.png`：它固定按600px阅读宽度截图（更窄的画布不放大），布局保持不变。2x PNG不改善字级过小。用“原 CSS 字号 × 阅读宽度 / 画布宽度”估算实际字级，例如 1200px 画布上的 16px 标签在 600px 阅读图上约为 8px。图表名称、份额、单位及改变含义的脚注都要在同一阅读图核对；优先加大字号、改换行、扩展证据区或收紧空白，而非只放大局部。图中无需展示的冗长来源可以留在元数据，但不能删掉理解数值所必需的限定。圆环同时检查环宽与外部标签空间，不能把极细环当作正常饼图通过。照片、主数、图表和正文的对照须共享尺度，不只放大每个局部宣称可读。用户有参考时，记录实际采用的空间关系和仍有差距；不使用无证据的总评替代观察。

参考与成品各保留完整比例、按相同宽度并排展示，再看人物边缘与关键局部。记录“参考中的关系 → 当前观察 → 修改 → 复验文件”。原图本身的裁切、噪点与处理产生的误删、色边分开记录；素材 alpha 合格或局部图表通过，不能继承为完整作品的视觉结论。跨题材草稿用于检查规则是否要求套版，不作为所有题材都能稳定产出成品的证明。

验证skill泛化时，观察输入改变后的合理响应：新姿态是否改变保护区与证据位置，新数据是否改变标签空间/载体，新题材是否改变图形语义。颜色或姓名变化本身不算证据；输入关系相同则允许合理的相似构图，不要求为了区别而随机排版。这是实际作品比较，不加入静态审美门禁。

跨宿主验收另记录包版本/hash、实际输入、可用能力、执行日志与最终HTML/素材/PNG。没有历史上下文的新会话结果与当前会话精修分开；技术通过不能证明宿主看过图片，截图也不能证明它调用过分割。只有截图时描述可见现象，缺少实际宿主运行时保持未验证，不用本地结果代替。

下面尺寸仅示范 1200×2160 的作品，替换为当前实际宽高；使用所选 Python 环境执行。

```bash
python3 "$SKILL_DIR/scripts/inspect_html_layout.py" \
  --html "$BUNDLE/index.html" --serve \
  --ready-expression 'window.__INFOGRAPHIC_READY__ === true' \
  --viewport-width 1200 --viewport-height 2160 \
  --output "$BUNDLE/layout-inspection.json"
```

修复 `errors[]` 中实际问题。数值行框不够时增加空间或调整字号/结构；外溢与遮挡不能靠 `overflow:hidden`、取消 `data-required` 或放大 manifest 隐藏。根节点和布局尺寸变化后重新测量并同步 manifest；包内 `scripts/sync_manifest_dimensions.py` 只用于其支持的尺寸同步，不代替布局修复。

元素外框在画布内，不证明其内容未溢出。对比 clientHeight/scrollHeight 与实际字体行框；过紧的 line-height 需扩大，行内图片基线空隙可通过 `display:block` 处理，再重新测量。mask/absolute 本身不是豁免理由；无法判明的错误保留失败与逐项证据，不能笼统改称误报。

布局检查会逐轴检查必需元素被祖先 `overflow:hidden/clip/auto/scroll` 裁切的情况，并记录元素、祖先和轴；普通平移及轴对齐正缩放按 client box 测量。旋转、skew、clip-path、mask 等复杂情况会记录人工复核提示，不宣称能精确检测任意 CSS 遮挡。报告中的 `bottomSafePx` 是当前元素实际需要的安全距离。

尺寸同步默认只扩展到“内容相对根节点的底边 + 安全距离”，已有留白不重复增加。`--trim-blank-tail` 才允许主动裁短，且必须有内容测量。没有内容项时默认保留根节点范围并提示，不推断裁短尺寸。报告坐标为 viewport 坐标，计算时扣除 root.top；缩放后的根节点需人工确定 CSS 尺寸再测量。

使用 `--update-html-root-height --apply` 时，自动改写支持单一 `#infographic` 规则中的 px height/min-height 或具有单一 px 定义的 `--canvas-height`；未知写法、inline 尺寸覆盖、max-height 限制返回错误。content-box 根节点有垂直 padding/border 时需改用 border-box 或人工调整后重测，避免把外框高度误写成内容高度。工具保留 overflow 样式，不通过取消裁切修复布局。写入后按 `requiresLayoutRecheck` 重新运行布局检查，并再次同步确认 `changed:false`；尺寸改写不证明最终 DOM 已符合预期。

```bash
python3 "$SKILL_DIR/scripts/poster_workflow.py" export --bundle "$BUNDLE"
# 查看最终PNG并填写真实验收结论后：
python3 "$SKILL_DIR/scripts/poster_workflow.py" finish --bundle "$BUNDLE"
python3 "$SKILL_DIR/scripts/poster_workflow.py" status --bundle "$BUNDLE"
```

`export_html_png.py` 的正式导出也执行同一前置检查，不能用它绕过失败的review。确需查看失败草稿时运行`poster_workflow.py draft --bundle "$BUNDLE"`（复用底层--draft）；该截图不写正式回执，不覆盖manifest声明的成品，不能作为任务完成证据。`status`只读当前文件与证据指纹；ready之外的结果应明确说明草稿和未完成项，不能用结构校验的成功覆盖。


默认 PNG 交付尚未导出时，静态检查使用 `validate_poster_bundle.py "$BUNDLE" --phase pre-export`；它仅跳过最终 PNG 是否存在，仍校验 manifest、HTML、图表与资产。默认 `complete` 按 manifest.delivery 判断 PNG 要求：缺省或 `html+png` 必须有 PNG；明确 `html` 时可省略 png 字段和最终导出，但仍执行review、查看阅读图并运行verify/status。complete与pre-export均为结构检查阶段，不能替代最终verify。

图表检查覆盖原生 spec 最小结构、本地 values 数据、禁用动画和文件/内嵌映射一致性，不验证完整 VChart API，也不拒绝所有未知字段。原生 API 是否实现了预期编码需要实际浏览器、图表数据与截图验收；配置检查不证明事实正确或视觉合格。

这里的 localhost 服务属于正常 HTML 产物导出流程；不能用它或其他浏览器通道绕过已有的工具拒绝或访问限制。失败时定位缺失 runtime/字体/素材/浏览器，修复可授权的原因或明确交付限制；不以脚本重画 PNG 冒充 HTML 导出。

## 两层验收

| 维度 | 必须查看的证据 | 典型修复 |
| --- | --- | --- |
| 技术完整 | bundle 校验、非零 required_count、布局 passed、ready 完成、图表非空、尺寸与 spec 对应 | 修复错误路径、font 行框、mount、尺寸和数据映射 |
| 人物主导 | 原图与出处：身份/时期/场景匹配；最终整图：轮廓引导信息流、脸/手/器具和关键动作未被遮挡，抠图保留原貌 | 核实或更换可靠照片；调整人物尺度/位置与证据区域 |
| 可读密度 | 最终缩略图与局部：核心信息有层级，完整类别/单位可读，无重复数据填充 | 合并系列、缩短说明、改证据带、重分配画布 |
| 整体统一 | 标题、数字、正文、图表、图标、线条共享视觉规则 | 收束字体角色、色彩语义、图标笔触和对齐 |
| 数据可信 | 数据文件、来源、系列与 PNG 中的数值/范围一致 | 修复时间口径、舍入、错误合计或不成立的比较 |

在 `acceptance.json` 记录真实检查结果、实际 PNG 尺寸、查看的文件与仍有的限制。技术通过但人物只像角落配图、主体盖住脸、图表标签模糊或整页退化为卡片列表时，仍未满足本 skill 的设计目标。视觉结论写观察，不捏造评分或自动“通过”。

将简报中的关键设计决定与实际截图对照：每个决定指向一个真实的HTML区域或图表mount及其局部截图，例如某组荣誉由符号与年份共同表达、某组成由原生图表表达。记录中只认实际可见的载体；没有实现的图形要补做或修订决定并说明取舍。不要用“准备自绘”的列表、CSS类名或背景纹理证明已实现领域图形。背景装饰在最终显示尺度退后，正文、照片边缘与图表标签优先。

人物剪影路线另核对实际引用文件的背景已去除：明显的矩形底、只有边缘/底部渐隐、人物或器具被误删都不能通过素材视觉验收。脚本 alpha 格式通过不改变这个结论。先修素材，再按真实轮廓重排人物和证据；不要对失败素材靠缩小主体、大块留空继续导出并称为完成。

可以按下列结构记录，状态须由实际检查填写，不直接复制为通过。视觉观察包括 `composition`、`chartReadability`、`typography`、`sourceIntegration`；只记录会改变交付判断的内容。

```json
{
  "technical": {"status": "pending", "evidence": []},
  "factual": {"status": "pending", "evidence": []},
  "visual": {
    "status": "pending",
    "displayWidthCssPx": 600,
    "charts": [
      {
        "id": "category-highlight",
        "evidence": [],
        "labels": {"status": "pending", "expected": ["完整类别", "数值", "单位"], "observed": ""},
        "colors": {
          "status": "pending",
          "mode": "category",
          "expected": {"第一组研究贡献者": "#6b7683", "第二组研究贡献者": "#6b7683", "第三组研究贡献者": "#d4af6a"},
          "observed": []
        }
      }
    ],
    "observations": [],
    "fixesAndRechecks": []
  },
  "limitations": []
}
```

### 逐图记录预期与观察

`visual.charts` 覆盖 manifest 中每张图，id 使用真实 chart id；无图表时为 `[]`。上例仅示范结构，预期内容从当前作品简报与数据填写，观察必须来自实际打开的成图。

1. 在 `evidence` 填写实际看过的最终 PNG、阅读宽度截图及图表局部路径。先看最终展示尺度，再放大定位问题；600px 是固定基线；其他尺度的补充截图不能替代它。
2. `labels.observed` 写明完整类别、数值和单位是否可读，有无重叠、裁切或避让后消失。不能只写“标签可读”；记录对交付判断有影响的具体观察，如“第三类别名称完整，25% 位于色段内”。
3. `colors.expected` 记录预期的类别身份与颜色；`observed` 单独记录实际对应关系，如“第三类别呈金色，其他两类呈灰色”。目测不需要编造精确色值。合法单色使用 `mode: "single"`，说明整组的预期颜色和实际观察；不宣称存在类别强调。
4. 各项状态使用 `pending`、`passed`、`failed`。任一图未看、看不清或映射有误，整体 visual 不得 passed；缺乏查看能力时写 pending 与限制。`technicalPassed`、非空 canvas、内嵌 spec 匹配都不能代替这些观察。
5. 修复后重新生成 review，重新查看阅读图与局部；导出后再查看实际最终 PNG，将改动与复验写入 `fixesAndRechecks`。不能用旧图的结论替代修改后的结果，也不能照抄简报作为观察。

这些检查由执行者完成，不新增用户逐步审批；结构化记录帮助追溯，不是自动视觉正确性证明。

技术失败先修复并重跑；无法完成时说明是哪项检查缺失并交付已完成源文件/图片，不称为全流程通过。canvas 中类别相撞可能不会触发布局错误，视觉状态仍必须为失败/待修复；不能因 technical passed 自动填 visual passed。这些检查由执行者完成，不新增用户逐步审批。

交付以最终 PNG 为主，说明是否为 AI 插画及必要统计范围；用户需要编辑时再给 HTML/数据位置。不能从两张成功样例推断所有人物都稳定高质量，后续按新题材的实际成品继续校正。


## 交付记录的格式边界

最终命令的 `--require-records` 要求 `fact-review.json`、`acceptance.json`、`workflow-timings.json` 为可解析的非空 JSON 对象；禁止 Markdown 改后缀、空对象和 NaN/Infinity。默认结构检查允许记录暂缺并提示，便于草稿预览；已存在的格式错误会报错。

这不是事实或视觉自动认证：`pending`、使用依据未知或计时 `partial` 可以如实记录，仍须在交付说明及对应验收项保留未完成状态。事实核对格式见 [数据与素材](data-and-assets.md)，真实计时与未知部分见 [生产顺序](production-flow.md)。不为使检查通过补造时间、来源或看图结论。

### 保留原始检查结论

记录实际的 `review.json.technicalPassed` 与错误列表；人工认为某个照片/浮卡边界框重叠是有意设计时，另列逐项判断、截图与理由，不能把原始 false 改写为“自动检查通过”，也不能笼统豁免所有剩余错误。真实文字遮挡仍要修复。

逐图核对原始事实 → spec → 实际可见标签。未出赛、未观测或不适用的分类不应显示数值0；必须在最终截图确认缺口及说明，不能照抄配置中的隐藏意图到 observed。任何未看清的数值、单位或必要限定均保留 pending。

1200px 画布缩到600px时，必要标签与口径说明至少从24px CSS（显示12px）开始满足默认阅读检查，再按实际截图检查对比度、字形和布局。12px不是所有媒介的通用标准，也不证明足够清晰。字体使用生效的原生 `label.style`，不要把字号藏在未验证的条件格式字段里。空间不够时减少次要信息或扩大对应区域。

最终 `--require-records` 会交叉检查技术通过声明：`technical.status: "passed"` 或兼容字段 `technicalPassed: true` 必须对应无 errors 且 technicalPassed 为 true 的原始 review 报告。默认路径 `review/review.json`，自定义输出位置用 acceptance 的 `reviewReport` 指定包内相对路径。修复后重新运行 review，再更新验收；预览允许旧失败报告存在，以便重新检查。此交叉检查不能证明报告覆盖最新全部改动或视觉/事实正确，仍须保留实际复验记录。

最终记录必须明确提供 `technical.status` 或兼容字段 `technicalPassed`，不能只写视觉通过而省略技术失败。技术状态只使用 `pending`、`passed`、`failed`，禁止 `passed-with-warnings` 等自定义通过状态。兼容字段 `technicalPassed` 必须为布尔值且与状态一致。待验收/失败的记录可以通过结构校验，但会明确提示尚未技术通过，不是最终交付通过。人工例外说明另存 `manualReview`，不得覆盖原始技术失败；报告中的警告本来就不等于 errors，必须按原报告区分。


全内容粗排完成后先运行 `poster_workflow.py layout --bundle "$BUNDLE"`，检查 `layout-review/display.png` 与 `display-check.json`，再精细构图；最终仍需完整review。展示文案按 [展示事实绑定](display-bindings.md) 连接核实数据；label清单与图表额外注释须实际核查语义。最终运行 `poster_workflow.py finish --bundle "$BUNDLE"`，读取delivery-package.json与delivery-reply.md；finish重跑verify，只有ready列出正式文件；blocked/draft不能称成品完成，即使存在PNG。


失败出口的可分享图片为`draft/诊断草稿-未完成.png`，图片外框明确DRAFT / NOT DELIVERED；内部`draft/preview.png`保持原始诊断截图。两者都不是正式PNG，报告图的额外外框不改变原HTML画布。finish仅列哈希有效的带标识报告图；无法生成时提供文字及检查记录，不回退展示无标识截图。最终先说明正式交付未完成，再列失败原因、受限条件、需要允许的调整和诊断文件。
