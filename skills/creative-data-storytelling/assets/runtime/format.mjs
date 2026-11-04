// One display policy for matching prose, labels and readouts. Geometry keeps raw values.
export function createValueFormat({
  unit = "", divisor = 1, digits = 1, locale = "zh-CN",
  useGrouping = true, signDisplay = "auto", missing = "—", separator = " ",
} = {}) {
  if (typeof unit !== "string" || typeof missing !== "string" || typeof separator !== "string" ||
      !Number.isFinite(divisor) || divisor <= 0 || !Number.isInteger(digits) || digits < 0 || digits > 20)
    throw new Error("Value format needs text labels, a positive divisor and 0–20 decimal digits");
  const options = { minimumFractionDigits: digits, maximumFractionDigits: digits, useGrouping };
  const display = new Intl.NumberFormat(locale, { ...options, signDisplay });
  const magnitude = new Intl.NumberFormat(locale, { ...options, signDisplay: "never" });
  const zero = magnitude.format(0);
  function number(value) {
    if (value === null || value === undefined) return missing;
    if (!Number.isFinite(value) || !Number.isFinite(value / divisor))
      throw new Error("Readouts require finite numeric values; use null or undefined for missing data");
    const scaled = value / divisor;
    // Suppress negative zero using the formatter's actual rounding and locale.
    return display.format(magnitude.format(scaled) === zero ? 0 : scaled);
  }
  function format(value) {
    const text = number(value);
    return value === null || value === undefined || !unit ? text : text + separator + unit;
  }
  return Object.freeze({ unit, divisor, digits, number, format });
}
