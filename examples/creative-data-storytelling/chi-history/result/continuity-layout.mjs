import { clamp, lerp, smooth, extent } from "./geometry.mjs";

export const continuityIds = [
  "qin-shangyang-inferred",
  "han-west-bai",
  "han-east-bai",
  "tang-small",
  "tang-large",
  "yuan-astronomy",
  "yuan-building",
  "yuan-official",
  "yuan-tailoring",
  "qing-building",
  "republic-1915",
  "market-1930",
];
export const recordChapters = [0, 1, 2, 3, 3, 4, 4, 4, 4, 5, 6, 7];
export const lastHistoryChapter = 8;
const focusPositions = [
  [0.68],
  [0.7],
  [0.72],
  [0.7, 0.8],
  [0.68, 0.735, 0.79, 0.845],
  [0.835],
  [0.835],
  [0.835],
];

function pose(index, chapter) {
  const own = recordChapters[index];
  if (chapter === lastHistoryChapter)
    return { y: 0.5 + index * 0.032, height: 0.012, emphasis: 0, reveal: 1 };
  const focusY = focusPositions[own][index - recordChapters.indexOf(own)];
  if (own > chapter)
    return {
      y: focusY,
      height: own === 4 ? 0.026 : 0.048,
      emphasis: 1,
      reveal: 0,
    };
  if (own === chapter)
    return {
      y: focusY,
      height: own === 4 ? 0.026 : 0.048,
      emphasis: 1,
      reveal: 1,
    };
  const historyCount = recordChapters.filter((c) => c < chapter).length;
  return {
    y:
      chapter <= 3
        ? 0.6 - (historyCount - 1) * 0.05 + index * 0.05
        : 0.5 + index * (chapter === 4 ? 0.032 : 0.028),
    height: 0.011,
    emphasis: 0,
    reveal: 1,
  };
}

export function continuityLayout(records, width, height, progress) {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  )
    throw new Error("Continuity viewport must be positive");
  const p = clamp(progress, 0, lastHistoryChapter);
  const from = Math.floor(p),
    to = Math.min(lastHistoryChapter, from + 1),
    t = p - from;
  return continuityIds.map((id, i) => {
    const row = records.find((r) => r.id === id);
    if (!row) throw new Error("Missing continuity record: " + id);
    const a = pose(i, from),
      b = pose(i, to);
    // First make room, then introduce a full-length record at its reading position.
    const arrival = smooth((t - 0.58) / 0.42);
    const movement = smooth(t / 0.55);
    return {
      id,
      x: width * 0.19,
      y: lerp(a.y, b.y, movement) * height,
      width: extent(row, "chi", (width * 0.66) / 40),
      height: lerp(a.height, b.height, movement) * height,
      emphasis: lerp(a.emphasis, b.emphasis, movement),
      reveal: a.reveal === b.reveal ? a.reveal : arrival,
    };
  });
}

export function endpointX(chiCm, width) {
  return ((chiCm - 22.8) / 0.8) * width;
}
