import {LOGO} from './logo-points.mjs';
import {makeOpeningModel, layout, logoGeometry, blend, PALETTE, lerp, hash} from './layout.mjs';

const $=id=>document.getElementById(id);
const stage=$('stage'), canvas=$('units'), context=canvas.getContext('2d'), guides=$('guides');
const sequence=document.querySelector('.sequence'), cues=[...document.querySelectorAll('.cue')];
const story=$('story-copy'), heading=$('diagram-heading'), legend=$('legend'), tooltip=$('tooltip');
const escape=value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
let model, width=0, height=0, target=0, pose, movement=null, frame=0, hover=null;

const copy=[null,{
  eyebrow:'01 / 从五个位置开始',
  title:'先认识，<br>球场上的<em>人</em>。',
  body:'回到 1960 年代，把球员放在各自的身高上。控卫、锋线、中锋，逐渐铺开五种不同的分布。',
  extra:'从这一批人开始，再看身材怎样变化。',
  note:'一个点对应一名球员在一个位置的记录。多位置球员，会在相应行各出现一次。'
},{
  eyebrow:'02 / 把两个年代放在一起',
  title:'四十年后，<br>长高的<em>并不一样</em>。',
  body:'保留上方的 1960 年代，再加入下方的 2000 年代。得分后卫、锋线和中锋的平均身高都提高了，控卫却变化不大。',
  extra:'大前锋增加 4.7 厘米；控卫，不到 1 厘米。',
  note:'两期各含十个赛季。点的位置表示身高，点的多少表示这个位置收录了多少人。'
}];

function panel(state){
  const c=copy[state];
  const node=document.createElement('article');node.className='story-panel';
  node.innerHTML=`<p class="eyebrow">${c.eyebrow}</p><h2>${c.title}</h2><p>${c.body}</p><p>${c.extra}</p><p class="note">${c.note}</p>`;
  return node;
}

function updateText(state,animate=true){
  stage.dataset.state=state;
  $('cover-copy').setAttribute('aria-hidden',String(state!==0));
  $('cover-copy').inert=state!==0;
  story.setAttribute('aria-hidden',String(state===0));
  if(state>0){
    const hadText=Boolean(story.firstElementChild), next=panel(state);
    story.replaceChildren(next);
    if(hadText&&animate){
      // Text stays readable while the point layout moves, including on reversal.
      next.animate([{transform:'translateY(10px)'},{transform:'translateY(0)'}],{duration:430,easing:'ease-out'});
    }
  }
  heading.innerHTML='<strong>1960s<span id="period-added"> + 2000s</span></strong><span>档案身高 · 厘米</span>';
  legend.innerHTML='<span><i></i>1960 年代</span><span id="legend-added"><i class="late"></i>2000 年代</span><span>短线标出平均身高</span>';
  $('next').innerHTML=['向下阅读 <span>↓</span>','加入 2000 年代 <span>↓</span>','查看试作说明 <span>↓</span>'][state];
  $('bottom-note').textContent=state===0?'1960–61 — 2025–26 · 球员档案':'年代内按人去重 · 多位置分别展示';
  canvas.setAttribute('aria-label',state===0?'NBA 点阵标志，白色人物将在进入后展开成真实球员单元':state===1?'1960 年代五个位置的球员身高分布，一个点代表一名球员在一个位置的记录':'1960 与 2000 年代球员身高分布，旧年代在上，新年代在下；大前锋均值增加 4.7 厘米，控卫增加 0.7 厘米');
}

function drawDecor(amount){
  if(amount<=0)return;
  const box=logoGeometry(width,height), release=1-amount;
  for(let i=0;i<LOGO.decoration.length;i++){
    const [u,v,side]=LOGO.decoration[i], seed=(hash(String(i))%997)/997;
    const x=box.x+u*box.w+(u-.5)*release*105;
    const y=box.y+v*box.h+(v-.5)*release*75;
    context.globalAlpha=amount*(.78+seed*.22);
    context.fillStyle=side==='red'?'#b96753':'#5388a3';
    context.beginPath();context.arc(x,y,box.r,0,Math.PI*2);context.fill();
  }
  context.globalAlpha=1;
}

function svgLine(x1,y1,x2,y2,color=PALETTE.rule,extra=''){
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" ${extra}/>`;
}
function svgText(x,y,value,options=''){
  const color=options.includes('fill=')?'':`fill="${PALETTE.quiet}"`;
  const size=options.includes('font-size=')?'':'font-size="12"';
  return `<text x="${x}" y="${y}" ${color} font-family="Helvetica Neue,Arial,sans-serif" ${size} ${options}>${value}</text>`;
}

function renderGuides(current){
  const {g,axis,comparison:c}=current;
  if(axis<.001){guides.innerHTML='';return;}
  const parts=[];const axisY=g.bottom+23;
  for(const cm of [160,170,180,190,200,210,220,230]){
    const x=g.x(cm);
    parts.push(svgLine(x,g.top+9,x,g.bottom+12,PALETTE.rule,'stroke-opacity=".44" stroke-dasharray="2 7"'));
    parts.push(svgLine(x,axisY-3,x,axisY+3));
    parts.push(svgText(x,axisY+20,cm,'text-anchor="middle"'));
  }
  parts.push(svgLine(g.left,axisY,g.right,axisY));
  for(const [i,pos] of model.positions.entries()){
    const center=g.top+g.rowH*(i+.5), a=model.groups.get(`1960/${pos}`), b=model.groups.get(`2000/${pos}`);
    const xa=g.x(a.stats.mean),xb=g.x(b.stats.mean),labelY=center-g.rowH*.43;
    parts.push(svgText(g.left-25,center-1,pos,'text-anchor="end" font-size="16" fill="#f1ecdf"'));
    parts.push(svgText(g.left-25,center+17,a.name,'text-anchor="end" style="font-family:PingFang SC,Microsoft YaHei,sans-serif;font-size:10px"'));
    // The old cohort's mean stays present while its distribution changes layout.
    const upper=lerp(center+16,center-4,c),lower=lerp(center-34,center-30,c);
    parts.push(svgLine(xa,lower,xa,upper,PALETTE.early,'stroke-width="1.4"'));
    parts.push(svgText(xa,labelY,a.stats.mean.toFixed(1),`text-anchor="middle" style="fill:${PALETTE.early}"`));
    if(c>.001){
      parts.push(`<g opacity="${c}">`);
      parts.push(svgLine(xb,center+4,xb,center+30,PALETTE.late,'stroke-width="1.4"'));
      parts.push(svgLine(xa,center,xb,center,PALETTE.late,'stroke-width="1.2"'));
      parts.push(svgText(g.right+12,center+4,`+${(b.stats.mean-a.stats.mean).toFixed(1)}`,`style="fill:${PALETTE.late}"`));
      parts.push('</g>');
    }
  }
  if(c>.001)parts.push(svgText(g.right+12,g.top-6,'变化',`opacity="${c}" style="font-family:PingFang SC,sans-serif;font-size:10px"`));
  guides.innerHTML=`<g opacity="${axis}">${parts.join('')}</g>`;
}

function draw(current){
  context.clearRect(0,0,width,height);drawDecor(current.decoration);
  for(const node of current.nodes.values()){
    if(node.opacity<.001)continue;
    context.globalAlpha=node.opacity;context.fillStyle=node.color;
    context.beginPath();context.arc(node.x,node.y,Math.max(.1,node.r),0,Math.PI*2);context.fill();
  }
  context.globalAlpha=1;
  if(hover){
    const node=current.nodes.get(hover);
    if(node){context.strokeStyle=PALETTE.ink;context.lineWidth=1;context.beginPath();context.arc(node.x,node.y,node.r+3,0,Math.PI*2);context.stroke();}
  }
  renderGuides(current);
  const added=$('period-added'),key=$('legend-added');
  if(added)added.style.opacity=current.comparison;
  if(key)key.style.opacity=current.comparison;
}

function sample(now){
  if(!movement)return pose;
  const p=Math.min(1,(now-movement.start)/movement.duration);
  return blend(movement.from,movement.to,p,{opening:movement.opening});
}

function tick(now){
  pose=sample(now);draw(pose);
  if(movement&&now>=movement.start+movement.duration){
    pose=movement.to;movement=null;stage.dataset.phase='settled';draw(pose);
  }
  frame=movement?requestAnimationFrame(tick):0;
}

function select(state){
  if(!model||state===target)return;
  const now=performance.now(), from=sample(now), opening=state===0||target===0;
  target=state;hover=null;tooltip.hidden=true;
  movement={from,to:layout(model,state,width,height),start:now,duration:opening?1450:950,opening};
  updateText(state);stage.dataset.phase='moving';
  if(!frame)frame=requestAnimationFrame(tick);
}

function scrollTarget(){
  const line=window.scrollY+height*.22;
  let state=0;
  for(const cue of cues)if(cue.getBoundingClientRect().top+window.scrollY<=line)state=+cue.dataset.state;
  return state;
}

function go(state){
  const element=state>2?$('notes'):cues[state];
  const y=element.getBoundingClientRect().top+window.scrollY-(state>2?0:height*.05);
  window.scrollTo({top:Math.max(0,y),behavior:'smooth'});
}

function resize(){
  width=stage.clientWidth;height=stage.clientHeight;
  const ratio=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
  context.setTransform(ratio,0,0,ratio,0,0);
  guides.setAttribute('viewBox',`0 0 ${width} ${height}`);
  if(model){
    if(frame)cancelAnimationFrame(frame);frame=0;movement=null;
    target=scrollTarget();pose=layout(model,target,width,height);updateText(target,false);draw(pose);stage.dataset.phase='settled';
  }
}

function closeTooltip(){if(!hover)return;hover=null;tooltip.hidden=true;if(pose&&!movement)draw(pose);}

canvas.addEventListener('pointermove',event=>{
  if(!pose||target===0||movement)return closeTooltip();
  const rect=canvas.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top;
  let closest=null,distance=7;
  for(const node of pose.nodes.values()){
    const d=Math.hypot(node.x-x,node.y-y);
    if(d<distance){distance=d;closest=node.key;}
  }
  if(!closest)return closeTooltip();
  hover=closest;const r=model.records.get(closest);
  tooltip.innerHTML=`<b>${escape(r.name)}</b> · ${(r.h*2.54).toFixed(1)} cm<small>${r.decade} 年代 · ${r.position} · ${r.years.length} 个赛季有记录</small>`;
  tooltip.hidden=false;tooltip.style.left=`${Math.min(width-tooltip.offsetWidth-16,x+16)}px`;tooltip.style.top=`${Math.max(85,y-tooltip.offsetHeight-12)}px`;draw(pose);
});
canvas.addEventListener('pointerleave',closeTooltip);
$('begin').addEventListener('click',()=>go(1));$('next').addEventListener('click',()=>go(target+1));
window.addEventListener('scroll',()=>select(scrollTarget()),{passive:true});
window.addEventListener('resize',resize);
window.addEventListener('keydown',event=>{
  if(['INPUT','BUTTON','A','SUMMARY'].includes(document.activeElement?.tagName))return;
  if(event.key==='ArrowRight'){event.preventDefault();go(target+1);}
  if(event.key==='ArrowLeft'){event.preventDefault();go(Math.max(0,target-1));}
});

try{
  const response=await fetch('./data/records.json');
  if(!response.ok)throw new Error(`数据读取失败：HTTP ${response.status}`);
  model=makeOpeningModel(await response.json());resize();
}catch(error){
  stage.dataset.phase='error';$('error').hidden=false;$('error').textContent=`页面未能载入：${error.message}`;console.error(error);
}
