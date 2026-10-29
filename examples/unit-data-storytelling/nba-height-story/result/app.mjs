import {SCENES,ERAS,POSITIONS,NAMES,PEOPLE,copyFor} from './scenes.mjs';
import {buildLayout,createTransition,chooseScene,xForCm,clamp} from './layout.mjs';
import {drawLogoField,logoFrame} from './cover.mjs';

const $=id=>document.getElementById(id);
const stage=$('stage'),canvas=$('units'),ctx=canvas.getContext('2d');
const svgNS='http://www.w3.org/2000/svg';
const number=(v,d=1)=>v===null?'未知':v.toFixed(d);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let data,index=0,manual=null,layout,transition,raf=0,moving=false,hover=null,pinned=null;
let width=innerWidth,height=innerHeight;
const preference=matchMedia('(prefers-reduced-motion: reduce)');
let reduced=preference.matches;
const scene=()=>manual??SCENES[index];
const activeWindow=()=>data.windows[scene().window];
const stepSize=()=>innerHeight*.82;

function svg(name,attrs={},text){
  const el=document.createElementNS(svgNS,name);
  for(const [key,value] of Object.entries(attrs))el.setAttribute(key,value);
  if(text!==undefined)el.textContent=text;
  return el;
}

function drawAxes(target){
  const reveal=clamp((1-target.coverAmount-.72)/.28);
  const root=$('axes');root.replaceChildren();root.setAttribute('viewBox',`0 0 ${width} ${height}`);
  const add=(name,attrs,text)=>root.append(svg(name,attrs,text));
  const left=target.plotLeft,right=target.plotRight;
  const xAt=cm=>xForCm(cm,target.scale);
  const clip=svg('clipPath',{id:'lane-clip'});
  clip.append(svg('rect',{x:left-2,y:target.top-30,width:width-left,height:target.bottom-target.top+70}));
  const defs=svg('defs');defs.append(clip);root.append(defs);
  for(let cm=155;cm<=235;cm+=5){
    const x=xAt(cm),opacity=(cm%10===0?1:target.detail)*reveal;
    if(x<left-.1||x>right+.1||opacity<.005)continue;
    add('line',{x1:x,x2:x,y1:target.top-4,y2:target.bottom+10,stroke:'#536662','stroke-opacity':.2*opacity,'stroke-dasharray':'2 7'});
    add('line',{x1:x,x2:x,y1:target.bottom+14,y2:target.bottom+21,stroke:'#80938d','stroke-opacity':opacity,'stroke-width':.7});
    add('text',{x,y:target.bottom+37,fill:'#a8b8b1',opacity,'text-anchor':'middle','font-size':11,'font-family':'Arial'},cm);
  }
  add('text',{x:right+25,y:target.bottom+37,fill:'#99aba5',opacity:reveal,'text-anchor':'middle','font-size':10},'cm');
  for(const lane of target.lanes){
    if(lane.opacity<.005)continue;
    const group=svg('g',{opacity:lane.opacity*reveal,'clip-path':'url(#lane-clip)'});root.append(group);
    const add=(name,attrs,text)=>group.append(svg(name,attrs,text));
    const tickY=lane.y+7;
    if(lane.shadeOpacity>.005){
      const end=xAt(81.5*2.54),a=lane.shadeOpacity;
      add('rect',{x:left,y:lane.top,width:end-left,height:lane.y-lane.top,fill:'#ddad73','fill-opacity':.045*a});
      add('line',{x1:end,x2:end,y1:lane.top+8,y2:lane.y,stroke:'#e6cd95','stroke-opacity':.5*a,'stroke-dasharray':'2 4'});
      add('text',{x:left+10,y:lane.top+20,fill:'#d3b68d',opacity:a,'font-size':10},'≤205.74 cm');
      add('text',{x:left+10,y:lane.top+43,fill:'#f0d19c',opacity:a,'font-size':18,'font-family':'Georgia'},`${(lane.smallShare*100).toFixed(1)}%`);
      if(!target.scene.comparison)add('text',{x:left+10,y:lane.top+60,fill:'#adad95',opacity:a,'font-size':9},lane.weighted?'该位置群体的出场分钟':'该位置群体的人数');
    }
    add('line',{x1:left,x2:right,y1:tickY,y2:tickY,stroke:'#657972','stroke-opacity':.28,'stroke-width':.6});
    add('line',{x1:lane.meanX,x2:lane.meanX,y1:tickY,y2:tickY+9,stroke:lane.color,'stroke-width':1.5});
    add('text',{x:right+17,y:lane.y-4,fill:lane.color,'font-size':17,'font-family':'Georgia'},number(lane.mean));
    add('text',{x:right+17,y:lane.y+12,fill:'#82968e','font-size':8},lane.weighted?'分钟加权':'平均身高');
    if(lane.referenceMean!==null&&lane.referenceOpacity>.005){
      const a=lane.referenceOpacity,delta=lane.mean-lane.referenceMean;
      add('line',{x1:lane.referenceX,x2:lane.referenceX,y1:tickY-2,y2:tickY+14,stroke:'#8b9b91',opacity:a,'stroke-width':.8,'stroke-dasharray':'2 2'});
      add('line',{x1:lane.referenceX,x2:lane.meanX,y1:tickY+14,y2:tickY+14,stroke:lane.color,opacity:a*.75,'stroke-width':.8});
      add('text',{x:Math.max(lane.referenceX,lane.meanX)+8,y:tickY+18,fill:'#b8c5b9',opacity:a,'font-size':10},Math.abs(delta)<.05?'近乎持平':`${delta>0?'+':''}${delta.toFixed(1)} cm`);
    }
    if(lane.honorOpacity>.005&&lane.starMean!==null){
      const meanX=xAt(lane.plainMean),starX=xAt(lane.starMean),a=lane.honorOpacity;
      add('line',{x1:meanX,x2:meanX,y1:tickY+10,y2:tickY+20,stroke:'#718880',opacity:a,'stroke-dasharray':'2 2'});
      add('line',{x1:meanX,x2:starX,y1:tickY+20,y2:tickY+20,stroke:'#f5d58b',opacity:a,'stroke-width':.8});
      add('line',{x1:starX,x2:starX,y1:tickY+16,y2:tickY+24,stroke:'#f5d58b',opacity:a,'stroke-width':1.5});
      const delta=lane.starMean-lane.plainMean;
      add('text',{x:Math.max(meanX,starX)+8,y:tickY+24,fill:'#e6cd95',opacity:a,'font-size':9},`明星 ${delta>0?'+':''}${delta.toFixed(1)} cm`);
    }
  }
  if(target.scene.honors&&reveal>0){
    for(const id of ['gilgesh01','jokicni01','curryst01']){
      const node=[...target.nodes.values()].find(n=>n.id===id&&(n.star||n.mvp));
      if(!node)continue;
      const x=node.x+12,y=node.y-22;
      add('path',{d:`M${node.x} ${node.y-8}L${node.x} ${y}L${x-5} ${y}`,stroke:'#e3c47f','stroke-width':.7,fill:'none',opacity:reveal});
      add('text',{x,y:y+3,fill:'#f3d699','font-size':10,opacity:reveal},`${node.mvp?'MVP · ':''}${PEOPLE[id].short}`);
    }
  }
  const usedLanes=new Map();
  for(const [id,pos] of target.scene.heroes??[]){
    const node=target.nodes.get(`${id}:${pos}`);
    if(!node||node.a<.4||reveal<=0)continue;
    const slot=usedLanes.get(pos)??0;usedLanes.set(pos,slot+1);
    const x=clamp(node.x+12,left+10,right-52),y=Math.max(target.top+8,node.y-23-slot*19);
    add('path',{d:`M${node.x} ${node.y-5}L${node.x} ${y}L${x-4} ${y}`,stroke:'#d7bd84','stroke-width':.7,fill:'none',opacity:node.a*reveal});
    add('text',{x,y:y+3,fill:'#f3d699','font-size':10,opacity:node.a*reveal},PEOPLE[id].short);
  }
  $('lane-labels').replaceChildren(...target.lanes.filter(l=>l.opacity>.005).map(lane=>{
    const el=document.createElement('div');el.className='lane-label';el.style.top=`${lane.y}px`;el.style.left=`${left-67}px`;el.style.opacity=lane.opacity*reveal;
    el.innerHTML=`<b style="color:${lane.color}">${lane.pos}</b>${lane.period?`<span class="lane-period">${lane.period}</span>`:lane.name}<small>${lane.n} 人${target.scene.honors?' · '+lane.stars+' 明星':''}</small>`;
    return el;
  }));
}

function renderCanvas(current){
  ctx.clearRect(0,0,width,height);
  drawLogoField(ctx,width,height,current.coverAmount);
  ctx.save();ctx.beginPath();ctx.rect(current.plotLeft-2,current.top-12,current.plotRight-current.plotLeft+4,current.bottom-current.top+24);ctx.clip();
  for(const node of current.nodes.values()){
    if(node.a<.005||node.r<=0)continue;
    const selected=pinned===node.id||hover?.id===node.id;
    ctx.globalAlpha = node.a * (pinned && !selected ? 0.48 : 1);
    ctx.fillStyle=selected?'#fff4cc':node.color;
    ctx.beginPath();ctx.arc(node.x,node.y,node.r,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;
  ctx.restore();
}

function frame(now){
  raf=0;
  const sample=transition.sample(now);layout=sample.layout;moving=sample.moving;
  const coverAmount=layout.coverAmount;
  stage.style.setProperty('--data-reveal',clamp((1-coverAmount-.72)/.28));
  stage.style.setProperty('--cover-reveal',clamp((coverAmount-.68)/.32));
  $('cover-copy').hidden=coverAmount<=.001;
  $('cover-caption').hidden=coverAmount<=.001;
  $('editorial').hidden=coverAmount>=.999;
  renderCanvas(layout);drawAxes(layout);
  stage.classList.toggle('transitioning',moving);
  stage.dataset.moving=String(moving);
  if(moving)raf=requestAnimationFrame(frame);
}
function requestFrame(){if(!raf)raf=requestAnimationFrame(frame);}

function renderCopy(current){
  const window=data.windows[current.window],copy=copyFor(current,window);
  stage.dataset.cover=String(Boolean(current.cover));stage.dataset.explore=String(Boolean(current.explore));
  const emblem=logoFrame(width,height);
  $('cover-caption').style.left=`${emblem.x+emblem.width/2}px`;
  $('cover-caption').style.top=`${emblem.y+emblem.height+25}px`;
  $('explore-inline').hidden=!current.explore;
  for(const [id,key] of [['eyebrow','eyebrow'],['title','title'],['body-copy','body'],['metric','metric'],['metric-unit','unit'],['metric-caption','caption']])$(id).textContent=copy[key]??'';
  $('next').innerHTML=escape(current.explore?'回到开头':copy.next??'继续阅读')+' <span>↓</span>';
  $('window-label').textContent=current.comparison?'2000s / 2020s':window.kind==='decade'?window.value+' 年代':window.label;
  $('window-kind').textContent=window.kind==='decade'?'NBA · 十年群像':'NBA · 常规赛';
  $('reference-label').textContent=current.reference?'比较基准 · '+data.windows[current.reference].label:'';
  $('window-range').textContent=current.comparison?'十季 / 六季 · 各自年代内去重':window.kind==='decade'?window.range+` · ${window.seasons} 季`:'赛季';
  $('encoding').textContent=current.mode==='people'?'一人一个等大单元':'一人一个单元 · 面积 ∝ 该季出场时间份额';
  $('sample-note').textContent=window.kind==='decade'?'年代内一人一次 · 多位置分别纳入':'当季一人一次 · 多位置分别纳入';
  $('chart-key').innerHTML=current.note?escape(current.note):current.honors?'<span class="honor-key">● 当期全明星</span><span>明星身高差：与同位置全部球员等权比较。</span>':current.era?'<span>标注人物是年代线索，不代表整个位置。</span>':current.reference?'<span>虚线保留比较时期的平均身高。</span>':'';
  const memory=current.era??current;
  $('era-memory').hidden=!memory.memory;
  $('memory-link').textContent=memory.memory?memory.memory+' ↗':'';
  if(memory.source)$('memory-link').href=memory.source;else $('memory-link').removeAttribute('href');
  const missing=window.rows.filter(r=>!r.pos.length||r.h===null).length;
  $('chart-description').textContent=`${window.label}，${window.stats.ALL.n} 名球员，${missing} 名缺位置或身高资料。当前展示 ${current.positions.map(p=>NAMES[p]).join('、')}。${current.positions.map(p=>`${NAMES[p]}${window.stats[p].heightN}人，${current.mode==='minutes'?'分钟加权':''}平均身高${number(current.mode==='minutes'?window.stats[p].weighted:window.stats[p].mean)}厘米`).join('；')}。${current.comparison?'同时对比 2000s 的 PF 和 C，较矮人数占比分别 59.0% 与 19.2%；2020s 为 78.5% 与 28.5%。':''}通过查找球员按钮可使用键盘查看记录。`;
  canvas.setAttribute('aria-label',current.cover?'球员单元组成 NBA 标志的运球剪影，进入后展开为身高分布':'按身高和位置排列的球员，每个单元代表一名球员');
  if(current.cover)$('chart-description').textContent='NBA 标志的点阵构图，尚不按身高排列。人物部分由第一年代的球员与位置记录组成，红蓝背景为装饰。进入后，人物单元沿原有身份展开到五个位置的身高分布。';
  const featured=$('featured'),person=current.person?PEOPLE[current.person]:null;
  const row=person?window.rows.find(r=>r.id===current.person):null;
  featured.hidden=!row;
  if(row){
    featured.innerHTML=`${person.image?`<img src="${person.image}" alt="">`:''}<span><b>${escape(person.name)} <i>↗</i></b>${number(row.h*2.54)} cm · ${row.pos.join(' / ')} · 查看当期记录</span>`;
    featured.dataset.player=current.person;
  }
  $('people-mode').classList.toggle('selected',current.mode==='people');
  $('minutes-mode').classList.toggle('selected',current.mode==='minutes');
  $('minutes-mode').disabled=window.kind!=='season';
  $('minutes-mode').title=window.kind==='season'?'按该季出场分钟份额显示面积':'时间视角请先选择一个赛季';
  $('honors-mode').classList.toggle('selected',Boolean(current.honors));
  $('honors-mode').setAttribute('aria-pressed',String(Boolean(current.honors)));
  $('motion').setAttribute('aria-pressed',String(reduced));
  $('motion').textContent=reduced?'恢复动态':'减弱动态';
  renderTimeline(window);
  renderInlineControls(window,current);
  stage.dataset.scene=current.id;
  stage.dataset.window=current.window;
  stage.dataset.mode=current.mode;
}

function renderInlineControls(window,current){
  const windows=Object.entries(data.windows).filter(([,w])=>w.kind===window.kind);
  $('window-select').replaceChildren(...windows.map(([key,w])=>{
    const option=document.createElement('option');option.value=key;option.textContent=w.kind==='decade'?w.value+' 年代':w.label;option.selected=key===current.window;return option;
  }));
  for(const button of document.querySelectorAll('[data-grain]'))button.classList.toggle('selected',button.dataset.grain===window.kind);
  for(const button of document.querySelectorAll('[data-mode]')){button.classList.toggle('selected',button.dataset.mode===current.mode);button.disabled=button.dataset.mode==='minutes'&&window.kind==='decade';}
  $('inline-honors').classList.toggle('selected',Boolean(current.honors));$('inline-honors').setAttribute('aria-pressed',String(Boolean(current.honors)));
  $('previous-window').disabled=current.window===windows[0][0];$('following-window').disabled=current.window===windows.at(-1)[0];
}

function renderTimeline(window){
  for(const kind of ['decade','season'])$(kind+'-kind').classList.toggle('selected',window.kind===kind);
  const windows=Object.entries(data.windows).filter(([,w])=>w.kind===window.kind);
  $('timeline').replaceChildren(...windows.map(([key,w])=>{
    const el=document.createElement('button');el.type='button';el.textContent=w.label;el.dataset.window=key;
    el.classList.toggle('selected',key===scene().window);el.classList.toggle('anchor',key==='s2015');
    el.setAttribute('aria-label',`查看 ${w.label}${w.kind==='season'?' 赛季':''}`);
    if(key===scene().window)el.setAttribute('aria-current','true');
    return el;
  }));

}

function activate(immediate=false){
  hover=null;pinned=null;$('tooltip').hidden=true;$('player-card').hidden=true;
  const current=scene();
  const next=buildLayout(data,current,width,height);
  renderCopy(current);
  moving=!(immediate||reduced);
  stage.dataset.moving=String(moving);
  stage.classList.toggle('transitioning',moving);
  transition.target(next,performance.now(),immediate||reduced);requestFrame();
}

function explore(overrides){
  manual={...scene(),...overrides,id:'explore',explore:true,cover:false,comparison:null,reference:null,person:null,heroes:[],era:null,memory:null,source:null,note:null,shade:false,summary:false};
  if(data.windows[manual.window].kind==='decade')manual.mode='people';
  activate();
}

function onScroll(){
  const next=chooseScene(scrollY/stepSize(),index,SCENES.length);
  if(next!==index){index=next;manual=null;activate();}
}

function resize(){
  width=stage.clientWidth;height=stage.clientHeight;
  const dpr=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  $('scroll-space').style.height=`${height+(SCENES.length-.6)*stepSize()}px`;
  activate(true);
}

function jump(next){
  if(scene().explore&&next>index){manual=null;index=0;scrollTo(0,0);activate();return;}
  if(manual){manual=null;activate();return;}
  scrollTo({top:(Math.max(0,next)+.12)*stepSize(),behavior:'instant'});
  onScroll();
}

function hit(x,y){
  let closest=null,best=Infinity;
  for(const n of layout.nodes.values()){
    if(n.a<.05)continue;
    const distance=Math.hypot(n.x-x,n.y-y);
    if(distance<Math.max(n.r+3,5)&&distance<best){best=distance;closest=n;}
  }
  return closest;
}

function showCard(id,node){
  const window=data.windows[node?.window??scene().window],row=window.rows.find(r=>r.id===id);
  if(!row)return;
  const person=PEOPLE[id],name=data.players[id].name;
  pinned=id;hover=null;$('tooltip').hidden=true;
  const time=window.kind==='season'?`<div><span>该季总分钟</span><strong>${row.mp.toLocaleString()}</strong></div><div><span>每次出场</span><strong>${number(row.mp/row.g)} <small>分钟</small></strong></div>`:`<div><span>年代内活跃</span><strong>${row.years.length} <small>季</small></strong></div><div><span>全明星入选</span><strong>${row.starYears.length} <small>次</small></strong></div>`;
  $('card-content').innerHTML=`${person?.image?`<img class="card-portrait" src="${person.image}" alt="${escape(person.name)}">`:''}<div class="card-name">${escape(name)}</div>${person?`<div class="card-chinese">${escape(person.name)}</div>`:''}<p class="card-period">${escape(window.label)} · ${row.pos.join(' / ')||'位置未知'}</p><div class="card-grid"><div><span>档案身高</span><strong>${row.h===null?'未知':number(row.h*2.54)} <small>cm</small></strong></div><div><span>列示位置</span><strong style="font-size:19px">${row.pos.join(' / ')||'未知'}</strong></div>${time}</div>${row.star?`<span class="card-badge">✦ ${window.kind==='season'?'当季全明星':'年代内全明星'}</span>`:''}${row.mvp?`<span class="card-badge">${window.kind==='season'?'当季':'年代内'} MVP</span>`:''}<p class="card-note">${row.pos.length>1?'同一个人会出现在对应的每一行，其他位置副本同时高亮。':'位置来自该时间窗口的资料记录。'}${window.kind==='season'?'分钟是此人的全部出场时间，不区分实际场上位置。':''}</p><span class="card-source">Kaggle NBA Stats v56${person?.image?' · NBA 头像仅用于识别':''}</span>`;
  const card=$('player-card');card.hidden=false;
  const x=node?.x??width-360,y=node?.y??height*.45;
  card.style.left=`${clamp(x>width*.6?x-330:x+24,25,width-335)}px`;
  card.style.top=`${clamp(y-150,100,height-card.offsetHeight-60)}px`;
  renderCanvas(layout);
}

function fillSearch(){
  const window=activeWindow(),query=$('search-input').value.toLocaleLowerCase().trim();
  $('search-context').textContent=`${window.label} · ${window.stats.ALL.n} 位球员 · ${query?'搜索结果':'先显示本窗口的全明星，可搜索全部球员'}`;
  const rows=window.rows.filter(r=>query?`${data.players[r.id].name} ${PEOPLE[r.id]?.name??''}`.toLocaleLowerCase().includes(query):r.star)
    .sort((a,b)=>data.players[a.id].name.localeCompare(data.players[b.id].name)).slice(0,100);
  $('search-results').replaceChildren(...rows.map(row=>{
    const el=document.createElement('button');el.type='button';el.dataset.player=row.id;
    el.innerHTML=`<span>${escape(data.players[row.id].name)}${row.mvp?' · MVP':row.star?' · ✦':''}</span><small>${row.h===null?'身高未知':number(row.h*2.54)+' cm'} · ${row.pos.join('/')||'位置未知'}</small>`;
    return el;
  }));
  if(!rows.length)$('search-results').textContent='这个时间窗口中没有匹配的球员。';
}

function changeGrain(kind){
  const w=activeWindow();
  const window=kind==='decade'?'d'+(w.kind==='decade'?w.value:Math.floor((w.value-1)/10)*10):w.kind==='season'?scene().window:'s'+Math.min(w.value+10,2026);
  explore({window,positions:POSITIONS});
}
function openSearch(){
  $('explore').close();$('search-input').value='';fillSearch();$('search').showModal();$('search-input').focus();
}

function bind(){
  addEventListener('scroll',onScroll,{passive:true});
  addEventListener('resize',resize);
  $('next').addEventListener('click',()=>jump(index+1));
  $('begin').addEventListener('click',()=>jump(1));
  document.querySelector('.brand').addEventListener('click',event=>{event.preventDefault();manual=null;scrollTo(0,0);if(index===0)activate();});
  $('motion').addEventListener('click',()=>{reduced=!reduced;activate(true);});
  preference.addEventListener('change',event=>{reduced=event.matches;activate(true);});
  $('sources-open').addEventListener('click',()=>$('sources').showModal());
  $('explore-open').addEventListener('click',()=>$('explore').showModal());
  $('search-open').addEventListener('click',openSearch);
  $('inline-search').addEventListener('click',openSearch);
  for(const button of document.querySelectorAll('[data-close]'))button.addEventListener('click',()=>$(button.dataset.close).close());
  for(const dialog of document.querySelectorAll('dialog'))dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  $('timeline').addEventListener('click',event=>{const button=event.target.closest('[data-window]');if(button){explore({window:button.dataset.window,positions:POSITIONS});$('explore').close();}});
  for(const kind of ['decade','season'])$(kind+'-kind').addEventListener('click',()=>changeGrain(kind));
  for(const button of document.querySelectorAll('[data-grain]'))button.addEventListener('click',()=>changeGrain(button.dataset.grain));
  for(const button of document.querySelectorAll('[data-mode]'))button.addEventListener('click',()=>explore({mode:button.dataset.mode}));
  $('inline-honors').addEventListener('click',()=>explore({honors:!scene().honors}));
  $('window-select').addEventListener('change',event=>explore({window:event.target.value}));
  for(const [id,delta] of [['previous-window',-1],['following-window',1]])$(id).addEventListener('click',()=>{
    const keys=Object.keys(data.windows).filter(key=>data.windows[key].kind===activeWindow().kind);
    const target=keys[keys.indexOf(scene().window)+delta];if(target)explore({window:target});
  });
  $('people-mode').addEventListener('click',()=>{explore({mode:'people'});$('explore').close();});
  $('minutes-mode').addEventListener('click',()=>{explore({mode:'minutes'});$('explore').close();});
  $('honors-mode').addEventListener('click',()=>{explore({honors:!scene().honors});$('explore').close();});
  $('featured').addEventListener('click',event=>{const id=event.currentTarget.dataset.player;showCard(id,[...layout.nodes.values()].find(n=>n.id===id));});
  $('card-close').addEventListener('click',()=>{pinned=null;$('player-card').hidden=true;renderCanvas(layout);});
  $('search-input').addEventListener('input',fillSearch);
  $('search-results').addEventListener('click',event=>{const button=event.target.closest('[data-player]');if(button){$('search').close();showCard(button.dataset.player,[...layout.nodes.values()].find(n=>n.id===button.dataset.player));}});
  canvas.addEventListener('pointermove',event=>{
    if(moving||scene().cover)return;
    const r=canvas.getBoundingClientRect(),x=event.clientX-r.left,y=event.clientY-r.top;
    const n=hit(x,y);hover=n;canvas.style.cursor=n?'pointer':'default';
    const tip=$('tooltip');tip.hidden=!n||Boolean(pinned);
    if(n&&!pinned){tip.innerHTML=`<b>${escape(data.players[n.id].name)}</b>${data.windows[n.window].label} · ${number(n.h*2.54)} cm · ${n.pos}${scene().mode==='minutes'?' · '+n.row.mp.toLocaleString()+' 分钟':''}${n.mvp?' · MVP':n.star?' · 全明星':''}`;tip.style.left=`${Math.min(width-tip.offsetWidth-15,x+15)}px`;tip.style.top=`${Math.max(90,y-tip.offsetHeight-14)}px`;}
    renderCanvas(layout);
  });
  canvas.addEventListener('pointerleave',()=>{hover=null;$('tooltip').hidden=true;if(layout)renderCanvas(layout);});
  canvas.addEventListener('click',event=>{if(moving||scene().cover)return;const r=canvas.getBoundingClientRect(),node=hit(event.clientX-r.left,event.clientY-r.top);if(node)showCard(node.id,node);});
  addEventListener('keydown',event=>{
    if(event.target.closest('input,textarea,dialog')||document.querySelector('dialog[open]'))return;
    if(event.key==='ArrowRight'){event.preventDefault();jump(index+1);}
    if(event.key==='ArrowLeft'){event.preventDefault();jump(index-1);}
    if(event.key==='Escape'){pinned=null;$('player-card').hidden=true;renderCanvas(layout);}
  });
}

async function start(){
  const response=await fetch('data.json');
  if(!response.ok)throw new Error(`数据加载失败：HTTP ${response.status}`);
  data=await response.json();
  $('history-sources').replaceChildren(...[...ERAS.map(era=>({label:era.year+'s · '+era.memory,url:era.source})),{label:'格林 · 2015 总决赛第六场官方记录',url:'https://statsdmz.nba.com/pdfs/20150616/20150616_GSWCLE_book.pdf'}].map(source=>{
    const li=document.createElement('li'),a=document.createElement('a');a.href=source.url;a.target='_blank';a.rel='noreferrer';a.textContent=source.label+' ↗';li.append(a);return li;
  }));
  width=stage.clientWidth;height=stage.clientHeight;
  const first=buildLayout(data,scene(),width,height);transition=createTransition(first);
  bind();resize();$('loading').hidden=true;onScroll();
}
start().catch(error=>{console.error(error);$('loading').textContent='暂时无法载入球员数据。'+error.message;});
