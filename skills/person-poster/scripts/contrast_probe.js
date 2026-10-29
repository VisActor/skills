// Read-only browser probe: temporary paint changes preserve layout and are restored.
(selector) => {
  const root = document.querySelector(selector);
  if (!root) throw new Error('Contrast root not found');
  const bounds = root.getBoundingClientRect(), texts = [], unknown = [], dom = [], graphics = [], stages = [];
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d', {willReadFrequently:true});
  const rgba = color => {
    if (typeof color !== 'string' || !CSS.supports('color', color)) return null;
    ctx.clearRect(0,0,1,1); ctx.fillStyle=color; ctx.fillRect(0,0,1,1);
    return [...ctx.getImageData(0,0,1,1).data];
  };
  const visible = el => {
    for (let n=el; n; n=n.parentElement) {
      const s=getComputedStyle(n);
      if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0) return false;
    }
    return el.getClientRects().length>0;
  };
  const unsupported = el => {
    for(let n=el;n;n=n.parentElement) {
      const s=getComputedStyle(n), m=new DOMMatrixReadOnly(s.transform==='none'?undefined:s.transform);
      if(Number(s.opacity)!==1 || s.filter!=='none' || s.mixBlendMode!=='normal' ||
         !m.is2D || Math.abs(m.b)>1e-6 || Math.abs(m.c)>1e-6 ||
         (s.rotate && s.rotate!=='none') || s.backgroundClip==='text') return true;
    }
    return false;
  };
  const rect = b => ({x:b.left-bounds.left,y:b.top-bounds.top,width:b.width,height:b.height});
  const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  while(walk.nextNode()) {
    const node=walk.currentNode,el=node.parentElement,text=node.textContent.trim();
    if(!el||!text||el.closest('script,style,noscript')||!visible(el))continue;
    const range=document.createRange(); range.selectNodeContents(node);
    const boxes=[...range.getClientRects()].filter(b=>b.width>0&&b.height>0).map(rect);
    if(!boxes.length)continue;
    const s=getComputedStyle(el),color=rgba(s.webkitTextFillColor || s.color);
    if(el instanceof SVGElement || unsupported(el) || !color || color[3]!==255 ||
       parseFloat(s.webkitTextStrokeWidth)>0 || s.textShadow!=='none') {
      unknown.push('Unsupported DOM text paint: '+text.slice(0,100));continue;
    }
    const scale=el.getBoundingClientRect().width / (el.offsetWidth || el.getBoundingClientRect().width);
    texts.push({source:'dom',text,rects:boxes,color:color.slice(0,3),
      fontSizePx:parseFloat(s.fontSize)*scale,fontFamily:s.fontFamily,bold:Number(s.fontWeight)>=700});
    if(!dom.some(d=>d.el===el))dom.push({el,style:el.getAttribute('style')});
  }
  const mounts=[...root.querySelectorAll('[data-chart-id]')];
  for(const chart of window.__POSTER_INSTANCES__ || []) {
    const container=chart.getContainer?.(),mount=mounts.find(el=>el===container||el.contains(container));
    if(!mount||!visible(mount))continue;
    const stage=chart.getStage?.(); if(!stage){unknown.push('Missing chart stage');continue;}
    for(const canvas of mount.querySelectorAll('canvas')) {
      const b=canvas.getBoundingClientRect();
      if(b.width>0&&b.height>0&&
         (canvas.width+1<b.width*devicePixelRatio||canvas.height+1<b.height*devicePixelRatio))
        unknown.push('Chart canvas below native capture resolution: '+mount.dataset.chartId);
    }
    stages.push(stage);
    const mb=mount.getBoundingClientRect(), sx=mb.width/mount.clientWidth,sy=mb.height/mount.clientHeight;
    const seen=new Set();
    function visit(g,shown=true,opacity=1) {
      if(!g||seen.has(g))return;seen.add(g);
      const a=g.attribute||{},theme=g.getGraphicTheme?.()||{};
      shown=shown&&a.visible!==false&&a.opacity!==0;opacity*=Number(a.opacity??1);
      if(shown&&g.type==='text'&&String(a.text??'').trim()) {
        const text=String(a.text),color=rgba(a.fill??theme.fill),b=g.globalAABBBounds,m=g.globalTransMatrix;
        const stroke=a.stroke&&a.lineWidth!==0?rgba(a.stroke):null;
        if(!color||color[3]!==255||opacity!==1||Number(a.fillOpacity??1)!==1||unsupported(mount)||
           !b||!m||Math.abs(m.b)>1e-6||Math.abs(m.c)>1e-6||
           (a.stroke&&a.lineWidth!==0&&(!stroke||stroke[3]!==255))||a.shadowBlur) {
          unknown.push('Unsupported chart text paint: '+text.slice(0,100)+' '+JSON.stringify({
            fill:a.fill,stroke:a.stroke,opacity,fillOpacity:a.fillOpacity,mountEffects:unsupported(mount)}));
        } else {
          texts.push({source:'chart',chart:mount.dataset.chartId,text,color:color.slice(0,3),
            strokeColor:stroke?stroke.slice(0,3):null,
            rects:[{x:mb.left-bounds.left+b.x1*sx,y:mb.top-bounds.top+b.y1*sy,
                    width:(b.x2-b.x1)*sx,height:(b.y2-b.y1)*sy}],
            fontSizePx:Number(a.fontSize??theme.fontSize)*Math.abs(m.d)*sy,
            fontFamily:String(a.fontFamily??theme.fontFamily??''),
            bold:Number(a.fontWeight??theme.fontWeight)>=700});
          graphics.push({g,fill:a.fill,fillOpacity:a.fillOpacity,stroke:a.stroke});
        }
      } else if(shown&&g.type==='richtext') unknown.push('Unsupported chart rich text');
      g.forEachChildren?.(c=>visit(c,shown,opacity));
    }
    visit(stage);
  }
  if(mounts.length!==(window.__POSTER_INSTANCES__||[]).length)unknown.push('Chart coverage mismatch');
  window.__POSTER_CONTRAST_PROBE__={
    paint(mode) {
      for(const d of dom) {
        if(mode==='restore') {
          if(d.style===null)d.el.removeAttribute('style');else d.el.setAttribute('style',d.style);
        } else d.el.style.setProperty('-webkit-text-fill-color',mode==='clear'?'transparent':mode,'important');
      }
      for(const d of graphics) d.g.setAttributes(mode==='restore'?
        {fill:d.fill,fillOpacity:d.fillOpacity,stroke:d.stroke}:
        {fill:mode==='clear'?'black':mode,fillOpacity:mode==='clear'?0:1,stroke:false});
      for(const stage of stages)stage.render();
    }
  };
  return {rootWidth:bounds.width,rootHeight:bounds.height,
    rootDocumentX:bounds.left+scrollX,rootDocumentY:bounds.top+scrollY,texts,unmeasured:unknown};
}
