import { clamp, lerp, smooth } from "./geometry.mjs";

// Scroll chooses a reading state. A small deadband prevents boundary jitter.
export function selectChapter(progress, current, last, buffer = 0.055) {
  const p = clamp(progress, 0, last);
  if (current < 0) return Math.round(p);
  let target = current;
  while (target < last && p >= target + 0.5 + buffer) target++;
  while (target > 0 && p <= target - 0.5 - buffer) target--;
  return target;
}

export function blendReadingPoses(from, to, progress) {
  if (progress <= 0) return from;
  if (progress >= 1) return to;
  const t = smooth(progress);
  const pose = { ...to };
  for (const key of [
    "intro",
    "history",
    "tone",
    "meter",
    "meterUnit",
    "closing",
  ])
    pose[key] = lerp(from[key], to[key], t);
  pose.arts = from.arts.map((value, i) => lerp(value, to.arts[i], t));
  pose.layouts = from.layouts.map((a, i) => {
    const b = to.layouts[i];
    const movement = smooth(progress / 0.65);
    const reveal =
      b.reveal > a.reveal
        ? smooth((progress - 0.3) / 0.7)
        : smooth(progress / 0.65);
    return {
      ...b,
      x: lerp(a.x, b.x, movement),
      y: lerp(a.y, b.y, movement),
      width: lerp(a.width, b.width, movement),
      height: lerp(a.height, b.height, movement),
      emphasis: lerp(a.emphasis, b.emphasis, movement),
      reveal: lerp(a.reveal, b.reveal, reveal),
    };
  });
  return pose;
}

// Latest target wins. Retarget from the displayed pose, never replay a queue.
export function createReadingTransition(initial) {
  let from = initial,
    to = initial,
    start = 0,
    duration = 0;
  function sample(now) {
    const progress = duration ? clamp((now - start) / duration) : 1;
    return {
      pose: blendReadingPoses(from, to, progress),
      moving: progress < 1,
      progress,
    };
  }
  function target(next, now, milliseconds = 820) {
    from = sample(now).pose;
    to = next;
    start = now;
    duration = Math.max(0, milliseconds);
    if (!duration) from = to;
  }
  return { sample, target };
}
