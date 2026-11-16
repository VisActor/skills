import test from 'node:test';
import assert from 'node:assert/strict';
import {coverageData,outside,coverageLayout,coverageX} from '../../skills/creative-data-storytelling/assets/examples/person-coverage/scene.mjs';
import {waistGroups,waistAt,groupSamples,regularRange} from '../../skills/creative-data-storytelling/assets/examples/person-coverage/sizing-coverage.mjs';
import {fitDifferences,contourWidth} from '../../skills/creative-data-storytelling/assets/examples/multi-constraint/scene.mjs';
import {pockets,objects,itemTop,fits,fitCounts,example as pocketExample} from '../../skills/creative-data-storytelling/assets/examples/object-fit/scene.mjs';
import {periods,songs,cumulativeShare,connectedShare,areaBoundary,yearX,buildLayouts} from '../../skills/creative-data-storytelling/assets/examples/records-composition/scene.mjs';
import {flowData,flowSummary,flowSegments,ribbon,flowRecords,flowPoint,flowGeometry,targetY,example as flowExample} from '../../skills/creative-data-storytelling/assets/examples/cohort-flow/scene.mjs';
import {renderDescription} from '../../skills/creative-data-storytelling/assets/examples/segment-preview.mjs';

test('Prose emphasis preserves literal content and matches whole numeric readings',()=>{
 const element={ownerDocument:{createElement:tagName=>({tagName,style:{}})},replaceChildren(...nodes){this.children=nodes;}};
 const text='98 厘米的身体，多出 8 厘米；<img src=x> 保持为文字。';
 renderDescription(element,text,[{text:'8 厘米',color:'#ba5436'},'不存在']);
 assert.equal(element.children.map(node=>typeof node==='string'?node:node.textContent).join(''),text);
 assert.deepEqual(element.children.filter(node=>typeof node!=='string').map(node=>[node.tagName,node.textContent,node.style.color]),[['strong','8 厘米','#ba5436']]);
});

test('Changing a description clears previous emphasis without changing the words',()=>{
 const element={ownerDocument:{createElement:tagName=>({tagName,style:{}})},replaceChildren(...nodes){this.children=nodes;}};
 renderDescription(element,'相差 9.5 厘米',['9.5 厘米','5 厘米']);
 assert.equal(element.children.filter(node=>typeof node!=='string').length,1);
 renderDescription(element,'这次两边都能放下。');
 assert.deepEqual(element.children,['这次两边都能放下。']);
});

const check = test;
check('Age groups retain distinct percentile identities',()=>assert.equal(new Set([...coverageData.groupA,...coverageData.groupB].map(d=>d.id)).size,82));
check('Published waist percentiles survive sampling and interpolation',()=>{
 for(const group of waistGroups){for(const [p,value] of group.quantiles)assert.equal(waistAt(group,p),value);const samples=groupSamples(group);assert.equal(samples[0].percentile,10);assert.equal(samples.at(-1).percentile,90);assert.equal(samples.find(s=>s.percentile===50).value,waistAt(group,50));assert.throws(()=>waistAt(group,9),RangeError);assert.throws(()=>waistAt(group,91),RangeError);}
});
check('Reference conversion and inclusive boundary agree',()=>{assert.equal(regularRange[1],36*2.54);assert.equal(outside([{value:regularRange[0]},{value:regularRange[1]},{value:regularRange[1]+.1}]),1);});
check('Coverage layout preserves measured position without overlapping figures in a row',()=>{
 for(const rows of [coverageData.groupA,coverageData.groupB]){const layout=coverageLayout(rows);for(const p of layout){assert.equal(p.x,coverageX(p.value));for(const q of layout)if(p.id!==q.id&&p.rank===q.rank)assert(Math.abs(p.x-q.x)>=24);}}
});
check('Changing clothing size exposes opposing constraints',()=>{assert.deepEqual(fitDifferences('L'),{waist:0,hip:8});assert.deepEqual(fitDifferences('M'),{waist:-8,hip:0});});
check('Contour measurement anchors share one fixed scale',()=>{assert.equal(contourWidth(254,84,98),84*3);assert.equal(contourWidth(488,84,98),98*3);assert.equal(contourWidth(488,84,106)-contourWidth(488,84,98),24);assert.equal(contourWidth(254,76,98)-contourWidth(254,84,98),-24);});
check('Pocket fit agrees with the drawn convex boundary',()=>{
 for(const p of pockets)for(const o of Object.values(objects)){
  const y=itemTop(p,o),bottom=y+o.height;
  const within=o.width/2<=p.width/2+1e-9&&y>=-1e-9&&bottom<=p.height-p.taper*o.width/p.width+1e-9;
  assert.equal(fits(p,o),within);
 }
});
check('A wider-than-opening object cannot fit',()=>assert.equal(fits(pockets[0],{width:100,height:1}),false));
check('Song aggregation preserves records and denominators',()=>{
 assert.equal(songs.length,5141);assert.equal(new Set(songs.map(s=>s.id)).size,songs.length);
 periods.forEach((p,i)=>{const rows=songs.filter(s=>s.period===i);assert.equal(rows.length,p.n);assert.equal(rows.reduce((sum,s)=>sum+s.weeks,0),p.total);});
 assert(songs.every(s=>s.period>=0&&Number.isFinite(s.weeks)&&s.weeks>0));
});
check('Area connection keeps observed values and complete denominators',()=>{
 for(let i=0;i<periods.length;i++)for(let c=0;c<8;c++)assert.equal(connectedShare(yearX(periods[i].center),c),cumulativeShare(i,c));
 const bounds=[-1,0,1,2,3,4,5,6,7].map(c=>areaBoundary(c));bounds[0].forEach((p,i)=>{assert.equal(p.y,618);assert.equal(bounds[8][i].y,240);for(let c=1;c<9;c++)assert(bounds[c][i].y<=bounds[c-1][i].y+1e-9);});
});
check('Song layouts preserve identity and entry date',()=>{const layouts=buildLayouts();for(const song of songs){for(const key of ['all','stack']){assert(layouts[key].has(song.id));assert.equal(layouts[key].get(song.id).x,yearX(song.year));}const p=layouts.all.get(song.id);assert(Math.abs(p.r*p.r/song.weeks-1.28*1.28)<1e-10);}});
check('Each flow distribution and source partition conserves 100%',()=>{
 for(const values of Object.values(flowData)){const s=flowSegments(values);assert.equal(s.at(-1).end,100);s.slice(1).forEach((row,i)=>assert.equal(row.start,s[i].end));}
});
check('Flow geometry stays finite through all intermediate frames',()=>{
 for(const v of Object.values(flowData))for(const seg of flowSegments(v))for(let i=0;i<=20;i++)assert(!/NaN|Infinity/.test(ribbon(seg,60,345,i/20)));
});
check('Flow records retain identity and exactly match destination totals',()=>{
 const records=['A','B'].flatMap(group=>flowRecords(group));assert.equal(new Set(records.map(r=>r.id)).size,200);
 for(const group of ['A','B'])assert.deepEqual(flowData[group],flowData[group].map((_,i)=>records.filter(r=>r.group===group&&r.segment.id===i).length));
});
check('People finish within their destination band on a common scale',()=>{
 for(const group of ['A','B'])for(const record of flowRecords(group)){
  for(let i=0;i<=40;i++){const p=flowPoint(record,i/40);assert(Number.isFinite(p.x)&&Number.isFinite(p.y));}
  const end=flowPoint(record,1),y=targetY(record.segment.id),half=record.segment.value*flowGeometry.unit/2;
  assert(end.y>y-half&&end.y<y+half);assert(Math.abs(end.x-flowGeometry.end[group])<6);
 }
});

// Numeric SVG output contract; the browser check separately inspects layout and motion.
class SvgNode {
 constructor(tagName){this.tagName=tagName;this.attributes=new Map();this.children=[];this.textContent='';}
 setAttribute(name,value){this.attributes.set(name,String(value));}
 getAttribute(name){return this.attributes.get(name);}
 removeAttribute(name){this.attributes.delete(name);}
 append(node){this.children.push(node);}
}
function withSvg(run){
 const previous=globalThis.document;
 globalThis.document={createElementNS:(_,tag)=>new SvgNode(tag)};
 try{return run(new SvgNode('svg'));}finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
}
const descendants=node=>[node,...node.children.flatMap(descendants)];
function field(svg,name,value){const node=descendants(svg).find(n=>n.getAttribute(name)===value);assert.ok(node,`Missing ${name}=${value}`);return node;}

check('Unequal flow cohorts share counts across source geometry, prose and percentages',()=>withSvg(svg=>{
 const data={A:[24,24,18,10,4],B:[10,16,24,26,24]},scene=flowExample.mount(svg,{data});
 scene.render(scene.pose(3));
 assert.equal(field(svg,'data-flow-total','A').textContent,'80 人');
 assert.equal(Number(field(svg,'data-flow-source','A').getAttribute('height')),80*flowGeometry.unit);
 assert.equal(field(svg,'data-flow-share','A-4').textContent,'5%');
 assert.equal(field(svg,'data-flow-gap','share').textContent,'相差 19 个百分点');
 assert.match(scene.read(0).description,/80 人/);
 assert.match(scene.read(3).description,/4 人（5%）/);
 assert.equal(descendants(svg).filter(n=>n.getAttribute('data-record-id')?.startsWith('A-')).length,80);
}));

check('Person-count flows keep empty destinations but reject undefined cohort percentages',()=>{
 assert.deepEqual(flowSummary({A:[0,4],B:[3,0]}).A.shares,[0,100]);
 assert.throws(()=>flowSummary({A:[0,0],B:[1,2]}),/positive total/);
 assert.throws(()=>flowSummary({A:[1.5,2],B:[1,2]}),/integer person counts/);
});

check('Removing a non-fitting pocket updates both the chart and reading value',()=>withSvg(svg=>{
 const rows=pockets.filter(row=>row.id!=='b-19'),scene=pocketExample.mount(svg,{rows});
 scene.render(scene.pose(2));
 assert.equal(scene.read(2).value,'85% / 11%');
 assert.equal(field(svg,'data-fit-group','B').textContent,'2 / 19 可放下 · 11%');
 scene.choose('wallet');scene.render(scene.pose(2));
 assert.equal(scene.read(2).value,'100% / 84%');
 assert.equal(field(svg,'data-fit-group','B').textContent,'16 / 19 可放下 · 84%');
}));

check('Pocket collection keeps extra samples hidden until the representatives arrive',()=>withSvg(svg=>{
 const scene=pocketExample.mount(svg),start=scene.pose(1),end=scene.pose(2);
 const main=field(svg,'data-record-id','a-0'),extra=field(svg,'data-record-id','a-1');
 scene.render(scene.blend(start,end,.5));
 assert.equal(Number(extra.getAttribute('opacity')),0);
 scene.render(scene.blend(start,end,.75));const arrived=main.getAttribute('transform');
 assert(Number(extra.getAttribute('opacity'))>0);
 scene.render(end);assert.equal(main.getAttribute('transform'),arrived);
 scene.render(scene.blend(end,start,.5));
 assert.equal(Number(extra.getAttribute('opacity')),0);
 assert.equal(field(svg,'data-record-id','a-0'),main);
}));
