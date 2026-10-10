// Guided tour: a non-modal dialog that walks through the lab. Each step can switch view and
// call the same functions as the buttons (so the circuits really run). Keyboard: Enter or
// Right = next, Left = back, Escape = close; focus returns to the button that opened it.
import { announce, h } from './dom.js';
import { icon } from './icons.js';
import { STEPS } from '../views/tour_steps.js';

export function createTour(ctx) {
  let index = -1;
  let opener = null;
  let highlighted = null;
  let busy = false;
  const title = h('h3', { id: 'bk-tour-title', tabindex: '-1' });
  const body = h('div', { id: 'bk-tour-body' });
  const progress = h('p', { class: 'muted small' });
  const back = h('button', { class: 'btn', type: 'button' }, icon('arrow-left'), 'Back');
  const next = h('button', { class: 'btn primary', type: 'button' }, 'Next', icon('arrow-right'));
  const close = h('button', { class: 'btn btn-icon', type: 'button', 'aria-label': 'Close the tour' }, icon('x'));
  const box = h(
    'div',
    { class: 'tour', role: 'dialog', 'aria-modal': 'false', 'aria-labelledby': 'bk-tour-title', 'aria-describedby': 'bk-tour-body', hidden: true },
    h('div', { class: 'toolbar' }, progress, close),
    title,
    body,
    h('div', { class: 'toolbar' }, back, next),
  );
  ctx.root.append(box);

  function unhighlight() {
    if (highlighted) highlighted.classList.remove('tour-highlight');
    highlighted = null;
  }

  function place(target) {
    box.style.left = '';
    box.style.top = '';
    box.style.right = '16px';
    box.style.bottom = '16px';
    if (!target) return;
    const r = target.getBoundingClientRect();
    const w = box.offsetWidth;
    const hgt = box.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = Math.min(Math.max(12, r.left), vw - w - 12);
    let top = r.bottom + 12;
    if (top + hgt > vh - 12) top = Math.max(12, r.top - hgt - 12);
    if (top < 12 || top + hgt > vh - 12) return; // keep the corner position
    box.style.right = '';
    box.style.bottom = '';
    box.style.left = `${left}px`;
    box.style.top = `${top}px`;
  }

  async function show(i) {
    if (busy) return;
    busy = true;
    index = i;
    const step = STEPS[i];
    unhighlight();
    progress.textContent = `Step ${i + 1} of ${STEPS.length}`;
    title.textContent = step.title;
    body.replaceChildren(...[].concat(step.body).map((t) => h('p', null, t)));
    back.disabled = i === 0;
    next.replaceChildren(i === STEPS.length - 1 ? 'Finish' : 'Next', icon(i === STEPS.length - 1 ? 'check' : 'arrow-right'));
    box.hidden = false;
    next.disabled = true;
    try {
      if (step.view) await ctx.router.go(step.view);
      if (step.action) {
        body.append(h('p', { class: 'muted small', role: 'status' }, 'Running…'));
        const note = await step.action(ctx);
        body.lastChild.remove();
        if (note) body.append(h('p', { class: 'note' }, icon('info-circle'), h('span', null, note)));
      }
      const target = step.target ? ctx.root.querySelector(step.target) : null;
      if (target) {
        target.classList.add('tour-highlight');
        target.scrollIntoView({ block: 'nearest', behavior: 'auto' });
        highlighted = target;
      }
      place(target);
    } catch (err) {
      body.append(h('p', { class: 'note bad', role: 'alert' }, icon('alert-triangle'), h('span', null, String(err.message || err))));
    } finally {
      next.disabled = false;
      busy = false;
    }
    announce(`Tour step ${i + 1} of ${STEPS.length}: ${step.title}`);
    title.focus();
  }

  function stop() {
    unhighlight();
    box.hidden = true;
    index = -1;
    if (opener) opener.focus();
  }

  next.addEventListener('click', () => (index >= STEPS.length - 1 ? stop() : show(index + 1)));
  back.addEventListener('click', () => index > 0 && show(index - 1));
  close.addEventListener('click', stop);
  box.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      stop();
    } else if (e.key === 'ArrowRight' || (e.key === 'Enter' && e.target === title)) {
      e.preventDefault();
      if (!next.disabled) next.click();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (!back.disabled) back.click();
    }
  });

  return {
    start(from) {
      opener = from || null;
      show(0);
    },
    stop,
    get active() {
      return index >= 0;
    },
  };
}
