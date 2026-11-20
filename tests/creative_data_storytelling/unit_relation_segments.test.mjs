import test from "node:test";
import assert from "node:assert/strict";
import { categoricalExample } from "../../skills/creative-data-storytelling/assets/examples/categorical-change/data.mjs";
import { createCategoricalChange, blend as blendCategories } from "../../skills/creative-data-storytelling/assets/examples/categorical-change/model.mjs";
import { createDistribution, distributionExample } from "../../skills/creative-data-storytelling/assets/examples/distribution-and-exception/model.mjs";
import { readDistribution } from "../../skills/creative-data-storytelling/assets/examples/distribution-and-exception/scene.mjs";
import { createMembership, membershipExample, blendMembership } from "../../skills/creative-data-storytelling/assets/examples/shared-members/model.mjs";
import { createOverlap, createOverlapScene, overlapExample } from "../../skills/creative-data-storytelling/assets/examples/overlap-bound/scene.mjs";
import { createTransition } from "../../skills/creative-data-storytelling/assets/runtime/motion.mjs";
import { at } from "../../skills/creative-data-storytelling/assets/runtime/geometry.mjs";

const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
const assertIds=(a,b)=>assert.deepEqual(new Set(a.nodes.keys()),new Set(b.nodes.keys()));
function assertReversal(start,end,blend){
  const player=createTransition(start,{blend,duration:1000});player.target(end,0);
  const interrupted=player.sample(430).pose;
  player.target(start,430);
  assert.deepEqual(player.sample(430).pose,interrupted);
  assert.deepEqual(player.sample(1430).pose,start);
}

test("paired classification preserves people and independent attribute colors across two observations",()=>{
  const m=createCategoricalChange(categoricalExample),a=m.layout("before"),b=m.layout("after");
  assert.deepEqual([m.readings.before,m.readings.after,m.readings.changed],[[60,40,20],[36,36,48],62]);
  for(const p of [a,blendCategories(a,b,.45),b]){
    assertIds(a,p);
    for(const row of m.records){const n=p.nodes.get(row.id);assert.equal(n.fill,row.fill);assert.ok([n.x,n.y,n.scale].every(Number.isFinite));}
  }
  for(const [i,c] of m.categories.entries()) assert.equal([...b.nodes.values()].filter(n=>n.group===c.id).length,m.readings.after[i]);
  assertReversal(a,b,blendCategories);
});

test("classification accepts different topics and rejects absent or duplicate paired identities",()=>{
  const input={categories:[{id:"new",label:"初学"},{id:"ready",label:"熟练"}],attributes:[{id:"one",label:"全体",color:"#123456"}],
    records:[{id:"x",before:"new",after:"ready",attribute:"one"},{id:"y",before:"ready",after:"ready",attribute:"one"}]};
  const m=createCategoricalChange(input,{width:1000,height:500});
  assert.deepEqual(m.readings.after,[0,2]);
  assert.throws(()=>createCategoricalChange({...input,records:[input.records[0],input.records[0]]}),/unique IDs/);
  assert.throws(()=>createCategoricalChange({...input,records:[{...input.records[0],after:null}]}),/known categories/);
  assert.throws(()=>createCategoricalChange(input,{width:240}),/positive space/);
});

test("classification endpoints leave sufficient space for every equal-sized person",()=>{
  const m=createCategoricalChange(categoricalExample);
  for(const state of ["before","after"]){const p=m.layout(state);const nodes=[...p.nodes.values()];
    for(const [i,a] of nodes.entries()){
      assert.ok(a.x>0 && a.x<1200 && a.y>0 && a.y<520);
      for(const b of nodes.slice(i+1)) assert.ok(Math.abs(a.x-b.x)>=12*Math.max(a.scale,b.scale) || Math.abs(a.y-b.y)>=26*Math.max(a.scale,b.scale));
    }
  }
});

test("independent batches retain separate identities, visible history and complete tail denominators",()=>{
  const m=createDistribution(distributionExample),a=m.layout("history"),b=m.layout("tail");
  assert.equal(a.nodes.size,72);
  assert.deepEqual(m.summaries.map(s=>[s.count,s.median,s.tail]),[[24,9.5,0],[24,9.5,2],[24,9.5,6]]);
  assertIds(a,b);
  assert.equal([...a.nodes.values()].filter(n=>n.opacity>0).length,72);
  assert.equal([...b.nodes.values()].filter(n=>n.opacity>0).length,6);
  assert.equal(b.guides.get("A:tail").text,"≥ 20 小时：0 / 24 件");
  assert.equal(b.guides.get("C:tail").text,"≥ 20 小时：6 / 24 件");
});

test("points, threshold and visible domain share the same in-between mapping during zoom and reversal",()=>{
  const m=createDistribution(distributionExample),a=m.layout("compare"),b=m.layout("tail");
  for(const t of [.1,.4,.7,.95]){
    const p=m.blend(a,b,t);assertIds(a,p);
    for(const r of m.records) near(p.nodes.get(r.id).x,at(p.scale,r.hours));
    near(at(p.scale,p.domain[0]),170);near(at(p.scale,p.domain[1]),900);
  }
  assertReversal(a,b,m.blend);
});

test("distribution conclusions are computed for unequal sample sizes, zeros and an empty tail",()=>{
  const m=createDistribution({threshold:5,batches:[{id:"x",name:"一",values:[0,1]},{id:"y",name:"二",values:[0,2,3]},{id:"z",name:"三",values:[1]}]});
  assert.deepEqual(m.summaries.map(s=>[s.count,s.mean,s.tail]),[[2,.5,0],[3,5/3,0],[1,1,0]]);
  assert.equal(m.readings.count,1);
  assert.throws(()=>createDistribution({...distributionExample,threshold:-1}),/nonnegative hours/);
  assert.throws(()=>createDistribution({...distributionExample,batches:[null,...distributionExample.batches.slice(1)]}),/distinct nonempty/);
});

test("enlarged repeated-hour parcels keep equal size and separation inside their row",()=>{
  const m=createDistribution({threshold:20,batches:[
    {id:"a",name:"甲",values:[10,20,20]},
    {id:"b",name:"乙",values:[10,20]},
    {id:"c",name:"丙",values:[12,20,20,20,20]},
  ]});
  const a=m.layout("compare"),b=m.layout("tail");
  for(const p of [a,...[.2,.5,.8].map(t=>m.blend(a,b,t)),b]){
    const nodes=[...p.nodes.values()].filter(n=>n.opacity>.99);
    assert.equal(new Set(nodes.map(n=>n.radius)).size,1);
    for(const [i,n] of nodes.entries()){
      const record=m.byId.get(n.id),row=p.rows.get(record.batch);
      assert.ok(n.y-n.radius>=row.y-65-.001);
      for(const next of nodes.slice(i+1)){
        const other=m.byId.get(next.id);
        if(record.batch===other.batch&&record.hours===other.hours)
          assert.ok(Math.abs(n.y-next.y)>n.radius+next.radius);
      }
    }
  }
  assertReversal(a,b,m.blend);
});

test("mean and median references follow their statistics through the shared zoom scale",()=>{
  const m=createDistribution(distributionExample),a=m.layout("compare"),b=m.layout("tail");
  for(const p of [a,m.blend(a,b,.35),m.blend(a,b,.7),b]){
    const marks=m.statistics(p);
    for(const batch of m.summaries)for(const kind of ["mean","median"]){
      const mark=marks.find(s=>s.id===`${kind}:${batch.id}`);
      near(mark.x,at(p.scale,batch[kind]));
      assert.equal(mark.value,batch[kind]);
    }
    near(marks.find(s=>s.id==="median:A").x,marks.find(s=>s.id==="median:C").x);
  }
});

test("adapted comparison copy uses both actual medians when mean and median decrease",()=>{
  const m=createDistribution({threshold:20,batches:[
    {id:"a",name:"甲",values:[1,9,15]},
    {id:"b",name:"乙",values:[3,7,10]},
    {id:"c",name:"丙",values:[1,2,6]},
  ]});
  // Verify the numerical statement, not the surrounding editorial wording.
  const values=[...readDistribution(m,2).description.matchAll(/\d+(?:\.\d+)?/g)].map(match=>Number(match[0]));
  assert.deepEqual(values,[8.3,3,9,2]);
});

test("known intersection retains both selected and remaining slots with their sources",()=>{
  const m=createMembership(membershipExample),a=m.layout("sources"),b=m.layout("gather");
  assert.deepEqual(m.readings,{total:120,selected:42,remaining:78});
  assert.deepEqual(m.groups.map(g=>[g.members.length,g.selected.length]),[[40,18],[50,15],[30,9]]);
  for(const p of [m.layout("identify"),blendMembership(a,b,.5),b]){
    assertIds(a,p);
    for(const r of m.records) assert.equal(p.nodes.get(r.id).origin,r.origin);
  }
  assert.equal([...b.nodes.values()].filter(n=>n.selected).length,42);
  assertReversal(a,b,blendMembership);
});

test("intersection changes with supplied joint memberships, including none or everyone selected",()=>{
  const base={origins:[{id:"a",label:"甲",color:"#123456"},{id:"b",label:"乙",color:"#654321"}],conditions:["active"],
    patterns:[{id:"a:yes",origin:"a",count:3,memberships:["active"]},{id:"b:no",origin:"b",count:2,memberships:[]}]};
  assert.equal(createMembership(base).readings.selected,3);
  assert.equal(createMembership({...base,conditions:["unknown"]}).readings.selected,0);
  const all=createMembership({...base,patterns:base.patterns.map(p=>({...p,memberships:["active"]}))});
  assert.equal(all.readings.remaining,0);
  assert.equal(all.layout("gather").nodes.size,5);
  assert.throws(()=>createMembership({...base,patterns:[{...base.patterns[0],count:-1}]}),/joint counts/);
});

test("source leaders distinguish signup size from joint participation and retain ties",()=>{
  const m=createMembership(membershipExample);
  assert.deepEqual(m.leaders.signup.map(g=>g.id),["alumni"]);
  assert.deepEqual(m.leaders.joint.map(g=>g.id),["neighbors"]);
  const tied=createMembership({conditions:["both"],origins:membershipExample.origins.slice(0,2),patterns:[
    {id:"one",origin:"neighbors",count:2,memberships:["both"]},
    {id:"two",origin:"alumni",count:2,memberships:["both"]},
  ]});
  for(const group of [tied.leaders.signup,tied.leaders.joint])
    assert.deepEqual(group.map(g=>g.id),["neighbors","alumni"]);
});

test("selected and remaining clusters have no overlapping marks at the reading endpoints",()=>{
  const m=createMembership(membershipExample);
  for(const state of ["sources","identify","gather"]){const nodes=[...m.layout(state).nodes.values()];
    for(const [i,a] of nodes.entries())for(const b of nodes.slice(i+1))assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>=a.radius+b.radius-.001);
  }
});

test("overlap extremes match all feasible joint counts, including zero and full populations",()=>{
  for(let n=1;n<=16;n++)for(let a=0;a<=n;a++)for(let b=0;b<=n;b++){
    const m=createOverlap({population:n,first:a,second:b});
    const feasible=Array.from({length:n+1},(_,i)=>i).filter(i=>i<=a && i<=b && n-(a+b-i)>=0);
    assert.equal(m.minimum,Math.min(...feasible));assert.equal(m.maximum,Math.max(...feasible));
    near(m.arrangement(1).overlap,m.minimum);near(m.arrangement(0).overlap,m.maximum);
  }
});

test("bound animation preserves both counts and the whole population while moving to the minimum",()=>{
  const s=createOverlapScene(overlapExample),a=s.layout("counts"),b=s.layout("minimum");
  for(const t of [0,.2,.5,.9,1]){const p=s.blend(a,b,t),g=s.geometry(p);
    near(g.bEnd-g.bStart,s.model.second*g.scale);near(g.aEnd-g.left,s.model.first*g.scale);
    assert.ok(g.bStart>=g.left && g.bEnd<=g.left+g.width+.001);
  }
  assert.equal(s.model.minimum,36);assertReversal(a,b,s.blend);
  assert.equal(createOverlap({population:120,first:84,second:24}).minimum,0);
  assert.throws(()=>createOverlap({population:120,first:121,second:2}),/marginal counts/);
});
