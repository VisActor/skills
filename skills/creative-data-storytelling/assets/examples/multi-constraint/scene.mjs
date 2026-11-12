// 改编入口：fitData 换身体与候选规格；fitDifferences 计算差异，contourWidth / outline 定义轮廓；example.mount 中 pose / render 安排当前部位、轮廓变换与标注。
// 叙事与设计理由见本页 example-notes。预览控件可替换为作品自己的阅读接线。
import {el,txt,line,attr,mix,lerp,clamp01} from '../segment-draw.mjs';

export const fitData={body:{waist:84,hip:98},sizes:{M:{waist:76,hip:98},L:{waist:84,hip:106}}};
export function fitDifferences(size){return {waist:fitData.sizes[size].waist-fitData.body.waist,hip:fitData.sizes[size].hip-fitData.body.hip};}
const CX=1000,K=3,YW=254,YH=488;
// The two circumference measurements drive a schematic contour, not a 3D fit simulation.
export function contourWidth(y,waist,hip){
 const anchors=[[80,waist*K+38],[YW,waist*K],[YH,hip*K],[665,hip*K*.87]];
 let i=anchors.findIndex((a,j)=>j<3&&y<=anchors[j+1][0]);if(i<0)i=2;
 const [y0,a]=anchors[i],[y1,b]=anchors[i+1],t=Math.max(0,Math.min(1,(y-y0)/(y1-y0))),s=t*t*(3-2*t);
 return lerp(a,b,s);
}
const ys=Array.from({length:118},(_,i)=>80+i*5);
function outline(w,h){return ys.map((y,i)=>`${i?'L':'M'}${CX-contourWidth(y,w,h)},${y}`).join(' ')+ys.toReversed().map(y=>` L${CX+contourWidth(y,w,h)},${y}`).join(' ')+'Z';}
function gap(w,h,side){return ys.map((y,i)=>`${i?'L':'M'}${CX+side*contourWidth(y,fitData.body.waist,fitData.body.hip)},${y}`).join(' ')+ys.toReversed().map(y=>` L${CX+side*contourWidth(y,w,h)},${y}`).join(' ')+'Z';}
export const example={
 id:'multi-constraint',short:'多条件适配',title:'腰合适，为什么臀围又不合适？',eyebrow:'同一个身体，两处尺寸',viewBox:'0 0 1440 720',duration:1650,
 theme:{paper:'#f3f0e7',ink:'#333e43',muted:'#727d80',accent:'#ba5436',line:'#d6d8d0',panel:'#faf8ef'},
 dataCaption:'身体与尺码为演示设定；轮廓不是穿着模拟。',
 states:[
  {name:'按腰围，选 L',title:'腰围对上了。<br><em>这就合适了吗？</em>',description:'沿着腰围看：身体是 84 厘米，L 号也是 84 厘米。两条轮廓在这里相遇。',value:'',unit:'',metric:''},
  {name:'还是 L，再看臀围',title:'同一个尺码，<br><em>臀围却偏大。</em>',description:'身体没有变，衣服也没有换。顺着轮廓往下看，L 号的臀围比身体多出 8 厘米。',value:'',unit:'',metric:''},
  {name:'换成 M，两个部位一起变',title:'臀围对上了，<br><em>腰围又偏小。</em>',description:'换成 M 号，臀围正好是 98 厘米；腰围却缩到 76 厘米，比身体少 8 厘米。',value:'',unit:'',metric:''}
 ],
 mount(svg){
  const defs=el(svg,'defs'),pattern=el(defs,'pattern',{id:'fit-paper-grid',width:28,height:28,patternUnits:'userSpaceOnUse'});el(pattern,'path',{d:'M28 0H0V28',fill:'none',stroke:'#d6d9cf','stroke-width':.6});
  el(svg,'rect',{x:565,y:40,width:835,height:640,fill:'url(#fit-paper-grid)',opacity:.5});
  line(svg,CX,52,CX,686,{stroke:'#bec9c5','stroke-dasharray':'2 7','stroke-width':1});
  const body=el(svg,'path',{'data-body-reference':'fixed',d:outline(fitData.body.waist,fitData.body.hip),fill:'#c6d9db','fill-opacity':.61,stroke:'#6f9197','stroke-width':2});
  const gapLeft=el(svg,'path',{fill:'#e59960','fill-opacity':.18}),gapRight=el(svg,'path',{fill:'#e59960','fill-opacity':.18});
  const garment=el(svg,'path',{'data-garment-reference':'changing',fill:'none',stroke:'#9e829b','stroke-width':3.2});
  const active=el(svg,'path',{'data-fit-highlight':'current',fill:'none',stroke:'#c95e34','stroke-width':5,'stroke-linecap':'round'});
  const legend=el(svg,'g');el(legend,'rect',{x:603,y:8,width:18,height:12,rx:2,fill:'#c6d9db',stroke:'#6f9197'});txt(legend,632,19,'身体 · 始终不变',{style:'font-size:14px'});line(legend,833,14,862,14,{stroke:'#9e829b','stroke-width':3});txt(legend,873,19,'所选尺码',{style:'font-size:14px'});el(legend,'rect',{x:1042,y:8,width:18,height:12,fill:'#e59960'});txt(legend,1071,19,'两者的差异',{style:'font-size:14px'});
  const size=txt(svg,CX,143,'L',{'text-anchor':'middle',class:'num',style:'font-size:44px;fill:#7e6b80'});
  const sizeSub=txt(svg,CX,164,'所选尺码',{'text-anchor':'middle',class:'tiny'});
  const waistRule=line(svg,CX-fitData.body.waist*K,YW,CX+fitData.body.waist*K,YW,{stroke:'#557c83','stroke-width':2.2,'stroke-dasharray':'4 5'});
  const hipRule=line(svg,CX-fitData.body.hip*K,YH,CX+fitData.body.hip*K,YH,{stroke:'#557c83','stroke-width':2.2,'stroke-dasharray':'4 5'});
  const annotations=[];
  for(const [key,y,label,target] of [['waist',YW,'腰围',fitData.body.waist],['hip',YH,'臀围',fitData.body.hip]]){
   const g=el(svg,'g');txt(g,600,y-12,label,{style:'font-size:17px;fill:#527981'});txt(g,600,y+16,`身体 ${target} cm`,{style:'font-size:14px;fill:#527981'});
   line(g,697,y,CX-target*K-7,y,{stroke:'#7e9da0','stroke-width':1});
   const number=txt(g,1418,y-12,'',{'text-anchor':'end',class:'num',style:'font-size:26px;fill:#9f4e35'});
   const labelText=txt(g,1418,y+15,'',{'text-anchor':'end',style:'font-size:13px;fill:#9f4e35'});
   const lead=line(g,CX+target*K+7,y,1340,y,{stroke:'#b96a49','stroke-width':1.5});
   annotations.push({key,y,g,number,labelText,lead,target});
  }
  const callout=el(svg,'g');const leader=el(callout,'path',{fill:'none',stroke:'#bb5b36','stroke-width':1.5});
  const difference=txt(callout,943,575,'',{'text-anchor':'end',style:'font-size:35px;fill:#b95231',class:'num'});
  const detail=txt(callout,943,601,'',{'text-anchor':'end',style:'font-size:14px;fill:#99523c'});
  txt(svg,998,704,'横向按围度统一比例示意 · 不是实物正面尺寸',{'text-anchor':'middle',class:'tiny'});
  function pose(step){return {step,waist:fitData.sizes[step===2?'M':'L'].waist,hip:fitData.sizes[step===2?'M':'L'].hip,hipFocus:step===0?0:1,swap:step===2?1:0};}
  function render(p){
   const hw=p.hip,ww=p.waist,f=p.hipFocus,s=p.swap;
   attr(garment,{d:outline(ww,hw)});for(const [node,side] of [[gapLeft,-1],[gapRight,1]])attr(node,{d:gap(ww,hw,side),'fill-opacity':lerp(.14,.79,f)});
   // Highlight travels along the same contour; it does not replace the whole picture.
   const returnToWaist=clamp01((s-.6)/.4);
   const fy=lerp(lerp(YW,YH,f),YW,returnToWaist),low=fy-44,high=fy+44;
   const activeYs=Array.from({length:30},(_,i)=>low+(high-low)*i/29);
   attr(active,{d:[-1,1].map(side=>activeYs.map((y,i)=>`${i?'L':'M'}${CX+side*contourWidth(y,ww,hw)},${y}`).join(' ')).join(' '),opacity:1});
   attr(waistRule,{opacity:1});attr(hipRule,{opacity:lerp(.3,1,f)});
   const settled=Math.max(0,1-Math.min(s,1-s)*6);
   size.textContent=s<.5?'L':'M';attr(size,{opacity:.85*settled});
   for(const a of annotations){const v=p[a.key],isHip=a.key==='hip';attr(a.g,{opacity:isHip?lerp(.32,1,f):1});a.number.textContent=`${s<.5?fitData.sizes.L[a.key]:fitData.sizes.M[a.key]} cm`;a.labelText.textContent=`${s<.5?'L':'M'} 号${isHip?'臀围':'腰围'}`;attr(a.number,{opacity:settled});attr(a.labelText,{opacity:settled});attr(a.lead,{x1:CX+Math.max(v,a.target)*K+7,x2:1340,opacity:settled});}
   const delta=fitDifferences(s<.5?'L':'M')[s<.5?'hip':'waist'];difference.textContent=(delta<0?'−':delta>0?'+':'')+Math.abs(delta)+' cm';
   detail.textContent=s<.5?'臀围多出的部分':'腰围不足的部分';
   const cy=lerp(568,346,s),cx=lerp(943,1020,s);attr(difference,{x:cx,y:cy});attr(detail,{x:cx,y:cy+27});
   const anchorX=CX+(s<.5?contourWidth(YH,fitData.body.waist,fitData.body.hip)+12:contourWidth(YW,ww,hw)+12),anchorY=lerp(YH,YW,s);
   attr(leader,{d:`M${cx+12} ${cy-12} L${anchorX-28} ${cy-12} L${anchorX} ${anchorY}`});attr(callout,{opacity:clamp01((f-.6)/.4)*settled});
  }
  return {pose,blend:mix,render};
 }
};
