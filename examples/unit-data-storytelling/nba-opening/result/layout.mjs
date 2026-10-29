import {makeModel, POSITIONS, POSITION_NAMES} from './data-model.mjs';
import {LOGO} from './logo-points.mjs';

export const PALETTE={early:'#a7cbd0',late:'#dfb77a',ink:'#f1ecdf',quiet:'#afbdc3',muted:'#879ba5',rule:'#3a4b54'};
export const hash=text=>{let h=2166136261;for(const ch of text){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
export const clamp=t=>Math.max(0,Math.min(1,t));
export const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
export const lerp=(a,b,t)=>a+(b-a)*t;

export function makeOpeningModel(data){
  const model=makeModel(data);
  const groups=new Map();const records=new Map();
  for(const decade of [1960,2000])for(const pos of POSITIONS){
    const rows=model.decade(decade,pos).filter(p=>p.h!==null);
    const list=rows.map(p=>({...p,key:`${p.id}/${pos}/${decade}`,position:pos,decade}));
    groups.set(`${decade}/${pos}`,{rows:list,stats:model.stats(rows),name:POSITION_NAMES[pos]});
    for(const r of list)records.set(r.key,r);
  }
  const first=[...records.values()].filter(r=>r.decade===1960).sort((a,b)=>hash(a.key)-hash(b.key)||a.key.localeCompare(b.key));
  if(first.length!==LOGO.figure.length)throw new Error('人物单元数与矢量采样不符，需要重新采样。');
  return {groups,records,first,positions:POSITIONS};
}

export function geometry(width,height){
  const left=width*.385,right=width*.94,top=145,bottom=height-128;
  return {width,height,left,right,top,bottom,rowH:(bottom-top)/5,x:cm=>left+(cm-158)/76*(right-left)};
}

export function logoGeometry(width,height){
  const heightLogo=Math.min(height*.70,690),widthLogo=heightLogo*LOGO.aspect;
  return {x:width*.765-widthLogo/2,y:height*.52-heightLogo/2,w:widthLogo,h:heightLogo,r:LOGO.step*heightLogo*.37};
}

export function layout(model,state,width,height){
  const g=geometry(width,height);const nodes=new Map();const frame=logoGeometry(width,height);
  if(state===0){
    model.first.forEach((r,i)=>{const [u,v]=LOGO.figure[i];nodes.set(r.key,{key:r.key,x:frame.x+u*frame.w,y:frame.y+v*frame.h,r:frame.r,opacity:1,color:PALETTE.ink});});
    return {nodes,decoration:1,axis:0,comparison:0,g};
  }
  const comparison=state===2;
  const binWidth=g.x(202.54)-g.x(200);
  const cols=comparison?Math.max(3,Math.floor((binWidth-2)/2.65)):4;
  let maximumRows=0;
  for(const pos of model.positions){
    const counts=new Map();
    for(const r of model.groups.get(`2000/${pos}`).rows)counts.set(r.h,(counts.get(r.h)||0)+1);
    maximumRows=Math.max(maximumRows,Math.ceil(Math.max(...counts.values())/cols));
  }
  // One common dot size across positions. Dense rows determine the shared pitch.
  const pitch=comparison?Math.min(3.2,(binWidth-2)/cols,(g.rowH*.43-6)/maximumRows):5.2;
  const radius=comparison?pitch*.43:2.2;
  for(const [i,pos] of model.positions.entries()){
    const a=model.groups.get(`1960/${pos}`).rows,b=model.groups.get(`2000/${pos}`).rows;
    const center=g.top+g.rowH*(i+.5);
    const put=(rows,decade)=>{
      const bins=new Map();for(const r of rows){const n=bins.get(r.h)||0;bins.set(r.h,n+1);
        const row=Math.floor(n/cols),col=n%cols;
        const y=comparison?center+(decade===1960?-1:1)*(6+row*pitch):center+14-row*pitch;
        nodes.set(r.key,{key:r.key,x:g.x(r.h*2.54)+(col-(cols-1)/2)*pitch,y,r:radius,opacity:1,color:decade===1960?PALETTE.early:PALETTE.late});
      }
    };
    put(a,1960);if(comparison)put(b,2000);
  }
  return {nodes,decoration:0,axis:1,comparison:comparison?1:0,g};
}

function rgb(hex){return hex.match(/[\da-f]{2}/gi).map(n=>parseInt(n,16));}
function mixColor(a,b,t){const aa=rgb(a),bb=rgb(b);return '#'+aa.map((v,i)=>Math.round(lerp(v,bb[i],t)).toString(16).padStart(2,'0')).join('');}
function curve(a,b,t,id,amount){
  const seed=(hash(id)%1000)/1000;
  const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1;
  const arc=Math.sin(Math.PI*t)*amount*(.45+seed*.7);
  const eddy=Math.sin(Math.PI*t)**2*Math.sin(t*Math.PI*2+seed*Math.PI*2)*amount*.16;
  return {x:lerp(a.x,b.x,t)-dy/d*arc+eddy,y:lerp(a.y,b.y,t)+dx/d*arc};
}

// Geometry is sampled from the current visible pose on interruption. No old
// identity is assigned to a new record; entrance/exit instances remain separate.
export function blend(from,to,progress,{opening=false}={}){
  if(progress<=0)return from;if(progress>=1)return to;
  const nodes=new Map();const keys=new Set([...from.nodes.keys(),...to.nodes.keys()]);
  for(const key of keys){
    const a=from.nodes.get(key),b=to.nodes.get(key);
    const delay=opening?(hash(key)%101)/100*.13:0;
    const t=smooth((progress-delay)/(1-delay));
    const start=a??{...b,x:b.x-10,y:b.y+22,opacity:0};
    const end=b??{...a,y:a.y+24,opacity:0};
    const p=opening?curve(start,end,t,key,72):{x:lerp(start.x,end.x,t),y:lerp(start.y,end.y,t)};
    nodes.set(key,{key,...p,r:lerp(start.r,end.r,t),opacity:lerp(start.opacity,end.opacity,t),color:mixColor(start.color,end.color,t)});
  }
  return {nodes,decoration:lerp(from.decoration,to.decoration,smooth(progress*1.65)),axis:lerp(from.axis,to.axis,smooth(progress)),comparison:lerp(from.comparison,to.comparison,smooth(progress)),g:to.g};
}
