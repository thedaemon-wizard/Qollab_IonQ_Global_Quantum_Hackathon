// Formulas in view text. A tagged template, tm`… $\sqrt{2}$ …`, returns a DocumentFragment in
// which every $…$ part is native MathML made by Temml 0.14.0 (MIT, Ron Kok). Temml is fetched
// from jsDelivr once, at start-up; the font is Latin Modern Math (main.css). Without Temml the
// formulas are spelled in Unicode, so the text stays complete. ARIA labels, SVG text and live
// messages never go through here: they stay plain text.
const PARTS = ['https://cdn.jsdelivr.net/npm/', 'temml@0.14.0', '/dist/temml.mjs'];
let engine = null;
let loading = null;

/** Resolves to true once formulas can be typeset (false after a failure or `waitMs`). */
export function mathReady(waitMs = 4000) {
  if (!loading) {
    const src = PARTS.join('');
    const timer = new Promise((resolve) => setTimeout(() => resolve(null), waitMs));
    loading = Promise.race([import(src).then((m) => m.default, () => null), timer]).then((t) => {
      engine = t;
      return Boolean(t);
    });
  }
  return loading;
}

// Unicode spelling for the fallback: control words, then scripts and groups.
const GLYPH = new Map(Object.entries({
  Phi: 'Φ', Psi: 'Ψ', alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', varepsilon: 'ε', eta: 'η', theta: 'θ',
  lambda: 'λ', pi: 'π', rho: 'ρ', sigma: 'σ', varphi: 'φ', omega: 'ω', ast: '*', circ: '°', pm: '±', mp: '∓',
  le: '≤', ge: '≥', approx: '≈', neq: '≠', times: '×', cdot: '·', to: '→', mapsto: '↦', in: '∈', subset: '⊂',
  langle: '⟨', rangle: '⟩', lvert: '|', rvert: '|', mid: '|', sum: 'Σ', ln: 'ln', log: 'log', max: 'max',
  min: 'min', arcsin: 'arcsin', sin: 'sin', cos: 'cos', dots: '…', quad: '  ', infty: '∞',
}));

function spell(texSrc) {
  let out = texSrc
    .replace(/\\(?:text|mathrm|operatorname)\{([^{}]*)\}/g, '$1')
    .replace(/\\t?frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)')
    .replace(/\\sqrt\{([^{}]*)\}/g, (_, a) => (a.length === 1 ? `√${a}` : `√(${a})`));
  out = out.replace(/\\([A-Za-z]+)\s?|\\([,;!%{}])/g, (_, word, sym) =>
    word ? (GLYPH.get(word) ?? word) : ({ ',': ' ', ';': ' ', '!': '' }[sym] ?? sym));
  return out.replace(/\^\{([^{}]*)\}/g, '^$1').replace(/_\{([^{}]*)\}/g, '_$1').replace(/[{}]/g, '').replace(/-/g, '−');
}

/** One formula: a <math> element, or its Unicode spelling if Temml is unavailable. */
export function formula(texSrc, display = false) {
  if (!engine) return document.createTextNode(spell(texSrc));
  const holder = document.createElement('span');
  engine.render(texSrc, holder, { displayMode: display, annotate: true, throwOnError: false });
  return holder.firstElementChild ?? document.createTextNode(spell(texSrc));
}

/** Tagged template: text with $…$ formulas (raw strings, so TeX backslashes survive). */
export function tm(strings, ...values) {
  let source = strings.raw[0];
  values.forEach((v, i) => { source += String(v) + strings.raw[i + 1]; });
  const frag = document.createDocumentFragment();
  source.split('$').forEach((piece, i) => {
    if (piece) frag.append(i % 2 === 1 ? formula(piece) : piece);
  });
  return frag;
}
