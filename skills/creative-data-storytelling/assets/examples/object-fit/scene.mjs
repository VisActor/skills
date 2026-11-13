// 改编入口：mount(svg, {rows}) 换样本，objects 换物品；fitSummary 共用分组统计，itemTop / fits 共用轮廓；collection 的前段移动代表，后段显出其他样本。更换组数或扩大样本量时另调排列。
// 叙事与设计理由见本页 example-notes。预览控件可替换为作品自己的阅读接线。
import {el,txt,line,attr,lerp,mix,clamp01} from '../segment-draw.mjs';

// 同一个凸五边形同时用于绘制与适配计算。只测试物体竖直、完整放入，不模拟布料。
export const objects={phone:{label:'手机',width:8,height:16},wallet:{label:'钱包',width:9.5,height:8.5}};
export const pockets=Array.from({length:40},(_,i)=>{const b=i>=20,j=i%20;return {id:`${b?'b':'a'}-${j}`,group:b?'B':'A',index:j,width:j===0?(b?14.5:15):12+(j*7%11)*.45,height:j===0?(b?14.5:24):(b?10+(j*7%13)*.75:17+(j*3%13)*.7),taper:4};});
export function itemTop(row,item){return row.height-row.taper*item.width/row.width-item.height;}
export function fits(row,item){return item.width<=row.width&&itemTop(row,item)>=-1e-9;}
export function fitSummary(item,rows=pockets){return ['A','B'].map(group=>{const samples=rows.filter(row=>row.group===group),count=samples.filter(row=>fits(row,item)).length,total=samples.length;return {group,count,total,share:total?Math.round(count/total*100):null};});}
export function fitCounts(item,rows=pockets){return fitSummary(item,rows).map(group=>group.count);}
const number=value=>Number(value.toFixed(1)).toString();
export const example={
 id:'object-fit',short:'实物与功能',title:'这个口袋，能装下随身物品吗？',eyebrow:'口袋与随身物品',
 theme:{paper:'#f0f2ee',ink:'#243d4d',muted:'#73818a',accent:'#ae6753',line:'#d1dadc',panel:'#fafcf7'},
 states:[
  {name:'比较尺寸',title:'口袋浅了，<br><em>影响有多大？</em>',description:'',value:'',unit:'厘米',metric:''},
  {name:'把物品放进去',title:'同一件物品，<br><em>试着放进去。</em>',description:'',value:'',unit:'厘米',metric:''},
  {name:'回到全部样本',title:'不只这两只，<br><em>差别还在吗？</em>',description:'',value:'',unit:'',metric:'样本组 A / 样本组 B · 可完整放下的比例'}
 ],
 mount(svg,{rows=pockets}={}){
  const groupRows=['A','B'].map(group=>rows.filter(row=>row.group===group));
  if(groupRows.some(group=>!group.length))throw new Error('Pocket comparison needs at least one sample in each group');
  const main=groupRows.map(group=>group.find(row=>row.index===0)??group[0]);
  const ranks=new Map(groupRows.flatMap((group,side)=>[main[side],...group.filter(row=>row.id!==main[side].id)].map((row,rank)=>[row.id,rank])));
  let objectName='phone';const nodes=[];
  const defs=el(svg,'defs');const pattern=el(defs,'pattern',{id:'denim-weave',width:5,height:5,patternUnits:'userSpaceOnUse',patternTransform:'rotate(25)'});line(pattern,0,0,0,5,{stroke:'#fff','stroke-width':.6,opacity:.16});
  const unit=txt(svg,500,61,'口袋与物品 · 同一厘米尺度',{class:'label','text-anchor':'middle'});
  const heads=['A','B'].map((group,i)=>({
   name:txt(svg,i?750:280,119,`样本组 ${group}`,{'text-anchor':'middle',style:'font-size:17px'}),
   count:txt(svg,i?750:280,150,'',{'data-fit-group':group,'text-anchor':'middle',style:'font-size:15px;fill:#4c6471',opacity:0})
  }));
  for(const row of rows){
   const g=el(svg,'g',{'data-record-id':row.id});
   const shape=`M${-row.width/2} 0 H${row.width/2} V${row.height-row.taper} L0 ${row.height} L${-row.width/2} ${row.height-row.taper} Z`;
   el(g,'path',{d:shape,fill:row.group==='A'?'#4f708b':'#66819b',stroke:'#38566a','stroke-width':.1});
   el(g,'path',{d:shape,fill:'url(#denim-weave)'});
   const stitch=el(g,'g',{transform:'scale(.94 .96)'});el(stitch,'path',{d:shape,fill:'none',stroke:'#e3cf9b','stroke-width':.1,'stroke-dasharray':'.24 .22'});
   for(const sx of [-1,1])el(g,'circle',{cx:sx*(row.width/2-.5),cy:.55,r:.15,fill:'#e1bb70'});
   const item=el(g,'g');const itemBody=el(item,'rect',{rx:.8,fill:'#213a41',stroke:'#d1b991','stroke-width':.14});
   const screen=el(item,'rect',{rx:.6,fill:'#cedaca',opacity:.65});
   const notch=el(item,'rect',{rx:.16,fill:'#213a41'});const walletSeam=el(item,'path',{fill:'none',stroke:'#eedfc3','stroke-width':.1,'stroke-dasharray':'.2 .15'});
   line(g,-row.width/2,0,row.width/2,0,{stroke:'#d3b483','stroke-width':.2});
   const visibleClip=el(defs,'clipPath',{id:`inside-${row.id}`});el(visibleClip,'path',{d:shape});
   const cover=el(g,'path',{d:shape,fill:'#5d7b90',opacity:.35});
   const protrude=el(g,'line',{x1:-5,x2:5,y1:0,y2:0,stroke:'#bd6a4f','stroke-width':.25,opacity:0});
   const dimension=el(svg,'g');const depthLine=el(dimension,'path',{fill:'none',stroke:'#8e9e9f','stroke-width':1});const depthText=txt(dimension,0,0,`${row.height} cm`,{class:'num',style:'font-size:17px','text-anchor':'end'});
   nodes.push({row,g,item,itemBody,screen,notch,walletSeam,cover,protrude,dimension,depthLine,depthText});
  }
  const depthDifference=main[0].height-main[1].height;
  const depthGap=el(svg,'g',{'data-depth-difference':number(Math.abs(depthDifference))});
  const depthLeaders=el(depthGap,'path',{fill:'none',stroke:'#ae6753','stroke-width':1,'stroke-dasharray':'3 5',opacity:.55});
  const depthSpan=line(depthGap,515,0,515,0,{'data-depth-gap':'span',stroke:'#ae6753','stroke-width':1.5});
  const depthCaps=el(depthGap,'path',{fill:'none',stroke:'#ae6753','stroke-width':1.5});
  const depthGapText=txt(depthGap,531,0,depthDifference===0?'深度相同':`右侧${depthDifference>0?'浅':'深'} ${number(Math.abs(depthDifference))} cm`,{style:'font-size:20px;fill:#ae6753'});
  const overhang=el(svg,'g');const overline=el(overhang,'path',{fill:'none',stroke:'#b46b52','stroke-width':1.3});const overtext=txt(overhang,868,228,'',{style:'font-size:15px;font-weight:550;fill:#b46b52'});
  const focusSample=item=>itemTop(main[1],item)<0?main[1]:itemTop(main[0],item)<0?main[0]:main[1];
  function pose(step){const obj=objects[objectName];return {step,reveal:step>=1?1:0,collection:step>=2?1:0,itemW:obj.width,itemH:obj.height,wallet:objectName==='wallet'?1:0};}
  const collectionMove = p => clamp01(p.collection / .62);
  function itemMatches(p) {
   const object = objects[objectName];
   return p.itemW === object.width && p.itemH === object.height && p.wallet === (objectName === 'wallet' ? 1 : 0);
  }
  function copyReady(step, p) {
   const representatives = 1 - collectionMove(p);
   if (step === 0) return (1 - p.reveal) * representatives >= .9;
   if (step === 1) return itemMatches(p) && p.reveal * representatives >= .9;
   return true;
  }
  function read(step){
   const obj=objects[objectName],result={...example.states[step]};
   if(step===0){
    const comparison=depthDifference===0?'两只口袋一样深':`右边的口袋比左边${depthDifference>0?'浅':'深'}了 ${number(Math.abs(depthDifference))} 厘米`;
    result.description=`先从两组各取一只口袋。${comparison}；同一${objectName==='phone'?'部':'个'}${obj.label}，两边都能完整装下吗？`;
    result.highlights=[{text:`${number(Math.abs(depthDifference))} 厘米`,color:'#ae6753'}];
   }
   if(step===1){
    const fit=main.map(row=>fits(row,obj)),sample=focusSample(obj);
    result.name=`把${obj.label}放进去`;result.title=`同一${objectName==='phone'?'部':'个'}${obj.label}，<br><em>${fit[0]!==fit[1]?'一边露出来':fit[0]?'两边都能放下':'两边都装不下'}。</em>`;
    const overhangHeight=Math.max(0,-itemTop(sample,obj)),side=sample.id===main[0].id?'左侧':'右侧';
    result.description=overhangHeight>0?`${obj.label}碰到袋底后，${side}仍露出 ${number(overhangHeight)} 厘米。这里按竖直放入比较，不计布料伸缩。`:`${obj.label}能否完整装下，还要看它与袋口、袋底轮廓的关系。这里按竖直放入比较，不计布料伸缩。`;
    result.highlights=overhangHeight>0?[{text:`${number(overhangHeight)} 厘米`,color:'#b46b52'}]:[];
    result.value='';result.unit='';result.metric='';
   }
   if(step===2){const summary=fitSummary(obj,rows);result.description=`刚才只看了各组的一只口袋。把同一${objectName==='phone'?'部':'个'}${obj.label}放进其余样本，差别还常见吗？`;result.value=summary.map(group=>group.share+'%').join(' / ');result.metric=`能完整放下${obj.label}的比例 · 样本组 A / B`;}
   return result;
  }
  function render(p){
   const item={width:p.itemW,height:p.itemH},summary=fitSummary(objects[objectName],rows),c=clamp01(p.collection);
   // Move the same two records first; other records appear at their own final slots.
   // Reversing collection hides those records before enlarging the representatives.
   const move=collectionMove(p),reveal=clamp01((c-.64)/.36);
   const samplesReady = reveal === 1;
   const selectedItemReady = itemMatches(p);
   const resultsReady = samplesReady && selectedItemReady && p.reveal === 1;
   const depthEnds=main.map(row=>232+row.height*11);
   attr(depthGap,{opacity:(1-p.reveal)*(1-move)});
   attr(depthLeaders,{d:`M280 ${depthEnds[0]} H507 M750 ${depthEnds[1]} H523`});
   attr(depthSpan,{y1:depthEnds[0],y2:depthEnds[1]});
   attr(depthCaps,{d:`M509 ${depthEnds[0]} H521 M509 ${depthEnds[1]} H521`});
   attr(depthGapText,{y:(depthEnds[0]+depthEnds[1])/2+6});
   attr(svg, {'data-samples-ready': samplesReady, 'data-fit-results-ready': resultsReady});
   for(const n of nodes){const {row}=n,side=row.group==='A'?0:1,isMain=row.id===main[side].id,rank=ranks.get(row.id);
    const x0=side?750:280,y0=232,s0=11;const x1=(side?595:95)+(rank%5)*77,y1=203+Math.floor(rank/5)*96;
    const x=isMain?lerp(x0,x1,move):x1,y=isMain?lerp(y0,y1,move):y1,s=isMain?lerp(s0,2.45,move):2.45;
    attr(n.g,{transform:`translate(${x} ${y}) scale(${s})`,opacity:isMain?1:reveal});
    const top=itemTop(row,item);const py=lerp(-item.height-10,top,p.reveal);
    attr(n.item,{transform:`translate(${-item.width/2} ${py})`,opacity:p.reveal});
    attr(n.itemBody,{width:item.width,height:item.height,fill:p.wallet>.5?'#a87b50':'#213a41',rx:lerp(.8,.35,p.wallet)});
    attr(n.screen,{x:.3,y:.45,width:Math.max(0,item.width-.6),height:Math.max(0,item.height-.9),opacity:(1-p.wallet)*.65});
    attr(n.notch,{x:item.width/2-1,y:.3,width:2,height:.4,opacity:1-p.wallet});
    attr(n.walletSeam,{d:`M.35 .5 H${item.width-.35} V${item.height-.5} H.35Z M.35 ${item.height*.5} H${item.width-.35}`,opacity:p.wallet});
    attr(n.protrude,{opacity:p.reveal*(fits(row,item)?0:1),x1:-row.width/2,x2:row.width/2});
    attr(n.dimension,{opacity:(1-move)*(isMain?1:0)});
    const bx=x-row.width*s/2-22;attr(n.depthLine,{d:`M${bx+5} ${y} H${bx} V${y+row.height*s} H${bx+5}`});attr(n.depthText,{x:bx-9,y:y+row.height*s/2+6});
   }
   heads.forEach((head, index) => {
    const x = index === 0 ? lerp(280, 250, move) : 750;
    const {count, total, share} = summary[index];
    attr(head.name, {x});
    attr(head.count, {x, opacity: resultsReady ? 1 : 0});
    head.count.textContent = `${count} / ${total} 可放下 · ${share}%`;
   });
   const sample=focusSample(objects[objectName]),top=itemTop(sample,item),side=sample.group==='A'?0:1;
   const x=lerp(side?750:280,side?595:95,move),y=lerp(232,203,move),s=lerp(11,2.45,move),yy=y+top*s,bx=x+sample.width*s/2+12;
   attr(overhang,{opacity:selectedItemReady&&top<0?p.reveal*(1-move):0});attr(overline,{d:`M${bx} ${yy} H${bx+8} V${y} H${bx}`});attr(overtext,{x:bx+22,y:(yy+y)/2+5});overtext.textContent=`露出 ${number(Math.max(0,-top))} cm`;
  }
  return {pose,read,blend:mix,render,copyReady,choices(step){return step===2?Object.entries(objects).map(([id,o])=>({id,label:o.label,selected:id===objectName})):[];},choose(id){if(!objects[id])throw new Error('Unknown object');objectName=id;}};
 }
};
