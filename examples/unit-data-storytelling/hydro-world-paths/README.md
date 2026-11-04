# 翅膀先到了。

在《我的世界》，末地城附近的船里能找到一双用于滑翔的鞘翅。玩家总是先找到城，再得到翅膀吗？这篇中文数据故事跟着同一批账号读到城、播种与建造的记录，最后让读者动手看看，至少多少人既飞过，也在地面上做过东西。

![翅膀先到了。玩家滑过悬岛上的末地城与飞船。](preview.png)

[打开作品](result/index.html) · [同主题复作任务](prompt.md) · [研究输入](inputs/INPUT.md) · [实现前的设计稿](story-design.md)

网页可直接用桌面浏览器打开，向下滚动或按方向键翻页。图片、脚本和数据均随作品提供。

## 复作这篇作品

让使用 `unit-data-storytelling` 的 Agent 阅读 [prompt.md](prompt.md) 与 [inputs/](inputs/)，可以从同一份存档中选择自己的故事。如果想沿着本作的线索重新设计，可在原题后补充这一句：

> 从一双鞘翅出发：拿到它的人，总是先到过它会出现的末地城吗？再跟着这批账号看看，飞行、播种和建造怎样出现在同一份存档里。

在案例目录运行 `uv run --no-project python scripts/build_data.py`，可从随附的进度路径和行为表重新计算[网页使用的统计数据](result/assets/data.js)。

## 数据与素材

样本含 1,117 个游玩时长、已发现环境种类均有正值记录的账号，快照时间为 2026 年 11 月 3 日 14:19（北京时间）。进度记录保留解锁顺序。飞行、放置与制作按账号累计，分组表只给出各项行为的人数，最后一幅图标出两项行为共同参与人数的下限。

数据来自 [Hydro Vanilla SMP](https://hydrosmp.com/)。公开使用须署名并链接服务器，商业用途须先取得许可。见 [Hydro API 使用条款](https://api.hydrosmp.com/#terms)。

末地城、飞船、农田与图符均为原创示意插画。有关鞘翅的游戏设定见 [Minecraft 官方的末地城介绍](https://www.minecraft.net/en-us/article/end-city)。
