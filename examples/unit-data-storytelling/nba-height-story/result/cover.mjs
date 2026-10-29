import {LOGO} from './logo-points.mjs';

export const identityHash=value=>{
  let hash=2166136261;
  for(const character of value){hash^=character.charCodeAt(0);hash=Math.imul(hash,16777619);}
  return hash>>>0;
};

export function logoFrame(width,height){
  const h=Math.min(height-230,680,width*.78),w=h*LOGO.aspect;
  return {x:width*.74-w/2,y:(height+44-h)/2,width:w,height:h,r:LOGO.step*h*.34};
}

export function logoLayout(base){
  const entries=[...base.nodes].sort(([a],[b])=>identityHash(a)-identityHash(b)||a.localeCompare(b));
  if(entries.length!==LOGO.figure.length)throw new Error('Opening cohort changed; regenerate the logo slots with prepare_logo.mjs.');
  const frame=logoFrame(base.width,base.height);
  const nodes=new Map(entries.map(([key,node],i)=>{
    const [u,v]=LOGO.figure[i];
    return [key,{...node,x:frame.x+u*frame.width,y:frame.y+v*frame.height,r:frame.r,color:'#f2ead8',a:.96}];
  }));
  return {...base,nodes,top:100,coverAmount:1,scene:{...base.scene,cover:true}};
}

// Color-field particles are scenery, kept outside the player-node map. They
// dissolve while the silhouette's real identities travel into the chart.
export function drawLogoField(ctx,width,height,amount){
  if(amount<=.48)return;
  const frame=logoFrame(width,height),release=1-amount;
  ctx.save();ctx.globalAlpha=Math.pow((amount-.48)/.52,1.35)*.72;
  for(const [u,v,kind] of LOGO.decoration){
    const dx=(u-.5)*release*100,dy=(v-.5)*release*100;
    ctx.fillStyle=kind==='blue'?'#6b8fc9':'#d87870';
    ctx.beginPath();ctx.arc(frame.x+u*frame.width+dx,frame.y+v*frame.height+dy,frame.r*.83*(1-release*.4),0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}
