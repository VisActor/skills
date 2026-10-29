// Scroll chooses complete reading states. A separate clock completes transitions.
export function selectStep(positions, line, current = -1, hysteresis = 12) {
  if (!Number.isFinite(line) || !Number.isFinite(hysteresis) || hysteresis < 0 ||
      !Number.isInteger(current) || current < -1 ||
      !positions.every(Number.isFinite) || positions.some((v, i) => i && v < positions[i - 1])) {
    throw new Error("Expected ordered finite positions, a finite line and nonnegative hysteresis");
  }
  if (!positions.length) return -1;
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
  if (typeof onChange !== "function" || !Number.isFinite(viewportRatio) ||
      viewportRatio < 0 || viewportRatio > 1 || !Number.isFinite(hysteresis) || hysteresis < 0 ||
      (onUpdate !== undefined && typeof onUpdate !== "function")) {
    throw new Error("Invalid step observer options");
  }
  let current = -1, frame = null, enabled = true, disposed = false;
  function update() {
    frame = null;
    if (disposed) return;
    if (enabled) {
      const positions = Array.from(elements, (element) => element.getBoundingClientRect().top);
      const next = selectStep(positions, view.innerHeight * viewportRatio, current, hysteresis);
      if (next !== current) { current = next; onChange(next); }
    }
    // Reflow also matters while exploration temporarily owns the graphic.
    if (!disposed) onUpdate?.();
  }
  function refresh() {
    if (frame === null && !disposed && (enabled || onUpdate)) frame = view.requestAnimationFrame(update);
  }
  view.addEventListener("scroll", refresh, { passive: true });
  view.addEventListener("resize", refresh);
  refresh();
  return {
    refresh,
    setEnabled(value) {
      if (disposed) return;
      enabled = Boolean(value);
      if (enabled) { current = -1; refresh(); }
    },
    dispose() {
      disposed = true;
      view.removeEventListener("scroll", refresh);
      view.removeEventListener("resize", refresh);
      if (frame !== null) view.cancelAnimationFrame(frame);
      frame = null;
    },
  };
}
