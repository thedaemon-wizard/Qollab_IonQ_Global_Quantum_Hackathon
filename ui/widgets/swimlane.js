// Time-ordered message chart: one lane per node, steps as boxes, classical messages as arrows.
import { fitWhenShown, h, readableScroll, s, uid } from '../core/dom.js';

export function swimlane({ title, desc, lanes, steps, messages, caption }) {
  const tId = uid('st');
  const dId = uid('sd');
  const mId = uid('sm');
  const tMax = Math.max(...steps.map((x) => x.t), ...messages.map((m) => m.t1)) + 1;
  const left = 96;
  const colW = 118;
  const tx = (t) => left + t * colW + colW / 2;
  // A message label sits just above the middle of its arrow. Where a step box is there (two
  // neighbouring lanes leave no free lane between them), it goes into the gap below the nearest
  // lane instead, right of the arrow, and the lanes are made taller so that the gap fits it.
  const near = (m) => Math.floor((m.from + m.to) / 2);
  const blocked = (m) => {
    if (!m.label) return false;
    const half = (m.label.length * 6.2) / 2; // a 10.5px label, generous for wide fonts
    const xc = (tx(m.t0) + tx(m.t1)) / 2 + 14;
    const yb = 30 + ((m.from + m.to) / 2) * 46 + 23 - 6;
    return steps.some((st) => xc + half > tx(st.t) - 52 && xc - half < tx(st.t) + 52
      && yb + 2.5 > 30 + st.lane * 46 + 9 && yb - 8.5 < 30 + st.lane * 46 + 37);
  };
  const laneH = messages.some(blocked) ? 60 : 46;
  const W = left + tMax * colW + 10;
  const H = 30 + lanes.length * laneH + 10;
  const ly = (i) => 30 + i * laneH + laneH / 2;
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
    const [x0, y0, x1, y1] = [tx(m.t0) + 40, ly(m.from), tx(m.t1) - 40, ly(m.to)];
    svg.append(s('path', { d: `M${x0},${y0} L${x1},${y1}`, fill: 'none', 'marker-end': `url(#${mId})`, style: 'stroke:var(--c4);stroke-width:1.6;stroke-dasharray:5 3' }));
    if (!m.label) continue;
    if (blocked(m)) {
      const y = ly(near(m)) + laneH / 2;
      const x = (y1 === y0 ? (x0 + x1) / 2 : x0 + ((x1 - x0) * (y - y0)) / (y1 - y0)) + 8;
      svg.append(s('text', { x, y: y + 3.5, class: 'halo', style: 'fill:var(--c4);font-size:10.5px' }, m.label));
    } else {
      svg.append(s('text', { x: (tx(m.t0) + tx(m.t1)) / 2 + 14, y: (y0 + y1) / 2 - 6, 'text-anchor': 'middle', class: 'halo', style: 'fill:var(--c4);font-size:10.5px' }, m.label));
    }
  }
  for (const st of steps) {
    const color = st.color || 'var(--accent)';
    svg.append(s('rect', { x: tx(st.t) - 52, y: ly(st.lane) - 14, width: 104, height: 28, rx: 7, style: `fill:var(--surface-2);stroke:${color};stroke-width:1.6` }),
      s('text', { x: tx(st.t), y: ly(st.lane) + 4, 'text-anchor': 'middle', 'data-fit': 92, style: 'font-size:11px' }, st.label));
  }
  fitWhenShown(svg);
  // Labels are 10.5 to 12 units and step labels may shrink to 10 (fitSvgText): below W px the
  // timeline scrolls sideways in its own box instead of shrinking them under 10 px on screen.
  return h('figure', { class: 'diagram swim' }, ...readableScroll(svg, W, title, 'diagram-scroll'), caption ? h('figcaption', null, caption) : null);
}
