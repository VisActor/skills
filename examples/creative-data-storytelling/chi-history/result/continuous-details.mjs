import { smooth } from "./geometry.mjs";
import { introLayout } from "./intro-layout.mjs";
export function introMarkup(p, W, H, chiCm) {
  const model = introLayout(p, W, H);
  const { rulers, divide, joining, origin, full, y, height: h } = model;
  const labels = smooth(divide);
  const completion = smooth((joining - 0.85) / 0.15);
  let result = "";
  for (const ruler of rulers) {
    const i = ruler.id;
    result += `<g id="intro-chi-${i}" data-unit="chi" data-cun-count="10" opacity="${ruler.opacity}" transform="translate(${ruler.x} ${ruler.y})">`;
    for (const cell of ruler.cells) {
      result += `<rect data-unit="cun" data-cell="${cell.id}" x="${cell.x}" y="${cell.y}" width="${cell.width}" height="${h}" fill="${i % 2 ? "#52766a" : "#426359"}"/>`;
      if (i === 0 && cell.id === 0)
        result += `<rect x="${cell.x}" y="${cell.y}" width="${cell.width}" height="${h}" fill="#a65e43" opacity="${labels}"/>`;
      result += `<rect x="${cell.x}" y="${cell.y}" width="${cell.width}" height="${h}" fill="url(#continuous-sheen)" pointer-events="none"/>`;
      if (cell.id % 10 !== 0)
        result += `<path d="M${cell.x} ${cell.y}v${h}" stroke="#f2ecde" stroke-width="${joining ? 0.75 : 1.2}" opacity="${labels * 0.8}"/>`;
      if (i === 0)
        result += `<text x="${cell.x + cell.width / 2}" y="${cell.y + h + 29}" text-anchor="middle" fill="#716e62" font-size="13" opacity="${labels * (1 - smooth(joining / 0.22))}">一寸</text>`;
    }
    result += `<path d="M0 0v${h}M${ruler.width} 0v${h}" stroke="#eee9dd" stroke-width="1.8" opacity="${1 - Math.sin(Math.PI * divide)}"/>`;
    if (i > 0 || joining > 0)
      result += `<text x="${ruler.width / 2}" y="${h + 29}" text-anchor="middle" fill="${i ? "#716e62" : "#964434"}" font-size="13" opacity="${smooth((joining - 0.25) / 0.2)}">一尺</text>`;
    result += "</g>";
  }
  // The first chi and its ten cun remain identifiable as the view widens.
  const first = rulers[0];
  result += `<path d="M${origin} ${y - 15}v-8H${origin + first.width}v8" fill="none" stroke="#9b4936" opacity="${1 - completion}"/><text x="${origin}" y="${y - 39}" fill="#253c39" font-size="23" opacity="${1 - completion}">一尺</text>`;
  result += `<g opacity="${completion}"><path d="M${origin} ${y - 29}v-9H${origin + full}v9" fill="none" stroke="#9b4936"/><text x="${origin + full / 2}" y="${y - 52}" text-anchor="middle" fill="#253c39" font-size="23">一丈</text><path d="M${origin + first.width / 20} ${y}v-45h-16" fill="none" stroke="#a65e43"/><text x="${origin - 17}" y="${y - 43}" text-anchor="end" fill="#964434" font-size="12">一寸</text></g>`;
  const formula =
    joining > 0
      ? "1 丈 = 10 尺 = 100 寸"
      : divide > 0
        ? "1 尺 = 10 寸"
        : "一个名字，长度要看时代与用途。";
  const formulaOpacity =
    joining > 0 ? completion : divide > 0 ? smooth((divide - 0.65) / 0.35) : 1;
  result += `<text x="${origin}" y="${y + h + 82}" fill="#964434" font-size="25" opacity="${formulaOpacity}">${formula}</text>`;
  result += `<text x="${origin}" y="${y + h + 110}" fill="#716e62" font-size="12">${joining > 0 ? `横向视野拉远 · 同一把尺的十寸仍在 · 一丈约${chiCm / 10}米` : `以秦参考值演示：一尺约${chiCm}厘米，一寸约${chiCm / 10}厘米。`}</text>`;
  return result;
}
export function meterMarkup(chiCm, isMarket) {
  const size = 372,
    width = isMarket ? size / 3 : (size * chiCm) / 100;
  let result = `<text x="14" y="23" fill="#253c39" font-size="18">${isMarket ? "把三把市尺放在一起" : "用米，约定尺的长度"}</text><path d="M14 56V48H386V56" fill="none" stroke="#716e62"/><text x="200" y="42" text-anchor="middle" fill="#716e62" font-size="12">1 米 · 100 厘米</text>`;
  const count = isMarket ? 3 : 1;
  for (let i = 0; i < count; i++)
    result += `<rect x="${14 + width * i}" y="69" width="${width}" height="42" fill="${i % 2 ? "#547a6d" : "#426359"}" stroke="#eee9dd"/><text x="${14 + width * (i + 0.5)}" y="96" text-anchor="middle" fill="#fff7e8" font-size="13">${isMarket ? "1 市尺" : "1 尺"}</text>`;
  result += `<text x="14" y="151" fill="#964434" font-size="25">${isMarket ? "3 × ⅓ 米 = 1 米" : "1 尺 = 0.32 米"}</text><text x="14" y="184" fill="#716e62" font-size="11">此处为一米局部示意；下方各历史尺仍使用0—40厘米。</text>`;
  return result;
}
export function sceneOpacity(p, chapter) {
  return smooth((p - chapter + 0.5) * 2) * (1 - smooth((p - chapter) * 2));
}
