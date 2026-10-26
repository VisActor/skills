# builder

[API 索引](index.md)

- [Builder](builder.md#builder)

类型引用沿用源码模块名，包的公开导出以索引为准：

```typescript
import type {
  AdvancedPipe,
  AdvancedPipeline,
  AdvancedVSeed,
  ChartType,
  CustomThemeConfig,
  Spec,
  SpecPipe,
  SpecPipeline,
  VSeed,
  VSeedBuilder,
} from 'src/types'
```

## Builder

源码：[packages/vseed/src/builder/builder/builder.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/builder/builder/builder.ts#L21)

包导出：`Builder`

```typescript
export declare class Builder<S extends Spec = Spec> implements VSeedBuilder {
  /**
   * @description 初始化 Builder 实例
   */
  constructor(vseed: VSeed)
  /**
   * @description 获取当前 Builder 使用的语言环境
   */
  get locale(): 'zh-CN' | 'en-US' | 'ja-JP' | 'de-DE' | 'id-ID' | 'fr-FR' | 'ko-KR' | 'vi-VN'
  /**
   * @description 异步执行动态过滤器代码。在 build() 前调用，用于执行 dynamicFilter 中的 code。幂等方法，多次调用不会重复执行
   */
  prepare: () => Promise<void>
  /**
   * @description 生成最终的图表配置 (Spec)。这是最常用的核心方法。如果配置中包含 dynamicFilter code，需要先调用 prepare()
   */
  build: <T = S>() => T
  /**
   * @description 将中间层配置 (AdvancedVSeed) 转换为最终 Spec。仅当你需要深度定制中间层配置时使用
   */
  buildSpec: <T = S>(advanced: AdvancedVSeed) => T
  /**
   * @description 生成中间层配置 (AdvancedVSeed)，即图表模版。比原始 VSeed 更详细，暴露了更多图表细节
   */
  buildAdvanced: () => AdvancedVSeed | null
  /**
   * @description 获取数据中涉及颜色的字段信息。常用于生成图表的图例或颜色筛选器 UI
   */
  getColorItems: () => {
    id: string
    alias: string
  }[]
  /**
   * @description 获取颜色字段的详细映射表。Key 为颜色 ID，Value 为详细信息
   */
  getColorIdMap: () => Record<
    string,
    {
      id: string
      alias: string
    }
  >
  /**
   * @description 获取离散颜色图中 colorId 到最终颜色值的映射
   */
  getColorValueMap: () => Record<string, string> | undefined
  /**
   * @description 获取当前的 VSeed 输入数据
   */
  get vseed(): VSeed
  /**
   * @description 更新 VSeed 输入数据。更新后会清除 prepare() 的缓存状态
   */
  set vseed(value: VSeed)
  /**
   * @description 获取 prepare() 状态
   */
  get isPrepared(): boolean
  /**
   * @description 设置 prepare() 状态
   */
  set isPrepared(value: boolean)
  /**
   * @description 获取当前的 AdvancedVSeed 中间配置对象
   */
  get advancedVSeed(): AdvancedVSeed | null
  /**
   * @description 设置 AdvancedVSeed 中间配置对象。通常用于缓存或复用已有的中间配置
   */
  set advancedVSeed(value: AdvancedVSeed | null)
  /**
   * @description 获取当前生成的最终 Spec 对象
   */
  get spec(): Spec | null
  /**
   * @description 设置 Spec 对象。通常用于缓存
   */
  set spec(value: Spec | null)
  /**
   * @description 获取构建过程中的性能统计信息。包含各阶段耗时 (单位: ms)
   */
  get performance(): Record<string, string | number>
  /**
   * @description 设置性能统计信息
   */
  set performance(value: Record<string, string | number>)
  /**
   * @description [内部方法] 获取指定图表类型的模版构建管线，用于调试 VSeed 到 AdvancedVSeed 的转换过程
   */
  static getAdvancedPipeline: (
    chartType: ChartType,
  ) => import('src/types').Pipe<AdvancedVSeed, import('src/types').AdvancedPipelineContext>[]
  /**
   * @description [内部方法] 获取指定图表类型的 Spec 构建管线，用于调试 AdvancedVSeed 到 Spec 的转换过程
   */
  static getSpecPipeline: (chartType: ChartType) => SpecPipe[]
  /**
   * @description 获取指定主题的配置。不传 themeKey 默认返回 'light' 主题
   */
  static getTheme: (themeKey?: string) => CustomThemeConfig
  /**
   * @description 获取所有已注册的主题配置
   */
  static getThemeMap: () => Record<string, CustomThemeConfig>
  /**
   * @description 静态工厂方法，用于便捷地创建 Builder 实例
   */
  static from: <T extends Spec = Spec>(vseed: VSeed) => Builder<T>
  /**
   * @description [扩展方法] 注册新图表类型的模版构建管线
   */
  static registerAdvancedPipeline: (chartType: ChartType, pipeline: AdvancedPipeline) => void
  /**
   * @description [扩展方法] 注册新图表类型的 Spec 构建管线
   */
  static registerSpecPipeline: (chartType: ChartType, pipeline: SpecPipeline) => void
  /**
   * @description [扩展方法] 修改现有图表的模版构建逻辑，插入自定义 Pipe 影响生成的 AdvancedVSeed
   */
  static updateAdvanced: (chartType: ChartType, pipe: AdvancedPipe) => void
  /**
   * @description [扩展方法] 修改现有图表的 Spec 构建逻辑，插入自定义 Pipe 影响生成的最终 Spec
   */
  static updateSpec: (chartType: ChartType, pipe: SpecPipe) => void
  /**
   * @description [扩展方法] 注册自定义主题
   */
  static registerTheme: (key: string, theme: CustomThemeConfig) => void
}
```
