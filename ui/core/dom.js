// Small DOM helpers. No framework: every view builds plain elements with these.

const SVG_NS = 'http://www.w3.org/2000/svg';
const BOOL_ATTRS = new Set(['hidden', 'disabled', 'checked', 'selected', 'open', 'inert', 'readonly']);

function applyAttrs(el, attrs, isSvg) {
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') el.setAttribute('class', value);
    else if (key === 'style' && typeof value === 'object') Object.assign(el.style, value);
    else if (key === 'dataset') Object.assign(el.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2), value);
    else if (key === 'text') el.textContent = value;
    else if (!isSvg && BOOL_ATTRS.has(key)) el[key] = Boolean(value);
    else if (!isSvg && (key === 'value' || key === 'checked')) el[key] = value;
    else el.setAttribute(key, value === true ? '' : String(value));
  }
}

function append(el, children) {
  for (const child of children.flat(Infinity)) {
    if (child === undefined || child === null || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

/** h('button', {class: 'btn', onclick}, 'Run') -> HTMLElement */
export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  applyAttrs(el, attrs, false);
  return append(el, children);
}

/** s('circle', {cx, cy, r}) -> SVGElement */
export function s(tag, attrs, ...children) {
  const el = document.createElementNS(SVG_NS, tag);
  applyAttrs(el, attrs, true);
  return append(el, children);
}

export function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
  return el;
}

let counter = 0;
export function uid(prefix = 'bk') {
  counter += 1;
  return `${prefix}-${counter}`;
}

let liveRegion = null;
/** Polite screen-reader announcement (one shared live region). */
export function announce(message) {
  if (!liveRegion) {
    liveRegion = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status' });
    document.body.append(liveRegion);
  }
  liveRegion.textContent = '';
  requestAnimationFrame(() => {
    liveRegion.textContent = message;
  });
}

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Let the browser paint (for example a "running" state) before a blocking Python call. */
export function nextPaint() {
  return new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
