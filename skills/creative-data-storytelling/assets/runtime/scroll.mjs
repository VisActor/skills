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
    // Explicit navigation reads the actual new position immediately, without
    // carrying hysteresis from the previous scroll interval into the jump.
    sync() {
      if (disposed) return;
      if (frame !== null) view.cancelAnimationFrame(frame);
      frame = null; current = -1; update();
    },
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

// Fixed-copy stages can supply an empty reading column instead of writing cues
// and a special last-step height. Extent is reading space, never animation time.
export function createReadingTrack({ element, ids, extent = ({ viewportHeight }) => viewportHeight,
  view = element?.ownerDocument?.defaultView ?? globalThis }) {
  if (!element?.append || !element.ownerDocument || !Array.isArray(ids) || !ids.length ||
      ids.some(id => typeof id !== "string" || !id) || typeof extent !== "function")
    throw new Error("Reading track needs a mounted container, state ids and an extent function");
  const steps = ids.map(id => {
    const cue = element.ownerDocument.createElement("div");
    cue.dataset.storyState = id;
    cue.setAttribute("aria-hidden", "true");
    return { id, element: cue };
  });
  const spacer = element.ownerDocument.createElement("div");
  spacer.setAttribute("aria-hidden", "true");
  let disposed = false;
  function refresh() {
    if (disposed) return;
    const heights = steps.map(({ id }, index) => extent({ id, index, viewportHeight: view.innerHeight }));
    if (heights.some(height => !Number.isFinite(height) || height <= 0))
      throw new Error("Reading track extents must be positive finite pixel lengths");
    steps.forEach((step, index) => { step.element.style.height = `${heights[index]}px`; });
  }
  refresh();
  element.append(...steps.map(step => step.element), spacer);
  view.addEventListener("resize", refresh);
  return { steps, spacer, readingEnd: steps.at(-1).element, refresh,
    dispose() {
      if (disposed) return;
      disposed = true; view.removeEventListener("resize", refresh);
      steps.forEach(step => step.element.remove()); spacer.remove();
    },
  };
}

// Aim inside the same interval that observeSteps selects. Use real document
// geometry so buttons work with text, blank cues, offsets and resized stages.
export function readingScrollTarget(steps, index, { viewportHeight, viewportRatio = 0.58, scrollY = 0 }) {
  if (!Number.isInteger(index) || index < 0 || index >= steps.length ||
      !Number.isFinite(viewportHeight) || viewportHeight <= 0 ||
      !Number.isFinite(viewportRatio) || viewportRatio < 0 || viewportRatio > 1 || !Number.isFinite(scrollY))
    throw new Error("Reading navigation needs a valid step and viewport");
  const bounds = steps.map(step => step.element.getBoundingClientRect());
  selectStep(bounds.map(rect => rect.top), 0);
  const start = bounds[index].top;
  const end = bounds[index + 1]?.top ?? start + Math.max(bounds[index].height || 0, viewportHeight / 2);
  return Math.max(0, scrollY + start - viewportHeight * viewportRatio + Math.min(end - start, viewportHeight) / 2);
}

// Optional controls. No wheel listener: scrolling remains owned by the page.
export function bindReadingNavigation({ scope, previous, next, steps, navigate, index,
  keyboard = true, hashFor, enabled = () => true,
  view = scope?.ownerDocument?.defaultView ?? globalThis }) {
  if (!scope?.getBoundingClientRect || typeof navigate !== "function" || typeof index !== "function")
    throw new Error("Reading navigation needs a scope and navigation callbacks");
  const doc = scope.ownerDocument, cleanups = [];
  const marker = "data-reading-navigation", original = scope.getAttribute(marker);
  let disposed = false;
  const listen = (target, event, fn) => {
    target.addEventListener(event, fn); cleanups.push(() => target.removeEventListener(event, fn));
  };
  const keys = hashFor ? steps.map((step, i) => String(hashFor({ id: step.id, index: i })).replace(/^#/, "")) : null;
  if (keys && (keys.some(key => !key) || new Set(keys).size !== keys.length))
    throw new Error("Reading navigation hashes must be nonempty and unique");
  scope.setAttribute(marker, "");
  function active() {
    const box = scope.getBoundingClientRect(), line = view.innerHeight / 2;
    return box.top <= line && box.bottom > line;
  }
  function move(direction, source) {
    const target = index() + direction;
    if (!enabled() || target < 0 || target >= steps.length) return false;
    navigate(target, { source }); return true;
  }
  if (previous) listen(previous, "click", () => move(-1, "button"));
  if (next) listen(next, "click", () => move(1, "button"));
  if (keyboard) listen(doc, "keydown", event => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
        event.repeat || !active() || !enabled() || doc.querySelector("dialog[open]")) return;
    const target = event.target, owner = target?.closest?.(`[${marker}]`);
    if (owner && owner !== scope || target?.closest?.('input,select,textarea,summary,[contenteditable]:not([contenteditable="false"]),[role="slider"],[role="spinbutton"],[role="textbox"]')) return;
    if (event.key === " " && target?.closest?.("button,a")) return;
    const direction = ["ArrowRight", "ArrowDown", " "].includes(event.key) ? 1 :
      ["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 0;
    if (direction && move(direction, "keyboard")) event.preventDefault();
  });
  function fromHash() {
    if (!keys || !enabled()) return;
    const target = keys.findIndex(key => "#" + encodeURI(key) === view.location.hash);
    if (target >= 0) navigate(target, { immediate: true, source: "hash" });
  }
  if (keys) listen(view, "hashchange", fromHash);
  return {
    restore: fromHash,
    update(current, { writeHash = true } = {}) {
      if (disposed) return;
      if (previous) previous.disabled = current === 0;
      if (next) next.disabled = current === steps.length - 1;
      if (writeHash && keys && active()) {
        // A page may use <base> for its resources; changing the hash must not
        // resolve that base and silently change the story's URL on reload.
        const url = new URL(view.location.href);
        url.hash = encodeURI(keys[current]);
        view.history.replaceState(view.history.state, "", url.href);
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true; cleanups.forEach(cleanup => cleanup());
      if (original === null) scope.removeAttribute(marker); else scope.setAttribute(marker, original);
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
