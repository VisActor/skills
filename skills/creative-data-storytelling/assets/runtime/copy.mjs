import { createPlayer } from "./motion.mjs";

// Fixed copy panels only. The scene chooses WHEN a statement is supported;
// this adapter preserves their layout space and handles an interruptible handoff.
export function createCopyHandoff(element, { duration = 260, offsetY = 0,
  view = element?.ownerDocument?.defaultView ?? globalThis,
} = {}) {
  const panels = [...(element?.querySelectorAll?.("[data-copy]") ?? [])];
  const ids = panels.map(panel => panel.dataset.copy);
  if (!panels.length || ids.some(id => !id) || new Set(ids).size !== ids.length)
    throw new Error("Copy handoff requires panels with unique, nonempty data-copy ids");
  if (!Number.isFinite(duration) || duration < 0)
    throw new Error("Copy handoff duration must be finite and nonnegative");
  if (!Number.isFinite(offsetY)) throw new Error("Copy handoff offsetY must be finite");
  const properties = ["gridArea", "alignSelf", "opacity", "visibility", "pointerEvents", "translate"];
  const previousDisplay = element.style.display;
  const saved = panels.map(panel => ({ hidden: panel.hidden, inert: panel.inert,
    ariaHidden: panel.getAttribute("aria-hidden"),
    styles: Object.fromEntries(properties.map(key => [key, panel.style[key]])),
  }));
  element.style.display = "grid";
  for (const panel of panels) {
    // Hidden panels still size the grid: switching text cannot recenter the block.
    panel.hidden = false;
    panel.style.gridArea = "1 / 1";
    panel.style.alignSelf = "start";
  }
  let targetId = null, revision = 0, renderedRevision = null, disposed = false;
  function render({ id, opacity, lift = 0, revision: version, update }) {
    // Same-state data changes retire the old wording before updating it.
    if (opacity > 0 && version !== renderedRevision) {
      update?.();
      renderedRevision = version;
    }
    for (const panel of panels) {
      const active = panel.dataset.copy === id && opacity > 0;
      panel.style.opacity = active ? String(opacity) : "0";
      panel.style.visibility = active ? "visible" : "hidden";
      panel.style.pointerEvents = active ? "" : "none";
      if (offsetY) panel.style.translate = `0 ${lift}px`;
      panel.inert = !active;
      panel.setAttribute("aria-hidden", String(!active));
    }
  }
  const player = createPlayer({ id: null, opacity: 0, lift: 0, revision: null }, {
    duration, render,
    // Retire the old sentence before revealing the next; never superimpose text.
    blend(from, to, t) {
      if (from.revision === to.revision) return { ...to, opacity: from.opacity + (1 - from.opacity) * t,
        lift: from.lift * (1 - t) };
      return t < .5 ? { ...from, opacity: from.opacity * (1 - t * 2), lift: from.lift * (1 - t * 2) }
        : { ...to, opacity: (t - .5) * 2, lift: offsetY * (2 - t * 2) };
    },
    now: () => view.performance.now(),
    requestFrame: callback => view.requestAnimationFrame(callback),
    cancelFrame: id => view.cancelAnimationFrame(id),
  });
  render({ id: null, opacity: 0 });
  return {
    show(id, { immediate = false, update } = {}) {
      if (disposed) return;
      if (!ids.includes(id)) throw new Error("Unknown copy panel: " + id);
      if (update !== undefined && typeof update !== "function") throw new Error("Copy update must be a function");
      if (id === targetId && !immediate && !update) return;
      const initial = targetId === null;
      targetId = id;
      player.goTo({ id, opacity: 1, lift: 0, revision: ++revision, update }, { immediate: initial || immediate });
    },
    dispose() {
      if (disposed) return;
      disposed = true; player.dispose();
      element.style.display = previousDisplay;
      panels.forEach((panel, index) => {
        const previous = saved[index];
        panel.hidden = previous.hidden; panel.inert = previous.inert;
        Object.assign(panel.style, previous.styles);
        if (previous.ariaHidden === null) panel.removeAttribute("aria-hidden");
        else panel.setAttribute("aria-hidden", previous.ariaHidden);
      });
    },
  };
}
