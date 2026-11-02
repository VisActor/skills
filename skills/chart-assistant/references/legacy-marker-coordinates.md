# 旧差异 coordinates 维护

仅在需要维护已有差异标注的 `coordinates` 定位时读取本文；不用于新建智能标注。新建业务比较统一用 [semantic-marker-anchors.md](semantic-marker-anchors.md) 的 `target.from/to`；自由文本 `position`、区域自由几何等不走本文流程。共享样式见 [markers.md 第 3 节](markers.md#3-差异标注的共享样式与旧配置保留)。

## 1. 定位数据与业务值

`coordinates` 是两个最终绘制 datum，不是任意 `{x, y}` 像素点。无变换时可以是明确的原始数据行；有筛选、排序、聚合、堆叠或百分比计算时，必须使用实际处理后的 datum。每端需要可靠的运行时 series 身份：

```ts
type MarkerDatum = Record<string, unknown> & {
  refRelativeSeriesId: string; // 对应运行时 series.userId
};
type LegacyDiffLocation = {
  coordinates: [MarkerDatum, MarkerDatum];
};
```

运行时用 `refRelativeSeriesId` 找到 series，再结合其维度/指标字段、轴 scale、绘图区布局和方向把 datum 转成像素；`coordinatesOffset` 在此基础上追加展示偏移。

维护时区分以下概念；这是解释结构，不是新增的 DSL 字段：

```ts
type DiffMarkerAnchor = {
  datum: Record<string, unknown>; // 定位维度、系列及转换后字段
  seriesId: string; // 写入 refRelativeSeriesId
  anchorValue: number; // 视觉定位使用的累计值或累计位置
  metricValue: number; // 标签计算使用的总量、层级值或业务值
};
```

保存态用转换后的 datum 承载 `anchorValue`，并用内部 `_originValue_` 缓存两端 `metricValue`。二者在普通非堆叠图可能相同，在堆叠、百分比和瀑布图中经常不同。不能把 `_originValue_` 当坐标字段，也不能拿累计视觉位置直接计算业务增长率。

| 场景 | 视觉定位依据 |
| --- | --- |
| 普通堆叠总计 | 累计总值 |
| 层级差异 | 对应层级的累计边界 |
| 百分比层级 | 累计百分比边界 |
| 瀑布图 | 累计起止位置 |

这些定位依据不替代标签业务口径；尤其层自身数值/占比不能与累计边界混用。标签内容和年度声明规则统一见 [差异语义](semantic-marker-anchors.md#3-差异from--to)。已有 `pp/percentdiff` 和未声明年度的旧配置保留历史公式及周期口径，不在普通保存时迁移。

## 2. 维护步骤

1. 只改样式或文字时，直接保留现有定位，不重新构造 datum。同步保留 `_originValue_`、stack/total datum、瀑布 tag、偏移和其他已有编辑元数据，除非本次操作明确需要修改它们。
2. 确需修改定位时，先用完整业务键从当前 `browserData` 或 runtime readback 找到两个最终 datum，并确认各自所属 series 的稳定 ID。若用户提供显式 series `id` 的 VChartSpec，只有目标宿主已验证该 ID 原样进入运行时，才可引用。
3. 核对定位 datum 中的视觉值与标签所需业务值。复杂变换下不能把原始数据行直接替换进去；身份或转换值不可靠时保留可恢复配置并说明原因，不猜测或删除。
4. 仅更新授权范围内的定位及关联元数据，保留 `id/name` 和用户样式。`total-diff-line`、`hierarchy-diff-line` 的旧 spec 保留 `type:"type-step"`；`growth-line` 沿用普通连接线。
5. 回读并检查两端命中、标签数值、展示位置及本次涉及的编辑行为。保存重开、同步或拖拽能力须分别取得目标卡片的实际证据。

两端关联结构如下，示例中的 datum 和 ID 必须来自可靠读回：

```ts
coordinates: [
  { ...startRuntimeDatum, refRelativeSeriesId: startSeries.userId },
  { ...endRuntimeDatum, refRelativeSeriesId: endSeries.userId }
];
```

普通内置模板没有“预声明 runtime series ID”的公共字段，`modelSpec.id` 也不创建 series 身份。上述读回仅用于已有坐标配置的维护；新建智能标注直接生成业务 target，不再从零构造 coordinates，也不为获取身份擅自切换 VChartSpec。用户要求原生导出时由 Core 实际渲染和导出，保持作者定义与导出投影分离。

## 3. 保留与验证边界

- `target` 与 `coordinates` 不混写；旧坐标不自动反推业务目标。展示偏移按原契约保留。
- 不要求业务 Agent 移植内部候选 pair、鼠标反算、拖拽吸附或布局算法；可编辑能力按当前运行时及 [保存与编辑规则](semantic-marker-anchors.md#9-保存与编辑共同规则) 判断，不因使用旧配置就概括为不可编辑。
- 源码 coordinate/spec builder 测试用于核对定位与缓存行为；Skill eval 验证旧配置保留、可靠身份和歧义处理。真实渲染、保存重开、交互与同步由目标运行时验证，静态检查不能替代。
