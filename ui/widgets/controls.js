// Form controls with visible labels and live value read-outs.
import { h, uid } from '../core/dom.js';
import { icon } from '../core/icons.js';

export function slider({ label, min, max, step, value, format = (v) => String(v), onInput, hint }) {
  const id = uid('sl');
  const out = h('output', { for: id }, format(value));
  const input = h('input', { id, type: 'range', min, max, step, value, 'aria-describedby': hint ? `${id}-hint` : null });
  input.addEventListener('input', () => {
    out.textContent = format(Number(input.value));
    input.setAttribute('aria-valuetext', format(Number(input.value)));
    if (onInput) onInput(Number(input.value));
  });
  input.setAttribute('aria-valuetext', format(value));
  const element = h('div', { class: 'field' },
    h('label', { for: id }, label),
    h('div', { class: 'row' }, input, out),
    hint ? h('span', { id: `${id}-hint`, class: 'muted small' }, hint) : null);
  return {
    element,
    input,
    get value() {
      return Number(input.value);
    },
    set(v) {
      input.value = v;
      out.textContent = format(Number(v));
      input.setAttribute('aria-valuetext', format(Number(v)));
    },
    disable(on) {
      input.disabled = on;
    },
  };
}

export function select({ label, options, value, onChange }) {
  const id = uid('sel');
  const el = h('select', { id }, options.map((o) => h('option', { value: o.value, selected: o.value === value }, o.label)));
  el.addEventListener('change', () => onChange && onChange(el.value));
  return {
    element: h('div', { class: 'field' }, h('label', { for: id }, label), el),
    input: el,
    get value() {
      return el.value;
    },
    set(v) {
      el.value = v;
    },
  };
}

export function checkbox({ label, checked = false, onChange, hint }) {
  const id = uid('cb');
  const el = h('input', { id, type: 'checkbox', checked });
  el.addEventListener('change', () => onChange && onChange(el.checked));
  return {
    element: h('div', { class: 'field' }, h('div', { class: 'check' }, el, h('label', { for: id }, label)),
      hint ? h('span', { class: 'muted small' }, hint) : null),
    input: el,
    get checked() {
      return el.checked;
    },
    set(v) {
      el.checked = v;
    },
  };
}

export function button(label, iconName, onClick, { primary = false, title } = {}) {
  return h('button', { class: `btn${primary ? ' primary' : ''}`, type: 'button', onclick: onClick, title },
    iconName ? icon(iconName) : null, label);
}

export function note(kind, text, iconName = kind === 'bad' || kind === 'warn' ? 'alert-triangle' : 'info-circle') {
  return h('div', { class: `note ${kind}` }, icon(iconName), h('div', null, text));
}

/** Show an error from the Python side in a container (role=alert). */
export function errorNote(err) {
  const kind = err && err.kind ? `${err.kind}: ` : '';
  const el = note('bad', `${kind}${err && err.message ? err.message : err}`);
  el.setAttribute('role', 'alert');
  return el;
}
