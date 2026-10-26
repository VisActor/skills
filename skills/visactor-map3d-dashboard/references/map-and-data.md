# 空气质量示例数据与空间语义

本篇记录[模板](../templates/template.html)的具体示例，替换业务时重新核对；以下数值和门槛不是其他业务的默认规则。分析方法见[共享指南](metric-analysis/guide.md)和[空间分析](metric-analysis/map.md)。

## 来源与事实粒度

模板内嵌 `template-air-pollution.csv` 的全部 23,463 行、原始 12 列，每行是一条来源城市样本。没有采样日期、采样设计、时区、人口或城市经纬度，不能据此生成实时趋势、官方国家 AQI、人口暴露或治理效果。

原列为 Country、City、AQI Value／Category，以及 CO、Ozone、NO2、PM2.5 各自的 AQI Value／Category。接入映射为 `country/city/aqi/category/co/coCategory/ozone/ozoneCategory/no2/no2Category/pm25/pm25Category`，保留原值与 null，生成稳定行 ID。`countryKey`／`cityKey` 用于缺失分组，逐行阈值和质量标志声明在 schema 后交给 Builder 聚合。

国家均值按来源样本行等权，并列显示 n；既不能平均国家均值代替总体，也不能由样本量门槛推断国家代表性。示例国家比较的最低 n 和 Top N 是可调整的展示条件，需检查排名对这些选择是否敏感。

## 可复算基线

| 范围                     | 样本 n |   AQI 均值 | AQI >100 | 非空国家 |
| ------------------------ | -----: | ---------: | -------: | -------: |
| 全部含未标注             | 23,463 |  72.010868 |    4,244 |      175 |
| India                    |  2,488 | 152.964228 |    1,765 |        1 |
| China                    |    795 | 126.953459 |      521 |        1 |
| United States of America |  2,872 |  59.740599 |      152 |        1 |

全量敏感性基线：严格高于P90=153的样本2,337条，保留21,126条的均值57.954984；不修改或丢弃原数据。

全部中位数55，P90为153；median 偶数取中间两项均值，P90用 nearest-rank。AQI>150 共2,610行。原数值列无缺失，整行没有重复；国家缺失427行、城市缺失1行。

来源六等级依次为 Good 9,936、Moderate 9,231、Unhealthy for Sensitive Groups 1,591、Unhealthy 2,227、Very Unhealthy 287、Hazardous 191。来源等级与数值分箱不一致148行，总 AQI 不等于四项子指数最大值141行，保留差异并提供记录核对，不自动修正。

CO／O₃／NO₂／PM2.5 为 AQI 子指数，不能解释成浓度或相加得到污染贡献。PM2.5 达到最高子指数的18,523行包含并列，不能称为唯一主导。

## 地理身份与数据编码

国家几何来自 [Natural Earth v5.1.2 1:110m](https://github.com/nvkelso/natural-earth-vector/blob/v5.1.2/geojson/ne_110m_admin_0_countries.geojson)，代表位置来自[同版1:10m元数据](https://github.com/nvkelso/natural-earth-vector/blob/v5.1.2/geojson/ne_10m_admin_0_countries.geojson)的 LABEL_X／LABEL_Y，属[公共领域](https://www.naturalearthdata.com/about/terms-of-use/)。显式别名覆盖全部非空国家，不凭城市名称修正来源归属或猜城市坐标。

国家柱和点位于真实国家代表位置，微型国家可能只有代表点；未标注记录仍计入总体及分析，不绘制伪位置。局部城市任务需要合适投影、真实坐标和边界，不能放大代表点地球代替精确地图。

Builder 按国家输出 `mean=avg(aqi)`、`n=sum(rowCount)`、`high=sum(high)`、`highRate=avg(high)`；high 为 AQI>100 的逐行0／1标记。地球只消费结果，均值固定0–500，占比固定0–100%，不按当前最大值重新归一化。占比分母是该国全部来源样本。

连续色阶用于数值柱／点／图例，来源分类色保留原义；蜂窝与经纬网是背景，不是 H3 聚合或监测站。选中国家保留全球比较背景；国家分析继承全部当前国家记录，不误套风险分析的 AQI>100 固有条件。

## 地表影像与高程

| 资源     | 来源与时间                                                                                                                                                            | 表达边界                                                                   |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 自然地表 | [NASA Blue Marble，2004年8月](https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-topography/)，5400×2700                               | 地理背景，不代表当前环境观测                                               |
| 高程     | [NASA 发布的 GEBCO 栅格](https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/topography-bathymetry-maps/)，`gebco_08_rev_elev_5400x2700.jpg` | 约8km／像素、0–6400m编码，驱动真实位移与法线；视觉夸张35倍，不能测精确峰值 |
| 云图     | [NASA Blue Marble，2002历史合成](https://science.nasa.gov/earth/earth-observatory/the-blue-marble-true-color-global-imagery-at-1km-resolution/)                       | 受光背景，不是当前天气或 AQI 解释变量                                      |
| 夜光     | [NASA Black Marble，2016](https://science.nasa.gov/earth/earth-observatory/earth-at-night/maps/)，`BlackMarble_2016_01deg_gray.jpg`                                   | 历史合成背景，不是 AQI 站点、业务密度或实时灯光                            |

保留 NASA Earth Observatory 及 NASA／GEBCO 署名。影像亮度不作为高程，几何、边界、标记与遮挡使用同一真实经纬和高程；光照为视图构图，不表示观测时刻的太阳。加载与降级见[资源指南](resource-loading.md)，性能与清理见[维护边界](template-adaptation.md#图形性能与释放)。
