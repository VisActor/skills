# 静态 HTML → PNG

## 小合同

完整 HTML 包含 UTF-8、内联 CSS 和一个或多个 `<article data-page>`。每页 CSS 指定整数像素宽高；默认手机悦读版为1080×1440，经典杂志版为1080×1920，无 transform 缩放。无需 schema、节点字段或 readiness 回调。完整组图把唯一封面放在第一位并保持各页同尺寸；显式只要内页时除外。导出器按 DOM 顺序生成 `page-01.png` 等，DPR=1，像素尺寸与画布一致。

最终 HTML 自包含：SVG 内联，照片与自定义字体用获授权的 data URI 内嵌；系统中文字体可用，但跨机可能换行不同。`@font-face` 字体需要实际加载成功，输出 `report.json` 记录检查结果。按[字体加载](fonts.md)，导出器在布局检查前依次尝试 CDN、可选本地 WOFF2 和系统回退，成功字体及状态内嵌到成品。成品不依赖外部 CSS、SDK、字体 CDN 或页面脚本；不需要动画、滚动懒加载和交互。

导出器关闭页面 JavaScript、阻止页面发起的网络/外部文件子资源；字体获取由导出器单独处理，不开放任意页面外链。等待选定字体和图片解码后，检查空页、尺寸、DOM/SVG越界及文字盒的滚动溢出。无需用栅格图片替代 SVG 文字以通过检查。

## 环境与命令

Python≥3.10，Python Playwright 与 Chromium/Chrome。已有依赖优先复用。宿主允许安装时在隔离环境执行 `python -m pip install -r requirements.txt` 与 `python -m playwright install chromium`；脚本不会安装依赖。已有浏览器传 `--browser /绝对路径/Chrome`。

```bash
python scripts/export.py --html /work/magazine.html --output /work/export-01
```

手机悦读版完整组图使用上面的默认命令。经典杂志版使用 `--page-size 1080 1920`。用户明确只要内页或指定某张详情时，加 `--inner-pages-only`。用户指定其他尺寸时，用 `--page-size 宽 高` 传入约定的像素尺寸，并将 HTML 画布设成相同大小。

输出目录必须为空，避免旧截图伪装成新成果。成功后生成 `magazine.html`、逐页 PNG、`images.zip` 与 `report.json`；ZIP 只含独立图片。把 `sources.md`、穿搭的抠图 PNG 与原图对应记录，以及需要的 `post.md` 放在同目录。只需 HTML 时不强制打包 PNG。

失败时返回非零，诊断写在 `report.json`；不要交付错误截图。仅针对明确诊断修正 HTML，再导出到新目录；不做与错误无关的全量复查。缺少浏览器时保留 HTML 并说明 PNG 尚未导出。

## 内容图片检查

全部模板的内容图槽标记 `data-image-policy="raster"`，替换为实际获取或生成并内嵌的栅格图片后保留标记；模板原始矢量占位会被拒绝。新增内容图也使用该标记。有事实依据的科普／数据示意或用户指定示意图可使用 `diagram`，装饰 SVG 使用 `decorative`；两者写明 `data-image-reason`，不得为绕过失败而修改标记或把几何占位转 PNG。素材取得和绑定时按[配图规则](imagery.md)确定来源、图意、裁切和图注；缺图草稿不得报告为正式成品。
