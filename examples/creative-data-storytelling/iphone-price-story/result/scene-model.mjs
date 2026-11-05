import { clamp, mix, ease, flatten, nodeKey, filterNode, priceY, timelineX, capacityComparison, repricedValue } from './layout.mjs';

export const chapterKinds = ['intro', 'overview', 'tiers', 'upgrade', 'capacity', 'reprice', 'air', 'summary'];
export const chapterWeights = [1, 1.9, 2.1, 2.2, 2.6, 2.1, 2.2, 1.7];
const totalWeight = chapterWeights.reduce((a,b)=>a+b,0);
export function storyProgress(fraction) {
  let remaining=clamp(fraction,0,.999999)*totalWeight;
  for(let i=0;i<chapterWeights.length;i++){
    if(remaining<chapterWeights[i])return i+remaining/chapterWeights[i];
    remaining-=chapterWeights[i];
  }
  return chapterWeights.length-.000001;
}
export function storyPosition(index,phase=0) {
  return (chapterWeights.slice(0,index).reduce((a,b)=>a+b,0)+chapterWeights[index]*phase)/totalWeight;
}
// Each comparison has a real global location, an isolated local view, and a return.
export function comparisonCue(phase,reduced=false) {
  const blend=v=>reduced?Number(v>=.5):ease(v);
  if(phase<.14)return {mode:'locate',selection:blend(phase/.12),t:0,localPhase:0};
  if(phase<.32)return {mode:'enter',selection:1,t:blend((phase-.14)/.18),localPhase:0};
  if(phase<.80)return {mode:'local',selection:1,t:0,localPhase:clamp((phase-.32)/.48)};
  if(phase<.94)return {mode:'return',selection:1,t:blend((phase-.80)/.14),localPhase:1};
  return {mode:'release',selection:1-blend((phase-.94)/.06),t:0,localPhase:1};
}
const blue='#344bd5',orange='#bf6848',grey='#a1aa9b';
const N=(short,cap)=>nodeKey('iphone-'+short,cap);
export const eventKey=e=>`${nodeKey(e.modelId,e.storageLabel)}@${e.date}`;
export function createSceneModel(data) {
  const launchNodes=flatten(data.models).map(n=>({...n,kind:'launch'}));
  const models=new Map(data.models.map(m=>[m.id,m]));
  const eventNodes=data.events.map(e=>({
    ...e,id:eventKey(e),kind:'event',priceCNY:e.afterCNY,entry:false,
    model:models.get(e.modelId),premium:['pro','pro-max'].includes(models.get(e.modelId).family),
  }));
  const nodes=[...launchNodes,...eventNodes],byKey=new Map(nodes.map(n=>[n.id,n]));
  const groups={
    tiers:[['8','256GB',.54],['8-plus','256GB',.715],['x','256GB',.89]],
    upgrade:[['11','256GB',.525],['12','256GB',.655],['11-pro','256GB',.795],['12-pro','256GB',.925]],
    capacity:[['16-pro','128GB',.60],['17-pro','256GB',.835]],
    reprice:[['17','256GB',.64]],air:[['air','256GB',.605]],
  };
  const records={oldEntry:byKey.get(N('16-pro','128GB')),oldMatched:byKey.get(N('16-pro','256GB')),newEntry:byKey.get(N('17-pro','256GB'))};
  const findEvent=(short,cap)=>data.events.find(e=>e.modelId==='iphone-'+short&&e.storageLabel===cap);

  function build(kind,{width:w,height:h,phase=0,reduced=false,mode='local',strength=1,capFilter='entry',includeOther=true}={}) {
    const global=mode==='global'||kind==='overview'||kind==='summary';
    const domains={intro:[3000,10000],tiers:[6000,11000],upgrade:[6000,11000],capacity:[7000,10000],reprice:[5000,7500],air:[6500,15500]};
    const domain=global?[2000,capFilter==='512GB'&&kind==='summary'?15000:12000]:domains[kind];
    const top=h*(global?.31:kind==='intro'?.38:.54),bottom=h*(global?.76:.81);
    const states=new Map(),devices=new Map(),identities=new Map(),labels=[],lines=[],notes=[],brackets=[];
    const y=v=>priceY(v,domain,top,bottom);
    for(const n of nodes){
      const visible=global&&n.kind==='launch'&&filterNode(n,kind==='summary'?capFilter:'entry',kind==='summary'?includeOther:true);
      const timeNode=n.kind==='event'?{...n,model:{...n.model,generationYear:Number(n.date.slice(0,4))}}:n;
      states.set(n.id,{x:timelineX(timeNode,w*.46,w*.923),value:n.priceCNY,y:y(n.priceCNY),a:visible?.82:0,r:4,outline:0});
    }
    const set=(key,x,options={})=>{
      const old=states.get(key);if(!old)throw new Error('Unknown price record: '+key);
      const s={...old,x:w*x,a:1,r:6,...options};s.y=y(s.value);states.set(key,s);return s;
    };
    const label=(key,options={})=>labels.push({key,dy:30,name:false,cap:true,...options});
    const photo=(short,x,bottomY=h*.49,size=h*.21,opacity=1)=>devices.set('iphone-'+short,{x:w*x,bottom:bottomY,h:size,a:opacity,rotate:0});
    const identity=(short,x,key,leader=0,opacity=1)=>identities.set('iphone-'+short,{x:w*x,y:h*.215,key,leader,a:opacity});
    const join=(a,b,color=blue,opacity=1)=>lines.push({a,b,color,opacity});
    const globalLandmarks=()=>{
      const items=[['4','16GB',15,-38,'start'],['4s','16GB',12,60,'start'],['x','64GB',0,-38,'middle'],['17','256GB',0,30,'middle'],['18-pro-max','256GB',0,-38,'middle']];
      for(const [short,cap,dx,dy,anchor] of items){
        const k=N(short,cap);if(states.get(k)?.a>.1)label(k,{dx,dy,anchor,small:true,name:true,cap:false,year:short==='4'||short==='4s'});
      }
    };

    if(global&&groups[kind]){
      // Show the selected configuration at its observed value; never morph an entry SKU into it.
      for(const s of states.values())s.a*=1-.92*strength;
      for(const [short,cap,x] of groups[kind]){
        const key=N(short,cap),s=states.get(key);s.a=mix(s.a,1,strength);s.r=mix(4,6,strength);
        identity(short,x,key,strength,strength);
        const entry=launchNodes.find(n=>n.model.id==='iphone-'+short&&n.entry);
        if(entry.id!==key){
          const base=states.get(entry.id);base.a=mix(base.a,.45,strength);
          join(entry.id,key,grey,strength);
        }
      }
      if(strength<.02)globalLandmarks();
      notes.push({x:w*.70,y:h*.17,text:kind==='tiers'||kind==='upgrade'?'全景显示起售价 · 选中型号展开 256GB 配置':'全景显示各型号起售价',opacity:strength});
    }else if(kind==='overview'){
      const highlight=reduced?Number(phase>=.24):ease((phase-.12)/.18);
      const release=reduced?Number(phase>=.90):ease((phase-.82)/.18);
      const focus=highlight*(1-release);
      for(const s of states.values())s.a*=1-.94*focus;
      globalLandmarks();
      for(const l of labels)l.opacity=1-focus;
      const a=states.get(N('4','16GB')),b=states.get(N('17','256GB'));
      for(const s of [a,b]){s.a=mix(.82,1,focus);s.r=mix(4,7,focus);}
      if(focus>.001){
      label(N('4','16GB'),{dx:20,dy:34,anchor:'start',name:true,cap:true,year:true,opacity:focus});
      label(N('17','256GB'),{dy:34,name:true,cap:true,year:true,opacity:focus});
      }
      brackets.push({a:N('4','16GB'),b:N('17','256GB'),x:w*.69,opacity:focus,text:'+1,000 元',color:blue});
      notes.push({x:w*.70,y:h*.22,text:'一点 = 一款型号的最低容量首发价',opacity:1-focus});
    }else if(kind==='summary'){
      const eligible=launchNodes.filter(n=>filterNode(n,capFilter,includeOther));
      for(const n of eligible.filter(n=>['iphone-4','iphone-x','iphone-12','iphone-17','iphone-18-pro-max'].includes(n.model.id)))label(n.id,{dy:n.premium?-20:30,name:true,cap:false,small:true,price:false});
      if(capFilter!=='entry')notes.push({x:w*.69,y:h*.245,text:'没有这一容量的型号，不补点。'});
    }else if(kind==='intro'){
      const s=set(N('4','16GB'),.785);photo('4',.685,s.y-40,h*.47);photo('5s',.84,s.y-74,h*.32,.3);
      label(N('4','16GB'),{dx:28,dy:0,anchor:'start',large:true});
    }else if(!global){
      const action=reduced?Number(phase>=.35):ease((phase-.12)/.50);
      for(const [short,cap,x] of groups[kind])identity(short,x,N(short,cap));
      if(kind==='tiers'){
        for(const [short,cap,x] of groups.tiers){set(N(short,cap),x);photo(short,x);label(N(short,cap));}
        join(N('8','256GB'),N('8-plus','256GB'));join(N('8-plus','256GB'),N('x','256GB'),orange);
        notes.push({x:w*.715,y:h*.87,text:'同为 256GB / A11 · LCD 单摄 → LCD 双摄 → OLED / Face ID'});
      }
      if(kind==='upgrade'){
        for(const [short,cap,x] of groups.upgrade){set(N(short,cap),x);photo(short,x,h*.48,h*.18);label(N(short,cap),{cap:false});}
        join(N('11','256GB'),N('12','256GB'));join(N('11-pro','256GB'),N('12-pro','256GB'),orange);
        notes.push({x:w*.59,y:h*.87,text:'普通版 · +800 元',color:blue},{x:w*.86,y:h*.87,text:'Pro · −700 元',color:orange});
      }
      if(kind==='capacity'){
        const c=capacityComparison(phase,records,reduced),reveal=c.reveal;
        set(N('16-pro','128GB'),.60,{a:mix(1,.48,reveal),r:c.mode==='entry'?6:4});
        set(N('16-pro','256GB'),.60,{a:reveal});set(N('17-pro','256GB'),.835);
        photo('16-pro',.60);photo('17-pro',.835);
        label(N('16-pro','128GB'),{opacity:mix(1,.8,reveal)});label(N('16-pro','256GB'),{opacity:reveal});label(N('17-pro','256GB'));
        join(N('16-pro','128GB'),N('17-pro','256GB'),orange,1-reveal);
        join(N('16-pro','256GB'),N('17-pro','256GB'),orange,reveal);
        join(N('16-pro','128GB'),N('16-pro','256GB'),grey,reveal);
        notes.push({x:w*.7175,y:y(8999)-18,text:'同为 256GB · ¥8,999',opacity:reveal});
      }
      if(kind==='reprice'||kind==='air'){
        const short=kind==='air'?'air':'17',caps=kind==='air'?['256GB','512GB','1TB']:['256GB'];
        photo(short,kind==='air'?.605:.64,h*.76,h*.45);
        for(const cap of caps){
          const e=findEvent(short,cap),key=N(short,cap),newKey=eventKey(e);
          set(key,.845,{outline:action,a:mix(1,.58,action)});
          set(newKey,.845,{value:repricedValue(e,action),a:action});
          label(key,{dx:-22,dy:5,anchor:'end',cap:false,opacity:1-action*.3});
          label(newKey,{dx:24,dy:5,anchor:'start',opacity:action,capText:cap+' · +'+(e.afterCNY-e.beforeCNY).toLocaleString('en-US')});
          join(key,newKey,blue,action);
        }
        notes.push({x:w*.845,y:h*.46,text:action<.5?'首发价 → 后续标价':'2026.09.10 · 后续标价'});
      }
    }
    return {states,devices,identities,labels,lines,notes,brackets,domain,top,bottom,overview:global};
  }
  return {nodes,launchNodes,byKey,groups,records,build};
}
