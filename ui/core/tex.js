// Formulas in view text. A tagged template, tm`… $\sqrt{2}$ …`, returns a DocumentFragment in
// which every $…$ part is native MathML made by Temml 0.14.0 (MIT, Ron Kok). Temml is fetched
// from jsDelivr once, at start-up; the font is Latin Modern Math (main.css). Without Temml the
// formulas are spelled in Unicode, so the text stays complete. ARIA labels, SVG text, announce()
// messages and role=status lines never go through here: they stay plain text. (The Bell Lab's
// prediction box is a polite live region whose term labels are MathML; Temml annotates each one
// with its TeX source.)
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
  min: 'min', arcsin: 'arcsin', sin: 'sin', cos: 'cos', dots: '…', quad: '  ', infty: '∞', bigl: '', bigr: '',
}));
// The space TeX allows after a control word is kept after relations, binary operators and
// operator names (`S \le 2` reads S ≤ 2), and after a symbol only before a digit or another
// symbol (`X\rho X` reads XρX). Opening delimiters always hug what follows.
const TIGHT = new Set(['lvert', 'langle', 'bigl', 'bigr']);
const SPACED = new Set(['le', 'ge', 'approx', 'neq', 'times', 'cdot', 'to', 'mapsto', 'in', 'subset', 'pm', 'mp',
  'mid', 'log', 'ln', 'max', 'min', 'arcsin', 'sin', 'cos', 'quad']);

function spell(texSrc) {
  let out = texSrc
    .replace(/\\(?:text|mathrm|operatorname)\{([^{}]*)\}/g, '$1')
    .replace(/\\t?frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)')
    .replace(/\\sqrt\{([^{}]*)\}/g, (_, a) => (a.length === 1 ? `√${a}` : `√(${a})`))
    .replace(/\^\{?\\circ\}?/g, '°')
    .replace(/([\w)])\\(log|ln)(?![A-Za-z])/g, '$1 \\$2');
  out = out.replace(/\\([A-Za-z]+)( ?)(?=(.?))|\\([,;!%{}])/g, (_, word, space, next, sym) => {
    if (!word) return { ',': ' ', ';': ' ', '!': '' }[sym] ?? sym;
    const keep = space && !TIGHT.has(word) && (SPACED.has(word) || !/[A-Za-z]/.test(next));
    return (GLYPH.get(word) ?? word) + (keep ? ' ' : '');
  });
  return out.replace(/\^\{([^{}]*)\}/g, '^$1').replace(/_\{([^{}]*)\}/g, '_$1').replace(/[{}]/g, '').replace(/-/g, '−');
}

/** One formula: a <math> element, or its Unicode spelling if Temml is unavailable. */
export function formula(texSrc, display = false) {
  if (engine) {
    try {
      const holder = document.createElement('span');
      engine.render(texSrc, holder, { displayMode: display, annotate: true, throwOnError: false });
      if (holder.firstElementChild) return holder.firstElementChild;
    } catch {
      // A render that throws (not a TeX error, which Temml shows inline) falls back to Unicode.
    }
  }
  return document.createTextNode(spell(texSrc));
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
