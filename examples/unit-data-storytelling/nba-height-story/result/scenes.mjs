export const POSITIONS = ['PG','SG','SF','PF','C'];
export const NAMES = {PG:'控球后卫',SG:'得分后卫',SF:'小前锋',PF:'大前锋',C:'中锋'};
export const COLORS = {PG:'#7bc9bd',SG:'#9faed5',SF:'#c8ce9e',PF:'#e9ac75',C:'#dc8c7c'};
export const PEOPLE = {
  russebi01:{name:'比尔·拉塞尔',short:'拉塞尔'},
  chambwi01:{name:'威尔特·张伯伦',short:'张伯伦'},
  abdulka01:{name:'卡里姆·阿卜杜勒-贾巴尔',short:'贾巴尔'},
  johnsma02:{name:'魔术师约翰逊',short:'魔术师'},
  birdla01:{name:'拉里·伯德',short:'伯德'},
  jordami01:{name:'迈克尔·乔丹',short:'乔丹'},
  onealsh01:{name:'沙奎尔·奥尼尔',short:'奥尼尔'},
  bryanko01:{name:'科比·布莱恩特',short:'科比'},
  jamesle01:{name:'勒布朗·詹姆斯',short:'詹姆斯'},
  curryst01:{name:'斯蒂芬·库里',short:'库里',image:'assets/curry.png'},
  greendr01:{name:'德雷蒙德·格林',short:'格林',image:'assets/green.png'},
  jokicni01:{name:'尼古拉·约基奇',short:'约基奇',image:'assets/jokic.png'},
  gilgesh01:{name:'谢伊·吉尔杰斯-亚历山大',short:'SGA',image:'assets/shai.png'},
};
const all=POSITIONS, front=['PF','C'];
export const ERAS=[
  {year:1960,title:'巨人的名字，\n一代人的身材。',body:'拉塞尔与张伯伦之外，球场上还有数百个不同的身影。先看清五个位置，再沿年代往前走。',
    memory:'拉塞尔的凯尔特人王朝，与张伯伦的对决。',source:'https://www.nba.com/news/history-nba-legend-bill-russell',heroes:[['russebi01','C'],['chambwi01','C']],metricPos:'ALL'},
  {year:1970,title:'天勾的年代，\n前场继续长高。',body:'中锋平均身高来到 208.6 厘米，大前锋也向右移动。变化不只发生在最出名的那几个人身上。',
    memory:'贾巴尔在雄鹿与湖人之间，留下“天勾”的记忆。',source:'https://www.nba.com/news/history-nba-legend-kareem-abdul-jabbar',heroes:[['abdulka01','C']],metricPos:'C'},
  {year:1980,title:'黑白双雄，\n并非普通身材。',body:'魔术师是控卫中的高个；伯德在前锋人群中。明星让人记住一种形象，整排单元却有更宽的分布。',
    memory:'魔术师与伯德，将湖人与凯尔特人的对抗带进 80 年代。',source:'https://www.nba.com/news/history-nba-legend-larry-bird',heroes:[['johnsma02','PG'],['birdla01','SF']],metricPos:'C'},
  {year:1990,title:'飞人的时代，\n高塔也站在场上。',body:'乔丹的身影落在分卫人群里。这一年代，中锋平均约 211.5 厘米，是这七个年代中的最高值。',
    memory:'乔丹与公牛，在 90 年代完成两次三连冠。',source:'https://www.nba.com/news/history-nba-legend-michael-jordan',heroes:[['jordami01','SG']],metricPos:'C'},
  {year:2000,title:'OK 的记忆，\n高大的前场。',body:'奥尼尔与科比分别站在两条分布中。此时 PF 平均 206.4 厘米；记住前场的轮廓，稍后还要比较。',
    memory:'2000—2002，奥尼尔与科比带领湖人三连冠。',source:'https://www.nba.com/news/history-season-review-2001-02',heroes:[['onealsh01','C'],['bryanko01','SG']],metricPos:'PF'},
  {year:2010,title:'熟悉的对决，\n变化中的轮廓。',body:'库里与詹姆斯是时代的线索。与 2000s 相比，PF、C 的均值都回落；整个人群的变化开始显现。',
    memory:'2015—2018，勇士与骑士连续四年相遇总决赛。',source:'https://www.nba.com/lebron-james-past-finals-trips-history',heroes:[['curryst01','PG'],['jamesle01','SF']],metricPos:'PF'},
  {year:2020,title:'高度的方向，\n已经分开。',body:'六个已结束赛季里，前场均值低于 2000s，控卫略高。接下来只留下 PF 和 C，把变化看得更清楚。',
    memory:'约基奇在 2021、2022、2024 年获得常规赛 MVP。',source:'https://www.nba.com/news/nikola-jokic-2023-24-kia-mvp',heroes:[['jokicni01','C']],metricPos:'PF'},
];
const annualCopy={
  2016:['变化并不\n沿直线发生。','较矮中锋的时间份额先降到 9.2%。2015 是记忆锚点，不是数据在这一年突然转向的证明。'],
  2017:['先看每一年，\n再谈一种趋势。','较矮一侧重新增加，但仍要继续往后看。每个点的面积，使用相同的分钟份额比例。'],
  2018:['名单里的小个，\n获得更多时间。','不超过 205.74 厘米的球员，拿到 C 标签群体约四分之一的出场分钟。'],
  2019:['变化中，\n也有小幅回摆。','这一比例略低于上一季。逐季展开，是为了保留十年平均看不见的波动。'],
  2020:['约三成时间，\n落在较矮一侧。','同一个身高分界下，C 标签群体的分钟份额来到约 30%。人群的变化也进入时间分配。'],
  2021:['较矮的中锋，\n依然有分量。','较矮一侧占据约三成分钟。但这不是高大中锋消失，也不是一套五人阵容的数据。'],
  2022:['来到低点，\n却不是终点。','C 群体分钟加权身高为 208.73 厘米；较矮球员拿到 36.1% 的分钟。此后方向将再次变化。'],
  2023:['从这里，\n分布开始回升。','C 群体分钟加权身高回到 209.27 厘米。保持横轴与面积比例，看看接下来三季。'],
  2024:['较高的一侧，\n重新获得分量。','C 群体分钟加权身高来到 209.98 厘米。这一年约基奇再次获得 MVP；人物成功与群体变化分开观察。'],
  2025:['回升延续，\n并非重演旧年代。','C 群体分钟加权身高达到 210.38 厘米。较矮的球员仍然在场，只是两侧的时间份额改变了。'],
  2026:['高度回来了，\n故事没有定论。','与 2021–22 相比，中锋分钟加权身高回升 1.66 厘米。我们看到了变化，尚不能归因于某一位球星。'],
};
export const SCENES=[
  {id:'cover',window:'d1960',positions:all,mode:'people',cover:true},
  ...ERAS.map((era,i)=>({id:'era'+era.year,window:'d'+era.year,positions:all,mode:'people',era,
    heroes:era.heroes,eyebrow:'时代与身材 / THE DECADES',title:era.title,body:era.body,metricPos:era.metricPos,
    reference:i?'d'+ERAS[i-1].year:null,next:i<6?'走进 '+ERAS[i+1].year+' 年代':'把镜头留给前场'})),
  {id:'frontcourt',window:'d2020',positions:front,mode:'people',shade:'both',eyebrow:'拉近看 / THE FRONTCOURT',
    title:'前场的变化，\n从哪里看见？',body:'先保留 2020s 的 PF 与 C，放大同一把身高尺。接下来，将 2000s 的人群放到旁边。',metric:'205.74',unit:'cm',caption:'6 英尺 9 英寸 · 本段比较分界',next:'把两个年代放在一起'},
  {id:'compare',window:'d2020',comparison:'d2000',positions:front,mode:'people',shade:'both',eyebrow:'两个年代 / A DIRECT COMPARISON',
    title:'较矮的前场，\n占比更高了。',body:'每个位置，上方是 2000s，下方是 2020s。较矮球员在 PF 与 C 中的占比都增加。\n但进入名单，是否也意味着得到更多时间？',metric:'+9.3',unit:'个百分点',caption:'较矮中锋人数占比 · 19.2% → 28.5%',note:'2000s 覆盖十季，2020s 覆盖六季。比较各自占比，不以点的总数判断增长。',next:'展开 2014–15 赛季'},
  {id:'anchor',window:'s2015',positions:front,mode:'people',person:'greendr01',heroes:[['greendr01','PF']],eyebrow:'从年代到赛季 / 2015',
    title:'从格林，\n看见角色的边界。',body:'现在展开到 2014–15 常规赛，每个人在这一季计一次。格林在本数据中列为 PF；他也曾在总决赛担任中锋。',
    memory:'2015 总决赛第六场，官方比赛记录将格林列为 C。',source:'https://statsdmz.nba.com/pdfs/20150616/20150616_GSWCLE_book.pdf',
    metric:'198.1',unit:'cm',caption:'格林的统一源档案身高',note:'位置标签与比赛角色不同。这里不将格林的整季分钟改记为中锋分钟。',next:'同一批人，换成时间视角'},
  {id:'weight',window:'s2015',positions:front,mode:'minutes',person:'greendr01',heroes:[['greendr01','PF']],shade:true,eyebrow:'从人数到时间 / SAME PEOPLE',
    title:'人没有换，\n场上的分量不同。',body:'身高与单元中心不动，面积变为该季出场分钟份额。较矮的 C 标签球员，拿到群体 13.1% 的时间。',
    metric:'13.1',unit:'%',caption:'≤205.74 cm · C 群体的分钟份额',note:'使用球员全部出场分钟，不表示他实际打某个位置的分钟。',next:'看看下一季'},
  ...Object.entries(annualCopy).map(([year,[title,body]])=>({id:'season'+year,window:'s'+year,positions:front,mode:'minutes',shade:true,
    person:[2024,2026].includes(+year)?'jokicni01':null,heroes:[2024,2026].includes(+year)?[['jokicni01','C']]:[],
    reference:+year>=2023?'s2022':'s2015',eyebrow:+year<=2022?'逐季看时间 / THE SHARE OF TIME':'转折之后 / A CHANGE OF DIRECTION',
    title,body,annualMetric:+year>=2023?'height':'share',next:+year<2026?'走到下一季':'再看明星的那一层',
    note:+year===2026?'回升原因需要另外的证据；不能据此认定其他球队为对抗约基奇而改变选材。':null})),
  {id:'stars',window:'s2026',positions:all,mode:'minutes',honors:true,eyebrow:'聚光灯下 / THE STARS',
    title:'明星的身材，\n也有不同答案。',body:'这一季，全明星控卫平均比同位置球员高 3.7 厘米，分卫却更矮。明星的轮廓，并不等于整个位置的轮廓。',
    metric:'+3.7',unit:'cm',caption:'8 位全明星控卫与全部控卫的等权均值差',person:'gilgesh01',next:'现在，换你来观察'},
  {id:'exploration',window:'s2026',positions:all,mode:'minutes',explore:true,eyebrow:'轮到你 / EXPLORE',
    title:'沿着这把尺，\n找到你的答案。',body:'名单、时间、明星，给出不同的观察角度。换一个年代或赛季，看看你记忆中的 NBA。',
    metric:'66',unit:'季',caption:'1960–61 至 2025–26',next:'回到开头'},
];
export function copyFor(scene,window){
  if(scene.explore)return {...scene,eyebrow:'轮到你 / EXPLORE',title:'沿着这把尺，\n找到你的答案。',
    body:'名单、时间、明星，给出不同的观察角度。选择时间与观察方式，也可以点开某个球员。',
    metric:String(window.stats.ALL.n),unit:'位球员',caption:window.label+' · 联盟人数已去重',next:'回到开头'};
  if(scene.era){const pos=scene.metricPos;return {...scene,metric:window.stats[pos].mean.toFixed(1),unit:'cm',caption:(pos==='ALL'?'联盟':NAMES[pos])+'平均身高 · 每人等权'};}
  if(scene.annualMetric)return {...scene,metric:scene.annualMetric==='height'?window.stats.C.weighted.toFixed(2):(window.stats.C.smallMinutes*100).toFixed(1),unit:scene.annualMetric==='height'?'cm':'%',caption:scene.annualMetric==='height'?'C 群体的分钟加权身高':'≤205.74 cm · C 群体的分钟份额'};
  return scene;
}
