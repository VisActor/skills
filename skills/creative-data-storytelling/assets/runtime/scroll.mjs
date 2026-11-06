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

// Optional layout companion; ordinary scrolling and animation timing stay independent.
// spacer: an empty final block in the reading column, inside the sticky containing block.
// readingEnd: the actual last paragraph, not a padded/min-height reading-step wrapper.
// Keep the stage pinned at least until that paragraph's bottom reaches releaseRatio * viewport height.
export function reserveStageExit({
  sticky, readingEnd, spacer, releaseRatio = 0.4,
  view = sticky?.ownerDocument?.defaultView ?? globalThis,
}) {
  if (![sticky, readingEnd, spacer].every((element) => element?.getBoundingClientRect) ||
      new Set([sticky, readingEnd, spacer]).size !== 3 || !spacer.style || !spacer.parentElement)
    throw new Error("Stage exit requires distinct measurable sticky, readingEnd and a mounted spacer");
  if (!Number.isFinite(releaseRatio) || releaseRatio < 0 || releaseRatio > 1)
    throw new Error("Stage exit releaseRatio must be in [0, 1]");

  const originalHeight = spacer.style.getPropertyValue("height");
  const originalPriority = spacer.style.getPropertyPriority("height");
  let frame = null, disposed = false;
  function update() {
    frame = null;
    if (disposed) return;
    const style = view.getComputedStyle(sticky);
    let space = 0;
    if (style.position === "sticky") {
      const height = sticky.getBoundingClientRect().height;
      const inset = Number.parseFloat(style.top);
      const end = readingEnd.getBoundingClientRect().bottom;
      const start = spacer.getBoundingClientRect().top;
      if (![height, inset, end, start, view.innerHeight].every(Number.isFinite) || height <= 0 || view.innerHeight <= 0)
        throw new Error("Stage exit needs a visible sticky stage with a finite top inset and viewport");
      // At release, container bottom = sticky top + sticky height.
      // spacer.top is unaffected by its own height, avoiding cumulative growth on remeasure.
      space = Math.max(0, Math.ceil(height + inset + end - start - view.innerHeight * releaseRatio));
    }
    const value = `${space}px`;
    if (spacer.style.getPropertyValue("height") !== value) spacer.style.setProperty("height", value);
  }
  function refresh() {
    if (!disposed && frame === null) frame = view.requestAnimationFrame(update);
  }
  update();
  view.addEventListener("resize", refresh);
  const observer = view.ResizeObserver ? new view.ResizeObserver(refresh) : null;
  // The reading column covers text/font reflow; the sticky element covers changing graphic height.
  for (const element of new Set([sticky, readingEnd, spacer.parentElement])) observer?.observe(element);
  return {
    refresh,
    dispose() {
      if (disposed) return;
      disposed = true;
      view.removeEventListener("resize", refresh);
      observer?.disconnect();
      if (frame !== null) view.cancelAnimationFrame(frame);
      if (originalHeight) spacer.style.setProperty("height", originalHeight, originalPriority);
      else spacer.style.removeProperty("height");
    },
  };
}
