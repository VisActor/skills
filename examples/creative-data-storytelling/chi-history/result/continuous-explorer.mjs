import { lengthCm } from "./geometry.mjs";
const escape = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const num = (n) => Number(n.toFixed(3)).toString();
export function comparisonValues(a, b, unit) {
  const divisor = unit === "zhang" ? 100 : 1;
  return {
    a: lengthCm(a, unit) / divisor,
    b: lengthCm(b, unit) / divisor,
    delta: (lengthCm(b, unit) - lengthCm(a, unit)) / divisor,
    unit: unit === "zhang" ? "米" : "厘米",
    domain: unit === "chi" ? 40 : 4,
  };
}
export function setupExplorer(rows, openSources) {
  const a = document.querySelector("#compare-a"),
    b = document.querySelector("#compare-b"),
    unit = document.querySelector("#compare-unit");
  const option = (r) =>
    '<option value="' +
    r.id +
    '">' +
    escape(r.period + " · " + r.system_name) +
    "</option>";
  a.innerHTML = b.innerHTML = rows.map(option).join("");
  a.value = "yuan-building";
  b.value = "yuan-tailoring";
  const update = () => {
    const ra = rows.find((r) => r.id === a.value),
      rb = rows.find((r) => r.id === b.value),
      v = comparisonValues(ra, rb, unit.value);
    const unitName = { cun: "寸", chi: "尺", zhang: "丈" }[unit.value];
    let markup = "";
    for (let i = 0; i <= 4; i++) {
      const x = 220 + i * 157.5;
      markup +=
        '<path d="M' +
        x +
        ' 30V178" stroke="#253c391a"/><text x="' +
        x +
        '" y="204" text-anchor="middle" fill="#716e62" font-size="12">' +
        num((v.domain * i) / 4) +
        "</text>";
    }
    [ra, rb].forEach((r, i) => {
      const val = i ? v.b : v.a,
        w = (val / v.domain) * 630,
        y = 52 + i * 76;
      markup +=
        '<text x="198" y="' +
        (y + 19) +
        '" text-anchor="end" fill="#253c39" font-size="15">' +
        escape(r.period) +
        '</text><text x="198" y="' +
        (y + 38) +
        '" text-anchor="end" fill="#716e62" font-size="11">' +
        escape(r.system_name) +
        '</text><rect x="220" y="' +
        y +
        '" width="' +
        w +
        '" height="32" fill="' +
        (i ? "#9b4936" : "#426359") +
        '"/><text x="' +
        (236 + w) +
        '" y="' +
        (y + 22) +
        '" fill="#253c39" font-size="18">' +
        num(val) +
        "</text>";
    });
    markup +=
      '<text x="895" y="204" fill="#716e62" font-size="12">' +
      v.unit +
      "</text>";
    document.querySelector("#comparison-graphic").innerHTML =
      "<title>两项记录的一" +
      unitName +
      "长度比较，单位" +
      v.unit +
      "</title>" +
      markup;
    document.querySelector("#comparison-result").textContent =
      "各取一" +
      unitName +
      "，所选参考值相差 " +
      num(Math.abs(v.delta)) +
      " " +
      v.unit +
      "。同尺制换算，不是两件器物的实测。";
    document.querySelector("#compare-source-a").textContent =
      "第一把尺的依据 ↗";
    document.querySelector("#compare-source-b").textContent =
      "第二把尺的依据 ↗";
  };
  [a, b, unit].forEach((el) => el.addEventListener("change", update));
  document
    .querySelector("#compare-source-a")
    .addEventListener("click", () => openSources(a.value));
  document
    .querySelector("#compare-source-b")
    .addEventListener("click", () => openSources(b.value));
  update();
}
