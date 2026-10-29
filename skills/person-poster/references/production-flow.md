# 高效生产顺序

## 先做低成本、影响后续工作的检查

读取 SKILL 后只进入当前阶段需要的参考。开始时运行真实环境探针：

```bash
python3 "$SKILL_DIR/scripts/preflight.py" \
  --output "$BUNDLE/preflight.json" \
  --font serif --font sans-serif
```

它实际加载 Python 模块、启动 Chromium、渲染字体样本并写指标/耗时；不只看“模块已安装”。失败先按报告选择当前可用的独立环境，再重跑，不到写完 HTML 才诊断驱动。成功后复用同一环境；没有环境变化不重复安装。选择具体字体时可传其 CSS family 和当前标题的 `--text`，但成功不证明该字体真实存在或包含所有汉字，查看样本和作品实际字形。

将成功报告中的 `python.executable` 作为本次 `POSTER_PYTHON`，由它执行后续 review、导出和完整校验。不要前期使用 venv、最后切回系统 Python；驱动或模块问题优先选稳定受支持的环境并重新探测，不把复制驱动/修改 site-packages 作为通用步骤。环境不变时复用，不为每个图表变体重新安装。

宿主图像能力盘点一次，优先确认图片搜索、原图获取与编辑/分割方式；只有需要 AI 素材时才确认生图能力。先检索可信真实人物图片，透明人物直接走 `prepare_subject.py`；需要抠图时使用已知能力并交回结果，不反复搜索工具名称。本包不限定供应商。

剪影路线要区分“实际背景分割能力”和“alpha检查/裁边脚本”。`prepared` 后仍执行报告的素材查看步骤，确认背景去除及人物完整，再核对 HTML 使用同一结果文件。缺实际分割能力不是运行成功；不将渐隐或保留矩形底作为静默回退。此时可继续事实和草稿，最终交付如实标明未完成。

## 分阶段读取、保存证据、允许独立工作重叠

| 阶段 | 当前应读取/产出 | 避免重复 |
| --- | --- | --- |
| 事实与叙事 | `data-and-assets.md`；事实清单及关键 `fact-review.json` | 同一个事实在标题/KPI/图表中各自重新检索 |
| 人物与构图草稿 | `composition-and-style.md`；真实图片与出处；参考转为五项设计决定；实际占位草稿 | 跳过身份核实，固定等权卡片后塞入人物；普通局部编辑也重做草稿 |
| 关键图表 | `chart-design.md`、实际类型 spec、`chart-bridge.md`；主图局部 | 完整海报做完才发现长类别/最高标签放不下；所有图机械做两版 |
| 完整 HTML | `manifest-contract.md`；由build同步spec并生成图表载荷，复用已验证视觉规则 | 分别手写 spec 与内嵌版本，一次载入全部资料 |
| 预览与修复 | `render-and-acceptance.md`；集中 review 产物 | 临时写裁图脚本、为正确 DOM 数字重复 OCR |

人物身份、时期与大致视觉方向明确后，剩余数据核查可与人物图片搜索重叠推进；有依赖的布局坐标仍需等待实际素材。用户明确要求 AI 插画时才将素材生成安排在这里。不要为了并行先采用未经确认的纪念主题或年龄。

构图草稿和主图局部可以相互反馈：长名称需要更多宽度就先改证据区；主数字、照片、分组不成立就先改草稿。随后再做全页细节。局部通过的图表进入不同尺寸的 mount 后复验，不把一个独立 PNG 的通过继承成最终通过。

完整生成/重构在草稿前实际查看当前人物素材及用户提供的参考，再按当前事实实现需要的图形与数值关系。图表按 [图表设计](chart-design.md) 选择配置，接入时验证固定版本 CDN 可加载。按 [视觉校准](quality-reference.md) 检查层级与连续阅读；人物照片、事实、字体与画布高度均为当前作品重新选择，不以历史范例或预装素材库作为开始条件。

`validate_poster_bundle.py` 检查 bundle 连接、原生 spec 最小结构与文件/内嵌数据一致；review 使用同一入口。完整 API 与视觉效果需要实际图表检查，不能把静态通过当作数据正确或图表可读。

## 全内容粗排先检查

细排前按 [展示事实绑定](display-bindings.md) 连接全部文案和数据。以同名id占位，运行build统一完成来源检查、DOM与图表载荷同步，再检查。草稿包含实际全文、单位、脚注、图表标签与照片；只检查代表字号不能证明可读。运行：

```bash
python3 "$SKILL_DIR/scripts/poster_workflow.py" build --bundle "$BUNDLE"
```

实际查看 `layout-review/display.png`。这个动作复用review的固定600px/12px、对比、展示绑定、布局和图表检查，独立保存结果，不覆盖最终review或创建正式PNG。细排改变文字、宽度、字体、标签或背景后重查受影响部分，最终完整review始终必需。早期通过不证明晚期修改仍正确。

## 一次命令收集预览证据

正式生产使用 `poster_workflow.py review --bundle "$BUNDLE"` 自动复用成功的preflight解释器；下方独立review命令保留作诊断。完整顺序为preflight→新建init/已有原稿直接诊断→实际取证/来源及素材核查→data→facts→全内容粗排及展示绑定→build→查看修复→细排→review→查看修复→export→查看最终PNG→finish，不在环境失败后改用手绘系列或系统截图替代整套验收。

```bash
python3 "$SKILL_DIR/scripts/review_bundle.py" --bundle "$BUNDLE"
```

默认产出原宽 `review/overview.png`、600px阅读宽度的 `review/display.png`、局部PNG、文字/图表数据、布局报告与 `review.json`。`--display-width` 只生成补充阅读图，固定600px/12px基线与正式display.png不变。`display.png` 在原布局上临时缩放进行浏览器截图，不触发窄屏重排，也不改最终HTML/PNG；必须实际查看它，而非仅声明按小尺度验收。这是一次命令的编排，内部复用布局检查并另开截图会话，不承诺只加载一次浏览器。

给需要查看的标题/KPI/人物/证据区添加 `data-review="hero"` 等稳定标签；这些只是验收定位，不规定布局。脚本按 DOM 实际位置截图，免去手算2x像素坐标。没有标签时自动查看图表 mount 和有 id 的人物图片，也可用重复的 `--detail-selector` 指定当前实际区域。

`text-and-chart-data.json` 保留实际 HTML 文字及 runtime spec。怀疑数字读错时先比对事实清单、该数据与局部图；OCR 只能辅助，不能推翻可核查的源数据。它不自动确认 canvas 内文字正确、单元清晰或人物未被语义遮挡。

重复执行会更新该目录中的生成报告/截图并清除旧预览，避免把失败前的图片当作新结果；原始 HTML、素材与最终 PNG 不被修改。工具拒绝把原始输入所在目录用作 review 输出目录。

## 针对根因修复，再做最终导出

- 缺路径、JS/字体写入错误 manifest 字段：导出前静态模式报告并修复，避免先截图才发现打包失败。
- 人名/主数字行框溢出：用报告定位实际字体、行高、宽高和父容器空间，一次修复相关盒子；不靠反复猜字号。
- 根宽度/高度错误：区分 grid 总宽、盒模型、装饰越界、内容容量与 manifest 不一致。局部原因局部修，不因一张样例失败改写全部布局。
- 图表标签/waffle 单元/人物遮挡：看集中生成的局部图，对确实失败的部分调整；这些是人工视觉判断，不加入按人物或卡片数量匹配的静态规则。

预览修复后重新运行 review。技术通过、事实核对完成、人工视觉验收完成后才生成2x最终 PNG并执行完整校验。Review 不替代最终导出，不能将1x草稿作为已完成的高清成品。

这里的事实/视觉验收由执行者实际读来源和查看 PNG 完成，不新增用户逐步确认节点；需要用户补充的信息仍按原任务范围处理。

诊断记录结构时可使用 `validate_poster_bundle.py "$BUNDLE" --require-records`，同时检查 `fact-review.json`、`acceptance.json`、`workflow-timings.json` 存在且为非空 JSON 对象。默认预览仅提示缺失记录，已存在的坏 JSON 始终报错。此检查证明记录可读取且已提供时间符合一致性规则，不证明内容真实、视觉已通过或耗时完整。

该独立校验是结构检查。正式就绪交付还要执行 `poster_workflow.py verify --bundle "$BUNDLE"`：重比对来源数值、检查素材证据和各维度状态、拒绝与当前HTML/spec/素材不匹配的旧review。`tool-timings.json`由统一入口围绕实际子命令记录；不要再为这些命令手工补一段更短的“阶段时间”。

## 失败时保持状态并提供诊断草稿

正式export失败先修复；用户限制使修复不可执行时，保持原HTML/字号/画布，使用workflow draft生成内部draft/preview.png和带可见未完成外框的draft/诊断草稿-未完成.png，再运行finish读取delivery-package.json及delivery-reply.md。它会明确草稿/未完成、真实失败和文件身份；不要另写截图脚本或用存在的PNG推导完成。finish重跑verify，不代替实际看图和事实判断。用户同意接收原样图片不代表固定阅读标准已通过；改变限制后重新review/export/verify。

```bash
python3 "$SKILL_DIR/scripts/poster_workflow.py" draft --bundle "$BUNDLE"
python3 "$SKILL_DIR/scripts/poster_workflow.py" finish --bundle "$BUNDLE"
```

## 用实际计时判断瓶颈

`preflight.json` 和 `review.json` 记录工具的实际阶段耗时。另在 `workflow-timings.json` 记录资料、素材、HTML/布局、修复与交付阶段的真实开始/结束时间和重试次数；读取这些产物填写工具阶段，不猜测其余时间。并行阶段会重叠，累计阶段耗时不等于总墙钟时间。

对比冷环境与复用环境的耗时，再决定是否缓存按版本/来源校验的 runtime 与完整字体；中文子集仍需覆盖当前文案。仅凭调用日志长度不承诺“30分钟缩到某个时长”。

从任务开始就保留可观察阶段的时间，不在结束时倒推。可使用以下 JSON 结构：

```json
{
  "status": "partial",
  "stages": [],
  "limitations": ["开始阶段未记录时间，不能恢复历史耗时"]
}
```

每个有真实记录的阶段使用 `name`、带时区的 `startedAt`/`endedAt`、本次 `attempt` 和 `evidence`（日志或工具报告路径）。资料、素材、HTML/布局、修复与交付缺哪段就写明；尚未结束的 `endedAt` 为 null。工具自身 duration 不冒充整个工作流墙钟时间；宿主等待/中断单列。恢复旧任务可以新增本次复核阶段，不能用本次时间覆盖旧任务。完整时间不可取得时 `status` 保持 `partial`，有记录不等于满足性能验收。

### 现场记录阶段时间

每个阶段开始和结束时执行，命令使用系统时钟，不接受手填时间：

```bash
python3 "$SKILL_DIR/scripts/workflow_timing.py" --bundle "$BUNDLE" start research
# 完成阶段的实际工作后再运行 end；其他阶段使用各自名称。
python3 "$SKILL_DIR/scripts/workflow_timing.py" --bundle "$BUNDLE" end research
```

重试同名阶段会保留前一轮记录并新增 attempt；未结束的阶段不能再次 start。工具仅记录观察到的区间，status 保持 partial，不证明整个工作流已计时。漏记阶段保持未知，不填估计的起止时间；估计只能单独说明，不能冒充观测时间。完整校验检查已提供时间的时区、先后顺序、是否超过 recordedAt 或当前时间（5秒时钟容差）。

`status: "complete"` 至少要求非空阶段列表且每段都有已观测的开始/结束时间；未知区间保持 partial。通过该一致性检查仍不证明全工作流阶段都已覆盖。

正式交付以`poster_workflow.py verify`及当前`status`为准，不能以本节的结构诊断代替。底层导出不再提供绕开review的正式路径，诊断图只写`draft/`。

## 失败与交付说明

调用 `poster_workflow.py finish --bundle "$BUNDLE"` 重跑verify并生成当前交付清单与完整回复。ready才有formalArtifacts；blocked/draft的正式文件列表为空，只提供草稿及诊断记录，意外出现的正式文件名PNG单列为未验证，不供作成品。最终回复使用delivery-reply.md的状态和文件身份。ready说明当前记录检查通过；draft/blocked必须对用户明确“草稿/未完成”。没有有效导出回执的PNG标为“未验证图片”，图片存在不等于交付通过。

失败清单的`allowedActions`仅为share-diagnostic、request-constraint-change、repair-and-recheck、stop；ready才允许deliver-formal。先向用户呈现已有带身份诊断图与具体失败，再请求允许调整；不要只弹选择问题而省略诊断，也不提供“知情豁免后正式交付”。接收原样草稿不改变blocked，改变约束后仍须完整重验。动作清单是工具协议，不能强制宿主遵守，实际聊天另行核查。

保留每条生产命令的真实退出码；不要通过shell管道或忽略错误把失败显示成成功。依赖故障按环境指南恢复，事实、素材、文字问题则修内容。不得降低阈值、排除必要文字或自写截图程序绕过失败。针对同一原因完成两轮修正仍失败时，记录已尝试的方法和剩余限制，停止该任务的盲目重试；继续修复需要新的事实或可执行方案。工具不能禁止宿主任意执行代码，是否遵守仍以会话和产物核查为准。


诊断报告图是新增报告，原海报嵌在外框下方，原文/字号/HTML画布保持不变。向用户推荐finish列出的报告图，不把内部原截图复制为普通成品名。报告图尺寸含外框，不能声称它是原样导出的指定尺寸PNG；如明确禁止带框派生图，只提供文字诊断。原图或报告图变动后重新生成并核对身份。脚本不能阻止宿主自行裁框、复制或截图，最终会话须独立核查。
