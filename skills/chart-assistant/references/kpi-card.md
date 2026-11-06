# 原生指标卡 kpiCard

[完整示例：收入、毛利率与费用](../examples/kpi-card.json)

- 用途：突出当前指标值、已给出的同比/环比和完成率。标准表每行生成一张卡，单行即为单卡，多行共享一个卡组元素。
- 数据：`mappingSpec.name/value` 绑定名称和主值。可选 `key` 为稳定唯一编码，`unit/yoy/mom/completion/direction` 绑定单位、同比、环比、完成率和业务方向。1 越高越好，−1 越低越好，方向未提供时变化值为中性色。相对变化 % 与百分点 pp 可按行保留各自口径，不自动计算。
- 格式：数值 34.8 配单位 % 显示 34.8%；源百分比格式数值 0.348 也可显示 34.8%。完成率以比例表示，0.875 显示 87.5%；空值与零分开显示。
- 布局：`config.kpiCardLayout` 支持 `maxColumns/minCardWidth/columnGap/rowGap/padding`。宽度决定换列，高度始终贴合实际内容，拖拽和重开不保留底部留白，字号沿作者配置。
- 样式：`config.kpiCardStyle` 包含 `card/name/value/unit/accent/comparisonLabel/comparisonValue/trend/completionLabel/completionValue/progress`。按部件配置字号、字重和颜色，卡面可配填充、描边、圆角及内边距。局部覆盖用 `kpiCardStyleMap:[{target:{selector:{编码:"expense"}},value:{card:{stroke:"#475569",lineWidth:2}}}]`，缺编码时可用原表内唯一名称定位。
- 编辑：卡组整体移动、改变宽度后自动换行，部件点选与卡片多选批量改样式；指标名称、单位和绑定值支持双击源单元格编辑，Esc 提交。同比/环比/完成率固定标签不改文案。格式化数值进入编辑时保留原值精度，保存态保留来源、映射、布局与样式。
- 边界：每卡直接显示源行。时间序列表转单个汇总 KPI 时须先明确选期和聚合口径。双向换型沿用原表，在目标映射明确时直接切换，否则选择字段；缺少字段或量纲冲突时保留当前图。不自动生成坐标轴或系列标注。实现能力须与宿主实际核心版本匹配。

### 创建与换数

单卡最小输入如下。显式绑定名称与主值，单位来自用户输入。

```json
{
  "commonOption": {
    "elements": [{
      "type": "chart",
      "options": {
        "chartType": "kpiCard",
        "data": {
          "type": "standard",
          "value": {
            "columns": ["指标", "本期", "单位"],
            "data": [{"指标": "续费收入", "本期": 460, "单位": "万元"}]
          }
        },
        "config": {
          "mappingSpec": {"name": "指标", "value": "本期", "unit": "单位"}
        }
      }
    }]
  }
}
```

多指标时向同一标准表添加行，每行生成一张卡；一个图表元素包含整组卡。需要每卡关联自己的月图时，采用[月度指标卡配方](business/recipes/monthly-kpi.md)，在物化后把底板、KPI 元素和月图按卡分组。

同比、环比和完成率都由输入提供。同比／环比的裸数沿列格式展示，需要百分比时使用明确的百分比列格式或带 % 的文本；百分点可用带 pp 的文本。完成率裸数按比例读取，0、1.08 分别显示 0%、108%，缺失时省略该项。主值缺失显示 —，数值零显示 0。修改主值时同时提供新的派生结果，不能期待卡片重算。

### 布局与样式字段

可选属性仅按用户要求写入，省略时继承主题与模板默认值。以下字段均位于 `options.config`。

| 对象 | 常用字段 |
| --- | --- |
| `kpiCardLayout` | `maxColumns` 为每行列数上限，`minCardWidth` 为最小卡宽，`columnGap/rowGap/padding` 控制列间距、行间距和组内边距 |
| `kpiCardStyle.card` | `fill/stroke/lineWidth/cornerRadius/padding/textAlign`，文字对齐使用 left、center 或 right |
| `kpiCardStyle.name/value/unit/comparisonLabel/completionLabel/completionValue` | 各文字部件的 `fontSize/fontFamily/fontWeight/fill` |
| `kpiCardStyle.comparisonValue` | 同比／环比的 `fontSize/fontFamily/fontWeight`；其颜色使用下述 trend 方向色 |
| `kpiCardStyle.accent` | `visible/fill/width`，控制卡侧强调条 |
| `kpiCardStyle.trend` | `showArrow/favorableFill/unfavorableFill/neutralFill`，方向判断使用所绑定的 direction |
| `kpiCardStyle.progress` | `visible/height/cornerRadius/fill/trackFill/showTarget/targetFill`，`showTarget:true` 显示 100% 参考刻线，完成率文字保留超过 100% 的真实值 |

样式优先级为单卡覆盖、整组显式样式、主题与模板默认值。`kpiCardStyleMap.target.selector` 只写一个字段，必须是 mappingSpec.key 所绑定的原表字段及其唯一值，未绑定 key 时使用 name 绑定字段及唯一名称。重名或空键无法可靠定位单卡。同源单元格更新或重排行时读取最新编辑态，保留映射、布局和仍适用的局部覆盖，按同一业务键定位。替换数据来源或范围时沿用宿主的重置规则，重新核对映射和局部覆盖。

### 字符级样式

`name/value/unit/completionValue` 可在对应样式部件内保存 `richText:{text,textConfig}`，同比／环比使用 `comparisonValue.richText.yoy` 与 `comparisonValue.richText.mom` 分别保存。例如单卡名称“续费收入”可写 `name:{richText:{text:"续费收入",textConfig:[{text:"续费",fontWeight:"bold"},{text:"收入"}]}}`。需要仅修改一张卡时，将此部件放入该卡的 `kpiCardStyleMap[].value`。

`text` 必须匹配当前源文字，片段文本拼接也须与它一致。数值字符样式由宿主按实际格式映射；舍入或源值变化导致无法对齐时，回到部件默认样式。读取并保留当前作者态，不把旧值的字符样式无条件套到新值。同比／环比的字符片段可带自己的样式，普通部件级颜色仍由 trend 方向色控制。

KPI 模板没有笛卡尔轴和普通数据系列，使用上述专属文字、趋势和进度样式。它不需要 x/y 映射、轴标题或普通系列标签。创建后从实际宿主回读模板、数据和卡片数量；宿主尚未注册 `kpiCard` 时说明能力缺口，替代呈现需符合用户授权。宿主支持程度以实际构建为准。
