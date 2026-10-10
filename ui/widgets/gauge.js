// The CHSH gauge: S on a scale with the local bound 2, the Werner DI threshold and 2*sqrt(2).
// Shows the point estimate and its conservative interval; values above 2*sqrt(2) are marked as
// statistical fluctuation, not as super-quantum correlations.
import { h, s, uid } from '../core/dom.js';
import { num } from '../core/format.js';

export function sGauge({ thresholds }) {
  const figure = h('figure', { class: 'gauge' });
  const tsir = 2 * Math.SQRT2;
  const lo = 0;
  const hi = 3.2;
  const W = 440;
  const H = 112;
  const x = (v) => 20 + ((Math.min(Math.max(v, lo), hi) - lo) / (hi - lo)) * (W - 40);
  const titleId = uid('gt');
  const descId = uid('gd');

  function render(est) {
    const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-labelledby': `${titleId} ${descId}`, width: '100%' },
      s('title', { id: titleId }, 'CHSH value S on a scale from 0 to 3.2'),
      s('desc', { id: descId }, est
        ? `Estimated S = ${num(est.point)}, conservative interval ${num(est.low)} to ${num(est.high)}. Local bound 2, DI-key threshold for Werner states ${num(thresholds.acin.S_werner)}, quantum maximum ${num(tsir)}.`
        : 'No run yet.'));
    const y0 = 34;
    svg.append(
      s('rect', { x: x(lo), y: y0, width: x(2) - x(lo), height: 22, style: 'fill:var(--zone-local)' }),
      s('rect', { x: x(2), y: y0, width: x(tsir) - x(2), height: 22, style: 'fill:var(--zone-quantum)' }),
      s('rect', { x: x(tsir), y: y0, width: x(hi) - x(tsir), height: 22, style: 'fill:var(--zone-beyond)' }),
      s('text', { x: x(1), y: y0 - 8, 'text-anchor': 'middle' }, 'local (S ≤ 2)'),
      s('text', { x: (x(2) + x(tsir)) / 2, y: y0 - 8, 'text-anchor': 'middle' }, 'quantum'),
      s('text', { x: (x(tsir) + x(hi)) / 2, y: y0 - 8, 'text-anchor': 'middle' }, 'not reachable'),
    );
    for (const [v, label] of [[0, '0'], [1, '1'], [2, '2'], [thresholds.acin.S_werner, num(thresholds.acin.S_werner, 3)], [tsir, '2√2'], [3, '3']]) {
      svg.append(s('line', { x1: x(v), x2: x(v), y1: y0 + 22, y2: y0 + 30, style: 'stroke:var(--muted)' }),
        s('text', { x: x(v), y: y0 + 44, 'text-anchor': 'middle', style: 'fill:var(--muted)' }, label));
    }
    svg.append(s('line', { x1: x(thresholds.acin.S_werner), x2: x(thresholds.acin.S_werner), y1: y0, y2: y0 + 22, style: 'stroke:var(--c2);stroke-width:2;stroke-dasharray:4 3' }));
    if (est) {
      const yl = y0 + 11;
      svg.append(
        s('line', { x1: x(est.low), x2: x(est.high), y1: yl, y2: yl, style: 'stroke:var(--text);stroke-width:3' }),
        s('line', { x1: x(est.low), x2: x(est.low), y1: yl - 8, y2: yl + 8, style: 'stroke:var(--text);stroke-width:3' }),
        s('line', { x1: x(est.high), x2: x(est.high), y1: yl - 8, y2: yl + 8, style: 'stroke:var(--text);stroke-width:3' }),
        s('circle', { cx: x(est.point), cy: yl, r: 7, style: 'fill:var(--accent);stroke:var(--text);stroke-width:2' }),
        s('text', { x: Math.min(x(est.point), W - 50), y: 22, 'text-anchor': 'middle', style: 'font-weight:600;font-size:14px' }, `S = ${num(est.point)}`),
      );
    }
    figure.replaceChildren(svg, h('figcaption', null,
      est ? `Bar: ${Math.round(100 * (1 - est.delta))}% confidence interval (Hoeffding, i.i.d. rounds). Dashed: Werner-state DI-key threshold.`
        : 'Run the lab to place S on the scale.'));
  }
  render(null);
  return { element: figure, update: render };
}
