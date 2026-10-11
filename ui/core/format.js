// Number formatting shared by all views. A missing value is shown as an em dash.

export const DASH = '—';

export function num(x, digits = 3) {
  if (x === null || x === undefined || Number.isNaN(x)) return DASH;
  // A value that is a tie in decimal (0.9625) can land a hair either side of it in binary, so the
  // same number computed two ways would round two ways; nudge ties up before rounding.
  const k = 10 ** digits;
  const v = Number(x);
  return (Math.round(v * k + 1e-7 * Math.sign(v)) / k).toFixed(digits);
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
