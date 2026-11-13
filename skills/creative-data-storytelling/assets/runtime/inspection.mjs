import { measureBounds, checkBounds } from "./bounds.mjs";

// Optional, on-demand DOM observation. This never navigates or changes the story.
// A captured result is evidence for declared checks, not a visual-quality verdict.
export function createInspection(connection, {
  root = connection?.stage?.element, id = "story-inspection", checks = () => ({}),
} = {}) {
  const stage = connection?.stage, doc = root?.ownerDocument, view = doc?.defaultView;
  if (!stage?.status || !view || !root.isConnected || typeof checks !== "function" || !id || doc.getElementById(id))
    throw new Error("Inspection needs a connected root, stage.status, checks function and unused output id");
  const output = doc.createElement("script");
  output.type = "application/json"; output.id = id;
  doc.body.append(output);
  const instance = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  let sequence = 0, disposed = false;
  const normalize = value => String(value).replace(/\s+/gu, " ").trim();
  const resolve = (value, context) => typeof value === "string" ? doc.querySelector(value)
    : typeof value === "function" ? value(context) : value;
  const rect = element => {
    const { x, y, width, height } = element.getBoundingClientRect();
    return { x, y, width, height };
  };
  function environment() {
    return { width: view.innerWidth, height: view.innerHeight, dpr: view.devicePixelRatio ?? 1,
      scrollX: view.scrollX ?? 0, scrollY: view.scrollY ?? 0 };
  }
  function publish(result) {
    if (!disposed && result.captureId === sequence) output.textContent = JSON.stringify(result);
    return result;
  }
  function measure(spec, context) {
    const targets = spec.targets ?? [], active = targets.filter(target => target.when !== false);
    const elements = active.map(target => ({ id: target.id, element: resolve(target.element, context) }));
    const measured = measureBounds(root, elements);
    const ids = new Set();
    for (const target of targets) {
      if (!target.id || ids.has(target.id) || ["$stage", "$viewport"].includes(target.id))
        throw new Error("Inspection targets need unique nonempty ids: " + target.id);
      ids.add(target.id);
    }
    const items = new Map(measured.items.map(item => [item.id, item]));
    const readouts = targets.map(target => {
      if (target.when === false) return { id: target.id, status: "not-applicable" };
      const item = items.get(target.id), element = elements.find(entry => entry.id === target.id).element;
      const result = { ...item };
      if (item.status === "measured") {
        let opacity = 1;
        for (let parent = element; parent; parent = parent.parentElement)
          opacity *= Number(view.getComputedStyle(parent).opacity ?? 1);
        result.opacity = opacity;
        const font = view.getComputedStyle(element).font;
        if (font) result.font = font;
        if (element.tagName?.toLowerCase() === "img") {
          if (!element.complete) result.status = "loading";
          else if (!element.naturalWidth) result.status = "resource-error";
        }
        if (font && doc.fonts?.check && !doc.fonts.check(font, element.textContent || " ")) result.status = "loading";
      }
      if (Object.hasOwn(target, "expected")) {
        if (typeof target.expected !== "string" && !(typeof target.expected === "number" && Number.isFinite(target.expected)))
          throw new Error("Inspection expected readout must be a string or finite number: " + target.id);
        result.expected = normalize(target.expected);
        result.actual = element?.isConnected ? normalize(target.read ? target.read(element) : element.textContent) : null;
        result.match = result.status === "measured" && result.actual === result.expected;
      }
      return result;
    });
    const inactive = new Set(targets.filter(target => target.when === false).map(target => target.id));
    const rules = [], notApplicable = [];
    for (const [index, rule] of (spec.bounds ?? []).entries()) {
      const references = [...(rule.ids ?? []), ...(rule.from ?? []), ...(rule.within ? [rule.within] : [])];
      if (references.some(key => !ids.has(key) && !["$stage", "$viewport"].includes(key)))
        throw new Error("Inspection bounds refer to an unknown target");
      if (rule.when === false || references.some(key => inactive.has(key))) notApplicable.push(index);
      else rules.push(rule);
    }
    return { root: rect(root), viewport: environment(),
      measured: { ...measured, items: readouts },
      bounds: { ...checkBounds(measured, rules), notApplicable } };
  }
  function groups(spec, context) {
    const ids = new Set();
    return (spec.groups ?? []).map(group => {
      if (!group.id || ids.has(group.id)) throw new Error("Inspection groups need unique nonempty ids");
      ids.add(group.id);
      if (group.when === false) return { id: group.id, status: "not-applicable" };
      if (!Array.isArray(group.expected) || typeof group.key !== "function")
        throw new Error("Inspection groups need expected identities and a DOM key function: " + group.id);
      const elements = typeof group.elements === "string" ? doc.querySelectorAll(group.elements) : group.elements(context);
      const identity = value => {
        if ((typeof value !== "string" || !value) && !(typeof value === "number" && Number.isFinite(value)))
          throw new Error("Group identities must be nonempty strings or finite numbers: " + group.id);
        return String(value);
      };
      const expected = group.expected.map(identity), actual = [...elements].filter(element => element.isConnected).map(element => identity(group.key(element)));
      const wanted = new Set(expected), found = new Set(actual);
      if (wanted.size !== expected.length) throw new Error("Expected group identities must be unique: " + group.id);
      const missing = expected.filter(key => !found.has(key)), unexpected = [...found].filter(key => !wanted.has(key));
      return { id: group.id, status: "counted", expectedCount: expected.length, actualCount: actual.length,
        duplicates: actual.length - found.size, missingCount: missing.length, unexpectedCount: unexpected.length,
        missing: missing.slice(0, 8), unexpected: unexpected.slice(0, 8) };
    });
  }

  function validate({ target, after = -1, timeout = 2500 } = {}) {
    if (typeof target !== "string" || !target || !Number.isInteger(after) || after < -1 ||
        !Number.isFinite(timeout) || timeout < 0 || timeout > 30000)
      throw new Error("Capture requires target, optional after revision and timeout within 0–30000 ms");
  }
  async function capture(options = {}) {
    validate(options);
    const { target, after = -1, timeout = 2500 } = options;
    const captureId = ++sequence, started = view.performance.now();
    let version = null, spec, previous, last;
    const result = (phase, extra = {}) => ({ instance, captureId, request: { target, after }, phase,
      stage: stage.status(), viewport: environment(), ...extra });
    publish(result("waiting"));
    try {
      while (true) {
        if (disposed || stage.status().disposed) return publish(result("disposed"));
        if (captureId !== sequence) return result("superseded");
        const context = stage.status();
        if (context.error) return publish(result("error", { error: context.error }));
        if (version !== null && context.target.revision !== version) return publish(result("superseded"));
        const matches = context.target.id === target && context.target.revision > after;
        if (matches) version ??= context.target.revision;
        const drawn = matches && context.rendered?.revision === version && context.rendered.final;
        const actualSize = rect(stage.element);
        if (drawn && actualSize.width === context.size.width && actualSize.height === context.size.height) {
          spec ??= checks(context);
          last = measure(spec, context);
          const signature = JSON.stringify(last);
          // Two identical observations of declared layout/text/opacity only.
          // Unregistered animation and browser compositing remain outside this signal.
          if (signature === previous && !last.measured.items.some(item => item.status === "loading")) {
            const counted = groups(spec, context);
            if (stage.status().target.revision !== version) return publish(result("superseded"));
            return publish(result("captured", { ...last, groups: counted }));
          }
          previous = signature;
        } else previous = null;
        if (view.performance.now() - started >= timeout)
          return publish(result("timeout", { reason: "Expected render or declared layout/resources did not settle", observation: last ?? null }));
        await new Promise(resolve => view.setTimeout(resolve, 32));
      }
    } catch (cause) {
      return publish(result("error", { error: { phase: "inspection", message: String(cause?.message ?? cause) } }));
    }
  }
  // DOM transport works without publishing application objects on window.
  // data-request is JSON; a fresh event starts a fresh capture, even at the same revision.
  function request() {
    let options;
    try { options = JSON.parse(output.getAttribute("data-request") ?? "{}"); validate(options); }
    catch (cause) { publish({ instance, captureId: ++sequence, phase: "error", error: { message: cause.message } }); return; }
    void capture(options);
  }
  output.addEventListener("story-inspect", request);
  return { capture, output, dispose() {
    disposed = true; output.removeEventListener("story-inspect", request); output.remove();
  } };
}
