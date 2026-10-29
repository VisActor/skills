export const POSITIONS=['PG','SG','SF','PF','C'];
export const POSITION_NAMES={PG:'控球后卫',SG:'得分后卫',SF:'小前锋',PF:'大前锋',C:'中锋'};
export const DECADES=[1960,1970,1980,1990,2000,2010,2020];
export function makeModel(data){
 const players=new Map(data.players.map(p=>[p.id,p]));
 function rows(start,end,pos){
  const map=new Map();
  for(const s of data.seasons){if(s.y<start||s.y>end||!s.pos.includes(pos))continue;
   if(!map.has(s.id))map.set(s.id,{...players.get(s.id),pos,minutes:0,years:[],as:[],mvp:[],games:0,seasonRecords:[]});
   const p=map.get(s.id);p.minutes+=s.min??0;p.years.push(s.y);p.games+=s.g;p.seasonRecords.push(s);
  }
  // Honor status does not require playing a game. Only people with a position record in this window can be assigned to a position.
  for(const h of data.honors){if(+h.season_end<start||+h.season_end>end)continue;const p=map.get(h.player_id);if(!p)continue;if(h.honor==='all_star_selection')p.as.push(+h.season_end);if(h.honor==='regular_season_mvp')p.mvp.push(+h.season_end);}
  return [...map.values()].sort((a,b)=>(a.h??0)-(b.h??0)||a.id.localeCompare(b.id));
 }
 function stats(rows){let a=rows.filter(p=>p.h!==null),stars=a.filter(p=>p.as.length),total=a.reduce((s,p)=>s+p.minutes,0);return {n:rows.length,valid:a.length,missing:rows.length-a.length,mean:a.length?a.reduce((s,p)=>s+p.h*2.54,0)/a.length:null,weighted:total?a.reduce((s,p)=>s+p.h*2.54*p.minutes,0)/total:null,totalMinutes:total,short:a.filter(p=>p.h<=79).length,shortMinutes:total?a.filter(p=>p.h<=79).reduce((s,p)=>s+p.minutes,0)/total:null,starN:stars.length,starMean:stars.length?stars.reduce((s,p)=>s+p.h*2.54,0)/stars.length:null};}
 return {players,rows,stats,decade:(d,pos)=>rows(d+1,Math.min(d+10,2026),pos),season:(y,pos)=>rows(y,y,pos),mvp:data.honors.filter(h=>h.honor==='regular_season_mvp').map(h=>({...players.get(h.player_id),y:+h.season_end,pos:data.seasons.find(s=>s.id===h.player_id&&s.y===+h.season_end)?.pos||[]})).sort((a,b)=>a.y-b.y)};
}
export const seasonLabel=y=>`${y-1}–${String(y).slice(2)}`;
export const periodLabel=d=>`${d}年代${d===2020?'（6季）':''}`;
export const fmt=n=>n===null?'—':n.toFixed(1);
