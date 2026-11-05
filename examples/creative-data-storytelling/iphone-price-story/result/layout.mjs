// Pure geometry: price is always vertical; every node keeps a model/capacity identity.
export const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const mix = (a, b, t) => a + (b - a) * t;
export const ease = v => { const t = clamp(v); return t * t * (3 - 2 * t); };
export const nodeKey = (modelId, capacity) => `${modelId}@${capacity}`;
export function priceY(value, domain, top, bottom) {
  return bottom - (value - domain[0]) / (domain[1] - domain[0]) * (bottom - top);
}
export function flatten(models) {
  return models.flatMap((model, order) => model.prices.map((price, capacityIndex) => ({
    ...price, id: nodeKey(model.id, price.storageLabel), model, order, capacityIndex,
    entry: capacityIndex === 0,
    premium: ['premium', 'premium-large', 'pro', 'pro-max'].includes(model.family)
  })));
}
export function filterNode(node, capacity, includeOther) {
  const family = node.model.family;
  const inScope = includeOther || !['budget', 'mini', 'air'].includes(family);
  return inScope && (capacity === 'entry' ? node.entry : node.storageLabel === capacity);
}
export function repricedValue(event, progress) {
  return mix(event.beforeCNY, event.afterCNY, ease(progress));
}
export function chapterProgress(scrollY, start, height, viewport) {
  return clamp((scrollY - start) / Math.max(1, height - viewport), 0, .999999) * 8;
}
export function timelineX(node, left, right) {
  const offset = { core: -.13, plus: .05, premium: .16, 'premium-large': .34, pro: .04, 'pro-max': .23, budget: -.29, mini: -.31, air: .4 }[node.model.family] ?? 0;
  return mix(left, right, (node.model.generationYear - 2010 + offset) / 16.5);
}

// Selection changes the compared SKU, never the launch price of an existing SKU.
// Use this same state for the chart, prose and accessible step controls.
export function capacityComparison(phase, records, reduced = false) {
  const reveal = reduced ? Number(phase >= .4) : ease((phase - .30) / .20);
  const matched = phase >= .4;
  const left = matched ? records.oldMatched : records.oldEntry;
  return {
    mode: matched ? 'matched' : 'entry', reveal,
    leftKey: left.id, rightKey: records.newEntry.id,
    delta: records.newEntry.priceCNY - left.priceCNY,
  };
}
