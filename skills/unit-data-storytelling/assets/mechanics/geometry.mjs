// Presentation geometry only; data scope and interpretation stay with the story.
export const clamp01 = (value) => Math.max(0, Math.min(1, value));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = (t) => t * t * (3 - 2 * t);

export function keyed(rows) {
  const result = new Map();
  for (const row of rows) {
    if (typeof row.id !== "string" || !row.id || result.has(row.id)) {
      throw new Error("Expected a unique nonempty display id: " + row.id);
    }
    result.set(row.id, row);
  }
  return result;
}

export function linearScale(domain, range) {
  if (domain.length !== 2 || range.length !== 2 ||
      ![...domain, ...range].every(Number.isFinite) || domain[0] >= domain[1]) {
    throw new Error("Expected a finite increasing domain and a finite two-value range");
  }
  const k = (range[1] - range[0]) / (domain[1] - domain[0]);
  return { k, b: range[0] - domain[0] * k };
}

export const at = (scale, value) => scale.k * value + scale.b;
export const mixScale = (a, b, t) => ({ k: lerp(a.k, b.k, t), b: lerp(a.b, b.b, t) });

export function areaFor(weight, areaPerUnit) {
  if (!Number.isFinite(weight) || weight < 0 ||
      !Number.isFinite(areaPerUnit) || areaPerUnit <= 0) {
    throw new Error("Expected a finite nonnegative weight and positive area calibration");
  }
  const area = weight * areaPerUnit;
  if (!Number.isFinite(area)) throw new Error("Area exceeds finite range");
  return area;
}

export const radiusForArea = (area) => Math.sqrt(areaFor(area, 1) / Math.PI);
