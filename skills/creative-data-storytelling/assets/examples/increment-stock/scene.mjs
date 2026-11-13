import { accumulationSegments, at, clamp01, keyed, lerp, linearScale } from '../../runtime/geometry.mjs';
import { blendWithAnnotations } from '../../runtime/motion.mjs';
import { createStage } from '../../runtime/stage.mjs';
import { reserveStageExit } from '../../runtime/scroll.mjs';
import { createSvgLayer, setSvgAttributes, svgElement } from '../../runtime/svg.mjs';

// Annual bars retain id, amount and year position when they become cumulative rises.
// assembly: zoom to a shared stock scale, introduce the old endpoints, lift each year's bars.
// The data model covers positive additions only. Reconsider net flows and longer series.
export const stockExample = {
  baseYear:2021,unit:'份',archives:[
    {id:'east',name:'东岸',color:'#e7af69',base:1200,additions:[{id:'east-2022',year:2022,amount:180},{id:'east-2023',year:2023,amount:240},{id:'east-2024',year:2024,amount:300}]},
    {id:'west',name:'西岸',color:'#8ebcb7',base:2200,additions:[{id:'west-2022',year:2022,amount:90},{id:'west-2023',year:2023,amount:110},{id:'west-2024',year:2024,amount:100}]},
  ],
  stops:[{id:'annual',assembly:0,focus:0},{id:'latest',assembly:0,focus:1},{id:'accumulate',assembly:1,focus:0},{id:'compare',assembly:1,focus:0,gap:true}],
};
const plot={top:105,bottom:575,left:85,right:850};
const format=n=>new Intl.NumberFormat('zh-CN',{maximumFractionDigits:1}).format(n);
const niceMax=n=>{const p=10**Math.floor(Math.log10(n||1));return Math.ceil((n||1)*1.16/p)*p;};

export function createStockModel(config=stockExample) {
  keyed(config.archives);keyed(config.stops);
  if(config.archives.length!==2 || !Number.isFinite(config.baseYear)) throw new Error('Paired comparison needs two archives and a finite base year');
  let years;
  const archives=config.archives.map(archive=>{
    const computed=accumulationSegments(archive.base,archive.additions);
    if(!archive.additions.length || archive.additions.some((row,i,all)=>!Number.isFinite(row.year)||row.year<=config.baseYear||(i&&row.year<=all[i-1].year))) throw new Error('Additions need increasing years after the base year');
    const current=archive.additions.map(row=>row.year);
    if(years&&JSON.stringify(years)!==JSON.stringify(current)) throw new Error('Stock periods must align');
    years=current;return {...archive,...computed};
  });
  const stops=new Map(config.stops.map(stop=>{
    if(![0,1].includes(stop.assembly)||![0,1].includes(stop.focus)) throw new Error('Stock stops need an annual or completed assembly state');
    return [stop.id,stop];
  }));
  const annualMax=niceMax(Math.max(...archives.flatMap(row=>row.additions.map(p=>p.amount))));
  const max=niceMax(Math.max(...archives.map(row=>row.total)));
  return {...config,archives,years,stops,max,annualMax,x:linearScale([config.baseYear,years.at(-1)],[180,790]),amount:n=>`${format(n)} ${config.unit}`};
}
export function stockTotals(model,through) {
  if(!Number.isInteger(through)||through<0||through>model.years.length) throw new Error('Totals need a completed observation boundary');
  return model.archives.map(archive=>archive.base+archive.additions.slice(0,through).reduce((sum,row)=>sum+row.amount,0));
}
export function stockPose(id,model=createStockModel()) {
  const stop=model.stops.get(id);if(!stop) throw new Error('Unknown stock reading: '+id);
  const annotations=new Map();
  for(const archive of model.archives) {
    if(!stop.assembly) archive.additions.forEach((row,j)=>annotations.set(`${archive.id}/${row.id}/annual`,{id:`${archive.id}/${row.id}/annual`,role:'annual',archive,row,value:row.amount,opacity:stop.focus&&j!==model.years.length-1?.45:1}));
    else {
      annotations.set(`${archive.id}/base`,{id:`${archive.id}/base`,role:'base',archive,value:archive.base,opacity:1});
      annotations.set(`${archive.id}/total`,{id:`${archive.id}/total`,role:'total',archive,value:archive.total,opacity:1});
    }
  }
  if(stop.gap) annotations.set('gap',{id:'gap',role:'gap',value:Math.abs(model.archives[1].total-model.archives[0].total),opacity:1});
  return {id,assembly:stop.assembly,focus:stop.focus,gap:stop.gap?1:0,annotations};
}
export function blendStock(a,b,t) {
  return blendWithAnnotations(a,b,t,(from,to,p)=>({...to,assembly:lerp(from.assembly,to.assembly,p),focus:lerp(from.focus,to.focus,p),gap:lerp(from.gap,to.gap,p)}));
}
export function stockGeometry(model,pose) {
  const zoom=clamp01(pose.assembly/.25),baseOpacity=clamp01((pose.assembly-.19)/.13);
  const max=lerp(model.annualMax,model.max,zoom),scale=linearScale([0,max],[plot.bottom,plot.top]);
  const segments=[],starts=[],connectors=[];
  model.archives.forEach((archive,i)=>{
    const offset=i===0?-24:24,baseX=at(model.x,model.baseYear)+offset;
    starts.push({id:`${archive.id}/base`,archive,x:baseX,y:at(scale,archive.base),opacity:baseOpacity});
    let previous={x:baseX,end:archive.base};
    archive.segments.forEach((segment,j)=>{
      const lift=clamp01((pose.assembly-.31-j*(.5/model.years.length))/.25);
      const start=segment.start*lift,end=start+segment.amount,x=at(model.x,segment.row.year)+offset;
      const item={id:`${archive.id}/${segment.id}`,archive,row:segment.row,x,width:lerp(40,17,zoom),start,end,lift,
        y:at(scale,end),height:at(scale,start)-at(scale,end),opacity:1-pose.focus*(j===model.years.length-1?0:.56)};
      segments.push(item);
      connectors.push({id:item.id,archive,fromX:previous.x,toX:x,y:at(scale,segment.start),opacity:clamp01((lift-.86)/.14)});
      previous={x,end};
    });
  });
  return {segments,starts,connectors,scale,max,zoom,baseOpacity,totals:stockTotals(model,model.years.length)};
}
export function mountStock(root,{config=stockExample,duration=2200}={}) {
  const model=createStockModel(config),$=s=>root.querySelector(s),svg=$('svg');
  const initial=stockTotals(model,0),end=stockTotals(model,model.years.length);
  const facts={initialGap:model.amount(Math.abs(initial[1]-initial[0])),finalGap:model.amount(Math.abs(end[1]-end[0])),closed:model.amount(Math.abs(initial[1]-initial[0])-Math.abs(end[1]-end[0]))};
  model.archives.forEach((a,i)=>{facts[`${a.id}-total`]=model.amount(end[i]);facts[`${a.id}-latest`]=model.amount(a.additions.at(-1).amount);});
  root.querySelectorAll('[data-fact]').forEach(el=>{if(!Object.hasOwn(facts,el.dataset.fact))throw new Error('Unknown prose fact');el.textContent=facts[el.dataset.fact];});
  const grid=svgElement('g',{class:'axis'}),annualAxis=svgElement('g'),stockAxis=svgElement('g');
  function buildAxis(group,max,step){const scale=linearScale([0,max],[plot.bottom,plot.top]);for(let value=0;value<=max;value+=step)group.append(svgElement('line',{x1:plot.left,x2:plot.right,y1:at(scale,value),y2:at(scale,value)}),svgElement('text',{x:68,y:at(scale,value)+6,'text-anchor':'end'},format(value)));}
  buildAxis(annualAxis,model.annualMax,model.annualMax/4);buildAxis(stockAxis,model.max,model.max/3);grid.append(annualAxis,stockAxis);svg.append(grid);
  const title=svgElement('text',{x:plot.left,y:43,class:'metric'});svg.append(title);
  const legend=svgElement('g');model.archives.forEach((a,i)=>{const x=590+i*140;legend.append(svgElement('rect',{x,y:28,width:12,height:12,fill:a.color}),svgElement('text',{x:x+22,y:40,fill:a.color,class:'legend'},a.name));});svg.append(legend);
  const years=svgElement('g',{class:'years'}),baseYear=svgElement('text',{x:at(model.x,model.baseYear),y:627,'text-anchor':'middle'},model.baseYear);
  years.append(baseYear);model.years.forEach(y=>years.append(svgElement('text',{x:at(model.x,y),y:627,'text-anchor':'middle'},y)));svg.append(years);
  const joins=createSvgLayer(svg,{create(){return svgElement('path',{fill:'none','stroke-width':2.5});},update(path,c){setSvgAttributes(path,{d:`M${c.fromX},${c.y}H${c.toX}`,stroke:c.archive.color,opacity:c.opacity*.8});}});
  const bases=createSvgLayer(svg,{create(){return svgElement('circle',{r:5.5});},update(node,p){setSvgAttributes(node,{cx:p.x,cy:p.y,fill:p.archive.color,opacity:p.opacity});}});
  const bars=createSvgLayer(svg,{create(p){return svgElement('rect',{'data-record':p.id,rx:1});},update(node,p){setSvgAttributes(node,{x:p.x-p.width/2,y:p.y,width:p.width,height:p.height,fill:p.archive.color,opacity:p.opacity});}});
  const initialBracket=svgElement('path',{fill:'none',stroke:'#cdd9d5','stroke-width':1.5,'data-initial-gap':''});
  const bracket=svgElement('path',{fill:'none',stroke:'#cdd9d5','stroke-width':1.5});svg.append(initialBracket,bracket);
  let geometry;
  const labels=createSvgLayer(svg,{create(){return svgElement('text',{'text-anchor':'middle'});},update(node,label){
    let x,y;setSvgAttributes(node,{opacity:label.opacity,fill:label.archive?.color??'#e5eee7',class:label.role==='annual'?'increment':'total'});
    if(label.role==='annual'){const p=geometry.segments.find(p=>p.archive.id===label.archive.id&&p.row.id===label.row.id);x=p.x;y=p.y-15;}
    else if(label.role==='base'){const p=geometry.starts.find(p=>p.archive.id===label.archive.id);x=p.x;y=p.y-23;}
    else if(label.role==='total'){const p=geometry.segments.filter(p=>p.archive.id===label.archive.id).at(-1);x=p.x;y=p.y-24;}
    else {x=956;y=at(geometry.scale,(end[0]+end[1])/2)+7;}
    setSvgAttributes(node,{x,y});node.textContent=label.role==='gap'?`差 ${format(label.value)}`:format(label.value);
  }});
  function render(pose,frame){
    geometry=stockGeometry(model,pose);joins.render(geometry.connectors);bases.render(geometry.starts);bars.render(geometry.segments);labels.render(pose.annotations);
    setSvgAttributes(annualAxis,{opacity:clamp01(1-geometry.zoom*4)});setSvgAttributes(stockAxis,{opacity:clamp01((geometry.zoom-.7)/.3)});setSvgAttributes(baseYear,{opacity:geometry.baseOpacity});
    title.textContent=pose.assembly>.99?`累计收录 / ${config.unit}`:pose.assembly>.01?'把每年的新增接回已有量':`年度新增 / ${config.unit}`;
    const [first,second]=geometry.starts,x=Math.min(first.x,second.x)-24;
    setSvgAttributes(initialBracket,{d:`M${first.x-8},${first.y}H${x}V${second.y}H${second.x-8}`,
      opacity:initial[0]===initial[1]?0:geometry.baseOpacity*lerp(.85,.43,pose.gap)});
    const [a,b]=end.map(v=>at(geometry.scale,v));setSvgAttributes(bracket,{d:`M883,${a}H899V${b}H883`,opacity:pose.gap});
    svg.dataset.state=pose.id;svg.dataset.moving=String(frame.moving);svg.dataset.assembly=String(pose.assembly);
    if(!frame.moving)svg.setAttribute('aria-label',pose.assembly?model.archives.map((a,i)=>`${a.name}累计 ${model.amount(end[i])}`).join('；'):model.archives.map(a=>`${a.name}年度新增 ${a.additions.map(r=>`${r.year} 年 ${model.amount(r.amount)}`).join('，')}`).join('；'));
  }
  const exit=reserveStageExit({sticky:$('.archive-stage'),readingEnd:$('[data-reading-end]'),spacer:$('.reading-tail'),releaseRatio:.4});
  const stage=createStage({element:svg,steps:[...root.querySelectorAll('[data-state]')].map(element=>({element,id:element.dataset.state})),layout:id=>stockPose(id,model),blend:blendStock,render,duration,viewportRatio:.55});
  document.fonts.ready.then(()=>stage.refresh());
  return {sample:stage.sample,dispose(){stage.dispose();exit.dispose();joins.dispose();bases.dispose();bars.dispose();labels.dispose();grid.remove();years.remove();legend.remove();initialBracket.remove();bracket.remove();title.remove();}};
}
