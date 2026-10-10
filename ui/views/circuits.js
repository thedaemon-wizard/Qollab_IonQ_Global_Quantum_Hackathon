// Backends and circuits: the circuits a run submits (as a diagram or Qiskit's own text drawing),
// how they are laid out for the injected backend, and how runs on different backends compare.
import { h } from '../core/dom.js';
import { int, num, pct } from '../core/format.js';
import { icon } from '../core/icons.js';
import { viewFrame } from '../core/router.js';
import { lineChart } from '../widgets/chart.js';
import { circuitFigure } from '../widgets/circuit_svg.js';
import { checkbox, errorNote, note, select, slider } from '../widgets/controls.js';
import { exportBar } from '../widgets/exporter.js';
import { dataTable } from '../widgets/table.js';

const MODULES = [
  { value: 'bell', label: 'Bell test (6 settings)' },
  { value: 'chain', label: 'Repeater chain' },
  { value: 'purify', label: 'Purification' },
];

function channelText(rep) {
  const ch = (rep.request && rep.request.channel) || { kind: 'none' };
  const noise = ch.kind === 'none' || ch.kind === undefined ? 'no noise' : `${ch.kind.replace('_', ' ')} ${num(ch.strength, 2)}`;
  return rep.experiment.eve_phi_deg !== null ? `${noise}, Eve ${rep.experiment.eve_phi_deg}\u00b0` : noise;
}

export default {
  id: 'circuits',
  title: 'Backends & circuits',
  icon: 'cpu',
  create(ctx) {
    const cfg = ctx.config;
    const prof = ctx.backend.profile;
    const { element, body } = viewFrame('circuits', 'Backends and circuits', 'cpu',
      'Every run is one job. This view shows the circuits in it, how they are packed for the backend Qollab injected, and how runs on different simulators compare.');

    let timer = null;
    const schedule = () => { clearTimeout(timer); timer = setTimeout(load, 250); };
    const module = select({ label: 'Experiment', options: MODULES, value: 'bell', onChange: schedule });
    const hops = slider({ label: 'Links (chain only)', min: cfg.chain.hops.min, max: cfg.chain.hops.max, step: 1, value: 2, format: String, onInput: schedule });
    const noise = checkbox({ label: 'Include link noise (two ancillas per link)', checked: true, onChange: schedule });
    const eve = checkbox({ label: 'Include the eavesdropper (Bell test only)', checked: false, onChange: schedule });
    const unitSel = h('select', { id: 'circ-unit' });
    unitSel.addEventListener('change', () => draw());
    let mode = 'diagram';
    const modeBtns = ['diagram', 'text'].map((m) => {
      const b = h('button', { class: 'btn', type: 'button', 'aria-pressed': String(m === mode) }, icon(m === 'diagram' ? 'hierarchy' : 'list-details'), m === 'diagram' ? 'Diagram' : 'Qiskit text');
      b.addEventListener('click', () => { mode = m; modeBtns.forEach((x, i) => x.setAttribute('aria-pressed', String(['diagram', 'text'][i] === mode))); draw(); });
      return b;
    });
    const drawBox = h('div', { class: 'circuit', id: 'circ-drawing' });
    const sizeBox = h('div');
    const compileBox = h('div');
    const compareBox = h('div', { class: 'stack' });
    const exportStatus = h('p', { class: 'muted small', role: 'status' });
    let data = null;

    const backendCard = h('div', { class: 'card' }, h('h3', null, icon('server'), `Injected backend: ${ctx.backend.name}`),
      h('dl', { class: 'kv' },
        h('dt', null, 'Run profile'), h('dd', null, prof.label),
        ...(prof.refuse ? [] : [
          h('dt', null, 'Shots per setting'), h('dd', null, String(prof.shots)),
          h('dt', null, 'Layout'), h('dd', null, prof.layout === 'packed_single_circuit' ? 'all settings packed into ONE circuit' : 'one circuit per setting, all in one job'),
          h('dt', null, 'Transpilation'), h('dd', null, prof.transpile === 'backend' ? `to the backend’s target (optimisation level ${prof.opt_level})` : `to the basis ${prof.basis_gates.join(', ')} (level ${prof.opt_level})`),
          h('dt', null, 'Qubit limit'), h('dd', null, String(prof.max_qubits)),
          h('dt', null, 'Seeded'), h('dd', null, prof.seed_option ? `yes (${prof.seed_option})` : 'no (results vary run to run)'),
        ])),
      prof.refuse ? note('bad', prof.refuse_reason) : null,
      note('', 'Every job also carries a "canary": one qubit flipped to 1. If the backend returned bits in an unexpected order, the canary would read wrong and the run would stop instead of reporting nonsense.'),
      prof.layout === 'packed_single_circuit'
        ? note('', 'Packed layout: each setting has its own qubits and its own classical register. Qiskit returns one bit string per shot with the registers separated by spaces, last register first; the decoder reads each register at its known offset.')
        : null);

    body.append(
      h('div', { class: 'grid' },
        h('div', { class: 'card', id: 'circ-controls' }, h('h3', null, icon('adjustments-horizontal'), 'Which circuits'), module.element, hops.element, noise.element, eve.element, sizeBox),
        backendCard),
      h('div', { class: 'card wide' }, h('h3', null, icon('hierarchy'), 'Circuit'),
        h('div', { class: 'toolbar' }, h('label', { for: 'circ-unit' }, 'Setting'), unitSel, h('span', { class: 'spacer' }), ...modeBtns),
        drawBox),
      h('div', { class: 'card wide' }, h('h3', null, icon('cpu'), 'Last run: circuits before and after transpilation'), compileBox),
      h('div', { class: 'card wide', id: 'circ-compare' }, h('h3', null, icon('chart-dots'), 'Compare backends'), compareBox,
        exportBar(ctx, [{ label: 'All runs JSON', kind: 'json', name: 'bell_lab_runs.json', get: () => (ctx.store.get().runs.length ? ctx.store.get().runs : null) }],
          (msg) => { exportStatus.textContent = msg; }), exportStatus),
    );

    function request() {
      const m = module.value;
      const ch = noise.checked ? { kind: 'depolarizing', strength: 0.05 } : { kind: 'none' };
      if (m === 'chain') return { module: 'chain', hops: hops.value, channel: ch };
      if (m === 'purify') return { module: 'purify', rotation: 'dejmps', channel: ch };
      return { module: 'bell', channel: ch, eve: { enabled: eve.checked, phi_deg: 90 } };
    }

    async function load() {
      try {
        data = await ctx.api.circuits(request());
        const keep = unitSel.value;
        unitSel.replaceChildren(...data.units.map((u) => h('option', { value: u.name, selected: u.name === keep }, `${u.setting} (${u.num_qubits} qubits)`)));
        const largest = Math.max(...data.units.map((u) => u.num_qubits));
        const ok = prof.refuse ? false : (prof.layout === 'packed_single_circuit' ? data.packed_qubits : largest) <= prof.max_qubits;
        sizeBox.replaceChildren(note(ok ? '' : 'warn',
          `${data.units.length} settings. One circuit per setting: largest ${largest} qubits. Packed into one circuit (IonQ layout): ${data.packed_qubits} qubits including the canary.${prof.refuse ? '' : ` This backend’s profile allows ${prof.max_qubits}.`}`, 'cpu'));
        draw();
      } catch (err) {
        drawBox.replaceChildren(errorNote(err));
      }
    }

    function draw() {
      if (!data) return;
      const unit = data.units.find((u) => u.name === unitSel.value) || data.units[0];
      if (mode === 'text') {
        drawBox.replaceChildren(h('pre', { tabindex: '0', 'aria-label': `Qiskit text drawing of ${unit.name}` }, unit.text),
          h('p', { class: 'muted small' }, 'Qiskit’s own drawing of the same circuit (qubits q_0, q_1, … in the order of the diagram labels).'));
        return;
      }
      const counts = {};
      unit.ops.forEach((op) => { counts[op.name] = (counts[op.name] || 0) + 1; });
      drawBox.replaceChildren(circuitFigure(unit, unit.labels,
        `${unit.name}: ${unit.num_qubits} qubits, ${unit.ops.length} operations (${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ')}). Shaded bands mark the protocol sections.`));
    }

    function drawCompile() {
      const rep = ctx.store.get().runs.at(-1);
      if (!rep) {
        compileBox.replaceChildren(h('p', { class: 'muted' }, 'Run an experiment in the Bell Lab or Repeater view to see what the transpiler made of it.'));
        return;
      }
      const rows = rep.circuits.compiled.map((c, i) => ({ name: c.name, lq: rep.circuits.logical[i].num_qubits, ld: rep.circuits.logical[i].depth, l2: rep.circuits.logical[i].two_qubit_gates, cq: c.num_qubits, cd: c.depth, c2: c.two_qubit_gates, ops: Object.entries(c.ops).map(([k, v]) => `${k} ${v}`).join(', ') }));
      compileBox.replaceChildren(dataTable({
        caption: `${rep.experiment.module} on ${rep.backend.name}: ${rep.layout === 'packed_single_circuit' ? 'one packed circuit' : `${rows.length} circuits`}, ${int(rep.shots)} shots each, ${rep.seconds} s`,
        columns: [
          { key: 'name', label: 'Circuit' }, { key: 'lq', label: 'qubits' }, { key: 'ld', label: 'depth' }, { key: 'l2', label: '2-qubit gates' },
          { key: 'cq', label: 'qubits (compiled)' }, { key: 'cd', label: 'depth (compiled)' }, { key: 'c2', label: '2-qubit (compiled)' },
          { key: 'ops', label: 'compiled gates', align: 'text' },
        ],
        rows,
      }));
    }

    async function drawCompare() {
      let recorded = [];
      try {
        recorded = (await ctx.api.recorded()).runs || [];
      } catch {
        recorded = [];
      }
      const session = ctx.store.get().runs.map((r) => ({ ...r, origin: 'this session' }));
      const recordedRows = recorded.map((r) => ({ ...r, label: r.origin ? r.origin.device_label : r.backend.name, source: r.origin ? `recorded on ${r.origin.where} (${r.origin.captured_utc})` : 'recorded' }));
      const sessionRows = session.map((r) => ({ ...r, label: r.backend.name, source: 'this session' }));
      const all = [...recordedRows, ...sessionRows].filter((r) => r.experiment.module === 'bell');
      if (!all.length) {
        compareBox.replaceChildren(h('p', { class: 'muted' }, 'No Bell runs yet. Each Qollab session runs on one backend; recorded runs from other backends appear here once they are added to data/recorded_runs.json.'));
        return;
      }
      const rows = all.map((r, i) => ({
        i: i + 1, backend: r.label, origin: r.source, channel: channelText(r),
        shots: r.shots, S: r.analysis.S.point, low: r.analysis.S.low, high: r.analysis.S.high, pred: r.prediction.S_fixed, QZ: r.analysis.Q_Z.point, sec: r.seconds,
      }));
      const chart = lineChart({
        title: 'Measured S for each Bell run against the exact prediction',
        desc: 'Each run is a point with its confidence interval; open squares are the predictions for the same channel without device noise.',
        width: 640, height: 260,
        x: { min: 0.5, max: rows.length + 0.5, label: 'run', ticks: rows.map((r) => r.i), format: String },
        y: { min: 0, max: 3, label: 'S', ticks: [0, 1, 2, 2.83] },
        hlines: [{ y: 2, label: 'local bound' }, { y: 2 * Math.SQRT2, label: '2√2' }],
        markers: [
          ...rows.map((r, k) => ({ x: r.i, y: r.S, ylo: r.low, yhi: r.high, color: 'var(--c1)', shape: 'circle', legend: k === 0 ? 'measured S (95% interval)' : null })),
          ...rows.map((r, k) => ({ x: r.i + 0.15, y: r.pred, color: 'var(--c2)', shape: 'square', hollow: true, legend: k === 0 ? 'prediction without device noise' : null })),
        ],
        caption: 'Device noise models (IBM, IonQ) lower S below the channel-only prediction; how much depends on the transpiled circuit.',
      });
      compareBox.replaceChildren(chart.element, dataTable({
        caption: 'Bell runs',
        columns: [
          { key: 'i', label: '#' }, { key: 'backend', label: 'Backend', align: 'text' }, { key: 'origin', label: 'Source', align: 'text' },
          { key: 'channel', label: 'Channel', align: 'text' }, { key: 'shots', label: 'shots', format: int },
          { key: 'S', label: 'S', format: (v) => num(v) }, { key: 'low', label: 'S low', format: (v) => num(v) },
          { key: 'pred', label: 'predicted', format: (v) => num(v) }, { key: 'QZ', label: 'Q_Z', format: (v) => pct(v) },
          { key: 'sec', label: 'seconds', format: (v) => num(v, 2) },
        ],
        rows,
      }));
    }

    ctx.store.subscribe((st, prev) => {
      if (st.runs !== prev.runs) { drawCompile(); drawCompare(); }
    });

    let first = true;
    return {
      element,
      async onShow() {
        if (!first) return;
        first = false;
        await load();
        drawCompile();
        await drawCompare();
      },
    };
  },
};
