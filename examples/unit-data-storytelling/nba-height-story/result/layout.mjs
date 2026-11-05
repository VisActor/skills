import {POSITIONS,COLORS,NAMES} from './scenes.mjs';
import {logoLayout,identityHash} from './cover.mjs';

export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const mix=(a,b,t)=>a+(b-a)*t;
export const ease=t=>{t=clamp(t);return t*t*(3-2*t);};
export const keyFor=(id,pos)=>`${id}:${pos}`;
export const OVERVIEW_DOMAIN=[155,235];
export const FRONTCOURT_DOMAIN=[190,235];
export const domainFor=scene=>scene.positions.length===2&&scene.positions.every(p=>p==='PF'||p==='C')?FRONTCOURT_DOMAIN:OVERVIEW_DOMAIN;
export const margins=w=>({left:(w<1000?26:42)+clamp(w*.24,205,310)+80,right:w<1000?65:82});
export const scaleFor=(w,domain=OVERVIEW_DOMAIN)=>{
  const m=margins(w),k=(w-m.left-m.right)/(domain[1]-domain[0]);
  return {k,b:m.left-domain[0]*k};
};
export const xForCm=(cm,scale)=>cm*scale.k+scale.b;
export const heightX=(height,w,domain=OVERVIEW_DOMAIN)=>xForCm(height*2.54,scaleFor(w,domain));

const scaleCache=new WeakMap();

export function buildLayout(data,scene,width,height){
  if(scene.cover)return logoLayout(buildLayout(data,{...scene,cover:false},width,height));
  if(scene.comparison){
    const current=buildLayout(data,{...scene,comparison:null,paired:'current'},width,height);
    const prior=buildLayout(data,{...scene,window:scene.comparison,comparison:null,paired:'reference'},width,height);
    const nodes=new Map(current.nodes);
    for(const [key,node] of prior.nodes)nodes.set(`comparison:${scene.comparison}:${key}`,node);
    return {...current,nodes,lanes:[...prior.lanes,...current.lanes],scene};
  }
  const window=data.windows[scene.window];
  if(!window)throw new Error('Unknown data window: '+scene.window);
  if(scene.mode==='minutes'&&window.kind!=='season')throw new Error('Minutes mode requires one season');
  const top=scene.explore?260:178, bottom=height-78;
  const domain=domainFor(scene),m=margins(width);
  const plotLeft=m.left,plotRight=width-m.right;
  const k=(plotRight-plotLeft)/(domain[1]-domain[0]),scale={k,b:plotLeft-domain[0]*k};
  const detail=domain===FRONTCOURT_DOMAIN?1:0;
  const laneHeight=(bottom-top)/(scene.positions.length*(scene.paired?2:1));
  const laneYs=new Map(scene.positions.map((p,i)=>[p,top+laneHeight*((scene.paired?i*2+(scene.paired==='current'?1:0):i)+.77)]));
  const nodes=new Map(),lanes=[];
  const binWidth=scale.k*2.54;
  const totalMinutes=window.rows.reduce((sum,r)=>sum+(r.mp??0),0);
  const annual=window.kind==='season';
  const areaBudget=29000;
  const pack=(rows,scale,minutes=totalMinutes)=>{
    const base=(annual?2.6:2.3)*scale;
    const points=[];let shelf=[],used=0,y=0,maxRadius=0;
    const flush=()=>{
      if(!shelf.length)return;
      const offset=-used/2;
      for(const point of shelf)points.push({...point,x:point.x+offset,y:y+maxRadius});
      y+=maxRadius*2+1.2*scale;shelf=[];used=0;maxRadius=0;
    };
    for(const row of [...rows].sort((a,b)=>a.id.localeCompare(b.id))){
      const minuteR=annual?Math.sqrt(row.mp/minutes*areaBudget/Math.PI)*scale:base;
      const slot=Math.max(base,minuteR),gap=1.2*scale;
      if(used+slot*2>binWidth-3&&shelf.length)flush();
      shelf.push({row,x:used+slot,countR:base,minuteR});used+=slot*2+gap;maxRadius=Math.max(maxRadius,slot);
    }
    flush();return {points,height:y};
  };
  // A view uses one size calibration across all its time windows. Otherwise a
  // sparse season would inflate every dot, falsely suggesting more playing time.
  if(!scaleCache.has(data))scaleCache.set(data,new Map());
  const cache=scaleCache.get(data),cacheKey=[width,height,window.kind,...scene.positions,...domain,top,plotLeft,Boolean(scene.paired)].join(':');
  let size=cache.get(cacheKey);
  if(size===undefined){
    size=1;
    for(const candidate of Object.values(data.windows).filter(w=>w.kind===window.kind)){
      const bins=new Map(),minutes=candidate.rows.reduce((sum,r)=>sum+(r.mp??0),0);
      for(const row of candidate.rows.filter(r=>r.h!==null))for(const pos of scene.positions.filter(p=>row.pos.includes(p))){
        const key=pos+':'+row.h;if(!bins.has(key))bins.set(key,[]);bins.get(key).push(row);
      }
      while([...bins.values()].some(rows=>pack(rows,size,minutes).height>laneHeight-34)&&size>.15)size*=.94;
    }
    cache.set(cacheKey,size);
  }
  for(const pos of scene.positions){
    const members=window.rows.filter(r=>r.pos.includes(pos)&&r.h!==null);
    const bins=new Map();
    for(const row of members){if(!bins.has(row.h))bins.set(row.h,[]);bins.get(row.h).push(row);}
    // Counts reserve the same slots as weighted circles. Scaling is global so
    // area ratios stay comparable across positions, including multiple copies.
    for(const [h,rows] of bins){
      for(const point of pack(rows,size).points){
        const {row}=point;
        const radius=scene.mode==='minutes'?point.minuteR:point.countR;
        const selected=scene.honors&&(row.star||row.mvp);
        nodes.set(keyFor(row.id,pos),{
          id:row.id,pos,h:row.h,window:scene.window,x:xForCm(h*2.54,scale)+point.x,
          y:laneYs.get(pos)-point.y,r:radius,a:scene.honors?(selected?1:.27):.85,
          color:selected||scene.heroes?.some(([id,p])=>id===row.id&&p===pos)||(scene.shade&&(pos==='C'||scene.shade==='both')&&row.h<=81)?'#f5d58b':COLORS[pos],star:Boolean(row.star),mvp:Boolean(row.mvp),row,
        });
      }
    }
    const stats=window.stats[pos],weighted=scene.mode==='minutes';
    const reference=scene.reference?data.windows[scene.reference]:null;
    const mean=weighted?stats.weighted:stats.mean;
    const referenceMean=reference?(weighted?reference.stats[pos].weighted:reference.stats[pos].mean):null;
    lanes.push({key:scene.paired==='reference'?'comparison:'+pos:pos,pos,window:scene.window,period:scene.paired?window.label:null,name:NAMES[pos],color:COLORS[pos],y:laneYs.get(pos),top:laneYs.get(pos)-laneHeight+.18*laneHeight,
      mean,meanX:xForCm(mean,scale),referenceMean,referenceX:referenceMean?xForCm(referenceMean,scale):null,
      referenceLabel:reference?.label,n:members.length,stars:stats.stars,starMean:stats.starMean,plainMean:stats.mean,weighted,
      opacity:1,referenceOpacity:reference?1:0,honorOpacity:scene.honors?1:0,shadeOpacity:scene.shade&&(pos==='C'||scene.shade==='both')?1:0,
      smallShare:weighted?stats.smallMinutes:stats.small});
  }
  return {nodes,lanes,top,bottom,width,height,domain,scale,detail,plotLeft,plotRight,coverAmount:scene.cover?1:0,window:scene.window,mode:scene.mode,scene};
}

function colorMix(a,b,t){
  const parse=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));
  const x=parse(a),y=parse(b);
  return '#'+x.map((v,i)=>Math.round(mix(v,y[i],t)).toString(16).padStart(2,'0')).join('');
}

export function blendLayouts(a,b,t){
  if(t<=0)return a;if(t>=1)return b;
  const scale={k:mix(a.scale.k,b.scale.k,t),b:mix(a.scale.b,b.scale.b,t)};
  const nodes=new Map();
  for(const key of new Set([...a.nodes.keys(),...b.nodes.keys()])){
    const old=a.nodes.get(key),next=b.nodes.get(key);
    const from=old??{...next,a:0},to=next??{...old,a:0};
    const dxFrom=from.x-xForCm(from.h*2.54,old?a.scale:b.scale);
    const dxTo=to.x-xForCm(to.h*2.54,next?b.scale:a.scale);
    // A small, identity-stable arc releases the emblem. It vanishes at both
    // endpoints; ordinary data-to-data transitions keep their exact mapping.
    const release=Math.abs(a.coverAmount-b.coverAmount)*Math.sin(Math.PI*t);
    const angle=identityHash(key)/4294967296*Math.PI*2;
    nodes.set(key,{...(t<.5?from:to),x:xForCm(from.h*2.54,scale)+mix(dxFrom,dxTo,t)+Math.cos(angle)*46*release,y:mix(from.y,to.y,t)+Math.sin(angle)*34*release,
      r:mix(from.r,to.r,t),a:mix(from.a,to.a,t),color:colorMix(from.color,to.color,t)});
  }
  // Interpolate the affine height mapping, so every fixed cm tick and every
  // retained height anchor follow exactly the same transform throughout zoom.
  const lanes=[];
  for(const key of new Set([...a.lanes.map(l=>l.key),...b.lanes.map(l=>l.key)])){
    const old=a.lanes.find(l=>l.key===key),next=b.lanes.find(l=>l.key===key);
    const from=old??{...next,opacity:0},to=next??{...old,opacity:0};
    const lane={...(t<.5?from:to)};
    for(const name of ['y','top','mean','plainMean','opacity','referenceOpacity','honorOpacity','shadeOpacity','smallShare'])lane[name]=mix(from[name],to[name],t);
    for(const name of ['referenceMean','starMean'])lane[name]=from[name]===null?to[name]:to[name]===null?from[name]:mix(from[name],to[name],t);
    lane.meanX=xForCm(lane.mean,scale);
    lane.referenceX=lane.referenceMean===null?null:xForCm(lane.referenceMean,scale);
    lanes.push(lane);
  }
  const plotLeft=mix(a.plotLeft,b.plotLeft,t),plotRight=mix(a.plotRight,b.plotRight,t);
  return {...b,nodes,lanes,scale,plotLeft,plotRight,domain:[(plotLeft-scale.b)/scale.k,(plotRight-scale.b)/scale.k],
    coverAmount:mix(a.coverAmount,b.coverAmount,t),detail:mix(a.detail,b.detail,t),top:mix(a.top,b.top,t),bottom:mix(a.bottom,b.bottom,t)};
}

export function createTransition(initial,duration=900){
  let from=initial,to=initial,start=0,span=0;
  const sample=now=>{
    const fraction=span?clamp((now-start)/span):1;
    return {layout:blendLayouts(from,to,ease(fraction)),moving:fraction<1};
  };
  return {sample,target(next,now,immediate=false){from=sample(now).layout;to=next;start=now;span=immediate?0:(from.coverAmount>0||to.coverAmount>0?1600:duration);}};
}

export function chooseScene(progress,current,count,buffer=.07){
  let index=current;
  while(index<count-1&&progress>=index+1+buffer)index++;
  while(index>0&&progress<index-buffer)index--;
  return index;
}
