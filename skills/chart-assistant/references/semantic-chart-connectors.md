# 图表连接器语义 target

用于同一画布的两个数据图元之间的 `chartConnectorLine`，不是普通图形连接线，也不是图表内部的 `barLink`。首次生成时将两张图表和连接器一次写入 `commonOption.elements[]`；模型不需要先取得 runtime datum、series ID 或 points。

## 输入

```ts
interface ConnectorEndpoint {
  chartId: string | number;
  selector: Record<string, string | number | boolean | null>;
  measure?: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    | 'point' | 'outer-start' | 'outer-end' | 'inner-start' | 'inner-end'
    | { vertex: number }; // 非负整数
}
interface SemanticChartConnector {
  id?: string | number;
  type: 'chartConnectorLine';
  options: {
    target: { from: ConnectorEndpoint; to: ConnectorEndpoint };
    lineType?: 'line' | 'hv' | 'vh';
    style?: { lineStyle?: object; startSymbol?: object; endSymbol?: object };
    zIndex?: number;
  };
}
```

- `chartId` 必须引用同一 commonOption 中显式定义且唯一的 chart element ID；字符串和数字按真实类型匹配。图表自身仍须显式布局，语义连接器不需要 `position` 矩形。
- `selector` 使用原始数据字段与值，至少一个字段；多个字段共同定位业务对象。保留值的类型，空字符串字段名可用于已有数据兼容。不填写内部 `_editor_*` 字段或数组索引。
- `measure` 为原始指标字段名。宽表中 `selector:{date:"x1"}, measure:"Navel"` 定位 Navel 指标对应的堆叠层，而不是把 Navel 当作维度值。仅当候选指标唯一时可省略。
- `style`、`lineType`、`zIndex` 沿用现有连接器定义，省略时继承手动添加的默认值；不新建另一套样式协议。
- 同一 `options` 禁止同时提供 `target` 与手动 `data/points`。旧的完整手动配置继续兼容，不能把 target 塞入已有保存态的 attribute。

## 连接位置

下表描述现有手动锚点与 DSL 名称的对应关系，不是所有模板的首次解析支持清单；仍须满足下节字段映射与实际可选锚点条件。

| 图元 | target.position | 对应手动位置 |
| --- | --- | --- |
| 柱形、瀑布柱 | `top-left/top-right/bottom-left/bottom-right` | `tl/tr/bl/br` |
| 折线、面积、雷达、散点 | `point` | 实际数据点锚点 |
| 饼图、环图、玫瑰图 | `outer-start/outer-end/inner-start/inner-end` | `outerStart/outerEnd/innerStart/innerEnd` |
| 漏斗 | `{ "vertex": 0 }` 等 | 现有顶点编号 |

位置沿用手动连接器的标准方向语义；横向图和轴反向由原有位置映射处理，不是永久固定的屏幕方位。只能使用目标图元实际提供的锚点：例如没有内圆锚点时不能猜测 inner-start 的坐标。

## 解析与生命周期

当前首次语义解析要求 standard 来源且能从当前系列唯一追溯原始指标和维度映射，并非所有 standard 模板均支持。常规系列使用模板的系列数据映射；Pie/Funnel 还支持唯一 dataId 对应的原始指标 cell。Rose/Waterfall 等模板可能合并多个 cell，缺少唯一映射时仍不支持，不能仅按图型名称或 datum 同名字段承诺可用。其他来源不在本次支持范围。运行时先创建图表，等待实际图元就绪，再根据业务字段、指标和位置取得真实锚点，生成与手动添加一致的 `data + points`。

转换只发生一次，成功后不保留 target 对端点的持续控制。数据更新、换图型、转置、轴反向、最小柱高、图表位置变化、删除和手动编辑均继承既有连接器逻辑及限制，不增加另一套重解析生命周期。

目标结构或 chartId 引用错误在加载前报错。图元就绪后若目标缺失、候选歧义、来源或锚点不支持，对应连接器不创建，报告具体错误；不要默认取第一项、猜坐标或以普通直线替代。基础图表仍可完成加载。

验收不能只看 `afterAllLayerReady`：检查 `layer.commonOptionErrors` / `commonOptionError` 事件，并回读最终保存态，核对连接器数量、两端 chartId、业务对象和位置。结构校验通过不代表实际图元定位或视觉验收通过。

## 完整示例

- [橙子饼图 → 品种堆叠柱](../examples/semantic-connector-orange-breakdown.json)：Oranges 扇区两端连接 Navel 顶部与 Other 底部，使用 `vh`。保留原配置 `region-0` 的 `stackInverse:false`，使 Other 在底层、Navel 在顶层；原示例橙子为 61、右侧合计 67，仅用于定位能力测试，不宣称数值一致的拆解。
- [PC 环图 → Desktop/Laptop 条形图](../examples/semantic-connector-pc-breakdown.json)：PC 扇区两端连接两条横柱，使用 `hv`。保留原始空字符串维度字段；不得擅自更名再用旧 selector。

示例保留原始业务数据及手动端点含义，简化了视觉样式和宿主缓存；不承诺像素级复刻截图。需要调整样式时沿用现有组件定义。
