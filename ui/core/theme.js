// Colour theme: follows the operating system by default (dark unless it asks for light);
// the toggle cycles auto -> dark -> light. Kept in memory only (the frame has no storage).
import { h } from './dom.js';
import { icon } from './icons.js';

const MODES = ['auto', 'dark', 'light'];
const LABEL = { auto: 'Theme: follow system', dark: 'Theme: dark', light: 'Theme: light' };
const ICON = { auto: 'device-desktop', dark: 'moon', light: 'sun' };

export function themeToggle(root) {
  let mode = 'auto';
  const btn = h('button', { class: 'btn btn-icon', type: 'button' });
  const listeners = new Set();
  const apply = () => {
    root.dataset.theme = mode;
    btn.replaceChildren(icon(ICON[mode]));
    btn.setAttribute('aria-label', LABEL[mode]);
    btn.title = LABEL[mode];
    for (const fn of listeners) fn(mode);
  };
  btn.addEventListener('click', () => {
    mode = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
    apply();
  });
  apply();
  return { element: btn, onChange: (fn) => listeners.add(fn) };
}

/** Resolved value of a CSS custom property on the app root (for canvas/three.js colours). */
export function cssVar(root, name) {
  return getComputedStyle(root).getPropertyValue(name).trim();
}
