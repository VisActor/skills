// Read-only measurements in rendered CSS pixels relative to the root's top-left.
// ViewBox units, device pixels and CSS layout coordinates must not be mixed here.
export function measureBounds(root, targets) {
  const view = root?.ownerDocument?.defaultView;
  if (!view || !root.isConnected || !Array.isArray(targets))
    throw new Error("measureBounds requires a connected root and target array");
  const rect = (value, name) => {
    if (!value || ![value.x, value.y, value.width, value.height].every(Number.isFinite) ||
        value.width < 0 || value.height < 0)
      throw new Error("Invalid bounds for " + name);
    return { x: value.x, y: value.y, width: value.width, height: value.height };
  };
  const origin = rect(root.getBoundingClientRect(), "root");
  if (!origin.width || !origin.height) throw new Error("Bounds root has no rendered area");
  const seen = new Set(["$stage", "$viewport"]);
  const items = targets.map((target) => {
    const { id, element } = target;
    if (typeof id !== "string" || !id || seen.has(id))
      throw new Error("Bounds require unique nonempty ids, excluding $stage and $viewport: " + id);
    seen.add(id);
    // Canvas/custom renderers may supply an already transformed root-relative CSS box.
    if ("box" in target) {
      if ("element" in target) throw new Error("Supply either element or box for " + id);
      const box = rect(target.box, id);
      return { id, source: "supplied", status: target.visible === false ? "hidden" : "measured", box };
    }
    if (!element?.isConnected) return { id, source: "element", status: "missing", box: null };
    if (element.ownerDocument !== root.ownerDocument)
      throw new Error("Bounds targets must belong to the root document: " + id);
    const style = view.getComputedStyle(element);
    let hidden = style.visibility === "hidden" || style.visibility === "collapse";
    for (let parent = element; parent; parent = parent.parentElement) {
      const computed = view.getComputedStyle(parent);
      if (computed.display === "none" || Number(computed.opacity) === 0) hidden = true;
    }
    const r = rect(element.getBoundingClientRect(), id);
    if (hidden || !element.getClientRects().length || !r.width || !r.height)
      return { id, source: "element", status: "hidden", box: null };
    return { id, source: "element", status: "measured",
      box: { ...r, x: r.x - origin.x, y: r.y - origin.y } };
  });
  return {
    space: "root-relative-css-px",
    stage: { x: 0, y: 0, width: origin.width, height: origin.height },
    viewport: { x: -origin.x, y: -origin.y, width: view.innerWidth, height: view.innerHeight },
    items,
  };
}

// Candidate diagnostics only: no positioning, DOM writes, clocks or visual-quality score.
// Check only declared relationships; intentional overlaps remain the author's choice.
export function checkBounds(snapshot, rules, { tolerance = 0.5 } = {}) {
  if (snapshot?.space !== "root-relative-css-px" || !Array.isArray(rules) ||
      !Number.isFinite(tolerance) || tolerance < 0)
    throw new Error("checkBounds requires a bounds snapshot, rule array and nonnegative tolerance");
  const items = new Map(), candidates = [], skipped = [];
  for (const item of [
    { id: "$stage", status: "measured", box: snapshot.stage },
    { id: "$viewport", status: "measured", box: snapshot.viewport }, ...snapshot.items,
  ]) {
    if (items.has(item.id) || !["measured", "hidden", "missing"].includes(item.status))
      throw new Error("Invalid or duplicate bounds item: " + item.id);
    if (item.status === "measured" && (!item.box ||
        ![item.box.x, item.box.y, item.box.width, item.box.height].every(Number.isFinite) ||
        item.box.width < 0 || item.box.height < 0))
      throw new Error("Invalid measured box: " + item.id);
    items.set(item.id, item);
  }
  let checked = 0;
  const idsFor = (ids) => {
    if (!Array.isArray(ids) || ids.some((id) => !items.has(id)))
      throw new Error("Bounds rule refers to unknown ids: " + ids);
    return [...new Set(ids)];
  };
  const getPair = (ids, rule) => {
    const pair = idsFor(ids).map((id) => items.get(id));
    if (pair.length !== 2) throw new Error("Bounds relationship requires two distinct ids");
    const unavailable = pair.filter((item) => item.status !== "measured");
    if (unavailable.length) {
      skipped.push({ rule, ids, unavailable: unavailable.map(({ id, status }) => ({ id, status })) });
      return null;
    }
    checked++;
    return pair.map((item) => item.box);
  };
  rules.forEach((rule, index) => {
    const ids = idsFor(rule.ids);
    const margin = rule.type === "inside" ? (rule.padding ?? 0) : (rule.gap ?? 0);
    if (!Number.isFinite(margin) || margin < 0) throw new Error("Bounds spacing must be nonnegative");
    if (rule.type === "inside") {
      idsFor([rule.within]);
      for (const id of ids) {
        const pair = getPair([id, rule.within], index);
        if (!pair) continue;
        const [a, b] = pair;
        const overflow = { left: b.x + margin - a.x, top: b.y + margin - a.y,
          right: a.x + a.width - (b.x + b.width - margin),
          bottom: a.y + a.height - (b.y + b.height - margin) };
        const edges = Object.fromEntries(Object.entries(overflow).filter(([, amount]) => amount > tolerance));
        if (Object.keys(edges).length) candidates.push({ type: "outside", rule: index, ids: [id, rule.within], edges });
      }
    } else if (rule.type === "separate") {
      // Without `from`, compare pairs within ids; otherwise compare the two explicit groups.
      const from = rule.from === undefined ? null : idsFor(rule.from);
      const seen = new Set();
      for (let i = 0; i < ids.length; i++) for (const other of from ?? ids.slice(i + 1)) {
        const id = ids[i], key = JSON.stringify([id, other].sort());
        if (id === other || seen.has(key)) continue;
        seen.add(key);
        const pair = getPair([id, other], index);
        if (!pair) continue;
        const [a, b] = pair;
        const x = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
        const y = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
        if (x + margin > tolerance && y + margin > tolerance)
          candidates.push({ type: x > tolerance && y > tolerance ? "overlap" : "clearance",
            rule: index, ids: [id, other], overlap: { x, y }, gap: margin });
      }
    } else throw new Error("Unknown bounds rule type: " + rule.type);
  });
  return { checked, candidates, skipped };
}
