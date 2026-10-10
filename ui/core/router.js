// In-memory navigation between views. No URL hash: inside Qollab's frame a hash change would
// also add entries to the parent page's history. Each view is built once and then shown or
// hidden, so its state (charts, last run, 3D camera) survives navigation.
import { h } from './dom.js';
import { icon } from './icons.js';

export function createRouter({ nav, main, views, ctx }) {
  const built = new Map();
  const buttons = new Map();
  const listeners = new Set();
  let current = null;

  const list = h('ul');
  for (const view of views) {
    const btn = h(
      'button',
      { class: 'nav-btn', type: 'button', onclick: () => go(view.id, { focus: true }) },
      icon(view.icon),
      h('span', null, view.title),
    );
    buttons.set(view.id, btn);
    list.append(h('li', null, btn));
  }
  nav.append(list);

  function ensure(view) {
    if (!built.has(view.id)) {
      const instance = view.create(ctx);
      instance.element.classList.add('view');
      instance.element.hidden = true;
      main.append(instance.element);
      built.set(view.id, instance);
    }
    return built.get(view.id);
  }

  async function go(id, { focus = false } = {}) {
    const view = views.find((v) => v.id === id);
    if (!view) throw new Error(`unknown view ${id}`);
    if (current && current !== id) {
      const prev = built.get(current);
      prev.element.hidden = true;
      if (prev.onHide) prev.onHide();
      buttons.get(current).removeAttribute('aria-current');
    }
    const instance = ensure(view);
    instance.element.hidden = false;
    buttons.get(id).setAttribute('aria-current', 'page');
    current = id;
    if (focus) {
      const heading = instance.element.querySelector('h2');
      if (heading) heading.focus();
      main.scrollTop = 0;
      window.scrollTo(0, 0);
    }
    for (const fn of listeners) fn(id);
    if (instance.onShow) await instance.onShow();
    return instance;
  }

  return {
    go,
    get current() {
      return current;
    },
    instance: (id) => built.get(id),
    onChange: (fn) => listeners.add(fn),
  };
}

/** Standard view frame: heading (focus target after navigation) + lede + body. */
export function viewFrame(id, title, iconName, lede) {
  const body = h('div', { class: 'stack' });
  const element = h(
    'section',
    { id: `view-${id}`, 'aria-labelledby': `view-${id}-title` },
    h('header', null,
      h('h2', { id: `view-${id}-title`, tabindex: '-1' }, icon(iconName, { size: 24 }), title),
      lede ? h('p', { class: 'lede' }, lede) : null),
    body,
  );
  return { element, body };
}
