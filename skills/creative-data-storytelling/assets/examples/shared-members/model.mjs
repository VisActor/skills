import { clamp01 } from "../../runtime/geometry.mjs";
import { blendNodes } from "../../runtime/motion.mjs";

// Synthetic, mutually exclusive joint counts. Expanded IDs identify count slots.
export const membershipExample = {
  conditions: ["talk", "workshop"],
  origins: [
    { id: "neighbors", label: "邻里群", color: "#287d7c" },
    { id: "alumni", label: "校友群", color: "#a3583e" },
    { id: "poster", label: "社区海报", color: "#7b689b" },
  ],
  patterns: [[18,12,6,4], [15,15,14,6], [9,6,13,2]].flatMap((counts, g) =>
    counts.map((count, c) => ({ id: `${g}:${c}`, origin: ["neighbors","alumni","poster"][g], count,
      memberships: [["talk","workshop"],["talk"],["workshop"],[]][c] }))),
};

export function clusterSlots(count, step) {
  const extent = Math.ceil(Math.sqrt(count)) + 1, candidates = [];
  for (let row = -extent; row <= extent; row++) for (let col = -extent; col <= extent; col++) {
    const x = (col + ((row % 2 + 2) % 2) / 2) * step, y = row * step * Math.sqrt(3) / 2;
    candidates.push({ x, y, distance: x * x + y * y });
  }
  return candidates.sort((a,b) => a.distance - b.distance || a.y - b.y || a.x - b.x).slice(0,count);
}

export function createMembership({ origins, patterns, conditions }, { pitch = 26, radius = 8 } = {}) {
  if (!Array.isArray(origins) || origins.length < 2 || origins.length > 3 ||
    new Set(origins.map(g=>g.id)).size !== origins.length || origins.some(g=>!g.id || !g.label || !g.color))
    throw new Error("This arrangement supports two or three distinct named origins");
  if (!Array.isArray(conditions) || !conditions.length || conditions.some(c=>typeof c!=="string" || !c) || new Set(conditions).size!==conditions.length)
    throw new Error("Select distinct, nonempty joint membership conditions");
  if (!Array.isArray(patterns) || !patterns.length || new Set(patterns.map(p=>p.id)).size!==patterns.length || patterns.some(p=>
    !p.id || !origins.some(g=>g.id===p.origin) || !Number.isSafeInteger(p.count) || p.count<0 ||
    !Array.isArray(p.memberships) || p.memberships.some(c=>typeof c!=="string" || !c) || new Set(p.memberships).size!==p.memberships.length))
    throw new Error("Patterns need known origins and disjoint joint counts with unique IDs");
  const total = patterns.reduce((n,p)=>n+p.count,0);
  if (total < 1 || total > 600 || ![pitch,radius].every(n=>Number.isFinite(n) && n>0) || radius*2>=pitch)
    throw new Error("Use 1–600 slots and a positive pitch larger than the mark diameter; choose another layout for larger groups");
  const records = patterns.flatMap(p=>Array.from({length:p.count},(_,i)=>({id:JSON.stringify([p.id,i]), origin:p.origin,
    selected:conditions.every(c=>p.memberships.includes(c))})));
  const groups=origins.map(g=>({...g, members:records.filter(r=>r.origin===g.id)}));
  groups.forEach(g=>{ g.selected=g.members.filter(r=>r.selected);g.remaining=g.members.filter(r=>!r.selected); });
  const largest=field=>groups.filter(g=>g[field].length===Math.max(...groups.map(group=>group[field].length)));
  const leaders={signup:largest("members"),joint:largest("selected")};
  const selected=records.filter(r=>r.selected), count=selected.length;
  const maxCluster=Math.max(count,...groups.map(g=>g.members.length));
  const step=Math.min(pitch, 215/Math.max(1,Math.sqrt(maxCluster)));
  const dot=Math.min(radius,step*.32);
  function layout(state) {
    if (!["sources","identify","gather"].includes(state)) throw new Error("Unknown membership state: "+state);
    const nodes=new Map(), labels=new Map(), gathered=state==="gather";
    const label=(id,x,y,text,color,role="label")=>labels.set(id,{id,x,y,text,color,role,opacity:1});
    function place(rows,x,y) {
      const slots=clusterSlots(rows.length,step);
      rows.forEach((r,i)=>nodes.set(r.id,{...r,x:x+slots[i].x,y:y+slots[i].y,radius:dot,
        opacity:state==="identify" && !r.selected ? .18 : gathered && !r.selected ? .45 : 1}));
    }
    groups.forEach((g,i)=>{
      const x=180+i*640/(groups.length-1);
      place(gathered?g.remaining:g.members,x,gathered?510:300);
      label("source:"+g.id,x,gathered?415:120,g.label,g.color,"name");
      label("count:"+g.id+":"+state,x,gathered?625:445,gathered?`报名 ${g.members.length} 人 · 余下 ${g.remaining.length} 人`:
        state==="identify"?`两项都参加 ${g.selected.length} / ${g.members.length} 人`:`${g.members.length} 人`,g.color);
    });
    if(gathered){
      // Keep source blocks adjacent within the selected cluster.
      const slots=clusterSlots(count,step).sort((a,b)=>a.x-b.x || a.y-b.y);let i=0;
      groups.forEach(g=>g.selected.forEach(r=>{const p=slots[i++];nodes.set(r.id,{...r,x:500+p.x,y:210+p.y,radius:dot,opacity:1});}));
      label("selected",500,55,`两项都参加：${count} 人`,"#234441","headline");
      groups.forEach((g,i)=>label("from:"+g.id,210+i*580/(groups.length-1),350,`${g.label} ${g.selected.length} 人`,g.color));
    }
    return {state,nodes,labels};
  }
  return {records,groups,leaders,readings:{total,selected:count,remaining:total-count},layout};
}

export function blendMembership(from,to,t) {
  if(t<=0)return from;if(t>=1)return to;
  const nodes=blendNodes(from.nodes,to.nodes,t,["x","y","radius","opacity"]);
  for(const [id,n] of nodes){const a=from.nodes.get(id),b=to.nodes.get(id);n.x+=Math.sin(Math.PI*t)*Math.min(30,Math.hypot(b.x-a.x,b.y-a.y)*.1)*Math.sign(a.x-500);}
  const labels=blendNodes(from.labels,to.labels,t,["x","y","opacity"]);
  for(const [id,l] of labels){if(!to.labels.has(id))l.opacity*=1-clamp01(t/.25);if(!from.labels.has(id))l.opacity*=clamp01((t-.65)/.35);}
  return {state:to.state,nodes,labels};
}
