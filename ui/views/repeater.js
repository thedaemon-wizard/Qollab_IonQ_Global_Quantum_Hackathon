// Repeater: entanglement swapping across n links (deferred Bell measurements + Pauli frame) and
// one round of purification with post-selection. One job per run, like the Bell Lab.
import { h, setDisabled } from '../core/dom.js';
import { int, num, pct } from '../core/format.js';
import { icon } from '../core/icons.js';
import { viewFrame } from '../core/router.js';
import { tm } from '../core/tex.js';
import { lineChart } from '../widgets/chart.js';
import { button, errorNote, note, select, slider } from '../widgets/controls.js';
import { flowDiagram } from '../widgets/diagram.js';
import { swimlane } from '../widgets/swimlane.js';
import { dataTable } from '../widgets/table.js';
import { CHANNELS, channelControls, ladderTable, qberList, runBlocker, sizeNote, submitRun } from './common.js';

function topology(hops) {
  const nodes = [];
  const edges = [];
  const W = 900;
  const gap = (W - 20) / hops;
  const names = ['Alice', ...Array.from({ length: hops - 1 }, (_, i) => `Repeater ${i + 1}`), 'Bob'];
  names.forEach((name, i) => {
    const x = 10 + i * gap - (i === 0 ? 0 : i === hops ? 120 : 60);
    nodes.push({ id: `n${i}`, x, y: 120, w: 120, h: 62, icon: i === 0 || i === hops ? 'user' : 'building-broadcast-tower', title: name,
      sub: i === 0 || i === hops ? 'measures' : 'Bell measurement\nsends 2 bits', tone: i === 0 || i === hops ? 'var(--c1)' : 'var(--c4)' });
  });
  for (let k = 0; k < hops; k += 1) {
    const x = 10 + (k + 0.5) * gap - 60;
    nodes.push({ id: `s${k}`, x, y: 10, w: 120, h: 40, icon: 'atom', title: `source ${k + 1}`, tone: 'var(--c2)' });
    edges.push({ from: `s${k}`, to: `n${k}`, fromSide: 'bottom', toSide: 'top', route: 'elbow-v', label: k === 0 ? 'link + noise' : '' });
    edges.push({ from: `s${k}`, to: `n${k + 1}`, fromSide: 'bottom', toSide: 'top', route: 'elbow-v' });
  }
  for (let r = 1; r < hops; r += 1) {
    edges.push({ from: `n${r}`, to: `n${hops}`, fromSide: 'bottom', toSide: 'bottom', route: 'under', offset: 14 + 12 * r, dash: '5 3', color: 'var(--c4)', label: r === 1 ? 'Pauli-frame bits (classical)' : '', labelAt: [W / 2, 196 + 12 * hops] });
  }
  return flowDiagram({
    width: W, height: 210 + 12 * hops,
    minWidth: Math.round((W * 10) / 11), // labels of 11 units stay at 10 px or more on screen
    title: `Repeater chain with ${hops} link${hops > 1 ? 's' : ''}`,
    desc: `Each of the ${hops} links has its own pair source and the same noise. ${hops > 1 ? `The ${hops - 1} repeater(s) perform a Bell measurement on the two qubits they hold and send the two result bits to Bob, who corrects his outcome in software (a Pauli frame).` : 'With one link there is no repeater.'}`,
    nodes, edges,
    caption: 'Bell measurements are deferred to the end of the circuit and their bits corrected in software (IonQ targets do not run mid-circuit feedback); the statistics are the same.',
  });
}

function timeline(hops) {
  const lanes = ['Alice', ...Array.from({ length: hops - 1 }, (_, i) => `R${i + 1}`), 'Bob'];
  const steps = [];
  const messages = [];
  lanes.forEach((_, i) => steps.push({ lane: i, t: 0, label: 'receive half-pair', phase: 'distribute', color: 'var(--c2)' }));
  for (let r = 1; r < hops; r += 1) {
    steps.push({ lane: r, t: 1, label: 'Bell measure', phase: 'swap', color: 'var(--c4)' });
    messages.push({ from: r, to: hops, t0: 1, t1: 2, label: r === 1 ? '2 bits' : '' });
  }
  steps.push({ lane: 0, t: 2, label: 'measure (basis)', phase: 'measure', color: 'var(--c1)' });
  steps.push({ lane: hops, t: 2, label: 'measure + frame', phase: 'measure', color: 'var(--c1)' });
  steps.push({ lane: 0, t: 3, label: 'estimate S, Q', phase: 'estimate', color: 'var(--c3)' });
  steps.push({ lane: hops, t: 3, label: 'estimate S, Q', phase: 'estimate', color: 'var(--c3)' });
  messages.push({ from: 0, to: hops, t0: 2, t1: 3, label: 'bases, sample' });
  return swimlane({
    title: 'Order of events in one round',
    desc: 'All nodes receive half-pairs; repeaters perform Bell measurements and send two bits each to Bob; Alice and Bob measure, Bob applies the Pauli frame, and they compare a sample to estimate S and the error rates.',
    lanes, steps, messages,
    caption: 'Dashed arrows are classical messages. Bob can measure before the frame bits arrive; the correction is applied to his recorded bit.',
  });
}

export default {
  id: 'repeater',
  title: 'Repeater',
  icon: 'route',
  create(ctx) {
    const cfg = ctx.config;
    const level = `${(100 * (1 - cfg.confidence.delta / 2)).toFixed(1)}%`;
    // Data table under each chart: predicted values and measured points with their intervals.
    const pointsTable = (caption, valueLabel, ...groups) => ({
      summary: 'Data table', caption,
      columns: [
        { key: 'what', label: 'Series', align: 'text' }, { key: 'hops', label: 'Links' },
        { key: 'v', label: valueLabel, format: (v) => num(v) },
        { key: 'lo', label: `${level} interval`, format: (v, r) => (v === undefined ? '—' : `[${num(r.lo)}, ${num(r.hi)}]`) },
      ],
      rows: groups.flat(),
    });
    const th = cfg.thresholds;
    const { element, body } = viewFrame('repeater', 'Stretching the link: swapping and purification', 'route',
      'Split the distance into links joined by entanglement swapping, and see how the noise of every link adds up. Then try one round of purification, which trades pairs for quality.');

    let timer = null;
    const schedule = () => { clearTimeout(timer); timer = setTimeout(refresh, 300); };
    const hops = slider({ label: 'Number of links', min: cfg.chain.hops.min, max: cfg.chain.hops.max, step: 1, value: cfg.chain.hops.default, format: (v) => String(v), onInput: schedule });
    const channel = channelControls(cfg, schedule, { kind: 'depolarizing', strength: 0.05 });
    const rotation = select({ label: 'Purification rotation', options: [{ value: 'none', label: 'No rotation (BBPSSW recurrence, no twirl)' }, { value: 'dejmps', label: 'DEJMPS (Rx ±π/2 first)' }], value: 'dejmps', onChange: schedule });

    const topoBox = h('div');
    const timeBox = h('div');
    const sizeBox = h('div');
    const purSizeBox = h('div');
    const budgetBox = h('div');
    const chartS = lineChart({ title: 'S', x: { min: 1, max: 4, label: 'links' }, y: { min: 0, max: 2.9, label: 'S' } });
    const chartQ = lineChart({ title: 'Q', x: { min: 1, max: 4, label: 'links' }, y: { min: 0, max: 0.5, label: 'Q' } });
    const chainStatus = h('p', { class: 'muted', role: 'status', tabindex: '-1' }, 'Ready.');
    const chainResult = h('div', { class: 'stack' });
    const purStatus = h('p', { class: 'muted', role: 'status', tabindex: '-1' }, 'Ready.');
    const purResult = h('div', { class: 'stack' });
    const purTheory = h('div');
    const chainRun = button('Run the chain', 'player-play', () => runChain(), { primary: true });
    chainRun.id = 'rep-run';
    const purRun = button('Run purification', 'player-play', () => runPurify(), { primary: true });
    const measured = [];
    const recordedBox = h('div');
    // Each status line keeps its own message; a run blocker from another view is shown over it
    // only while it lasts (updateButtons puts the own message back).
    const ownStatus = new Map([[chainStatus, chainStatus.textContent], [purStatus, purStatus.textContent]]);
    const setStatus = (el, text) => { ownStatus.set(el, text); el.textContent = text; };

    body.append(
      h('div', { class: 'grid' },
        h('div', { class: 'card', id: 'rep-controls' }, h('h3', null, icon('adjustments-horizontal'), 'Chain'), hops.element, ...channel.elements,
          h('p', { class: 'muted small' }, 'The same noise acts on Bob’s side of every link.'), sizeBox,
          h('div', { class: 'toolbar' }, chainRun), chainStatus),
        h('div', { class: 'card' }, h('h3', null, icon('table'), 'Link budget (exact model)'), budgetBox)),
      h('div', { class: 'card wide' }, h('h3', null, icon('topology-ring'), 'Topology'), topoBox),
      h('div', { class: 'card wide' }, h('h3', null, icon('timeline'), 'Timeline'), timeBox),
      h('div', { class: 'grid two' },
        h('div', { class: 'card' }, h('h3', null, icon('chart-line'), 'CHSH value against links'), chartS.element),
        h('div', { class: 'card' }, h('h3', null, icon('chart-line'), 'Error rates against links'), chartQ.element)),
      recordedBox,
      chainResult,
      h('div', { class: 'card wide', id: 'rep-purify' }, h('h3', null, icon('filter'), 'One round of purification'),
        h('p', null, 'Two noisy pairs go in. Alice and Bob apply CNOTs between them, measure the second pair in Z and keep the first pair only when their two results agree. With the DEJMPS rotation the step also handles phase errors.'),
        h('div', { class: 'grid' }, h('div', null, rotation.element, purSizeBox, h('div', { class: 'toolbar' }, purRun), purStatus), purTheory),
        note('', 'Post-selection: statistics are computed on kept rounds only, and the lab assumes the keep/discard decision does not depend on the measurement settings (as in an event-ready scheme).'),
        purResult),
    );

    let recordedChains = null;
    async function loadRecorded() {
      if (recordedChains) return;
      try {
        const data = await ctx.api.recorded();
        recordedChains = (data.runs || []).filter((r) => r.experiment.module === 'chain').map((r) => {
          const a = r.analysis;
          const ch = r.request.channel || { kind: 'none', strength: 0 };
          return { kind: ch.kind, strength: ch.kind === 'none' ? 0 : ch.strength, hops: r.experiment.hops, S: a.S.point, S_low: a.S.low, S_high: a.S.high, Q_Z: a.Q_Z.point, Q_Z_low: a.Q_Z.low, Q_Z_high: a.Q_Z.high, label: r.origin ? r.origin.device_label : r.backend.name };
        });
      } catch {
        recordedChains = [];
      }
    }

    // A measured result belongs to the settings it ran with: name them in its heading and mark the
    // card once the settings change, so a paused screen never pairs old numbers with new settings.
    const noiseText = (ch) => (ch.kind === 'none' ? 'no added noise'
      : `${CHANNELS.find((c) => c.value === ch.kind).label.replace(/^./, (c) => c.toLowerCase())} ${ch.strength.toFixed(2)}`);
    const shown = new Map(); // result element -> settings key of its run
    function markStale() {
      const now = new Map([[chainResult, JSON.stringify({ hops: hops.value, ch: channel.value() })],
        [purResult, JSON.stringify({ rot: rotation.value, ch: channel.value() })]]);
      for (const [el, key] of shown) {
        const card = el.firstElementChild;
        if (!card) continue;
        const stale = key !== now.get(el);
        card.classList.toggle('stale', stale);
        let msg = card.querySelector(':scope > .stale-note');
        if (stale && !msg) {
          msg = h('p', { class: 'stale-note small' }, icon('alert-triangle'),
            `Measured with the earlier settings named above; press ${el === chainResult ? 'Run the chain' : 'Run purification'} to measure the current ones.`);
          card.firstElementChild.after(msg);
        } else if (!stale && msg) msg.remove();
      }
    }

    async function refresh() {
      await loadRecorded();
      markStale();
      const n = hops.value;
      topoBox.replaceChildren(topology(n).element);
      timeBox.replaceChildren(timeline(n));
      try {
        const reqChain = { module: 'chain', hops: n, channel: channel.value() };
        const reqPur = { module: 'purify', rotation: rotation.value, channel: channel.value() };
        const t = await ctx.api.theory(reqChain);
        const circ = await ctx.api.circuits(reqChain);
        const circP = await ctx.api.circuits(reqPur);
        const tp = await ctx.api.theory(reqPur);
        const size = sizeNote(ctx, circ);
        sizeBox.replaceChildren(note(size.ok ? '' : 'warn', size.text, 'cpu'));
        const sizeP = sizeNote(ctx, circP);
        purSizeBox.replaceChildren(note(sizeP.ok ? '' : 'warn', sizeP.text, 'cpu'));
        sizeOk = { chain: size.ok, purify: sizeP.ok };
        updateButtons();
        const hc = t.hops_curve;
        budgetBox.replaceChildren(dataTable({
          caption: channel.value().kind === 'none' ? 'Predicted with no added link noise (a noise-model backend adds its own)' : `Predicted for ${channel.value().kind.replace('_', ' ')} noise of strength ${num(channel.value().strength, 2)} per link`,
          columns: [
            { key: 'hops', label: 'Links' }, { key: 'S', label: 'S', format: (v) => num(v) },
            { key: 'Q_Z', label: 'Q_Z', format: (v) => pct(v) }, { key: 'Q_X', label: 'Q_X', format: (v) => pct(v) },
            { key: 'rate_bbm92', label: 'BBM92', format: (v) => (v > 0 ? num(v) : 'none') },
            { key: 'rate_di', label: 'DI key', format: (v) => (v !== null && v > 0 ? num(v) : 'none') },
            { key: 'S', label: 'Bell', format: (v) => (v > 2 ? 'yes' : 'no') },
          ],
          rows: hc,
        }));
        const same = (m) => m.kind === channel.value().kind && Math.abs(m.strength - (channel.value().strength || 0)) < 1e-9;
        const marks = measured.filter(same);
        const rec = recordedChains.filter(same);
        const recMarksS = rec.map((m, i) => ({ x: m.hops - 0.06, y: m.S, ylo: m.S_low, yhi: m.S_high, color: 'var(--c3)', shape: 'diamond', legend: i === 0 ? 'recorded runs (noise-model backends)' : null }));
        const recMarksQ = rec.map((m, i) => ({ x: m.hops - 0.06, y: m.Q_Z, ylo: m.Q_Z_low, yhi: m.Q_Z_high, color: 'var(--c3)', shape: 'diamond', legend: i === 0 ? 'recorded Q_Z' : null }));
        recordedBox.replaceChildren(rec.length ? note('', tm`Recorded runs for this noise setting: ${rec.map((m) => `${m.label}, ${m.hops} links, $S$ = ${num(m.S)} [${num(m.S_low)}, ${num(m.S_high)}]`).join('; ')}.`) : '');
        chartS.update({
          title: 'CHSH value against number of links', desc: 'Predicted S for 1 to 4 links, with measured runs as points.', width: 480, height: 260,
          x: { min: 0.8, max: cfg.chain.hops.max + 0.2, label: 'links', ticks: [1, 2, 3, 4], format: (v) => String(v) },
          y: { min: 0, max: 2.9, label: 'S', ticks: [0, 1, 2, 2.83], format: (v) => v.toFixed(2) },
          series: [{ name: 'predicted', color: 'var(--c1)', marker: 'circle', markEvery: 1, points: hc.map((p) => [p.hops, p.S]) }],
          hlines: [{ y: 2, label: 'local bound' }, { y: th.acin.S_werner, label: 'DI key (Werner)', color: 'var(--c3)' }],
          markers: [...marks.map((m, i) => ({ x: m.hops + 0.06, y: m.S, ylo: m.S_low, yhi: m.S_high, color: 'var(--c2)', shape: 'square', legend: i === 0 ? `this session (${level} interval)` : null })), ...recMarksS],
          table: pointsTable('S against the number of links', 'S', hc.map((p) => ({ what: 'predicted', hops: p.hops, v: p.S })),
            marks.map((m) => ({ what: 'this session', hops: m.hops, v: m.S, lo: m.S_low, hi: m.S_high })),
            rec.map((m) => ({ what: `recorded: ${m.label}`, hops: m.hops, v: m.S, lo: m.S_low, hi: m.S_high }))),
        });
        chartQ.update({
          title: 'Error rates against number of links', desc: 'Predicted Q_Z and Q_X for 1 to 4 links, with measured runs.', width: 480, height: 260,
          x: { min: 0.8, max: cfg.chain.hops.max + 0.2, label: 'links', ticks: [1, 2, 3, 4], format: (v) => String(v) },
          y: { min: 0, max: 0.5, label: 'QBER', format: (v) => `${Math.round(v * 100)}%` },
          series: [
            { name: 'Q_Z predicted', color: 'var(--c2)', marker: 'square', markEvery: 1, points: hc.map((p) => [p.hops, p.Q_Z]) },
            { name: 'Q_X predicted', color: 'var(--c4)', dash: '7 4', marker: 'triangle', markEvery: 1, points: hc.map((p) => [p.hops, p.Q_X]) },
          ],
          hlines: [{ y: th.bbm92.Q, label: 'BBM92 limit (Werner)', color: 'var(--c1)' }],
          markers: [...marks.map((m, i) => ({ x: m.hops + 0.06, y: m.Q_Z, ylo: m.Q_Z_low, yhi: m.Q_Z_high, color: 'var(--c2)', shape: 'square', hollow: true, legend: i === 0 ? 'this session Q_Z' : null })), ...recMarksQ],
          table: pointsTable('Error rates against the number of links', 'QBER',
            hc.flatMap((p) => [{ what: 'Q_Z predicted', hops: p.hops, v: p.Q_Z }, { what: 'Q_X predicted', hops: p.hops, v: p.Q_X }]),
            marks.map((m) => ({ what: 'Q_Z this session', hops: m.hops, v: m.Q_Z, lo: m.Q_Z_low, hi: m.Q_Z_high })),
            rec.map((m) => ({ what: `Q_Z recorded: ${m.label}`, hops: m.hops, v: m.Q_Z, lo: m.Q_Z_low, hi: m.Q_Z_high }))),
        });
        const pt = tp.purification;
        purTheory.replaceChildren(dataTable({
          caption: `Predicted for the same link noise (input fidelity ${num(tp.input_fidelity)})`,
          columns: [
            { key: 'name', label: 'Rotation' }, { key: 'P_success', label: 'kept', format: (v) => (v === null || v === undefined ? '—' : pct(v, 1)) },
            { key: 'fidelity', label: 'fidelity after', format: (v) => num(v) }, { key: 'S', label: 'S after', format: (v) => num(v) },
          ],
          rows: Object.entries(pt).map(([name, v]) => ({ name, ...v })),
        }));
      } catch (err) {
        sizeBox.replaceChildren(errorNote(err));
      }
    }

    async function runGeneric(req, statusEl, resultEl, title) {
      resultEl.replaceChildren();
      shown.delete(resultEl);
      busy = true;
      lastRun = statusEl;
      setStatus(statusEl, `Submitting one job to ${ctx.backend.name}…`);
      setDisabled(chainRun, true, statusEl);
      setDisabled(purRun, true, statusEl);
      try {
        const rep = await submitRun(ctx, req);
        setStatus(statusEl, `Done in ${rep.seconds} s on ${rep.backend.name} (${int(rep.shots)} shots per setting).`);
        const a = rep.analysis;
        const kept = rep.purification
          ? note('', `Kept ${int(rep.purification.kept)} of ${int(rep.purification.total)} rounds (${pct(rep.purification.P_success_measured, 1)}); predicted ${pct(rep.prediction.P_success, 1)}.`)
          : '';
        resultEl.append(h('div', { class: 'card wide' }, h('h3', null, icon('chart-dots'), title),
          h('div', { class: 'grid' },
            h('dl', { class: 'kv' },
              h('dt', null, 'S measured'), h('dd', null, `${num(a.S.point)}  [${num(a.S.low)}, ${num(a.S.high)}]`),
              h('dt', null, 'S predicted'), h('dd', null, num(rep.prediction.S_fixed)),
              h('dt', null, 'Fidelity predicted'), h('dd', null, num(rep.prediction.fidelity))),
            qberList(a)),
          kept, ladderTable(a, {
            label: `Table: certificates from the ${req.module === 'purify' ? 'purification' : 'chain'} run`,
            postSelected: Boolean(rep.purification),
          })));
        shown.set(resultEl, JSON.stringify(req.module === 'purify' ? { rot: req.rotation, ch: req.channel } : { hops: req.hops, ch: req.channel }));
        return rep;
      } catch (err) {
        setStatus(statusEl, 'The run did not complete.');
        resultEl.append(errorNote(err));
        return null;
      } finally {
        busy = false;
        await refresh();
      }
    }

    async function runChain() {
      const req = { module: 'chain', hops: hops.value, channel: channel.value() };
      const rep = await runGeneric(req, chainStatus, chainResult, `Measured: ${req.hops} link${req.hops > 1 ? 's' : ''}, ${noiseText(req.channel)}`);
      if (rep) {
        const a = rep.analysis;
        measured.push({ kind: req.channel.kind, strength: req.channel.strength, hops: req.hops, S: a.S.point, S_low: a.S.low, S_high: a.S.high, Q_Z: a.Q_Z.point, Q_Z_low: a.Q_Z.low, Q_Z_high: a.Q_Z.high });
        await refresh();
      }
      return rep;
    }

    async function runPurify() {
      const req = { module: 'purify', rotation: rotation.value, channel: channel.value() };
      return runGeneric(req, purStatus, purResult, `Measured: purification (${req.rotation}), ${noiseText(req.channel)}`);
    }

    let sizeOk = { chain: false, purify: false };
    let busy = false; // this view's own job is running: it is not "another job"
    let lastRun = null; // the status line that reports this view's last run; it keeps its result
    function updateButtons() {
      const blocker = busy ? null : runBlocker(ctx);
      setDisabled(chainRun, busy || Boolean(blocker) || !sizeOk.chain, chainStatus);
      setDisabled(purRun, busy || Boolean(blocker) || !sizeOk.purify, purStatus);
      chainRun.title = blocker || (sizeOk.chain ? '' : 'Too large for this backend profile');
      purRun.title = blocker || (sizeOk.purify ? '' : 'Too large for this backend profile');
      for (const el of [chainStatus, purStatus]) {
        const text = blocker && el !== lastRun ? blocker : ownStatus.get(el);
        if (el.textContent !== text) el.textContent = text;
      }
    }
    ctx.store.subscribe((st, prev) => {
      if (st.ionqJobsUsed !== prev.ionqJobsUsed || st.jobInFlight !== prev.jobInFlight) updateButtons();
    });
    chainRun.disabled = true;
    purRun.disabled = true;
    let first = true;
    return {
      element,
      async onShow() {
        if (first) { first = false; await refresh(); }
      },
      async configure({ hops: n, channel: ch }) {
        if (n) hops.set(n);
        if (ch) channel.set(ch);
        await refresh();
      },
      async runChain() {
        if (chainRun.disabled) return chainRun.title || runBlocker(ctx) || 'This chain is too large for the current backend profile.';
        const rep = await runChain();
        return rep ? `Measured S = ${num(rep.analysis.S.point)} over ${rep.experiment.hops} links (predicted ${num(rep.prediction.S_fixed)}).` : null;
      },
    };
  },
};
