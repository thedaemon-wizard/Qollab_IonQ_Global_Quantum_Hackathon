// XY chart in SVG: lines, points with error bars, reference lines and shaded bands.
// Series differ by colour AND by dash/marker, so they stay distinguishable without colour.
// Every chart carries <title>/<desc> and a data table in <details>.
import { h, s, uid } from '../core/dom.js';
import { detailsTable } from './table.js';

const PAD = { left: 56, right: 16, top: 14, bottom: 44 };

function ticksFor(min, max, count = 5) {
  const span = max - min;
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((st) => span / st <= count + 0.5) || raw;
  const out = [];
  for (let v = Math.ceil(min / step - 1e-9) * step; v <= max + 1e-9; v += step) out.push(Number(v.toFixed(10)));
  return out;
}

export function markerShape(shape, x, y, size, style) {
  const r = size;
  switch (shape) {
    case 'square':
      return s('rect', { x: x - r, y: y - r, width: 2 * r, height: 2 * r, style });
    case 'triangle':
      return s('path', { d: `M${x},${y - r * 1.2} L${x + r * 1.1},${y + r * 0.8} L${x - r * 1.1},${y + r * 0.8} Z`, style });
    case 'diamond':
      return s('path', { d: `M${x},${y - r * 1.3} L${x + r * 1.1},${y} L${x},${y + r * 1.3} L${x - r * 1.1},${y} Z`, style });
    case 'cross':
      return s('path', { d: `M${x - r},${y - r} L${x + r},${y + r} M${x - r},${y + r} L${x + r},${y - r}`, style: `${style};fill:none;stroke-width:2.2` });
    default:
      return s('circle', { cx: x, cy: y, r, style });
  }
}

export function legendSwatch(item) {
  const sw = s('svg', { width: 28, height: 12, 'aria-hidden': 'true', viewBox: '0 0 28 12' });
  if (item.kind !== 'marker') {
    sw.append(s('line', { x1: 1, y1: 6, x2: 27, y2: 6, style: `stroke:${item.color};stroke-width:2.2;stroke-dasharray:${item.dash || 'none'}` }));
  }
  if (item.marker) sw.append(markerShape(item.marker, 14, 6, 3.6, `fill:${item.color};stroke:${item.color}`));
  if (item.kind === 'band') sw.replaceChildren(s('rect', { x: 1, y: 1, width: 26, height: 10, style: `fill:${item.color}` }));
  return sw;
}

export function lineChart(initial) {
  const figure = h('figure', { class: 'chart' });
  const clipId = uid('clip');
  const titleId = uid('t');
  const descId = uid('d');

  function render(spec) {
    const W = spec.width || 560;
    const H = spec.height || 300;
    const iw = W - PAD.left - PAD.right;
    const ih = H - PAD.top - PAD.bottom;
    const { x: X, y: Y } = spec;
    const sx = (v) => PAD.left + ((v - X.min) / (X.max - X.min)) * iw;
    const sy = (v) => PAD.top + ih - ((v - Y.min) / (Y.max - Y.min)) * ih;
    const fx = X.format || ((v) => String(v));
    const fy = Y.format || ((v) => String(v));
    const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-labelledby': `${titleId} ${descId}` },
      s('title', { id: titleId }, spec.title), s('desc', { id: descId }, spec.desc || ''));
    svg.append(s('defs', null, s('clipPath', { id: clipId }, s('rect', { x: PAD.left, y: PAD.top, width: iw, height: ih }))));

    const grid = s('g', { class: 'grid' });
    const axes = s('g', { class: 'axis' });
    for (const t of Array.isArray(X.ticks) ? X.ticks : ticksFor(X.min, X.max, X.ticks || 6)) {
      grid.append(s('line', { x1: sx(t), x2: sx(t), y1: PAD.top, y2: PAD.top + ih }));
      axes.append(s('text', { class: 'tick', x: sx(t), y: PAD.top + ih + 16, 'text-anchor': 'middle' }, fx(t)));
    }
    for (const t of Array.isArray(Y.ticks) ? Y.ticks : ticksFor(Y.min, Y.max, Y.ticks || 5)) {
      grid.append(s('line', { x1: PAD.left, x2: PAD.left + iw, y1: sy(t), y2: sy(t) }));
      axes.append(s('text', { class: 'tick', x: PAD.left - 6, y: sy(t) + 4, 'text-anchor': 'end' }, fy(t)));
    }
    axes.append(s('path', { d: `M${PAD.left},${PAD.top} V${PAD.top + ih} H${PAD.left + iw}`, fill: 'none' }));
    axes.append(s('text', { class: 'axis-label', x: PAD.left + iw / 2, y: H - 6, 'text-anchor': 'middle' }, X.label));
    axes.append(s('text', { class: 'axis-label', x: 14, y: PAD.top + ih / 2, 'text-anchor': 'middle', transform: `rotate(-90 14 ${PAD.top + ih / 2})` }, Y.label));
    svg.append(grid);

    const plot = s('g', { 'clip-path': `url(#${clipId})` });
    for (const b of spec.bands || []) {
      const x0 = sx(b.x0 ?? X.min);
      const x1 = sx(b.x1 ?? X.max);
      const y0 = sy(b.y1 ?? Y.max);
      const y1 = sy(b.y0 ?? Y.min);
      plot.append(s('rect', { x: Math.min(x0, x1), y: Math.min(y0, y1), width: Math.abs(x1 - x0), height: Math.abs(y1 - y0), style: `fill:${b.fill}` }));
      if (b.label) plot.append(s('text', { x: Math.min(x0, x1) + 4, y: Math.min(y0, y1) + 13, class: 'tick' }, b.label));
    }
    for (const l of spec.hlines || []) {
      plot.append(s('line', { x1: PAD.left, x2: PAD.left + iw, y1: sy(l.y), y2: sy(l.y), style: `stroke:${l.color || 'var(--muted)'};stroke-width:1.4;stroke-dasharray:${l.dash || '5 4'}` }));
      if (l.label) plot.append(s('text', { x: PAD.left + iw - 4, y: sy(l.y) - 4, 'text-anchor': 'end', class: 'tick' }, l.label));
    }
    for (const l of spec.vlines || []) {
      plot.append(s('line', { x1: sx(l.x), x2: sx(l.x), y1: PAD.top, y2: PAD.top + ih, style: `stroke:${l.color || 'var(--muted)'};stroke-width:1.4;stroke-dasharray:${l.dash || '5 4'}` }));
      if (l.label) plot.append(s('text', { x: sx(l.x) + 4, y: PAD.top + 12, class: 'tick' }, l.label));
    }
    for (const ser of spec.series || []) {
      const pts = ser.points.filter(([, y]) => y !== null && Number.isFinite(y));
      if (!pts.length) continue;
      const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x).toFixed(2)},${sy(y).toFixed(2)}`).join(' ');
      plot.append(s('path', { d, fill: 'none', style: `stroke:${ser.color};stroke-width:${ser.width || 2.2};stroke-dasharray:${ser.dash || 'none'}` }));
      if (ser.marker && ser.markEvery) {
        pts.forEach(([x, y], i) => {
          if (i % ser.markEvery === 0) plot.append(markerShape(ser.marker, sx(x), sy(y), 3.2, `fill:${ser.color};stroke:${ser.color}`));
        });
      }
    }
    svg.append(plot);
    // Error-bar markers are drawn unclipped so that points at the edge stay visible.
    const marks = s('g');
    for (const m of spec.markers || []) {
      const style = `stroke:${m.color};stroke-width:1.6`;
      if (m.xlo !== undefined && m.xhi !== undefined) marks.append(s('line', { x1: sx(m.xlo), x2: sx(m.xhi), y1: sy(m.y), y2: sy(m.y), style }));
      if (m.ylo !== undefined && m.yhi !== undefined) marks.append(s('line', { x1: sx(m.x), x2: sx(m.x), y1: sy(m.ylo), y2: sy(m.yhi), style }));
      marks.append(markerShape(m.shape || 'circle', sx(m.x), sy(m.y), m.size || 4.5, `fill:${m.hollow ? 'var(--surface)' : m.color};stroke:${m.color};stroke-width:1.8`));
      if (m.label) marks.append(s('text', { x: sx(m.x) + 7, y: sy(m.y) - 7, class: 'tick' }, m.label));
    }
    svg.append(axes, marks);

    const legendItems = [
      ...(spec.series || []).filter((x) => x.name).map((x) => ({ name: x.name, color: x.color, dash: x.dash, marker: x.marker })),
      ...(spec.markers || []).filter((m) => m.legend).map((m) => ({ name: m.legend, color: m.color, marker: m.shape || 'circle', kind: 'marker' })),
      ...(spec.bands || []).filter((b) => b.legend).map((b) => ({ name: b.legend, color: b.fill, kind: 'band' })),
    ];
    const legend = legendItems.length
      ? h('div', { class: 'legend', 'aria-hidden': 'true' }, legendItems.map((it) => h('span', null, legendSwatch(it), it.name)))
      : null;
    const table = spec.table ? detailsTable(spec.table.summary || 'Data table', spec.table) : null;
    figure.replaceChildren(svg, legend || '', spec.caption ? h('figcaption', null, spec.caption) : '', table || '');
  }

  render(initial);
  return { element: figure, update: render };
}
