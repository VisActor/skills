import { connectReading } from '../stage-wiring/connect.mjs';
import { createCopyHandoff } from '../runtime/copy.mjs';

// Optional emphasis matches literal prose; data labels never become HTML.
export function renderDescription(element, text, highlights = []) {
  let remaining = String(text ?? '');
  const nodes = [], terms = highlights.map(item => typeof item === 'string' ? { text: item } : item)
    .filter(item => item?.text);
  const findTerm = term => {
    let index = remaining.indexOf(term);
    while (index >= 0) {
      const before = remaining[index - 1] ?? '', after = remaining[index + term.length] ?? '';
      const partialNumber = (/^\d/.test(term) && /[\d.]/.test(before)) || (/\d$/.test(term) && /[\d.]/.test(after));
      if (!partialNumber) return index;
      index = remaining.indexOf(term, index + 1);
    }
    return -1;
  };
  while (remaining) {
    const match = terms.map(item => ({ ...item, index: findTerm(item.text) }))
      .filter(item => item.index >= 0)
      .sort((a, b) => a.index - b.index || b.text.length - a.text.length)[0];
    if (!match) { nodes.push(remaining); break; }
    nodes.push(remaining.slice(0, match.index));
    const emphasis = element.ownerDocument.createElement('strong');
    emphasis.className = 'copy-emphasis'; emphasis.textContent = match.text;
    if (match.color) emphasis.style.color = match.color;
    nodes.push(emphasis);
    remaining = remaining.slice(match.index + match.text.length);
  }
  element.replaceChildren(...nodes);
}

// Preview appearance only. The scene owns data and geometry; connectReading
// owns native scrolling, navigation, interruption and the measured exit.
export function mountExamplePreview(root, example) {
  const $ = selector => root.querySelector(selector);
  const svg = $('#scene'), notes = $('#notes');
  const listeners = new AbortController();
  const listen = (target, type, handler, options = {}) =>
    target.addEventListener(type, handler, { ...options, signal: listeners.signal });
  let step = 0, timer = null, autoTarget = null;
  const doc = root.ownerDocument, view = doc.defaultView;
  const section = doc.createElement('section'), sticky = doc.createElement('div'), reading = doc.createElement('div');
  section.className = 'example-reading'; sticky.className = 'example-stage'; reading.className = 'example-track';
  reading.setAttribute('aria-hidden', 'true');
  const parts = ['.site-header', '#stage-shell', '.playback'].map($);
  const anchors = parts.map(part => { const anchor = doc.createComment('preview-slot'); part.before(anchor); return anchor; });
  parts[0].before(section); section.append(sticky, reading); sticky.append(...parts);
  for (const [key, value] of Object.entries(example.theme)) root.style.setProperty(`--${key}`, value);
  root.dataset.example = example.id;
  svg.setAttribute('viewBox', example.viewBox ?? '0 0 1000 680');
  const scene = example.mount(svg);
  const storyCopy = $('.copy');
  const originalCopy = [...storyCopy.childNodes], metric = $('.metric'), metricLabel = $('#metric-label');
  const copyTemplate = doc.createElement('div');
  copyTemplate.append(...originalCopy.map(node => node.cloneNode(true)), metric.cloneNode(true), metricLabel.cloneNode(true));
  for (const field of copyTemplate.querySelectorAll('[id]')) {
    field.dataset.field = field.id; field.removeAttribute('id');
  }
  function writeCopy(panel, data) {
    const field = name => panel.querySelector(`[data-field="${name}"]`);
    // Titles are owned example markup. External data labels stay textContent.
    field('headline').innerHTML = data.title;
    renderDescription(field('description'), data.description, data.highlights);
    field('metric-value').textContent = data.value;
    field('metric-unit').textContent = data.unit;
    field('metric-label').textContent = data.metric;
  }
  const panels = example.states.map((state, index) => {
    const panel = copyTemplate.cloneNode(true);
    panel.dataset.copy = String(index);
    writeCopy(panel, scene.read?.(index) ?? state);
    return panel;
  });
  storyCopy.replaceChildren(...panels); metric.remove(); metricLabel.remove();
  const handoff = createCopyHandoff(storyCopy, { offsetY: example.copyOffsetY ?? 0 });
  let pendingCopy;
  $('#eyebrow').textContent = example.eyebrow;
  $('.data-badge').textContent = example.dataBadge ?? '演示数据';
  $('.story-bottom p').textContent = example.dataCaption ?? '数字用于演示关系，不代表原作或真实群体。';

  function copy() {
    const data = scene.read?.(step) ?? example.states[step];
    const index = step;
    pendingCopy = { id: String(index), update: () => writeCopy(panels[index], data) };
    $('#state-count').textContent = `${step + 1} / ${example.states.length}`;
    $('#chapter-name').textContent = data.name;
    $('#next').textContent = step === example.states.length - 1 ? '本段结束' : '继续 →';
    const choices = (scene.choices?.(step) ?? []).map(choice => {
      const button = document.createElement('button');
      button.dataset.choice = choice.id;
      button.setAttribute('aria-pressed', String(choice.selected));
      button.textContent = choice.label;
      return button;
    });
    $('#choices').replaceChildren(...choices);
    svg.setAttribute('aria-label', `${example.title}：${data.name}`);
  }
  const connection = connectReading({ reading, element: svg,
    track: { ids: example.states.map((_, index) => String(index)) }, viewportRatio: 0,
    exit: { sticky, releaseRatio: 0 },
    navigation: { scope: sticky, previous: $('#prev'), next: $('#next'), hashFor: ({ index }) => `state-${index}` },
    onNavigate({ source }) { if (source !== 'replay') stopAuto(); },
    onReading({ index }) {
      if (autoTarget !== null && index !== autoTarget) stopAuto();
      step = index; copy();
    },
    layout: id => scene.pose(Number(id)),
    blend: scene.blend,
    render(pose, frame) {
      scene.render(pose);
      // Keep the previous paragraph readable until its successor has visible evidence.
      if (pendingCopy && (!scene.copyReady || scene.copyReady(step, pose))) {
        handoff.show(pendingCopy.id, { update: pendingCopy.update });
        pendingCopy = null;
      }
      root.dataset.moving = String(frame.moving);
      root.dataset.readingState = String(step);
    },
    duration: example.duration ?? 1250,
  });
  function stopAuto() { clearTimeout(timer); timer = null; autoTarget = null; }
  function go(index, { immediate = false, auto = false } = {}) {
    if (!auto) stopAuto();
    const target = Math.max(0, Math.min(example.states.length - 1, index));
    if (auto) autoTarget = target;
    connection.navigate(target, { immediate, source: auto ? 'replay' : 'navigation' });
  }
  listen($('#choices'), 'click', event => {
    const button = event.target.closest('[data-choice]');
    if (!button) return;
    stopAuto(); scene.choose?.(button.dataset.choice); copy();
    connection.stage.goTo(String(step));
  });
  // Reader input interrupts the optional demo replay; it never cancels scrolling.
  listen(view, 'wheel', stopAuto, { passive: true });
  listen($('#replay'), 'click', () => {
    stopAuto(); go(0, { immediate: true, auto: true });
    const next = () => {
      if (step >= example.states.length - 1) { stopAuto(); return; }
      go(step + 1, { auto: true });
      timer = setTimeout(next, (example.duration ?? 1250) + 1800);
    };
    timer = setTimeout(next, 1700);
  });
  listen($('#about'), 'click', () => { stopAuto(); notes.showModal(); });
  listen($('.close-dialog'), 'click', () => notes.close());
  listen(notes, 'click', event => {
    if (event.target !== notes) return;
    const box = notes.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) notes.close();
  });
  doc.fonts?.ready.then(() => connection.refresh());
  return { go, sample: connection.stage.sample, dispose() {
    stopAuto(); listeners.abort(); connection.dispose(); handoff.dispose(); scene.dispose?.();
    storyCopy.replaceChildren(...originalCopy); storyCopy.after(metric, metricLabel);
    parts.forEach((part, index) => anchors[index].replaceWith(part)); section.remove();
  } };
}
