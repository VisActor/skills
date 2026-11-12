import { createPlayer } from '../runtime/motion.mjs';

// Independent example player, not a story layout contract. The scene owns its
// data, reading states, pose/blend/render and optional object choices.
// A finished work can connect those functions to its own scrolling stage.
export function mountExamplePreview(root, example) {
  const $ = selector => root.querySelector(selector);
  const svg = $('#scene'), notes = $('#notes');
  const listeners = new AbortController();
  const listen = (target, type, handler, options = {}) =>
    target.addEventListener(type, handler, { ...options, signal: listeners.signal });
  let step = 0, timer = null, wheelSum = 0, lastWheel = -Infinity;
  for (const [key, value] of Object.entries(example.theme)) root.style.setProperty(`--${key}`, value);
  root.dataset.example = example.id;
  svg.setAttribute('viewBox', example.viewBox ?? '0 0 1000 680');
  const scene = example.mount(svg);
  $('.data-badge').textContent = example.dataBadge ?? '演示数据';
  $('.story-bottom p').textContent = example.dataCaption ?? '数字用于演示关系，不代表原作或真实群体。';

  function copy() {
    const data = scene.read?.(step) ?? example.states[step];
    $('#eyebrow').textContent = example.eyebrow;
    // Titles are owned example markup. External data labels should use textContent.
    $('#headline').innerHTML = data.title;
    $('#description').textContent = data.description;
    $('#metric-value').textContent = data.value;
    $('#metric-unit').textContent = data.unit;
    $('#metric-label').textContent = data.metric;
    $('#state-count').textContent = `${step + 1} / ${example.states.length}`;
    $('#chapter-name').textContent = data.name;
    $('#prev').disabled = step === 0;
    $('#next').disabled = step === example.states.length - 1;
    $('#next').textContent = $('#next').disabled ? '本段结束' : '继续 →';
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
  const player = createPlayer(scene.pose(0), {
    blend: scene.blend,
    render(pose, frame) {
      scene.render(pose);
      root.dataset.moving = String(frame.moving);
      root.dataset.readingState = String(step);
    },
    duration: example.duration ?? 1250,
  });
  function stopAuto() { clearTimeout(timer); timer = null; }
  function go(index, { immediate = false, auto = false } = {}) {
    if (!auto) stopAuto();
    step = Math.max(0, Math.min(example.states.length - 1, index));
    copy();
    history.replaceState(null, '', `#state-${step}`);
    player.goTo(scene.pose(step), { immediate, duration: example.duration ?? 1250 });
  }
  listen($('#prev'), 'click', () => go(step - 1));
  listen($('#next'), 'click', () => go(step + 1));
  listen($('#choices'), 'click', event => {
    const button = event.target.closest('[data-choice]');
    if (!button) return;
    scene.choose?.(button.dataset.choice); go(step);
  });
  listen(window, 'hashchange', () => go(Number(location.hash.match(/^#state-(\d+)$/)?.[1]) || 0));
  listen(document, 'keydown', event => {
    if (notes.open || event.target.matches('input,select,textarea')) return;
    if (event.key === ' ' && event.target.closest('button,a,summary')) return;
    if (['ArrowRight', 'ArrowDown', ' '].includes(event.key)) { event.preventDefault(); go(step + 1); }
    else if (['ArrowLeft', 'ArrowUp'].includes(event.key)) { event.preventDefault(); go(step - 1); }
  });
  listen(window, 'wheel', event => {
    if (notes.open || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    event.preventDefault();
    const now = performance.now(); if (now - lastWheel < 1000) return;
    wheelSum += event.deltaY;
    if (Math.abs(wheelSum) > 70) {
      const direction = Math.sign(wheelSum); wheelSum = 0; lastWheel = now; go(step + direction);
    }
  }, { passive: false });
  listen($('#replay'), 'click', () => {
    stopAuto(); go(0, { immediate: true, auto: true });
    const next = () => {
      if (step >= example.states.length - 1) { timer = null; return; }
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
  go(Number(location.hash.match(/^#state-(\d+)$/)?.[1]) || 0, { immediate: true });
  return { go, sample: () => player.sample(), dispose() { stopAuto(); listeners.abort(); player.dispose(); scene.dispose?.(); } };
}
