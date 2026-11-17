import { lerp, clamp01 } from "../../runtime/geometry.mjs";
import { svgElement, setSvgAttributes as attr } from "../../runtime/svg.mjs";

export const overlapExample={population:120,first:{label:"愿意参加阅读活动",count:84},second:{label:"愿意参加跑步活动",count:72}};
export function createOverlap({population,first,second}){
  if(!Number.isSafeInteger(population)||population<=0||![first,second].every(n=>Number.isSafeInteger(n)&&n>=0&&n<=population))
    throw new Error("Overlap requires one positive population and two marginal counts within it");
  const minimum=Math.max(0,first+second-population),maximum=Math.min(first,second);
  function arrangement(progress){
    if(!Number.isFinite(progress)||progress<0||progress>1)throw new Error("Arrangement must be between zero and one");
    const start=(population-second)*progress,end=start+second;
    return {start,end,overlap:Math.max(0,Math.min(first,end)-start)};
  }
  return {population,first,second,minimum,maximum,outsideFirst:population-first,arrangement};
}
export function createOverlapScene(config=overlapExample){
  const model=createOverlap({population:config.population,first:config.first.count,second:config.second.count});
  const ids=["counts","minimum"], left=75,width=950;
  function layout(id){if(!ids.includes(id))throw new Error("Unknown overlap state: "+id);return {shift:model.arrangement(id==="minimum"?1:0).start,reveal:Number(id==="minimum")};}
  const blend=(a,b,t)=>({shift:lerp(a.shift,b.shift,clamp01(t)),reveal:lerp(a.reveal,b.reveal,clamp01(t))});
  function geometry(p){const scale=width/model.population,aEnd=left+model.first*scale,bStart=left+p.shift*scale,bEnd=bStart+model.second*scale;
    return {left,width,scale,aEnd,bStart,bEnd,overlapWidth:Math.max(0,Math.min(aEnd,bEnd)-bStart)};}
  return {model,ids,layout,blend,geometry};
}
export const example={id:"overlap-bound",title:"只有总数，至少重合多少",eyebrow:"模拟调查 · 两项意向，同一个总体",
  theme:{paper:"#f4f0e6",ink:"#303b3c",muted:"#5b6869",accent:"#7d573e",line:"#d1cfc2"},viewBox:"0 0 1100 480",duration:1700,
  dataBadge:"模拟汇总",dataCaption:"假设排布解释下界；条带位置不对应具体居民。",
  states:[{name:"各自人数"},{name:"尽量错开"}],mount:mountOverlap};
export function mountOverlap(svg,{data=overlapExample}={}){
  const scene=createOverlapScene(data),m=scene.model,determined=m.minimum===m.maximum,root=svgElement("g");svg.append(root);
  function el(tag,attrs,text){const n=svgElement(tag,attrs,text);root.append(n);return n;}
  const text=(x,y,value,role="label",anchor="start")=>el("text",{x,y,class:role,"text-anchor":anchor},value);
  text(75,34,`同一批 ${m.population} 位居民 · 每项人数内部不重复计人`,"scope");
  el("path",{d:"M75 57v12h950V57",stroke:"#7e8984",fill:"none"});
  const note=text(75,105,"两项分别计数；上下位置不表示成员对应。","note");
  el("rect",{x:75,y:165,width:950,height:45,fill:"#e0dfd5"});el("rect",{x:75,y:305,width:950,height:45,fill:"#e0dfd5"});
  const band=el("rect",{y:210,height:95,fill:"#c1aa77",opacity:0}),edges=el("path",{fill:"none",stroke:"#8b6d37","stroke-dasharray":"5 5"});
  const first=el("rect",{x:75,y:165,height:45,fill:"#426d78"}),second=el("rect",{y:305,height:45,fill:"#966044"});
  text(75,150,data.first.label);const secondName=text(75,290,data.second.label);
  const firstCount=text(0,195,String(m.first),"inbar","end"),secondCount=text(0,335,String(m.second),"inbar","end");
  const spare=text(0,150,`其余 ${m.outsideFirst} 人`,"note","middle");
  const bracket=el("path",{fill:"none",stroke:"#8b6d37","stroke-width":2});
  const conclusion=text(550,424,"","result","middle");
  return {model:m,pose:i=>scene.layout(scene.ids[i]),blend:scene.blend,
    read(i){return {name:example.states[i].name,value:"",unit:"",metric:"",
      title:i?(determined?"这两个总数，<br>已经确定了交集人数。":m.minimum?"尽量分开，<br>还是有一段重合。":"两组可以错开，<br>但不等于没有交集。") : "两项意向，<br>能来自两批不同的人吗？",
      description:i?`同一批人里，${m.first} 人${data.first.label}，其余只有 ${m.outsideFirst} 人。${determined?`结合 ${m.second} 人${data.second.label}，交集只能是 ${m.minimum} 人。`:m.minimum?`${m.second} 人${data.second.label}，因此至少有 ${m.minimum} 人两项都愿意参加。`:"现有数量允许两组完全错开，也允许有人同时符合。"}${determined?"":"实际重合多少，还需要联合记录。"}`
        : `在同一批 ${m.population} 人中，${m.first} 人${data.first.label}，${m.second} 人${data.second.label}。现在只知道这两个总数，没有逐人的配对记录。`,
      highlights:i?[`至少有 ${m.minimum} 人`,`${m.outsideFirst} 人`]:[`${m.first} 人`,`${m.second} 人`],};},
    copyReady(i,p){return Math.abs(p.reveal-i)<.06;},
    render(p){const g=scene.geometry(p),ready=p.reveal>.999;
      attr(first,{width:m.first*g.scale});attr(second,{x:g.bStart,width:m.second*g.scale});
      attr(firstCount,{x:g.aEnd-12,opacity:Number(m.first>0)});attr(secondCount,{x:g.bEnd-12,opacity:Number(m.second>0)});
      attr(secondName,{x:g.bStart});attr(spare,{x:(g.aEnd+1025)/2,opacity:Number(m.outsideFirst>0)});
      attr(band,{x:g.bStart,width:g.overlapWidth,opacity:.17*p.reveal});
      attr(edges,{d:`M${g.bStart} 210V305M${Math.min(g.aEnd,g.bEnd)} 210V305`,opacity:p.reveal});
      attr(bracket,{d:`M${g.bStart} 365v12h${g.overlapWidth}v-12`,opacity:ready&&m.minimum>0?1:0});
      note.textContent=p.reveal>.001?"假设把两组尽量错开：长度不变，总体边界不变。":"两项分别计数；上下位置不表示成员对应。";
      conclusion.textContent=ready?(determined?`这组数据的交集人数已确定：${m.minimum} 人。`:m.minimum?`至少 ${m.minimum} 人两项都愿意参加；实际交集未知。`:"最低可以是 0；不代表实际无人同时参加。") : "";
    },dispose(){root.remove();},
  };
}
