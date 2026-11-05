import {clamp,ease,mix} from './layout.mjs';

// Each beat is a complete reading state. Scroll chooses a beat, not an animation frame.
export const beats=[
  {id:'intro',chapter:0,at:0,mode:'intro',phase:0},
  {id:'overview',chapter:1,at:1,mode:'overview',phase:0},
  {id:'overview-gap',chapter:1,at:1.24,mode:'overview',phase:.5},
  ...[2,3,4,5,6].flatMap(chapter=>[
    {id:`${chapter}-locate`,chapter,at:chapter,mode:'locate',phase:0},
    {id:`${chapter}-local`,chapter,at:chapter+.28,mode:'local',phase:0},
    ...(chapter>=4?[{id:`${chapter}-after`,chapter,at:chapter+.54,mode:'local',phase:1}]:[]),
  ]),
  {id:'summary',chapter:7,at:7,mode:'overview',phase:0},
];
export function selectBeat(progress,current=-1,buffer=.025){
  if(current<0)return Math.max(0,beats.findLastIndex(b=>progress>=b.at));
  let index=current;
  while(index<beats.length-1&&progress>=beats[index+1].at+buffer)index++;
  while(index>0&&progress<beats[index].at-buffer)index--;
  return index;
}
const fadeItems=(items,opacity)=>items.map(item=>({...item,opacity:(item.opacity??1)*opacity}));
function blendMap(a,b,t,keys){
  const result=new Map();
  for(const id of new Set([...a.keys(),...b.keys()])){
    const p=a.get(id),q=b.get(id),from=p??{...q,a:0,leader:0},to=q??{...p,a:0,leader:0};
    const entry={...(t<.5?from:to)};
    for(const key of keys)entry[key]=mix(from[key]??0,to[key]??0,t);
    result.set(id,entry);
  }
  return result;
}
export function blendPoses(a,b,t){
  if(t<=0)return a;if(t>=1)return b;
  const p={
    domain:a.domain.map((v,i)=>mix(v,b.domain[i],t)),top:mix(a.top,b.top,t),bottom:mix(a.bottom,b.bottom,t),
    overview:mix(Number(a.overview),Number(b.overview),t),
    states:blendMap(a.states,b.states,t,['x','value','a','r','outline']),
    identities:blendMap(a.identities,b.identities,t,['x','y','a','leader']),
    devices:blendMap(a.devices,b.devices,t,['x','bottom','h','a','rotate']),
  };
  // Identity leaders/points establish the subject before photographs appear.
  for(const [id,device] of p.devices){
    const from=a.devices.get(id),to=b.devices.get(id);
    if(!from)device.a=(to?.a??0)*ease((t-.4)/.6);
    else if(!to)device.a=from.a*(1-ease(t/.6));
  }
  const la=new Map(a.labels.map(l=>[l.key,l])),lb=new Map(b.labels.map(l=>[l.key,l]));
  p.labels=[...new Set([...la.keys(),...lb.keys()])].map(key=>{
    const x=la.get(key),y=lb.get(key),from=x??{...y,opacity:0},to=y??{...x,opacity:0};
    return {...(t<.5?from:to),dx:mix(from.dx??0,to.dx??0,t),dy:mix(from.dy??30,to.dy??30,t),opacity:mix(from.opacity??1,to.opacity??1,t)};
  });
  p.lines=[...fadeItems(a.lines,1-t),...fadeItems(b.lines,t)];
  p.notes=[...fadeItems(a.notes,1-ease(t/.4)),...fadeItems(b.notes,ease((t-.6)/.4))];
  p.brackets=[...fadeItems(a.brackets,1-t),...fadeItems(b.brackets,t)];
  return p;
}

// Latest target wins. Retargeting snapshots the displayed pose; no replay queue and no jump.
export function createTransition(initial,{duration=760,blend=blendPoses}={}){
  let from=initial,to=initial,via=null,start=0,span=0;
  function sample(now){
    const raw=span?clamp((now-start)/span):1;
    const pose=via
      ?raw<.5?blend(from,via,ease(raw*2)):blend(via,to,ease((raw-.5)*2))
      :blend(from,to,ease(raw));
    return {pose,moving:raw<1,progress:raw};
  }
  function target(next,now,{immediate=false,waypoint=null}={}){
    from=sample(now).pose;to=next;via=waypoint;start=now;span=immediate?0:duration;
    if(immediate){from=to;via=null;}
  }
  return {sample,target};
}
