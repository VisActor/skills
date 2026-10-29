# 来源证据与交付检查

工具重放**保存的原始响应及定位**，比较交付值与计算结果；不会判断网页权威性、原表是否选对或文字断言是否成立。原始快照和哈希证明可追溯与完整性，语义仍需实际阅读。

## 先捕获原表，再生成数据

1. 新网页来源用包内工具保存真实HTML/JSON响应，不手写一份同数JSON代替原文：

```bash
python3 "$SKILL_DIR/scripts/capture_source.py" --bundle "$BUNDLE" --id stats --url "$SOURCE_URL"
python3 "$SKILL_DIR/scripts/source_evidence.py" --bundle "$BUNDLE" --tables evidence/stats/capture.json
```

单次请求30秒，最多16MiB；失败保留实际原因，选择可读取的可靠原表。动态网页只能使用宿主实际导出：`--input "$EXPORTED_FILE" --exported-url "$SOURCE_URL" --acquisition-note "本次实际导出工具及获取记录"`。不能把手写摘要注册成导出。用户原表用`--input`复制并标记user-input，不包装成独立官方核实。每个id不可覆盖；新获取使用新id。

2. 查看实际表格，声明`fact-review.json`的comparisons；先创建`data.json`目标结构，再显式运行data生成字段。下例是合成结构示意，必须换成当前原表的实际表头、位置和范围：

```json
{
  "status": "pending",
  "checks": [],
  "comparisons": [{
    "dataPointer": "/points",
    "evidence": {
      "capture": "evidence/stats/capture.json",
      "locator": {"table": 0, "headerRow": 0, "headers": ["scope", "games", "points"], "rowKey": {"column": 0, "text": "career"}, "column": 2},
      "parse": "number",
      "context": {"entity": "本次人物", "metric": "得分总量", "period": "本次时期", "scope": "本次统计范围", "unit": "分"}
    }
  }]
}
```

HTML定位为table序号、表头行及完整表头、数据行或唯一rowKey、列，序号从0开始。colspan按原表逻辑列保留覆盖范围：汇总行的合并标签可作唯一rowKey，但目标值须是单一原始单元格；不能将合并格扩成多个事实。表头须为无合并的完整行，rowspan/嵌套/异常结构明确拒绝，不能自动猜列。`--tables`同时显示rows和cells的原始位置。JSON原文用`locator: {"pointer":"/rows"}`，可取整组对象/数组。`parse`省略保留原值；number接受`.524`、`-.5`等明确十进制，percent只解析带%文本为比例，不自动猜单位，text保留字符串。HTML非UTF-8时在evidence指定encoding；先实际核对解码结果。

3. `dataPointer`/JSON locator使用JSON Pointer；父级结构须存在，目标不能重复或重叠。数组保留顺序；9.0与9数值相等，字符串、布尔及null分别处理，不加容差。显式生成：

```bash
python3 "$SKILL_DIR/scripts/poster_workflow.py" data --bundle "$BUNDLE"
# 实际复核原文、人物、指标、时期、范围与单位；填写checks并更新fact-review.status。
python3 "$SKILL_DIR/scripts/poster_workflow.py" facts --bundle "$BUNDLE"
```

data先计算全部声明字段，定位失败不改data；成功更新声明字段并生成`evidence-extract.json`，再运行facts。fact-review仍pending时data可能已生成，但动作保持未完成，不能据此声称事实通过。facts每次重新解析raw，不依赖extract自证；raw、定位或提取记录变化使旧结果失效。build先执行facts，不为通过而改源。

## 派生值与同口径关系

comparisons可加`denominatorEvidence`（另一份完整evidence定位），或JSON同文档的`denominatorPointer`，不能同时使用；HTML分母必须完整定位。可加multiplier及decimals（0–12，ROUND_HALF_UP）。零分母产生null，不能改为0；不能用舍入场均倒推精确总量。

源表给出的舍入场均可直接提取；同口径总量和场次同时展示时，声明并核对关系，冲突先查口径，不通过改写原文消除。例如：

```json
{"relations":[{"dataPointer":"/average","numeratorPointer":"/points","denominatorPointer":"/games","decimals":1}]}
```

工具只重算所声明关系，不自动理解字段语义。选错但结构合法的列需独立核查发现。

## 覆盖与固定附件兼容

`data.json`全部数值及display-map中所有kind=value的指针都需来源，包括数字字符串和未上图字段。整组比较覆盖子字段，使用同一严格JSON语义。文字claim在checks保留实际原文、完整限定与独立语义判断，见[展示事实绑定](display-bindings.md)。

固定用户JSON仍可使用旧式`evidence: {"file":"source.json","pointer":"/count","source":"用户原始附件位置"}`；不改受限原稿。旧式file/pointer的source若包含网页URL会被拒绝，须迁移为capture加raw定位，不能靠两份同数JSON满足网页证据完整性。旧bundle仍可只读诊断，不能继承旧成功回执。

`evidence-check.json`记录实际值、期望值、原始字节哈希、定位及差异。通过表示可重放的一致性；来源权威性、文字范围与图片条件仍需分别核查。

## 人物素材的具体依据

先选择能核实人物、作者、来源和复用条件的图片，再定姿态与布局。搜索命中、媒体署名、下载成功不构成使用依据。没有合适全身图时适配半身图；仍无依据就保留草稿/发布限制，不声称交付可公开使用。

manifest 的图片项保留 `file`、`sourceFile`、`sourcePage`、`usageTerms` 及实际处理步骤。把来源页的具体署名、条款及改动条件保存到 `evidence/`。用户提供图片时，来源可以是用户附件位置及其说明，不强制为原始私有照片添加公网 URL；`sourcePage` 也可以是该输入的位置说明。

`acceptance.json` 使用单独的 `usage` 维度，不把人物身份正确与图片使用依据混为一谈：

```json
{
  "usage": {
    "status": "passed",
    "assets": [{"file": "assets/subject.png", "status": "passed", "basis": "本次实际使用条件、署名及改动说明", "evidence": "evidence/portrait-source.txt"}]
  }
}
```

找不到依据时使用 `status: "unknown"` 并写明限制。工具会拒绝把它当作就绪交付；不会自动推导授权范围，也不要求用户逐步批准普通取证。

manifest每张位图还需`usageStatus`，见[素材契约](manifest-contract.md#素材状态与旧记录迁移)。acceptance是审阅结论，不能把manifest的unknown/restricted提升为verified；无具体条款时保留失败，不把媒体署名或“个人演示”写成允许用途。


文字断言也必须连接实际展示，见 [展示事实绑定](display-bindings.md)。`checks[].id` 唯一，`evidence` 为实际保存的包内原文文件；来源、观察文字与限定语不能为空。数值文件正确不代表HTML额外数字正确，review会单独核对展示映射。工具不判定原文是否支持该断言，仍需实际阅读。
