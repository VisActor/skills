# 身高的分量

完整的 NBA 身高数据故事：点阵标志引入，展开各年代位置分布，再观察 PF／C、赛季变化、分钟权重和明星球员，最后进入年代与赛季探索。

![作品预览](preview.png)

- [查看作品](result/index.html)
- [同主题复作任务](prompt.md) · [研究输入](inputs/INPUT.md)
- [页面数据](result/data.json) · [素材来源](result/assets.json)

## 查看与复作

在本案例目录执行：

```bash
python3 -m http.server 8000 --bind 127.0.0.1 --directory result
```

打开 <http://127.0.0.1:8000/>，向下滚动；页面底部可探索数据。使用桌面浏览器，资源本地加载，无需构建或安装图表库。JavaScript 模块需要 HTTP 服务，不建议双击 HTML。

给安装了 `unit-data-storytelling` 的 Agent 提供 `prompt.md` 和 `inputs/`，可重做同题作品；提示词不保证逐像素重现本例。当前页面直接读取已经整理的 `data.json`。

## 数据与素材

数据截至 2025–26 赛季，按赛季起始年分年代。统一采用球员资料身高；多位置球员出现在各位置，位置组人数不能直接相加为联盟独立人数。分钟使用球员赛季总量，不是每个位置的实际分钟。2020 年代只有现有赛季，明星、样本与因果边界见页面来源说明。

原始统计数据来自 [NBA Stats](https://www.kaggle.com/datasets/sumitrodatta/nba-aba-baa-stats) 的固定快照，版本与哈希见输入来源。NBA 标志及球员头像来自 NBA 官方 CDN，原地址、日期、用途与哈希见 `assets.json`。这些第三方图像不适用仓库的 MIT 代码许可；数据集许可也不授予标志或人物照片的使用权。头像用于识别人，不表示某个历史赛季的形象。
