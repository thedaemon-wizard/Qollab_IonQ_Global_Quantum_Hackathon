// Overview: what the lab does, how it is built, what is real and what is simulated.
import { h } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { viewFrame } from '../core/router.js';
import { button, note } from '../widgets/controls.js';
import { flowDiagram } from '../widgets/diagram.js';
import { dataTable } from '../widgets/table.js';

function protocolDiagram() {
  const n = (id, x, y, w, ic, title, sub, tone) => ({ id, x, y, w, h: sub ? 62 : 40, icon: ic, title, sub, tone });
  return flowDiagram({
    width: 820,
    height: 342,
    title: 'From entangled pairs to certificates',
    desc: 'A source sends entangled pairs to Alice and Bob through noisy links, optionally tapped by Eve. Alice and Bob measure in chosen bases, compare a sample of results over a classical channel and estimate S and the error rates. These numbers feed six certificates: Bell violation, an entanglement witness, BBM92 key, a self-test, device-independent randomness and device-independent key. ',
    groups: [{ x: 600, y: 10, w: 210, h: 318, label: 'CERTIFICATES' }],
    nodes: [
      n('src', 10, 130, 140, 'atom', 'Pair source', '|Φ+⟩ = (|00⟩+|11⟩)/√2', 'var(--c1)'),
      n('alice', 210, 40, 140, 'user', 'Alice', 'Z, X, ±45°', 'var(--c1)'),
      n('bob', 210, 220, 140, 'user', 'Bob', 'Z, X', 'var(--c2)'),
      n('eve', 10, 272, 140, 'eye', 'Eve (optional)', 'controlled-Ry(φ)', 'var(--bad)'),
      n('est', 400, 130, 160, 'filter', 'Sift & estimate', 'S, Q_Z, Q_X\nwith confidence', 'var(--c3)'),
      n('bell', 620, 36, 160, 'chart-dots', 'Bell violation', '', 'var(--c3)'),
      n('wit', 620, 84, 160, 'eye', 'Entanglement', '', 'var(--c3)'),
      n('bbm', 620, 132, 160, 'key', 'BBM92 key', '', 'var(--c3)'),
      n('self', 620, 180, 160, 'fingerprint', 'Self-test', '', 'var(--c3)'),
      n('rnd', 620, 228, 160, 'dice-5', 'DI randomness', '', 'var(--c3)'),
      n('di', 620, 276, 160, 'shield-lock', 'DI key (Acín 2007)', '', 'var(--c3)'),
    ],
    edges: [
      { from: 'src', to: 'alice', route: 'elbow', label: 'link', labelAt: [162, 121] },
      { from: 'src', to: 'bob', route: 'elbow', label: 'noisy link', labelAt: [148, 214] },
      { from: 'eve', to: 'bob', fromSide: 'right', toSide: 'bottom', route: 'hv', dash: '5 4', color: 'var(--bad)', markerColor: 'var(--bad)' },
      { from: 'alice', to: 'est', route: 'elbow' },
      { from: 'bob', to: 'est', route: 'elbow' },
      { from: 'est', to: 'bell', route: 'elbow' },
      { from: 'est', to: 'wit', route: 'elbow' },
      { from: 'est', to: 'bbm', route: 'elbow' },
      { from: 'est', to: 'di', route: 'elbow' },
      { from: 'est', to: 'rnd', route: 'elbow' },
      { from: 'est', to: 'self', route: 'elbow' },
    ],
    caption: 'Each arrow is one step of the protocol the lab runs. In the Repeater view the single link becomes several links joined by entanglement swapping.',
  });
}

function softwareDiagram() {
  const n = (id, x, y, w, ic, title, sub, tone) => ({ id, x, y, w, h: 62, icon: ic, title, sub, tone });
  return flowDiagram({
    width: 980,
    height: 250,
    title: 'Software architecture',
    desc: 'The browser interface, written as plain JavaScript modules, calls Python only through one module, api.js, which passes JSON strings. The Python package bellkit builds circuits from config/defaults.json, submits one job to the backend Qollab injected, decodes the counts and computes estimates and bounds. Open data files are read from the project.',
    groups: [{ x: 770, y: 10, w: 200, h: 230, label: 'INJECTED BY QOLLAB' }],
    nodes: [
      n('ui', 10, 30, 170, 'layout-dashboard', 'UI (8 views)', 'ES modules, SVG, three.js\nno framework', 'var(--c1)'),
      n('api', 210, 30, 150, 'arrows-exchange', 'ui/core/api.js', 'only Python bridge\nJSON strings in/out', 'var(--c1)'),
      n('app', 390, 30, 160, 'math-function', 'bellkit.app', 'request → report\ntheory, data, checks', 'var(--c3)'),
      n('plan', 390, 150, 160, 'hierarchy', 'circuits + plan', 'settings as units\nmulti or packed', 'var(--c3)'),
      n('exec', 590, 150, 160, 'cpu', 'execution', 'one backend.run\ncanary bit-order check', 'var(--c3)'),
      n('cfg', 590, 30, 160, 'database', 'config + data', 'defaults.json\nopen datasets', 'var(--c5)'),
      n('ideal', 785, 36, 170, 'server', 'Ideal simulators', 'many circuits per job', 'var(--c2)'),
      n('ibm', 785, 104, 170, 'cpu', 'IBM noise models', 'transpiled to device', 'var(--c2)'),
      n('ionq', 785, 172, 170, 'atom', 'IonQ noise models', 'one packed circuit', 'var(--c2)'),
    ],
    edges: [
      { from: 'ui', to: 'api' },
      { from: 'api', to: 'app', label: 'callPromising', labelAt: [375, 22] },
      { from: 'app', to: 'plan', fromSide: 'bottom', toSide: 'top' },
      { from: 'plan', to: 'exec' },
      { from: 'cfg', to: 'app', fromSide: 'left', toSide: 'right' },
      { from: 'exec', to: 'ideal', route: 'elbow' },
      { from: 'exec', to: 'ibm', route: 'elbow' },
      { from: 'exec', to: 'ionq', route: 'elbow' },
    ],
    caption: 'All physics and statistics are computed in Python; the interface only draws the numbers it receives.',
  });
}

export default {
  id: 'overview',
  title: 'Overview',
  icon: 'home',
  create(ctx) {
    const { element, body } = viewFrame('overview', 'One Bell test, a ladder of certificates', 'home',
      'Run a CHSH Bell test on a Qiskit simulator and see which claims the same counts support - from "this is not classical" to device-independent keys and randomness - and how noise, an eavesdropper, distance and finite statistics change the answer.');
    const prof = ctx.backend.profile;
    const start = h('div', { class: 'card' },
      h('h3', null, icon('player-play'), 'Start here'),
      h('p', null, 'The guided tour runs the real circuits step by step (about two minutes). Or open a view from the menu.'),
      h('div', { class: 'toolbar' },
        button('Start the guided tour', 'school', (e) => ctx.tour.start(e.currentTarget), { primary: true }),
        button('Open the Bell Lab', 'flask', () => ctx.router.go('lab', { focus: true }))));
    const backendCard = h('div', { class: 'card', id: 'overview-backend' },
      h('h3', null, icon('server'), 'This session’s backend'),
      h('dl', { class: 'kv' },
        h('dt', null, 'Backend'), h('dd', null, ctx.backend.name),
        h('dt', null, 'Run profile'), h('dd', null, prof.label),
        h('dt', null, 'Shots per setting'), h('dd', null, String(prof.shots ?? '\u2014')),
        h('dt', null, 'Job layout'), h('dd', null, prof.refuse ? '\u2014' : prof.layout === 'packed_single_circuit' ? 'one packed circuit' : 'one circuit per setting'),
        h('dt', null, 'Qubit limit per circuit'), h('dd', null, String(prof.max_qubits ?? '\u2014'))),
      prof.refuse ? note('bad', prof.refuse_reason) : null,
      prof.one_job_per_run ? note('warn', 'This session can submit one job (Qollab allows one IonQ job per project run; the lab applies the same rule to unrecognised backends). Choose the experiment, run it once, then press Run in Qollab again for another.') : null,
      prof.id === ctx.config.default_profile.id ? note('warn', `This backend name is not in the configured list, so the conservative "${prof.label}" profile is used.`) : null,
      h('p', { class: 'muted small' }, 'Pick another simulator in Qollab’s Run dialog to change it. This lab never submits to quantum hardware.'));
    const checks = h('div', { class: 'card' }, h('h3', null, icon('list-check'), 'Formula self-check'), h('p', { class: 'muted' }, 'Running…'));
    const realTable = dataTable({
      caption: 'What the numbers in this lab are',
      columns: [{ key: 'what', label: 'Item', align: 'text' }, { key: 'kind', label: 'Kind', align: 'text' }, { key: 'note', label: 'Notes', align: 'text' }],
      rows: [
        { what: 'Every run in the Bell Lab and Repeater', kind: 'Simulation', note: 'Qiskit simulators or noise models chosen in Qollab; counts are sampled, so they fluctuate.' },
        { what: 'Munich 2017 Bell-test events', kind: 'Experimental data', note: 'Open event files (Rosenfeld et al., CC BY 4.0) re-analysed here; reproduces the paper’s S = 2.221.' },
        { what: 'Published S and Q of DI-QKD experiments', kind: 'Quoted values', note: 'From the papers and their data records; the rates shown next to them are our recomputation.' },
        { what: 'Keys, randomness, self-test values', kind: 'Asymptotic bounds', note: 'Formulas evaluated at the estimate and at the conservative end of its interval; not a security proof.' },
        { what: 'Random numbers used by the simulators', kind: 'Pseudo-random', note: 'Not a quantum random number generator.' },
      ],
    });
    body.append(
      h('div', { class: 'grid' }, start, backendCard, checks),
      h('div', { class: 'card wide' }, h('h3', null, icon('route'), 'The protocol'), protocolDiagram().element),
      h('div', { class: 'card wide' }, h('h3', null, icon('hierarchy'), 'How it is built'), softwareDiagram().element),
      h('div', { class: 'card wide' }, h('h3', null, icon('info-circle'), 'Real, simulated, or bound?'), realTable),
    );
    let loaded = false;
    return {
      element,
      async onShow() {
        if (loaded) return;
        loaded = true;
        try {
          const st = await ctx.api.selftest();
          checks.replaceChildren(
            h('h3', null, icon('list-check'), `Formula self-check: ${st.passed} of ${st.total} passed`),
            h('ul', { class: 'checks' }, st.checks.map((c) =>
              h('li', { 'data-ok': String(c.ok) }, icon(c.ok ? 'check' : 'x', { label: c.ok ? 'passed' : 'failed', size: 16 }), h('span', null, c.name)))),
            h('p', { class: 'muted small' }, 'Run in Python at start-up; the full test suite is in the repository.'));
        } catch (err) {
          checks.append(note('bad', err.message));
        }
      },
    };
  },
};
