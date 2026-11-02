# BarLink 系列连接线契约

`barLink` 是堆叠柱/条图相邻类别之间的系列边界连接组件。它不是普通数据 label 的引导线，也不是 `seriesLabel.label.line`。

## 1. 保存结构

```ts
type BarLinkConfig = {
  enable?: boolean;
  spec?: {
    /** total 连接累计堆叠边界；value 连接当前分段自身数值。 */
    linkType?: "total" | "value";
    /** 是否绘制相邻边界之间的填充面。 */
    doFill?: boolean;
    linkStyle?: {
      lineStyle?: LineStyle;
      startSymbol?: BarLinkSymbol;
      endSymbol?: BarLinkSymbol;
    };
    areaStyle?: FillStyle;
    label?: {
      visible?: boolean;
      style?: TextStyle;
      formatConfig?: FormatConfig<"percentage" | "abs" | "value">;
    };
    styleMap?: Record<
      `line-${string}` | `area-${string}` | `label-${string}`,
      LineStyle | FillStyle | TextStyle | false
    >;
  };
};
type BarLinkSymbol = {
  visible?: boolean;
  originSymbolType?: "arrow" | "solidArrow" | "hollowArrow" | "solidCircle" | "hollowCircle";
  style?: { color?: string };
  size?: number;
};
```

`linkType` 只有 `total | value`；`straight`、`curve` 等不是该字段的合法值。`label.formatConfig` 默认按 `percentage`、`fixed: 0` 展示；当起始值为 0 时百分比结果不可解释，业务生成器应隐藏百分比或改用 `value/abs`。

`LineStyle`、`FillStyle`、`TextStyle` 和 `FormatConfig` 的公共字段分别见 [model-spec.md](model-spec.md) 与 [data-and-formatting.md](data-and-formatting.md)。源码声明的 `styleMap` union 只显式列出 line/area style，但渲染和编辑路径也确实读取 `label-*` 的 `TextStyle`；上面的类型按实际持久化行为列出三类。

底层 `BarLinkLineAttrs` 还有 `data` 与 `language`，但 `IChartElementAttribute.barLink.spec` 明确只 Pick 上面六个业务字段。`data` 是运行时根据 series/stack 计算的绘制数据，`language` 由宿主环境注入；两者都不是 LLM 应写入的 barLink 持久化 DSL。

## 2. 支持范围

当前 `barLinkChartList` 明确包含：

- 内置：`bar`、`barPercent`、`horizontalBar`、`horizontalBarPercent`。
- 风神：`column`、`column_percent`、`bar`、`bar_percent`。

不把 `barGroup`、`horizontalBarGroup`、瀑布、Mekko 或 dual axis 自动视为支持。接口注释中的历史列表可能比实际能力常量宽；生成时以运行时 `barLinkChartList` 和实际 customMark 是否生成作为验收依据。

`barLink` 默认关闭。对内置 `bar`、`barPercent`、`horizontalBar`、`horizontalBarPercent`，仅当用户明确要求，或类别是时间/阶段/已声明顺序、堆叠层在相邻类别间含义一致、且任务明确比较相邻累计总量或构成边界变化时，首次创建才写 `options.config.barLink:{enable:true}`。无序类别、排名/独立快照、层集合不一致、单层、group、密集或难解释的正负/零基数保持关闭。只需开关时不要补写 `spec`，继承运行时默认外观；`spec` 仅在用户要求连接类型、填充或标签时填写。

## 3. 单元素 key 策略

运行时先为每一对相邻类别生成一条 `BarLinkLineDatum`。其 `id` 若存在则使用该值，否则使用当前 `data` 数组的零基绘制索引。三个可编辑子元素共用同一个 datum identity，并加不同前缀：

```text
line-${datum.id ?? drawIndex}
area-${datum.id ?? drawIndex}
label-${datum.id ?? drawIndex}
```

例如同一连接 datum 可能对应 `line-0`、`area-0` 和 `label-0`。这些 key：

- 不是 series model `id`；
- 不是 `dataGroupSpec` 的 groupKey；
- 不是类别值协议；
- 默认回退索引时会因筛选、排序、数据同步、类别插入/删除而漂移。

编辑已有图必须从被 pick 的运行时 node `id` 或当前 `barLink.spec.styleMap` 读取 key。LLM 没有物化结果时只能写全局 `linkStyle/areaStyle/label`，不能猜 `line-0` 命中特定业务连接。

## 4. 覆盖与删除

- 全局线：`barLink.spec.linkStyle`。
- 全局填充面：`barLink.spec.doFill + areaStyle`。
- 全局标签：`barLink.spec.label`。
- 单条覆盖：`barLink.spec.styleMap[nodeId]`。
- 单条重置/隐藏命令：`styleMap[nodeId] = false` 或 `{ visible:false }`，具体由 editor update-call 规范化。

当最后一个可见 label 被隐藏时，运行时会关闭 `label.visible` 并为全部 label node 维护 false 项；当最后一个填充面被隐藏时会关闭 `doFill`。因此不要仅在离线 JSON 中删除最后一个 styleMap key并假设全局开关会自动同步。

## 5. 示例

完整图开启连接线只需要：

```json
{"barLink":{"enable":true,"spec":{"linkType":"total","doFill":false,"label":{"visible":true,"formatConfig":{"content":["percentage"],"fixed":0}}}}}
```

单元素 patch 见 `examples/bar-link-style-map.json`。其中 node key 必须已经由当前 runtime 物化。
