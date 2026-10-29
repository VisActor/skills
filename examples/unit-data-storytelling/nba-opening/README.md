# 从点阵标志进入 NBA 身高分布

**局部开篇示例。** 展示主题图形如何展开成有统计含义的单元，再保留第一批球员作为参照，加入另一年代。仅包含开篇与初次比较，不是一篇完整 NBA 故事。

![作品预览](preview.png)

- [查看试作](result/index.html)
- [复作任务](prompt.md) · [研究输入](inputs/INPUT.md)
- [记录](result/data/records.json) · [素材来源](result/assets.json)

## 查看

在本案例目录执行：

```bash
python3 -m http.server 8000 --bind 127.0.0.1 --directory result
```

打开 <http://127.0.0.1:8000/>，向下滚动进入分布及比较，向上可返回开篇。使用桌面浏览器，本地资源，无需构建。

`prompt.md` 用于重新制作同类局部作品，不要求复刻现有布局和运动路径。独立创作时只提供 Skill、任务及输入。

## 数据与素材

位置组中的单元代表球员与位置的对应关系，多位置球员可在不同组出现；开篇的装饰粒子与数据单元分别处理。此段比较 1960 年代和 2000 年代的球员分布，不代表每位球员跨年代发生了变化。

数据快照来自 [NBA Stats](https://www.kaggle.com/datasets/sumitrodatta/nba-aba-baa-stats)，见输入来源。标志来自 NBA 官方 CDN，具体地址及用途在 `assets.json`；其权利独立于代码和数据许可，不适用仓库 MIT 代码许可。
