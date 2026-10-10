// Bell Lab: one CHSH experiment. The run is ONE job on the injected backend; afterwards the
// five stages of the protocol are replayed from its counts (Run, Pause, Resume, Step, Reset).
import { announce, h, prefersReducedMotion, setDisabled } from '../core/dom.js';
import { int, num, pct } from '../core/format.js';
import { icon } from '../core/icons.js';
import { viewFrame } from '../core/router.js';
import { createMachine } from '../core/statemachine.js';
import { countsChart } from '../widgets/bars.js';
import { button, checkbox, errorNote, note } from '../widgets/controls.js';
import { xzDisc } from '../widgets/disc2d.js';
import { exportBar } from '../widgets/exporter.js';
import { sGauge } from '../widgets/gauge.js';
import { dataTable } from '../widgets/table.js';
import { channelControls, eveControls, ladderTable, qberList, runBlocker, sizeNote, submitRun } from './common.js';

const STAGES = [
  { id: 'distribute', icon: 'atom', title: 'Distribute pairs' },
  { id: 'settings', icon: 'adjustments-horizontal', title: 'Choose settings' },
  { id: 'measure', icon: 'chart-histogram', title: 'Measure' },
  { id: 'estimate', icon: 'filter', title: 'Sift & estimate' },
  { id: 'certify', icon: 'certificate', title: 'Certify' },
];
const TICK_MS = 1100;

export default {
  id: 'lab',
  title: 'Bell Lab',
  icon: 'flask',
  create(ctx) {
    const cfg = ctx.config;
    const { element, body } = viewFrame('lab', 'Bell Lab', 'flask',
      'Prepare |Φ+⟩ pairs, add link noise or an eavesdropper, and measure the six settings in one job. The same counts give the CHSH value S, the error rates of the BBM92 key and every certificate.');

    // ---------- controls ----------
    let previewTimer = null;
    const schedulePreview = () => {
      clearTimeout(previewTimer);
      previewTimer = setTimeout(preview, 350);
    };
    const channel = channelControls(cfg, schedulePreview, { kind: 'depolarizing', strength: cfg.channels.strength.default });
    const eve = eveControls(cfg, schedulePreview);
    const yy = checkbox({ label: 'Also measure YY (direct fidelity)', onChange: schedulePreview,
      hint: 'Adds a seventh setting; with it the fidelity with |Φ+⟩ is measured, not bracketed.' });
    const shotsInput = h('input', { type: 'number', min: cfg.shots.min, max: cfg.shots.max, step: 100, value: ctx.backend.profile.shots ?? cfg.shots.min, id: 'lab-shots' });
    const seedInput = h('input', { type: 'number', min: 0, step: 1, value: cfg.seed, id: 'lab-seed' });
    const request = () => ({
      module: 'bell',
      channel: channel.value(),
      eve: eve.value(),
      include_yy: yy.checked,
      shots: Number(shotsInput.value),
      seed: Number(seedInput.value),
    });
    const predictionBox = h('div', { class: 'small', 'aria-live': 'polite' });
    const sizeBox = h('div');
    const controls = h('div', { class: 'card', id: 'lab-controls' },
      h('h3', null, icon('adjustments-horizontal'), 'Experiment'),
      ...channel.elements, ...eve.elements, yy.element,
      h('div', { class: 'grid', style: { gridTemplateColumns: '1fr 1fr', gap: '0.5rem' } },
        h('div', { class: 'field' }, h('label', { for: 'lab-shots' }, 'Shots per setting'), shotsInput),
        h('div', { class: 'field' }, h('label', { for: 'lab-seed' }, 'Simulator seed'), seedInput)),
      h('h4', null, 'Prediction (exact model)'), predictionBox, sizeBox);

    // ---------- run toolbar and stepper ----------
    const status = h('p', { class: 'muted', role: 'status', id: 'lab-status', tabindex: '-1' }, 'Ready. Press Run to submit one job.');
    const runBtn = button('Run', 'player-play', () => machine.send('RUN'), { primary: true });
    runBtn.id = 'lab-run';
    const pauseBtn = button('Pause', 'player-pause', () => (machine.state === 'paused' ? machine.send('RESUME') : machine.send('PAUSE')));
    const stepBtn = button('Step', 'player-track-next', () => machine.send('STEP'));
    const resetBtn = button('Reset', 'refresh', () => machine.send('RESET'));
    const stepItems = STAGES.map((st) => h('li', { 'data-status': 'todo' },
      h('span', { class: 'head' }, icon(st.icon, { size: 16 }), st.title), h('span', { class: 'muted detail' }, '')));
    const stepper = h('ol', { class: 'stepper', 'aria-label': 'Protocol stages' }, stepItems);
    const runCard = h('div', { class: 'card wide', id: 'lab-run-card' },
      h('div', { class: 'toolbar' }, runBtn, pauseBtn, stepBtn, resetBtn), status, stepper,
      note('', 'The job runs once; the stages then replay its counts so you can follow the protocol. Nothing is re-sampled between stages.'));

    // ---------- results ----------
    const gauge = sGauge({ thresholds: cfg.thresholds });
    const gaugeCard = h('div', { class: 'card', id: 'lab-gauge' }, h('h3', null, icon('ruler-measure'), 'CHSH value S'), gauge.element, h('div', { class: 'small' }));
    const counts = countsChart();
    const countsCard = h('div', { class: 'card', hidden: true }, h('h3', null, icon('chart-histogram'), 'Counts'), counts.element);
    const corrCard = h('div', { class: 'card wide', hidden: true });
    const qberCard = h('div', { class: 'card', hidden: true });
    const ladderCard = h('div', { class: 'card wide', hidden: true, id: 'lab-ladder' });
    const disc = xzDisc();
    const discCard = h('div', { class: 'card' }, h('h3', null, icon('compass'), 'Measurement directions'), disc.element);
    const errorBox = h('div');
    let last = null;
    const exportStatus = h('p', { class: 'muted small', role: 'status' });
    const exports = exportBar(ctx, [
      { label: 'Report JSON', kind: 'json', name: 'bell_lab_report.json', get: () => last },
      { label: 'Settings CSV', kind: 'csv', name: 'bell_lab_settings.csv', get: () => last && settingsCsv(last) },
      { label: 'Gauge PNG', kind: 'png', name: 'bell_lab_gauge.png', get: () => last && gauge.element.querySelector('svg') },
    ], (msg) => { exportStatus.textContent = msg; });

    body.append(
      h('div', { class: 'grid' }, controls, h('div', { class: 'stack' }, gaugeCard, discCard)),
      errorBox, runCard,
      h('div', { class: 'grid' }, countsCard, qberCard),
      corrCard, ladderCard,
      h('div', { class: 'card wide' }, h('h3', null, icon('download'), 'Export'), exports, exportStatus,
        h('p', { class: 'muted small' }, 'Files go to the Qollab run console (this frame cannot download directly).')),
    );

    function settingsCsv(rep) {
      const cols = ['setting', 'alice_deg', 'bob_deg', 'n00', 'n01', 'n10', 'n11', 'N', 'E', 'SE', 'E_predicted'];
      const rows = Object.entries(rep.analysis.settings).map(([id, st]) => ({
        setting: id, alice_deg: st.alice_deg, bob_deg: st.bob_deg, n00: st.n00, n01: st.n01, n10: st.n10, n11: st.n11,
        N: st.N, E: st.E, SE: st.SE, E_predicted: rep.prediction.E[id],
      }));
      return [cols.join(','), ...rows.map((r) => cols.map((c) => r[c] ?? '').join(','))].join('\n');
    }

    function drawDisc() {
      const a = cfg.angles_deg.alice;
      const b = cfg.angles_deg.bob;
      disc.update({
        alice: [{ deg: a.key, short: 'Z', name: 'key' }, { deg: a.x, short: 'X', name: 'X' }, { deg: a.chsh0, short: '+45', name: 'CHSH 0' }, { deg: a.chsh1, short: '−45', name: 'CHSH 1' }],
        bob: [{ deg: b.z, short: 'Z', name: 'Z' }, { deg: b.x, short: 'X', name: 'X' }],
        evePhi: eve.value().enabled ? eve.value().phi_deg : null,
      });
    }

    async function preview() {
      drawDisc();
      try {
        const req = request();
        const [th, circ] = [await ctx.api.theory(req), await ctx.api.circuits(req)];
        const p = th.prediction;
        predictionBox.replaceChildren(h('dl', { class: 'kv' },
          h('dt', null, 'S (these settings)'), h('dd', null, num(p.S_fixed)),
          h('dt', null, 'Q_Z / Q_X'), h('dd', null, `${pct(p.Q_Z)} / ${pct(p.Q_X)}`),
          h('dt', null, 'Fidelity with |Φ+⟩'), h('dd', null, num(p.fidelity)),
          p.eve_guess_helstrom !== undefined && p.eve_guess_helstrom !== null
            ? [h('dt', null, 'Eve guesses Z key bit'), h('dd', null, pct(p.eve_guess_helstrom))] : null));
        const size = sizeNote(ctx, circ);
        sizeBox.replaceChildren(note(size.ok ? '' : 'warn', size.text, 'cpu'));
        sizeOk = size.ok;
        updateRunButton();
      } catch (err) {
        predictionBox.replaceChildren(errorNote(err));
      }
    }

    let sizeOk = true;
    function updateRunButton() {
      const blocker = runBlocker(ctx);
      const busy = machine.state === 'running';
      setDisabled(runBtn, busy || Boolean(blocker) || !sizeOk, status);
      runBtn.title = blocker || (!sizeOk ? 'The experiment is too large for this backend profile' : '');
      if (blocker && !busy) status.textContent = blocker;
    }

    // ---------- state machine ----------
    let stage = -1;
    let timer = null;
    const machine = createMachine({
      initial: 'idle',
      states: {
        idle: { on: { RUN: 'running' } },
        running: { on: { RESULT: 'replay', FAIL: 'error' } },
        replay: { on: { TICK: () => (stage >= STAGES.length - 1 ? 'done' : 'replay'), STEP: () => (stage >= STAGES.length - 1 ? 'done' : 'replay'), PAUSE: 'paused', RESET: 'idle', RUN: 'running' } },
        paused: { on: { RESUME: 'replay', STEP: () => (stage >= STAGES.length - 1 ? 'done' : 'paused'), RESET: 'idle', RUN: 'running' } },
        done: { on: { RUN: 'running', RESET: 'idle' } },
        error: { on: { RUN: 'running', RESET: 'idle' } },
      },
    });

    function showStage(i) {
      stage = i;
      stepItems.forEach((li, k) => {
        li.setAttribute('data-status', k < i ? 'done' : k === i ? 'active' : 'todo');
        if (k === i) li.setAttribute('aria-current', 'step');
        else li.removeAttribute('aria-current');
      });
      if (i === STAGES.length - 1 && machine.state !== 'running') stepItems[i].setAttribute('data-status', 'done');
      const rep = last;
      const a = rep.analysis;
      const detail = (k, text) => { stepItems[k].querySelector('.detail').textContent = text; };
      if (i >= 0) {
        const n = Object.values(a.settings).reduce((t, st) => t + st.N, 0);
        detail(0, `${int(rep.shots)} shots × ${Object.keys(a.settings).length} settings on ${rep.backend.name}`);
        if (i === 0) announce(`Stage 1: ${int(n)} pairs distributed.`);
      }
      if (i >= 1) detail(1, `Alice: 0°, 90°, ±45°. Bob: 0°, 90°.${rep.experiment.include_yy ? ' Plus Y on both sides.' : ''}`);
      if (i >= 2) {
        countsCard.hidden = false;
        counts.update(Object.fromEntries(Object.entries(a.settings).map(([id, st]) => [id, st])));
        detail(2, `${rep.circuits.compiled.length} circuit(s), ${rep.seconds} s`);
      }
      if (i >= 3) {
        gauge.update({ point: a.S.point, low: a.S.low, high: a.S.high, delta: a.delta });
        gaugeCard.lastChild.replaceChildren(sVerdict(a));
        qberCard.hidden = false;
        qberCard.replaceChildren(h('h3', null, icon('key'), 'Error rates (BBM92 sifting)'), qberList(a),
          h('p', { class: 'muted small' }, `Wilson intervals at ${(100 * (1 - a.delta / 2)).toFixed(1)}% each; key basis = Alice 0°, Bob 0°.`));
        corrCard.hidden = false;
        corrCard.replaceChildren(h('h3', null, icon('table'), 'Correlators'), correlatorTable(rep));
        detail(3, `S = ${num(a.S.point)}, Q_Z = ${pct(a.Q_Z.point)}`);
      }
      if (i >= 4) {
        ladderCard.hidden = false;
        ladderCard.replaceChildren(h('h3', null, icon('certificate'), 'Certificates from these counts'), ladderTable(a),
          a.S.outside_quantum_set ? note('warn', 'The estimate of S is above 2√2. No quantum system can do that: it is sampling noise, and the bounds use S capped at 2√2.') : '');
        detail(4, `${a.ladder_conservative.di_certified ? 'DI key certified' : 'no DI key'} at the conservative end`);
        announce(`Done. S equals ${num(a.S.point)}; ${a.S.above_classical ? 'Bell violation confirmed at the conservative end' : 'no conclusive Bell violation'}.`);
      }
    }

    function sVerdict(a) {
      if (a.S.above_classical) return note('good', `S = ${num(a.S.point)}, interval [${num(a.S.low)}, ${num(a.S.high)}]: the conservative end is above 2, so no local (classical) model fits these counts.`, 'check');
      if (a.S.inconclusive) return note('warn', `S = ${num(a.S.point)}, interval [${num(a.S.low)}, ${num(a.S.high)}] contains 2: inconclusive at this number of shots.`);
      return note('', `S = ${num(a.S.point)} is within the local bound.`);
    }

    function correlatorTable(rep) {
      const rows = Object.entries(rep.analysis.settings).map(([id, st]) => ({ id, ...st, pred: rep.prediction.E[id] }));
      return dataTable({
        caption: 'E = (agreements − disagreements) / N per setting; prediction from the exact channel model.',
        columns: [
          { key: 'id', label: 'Setting' },
          { key: 'roles', label: 'Used for', align: 'text', format: (r) => r.join(', ') },
          { key: 'alice_deg', label: 'Alice', format: (v) => (v === null ? 'Y' : `${v}°`) },
          { key: 'bob_deg', label: 'Bob', format: (v) => (v === null ? 'Y' : `${v}°`) },
          { key: 'N', label: 'N', format: int },
          { key: 'E', label: 'E measured', format: (v) => num(v) },
          { key: 'SE', label: '± SE', format: (v) => num(v) },
          { key: 'pred', label: 'E predicted', format: (v) => num(v) },
        ],
        rows,
      });
    }

    function clearResults() {
      stage = -1;
      stepItems.forEach((li) => { li.setAttribute('data-status', 'todo'); li.removeAttribute('aria-current'); li.querySelector('.detail').textContent = ''; });
      [countsCard, qberCard, corrCard, ladderCard].forEach((c) => { c.hidden = true; });
      gauge.update(null);
      gaugeCard.lastChild.replaceChildren();
    }

    machine.subscribe(async (state, prev, event) => {
      clearInterval(timer);
      setDisabled(pauseBtn, !(state === 'replay' || state === 'paused'), status);
      pauseBtn.replaceChildren(icon(state === 'paused' ? 'player-play' : 'player-pause'), state === 'paused' ? 'Resume' : 'Pause');
      setDisabled(stepBtn, !(state === 'replay' || state === 'paused'), status);
      setDisabled(resetBtn, state === 'running' || state === 'idle', status);
      if (state !== 'running') updateRunButton();
      if (state === 'running') {
        clearResults();
        errorBox.replaceChildren();
        status.textContent = `Submitting one job to ${ctx.backend.name}…`;
        updateRunButton();
        last = null;
        try {
          last = await submitRun(ctx, request());
          machine.send('RESULT');
        } catch (err) {
          errorBox.replaceChildren(errorNote(err));
          machine.send('FAIL');
        }
      } else if (state === 'replay') {
        if (event === 'RESULT') {
          status.textContent = `Job finished in ${last.seconds} s (${last.layout === 'packed_single_circuit' ? 'one packed circuit' : `${last.circuits.compiled.length} circuits`}, canary ${pct(last.canary_fraction, 0)} correct). Replaying the stages…`;
          if (prefersReducedMotion()) {
            showStage(STAGES.length - 1);
            machine.send('TICK');
            return;
          }
          showStage(0);
        } else if (event === 'STEP' || event === 'TICK') {
          showStage(stage + 1);
        }
        timer = setInterval(() => machine.send('TICK'), TICK_MS);
      } else if (state === 'paused') {
        if (event === 'STEP') showStage(stage + 1);
        status.textContent = `Paused at stage ${stage + 1} of ${STAGES.length}.`;
      } else if (state === 'done') {
        if (event === 'STEP' || event === 'TICK') showStage(STAGES.length - 1);
        status.textContent = `Done: ${last.backend.name}, ${int(last.shots)} shots per setting, ${last.seconds} s.`;
        updateRunButton();
      } else if (state === 'idle') {
        clearResults();
        errorBox.replaceChildren();
        last = null;
        status.textContent = 'Ready. Press Run to submit one job.';
        updateRunButton();
      } else if (state === 'error') {
        status.textContent = 'The run did not complete; see the message above.';
        updateRunButton();
      }
    });

    pauseBtn.disabled = true;
    stepBtn.disabled = true;
    resetBtn.disabled = true;
    ctx.store.subscribe((st, prev) => {
      if (st.ionqJobsUsed !== prev.ionqJobsUsed || st.jobInFlight !== prev.jobInFlight) updateRunButton();
    });
    let first = true;

    return {
      element,
      async onShow() {
        if (first) {
          first = false;
          await preview();
          gauge.update(null);
        }
        updateRunButton();
      },
      // used by the guided tour
      async configure({ channel: ch, eve: ev, include_yy: y }) {
        if (ch) channel.set(ch);
        if (ev) eve.set(ev);
        if (y !== undefined) yy.set(y);
        await preview();
      },
      async runAndFinish() {
        if (runBtn.disabled) return runBtn.title || 'Run is not available in this session';
        const finished = new Promise((resolve) => {
          const off = machine.subscribe((st) => {
            if (st === 'replay') {
              showStage(STAGES.length - 1);
              machine.send('TICK');
            }
            if (st === 'done' || st === 'error') {
              off();
              resolve(st);
            }
          });
        });
        if (!machine.send('RUN')) return 'Run is not available right now';
        const outcome = await finished;
        if (outcome === 'error' || !last) return 'The run did not complete; see the message in the Bell Lab.';
        return `S = ${num(last.analysis.S.point)} (interval ${num(last.analysis.S.low)} to ${num(last.analysis.S.high)}), Q_Z = ${pct(last.analysis.Q_Z.point)}.`;
      },
      get lastReport() {
        return last;
      },
    };
  },
};
