import { clamp01, ease, lerp, linearScale, mixScale } from "../mechanics/geometry.mjs";
import { gridLayout, groupLayout, slotLayout, stackLayout } from "../mechanics/units.mjs";
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

export function blendStudy(from, to, t) {
  if (t <= 0) return from;
  if (t >= 1) return to;
  const nodes = blendNodes(from.nodes, to.nodes, t);
  for (const [id, node] of nodes) {
    const a = from.nodes.get(id), b = to.nodes.get(id), phase = phaseOf(id);
    if (a && b) {
      const bend = Math.sin(Number(id.split("-")[1]) * 1.7) * 65;
      Object.assign(node, flowPoint(a, b, t, {
        control1: { x: a.x * .6 + b.x * .4, y: a.y + bend },
        control2: { x: a.x * .3 + b.x * .7, y: b.y - bend },
        amplitude: 15, phase, delay: (Number(id.split("-")[1]) % 5) * .025,
      }));
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
  return { nodes, guides, groupOrigins, scale: valueScale, numeric: numeric ? 1 : 0,
    axisOpacity: numeric ? 1 : 0,
    meta: { sample, view, space, count: selected.length } };
}

export function blendView(from, to, t) {
  if (t <= 0) return from;
  if (t >= 1) return to;
  const sameSample = from.meta.sample === to.meta.sample;
  // Translate the formed groups as wholes, including their guides. Reordering
  // within a group takes the per-record paths below instead.
  const groupOrigins = sameSample && from.groupOrigins && to.groupOrigins
    ? new Map([...to.groupOrigins].map(([kind, b]) => {
      const a = from.groupOrigins.get(kind);
      return [kind, flowPoint(a, b, t, {
        control1: { x: a.x + 24, y: a.y }, control2: { x: b.x + 24, y: b.y },
      })];
    })) : null;
  const numericChange = sameSample && from.numeric === 1 && to.numeric === 1;
  const extracting = numericChange && [...from.nodes.keys()].some((id) => !to.nodes.has(id));
  // Local choreography: selection/exit begins first; expansion overlaps it.
  // Both retained anchors and ticks use this one progress, never per-unit lag.
  const spatial = extracting ? ease(clamp01((t - .12) / .88)) : t;
  const scale = mixScale(from.scale, to.scale, spatial);
  const nodes = blendStudy(from, to, t).nodes;
  const visible = [...from.nodes.values()].filter((node) => node.opacity > .1);
  const origin = visible.length ? visible.reduce((sum, node) => ({ x: sum.x + node.x / visible.length,
    y: sum.y + node.y / visible.length }), { x: 0, y: 0 }) : { x: 500, y: 260 };
  for (const [id, node] of nodes) {
    const a = from.nodes.get(id), b = to.nodes.get(id);
    node.imageScale = lerp((a ?? b).imageScale, (b ?? a).imageScale, spatial);
    if (groupOrigins && a && b) {
      const kind = source.get(id).kind, origin = groupOrigins.get(kind), old = from.groupOrigins.get(kind);
      node.x = a.x + origin.x - old.x;
      node.y = a.y + origin.y - old.y;
    } else if (a && b && from.numeric === 1 && to.numeric === 1) {
      // During a numeric zoom every retained data anchor and axis tick uses
      // this very scale. A decorative curve must not corrupt numeric x.
      // Linear endpoint interpolation equals at(mixScale(...), value) when
      // both endpoints are aligned; it also preserves an interrupted entrance.
      node.x = lerp(a.x, b.x, spatial);
      node.y = lerp(a.y, b.y, spatial);
      node.area = lerp(a.area, b.area, spatial);
    } else if (sameSample && a && !b) {
      // Context leaves at its old size/position; it does not inherit the zoom.
      Object.assign(node, { x: a.x, y: a.y, area: a.area, opacity: a.opacity * (1 - t) });
    } else if (sameSample && !a && b) {
      Object.assign(node, flowPoint(origin, b, t, {
        control1: { x: origin.x, y: b.y }, control2: { x: b.x, y: origin.y },
      }), { opacity: b.opacity * t });
    } else if (sameSample && a && b && ["groups", "compare"].includes(to.meta.view)) {
      // The two category streams open in different directions, then settle
      // along their target rows. This route is a design choice of this demo.
      const row = source.get(id), index = Number(id.split("-")[1]);
      const direction = row.kind === "phone" ? -1 : 1;
      Object.assign(node, flowPoint(a, b, t, {
        control1: { x: lerp(a.x, b.x, .25), y: Math.max(36, Math.min(480, a.y + direction * 85)) },
        control2: { x: lerp(a.x, b.x, .75), y: Math.max(36, Math.min(480, b.y - direction * 45)) },
        delay: (index % 4) * .025,
      }));
    }
    if (extracting && a && !b) {
      // Removed records fade at their previous coordinates before the scale
      // meaningfully expands; their size never inherits the selected zoom.
      Object.assign(node, { x: a.x, y: a.y, area: a.area, imageScale: a.imageScale,
        opacity: a.opacity * (1 - ease(clamp01(t / .24))) });
    }
  }
  const guides = blendNodes(from.guides, to.guides, t, ["x", "y", "opacity"]);
  for (const [id, guide] of guides) {
    const a = from.guides.get(id), b = to.guides.get(id), definition = b ?? a;
    Object.assign(guide, { group: definition.group, role: definition.role, text: definition.text });
    if (groupOrigins && a && b && definition.group) {
      const origin = groupOrigins.get(definition.group), old = from.groupOrigins.get(definition.group);
      guide.x = a.x + origin.x - old.x;
      guide.y = a.y + origin.y - old.y;
    }
    // Retire only a count whose underlying collection changed. Categories and
    // still-valid counts continue; this is not a stage-wide moving switch.
    if (definition.role === "count") {
      if (a && !b) guide.opacity = a.opacity * (1 - clamp01(t / .4));
      if (!a && b) guide.opacity = b.opacity * clamp01((t - .6) / .4);
    }
  }
  return { nodes, scale, guides, groupOrigins,
    numeric: lerp(from.numeric, to.numeric, t),
    // Numeric positions lose their meaning when becoming a category grid.
    // Retire only that obsolete axis early; valid categories and names stay.
    axisOpacity: lerp(from.axisOpacity, to.axisOpacity,
      to.numeric === 0 ? ease(clamp01(t / .16)) : t), meta: from.meta };
}
