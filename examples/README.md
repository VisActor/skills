# Skill 案例展示

这里展示对应 Skill 的任务提示词、输入、最终结果与预览。

## chart-storytelling

| 案例 | 展示能力 | 输入说明 |
| --- | --- | --- |
| [全球 CO₂ 数据故事](chart-storytelling/global-co2/README.md) | 暗色滚动叙事、排放与温升视角、分步图表 | OWID 数据；仅保留部分输入，无法完整重新生成 |
| [Las Vegas Web-PPT](chart-storytelling/las-vegas-web-ppt/README.md) | 14 张网页幻灯片、商业分析图表、章节转场 | 模拟演示数据，不是真实赛事经营结果 |

## editorial-magazine

| 案例 | 展示能力 | 输入说明 |
| --- | --- | --- |
| [秋日穿搭指南](editorial-magazine/autumn-outfits/README.md) | 多套穿搭总览与单套拆解，统一中性背景、服装抠图与配色说明。 | 图片快照；原始素材及可编辑源稿未附 |
| [威海旅行手册](editorial-magazine/weihai-travel/README.md) | 风景填字封面、文化介绍与逐日路线图。 | 图片快照；原始素材及可编辑源稿未附 |
| [四类新闻资讯排版](editorial-magazine/news-digest/README.md) | 股市、娱乐、民生与科技的报刊式信息组织：主新闻、配图、分栏与简讯。 | 图片快照；原始素材及可编辑源稿未附 |
| [孙宇晨人物生平组图](editorial-magazine/justin-sun-biography/README.md) | 人物全景主图与多图详情，兼顾连续正文、经历、代表项目与社会活动。 | 图片快照；原始素材及可编辑源稿未附 |
| [情感夜读：原帖选读](editorial-magazine/opinion-editorial/README.md) | 保留原文的观点编辑与多页专题，使用统一色调、栏目标题和长文阅读版式。 | 图片快照；原始素材及可编辑源稿未附 |
| [名人爱情故事：按时间展开](editorial-magazine/love-story-sequence/README.md) | 以贝克汉姆夫妇为例，用概览页与逐节点图文组织时序叙事。 | 图片快照；原始素材及可编辑源稿未附 |

## life-chronicle

| 案例 | 展示能力 | 输入说明 |
| --- | --- | --- |
| [居里夫人三种版式](life-chronicle/marie-curie-layouts/README.md) | 照片墙、中心网格、环形叙事 | 本地渲染；复现提示词与公开资料入口 |
| [游本昌：竖版照片墙人物志](life-chronicle/you-benchang/README.md) | 人物抠图与事件图文编排 | 历史生成结果；提示词与复现限制见案例 |
| [大 S：横版照片墙人物志](life-chronicle/barbie-hsu/README.md) | 人物抠图与事件图文编排 | 历史生成结果；提示词与复现限制见案例 |
| [刘欢：竖版环形人物志](life-chronicle/liu-huan/README.md) | 人物抠图与事件图文编排 | 历史生成结果；提示词与复现限制见案例 |

## person-poster

| 案例 | 展示能力 | 输入说明 |
| --- | --- | --- |
| [玛丽·居里：两次诺奖，两门科学](person-poster/marie-curie-nobel/README.md) | 摄影主视觉、奖项份额、可编辑HTML与2x PNG | 诺奖事实整理输入、公开肖像与来源 |
| [博尔特：短跑成绩档案](person-poster/usain-bolt-sprint/README.md) | 真实照片剪影、项目区分、同项目决赛图表、HTML与2x PNG | 原图、原生蒙版、原始RGB保留与CC BY3.0BR署名 |
| [贝多芬：交响曲作品编年](person-poster/beethoven-symphonies/README.md) | 九部作品的首次演出编年、乐章数量图表、HTML与2x PNG | 音乐学院逐作品资料；年份含私人演出 |
| [Ada Lovelace：分析机笔记](person-poster/ada-lovelace-notes/README.md) | 人物与事件编排、无图表、HTML-only | 博物馆事实与公开肖像；预览仅为网页截图 |
| [虚构创作者：作品与媒介](person-poster/fictional-creator-studio/README.md) | AI插画、年度产出与媒介组成、HTML与2x PNG | 明确虚构人物与15条模拟计数；附生图提示词 |

## VBI 交互示例

每个 Skill 提供一个单文件 HTML；地震示例联网读取 USGS，其余示例内嵌数据。

| Skill / HTML | 示例 | 说明 |
| --- | --- | --- |
| [visactor-light-dashboard](visactor-light-dashboard/retail-sales/result/index.html) | 零售月度脉搏 | [使用说明](visactor-light-dashboard/retail-sales/README.md) |
| [visactor-map2d-dashboard](visactor-map2d-dashboard/global-earthquakes/result/index.html) | 全球地震观测 | [使用说明](visactor-map2d-dashboard/global-earthquakes/README.md) |
| [visactor-chart-editor](visactor-chart-editor/self-service-analysis/result/index.html) | 自助式分析 | [使用说明](visactor-chart-editor/self-service-analysis/README.md) |
| [visactor-map3d-dashboard](visactor-map3d-dashboard/global-air-quality/result/index.html) | 全球空气质量 | [使用说明](visactor-map3d-dashboard/global-air-quality/README.md) |

## 案例结构

新增案例按 `examples/<skill-name>/<case-name>/` 组织，Skill 名与运行目录一致。

```text
examples/<skill-name>/<case-name>/
  README.md          # 任务介绍、结果链接与使用说明，使用案例本身的语言
  prompt.md          # 测试任务的提示词
  inputs/            # 可公开的源数据与素材；无输入时可省略
  result/            # 最终 HTML、图片或其他交付文件
  preview.png        # 有代表性的截图或导出图片
```

每个案例保持精简，方便在 GitHub 浏览。最终产物及其必需的本地资源放入 `result/`，说明外部运行依赖与打开方式。不收录缓存、依赖目录或整段 Agent 会话。如果输入无法公开，使用可公开的替代材料重新执行；或者明确标注缺失输入及无法完整复现的限制。

## 案例说明

每个案例只保留一份 `README.md`：中文案例用中文，英文案例用英文。内容包括：

- 任务和展示的能力。
- 提示词、输入数据、最终结果与预览的链接。
- 打开结果和使用 Skill 测试该任务的方法，以及所需运行依赖。
- 影响使用的数据说明，例如模拟数据或不完整的输入。

案例来源、迁移过程、资源适配和内部验证日志不放在案例介绍中。替换案例时，同步更新提示词、输入、结果与预览。

## 与测试的关系

`examples/` 面向用户展示效果。确定性回归放在 `tests/`，固定模型任务与验收标准放在 `cases/`，浏览器 smoke 放在 `tests/browser/cases/`。

展示案例可以来自测试，但需要看过实际内容与视觉结果后再收录。模板占位内容和合成 smoke 产物不会自动成为优秀案例。CI 不调用模型重新生成案例，也不对展示截图做像素比对。如果案例揭示了稳定的回归问题，应在对应测试目录补充有针对性的测试。
