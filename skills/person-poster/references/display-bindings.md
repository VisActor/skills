# 展示事实绑定

在全内容粗排时读取本节。来源链为实际原文 → data.json / fact-review.json → display-map.json → 实际页面。映射检查发现同步遗漏，不证明原文真实，也不能判断“标签”是否偷藏事实。

manifest 声明 `"displayBindings": "display-map.json"`，映射结构：

```json
{
  "version": 1,
  "dom": [
    {"id":"count-label","kind":"label","text":"场次"},
    {"id":"count","kind":"value","dataPointer":"/games","format":{"style":"decimal","places":0,"grouping":true}},
    {"id":"scope","kind":"claim","dataPointer":"/scope","factIds":["scope"]}
  ],
  "charts": [{"id":"trend","data":[{"specPointer":"/data/0/values","dataPointer":"/seasons"}]}]
}
```

对应的 HTML：

```html
<span data-display-id="count-label">场次</span>
<strong data-display-id="count">1,234</strong>
<p data-display-id="scope">仅统计联赛常规赛。</p>
```

- 每个可见文字片段必须有唯一 `data-display-id`，同一事实重复展示使用不同 id、相同数据 pointer。绑定元素只包含直接文字和可选 `<br>`；复合句的数值、单位可拆为各自 span。不要把整页或嵌套容器当作一个断言覆盖后代。
- `value` 指向 data.json 标量。`text` 格式只接受字符串；`decimal` / `percent` 接受有限数字，必须给出 `places`（0–12），可选布尔值 `grouping`。用十进制四舍五入；percent 将比例乘100再加百分号。null 显示“—”，不能填0。单位独立为label；日期/范围使用经过核查的字符串。
- `claim` 对应完整展示说法，须与 data 字符串及每个 factIds 对应的 `checks[].claim` 一致。fact-review 中每项含唯一 `id`、`status: "passed"`、`source`、`observed` 和包内原文路径 `evidence`。改限定词就需要重新核对。
- `label` 用于单位、栏目名称等固定文案，精确匹配 `text`。包含阿拉伯/全角数字会被拒绝；姓名、中文数字、“首位”等无数字事实仍由独立语义复核决定是否应改为claim。不要将事实改标label来通过检查。
- 图表为每个原生 spec 数据集 values 提供映射，包括组合图的子系列；类别、顺序、null和数值均匹配 data.json。分类改名和派生值先进入已核查数据。原生坐标刻度、数据标签不需要DOM映射；额外图表注释仍需事实/语义复核。

review 同时保存 `display-snapshot.json`（实际采集）与 `display-check.json`（映射结果及 labelsForSemanticReview）。检查全部可见 DOM 文字，未绑定项不能忽略；CSS生成文字、SVG文字、未登记canvas或其他无法可靠采集的文字会列为未测。必要文字保持可编辑；照片中的偶然文字不算DOM事实，但不要把必要信息嵌入图片逃避检查。

## 检查与迁移

完成包含所有文字、图表、单位和脚注的粗排后运行 `poster_workflow.py layout --bundle "$BUNDLE"`，查看 `layout-review/display.png` 和映射清单，再做精细构图。最终仍运行 review/export/verify/handoff。

旧HTML仍可打开，旧bundle仍可诊断，但缺失展示映射不能得到当前规则下的正式通过。补齐映射和文字原文，重新review/export/verify；旧版成功回执不自动升级。映射、数据、原文或HTML改变会使相应检查失效，不编辑历史证据来伪造当前通过。

## 生产构建与局部同步

新建作品从init的空根添加直接文字占位，例如`<strong id="count"></strong>`；按前述映射声明value/claim/label，避免在HTML再次手写数字。图表使用完整的最终数据数组，类别、字段名和顺序先在有来源核对的data.json中确定。

```bash
python3 "$SKILL_DIR/scripts/poster_workflow.py" facts --bundle "$BUNDLE"
python3 "$SKILL_DIR/scripts/poster_workflow.py" build --bundle "$BUNDLE"
```

build先将失效dataPointer、factId、format及目标集中写入build-check.json；删除仍被展示引用的数据会失败，不静默清空映射或删文字。修正声明后，build在来源比较通过后同步已声明DOM、原生spec的values，生成charts.generated.js并运行layout。HTML图表通过相对script src加载该文件，不写另一份__INFOGRAPHIC_CHARTS__赋值。所有声明在临时目录验证后再更新：重复/缺失/嵌套目标、无证据claim、图表映射不完整均失败，不覆盖原始文件。其余HTML/CSS/脚本保留，SVG自闭合元素可保留但不能当作普通文字同步目标。构建后的实际可见覆盖、大小写变换、可读性等仍由layout/review检查，构建不是验收通过。

旧bundle及已有原稿先review诊断；受限编辑不自动build改变用户锁定内容。需要局部静态文案同步时仍可使用`sync_display.py --bundle "$BUNDLE"`预览，`--apply`才写入。该低层工具不重写图表脚本，也不核实来源真伪。


数值百分号保持单一语义：比例0.524使用percent格式显示52.4%；已存百分数52.4使用decimal格式和单独的%单位label，不能在HTML另加未声明字符。来源更换后重新核对署名与范围，不能保留旧机构名。buildPassed不代表layoutPassed；最终仍须实际阅读图和全部展示覆盖通过。
