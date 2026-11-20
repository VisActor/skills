# 点标注：文字偏移与引线配置

先按[承载方式](data-driven-design.md#5-选择标注承载方式与引线)确定该说明属于数据点标注：需要随 datum 变化时使用本流程；固定画布说明、跨元素连接或多图公共文字使用相应画布元素。业务目标先按 [语义点标注](semantic-marker-anchors.md#6-点一个业务对象) 确定；本流程不扩大模板或来源支持。四象限角落名称使用独立的 [四角布局](semantic-marker-anchors.md#71-四象限名称的四角布局)。

## 1. 保留目标，生成候选位置

先依据已知数据和映射确认业务对象唯一；已有运行时诊断显示目标未解析、隐藏或不支持时处理对应原因。文字偏移不能修复目标问题。

新生成的说明文字使用 `itemContent.offsetX/offsetY` 安排位置，引线按参考形态与阅读路径选择。`itemLine.type` 已支持 `type-s/type-do/type-po/type-op/type-arc/type-cubic`；圆弧可设置 `arcRatio`，平滑反曲使用 `type-cubic`，箭头由 `startSymbol/endSymbol` 分别控制，无需引线时明确隐藏。不把所有说明强制转成 `type-do` 折线。偏移是相对锚点的逻辑像素：负 X 左、正 X 右、负 Y 上、正 Y 下；不是数据值、绘图区百分比或截图像素。下面仅是 China 点的一个左下折线候选：

```json
{
  "id": "a08-scatter-china",
  "name": "mark-point",
  "target": { "match": { "Country": "China" } },
  "itemContent": {
    "type": "text",
    "offsetX": -58,
    "offsetY": 28,
    "text": { "type": "rich", "text": [{ "text": "China观察点" }] }
  },
  "itemLine": { "type": "type-do", "visible": true }
}
```

先依据数据点附近标签方向、图形分布、文字长度和卡片尺寸选一处候选空白：上方已有数值标签时优先考察侧方或下方；末端已有系列名称时考察另一侧；贴近边界时向内放置。这只是配置选择依据，不保证实际图面一定有足够空间。已有的用户显式位置或手动拖动结果优先保留；仅当用户要求调整相应标注位置时才修改它们，不能因重新生成或刷新统一重置。

弧线优先短路径和小曲率；`arcRatio` 随偏移、落点与目标尺寸一起选择，不能把较大曲率及长偏移复制到所有图。数据重排先恢复真实时间顺序，再依新落点检查需要调整的引线；自动 target 重算不等于固定偏移仍适用。静态说明中引用的数值也须随本次数据编辑更新，不能只移动锚点。

`arcRatio` 不是可直接理解为弯曲百分比的值；当前原生实现中，更小的正数可能产生更大的可见弯曲。没有已有图面或用户反馈时只生成候选参数，不能仅靠减小该数值声称曲率已收敛；不为普通配置任务另起实绘。

需要自然的 S 形引线时使用 `itemLine.type:"type-cubic"`。`bezier.tension` 控制自动控制点的水平伸展，范围 0.1–0.8，默认 0.35；`textGap`、`targetGap` 为非负逻辑像素，默认均为 4。运行时按说明文字的实际边界裁切曲线，并预留目标图形半径、箭头尺寸和间隙；保存的仍是业务 target、文字偏移和相对曲线配置，不保存裁切后的路径。拖动说明、重排或改数后重新计算。

自定义形态可声明 `bezier.controlPoints:[{x:0.35,y:0.12},{x:0.65,y:-0.12}]`：x 沿数据点到文字朝向边接线端点的弦长归一化，y 沿其左法向归一化。它们不是画布坐标，优先于 tension；这组参数是温和反曲候选。文字重叠目标或没有足够空间留下曲线时隐藏线身，须重新安排文字；不承诺避让全部其他 datum、轴文字或其他说明。Browser 与 Node 共用渲染实现。该扩展基于 VChart 2.0.23-alpha.9 / VRender core、components、kits 1.0.46-alpha.3；独立使用原生 VChart 时需相应的编辑器扩展注册，不能假定任意旧宿主已支持。

编辑器中可拖动三次曲线线身，同时调整两个控制点；选中后可分别拖动两个圆形手柄。两端仍连接原数据点和说明文字，拖动只保存相对 `controlPoints`，不移动业务 target 或说明偏移。松开后保存，按 Esc 或取消指针操作恢复拖动前形态；后续生成、改数和刷新须保留已有手工控制点，除非用户明确要求重新调整曲线。

下表来自不同图面的布局示意，仅供选择方向和初始距离；不能按图型机械套用或当作通用最优值。

| 场景 | offsetX | offsetY | 候选方向 |
| --- | ---: | ---: | --- |
| 柱顶说明 | 35 | -11 | 右上 |
| 折线末端说明 | -86 | -24 | 左上 |
| China 散点说明 | -58 | 28 | 左下 |
| 堆叠层说明 | -34 | -96 | 左上外置 |
| 零值层说明 | 6 | -78 | 上方外置 |
| 热力格说明 | 40 | -34 | 右上 |

确需文字置于绘图区外时，可用 `itemContent.confine:false` 允许外置，该字段不保证不裁切，选择时考虑已知卡片尺寸和文字长度。

## 2. 配置检查与按反馈调整

生成时使用完整的业务 target、匹配的指标、逻辑像素偏移及所需引线类型。按已知标签与文字分布选择初始位置；例如柱顶已有数值时，不机械套用右上偏移。仅生成配置时直接交付候选，不为判断整条路径另外启动渲染或计算文字边界。不要把偏移当作业务坐标，也不要通过移动 target、删除数据或关闭原标签来消除可能的冲突。

用户要求看效果、视觉验收，或提供遮挡反馈时，采用已有图面/工具返回的边界，只处理对应文本、路径或箭头问题；结果不足时补取受影响标注的信息。运行时测量与自动布局不要求模型再逐项计算或复核。点说明、普通值标签、系列标签和画布文字分别保留自己的配置，不用一种标注替换全部文本。原生点标注的富文本与弧形示例见[点说明与画布来源](../examples/data-driven-point-canvas.json)；该配置不证明任意尺寸自动避让或静态文字自动重算。

用户提供截图、明确的位置要求或遮挡反馈时，只修改对应标注的偏移/引线，保留其他用户位置；扩大卡片、缩短文案或减少标注需符合用户要求。不承诺候选位置一定无重叠或自动适应所有尺寸。

## 3. 近点数值与薄段内标签

折线／面积图只有少量必要数值时，使文字靠近可见的对应点；边界旁可向内放置并按文字宽度选择对齐。必须移远才能避让时显示短引线，无方向含义时关闭两端箭头。小偏移只是候选，不能仅凭偏移数字断言关联已清楚。

模板支持语义点时，必要末值或独立柱段值可使用动态 `itemContent.text.formatConfig`；省略 `itemContent.text.text` 和 `label.text`，省略 `target.aggregate` 以绑定真实指标原始值。固定年份 target 继续绑定该年份，不自动追随新增年份；“最新一期”需在数据更新后重新选择。不要把 `displayType:"firstLast"` 当成仅末值，也不要因避免成对首尾值删除用户需要的末值。

薄段内空间不足时，非必显标签可省略；用户或比较任务要求必显时，在条形内部用同段色背景托住对比色文字。下面是右侧深蓝段的候选；段中心为真实数据锚点，靠右对齐使文字和衬底向条形内部展开。衬底可能越过薄段左边界，但真实数据段宽度保持不变；不能借此重画或延长柱段，也不能覆盖相邻必要标签。

```json
{
  "id": "thin-senior-share",
  "name": "mark-point",
  "target": { "match": { "Population": "Central African Republic" }, "metric": "65 years and older" },
  "itemContent": {
    "type": "text", "position": "insideMiddle",
    "offsetX": 0, "offsetY": 0, "refX": 0, "refY": 0, "autoRotate": false,
    "text": {
      "type": "rich", "visible": true,
      "formatConfig": { "content": "value", "fixed": 0, "postfix": "%" },
      "containerTextAlign": "right", "padding": 2, "dx": 0, "dy": 0,
      "style": { "fill": "#ffffff", "fontSize": 14, "textAlign": "right", "textBaseline": "middle", "lineWidth": 0 },
      "labelBackground": { "visible": true, "style": { "fill": "#0A345E", "fillOpacity": 1, "lineWidth": 0 } }
    }
  },
  "itemLine": { "visible": false },
  "targetSymbol": { "visible": false }
}
```

`refX/refY:0` 清除运行时默认沿线偏移；这是现有运行时透传字段，公共类型尚未列出。背景色取自对应图形，示例深蓝不是默认主题。普通标签已显示该值时关闭重复项；未支持语义点的模板不能照搬此路径。目标尺寸的图面反馈决定实际对齐和偏移，不承诺缩放后自动省略或自动避让。

## 4. 保存与交付

首次创建内置图输出 `commonOption`，标注放在 `elements[].options.config.marker`。编辑既有卡片时，读取完整当前 record，在对应 `browserData` 图表的 `attribute.marker.markPoint[]` 中按 ID 最小更新；保留其余字段、元素与标注 ID、业务 `target` 以及其他用户位置。不要修改旧 `commonOption` 后假定已覆盖优先加载的 `browserData`。具体保存方式沿用 [已有卡片替换流程](existing-card-replacement.md)。

采用写入工具已验证的结果，覆盖文字、偏移、引线、ID、target及其余未修改字段的保留情况；已有完整回读证据时不再GET，结果不足时按[卡片协议](feishu-doc-card.md#11-写后-readback)只补取缺少的信息。交付说明实际执行范围；用户要求视觉验证时，另按实际图面说明结果及限制。
