# 人物海报内嵌图表

先按 [信息关系索引](charts.md) 选择图表，再按 [图表设计](chart-design.md) 分配标签、字体与真实宽高。完整系列由图表编码，独立事实与纯事件使用 HTML。

## 发布 runtime

使用公开固定版本，不依赖构建工程：

```html
<script src="https://unpkg.com/@visactor/vchart@2.1.7/build/index.min.js"></script>
```

浏览器实际加载并验证 VChart.default 与 renderAsync。CDN 不可达时说明失败；有同版本可追溯缓存或需要离线交付时，将 UMD 复制到 bundle，依赖条目记录 name: "@visactor/vchart"、file、version: "2.1.7" 和 source。不要用 latest。

## 文件到实例

1. 当前图表写入 charts/[id].spec.json，内容直接是原生 VChart spec，animation: false。
2. manifest.charts 使用 id、spec、mount 三个字段。HTML 图表 mount 使用 id="chart-[id]" 与 data-chart-id="[id]"；外层负责页面定位，内层明确宽高。
3. 新建作品使用workflow init的标准入口，build生成charts.generated.js并刷新render_charts.js与poster_bootstrap.js。启动脚本等待实际图片、字体，有图表才加载固定VChart；桥接登记实例，全部成功后设置ready，失败时保存具体错误并清理实例。
4. 不另写第二个启动事件或手动创建同一图表。bootstrapPoster及renderPosterCharts同页启动幂等；数据修改后重新build并重新加载页面，不用旧实例代表新结果。旧bundle仍能调用renderPosterCharts并取得实例，但正式迁移须明确完成根和启动接入，受限原稿不自动迁移。

```html
<script src="charts.generated.js"></script>
<script src="render_charts.js"></script>
<script src="poster_bootstrap.js"></script>
```

```bash
python3 "$SKILL_DIR/scripts/poster_workflow.py" build --bundle "$BUNDLE"
```

charts.mount是实际CSS选择器，如`#chart-trend`，不能写裸id。新接入配置由build生成，桥接要求每个选择器恰好对应一个非空mount。新建构图只修改HTML/CSS、映射和spec，不改受管理运行脚本。

每个spec的原生data.values通过display-map的specPointer/dataPointer与data.json的最终图表数组对应。build先核查事实，再将整组values同步到spec、生成charts.generated.js、同步DOM并运行layout。标签/顺序/null都来自该数组；需要改字段名时先准备有来源比较的最终数组，不在页面另算一份。renderPosterCharts在载荷及桥接脚本加载、图片和字体就绪后调用。

无图表时charts.generated.js生成空对象、manifest.charts为[]，省略VChart脚本。收到旧 schema 产物时先转换为原生 spec 并重新渲染，不能只改文件扩展名。

## 原生配色核对

类别强调可从 [分类强调横条](chart-examples/category-highlight-bar.spec.json) 开始；使用 `seriesField` 与显式颜色 domain/range 保持身份映射。配置字段为 `color`，不是 `colors`。包校验只对已验证的 bar 顶层 `colors` 误用提供 warning，不替换字段、不阻止合法扩展，也不会自动证明修复成功。最终颜色和标签仍按 [逐图验收](render-and-acceptance.md#逐图记录预期与观察) 查看实际输出。
