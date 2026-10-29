# 香港：夏天变热了吗

使用 [prompt.md](prompt.md) 和 [inputs/](inputs/) 中的固定快照测试 `unit-data-storytelling`。本文件供完成后验收，不交给创作 Agent；文件哈希见 [fixtures.json](fixtures.json)。创作者可以扩展研究与素材，自行选择叙事主线。

## 输入

香港天文台测站 1961–2025 年的 23,741 天最高、最低、平均气温，以及测站说明、质量标记和 780 个 ONI 三个月滑动窗口。见 [INPUT.md](inputs/INPUT.md)、[station.json](inputs/station.json) 和 [sources.json](inputs/sources.json)。

## 验收要点

- 固定夏季或日期窗口后再跨年比较；说明单站记录的范围，不把它直接称为全市平均或体感温度。
- 正确区分日最低温、日最高温、日平均温、热夜与酷热日。日最低温不是夜间平均温。
- 连续炎热天数按实际连续日期计算；频数、平均值和极端事件使用清楚的分母与参照。
- ONI 为重叠的三个月指标，不能作为独立月份样本；天气事件、厄尔尼诺、城市发展和长期变暖之间的因果解释需要额外证据。
- 图形应帮助读者看见变化，正文与重点一致；真实查看动画、标注及探索，不规定必须使用日历或固定章节。

## 来源与使用

气温来自[香港天文台开放数据](https://www.hko.gov.hk/en/abouthko/opendata_intro.htm)，使用时保留香港天文台、香港特别行政区政府及 DATA.GOV.HK 的来源署名，参阅[开放数据使用条款](https://data.gov.hk/en/terms-and-conditions)。ONI 来自 NOAA CPC，固定版本与原始地址在 `sources.json`；使用时注明经过整理，参阅 [NWS disclaimer](https://www.weather.gov/disclaimer)。

按[固定任务说明](../../README.md#执行和验收)仅提供 Skill、提示词与输入。新增材料另存，不修改本快照。
