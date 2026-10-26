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
3. 将 `scripts/render_charts.js` 复制到 bundle，用相对 script src 加载；在图片和字体就绪后调用 `renderPosterCharts(window.__INFOGRAPHIC_CHARTS__)`。从文件生成 window.__INFOGRAPHIC_CHARTS__ 的直接 JSON 赋值，不分别编辑两份。保留原始映射，对 structuredClone(sourceSpec) 创建 new VChart.default(spec, {dom: mount})，等待 renderAsync()。
4. 字体和图片加载、图表渲染全部成功后才设置 ready，完整代码见 [渲染与验收](render-and-acceptance.md)。

生成内嵌数据：

```bash
"$POSTER_PYTHON" - "$BUNDLE" <<'PYTHON'
import json, sys
from pathlib import Path
root = Path(sys.argv[1]).resolve()
manifest = json.loads((root / 'manifest.json').read_text(encoding='utf-8'))
charts = {}
for item in manifest.get('charts', []):
    path = (root / item['spec']).resolve()
    if not path.is_relative_to(root):
        raise ValueError('Chart spec must stay inside the bundle')
    if item['id'] in charts:
        raise ValueError('Duplicate chart id')
    charts[item['id']] = json.loads(path.read_text(encoding='utf-8'))
payload = json.dumps(charts, ensure_ascii=True).replace('<', '\\u003c')
print('window.__INFOGRAPHIC_CHARTS__ = ' + payload + ';')
PYTHON
```

无图表时赋值空对象、manifest.charts 为 []，省略 VChart 脚本。收到旧 schema 产物时先转换为原生 spec 并重新渲染，不能只改文件扩展名。
