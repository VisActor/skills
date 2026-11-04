import { clamp01, ease, lerp } from "./geometry.mjs";

// Presentation trajectory only; matching, units and source records stay outside.
// Callers choose control points and a stable phase once, not randomly per frame.
export function flowPoint(from, to, progress, {
  control1 = from, control2 = to, amplitude = 0, turns = 1, phase = 0, delay = 0,
} = {}) {
  const numbers = [from.x, from.y, to.x, to.y, control1.x, control1.y,
    control2.x, control2.y, progress, amplitude, turns, phase, delay];
  if (!numbers.every(Number.isFinite) || amplitude < 0 || delay < 0 || delay >= 1) {
    throw new Error("Flow needs finite coordinates and motion values, nonnegative amplitude, and delay in [0, 1)");
  }
  const t = clamp01((progress - delay) / (1 - delay));
  if (t === 0) return { x: from.x, y: from.y };
  if (t === 1) return { x: to.x, y: to.y };
  const s = 1 - t, envelope = amplitude * Math.sin(Math.PI * t) ** 2;
  const angle = phase + 2 * Math.PI * turns * t;
  return {
    x: s ** 3 * from.x + 3 * s ** 2 * t * control1.x +
      3 * s * t ** 2 * control2.x + t ** 3 * to.x + envelope * Math.cos(angle),
    y: s ** 3 * from.y + 3 * s ** 2 * t * control1.y +
      3 * s * t ** 2 * control2.y + t ** 3 * to.y + envelope * Math.sin(angle),
  };
}

// Geometry only. Source records, names, categories and dates are not interpolated.
export function blendNodes(from, to, t, channels = ["x", "y", "area", "opacity"]) {
  if (t <= 0) return from;
  if (t >= 1) return to;
  const nodes = new Map();
  for (const id of new Set([...from.keys(), ...to.keys()])) {
    const a = from.get(id);
    const b = to.get(id);
    const start = a ?? { ...b, opacity: 0 };
    const end = b ?? { ...a, opacity: 0 };
    const node = { id };
    for (const channel of channels) {
      if (!Number.isFinite(start[channel]) || !Number.isFinite(end[channel])) {
        throw new Error("Missing numeric presentation channel " + channel + " on " + id);
      }
      node[channel] = lerp(start[channel], end[channel], t);
    }
    nodes.set(id, node);
  }
  return nodes;
}

export function createTransition(initial, { blend, duration = 700 }) {
  if (typeof blend !== "function" || !Number.isFinite(duration) || duration < 0) {
    throw new Error("Transition needs a blend function and a finite nonnegative duration");
  }
  let from = initial, to = initial, start = 0, span = 0;
  function sample(now) {
    if (!Number.isFinite(now)) throw new Error("Transition time must be finite");
    const progress = span === 0 ? 1 : clamp01((now - start) / span);
    return {
      pose: progress === 1 ? to : blend(from, to, ease(progress)),
      progress,
      moving: progress < 1,
    };
  }
  function target(next, now, options = {}) {
    const nextDuration = options.duration ?? duration;
    if (!Number.isFinite(nextDuration) || nextDuration < 0) {
      throw new Error("Target duration must be finite and nonnegative");
    }
    from = sample(now).pose;
    to = next;
    start = now;
    span = options.immediate ? 0 : nextDuration;
  }
  return { sample, target };
}

export function createPlayer(initial, {
  blend, render, duration = 700,
  now = () => performance.now(),
  requestFrame = (callback) => requestAnimationFrame(callback),
  cancelFrame = (id) => cancelAnimationFrame(id),
}) {
  if (typeof render !== "function") throw new Error("Player needs a renderer");
  const transition = createTransition(initial, { blend, duration });
  let handle = null, disposed = false;
  function paint(time) {
    handle = null;
    if (disposed) return;
    const frame = transition.sample(time);
    render(frame.pose, frame);
    if (frame.moving && !disposed) handle = requestFrame(paint);
  }
  function goTo(next, options = {}) {
    if (disposed) return;
    const time = now();
    transition.target(next, time, options);
    if (handle !== null) cancelFrame(handle);
    paint(time);
  }
  function dispose() {
    disposed = true;
    if (handle !== null) cancelFrame(handle);
    handle = null;
  }
  render(initial, { progress: 1, moving: false });
  return { goTo, dispose, sample: () => transition.sample(now()) };
}
