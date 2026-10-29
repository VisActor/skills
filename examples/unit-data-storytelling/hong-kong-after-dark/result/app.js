(() => {
  'use strict';
  const D=window.STORY_DATA, records=D.days, years=D.annual;
  const $=s=>document.querySelector(s);
  const canvas=$('#days'),ctx=canvas.getContext('2d'),svg=$('#annotations'),plot=$('#plot');
  const WARM=[244,183,101],SOFT=[173,137,85],COOL=[56,76,82],CORAL=[227,146,119],WHITE=[235,229,214];
  let W=0,H=0,currentScene=-1,current=[],from=[],to=[],start=0,frame=0,guideCurrent=new Map(),guideFrom=new Map(),guideTo=new Map(),animating=false;
  let scrollPending=false,activeRecords=[],layoutVersion=0;
  const sceneText=[
    ['从一个日子开始','2022 · 07 · 09','一个方块，一天','香港天文台测站 · 日最低温'],
    ['把这一天放回月历','2022 年 7 月','亮色：7 月 9—29 日的连续热夜','暖色：热夜 · 日最低温 ≥28°C'],
    ['每个日子都还在','2022 年 · 6—8 月','暖色：43 个热夜','每一行一个月 · 每格一天'],
    ['同一测站，每年都是 92 天','1961 — 2025','暖色：热夜','每一行一个夏天 · 悬停查看日期'],
    ['日期重排，年份保留','热夜有多少','暖色：热夜，按数量靠左排列','横向是天数，不再是日期'],
    ['从每年抽出最长的连续片段','热夜连着来多久','一个方块：这段连续热夜中的一天','每年一段 · 横向是连续天数'],
    ['两个时期，各 2,760 个夏日','一天里最凉的时候','一点一天 · 按日最低温排列','横轴：°C · 0.2°C 分箱'],
    ['同一批日子，同一把温度尺','一天里最热的时候','一点一天 · 按日最高温排列','横轴：°C · 0.2°C 分箱']
  ];
  const annualMap=new Map(years.map(y=>[y.year,y]));
  const recordIndex=new Map(records.map((d,i)=>[d.date,i]));
  const byYear=new Map(years.map(y=>[y.year,records.filter(d=>d.year===y.year)]));
  const sortedRanks=new Map();
  byYear.forEach(a=>a.toSorted((a,b)=>Number(b.night)-Number(a.night)||a.index-b.index).forEach((d,i)=>sortedRanks.set(d.id,i)));
  const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
  const lerp=(a,b,t)=>a+(b-a)*t;
  function point(x,y,w,h,color,alpha=1){return{x,y,w,h,color,alpha};}
  function hidden(){return point(W*.5,H*.5,1,1,COOL,0);}
  function guide(id,kind,props){return{id,kind,alpha:1,...props};}
  function text(id,x,y,value,cls='',anchor='start'){return guide(id,'text',{x,y,value,cls,anchor});}
  function line(id,x,y,x2,y2,cls='thin',dash=''){return guide(id,'line',{x,y,x2,y2,cls,dash});}
  function box(id,x,y,w,h,cls='accent',fill='none'){return guide(id,'rect',{x,y,w,h,cls,fill});}
  function createLayout(scene){
    const points=records.map(hidden),g=[];
    const add=(d,p)=>{points[recordIndex.get(d.date)]=p;};
    if(scene===0){
      const s=Math.min(W*.36,H*.37),x=W*.5-s/2,y=H*.38-s*.25;
      add(records[recordIndex.get('2022-07-09')],point(x,y,s,s*1.12,WARM));
      g.push(text('single-month',W*.5,y+28,'JULY 2022','date','middle'));
      g.push(text('single-date',W*.5,y+s*.72,'9','large','middle'));
      g.push(line('single-rule',x+16,y+43,x+s-16,y+43,'accent'));
      g.push(text('single-temp',W*.5,y+s*1.12+56,'日最低温 28.6°C','value','middle'));
      g.push(text('single-caption',W*.5,y+s*1.12+88,'这一天，没有降到 28°C 以下。','','middle'));
    } else if(scene===1){
      const cell=Math.min((W-80)/7,(H-100)/6),gridW=cell*7,x0=(W-gridW)/2,y0=Math.max(42,(H-cell*5)/2-10);
      ['一','二','三','四','五','六','日'].forEach((s,i)=>g.push(text(`weekday-${i}`,x0+(i+.5)*cell,y0-17,s,'small','middle')));
      for(const d of byYear.get(2022).filter(d=>d.month===7)){
        const idx=d.day+3,col=idx%7,row=Math.floor(idx/7),inRun=d.day>=9&&d.day<=29;
        const x=x0+col*cell+3,y=y0+row*cell+3;
        add(d,point(x,y,cell-6,cell-6,inRun?WARM:d.night?SOFT:COOL));
        g.push(text(`date-${d.date}`,x+(cell-6)/2,y+(cell-6)*.6,String(d.day),`date ${d.night?'dark-date':''}`,'middle'));
        if(inRun)g.push(box(`event-${d.day}`,x-1.5,y-1.5,cell-3,cell-3));
      }
      g.push(text('july-event',W*.5,y0+cell*5+32,'7 月 9—29 日 · 连续 21 个热夜','warm','middle'));
    }else if(scene===2){
      const x0=48,dx=(W-83)/31,h=Math.min(26,dx*1.15),y0=H*.27,gap=H*.23;
      for(const d of byYear.get(2022))add(d,point(x0+(d.day-1)*dx,y0+(d.month-6)*gap,dx*.78,h,d.night?WARM:COOL));
      g.push(text('summer-total',W*.5,Math.max(37,H*.12),'43 / 92','large','middle'));
      for(let m=6;m<=8;m++){
        const y=y0+(m-6)*gap;
        g.push(text(`month-${m}`,x0-12,y+h*.72,`${m}月`,'','end'));
        [1,10,20,m===6?30:31].forEach(d=>g.push(text(`md-${m}-${d}`,x0+(d-1)*dx+dx*.35,y+h+20,String(d),'small','middle')));
      }
      g.push(box('july-run',x0+8*dx-3,y0+gap-5,dx*21-1,h+10));
      g.push(text('july-run-label',x0+18.5*dx,y0+gap-13,'21 个连续热夜','warm','middle'));
    }else if(scene<=5){
      const x0=42,right=scene>=4?126:20,domain=scene===5?24:92,dx=(W-x0-right)/domain,y0=40,dy=(H-66)/65;
      for(const d of records){
        const a=annualMap.get(d.year),firstRun=scene===5?a.nightRuns.find(r=>r.length===a.longestNight):null;
        const rank=scene===5?(firstRun?firstRun.indexOf(d.date):-1):scene===4?sortedRanks.get(d.id):d.index;
        if(rank<0)continue;
        const color=d.night?WARM:COOL;
        add(d,point(x0+rank*dx,y0+(d.year-1961)*dy,dx*.73,Math.max(2.6,dy*.65),color));
      }
      [1961,1970,1980,1990,2000,2010,2020,2025].forEach(year=>g.push(text(`year-${year}`,x0-9,y0+(year-1961)*dy+dy*.75,String(year),'small','end')));
      if(scene>=4){
        (scene===5?[0,3,6,9,12,15,18,21,24]:[0,15,30,45,60,75,92]).forEach(n=>g.push(text(`count-${n}`,x0+n*dx,y0-12,String(n),'small','middle')));
        D.periods.forEach((p,i)=>{
          const avg=scene===5?p.longestNight:p.night,x=x0+avg*dx,y=y0+(p.start-1961)*dy,y2=y0+(p.end-1961+1)*dy;
          g.push(line(`period-avg-${i}`,x,y-3,x,y2,'accent','3 3'));
          const tx=x0+domain*dx+13,ty=y+dy*12;
          g.push(text(`period-name-${i}`,tx,ty-5,`${p.start}—${p.end}`,'small'));
          g.push(text(`period-count-${i}`,tx,ty+14,`平均 ${avg.toFixed(1)} 天`,'warm'));
          g.push(line(`period-arrow-${i}`,x+4,ty+9,tx-14,ty+9,'thin','2 4'));
        });
      }else{
        [[6,0,30],[7,30,31],[8,61,31]].forEach(([m,start,count])=>g.push(text(`month-${m}`,x0+(start+count/2)*dx,y0-13,`${m} 月`,'small','middle')));
        [30,61].forEach((n,i)=>g.push(line(`month-boundary-${i}`,x0+n*dx-1,y0-4,x0+n*dx-1,H-25,'thin')));
      }
      const ey=y0+61*dy;
      if(scene===3){
        g.push(box('event-row',x0-3,ey-2,92*dx+1,dy+1));
        g.push(text('2022-marker',x0-9,ey+dy*.75,'2022','warm small','end'));
      }
      if(scene===5){
        const x1=x0,x2=x0+21*dx;
        g.push(line('long-run',x1,ey+dy+1,x2,ey+dy+1,'accent'));
        g.push(text('2022-marker',x0-9,ey+dy*.75,'2022','warm small','end'));
        g.push(text('run-21',x2+6,ey+dy*.7,'21 天','warm small'));
      }
    }else{
      const key=scene===6?'min':'max',domain=[20,38],x0=26,x1=W-18,dx=(x1-x0)/90,top=43,gap=34,band=(H-105-gap)/2;
      const bins=[new Map(),new Map()];
      records.forEach(d=>{const group=d.year<=1990?0:d.year>=1996?1:-1;if(group<0)return;const b=Math.min(89,Math.max(0,Math.floor((d[key]-20)/.2+1e-7)));if(!bins[group].has(b))bins[group].set(b,[]);bins[group].get(b).push(d);});
      const cols=3,allBins=[];
      for(const metric of ['min','max'])for(const p of D.periods){const counts=new Map();for(const d of records){if(d.year<p.start||d.year>p.end)continue;const b=Math.floor((d[metric]-20)/.2+1e-7);counts.set(b,(counts.get(b)||0)+1);}allBins.push(...counts.values());}
      const maxRows=Math.ceil(Math.max(...allBins)/cols);
      const dot=Math.min(dx*.25,(band-52)/maxRows,3.15),rise=dot+Math.min(.6,dot*.2);
      // A shared rise protects equal counts across both period distributions.
      const step=Math.min(rise,(band-52)/maxRows);
      bins.forEach((map,group)=>{
        const base=top+group*(band+gap)+band-11;
        map.forEach((items,bin)=>items.forEach((d,j)=>add(d,point(x0+(bin+.14)*dx+(j%cols)*dx*.26,base-Math.floor(j/cols)*step-dot,dot*.86,dot*.86,scene===6?WARM:CORAL))));
        const p=D.periods[group],mean=p[key],x=x0+(mean-20)/18*(x1-x0),labY=top+group*(band+gap)-8;
        g.push(text(`period-name-${group}`,x0,labY,`${p.start}—${p.end}`,'period'));
        g.push(text(`period-size-${group}`,x1,labY,'2,760 天','small','end'));
        g.push(line(`dist-baseline-${group}`,x0,base+4,x1,base+4,'thin'));
        g.push(line(`dist-mean-${group}`,x,top+group*(band+gap)+14,x,base+7,'accent','2 3'));
        g.push(text(`dist-mean-label-${group}`,x+7,top+group*(band+gap)+24,`平均 ${mean.toFixed(2)}°C`,'warm'));
      });
      for(let t=20;t<=38;t+=2){const x=x0+(t-20)/18*(x1-x0);g.push(text(`temp-tick-${t}`,x,H-15,String(t),'small','middle'));g.push(line(`temp-line-${t}`,x,H-38,x,H-29,'thin'));}
      const threshold=scene===6?28:33,tx=x0+(threshold-20)/18*(x1-x0);
      g.push(line('threshold',tx,top+5,tx,H-42,'thin','2 5'));
      g.push(text('threshold-caption',tx+5,H-44,scene===6?'28°C 热夜门槛':'33°C 酷热日门槛','small'));
    }
    return {points,guides:new Map(g.map(d=>[d.id,d]))};
  }

  function mix(a,b,t){return{x:lerp(a.x,b.x,t),y:lerp(a.y,b.y,t),w:lerp(a.w,b.w,t),h:lerp(a.h,b.h,t),alpha:lerp(a.alpha,b.alpha,t),color:a.color.map((v,i)=>lerp(v,b.color[i],t))};}
  function interpolateGuides(t){
    const out=new Map(),keys=new Set([...guideFrom.keys(),...guideTo.keys()]);
    for(const id of keys){
      const a=guideFrom.get(id),b=guideTo.get(id),target=b||a,source=a||b;
      const item={...target,alpha:lerp(a?a.alpha:0,b?1:0,t)};
      for(const k of ['x','y','x2','y2','w','h'])if(target[k]!==undefined)item[k]=lerp(source[k]??target[k],target[k],t);
      if(item.alpha>.01)out.set(id,item);
    }return out;
  }
  const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  function paintGuides(){
    svg.innerHTML=[...guideCurrent.values()].map(original=>{
      const g={...original};
      if(g.id.startsWith('date-')){const p=current[recordIndex.get(g.id.slice(5))];if(p){g.x=p.x+p.w/2;g.y=p.y+p.h*.6;}}
      if(/^event-\d+$/.test(g.id)){const p=current[recordIndex.get(`2022-07-${g.id.slice(6).padStart(2,'0')}`)];if(p){g.x=p.x-1.5;g.y=p.y-1.5;g.w=p.w+3;g.h=p.h+3;}}
      if(g.id==='single-month'||g.id==='single-date'){const p=current[recordIndex.get('2022-07-09')];g.x=p.x+p.w/2;g.y=p.y+(g.id==='single-date'?p.h*.643:Math.min(28,p.h*.18));}
      const opacity=g.alpha.toFixed(3),cls=esc(g.cls||'');
      if(g.kind==='text'){const dark=g.cls?.includes('dark-date')||['single-month','single-date'].includes(g.id);return `<text x="${g.x}" y="${g.y}" opacity="${opacity}" class="${cls}" text-anchor="${g.anchor||'start'}"${dark?' style="fill:#382e20"':''}>${esc(g.value)}</text>`;}
      if(g.kind==='line')return `<line x1="${g.x}" y1="${g.y}" x2="${g.x2}" y2="${g.y2}" opacity="${opacity}" class="${cls}" stroke-dasharray="${g.dash||''}"/>`;
      return `<rect x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" opacity="${opacity}" class="${cls}" fill="${g.fill||'none'}"/>`;
    }).join('');
  }
  function draw(){
    ctx.clearRect(0,0,W,H);
    for(let i=0;i<current.length;i++){
      const p=current[i];if(p.alpha<.006)continue;
      ctx.globalAlpha=p.alpha;ctx.fillStyle=`rgb(${p.color.map(Math.round).join(',')})`;
      ctx.beginPath();ctx.roundRect(p.x,p.y,Math.max(.1,p.w),Math.max(.1,p.h),Math.min(2,p.w*.13));ctx.fill();
    }
    ctx.globalAlpha=1;paintGuides();
  }
  function tick(now){
    const progress=Math.min(1,(now-start)/1050),t=ease(progress);
    current=to.map((b,i)=>{
      const a=from[i];
      // New dates unfold from their containing calendar, not from unrelated pixels.
      const stagger=a.alpha<.01&&b.alpha>.1?Math.min(.16,records[i].index/700):0;
      const u=stagger?ease(Math.max(0,Math.min(1,(progress-stagger)/(1-stagger)))):t;
      return mix(a,b,u);
    });
    guideCurrent=interpolateGuides(t);draw();
    if(progress<1)frame=requestAnimationFrame(tick);else{animating=false;current=to;guideCurrent=guideTo;activeRecords=current.map((p,i)=>p.alpha>.5?i:-1).filter(i=>i>=0);publishGeometry();}
  }
  function publishGeometry(){
    canvas.dataset.scene=currentScene;canvas.dataset.animating=String(animating);canvas.dataset.visible=current.filter(p=>p.alpha>.5).length;
    canvas.dataset.invalid=current.filter(p=>![p.x,p.y,p.w,p.h,p.alpha].every(Number.isFinite)).length;
    canvas.dataset.overflow=current.filter(p=>p.alpha>.99&&(p.x<0||p.y<0||p.x+p.w>W+1||p.y+p.h>H+1)).length;
  }
  function setScene(scene,instant=false){
    if(scene===currentScene&&!instant)return;
    const previous=currentScene;currentScene=scene;
    const layout=createLayout(scene);to=layout.points.map((p,i)=>p.alpha<.01&&current[i]?{...current[i],alpha:0}:p);guideTo=layout.guides;
    if(!current.length)current=to.map(p=>({...p,alpha:0}));
    from=current.map((p,i)=>{
      if(p.alpha>.01||to[i].alpha<.01)return p;
      let origin;
      if(scene===1)origin=current[recordIndex.get('2022-07-09')];
      if(scene===2)origin=current[recordIndex.get(`2022-07-${String(Math.min(records[i].day,31)).padStart(2,'0')}`)];
      if(scene===3&&previous===2)origin=current[recordIndex.get(`2022-${records[i].date.slice(5)}`)];
      return origin?.alpha>.01?{...origin,alpha:0}:p;
    });
    guideFrom=guideCurrent;
    const [k,title,legend,note]=sceneText[scene];
    $('#plot-kicker').textContent=k;$('#plot-title').textContent=title;$('#legend span').textContent=legend;$('#plot-note').textContent=note;
    $('#legend i').style.background=scene===7?'#e39277':'#f4b765';
    canvas.setAttribute('aria-label',`${title}。${legend}。${note}。`);
    $('#tooltip').hidden=true;
    cancelAnimationFrame(frame);
    if(instant){current=to;guideCurrent=guideTo;activeRecords=to.map((p,i)=>p.alpha>.5?i:-1).filter(i=>i>=0);animating=false;draw();publishGeometry();}
    else{start=performance.now();animating=true;publishGeometry();frame=requestAnimationFrame(tick);}
  }
  function resize(){const r=plot.getBoundingClientRect();W=r.width;H=r.height;const dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);svg.setAttribute('viewBox',`0 0 ${W} ${H}`);layoutVersion++;setScene(Math.max(0,currentScene),true);}
  let steps=[...document.querySelectorAll('.reading-step')];
  function onScroll(){
    scrollPending=false;
    const trigger=innerHeight*.57;let next=0;
    for(const s of steps){const copy=s.querySelector('.step-copy');if(copy.getBoundingClientRect().top<trigger)next=Number(s.dataset.scene);}
    if($('#story').getBoundingClientRect().top<innerHeight*.8)setScene(next);
  }
  addEventListener('scroll',()=>{if(!scrollPending){scrollPending=true;requestAnimationFrame(onScroll);}}, {passive:true});
  addEventListener('resize',resize);
  plot.addEventListener('mousemove',e=>{
    if(animating){$('#tooltip').hidden=true;return;}
    const bounds=plot.getBoundingClientRect(),x=e.clientX-bounds.left,y=e.clientY-bounds.top;
    let found=-1;
    for(const i of activeRecords){const p=current[i];if(x>=p.x-1&&x<=p.x+p.w+1&&y>=p.y-1&&y<=p.y+p.h+1){found=i;break;}}
    const tip=$('#tooltip');if(found<0){tip.hidden=true;return;}
    const d=records[found];tip.innerHTML=`<strong>${d.date}</strong><span class="temperature">${d.min.toFixed(1)} — ${d.max.toFixed(1)}°C</span>最低 / 最高气温${d.night?'<br>热夜 · 日最低温 ≥28°C':''}`;
    tip.hidden=false;tip.style.left=`${Math.min(W-175,x+15)}px`;tip.style.top=`${Math.max(0,Math.min(H-115,y+16))}px`;
  });
  plot.addEventListener('mouseleave',()=>$('#tooltip').hidden=true);
  document.querySelector('.read-link').addEventListener('click',e=>{e.preventDefault();const first=steps[0].querySelector('.step-copy');const y=scrollY+first.getBoundingClientRect().top-innerHeight*.28;scrollTo({top:y,behavior:'smooth'});});

  const select=$('#year-select');
  for(let y=2025;y>=1961;y--){const o=document.createElement('option');o.value=y;o.textContent=y;select.append(o);}
  let exploreYear=2022;
  function showDay(d){$('#day-readout').innerHTML=`<strong>${d.year} 年 ${d.month} 月 ${d.day} 日</strong>　最低 <strong>${d.min.toFixed(1)}°C</strong> · 最高 ${d.max.toFixed(1)}°C · 平均 ${d.mean.toFixed(1)}°C${d.night?'　／　热夜':''}`;}
  function renderCalendar(year){
    exploreYear=year;select.value=year;const a=annualMap.get(year),days=byYear.get(year);
    $('#prev-year').disabled=year===1961;$('#next-year').disabled=year===2025;
    $('#explore-summary').innerHTML=`${year} 年 6—8 月：<strong>${a.night} 个热夜</strong>，最长连续 <strong>${a.longestNight} 天</strong>。`;
    const root=$('#calendar');root.replaceChildren();
    for(let m=6;m<=8;m++){
      const section=document.createElement('div');section.className='month';
      section.innerHTML=`<div class="month-title">${m} 月<small>${['JUNE','JULY','AUGUST'][m-6]}</small></div><div class="month-grid">${['一','二','三','四','五','六','日'].map(v=>`<div class="weekday">${v}</div>`).join('')}</div>`;
      const grid=section.querySelector('.month-grid'),offset=(new Date(Date.UTC(year,m-1,1)).getUTCDay()+6)%7;
      for(let i=0;i<offset;i++)grid.append(document.createElement('span'));
      for(const d of days.filter(d=>d.month===m)){
        const b=document.createElement('button');b.type='button';b.className=`calendar-day ${d.night?'hotnight':''} ${d.longest?'longest':''}`;b.textContent=d.day;
        b.setAttribute('aria-label',`${d.date}，最低${d.min}摄氏度${d.night?'，热夜':''}`);b.addEventListener('mouseenter',()=>showDay(d));b.addEventListener('focus',()=>showDay(d));b.addEventListener('click',()=>showDay(d));grid.append(b);
      }root.append(section);
    }
    $('#day-readout').textContent='把鼠标移到某一天，查看当天的温度。';
  }
  select.addEventListener('change',()=>renderCalendar(+select.value));$('#prev-year').addEventListener('click',()=>renderCalendar(exploreYear-1));$('#next-year').addEventListener('click',()=>renderCalendar(exploreYear+1));
  $('#hero-source').href='https://commons.wikimedia.org/wiki/File:HK_night_佐敦_Jordan_偉晴街_Wai_Ching_Street_July_2022_Px3_19.jpg';
  $('#street-source').href='https://commons.wikimedia.org/wiki/File:HK_night_佐敦_Jordan_偉晴街_Wai_Ching_Street_July_2022_Px3_31.jpg';
  renderCalendar(exploreYear);resize();onScroll();
  // Read-only diagnostics support layout verification; production reading uses natural scroll.
  window.storyDiagnostics=()=>({scene:currentScene,animating,width:W,height:H,layoutVersion,visible:current.filter(p=>p.alpha>.5).length,invalid:current.filter(p=>![p.x,p.y,p.w,p.h,p.alpha].every(Number.isFinite)).length,overflow:current.filter(p=>p.alpha>.99&&(p.x<0||p.y<0||p.x+p.w>W+1||p.y+p.h>H+1)).length,year:exploreYear});
})();
