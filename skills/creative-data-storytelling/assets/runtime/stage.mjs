import { createPlayer } from "./motion.mjs";
import { observeSteps, selectStep } from "./scroll.mjs";

// No markup, chart type or chapter sequence is supplied here.
// steps: [{ id, element }], layout(id, { width, height }) -> a complete pose.
// blend(from, to, progress) and render(pose, frame) belong to the work.
export function createStage({
  element, steps, layout, blend, render, duration = 700,
  viewportRatio = 0.58, hysteresis = 12, onReading,
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
  let readingIndex = initialIndex, targetId = steps[initialIndex].id, disposed = false, refreshRequested = false;
  let revision = 1, renderVersion = 1, requestedId = targetId, rendered = null, error = null;
  function status() {
    return { target: { id: requestedId, revision }, rendered: rendered && { ...rendered },
      size: { ...size }, readingIndex, disposed, error: error && { ...error } };
  }
  function invalidate(id) { requestedId = id; revision++; error = null; }
  function attempt(phase, operation) {
    try { return operation(); }
    catch (cause) { error ??= { phase, message: String(cause?.message ?? cause) }; throw cause; }
  }
  onReading?.({ id: targetId, index: readingIndex });
  let size = measure();
  const initial = layout(targetId, size);
  const player = createPlayer(initial, {
    blend: (...args) => attempt("blend", () => blend(...args)),
    render(pose, frame) {
      const version = renderVersion;
      attempt("render", () => render(pose, frame));
      // Record only a frame actually submitted by this request, not elapsed time.
      if (version === revision) rendered = { revision: version, final: !frame.moving };
    },
    duration, now: () => view.performance.now(),
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
  function goTo(id, options = {}, alreadyInvalidated = false) {
    if (disposed) return;
    if (typeof id !== "string" || !id) throw new Error("Stage target id must be a nonempty string");
    if (!alreadyInvalidated) invalidate(id);
    const nextSize = attempt("measure", measure), pose = attempt("layout", () => layout(id, nextSize));
    targetId = id;
    size = nextSize;
    refreshRequested = false;
    renderVersion = revision;
    attempt("transition", () => player.goTo(pose, options));
  }
  const reader = observeSteps(elements, (index) => {
    const changed = index !== readingIndex || steps[index].id !== targetId;
    readingIndex = index;
    if (changed) onReading?.({ id: steps[index].id, index });
    if (steps[index].id !== targetId) goTo(steps[index].id);
  }, {
    view, viewportRatio, hysteresis,
    onUpdate() {
      let nextSize;
      try { nextSize = measure(); }
      catch (cause) {
        if (!refreshRequested) invalidate(targetId);
        error = { phase: "measure", message: String(cause?.message ?? cause) };
        throw cause;
      }
      if (refreshRequested || nextSize.width !== size.width || nextSize.height !== size.height)
        goTo(targetId, { immediate: true }, refreshRequested);
    },
  });
  // Container reflow can happen without a window resize. This does not choose a layout.
  const resizeObserver = view.ResizeObserver ? new view.ResizeObserver(() => reader.refresh()) : null;
  resizeObserver?.observe(element);

  return {
    element,
    goTo,
    syncReading() { if (!disposed) reader.sync(); },
    setReadingEnabled(enabled) { if (!disposed) reader.setEnabled(enabled); },
    // Recompute after data, fonts or surrounding content changes; reflow settles directly.
    refresh() {
      if (disposed) return;
      invalidate(targetId);
      refreshRequested = true;
      reader.refresh();
    },
    // targetId is the requested state, not a claim that its transition has finished.
    sample: () => ({ readingIndex, targetId, ...player.sample() }),
    // Additive observation; sample() keeps its existing pure clock semantics.
    status,
    dispose() {
      if (disposed) return;
      disposed = true;
      reader.dispose();
      resizeObserver?.disconnect();
      player.dispose();
    },
  };
}
