// NCHS 2021–2023, Tables 11–12, female waist circumference in cm.
// The display samples P10–P90; it does not invent individual survey records or tails.
export const waistGroups=[
 {id:'teen',label:'14–15 岁',n:118,quantiles:[[10,66.3],[15,67.3],[25,70],[50,77.2],[75,87],[85,97.3],[90,99.3]]},
 {id:'adult',label:'20 岁及以上',n:3121,quantiles:[[10,77],[15,80],[25,84.9],[50,95.7],[75,109.2],[85,116.9],[90,121.5]]}
];
// ASTM 2021 values transcribed by Sizing Chaos. Inches are converted exactly to cm.
// 00–16 is the regular-size comparison used here, not a universal brand standard.
export const sizeReference=[
 ['00',25.38],['0',26.125],['2',26.88],['4',27.63],['6',28.5],
 ['8',29.5],['10',30.5],['12',32.25],['14',34],['16',36],['18',38.25],['20',40.5]
].map(([size,inches])=>({size,cm:inches*2.54}));
export const regularRange=[sizeReference[0].cm,sizeReference.find(s=>s.size==='16').cm];
export function waistAt(group,percentile){
 const q=group.quantiles;if(percentile<q[0][0]||percentile>q.at(-1)[0])throw new RangeError('Display percentile must remain within published P10–P90.');
 for(let i=1;i<q.length;i++)if(percentile<=q[i][0]){const [p0,v0]=q[i-1],[p1,v1]=q[i];return v0+(v1-v0)*(percentile-p0)/(p1-p0);}
 return q.at(-1)[1];
}
export function groupSamples(group){return Array.from({length:41},(_,i)=>{const percentile=10+i*2;return{id:group.id+'-p'+percentile,percentile,value:waistAt(group,percentile)};});}
