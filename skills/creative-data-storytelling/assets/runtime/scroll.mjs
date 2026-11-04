// Keep ordinary document scrolling. A crossing selects a readable state;
// requestAnimationFrame in motion.mjs completes its connecting animation.
export function selectStep(positions, line, current = -1, hysteresis = 12) {
  if (!positions.length) return -1;
  if (!positions.every(Number.isFinite) || positions.some((v, i) => i && v < positions[i - 1]))
    throw new Error("Step positions must be finite and ordered");
  let index = current < 0 ? 0 : Math.min(current, positions.length - 1);
  if (current < 0) {
    while (index < positions.length - 1 && positions[index + 1] <= line) index++;
  } else {
    while (index < positions.length - 1 && positions[index + 1] <= line - hysteresis) index++;
    while (index > 0 && positions[index] > line + hysteresis) index--;
  }
  return index;
}

export function observeSteps(elements, onChange, {
  viewportRatio = 0.58, hysteresis = 12, view = globalThis, onUpdate,
} = {}) {
  let current = -1, frame = null, enabled = true, disposed = false;
  function update() {
    frame = null;
    if (disposed) return;
    if (enabled) {
      const positions = elements.map((element) => element.getBoundingClientRect().top);
      const next = selectStep(positions, view.innerHeight * viewportRatio, current, hysteresis);
      if (next !== current) { current = next; onChange(next); }
    }
    if (!disposed) onUpdate?.();
  }
  function request() {
    if (!disposed && frame === null && (enabled || onUpdate)) frame = view.requestAnimationFrame(update);
  }
  view.addEventListener("scroll", request, { passive: true });
  view.addEventListener("resize", request);
  request();
  return {
    refresh: request,
    setEnabled(value) {
      if (disposed) return;
      enabled = Boolean(value);
      if (enabled) { current = -1; request(); }
    },
    dispose() {
      disposed = true;
      view.removeEventListener("scroll", request);
      view.removeEventListener("resize", request);
      if (frame !== null) view.cancelAnimationFrame(frame);
      frame = null;
    },
  };
}
