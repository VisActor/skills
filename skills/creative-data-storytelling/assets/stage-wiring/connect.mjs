import { createStage } from "../runtime/stage.mjs";
import { reserveStageExit, createReadingTrack, readingScrollTarget, bindReadingNavigation } from "../runtime/scroll.mjs";

// Wiring only: the caller owns the DOM, reading order, geometry and appearance.
export function connectReading({ reading, cueSelector = "[data-story-state]", idFor = cue => cue.dataset.storyState,
  track, exit, navigation, onReading, onNavigate, ...options }) {
  if (!reading?.querySelectorAll) throw new Error("Reading needs its own mounted text container");
  const view = options.view ?? options.element.ownerDocument.defaultView;
  const doc = reading.ownerDocument;
  let generated, release, stage, controls, disposed = false, exploring = false;
  let steps;
  function navigate(target, { immediate = false, source = "navigation" } = {}) {
    if (disposed) return;
    const index = typeof target === "string" ? steps.findIndex(step => step.id === target) : target;
    const top = readingScrollTarget(steps, index, { viewportHeight: view.innerHeight,
      viewportRatio: options.viewportRatio ?? 0.58, scrollY: view.scrollY });
    onNavigate?.({ id: steps[index].id, index, source });
    exploring = false;
    stage.setReadingEnabled(true);
    // Move the reading position instantly; the existing player animates the picture.
    view.scrollTo({ top, behavior: "instant" });
    stage.syncReading();
    if (immediate) stage.goTo(stage.sample().targetId, { immediate: true });
    controls?.update(stage.sample().readingIndex);
  }
  try {
    generated = track ? createReadingTrack({ ...track, element: reading, view }) : null;
    steps = generated?.steps ?? [...reading.querySelectorAll(cueSelector)].map(element => ({ element, id: idFor(element) }));
    release = exit ? reserveStageExit({ readingEnd: generated?.readingEnd, spacer: generated?.spacer, view, ...exit }) : null;
    stage = createStage({ ...options, view, steps, onReading(state) {
      controls?.update(state.index);
      onReading?.(state);
    } });
    if (navigation) {
      controls = bindReadingNavigation({ ...navigation, view, steps, navigate,
        index: () => stage.sample().readingIndex, enabled: () => !exploring });
      // Honor a recognized deep link before updating controls; leave other anchors alone.
      controls.restore();
      controls.update(stage.sample().readingIndex, { writeHash: false });
    }
  } catch (error) {
    controls?.dispose(); stage?.dispose(); release?.dispose(); generated?.dispose();
    throw error;
  }
  function refresh() {
    if (disposed) return;
    generated?.refresh(); release?.refresh(); stage.refresh();
  }
  function visible() { if (doc.visibilityState === "visible") refresh(); }
  view.addEventListener("pageshow", refresh);
  doc.addEventListener("visibilitychange", visible);
  return {
    stage,
    refresh,
    navigate,
    // A selector changes the work's data/config first, then reuses the same renderer.
    explore(id) { if (!disposed) { exploring = true; stage.setReadingEnabled(false); stage.goTo(id); } },
    resume() { if (!disposed) { exploring = false; stage.setReadingEnabled(true); } },
    dispose() {
      if (disposed) return;
      disposed = true;
      view.removeEventListener("pageshow", refresh);
      doc.removeEventListener("visibilitychange", visible);
      controls?.dispose(); stage.dispose(); release?.dispose(); generated?.dispose();
    },
  };
}
