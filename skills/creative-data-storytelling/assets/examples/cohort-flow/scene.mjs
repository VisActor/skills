// 改编入口：mount(svg, {data, names}) 接两组人数；flowSummary 共用分母与比例，flowGeometry / targetY 管人数尺度与排列；flowSegments / ribbon / flowPoint 连接色带与记录。
// 叙事与设计理由见本页 example-notes。预览控件可替换为作品自己的阅读接线。
import {el,txt,line,attr,mix,lerp,clamp01} from '../segment-draw.mjs';

// Fictional paired records. One point is one person; percentages use each group's total.
export const flowData={A:[30,30,22,12,6],B:[10,16,24,26,24]};
export const outcomeNames=['最高档','较高档','中间档','较低档','最低档'];
export const flowGeometry={sourceTop:300,unit:1.8,source:{A:550,B:1350},end:{A:872,B:1028}};
export const targetY=id=>174+id*104;
export function flowSegments(values){let offset=0;return values.map((value,id)=>{const segment={id,value,start:offset,end:offset+value};offset+=value;return segment;});}
export function flowSummary(data=flowData){
 const groups=Object.fromEntries(['A','B'].map(group=>{
  const values=data[group];
  if(!Array.isArray(values)||!values.length||values.some(value=>!Number.isSafeInteger(value)||value<0))throw new Error(`Flow ${group} needs nonnegative integer person counts`);
  const total=values.reduce((sum,value)=>sum+value,0);
  if(!Number.isSafeInteger(total)||total===0)throw new Error(`Flow ${group} needs a positive total`);
  return [group,{total,values,shares:values.map(value=>value/total*100),segments:flowSegments(values)}];
 }));
 if(groups.A.values.length!==groups.B.values.length)throw new Error('Flow groups need the same destinations');
 return groups;
}
const number=value=>Number(value.toFixed(1)).toString();
export function flowRecords(group,data=flowData){const total=data[group].reduce((sum,value)=>sum+value,0);return flowSegments(data[group]).flatMap(segment=>Array.from({length:segment.value},(_,j)=>({id:group+'-'+(segment.start+j),group,total,index:segment.start+j,within:j,segment})));}
export function cubicPoint(start,end,t){const dx=end.x-start.x,a={x:start.x+dx*.46,y:start.y},b={x:start.x+dx*.68,y:end.y},u=1-t;return {x:u*u*u*start.x+3*u*u*t*a.x+3*u*t*t*b.x+t*t*t*end.x,y:u*u*u*start.y+3*u*u*t*a.y+3*u*t*t*b.y+t*t*t*end.y};}
export function flowPoint(record,progress){
 const {sourceTop,unit,source,end}=flowGeometry,g=record.group,i=record.index,s=record.segment;
 const columns=Math.min(10,record.total),rows=Math.ceil(record.total/columns);
 const grid={x:source[g]+(i%columns-(columns-1)/2)*8.5,y:390+(Math.floor(i/columns)-(rows-1)/2)*8.5};
 const start={x:source[g],y:sourceTop+(i+.5)*unit};
 const finish={x:end[g]+(g==='A'?1:-1)*((record.within%3)-1)*5.1,y:targetY(s.id)+(record.within+.5-s.value/2)*unit};
 const delay=(i*17%23)/23*.16,t=clamp01((progress-delay)/(1-delay));
 if(t<.14)return {x:lerp(grid.x,start.x,t/.14),y:lerp(grid.y,start.y,t/.14)};
 return cubicPoint(start,finish,(t-.14)/.86);
}
export function ribbon(segment,sourceX,endX,progress){
 const h=segment.value*flowGeometry.unit,sy=flowGeometry.sourceTop+segment.start*flowGeometry.unit,ey=targetY(segment.id)-h/2;
 // De Casteljau: reveal the actual path used by the records, rather than morphing
 // a shorter, differently curved strip while its records follow the final curve.
 const dx=endX-sourceX,blend=(a,b)=>({x:lerp(a.x,b.x,progress),y:lerp(a.y,b.y,progress)});
 const p0={x:sourceX,y:sy},p1={x:sourceX+dx*.46,y:sy},p2={x:sourceX+dx*.68,y:ey},p3={x:endX,y:ey};
 const q0=blend(p0,p1),q1=blend(p1,p2),q2=blend(p2,p3),r0=blend(q0,q1),r1=blend(q1,q2),s=blend(r0,r1);
 return `M${sourceX} ${sy} C${q0.x} ${q0.y} ${r0.x} ${r0.y} ${s.x} ${s.y} L${s.x} ${s.y+h} C${r0.x} ${r0.y+h} ${q0.x} ${q0.y+h} ${sourceX} ${sy+h}Z`;
}
export const example={
 id:'cohort-flow',short:'起点与去向',title:'同样的起点，不同的后来',eyebrow:'从共同起点，追到共同终点',viewBox:'0 0 1440 720',duration:2400,
 theme:{paper:'#142e36',ink:'#eef0df',muted:'#99b0ae',accent:'#e2b66b',line:'#355058',panel:'#193a40'},dataCaption:'虚构的两组配对记录，不对应真实族群。',
 states:[
  {name:'同一起点',title:'父母同在最高档，<br><em>孩子后来呢？</em>',description:'',value:'',unit:'',metric:''},
  {name:'沿着一组人的去向',title:'父母在最高档，<br><em>孩子未必留下。</em>',description:'',value:'',unit:'',metric:''},
  {name:'另一组接入同一列终点',title:'另一组人，<br><em>去向一样吗？</em>',description:'',value:'',unit:'',metric:''},
  {name:'沿最低档看回起点',title:'同在起点，<br><em>不同的后来。</em>',description:'',value:'',unit:'',metric:''}
 ],
 mount(svg,{data=flowData,names=outcomeNames}={}){
  const summary=flowSummary(data),last=names.length-1;
  if(names.length!==summary.A.values.length)throw new Error('Flow destination labels must match counts');
  function read(step){
   const {A,B}=summary,result={...example.states[step]};
   if(step===0)result.description=`这两组人，父母都处在最高收入档。${A.total===B.total?`每组各取 ${A.total} 人`:`A 组 ${A.total} 人，B 组 ${B.total} 人`}，看看他们成年后会到哪里。`;
   if(step===1){result.description=`A 组的 ${A.total} 人中，成年后有 ${A.values[0]} 人仍在${names[0]}，${A.values[last]} 人到了${names[last]}。父母所处的收入档，没有决定所有人的去向。`;result.highlights=[`${A.values[0]} 人`,`${A.values[last]} 人`];}
   if(step===2){result.description=`B 组父母也在最高收入档，但孩子成年后到达${names[0]}的比例是 ${number(B.shares[0])}%，A 组为 ${number(A.shares[0])}%。两组的其他去向，是否也有差别？`;result.highlights=[{text:`${number(B.shares[0])}%`,color:'#81c1b7'},{text:`${number(A.shares[0])}%`,color:'#e2b66b'}];}
   if(step===3){result.description=`到达${names[last]}的，A 组有 ${A.values[last]} 人（${number(A.shares[last])}%），B 组有 ${B.values[last]} 人（${number(B.shares[last])}%）。父母收入档相同，成年去向仍有差异；原因还需要其他证据。`;result.highlights=[{text:`${A.values[last]} 人（${number(A.shares[last])}%）`,color:'#e2b66b'},{text:`${B.values[last]} 人（${number(B.shares[last])}%）`,color:'#81c1b7'}];}
   return result;
  }
  const colors={A:'#e2b66b',B:'#81c1b7'},groups=[],targetLabels=[];
  const relation=el(svg,'g');txt(relation,950,75,'父母都在最高收入档',{'text-anchor':'middle',style:'font-size:18px;fill:#d2ddd4'});
  el(relation,'path',{d:'M550 113 V101 H1350 V113',fill:'none',stroke:'#6d8585','stroke-width':1});
  const unitNote=txt(svg,950,142,'每一点是一人',{'text-anchor':'middle',style:'font-size:13px;fill:#9ab0ac'});
  const flowNote=txt(svg,1350,145,'流带宽度表示人数，终点百分比按各组人数计算',{'text-anchor':'end',style:'font-size:15px;fill:#b5c8c4'});
  const targetHeading=txt(svg,950,118,'成年后的收入档',{'text-anchor':'middle',style:'font-size:13px;fill:#9ab0ac'});
  const pathLayer=el(svg,'g'),pointLayer=el(svg,'g'),targetLayer=el(svg,'g');
  for(let i=0;i<names.length;i++){
   const y=targetY(i),g=el(targetLayer,'g');
   line(g,895,y+30,1005,y+30,{stroke:'#547272','stroke-width':1,opacity:.4});
   const name=txt(g,950,y-13,names[i],{'text-anchor':'middle',style:'font-size:16px;fill:#e6e9d9'});
   const values=Object.fromEntries(['A','B'].map(group=>[group,txt(g,group==='A'?907:993,y+16,number(summary[group].shares[i])+'%',{'data-flow-share':`${group}-${i}`,'text-anchor':'middle',class:'num',style:'font-size:27px;fill:'+colors[group]})]));
   targetLabels.push({g,name,values,id:i});
  }
  for(const group of ['A','B']){
   const color=colors[group],sx=flowGeometry.source[group],ex=flowGeometry.end[group];
   const label=txt(svg,sx,257,group+' 组',{'text-anchor':'middle',style:'font-size:24px;fill:'+color});
   const source=el(pathLayer,'rect',{'data-flow-source':group,x:sx-3,y:flowGeometry.sourceTop,width:6,height:summary[group].total*flowGeometry.unit,rx:2,fill:color});
   const size=txt(svg,sx,flowGeometry.sourceTop+summary[group].total*flowGeometry.unit+40,`${summary[group].total} 人`,{'data-flow-total':group,'text-anchor':'middle',class:'num',style:'font-size:23px;fill:'+color});
   const paths=summary[group].segments.map(segment=>({segment,path:el(pathLayer,'path',{fill:color}),tip:el(targetLayer,'rect',{x:ex-3,y:targetY(segment.id)-segment.value*flowGeometry.unit/2,width:6,height:segment.value*flowGeometry.unit,rx:1,fill:color})}));
   const records=flowRecords(group,data).map(record=>{const circle=el(pointLayer,'circle',{r:2.2,fill:color,'data-record-id':record.id});return{...record,circle};});
   groups.push({group,color,sx,ex,label,source,size,paths,records});
  }
  const gap=el(svg,'g');el(gap,'path',{d:'M872 638 V649 H1028 V638',fill:'none',stroke:'#b9c4b4','stroke-width':1});txt(gap,950,680,`相差 ${number(Math.abs(summary.B.shares[last]-summary.A.shares[last]))} 个百分点`,{'data-flow-gap':'share','text-anchor':'middle',style:'font-size:17px;fill:#e2e5d4'});
  function pose(step){return{step,a:step>=1?1:0,b:step>=2?1:0,focus:step>=3?1:0};}
  function render(p){
   const hasTargets=clamp01(p.a*3),finishedA=clamp01((p.a-.93)/.07),finishedB=clamp01((p.b-.93)/.07);
   attr(relation,{opacity:lerp(1,.65,hasTargets)});attr(unitNote,{opacity:1-hasTargets});
   attr(flowNote,{opacity:hasTargets});attr(targetHeading,{opacity:hasTargets});
   for(const g of groups){const progress=p[g.group.toLowerCase()],travel=clamp01(progress/.86),pointsVisible=1-clamp01((progress-.87)/.13);attr(g.source,{opacity:clamp01(travel*3)});attr(g.size,{opacity:lerp(1,.75,p.focus)});
    for(const {segment,path,tip} of g.paths){const current=clamp01((travel-.07)/.93),focused=segment.id===last;attr(path,{d:ribbon(segment,g.sx,g.ex,current),opacity:clamp01(travel*4)*(focused?lerp(.26,.73,p.focus):lerp(.26,.055,p.focus))});attr(tip,{opacity:clamp01((travel-.92)/.08)*(focused?1:lerp(1,.27,p.focus))});}
    for(const record of g.records){const point=flowPoint(record,travel),focused=record.segment.id===last;attr(record.circle,{cx:point.x,cy:point.y,r:lerp(2.6,2.2,travel),opacity:pointsVisible*(focused?1:lerp(1,.17,p.focus))});}
   }
   for(const label of targetLabels){const low=label.id===last;attr(label.g,{opacity:hasTargets*(low?1:lerp(1,.38,p.focus))});attr(label.values.A,{opacity:finishedA});attr(label.values.B,{opacity:finishedB});}
   attr(gap,{opacity:clamp01((p.focus-.45)/.55)});
  }
  return{pose,read,blend:mix,render};
 }
};
