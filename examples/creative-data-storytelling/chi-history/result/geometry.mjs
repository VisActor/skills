export const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (v) => {
  const t = clamp(v);
  return t * t * (3 - 2 * t);
};
export const lengthCm = (record, unit = "chi") => {
  if (!["core", "context"].includes(record.role))
    throw new Error("Only selected evidence can drive ruler geometry");
  if (!Number.isFinite(record.chi_cm) || record.chi_cm <= 0)
    throw new Error("Invalid chi length");
  const multiplier = { cun: 0.1, chi: 1, zhang: 10 }[unit];
  if (multiplier === undefined) throw new Error("Unknown unit: " + unit);
  return record.chi_cm * multiplier;
};
export const extent = (record, unit, pxPerCm) =>
  lengthCm(record, unit) * pxPerCm;
export function chapterPosition(progress, reduced = false, lastChapter = 4) {
  const p = clamp(progress, 0, lastChapter);
  if (reduced) return Math.round(p);
  const i = Math.floor(p);
  return i + smooth((p - i - 0.18) / 0.64);
}
// Presentation masks do not alter the underlying measurements.
export function revealEdge(amount) {
  const t = clamp(amount);
  const x = 110 - t * 120;
  const amplitude = Math.sin(Math.PI * t) * 5;
  const edge = Array.from({ length: 97 }, (_, i) => {
    const y = (i / 96) * 100;
    const u = (i / 96) * 24;
    const wave = Math.sin(u * 0.63 + t * 3) + Math.sin(u * 1.43) * 0.28;
    return `${x + wave * amplitude}% ${y}%`;
  });
  return `polygon(${edge.join(",")}, 110% 100%, 110% 0%)`;
}

export function modelCorrespondence(actualCm, ratio = 100) {
  if (
    !Number.isFinite(actualCm) ||
    actualCm <= 0 ||
    !Number.isFinite(ratio) ||
    ratio <= 0
  )
    throw new Error("Model dimensions and ratio must be positive");
  return actualCm / ratio;
}
export function comparisonLayout(
  records,
  width,
  height,
  unit = "chi",
  archive = false,
) {
  const origin = width * 0.23;
  const pxPerCm = (width * 0.6) / (unit === "zhang" ? 400 : 40);
  const start = archive ? (records.length === 1 ? 0.58 : 0.51) : 0.43;
  const gap = archive
    ? Math.min(0.105, 0.29 / Math.max(1, records.length - 1))
    : 0.115;
  return records.map((r, i) => ({
    id: r.id,
    x: origin,
    y: height * (start + i * gap),
    width: extent(r, unit, pxPerCm),
    height: height * (archive ? 0.04 : 0.045),
    angle: 0,
    opacity: 1,
    labels: 1,
    count: unit === "zhang" ? 10 : 1,
  }));
}
