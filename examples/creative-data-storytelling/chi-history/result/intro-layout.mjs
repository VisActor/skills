import { clamp, lerp, smooth } from "./geometry.mjs";

// Ten persistent chi, each made of ten equal cun. Camera changes their common scale.
export function introLayout(progress, width, height) {
  const p = clamp(progress, 0, 2);
  const divide = clamp(p);
  const joining = clamp(p - 1);
  const camera = smooth(joining / 0.38);
  const full = width * 0.72;
  const chiWidth = lerp(full, full / 10, camera);
  const origin = width * 0.14;
  const y = height * 0.63;
  const h = Math.min(66, Math.max(40, height * 0.065));
  const spread = Math.sin(Math.PI * divide) * Math.min(6, width * 0.004);
  const rulers = Array.from({ length: 10 }, (_, i) => {
    const arrival = i === 0 ? 1 : smooth((joining - (0.23 + i * 0.043)) / 0.34);
    const x = origin + i * chiWidth + (i ? (1 - arrival) * width * 0.03 : 0);
    return {
      id: i,
      x,
      y: y + (1 - arrival) * 46,
      width: chiWidth,
      height: h,
      opacity: arrival,
      cells: Array.from({ length: 10 }, (_, j) => ({
        id: i * 10 + j,
        x: j * (chiWidth / 10) + (i === 0 ? spread * (j - 4.5) : 0),
        y: i === 0 ? Math.sin(Math.PI * divide) * (j % 2 ? 4 : -4) : 0,
        width: chiWidth / 10,
      })),
    };
  });
  return { rulers, divide, joining, camera, origin, full, y, height: h };
}
