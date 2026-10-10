// Number formatting shared by all views. A missing value is shown as an em dash.

export const DASH = '—';

export function num(x, digits = 3) {
  if (x === null || x === undefined || Number.isNaN(x)) return DASH;
  return Number(x).toFixed(digits);
}

export function pct(x, digits = 2) {
  if (x === null || x === undefined || Number.isNaN(x)) return DASH;
  return `${(100 * x).toFixed(digits)}%`;
}

export function interval(lo, hi, digits = 3) {
  return `[${num(lo, digits)}, ${num(hi, digits)}]`;
}

export function pm(x, err, digits = 3) {
  return `${num(x, digits)} ± ${num(err, digits)}`;
}

export function int(x) {
  if (x === null || x === undefined) return DASH;
  return Number(x).toLocaleString('en-US');
}

export function deg(x) {
  return `${Number(x).toFixed(0)}°`;
}
