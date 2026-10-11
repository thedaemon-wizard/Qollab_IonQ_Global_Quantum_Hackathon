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

/**
 * Enable or disable a control. A control that has keyboard focus when it is disabled would
 * drop focus to <body>, so focus moves to `fallback` first (a status line with tabindex="-1").
 */
export function setDisabled(el, disabled, fallback) {
  if (disabled && fallback && document.activeElement === el) fallback.focus();
  el.disabled = disabled;
}

const scrollUpdates = new WeakMap();

/**
 * Make a box that may scroll sideways reachable by keyboard, but only while it actually
 * overflows (Safari does not focus scrollable boxes by itself). `label` (a string, or a function
 * for a box whose content changes) names the region. An optional `hint` element is shown only
 * while the box overflows.
 */
export function scrollableWhenNeeded(el, label, hint = null) {
  const update = () => {
    const over = el.scrollWidth > el.clientWidth + 1;
    if (over) {
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'region');
      el.setAttribute('aria-label', typeof label === 'function' ? label() : label);
    } else {
      el.removeAttribute('tabindex');
      el.removeAttribute('role');
      el.removeAttribute('aria-label');
    }
    if (hint) hint.hidden = !over;
  };
  scrollUpdates.set(el, update);
  if (typeof ResizeObserver === 'function') new ResizeObserver(update).observe(el);
  requestAnimationFrame(update);
  return el;
}

/** Re-check a box from scrollableWhenNeeded after its content changed (its own size may not). */
export function refreshScrollable(el) {
  const update = scrollUpdates.get(el);
  if (update) requestAnimationFrame(update);
}

/**
 * The visible note under a drawing that scrolls sideways (shown on narrow screens only, see
 * .scroll-hint in main.css). The region itself carries the name for screen readers.
 */
export function scrollHint() {
  return h('p', { class: 'scroll-hint', hidden: true }, h('span', { 'aria-hidden': 'true' }, '\u2194'), ' Scroll sideways to see the whole figure');
}

/**
 * Keep the labels of a drawing at about 10 px or more on screen: the SVG may not get narrower
 * than `minWidth` px (its viewBox width x 10 / its smallest font size); below that it scrolls
 * sideways in its own named, keyboard-reachable box, with a short visible hint. Returns
 * [box, hint]; the caller puts both into its <figure>, outside any caption.
 */
export function readableScroll(svg, minWidth, label, className = 'fig-scroll') {
  svg.style.minWidth = `${Math.ceil(minWidth)}px`;
  const hint = scrollHint();
  const box = scrollableWhenNeeded(h('div', { class: className }, svg), label, hint);
  return [box, hint];
}

/**
 * Fit SVG labels into the room they have, in whatever font the viewer's browser uses. A <text>
 * with data-fit="<room in user units>" is shrunk until it fits, down to 10 px, and condensed
 * with textLength if it is still too long. Labels that fit keep their size; labels with the same
 * data-fit-group (a column of boxes) all take the smallest scale any of them needs.
 */
export function fitSvgText(svg) {
  const scale = new Map();
  const groupScale = new Map();
  for (const t of svg.querySelectorAll('text[data-fit]')) {
    if (!t.dataset.fitPx) t.dataset.fitPx = String(parseFloat(getComputedStyle(t).fontSize));
    t.style.fontSize = `${t.dataset.fitPx}px`;
    t.removeAttribute('textLength');
    t.removeAttribute('lengthAdjust');
    const len = t.getComputedTextLength();
    const room = Number(t.dataset.fit);
    const k = len > room ? room / len : 1; // len is 0 without layout (a hidden view): keep it
    scale.set(t, k);
    const g = t.dataset.fitGroup;
    if (g) groupScale.set(g, Math.min(groupScale.get(g) ?? 1, k));
  }
  for (const [t, own] of scale) {
    const k = t.dataset.fitGroup ? groupScale.get(t.dataset.fitGroup) : own;
    if (k >= 1) continue;
    const base = Number(t.dataset.fitPx);
    t.style.fontSize = `${Math.max(10, Math.floor(base * k * 10) / 10)}px`;
    const room = Number(t.dataset.fit);
    if (t.getComputedTextLength() > room) {
      t.setAttribute('textLength', String(room));
      t.setAttribute('lengthAdjust', 'spacingAndGlyphs');
    }
  }
}

let fitObserver = null;
/**
 * Run fitSvgText whenever the figure is laid out at a new size: when it is first shown (a view
 * that is hidden has no layout to measure) and when the frame is resized.
 */
export function fitWhenShown(svg) {
  if (typeof ResizeObserver !== 'function') return svg;
  if (!fitObserver) {
    fitObserver = new ResizeObserver((entries) => {
      for (const e of entries) {
        if (e.target.isConnected) fitSvgText(e.target);
        else fitObserver.unobserve(e.target);
      }
    });
  }
  fitObserver.observe(svg);
  return svg;
}
