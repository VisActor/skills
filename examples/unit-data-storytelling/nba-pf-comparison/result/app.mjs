import {createPlayer} from './mechanics/motion.mjs';
import {observeSteps,selectStep} from './mechanics/scroll.mjs';
import {createSceneModel} from './scene-model.mjs';
const response=await fetch('./data/analysis.json');
if(!response.ok)throw new Error('无法读取分析数据');
const data=await response.json();
const svg=document.querySelector('#chart'),back=document.querySelector('#back'),units=document.querySelector('#units'),labels=document.querySelector('#labels'),stage=document.querySelector('#stage');
const NS='http://www.w3.org/2000/svg',nodeEls=new Map(),guideEls=new Map();
const el=(tag,parent)=>{const n=document.createElementNS(NS,tag);parent.append(n);return n;};
const share=(era,metric)=>data[era].bins.filter(b=>b.height<=79).reduce((n,b)=>n+b[metric],0);
const people=[share(0,'people_pct'),share(1,'people_pct')],minutes=[share(0,'minute_pct'),share(1,'minute_pct')],fmt=n=>n.toFixed(1);
const copy=[
 {eyebrow:'01 ／ 先把每个年代放到同一把尺上',title:'PF 的身高，<br>重心往哪边移？',prose:'分别看两期曾带PF标签的球员，身高堆积的位置变了：人数最多的一档，从 <strong>6′9″ 移到 6′8″</strong>。左侧较低身高的部分，也明显变厚。',legend:'每枚横格＝该期人数的 1%；不足 1% 按比例显示',note:'人数按年代内球员去重。两期各自归一为100%，比较身高构成；不直接比较10季与6季的去重总人数。'},
 {eyebrow:'02 ／ 把图中橙色部分串到共同起点',title:'6′7″及以下，<br>从约一成到三成半。',prose:'把较低身高的一侧合起来看：人数占比从 <strong>'+fmt(people[0])+'% 增至 '+fmt(people[1])+'%</strong>，上升 '+fmt(people[1]-people[0])+' 个百分点。接下来，这些球员的出场分钟也占得更多吗？',legend:'每枚横格＝该期人数的 1%；队列总长＝100%',note:'橙色仍是同一身高区间，现将各档份额依身高顺序串接。队列中的格是比例单位，不是一格一人。'},
 {eyebrow:'03 ／ 人数之外，再看出场分钟',title:'同一批人，<br>占了多少出场时间？',prose:'人数参照留在上方，再看下方的分钟份额：<strong>'+fmt(minutes[0])+'% → '+fmt(minutes[1])+'%</strong>。两种口径都在增长；把各自的起点对齐，才能直接比较增长了多少。',legend:'人数格＝该期人数的1%；分钟格＝该期分钟的1%',note:'分钟为 PF 标签赛季的全季分钟，并非实际打 PF 的时间。两期分钟分母为 1,211,960 与 683,868。'},
 {eyebrow:'04 ／ 对齐起点，看增加的部分',title:'分钟份额，<br>增幅更大。',prose:'将 2000 年代的份额终点对齐，右侧就是到 2020 年代增加的部分。<strong>人数与分钟共用同一尺度</strong>，下面多出的这一截，是 '+fmt((minutes[1]-minutes[0])-(people[1]-people[0]))+' 个百分点。',legend:'每整格＝1 个百分点；保留不足一格的余量',note:'这里比较份额的增幅。两期人数与分钟分别归一化，不能据此断言战术或选材变化的原因。'}
];
let active=0,previousState=0,model,player,observer,lastLegend=null;
function dimensions(){const r=svg.getBoundingClientRect();svg.setAttribute('viewBox','0 0 '+r.width+' '+r.height);model=createSceneModel(data,r.width,r.height);}
const color=t=>'rgb('+[182+(255-182)*t,195+(152-195)*t,200+(92-200)*t].map(Math.round).join(',')+')';
function paint(scene,frame) {
 renderLegend(active===3?(!frame.moving||frame.progress>=.5):(previousState===3&&frame.moving&&frame.progress<.35));
 const alive=new Set();
 for(const [id,p]of scene.nodes) {
  if(p.opacity<.001&&frame.moving===false)continue;
  alive.add(id);
  let n=nodeEls.get(id);
  if(!n){n=el('rect',units);n.setAttribute('rx','1');n.dataset.unit=id;nodeEls.set(id,n);}
  for(const [k,v]of Object.entries({x:p.x,y:p.y,width:Math.max(0,p.w),height:Math.max(0,p.h),opacity:p.opacity,fill:color(p.warm)}))n.setAttribute(k,v);
 }
 for(const[id,n]of nodeEls)if(!alive.has(id)){n.remove();nodeEls.delete(id);}
 const guideAlive=new Set();
 for(const[id,g]of scene.guides) {
  if(g.opacity<.001&&!frame.moving)continue;
  guideAlive.add(id);let n=guideEls.get(id);
  if(!n){n=el(g.kind,g.kind==='text'?labels:back);n.dataset.guide=id;guideEls.set(id,n);}
  n.setAttribute('opacity',g.opacity);
  if(g.kind==='text') {
   n.textContent=g.text;n.setAttribute('x',g.x);n.setAttribute('y',g.y);n.setAttribute('fill',g.color);n.style.fill=g.color;
   n.setAttribute('text-anchor',g.anchor);n.style.fontSize=g.size+'px';n.style.fontWeight=g.bold?'700':'400';
  } else if(g.kind==='line') {
   for(const k of ['x','y','x2','y2'])n.setAttribute(k==='x'?'x1':k==='y'?'y1':k,g[k]);
   n.setAttribute('stroke',g.color);n.setAttribute('stroke-width',g.strokeWidth);
  } else {
   for(const[k,v]of Object.entries({x:g.x,y:g.y,width:g.w,height:g.h,fill:g.color}))n.setAttribute(k,v);
  }
 }
 for(const[id,n]of guideEls)if(!guideAlive.has(id)){n.remove();guideEls.delete(id);}
 stage.dataset.moving=String(frame.moving);stage.dataset.progress=frame.progress.toFixed(4);stage.dataset.target=String(active);
 if(!frame.moving){stage.dataset.settled=String(active);document.querySelector('#status').textContent=active===3?'继续向下，查看口径与来源 ↓':'向下滚动，接着看 ↓';}
}
function showCopy(state,animate) {
 const box=document.querySelector('.copy');
 if(animate) {
  box.parentElement.querySelectorAll('.copy-out').forEach(n=>n.remove());
  const old=box.cloneNode(true),rect=box.getBoundingClientRect();
  old.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));
  old.classList.add('copy-out');old.setAttribute('aria-hidden','true');
  Object.assign(old.style,{position:'absolute',top:'0px',left:'0px',width:rect.width+'px',height:rect.height+'px',margin:0,pointerEvents:'none'});
  box.parentElement.append(old);old.animate([{transform:'translateY(0)'},{transform:'translateY(-'+rect.height+'px)'}],{duration:340,easing:'ease-in-out'}).finished.then(()=>old.remove());
  box.getAnimations().forEach(a=>a.cancel());
  box.animate([{transform:'translateY('+rect.height+'px)'},{transform:'translateY(0)'}],{duration:340,easing:'ease-in-out'});
 }
 const c=copy[state];
 document.querySelector('#eyebrow').textContent=c.eyebrow;
 document.querySelector('#title').innerHTML=c.title;
 document.querySelector('#prose').innerHTML=c.prose;
 document.querySelector('#note').textContent=c.note;
 document.querySelector('#chart-title').textContent=c.title.replace('<br>','');
 document.querySelector('#chart-desc').textContent=state===3?'较矮组人数份额增加24.3个百分点，分钟份额增加29.2个百分点，两种增幅起点对齐。':'6英尺7英寸及以下人数份额从10.6%到34.9%，分钟份额从9.0%到38.2%。';
 document.querySelectorAll('[data-go]').forEach(b=>b.setAttribute('aria-current',+b.dataset.go===state?'step':'false'));
}
function renderLegend(gain){
 const key=String(gain)+':'+active;if(lastLegend===key)return;lastLegend=key;
 const keys=gain?'<span><i class="chip gray"></i>2000年代原有份额</span><span><i class="chip"></i>到2020年代增加的部分</span>':'<span><i class="chip"></i>6′7″及以下 <span style="color:#aab5bc">（≤200.7 cm）</span></span><span><i class="chip gray"></i>6′8″及以上</span>';
 document.querySelector('#legend').innerHTML=keys+'<span class="unit">'+(gain?copy[3].legend:copy[Math.min(active,2)].legend)+'</span>';
}
function show(state){const previous=active;previousState=previous;active=state;showCopy(state,true);player.goTo(model.scene(state),{duration:(state===3||previous===3)?1150:state===2?850:900});}
const cues=[...document.querySelectorAll('[data-step]')];
active=selectStep(cues.map(c=>c.getBoundingClientRect().top),innerHeight*.12);
previousState=active;
dimensions();showCopy(active,false);
player=createPlayer(model.scene(active),{blend:(from,to,t)=>model.blend(from,to,t),render:paint});
observer=observeSteps(cues,index=>{if(index!==active)show(index);},{viewportRatio:.12,hysteresis:14});
function go(index){cues[Math.min(3,Math.max(0,index))].scrollIntoView({behavior:'smooth',block:'start'});}
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>go(+b.dataset.go)));
addEventListener('keydown',event=>{if(['ArrowRight','ArrowLeft'].includes(event.key)&&!event.altKey&&!event.metaKey){event.preventDefault();go(active+(event.key==='ArrowRight'?1:-1));}});
addEventListener('resize',()=>{dimensions();player.goTo(model.scene(active),{immediate:true});observer?.refresh();});
