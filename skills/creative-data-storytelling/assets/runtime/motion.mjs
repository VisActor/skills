// Reusable player and interpolation. The caller owns layout and rendering.
import { clamp01, ease, lerp } from "./geometry.mjs";

// Only interpolate named presentation channels. Source records remain intact.
export function blendNodes(from, to, t, channels = ["x", "y", "area", "opacity"]) {
  if (t <= 0) return from;
  if (t >= 1) return to;
  const nodes = new Map();
  for (const id of new Set([...from.keys(), ...to.keys()])) {
    const a = from.get(id);
    const b = to.get(id);
    const start = a ?? { ...b, opacity: 0 };
    const end = b ?? { ...a, opacity: 0 };
    const node = { ...end };
    for (const channel of channels) {
      if (!Number.isFinite(start[channel]) || !Number.isFinite(end[channel]))
        throw new Error("Missing numeric presentation channel " + channel + " on " + id);
      node[channel] = lerp(start[channel], end[channel], t);
    }
    nodes.set(id, node);
  }
  return nodes;
}

// Optional handoff for assertions that would describe the wrong marks mid-transition.
// Annotation keys identify the fact AND its comparison basis. Geometry is injected:
// callers still choose their own layout, renderer and whether this pacing is useful.
export function blendWithAnnotations(from, to, t, blendGeometry, {
  exitEnd = 0.16, enterStart = 0.8,
} = {}) {
  if (!(exitEnd > 0 && exitEnd < enterStart && enterStart < 1))
    throw new Error("Annotation phases require 0 < exitEnd < enterStart < 1");
  if (t <= 0) return from;
  if (t >= 1) return to;
  const a = from.annotations, b = to.annotations;
  const retiring = [...a].some(([id, label]) => label.opacity > (b.get(id)?.opacity ?? 0));
  const arriving = [...b].some(([id, label]) => label.opacity > (a.get(id)?.opacity ?? 0));
  const start = retiring ? exitEnd : 0, end = arriving ? enterStart : 1;
  const geometryT = clamp01((t - start) / (end - start));
  const annotations = new Map();
  for (const id of new Set([...a.keys(), ...b.keys()])) {
    const old = a.get(id), next = b.get(id);
    const fromOpacity = old?.opacity ?? 0, toOpacity = next?.opacity ?? 0;
    const labelT = toOpacity < fromOpacity
      ? clamp01(t / exitEnd)
      : toOpacity > fromOpacity ? clamp01((t - enterStart) / (1 - enterStart)) : t;
    const opacity = lerp(fromOpacity, toOpacity, labelT);
    if (opacity > 0) annotations.set(id, { ...(next ?? old), opacity });
  }
  return { ...blendGeometry(from, to, geometryT), annotations };
}

// Pure clock model; a new target starts at the currently sampled pose.
export function createTransition(initial, { blend, duration = 700 }) {
  let from = initial, to = initial, start = 0, span = 0;
  function sample(now) {
    const progress = span === 0 ? 1 : clamp01((now - start) / span);
    return {
      pose: progress === 1 ? to : blend(from, to, ease(progress)),
      progress,
      moving: progress < 1,
    };
  }
  function target(next, now, options = {}) {
    const nextDuration = options.duration ?? duration;
    if (!Number.isFinite(now) || !Number.isFinite(nextDuration) || nextDuration < 0)
      throw new Error("Transition requires finite time and nonnegative duration");
    from = sample(now).pose;
    to = next;
    start = now;
    span = options.immediate ? 0 : nextDuration;
  }
  return { sample, target };
}

// Time drives connecting frames. Input selects a target, never an unfinished frame.
export function createPlayer(initial, {
  blend, render, duration = 700,
  now = () => performance.now(),
  requestFrame = (callback) => requestAnimationFrame(callback),
  cancelFrame = (id) => cancelAnimationFrame(id),
}) {
  const transition = createTransition(initial, { blend, duration });
  let handle = null, disposed = false;
  function paint(time) {
    handle = null;
    if (disposed) return;
    const frame = transition.sample(time);
    render(frame.pose, frame);
    if (frame.moving) handle = requestFrame(paint);
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
  return { goTo, dispose, sample: () => transition.sample(now()) };
}
