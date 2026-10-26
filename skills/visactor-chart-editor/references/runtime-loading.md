# 内嵌运行时

`templates/template.html` 是完整单文件：内嵌 Standard 编辑器、React / Ant Design / DnD、VBI / VQuery / VSeed、VChart 2.1.7、VTable 1.23.1、CSS 和完整 supermarket 数据。默认演示离线可用，无 CDN 探针或资源回退；复制 HTML 即可运行。

## 加载与初始化

`vchart-runtime`、`vtable-runtime`、`editor-runtime` 是 `type="text/plain"` 的内嵌脚本，由同文件的 `startup-runtime` 在加载卡片首帧绘制后依次执行，阶段之间让出一帧；不访问网络、不使用 eval。替换脚本时保留依赖许可、转义 script 结束标签，并核对源码清单与版本。

加载层独立于 React，在引擎不可用时仍能显示错误与重试。工作台隐藏但保留测量尺寸，首图完成或合法空态就绪后才解除 `inert` / `aria-busy`。就绪后直接揭示稳定的工作区，不追加整页入场动画；图表更新继续使用原生过渡。加载卡片最短展示 600ms，减少动态效果时不追加等待；45 秒超时提供重试，pagehide 清理计时与监听。

尽早读取本地偏好或页面默认的语言、明暗，完整主题由工作台接管。阶段文案面向用户，不显示内部库名或虚构百分比。验收检查首帧、各阶段、就绪门槛、失败修复后重试、超时及减少动态效果，不能只等待最终页面。

## Excel 运行时

SheetJS CE 0.20.3 mini 和完整 Apache 2.0 许可已内嵌在 `xlsx-runtime` 文本脚本中，第一次 Excel 导出时才执行。不参与首屏初始化、不访问网络；CSV 与图片导出不依赖它。

来源：[官方浏览器构建说明](https://docs.sheetjs.com/docs/getting-started/installation/standalone/)、[固定版本 mini 构建](https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.mini.min.js)、[许可](https://cdn.sheetjs.com/xlsx-0.20.3/package/LICENSE)。这些是维护来源，不是页面运行时依赖。升级时保留许可，并验证 Excel 数值、字符串与离线下载。

VSeed 内含尚未发布的修正，不能直接换成缺少修正的发布包。未来外置资源前先确认版本和运行环境，并重新验收；当前技能不附带重新生成模板的构建脚本。
