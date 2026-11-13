import { trendExample, createTrendModel, mountTrend } from "../material-trend/scene.mjs";

// 只取原值走势；无需接入食材系列或同比所需的上年同期数据。
export const materialOpening = {
  ...trendExample,
  series: trendExample.series.filter(series => series.id === "burger").map(series => ({
    ...series,
    observations: series.observations.filter(row => row.date >= trendExample.startDate),
  })),
  stops: trendExample.stops.filter(stop => ["cover", "start", "rise"].includes(stop.id)),
};

export function materialOpeningFacts(config = materialOpening) {
  const model = createTrendModel(config), first = model.primary.points[0];
  const lastStop = [...model.stops.values()].at(-1);
  const last = model.primary.points.find(point => point.id === lastStop.throughId);
  if (!last || lastStop.basis !== 'raw') throw new Error('Material opening ends on an observed raw price');
  return { first, last, difference: last.value - first.value };
}

export function mountMaterialOpening(root, { config = materialOpening, duration = 1450 } = {}) {
  const { difference } = materialOpeningFacts(config);
  root.querySelectorAll('[data-price-difference]').forEach(el => {
    el.textContent = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 }).format(difference);
  });
  return mountTrend(root, { config, duration });
}
