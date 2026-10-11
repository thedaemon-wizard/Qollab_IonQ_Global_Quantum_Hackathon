// Circuit diagram drawn from the gate list that Python sends (bellkit.app.circuits_json).
// Teaching sections (source, eavesdropper, link noise, Bell measurement, purification, basis,
// measurement) are shaded and labelled; a barrier is implied between sections.
import { fitWhenShown, h, s, scrollableWhenNeeded, scrollHint, uid } from '../core/dom.js';

const SECTION = {
  source: { label: 'pair source', fill: 'var(--sec-source)' },
  eve: { label: 'eavesdropper', fill: 'var(--sec-eve)' },
  channel: { label: 'link noise', fill: 'var(--sec-channel)' },
  bsm: { label: 'Bell measurement', fill: 'var(--sec-bsm)' },
  purify: { label: 'purification', fill: 'var(--sec-purify)' },
  basis: { label: 'basis choice', fill: 'var(--sec-basis)' },
  measure: { label: 'measure', fill: 'var(--sec-measure)' },
  other: { label: '', fill: 'transparent' },
};
const NAMES = { h: 'H', x: 'X', y: 'Y', z: 'Z', sdg: 'S†', s: 'S', ry: 'Ry', rx: 'Rx', rz: 'Rz' };

const deg = (rad) => `${Math.round((rad * 180) / Math.PI * 10) / 10}°`;

export function layoutColumns(unit) {
  const level = new Array(unit.num_qubits).fill(0);
  const cols = [];
  let section = null;
  for (const op of unit.ops) {
    if (op.section !== section) {
      const sync = Math.max(...level);
      level.fill(sync);
      section = op.section;
    }
    const lo = Math.min(...op.qubits);
    const hi = op.name === 'measure' ? unit.num_qubits - 1 : Math.max(...op.qubits);
    let col = 0;
    for (let q = lo; q <= hi; q += 1) col = Math.max(col, level[q]);
    for (let q = lo; q <= hi; q += 1) level[q] = col + 1;
    cols.push(col);
  }
  return { cols, width: Math.max(...level, 1) };
}

export function circuitSvg(unit, labels) {
  const { cols, width } = layoutColumns(unit);
  const CW = 46;
  const RH = 38;
  const left = 78;
  const top = 30;
  const busY = top + unit.num_qubits * RH + 6;
  // One band per run of operations from the same section (sections never share a column, and
  // a chain repeats source and link noise for every link). A run whose label is wider than its
  // columns gets wider columns, so the label stays inside its band.
  const runs = [];
  unit.ops.forEach((op, i) => {
    const last = runs[runs.length - 1];
    if (last && last.sec === op.section) {
      last.min = Math.min(last.min, cols[i]);
      last.max = Math.max(last.max, cols[i]);
    } else runs.push({ sec: op.section, min: cols[i], max: cols[i] });
  });
  const colW = new Array(width).fill(CW);
  for (const r of runs) {
    const need = SECTION[r.sec].label.length * 6.5 + 14; // 10.5px label, generous for wide fonts
    const n = r.max - r.min + 1;
    const have = colW.slice(r.min, r.max + 1).reduce((a, b) => a + b, 0);
    if (need > have) for (let c = r.min; c <= r.max; c += 1) colW[c] += (need - have) / n;
  }
  const colX = [left];
  colW.forEach((w, c) => colX.push(colX[c] + w));
  const W = colX[width] + 24;
  const H = busY + 30;
  const cx = (c) => colX[c] + colW[c] / 2;
  const wy = (q) => top + q * RH + RH / 2;
  const tId = uid('ct');
  const counts = {};
  unit.ops.forEach((op) => { counts[op.section] = (counts[op.section] || 0) + 1; });
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-labelledby': tId },
    s('title', { id: tId }, `Circuit ${unit.name}: ${unit.num_qubits} qubits, ${unit.ops.length} operations; sections ${Object.keys(counts).map((k) => `${SECTION[k].label} (${counts[k]})`).join(', ')}`));

  // section bands
  for (const r of runs) {
    const x0 = colX[r.min] + 2;
    const x1 = colX[r.max + 1] - 2;
    svg.append(s('rect', { x: x0, y: 4, width: x1 - x0, height: busY - 4, rx: 6, style: `fill:${SECTION[r.sec].fill}` }),
      s('text', { x: (x0 + x1) / 2, y: 18, 'text-anchor': 'middle', 'data-fit': x1 - x0 - 10, style: 'font-size:10.5px;fill:var(--muted)' }, SECTION[r.sec].label));
  }
  // wires
  for (let q = 0; q < unit.num_qubits; q += 1) {
    svg.append(s('line', { x1: left - 4, x2: W - 12, y1: wy(q), y2: wy(q), style: 'stroke:var(--muted);stroke-width:1.2' }),
      s('text', { x: left - 8, y: wy(q) + 4, 'text-anchor': 'end', style: 'font-size:11px' }, labels ? labels[q] : `q${q}`));
  }
  svg.append(
    s('line', { x1: left - 4, x2: W - 12, y1: busY, y2: busY, style: 'stroke:var(--muted)' }),
    s('line', { x1: left - 4, x2: W - 12, y1: busY + 3, y2: busY + 3, style: 'stroke:var(--muted)' }),
    s('text', { x: left - 8, y: busY + 6, 'text-anchor': 'end', style: 'font-size:11px' }, `c (${unit.num_clbits})`),
  );
  const box = (x, y, label, sub) => {
    const g = s('g');
    g.append(s('rect', { x: x - 19, y: y - 15, width: 38, height: 30, rx: 4, style: 'fill:var(--surface);stroke:var(--text);stroke-width:1.3' }),
      s('text', { x, y: sub ? y - 1 : y + 4, 'text-anchor': 'middle', style: 'font-size:11.5px;font-weight:600' }, label));
    // the angle under the gate name: 10 px on screen (the diagram is drawn at its natural size)
    if (sub) g.append(s('text', { x, y: y + 11, 'text-anchor': 'middle', 'data-fit': 36, style: 'font-size:10px' }, sub));
    return g;
  };
  const dot = (x, y) => s('circle', { cx: x, cy: y, r: 4.2, style: 'fill:var(--text)' });
  unit.ops.forEach((op, i) => {
    const x = cx(cols[i]);
    const [q0, q1] = op.qubits;
    if (op.name === 'cx') {
      svg.append(s('line', { x1: x, x2: x, y1: wy(q0), y2: wy(q1), style: 'stroke:var(--text);stroke-width:1.4' }), dot(x, wy(q0)),
        s('circle', { cx: x, cy: wy(q1), r: 9, style: 'fill:var(--surface);stroke:var(--text);stroke-width:1.4' }),
        s('path', { d: `M${x - 9},${wy(q1)} H${x + 9} M${x},${wy(q1) - 9} V${wy(q1) + 9}`, style: 'stroke:var(--text);stroke-width:1.4' }));
    } else if (op.name === 'cz') {
      svg.append(s('line', { x1: x, x2: x, y1: wy(q0), y2: wy(q1), style: 'stroke:var(--text);stroke-width:1.4' }), dot(x, wy(q0)), dot(x, wy(q1)));
    } else if (op.name === 'cry') {
      svg.append(s('line', { x1: x, x2: x, y1: wy(q0), y2: wy(q1), style: 'stroke:var(--text);stroke-width:1.4' }), dot(x, wy(q0)),
        box(x, wy(q1), 'Ry', deg(op.params[0])));
    } else if (op.name === 'measure') {
      const y = wy(q0);
      svg.append(s('line', { x1: x - 1.5, x2: x - 1.5, y1: y + 12, y2: busY, style: 'stroke:var(--muted)' }),
        s('line', { x1: x + 1.5, x2: x + 1.5, y1: y + 12, y2: busY, style: 'stroke:var(--muted)' }),
        s('rect', { x: x - 15, y: y - 12, width: 30, height: 24, rx: 4, style: 'fill:var(--surface);stroke:var(--text);stroke-width:1.3' }),
        s('path', { d: `M${x - 9},${y + 5} A9,9 0 0 1 ${x + 9},${y + 5} M${x},${y + 5} L${x + 6},${y - 5}`, style: 'fill:none;stroke:var(--text);stroke-width:1.3' }),
        s('text', { x, y: busY + 18, 'text-anchor': 'middle', style: 'font-size:10px;fill:var(--muted)' }, `c${op.clbits[0]}`));
    } else {
      const name = NAMES[op.name] || op.name;
      svg.append(box(x, wy(q0), name, op.params.length ? deg(op.params[0]) : ''));
    }
  });
  return fitWhenShown(svg);
}

// The drawing scrolls inside its own box; the <figure> and its caption stay outside it (a figure
// with a figcaption may not take role=region).
export function circuitFigure(unit, labels, caption) {
  const hint = scrollHint();
  const scroller = scrollableWhenNeeded(h('div', { class: 'circuit-scroll' }, circuitSvg(unit, labels)), `Circuit diagram of ${unit.name}`, hint);
  return h('figure', { class: 'circuit' }, scroller, hint, caption ? h('figcaption', null, caption) : null);
}
