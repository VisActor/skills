import { membershipExample, createMembership, blendMembership } from "./model.mjs";
import { createSvgLayer, svgElement, setSvgAttributes as attr } from "../../runtime/svg.mjs";

export const example={
  id:"shared-members", title:"相遇的人，来自哪里", eyebrow:"讲座与工作坊 · 联合参与记录",
  theme:{paper:"#f4f1e9",ink:"#234441",muted:"#576c65",accent:"#287d7c",line:"#cdd3c8"},
  viewBox:"0 0 1000 680",duration:1450,dataBadge:"模拟记录",
  dataCaption:"每点 = 一个报名名额；颜色始终表示报名来源。",
  states:[{name:"报名来源"},{name:"原位辨认"},{name:"共同参与者"}], mount:mountMembership,
};
export function mountMembership(svg,{data=membershipExample}={}){
  const model=createMembership(data), states=["sources","identify","gather"];
  const signup=model.leaders.signup[0],joint=model.leaders.joint[0];
  const differentLeaders=model.leaders.signup.length===1&&model.leaders.joint.length===1&&signup.id!==joint.id;
  const colors=new Map(model.groups.map(g=>[g.id,g.color]));
  const dots=createSvgLayer(svg,{create(n){const g=svgElement("circle",{"data-record":n.id,fill:colors.get(n.origin)});
    g.append(svgElement("title",{},`${model.groups.find(g=>g.id===n.origin).label} · ${n.selected?"两项都参加":"未同时参加两项"}`));return g;},
    update(el,n){attr(el,{cx:n.x,cy:n.y,r:n.radius,opacity:n.opacity});}});
  const labels=createSvgLayer(svg,{create(){return svgElement("text",{"text-anchor":"middle"});},
    update(el,n){el.textContent=n.text;attr(el,{x:n.x,y:n.y,class:n.role,opacity:n.opacity,style:`fill:${n.color}`});}});
  return {model,pose:i=>model.layout(states[i]),blend:blendMembership,
    read(i){const {total,selected,remaining}=model.readings;return {
      name:example.states[i].name,value:"",unit:"",metric:"",
      title:["从不同入口报名，<br>多少人两项都参加？","两项都参加的人，<br>来自哪些入口？",
        differentLeaders?`${signup.label}报名更多，<br>共同参与却更少。`:"共同参与的这群人，<br>各有多少来自这些入口？"][i],
      description:[`社区活动共有 ${total} 人报名，来源分为${model.groups.map(g=>g.label).join("、")}。活动包括讲座与工作坊，报名后可以任选，也可以缺席。`,
        `${selected} 人同时参加了讲座和工作坊，另外 ${remaining} 人只参加一项或都没参加。报名最多的入口，会带来最多的共同参与者吗？`,
        differentLeaders?`${signup.label}报名 ${signup.members.length} 人，比${joint.label}多 ${signup.members.length-joint.members.length} 人；两项都参加的却只有 ${signup.selected.length} 人，少于${joint.label}的 ${joint.selected.length} 人。报名规模和共同参与人数，排出的顺序不同。`
          : `${model.groups.map(g=>`${g.label} ${g.selected.length} 人`).join("、")}，合起来是 ${selected} 位共同参与者。比较各来源的共同参与人数时，也能回看它们原来的报名规模。`][i],
      highlights:i===2?[`${signup.members.length} 人`,...model.groups.map(g=>`${g.selected.length} 人`)]:i?[`${selected} 人`]:[`${total} 人`],
    };},
    copyReady(i,p){const target=model.layout(states[i]);return [...target.nodes].every(([id,n])=>{
      const a=p.nodes.get(id);return Math.hypot(a.x-n.x,a.y-n.y)<12 && Math.abs(a.opacity-n.opacity)<.08;});},
    render(p){dots.render(p.nodes);labels.render(p.labels);},
    dispose(){dots.dispose();labels.dispose();},
  };
}
