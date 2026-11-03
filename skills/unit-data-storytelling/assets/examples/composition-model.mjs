import { clamp01, ease, lerp, linearScale, mixScale } from "../mechanics/geometry.mjs";
import { gridLayout, groupLayout, quantize, slotLayout, stackLayout } from "../mechanics/units.mjs";
import { blendNodes, flowPoint } from "../mechanics/motion.mjs";

// Deliberately synthetic. No source matching is inferred between A and B.
export const samples = {
  A: Array.from({ length: 24 }, (_, index) => ({
    id: `A-${index + 1}`, sample: "A", kind: index < 14 ? "phone" : "lamp",
    months: 2 + (index * 7 + Math.floor(index / 4)) % 22,
  })),
  B: Array.from({ length: 36 }, (_, index) => ({
    id: `B-${index + 1}`, sample: "B", kind: index < 14 ? "phone" : "lamp",
    months: 2 + (index * 5 + Math.floor(index / 3)) % 22,
  })),
};
export const source = new Map(Object.values(samples).flat().map((row) => [row.id, row]));
export const scale = linearScale([0, 24], [120, 910]);
export const regions = new Map([
  ["phone", { x: 80, y: 65, width: 870, height: 180 }],
  ["lamp", { x: 80, y: 305, width: 870, height: 180 }],
]);

export function makePose(sample, organization, { boundsByGroup = regions } = {}) {
  const nodes = groupLayout(samples[sample], {
    groupBy: (row) => row.kind, boundsByGroup,
    layout: (rows, { bounds }) => organization === "groups"
      ? gridLayout(rows, { bounds, cell: 48, areaOf: () => Math.PI * 6 ** 2 })
      : stackLayout(rows, {
        bounds, scale, valueOf: (row) => row.months,
        crossStart: bounds.y + bounds.height - 23, crossStep: -45, gap: 3,
        areaOf: () => Math.PI * 6 ** 2,
        // Reserve the same image footprint even when circles are shown.
        extentOf: () => ({ width: 29, height: 36 }),
      }),
  });
  return { nodes, axisOpacity: organization === "duration" ? 1 : 0,
    meta: { sample, organization } };
}

function phaseOf(id) {
  let value = 0;
  for (const char of id) value = (value * 31 + char.charCodeAt(0)) >>> 0;
  return value / 4294967296 * Math.PI * 2;
}

// These positions and paths are this study's art direction, not library presets.
// Data ids remain distinct. New records do not inherit the paths of old records.
function fieldPoint(id) {
  const row = source.get(id), number = Number(id.split("-")[1]);
  return { x: 430 + Math.sin(number * 2.3) * 100,
    y: (row.kind === "phone" ? 155 : 400) + Math.cos(number * 1.9) * 40 };
}

// This demo's art direction. Operation functions below accept a route callback;
// changing the route does not change record identity or the target geometry.
function studyRoute(a, b, id) {
  const index = Number(id.split("-")[1]), bend = Math.sin(index * 1.7) * 65;
  return {
    control1: { x: a.x * .6 + b.x * .4, y: a.y + bend },
    control2: { x: a.x * .3 + b.x * .7, y: b.y - bend },
    amplitude: 15, phase: phaseOf(id), delay: (index % 5) * .025,
  };
}

export function blendStudy(from, to, t) {
  if (t <= 0) return from;
  if (t >= 1) return to;
  const nodes = blendNodes(from.nodes, to.nodes, t);
  for (const [id, node] of nodes) {
    const a = from.nodes.get(id), b = to.nodes.get(id), phase = phaseOf(id);
    if (a && b) {
      Object.assign(node, flowPoint(a, b, t, studyRoute(a, b, id)));
    } else if (a) {
      const p = clamp01(t / .63), end = fieldPoint(id);
      Object.assign(node, flowPoint(a, end, p, {
        control1: { x: a.x + 50, y: end.y - 60 },
        control2: { x: end.x + 90, y: end.y + 60 }, amplitude: 28, phase,
      }));
      node.opacity = a.opacity * (1 - ease(p));
    } else {
      const p = clamp01((t - .28) / .72), start = fieldPoint(id);
      Object.assign(node, flowPoint(start, b, p, {
        control1: { x: start.x - 90, y: start.y - 60 },
        control2: { x: b.x - 50, y: b.y + 60 }, amplitude: 28, phase,
      }));
      node.opacity = b.opacity * ease(p);
    }
  }
  return { nodes, axisOpacity: lerp(from.axisOpacity, to.axisOpacity, t), meta: from.meta };
}

// Example-only target construction. The reading example above keeps its simpler
// interface. These operations may be reordered or combined; they are not a
// narrative prescription, a layout catalog or a new rendering framework.
export function makeView(sample, view, { slots, space = "expand" } = {}) {
  const rows = samples[sample];
  if (!rows) throw new Error("Unknown synthetic sample: " + sample);
  if (view === "totals" || view === "share") return makeAggregateView(sample, view);
  const numeric = view === "duration" || view === "focus";
  const expanded = view === "focus" && space === "expand";
  const valueScale = expanded ? linearScale([12, 24], [120, 910]) : scale;
  const selected = view === "local" ? rows.slice(0, 4)
    : view === "focus" ? rows.filter((row) => row.months >= 12) : rows;
  const groupBounds = view === "compare" ? new Map([...regions].map(([kind, bounds], index) =>
    [kind, { ...bounds, y: 165 + index * 120 }])) : regions;
  let nodes;
  if (view === "local" || view === "whole") {
    nodes = gridLayout(selected, view === "local"
      ? { bounds: { x: 250, y: 190, width: 560, height: 140 }, cell: 140, areaOf: () => Math.PI * 12 ** 2 }
      : { bounds: { x: 180, y: 95, width: 680, height: 400 }, cell: 80, areaOf: () => Math.PI * 6 ** 2 });
  } else if (["groups", "compare", "duration"].includes(view)) {
    nodes = makePose(sample, view === "compare" ? "groups" : view, { boundsByGroup: groupBounds }).nodes;
  } else if (view === "focus") {
    nodes = groupLayout(selected, {
      groupBy: (row) => row.kind, boundsByGroup: regions,
      layout: (group, { bounds }) => stackLayout(group, {
        // Use the previously empty band above the stack for larger glyphs.
        // The left category caption stays clear of these numeric positions.
        bounds: expanded ? { ...bounds, y: bounds.y - 45, height: bounds.height + 45 } : bounds,
        scale: valueScale, valueOf: (row) => row.months,
        crossStart: bounds.y + bounds.height - (expanded ? 28 : 23),
        crossStep: expanded ? -57 : -45, gap: 3,
        areaOf: () => Math.PI * (expanded ? 10 : 6) ** 2,
        extentOf: () => ({ width: expanded ? 41 : 29, height: expanded ? 51 : 36 }),
      }),
    });
  } else if (view === "shape") {
    nodes = slotLayout(rows, slots, {
      bounds: { x: 280, y: 45, width: 440, height: 440 }, areaOf: () => Math.PI * 5 ** 2,
    });
  } else throw new Error("Unknown study view: " + view);

  // Static category images have a footprint unrelated to encoded area. This
  // small study fits a common image size to its chosen slots; dense large works
  // should reserve footprints in their layout rather than do pairwise searches.
  let imageScale = view === "local" ? 2 : expanded ? 1.4 : 1;
  if (view === "shape") {
    const points = [...nodes.values()];
    for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j++) {
      imageScale = Math.min(imageScale, .8 * Math.max(
        Math.abs(points[i].x - points[j].x) / 28.8, Math.abs(points[i].y - points[j].y) / 36));
    }
  }
  for (const node of nodes.values()) node.imageScale = imageScale;

  const grouped = ["groups", "compare", "duration", "focus"].includes(view);
  // Only these two layouts preserve the entire group's internal arrangement.
  const groupOrigins = ["groups", "compare"].includes(view)
    ? new Map([...groupBounds].map(([kind, bounds]) => [kind, { x: bounds.x, y: bounds.y }])) : null;
  const guides = new Map();
  for (const [kind, bounds] of groupBounds) {
    guides.set(kind, { id: kind, group: kind, role: "category",
      text: kind === "phone" ? "手机" : "台灯",
      x: bounds.x, y: bounds.y - 16, opacity: grouped ? 1 : 0 });
    const members = selected.filter((row) => row.kind === kind);
    // Same collection, same count identity. A changed collection gets its own
    // factual label; counts are never inferred from interpolated coordinates.
    const id = JSON.stringify(["count", kind, members.map((row) => row.id)]);
    guides.set(id, { id, group: kind, role: "count", text: `${sample} · ${members.length} 件`,
      x: bounds.x + 72, y: bounds.y - 16, opacity: grouped ? 1 : 0 });
  }
  guides.set("collection", { id: "collection", role: "category", text: "同一批设备记录",
    x: 180, y: 55, opacity: grouped ? 0 : 1 });
  // Every endpoint stores a complete numeric frame, even when it is not used.
  // Axis visibility follows the selected encoding.
  return { nodes, aggregates: new Map(), guides, groupOrigins, scale: valueScale, numeric: numeric ? 1 : 0,
    shareFrame: 0,
    axisOpacity: numeric ? 1 : 0,
    meta: { sample, view, space, count: selected.length } };
}

// Shared by the record operations: retain factual text and stable label IDs.
// Only a count for a changed collection retires; no stage-wide visibility flag.
function blendGuides(from, to, t) {
  const guides = blendNodes(from, to, t, ["x", "y", "opacity"]);
  for (const [id, guide] of guides) {
    const a = from.get(id), b = to.get(id), definition = b ?? a;
    Object.assign(guide, { group: definition.group, role: definition.role, text: definition.text });
    if (definition.role === "count") {
      if (a && !b) guide.opacity = a.opacity * (1 - clamp01(t / .4));
      if (!a && b) guide.opacity = b.opacity * clamp01((t - .6) / .4);
    }
  }
  return guides;
}

// Common output envelope; these helpers do not depend on the demo's source table.
function recordFrame(from, to, t, nodes) {
  return { nodes, aggregates: new Map(), shareFrame: 0,
    scale: mixScale(from.scale, to.scale, t), groupOrigins: null,
    guides: blendGuides(from.guides, to.guides, t),
    numeric: lerp(from.numeric, to.numeric, t),
    axisOpacity: lerp(from.axisOpacity, to.axisOpacity,
      to.numeric === 0 ? ease(clamp01(t / .16)) : t), meta: from.meta };
}

function visibleCenter(nodes) {
  const visible = [...nodes.values()].filter((node) => node.opacity > .1);
  return visible.length ? visible.reduce((sum, node) => ({ x: sum.x + node.x / visible.length,
    y: sum.y + node.y / visible.length }), { x: 0, y: 0 }) : { x: 500, y: 260 };
}

// EXTRACTION: same sample and numeric measure. from/to carry nodes, guides,
// scale, numeric and axisOpacity. Dependencies: recordFrame/blendGuides,
// visibleCenter and the mechanism interfaces imported at the top of this file.
export function blendExtraction(from, to, t) {
  if (t <= 0) return from;
  if (t >= 1) return to;
  const extracting = [...from.nodes.keys()].some((id) => !to.nodes.has(id));
  const spatial = extracting ? ease(clamp01((t - .12) / .88)) : t;
  const nodes = blendNodes(from.nodes, to.nodes, t, ["x", "y", "area", "opacity", "imageScale"]);
  const origin = visibleCenter(from.nodes);
  for (const [id, node] of nodes) {
    const a = from.nodes.get(id), b = to.nodes.get(id);
    node.imageScale = lerp((a ?? b).imageScale, (b ?? a).imageScale, spatial);
    if (a && b) {
      // Retained points and the axis share one spatial progress. Interpolating
      // from the visible point also preserves an interrupted return.
      for (const key of ["x", "y", "area"]) node[key] = lerp(a[key], b[key], spatial);
    } else if (a) {
      Object.assign(node, { x: a.x, y: a.y, area: a.area, imageScale: a.imageScale,
        opacity: a.opacity * (1 - ease(clamp01(t / .24))) });
    } else {
      Object.assign(node, flowPoint(origin, b, t, {
        control1: { x: origin.x, y: b.y }, control2: { x: b.x, y: origin.y },
      }), { opacity: b.opacity * t });
    }
  }
  return { ...recordFrame(from, to, t, nodes), scale: mixScale(from.scale, to.scale, spatial) };
}

// GROUP MOVE: same members and internal arrangement; only group origins move.
// groupOf(id) comes from the caller's record index. Labels carry their own group.
export function blendGroupMove(from, to, t, groupOf) {
  if (t <= 0) return from;
  if (t >= 1) return to;
  const groupOrigins = new Map([...to.groupOrigins].map(([key, b]) => {
    const a = from.groupOrigins.get(key);
    return [key, flowPoint(a, b, t, {
      control1: { x: a.x + 24, y: a.y }, control2: { x: b.x + 24, y: b.y },
    })];
  }));
  const nodes = blendNodes(from.nodes, to.nodes, t, ["x", "y", "area", "opacity", "imageScale"]);
  const frame = recordFrame(from, to, t, nodes);
  for (const [layer, aLayer, bLayer, keyOf] of [
    [nodes, from.nodes, to.nodes, (node) => groupOf(node.id)],
    [frame.guides, from.guides, to.guides, (guide) => guide.group],
  ]) for (const [id, item] of layer) {
    const a = aLayer.get(id), key = keyOf(item);
    if (!a || !bLayer.has(id) || !key) continue;
    const old = from.groupOrigins.get(key), current = groupOrigins.get(key);
    item.x = a.x + current.x - old.x;
    item.y = a.y + current.y - old.y;
  }
  return { ...frame, groupOrigins };
}

// REORDER: same sample, new arrangement; positions are not read as a numeric
// value in transit. routeFor(a, b, id) returns flowPoint options chosen by the work.
export function blendReorder(from, to, t, routeFor) {
  if (t <= 0) return from;
  if (t >= 1) return to;
  const nodes = blendNodes(from.nodes, to.nodes, t, ["x", "y", "area", "opacity", "imageScale"]);
  const origin = visibleCenter(from.nodes);
  for (const [id, node] of nodes) {
    const a = from.nodes.get(id), b = to.nodes.get(id);
    if (a && b) Object.assign(node, flowPoint(a, b, t, routeFor(a, b, id)));
    else if (a) Object.assign(node, { x: a.x, y: a.y, area: a.area, opacity: a.opacity * (1 - t) });
    else Object.assign(node, flowPoint(origin, b, t, {
      control1: { x: origin.x, y: b.y }, control2: { x: b.x, y: origin.y },
    }), { opacity: b.opacity * t });
  }
  return recordFrame(from, to, t, nodes);
}

// Demo route, not a required direction or stagger for category rearrangements.
function categoryRoute(a, b, id) {
  const direction = source.get(id).kind === "phone" ? -1 : 1, index = Number(id.split("-")[1]);
  return {
    control1: { x: lerp(a.x, b.x, .25), y: Math.max(36, Math.min(480, a.y + direction * 85)) },
    control2: { x: lerp(a.x, b.x, .75), y: Math.max(36, Math.min(480, b.y - direction * 45)) },
    delay: (index % 4) * .025,
  };
}

// The demo can jump anywhere. A work selects operations from its own data
// relationships; view names and this dispatch order are not a narrative template.
export function blendView(from, to, t) {
  if (t <= 0) return from;
  if (t >= 1) return to;
  if (from.aggregates.size || to.aggregates.size) return blendAggregateView(from, to, t);
  const sameSample = from.meta.sample === to.meta.sample;
  if (sameSample && from.groupOrigins && to.groupOrigins)
    return blendGroupMove(from, to, t, (id) => source.get(id).kind);
  if (sameSample && from.numeric === 1 && to.numeric === 1) return blendExtraction(from, to, t);
  if (sameSample) return blendReorder(from, to, t,
    ["groups", "compare"].includes(to.meta.view) ? categoryRoute : studyRoute);
  const nodes = blendStudy(from, to, t).nodes;
  for (const [id, node] of nodes) {
    const a = from.nodes.get(id), b = to.nodes.get(id);
    node.imageScale = lerp((a ?? b).imageScale, (b ?? a).imageScale, t);
    // Retargeting can leave some surviving records from an earlier sample.
    if (a && b && from.numeric === 1 && to.numeric === 1)
      for (const key of ["x", "y", "area"]) node[key] = lerp(a[key], b[key], t);
  }
  return recordFrame(from, to, t, nodes);
}

// One example of records -> additive group totals -> shares of that same total.
// Keep these choices local: quantum, row geometry and motion are not presets.
export function makeAggregateView(sample, view) {
  if (!["totals", "share"].includes(view)) throw new Error("Unknown aggregate view: " + view);
  const base = makeView(sample, "groups"), rows = samples[sample];
  const totals = [...regions.keys()].map((kind) => {
    const members = rows.filter((row) => row.kind === kind);
    return { id: JSON.stringify([sample, kind]), kind, members: members.map((row) => row.id),
      value: members.reduce((sum, row) => sum + row.months, 0) };
  });
  const denominator = totals.reduce((sum, group) => sum + group.value, 0);
  if (!(denominator > 0)) throw new Error("Usage shares need a positive observed total");
  const share = view === "share", quantum = share ? 5 : 10;
  const byId = new Map(totals.map((group) => [group.id, group]));
  const packed = quantize(totals.map((group) => ({
    id: group.id, value: share ? group.value / denominator * 100 : group.value,
  })), { quantum });
  const anchors = new Map([...regions].map(([kind, bounds]) => [kind, { x: 120, y: bounds.y + 80 }]));
  const indices = new Map(), aggregates = new Map();
  for (const unit of packed.units) {
    const group = byId.get(unit.sourceId), index = indices.get(group.id) ?? 0;
    indices.set(group.id, index + 1);
    // Include measure and collection in identity, even if two quantums coincide.
    const id = JSON.stringify([view, unit.id]), anchor = anchors.get(group.kind);
    aggregates.set(id, { ...unit, id, group: group.kind, members: group.members,
      measure: view, denominator, total: group.value, sample,
      x: anchor.x + index * 24, y: anchor.y, width: 20, height: 24, opacity: 1 });
  }
  const guides = new Map(base.guides);
  for (const group of totals) {
    const bounds = regions.get(group.kind);
    // The source total stays true when changing its display into a percentage.
    const id = JSON.stringify(["usage-total", group.id]);
    guides.set(id, { id, group: group.kind, role: "total", x: 80, y: bounds.y + 35,
      text: `${group.value} 设备·月`, opacity: 1 });
    if (share) {
      const shareId = JSON.stringify(["usage-share", group.id]);
      guides.set(shareId, { id: shareId, group: group.kind, role: "share", x: 80, y: bounds.y + 145,
        text: `${(group.value / denominator * 100).toFixed(1)}% · 分母 ${denominator} 设备·月`, opacity: 1 });
    }
  }
  return { ...base, nodes: new Map(), evidenceNodes: base.nodes, aggregates, anchors, guides, groupOrigins: null,
    shareFrame: share ? 1 : 0, meta: { sample, view, count: rows.length, denominator } };
}

function sourceAnchors(pose) {
  if (pose.anchors) return pose.anchors;
  return new Map([...regions].map(([kind, bounds]) => {
    const visible = [...pose.nodes.values()].filter((node) => source.get(node.id).kind === kind && node.opacity > 0);
    const weight = visible.reduce((sum, node) => sum + node.opacity, 0);
    return [kind, weight ? visible.reduce((point, node) => ({
      x: point.x + node.x * node.opacity / weight, y: point.y + node.y * node.opacity / weight,
    }), { x: 0, y: 0 }) : { x: bounds.x + 40, y: bounds.y + 80 }];
  }));
}

// The join is by source GROUP, never by record slot. Both layers remain in the
// sampled pose, so a new target can start from every currently visible mark.
export function blendAggregateView(from, to, t) {
  if (t <= 0) return from;
  if (t >= 1) return to;
  const oldAnchors = sourceAnchors(from), targetAnchors = sourceAnchors(to);
  const anchors = new Map([...targetAnchors].map(([kind, end]) => [kind,
    flowPoint(oldAnchors.get(kind), end, t, {
      control1: { x: oldAnchors.get(kind).x, y: end.y }, control2: end,
    })]));
  const outgoing = ease(clamp01(t / .82));
  const incoming = ease(clamp01((t - .16) / .84));
  function handoffLayer(aLayer, bLayer, channels, kindOf) {
    const result = new Map();
    for (const id of new Set([...aLayer.keys(), ...bLayer.keys()])) {
      const a = aLayer.get(id), b = bLayer.get(id), definition = b ?? a;
      const kind = kindOf(definition), anchor = anchors.get(kind);
      const old = oldAnchors.get(kind), end = targetAnchors.get(kind);
      const node = { ...definition };
      if (a && b) {
        // Surviving marks retain their pose; numeric reordering is handled by
        // blendView when no aggregate layer remains.
        for (const key of channels) node[key] = lerp(a[key], b[key], t);
      } else if (a) {
        node.x = anchor.x + (a.x - old.x) * (1 - outgoing * .78);
        node.y = anchor.y + (a.y - old.y) * (1 - outgoing * .78) + 36 * Math.sin(Math.PI * outgoing);
        node.opacity = a.opacity * (1 - outgoing);
      } else {
        node.x = anchor.x + (b.x - end.x) * incoming;
        node.y = anchor.y + (b.y - end.y) * incoming - 36 * (1 - incoming);
        node.opacity = b.opacity * incoming;
      }
      result.set(id, node);
    }
    return result;
  }
  const nodes = handoffLayer(from.nodes, to.nodes, ["x", "y", "area", "opacity", "imageScale"],
    (node) => source.get(node.id).kind);
  // A direct jump from a subset must not suggest that those few records made
  // the full total. Briefly bring omitted source records into their own group.
  for (const [id, original] of to.evidenceNodes ?? []) {
    if (from.nodes.has(id) || to.nodes.has(id)) continue;
    const row = source.get(id);
    if ([...from.aggregates.values()].some((unit) => unit.sample === row.sample &&
      unit.group === row.kind && unit.opacity > 0)) continue;
    const anchor = anchors.get(row.kind);
    nodes.set(id, { ...original,
      x: lerp(original.x, anchor.x, outgoing), y: lerp(original.y, anchor.y, outgoing),
      opacity: Math.sin(Math.PI * t) ** 2 });
  }
  const aggregates = handoffLayer(from.aggregates, to.aggregates, ["x", "y", "width", "height", "opacity"],
    (node) => node.group);
  const guides = blendNodes(from.guides, to.guides, t, ["x", "y", "opacity"]);
  for (const [id, guide] of guides) {
    const a = from.guides.get(id), b = to.guides.get(id), definition = b ?? a;
    Object.assign(guide, { group: definition.group, role: definition.role, text: definition.text });
    if (a && b && definition.group) {
      const kind = definition.group, anchor = anchors.get(kind);
      guide.x = anchor.x + lerp(a.x - oldAnchors.get(kind).x, b.x - targetAnchors.get(kind).x, t);
      guide.y = anchor.y + lerp(a.y - oldAnchors.get(kind).y, b.y - targetAnchors.get(kind).y, t);
    }
    // Only new/obsolete information changes visibility. Valid category and
    // total readouts continue; transient geometry is never used as a fact.
    if (!b) guide.opacity = a.opacity * (1 - ease(clamp01(t / .3)));
    if (!a) guide.opacity = b.opacity * ease(clamp01((t - .6) / .4));
  }
  const axisProgress = to.axisOpacity ? ease(clamp01((t - .85) / .15)) : ease(clamp01(t / .16));
  return { nodes, aggregates, anchors, guides, groupOrigins: null,
    scale: mixScale(from.scale, to.scale, t), numeric: lerp(from.numeric, to.numeric, t),
    axisOpacity: lerp(from.axisOpacity, to.axisOpacity, axisProgress),
    shareFrame: lerp(from.shareFrame, to.shareFrame,
      to.shareFrame ? incoming : ease(clamp01(t / .2))), meta: from.meta };
}
