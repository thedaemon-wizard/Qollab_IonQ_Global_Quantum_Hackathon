// Bell Lab protocol diagram: the run card's box-and-arrow picture of one CHSH run. It follows
// the stepper: the current stage is highlighted (and animated while the replay plays), finished
// stages turn solid, and each box shows its numbers only once its stage has been reached.
// It draws what the report contains and computes nothing; there are no timers here.
import { h, refreshScrollable, scrollableWhenNeeded, scrollHint } from '../core/dom.js';
import { int, num, pct } from '../core/format.js';
import { flowDiagram } from '../widgets/diagram.js';
import { RUNG_INFO, rungOutcome } from './common.js';

// Stage of each part of the picture (0-based, same order as the stepper).
const STAGE = { src: 0, eve: 0, alice: 1, bob: 1, job: 2, est: 3, cert: 4 };
const SHORT = { bell: 'Bell violation', witness: 'Entanglement', bbm92: 'BBM92 key', self: 'Self-test', rnd: 'DI randomness', di: 'DI key' };
const OUTCOME = {
  holds: { text: '✓ holds', tone: 'var(--good)' },
  point: { text: '! point estimate only', tone: 'var(--warn)' },
  no: { text: '✗ does not hold', tone: 'var(--muted)' },
};

function channelLabel(ch) {
  if (!ch || ch.kind === 'none' || !ch.strength) return 'no link noise';
  if (ch.kind === 'custom') return 'custom Pauli noise';
  return `${ch.kind.replace('_', ' ')} ${Number(ch.strength).toFixed(2)}`;
}

function angles(settings, side) {
  const out = [];
  for (const st of Object.values(settings)) {
    const v = st[`${side}_deg`];
    const label = v === null ? 'Y' : `${v < 0 ? '−' : ''}${Math.abs(v)}°`;
    if (!out.includes(label)) out.push(label);
  }
  return out.join(', ');
}

function clip(text, n) {
  return text.length > n ? `${text.slice(0, n - 1)}…` : text;
}

export function labFlow(stageTitles) {
  const hint = scrollHint();
  const wrap = scrollableWhenNeeded(document.createElement('div'), 'Protocol diagram', hint);
  wrap.className = 'flow-wrap';
  let opts = { channel: null, evePhi: null, backend: '' };
  let showing = 'preview';
  let playing = false;

  // statuses: one of 'todo' | 'active' | 'done' per stage; rep: the run report or null.
  function render(statuses, rep, stage, submittingTo = null) {
    const st = (k) => statuses[STAGE[k]];
    const seen = (k) => rep !== null && STAGE[k] <= stage;
    const look = (k, tone) => {
      const s = st(k);
      if (s === 'active') return { tone: 'var(--accent)', strokeWidth: 3.2, mark: '▶', status: s };
      if (s === 'done') return { tone, mark: '✓', markTone: 'var(--good)', status: s };
      return { tone: 'var(--control-border)', dash: '5 4', mark: String(STAGE[k] + 1), markTone: 'var(--muted)', status: s };
    };
    const edgeLook = (k, color) => {
      const s = st(k);
      if (s === 'active') return { color: 'var(--accent)', markerColor: 'var(--accent)', width: 3, dash: '8 6', status: s };
      if (s === 'done') return { color, markerColor: color, status: s };
      return { color: 'var(--control-border)', dash: '4 4', status: s };
    };
    const a = rep ? rep.analysis : null;
    const evePhi = rep ? rep.experiment.eve_phi_deg : opts.evePhi;
    const channel = rep ? (rep.request || {}).channel : opts.channel;
    const backend = rep ? rep.backend.name : submittingTo || opts.backend;
    const node = (id, k, x, y, w, hgt, ic, title, sub, tone) => ({ id, x, y, w, h: hgt, icon: ic, title, sub, ...look(k, tone) });

    const totalN = a ? Object.values(a.settings).reduce((t, x) => t + x.N, 0) : 0;
    const jobSub = seen('job')
      ? [clip(backend, 28),
        `${rep.layout === 'packed_single_circuit' ? '1 packed circuit' : `${rep.circuits.compiled.length} circuits`} · canary ${pct(rep.canary_fraction, 0)}`,
        `${int(rep.shots)} shots × ${Object.keys(a.settings).length} settings`,
        `${rep.seconds} s job wall time (measured)`]
      : [submittingTo ? 'submitting…' : 'one backend.run', clip(backend || 'injected backend', 28)];
    const nodes = [
      node('src', 'src', 10, 150, 150, 68, 'atom', 'Pair source', ['|Φ+⟩ pairs', seen('src') ? `${int(totalN)} pairs` : ''].join('\n'), 'var(--c1)'),
      node('alice', 'alice', 205, 40, 160, 68, 'user', 'Alice', `settings\n${seen('alice') ? angles(a.settings, 'alice') : 'from stage 2'}`, 'var(--c1)'),
      node('bob', 'bob', 205, 270, 160, 68, 'user', 'Bob', `settings\n${seen('bob') ? angles(a.settings, 'bob') : 'from stage 2'}`, 'var(--c2)'),
      node('job', 'job', 410, 140, 200, 96, 'cpu', 'One job', jobSub.join('\n'), 'var(--c5)'),
      node('est', 'est', 650, 147, 175, 82, 'filter', 'Sift & estimate',
        seen('est')
          ? `S ${num(a.S.point)} in [${num(a.S.low)}, ${num(a.S.high)}]\nQ_Z ${pct(a.Q_Z.point)} · Q_X ${pct(a.Q_X.point)}\nclassical, in Python`
          : 'S, Q_Z, Q_X\nclassical, in Python', 'var(--c3)'),
    ];
    if (evePhi !== null && evePhi !== undefined) {
      nodes.push(node('eve', 'eve', 10, 330, 150, 68, 'eye', 'Eve', `controlled-Ry(${evePhi}°)\non Bob’s qubit`, 'var(--bad)'));
    }
    RUNG_INFO.forEach((r, i) => {
      const out = seen('cert') ? OUTCOME[rungOutcome(r, a)] : null;
      const n = node(`cert-${r.key}`, 'cert', 852, 32 + i * 62, 136, 54, r.icon, SHORT[r.key], out ? out.text : 'pending', out ? out.tone : 'var(--c3)');
      // no corner mark here (the titles are long): the group carries the stage mark
      // and the second line says whether the certificate holds
      n.mark = '';
      n.fitGroup = 'cert';
      if (out && st('cert') === 'done') n.tone = out.tone;
      nodes.push(n);
    });

    const edges = [
      { from: 'src', to: 'alice', route: 'elbow', label: 'ideal link', labelAt: [118, 128], ...edgeLook('src', 'var(--c1)') },
      { from: 'src', to: 'bob', route: 'elbow', label: channelLabel(channel), labelAt: [100, 254], ...edgeLook('src', 'var(--c2)') },
      { from: 'alice', to: 'job', route: 'elbow', ...edgeLook('job', 'var(--c1)') },
      { from: 'bob', to: 'job', route: 'elbow', ...edgeLook('job', 'var(--c2)') },
      { from: 'job', to: 'est', label: 'counts', labelAt: [630, 180], ...edgeLook('est', 'var(--c5)') },
      ...RUNG_INFO.map((r) => ({ from: 'est', to: `cert-${r.key}`, route: 'elbow', ...edgeLook('cert', 'var(--c3)') })),
    ];
    if (evePhi !== null && evePhi !== undefined) {
      edges.push({ from: 'eve', to: 'bob', fromSide: 'right', toSide: 'bottom', route: 'hv', label: 'probe', labelAt: [225, 357], ...edgeLook('eve', 'var(--bad)') });
    }

    const where = stage < 0
      ? (submittingTo ? `The job is being submitted to ${submittingTo}.` : 'No run yet.')
      : `Stage ${stage + 1} of ${stageTitles.length}, ${stageTitles[stage]}, is ${statuses[stage] === 'done' ? 'done' : 'current'}.`;
    const values = [
      seen('job') ? `One job on ${backend}: ${int(rep.shots)} shots for each of ${Object.keys(a.settings).length} settings, ${rep.seconds} s.` : '',
      seen('est') ? `S = ${num(a.S.point)} with interval ${num(a.S.low)} to ${num(a.S.high)}; Q_Z = ${pct(a.Q_Z.point)}, Q_X = ${pct(a.Q_X.point)}.` : '',
      seen('cert') ? `Certificates that hold at the conservative end: ${RUNG_INFO.filter((r) => rungOutcome(r, a) === 'holds').map((r) => SHORT[r.key]).join(', ') || 'none'}.` : '',
    ].filter(Boolean).join(' ');
    const { element } = flowDiagram({
      width: 1000,
      height: 410,
      className: 'flow',
      title: 'Protocol diagram of this run',
      desc: `A source sends |Φ+⟩ pairs to Alice and Bob; Bob's link: ${channelLabel(channel)}${evePhi !== null && evePhi !== undefined ? ` and Eve couples a probe to Bob's qubit with angle ${evePhi}°` : ''}. Both measure in their settings inside one job; the counts are sifted and estimated in Python and feed six certificates. ${where} ${values}`.trim(),
      groups: [{ x: 845, y: 8, w: 150, h: 394, label: 'CERTIFICATES', ...look('cert', 'var(--c3)') }],
      nodes,
      edges,
      caption: rep
        ? 'Replay of one job’s counts: the job ran first, then the stages are shown one by one (1.1 s per step; the pacing is not physical time). Number = stage not reached yet, ▶ = current stage, ✓ = done.'
        : 'Number = the stage that fills in this box. Press Run: one job runs, then the stages are replayed from its counts.',
    });
    element.setAttribute('data-playing', String(playing));
    wrap.replaceChildren(element);
    refreshScrollable(wrap);
  }

  const idle = () => stageTitles.map(() => 'todo');
  render(idle(), null, -1);

  return {
    element: h('div', null, hint, wrap), // the hint sits right above the drawing, not under its long caption
    /** Called by the Bell Lab after each stage is shown. */
    update(statuses, rep, stage) {
      showing = 'run';
      render(statuses, rep, stage);
    },
    /** Back to the empty picture (no run shown). */
    reset() {
      showing = 'preview';
      render(idle(), null, -1);
    },
    /** While the one job is in flight: only the job box is highlighted. */
    submitting(name) {
      showing = 'submitting';
      render(idle().map((s, i) => (i === STAGE.job ? 'active' : s)), null, -1, name);
    },
    /** Controls changed: redraw the empty picture with the new link noise and Eve. */
    preview(next) {
      opts = { ...opts, ...next };
      if (showing === 'preview') render(idle(), null, -1);
    },
    /** Animate the highlighted stage only while the replay is playing (not when paused or done). */
    setPlaying(on) {
      playing = on;
      if (wrap.firstElementChild) wrap.firstElementChild.setAttribute('data-playing', String(on));
    },
  };
}
