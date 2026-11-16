// 改编入口：songs / categories / periods 定义记录、分类与分母；buildLayouts 管记录排列，areaBoundary 管构成边界；example.states 与 mount 内 blend / render 组织提取和汇合。改主题时一起更新代表记录、分类、时期及比较标注。
// 叙事与设计理由见本页 example-notes。预览控件可替换为作品自己的阅读接线。
import {el,txt,line,attr,lerp,clamp01} from '../segment-draw.mjs';
import {rawSongs} from './love-songs.mjs';

export const categories=[
 {id:1,label:'直接示爱',color:'#e96987'},
 {id:2,label:'失恋与思念',color:'#6a8fde'},
 {id:3,label:'复杂关系',color:'#af88c3'},
 {id:4,label:'追求',color:'#eca15d'},
 {id:5,label:'告别旧爱',color:'#76b7ad'},
 {id:6,label:'性与自信',color:'#cab253'},
 {id:7,label:'爱自己',color:'#d879ad'},
 {id:0,label:'非爱情主题',color:'#d4d2cc'}
];
const ranges=[[1958,1970],[1970,1980],[1980,1990],[1990,2000],[2000,2010],[2010,2020],[2020,2024]];
export const songs=rawSongs.map((r,i)=>({id:'song-'+i,artist:r[0].split('|').filter(Boolean).join(' / '),title:r[1],year:r[2],category:r[3],weeks:r[4],period:ranges.findIndex(([lo,hi])=>r[2]>=lo&&r[2]<hi)}));
export const periods=ranges.map(([lo,hi],p)=>{const rows=songs.filter(s=>s.period===p),weights=categories.map(c=>rows.filter(s=>s.category===c.id).reduce((sum,s)=>sum+s.weeks,0));return {label:p===0?'1958–69':p===6?'2020–23':lo+'s',lo,hi,center:(lo+hi)/2,n:rows.length,weights,total:weights.reduce((a,b)=>a+b,0)};});
export function cumulativeShare(period,category){return category<0?0:periods[period].weights.slice(0,category+1).reduce((a,b)=>a+b,0)/periods[period].total;}
const L=100,R=1340,TOP=240,BOTTOM=618,H=BOTTOM-TOP;
export const yearX=y=>L+(y-1958)/(2024-1958)*(R-L);
export function connectedShare(x,c){
 if(c<0)return 0;
 const xs=periods.map(p=>yearX(p.center));if(x<=xs[0])return cumulativeShare(0,c);if(x>=xs.at(-1))return cumulativeShare(6,c);
 const i=xs.findIndex((v,j)=>j<6&&x>=v&&x<xs[j+1]),t=(x-xs[i])/(xs[i+1]-xs[i]),e=t*t*(3-2*t);
 return lerp(cumulativeShare(i,c),cumulativeShare(i+1,c),e);
}
export function areaBoundary(c){return Array.from({length:161},(_,i)=>{const x=L+(R-L)*i/160;return{x,y:BOTTOM-H*connectedShare(x,c)};});}
const categoryIndex=new Map(categories.map((c,i)=>[c.id,i]));
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const colors=categories.map(c=>rgb(c.color)),grey=rgb('#ceccc6');
const random=i=>{const v=Math.sin(i*127.1+19.23)*43758.5453123;return v-Math.floor(v);};
const CIRCLE_SCALE=1.28;

// Deterministic x-preserving circle placement. A song keeps its chart-entry date.
export function beeswarm(rows,center=411){
 const placed=new Map(),active=[];
 for(const s of [...rows].sort((a,b)=>a.year-b.year||a.id.localeCompare(b.id))){
  const x=yearX(s.year),r=Math.sqrt(s.weeks)*CIRCLE_SCALE;
  while(active.length&&active[0].x<x-r-11)active.shift();
  const candidates=[center];
  for(const a of active){const dx=x-a.x,rr=r+a.r+.65;if(Math.abs(dx)<rr){const dy=Math.sqrt(rr*rr-dx*dx);candidates.push(a.y-dy,a.y+dy);}}
  candidates.sort((a,b)=>Math.abs(a-center)-Math.abs(b-center));
  let y=candidates.find(y=>active.every(a=>(x-a.x)**2+(y-a.y)**2>=(r+a.r+.6)**2));
  if(y===undefined)y=center;
  const pt={x,y,r};active.push(pt);placed.set(s.id,pt);
 }
 return placed;
}
let cached;
export function buildLayouts(){
 if(cached)return cached;
 const all=beeswarm(songs),serenade=beeswarm(songs.filter(s=>s.category===1)),heartache=beeswarm(songs.filter(s=>s.category===2));
 const stack=new Map();
 for(const [i,s] of songs.entries()){
  const c=categoryIndex.get(s.category),x=yearX(s.year),top=BOTTOM-H*connectedShare(x,c),bottom=BOTTOM-H*connectedShare(x,c-1);
  const r=Math.min(Math.sqrt(s.weeks)*.85,Math.max(.45,(bottom-top)*.38));
  const y=top+r+Math.max(0,bottom-top-r*2)*random(i+1);
  stack.set(s.id,{x,y,r});
 }
 cached={all,serenade,heartache,stack};return cached;
}
const states=[
 {name:'从熟悉的歌开始',title:'听到这些歌，你会叫它们<em>“情歌”。</em>',description:'图中标出的几首歌，都在直接向爱人表达爱意。每个圆是一首 Billboard 前十歌曲，圆越大，在前十停留越久。'},
 {name:'不同时期的示爱歌曲',title:'这样的情歌，<em>变少了吗？</em>',description:'各年代都能找到这样的歌。但要判断它们有没有变少，还得放回同期全部热门歌曲中，看看占了多少份额。'},
 {name:'各时期的份额',title:'与 90 年代相比，<em>直接示爱的份额更小了。</em>',description:`以各期全部歌曲在前十停留的总周数为分母，直接示爱的份额从 1990 年代的 ${(100*cumulativeShare(3,0)).toFixed(1)}%，降到 2020–23 年的 ${(100*cumulativeShare(6,0)).toFixed(1)}%。但“情歌”只有示爱这一种吗？`,highlights:[{text:`${(100*cumulativeShare(3,0)).toFixed(1)}%`,color:'#ce5472'},{text:`${(100*cumulativeShare(6,0)).toFixed(1)}%`,color:'#ce5472'}]},
 {name:'另一种情歌',title:'但《Someone Like You》，<em>也在讲爱。</em>',description:'Adele 唱的是失恋与思念。这同样是关于爱的歌，却没有被算进刚才“直接示爱”的粉色部分。'},
 {name:'同一主题的不同年代',title:'不同的年代，<em>也在唱失恋。</em>',description:'从《Yesterday》到《Blinding Lights》，相隔半个多世纪。这些失恋与思念的歌，补上了刚才没有计入的另一种爱情经验。'},
 {name:'两种主题重新汇合',title:'加上失恋，<em>降幅仍然明显。</em>',description:'把失恋与思念也算进来，近年的份额仍低于 1990 年代。灰色部分里，还藏着哪些与爱有关的歌？'},
 {name:'爱的其他模样',title:'爱，还不止<em>这两种模样。</em>',description:'《Flowers》唱的是爱自己。追求、复杂的关系、告别旧爱，也让“爱情主题”的范围比直接示爱更宽。'},
 {name:'重新回答最初的问题',title:'直接示爱的份额，<em>降得更多。</em>',description:`仍比较 1990 年代与 2020–23 年：把失恋、追求和爱自己等主题也算进来，份额从 ${(100*cumulativeShare(3,6)).toFixed(1)}% 降到 ${(100*cumulativeShare(6,6)).toFixed(1)}%，降幅小得多。判断“情歌少了没有”，也要说清楚哪些歌算作情歌。`,highlights:[{text:`${(100*cumulativeShare(3,6)).toFixed(1)}%`,color:'#4d4659'},{text:`${(100*cumulativeShare(6,6)).toFixed(1)}%`,color:'#4d4659'}]}
].map(s=>({...s,value:'',unit:'',metric:''}));
export const example={
 id:'records-composition',short:'记录与构成',title:'情歌变少了，还是表达爱的方式变了？',eyebrow:'热门歌曲里的爱情 · 1958—2023',viewBox:'0 0 1440 720',duration:1900,
 theme:{paper:'#f5f2e8',ink:'#3e3d47',muted:'#83818a',accent:'#ce5472',line:'#d9d7ce',panel:'#faf8f0'},
 dataBadge:'公开歌曲数据',dataCaption:'The Pudding · 1958—2023.09',states,
 mount(svg){
  const layouts=buildLayouts(),areaGroup=el(svg,'g'),paths=categories.map((c,i)=>{const pts=[...areaBoundary(i),...areaBoundary(i-1).toReversed()];return el(areaGroup,'path',{d:pts.map((p,j)=>(j?'L':'M')+p.x+','+p.y).join(' ')+'Z',fill:c.color});});
  const grid=el(svg,'g');for(const v of [0,25,50,75,100]){const y=BOTTOM-H*v/100;line(grid,L,y,R,y,{stroke:'#ede9df','stroke-width':1,'stroke-dasharray':v===0?'0':'2 6'});txt(grid,84,y+4,v+'%',{'text-anchor':'end',style:'font-size:14px;fill:#665e66'});}
  const foreign=el(svg,'foreignObject',{x:0,y:0,width:1440,height:720,'pointer-events':'none'});
  const canvas=document.createElementNS('http://www.w3.org/1999/xhtml','canvas');canvas.width=2880;canvas.height=1440;canvas.style.cssText='width:1440px;height:720px;display:block';foreign.append(canvas);const ctx=canvas.getContext('2d');
  const axis=el(svg,'g');line(axis,L,BOTTOM+15,R,BOTTOM+15,{stroke:'#b9b8b1','stroke-width':1});
  const comparisonPeriods = [3, 6];
  const axisTicks=periods.map((period,i)=>{
   const year=1960+i*10,g=el(axis,'g');
   line(g,0,BOTTOM+14,0,BOTTOM+20,{stroke:'#bab8b1'});
   const label=txt(g,0,660,String(year),{'text-anchor':'middle',style:'font-size:17px',class:'num'});
   return {year,period,g,label,compared:comparisonPeriods.includes(i)};
  });
  const key=el(svg,'g'),legendNodes=categories.map((c,i)=>{const g=el(key,'g');el(g,'circle',{cx:112+i*164,cy:202,r:4.5,fill:c.color});txt(g,125+i*164,207,c.label,{style:'font-size:15px'});return g;});
  const noteStyle = 'font-size:15px;fill:#625d64';
  txt(svg,R,694,'5,141 首歌 · 来源：The Pudding · 数据截至 2023 年 9 月',{'text-anchor':'end',style:noteStyle});
  const pointMeasure=txt(svg,L,694,'圆面积＝前十停留周数 · 横向＝上榜时间',{style:noteStyle});
  const bandMeasure=txt(svg,L,227,'按上榜时期汇总 · 色带厚度＝该类歌曲前十周数 ÷ 同期全部歌曲前十周数',{style:noteStyle});
  const examples=[
   {title:"Can't Help Falling In Love",artist:'Elvis Presley',states:[0,1],lx:210,ly:246},
   {title:'Happy Together',artist:'The Turtles',states:[0,1],lx:510,ly:242},
   {title:'Perfect',artist:'Ed Sheeran',states:[0,1],lx:1100,ly:242},
   {title:'Yesterday',artist:'The Beatles',states:[3,4],lx:265,ly:298},
   {title:'Someone Like You',artist:'Adele',states:[3,4],lx:880,ly:264},
   {title:'Blinding Lights',artist:'The Weeknd',states:[3,4],lx:1190,ly:350},
   {title:'Flowers',artist:'Miley Cyrus',states:[6],lx:1120,ly:276}
  ].map(f=>{const i=songs.findIndex(s=>s.title===f.title&&s.artist.includes(f.artist));if(i<0)throw new Error('Missing featured song '+f.title);const g=el(svg,'g'),leader=el(g,'path',{fill:'none',stroke:'#9b959d','stroke-width':1}),ring=el(g,'circle',{fill:'none',stroke:categories[categoryIndex.get(songs[i].category)].color,'stroke-width':1.5});txt(g,f.lx,f.ly,f.title,{'text-anchor':'middle',style:'font-size:18px;font-family:Georgia,serif;font-style:italic'});txt(g,f.lx,f.ly+21,f.artist+' · '+Math.floor(songs[i].year),{'text-anchor':'middle',style:'font-size:12px;fill:#85808b'});return {...f,i,g,leader,ring};});
  const callouts=[2,5,7].map(step=>{
   const g=el(svg,'g'),boundaries=step===7?[0,6]:[step===2?0:1];
   for(const category of boundaries)for(const period of comparisonPeriods){
    const share=cumulativeShare(period,category);
    const x=yearX(periods[period].center),y=BOTTOM-H*share;
    const value=(share*100).toFixed(1)+'%';
    const color=category===6?'#4d4659':'#b44e70';
    const callout=el(g,'g',{'data-share-category':category,'data-share-period':period});
    if(step===7&&category===0){
     line(callout,x,y-16,x,y,{stroke:color,'stroke-width':2});
     el(callout,'circle',{cx:x,cy:y,r:2.6,fill:color});
     el(callout,'rect',{x:x-48,y:y-52,width:96,height:36,rx:5,fill:'#fffaf1',stroke:color,'stroke-width':1});
     txt(callout,x,y-26,value,{'text-anchor':'middle',style:'font-size:25px;fill:#772b47',class:'num'});
    }else{
     line(callout,x,y-8,x,y+8,{stroke:color,'stroke-width':2});
     txt(callout,x,y-19,value,{'text-anchor':'middle',style:'font-size:27px;fill:'+color,class:'num'});
    }
   }
   return{step,g};
  });
  const totalGuide=el(svg,'path',{d:areaBoundary(6).map((p,i)=>(i?'L':'M')+p.x+','+p.y).join(' '),fill:'none',stroke:'#68586c','stroke-width':1.7});
  const tooltip=el(svg,'g',{visibility:'hidden','pointer-events':'none'}),tipBox=el(tooltip,'rect',{rx:4,fill:'#fffdf6',stroke:'#c9c3c7','stroke-width':1,width:370,height:63}),tipTitle=txt(tooltip,14,25,'',{style:'font-size:16px;font-family:Georgia,serif'}),tipDetail=txt(tooltip,14,47,'',{style:'font-size:11px;fill:#847c87'});
  const poses=states.map((_,step)=>{
   const nodes=new Float32Array(songs.length*7),isStack=[2,3,5,6,7].includes(step),layout=step===1?layouts.serenade:step===4?layouts.heartache:step===0?layouts.all:layouts.stack;
   for(const [i,s] of songs.entries()){
    const selected=step===1?s.category===1:step===4?s.category===2:true;
    const point=layout.get(s.id)??{...layouts.all.get(s.id),y:598+(random(i)*16),r:Math.sqrt(s.weeks)*.7};
    const ci=categoryIndex.get(s.category),reveal=s.category===1||s.category===2&&step>=3||step>=6;
    const color=reveal?colors[ci]:grey;
    let alpha=selected?1:.08;if(step===0&&!reveal)alpha=.55;
    if([2,5,7].includes(step))alpha=.025;
    if(step===3)alpha=s.category===2?1:.25;
    if(step===6)alpha=s.category!==0&&s.category>2?1:.22;
    const k=i*7;nodes.set([point.x,point.y,point.r,alpha,...color],k);
   }
   const bandColors=new Float32Array(24);categories.forEach((c,i)=>bandColors.set((c.id===1||c.id===2&&step>=5||step>=7)?colors[i]:grey,i*3));
   const labels=states.map((_,i)=>i===step?1:0);
   return {nodes,bandColors,labels,stage:step,area:[2,5,7].includes(step)?1:[3,6].includes(step)?.09:0,periodAxis:isStack?1:0,grid:[2,5,7].includes(step)?1:0,allLove:step===7?1:0};
  });
  function blend(a,b,t){
   const joining=b.area>.9&&a.area<.5,leaving=a.area>.5&&b.area<.5,move=joining?clamp01(t/.8):leaving?clamp01((t-.12)/.88):t;
   const nodes=new Float32Array(a.nodes.length);
   for(let i=0;i<nodes.length;i++){const channel=i%7;if(channel===3&&joining){const visible=Math.max(.78,a.nodes[i]);nodes[i]=t<.68?lerp(a.nodes[i],visible,clamp01(t/.22)):lerp(visible,b.nodes[i],clamp01((t-.68)/.32));}else nodes[i]=lerp(a.nodes[i],b.nodes[i],channel===3&&leaving?clamp01(t/.3):move);}
   const bandColors=a.bandColors.map((v,i)=>lerp(v,b.bandColors[i],t)),labels=a.labels.map((v,i)=>{const target=b.labels[i];return lerp(v,target,target>v?clamp01((t-.72)/.28):clamp01(t/.2));});
   return {nodes,bandColors,labels,stage:lerp(a.stage,b.stage,t),area:lerp(a.area,b.area,joining?clamp01((t-.58)/.42):leaving?clamp01(t/.35):t),periodAxis:lerp(a.periodAxis,b.periodAxis,t),grid:lerp(a.grid,b.grid,t),allLove:lerp(a.allLove,b.allLove,t)};
  }
  let lastPose=poses[0];
  function render(p){
   lastPose=p;tooltip.setAttribute('visibility','hidden');ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,1440,720);
   paths.forEach((path,i)=>{const color='rgb('+Array.from(p.bandColors.slice(i*3,i*3+3),Math.round).join(',')+')';attr(path,{fill:color,stroke:color,'stroke-width':.6,opacity:p.area*.92});});
   for(let i=0;i<songs.length;i++){const k=i*7,a=p.nodes[k+3];if(a<.01)continue;ctx.globalAlpha=a;ctx.fillStyle='rgb('+Math.round(p.nodes[k+4])+','+Math.round(p.nodes[k+5])+','+Math.round(p.nodes[k+6])+')';ctx.beginPath();ctx.arc(p.nodes[k],p.nodes[k+1],p.nodes[k+2],0,Math.PI*2);ctx.fill();}
   ctx.globalAlpha=1;attr(grid,{opacity:p.grid});
   for(const a of axisTicks){
    const x=lerp(yearX(a.year),yearX(a.period.center),p.periodAxis);
    attr(a.g,{transform:'translate('+x+',0)'});
    attr(a.label,{'font-weight':a.compared&&p.grid>.85?650:400});
    a.label.textContent=p.periodAxis>.5?a.period.label:String(a.year);
   }
   attr(totalGuide,{opacity:p.allLove});callouts.forEach(c=>attr(c.g,{opacity:p.labels[c.step]}));
   for(const f of examples){const opacity=f.states.reduce((s,i)=>s+p.labels[i],0),k=f.i*7,x=p.nodes[k],y=p.nodes[k+1],r=p.nodes[k+2];attr(f.g,{opacity});attr(f.leader,{d:'M'+f.lx+','+(f.ly+30)+' L'+f.lx+','+(f.ly+44)+' L'+x+','+(y-r-5)});attr(f.ring,{cx:x,cy:y,r:r+4});}
   legendNodes.forEach((g,i)=>{const cat=categories[i].id,opacity=cat===1?1:cat===2?clamp01((p.stage-2)):cat===0?1:clamp01(p.stage-5);attr(g,{opacity});const label=g.querySelector('text');if(cat===0)label.textContent=p.stage>=6.7?'非爱情主题':'其余歌曲';});
   const bandNoteOpacity=clamp01((p.periodAxis-.5)/.5);
   attr(pointMeasure,{opacity:1-bandNoteOpacity});attr(bandMeasure,{opacity:bandNoteOpacity});
  }
  function onMove(event){
   if(document.body.dataset.moving==='true')return;
   const pt=new DOMPoint(event.clientX,event.clientY).matrixTransform(svg.getScreenCTM().inverse());let nearest=-1,dist=11;
   for(let i=0;i<songs.length;i++){const k=i*7;if(lastPose.nodes[k+3]<.2)continue;const d=Math.hypot(pt.x-lastPose.nodes[k],pt.y-lastPose.nodes[k+1])-lastPose.nodes[k+2];if(d<dist){dist=d;nearest=i;}}
   if(nearest<0){tooltip.setAttribute('visibility','hidden');return;}
   const s=songs[nearest];tipTitle.textContent=s.title.length>43?s.title.slice(0,40)+'…':s.title;tipDetail.textContent=Math.floor(s.year)+' · '+categories[categoryIndex.get(s.category)].label+' · 前十 '+s.weeks+' 周 · '+s.artist.slice(0,30);attr(tooltip,{transform:'translate('+Math.min(1060,Math.max(70,pt.x+16))+','+Math.min(610,Math.max(205,pt.y-79))+')',visibility:'visible'});
  }
  const onLeave=()=>tooltip.setAttribute('visibility','hidden');svg.addEventListener('pointermove',onMove);svg.addEventListener('pointerleave',onLeave);
  // The second state asks a question. Findings wait for their existing on-chart evidence.
  const copyReady=(step,p)=>step===1||p.labels[step]>=.9;
  return{pose:step=>poses[step],blend,render,copyReady,dispose(){svg.removeEventListener('pointermove',onMove);svg.removeEventListener('pointerleave',onLeave);}};
 }
};
