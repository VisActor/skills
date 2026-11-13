import { at, clamp01, keyed, lerp } from "../../runtime/geometry.mjs";
import { blendNodes } from "../../runtime/motion.mjs";
import { distributionLayout } from "../../runtime/units.mjs";
import { createSvgLayer, setSvgAttributes, svgElement } from "../../runtime/svg.mjs";
import { connectReading } from "../../stage-wiring/connect.mjs";
import { createCopyHandoff } from "../../runtime/copy.mjs";

// 与主题形象分开配置：记录数来自样本，不能为画得更像而添加“个体”。
export const particleOpening = {
  image: new URL('./images/panda.svg', import.meta.url).href,
  rows: Array.from({ length: 360 }, (_, i) => ({ id: `panda-${String(i).padStart(3, '0')}`,
    value: Math.round(34 * ((i * 137 % 361) / 360) ** 1.55) })),
  domain: [0, 35], threshold: 10, unit: '岁', color: [37, 73, 61],
};

export function createParticleModel(config = particleOpening) {
  keyed(config.rows);
  if (!config.rows.length || config.domain?.length !== 2 || !config.domain.every(Number.isFinite) ||
      config.domain[0] >= config.domain[1] || !Number.isFinite(config.threshold) ||
      config.threshold <= config.domain[0] || config.threshold >= config.domain[1] ||
      config.rows.some(row => !Number.isFinite(row.value) || row.value < config.domain[0] || row.value > config.domain[1]) ||
      config.color?.length !== 3 || config.color.some(v => !Number.isFinite(v) || v < 0 || v > 255))
    throw new Error('Particle opening needs records inside one finite domain, an interior threshold and an RGB color');
  const rows = config.rows.map(row => ({ ...row, group: 'sample' }));
  const below = rows.filter(row => row.value < config.threshold).length;
  return { ...config, rows, below, share: below / rows.length };
}

// 只抽样可见像素，保留主题图的颜色。采样槽位多于记录不意味着增加数据点。
export async function sampleFigure(url, { size = 480, step = 16 } = {}) {
  if (!Number.isInteger(size) || !Number.isInteger(step) || size < 2 || step < 1 || step >= size)
    throw new Error('Figure sampling requires a positive raster and sampling step');
  const image = new Image(); image.src = url;
  try { await image.decode(); } catch (cause) { throw new Error('Cannot decode the local figure: ' + url, { cause }); }
  const canvas = document.createElement('canvas'), ratio = size / Math.max(image.naturalWidth, image.naturalHeight);
  canvas.width = Math.max(2, Math.round(image.naturalWidth * ratio));
  canvas.height = Math.max(2, Math.round(image.naturalHeight * ratio));
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Figure sampling needs Canvas 2D');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  let data;
  try { data = context.getImageData(0, 0, canvas.width, canvas.height).data; }
  catch (cause) { throw new Error('Figure pixels must be readable; use a local prepared image', { cause }); }
  const slots = [];
  for (let y = step / 2 | 0; y < canvas.height; y += step) for (let x = step / 2 | 0; x < canvas.width; x += step) {
    const i = (y * canvas.width + x) * 4;
    if (data[i + 3] >= 128) slots.push({ x: x / (canvas.width - 1), y: y / (canvas.height - 1), color: [...data.slice(i, i + 3)] });
  }
  if (!slots.length) throw new Error('Figure sampling produced no visible positions');
  return slots;
}

export function particlePose(id, model, slots, { width = 760, height = 620 } = {}) {
  if (!['figure', 'distribution'].includes(id)) throw new Error('Unknown particle opening state: ' + id);
  if (width < 500 || height < 400) throw new Error('Particle opening needs a plot of at least 500 × 400 px');
  if (slots.length < model.rows.length || new Set(slots.map(p => `${p.x}/${p.y}`)).size !== slots.length ||
      slots.some(p => ![p.x, p.y].every(v => Number.isFinite(v) && v >= 0 && v <= 1) ||
        p.color?.length !== 3 || p.color.some(v => !Number.isFinite(v) || v < 0 || v > 255)))
    throw new Error('Figure needs enough distinct normalized positions and RGB colors; simplify the shape or separate decoration');
  const { nodes: distribution, scale } = distributionLayout(model.rows, ['sample'], {
    width, height: height - 30, domain: model.domain, countArea: Math.PI * 3.8 ** 2,
  });
  const side = Math.min(width * .94, height * .92), left = (width - side) / 2, top = (height - side) / 2 - 12;
  const assignment = model.rows.map((row, phase) => ({ row, phase }))
    .sort((a, b) => (a.phase * .61803398875 % 1) - (b.phase * .61803398875 % 1));
  const opening = new Map();
  assignment.forEach(({ row, phase }, index) => {
    const slot = slots[model.rows.length === 1 ? Math.floor(slots.length / 2)
      : Math.floor(index * (slots.length - 1) / (model.rows.length - 1))];
    opening.set(row.id, { id: row.id, row, phase, x: left + slot.x * side, y: top + slot.y * side,
      area: Math.PI * 5.8 ** 2, opacity: 1, red: slot.color[0], green: slot.color[1], blue: slot.color[2] });
    Object.assign(distribution.get(row.id), { phase, red: model.color[0], green: model.color[1], blue: model.color[2] });
  });
  return { id, nodes: id === 'figure' ? opening : distribution,
    data: Number(id === 'distribution'), scale, width, height, baseline: height - 85 };
}

export function blendParticles(from, to, t) {
  if (t <= 0) return from;
  if (t >= 1) return to;
  const nodes = blendNodes(from.nodes, to.nodes, t, ['x', 'y', 'area', 'opacity', 'red', 'green', 'blue']);
  for (const [id, node] of nodes) {
    const a = from.nodes.get(id), b = to.nodes.get(id), phase = a.phase;
    const p = clamp01((t - phase % 9 * .01) / (1 - phase % 9 * .01));
    const s = 1 - p, bend = Math.min(95, Math.hypot(b.x - a.x, b.y - a.y) * .25);
    // 有限弧线把同一记录送到新排列；它不表示动物移动或年龄变化。
    node.x = s ** 3 * a.x + 3 * s ** 2 * p * (a.x + Math.sin(phase * 1.7) * bend)
      + 3 * s * p ** 2 * (b.x + Math.cos(phase * .7) * bend) + p ** 3 * b.x;
    node.y = s ** 3 * a.y + 3 * s ** 2 * p * (a.y - bend) + 3 * s * p ** 2 * (b.y - bend) + p ** 3 * b.y;
  }
  return { ...to, nodes, data: lerp(from.data, to.data, t) };
}

export async function mountParticleOpening(root, { config = particleOpening, duration = 1800 } = {}) {
  const model = createParticleModel(config), slots = await sampleFigure(config.image), $ = selector => root.querySelector(selector);
  const svg = $('svg'), guide = svgElement('g'), labels = svgElement('g'), readout = svgElement('g', { class: 'interval-readout' });
  const shade = svgElement('rect', { fill: 'var(--ink)', opacity: .05 });
  guide.append(shade, labels, readout); svg.append(guide);
  root.querySelectorAll('[data-count]').forEach(el => el.textContent = model.rows.length);
  root.querySelectorAll('[data-below]').forEach(el => el.textContent = model.below);
  root.querySelectorAll('[data-threshold]').forEach(el => el.textContent = model.threshold);
  root.querySelectorAll('[data-share]').forEach(el => el.textContent = new Intl.NumberFormat('zh-CN', {
    style: 'percent', maximumFractionDigits: 1,
  }).format(model.share));
  const dots = createSvgLayer(svg, {
    create() { const g = svgElement('g'); g.append(svgElement('circle'), svgElement('title')); return g; },
    update(g, node) {
      setSvgAttributes(g, { transform: `translate(${node.x} ${node.y})`, 'data-record': node.id, opacity: node.opacity });
      setSvgAttributes(g.firstElementChild, { r: Math.sqrt(node.area / Math.PI), fill: `rgb(${Math.round(node.red)} ${Math.round(node.green)} ${Math.round(node.blue)})` });
      g.lastElementChild.textContent = `合成记录 ${node.id} · ${node.row.value} ${model.unit}`;
    },
  });
  let sizeKey;
  const copy = createCopyHandoff($('.copy')), next = $('[data-next]'), finish = $('[data-finish]');
  const connection = connectReading({ element: svg, reading: $('.scroll-track'), track: { ids: ['figure', 'distribution'] },
    exit: { sticky: $('.particle-stage'), releaseRatio: 0 }, viewportRatio: 0, duration,
    navigation: { scope: $('.particle-stage'), previous: $('[data-prev]'), next },
    layout: (id, size) => particlePose(id, model, slots, size), blend: blendParticles,
    render(pose, frame) {
      const key = `${pose.width}/${pose.height}`, x0 = at(pose.scale, model.domain[0]), x1 = at(pose.scale, model.domain[1]);
      if (key !== sizeKey) {
        sizeKey = key; setSvgAttributes(svg, { viewBox: `0 0 ${pose.width} ${pose.height}` }); labels.replaceChildren();
        labels.append(svgElement('path', { d: `M${x0} ${pose.baseline + 14}H${x1}`, stroke: 'var(--rule)' }));
        const interval = (model.domain[1] - model.domain[0]) / 7;
        for (let index = 0; index <= 7; index++) {
          const value = model.domain[0] + index * interval, x = at(pose.scale, value), y = pose.baseline + 14;
          labels.append(svgElement('path', { d: `M${x} ${y}v7`, stroke: 'var(--rule)' }),
            svgElement('text', { x, y: y + 32, 'text-anchor': 'middle' }, new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 1 }).format(value)));
        }
        labels.append(svgElement('text', { x: x0, y: 35 }, `一点一只熊猫 · ${model.rows.length} 条合成记录`),
          svgElement('text', { x: x1, y: pose.height - 8, 'text-anchor': 'end' }, `年龄 / ${model.unit}`));
        setSvgAttributes(shade, { x: x0 - 7, y: 53, width: at(pose.scale, model.threshold) - x0 + 2, height: pose.baseline - 39 });
        const midpoint = (x0 + at(pose.scale, model.threshold)) / 2;
        readout.replaceChildren(
          svgElement('text', { x: midpoint, y: 81, 'text-anchor': 'middle' }, `< ${model.threshold} ${model.unit}`),
          svgElement('text', { x: midpoint, y: 113, 'text-anchor': 'middle', style: 'font-size:26px;font-weight:600' }, `${model.below} / ${model.rows.length}`),
        );
      }
      setSvgAttributes(guide, { opacity: clamp01((pose.data - .78) / .22) }); dots.render(pose.nodes);
      setSvgAttributes(readout, { opacity: frame.moving ? 0 : pose.data });
      const nextCopy = frame.moving ? 'figure' : pose.id;
      copy.show(nextCopy);
      next.hidden = nextCopy === 'distribution'; finish.hidden = nextCopy !== 'distribution';
      $('[data-reading-guide]').textContent = frame.moving ? '同一批记录，换一种排列'
        : nextCopy === 'figure' ? '黑白两色用来辨认形象' : '横向是年龄 · 纵向堆叠看多少';
      svg.dataset.state = pose.id; svg.dataset.moving = String(frame.moving);
      if (!frame.moving) svg.setAttribute('aria-label', pose.id === 'figure'
        ? '熊猫点阵形象；轮廓位置和黑白颜色不编码年龄'
        : `${model.rows.length}条合成熊猫记录按年龄排列，${model.below}条小于${model.threshold}${model.unit}，不代表真实种群分布`);
    } });
  document.fonts.ready.then(() => connection.refresh());
  return { sample: connection.stage.sample, dispose() { connection.dispose(); copy.dispose(); dots.dispose(); guide.remove(); } };
}
