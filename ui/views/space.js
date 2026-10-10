// Correlation space: where measured correlators sit relative to the local polytope, the quantum
// set and the no-signalling cube. 3D (three.js) plus an exact 2D slice that carries the same
// information for keyboard and screen-reader users, and when WebGL 2 is not available.
import { h } from '../core/dom.js';
import { num } from '../core/format.js';
import { icon } from '../core/icons.js';
import { viewFrame } from '../core/router.js';
import { cssVar } from '../core/theme.js';
import { lineChart } from '../widgets/chart.js';
import { button, checkbox, errorNote, note } from '../widgets/controls.js';
import { createCorrSet3d, webgl2Available } from '../widgets/corrset3d.js';
import { dataTable } from '../widgets/table.js';

const S2 = Math.SQRT1_2;

export default {
  id: 'space',
  title: 'Correlation space',
  icon: 'cube-3d-sphere',
  create(ctx) {
    const { element, body } = viewFrame('space', 'Where do the correlations live?', 'cube-3d-sphere',
      'Four correlators (E00, E01, E10, E11) describe a CHSH experiment. Local (classical) models fill a polytope, quantum mechanics a larger convex set with a curved boundary, and anything that does not signal fits in the cube. Measured points show where your run and the Munich data fall.');
    const stage = h('div', { class: 'space3d', id: 'space-3d' });
    const legend3d = h('div', { class: 'legend', 'aria-hidden': 'true' });
    const status = h('p', { class: 'muted small', role: 'status' });
    const tools = h('div', { class: 'toolbar', role: 'group', 'aria-label': '3D view controls' });
    const toggles = h('div', { class: 'toolbar' });
    const sliceBox = h('div');
    const tableBox = h('div');
    const exportStatus = h('p', { class: 'muted small', role: 'status' });
    body.append(
      h('div', { class: 'grid two' },
        h('div', { class: 'card' }, h('h3', null, icon('cube'), '3D: the symmetric section'),
          stage, legend3d, tools, toggles, status,
          h('p', { class: 'muted small' }, 'Axes: E00, E11 and m = (E01 + E10)/2. Grey: local polytope. Blue surfaces: boundary of the quantum set. Dashed: Werner states from the centre to the Tsirelson point. Drag to rotate, or use the buttons.')),
        h('div', { class: 'card', id: 'space-slice' }, h('h3', null, icon('chart-dots'), '2D: the slice E11 = −E00'), sliceBox)),
      h('div', { class: 'card wide' }, h('h3', null, icon('table'), 'Membership of each point (full four-dimensional test)'), tableBox,
        note('', 'Membership in the quantum set uses the Tsirelson–Landau–Masanes inequalities on all four correlators; it is exact for correlators with unbiased marginals, which is the case here. A finite-shot estimate can land outside the quantum set: that is sampling noise, not super-quantum physics.'),
        exportStatus),
    );

    let view3d = null;
    let geometry = null;

    function points() {
      const pts = [
        { name: 'Tsirelson', e: [S2, S2, S2, -S2], color: '#56b4e9' },
        { name: 'PR box', e: [1, 1, 1, -1], color: '#ff8080' },
        { name: 'deterministic', e: [1, 1, 1, 1], color: '#aab4c8' },
      ];
      const run = ctx.store.get().last.bell;
      if (run) {
        const st = run.analysis.settings;
        pts.push({ name: 'your run', e: [st.c00.E, st.c01.E, st.c10.E, st.c11.E], color: '#2fc79a' });
      }
      for (const r of ctx.rosenfeldRuns || []) {
        const E = r.pooled.E;
        pts.push({ name: `Munich ${r.run}`, e: [E.E00, E.E01, E.E10, E.E11], color: r.run.endsWith('04-15') ? '#e69f00' : '#cc79a7' });
      }
      return pts;
    }

    async function refresh() {
      const pts = points();
      geometry = await ctx.api.geometry(Object.fromEntries(pts.map((p) => [p.name, p.e])));
      tableBox.replaceChildren(dataTable({
        caption: 'S = E00 + E01 + E10 − E11; max over the eight CHSH forms; TLM uses arcsin of each correlator (quantum if ≤ π)',
        columns: [
          { key: 'name', label: 'Point' },
          { key: 'e', label: 'E00, E01, E10, E11', align: 'text', format: (v) => v.map((x) => num(x, 3)).join(', ') },
          { key: 'S', label: 'S', format: (v) => num(v) },
          { key: 'max_tlm', label: 'TLM value', format: (v) => num(v) },
          { key: 'in_local', label: 'local', format: (v) => (v ? 'yes' : 'no') },
          { key: 'in_quantum', label: 'quantum', format: (v) => (v ? 'yes' : 'no') },
          { key: 'in_no_signalling', label: 'no-signalling', format: (v) => (v ? 'yes' : 'no') },
        ],
        rows: pts.map((p) => ({ name: p.name, e: p.e, ...geometry.points[p.name] })),
      }));
      drawSlice(pts);
      legend3d.replaceChildren(...pts.map((p) => h('span', null,
        h('span', { style: { display: 'inline-block', width: '11px', height: '11px', borderRadius: '50%', background: p.color } }), p.name)));
      if (view3d) {
        view3d.setQuantum(geometry.mesh);
        view3d.setPoints(pts.map((p) => ({ name: p.name, color: p.color, sym: geometry.points[p.name].symmetric })));
      }
    }

    function drawSlice(pts) {
      const circle = Array.from({ length: 181 }, (_, i) => [Math.cos((i * Math.PI) / 90), Math.sin((i * Math.PI) / 90)]);
      const chart = lineChart({
        title: 'Slice of the correlation sets through E11 = -E00',
        desc: 'In this slice the local set is a diamond |x| + |y| <= 1, the quantum set the unit disc and the no-signalling set the square. Lines of constant S = 2x + 2y: S = 2 touches the diamond, S = 2 root 2 touches the disc at the Tsirelson point.',
        width: 380, height: 380,
        x: { min: -1.1, max: 1.1, label: 'x = (E00 − E11)/2', ticks: [-1, -0.5, 0, 0.5, 1] },
        y: { min: -1.1, max: 1.1, label: 'y = (E01 + E10)/2', ticks: [-1, -0.5, 0, 0.5, 1] },
        series: [
          { name: 'no-signalling (square)', color: 'var(--muted)', dash: '2 3', points: [[-1, -1], [1, -1], [1, 1], [-1, 1], [-1, -1]] },
          { name: 'local (diamond)', color: 'var(--text)', points: [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 0]] },
          { name: 'quantum (disc)', color: 'var(--c1)', dash: '7 4', width: 2.6, points: circle },
          { name: 'S = 2√2', color: 'var(--c3)', dash: '10 3 2 3', points: [[0.2, 2 * S2 * 1 - 0.2], [2 * S2 - 0.2, 0.2]] },
        ],
        markers: pts.map((p, i) => {
          const x = (p.e[0] - p.e[3]) / 2;
          const y = (p.e[1] + p.e[2]) / 2;
          return { x, y, color: p.color, shape: ['circle', 'square', 'triangle', 'diamond', 'cross', 'circle'][i % 6], legend: p.name, hollow: i === 5, size: 5.5 };
        }),
        caption: 'Exact for points with E11 = −E00 (the lab’s Werner runs); other points are shown at their projection, so use the table for their membership.',
      });
      sliceBox.replaceChildren(chart.element);
    }

    function colors() {
      return { muted: cssVar(ctx.root, '--muted'), local: cssVar(ctx.root, '--muted'), quantum: cssVar(ctx.root, '--c1'), werner: cssVar(ctx.root, '--c2') };
    }

    async function setup3d() {
      if (!webgl2Available()) {
        stage.replaceWith(note('warn', 'WebGL 2 is not available in this browser, so the 3D view is off. The 2D slice and the table on this page show the same sets and points.'));
        return;
      }
      try {
        view3d = await createCorrSet3d(stage, { colors, labels: { x: 'E00', y: 'm', z: 'E11' } });
        status.textContent = `three.js r${view3d.revision}, WebGL 2.`;
        const step = Math.PI / 12;
        tools.append(
          button('', 'arrow-left', () => view3d.rotate(-step, 0), { title: 'Rotate left' }),
          button('', 'arrow-right', () => view3d.rotate(step, 0), { title: 'Rotate right' }),
          button('', 'arrow-up', () => view3d.rotate(0, -step), { title: 'Tilt up' }),
          button('', 'arrow-down', () => view3d.rotate(0, step), { title: 'Tilt down' }),
          button('Zoom in', null, () => view3d.zoom(0.85)),
          button('Zoom out', null, () => view3d.zoom(1.18)),
          button('Reset view', 'zoom-reset', () => view3d.reset()),
          button('PNG', 'photo', async () => {
            try {
              await ctx.api.sendFile('correlation_space_3d.png', 'image/png', view3d.pngBase64());
              exportStatus.textContent = 'correlation_space_3d.png was sent to the run console.';
            } catch (err) {
              exportStatus.textContent = `Export failed: ${err.message}`;
            }
          }),
        );
        for (const b of tools.querySelectorAll('button')) {
          if (!b.textContent.trim()) b.setAttribute('aria-label', b.title);
        }
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const spin = checkbox({ label: 'Rotate slowly', checked: false, onChange: (on) => view3d.autoRotate(on), hint: reduce ? 'Off by default because your system asks for reduced motion.' : '' });
        toggles.append(
          checkbox({ label: 'Local polytope', checked: true, onChange: (on) => view3d.show('local', on) }).element,
          checkbox({ label: 'Quantum boundary', checked: true, onChange: (on) => view3d.show('quantum', on) }).element,
          checkbox({ label: 'Werner line', checked: true, onChange: (on) => view3d.show('werner', on) }).element,
          spin.element,
        );
        ctx.theme.onChange(() => requestAnimationFrame(() => view3d.recolor()));
        if (window.matchMedia) window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => view3d.recolor());
      } catch (err) {
        stage.replaceWith(errorNote(err));
        view3d = null;
      }
    }

    ctx.store.subscribe((st, prev) => {
      if (st.last.bell !== prev.last.bell && geometry) refresh().catch(() => {});
    });

    let first = true;
    return {
      element,
      async onShow() {
        if (first) {
          first = false;
          try {
            if (!ctx.rosenfeldRuns) ctx.rosenfeldRuns = (await ctx.api.rosenfeld()).runs;
          } catch {
            ctx.rosenfeldRuns = [];
          }
          await setup3d();
          await refresh();
        }
        if (view3d) view3d.setVisible(true);
      },
      onHide() {
        if (view3d) view3d.setVisible(false);
      },
    };
  },
};
