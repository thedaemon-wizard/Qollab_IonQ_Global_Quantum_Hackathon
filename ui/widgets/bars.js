// Outcome counts per measurement setting as grouped bars (00, 01, 10, 11). Each outcome has
// its own colour and fill pattern; the numbers are also in the table below the chart.
import { h, s, uid } from '../core/dom.js';
import { legendSwatch } from './chart.js';
import { detailsTable } from './table.js';

const OUTCOMES = [
  { key: 'n00', label: '++ (00)', color: 'var(--c1)' },
  { key: 'n01', label: '+− (01)', color: 'var(--c2)' },
  { key: 'n10', label: '−+ (10)', color: 'var(--c3)' },
  { key: 'n11', label: '−− (11)', color: 'var(--c4)' },
];

export function countsChart() {
  const figure = h('figure', { class: 'chart' });
  const titleId = uid('bt');
  const patId = uid('pat');

  function render(settings) {
    if (!settings) {
      figure.replaceChildren(h('p', { class: 'muted' }, 'No counts yet.'));
      return;
    }
    const ids = Object.keys(settings);
    const W = 440;
    const H = 220;
    const left = 44;
    const bottom = 40;
    const top = 10;
    const iw = W - left - 10;
    const ih = H - top - bottom;
    const max = Math.max(1, ...ids.flatMap((id) => OUTCOMES.map((o) => settings[id][o.key])));
    const group = iw / ids.length;
    const bw = (group * 0.8) / 4;
    const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-labelledby': titleId },
      s('title', { id: titleId }, `Outcome counts for ${ids.length} measurement settings`));
    svg.append(s('defs', null, s('pattern', { id: patId, width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' },
      s('line', { x1: 0, y1: 0, x2: 0, y2: 6, style: 'stroke:var(--surface);stroke-width:2' }))));
    svg.append(s('path', { d: `M${left},${top} V${top + ih} H${left + iw}`, fill: 'none', style: 'stroke:var(--muted)' }));
    for (const f of [0, 0.5, 1]) {
      const y = top + ih - f * ih;
      svg.append(s('text', { x: left - 6, y: y + 4, 'text-anchor': 'end', style: 'fill:var(--muted)' }, String(Math.round(f * max))));
    }
    ids.forEach((id, gi) => {
      const x0 = left + gi * group + group * 0.1;
      OUTCOMES.forEach((o, oi) => {
        const v = settings[id][o.key];
        const bh = (v / max) * ih;
        const x = x0 + oi * bw;
        svg.append(s('rect', { x, y: top + ih - bh, width: bw - 1, height: bh, style: `fill:${o.color}` }));
        if (oi % 2 === 1) svg.append(s('rect', { x, y: top + ih - bh, width: bw - 1, height: bh, fill: `url(#${patId})` }));
      });
      svg.append(s('text', { x: x0 + group * 0.4, y: top + ih + 16, 'text-anchor': 'middle' }, id));
    });
    const legend = h('div', { class: 'legend', 'aria-hidden': 'true' },
      OUTCOMES.map((o) => h('span', null, legendSwatch({ name: o.label, color: o.color, kind: 'band' }), o.label)));
    const table = detailsTable('Counts table', {
      caption: 'Counts per setting (Alice bit, Bob bit), after post-selection where it applies',
      columns: [{ key: 'id', label: 'Setting' }, ...OUTCOMES.map((o) => ({ key: o.key, label: o.label }))],
      rows: ids.map((id) => ({ id, ...settings[id] })),
    });
    figure.replaceChildren(svg, legend, table);
  }
  render(null);
  return { element: figure, update: render };
}
