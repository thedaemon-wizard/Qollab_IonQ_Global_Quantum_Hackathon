// Time-ordered message chart: one lane per node, steps as boxes, classical messages as arrows.
import { h, s, uid } from '../core/dom.js';

export function swimlane({ title, desc, lanes, steps, messages, caption }) {
  const tId = uid('st');
  const dId = uid('sd');
  const mId = uid('sm');
  const tMax = Math.max(...steps.map((x) => x.t), ...messages.map((m) => m.t1)) + 1;
  const left = 96;
  const laneH = 46;
  const colW = 118;
  const W = left + tMax * colW + 10;
  const H = 30 + lanes.length * laneH + 10;
  const ly = (i) => 30 + i * laneH + laneH / 2;
  const tx = (t) => left + t * colW + colW / 2;
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-labelledby': `${tId} ${dId}` },
    s('title', { id: tId }, title), s('desc', { id: dId }, desc));
  svg.append(s('defs', null, s('marker', { id: mId, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto' },
    s('path', { d: 'M0,0 L10,5 L0,10 z', style: 'fill:var(--c4)' }))));
  const phases = [...new Set(steps.map((x) => x.phase).filter(Boolean))];
  phases.forEach((p) => {
    const ts = steps.filter((x) => x.phase === p).map((x) => x.t);
    svg.append(s('text', { x: tx((Math.min(...ts) + Math.max(...ts)) / 2), y: 18, 'text-anchor': 'middle', style: 'fill:var(--muted);font-size:11px;font-weight:600' }, p));
  });
  lanes.forEach((name, i) => {
    svg.append(s('line', { x1: left - 6, x2: W - 8, y1: ly(i), y2: ly(i), style: 'stroke:var(--border);stroke-width:1.2' }),
      s('text', { x: 8, y: ly(i) + 4, style: 'font-weight:600' }, name));
  });
  for (const m of messages) {
    svg.append(s('path', { d: `M${tx(m.t0) + 40},${ly(m.from)} L${tx(m.t1) - 40},${ly(m.to)}`, fill: 'none', 'marker-end': `url(#${mId})`, style: 'stroke:var(--c4);stroke-width:1.6;stroke-dasharray:5 3' }));
    if (m.label) svg.append(s('text', { x: (tx(m.t0) + tx(m.t1)) / 2 + 14, y: (ly(m.from) + ly(m.to)) / 2 - 6, 'text-anchor': 'middle', style: 'fill:var(--c4);font-size:10.5px' }, m.label));
  }
  for (const st of steps) {
    const color = st.color || 'var(--accent)';
    svg.append(s('rect', { x: tx(st.t) - 52, y: ly(st.lane) - 14, width: 104, height: 28, rx: 7, style: `fill:var(--surface-2);stroke:${color};stroke-width:1.6` }),
      s('text', { x: tx(st.t), y: ly(st.lane) + 4, 'text-anchor': 'middle', style: 'font-size:11px' }, st.label));
  }
  return h('figure', { class: 'diagram swim' }, svg, caption ? h('figcaption', null, caption) : null);
}
