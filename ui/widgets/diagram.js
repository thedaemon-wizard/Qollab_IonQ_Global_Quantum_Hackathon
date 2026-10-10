// Box-and-arrow diagrams with icons (architecture and protocol flow). Coordinates are given by
// the caller in a fixed viewBox; the SVG scales to the container width. Optional per-node and
// per-edge `status`, `dash`, `mark` and widths let a caller show progress (the Bell Lab run).
import { h, s, uid } from '../core/dom.js';
import { iconMarkup } from '../core/icons.js';

function anchor(n, side) {
  switch (side) {
    case 'left': return [n.x, n.y + n.h / 2];
    case 'right': return [n.x + n.w, n.y + n.h / 2];
    case 'top': return [n.x + n.w / 2, n.y];
    default: return [n.x + n.w / 2, n.y + n.h];
  }
}

export function flowDiagram(spec) {
  const tId = uid('ft');
  const dId = uid('fd');
  const mId = uid('arrow');
  const svg = s('svg', { viewBox: `0 0 ${spec.width} ${spec.height}`, role: 'img', 'aria-labelledby': `${tId} ${dId}` },
    s('title', { id: tId }, spec.title), s('desc', { id: dId }, spec.desc));
  const defs = s('defs');
  svg.append(defs);
  // One arrowhead per colour; edges without `markerColor` keep the default muted arrowhead.
  const markers = new Map();
  const markerFor = (color) => {
    if (!markers.has(color)) {
      const id = markers.size ? uid('arrow') : mId;
      markers.set(color, id);
      defs.append(s('marker', { id, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' },
        s('path', { d: 'M0,0 L10,5 L0,10 z', style: `fill:${color}` })));
    }
    return markers.get(color);
  };
  for (const g of spec.groups || []) {
    svg.append(s('rect', { x: g.x, y: g.y, width: g.w, height: g.h, rx: 12, style: 'fill:none;stroke:var(--border);stroke-dasharray:6 5;stroke-width:1.5' }),
      s('text', { x: g.x + 10, y: g.y + 16, style: 'fill:var(--muted);font-size:11px;font-weight:600;letter-spacing:0.04em' }, g.label));
  }
  const byId = Object.fromEntries(spec.nodes.map((n) => [n.id, n]));
  for (const e of spec.edges || []) {
    const a = anchor(byId[e.from], e.fromSide || 'right');
    const b = anchor(byId[e.to], e.toSide || 'left');
    let d;
    if (e.route === 'elbow') {
      const mx = (a[0] + b[0]) / 2;
      d = `M${a[0]},${a[1]} H${mx} V${b[1]} H${b[0]}`;
    } else if (e.route === 'elbow-v') {
      const my = (a[1] + b[1]) / 2;
      d = `M${a[0]},${a[1]} V${my} H${b[0]} V${b[1]}`;
    } else if (e.route === 'hv') {
      d = `M${a[0]},${a[1]} H${b[0]} V${b[1]}`;
    } else if (e.route === 'under') {
      const y = Math.max(a[1], b[1]) + (e.offset || 24);
      d = `M${a[0]},${a[1]} V${y} H${b[0]} V${b[1]}`;
    } else {
      d = `M${a[0]},${a[1]} L${b[0]},${b[1]}`;
    }
    svg.append(s('path', { d, fill: 'none', 'marker-end': `url(#${markerFor(e.markerColor || 'var(--muted)')})`,
      ...(e.status ? { class: 'edge', 'data-status': e.status } : {}),
      style: `stroke:${e.color || 'var(--muted)'};stroke-width:${e.width || 1.8};stroke-dasharray:${e.dash || 'none'}` }));
    if (e.label) {
      const lx = e.labelAt ? e.labelAt[0] : (a[0] + b[0]) / 2;
      const ly = e.labelAt ? e.labelAt[1] : (a[1] + b[1]) / 2 - 6;
      svg.append(s('text', { x: lx, y: ly, 'text-anchor': 'middle', style: 'fill:var(--muted);font-size:11px' }, e.label));
    }
  }
  for (const n of spec.nodes) {
    const tone = n.tone || 'var(--accent)';
    const g = s('g', n.status ? { class: 'node', 'data-status': n.status } : null);
    g.append(s('rect', { x: n.x, y: n.y, width: n.w, height: n.h, rx: 10,
      style: `fill:var(--surface-2);stroke:${tone};stroke-width:${n.strokeWidth || 1.8};stroke-dasharray:${n.dash || 'none'}` }));
    if (n.mark) {
      g.append(s('text', { x: n.x + n.w - 9, y: n.y + 21, 'text-anchor': 'end', style: `font-weight:700;font-size:12.5px;fill:${n.markTone || tone}` }, n.mark));
    }
    if (n.icon) {
      const ic = s('svg', { x: n.x + 9, y: n.y + 9, width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', style: `stroke:${tone}`, 'aria-hidden': 'true' });
      ic.innerHTML = iconMarkup(n.icon);
      g.append(ic);
    }
    const tx = n.icon ? n.x + 37 : n.x + 10;
    g.append(s('text', { x: tx, y: n.y + 25, style: 'font-weight:650;font-size:12.5px' }, n.title));
    (n.sub || '').split('\n').filter(Boolean).forEach((line, i) => {
      g.append(s('text', { x: n.x + 10, y: n.y + 44 + i * 14, style: 'fill:var(--muted);font-size:11px' }, line));
    });
    svg.append(g);
  }
  const figure = h('figure', { class: spec.className ? `diagram ${spec.className}` : 'diagram' }, svg, spec.caption ? h('figcaption', null, spec.caption) : null);
  return { element: figure, svg };
}
