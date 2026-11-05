import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const raw = fs.readFileSync(path.join(root, 'inputs/daily-temperature.csv'), 'utf8');
const rows = raw.trim().split(/\r?\n/).slice(1).map(line => {
  const [date, station, max, maxq, min, minq, mean, meanq] = line.split(',');
  assert.equal(station, 'HKO');
  assert.deepEqual([maxq,minq,meanq], ['C','C','C']);
  return {date, year:+date.slice(0,4), month:+date.slice(5,7), day:+date.slice(8), max:+max, min:+min, mean:+mean};
});
const days = rows.filter(d => d.month >= 6 && d.month <= 8);
assert.equal(days.length, 5980);
assert.equal(new Set(days.map(d=>d.date)).size, days.length);
const avg = a => a.reduce((s,n)=>s+n,0)/a.length;
const median = a => {const b=a.toSorted((x,y)=>x-y);return (b[(b.length-1)>>1]+b[b.length>>1])/2;};
function runs(records, key, threshold) {
  const result=[];let run=[];
  for(const d of records){if(d[key]>=threshold) run.push(d.date); else if(run.length){result.push(run);run=[];}}
  if(run.length)result.push(run);
  return result;
}
const annual = [];
for(let year=1961;year<=2025;year++){
  const a=days.filter(d=>d.year===year);assert.equal(a.length,92);
  a.forEach((d,i)=>{d.index=i;d.id=`HKO-${d.date}`;d.night=d.min>=28;d.hot=d.max>=33;});
  const nr=runs(a,'min',28),dr=runs(a,'max',33);
  const longestNight=Math.max(0,...nr.map(r=>r.length));
  const longestDay=Math.max(0,...dr.map(r=>r.length));
  const longestDates=nr.filter(r=>r.length===longestNight).flat();
  a.forEach(d=>d.longest=longestDates.includes(d.date));
  annual.push({year,night:a.filter(d=>d.night).length,hot:a.filter(d=>d.hot).length,longestNight,longestDay,nightRuns:nr,min:avg(a.map(d=>d.min)),max:avg(a.map(d=>d.max)),mean:avg(a.map(d=>d.mean))});
}
function period(start,end){
  const d=days.filter(d=>d.year>=start&&d.year<=end),a=annual.filter(d=>d.year>=start&&d.year<=end);
  assert.equal(d.length,2760);
  return {start,end,n:d.length,min:avg(d.map(d=>d.min)),max:avg(d.map(d=>d.max)),mean:avg(d.map(d=>d.mean)),median:median(d.map(d=>d.mean)),night:avg(a.map(d=>d.night)),hot:avg(a.map(d=>d.hot)),longestNight:avg(a.map(d=>d.longestNight))};
}
const periods=[period(1961,1990),period(1996,2025)];
const event=annual.find(d=>d.year===2022);
assert.equal(event.longestNight,21);assert.equal(event.night,43);
const eventRun=event.nightRuns.find(r=>r.length===21);
assert.equal(eventRun[0],'2022-07-09');assert.equal(eventRun.at(-1),'2022-07-29');
assert.equal(days.filter(d=>d.year===2022&&d.month===7&&d.night).length,25);
const data={meta:{station:'香港天文台',season:'6—8月',start:1961,end:2025,daysPerSummer:92,sourceSHA256:crypto.createHash('sha256').update(raw).digest('hex')},days,annual,periods,event:{year:2022,run:eventRun}};
fs.writeFileSync(path.join(root,'result/data/story-data.js'),`window.STORY_DATA=${JSON.stringify(data)};\n`);
fs.writeFileSync(path.join(root,'result/data/summary.json'),JSON.stringify({meta:data.meta,periods,annual,event:data.event},null,2));
fs.copyFileSync(path.join(root,'inputs/daily-temperature.csv'),path.join(root,'result/data/daily-temperature.csv'));
console.log(JSON.stringify({days:days.length,periods,event:{night:event.night,run:eventRun.length,from:eventRun[0],to:eventRun.at(-1)},extrema:{min:Math.min(...days.map(d=>d.min)),max:Math.max(...days.map(d=>d.max))}},null,2));
