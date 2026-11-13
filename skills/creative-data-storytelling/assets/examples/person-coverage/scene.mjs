// 改编入口：coverageData / sizing-coverage.mjs 配分布和边界；coverageX / coverageLayout 管共同轴与避让；example.states 配正文，example.mount 返回 pose / blend / render。替换数据时同步代表选择、标注与布局；只换素材时保留量值锚点。
// 叙事与设计理由见本页 example-notes。预览控件可替换为作品自己的阅读接线。
import {el,txt,line,attr,lerp,clamp01,mix} from '../segment-draw.mjs';
import {waistGroups,groupSamples,regularRange,sizeReference} from './sizing-coverage.mjs';

export const coverageData={offer:regularRange,groupA:groupSamples(waistGroups[0]),groupB:groupSamples(waistGroups[1])};
export function outside(rows,range=coverageData.offer){return rows.filter(r=>r.value<range[0]||r.value>range[1]).length;}
export const coverageX=value=>520+(value-55)*10.9375;
export function coverageLayout(rows){
 const placed=[];
 return rows.map(row=>{const x=coverageX(row.value),taken=new Set(placed.filter(p=>Math.abs(p.x-x)<24).map(p=>p.rank));let rank=0;while(taken.has(rank))rank++;const point={...row,x,rank};placed.push(point);return point;});
}
const HERO='teen-p50',HX=coverageX(77.2),neutral='#8795a3',focus='#e3671c',heroColor='#245d98';
const focusText='#b84b0c';
function blendColor(a,b,t){const c=[1,3,5].map(i=>Math.round(lerp(parseInt(a.slice(i,i+2),16),parseInt(b.slice(i,i+2),16),t)));return 'rgb('+c.join(',')+')';}

// A figure marks a sampled percentile, not an individual survey record.
// Its width and height are illustrative; horizontal position encodes waist circumference.
function figure(parent,{variant=0,hero=false}={}){
 const g=el(parent,'g'),skin=['#c7997d','#d7b398','#aa785f'][variant%3],hair=['#3e3934','#6b4b38','#343c39'][variant%3],clothes=[];
 el(g,'ellipse',{cx:0,cy:1,rx:35,ry:4,fill:'#293d35',opacity:.08});
 el(g,'path',{d:'M-20 -59 L-17 -9 L-25 -3 L-4 -3 L2 -57 M7 -57 L9 -3 L32 -3 L21 -10 L27 -58',fill:'#364d50'});
 el(g,'path',{d:'M-25 -7 L-7 -7 L-6 0 L-33 0 Q-35 -4 -25 -7 M11 -7 L26 -7 L36 -2 L36 0 L11 0Z',fill:'#efe8d9',stroke:'#526361','stroke-width':1.1});
 el(g,'path',{d:'M-20 -153 Q-40 -149 -48 -121 L-57 -84 Q-60 -77 -51 -73 L-44 -83 L-31 -116 L-22 -90 L25 -90 L33 -116 L43 -87 Q47 -78 54 -83 L47 -119 Q39 -148 21 -153Z',fill:skin});
 clothes.push(el(g,'path',{d:'M-17 -155 L-33 -149 L-44 -129 L-31 -117 L-25 -128 L-25 -99 L27 -99 L29 -128 L35 -117 L46 -129 L34 -149 L18 -155 Q0 -144 -17 -155Z',fill:hero?heroColor:neutral}));
 clothes.push(el(g,'path',{d:variant%2?'M-25 -99 L-31 -49 L-4 -49 L0 -82 L7 -49 L33 -49 L27 -99Z':'M-25 -99 Q-31 -76 -38 -45 Q0 -34 40 -45 L27 -99Z',fill:hero?heroColor:neutral}));
 el(g,'path',{d:'M-24 -97 L27 -97',stroke:'#e7d5b7','stroke-width':3});
 el(g,'path',{d:'M-13 -90 L-20 -48 M13 -90 L21 -46',stroke:'#f9f0dc','stroke-width':1.2,opacity:.45});
 el(g,'path',{d:'M-8 -166 L-8 -151 Q0 -142 9 -151 L9 -166Z',fill:skin});
 el(g,'path',{d:variant%3===0?'M-18 -174 Q-25 -199 -1 -201 Q23 -202 23 -177 L28 -153 L-23 -153Z':'M-20 -177 Q-23 -201 1 -201 Q24 -200 22 -174 L18 -158 L-17 -159Z',fill:hair});
 el(g,'path',{d:'M-14 -183 Q-4 -176 8 -190 L17 -179 L14 -163 Q1 -146 -12 -164Z',fill:skin});
 el(g,'path',{d:'M-18 -181 Q-17 -199 2 -198 Q21 -197 23 -180 L14 -173 L7 -188 Q0 -175 -18 -177Z',fill:hair});
 line(g,-8,-170,-5,-170,{stroke:'#463e37','stroke-width':1});line(g,6,-170,9,-170,{stroke:'#463e37','stroke-width':1});
 el(g,'path',{d:'M-2 -161 Q2 -158 7 -163',fill:'none',stroke:'#885f50','stroke-width':1});
 if(hero){el(g,'path',{d:'M42 -113 Q59 -117 64 -104 L66 -81 L43 -77Z',fill:'#c6a86e',stroke:'#977c49','stroke-width':1.3});el(g,'path',{d:'M46 -111 Q45 -137 60 -112',fill:'none',stroke:'#977c49','stroke-width':2});}
 return {g,clothes};
}

export const example={
 id:'person-coverage',short:'人物与覆盖',title:'腰围接近 M 码，其他人呢？',eyebrow:'从一个女孩，到一套尺码的边界',viewBox:'0 0 1440 720',duration:1900,
 theme:{paper:'#fbfaf7',ink:'#293440',muted:'#64717b',accent:focusText,line:'#d8dfe4',panel:'#ffffff'},dataBadge:'统计数据',dataCaption:'美国 · 2021–2023。人物为各组腰围百分位示意，并非个体跟踪。',
 states:[
  {name:'从女孩组的中间位置开始',title:'她的腰围，<br>接近 <em style="color:#245d98">M 码</em>。',description:'这位示意女孩代表 14–15 岁人群的中间位置：腰围 77.2 厘米，接近这套女装参照中的 M 码。只看腰围，还不能判断整件衣服合身。',highlights:[{text:'77.2 厘米',color:heroColor}],value:'',unit:'',metric:''},
  {name:'同龄女孩，进入同一套尺码',title:'她站在中间，<br><em style="color:#245d98">女孩们却各不相同。</em>',description:'同龄人的腰围有宽有窄。中间位置接近 M 码，不代表这套 00–16 码参照能覆盖所有人；有些位置已在范围之外。',value:'',unit:'',metric:''},
  {name:'保留女孩分布，加入成年女性',title:'再看成年女性，<br><em>同一套尺码够吗？</em>',description:'20 岁及以上女性的腰围中位数为 95.7 厘米。这套参照的上限，还能覆盖人群的中间位置吗？',highlights:['95.7 厘米'],value:'',unit:'',metric:''},
  {name:'尺码上限，落在人群中间之前',title:'这套尺码的上限，<br><em>低于成年组中位数。</em>',description:'这组 00–16 码腰围参照最高为 91.4 厘米；在这份美国数据中，20 岁及以上女性的中位数是 95.7 厘米。至少一半成年女性的腰围在范围之外，开头那位女孩的位置不能代表这一群体。',highlights:['91.4 厘米','95.7 厘米'],value:'',unit:'',metric:''}
 ],
 notes:{
  why:'抽取 Sizing Chaos 的年龄与覆盖主线：先从 15 岁女孩和 M 码建立处境，再把她缩小放回同龄分布，最后用成年女性检验同一套尺码。蓝色承接尺码参照；橙色把边界、超出范围的人物和数字连在一起。',
  preserve:'主角始终是女孩组的第 50 百分位，缩小后仍能追踪；成年组单独加入，女孩组保留。腰围尺度和 00–16 码参照不变。人物表示百分位位置，不代表真实受访者，也不是同一批女孩长大后的记录。',
  adapt:'这段解释可以换成设备适配不同年龄的使用者、房源覆盖不同收入家庭、服务范围面对不同需求群体。取用的是“一个熟悉对象 → 分布 → 新群体检验同一边界”的追问；也可以换为点、密度、条形或实物，重新设计布局和运动。',
  data:'腰围来自 NCHS 2021–2023 表 11–12。14–15 岁女性样本数 118，20 岁及以上女性 3,121；中位数分别 77.2、95.7 cm。只展示各组 P10–P90，并在公布百分位之间线性插值，每 2 个百分点绘制一个示意人物。女装参考来自原作转录的 ASTM 2021；00–16 为本例比较范围，不是所有品牌的统一供给。M 色带按相邻规格参照的中点分界；覆盖只看腰围，不表示整件衣服合身。插画为自行绘制。',
  source:[['Sizing Chaos · 人物进入群体与尺码边界','https://pudding.cool/2026/02/womens-sizing/'],['NCHS · 美国人体测量参考数据，2021–2023','https://stacks.cdc.gov/view/cdc/174595']]
 },
 mount(svg){
  const defs=el(svg,'defs'),clip=el(defs,'clipPath',{id:'coverage-stage'});el(clip,'rect',{x:505,y:60,width:905,height:602});
  const clipped=el(svg,'g',{'clip-path':'url(#coverage-stage)'}),back=el(clipped,'g');
  const regular=el(back,'rect',{y:169,height:485,fill:'#9abbd9'}),mBand=el(back,'rect',{y:169,height:485,fill:'#6f9bc5'});
  const beyond=el(back,'rect',{y:169,height:485,fill:'#fff1e5'});
  const rangeLine=el(clipped,'path',{fill:'none',stroke:'#668bae','stroke-width':1.2}),rangeTitle=txt(clipped,0,83,'女装 00–16 码参照',{'text-anchor':'middle',style:'font-size:14px;fill:#416b90'});
  const mTitle=txt(clipped,0,138,'M',{'text-anchor':'middle',class:'num',style:'font-size:46px;fill:#245d98'}),mCaption=txt(clipped,0,158,'8–10 码',{'text-anchor':'middle',style:'font-size:11px;fill:#416b90'});
  const sizeTicks=[];
  for(const size of ['00','4','8','12','16']){
   const ref=sizeReference.find(r=>r.size===size),g=el(clipped,'g');line(g,0,155,0,164,{stroke:'#83a0ba'});txt(g,0,143,size,{'text-anchor':'middle',class:'num',style:'font-size:16px;fill:#416b90'});sizeTicks.push({g,cm:ref.cm});
  }
  const boundary=line(clipped,0,165,0,655,{stroke:'#7895ae','stroke-width':1.5,'stroke-dasharray':'4 5'});
  const boundaryNote=el(svg,'g'),boundaryLead=el(boundaryNote,'path',{fill:'none',stroke:focus,'stroke-width':1.2});
  const boundaryLabel=txt(boundaryNote,0,201,'16 码的腰围参照',{fill:focusText,style:'font-size:12px'}),boundaryValue=txt(boundaryNote,0,229,'91.4 cm',{class:'num',fill:focusText,style:'font-size:28px'});
  const ageA=txt(svg,520,330,'14–15 岁女孩',{style:'font-size:16px;fill:#526b81'}),ageB=txt(svg,520,470,'20 岁及以上女性',{style:'font-size:16px;fill:#526b81'});
  const percentileNote=txt(svg,520,48,'显示各组中央 80% 的分布',{style:'font-size:16px;fill:#516874'});
  const medianLayer=el(clipped,'g'),medianA=line(medianLayer,0,0,0,0,{stroke:heroColor,'stroke-width':1,opacity:.4,'stroke-dasharray':'2 5'}),medianB=line(medianLayer,0,0,0,0,{stroke:focus,'stroke-width':1,opacity:.4,'stroke-dasharray':'2 5'});
  const nodes=[];
  for(const [group,rows] of [['teen',coverageData.groupA],['adult',coverageData.groupB]])for(const [i,row] of coverageLayout(rows).entries()){
   const isHero=row.id===HERO,{g,clothes}=figure(clipped,{variant:isHero?0:i,hero:isHero});g.dataset.recordId=row.id;g.dataset.cohort=group;
   nodes.push({...row,group,isHero,g,clothes});
  }
  const hero=nodes.find(n=>n.isHero);clipped.append(hero.g);
  const aCaption=txt(svg,0,633,'中位数 77.2 cm',{'text-anchor':'middle',fill:heroColor,style:'font-size:16px'});
  const bTag=el(svg,'g'),bDot=el(bTag,'circle',{r:2.5,fill:focus}),bLead=el(bTag,'path',{fill:'none',stroke:focus,'stroke-width':1});
  const bCaption=txt(bTag,0,644,'中位数 95.7 cm',{fill:focusText,style:'font-size:18px'});
  const intro=el(svg,'g'),tape=line(intro,0,0,0,0,{stroke:'#fff3ca','stroke-width':3}),lead=el(intro,'path',{fill:'none',stroke:heroColor,'stroke-width':1.3});
  const value=txt(intro,0,0,'77.2 cm',{class:'num',fill:heroColor,style:'font-size:32px'}),caption=txt(intro,0,0,'女孩组的腰围中位数',{style:'font-size:13px;fill:#526b81'});
  const heroTag=el(svg,'g'),heroLead=el(heroTag,'path',{fill:'none',stroke:heroColor,'stroke-width':1}),heroText=txt(heroTag,0,0,'开头的她',{fill:heroColor,style:'font-size:13px'});
  const axis=el(svg,'g'),axisLine=line(axis,520,678,1395,678,{stroke:'#aab5bf'}),ticks=[];
  for(let cm=60;cm<=130;cm+=10){const g=el(axis,'g');line(g,0,678,0,683,{stroke:'#aab5bf'});txt(g,0,705,String(cm),{'text-anchor':'middle',class:'num',style:'font-size:13px'});ticks.push({g,cm});}
  txt(axis,1395,665,'腰围 / cm',{'text-anchor':'end',style:'font-size:12px;fill:#64717b'});
  function pose(step){return{step,group:step>=1?1:0,adult:step>=2?1:0,focus:step>=3?1:0};}
  function render(p){
   const q=p.group,b=p.adult,f=p.focus,z=lerp(3.8,1,q),anchor=lerp(960,HX,q),sx=x=>anchor+(x-HX)*z;
   const reveal=clamp01((q-.2)/.8),lo=sx(coverageX(regularRange[0])),hi=sx(coverageX(regularRange[1]));
   // M uses midpoints between the adjacent ASTM reference sizes, not a fabricated 10-cm interval.
   const ml=sx(coverageX((72.39+74.93)/2)),mr=sx(coverageX((77.47+81.915)/2));
   attr(regular,{x:lo,width:hi-lo,opacity:reveal*.62});attr(mBand,{x:ml,width:mr-ml,opacity:lerp(.62,.2,q)});
   attr(beyond,{x:hi,width:Math.max(0,1395-hi),opacity:f*.32});
   attr(rangeLine,{d:'M'+lo+',114 V102 H'+hi+' V114',opacity:reveal});attr(rangeTitle,{x:(lo+hi)/2,opacity:reveal});
   attr(mTitle,{x:(ml+mr)/2,opacity:1-clamp01(q*1.4)});attr(mCaption,{x:(ml+mr)/2,opacity:1-clamp01(q*1.4)});
   for(const t of sizeTicks){const x=sx(coverageX(t.cm));attr(t.g,{transform:'translate('+x+' 0)',opacity:reveal*(x>=515&&x<=1400?1:0)});}
   attr(boundary,{x1:hi,x2:hi,opacity:reveal,stroke:blendColor('#7895ae',focus,f),'stroke-width':lerp(1.4,3,f)});
   attr(boundaryNote,{opacity:f});attr(boundaryLead,{d:'M'+hi+',184 H'+(hi+38)+' V189'});attr(boundaryLabel,{x:hi+48});attr(boundaryValue,{x:hi+48});
   const baseA=lerp(604,390,b),spaceA=40,scaleA=.18;
   const baseB=610,spaceB=40,scaleB=.18;
   for(const n of nodes){
    const adult=n.group==='adult',base=adult?baseB:baseA,space=adult?spaceB:spaceA,feet=base-n.rank*space;
    const x=sx(n.x),y=n.isHero?lerp(622,feet,q):adult?lerp(662,feet,b):lerp(654,feet,q),scale=n.isHero?lerp(1.82,scaleA,q):adult?scaleB:scaleA;
    const entry=n.isHero?1:adult?clamp01(b*1.2-n.rank*.04):clamp01(q*1.25-n.rank*.025);
    const muted=adult?1:lerp(1,.8,b);
    attr(n.g,{transform:'translate('+x+' '+y+') scale('+scale+')',opacity:entry*muted});
    const outsideRange=n.value>regularRange[1],baseColor=n.isHero?heroColor:neutral;
    const emphasis=adult?f:0,color=blendColor(baseColor,outsideRange?focus:baseColor,emphasis);
    for(const part of n.clothes)attr(part,{fill:color});
    if(n.isHero){
     const waistY=y-97*scale,lx=x+123,ly=waistY-38;
     attr(tape,{x1:x-24*scale,x2:x+26*scale,y1:waistY,y2:waistY});attr(lead,{d:'M'+(x+27*scale)+','+waistY+' L'+(lx-14)+','+(ly+4)});attr(value,{x:lx,y:ly});attr(caption,{x:lx,y:ly+23});
     attr(heroText,{x:x-80,y:y-67});attr(heroLead,{d:'M'+(x-18)+','+(y-63)+' L'+(x-3)+','+(y-40)});
    }
   }
   const ax=sx(HX),bx=sx(coverageX(95.7));
   attr(intro,{opacity:clamp01(1-q*2)});attr(heroTag,{opacity:clamp01((q-.75)/.25)*(1-b)});
   attr(ageA,{opacity:reveal,y:lerp(350,190,b)});attr(ageB,{opacity:clamp01((b-.45)/.55)});attr(percentileNote,{opacity:reveal});
   attr(medianA,{x1:ax,x2:ax,y1:baseA-195,y2:baseA+10,opacity:reveal*.5});attr(medianB,{x1:bx,x2:bx,y1:488,y2:baseB+13,opacity:b*.65});
   attr(aCaption,{x:ax,y:baseA+32,opacity:reveal});attr(bTag,{opacity:clamp01((b-.65)/.35)});attr(bDot,{cx:bx,cy:baseB+10});attr(bLead,{d:'M'+bx+','+(baseB+13)+' V'+(baseB+28)+' H'+(bx+12)});attr(bCaption,{x:bx+18,y:baseB+34});
   attr(axis,{opacity:reveal});attr(axisLine,{x1:Math.max(520,sx(coverageX(55))),x2:Math.min(1395,sx(coverageX(135)))});
   for(const tick of ticks){const x=sx(coverageX(tick.cm));attr(tick.g,{transform:'translate('+x+' 0)',opacity:x>=515&&x<=1405?1:0});}
  }
  return{pose,blend:mix,render};
 }
};
