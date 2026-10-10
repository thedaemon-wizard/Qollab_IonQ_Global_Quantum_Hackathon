// Real data: the Munich 2017 event-ready Bell test re-analysed with this lab's estimator, and
// published DI-QKD experiments evaluated with the same bounds.
import { h } from '../core/dom.js';
import { int, num, pct, pm } from '../core/format.js';
import { icon } from '../core/icons.js';
import { viewFrame } from '../core/router.js';
import { lineChart } from '../widgets/chart.js';
import { errorNote, note } from '../widgets/controls.js';
import { dataTable } from '../widgets/table.js';

const SHAPES = ['circle', 'square', 'triangle', 'diamond', 'cross'];
const COLORS = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c6)'];

function rosenfeldCard(run, index) {
  const p = run.pooled;
  const verdict = run.conservative.bell_violation
    ? note('good', `At ${Math.round(100 * (1 - run.delta))}% confidence (Hoeffding, i.i.d.), S ≥ ${num(run.S_low)} > 2: a Bell violation.`, 'check')
    : note('warn', `At ${Math.round(100 * (1 - run.delta))}% confidence (Hoeffding, i.i.d.), the lower end is S = ${num(run.S_low)}, which does not clear 2. The paper’s own tests (without the i.i.d. assumption) are different; this is our conservative reading.`);
  return h('div', { class: 'card', id: index === 0 ? 'exp-rosenfeld' : null },
    h('h3', null, icon('microscope'), run.label),
    h('dl', { class: 'kv' },
      h('dt', null, 'Events used'), h('dd', null, `${int(run.events_per_state)} per heralded state (first in file order)`),
      h('dt', null, 'S, Ψ⁻ events'), h('dd', null, pm(run.per_state['Psi-'].S, run.per_state['Psi-'].se, 4)),
      h('dt', null, 'S, Ψ⁺ events'), h('dd', null, pm(run.per_state['Psi+'].S, run.per_state['Psi+'].se, 4)),
      h('dt', null, 'S, pooled'), h('dd', null, pm(p.S, p.se, 4)),
      h('dt', null, 'Hoeffding lower end'), h('dd', null, num(run.S_low, 4)),
      h('dt', null, 'Self-test bound (point / low)'), h('dd', null, `${num(run.point.kaniewski_F)} / ${num(run.conservative.kaniewski_F)}`),
      h('dt', null, 'H_min (point / low)'), h('dd', null, `${num(run.point.pironio_Hmin)} / ${num(run.conservative.pironio_Hmin)} bit`),
      h('dt', null, 'In the quantum set (TLM)'), h('dd', null, run.geometry.in_quantum ? 'yes' : 'no')),
    verdict);
}

export default {
  id: 'experiments',
  title: 'Real data',
  icon: 'microscope',
  create(ctx) {
    const { element, body } = viewFrame('experiments', 'Real experiments, same formulas', 'microscope',
      'The estimator and bounds used for your simulated runs, applied to open data from a loophole-free Bell test and to published device-independent QKD experiments.');
    const rosBox = h('div', { class: 'stack' }, h('p', { class: 'muted' }, 'Loading the Munich event files…'));
    const pubBox = h('div', { class: 'stack' });
    body.append(
      h('div', { class: 'card wide' },
        h('h3', null, icon('database'), 'Munich 2017: event-ready Bell test with two atoms 400 m apart'),
        h('p', null, 'Rosenfeld et al., Phys. Rev. Lett. 119, 010402 (2017) closed the detection and locality loopholes. Their event files (Zenodo, doi:10.5281/zenodo.22936124, CC BY 4.0) list every valid atom–atom event. This lab reads them, maps each event onto the same CHSH form S = E00 + E01 + E10 − E11 that it uses for simulated counts, and reproduces the paper’s S = 2.221 ± 0.033 for the 15 April 2016 run.'),
        rosBox),
      h('div', { class: 'card wide' }, h('h3', null, icon('shield-lock'), 'Published DI-QKD experiments'), pubBox),
    );

    async function loadRosenfeld() {
      const data = await ctx.api.rosenfeld();
      const runs = data.runs;
      const chart = lineChart({
        title: 'Running CHSH value as events accumulate',
        desc: `S computed from the first k events of each run. The April run settles near ${num(runs[0].pooled.S, 3)} and the June public run near ${num(runs[1].pooled.S, 3)}.`,
        width: 640, height: 280,
        x: { min: 0, max: 10000, label: 'events used (both heralded states)', format: (v) => int(v) },
        y: { min: 1.6, max: 2.9, label: 'S', ticks: [1.6, 1.8, 2, 2.2, 2.4, 2.6, 2.8] },
        series: runs.map((r, i) => ({ name: r.label, color: COLORS[i], dash: i ? '7 4' : 'none', points: r.running.map((p) => [p.events, p.S]) })),
        bands: runs.map((r, i) => ({ x0: 0, x1: 10000, y0: r.S_low, y1: r.pooled.S + r.hoeffding_halfwidth, fill: i ? 'rgba(230,159,0,0.10)' : 'rgba(86,180,233,0.12)', legend: `${r.label}: Hoeffding interval` })),
        hlines: [{ y: 2, label: 'local bound S = 2' }, { y: 2 * Math.SQRT2, label: '2√2' }],
        caption: 'Lines: S after k events. Bands: the final Hoeffding interval at 95% confidence. Early values swing widely; this is why the number of rounds matters for every certificate.',
        table: {
          summary: 'Data table (every fifth point)',
          caption: 'Running S',
          columns: [{ key: 'events', label: 'events', format: int }, ...runs.map((r, i) => ({ key: `s${i}`, label: r.run, format: (v) => num(v) }))],
          rows: runs[0].running.filter((_, i) => i % 5 === 0).map((p, k) => ({ events: p.events, s0: p.S, s1: runs[1].running[k * 5] ? runs[1].running[k * 5].S : null })),
        },
      });
      const corr = dataTable({
        caption: 'Pooled correlators in this lab’s CHSH form (lab 1 = x, lab 2 = y)',
        columns: [{ key: 'run', label: 'Run' }, ...['E00', 'E01', 'E10', 'E11'].map((k) => ({ key: k, label: k, format: (v) => num(v, 4) })), { key: 'N', label: 'N', format: int }],
        rows: runs.map((r) => ({ run: r.run, ...r.pooled.E, N: Object.values(r.pooled.N).reduce((a, b) => a + b, 0) })),
      });
      rosBox.replaceChildren(
        h('div', { class: 'grid' }, ...runs.map(rosenfeldCard)),
        chart.element, corr,
        note('', 'There is no key-basis pair in these data (both labs measure at 45° to each other), so no QBER or key rate can be computed from them; only the CHSH-based certificates apply. The first-5,000 cut is our reading of the paper’s "5000 events for each state"; it reproduces the paper’s tables count for count.'),
      );
    }

    async function loadPublished() {
      const data = await ctx.api.experiments();
      const pts = data.points.filter((p) => p.Q !== null);
      const sq = lineChart({
        title: 'Published experiments on the S–Q plane',
        desc: 'Each experiment is shown with one-standard-deviation error bars. Above the solid curve the asymptotic DI key rate of Acin et al. is positive; the dashed line is the Werner-state relation S = 2 root 2 (1 - 2Q).',
        width: 640, height: 320,
        x: { min: 0, max: 0.1, label: 'QBER Q (key basis)', format: (v) => `${Math.round(v * 100)}%`, ticks: [0, 0.02, 0.04, 0.06, 0.08, 0.1] },
        y: { min: 2.3, max: 2.85, label: 'S', ticks: [2.3, 2.4, 2.5, 2.6, 2.7, 2.8] },
        series: [
          { name: 'DI key rate = 0 (Acín 2007)', color: 'var(--c3)', points: data.di_zero_curve.map((p) => [p.Q, p.S]) },
          { name: 'Werner states', color: 'var(--muted)', dash: '6 4', points: [[0, 2 * Math.SQRT2], [0.1, 2 * Math.SQRT2 * 0.8]] },
        ],
        markers: pts.map((p, i) => ({
          x: p.Q, y: p.S, xlo: p.Q - p.Q_err, xhi: p.Q + p.Q_err, ylo: p.S - p.S_err, yhi: p.S + p.S_err,
          color: COLORS[i % COLORS.length], shape: SHAPES[i % SHAPES.length], legend: p.label,
        })),
        caption: 'Positive DI key needs a point above the solid curve. Error bars are as published (one standard deviation); several long-distance points straddle the curve.',
      });
      const table = dataTable({
        caption: 'Published S and Q, and the asymptotic bounds this lab computes from them',
        columns: [
          { key: 'label', label: 'Experiment', align: 'text' },
          { key: 'S', label: 'S', format: (v, r) => pm(v, r.S_err, 3) },
          { key: 'Q', label: 'QBER', format: (v, r) => (v === null ? 'not measured' : `${pct(v)} ± ${pct(r.Q_err)}`) },
          { key: 'rc', label: 'DI rate (central)', format: (v) => (v === null || v === undefined ? '—' : num(v)) },
          { key: 'rk', label: 'DI rate (S−σ, Q+σ)', format: (v) => (v === null || v === undefined ? '—' : num(v)) },
          { key: 'k', label: 'Self-test bound', format: (v) => num(v) },
          { key: 'regime', label: 'As published', align: 'text' },
        ],
        rows: data.points.map((p) => ({ ...p, rc: p.central.di_rate_acin, rk: p.corner.di_rate_acin, k: p.central.kaniewski_F })),
      });
      const caveats = h('ul', { class: 'small' }, data.points.map((p) => h('li', null, h('strong', null, `${p.label}: `), p.caveat, ` Source: ${data.sources[p.source].citation}.`)));
      const lu = data.published_rates;
      const luChart = lineChart({
        title: 'Lu et al. 2026, Fig. 5C: published key rates and our recomputation',
        desc: 'Published asymptotic rates per distance, this lab’s (1 - gamma) times the Acin rate at the same S and Q, and the rate at the conservative corner.',
        width: 640, height: 280,
        x: { min: 0, max: 110, label: 'fibre length (km, spooled)', ticks: [0, 20, 40, 60, 80, 100] },
        y: { min: -0.1, max: 0.45, label: 'key bits per event', ticks: [-0.1, 0, 0.1, 0.2, 0.3, 0.4] },
        hlines: [{ y: 0, label: 'zero rate', dash: '2 2' }],
        markers: [
          ...lu.rows.map((r, i) => ({ x: r.distance_km, y: r.rate, color: 'var(--c1)', shape: 'circle', legend: i === 0 ? 'published (Fig. 5C data)' : null })),
          ...lu.rows.map((r, i) => ({ x: r.distance_km + 1.8, y: r.ours, color: 'var(--c2)', shape: 'square', hollow: true, legend: i === 0 ? 'ours: (1−γ)·r_Acín' : null })),
          ...lu.rows.map((r, i) => ({ x: r.distance_km - 1.8, y: r.corner, color: 'var(--bad)', shape: 'cross', legend: i === 0 ? 'ours at (S−σ, Q+σ)' : null })),
        ],
        table: {
          summary: 'Data table',
          caption: `Lu et al. 2026, ${lu.file}; γ = ${lu.test_round_fraction}`,
          columns: [
            { key: 'distance_km', label: 'km' }, { key: 'S', label: 'S', format: (v, r) => pm(v, r.S_err, 3) },
            { key: 'Q', label: 'Q', format: (v, r) => `${pct(v)} ± ${pct(r.Q_err)}` },
            { key: 'rate', label: 'published', format: (v) => num(v, 6) }, { key: 'ours', label: 'ours', format: (v) => num(v, 6) },
            { key: 'difference', label: 'difference', format: (v) => num(v, 6) }, { key: 'corner', label: 'corner', format: (v) => num(v, 4) },
          ],
          rows: lu.rows,
        },
        caption: 'Ours is 0.0008–0.0015 above every published value; the paper does not print the exact formula, so we report the difference rather than explain it. At 70 and 100 km the conservative corner is negative: those rates are not robust at one standard deviation.',
      });
      pubBox.replaceChildren(sq.element, table, h('details', null, h('summary', null, 'Caveats for each experiment'), caveats),
        h('h4', null, 'A distance series: Lu et al. 2026'), luChart.element,
        note('warn', 'Quoted S and Q are the authors’; the rates in this view are our asymptotic recomputation (collective attacks), not the authors’ finite-size keys. Settings, protocols and loophole status differ between experiments.'));
    }

    let first = true;
    return {
      element,
      async onShow() {
        if (!first) return;
        first = false;
        try {
          await loadRosenfeld();
        } catch (err) {
          rosBox.replaceChildren(errorNote(err));
        }
        try {
          await loadPublished();
        } catch (err) {
          pubBox.replaceChildren(errorNote(err));
        }
      },
    };
  },
};
