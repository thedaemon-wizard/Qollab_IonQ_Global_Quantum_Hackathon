// Measurement directions in the X-Z plane of the Bloch sphere (angle from +Z towards +X),
// for Alice, Bob and the eavesdropper's coupling. A flat disc says everything the CHSH settings
// need: all of them lie in one plane.
import { h, s, uid } from '../core/dom.js';

export function xzDisc() {
  const figure = h('figure', { class: 'diagram small' });
  const tId = uid('dt');
  const dId = uid('dd');

  function render({ alice, bob, evePhi }) {
    const W = 320;
    const R = 104;
    const cx = W / 2;
    const cy = W / 2 + 4;
    const pt = (deg, r = R) => [cx + r * Math.sin((deg * Math.PI) / 180), cy - r * Math.cos((deg * Math.PI) / 180)];
    const svg = s('svg', { viewBox: `0 0 ${W} ${W + 14}`, role: 'img', 'aria-labelledby': `${tId} ${dId}` },
      s('title', { id: tId }, 'Measurement directions in the X-Z plane'),
      s('desc', { id: dId }, `Alice measures along ${alice.map((a) => `${a.deg} degrees (${a.name})`).join(', ')}; Bob along ${bob.map((b) => `${b.deg} degrees (${b.name})`).join(', ')}. Angles are measured from the Z axis towards X.`));
    svg.append(
      s('circle', { cx, cy, r: R, fill: 'none', style: 'stroke:var(--border);stroke-width:1.5' }),
      s('line', { x1: cx - R - 8, x2: cx + R + 8, y1: cy, y2: cy, style: 'stroke:var(--border)' }),
      s('line', { x1: cx, x2: cx, y1: cy - R - 8, y2: cy + R + 8, style: 'stroke:var(--border)' }),
      s('text', { x: cx - 8, y: cy - R + 18, 'text-anchor': 'end', style: 'fill:var(--muted)' }, '+Z'),
      s('text', { x: cx + R - 8, y: cy + 17, 'text-anchor': 'end', style: 'fill:var(--muted)' }, '+X'),
    );
    // Labels sit 18 beyond the rim. Where Alice and Bob share a direction, their labels sit side
    // by side across the arrow (shifted along the rim), which works for any angle and font.
    const arrow = (deg, color, dash, label, shift) => {
      const [x, y] = pt(deg, R - 4);
      const [px, py] = pt(deg, R + 18);
      const rad = (deg * Math.PI) / 180;
      const [lx, ly] = [px + shift * Math.cos(rad), py + shift * Math.sin(rad)];
      svg.append(
        s('line', { x1: cx, y1: cy, x2: x, y2: y, style: `stroke:${color};stroke-width:2.6;stroke-dasharray:${dash}` }),
        s('circle', { cx: x, cy: y, r: 4, style: `fill:${color}` }),
        s('text', { x: lx, y: ly + 4, 'text-anchor': 'middle', style: `fill:${color};font-weight:600` }, label),
      );
    };
    const shared = (deg) => alice.some((a) => Math.abs(a.deg - deg) < 1) && bob.some((b) => Math.abs(b.deg - deg) < 1);
    alice.forEach((a) => arrow(a.deg, 'var(--c1)', 'none', `A:${a.short}`, shared(a.deg) ? -15 : 0));
    bob.forEach((b) => arrow(b.deg, 'var(--c2)', '6 4', `B:${b.short}`, shared(b.deg) ? 15 : 0));
    const eve = evePhi !== null && evePhi !== undefined
      ? ` Eve is not a direction here: she couples to Bob's qubit with a controlled rotation of ${evePhi}° (180° copies the Z value completely).`
      : '';
    figure.replaceChildren(svg, h('figcaption', null, `Solid: Alice. Dashed: Bob. All settings lie in the X–Z plane.${eve}`));
  }
  return { element: figure, update: render };
}
