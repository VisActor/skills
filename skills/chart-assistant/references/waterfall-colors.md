# 普通瀑布图的语义配色

新建单维度、单指标 standard `waterfall` / `waterfallDecrease`，且没有用户指定配色时，默认用总计、增加、扣减三种可区分颜色，让读者直接看出桥接方向。已有图表只有获授权调整配色/整体展示时才应用。多指标堆叠、业务分组、风神或未知模板身份不套此窄规则，保留已有分类编码并先确认实际模型。

## 先识别角色，再选色

| 数据/模板 | 角色 |
| --- | --- |
| `e` / `E` 或已确认的模板总计状态 | 总计，优先于正负判断 |
| 普通waterfall正增量 / 负增量 | 增加 / 扣减 |
| waterfallDecrease正输入 / 负输入 | 扣减 / 增加，输入符号不等于累计方向 |
| 零值 | 无变化，不称增长、下降或异常；当前groupBySign把零归入非负组，没有独立零色组，不虚构第四个组键 |

数字起点若只是普通增量，不能仅因在第一行就改成总计；`firstToTotal/addLastTotal` 等已有语义保持原值，不为换色改写原始数据、e标记或累计关系。

方向色只表示增加/扣减。收入增加、费用下降等是否有利要由指标语义判断；没有业务定义时不把正值叫“好”、负值叫“坏”。

优先保留用户显式配色及已知宿主的方向色。没有已知方向色时，可明确选择总计深蓝 `#0A345E`、增加蓝 `#1A82EB`、扣减暖红 `#DC6B6B`；它们表示累计方向，不宣称是宿主自动提供的槽位。方向还应由正负标签、累计位置或必要图例表达，避免只靠颜色；不强制在副标题重复配色说明。若采用其他已有配色候选，三类角色仍需可区分，不强制红绿。

## 当前可执行配置：中文、单指标窄入口

当前中文内置单指标模板使用 `series-waterfall`；开启按符号编码的现有 `groupBySign`。此处 `stackType:"group"` 是内部单指标按符号形成样式组的入口，不是把原图改成多指标分组或改数据。只在本节单指标前提下生成，已有多指标图不强制切换。

例如原指标字段为“数值”：

```json
{
  "modelSpec": [{
    "id": "series-waterfall", "specKey": "series", "specIndex": 0,
    "spec": {"stackType": "group", "groupBySign": true}
  }],
  "dataGroupSpec": {
    "数值_fieldLink__editor_waterfall_total": {"bar": {"style": {"fill": "#0A345E"}}},
    "数值_fieldLink_正值": {"bar": {"style": {"fill": "#1A82EB"}}},
    "数值_fieldLink_负值": {"bar": {"style": {"fill": "#DC6B6B"}}}
  }
}
```

将以上字段合并到 `options.config`，保留其他modelSpec和dataGroupSpec条目。`waterfallDecrease` 要交换正值/负值组的增加色与扣减色；总计色保持不变。如A=e，B=4、C=3、D=1，A为总额8，B/C/D都使用扣减色，不能由于输入为正数涂增加色。完整示例见 [普通瀑布](../examples/waterfall-semantic-colors.json) 和 [递减瀑布](../examples/waterfall-decrease-semantic-colors.json)。

组键由原始指标名与运行时语言生成：英文正负后缀为 `Positive` / `negative`，总计后缀仍为 `_editor_waterfall_total`。不知道宿主语言或实际series身份时先读取真实模型/组键，不跨语言猜键，也不只写三组颜色却漏开groupBySign。上述三组键只适用于本节新建group或已确认采用group的现有模型。已有stack模式须读取真实组键：源e在stack路径仍可能归原指标组，firstToTotal/addLastTotal的总计键也可能不同，不能照抄此三键或静默切换group。已有模型仅更新groupBySign可能不触发分组重建，需要同时提交已确认的原stackType，不能为了触发更新而改变既有模式。

核对：三个角色命中真实组、递减方向正确、总计与零值未误判、数据/顺序/累计结果不变，模板专用标签继承。配置正确不等于目标飞书宿主的渲染、编辑和同步已验收。
