// Geometry and browser paint order for DOM text. Hit-test-only styles are restored.
({selector, minOverlapArea, overflowTolerance}) => {
  const root = document.querySelector(selector);
  if (!root) throw new Error('Text visibility root not found');
  const texts = [], occluded = [], unmeasured = [], nodes = [], elements = [root, ...root.querySelectorAll('*')];
  const glyphContext=document.createElement('canvas').getContext('2d');
  const visible = el => {
    for (let n = el; n; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
    }
    return el.getClientRects().length > 0;
  };
  const label = el => el.getAttribute('data-display-id') || el.id || el.tagName.toLowerCase();
  const rect = b => ({left:b.left, top:b.top, right:b.right, bottom:b.bottom, width:b.width, height:b.height});
  const intersection = (a,b) => {
    const left=Math.max(a.left,b.left), top=Math.max(a.top,b.top), right=Math.min(a.right,b.right), bottom=Math.min(a.bottom,b.bottom);
    return right>left && bottom>top ? {left,top,right,bottom,width:right-left,height:bottom-top} : null;
  };
  const complex = el => {
    for(let n=el;n;n=n.parentElement) {
      const s=getComputedStyle(n), m=new DOMMatrixReadOnly(s.transform==='none'?undefined:s.transform);
      if(!m.is2D || m.a<=0 || m.d<=0 || Math.abs(m.b)>1e-6 || Math.abs(m.c)>1e-6 ||
         (s.rotate && s.rotate!=='none') || (s.scale && s.scale!=='none' && s.scale.split(/\s+/).some(v=>Number(v)<=0)) ||
         Number(s.opacity)!==1 || s.clipPath!=='none' || (s.maskImage && s.maskImage!=='none') ||
         (s.clip && s.clip!=='auto') || s.filter!=='none' || s.mixBlendMode!=='normal') return true;
    }
    return false;
  };
  const unknown = message => {if(!unmeasured.includes(message)) unmeasured.push(message);};
  const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  while(walk.nextNode()) {
    const node=walk.currentNode, el=node.parentElement, text=node.textContent.trim();
    if(!el || !text || el.closest('script,style,noscript') || !visible(el)) continue;
    const range=document.createRange(); range.selectNodeContents(node);
    const boxes=[...range.getClientRects()].filter(b=>b.width>0 && b.height>0);
    const s=getComputedStyle(el), ink=[];
    glyphContext.font=[s.fontStyle,s.fontWeight,s.fontSize,s.fontFamily].join(' ');
    let sx=1,sy=1;
    for(let n=el;n;n=n.parentElement) {
      const ns=getComputedStyle(n), m=new DOMMatrixReadOnly(ns.transform==='none'?undefined:ns.transform);
      const scale=ns.scale && ns.scale!=='none'?ns.scale.split(/\s+/).map(Number):[1,1];
      const zoom=Number(ns.zoom)||1;
      sx*=m.a*scale[0]*zoom;sy*=m.d*(scale[1]??scale[0])*zoom;
    }
    // Range font boxes include ascender/descender whitespace. Compare actual ink
    // for text collisions, rather than treating that whitespace as painted text.
    let offset=0;
    for(const char of node.textContent) {
      const start=offset;offset+=char.length;
      if(!char.trim()) continue;
      const cr=document.createRange();cr.setStart(node,start);cr.setEnd(node,offset);
      const b=cr.getBoundingClientRect(), m=glyphContext.measureText(char);
      if(!Number.isFinite(m.fontBoundingBoxAscent)) {unknown('Missing glyph metrics: '+label(el));continue;}
      const left=b.left-m.actualBoundingBoxLeft*sx, right=b.left+m.actualBoundingBoxRight*sx;
      const top=b.top+(m.fontBoundingBoxAscent-m.actualBoundingBoxAscent)*sy;
      const bottom=b.top+(m.fontBoundingBoxAscent+m.actualBoundingBoxDescent)*sy;
      if(right>left && bottom>top) ink.push({left,top,right,bottom,width:right-left,height:bottom-top});
    }
    const item={element:label(el), text:text.slice(0,120), rects:boxes.map(rect), inkRects:ink.map(rect)};
    texts.push(item); nodes.push({el,item,boxes:ink});
    if(el instanceof SVGElement || complex(el)) unknown('Unsupported text visibility: '+label(el));
  }
  const paints=[];
  const colorContext=document.createElement('canvas').getContext('2d',{willReadFrequently:true});
  for(const el of elements) {
    if(!visible(el)) continue;
    const s=getComputedStyle(el);
    // Canvas is a paint surface; its chart text remains covered by chart inspectors.
    const media=el.matches('img,canvas,svg,video,iframe');
    colorContext.clearRect(0,0,1,1); colorContext.fillStyle=s.backgroundColor; colorContext.fillRect(0,0,1,1);
    const alpha=colorContext.getImageData(0,0,1,1).data[3]/255;
    if(media || alpha>0 || s.backgroundImage!=='none') {
      paints.push({el,box:el.getBoundingClientRect(),opaque:media || alpha===1});
    }
    for(const pseudo of ['::before','::after']) {
      const ps=getComputedStyle(el,pseudo);
      if(!['none','normal',''].includes(ps.content) && ps.display!=='none' &&
         nodes.some(n=>intersection(el.getBoundingClientRect(),n.el.getBoundingClientRect()))) {
        unknown('Pseudo-element paint needs visual review: '+label(el)+pseudo);
      }
    }
  }
  // Force only hit testing, so pointer-events:none cannot hide a covering layer.
  // Browser hit testing supplies actual stacking order, including nested contexts.
  const previous=elements.map(el=>[el,el.getAttribute('style')]);
  try {
    for(const el of elements) el.style.setProperty('pointer-events','auto','important');
    for(const {el,item,boxes} of nodes) {
      for(const box of boxes) {
        if(box.left<0 || box.top<0 || box.right>innerWidth || box.bottom>innerHeight) {
          unknown('Text outside hit-test viewport: '+item.element);
        }
        for(let ancestor=el;ancestor;ancestor=ancestor.parentElement) {
          const s=getComputedStyle(ancestor), b=ancestor.getBoundingClientRect();
          const clipX=['hidden','clip','auto','scroll'].includes(s.overflowX);
          const clipY=['hidden','clip','auto','scroll'].includes(s.overflowY);
          const sx=b.width/(ancestor.offsetWidth||b.width), sy=b.height/(ancestor.offsetHeight||b.height);
          const cb=el.offsetParent;
          // Out-of-flow text may escape a non-containing overflow ancestor.
          const escapes=s.position==='static' && ['absolute','fixed'].includes(getComputedStyle(el).position) && cb && cb!==ancestor && cb.contains(ancestor);
          const left=b.left+ancestor.clientLeft*sx, top=b.top+ancestor.clientTop*sy;
          if(!escapes && ((clipX && (box.left<left-overflowTolerance || box.right>left+ancestor.clientWidth*sx+overflowTolerance)) ||
             (clipY && (box.top<top-overflowTolerance || box.bottom>top+ancestor.clientHeight*sy+overflowTolerance)))) {
            occluded.push({...item,reason:'clipped by ancestor',cover:label(ancestor)});
          }
          if(ancestor===root) break;
        }
        for(const cover of paints) {
          if(cover.el===el || cover.el.contains(el) || el.contains(cover.el)) continue;
          const area=intersection(box,cover.box);
          if(!area || area.width*area.height<=minOverlapArea) continue;
          const points=[[.5,.5],[.1,.1],[.9,.1],[.1,.9],[.9,.9]];
          const above=points.some(([x,y])=>{
            const stack=document.elementsFromPoint(area.left+area.width*x,area.top+area.height*y);
            const a=stack.indexOf(cover.el), b=stack.indexOf(el);
            return a>=0 && b>=0 && a<b;
          });
          if(!above) continue;
          if(complex(cover.el) || !cover.opaque) unknown('Complex covering paint: '+item.element+' / '+label(cover.el));
          else occluded.push({...item,reason:'occluded',cover:label(cover.el),intersection:rect(area)});
        }
      }
    }
    for(let i=0;i<nodes.length;i++) for(let j=i+1;j<nodes.length;j++) {
      const a=nodes[i],b=nodes[j];
      const overlap=a.boxes.some(x=>b.boxes.some(y=>{const z=intersection(x,y);return z && z.width*z.height>minOverlapArea;}));
      if(overlap) occluded.push({...a.item,reason:'text overlap',cover:b.item.element,coverText:b.item.text});
    }
  } finally {
    for(const [el,style] of previous) {
      if(style===null) el.removeAttribute('style'); else el.setAttribute('style',style);
    }
  }
  return {passed:occluded.length===0 && unmeasured.length===0,texts,occluded,unmeasured};
}
