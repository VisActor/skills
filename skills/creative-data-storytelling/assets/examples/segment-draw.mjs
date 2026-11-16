import { svgElement, setSvgAttributes } from '../runtime/svg.mjs';
export { lerp, clamp01, ease } from '../runtime/geometry.mjs';
export const attr=setSvgAttributes;
export function el(parent,tag,attrs={},text){const n=svgElement(tag,attrs,text);parent.append(n);return n;}
export function txt(parent,x,y,text,attrs={}){return el(parent,'text',{x,y,...attrs,...(attrs.fill?{style:`${attrs.style||''};fill:${attrs.fill}`}:{})},text);}
export function line(parent,x1,y1,x2,y2,attrs={}){return el(parent,'line',{x1,y1,x2,y2,...attrs});}
export function mix(a,b,t){const out={};for(const k of Object.keys(b)){out[k]=typeof b[k]==='number'?a[k]+(b[k]-a[k])*t:b[k];}return out;}
