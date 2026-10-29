# 航班出发与到达：起始数据包

整理日期：2026-10-28。来源为美国交通统计局 BTS 的 Reporting Carrier On-Time Performance，覆盖 2025-07-01 至 2025-07-31。提供逐航班原始观测的字段子集，未预先计算故事结论、选择典型航班或指定设计。

## 文件与覆盖

| 文件 | 内容 |
| --- | --- |
| `flight-records.csv.gz` | gzip 压缩的 UTF-8 CSV；631,428 次计划航班运行，保留出发、到达、耗时、状态及可选延误原因字段 |
| `airports.csv` | 从本月原始记录提取的起讫机场代码、BTS 机场 ID、所在城市与州；不是机场中文名称或坐标表 |
| `fields.csv` | 逐字段的原始字段名、类型、单位与说明 |
| `sources.json` | 官方下载地址、取得时间、源文件哈希、处理方式及定义文档入口 |
| `manifest.json` | 本包文件大小、行数和 SHA-256 |

这是 reporting-carrier 表覆盖的美国国内定期航班运行，含 14 个承运人代码；不是全球所有航班，也不是每位旅客的记录。此完整月份在预分析之前选定，仅是研究起点，不代表全年或所有季节。

本月有 15,473 班取消、3,144 班备降，二者不重叠。其余 612,811 班完成且未备降，并有成对的出发、到达延误值。取消、备降行仍在输入中；用于不同分析时，应分别定义分母。缺失保留为空字符串，不用零填补。

## 身份、时刻与数值

- 一行是某日的一次航班运行。`flight_id` 由日期、报告承运人代码、航班号、起点、终点和计划出发时刻组成，在本包唯一。相同航班号在不同日期是不同记录。
- 除 `flight_id` 与 `elapsed_consistency` 外，字段保留 BTS 名称。数值只把如 `20.00` 的整数形式规范为 `20`，不改观测值。类型和对应关系见 `fields.csv`。
- `CRSDepTime` / `DepTime`、`CRSArrTime` / `ArrTime` 是计划 / 实际的**登机口**时刻，按各机场当地时间表示为 HHMM 字符串，不是十进制小时。`2400` 及跨午夜情况保留；不直接相减异地钟表值来计算耗时。延误、耗时字段已经以分钟给出。
- `DepDelay`、`ArrDelay` 是实际减计划的分钟数，提前为负数。采用这些有符号字段，不把提前截断为零。
- BTS 的“准点到达”范围是 `ArrDelay < 15`；恰好晚 15 分钟属于延误。按计划时间或更早到达是 `ArrDelay <= 0`，两者口径不同。
- `Cancelled`、`Diverted` 为 0 / 1。报告中的取消原因码为 A 承运人、B 天气、C 国家航空系统、D 安保；空值表示未填报，不等于“没有原因”。
- `Reporting_Airline` 为源表报告承运人代码。`airports.csv` 用 `airport_code` 关联 `Origin` / `Dest`，`city_name` 是源表城市标签，不能据此合并同城不同机场。承运人全称、机场名称及背景可按需要另查。

## 耗时与原因字段的限制

`CRSElapsedTime` / `ActualElapsedTime` 是计划 / 实际登机口间耗时。`AirTime`、`TaxiOut`、`TaxiIn` 是实际空中与滑行分钟，不包含各自对应的计划值。延误减少不能单独归因于飞得更快、顺风或时刻表预留。

`CarrierDelay`、`WeatherDelay`、`NASDelay`、`SecurityDelay`、`LateAircraftDelay` 是报告原因分钟，主要用于到达延误至少 15 分钟的记录。准点、备降等记录中的空值不能当成所有原因均为零；天气也可能涉及其他原因分类。它们不能完整解释所有航班怎样改变到达状态。

`FirstDepTime`、`TotalAddGTime`、`LongestAddGTime` 保留返回登机口相关信息。实际出发时刻可能是返回登机口后最后一次出发，不能只用它估计乘客全部等待时间。

`elapsed_consistency` 是整理时附加的质量标记：当四项均有值时，检查 `ArrDelay - DepDelay = ActualElapsedTime - CRSElapsedTime`。`consistent` 表示一致，`inconsistent` 表示不一致，`unavailable` 表示缺少所需字段。本包有 13 条不一致记录，都填报了返回登机口字段；保留原值，没有擅自修正。涉及精确耗时拆解时，应检查这些记录并说明处理方式。

定义来源：[BTS 2025 报送说明](https://www.bts.gov/explore-topics-and-geography/modes/aviation/number-39-technical-directive-reporting-time)及官方数据 ZIP 内的字段说明。数据不含旅客人数、票价、主观体验、风速或完整天气观测。

## 读取、选取与补充

无需下载原始大表即可读取本包，例如 Python 标准库：

```python
import csv
import gzip

with gzip.open("inputs/flight-records.csv.gz", "rt", encoding="utf-8", newline="") as stream:
    for flight in csv.DictReader(stream):
        pass  # 选择字段、过滤或派生自己的分析数据
```

可从全月统计中选择有意义的范围；若抽样或筛选，保留可复现的方法、样本身份和实际分母。前后比较应保持记录身份，来源没有支持的状态不要补成观测。页面可使用自己整理的轻量派生文件，不必在浏览器加载全部明细。

可以补充其他月份、机场、天气或研究资料，与原输入分别保存并说明关联口径。原文件与哈希用于固定研究起点，不限制补充研究。包内没有图片或预设开场；需要时可独立寻找或制作静态素材。
