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

  // Bottom edge of the sticky header (and, on a phone, of the section strip under it): content
  // above it is hidden, so it is the top of the frame.
  function headerBottom() {
    const header = document.getElementById('bk-header');
    let bottom = header ? header.getBoundingClientRect().bottom : 0;
    const nav = document.getElementById('bk-nav');
    if (nav && window.matchMedia('(max-width: 600px)').matches) bottom = Math.max(bottom, nav.getBoundingClientRect().bottom);
    return Math.max(0, bottom);
  }

  // Scroll the target so that its top (or, if the page cannot scroll that far, its bottom)
  // leaves `room` pixels free at that edge of the frame. The page's scroll-padding already
  // keeps the top edge below the sticky header.
  function scrollClear(target, edge, room) {
    const key = edge === 'top' ? 'scrollMarginTop' : 'scrollMarginBottom';
    target.style[key] = `${room}px`;
    target.scrollIntoView({ block: edge === 'top' ? 'start' : 'end', behavior: 'auto' });
    target.style[key] = '';
    return target.getBoundingClientRect();
  }

  // Put the box next to its target without covering it: below, above, left or right,
  // whichever has room, and never with the target's top under the sticky header. If no side has
  // room, the box goes under the header and the target starts just below the box; a target too
  // tall for that (a short frame on Qollab, a phone) starts just under the header and the box
  // docks at the bottom, on the side where it covers less of the target.
  function place(target) {
    Object.assign(box.style, { left: '', top: '', right: '16px', bottom: '16px' });
    if (!target) return;
    const w = box.offsetWidth;
    const hgt = box.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const m = 12;
    const top = headerBottom();
    const clampX = (x) => Math.min(Math.max(m, x), vw - w - m);
    const clampY = (y) => Math.min(Math.max(top + m, y), vh - hgt - m);
    let r = target.getBoundingClientRect();
    // after a resize the target may have moved out of view, or its top may sit under the header
    if (r.bottom <= top || r.top >= vh) {
      target.scrollIntoView({ block: 'nearest', behavior: 'auto' });
      r = target.getBoundingClientRect();
    }
    if (r.top < top) r = scrollClear(target, 'top', 0);
    let pos = null;
    if (vh - r.bottom >= hgt + 2 * m) pos = { left: clampX(r.left), top: r.bottom + m };
    else if (r.top >= hgt + 2 * m) pos = { left: clampX(r.left), top: r.top - hgt - m };
    else if (r.left >= w + 2 * m) pos = { left: r.left - w - m, top: clampY(r.top) };
    else if (vw - r.right >= w + 2 * m) pos = { left: r.right + m, top: clampY(r.top) };
    else if (top + hgt + 2 * m + r.height <= vh) {
      r = scrollClear(target, 'top', hgt + 2 * m);
      if (r.top >= top + hgt + 2 * m - 1) pos = { left: clampX(r.left), top: top + m };
      else {
        r = scrollClear(target, 'bottom', hgt + 2 * m);
        pos = { left: clampX(r.left), top: clampY(r.bottom + m) };
      }
    }
    if (!pos) {
      r = scrollClear(target, 'top', 0);
      const covered = (x) => Math.max(0, Math.min(x + w, r.right) - Math.max(x, r.left));
      const left = covered(m) <= covered(vw - w - m) ? m : vw - w - m;
      pos = { left: Math.max(m, left), top: Math.max(top + m, vh - hgt - m) };
    }
    Object.assign(box.style, { right: '', bottom: '', left: `${pos.left}px`, top: `${pos.top}px` });
  }

  async function show(i) {
    if (busy) return;
    busy = true;
    index = i;
    const step = STEPS[i];
    unhighlight();
    progress.textContent = `Step ${i + 1} of ${STEPS.length}`;
    title.textContent = step.title;
    // a body may be a function, so formulas are typeset when the step is shown
    body.replaceChildren(...[].concat(typeof step.body === 'function' ? step.body() : step.body).map((t) => h('p', null, t)));
    back.disabled = i === 0;
    next.replaceChildren(i === STEPS.length - 1 ? 'Finish' : 'Next', icon(i === STEPS.length - 1 ? 'check' : 'arrow-right'));
    box.hidden = false;
    // Focus the title before Next is disabled, so keyboard focus (and the box's key handler)
    // stays in the tour while the step runs.
    title.focus();
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

  // Keep the box on screen when the frame is resized (narrow screens, zoom).
  window.addEventListener('resize', () => {
    if (index >= 0 && !busy) place(highlighted);
  });

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
