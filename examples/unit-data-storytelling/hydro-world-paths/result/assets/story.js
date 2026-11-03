'use strict';
(() => {
  const D = window.HYDRO;
  const $ = (s) => document.querySelector(s);
  const fmt = n => Math.round(n).toLocaleString('en-US');
  const sumWhere = test => D.paths.reduce((acc,[city,seed,n]) => acc+(test(city,seed)?n:0),0);
  const wing = D.wings, other=D.total-wing, away=sumWhere(c=>c==='absent'), city=wing-away;
  const wingFirst=sumWhere(c=>c==='after'), cityFirst=sumWhere(c=>c==='before');
  const sFirst=sumWhere((c,s)=>s==='before'), wSeed=sumWhere((c,s)=>s==='after'), noSeed=wing-sFirst-wSeed;
  const cityAndSeed=sumWhere((c,s)=>c!=='absent' && s!=='absent');
  const fly=D.activity.aviate.positive, missingFly=wing-fly;
  const choices={
    place_stairs:{name:'楼梯',verb:'放过楼梯',short:'造楼梯',unit:'次放置',icon:'stairs'},
    craft_tools:{name:'工具',verb:'做过工具',short:'做工具',unit:'件',icon:'tool'},
    place_glass:{name:'玻璃',verb:'放过玻璃',short:'放玻璃',unit:'次放置',icon:'glass'},
    craft_bread:{name:'烘焙食品',verb:'做过烘焙食品',short:'做烘焙',unit:'份',icon:'bread'},
    craft_compass:{name:'指南针',verb:'做过指南针',short:'做指南针',unit:'个',icon:'compass'},
    craft_bookshelf:{name:'书架',verb:'做过书架',short:'做书架',unit:'个',icon:'shelf'}
  };
  let selected='place_stairs', currentStep=0;
  const sections=['cover','inventory','city','order','seed','work','overlap'];
  const colors={wing:'#cdb0ef',city:'#ebc28b',seed:'#b6d99a',olive:'#9f95b2',none:'#807a94',paper:'#f1e6cd',muted:'#bcb6c9',line:'#706680'};
  const groupColor = v => colors[v] || v;
  const figureNames=['','01  /  背包名册','02  /  装备与地点','03  /  两枚印记','04  /  翅膀与种子','05  /  空中与地面','06  /  让两排错开'];
  const scopes=['','全部 1,117 个账号','825 个拿过鞘翅的账号','165 个同时有两项进度的账号','回到全部 825 个有翼账号','行为各自计数 · 同一批 825 人','同一批 825 人 · 最少重叠多少'];
  const hints=['','一小格算一个账号。取得鞘翅只需物品进入过背包。','仍然每格一个账号。右边有两项进度，可以继续读它们的顺序。','从左向右读两项进度的先后。中间每格一个账号，距离不表示用时。','括线连接所有既拿过鞘翅、也有播种记录的账号。','两条共用同一把人数尺。记录的是截至快照做过的人数。','下排已移到最右。绿色斜纹是两项行为最少也要重叠的部分。'];
  const navNames=['开始阅读','看谁到过城','读两项的先后','回到地面','看行动记录','让两排错开','读尾声'];
  const stage=$('#stage'),words=$('#words'),evidence=$('#evidence'),plot=$('#plot');
  const ctx=$('#marks').getContext('2d');
  const escapeText = x => String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  function copyFor(step) {
    const picked=choices[selected], count=D.activity[selected].positive, bound=Math.max(0,count-missingFly);
    return [null,
      {k:'打开背包',title:'四个人里，<br><b>约三人有翅膀。</b>',body:'Hydro 是一群玩家共用的生存世界。翻看 '+fmt(D.total)+' 份账号记录，'+fmt(wing)+' 个背包曾装进过鞘翅，一对可以穿在身上滑翔的翅膀。',aside:'那些拿到翅膀的人，都去过藏着它的地方吗？'},
      {k:'找它的来处',title:'八成没有<br><b>到城的记录。</b>',body:'游戏里的末地船停在末地城附近，船里能找到鞘翅。在这 '+wing+' 人中，只有 '+city+' 个也留下了到城的进度。',aside:'装备何时进了背包，存档有记。至于它从谁手里来，这份记录没说。'},
      {k:'对一对时间',title:'连到过城的人，<br><b>也多是先有翅膀。</b>',body:'只看两枚印记都有的 '+city+' 个账号。'+wingFirst+' 人拿到翅膀在先，到城在后。反过来走的，只有 '+cityFirst+' 人。',aside:'这些到过远方的人，也有人照料土地。他们之中，'+cityAndSeed+' 人留下了播种的印记。'},
      {k:'翻到另一枚印记',title:'一双翅膀，<br><b>一粒种子。</b>',body:'回看全部 '+wing+' 个拿过翅膀的账号。'+sFirst+' 个先播种、后拿翅膀，另有 '+wSeed+' 个先拿翅膀、后播下第一粒种子。',aside:'两条路合起来，有 '+(sFirst+wSeed)+' 人把冒险装备和田里的日子写进了同一份存档。'},
      {k:'装备以外的日子',title:'飞上了天，<br><b>也有人造楼梯。</b>',body:'背包能告诉我们谁拿过翅膀。行动记录还能告诉我们，'+fly+' 人真的飞过，'+D.activity.place_stairs.positive+' 人亲手放过楼梯。',aside:'这张表分别数了两件事。单看每条的人数，怎样知道至少多少人两样都做过？'},
      {k:'试着把人分开',title:'至少 '+fmt(bound)+' 人，<br><b>飞过也'+picked.short+'。</b>',body:'两排尽量错开。右端只有 '+missingFly+' 个空位能避开飞行记录。'+picked.verb+'的 '+fmt(count)+' 人里，至少 <strong>'+fmt(bound)+' 人</strong>仍和上排重合。',aside:selected==='craft_bread'?'这里的烘焙食品包括面包、蛋糕和饼干。':'换一样地面上的东西，看看至少有多少飞过的人也做过这件事。'}
    ][step];
  }
  function choicesHTML(){
    return '<label class="choice">换一项记录 <select aria-label="选择要与飞行比较的行为">'+Object.entries(choices).map(([key,value])=>'<option value="'+key+'"'+(key===selected?' selected':'')+'>'+value.name+'</option>').join('')+'</select></label>';
  }
  function showCopy(step, changingMetric=false){
    if(!step){words.replaceChildren();return;}
    const c=copyFor(step), existing=words.querySelector('.copy:not(.out)');
    if(changingMetric && existing){
      existing.querySelector('h2').innerHTML=c.title;existing.querySelector('.body').innerHTML=c.body;existing.querySelector('.aside').textContent=c.aside;return;
    }
    words.querySelectorAll('.out').forEach(el=>el.remove());
    if(existing){existing.classList.add('out');existing.setAttribute('aria-hidden','true');existing.inert=true;setTimeout(()=>existing.remove(),200);}
    const next=document.createElement('div');next.className='copy';
    next.innerHTML='<p class="eyebrow"><i></i>'+c.k+'</p><h2>'+c.title+'</h2><p class="body">'+c.body+'</p><p class="aside">'+c.aside+'</p>'+(step===6?choicesHTML():'');
    words.append(next);
    next.querySelector('select')?.addEventListener('change',e=>{selected=e.target.value;showCopy(6,true);changeView(6,false,true);setAlt(6);});
  }
  function setAlt(step){
    if (step===0) return;
    const c=copyFor(step);plot.setAttribute('aria-label',c.title.replace(/<[^>]+>/g,'')+' '+c.body.replace(/<[^>]+>/g,''));
  }
  const square=(x,y,size=0,opacity=0,col=colors.wing)=>({x,y,size,opacity,col:rgb(col),sprout:0});
  function rgb(str){const n=parseInt(str.slice(1),16);return [n>>16,(n>>8)&255,n&255];}
  const clamp=x=>Math.max(0,Math.min(1,x)), mix=(a,b,t)=>a+(b-a)*t, smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
  const hash=n=>{let v=Math.imul(n+837,0x45d9f3b);v=Math.imul(v^(v>>>16),0x45d9f3b);return (v^(v>>>16))>>>0;};
  const people=[];
  for(const [cityOrder,seedOrder,n] of D.paths) for(let i=0;i<n;i++)people.push({city:cityOrder,seed:seedOrder,wing:true});
  while(people.length<D.total)people.push({wing:false,city:'outside',seed:'outside'});
  const ids=people.map((_,i)=>i).sort((a,b)=>hash(a)-hash(b));
  const groups={wing:ids.filter(i=>people[i].wing),outside:ids.filter(i=>!people[i].wing)};
  for(const code of ['before','after','absent']){
    groups['c'+code]=groups.wing.filter(i=>people[i].city===code);
    groups['s'+code]=groups.wing.filter(i=>people[i].seed===code);
  }
  // Stable anonymous slots are allocated inside actual joint path counts, never across unknown behavior pairs.
  function grid(points,group,x,y,rows,pitch,size,col){
    group.forEach((id,n)=>{points[id]=square(x+Math.floor(n/rows)*pitch,y+(n%rows)*pitch,size,1,col);});
  }
  const soft='#a7a0b4', chalk=colors.paper;
  function guide(map,key,type,x,y,text,col,options={}){
    map.set(key,{type,x,y,text,col:groupColor(col),alpha:1, ...options});
  }
  function name(map,key,x,y,t,c){guide(map,key,'text',x,y,t,c,{font:19,weight:500});}
  function number(map,key,x,y,t,c,font=46){guide(map,key,'text',x,y,fmt(t),c,{font,weight:570,num:true});}
  function foot(map,key,x,y,t,c='muted',anchor='start'){guide(map,key,'text',x,y,t,c,{font:17,anchor});}
  function icon(map,key,x,y,object,c,s=1){guide(map,key,'icon',x,y,object,c,{s});}
  function rule(map,key,x,y,x2,y2,col='line',dash=false){guide(map,key,'line',x,y,'',col,{x2,y2,dash});}
  function bracket(map,key,x,y,x2,col){guide(map,key,'bracket',x,y,'',col,{x2,y2:y});}
  const hidden = (i,n) => {
    if(n===0)return square(220+(hash(i)%34),166+(hash(i+1)%26),3,0);
    if(n===2 && !people[i].wing)return square(737+(hash(i)%25),348+(hash(i+4)%18),3,0);
    if(n===3 && people[i].city==='absent')return square(125+(hash(i)%70),219+(hash(i+3)%24),3,0);
    if(n>=5)return square(53+(hash(i)%32),151+(hash(i+8)%20),2,0);
    return square(160+(hash(i)%60),209+(hash(i+2)%40),2,0);
  };
  function layout(n) {
    const p=people.map((a,i)=>hidden(i,n)), g=new Map();
    if(n===1){
      grid(p,groups.wing,54,170,15,10.2,7.55,colors.wing);
      grid(p,groups.outside,54+55*10.2,170,15,10.2,7.55,colors.none);
      icon(g,'haswingI',55,63,'wing','wing',1.05);name(g,'haswingN',96,87,'有鞘翅记录','wing');number(g,'haswingV',54,145,wing,'wing',48);
      name(g,'noWingN',619,88,'无鞘翅记录',soft);number(g,'noWingV',617,145,other,soft,42);
      rule(g,'wingSep',610,155,610,326,'line',true);
      bracket(g,'sampleBracket',51,347,816,'line');foot(g,'allN',434,388,'共 '+fmt(D.total)+' 个账号','muted','middle');
    }
    if(n===2){
      grid(p,groups.cabsent,54,167,15,12.35,9.25,colors.wing);
      const yes=groups.wing.filter(i=>people[i].city!=='absent');
      grid(p,yes,640,167,15,12.35,9.25,colors.city);
      icon(g,'haswingI',55,58,'wing','wing',1.05);name(g,'noCityN',96,82,'没有到城记录','wing');number(g,'noCityV',54,140,away,'wing',49);
      icon(g,'cityIcon',637,57,'city','city',.95);name(g,'cityY',676,82,'也到过城','city');number(g,'cityV',638,140,city,'city',47);
      bracket(g,'sampleBracket',50,371,778,'line');foot(g,'wingScope',414,409,'全部 '+wing+' 个有翼账号','muted','middle');
    }
    if(n===3){
      grid(p,groups.cafter,240,153,5,10.8,8.6,colors.city);
      grid(p,groups.cbefore,240,295,5,10.8,8.6,colors.wing);
      foot(g,'first',62,58,'先有的记录');foot(g,'last',684,58,'后有的记录');
      for(const [row,y,qty,begin,end,color] of [['one',175,wingFirst,'wing','city','city'],['two',317,cityFirst,'city','wing','wing']]){
        const a=begin==='wing'?'拿到翅膀':'到达末地城', b=end==='wing'?'拿到翅膀':'到达末地城';
        icon(g,row+'a',70,y-26,begin,color,1.12);name(g,row+'at',53,y+43,a,color);
        icon(g,row+'b',704,y-26,end,color,1.12);name(g,row+'bt',675,y+43,b,color);
        rule(g,row+'r1',133,y,219,y,'line',true);
        rule(g,row+'r2',245+Math.ceil(qty/5)*10.8,y,670,y,'line',true);
        guide(g,row+'arrow','arrow',665,y,'','line');
        number(g,row+'v',237,y-40,qty,color,35);
      }
    }
    if(n===4){
      grid(p,groups.sbefore,55,173,15,10.8,8.2,colors.seed);
      grid(p,groups.safter,287,173,15,10.8,8.2,colors.city);
      grid(p,groups.sabsent,566,173,15,10.8,8.2,colors.olive);
      for(const i of groups.wing) if(people[i].seed!=='absent')p[i].sprout=1;
      name(g,'sN',54,82,'先播种','seed');number(g,'sV',52,145,sFirst,'seed',46);
      name(g,'wN',286,82,'先拿翅膀','city');number(g,'wV',284,145,wSeed,'city',46);
      name(g,'nN',565,82,'无播种记录','olive');number(g,'nV',563,145,noSeed,'olive',42);
      bracket(g,'jointSeed',51,360,495,'seed');icon(g,'seedIcon',120,375,'seed','seed',.88);foot(g,'grown',161,398,fmt(sFirst+wSeed)+' 人，两项都有','seed');
    }
    const record=n===5?D.activity.place_stairs:D.activity[selected];
    return {n,p,g,bars:{alpha:n>=5?1:0, flyWidth:n>=5?fly:0, otherWidth:n>=5?record.positive:0,
      shift:n===6?wing-record.positive:0, hatch:n===6?1:0, mode:n, key:n===5?'place_stairs':selected}};
  }
  const icons={
    wing:'<path d="M15 6 7 3 2 2 4 10 7 16 13 21 15 12 17 12 19 21 25 16 28 10 30 2 25 3 17 6Z" fill="currentColor"/><path d="M5 5 12 9 13 15M27 5 20 9 19 15" fill="none" stroke="#494057" stroke-width="2"/>',
    city:'<path d="M3 27h26v-2h-4V14h3v-3h-4V8h-4v3h-3v3h3v11h-5v-7h2v-3h-6v-5h3V7h-3V3H8v4H5v3h3v15H3z" fill="currentColor"/><path d="M10 19h2v3h-2zm12-3h2v3h-2z" fill="#544655"/>',
    seed:'<path d="M14 27V16H9v-3H5v-3H3V6h6v2h4v4h2v3h2V9h3V6h4V4h5v5h-3v3h-5v3h-4v12z" fill="currentColor"/>',
    stairs:'<path d="M2 25V17h8v-7h8V4h11v21H2Z" fill="currentColor"/><path d="M2 18h9v-7h8V5" stroke="#587262" fill="none" stroke-width="2"/>',
    glass:'<path d="m4 8 12-5 12 5v14l-12 5-12-5zM4 8l12 5 12-5M16 13v14" stroke="currentColor" fill="none" stroke-width="2.4"/><path d="m7 15 4-2m9 5 4-3" stroke="currentColor"/>',
    tool:'<path d="m5 26 4 2 13-17-4-3zm2-20 3-3 13 2 4 5-1 8-3-6-5-4z" fill="currentColor"/>',
    bread:'<path d="M2 19v-5h3v-4h5V7h10v1h5v3h3v7h-3v4h-5v2H8v-2H4v-3z" fill="currentColor"/><path d="m12 9 4 4m4-3 3 3" stroke="#59684e" stroke-width="2"/>',
    compass:'<path d="M5 9 10 4h12l6 6v12l-6 6H10l-6-6z" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="m21 9-3 10-8 4 4-10z" fill="currentColor"/>',
    shelf:'<path d="M3 5h26v22H3zm3 3v7h20V8zm0 10v6h20v-6z" fill="currentColor"/><path d="M9 8v6m5-6v6m5 4v6m4-6v6" stroke="currentColor" stroke-width="2"/>'
  };
  function symbol(k,x,y,color,scale=1){
    return '<g transform="translate('+x+' '+y+') scale('+scale+')" style="color:'+color+'">'+icons[k]+'</g>';
  }
  function txt(x,y,str,color,size,align='start',weight=450,numeric=false){
    const font=numeric?'var(--num)':'var(--sans)';
    return '<text x="'+x+'" y="'+y+'" text-anchor="'+align+'" fill="'+color+'" style="font-family:'+font+';font-variant-numeric:tabular-nums;letter-spacing:'+(numeric?'-.035em':'0')+'" font-size="'+size+'" font-weight="'+weight+'">'+escapeText(str)+'</text>';
  }
  function ruleSvg(x,y,x2,y2,col,dash){return '<path d="M'+x+' '+y+' L'+x2+' '+y2+'" fill="none" stroke="'+col+'" stroke-width="1.3"'+(dash?' stroke-dasharray="3 6"':'')+'/>';}
  function drawGuides(g){
    let html='';
    for(const a of g.values()){
      if(a.alpha<.009)continue;
      const {x,y,col}=a;
      let mark='';
      if(a.type==='text')mark=txt(x,y,a.text,col,a.font,a.anchor,a.weight,a.num);
      if(a.type==='icon')mark=symbol(a.text,x,y,col,a.s);
      if(a.type==='line')mark=ruleSvg(x,y,a.x2,a.y2,col,a.dash);
      if(a.type==='bracket')mark='<path d="M'+x+' '+(y-9)+' v9 H'+a.x2+' v-9" fill="none" stroke="'+col+'" stroke-width="1.5"/>';
      if(a.type==='arrow')mark='<path d="M'+(x-5)+' '+(y-4)+' l7 4 -7 4" stroke="'+col+'" fill="none" stroke-width="1.5"/>';
      html+='<g opacity="'+a.alpha+'">'+mark+'</g>';
    }
    return html;
  }
  function drawBars(b) {
    if(b.alpha<=.004)return '';
    const x=56, width=754, scale=width/wing, fy=141, by=267, h=25, edge=x+width;
    const fx=x+b.flyWidth*scale, start=x+b.shift*scale, right=start+b.otherWidth*scale;
    const action=choices[b.key], overlapping=Math.max(0,b.flyWidth-b.shift),limit=Math.max(0,D.activity[b.key].positive-missingFly);
    const rect=(a,y,w,height,color,extra='')=>'<rect x="'+a+'" y="'+y+'" width="'+Math.max(0,w)+'" height="'+height+'" fill="'+color+'" '+extra+'/>';
    let html=txt(x,59,'人数',soft,18)+txt(edge,59,wing+' 人',soft,19,'end')+ruleSvg(x,75,edge,75,'#706980');
    for(const v of [0,200,400,600,825]){
      const xx=x+v*scale;html+=ruleSvg(xx,73,xx,80,'#8c8199');
      if(v!==825)html+=txt(xx,100,fmt(v),'#ada4b9',15,'middle',430,true);
    }
    html+=symbol('wing',x,fy-36,colors.wing,.86)+txt(x+34,fy-14,'有飞行距离',colors.wing,19);
    html+=rect(x,fy,width,h,'#3e3b50')+rect(x,fy,b.flyWidth*scale,h,colors.wing);
    html+=txt(Math.max(x+95,fx-8),fy+h-5,fmt(b.flyWidth),'#302c3e',22,'end',620,true);
    if(b.flyWidth>=fly-.01){
      const mid=(fx+edge)/2;
      html+=rect(fx,fy,edge-fx,h,'#94807b','opacity=".58"')+
        '<path d="M'+mid+' '+(fy-2)+' v-16 h-19" fill="none" stroke="'+colors.city+'" stroke-width="1.25"/>'+
        txt(mid-24,fy-14,missingFly+' 人无飞行记录',colors.city,16,'end');
    }
    if(b.hatch>.01 && overlapping>0){
      html+='<g opacity="'+b.hatch+'">'+rect(start,fy+h,Math.max(0,fx-start),by-fy-h,'#b9d596','opacity=".12"')
      +rect(start,fy+h,Math.max(0,fx-start),by-fy-h,'url(#hatch)')
      +ruleSvg(start,fy+h,start,by,colors.seed)+ruleSvg(fx,fy+h,fx,by,colors.seed)+'</g>';
    }
    html+=symbol(action.icon,x,by-39,colors.seed,.82)+txt(x+34,by-16,action.verb,colors.seed,19);
    html+=rect(x,by,width,h,'#3e3b50')+rect(start,by,b.otherWidth*scale,h,colors.seed)
      +txt(Math.max(x+85,right-8),by+h-5,fmt(b.otherWidth),'#2c3933',22,'end',620,true);
    if(b.hatch>.01){
      html+='<g opacity="'+b.hatch+'"><path d="M'+start+' '+(by+h+16)+' v9 H'+fx+' v-9" stroke="'+colors.seed+'" fill="none" stroke-width="1.5"/>'
        +txt((start+fx)/2,by+h+61,'至少 '+fmt(limit)+' 人两样都做过',colors.seed,24,'middle',600)
        +'</g>';
    }
    return '<g opacity="'+b.alpha+'">'+html+'</g>';
  }
  const mergeNum=(a,b,t)=>Math.abs(a-b)<.00001?a:mix(a,b,t);
  function interpolate(from,to,t) {
    if(t>=1)return to;if(t<=0)return from;
    const u=smooth(t), p=new Array(people.length);
    for(let i=0;i<people.length;i++){
      const a=from.p[i],b=to.p[i],same=a.x===b.x&&a.y===b.y;
      const lag=same?0:(hash(i)%100)/100*.16;
      const f=smooth((t-lag)/(1-lag));
      const nx=b.x-a.x,ny=b.y-a.y, sweep=Math.sin(Math.PI*f);
      // Lift separated clusters through distinct corridors. Scale marks and exit in place when extracting.
      const sign=to.n===3?(people[i].city==='after'?-1:1):to.n===4?(people[i].seed==='after'?-1:1):(hash(i+15)%2?1:-1);
      const arch=same?0:Math.min(52,Math.hypot(nx,ny)*.15)*sweep*sign;
      const local=a.opacity>0 && b.opacity===0?smooth(t/.67):f;
      const travel=a.opacity>0 && b.opacity===0 && to.n===3?f*.22:f;
      p[i]={x:a.x+nx*travel,y:a.y+ny*travel+arch*(travel===f?1:.2),
        size:mix(a.size,b.size,local),opacity:mix(a.opacity,b.opacity,local),sprout:mix(a.sprout,b.sprout,smooth((t-.13)/.79)),
        col:[mix(a.col[0],b.col[0],f),mix(a.col[1],b.col[1],f),mix(a.col[2],b.col[2],f)]};
    }
    const g=new Map();
    for(const key of new Set([...from.g.keys(),...to.g.keys()])){
      const a=from.g.get(key),b=to.g.get(key),base=b||a;
      if(a&&b){
        const v={...b,x:mix(a.x,b.x,u),y:mix(a.y,b.y,u),alpha:mix(a.alpha,b.alpha,u)};
        if('x2' in b){v.x2=mix(a.x2,b.x2,u);v.y2=mix(a.y2,b.y2,u);}
        g.set(key,v);
      }else if(a){g.set(key,{...base,alpha:a.alpha*(1-smooth(t/.44))});}
      else{g.set(key,{...base,alpha:smooth((t-.12)/.72),y:base.y+5*(1-u)});}
    }
    const a=from.bars,b=to.bars;
    const bars={alpha:mergeNum(a.alpha,b.alpha,u),flyWidth:mergeNum(a.flyWidth,b.flyWidth,u),otherWidth:mergeNum(a.otherWidth,b.otherWidth,u),shift:mergeNum(a.shift,b.shift,u),
      hatch:mergeNum(a.hatch,b.hatch,b.hatch>a.hatch?smooth((t-.42)/.56):smooth(t/.45)),mode:to.n,key:b.alpha?b.key:a.key};
    return {n:to.n,p,g,bars};
  }
  let pose=layout(0),animation=null,frame=0;
  const marks=$('#marks'),ink=$('#ink'),under=$('#underlay');
  function fit(){
    const box=plot.getBoundingClientRect();if(box.width<1)return;
    const dpi=Math.min(2,devicePixelRatio||1);
    marks.width=Math.round(box.width*dpi); marks.height=Math.round(box.height*dpi);
    ctx.setTransform(marks.width/880,0,0,marks.height/456,0,0);
    render(pose);
  }
  function render(v){
    pose=v;ctx.clearRect(0,0,880,456);
    for(const a of v.p){if(a.opacity<.014 || a.size<.3)continue;
      ctx.globalAlpha=clamp(a.opacity);ctx.fillStyle='rgb('+((a.col[0]+.5)|0)+' '+((a.col[1]+.5)|0)+' '+((a.col[2]+.5)|0)+')';
      if(a.sprout<.005){ctx.fillRect(a.x,a.y,a.size,a.size);}
      else{
        // Each seedling still occupies one slot. Its two upper pixels open as the base narrows to a stem.
        const s=a.size, t=a.sprout;
        ctx.fillRect(a.x+s*.36*t,a.y+s*.15*t,s*(1-.69*t),s*(1-.15*t));
        ctx.fillRect(a.x,a.y+s*.06*t,s*(1-.55*t),s*(1-.64*t));
        ctx.fillRect(a.x+s*.56*t,a.y,s*(1-.55*t),s*(1-.65*t));
      }
    }
    ctx.globalAlpha=1;
    ink.innerHTML=drawGuides(v.g);
    under.innerHTML=drawBars(v.bars);
  }
  function sample(now){if(!animation)return pose;return interpolate(animation.from,animation.to,clamp((now-animation.start)/animation.ms));}
  function play(now){
    frame=0;if(!animation)return;
    render(sample(now));
    if(now-animation.start<animation.ms){frame=requestAnimationFrame(play);}
    else{render(animation.to);animation=null;}
  }
  function changeView(n,instant=false,metric=false){
    const now=performance.now(),start=sample(now);cancelAnimationFrame(frame);
    const to=layout(n);
    if(instant || matchMedia('(prefers-reduced-motion: reduce)').matches){animation=null;render(to);return;}
    animation={from:start,to,start:now,ms:metric?760:n===6?1200:n===3||n===4?1100:880};
    play(now);
  }
  function step(n,instant=false){
    if(n===currentStep && !instant)return;
    const previous=currentStep;currentStep=n;stage.dataset.step=n;
    evidence.inert=n===0;$('#coverVisual').inert=n!==0;
    if(n===5 && previous!==6)selected='place_stairs';
    showCopy(n);setAlt(n);
    $('#plate-name').textContent=figureNames[n];$('#plot-scope').textContent=scopes[n];$('#plot-note').textContent=hints[n];
    $('#next-word').textContent=navNames[n];
    $('#back').disabled=!n;
    changeView(n,instant);
  }
  const book=$('#book');
  const pageHeight=()=>stage.getBoundingClientRect().height||innerHeight;
  function readScroll() {
    const y=Math.max(0,-book.getBoundingClientRect().top)/pageHeight();
    const n=clamp(y/6)*6;
    let target=Math.min(6,Math.max(0,Math.floor(n+.37)));
    if(target<currentStep && n>currentStep-.47)target=currentStep;
    step(target);
  }
  let scheduled=false;addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(()=>{scheduled=false;readScroll();});}},{passive:true});
  function go(n){
    if(n>6){$('#ground').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});return;}
    const target=Math.max(0,n),top=scrollY+book.getBoundingClientRect().top+target*pageHeight();
    window.scrollTo({top,behavior:'instant'});step(target);
  }
  $('#start').onclick=()=>go(1);$('#forward').onclick=()=>go(currentStep+1);$('#back').onclick=()=>go(currentStep-1);
  $('#restart').onclick=()=>go(0);$('.brand').onclick=(e)=>{e.preventDefault();go(0);};
  const dialog=$('#sources');
  document.querySelectorAll('[data-sources]').forEach(b=>b.onclick=()=>dialog.showModal());
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  addEventListener('keydown',e=>{
    if(dialog.open||e.altKey||e.ctrlKey||e.metaKey||['SELECT','INPUT','TEXTAREA'].includes(e.target.tagName))return;
    if(['ArrowDown','PageDown','ArrowRight','ArrowUp','PageUp','ArrowLeft','Home','End'].includes(e.key)){
      e.preventDefault();if(e.repeat)return;
      if(e.key==='Home')return go(0);if(e.key==='End')return go(7);
      const back=['ArrowUp','PageUp','ArrowLeft'].includes(e.key);
      if(back && $('#ground').getBoundingClientRect().top<innerHeight*.85)return go(6);
      go(currentStep+(back?-1:1));
    }
  });
  new ResizeObserver(fit).observe(plot);
  let lastHeight=pageHeight();
  addEventListener('resize',()=>{
    const height=pageHeight(), top=scrollY+book.getBoundingClientRect().top;
    const previousPage=(scrollY-top)/lastHeight;
    if(height!==lastHeight && previousPage>=0 && previousPage<=6.7){
      window.scrollTo({top:top+previousPage*height,behavior:'instant'});
    }
    lastHeight=height;fit();readScroll();
  });
  step(0,true);fit();
  const hashIndex=sections.indexOf(location.hash.slice(1));
  if(hashIndex>0)requestAnimationFrame(()=>go(hashIndex));else requestAnimationFrame(readScroll);
})();
