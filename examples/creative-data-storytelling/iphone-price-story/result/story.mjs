import { clamp, mix, ease, nodeKey, priceY, capacityComparison } from './layout.mjs';
import { createSceneModel, chapterKinds, chapterWeights, storyProgress, storyPosition } from './scene-model.mjs';
import {beats,selectBeat,createTransition} from './motion.mjs';
const $ = s => document.querySelector(s);
const NS = 'http://www.w3.org/2000/svg';
const money = n => Math.round(n).toLocaleString('en-US');
const blue = '#344bd5', orange = '#bf6848', grey = '#a1aa9b';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const el = (name, attrs = {}, parent) => {
  const e = document.createElementNS(NS, name);
  for (const [k,v] of Object.entries(attrs)) e.setAttribute(k,v);
  parent?.append(e); return e;
};
const text = (parent, x, y, value, className = 'annotation', anchor = 'middle') => {
  const e = el('text', {x,y,class:className,'text-anchor':anchor}, parent); e.textContent = value; return e;
};
const load = async url => { const r = await fetch(url); if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`); return r.json(); };

try {
const [data, manifest] = await Promise.all([load('./data.json'), load('./assets.json')]);
const models = new Map(data.models.map(m => [m.id,m]));
const sources = new Map(data.sources.map(s => [s.id,s]));
const sceneModel=createSceneModel(data);
const {nodes,launchNodes,byKey}=sceneModel;
const assets = new Map(manifest.assets.map(a => [a.modelId,a]));
const event = (id,cap) => data.events.find(e => e.modelId===id && e.storageLabel===cap);
const N = (id, cap) => nodeKey(`iphone-${id}`,cap);
const claims = data.claims;
const comparisonRecords = {
  oldEntry: byKey.get(N('16-pro','128GB')),
  oldMatched: byKey.get(N('16-pro','256GB')),
  newEntry: byKey.get(N('17-pro','256GB')),
};
const chapterDrafts = [
  {nav:'记忆',year:'2010',kicker:'从一部熟悉的手机开始',title:'一部 iPhone，<br>几种<span>价格？</span>',description:'还记得第一部 iPhone 的价签吗？<br>从 iPhone 4 开始，把十多年的选择，<br>重新放在同一个坐标里。',stat:`${money(claims.opening.first)}<em>元</em>`,statLabel:'iPhone 4 · 16GB · 中国大陆首发价',note:'这里比较官方含税标价，不是到手价。<br>一段购买记忆，是问题的起点。',plot:'从一个价签，展开十六年',caption:'',source:['a4','spec-iphone-4'],next:'展开十六年的价签'},
  {nav:'展开',year:'2010—26',kicker:'先看见价格的形状',title:'记忆里的五千元，<br>后来去了<span>哪里？</span>',description:'iPhone 4 的起价是 4,999 元。<br>十五年后，iPhone 17 首发起价 5,999 元。<br>但更高的档位，已把价格空间拉开。',stat:`+${money(claims.opening.latestCoreLaunch-claims.opening.first)}<em>元</em>`,statLabel:'4 → 17 的首发起价差；容量从 16GB 变为 256GB',note:'起售价是一种选择门槛，不是恒定产品的价格指数。<br>这里暂不把不同档位连成一条“涨价线”。',plot:'各型号起售价 · 按产品代际年份排列',caption:'一点代表一款型号；同一年可以有多款型号。' ,source:['a4','p17','p18'],next:'把容量先对齐'},
  {nav:'容量',year:'2024—25',kicker:'第一把尺 · 容量',title:'先对齐容量，<br>再谈<span>涨价。</span>',description:'16 Pro 可以从 128GB 买起，17 Pro 从 256GB 起。<br>入门贵了 1,000 元。<br>可如果都买 256GB，首发价其实相同。',stat:`${money(claims.capacity.newEntry-claims.capacity.oldMatched)}<em>元</em>`,statLabel:'16 Pro → 17 Pro · 同为 256GB 的首发价差',note:'128GB 这个更低的选项消失了。<br>容量对齐，只排除了一个变量；两代硬件仍然不同。',plot:'首发价对齐 · 同容量，不等于同硬件',caption:'128GB 的入口退场，256GB 的价点对齐。',source:['p16','p17','spec-iphone-16-pro','spec-iphone-17-pro'],next:'回到档位分岔的那年'},
  {nav:'分层',year:'2017',kicker:'第二把尺 · 产品档位',title:'更高的一档，<br><span>出现了。</span>',description:'同一年，同为 256GB，同用 A11。<br>8、8 Plus 与 X，站在三个价格台阶上。<br>X 的到来，让“买最新”有了更贵的选项。',stat:`+${money(claims.tiers.top-claims.tiers.base)}<em>元</em>`,statLabel:'2017 年 · iPhone 8 → X · 同为 256GB',note:'屏幕、相机与交互方式一起改变。<br>我们看得到升级与价差，但不能给每个部件分摊零售价。',plot:'同年 · 同容量 · 不同产品位置',caption:'LCD / 单摄 → LCD / 双摄 → OLED / 双摄 / Face ID',source:['p8','px','spec-iphone-8','spec-iphone-8-plus','spec-iphone-x','ti2017cost'],next:'升级一定更贵吗'},
  {nav:'反例',year:'2019—20',kicker:'一次不能被忽略的反例',title:'都升级，<br>却不是都<span>涨价。</span>',description:'2020 年，12 与 12 Pro 都来到 A14 和 5G。<br>在 256GB 这把相同的尺上，<br>普通版上行，Pro 却往下走。',duet:true,statLabel:'11 → 12 / 11 Pro → 12 Pro · 同为 256GB',note:'普通版还从 LCD 换成 OLED。<br>升级是事实；“升级必然带来涨价”却解释不了这一年。',plot:'两次换代，两种定价方向 · 均为 256GB',caption:'',source:['p11','p11max','p12launch','a12','a12pro','cp12bom'],next:'把手机留在原地'},
  {nav:'同款',year:'2026',kicker:'第三把尺 · 同款，另一个时间',title:'手机没换，<br><span>价签动了。</span>',description:'这次不用跨代比较。<br>2026 年 9 月，仍在售的 iPhone 17，<br>256GB 官方标价从 5,999 调到 6,799 元。',stat:`+${money(event('iphone-17','256GB').afterCNY-event('iphone-17','256GB').beforeCNY)}<em>元</em>`,statLabel:'同一型号 · 同一容量 · 官方后续调价',note:'这是一项后续调价，不能覆写 2025 年首发价。<br>旧价点留在原处，新价签向上移动。',plot:'iPhone 17 · 256GB · 2026.09.10 调价',caption:'型号不变。容量不变。价签变了。',source:['reprice26','a17shop','p17'],next:'不同容量，涨得一样吗'},
  {nav:'梯度',year:'2026',kicker:'再看容量之间的价格距离',title:'容量越高，<br>这次涨得越<span>多？</span>',description:'看同一款 iPhone Air：<br>256GB 和 512GB 都上调 800 元，<br>1TB 却上调了 2,300 元。',stat:'+1,500<em>元</em>',statLabel:'512GB → 1TB 的加价，由 2,000 元扩大到 3,500 元',note:'Apple 披露了 NAND / DRAM 成本压力及调价行动。<br>这支持成本压力的背景，仍不足以算出这 1,500 元中有多少是存储成本。',plot:'iPhone Air · 2026.09.10 调价 · 手机仍是同一款',caption:'零售容量溢价 ≠ NAND 成本。不能把两者画成同一件事。',source:['reprice26','p17','apple26q3filing','tf26iphone','ti26memorybench'],next:'回到完整的价格版图'},
  {nav:'全貌',year:'2010—26',kicker:'带着三把尺，重新看价格',title:'变贵的，<br>是哪一种<span>选择？</span>',description:'容量门槛、产品档位、同款调价，<br>讲的是三件不同的事。<br>选一把共同的尺，再回到完整记录。',stat:'3<em>把尺</em>',statLabel:'容量 / 产品位置 / 价格发生的时间',note:'这里展示首发记录。后续调价留在详情中。<br>2026 年未确认的普通版不补点；缺少某容量就不画。',plot:'首发价格版图 · 每个价点都可以查看',caption:'',source:['a4','p17','p18','reprice26'],next:'阅读证据与边界'}
];
const chapters=[0,1,3,4,2,5,6,7].map((old,i)=>({...chapterDrafts[old],kind:chapterKinds[i]}));
Object.assign(chapters[1],{next:'看更高的价格如何出现'});
Object.assign(chapters[2],{caption:'',kicker:'2017 · 同年，同容量，不同档位',next:'换代后，都更贵了吗'});
Object.assign(chapters[3],{kicker:'2019 → 2020 · 同容量的两组换代',next:'再看最近两代 Pro'});
Object.assign(chapters[4],{kicker:'2024 → 2025 · 入门与同容量',next:'固定型号，再看价签'});
Object.assign(chapters[5],{kicker:'2026 · 同一型号，同一容量',next:'同次调价，再看容量梯度'});
Object.assign(chapters[6],{kicker:'2026 · 同次调价，不同容量',next:'把这些发现放回全景'});
Object.assign(chapters[7],{title:'价格的变化，<br>有几种<span>形状。</span>',description:'有的是更高的产品档位，<br>有的是起步配置改变，<br>有的是同款手机的标价调整。',note:'这几种变化不能相加成一部手机的成本分解。<br>回到全景，点开任一型号，可以查完整记录。',caption:'看完局部，再看全景。每个价点都有自己的比较口径。'});
let width=innerWidth,height=innerHeight,active=-1,progress=0,raf=0,copyStep='';
let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let capFilter='entry',includeOther=true;
const chart=$('#chart'), stage=$('#stage'), story=$('#scroll-story');
const svgGroups=Object.fromEntries(['grid','history','links','points','labels','annotations'].map(id=>[id,$('#'+id)]));
const domNodes=new Map();
for(const n of nodes){
  const g=el('g',{class:'plot-point','data-key':n.id,'data-kind':n.kind,role:'button',tabindex:-1,'aria-label':`${n.model.model} ${n.storageLabel} 首发 ${n.priceCNY} 元`},svgGroups.points);
  const tooltip=el('title',{},g);tooltip.textContent=`${n.model.model} · ${n.storageLabel} · ¥${money(n.priceCNY)}`;
  el('circle',{class:'halo',r:14},g); el('circle',{class:'mark',r:3,fill:n.premium?orange:blue},g);
  g.addEventListener('click',()=>openModel(n.model.id));
  g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openModel(n.model.id);}});
  domNodes.set(n.id,g);
}
const deviceNodes=new Map();
const identityNodes=new Map();
for(const id of [...new Set(Object.values(sceneModel.groups).flat().map(g=>'iphone-'+g[0]))]){
  const m=models.get(id),box=document.createElement('div');
  box.className='model-identity';box.dataset.model=id;box.hidden=true;
  box.innerHTML=`<strong>${esc(m.model)}</strong><span>${m.generationYear} 年发布</span>`;
  $('#model-identities').append(box);identityNodes.set(id,box);
}
for(const a of manifest.assets){
  const box=document.createElement('div');box.className='device';box.dataset.model=a.modelId;box.style.opacity=0;
  const img=new Image();img.src=a.localPath;img.alt='';img.decoding='async';img.addEventListener('error',()=>{console.error(`Asset failed: ${a.localPath}`);});
  if(a.recommendedFrame){ const frame=document.createElement('div');frame.className='image-frame';frame.append(img);box.append(frame); }
  else box.append(img);
  $('#devices').append(box);deviceNodes.set(a.modelId,{box,img,asset:a});
}
for(let i=0;i<chapters.length;i++){
  const b=document.createElement('button');b.textContent=`0${i+1}`;b.title=chapters[i].nav;b.setAttribute('aria-label',`第 ${i+1} 段：${chapters[i].nav}`);b.addEventListener('click',()=>jump(i,i>1&&i<7?.38:.04));$('#chapter-nav').append(b);
}
function updateCopy(i,mode,localPhase,phase){
  const c=chapters[i],capacity=c.kind==='capacity'&&mode==='local';
  const comparison=capacityComparison(localPhase,comparisonRecords,reduced);
  const focusOverview=c.kind==='overview'&&phase>=.24&&phase<.90;
  const locating=mode==='locate'||mode==='enter';
  const key=[i,mode,capacity?comparison.mode:'',focusOverview,localPhase].join(':');
  if(copyStep===key)return;copyStep=key;active=i;
  stage.dataset.chapter=i;stage.dataset.kind=c.kind;stage.dataset.mode=mode;
  $('#chapter-index').textContent='0'+(i+1);$('#chapter-kicker').textContent=c.kicker;
  $('#headline').innerHTML=c.title;$('#description').innerHTML=c.description;$('#supporting-note').innerHTML=c.note;
  $('#takeaway').innerHTML=c.duet?`<div class="duet"><span class="stat">+${claims.standard2020.delta}</span><span class="stat orange">${claims.pro2020.delta}</span></div><span class="stat-label">${c.statLabel}</span>`:`<span class="stat">${c.stat}</span><span class="stat-label">${c.statLabel}</span>`;
  $('#plot-title').textContent=c.plot;$('#comparison-caption').textContent=c.caption;
  $('#next').innerHTML=c.next+'<span>↓</span>';
  $('#plot-scope').textContent=(c.kind==='reprice'||c.kind==='air')&&!locating?'中国大陆官方标价 · 人民币':'中国大陆官方首发价 · 人民币';
  $('#axis-caption').textContent=(c.kind==='reprice'||c.kind==='air')&&mode==='local'?'空心点为首发价 · 实心点为后续标价':'名义人民币 · 未作通胀调整';
  $('#explore-controls').hidden=i!==7;
  $('#comparison-steps').hidden=!capacity;
  [...$('#chapter-nav').children].forEach((b,k)=>k===i?b.setAttribute('aria-current','step'):b.removeAttribute('aria-current'));
  if(c.kind==='overview'){
    $('#headline').innerHTML=focusOverview?'十五年，起价<br>多了<span>1,000 元。</span>':'先把所有价签，<br>放进<span>一张图。</span>';
    $('#description').innerHTML=focusOverview?c.description:'从 iPhone 4 到 2026 年，<br>这里收录的每款型号，先展示一个起售价。<br>继续往下，找回记忆中的那条价格线。';
    $('#takeaway').innerHTML=focusOverview?`<span class="stat">+1,000<em>元</em></span><span class="stat-label">iPhone 4 → 17 · 最低容量首发价差</span>`:`<span class="stat">${data.models.length}<em>款</em></span><span class="stat-label">一点代表一个型号的最低容量首发价</span>`;
    $('#comparison-caption').textContent=focusOverview?'4,999 → 5,999 元；起步容量同时从 16GB 变为 256GB。':'包含常规、Pro、SE、mini、Air 等已收录型号。';
    $('#next').innerHTML=(focusOverview?c.next:'比较 iPhone 4 与 17')+'<span>↓</span>';
    $('#plot-title').textContent=focusOverview?'iPhone 4 / 17 · 同为入门选择，配置已经不同':'全景 · 各型号最低容量首发价';
  }
  if(locating&&sceneModel.groups[c.kind]){
    const groups=sceneModel.groups[c.kind];
    const headings={tiers:'2017，<br>三种<span>选择。</span>',upgrade:'来到 2020，<br>看两组<span>换代。</span>',capacity:'再看最近两代<br><span>Pro。</span>',reprice:'把 iPhone 17<br><span>留在原地。</span>',air:'同一次调价，<br>再看<span>Air。</span>'};
    $('#headline').innerHTML=headings[c.kind];
    $('#description').innerHTML={tiers:'在价格全景中找到 8、8 Plus 和 X。<br>展开各自的 256GB 配置，<br>比较同一年里的三个产品位置。',upgrade:'找到 11 / 12，以及 11 Pro / 12 Pro。<br>两组都选 256GB，<br>再看换代后的价格方向。',capacity:'找到 2024 年的 16 Pro，<br>与 2025 年的 17 Pro。<br>先比较入门选择，再对齐容量。',reprice:'这次不再跨型号、跨容量比较。<br>从全景取出 iPhone 17 的 256GB，<br>看它在 2026 年的后续标价。',air:'选中 iPhone Air，展开三个容量。<br>型号没有换，<br>同次调价对各容量的影响相同吗？'}[c.kind];
    $('#takeaway').innerHTML=`<span class="stat">${groups.length}<em>款</em></span><span class="stat-label">${c.year} · 从全景定位比较对象</span>`;
    $('#supporting-note').innerHTML='型号名称始终对应同一组价点。<br>继续滚动，展开这组比较。';
    $('#plot-title').textContent='全景定位 · '+c.year;
    $('#comparison-caption').textContent='';
    $('#next').innerHTML='展开这组比较<span>↓</span>';
  }
  if(capacity){
    const matched=comparison.mode==='matched';stage.dataset.comparison=comparison.mode;
    $('#headline').innerHTML=matched?'对齐到 256GB，<br>价差变成<span>零。</span>':'同是 Pro，<br>入门贵了<span>多少？</span>';
    $('#description').innerHTML=matched?'16 Pro 的 256GB，首发也是 8,999 元。<br>与 17 Pro 的 256GB 放在一起，<br>两个价点落在同一条水平线上。':'16 Pro 从 128GB、7,999 元买起。<br>17 Pro 从 256GB、8,999 元买起。<br>入门门槛提高，是否意味着同容量也涨价？';
    $('#takeaway').innerHTML=`<span class="stat">${comparison.delta>0?'+':''}${money(comparison.delta)}<em>元</em></span><span class="stat-label">${matched?'同为 256GB':'各款最低容量'} · 17 Pro 与 16 Pro 的首发价差</span>`;
    $('#supporting-note').innerHTML=matched?'128GB 的 7,999 元仍在原处。<br>选项减少，同容量首发价没变。<br>这不代表两代硬件相同。':'两款的起步容量不同。<br>继续往下，展开 16 Pro 的 256GB 再比较。';
    $('#comparison-caption').textContent=matched?'少了 128GB 这个入口，留下的 256GB 仍是同价。':'同样是入门选择，容量却不一样。';
    $('#next').innerHTML=(matched?c.next:'对齐到 256GB')+'<span>↓</span>';
    for(const b of document.querySelectorAll('#comparison-steps [data-comparison]'))b.setAttribute('aria-pressed',String(b.dataset.comparison===comparison.mode));
  }
  if((c.kind==='reprice'||c.kind==='air')&&mode==='local'&&localPhase===0){
    const air=c.kind==='air';
    $('#headline').innerHTML=air?'同一款 Air，<br>三个<span>容量档。</span>':'还是同一部，<br>先记住<span>旧价。</span>';
    $('#description').innerHTML=air?'256GB、512GB、1TB，<br>首发价为 7,999、9,999、11,999 元。<br>继续往下，看这次调价如何改变它们的距离。':'iPhone 17 的 256GB 首发价为 5,999 元。<br>这次固定型号与容量，<br>只看同一部手机的价签如何变化。';
    $('#takeaway').innerHTML=air?'<span class="stat">2,000<em>元</em></span><span class="stat-label">首发时 · 512GB → 1TB 的容量加价</span>':'<span class="stat">5,999<em>元</em></span><span class="stat-label">iPhone 17 · 256GB · 首发价</span>';
    $('#supporting-note').innerHTML='首发记录留在原处。<br>下一步展开独立的后续调价记录。';
    $('#plot-title').textContent=air?'iPhone Air · 三个容量的首发价格':'iPhone 17 · 256GB · 首发价格';
    $('#comparison-caption').textContent='先建立比较基准，再看后续标价。';
    $('#axis-caption').textContent='首发标价 · 名义人民币';
    $('#next').innerHTML='查看后续调价<span>↓</span>';
  }
  if(mode==='return'||mode==='release'){
    $('#plot-title').textContent='收回全景 · '+c.year+' 的比较';
    $('#comparison-caption').textContent=i===6?'所有比较，回到同一份价格记录。':'这组比较回到原来的年份；继续看下一组。';
  }
}
let selectedBeat=-1,transition=null;
function buildBeat(beat){
  return sceneModel.build(chapters[beat.chapter].kind,{width,height,capFilter,includeOther,
    phase:beat.phase,mode:beat.mode==='locate'?'global':'local',strength:1});
}
function render(now=performance.now()){
  raf=0;
  const fraction=clamp((scrollY-story.offsetTop)/(story.offsetHeight-height),0,.999999);
  progress=storyProgress(fraction);
  const nextBeat=selectBeat(progress,selectedBeat),beat=beats[nextBeat];
  if(!transition){transition=createTransition(buildBeat(beat));selectedBeat=nextBeat;}
  else if(nextBeat!==selectedBeat){
    const previous=beats[selectedBeat];
    const waypoint=previous.mode==='local'&&beat.mode==='locate'&&previous.chapter!==beat.chapter
      ?sceneModel.build('overview',{width,height,phase:0}):null;
    transition.target(buildBeat(beat),now,{immediate:reduced,waypoint});selectedBeat=nextBeat;
  }
  const {pose,moving,progress:animationProgress}=transition.sample(now);
  const i=beat.chapter,kind=chapters[i].kind;
  updateCopy(i,beat.mode,beat.phase,beat.phase);
  stage.dataset.beat=beat.id;stage.dataset.animating=String(moving);
  stage.dataset.phase=(progress-Math.floor(progress)).toFixed(3);
  stage.dataset.animationProgress=animationProgress.toFixed(3);
  $('#copy').style.opacity=moving?.6+.4*ease(animationProgress):1;
  $('#hero-caption').hidden=i!==0;
  $('#scroll-indicator').hidden=i!==0;
  $('#scroll-indicator').style.opacity=1;
  $('#hero-caption').style.opacity=1;
  const overview=Number(pose.overview);
  $('#legend').style.opacity=overview;$('#legend').setAttribute('aria-hidden',String(overview<.1));
  $('#progress').style.transform=`scaleX(${fraction})`;
  const {domain,top,bottom}=pose,current=new Map();
  for(const n of nodes){
    const state=pose.states.get(n.id),s={...state,y:priceY(state.value,domain,top,bottom)};
    if(s.value<domain[0]||s.value>domain[1])s.a=0;
    current.set(n.id,s);
    const g=domNodes.get(n.id),mark=g.querySelector('.mark');
    const accessible=n.kind==='event'?`${n.model.model} ${n.storageLabel}，${n.date} 后续标价 ${n.afterCNY} 元`:`${n.model.model} ${n.storageLabel} 首发 ${n.priceCNY} 元`;
    g.setAttribute('aria-label',accessible);g.querySelector('title').textContent=accessible;
    g.setAttribute('transform',`translate(${s.x.toFixed(2)} ${s.y.toFixed(2)})`);g.style.opacity=s.a.toFixed(3);g.style.pointerEvents=s.a>.25?'auto':'none';
    g.setAttribute('aria-hidden',String(s.a<=.25));g.setAttribute('tabindex',s.a>.25&&kind==='summary'?'0':'-1');
    mark.setAttribute('r',s.r);mark.setAttribute('fill',s.outline>.5?'#f3f1ea':n.premium?orange:blue);mark.setAttribute('stroke',s.outline>.5?(n.premium?orange:blue):'none');mark.setAttribute('stroke-width','1.5');
  }
  renderGrid(domain,top,bottom,overview,i);
  for(const [id,{box,img,asset}] of deviceNodes){
    const device=pose.devices.get(id);
    if(!device){box.style.opacity=0;continue;}
    const {h,x,bottom:bot}=device;
    let w;
    if(asset.recommendedFrame){
      const f=asset.recommendedFrame,scale=h/f.height;w=f.width*scale;
      box.firstElementChild.style.width=w+'px';img.style.width=asset.width*scale+'px';img.style.height=asset.height*scale+'px';img.style.left=-f.left*scale+'px';img.style.top=-f.top*scale+'px';
    }else w=h*asset.width/asset.height;
    box.style.width=w+'px';box.style.height=h+'px';box.style.transform=`translate(${x-w/2}px,${bot-h}px)`;box.style.opacity=device.a.toFixed(3);
  }
  for(const id of ['labels','links','annotations'])svgGroups[id].replaceChildren();
  drawDetails(pose,current,1);
  for(const [id,box] of identityNodes){
    const identity=pose.identities.get(id);
    if(!identity){box.hidden=true;continue;}
    const {x,y,a:alpha,leader,key}=identity;
    box.hidden=alpha<.01;box.style.opacity=alpha;box.style.transform=`translate(${x}px,${y}px) translateX(-50%)`;
    const point=current.get(key);
    if(leader>.01)el('path',{d:`M ${x} ${y+53} L ${x} ${y+68} L ${point.x} ${point.y-9}`,class:'identity-trace',opacity:leader*alpha},svgGroups.links);
  }
  if(moving)requestRender();
}
function drawDetails(pose,current,opacity,noteOpacity=opacity){
  for(const l of pose.lines){
    const a=current.get(l.a),b=current.get(l.b);
    const alpha=opacity*(l.opacity??1)*Math.min(a.a,b.a);if(alpha<.01)continue;
    el('path',{d:`M ${a.x} ${a.y} L ${b.x} ${b.y}`,class:'trace',stroke:l.color,opacity:alpha},svgGroups.links);
  }
  for(const l of pose.labels){
    const n=byKey.get(l.key),s=current.get(l.key),alpha=opacity*(l.opacity??1)*Math.min(1,s.a*1.7);if(alpha<.01)continue;
    const g=el('g',{opacity:alpha},svgGroups.labels),x=s.x+(l.dx??0),y=s.y+(l.dy??30),anchor=l.anchor??'middle';
    if(l.price!==false){const v=text(g,x,y,'¥'+money(s.value),'price-label',anchor);if(l.large)v.style.fontSize='34px';if(l.small)v.style.fontSize='13px';}
    if(l.name)text(g,x,y+(l.price===false?0:19),n.model.model+(l.year?' · '+n.model.generationYear:''),'model-label',anchor);
    if(l.cap)text(g,x,y+(l.name?35:19),l.capText??n.storageLabel,'capacity-label',anchor);
  }
  for(const n of pose.notes){
    const alpha=noteOpacity*(n.opacity??1);if(alpha<.01)continue;
    const e=text(svgGroups.annotations,n.x,n.y,n.text,'annotation',n.anchor??'middle');e.setAttribute('opacity',alpha);if(n.color)e.setAttribute('fill',n.color);
  }
  for(const bracket of pose.brackets){
    const alpha=opacity*bracket.opacity;if(alpha<.01)continue;
    const a=current.get(bracket.a),b=current.get(bracket.b),x=bracket.x;
    const g=el('g',{opacity:alpha},svgGroups.annotations);
    el('path',{d:`M ${a.x} ${a.y} H ${x} M ${b.x} ${b.y} H ${x}`,class:'trace',stroke:bracket.color,opacity:.5},g);
    el('path',{d:`M ${x-7} ${a.y} H ${x+7} M ${x} ${a.y} V ${b.y} M ${x-7} ${b.y} H ${x+7}`,fill:'none',stroke:bracket.color,'stroke-width':1.5},g);
    text(g,x+18,(a.y+b.y)/2+7,bracket.text,'annotation-value','start');
  }
}
function renderGrid(domain,top,bottom,overview,display){
  svgGroups.grid.replaceChildren();svgGroups.history.replaceChildren();
  const step=domain[1]-domain[0]>7000?2000:1000;
  for(let value=Math.ceil(domain[0]/step)*step;value<=domain[1];value+=step){
    const y=priceY(value,domain,top,bottom);
    el('line',{x1:width*.48,y1:y,x2:width*.95,y2:y,class:'gridline',opacity:display===0?.18:.6},svgGroups.grid);
    text(svgGroups.grid,width*.422,y+3,money(value),'grid-label','start');
  }
  text(svgGroups.grid,width*.422,top-24,'人民币 / 元','grid-label','start');
  if(overview>.01){
    for(const year of [2010,2013,2016,2019,2022,2026]){
      const x=mix(width*.46,width*.923,(year-2010)/16.5);
      const txt=text(svgGroups.grid,x,bottom+43,String(year),'year-label');txt.setAttribute('opacity',overview);
      el('line',{x1:x,y1:bottom+12,x2:x,y2:bottom+23,stroke:'#b7bfb1',opacity:overview},svgGroups.grid);
    }
  }
}
function requestRender(){if(!raf)raf=requestAnimationFrame(render);}
function jump(i,phase=.04){
  window.scrollTo({top:story.offsetTop+(story.offsetHeight-height)*storyPosition(i,phase),behavior:reduced?'instant':'smooth'});
}
function resetScene(){transition=null;requestRender();}
function resize(){width=stage.clientWidth;height=stage.clientHeight;chart.setAttribute('viewBox',`0 0 ${width} ${height}`);resetScene();}
story.style.height=(chapterWeights.reduce((a,b)=>a+b,1)*100)+'svh';
addEventListener('scroll',requestRender,{passive:true});addEventListener('resize',resize);new ResizeObserver(resize).observe(stage);
$('#restart').addEventListener('click',()=>jump(0));$('#back-top').addEventListener('click',()=>jump(0));
$('#next').addEventListener('click',()=>{
  const next=beats[selectedBeat+1];
  if(next)jump(next.chapter,next.at-next.chapter+.04);
  else $('#reading').scrollIntoView({behavior:reduced?'instant':'smooth'});
});
for(const b of document.querySelectorAll('#comparison-steps [data-comparison]'))b.addEventListener('click',()=>jump(4,b.dataset.comparison==='entry'?.36:.66));
function setMotion(){ $('#motion-toggle').setAttribute('aria-pressed',String(reduced));$('#motion-toggle').textContent=reduced?'恢复动态':'减弱动态';requestRender(); }
$('#motion-toggle').addEventListener('click',()=>{reduced=!reduced;transition=null;setMotion();});setMotion();
for(const b of document.querySelectorAll('[data-cap]'))b.addEventListener('click',()=>{capFilter=b.dataset.cap;for(const x of document.querySelectorAll('[data-cap]'))x.setAttribute('aria-pressed',String(x===b));resetScene();});
$('#show-other').addEventListener('change',e=>{includeOther=e.target.checked;resetScene();});

const dialog=$('#detail-dialog');
function show(content){$('#dialog-content').innerHTML=content;if(!dialog.open)dialog.showModal();dialog.scrollTop=0;}
$('.dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
function sourceList(ids){return `<ol class="source-list">${[...new Set(ids)].map(id=>{const s=sources.get(id);if(!s)return '';return `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a><br><small>${esc(s.publisher)}${s.publishedDate?' · '+s.publishedDate:''}${s.note?' · '+esc(s.note):''}</small></li>`;}).join('')}</ol>`;}
function openModel(id){
  const m=models.get(id),c=m.capabilities,events=data.events.filter(e=>e.modelId===id);
  const src=m.prices.flatMap(p=>[...p.sourceIds,...(p.corroboratingSourceIds??[])]);
  const a=assets.get(id);
  show(`<span class="tag">THE PRICE RECORD · ${m.generationYear}</span><h2>${esc(m.model)}</h2><div class="specs"><span>${c.display.diagonalInches} 英寸 ${esc(c.display.panelType)}</span><span>${esc(c.chip.model)}</span><span>后置 ${c.rearCamera.physicalModuleCount} 个摄影模块</span><span>中国大陆开售 ${esc(m.chinaOnSaleDate)}</span></div><h3>首发记录</h3><table><thead><tr><th>容量</th><th>人民币首发价</th></tr></thead><tbody>${m.prices.map(p=>`<tr><td>${p.storageLabel}</td><td>¥${money(p.priceCNY)}</td></tr>`).join('')}</tbody></table>${events.length?`<h3>后续官方调价 · 与首发记录分开保存</h3><table><thead><tr><th>日期</th><th>容量</th><th>调价前 → 后</th></tr></thead><tbody>${events.map(e=>`<tr><td>${e.date}</td><td>${e.storageLabel}</td><td>¥${money(e.beforeCNY)} → ¥${money(e.afterCNY)}</td></tr>`).join('')}</tbody></table>`:''}<p>官方含税、无合约标价。不同代际的相同容量不代表其他能力相同。屏幕尺寸、相机数量是规格事实，不构成综合性能评分。</p><h3>价格与规格来源</h3>${sourceList([...src,...c.display.sourceIds,...c.chip.sourceIds,...c.rearCamera.sourceIds,...events.flatMap(e=>e.sourceIds)])}${a?`<p><a href="${esc(a.sourcePage)}" target="_blank" rel="noopener noreferrer">官方产品图来源 ↗</a> · 图片只识别型号，未按机身实际尺寸缩放。</p>`:''}`);
}
function openChapter(){const c=chapters[Math.max(0,active)];show(`<span class="tag">本段依据 · 0${active+1}</span><h2>${c.title.replace('<br>','')}</h2><p>${c.description}</p><p>${c.note}</p>${active===3?'<p>Counterpoint 的 BOM 估算针对标准 iPhone 12 的地区样本。中国大陆更相关的是 sub-6 版本估算；不能把美国毫米波版本或标准版估算套到 Pro，也不能把 BOM 等同零售价。</p>':''}${active===6?'<p>Apple 2026 年 7 月提交的季度文件在公司层面确认 NAND、DRAM 等成本压力和价格行动，早于 9 月本次具体调价。它不能证明某一国行 SKU 的全部涨幅由存储造成，也不能与行业合约价预测直接换算。</p>':''}${sourceList(c.source)}`);}
$('#claim-source').addEventListener('click',openChapter);
$('#source-open').addEventListener('click',()=>show(`<span class="tag">数据、口径与素材</span><h2>让每个价签<br>都可以追溯。</h2><p>数据截至 ${data.asOf}，收录 ${data.models.length} 款已开售机型、${launchNodes.length} 个容量首发价及 ${data.events.length} 项后续调价。宣布但尚未开售的机型不进入实绩图。</p><h3>比较口径</h3><p>${esc(data.priceBasis)} 年份按产品代际；开售日期在每款详情中单独记录。起售价是该款最低容量档位，不是恒定规格商品。没有相应容量的机型不补点。</p><h3>画面如何读</h3><p>纵向位置表示人民币价格。蓝色为常规系列，橙色为 X / XS / Pro 系列。不同章节会放大局部价格范围，刻度随之连续变化。总览每款型号仅展示最低容量首发价，点击可查全部配置；2010 是 iPhone 4，2011 是 iPhone 4S 的代际年份。容量比较先选出 16 Pro 与 17 Pro，再展开 16 Pro 的 256GB 选项。每组比较先在全景定位，再展开为局部。局部只保留参与比较的价点；收回全景后，再定位下一组。后续调价拥有独立记录，不覆盖首发价。点线只连接正在比较的选项，不推算中间年份。</p><p>手机图片表示型号身份，不用面积表示价格。较新的产品图通常包含同一手机的正反两面。素材来自 Apple 官方产品页与支持文档，本地转换为 WebP，未生成替代机型。</p><h3>我们没有证明什么</h3><p>没有把规格变化解释为每个部件的人民币贡献；没有把 NAND 行业涨幅当作 iPhone 涨价幅度；没有分析通胀后价格、收入负担或实际销量加权均价。</p><p><a href="data.json" target="_blank">完整数据 JSON ↗</a> · <a href="assets.json" target="_blank">素材出处清单 ↗</a></p>${sourceList(['a4','p8','px','p12launch','p17','p18','reprice26','apple26q3filing'])}`));
function openTable(){
  show(`<span class="tag">${launchNodes.length} 个首发价 · ${data.asOf}</span><h2>完整的价格记录</h2><label for="table-search">按机型或年份查找</label><input class="table-search" id="table-search" placeholder="例如：iPhone 12、2020、Pro"><div id="price-table"></div><p>此表仅列首发价；后续调价在机型详情与 data.json 中单独保存。</p>`);
  const fill=()=>{const q=$('#table-search').value.trim().toLowerCase();const list=data.models.filter(m=>`${m.model} ${m.generationYear}`.toLowerCase().includes(q));$('#price-table').innerHTML=`<table><thead><tr><th>代际</th><th>机型</th><th>容量 / 人民币首发价</th><th>证据</th></tr></thead><tbody>${list.map(m=>`<tr><td>${m.generationYear}</td><td>${esc(m.model)}</td><td>${m.prices.map(p=>`${p.storageLabel} · ¥${money(p.priceCNY)}`).join('<br>')}</td><td><a href="${esc(sources.get(m.prices[0].sourceIds[0]).url)}" target="_blank" rel="noopener noreferrer">来源 ↗</a></td></tr>`).join('')}</tbody></table>${list.length?'':'<p>没有匹配的机型。</p>'}`;};$('#table-search').addEventListener('input',fill);fill();
}
$('#table-open').addEventListener('click',openTable);
$('#reading-sections').className='reading-grid';
$('#reading-sections').innerHTML=[
  ['01 / POSITION','产品多了一层选择。','2017 年，同为 256GB，8、8 Plus 与 X 形成不同价格台阶。2020 年，普通版与 Pro 换代的价格方向又并不相同。',2],
  ['02 / CAPACITY','门槛与同容量价，分开看。','16 Pro 的 128GB 为 7,999 元，256GB 为 8,999 元。17 Pro 从 256GB、8,999 元起。入口高了 1,000 元，同容量首发价没变。',4],
  ['03 / TIME','同一部手机，价签也会变。','2026 年的后续调价固定了型号与容量。公开资料支持存储成本压力的背景，却不足以把每一元涨幅归因给存储。',6]
].map(([tag,title,body,chapter])=>`<article><span>${tag}</span><h3>${title}</h3><p>${body}</p><button class="reading-source" data-chapter="${chapter}">查看依据 ↗</button></article>`).join('');
for(const b of document.querySelectorAll('.reading-source'))b.addEventListener('click',()=>{const c=chapters[Number(b.dataset.chapter)];show(`<span class="tag">叙事依据</span><h2>${c.title.replace('<br>','')}</h2><p>${c.description}</p><p>${c.note}</p>${sourceList(c.source)}`);});
await Promise.all([...deviceNodes.values()].map(({img})=>img.decode()));
resize();
window.dispatchEvent(new Event('story-ready'));
document.documentElement.dataset.storyReady='true';
} catch(error){
  console.error(error);$('#error').hidden=false;$('#error').textContent=`页面加载遇到问题：${error.message}。请通过本地 HTTP 服务打开此页，并检查 data.json 与素材文件。`;
}
