(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.StudyModel=factory();})(typeof window==='undefined'?globalThis:window,function(){
'use strict';
const ids=['CHN','USA'],years=Array.from({length:17},(_,i)=>2006+i);
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;
const fields=['archive','year','gap','history','settle'];
const poses=[
 {archive:0,year:2006,gap:0,history:2005,settle:0},
 {archive:1,year:2006,gap:0,history:2005,settle:0},
 {archive:1,year:2022,gap:0,history:2005,settle:1},
 {archive:1,year:2022,gap:1,history:2022,settle:1}
];
const same=(a,b)=>fields.every(k=>Math.abs(a[k]-b[k])<1e-9);
const blend=(a,b,t)=>Object.fromEntries(fields.map(k=>[k,mix(a[k],b[k],t)]));
function createModel(data){
 const records=new Map(data.records.map(r=>[r.id+'/'+r.year,r]));
 const get=(id,y)=>{const r=records.get(id+'/'+y);if(!r)throw new Error('Missing frozen record '+id+'/'+y);return r;};
 const base=Object.fromEntries(ids.map(id=>[id,get(id,2005).cumulative]));
 const initialGap=base.USA-base.CHN;
 const difference=y=>get('CHN',y).annual-get('USA',y).annual;
 const closure=years.reduce((s,y)=>s+difference(y),0),remaining=initialGap-closure;
 const gapAt=year=>initialGap-years.reduce((s,y)=>s+difference(y)*clamp(year-y+1),0);
 const gauge={zero:600,k:2.15,y:250,h:66};
 function layout(p){
  const k=mix(mix(36,.9,p.archive),.75,p.gap),w=mix(230,125,p.gap),baseline=500;
  const x={CHN:mix(300,130,p.gap),USA:mix(720,320,p.gap)};
  const nodes={},totals={},tops={},baseTops={};
  ids.forEach(id=>{
   const baseHeight=base[id]*mix(.9,.75,p.gap)*p.archive;
   let amount=baseHeight/k;
   baseTops[id]=baseline-baseHeight;
   nodes[id+'/base']={x:x[id],y:baseTops[id],w,h:baseHeight,opacity:p.archive};
   years.forEach(year=>{const r=get(id,year),weight=clamp(p.year-year+1);nodes[id+'/'+year]={x:x[id],y:baseline-(amount+r.annual*weight)*k,w,h:r.annual*weight*k,opacity:weight};amount+=r.annual*weight;});
   totals[id]=amount;tops[id]=baseline-amount*k;
  });
  const historyGap=gapAt(p.history);
  nodes['gauge/original']={x:gauge.zero,y:gauge.y,w:initialGap*gauge.k,h:gauge.h,opacity:p.gap};
  nodes['gauge/current']={x:gauge.zero,y:gauge.y,w:historyGap*gauge.k,h:gauge.h,opacity:p.gap};
  return{nodes,k,w,x,baseline,baseTops,tops,totals,endYear:Math.min(2022,Math.floor(p.year+1e-8)),currentGap:totals.USA-totals.CHN,historyGap,historyYear:Math.min(2022,Math.floor(p.history+1e-8)),gauge,axisX:1080,tickPixels:mix(72,90,p.archive),axisOpacity:1-p.gap,bracketX:mix(1018,490,p.gap),seamOpacity:mix(.75,.055,p.settle)*(1-p.gap*.75)};
 }
 return{get,base,difference,initialGap,closure,remaining,gapAt,years,gauge,layout};
}
class Motion{
 constructor(initial=poses[0]){this.pose={...initial};this.plan=[];this.active=false;this.target={...initial};this.end=0;}
 sample(now){let pose=this.pose;for(const step of this.plan){if(now<step.start)return{...pose};if(now>=step.start+step.duration){pose=step.to;continue;}const u=clamp((now-step.start)/step.duration),t=step.linear?u:1-(1-u)**3;return blend(step.from,step.to,t);}return{...pose};}
 go(target,now,reduced=false){const from=this.sample(now);this.pose={...from};this.plan=[];this.target={...target};let last=from,cursor=now;
  const add=(to,duration,linear=false)=>{if(same(last,to))return;this.plan.push({from:{...last},to:{...to},start:cursor,duration:reduced?0:duration,linear});cursor+=reduced?0:duration;last=to;};
  if(target.archive===0){if(last.year>2006.001||last.gap>.001)add({...poses[1]},950);add(target,1050);}
  else if(target.year===2006){if(last.gap>.001||last.year>2006.001)add({...poses[1]},1100,true);else add(target,1150);}
  else{
   if(last.archive<.999)add({...poses[1]},900);
   if(last.year<2022-.001)add({...poses[2],settle:0},1700,true);
   if(target.gap===0)add(target,last.gap>.001?950:450);
   else{
    if(last.settle<.999)add({...poses[2]},350);
    if(last.gap<.999)add({...poses[3],history:2005},900);
    add(target,1800,true);
   }
  }
  this.end=cursor;this.active=!reduced&&this.plan.length>0;
  if(reduced||!this.active){this.pose={...target};this.plan=[];}
  return from;
 }
 tick(now){this.pose=this.sample(now);if(now>=this.end){this.active=false;this.pose={...this.target};this.plan=[];}return{...this.pose};}
}
return{createModel,Motion,poses,blend,clamp};
});
