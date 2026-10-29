# 航班：起飞晚了，到达会怎样

使用 [prompt.md](prompt.md) 和 [inputs/](inputs/) 测试 `unit-data-storytelling`。本文件供完成后验收，不交给创作 Agent；文件哈希见 [fixtures.json](fixtures.json)。提示词保留开放的分析任务，不预设故事线、图表或动画。

## 输入

美国 BTS 2025 年 7 月报告承运人的国内航班记录，保留整月 631,428 次航班，包含取消、备降和缺失项；并非所有美国航班的普查。压缩 CSV 无需先解压，可用 Python `gzip` 逐行读取。

字段定义、机场表、稳定记录 ID、质量标记与来源见 [INPUT.md](inputs/INPUT.md)、[fields.csv](inputs/fields.csv)、[airports.csv](inputs/airports.csv) 和 [sources.json](inputs/sources.json)。

## 验收要点

- 清楚区分全部记录、正常完成、取消、备降以及可比较起降延误的记录；筛选与分母一致。
- 保留有符号延误。到达晚于计划时刻与 BTS 的到达晚点至少 15 分钟是不同定义。
- `DepDelay - ArrDelay` 表示相对计划时刻的延误减少，不直接等于飞机飞得更快；解释时考虑计划时长、滑行和异常记录。
- 不静默删除 13 条时长关系不一致记录；处理方式与数据说明一致。
- 结果有清晰的发现和可见证据，单元数量或抽样含义透明；可选择航线、机场或时段细看，不要求固定分析结论。
- 在浏览器中检查实际阅读、关键转换和交互；不把生成成功当作叙事有效的证明。

## 来源与使用

原始数据来自美国交通统计局 [BTS Airline On-Time Performance](https://www.transtats.bts.gov/ONTIME/)，[2025 年 7 月 ZIP](https://www.transtats.bts.gov/PREZIP/On_Time_Reporting_Carrier_On_Time_Performance_1987_present_2025_7.zip) 的地址、字段来源与校验值已保留。此处为研究用字段整理，非 BTS 官方发布页面；引用时注明 BTS 及整理口径。

按[固定任务说明](../../README.md#执行和验收)仅提供 Skill、提示词与输入。新增材料另存，不修改本快照。
