import { at, clamp01, keyed, lerp, linearScale } from "../../runtime/geometry.mjs";
import { blendNodes, blendWithAnnotations } from "../../runtime/motion.mjs";
import { createStage } from "../../runtime/stage.mjs";
import { reserveStageExit } from "../../runtime/scroll.mjs";
import { createCopyHandoff } from "../../runtime/copy.mjs";
import { createSvgLayer, setSvgAttributes, svgElement } from "../../runtime/svg.mjs";

// Images are centered on observed coordinates; no leaders or image-size quantity encoding.
// Adapt observations/previousId/stops, then rewrite the editorial claims and label positions.
// Economist: AUS half-year prices. ABS: quarterly bread A2327061R, beef A2327241X,
// June 2024 Table 7. 2016 records support same-period year-on-year calculations.
export const trendExample = {
  "metric": "巨无霸价格", "unit": "澳元", "valuePrefix": "$",
  "primaryId": "burger",
  "startDate": "2017-01-01",
  "endDate": "2024-07-01",
  "series": [
    {
      "id": "burger",
      "name": "巨无霸",
      "color": "#45392f",
      "image": "./images/burger.svg",
      "frequency": 2,
      "observations": [
        {"id": "burger-2016-1", "date": "2016-01-01", "value": 5.3, "previousId": "burger-2015-1"},
        {"id": "burger-2016-2", "date": "2016-07-01", "value": 5.75, "previousId": "burger-2015-2"},
        {"id": "burger-2017-1", "date": "2017-01-01", "value": 5.8, "previousId": "burger-2016-1"},
        {"id": "burger-2017-2", "date": "2017-07-01", "value": 5.9, "previousId": "burger-2016-2"},
        {"id": "burger-2018-1", "date": "2018-01-01", "value": 5.9, "previousId": "burger-2017-1"},
        {"id": "burger-2018-2", "date": "2018-07-01", "value": 6.05, "previousId": "burger-2017-2"},
        {"id": "burger-2019-1", "date": "2019-01-01", "value": 6.1, "previousId": "burger-2018-1"},
        {"id": "burger-2019-2", "date": "2019-07-09", "value": 6.15, "previousId": "burger-2018-2"},
        {"id": "burger-2020-1", "date": "2020-01-14", "value": 6.45, "previousId": "burger-2019-1"},
        {"id": "burger-2020-2", "date": "2020-07-01", "value": 6.55, "previousId": "burger-2019-2"},
        {"id": "burger-2021-1", "date": "2021-01-01", "value": 6.48, "previousId": "burger-2020-1"},
        {"id": "burger-2021-2", "date": "2021-07-01", "value": 6.55, "previousId": "burger-2020-2"},
        {"id": "burger-2022-1", "date": "2022-01-01", "value": 6.4, "previousId": "burger-2021-1"},
        {"id": "burger-2022-2", "date": "2022-07-01", "value": 6.7, "previousId": "burger-2021-2"},
        {"id": "burger-2023-1", "date": "2023-01-01", "value": 7.25, "previousId": "burger-2022-1"},
        {"id": "burger-2023-2", "date": "2023-07-01", "value": 7.45, "previousId": "burger-2022-2"},
        {"id": "burger-2024-1", "date": "2024-01-01", "value": 7.7, "previousId": "burger-2023-1"},
        {"id": "burger-2024-2", "date": "2024-07-01", "value": 7.75, "previousId": "burger-2023-2"}
      ]
    },
    {
      "id": "bread",
      "name": "面包",
      "color": "#8c629c",
      "image": "./images/bread.svg",
      "comparisonMarkId": "bread-2023-2",
      "frequency": 4,
      "observations": [
        {"id": "bread-2016-1", "date": "2016-03-31", "value": 96, "previousId": "bread-2015-1"},
        {"id": "bread-2016-2", "date": "2016-06-30", "value": 96.5, "previousId": "bread-2015-2"},
        {"id": "bread-2016-3", "date": "2016-09-30", "value": 96.1, "previousId": "bread-2015-3"},
        {"id": "bread-2016-4", "date": "2016-12-31", "value": 95.6, "previousId": "bread-2015-4"},
        {"id": "bread-2017-1", "date": "2017-03-31", "value": 95.4, "previousId": "bread-2016-1"},
        {"id": "bread-2017-2", "date": "2017-06-30", "value": 95.4, "previousId": "bread-2016-2"},
        {"id": "bread-2017-3", "date": "2017-09-30", "value": 95, "previousId": "bread-2016-3"},
        {"id": "bread-2017-4", "date": "2017-12-31", "value": 96.1, "previousId": "bread-2016-4"},
        {"id": "bread-2018-1", "date": "2018-03-31", "value": 96, "previousId": "bread-2017-1"},
        {"id": "bread-2018-2", "date": "2018-06-30", "value": 96.1, "previousId": "bread-2017-2"},
        {"id": "bread-2018-3", "date": "2018-09-30", "value": 97.3, "previousId": "bread-2017-3"},
        {"id": "bread-2018-4", "date": "2018-12-31", "value": 97.9, "previousId": "bread-2017-4"},
        {"id": "bread-2019-1", "date": "2019-03-31", "value": 99.7, "previousId": "bread-2018-1"},
        {"id": "bread-2019-2", "date": "2019-06-30", "value": 100.7, "previousId": "bread-2018-2"},
        {"id": "bread-2019-3", "date": "2019-09-30", "value": 100.8, "previousId": "bread-2018-3"},
        {"id": "bread-2019-4", "date": "2019-12-31", "value": 100.9, "previousId": "bread-2018-4"},
        {"id": "bread-2020-1", "date": "2020-03-31", "value": 102, "previousId": "bread-2019-1"},
        {"id": "bread-2020-2", "date": "2020-06-30", "value": 101.8, "previousId": "bread-2019-2"},
        {"id": "bread-2020-3", "date": "2020-09-30", "value": 101.3, "previousId": "bread-2019-3"},
        {"id": "bread-2020-4", "date": "2020-12-31", "value": 102.4, "previousId": "bread-2019-4"},
        {"id": "bread-2021-1", "date": "2021-03-31", "value": 102.4, "previousId": "bread-2020-1"},
        {"id": "bread-2021-2", "date": "2021-06-30", "value": 102.3, "previousId": "bread-2020-2"},
        {"id": "bread-2021-3", "date": "2021-09-30", "value": 102.2, "previousId": "bread-2020-3"},
        {"id": "bread-2021-4", "date": "2021-12-31", "value": 102.9, "previousId": "bread-2020-4"},
        {"id": "bread-2022-1", "date": "2022-03-31", "value": 105.1, "previousId": "bread-2021-1"},
        {"id": "bread-2022-2", "date": "2022-06-30", "value": 109.7, "previousId": "bread-2021-2"},
        {"id": "bread-2022-3", "date": "2022-09-30", "value": 112.9, "previousId": "bread-2021-3"},
        {"id": "bread-2022-4", "date": "2022-12-31", "value": 116.7, "previousId": "bread-2021-4"},
        {"id": "bread-2023-1", "date": "2023-03-31", "value": 118.9, "previousId": "bread-2022-1"},
        {"id": "bread-2023-2", "date": "2023-06-30", "value": 125.1, "previousId": "bread-2022-2"},
        {"id": "bread-2023-3", "date": "2023-09-30", "value": 127.1, "previousId": "bread-2022-3"},
        {"id": "bread-2023-4", "date": "2023-12-31", "value": 127.9, "previousId": "bread-2022-4"},
        {"id": "bread-2024-1", "date": "2024-03-31", "value": 128.8, "previousId": "bread-2023-1"},
        {"id": "bread-2024-2", "date": "2024-06-30", "value": 129, "previousId": "bread-2023-2"}
      ]
    },
    {
      "id": "beef",
      "name": "牛肉与小牛肉",
      "color": "#406e66",
      "image": "./images/beef.svg",
      "frequency": 4,
      "observations": [
        {"id": "beef-2016-1", "date": "2016-03-31", "value": 123.9, "previousId": "beef-2015-1"},
        {"id": "beef-2016-2", "date": "2016-06-30", "value": 123.9, "previousId": "beef-2015-2"},
        {"id": "beef-2016-3", "date": "2016-09-30", "value": 125.1, "previousId": "beef-2015-3"},
        {"id": "beef-2016-4", "date": "2016-12-31", "value": 125.4, "previousId": "beef-2015-4"},
        {"id": "beef-2017-1", "date": "2017-03-31", "value": 124.2, "previousId": "beef-2016-1"},
        {"id": "beef-2017-2", "date": "2017-06-30", "value": 124.6, "previousId": "beef-2016-2"},
        {"id": "beef-2017-3", "date": "2017-09-30", "value": 124.7, "previousId": "beef-2016-3"},
        {"id": "beef-2017-4", "date": "2017-12-31", "value": 125, "previousId": "beef-2016-4"},
        {"id": "beef-2018-1", "date": "2018-03-31", "value": 126.2, "previousId": "beef-2017-1"},
        {"id": "beef-2018-2", "date": "2018-06-30", "value": 124, "previousId": "beef-2017-2"},
        {"id": "beef-2018-3", "date": "2018-09-30", "value": 124.9, "previousId": "beef-2017-3"},
        {"id": "beef-2018-4", "date": "2018-12-31", "value": 127.3, "previousId": "beef-2017-4"},
        {"id": "beef-2019-1", "date": "2019-03-31", "value": 131, "previousId": "beef-2018-1"},
        {"id": "beef-2019-2", "date": "2019-06-30", "value": 131.5, "previousId": "beef-2018-2"},
        {"id": "beef-2019-3", "date": "2019-09-30", "value": 133.8, "previousId": "beef-2018-3"},
        {"id": "beef-2019-4", "date": "2019-12-31", "value": 137.7, "previousId": "beef-2018-4"},
        {"id": "beef-2020-1", "date": "2020-03-31", "value": 142.5, "previousId": "beef-2019-1"},
        {"id": "beef-2020-2", "date": "2020-06-30", "value": 140.9, "previousId": "beef-2019-2"},
        {"id": "beef-2020-3", "date": "2020-09-30", "value": 144.6, "previousId": "beef-2019-3"},
        {"id": "beef-2020-4", "date": "2020-12-31", "value": 148.9, "previousId": "beef-2019-4"},
        {"id": "beef-2021-1", "date": "2021-03-31", "value": 154.4, "previousId": "beef-2020-1"},
        {"id": "beef-2021-2", "date": "2021-06-30", "value": 159.9, "previousId": "beef-2020-2"},
        {"id": "beef-2021-3", "date": "2021-09-30", "value": 160.4, "previousId": "beef-2020-3"},
        {"id": "beef-2021-4", "date": "2021-12-31", "value": 160.9, "previousId": "beef-2020-4"},
        {"id": "beef-2022-1", "date": "2022-03-31", "value": 173.1, "previousId": "beef-2021-1"},
        {"id": "beef-2022-2", "date": "2022-06-30", "value": 175, "previousId": "beef-2021-2"},
        {"id": "beef-2022-3", "date": "2022-09-30", "value": 175.3, "previousId": "beef-2021-3"},
        {"id": "beef-2022-4", "date": "2022-12-31", "value": 174.8, "previousId": "beef-2021-4"},
        {"id": "beef-2023-1", "date": "2023-03-31", "value": 174.4, "previousId": "beef-2022-1"},
        {"id": "beef-2023-2", "date": "2023-06-30", "value": 171.5, "previousId": "beef-2022-2"},
        {"id": "beef-2023-3", "date": "2023-09-30", "value": 169.4, "previousId": "beef-2022-3"},
        {"id": "beef-2023-4", "date": "2023-12-31", "value": 166.9, "previousId": "beef-2022-4"},
        {"id": "beef-2024-1", "date": "2024-03-31", "value": 164.3, "previousId": "beef-2023-1"},
        {"id": "beef-2024-2", "date": "2024-06-30", "value": 165.3, "previousId": "beef-2023-2"}
      ]
    }
  ],
  "stops": [
    { "id": "cover", "basis": "raw", "throughId": "burger-2017-1", "visible": ["burger"], "cover": true },
    {
      "id": "start",
      "basis": "raw",
      "throughId": "burger-2017-1",
      "visible": [
        "burger"
      ]
    },
    {
      "id": "early",
      "basis": "raw",
      "throughId": "burger-2019-2",
      "visible": [
        "burger"
      ]
    },
    {
      "id": "pause",
      "basis": "raw",
      "throughId": "burger-2022-1",
      "visible": [
        "burger"
      ]
    },
    {
      "id": "rise",
      "basis": "raw",
      "throughId": "burger-2024-2",
      "visible": [
        "burger"
      ]
    },
    {
      "id": "rate",
      "basis": "yoy",
      "visible": [
        "burger"
      ]
    },
    {
      "id": "bread",
      "basis": "yoy",
      "visible": [
        "burger",
        "bread"
      ]
    },
    {
      "id": "beef",
      "basis": "yoy",
      "visible": [
        "burger",
        "beef"
      ]
    }
  ]
};
const defaultPlot = { width: 1200, height: 460, left: 76, right: 1010, top: 58, bottom: 368 };
const fmt = (n, digits = 1) => new Intl.NumberFormat('zh-CN', { maximumFractionDigits: digits }).format(n);
const signed = n => `${n > 0 ? '+' : ''}${fmt(n)}%`;

export function createTrendModel(config = trendExample) {
  keyed(config.series); const stops = keyed(config.stops);
  const plot = { ...defaultPlot, ...config.layout };
  if (!Object.values(plot).every(Number.isFinite) || plot.left < 55 || plot.top < 40 ||
      plot.right <= plot.left || plot.bottom <= plot.top || plot.right + 130 > plot.width || plot.bottom + 65 > plot.height)
    throw new Error('Trend layout needs room for axes and endpoint labels');
  // 原值片段不需要为未使用的同比状态补数据；进入同比的系列才核查同期分母。
  const rateIds = new Set([...stops.values()].filter(stop => stop.basis === 'yoy').flatMap(stop => stop.visible ?? []));
  const start = Date.parse(config.startDate), end = Date.parse(config.endDate);
  if (!(Number.isFinite(start) && end > start)) throw new Error('Trend needs an ordered date window');
  const rows = config.series.map(series => {
    const records = keyed(series.observations);
    const needsRate = rateIds.has(series.id);
    if (needsRate && (!Number.isInteger(series.frequency) || series.frequency < 1 || 12 % series.frequency)) throw new Error("Observation frequency must divide the year");
    const period = date => Math.floor((Number(date.slice(5,7))-1)/(12/series.frequency));
    series.observations.forEach((p,i,all) => {
      if (!Number.isFinite(p.value) || p.value < 0 || !Number.isFinite(Date.parse(p.date)) ||
          (i && Date.parse(p.date) <= Date.parse(all[i-1].date))) throw new Error('Trend records need increasing dates and nonnegative values');
    });
    const points = series.observations.filter(p => Date.parse(p.date) >= start && Date.parse(p.date) <= end).map(p => {
      const previous = records.get(p.previousId);
      if (needsRate && (!previous || previous.value <= 0 || Number(previous.date.slice(0,4)) !== Number(p.date.slice(0,4))-1 || period(previous.date) !== period(p.date)))
        throw new Error('Each displayed observation needs a positive prior-year record: ' + p.id);
      return { ...p, time: Date.parse(p.date), yoy: needsRate ? (p.value / previous.value - 1) * 100 : null };
    });
    if (points.length < 2) throw new Error('Trend needs at least two displayed observations');
    if (series.comparisonMarkId && !points.some(p=>p.id===series.comparisonMarkId)) throw new Error('Comparison material must mark a displayed observation');
    return { ...series, points };
  });
  keyed(rows.flatMap(row => row.points));
  const byId = new Map(rows.map(row=>[row.id,row])), primary = byId.get(config.primaryId);
  if (!primary) throw new Error('primaryId must identify an existing series');
  for (const stop of stops.values()) {
    if (!['raw','yoy'].includes(stop.basis) || !stop.visible?.includes(primary.id) || stop.visible.some(id=>!byId.has(id)) ||
        (stop.basis==='raw' && (stop.visible.length!==1 || !primary.points.some(p=>p.id===stop.throughId))))
      throw new Error('Reading needs known series, basis and an observed raw endpoint');
    if (stop.cover && (stop.basis !== 'raw' || stop.throughId !== primary.points[0].id))
      throw new Error('A cover presents only the first raw observation before entering its timeline');
  }
  const prices=primary.points.map(p=>p.value), rates=rows.flatMap(row=>row.points.map(p=>p.yoy)).filter(Number.isFinite);
  const span=Math.max(...prices)-Math.min(...prices) || Math.max(Math.abs(prices[0])*.2,1), power=10**Math.floor(Math.log10(span/8));
  const rawStep=[1,2,5,10].find(n=>n*power>=span/8)*power;
  const rawLow=Math.floor((Math.min(...prices)-span*.03)/rawStep)*rawStep, rawHigh=Math.ceil((Math.max(...prices)+span*.03)/rawStep)*rawStep;
  const rateLow=Math.floor((Math.min(0,...rates)-1)/5)*5, rateHigh=Math.ceil((Math.max(0,...rates)+1)/5)*5;
  const metric=config.metric ?? '数值', unit=config.unit ?? '', prefix=config.valuePrefix ?? '';
  return { rows,byId,primary,stops,start,end,metric,unit,plot,
    amount:config.formatValue ?? (value=>prefix+fmt(value,2)+(prefix || !unit ? '' : ' '+unit)),
    x:linearScale([start,end],[plot.left,plot.right]),
    rawScale:linearScale([rawLow,rawHigh],[plot.bottom,plot.top]), rateScale:rates.length?linearScale([rateLow,rateHigh],[plot.bottom,plot.top]):null,
    rawTicks:Array.from({length:Math.round((rawHigh-rawLow)/rawStep)+1},(_,i)=>rawLow+i*rawStep),
    rateTicks:rates.length?Array.from({length:Math.round((rateHigh-rateLow)/5)+1},(_,i)=>rateLow+i*5):[] };
}

export function trendPose(id,model=createTrendModel()) {
  const stop=model.stops.get(id); if(!stop) throw new Error('Unknown trend reading: '+id);
  const rate=stop.basis==='yoy', nodes=new Map(),lines=new Map(),annotations=new Map();
  for (const row of model.rows) {
    const visible=stop.visible.includes(row.id), through=rate?row.points.length-1:Math.max(0,row.points.findIndex(p=>p.id===stop.throughId));
    lines.set(row.id,{id:row.id,row,reveal:visible?through:0,opacity:visible?1:0});
    row.points.forEach(p=>nodes.set(p.id,{id:p.id,row:p,x:at(model.x,p.time),y:at(rate && p.yoy!==null?model.rateScale:model.rawScale,rate && p.yoy!==null?p.yoy:p.value)}));
    if(visible) {
      const p=row.points[through], key=`${row.id}/${stop.basis}/${p.id}`;
      annotations.set(key,{id:key,seriesId:row.id,pointId:p.id,text:rate?signed(p.yoy):model.amount(p.value),opacity:1});
    }
  }
  const endpoint=rate?model.primary.points.at(-1):model.primary.points.find(p=>p.id===stop.throughId);
  if (stop.cover) {
    const point=nodes.get(endpoint.id);
    point.x=model.plot.width/2; point.y=(model.plot.top+model.plot.bottom)/2-24;
  }
  return {id,nodes,lines,annotations,cover:stop.cover?1:0,basis:rate?1:0,compare:stop.visible.length>1?1:0,time:endpoint.time};
}

export function blendTrend(a,b,t) {
  return blendWithAnnotations(a,b,t,(from,to,p)=>({...to,
    nodes:blendNodes(from.nodes,to.nodes,p,['x','y']), lines:blendNodes(from.lines,to.lines,p,['reveal','opacity']),
    cover:lerp(from.cover,to.cover,p),basis:lerp(from.basis,to.basis,p),compare:lerp(from.compare,to.compare,p),time:lerp(from.time,to.time,p)}));
}

// Only the connecting path interpolates; material marks belong to actual observations.
export function revealedPath(row,nodes,reveal) {
  const through=Math.max(0,Math.min(row.points.length-1,reveal)), i=Math.floor(through);
  const points=row.points.slice(0,i+1).map(p=>nodes.get(p.id));
  if(i<row.points.length-1) {
    const a=points.at(-1),b=nodes.get(row.points[i+1].id);
    points.push({x:lerp(a.x,b.x,through-i),y:lerp(a.y,b.y,through-i)});
  }
  return {d:points.map((p,j)=>`${j?'L':'M'}${p.x},${p.y}`).join(' '),end:points.at(-1)};
}

export function trendMarks(model,pose) {
  return model.rows.flatMap(row=>row.points.map((point,i)=>{
    const line=pose.lines.get(row.id), position=pose.nodes.get(point.id), reached=clamp01((line.reveal-i+.12)/.12);
    const tip=clamp01(1-Math.abs(line.reveal-i)*2), history=row.id===model.primary.id?1-pose.compare:0;
    // A meaningful interior observation can identify a series when its endpoint is crowded.
    const focus=row.comparisonMarkId?lerp(tip,point.id===row.comparisonMarkId?1:0,pose.compare):tip;
    return {...position,id:point.id,point,row,size:lerp(lerp(34,54,focus),250,pose.cover),opacity:line.opacity*reached*Math.max(history,focus)};
  }));
}

export function mountTrend(root,{config=trendExample,duration=1500}={}) {
  const $=s=>root.querySelector(s),svg=$('svg');
  let model=createTrendModel(config),plot=model.plot,sizeKey;
  root.querySelectorAll('[data-observation]').forEach(el=>{
    const point=model.rows.flatMap(r=>r.points).find(p=>p.id===el.dataset.observation);
    if(!point) throw new Error('Missing prose observation: '+el.dataset.observation);
    const metric=el.dataset.metric;
    if(metric?.includes('yoy') && point.yoy===null) throw new Error('YoY text needs a configured yoy reading: '+point.id);
    el.textContent=metric==='absolute-yoy'?fmt(Math.abs(point.yoy))+'%':metric==='yoy'?signed(point.yoy):fmt(point.value,2);
  });
  const grid=svgElement('g',{class:'axis'}),rawAxis=svgElement('g'),rateAxis=svgElement('g');
  const dates=svgElement('g');grid.append(rawAxis,rateAxis,dates);svg.append(grid);
  const dateLabel=svgElement('text',{y:22,'text-anchor':'end',class:'date-label'});svg.append(dateLabel);
  function fit(size) {
    const key=size.width+'/'+size.height;if(key===sizeKey)return;sizeKey=key;
    if(!config.layout)model=createTrendModel({...config,layout:{...size,left:64,right:size.width-166,top:58,bottom:size.height-72}});
    plot=model.plot;setSvgAttributes(svg,{viewBox:`0 0 ${plot.width} ${plot.height}`});
    for(const [group,ticks,scale,title] of [[rawAxis,model.rawTicks,model.rawScale,[model.metric,model.unit].filter(Boolean).join(' / ')],[rateAxis,model.rateTicks,model.rateScale,'相对上年同期 / %']]) {
      group.replaceChildren();
      ticks.forEach(tick=>group.append(svgElement('line',{x1:plot.left,x2:plot.right,y1:at(scale,tick),y2:at(scale,tick),class:tick===0?'zero':''}),svgElement('text',{x:plot.left-18,y:at(scale,tick)+6,'text-anchor':'end'},fmt(tick,6))));
      group.append(svgElement('text',{x:plot.left,y:22,class:'axis-title'},title));
    }
    dates.replaceChildren();
    for(let y=new Date(model.start).getUTCFullYear();y<=new Date(model.end).getUTCFullYear();y++) dates.append(svgElement('text',{x:at(model.x,Date.UTC(y,0,1)),y:plot.bottom+43,'text-anchor':'middle'},y));
    setSvgAttributes(dateLabel,{x:plot.right});
  }
  const paths=createSvgLayer(svg,{create(){return svgElement('path',{fill:'none','stroke-width':2.6,'stroke-linejoin':'round','stroke-linecap':'round'});},update(node,line){setSvgAttributes(node,{d:line.path.d,stroke:line.row.color,opacity:line.opacity});}});
  const marks=createSvgLayer(svg,{create(mark){return svgElement('image',{href:new URL(mark.row.image,import.meta.url).href,'data-record':mark.id,class:'mark-image'});},update(node,mark){setSvgAttributes(node,{x:mark.x-mark.size/2,y:mark.y-mark.size/2,width:mark.size,height:mark.size,opacity:mark.opacity});}});
  let current;
  const labels=createSvgLayer(svg,{create(){const g=svgElement('g');g.append(svgElement('text',{class:'readout'}),svgElement('text',{class:'series-name'}));return g;},update(g,label){
    const point=current.nodes.get(label.pointId),row=model.byId.get(label.seriesId),end=point.row.time===row.points.at(-1).time;
    // Endpoint labels stay beside their actual marks; opposite sides separate nearby series.
    const offsetY=current.compare>.5?(row.id===model.primary.id?-35:48):-38;
    const x=lerp(end?point.x+35:point.x+12,point.x,current.cover);
    const y=point.y+lerp(offsetY,136,current.cover);
    setSvgAttributes(g,{opacity:label.opacity,fill:row.color});
    setSvgAttributes(g.children[0],{x,y,'text-anchor':current.cover>.5?'middle':'start','font-size':lerp(27,40,current.cover)});g.children[0].textContent=label.text;
    const cover=current.cover>.5;
    setSvgAttributes(g.children[1],{x,y:y+(cover?29:offsetY>0?25:-26),'text-anchor':cover?'middle':'start'});
    g.children[1].textContent=cover?`${new Date(point.row.time).getUTCFullYear()} 年 · ${model.unit}`:current.compare>.5?row.name:'';
  }});
  const cues=[...root.querySelectorAll('[data-step]')];
  const copyContainer=$('.stage-copy');
  const copy=copyContainer?createCopyHandoff(copyContainer,{duration:350,offsetY:5}):null;
  const readings=[...root.querySelectorAll('[data-copy] [data-observation]')].map(el=>{
    const row=model.rows.find(row=>row.points.some(point=>point.id===el.dataset.observation));
    return {el,rowId:row.id,index:row.points.findIndex(point=>point.id===el.dataset.observation),
      basis:el.dataset.metric?.includes('yoy')?'yoy':'raw',opacity:el.style.opacity};
  });
  function showReading({id}) {
    copy?.show(id);
    const next=$('[data-next]'),i=cues.findIndex(cue=>cue.dataset.step===id);
    if(next){next.href=i>=0&&i<cues.length-1?'#'+cues[i+1].id:'#conclusion';next.textContent=id==='cover'?'沿着报价往后看 ↓':i===cues.length-1?'回到这份午餐 ↓':'继续往下看 ↓'}
  }
  function render(pose,frame) {
    current=pose;
    setSvgAttributes(grid,{opacity:1-pose.cover});setSvgAttributes(dateLabel,{opacity:1-pose.cover});
    setSvgAttributes(rawAxis,{opacity:clamp01(1-pose.basis*5)});setSvgAttributes(rateAxis,{opacity:clamp01((pose.basis-.8)*5)});
    paths.render([...pose.lines.values()].map(line=>({...line,path:revealedPath(line.row,pose.nodes,line.reveal)})));
    marks.render(trendMarks(model,pose));labels.render(pose.annotations);
    dateLabel.textContent=pose.basis>.5?`${new Date(model.start).getUTCFullYear()} — ${new Date(model.end).getUTCFullYear()}`:`${new Date(pose.time).getUTCFullYear()}`;
    // The paragraph stays complete; number emphasis follows the observed points/labels.
    for(const {el,rowId,index,basis} of readings) {
      const line=pose.lines.get(rowId),note=pose.annotations.get(`${rowId}/${basis}/${el.dataset.observation}`);
      const basisReady=basis==='yoy'?pose.basis>=.99:pose.basis<=.01;
      const reached=line.reveal>=index && line.opacity>=.99;
      el.style.opacity=String(.7+.3*(basisReady && reached ? note?.opacity ?? 1 : 0));
    }
    const scope=$('[data-scope]');
    if(scope)scope.textContent=pose.basis>.5?'同比涨幅 · 半年报价与季度食材指数，各保留原始日期':'巨无霸 · 澳大利亚半年报价 · 澳元';
    svg.dataset.state=pose.id;svg.dataset.moving=String(frame.moving);
    if(!frame.moving) svg.setAttribute('aria-label',`${pose.basis?'同比涨幅':model.metric}。`+[...pose.annotations.values()].map(label=>`${model.byId.get(label.seriesId).name} ${label.text}`).join('；'));
  }
  // Full-screen cues include a final reading interval; prose-flow hosts can retain the exit helper.
  const exit=$('[data-reading-end]')?reserveStageExit({sticky:$('.price-stage'),readingEnd:$('[data-reading-end]'),spacer:$('.reading-tail'),releaseRatio:.4}):null;
  const steps=cues.length?cues.map(element=>({element,id:element.dataset.step})):[...root.querySelectorAll('[data-state]')].map(element=>({element,id:element.dataset.state}));
  const stage=createStage({element:svg,steps,layout:(id,size)=>{fit(size);return trendPose(id,model)},blend:blendTrend,render,duration,viewportRatio:.55,onReading:showReading});
  document.fonts.ready.then(()=>stage.refresh());
  return {sample:stage.sample,dispose(){stage.dispose();exit?.dispose();copy?.dispose();readings.forEach(({el,opacity})=>{el.style.opacity=opacity});paths.dispose();marks.dispose();labels.dispose();grid.remove();dateLabel.remove();}};
}
