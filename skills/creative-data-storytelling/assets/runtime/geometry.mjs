// Reusable geometry; independent of DOM, renderer and story structure.
export const clamp01 = (value) => Math.max(0, Math.min(1, value));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = (t) => t * t * (3 - 2 * t);

export function linearScale(domain, range) {
  if (
    domain.length !== 2 || range.length !== 2 ||
    ![...domain, ...range].every(Number.isFinite) || domain[0] >= domain[1]
  ) throw new Error("linearScale requires a finite increasing two-value domain and finite range");
  const k = (range[1] - range[0]) / (domain[1] - domain[0]);
  return { k, b: range[0] - domain[0] * k };
}

export const at = (scale, value) => scale.k * value + scale.b;
export const mixScale = (a, b, t) => ({ k: lerp(a.k, b.k, t), b: lerp(a.b, b.b, t) });

// A locator reads the main view's current transform, not a second animation clock.
export function visibleDomain(scale, range) {
  if (!Number.isFinite(scale.k) || scale.k === 0 || !Number.isFinite(scale.b) ||
    range.length !== 2 || !range.every(Number.isFinite))
    throw new Error("visibleDomain requires an invertible finite scale and two finite edges");
  return range.map((pixel) => (pixel - scale.b) / scale.k).sort((a, b) => a - b);
}

// Records must already be additive, in the intended order and in the same unit.
// A stable segment id belongs to the increment; adding a base does not change it.
export function accumulationSegments(base, rows) {
  if (!Number.isFinite(base) || base < 0 || !Array.isArray(rows))
    throw new Error("Accumulation requires a nonnegative finite base and a record array");
  keyed(rows);
  let total = base;
  const segments = rows.map((row) => {
    if (!Number.isFinite(row.amount) || row.amount < 0)
      throw new Error("Increment " + row.id + " requires a nonnegative finite amount");
    const start = total;
    total += row.amount;
    if (!Number.isFinite(total)) throw new Error("Accumulation exceeds finite range");
    return { id: row.id, row, start, end: total, amount: row.amount };
  });
  return { base, segments, total };
}

export function areaFor(weight, areaPerUnit) {
  if (!Number.isFinite(weight) || weight < 0 || !Number.isFinite(areaPerUnit) || areaPerUnit <= 0)
    throw new Error("Area requires a nonnegative finite weight and positive calibration");
  return weight * areaPerUnit;
}

export const radiusForArea = (area) => Math.sqrt(areaFor(area, 1) / Math.PI);

export function keyed(rows) {
  const result = new Map();
  for (const row of rows) {
    if (typeof row.id !== "string" || !row.id || result.has(row.id))
      throw new Error("Each display instance needs a unique nonempty string id: " + row.id);
    result.set(row.id, row);
  }
  return result;
}
