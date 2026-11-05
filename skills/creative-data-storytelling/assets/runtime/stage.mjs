import { createPlayer } from "./motion.mjs";
import { observeSteps, selectStep } from "./scroll.mjs";

// No markup, chart type or chapter sequence is supplied here.
// steps: [{ id, element }], layout(id, { width, height }) -> a complete pose.
// blend(from, to, progress) and render(pose, frame) belong to the work.
export function createStage({
  element, steps, layout, blend, render, duration = 700,
  viewportRatio = 0.58, hysteresis = 12,
  view = element?.ownerDocument?.defaultView ?? globalThis,
}) {
  if (!element?.getBoundingClientRect || !Array.isArray(steps) || !steps.length ||
      steps.some((step) => typeof step.id !== "string" || !step.id || !step.element?.getBoundingClientRect) ||
      new Set(steps.map((step) => step.element)).size !== steps.length)
    throw new Error("Stage requires a measurable element and ordered steps with nonempty ids and distinct elements");
  if (![layout, blend, render].every((fn) => typeof fn === "function"))
    throw new Error("Stage requires layout, blend and render functions");
  if (!Number.isFinite(viewportRatio) || viewportRatio < 0 || viewportRatio > 1 ||
      !Number.isFinite(hysteresis) || hysteresis < 0)
    throw new Error("Stage viewportRatio must be in [0, 1] and hysteresis must be nonnegative");

  const elements = steps.map((step) => step.element);
  const initialIndex = selectStep(elements.map((cue) => cue.getBoundingClientRect().top),
    view.innerHeight * viewportRatio);
  let targetId = steps[initialIndex].id, disposed = false, refreshRequested = false;
  let size = measure();
  const initial = layout(targetId, size);
  const player = createPlayer(initial, {
    blend, render, duration, now: () => view.performance.now(),
    requestFrame: (callback) => view.requestAnimationFrame(callback),
    cancelFrame: (id) => view.cancelAnimationFrame(id),
  });
  // A direct entry starts at the current reading position, not an unrelated cover.
  player.goTo(initial, { immediate: true });

  function measure() {
    const { width, height } = element.getBoundingClientRect();
    if (![width, height].every((value) => Number.isFinite(value) && value > 0))
      throw new Error("Stage needs positive width and height; mount it after its element is measurable");
    return { width, height };
  }
  function goTo(id, options = {}) {
    if (disposed) return;
    if (typeof id !== "string" || !id) throw new Error("Stage target id must be a nonempty string");
    const nextSize = measure(), pose = layout(id, nextSize);
    targetId = id;
    size = nextSize;
    refreshRequested = false;
    player.goTo(pose, options);
  }
  const reader = observeSteps(elements, (index) => {
    if (steps[index].id !== targetId) goTo(steps[index].id);
  }, {
    view, viewportRatio, hysteresis,
    onUpdate() {
      const nextSize = measure();
      if (refreshRequested || nextSize.width !== size.width || nextSize.height !== size.height)
        goTo(targetId, { immediate: true });
    },
  });
  // Container reflow can happen without a window resize. This does not choose a layout.
  const resizeObserver = view.ResizeObserver ? new view.ResizeObserver(() => reader.refresh()) : null;
  resizeObserver?.observe(element);

  return {
    goTo,
    setReadingEnabled(enabled) { if (!disposed) reader.setEnabled(enabled); },
    // Recompute after data, fonts or surrounding content changes; reflow settles directly.
    refresh() {
      if (disposed) return;
      refreshRequested = true;
      reader.refresh();
    },
    // targetId is the requested state, not a claim that its transition has finished.
    sample: () => ({ targetId, ...player.sample() }),
    dispose() {
      if (disposed) return;
      disposed = true;
      reader.dispose();
      resizeObserver?.disconnect();
      player.dispose();
    },
  };
}
