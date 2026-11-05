(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./local-model.js'));else root.FullModel=factory(root.StudyModel);})(typeof window==='undefined'?globalThis:window,function(Local){
'use strict';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t;
const fields=['seq','focus','local','archive','year','gap','history','settle','reunion','families','turn','time','cutoff'];
const initial={seq:1,focus:0,local:0,archive:0,year:2006,gap:0,history:2005,settle:0,reunion:0,families:0,turn:0,time:0,cutoff:1994};
const poses=[initial,{...initial,seq:0,focus:1},{...initial,seq:0,local:1},{...initial,seq:0,local:1,archive:1},{...initial,seq:0,local:1,archive:1,year:2022,settle:1},{...initial,seq:0,local:1,archive:1,year:2022,settle:1,gap:1,history:2022},{...initial,seq:0,local:1,archive:1,year:2022,settle:1,gap:1,history:2022,reunion:1,families:1},{...initial,seq:0,local:1,archive:1,year:2022,settle:1,gap:1,history:2022,reunion:1,turn:1,time:1}];
const blend=(a,b,t)=>Object.fromEntries(fields.map(k=>[k,mix(a[k],b[k],t)]));
const same=(a,b)=>fields.every(k=>Math.abs(a[k]-b[k])<1e-8);
function createModel(data){
 const local=Local.createModel(data),world=new Map(data.world.map(r=>[r.year,r]));
 const w=y=>{if(!world.has(y))throw new Error('Missing World year '+y);return world.get(y);};
 const total=w(2022).cumulative,base1849=w(1850).cumulative-w(1850).annual;
 const annualRest=w(2006).annual-local.get('CHN',2006).annual-local.get('USA',2006).annual;
 const cumulative={CHN:local.get('CHN',2022).cumulative,USA:local.get('USA',2022).cumulative};
 const cumulativeRest=total-cumulative.CHN-cumulative.USA;
 function split(cutoff){if(!Number.isInteger(cutoff)||cutoff<1850||cutoff>2023)throw new Error('Time boundary must be an integer from 1850 through 2023');const before=cutoff===1850?base1849:cutoff===2023?total:w(cutoff-1).cumulative;const since=total-before;return{cutoff,before,since,total,beforeShare:before/total,sinceShare:since/total,years:Math.max(0,2023-cutoff)};}
 function visualSplit(cutoff){const lo=Math.max(1850,Math.min(2023,Math.floor(cutoff))),hi=Math.min(2023,lo+1),u=cutoff-lo,a=split(lo),b=split(hi);return{...split(Math.max(1850,Math.min(2023,Math.round(cutoff)))),before:mix(a.before,b.before,u),since:mix(a.since,b.since,u),beforeShare:mix(a.beforeShare,b.beforeShare,u),sinceShare:mix(a.sinceShare,b.sinceShare,u)};}
 function rectBlend(a,b,t){return{x:mix(a.x,b.x,t),y:mix(a.y,b.y,t),w:mix(a.w,b.w,t),h:mix(a.h,b.h,t),opacity:mix(a.opacity??1,b.opacity??1,t)};}
 function layout(p){
  const L=local.layout(p),nodes={},f=clamp(p.focus+p.local),fK=mix(9,10,f),selectedX=100+(2006-1850)*6;
  const selectionK=mix(fK,L.k,p.local);
  const focusRect={x:mix(selectedX,480,f),y:500-w(2006).annual*selectionK,w:mix(4.4,240,f),h:w(2006).annual*selectionK};
  data.world.forEach(r=>{nodes['World/'+r.year]=r.year===2006?{...focusRect,opacity:clamp(p.seq+p.focus)*clamp(1-p.local*4),fillOpacity:p.seq,strokeOpacity:p.focus}:{x:100+(r.year-1850)*6,y:500-r.annual*fK,w:4.4,h:r.annual*fK,opacity:p.seq,fillOpacity:1,strokeOpacity:0};});
  const stackX=480,stackW=240,stackK=.225,liveK=mix(L.k,stackK,p.reunion),worldFit=clamp((500-total*liveK)/(500-total*stackK)),worldK=worldFit>0?liveK:stackK,helperK=p.reunion>.001?liveK:stackK,cnH=cumulative.CHN*stackK,usH=cumulative.USA*stackK;
  for(const id of ['CHN','USA']){
   const baseline=id==='CHN'?500:500-cnH;
   const baseH=local.base[id]*stackK;
   let amount=local.base[id];
   const baseTarget={x:stackX,y:baseline-baseH,w:stackW,h:baseH,opacity:0};
   nodes[id+'/base']=rectBlend({...L.nodes[id+'/base'],opacity:p.local*L.nodes[id+'/base'].opacity},baseTarget,p.reunion);
   local.years.forEach(y=>{const r=local.get(id,y);const countryTarget={x:stackX,y:baseline-(amount+r.annual)*stackK,w:stackW,h:r.annual*stackK,opacity:0};let start=L.nodes[id+'/'+y];if(y===2006){const focusBaseline=id==='CHN'?500:500-local.get('CHN',2006).annual*fK;start=rectBlend({x:focusRect.x,y:focusBaseline-r.annual*fK,w:focusRect.w,h:r.annual*fK,opacity:p.focus},start,p.local);start.opacity=clamp(p.focus+p.local);}else start={...start,opacity:start.opacity*p.local};nodes[id+'/'+y]=rectBlend(start,countryTarget,p.reunion);amount+=r.annual;});
   nodes[id+'/total']={x:mix(L.x[id],stackX,p.reunion),y:500-cumulative[id]*helperK-(id==='USA'?p.reunion*cumulative.CHN*helperK:0),w:mix(L.w,stackW,p.reunion),h:cumulative[id]*helperK,opacity:p.reunion*p.families};
  }
  nodes['World/rest-annual-2006']={x:focusRect.x,y:focusRect.y,w:focusRect.w,h:annualRest*selectionK,opacity:p.focus*clamp(1-p.local*4)};
  nodes['World/rest-cumulative-2022']={x:mix(880,stackX,worldFit),y:500-total*worldK,w:stackW,h:cumulativeRest*worldK,opacity:p.reunion*p.families*worldFit};
  nodes['World/total']={x:mix(480,150,p.turn),y:mix(500-total*worldK,265,p.turn),w:mix(240,900,p.turn),h:mix(total*worldK,100,p.turn),opacity:p.reunion*worldFit,fillOpacity:1-p.families-p.time*(1-p.families)};
  const S=visualSplit(p.cutoff),outer=nodes['World/total'];
  const early={x:outer.x,y:outer.y,w:mix(outer.w,900*S.beforeShare,p.turn),h:mix(outer.h*S.beforeShare,100,p.turn),opacity:p.reunion*p.time};
  const late={x:mix(outer.x,150+900*S.beforeShare,p.turn),y:mix(outer.y+outer.h*S.beforeShare,265,p.turn),w:mix(outer.w,900*S.sinceShare,p.turn),h:mix(outer.h*S.sinceShare,100,p.turn),opacity:p.reunion*p.time};
  nodes['World/time-before']=early;nodes['World/time-since']=late;
  for(const key of ['gauge/original','gauge/current'])nodes[key]={...L.nodes[key],opacity:L.nodes[key].opacity*p.local*Math.pow(1-p.reunion,3)};
  const kAxis=mix(mix(fK,L.k,p.local),stackK,p.reunion),tickPixels=mix(mix(mix(90,100,f),L.tickPixels,p.local),112.5,p.reunion),axisX=mix(80,1080,f);
  const axisOpacity=clamp(p.seq+p.focus+p.local*(1-p.gap)*(1-p.reunion)+p.reunion*clamp(1-p.turn*4));
  return{nodes,local:L,split:S,focusRect,fK,kAxis,tickPixels,axisX,axisOpacity,total,cumulative,annualRest,cumulativeRest,stackK,seamOpacity:L.seamOpacity*(1-p.reunion),seqLabels:p.seq,focusLabels:p.focus*clamp(1-p.local*4),localLabels:clamp((p.local-.65)/.35)*Math.pow(1-p.reunion,3),familyLabels:p.families*clamp((p.reunion-.98)/.02)*(1-p.turn),timeLabels:p.time*clamp((p.turn-.95)/.05),totalLabel:clamp((p.reunion-.98)/.02),gaugeLabels:clamp((p.gap-.95)/.05)*Math.pow(1-p.reunion,4)};
 }
 return{local,w,world,total,base1849,annualRest,cumulative,cumulativeRest,split,layout};
}
class Motion{
 constructor(){this.stage=0;this.pose={...poses[0]};this.plan=[];this.active=false;this.target={...poses[0]};this.end=0;}
 sample(now){let p=this.pose;for(const s of this.plan){if(now<s.start)return{...p};if(now>=s.start+s.duration){p=s.to;continue;}let u=clamp((now-s.start)/s.duration),t=s.linear?u:1-(1-u)**3;return blend(s.from,s.to,t);}return{...p};}
 go(stage,target,now,reduced=false){const jumpScale=Math.abs(stage-this.stage)>1?.5:1;this.stage=stage;let from=this.sample(now);this.pose={...from};this.plan=[];this.target={...target};let last=from,cursor=now;const add=(to,duration,linear=false)=>{if(same(last,to))return;const ms=reduced?0:duration*jumpScale;this.plan.push({from:{...last},to:{...to},start:cursor,duration:ms,linear});cursor+=ms;last=to;};
 const prepare2022=()=>{if(last.local<.999||last.archive<.999){add({...poses[3]},850);}if(last.year<2022-.001)add({...poses[4],settle:0},1550,true);if(last.settle<.999||last.reunion>.001||last.turn>.001)add({...poses[4]},400);};
 if(stage<=5&&last.turn>.001){add({...poses[7],time:0,cutoff:last.cutoff},350);add({...poses[6],families:0},700);}
 if(stage<=2){if(last.year>2006+.001&&last.archive>.001)add({...poses[3]},850);add(target,1200);}
 else if(stage===3)add(target,1150);
 else if(stage===4){prepare2022();add(target,950);}
 else if(stage===5){if(from.reunion>.001){add(target,1250);}else{prepare2022();if(last.gap<.999)add({...target,history:2005},900);add(target,1700,true);}}
 else if(stage===6){if(last.turn>.001){add({...poses[7],time:0,cutoff:last.cutoff},350);add({...target,families:0},850);add(target,450);}else{prepare2022();add(target,1400);}}
 else if(stage===7){if(last.reunion<.999){prepare2022();add({...poses[6]},1250);}if(last.turn<.999||last.families>.001){add({...poses[6],families:0},400);add({...target,time:0},850);add(target,450);}else add(target,300);}
 this.end=cursor;this.active=!reduced&&this.plan.length>0;if(!this.active){this.pose={...target};this.plan=[];}return from;
 }
 tick(now){this.pose=this.sample(now);if(now>=this.end){this.active=false;this.pose={...this.target};this.plan=[];}return{...this.pose};}
}
return{createModel,Motion,poses,blend,clamp};
});
