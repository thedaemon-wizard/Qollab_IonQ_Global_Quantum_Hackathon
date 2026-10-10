// Certificates: the formulas behind the ladder, as curves, with the latest run placed on them.
import { h } from '../core/dom.js';
import { num, pct } from '../core/format.js';
import { icon } from '../core/icons.js';
import { viewFrame } from '../core/router.js';
import { lineChart } from '../widgets/chart.js';
import { errorNote, note } from '../widgets/controls.js';
import { dataTable } from '../widgets/table.js';
import { channelControls } from './common.js';

const pctTick = (v) => `${Math.round(v * 1000) / 10}%`;

export default {
  id: 'certificates',
  title: 'Certificates',
  icon: 'certificate',
  create(ctx) {
    const cfg = ctx.config;
    const th = cfg.thresholds;
    const { element, body } = viewFrame('certificates', 'What the counts certify', 'certificate',
      'Each certificate is a formula of S and the error rates (QBER: the share of rounds where Alice’s and Bob’s bits differ in the same basis). The curves show where each one switches on; the markers show your latest Bell Lab run, at its point estimate (filled) and at the conservative end of its confidence interval (hollow).');

    const rateChart = lineChart({ title: 'Key rate', x: { min: 0, max: 0.16, label: 'QBER Q' }, y: { min: 0, max: 1, label: 'bits per round' } });
    const entropyChart = lineChart({ title: 'Entropy', x: { min: 2, max: 2.84, label: 'S' }, y: { min: 0, max: 1, label: 'value' } });
    const sweepS = lineChart({ title: 'Sweep', x: { min: 0, max: 0.5, label: 'strength' }, y: { min: 0, max: 2.9, label: 'S' } });
    const sweepQ = lineChart({ title: 'Sweep', x: { min: 0, max: 0.5, label: 'strength' }, y: { min: 0, max: 0.5, label: 'QBER' } });
    const sweepBox = h('div', { class: 'stack' });
    const runNote = h('div');

    const channel = channelControls(cfg, () => refreshSweep(), { kind: 'dephasing', strength: cfg.channels.strength.default });

    const thresholdTable = dataTable({
      caption: 'Where each certificate starts to hold for Werner states (depolarizing noise), computed from the formulas',
      columns: [
        { key: 'name', label: 'Certificate', align: 'text' },
        { key: 'S', label: 'S above', format: (v) => num(v, 4) },
        { key: 'Q', label: 'QBER below', format: (v) => pct(v, 2) },
        { key: 'v', label: 'visibility above', format: (v) => num(v, 4) },
        { key: 'src', label: 'Formula', align: 'text' },
      ],
      rows: [
        { name: 'Bell violation (CHSH)', S: th.chsh.S, Q: th.chsh.Q_werner, v: th.chsh.v_werner, src: 'S > 2 (Clauser et al. 1969)' },
        { name: 'Self-test, non-trivial', S: th.kaniewski.S, Q: th.kaniewski.Q_werner, v: th.kaniewski.v_werner, src: 'Kaniewski 2016, β* = (16+14√2)/17' },
        { name: 'DI key (Acín 2007)', S: th.acin.S_werner, Q: th.acin.Q_werner, v: th.acin.v_werner, src: '1 − h(Q) − h((1+√((S/2)²−1))/2) > 0' },
        { name: 'BBM92 key', S: th.bbm92.S_werner, Q: th.bbm92.Q, v: th.bbm92.v_werner, src: '1 − h(Q_Z) − h(Q_X) > 0' },
        { name: 'Entanglement witness', S: null, Q: null, v: th.witness.v_werner, src: '(⟨XX⟩+⟨ZZ⟩)/2 > 1/2 (trusted devices)' },
      ],
    });

    body.append(
      runNote,
      h('div', { class: 'grid two' },
        h('div', { class: 'card', id: 'cert-rates' }, h('h3', null, icon('key'), 'Key rate against error rate'), rateChart.element),
        h('div', { class: 'card' }, h('h3', null, icon('dice-5'), 'What S alone certifies'), entropyChart.element)),
      h('div', { class: 'card wide' }, h('h3', null, icon('wave-sine'), 'Noise sweep'),
        h('p', { class: 'muted' }, 'Exact predictions for the lab’s fixed settings as the noise grows. Different noise types hurt different certificates: dephasing leaves Q_Z untouched but raises Q_X, so it costs the BBM92 key less than the DI key.'),
        h('div', { class: 'grid' }, h('div', null, channel.elements[0]), h('div', null, sweepBox))),
      h('div', { class: 'card wide' }, h('h3', null, icon('table'), 'Thresholds'), thresholdTable,
        note('', 'These are asymptotic formulas (infinitely many rounds, collective attacks for the DI key). The lab evaluates them at the ends of finite-sample confidence intervals; that is a teaching device, not a finite-size security proof.')),
    );

    let base = null;
    async function refreshBase() {
      base = await ctx.api.theory({ module: 'bell', channel: { kind: 'depolarizing', strength: 0.1 } });
      draw();
    }

    function runMarkers(kind) {
      const rep = ctx.store.get().last.bell;
      if (!rep) return [];
      const a = rep.analysis;
      if (kind === 'rate') {
        const out = [];
        if (a.ladder_point.rate_di_acin !== null) out.push({ x: a.Q_Z.point, y: Math.max(0, a.ladder_point.rate_di_acin), color: 'var(--c3)', shape: 'diamond', legend: 'your run: DI rate (point)' });
        if (a.ladder_conservative.rate_di_acin !== null) out.push({ x: a.Q_Z.high, y: Math.max(0, a.ladder_conservative.rate_di_acin), color: 'var(--c3)', shape: 'diamond', hollow: true, legend: 'your run: DI rate (conservative)' });
        out.push({ x: a.Q_Z.point, y: Math.max(0, a.ladder_point.rate_bbm92), color: 'var(--c1)', shape: 'circle', legend: 'your run: BBM92 rate (point)' });
        out.push({ x: a.Q_Z.high, y: Math.max(0, a.ladder_conservative.rate_bbm92), color: 'var(--c1)', shape: 'circle', hollow: true, legend: 'your run: BBM92 rate (conservative)' });
        return out;
      }
      return [
        { x: Math.min(a.S.point, 2.83), y: a.ladder_point.min_entropy_pironio, color: 'var(--c2)', shape: 'square', legend: 'your run: H_min at S (point)' },
        { x: Math.max(2, a.S.low), y: a.ladder_conservative.min_entropy_pironio, color: 'var(--c2)', shape: 'square', hollow: true, legend: 'your run: H_min at S_low' },
      ];
    }

    function draw() {
      if (!base) return;
      const w = base.werner_rates;
      const rep = ctx.store.get().last.bell;
      runNote.replaceChildren(rep
        ? note('', `Markers show the latest Bell Lab run on ${rep.backend.name}: S = ${num(rep.analysis.S.point)} (low ${num(rep.analysis.S.low)}), Q_Z = ${pct(rep.analysis.Q_Z.point)} (high ${pct(rep.analysis.Q_Z.high)}).`)
        : note('', 'Run the Bell Lab to place your own measurement on these curves.'));
      rateChart.update({
        title: 'Asymptotic key rate against QBER for Werner states',
        desc: `BBM92 rate reaches zero at Q = ${pct(th.bbm92.Q)}; the device-independent rate of Acín et al. reaches zero at Q = ${pct(th.acin.Q_werner)}.`,
        width: 520, height: 300,
        x: { min: 0, max: 0.16, label: 'QBER Q (Werner: Q_Z = Q_X)', format: pctTick, ticks: [0, 0.04, 0.08, 0.12, 0.16] },
        y: { min: 0, max: 1, label: 'key bits per round' },
        series: [
          { name: 'BBM92 (trusted devices)', color: 'var(--c1)', points: w.map((p) => [p.Q, p.rate_bbm92 > 0 ? p.rate_bbm92 : null]) },
          { name: 'DI key (Acín 2007)', color: 'var(--c3)', dash: '7 4', points: w.map((p) => [p.Q, p.rate_di !== null && p.rate_di > 0 ? p.rate_di : null]) },
        ],
        vlines: [{ x: th.acin.Q_werner, label: `DI ${pct(th.acin.Q_werner, 1)}`, color: 'var(--c3)' }, { x: th.bbm92.Q, label: `BBM92 ${pct(th.bbm92.Q, 1)}`, color: 'var(--c1)' }],
        markers: runMarkers('rate'),
        table: {
          summary: 'Data table (every tenth point)',
          caption: 'Werner-state rates',
          columns: [{ key: 'Q', label: 'Q', format: (v) => pct(v) }, { key: 'S', label: 'S', format: (v) => num(v) }, { key: 'b', label: 'BBM92', format: (v) => num(v) }, { key: 'd', label: 'DI', format: (v) => num(v) }],
          rows: w.filter((_, i) => i % 10 === 0).map((p) => ({ Q: p.Q, S: p.S, b: p.rate_bbm92, d: p.rate_di })),
        },
      });
      const sc = base.s_curve;
      entropyChart.update({
        title: 'Device-independent quantities as a function of S',
        desc: 'Min-entropy bound of Pironio et al. 2010, local von Neumann entropy H(A|E) and the Kaniewski self-test extractability bound, for S from 2 to 2 root 2.',
        width: 520, height: 300,
        x: { min: 2, max: 2.84, label: 'CHSH value S', ticks: [2, 2.2, 2.4, 2.6, 2.8], format: (v) => v.toFixed(1) },
        y: { min: 0, max: 1, label: 'bits per round, or extractability' },
        series: [
          { name: 'H_min (Pironio 2010)', color: 'var(--c2)', points: sc.map((p) => [p.S, p.min_entropy]) },
          { name: 'H(A|E), local (Pironio 2009)', color: 'var(--c4)', dash: '7 4', points: sc.map((p) => [p.S, p.von_neumann]) },
          { name: 'Self-test extractability bound (Kaniewski)', color: 'var(--c5)', dash: '2 3', width: 2.6, points: sc.map((p) => [p.S, p.kaniewski]) },
        ],
        vlines: [{ x: th.kaniewski.S, label: 'β*', color: 'var(--c5)' }, { x: th.acin.S_werner, label: 'DI key (Werner)', color: 'var(--c3)' }],
        markers: runMarkers('entropy'),
        table: {
          summary: 'Data table (every tenth point)',
          caption: 'Bounds against S',
          columns: [{ key: 'S', label: 'S', format: (v) => num(v) }, { key: 'm', label: 'H_min', format: (v) => num(v) }, { key: 'v', label: 'H(A|E)', format: (v) => num(v) }, { key: 'k', label: 'Extractability bound', format: (v) => num(v) }],
          rows: sc.filter((_, i) => i % 10 === 0).map((p) => ({ S: p.S, m: p.min_entropy, v: p.von_neumann, k: p.kaniewski })),
        },
      });
    }

    async function refreshSweep() {
      try {
        const req = { module: 'bell', channel: channel.value() };
        if (req.channel.kind === 'none') {
          sweepBox.replaceChildren(note('', 'Choose a noise type to see the sweep.'));
          return;
        }
        const t = await ctx.api.theory(req);
        const c = t.strength_curve;
        const label = req.channel.kind.replace('_', ' ');
        sweepS.update({
          title: `S against ${label} strength`, desc: 'CHSH value predicted for the fixed settings.', width: 520, height: 240,
          x: { min: 0, max: cfg.channels.strength.max, label: `${label} strength` }, y: { min: 0, max: 2.9, label: 'S', ticks: [0, 1, 2, 2.83] },
          series: [{ name: 'S (fixed settings)', color: 'var(--c1)', points: c.map((p) => [p.strength, p.S]) }],
          hlines: [{ y: 2, label: 'local bound' }, { y: th.acin.S_werner, label: 'DI key (Werner)', color: 'var(--c3)' }],
          table: { summary: 'Data table', caption: 'Sweep', columns: [{ key: 'strength', label: 'strength', format: (v) => num(v, 2) }, { key: 'S', label: 'S', format: (v) => num(v) }, { key: 'Q_Z', label: 'Q_Z', format: (v) => pct(v) }, { key: 'Q_X', label: 'Q_X', format: (v) => pct(v) }, { key: 'rate_bbm92', label: 'BBM92', format: (v) => num(v) }, { key: 'rate_di', label: 'DI', format: (v) => num(v) }], rows: c.filter((_, i) => i % 10 === 0) },
        });
        sweepQ.update({
          title: `Error rates and key rates against ${label} strength`, desc: 'Q_Z, Q_X and the two key rates.', width: 520, height: 240,
          x: { min: 0, max: cfg.channels.strength.max, label: `${label} strength` }, y: { min: 0, max: 1, label: 'rate or QBER' },
          series: [
            { name: 'Q_Z', color: 'var(--c2)', points: c.map((p) => [p.strength, p.Q_Z]) },
            { name: 'Q_X', color: 'var(--c4)', dash: '7 4', points: c.map((p) => [p.strength, p.Q_X]) },
            { name: 'BBM92 rate', color: 'var(--c1)', dash: '2 3', width: 2.6, points: c.map((p) => [p.strength, p.rate_bbm92 > 0 ? p.rate_bbm92 : null]) },
            { name: 'DI rate', color: 'var(--c3)', dash: '10 3 2 3', points: c.map((p) => [p.strength, p.rate_di !== null && p.rate_di > 0 ? p.rate_di : null]) },
          ],
        });
        sweepBox.replaceChildren(sweepS.element, sweepQ.element);
      } catch (err) {
        sweepBox.replaceChildren(errorNote(err));
      }
    }

    ctx.store.subscribe((st, prev) => {
      if (st.last.bell !== prev.last.bell) draw();
    });
    let first = true;
    return {
      element,
      async onShow() {
        if (!first) return;
        first = false;
        try {
          await refreshBase();
          await refreshSweep();
        } catch (err) {
          body.prepend(errorNote(err));
        }
      },
    };
  },
};
