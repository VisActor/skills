import { flowPoint } from './mechanics/motion.mjs';

const ORANGE = '#ff985c', GRAY = '#b6c3c8', INK = '#f0f0e9', MUTED = '#aab5bc';
const lerp = (a,b,t) => a+(b-a)*t;
export function createSceneModel(data, W, H) {
  const metrics = ['people_pct','minute_pct'];
  const share = (era,metric) => data[era].bins.filter(b=>b.height<=79).reduce((n,b)=>n+b[metric],0);
  const values = metrics.map(metric=>[share(0,metric),share(1,metric)]);
  const gains = values.map(v=>v[1]-v[0]);
  const source = new Map();
  for (let era=0;era<2;era++) for(const metric of metrics) {
    let before=0;
    for(const bin of data[era].bins) {
      for(let j=0;j<Math.ceil(bin[metric]-1e-10);j++) {
        const id=[era,metric,bin.height,j].join(':');
        source.set(id,{id,era,metric,height:bin.height,j,f:Math.min(1,bin[metric]-j),pos:before+j});
      }
      before+=bin[metric];
    }
  }
  const start=190, step=(W-270)/100, zero=Math.max(270,W*.26), gainStep=(W-130-zero)/35;
  const base=era=>H*(era===0?.42:.88);
  const xheight=h=>205+(h-76)*(W-270)/11;
  const row=(state,era,metric)=>{
    if(state===1)return H*(era===0?.30:.70);
    if(state===2)return H*(metric==='people_pct'?(era===0?.18:.34):(era===0?.65:.81));
    return H*(metric==='people_pct'?.28:.67);
  };
  function scene(state,{bridge=false}={}) {
    const nodes=new Map(),guides=new Map();
    const add=(id,kind,fields)=>guides.set(id,{id,kind,x:0,y:0,x2:0,y2:0,w:0,h:0,opacity:1,size:14,strokeWidth:1,anchor:'start',color:MUTED,...fields});
    const text=(id,x,y,value,extra={})=>add(id,'text',{x,y,text:value,...extra});
    const line=(id,x,y,x2,y2,extra={})=>add(id,'line',{x,y,x2,y2,color:'#33434e',strokeWidth:.7,...extra});
    const scale=bridge?step:gainStep;
    for(const s of source.values()) {
      if(s.metric==='minute_pct'&&state<2)continue;
      let x,y,w,h,opacity=1,warm=s.height<=79?1:0;
      if(state===0) {
        const u=Math.min(4,H*.34/34);
        x=xheight(s.height)-13;y=base(s.era)-(s.j+s.f)*u;w=26;h=u*s.f*.73;
      } else if(state<3) {
        x=start+s.pos*step;y=row(state,s.era,s.metric);w=(step-.8)*s.f;h=state===1?22:24;
      } else {
        const mi=metrics.indexOf(s.metric),baseline=values[mi][0];
        const left=s.era===1?Math.max(s.pos,baseline):s.pos;
        const retained=s.era===1?Math.max(0,Math.min(s.pos+s.f,values[mi][1])-left):s.f;
        x=zero+((s.era===1?left:s.pos)-baseline)*scale;
        y=row(state,s.era,s.metric);w=(scale-.8)*(retained||s.f);h=30;
        if(s.height>79||(s.era===1&&retained<=1e-10))opacity=0;
        warm=s.era===1?1:0;
      }
      nodes.set(s.id,{id:s.id,x,y,w,h,opacity,warm});
    }
    if(state===0) {
      add('low-region','rect',{x:xheight(76)-28,y:14,w:xheight(79)-xheight(76)+56,h:H-37,color:ORANGE,opacity:.055});
      for(let era=0;era<2;era++) {
        const by=base(era),u=Math.min(4,H*.34/34);
        text('era:people_pct:'+era,0,by-69,era===0?'2000年代':'2020年代',{size:21,bold:true,color:INK});
        text('scope:'+era,0,by-43,era===0?'2000–01 → 2009–10':'2020–21 → 2025–26',{size:13});
        text('count:'+era,0,by-20,data[era].n+'人 · '+(era===0?10:6)+'季',{size:13});
        for(const tick of [0,10,20,30]) {
          const y=by-tick*u;
          line('height-grid:'+era+':'+tick,175,y,W-35,y);
          text('height-tick:'+era+':'+tick,167,y+4,tick+'%',{size:13,anchor:'end'});
        }
        const peak=data[era].bins.reduce((a,b)=>a.people_pct>b.people_pct?a:b);
        text('peak:'+era,xheight(peak.height),by-peak.people_pct*u-10,peak.people_pct.toFixed(1)+'%',{color:INK,anchor:'middle'});
      }
      for(let h=76;h<=87;h++)text('inches:'+h,xheight(h),H-14,Math.floor(h/12)+'′'+h%12+'″',{anchor:'middle'});
      text('height-unit',W-5,H-14,'身高',{size:13,anchor:'end'});
    } else if(state<3) {
      for(const tick of [0,25,50,75,100]) {
        const x=start+tick*step;line('share-grid:'+tick,x,26,x,H-20);
        text('share-tick:'+tick,x,17,tick+'%',{anchor:'middle'});
      }
      for(let era=0;era<2;era++) for(const metric of state===1?['people_pct']:metrics) {
        const y=row(state,era,metric),p=share(era,metric),x=start+p*step;
        text('era:'+metric+':'+era,state===1?0:78,y+14,era===0?'2000年代':'2020年代',{size:state===1?21:16,bold:state===1,color:INK});
        line('endpoint:'+metric+':'+era,x,y-6,x,y+29,{color:ORANGE,strokeWidth:1.3});
        text('value:'+metric+':'+era,x+7,y-9,p.toFixed(1)+'%',{size:29,bold:true,color:ORANGE});
        if(state===1) {
          text('count:'+era,0,y+36,data[era].n+'人 · '+(era===0?10:6)+'季',{size:13});
          text('row-label:'+era,start-14,y+13,'人数',{anchor:'end'});
        }
      }
      if(state===2) for(const metric of metrics) {
        const y=(row(state,0,metric)+row(state,1,metric))/2+14;
        text('metric:'+metric,0,y,metric==='people_pct'?'人数':'分钟',{size:21,bold:true,color:INK});
      }
    } else {
      for(const tick of [0,5,10,15,20,25,30,35]) {
        const x=zero+tick*scale;
        line('gain-grid:'+tick,x,36,x,H-38,{opacity:bridge?0:1,color:tick===0?'#84969c':'#33434e',strokeWidth:tick===0?1.3:.7});
        text('gain-tick:'+tick,x,24,String(tick),{opacity:bridge?0:1,anchor:'middle'});
      }
      text('gain-axis',W-8,24,'增加 / 个百分点',{size:13,anchor:'end',opacity:bridge?0:1});
      for(let mi=0;mi<2;mi++) {
        const metric=metrics[mi],y=row(3,0,metric),end=zero+gains[mi]*scale;
        text('metric:'+metric,0,y+21,mi===0?'人数':'分钟',{size:21,bold:true,color:INK});
        line('endpoint:'+metric+':0',zero,y-6,zero,y+36,{color:GRAY,strokeWidth:1.3});
        text('value:'+metric+':0',zero-12,y+55,values[mi][0].toFixed(1)+'%',{size:18,anchor:'end',color:GRAY});
        text('baseline-name:'+metric,zero-12,y-13,'原有份额',{size:13,anchor:'end'});
        line('endpoint:'+metric+':1',end,y-6,end,y+36,{color:ORANGE,strokeWidth:1.3});
        text('value:'+metric+':1',end+7,y-9,values[mi][1].toFixed(1)+'%',{size:29,bold:true,color:ORANGE,opacity:bridge?1:0});
        text('gain:'+metric,end+12,y+24,'+'+gains[mi].toFixed(1),{size:30,bold:true,color:ORANGE,opacity:bridge?0:1});
      }
      const x1=zero+gains[0]*scale,x2=zero+gains[1]*scale,y=row(3,0,'minute_pct')+64;
      line('excess-top',x1,row(3,0,'people_pct')+36,x1,y,{color:'#75888e',opacity:bridge?0:.8});
      line('excess-span',x1,y,x2,y,{color:ORANGE,strokeWidth:2,opacity:bridge?0:1});
      line('excess-end',x2,y-7,x2,y+7,{color:ORANGE,strokeWidth:2,opacity:bridge?0:1});
      text('excess-label',x1-12,y+5,'分钟多增 '+(gains[1]-gains[0]).toFixed(1)+' 个百分点',{color:INK,size:16,anchor:'end',opacity:bridge?0:1});
    }
    return {state,settled:true,nodes,guides};
  }
  const numericNode=['x','y','w','h','opacity','warm'];
  const numericGuide=['x','y','x2','y2','w','h','opacity','size','strokeWidth'];
  function mixMaps(a,b,t,keys,type,unfold=false) {
    const out=new Map();
    for(const id of new Set([...a.keys(),...b.keys()])) {
      const av=a.get(id),bv=b.get(id);
      const start=av??{...bv,opacity:0,...(type==='nodes'?{h:0}:{})};
      const end=bv??{...av,opacity:0};
      const p={...(t<.5?start:end),id};
      for(const key of keys)p[key]=lerp(start[key],end[key],t);
      if(unfold&&av&&bv&&type==='nodes') {
        const s=source.get(id);
        Object.assign(p,flowPoint(av,bv,t,{control1:{x:av.x,y:av.y-25},control2:{x:bv.x,y:bv.y-25},delay:(s.height-76)*.006}));
      }
      out.set(id,p);
    }
    return out;
  }
  function mix(a,b,t,{unfold=false}={}) {
    if(t<=0)return a;if(t>=1)return b;
    return {state:b.state,settled:false,nodes:mixMaps(a.nodes,b.nodes,t,numericNode,'nodes',unfold),guides:mixMaps(a.guides,b.guides,t,numericGuide,'guides')};
  }
  function addMinuteRows(from,to,t) {
    if(t<=0)return from;if(t>=1)return to;
    const out=mix(from,to,t);
    const enter=Math.max(0,(t-.35)/.65);
    for(const [id,p] of out.nodes) if(!from.nodes.has(id)) {
      p.opacity=to.nodes.get(id).opacity*enter;
      p.h=to.nodes.get(id).h*enter;
    }
    for(const [id,p] of out.guides) {
      if(!from.guides.has(id)) p.opacity=to.guides.get(id).opacity*(id==='metric:people_pct'?Math.max(0,(t-.65)/.35):enter);
      if(!to.guides.has(id)) p.opacity=from.guides.get(id).opacity*Math.max(0,1-t/.35);
    }
    return out;
  }
  function blend(from,to,t) {
    if(from.settled&&from.state===1&&to.state===2) return addMinuteRows(from,to,t);
    if(from.settled&&from.state===2&&to.state===1) {
      const out=addMinuteRows(to,from,1-t);
      return t>0&&t<1?{...out,state:to.state}:out;
    }
    if(from.settled&&from.state===2&&to.state===3) {
      const bridge=scene(3,{bridge:true});
      return t<.48?mix(from,bridge,t/.48):mix(bridge,to,(t-.48)/.52);
    }
    if(from.settled&&from.state===3&&to.state===2) {
      const bridge=scene(3,{bridge:true});
      return t<.52?mix(from,bridge,t/.52):mix(bridge,to,(t-.52)/.48);
    }
    const unfold=from.settled&&((from.state===0&&to.state===1)||(from.state===1&&to.state===0));
    return mix(from,to,t,{unfold});
  }
  return {scene,blend,source,values,gains,geometry:{start,step,zero,gainStep},dimensions:{W,H}};
}
