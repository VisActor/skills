# 将图片插入飞书文档

用于用户选择“文档里的静态图片”。普通图片块不要求安装图表助手小组件；可编辑图表仍走 [卡片流程](feishu-doc-card.md)。图片本身先按 [图片交付](image-delivery.md) 生成，两种交付使用同一个 PNG，不重新绘图。

## 能力和身份

优先复用宿主已有的飞书文档、图片上传与回读工具。宿主提供已配置授权的 `lark-cli` 时，可直接使用包内脚本；不要求用户另配渲染运行时或服务密钥。纯 PNG 交付不依赖飞书。

文档写入必须有用户意图和文档编辑权限。用户已经要求向指定文档插图时直接执行，不逐步再问确认。默认显式使用 user；用户选定 bot，或目标资源通过 bot 链路获得时，全部调用继续使用 bot。权限错误不切换身份绕过，不向模型输出凭证。缺少授权时使用宿主授权入口；不能把安装 Skill 当成已获得飞书权限。缺少 CLI 时走宿主等价能力；两者都无时先交付 PNG 并准确说明文档尚未写入。

## 一条命令或分步执行

在已安装技能根目录中：

```bash
# 按内容比例生成透明2x图片，追加到已有文档并按正常字号交付
node scripts/deliver-image.mjs --input ./chart.json --output ./chart.png \
  --doc '<document_id>' --as user

# 已有 PNG，或之前生成成功但插图失败
node scripts/insert-image.mjs --image ./chart.png --doc '<document_id>' \
  --width <原插图回执width，首次默认820> --as user

# 在唯一匹配的正文块后插入
node scripts/insert-image.mjs --image ./chart.png --doc '<document_id>' \
  --selection '目标段落的唯一文本' --width 820 --as user
```

`--before` 与 `--selection` 配合时插入在匹配块之前。脚本按当前宿主能力选择路径：旧版 `+media-insert` 支持文字定位时沿用原命令；新版移除该参数时，先完整读取固定 revision 的块列表，将唯一正文文本定位为 block_id，再调用 `+update --command block_insert_after`。段落前插入使用其前一兄弟块，第一段前使用文首位置。新版路径不跨块拼接文本，表格单元格、callout 等容器内部目标会在写入前拒绝，改由宿主原生 block 工具处理，不把图插到容器外。旧版文字定位可能定位到顶层祖先，因此容器内部场景同样不要走文字定位。无法唯一定位时先澄清位置。

`deliver-image.mjs` 对新建的单图表 commonOption 默认按正常卡片内容逻辑宽度 794（宿主 818 减左右各 12）重新布局，字号保持正常，并以 2x 导出，避免把 640 宽的小图放大到文档后字体显得过大。显式 `--layout-width` 优先；含保存态 browserData/editorData 的 record 以保存态为准，多元素画布同样保留原布局。

默认文档显示宽度为正文默认宽度 **820px**，宿主会按实际正文可用宽度自适应；保存态、多元素和较窄的 PNG 同样按此宽度显示，高度按图片比例计算。可用 `--display-width 600` 显式覆盖显示宽度。显示宽度独立于 `--layout-width`（重排）和 `--width` / `--height`（渲染约束），不会因指定显示宽度而改变输入布局；新建单图仍默认按 794px 布局，保存态和多元素不重排。独立 `insert-image.mjs` 必须显式传 `--width`，缺失时在写入前拒绝；首次插图默认传 `820`，恢复插图传原插图回执中的 width，不要把 2x PNG 像素宽度当文档显示宽度。

支持 Docx URL 或 document_id；Wiki 链接先由宿主知识库工具解析到实际 Docx document_id，不能直接把 wiki token 当文档 ID。明确要求新建文档时，先经宿主工具创建并取得 document_id，再执行插图；不因没有目标文档而擅自新建。

## 原生 API 的等价流程

1. 在目标 parent/index 创建 `block_type:27`、`image:{}` 的图片块，得到 image block_id。
2. 上传 PNG：`POST /drive/v1/medias/upload_all`，`parent_type:docx_image`、`parent_node:图片块ID`，附实际文件名、字节大小和文件。
3. `PATCH /docx/v1/documents/{document_id}/blocks/{block_id}`，通过 `replace_image.token` 设置素材；逻辑宽度与 PNG 比例用于显示尺寸。
4. `GET /docx/v1/documents/{document_id}/blocks/{block_id}` 回读，确认该块为 27、素材 token 非空且与本次上传一致。路径均以 `/open-apis` 为前缀。

使用当前宿主工具的实际参数，不凭本示意猜包装形式。CLI 的 `docs +media-insert` 与新版 `docs +update` 本地图片资源路径已编排创建、上传、设置及失败清理。新版 XML 使用 `<img path="@./image.png" width="820"/>`；脚本先将已校验 PNG 字节写为独立临时文件，避免宿主附件的多硬链接被 CLI 拒读，结束后清理副本。包内脚本在命令后补充独立回读；新版定位路径额外核对原目标块与新增图片的相邻顺序、PNG 内在尺寸和显示宽度。官方协议：[如何插入图片](https://open.feishu.cn/document/docs/docs/faq)。图片上传 token 不等于 IM 消息的 image_key。

## 失败与恢复

脚本写入前在 PNG 旁创建 `.feishu.json` 回执，仅保存目标、身份、图片摘要、操作状态、块 ID 和 token 摘要；新版定位路径还保存定位块、父块、写入基准 revision 和图片尺寸，不输出或保存素材 token。可用 `--receipt` 指定新回执路径。同一图片、目标、身份和位置再次执行时复用原回执：

- 有 blockId：只回读该块，不再插入；新版定位路径还复查位置和尺寸，全部通过才返回 `verified:true`。
- 只有 pending：上次结果不确定，先通过目标文档检查实际结果，不自动重放写入或删除回执。
- 插入完成但回读失败：图片和 blockId 已保留，恢复后重跑相同命令继续回读。

不能将命令成功当成已验证，也不能将“已生成 PNG”当成“已插入文档”。若改用宿主工具完成插入，同样遵守结果不确定先回读、仅处理本次创建的空块、不盲目重试。最终交付文档链接；仅索要文档图片时不重复展开 DSL。
