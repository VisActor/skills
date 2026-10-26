# 人物海报产物契约

## manifest.json

产物目录中创建 manifest，所有文件路径相对于该目录。下面是结构示例，填写当前作品的真实尺寸、图表和资产；示例条目不表示文件已经生成。

```json
{
  "title": "人物与核心叙事",
  "delivery": "html+png",
  "html": "index.html",
  "png": "preview.png",
  "canvas": {"width": 1200, "height": 2160},
  "styleTemplate": {
    "slug": "reference-derived-person-editorial",
    "source": "design-brief.md",
    "archetype": "editorial-poster",
    "density": "high",
    "scheme": "light"
  },
  "charts": [
    {
      "id": "career-series",
      "spec": "charts/career-series.spec.json",
      "mount": "[data-chart-id=\"career-series\"]"
    }
  ],
  "assets": [
    {
      "file": "assets/subject.png",
      "kind": "bitmap",
      "role": "primary person portrait",
      "source": "web-search",
      "rasterSource": "web-sourced",
      "sourcePage": "https://example.org/person/photo-page",
      "imageUrl": "https://example.org/media/person-original.jpg",
      "sourceFile": "assets/subject-original.jpg",
      "originalDimensions": {"width": 1800, "height": 2600},
      "processing": [{"operation": "background-removal", "report": "assets/subject.asset.json"}],
      "target": "#subject-figure",
      "containsRequiredText": false
    }
  ],
  "export": {
    "selector": "#infographic",
    "width": 1200,
    "height": 2160,
    "deviceScaleFactor": 2,
    "viewport": {"width": 1200, "height": 2160}
  }
}
```

## 交付模式

`delivery` 只接受 `html` 或 `html+png`，省略时为 `html+png`。不要根据 PNG 缺失推断模式；明确要求仅 HTML 时才写 `"delivery": "html"`。有无图表与交付模式独立。

| delivery | pre-export | complete |
| --- | --- | --- |
| 缺省 / html+png | 必须提供合法 png 路径，允许文件尚未生成 | 要求 png 字段及文件存在 |
| html | png 字段可省略；提供时仍检查相对路径合法性 | 不要求最终 PNG；仍检查 HTML、图表、资产及全部其他契约 |

HTML-only 同样需要 review 阅读图和完整校验；review 的诊断截图不属于最终 PNG 交付。不能以 pre-export 代替 complete。

## 对应关系

- HTML、spec、图片、prompt 等文件实际存在；最终 PNG 按 delivery 要求提供。manifest 路径为本目录内的相对路径，不引用机器路径或其他 skill。
- 每个图表 id 同时对应 manifest、独立 spec、HTML mount 和非空的 `window.__INFOGRAPHIC_CHARTS__` 条目。没有图表时为 `charts: []`，不为了通过校验伪造图表。
- 根节点定稿采用整CSS像素宽高，实测结果、canvas、export宽高和viewport一致；内容自然高度有小数时向上取整并同步实际布局。DPR 2 的PNG像素数为CSS尺寸的两倍，不用PNG像素数替换CSS尺寸。
- 人物、图标和采用的自定义字体放到产物本地目录。运行时默认使用固定版本 CDN；可选 `dependencies` 数组用 `name: "@visactor/vchart"`、`url` 与 `version` 记录远程依赖，下载的本地副本用 `name: "@visactor/vchart"`、`file`、`version` 和 `source` 记录。这里指成品运行资源，不是其他 skill；离线交付需将远程依赖保存到当前产物目录并更新引用。
- `dataSources`/`dataScope`、字体角色、构图保护区等可补充为元数据；完整事实清单仍由 `data.json` 持有。

## 素材来源

搜索人物图片：按示例使用 `source: "web-search"`、`rasterSource: "web-sourced"`，保留真实来源页、可取得的原图 URL、本地原图及尺寸。上面的 example.org 仅演示字段，当前作品必须填写实际出处；`processing` 只列实际完成的处理，未抠图时省略该项。来源提供署名/使用说明时可记录 `credit`/`usageTerms`。执行者核实人物与时期，静态校验不证明远程出处真实性。

用户人物图片：`kind: "bitmap"`、`source: "user-provided"`、`rasterSource: "user-provided"`，保留复制到本地的文件。搜索图片不能记成用户提供。

用户明确要求 AI 人物插画时：`source: "image-generation"`、`rasterSource: "image-generated"`，保存实际 `generationTool` 和本地 `prompt` 文件。用了真实照片作参考时另保留参考出处。生图不承担必须保留的数据文字。抠图/裁剪的工具名记录在处理步骤中，不替代图片原始来源类型。

自绘普通图标：`kind: "svg"`、`source: "hand-authored-svg"`，省略 `rasterSource`。官方标志记录实际来源，不能将自绘符号称为官方标志。

浏览器渲染的素材记录 `source: "browser-screenshot"`、`rasterSource: "browser-rendered"` 和 `sourceFile`；截图中使用的原始照片另保留出处。它不是 AI 生图。缺人物素材时记录实际搜索/获取缺口并明确交付草稿，不能声称已完成真实人物海报。明确使用 SVG 主体替代时标为 `rasterSource: "fallback-svg"`；只有实际尝试过 AI 生成且不可用时才填写 `bitmapStatus: "generation-unavailable"`、`imageGenerationStatus: "generation-unavailable"` 并保留预期 prompt 与真实原因，不把没尝试生图记成生图失败。

最终执行包内 `scripts/validate_poster_bundle.py`，再查看交付 PNG；HTML-only 查看 HTML 与 review 阅读图。它复用包结构检查并检查图表配置字段，不会证明统计真实性或人物造型质量。
