import { createPlayer } from "./motion.mjs";
import { observeSteps, selectStep } from "./scroll.mjs";

// Wiring only: markup, layout, visual encoding and choreography belong to the work.
// Repeated step ids allow multiple prose passages to explain the same graphic.
export function createStage({
  element, steps, layout, blend, render, onStep = () => {}, duration = 700,
  viewportRatio = 0.58, hysteresis = 12,
  view = element?.ownerDocument?.defaultView ?? globalThis,
}) {
  if (!element?.getBoundingClientRect || !Array.isArray(steps) || !steps.length ||
      steps.some((step) => typeof step.id !== "string" || !step.id || !step.element?.getBoundingClientRect) ||
      new Set(steps.map((step) => step.element)).size !== steps.length)
    throw new Error("Stage needs a measurable element and ordered steps with nonempty ids and distinct elements");
  if (![layout, blend, render, onStep].every((fn) => typeof fn === "function"))
    throw new Error("Stage needs layout, blend, render and optional onStep functions");
  if (!Number.isFinite(viewportRatio) || viewportRatio < 0 || viewportRatio > 1 ||
      !Number.isFinite(hysteresis) || hysteresis < 0)
    throw new Error("Stage viewportRatio must be in [0, 1] and hysteresis must be nonnegative");

  const elements = steps.map((step) => step.element);
  let readingIndex = selectStep(elements.map((cue) => cue.getBoundingClientRect().top),
    view.innerHeight * viewportRatio);
  let targetId = steps[readingIndex].id, disposed = false, refreshRequested = false;
  let size = measure();
  const initial = layout(targetId, size);
  // Notify before painting, so direct entry starts with matching prose and graphic.
  onStep(readingIndex, { id: targetId, previousId: null, pose: initial, moving: false, progress: 1 });
  const player = createPlayer(initial, {
    blend, render, duration, now: () => view.performance.now(),
    requestFrame: (callback) => view.requestAnimationFrame(callback),
    cancelFrame: (id) => view.cancelAnimationFrame(id),
  });

  function measure() {
    const { width, height } = element.getBoundingClientRect();
    if (![width, height].every((value) => Number.isFinite(value) && value > 0))
      throw new Error("Stage needs positive width and height; mount after its element is measurable");
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
  let reader, resizeObserver;
  try {
    reader = observeSteps(elements, (index) => {
      const id = steps[index].id;
      if (index === readingIndex && id === targetId) return;
      const frame = player.sample();
      onStep(index, { id, previousId: targetId, ...frame });
      readingIndex = index;
      if (id !== targetId) goTo(id);
      else render(frame.pose, frame); // Prose advances without restarting ongoing motion.
    }, {
      view, viewportRatio, hysteresis,
      onUpdate() {
        const nextSize = measure();
        if (refreshRequested || nextSize.width !== size.width || nextSize.height !== size.height)
          goTo(targetId, { immediate: true });
      },
    });
    resizeObserver = view.ResizeObserver ? new view.ResizeObserver(() => reader.refresh()) : null;
    resizeObserver?.observe(element);
  } catch (error) {
    reader?.dispose();
    resizeObserver?.disconnect();
    player.dispose();
    throw error;
  }

  return {
    goTo,
    setReadingEnabled(enabled) { if (!disposed) reader.setEnabled(enabled); },
    // Data/font/control changes may require recomputing even at the same size.
    refresh() {
      if (disposed) return;
      refreshRequested = true;
      reader.refresh();
    },
    // targetId is the requested state; moving/progress describe the current pose.
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
