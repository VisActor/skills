# 图片交付

用户要求“图表助手导出图片”“只要 PNG”时，按本流程执行。用户要求将图片插入飞书文档时，继续执行 [飞书图片交付](feishu-image-delivery.md)。图片和可编辑卡片共用同一份 DSL；PNG 是生成时的数据快照，不会自动同步。

## 运行条件

宿主提供 Node.js 18+、HTTPS 访问和文件交付能力即可运行包内客户端；无需安装 npm 依赖、编辑器、Canvas、浏览器、字体、专用 MCP 或配置服务密钥。不能执行脚本的宿主可以通过已有 HTTP 工具调用下面的相同协议，并将二进制保存为附件。

默认服务地址是 `https://charteasy.visactor.com/api/v1/chart_assistant/export_image`。接口需由服务方部署后才能在正式环境使用；本地开发通过 `--endpoint http://127.0.0.1:<port>/api/v1/chart_assistant/export_image` 验证。服务未就绪、宿主无网络或缺少文件交付能力时，明确说明图片未生成，保留正确 DSL，不将 DSL 或 HTML 预览称作图片交付成功。

## 输入与默认行为

支持裸 commonOption、包含 commonOption 的 record、符合下述数据与资源限制的单画布 `ILayerData[]` 或包含 browserData 的 record。保存态 browserData 优先于 record 中旧的 commonOption，避免导出旧配置。首次建图仍使用 commonOption，不为导出伪造保存态。只支持一个 layer；一个 layer 可有多个图表、文本和图形。

默认不指定宽高，按输入自身布局与实际内容边界导出，忠实保留正常卡片浏览时的图表比例，不额外套 960×540 画布。倍率默认 2x，只改变清晰度，不改变布局；实际 PNG 像素尺寸由内容边界和倍率决定。`--width` / `--height` 仅在用户明确需要时约束布局，最终文件仍按渲染内容边界输出，不能将它们当作强制 PNG 宽高。默认 `background: "transparent"`，保留 PNG Alpha；显式 `#RRGGBB` / `#RRGGBBAA` 可填充背景。背景只控制画布底色，不移除图表内部显式填充，也不自动更改主题或文字颜色。

公共入口只渲染已经内联、物化的 `standard` 数据；`vchartSpec` 保存态即使已内联，也不在当前协议支持范围。不能静默删除字段或伪装数据类型来通过限制。Sheet/Base/风神等来源先经宿主授权读取或物化，移除会触发重新取数的运行字段后交付快照；保留必要的来源说明。`source.pageUrl` 可作为说明，但不会用于取数。不发送用户 token、Cookie、签名、私有数据源凭证或函数序列化内容。需要外部图片、地图远程资源或尚未物化的数据源时，不承诺该公共入口可直接渲染；明确缺口，不能静默删除必要元素或换数据。

单图表 commonOption 可用 `--layout-width 960` 在指定逻辑宽度重新布局：保留图表宽高比和原有字号，使正文内的轴、标签呈现正常字号，而非把小图位图放大。它与 `--width` / `--height` 的渲染约束不同；该模式只支持单个 chart，保存态和多元素画布保留原布局。单纯 PNG 导出默认不重排。

## 执行与交付

先按 [工作流校验](workflow.md#commonoption-交付前校验) 生成和校验最终 DSL，再运行脚本。以下命令在已安装的 Skill 根目录执行；宿主在其它目录时用实际技能目录定位脚本，不猜开发仓库路径。

```bash
node scripts/export-image.mjs --input ./chart.json --output ./chart.png

# 用户明确要求白底及布局宽高约束
node scripts/export-image.mjs --input ./chart.json --output ./chart-white.png \
  --width 1200 --height 675 --dpr 2 --background '#ffffff'
```

输出目录须已存在，输出文件须为新路径。脚本检查 PNG 类型、文件头、实际像素尺寸及服务返回的尺寸元数据，并原子保存；不覆盖已有文件。成功 stdout 是小型 JSON：`path` 为绝对文件路径，`width/height` 为像素尺寸，`logicalWidth/logicalHeight` 为实际内容的逻辑尺寸（可能有小数），`dpr` 为倍率，可能附带请求 ID 和渲染版本。将该真实文件作为宿主附件或图片交付，默认不展开中间 JSON 或 Base64。

超时、429、503 或无效图片属于失败，不能展示成功回执。脚本不自动重试；确认失败且未产生文件后可有限重试渲染。默认超时 60 秒，输入/请求不超过 1 MiB，响应不超过 16 MiB；显式布局边长不超过 4096，倍率不超过 4，最终总像素不超过 8M。不能静默缩小用户指定尺寸以绕过限制。

## HTTP 协议

`POST /api/v1/chart_assistant/export_image`，请求 `Content-Type: application/json`，`Accept: image/png`：

```json
{
  "protocol_version": "1.0",
  "input": { "type": "commonOption", "commonOption": { "elements": [] } },
  "output": { "format": "png", "dpr": 2, "background": "transparent" }
}
```

上面的空 elements 只是协议占位，执行时必须替换成通过校验的真实内容。保存态输入为 `{ "type": "editorData", "editorData": [单个完整layer] }`。成功直接返回 PNG 二进制，错误返回非 2xx 状态和 `{code,message,data}` JSON。不得将错误 JSON 保存为 `.png`；HTTP 工具不能交付二进制时不声称完成图片导出。

成功响应同时提供 `x-image-width` / `x-image-height`（PNG 像素）、`x-image-logical-width` / `x-image-logical-height`（实际内容逻辑尺寸）和 `x-image-dpr`。客户端校验它们与 PNG 文件一致；旧服务无这些响应头时，以 PNG 像素除以请求倍率计算逻辑尺寸，不额外加画布或拉伸图片。
