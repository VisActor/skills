# VSeed 可视化构建

由 [统一入口](../../../SKILL.md)按需加载。本篇说明可视化构建方法，接口签名与类型见 [API 索引](index.md)。

## 构建与渲染

- 输入为 VSeed DSL 与实际查询结果。数据查询由 [VQuery](../vquery/guide.md)或宿主 Connector 执行；分析配置来自 [VBI](../vbi/guide.md)时保持 `buildVSeed()` 返回的字段 ID。
- 注册所需图表类型与主题；`registerAll()` 适合完整能力接入，按类型注册适合明确范围的集成。
- 用 `Builder.from()` 创建 Builder，再调用 `build()` 生成 VChart / VTable Spec。DSL 包含动态过滤代码时，先 `await prepare()`，再构建；不要把异步准备当成已经完成。
- 根据实际数据选择图表、维度、指标与编码。只有存在真实时间字段时才组织时间趋势；单位、聚合粒度与比例口径与查询结果一致。
- 主题、格式和标记样式优先使用 DSL 支持的配置。渲染器特有事件、Tooltip、容器尺寸与资源释放由集成层处理；复用 VChart / VTable 实例更新。

## 中间态与扩展

`buildAdvanced()` 生成可序列化的 AdvancedVSeed；`buildSpec()` 将中间态转换为渲染 Spec。保存可复用分析配置时保留所属 DSL，不把含函数和运行时引用的 Spec 当成完整可恢复状态。

需要扩展时按图表类型选择和组合 Pipeline，保持每个 Pipe 职责单一；通过公开注册、`updateAdvanced()` / `updateSpec()` 扩展构建过程。这些 API 修改 VSeed 构建管线，渲染实例的 `updateSpec()` 则负责更新页面中的图形，使用时区分职责。

## 按需查阅 API

| 任务                           | 文档                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------- |
| Builder、构建与准备流程        | [builder](builder.md)                                                           |
| 图表类型、主题及 Pipeline 注册 | [register](register.md)                                                         |
| 图表 / 表格 DSL                | [chart-types](chart-types.md)                                                   |
| 公共配置、编码与类型           | [types](types.md)                                                               |
| 构建管线、数据重塑、主题与语言 | [pipeline](pipeline.md) · [data](data.md) · [theme](theme.md) · [i18n](i18n.md) |

验收实际图表、空数据、更新与尺寸变化；扩展共享 Pipe 时覆盖受影响的图表类型。查询与页面组合通过 [visual-query](../../visual-query/guide.md)串联；布局、视觉与场景交互质量另按所选 Dashboard 指南验收。
