import { distributionExample, createDistribution } from "./model.mjs";
import { at, lerp } from "../../runtime/geometry.mjs";
import { createSvgLayer, svgElement, setSvgAttributes as attr } from "../../runtime/svg.mjs";

export const example={id:"distribution-and-exception",title:"平均变慢，谁在等待",eyebrow:"处理时长 · 三批独立包裹",
  theme:{paper:"#f4f1e9",ink:"#294441",muted:"#526a65",accent:"#a24f34",line:"#c8d3ca"},viewBox:"0 0 1000 680",duration:1500,
  dataBadge:"模拟记录",dataCaption:"每个包裹标记 = 一条记录；三批独立样本，不能逐件配对。",
  states:[{name:"一个久等的包裹"},{name:"放回三批记录"},{name:"比较起点与后来"},{name:"放大久等部分"}],mount:mountDistribution};

// Keep the numerical comparison valid when adapting data; rewrite the story's questions for the new finding.
export function readDistribution(model,i){
  const r=model.readings,first=model.summaries[0],last=model.summaries.at(-1);
  const sameMedian=first.median===last.median,meanRises=Number(r.lastMean)>Number(r.firstMean);
  return {name:example.states[i].name,value:"",unit:"",metric:"",
    title:["这件包裹的等待，<br>能代表其他包裹吗？","一件包裹，<br>还不是整批的经历。",
      meanRises&&sameMedian?"平均变慢了，<br>中间的位置却没变。":"平均与中间位置，<br>变化相同吗？",
      "久等的包裹，<br>各占这一批多少？"][i],
    description:[`${last.name}有一件包裹处理了 ${r.selected} 小时。它能代表这批包裹通常需要多久吗？`,
      `${model.summaries.every(b=>b.count===first.count)?`三批各有 ${first.count} 件包裹`:model.summaries.map(b=>`${b.name} ${b.count} 件`).join("、")}。那件 ${r.selected} 小时的包裹只是其中之一；各批等待的长短，要放在全部记录中看。`,
      `${first.name}到${last.name}，均值从 ${r.firstMean} 变为 ${r.lastMean} 小时。${sameMedian?`两批中位数同为 ${r.firstMedian} 小时。`:`中位数从 ${r.firstMedian} 变为 ${r.lastMedian} 小时。`}均值更容易受久等记录影响。`,
      `${last.name}有 ${r.tail} / ${r.count} 件达到 ${r.threshold} 小时，${first.name}为 ${first.tail} / ${first.count} 件。两边都以各批全部包裹为分母。`][i],
    highlights:i===2?[`${r.firstMean}`,`${r.lastMean} 小时`,`${r.firstMedian}`,`${r.lastMedian} 小时`]:i===3?[`${r.tail} / ${r.count} 件`]:[`${r.selected} 小时`],
  };
}

export function mountDistribution(svg,{data=distributionExample}={}){
  const model=createDistribution(data),states=["case","history","compare","tail"];
  const defs=svgElement("defs"),clip=svgElement("clipPath",{id:"distribution-window"});
  clip.append(svgElement("rect",{x:155,y:30,width:770,height:550}));defs.append(clip);svg.append(defs);
  const under=svgElement("g",{"clip-path":"url(#distribution-window)"});svg.append(under);
  const observed=[Math.min(...model.summaries[0].values),Math.max(...model.summaries[0].values)];
  const range=svgElement("rect",{fill:"#287d7c"});under.append(range);
  const guides=createSvgLayer(under,{create(){return svgElement("path",{fill:"none"});},
    update(el,n){attr(el,{d:n.d,opacity:n.opacity,stroke:n.color,"stroke-width":1.8,"stroke-dasharray":n.dash});}});
  const plot=svgElement("g",{"clip-path":"url(#distribution-window)"});svg.append(plot);
  const nodes=createSvgLayer(plot,{create(n){const row=model.byId.get(n.id),g=svgElement("g",{"data-record":n.id});
    g.append(svgElement("rect",{x:-7,y:-7,width:14,height:14,rx:.7,fill:row.hours>=model.threshold?"#b75e3e":"#287d7c"}),
      svgElement("path",{d:"M-2 -7v4h4v-4M-7 -2H7",stroke:"#fffdf5","stroke-width":.8,fill:"none"}),
      svgElement("title",{},`${model.summaries.find(b=>b.id===row.batch).name} · ${row.hours} 小时`));return g;},
    update(g,n){attr(g,{transform:`translate(${n.x} ${n.y}) scale(${n.radius/7})`,opacity:n.opacity});}});
  const labels=createSvgLayer(svg,{create(){return svgElement("text");},update(el,n){el.textContent=n.text;attr(el,{x:n.x,y:n.y,class:n.role,opacity:n.opacity});}});
  const statisticLabels=createSvgLayer(svg,{create(){return svgElement("text",{class:"statistic"});},
    update(el,n){el.textContent=n.text;attr(el,{x:n.x,y:n.y,opacity:n.opacity,style:`fill:${n.color}`,"data-statistic":n.id});}});
  const axis=svgElement("g");svg.append(axis);
  axis.append(svgElement("path",{d:"M170 585H900",stroke:"#80998c"}),svgElement("text",{x:900,y:665,"text-anchor":"end",class:"caption"},"处理时长 / 小时"));
  const ticks=[];
  for(let value=0;value<=Math.max(model.layout("history").domain[1],model.layout("tail").domain[1]);value+=2){
    const n=svgElement("text",{y:620,"text-anchor":"middle",class:"tick"},value);axis.append(n);ticks.push({value,n});
  }
  const extent=svgElement("text",{x:170,y:70,class:"caption"});extent.textContent=`浅色范围：${model.summaries[0].name} ${observed[0]}—${observed[1]} 小时`;svg.append(extent);
  const thresholdLabel=svgElement("text",{y:570,class:"caption"},`≥ ${model.threshold} 小时`);svg.append(thresholdLabel);
  return {model,pose:i=>model.layout(states[i]),blend:model.blend,
    read:i=>readDistribution(model,i),
    copyReady(i,p){const target=model.layout(states[i]);return [...target.nodes].every(([id,n])=>{const a=p.nodes.get(id);return (!n.opacity&&!a.opacity)||Math.hypot(n.x-a.x,n.y-a.y)<8 && Math.abs(n.opacity-a.opacity)<.07;});},
    render(p){nodes.render(p.nodes);labels.render(p.guides);
      const first=p.rows.get(model.summaries[0].id),last=p.rows.get(model.summaries.at(-1).id),lo=at(p.scale,observed[0]),hi=at(p.scale,observed[1]);
      attr(range,{x:lo,y:first.y-65,width:hi-lo,height:Math.max(0,last.y-first.y+90),opacity:p.means*.09});
      attr(extent,{opacity:p.means});attr(thresholdLabel,{x:at(p.scale,model.threshold)+10,opacity:p.threshold});
      const stats=model.statistics(p),lines=stats.map(s=>({id:s.id,d:`M${s.x} ${s.top}V${s.bottom}`,opacity:s.opacity,
        color:s.kind==="mean"?"#a24f34":"#235b5b",dash:s.kind==="mean"?"4 4":"none"}));
      statisticLabels.render(stats.map(s=>({...s,x:s.x+8,y:s.labelY,color:s.kind==="mean"?"#a24f34":"#235b5b",
        text:`${s.kind==="mean"?"均值":"中位数"} ${s.kind==="mean"?s.value.toFixed(1):s.value}`})));
      model.summaries.forEach(b=>{const row=p.rows.get(b.id),threshold=at(p.scale,model.threshold);
        lines.push({id:"threshold:"+b.id,d:`M${threshold} ${row.y-50}V${row.y+22}`,opacity:p.threshold*row.opacity,color:"#365f5c",dash:"3 5"});});
      guides.render(lines);
      ticks.forEach(({value,n})=>attr(n,{x:at(p.scale,value),opacity:value<p.domain[0]||value>p.domain[1]?0:lerp(Number(value%6===0),1,p.threshold)}));
    },dispose(){nodes.dispose();labels.dispose();statisticLabels.dispose();guides.dispose();defs.remove();under.remove();plot.remove();axis.remove();extent.remove();thresholdLabel.remove();},
  };
}
