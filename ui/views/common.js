// Pieces shared by the Lab and Repeater views: experiment controls, the certificate ladder,
// the run gate (refusals and the one-IonQ-job rule) and request building.
import { h, scrollableWhenNeeded } from '../core/dom.js';
import { num, pct } from '../core/format.js';
import { icon } from '../core/icons.js';
import { tm } from '../core/tex.js';
import { checkbox, select, slider } from '../widgets/controls.js';

export const CHANNELS = [
  { value: 'none', label: 'No noise' },
  { value: 'depolarizing', label: 'Depolarizing (Werner)' },
  { value: 'dephasing', label: 'Dephasing (Z flips)' },
  { value: 'bit_flip', label: 'Bit flip (X flips)' },
  { value: 'y_flip', label: 'Y flip' },
];

export function channelControls(cfg, onChange, { kind = 'depolarizing', strength } = {}) {
  const r = cfg.channels.strength;
  const kindSel = select({ label: 'Link noise on Bob’s qubit', options: CHANNELS, value: kind, onChange: () => { sync(); onChange(); } });
  const str = slider({
    label: tm`Noise strength (error probability; $\lambda$ for depolarizing)`,
    min: r.min, max: r.max, step: r.step, value: strength ?? r.default,
    format: (v) => v.toFixed(2), onInput: onChange,
  });
  const sync = () => str.disable(kindSel.value === 'none');
  sync();
  return {
    elements: [kindSel.element, str.element],
    value: () => ({ kind: kindSel.value, strength: kindSel.value === 'none' ? 0 : str.value }),
    set({ kind: k, strength: st }) {
      if (k !== undefined) kindSel.set(k);
      if (st !== undefined) str.set(st);
      sync();
    },
  };
}

export function eveControls(cfg, onChange) {
  const r = cfg.eve.phi_deg;
  const on = checkbox({ label: 'Eavesdropper on Bob’s link', onChange: () => { phi.disable(!on.checked); onChange(); },
    hint: tm`Eve entangles a probe with Bob’s qubit (controlled-$R_y$). $\varphi = 180^\circ$ copies the Z value: intercept-resend.` });
  const phi = slider({ label: tm`Eve’s coupling angle $\varphi$`, min: r.min, max: r.max, step: r.step, value: r.default, format: (v) => `${v}°`, onInput: onChange });
  phi.disable(true);
  return {
    elements: [on.element, phi.element],
    value: () => ({ enabled: on.checked, phi_deg: phi.value }),
    set({ enabled, phi_deg: p }) {
      if (enabled !== undefined) on.set(enabled);
      if (p !== undefined) phi.set(p);
      phi.disable(!on.checked);
    },
  };
}

/** Why a run cannot be submitted from this session right now (null if it can). */
export function runBlocker(ctx) {
  const prof = ctx.backend.profile;
  if (prof.refuse) return prof.refuse_reason;
  if (ctx.store.get().jobInFlight) return 'A job is already running; wait for it to finish.';
  if (prof.one_job_per_run && ctx.store.get().ionqJobsUsed >= 1) {
    return 'This session already used its one job (Qollab allows one IonQ job per project run; the lab applies the same rule to unrecognised backends). The numbers below stay; press Run in Qollab again to submit another experiment.';
  }
  return null;
}

/**
 * Submit one run. On a one-job profile the job counts as used from the moment it is
 * submitted, so no other view can start a second one; errors raised before anything reaches
 * the backend (a refused backend, a request out of range, a plan too large) give it back.
 */
export async function submitRun(ctx, request) {
  const oneJob = Boolean(ctx.backend.profile.one_job_per_run);
  ctx.store.set((st) => ({ jobInFlight: true, ionqJobsUsed: st.ionqJobsUsed + (oneJob ? 1 : 0) }));
  try {
    const rep = await ctx.api.run(request);
    ctx.store.set((st) => ({ runs: [...st.runs, rep], last: { ...st.last, [request.module]: rep } }));
    return rep;
  } catch (err) {
    if (oneJob && ['RequestError', 'PlanTooLarge', 'RefusedBackend'].includes(err.kind)) {
      ctx.store.set((st) => ({ ionqJobsUsed: Math.max(0, st.ionqJobsUsed - 1) }));
    }
    throw err;
  } finally {
    ctx.store.set({ jobInFlight: false });
  }
}

export function sizeNote(ctx, circuits) {
  const prof = ctx.backend.profile;
  if (prof.refuse) return { ok: false, text: prof.refuse_reason };
  const largest = Math.max(...circuits.units.map((u) => u.num_qubits));
  const needed = prof.layout === 'packed_single_circuit' ? circuits.packed_qubits : largest;
  const ok = needed <= prof.max_qubits;
  // counted as the protocol diagram counts them: the job also carries the one-qubit canary
  const what = prof.layout === 'packed_single_circuit'
    ? `All ${circuits.units.length} settings and the canary packed into one circuit need ${needed} qubits`
    : `${circuits.units.length} setting circuit${circuits.units.length === 1 ? '' : 's'} + 1 canary circuit, the largest with ${largest} qubits`;
  return { ok, text: `${what}; the ${prof.label} profile allows ${prof.max_qubits}.${ok ? '' : ' Reduce the experiment (for example switch off the eavesdropper or the noise, or use fewer hops) or pick a larger simulator.'}` };
}

export const RUNG_INFO = [
  { key: 'bell', icon: 'chart-dots', title: 'Bell violation', assumes: 'none about the devices', show: (l) => `S ${num(l.S)}`, tex: (l) => `$S$ ${num(l.S)}`, ok: (l) => l.bell_violation },
  { key: 'witness', icon: 'eye', title: 'Entanglement (witness)', assumes: 'trusted, calibrated measurements', show: (l) => `F ≥ ${num(l.witness_fidelity_low)}`, tex: (l) => String.raw`$F \ge$ ${num(l.witness_fidelity_low)}`, ok: (l) => l.entangled_trusted },
  { key: 'bbm92', icon: 'key', title: 'BBM92 key rate', assumes: 'trusted measurements (qubits)', show: (l) => `${num(l.rate_bbm92)} bit/round`, tex: (l) => `${num(l.rate_bbm92)} bit/round`, ok: (l) => l.rate_bbm92 > 0 },
  { key: 'self', icon: 'fingerprint', title: 'Self-test (Kaniewski)', assumes: 'none; i.i.d. rounds', show: (l) => `extractability ≥ ${num(l.kaniewski_extractability)}`, tex: (l) => String.raw`extractability $\ge$ ${num(l.kaniewski_extractability)}`, ok: (l) => l.self_test_nontrivial },
  { key: 'rnd', icon: 'dice-5', title: 'DI randomness (Pironio)', assumes: 'none; i.i.d. rounds', show: (l) => `H_min ≥ ${num(l.min_entropy_pironio)} bit`, tex: (l) => String.raw`$H_\text{min} \ge$ ${num(l.min_entropy_pironio)} bit`, ok: (l) => l.min_entropy_pironio > 0 },
  { key: 'di', icon: 'shield-lock', title: 'DI key rate (Acín 2007)', assumes: 'none; collective attacks, asymptotic', show: (l) => (l.rate_di_acin === null ? 'S ≤ 2' : `${num(l.rate_di_acin)} bit/round`), tex: (l) => (l.rate_di_acin === null ? String.raw`$S \le 2$` : `${num(l.rate_di_acin)} bit/round`), ok: (l) => l.di_certified },
];

/** Inputs of each certificate at the point estimate and at the conservative end. */
export function ladderEnds(analysis) {
  return {
    point: { ...analysis.ladder_point, S: analysis.S.point },
    cons: { ...analysis.ladder_conservative, S: analysis.S.low },
  };
}

/** 'holds' (conservative end), 'point' (point estimate only) or 'no'. */
export function rungOutcome(rung, analysis) {
  const { point, cons } = ladderEnds(analysis);
  return rung.ok(cons) ? 'holds' : rung.ok(point) ? 'point' : 'no';
}

// Rungs that assume nothing about the devices. On post-selected rounds (purification) they also
// need the keep/discard decision (the herald) to be independent of the measurement settings.
const DEVICE_INDEPENDENT = new Set(['bell', 'self', 'rnd', 'di']);
const HERALD = 'conditional on a setting-independent herald (post-selected)';

function assumesText(rung, postSelected) {
  if (!postSelected || !DEVICE_INDEPENDENT.has(rung.key)) return rung.assumes;
  const rest = rung.assumes.replace(/^none(?: about the devices)?;?\s*/, '');
  return rest ? `${HERALD}; ${rest}` : HERALD;
}

/**
 * Ladder of certificates: point estimate and conservative end side by side. `label` names the
 * scroll region (distinct per run, so two tables on one view never share a landmark name);
 * `postSelected` marks results computed on kept rounds only (purification).
 */
export function ladderTable(analysis, { label = 'Table: certificates from these counts', postSelected = false } = {}) {
  const { point, cons } = ladderEnds(analysis);
  return scrollableWhenNeeded(h('div', { class: 'table-wrap' }, h('table', null,
    h('caption', null, tm`Same counts, six claims. Conservative = $S$ at the lower end of its interval, error rates at the upper end; each interval is at ${(100 * (1 - analysis.delta / 2)).toFixed(1)}%, so each claim, which combines at most two of them, holds at ${Math.round(100 * (1 - analysis.delta))}% (i.i.d. rounds).`,
      postSelected ? ' Post-selected rounds: the device-independent rows (Bell violation, self-test, DI randomness, DI key) hold only if the keep/discard decision does not depend on the measurement settings.' : ''),
    h('thead', null, h('tr', null, h('th', { scope: 'col', class: 'text' }, 'Certificate'), h('th', { scope: 'col', class: 'text' }, 'Assumes'),
      h('th', { scope: 'col' }, 'Point estimate'), h('th', { scope: 'col' }, 'Conservative'), h('th', { scope: 'col' }, 'Holds?'))),
    h('tbody', null, RUNG_INFO.map((r) => h('tr', null,
      h('th', { scope: 'row', class: 'text' }, h('span', { style: { display: 'inline-flex', gap: '0.35rem', alignItems: 'center' } }, icon(r.icon, { size: 16 }), r.title)),
      h('td', { class: 'text muted' }, assumesText(r, postSelected)),
      h('td', null, tm`${r.tex(point)}`),
      h('td', null, tm`${r.tex(cons)}`),
      h('td', null, r.ok(cons) ? h('span', { style: { color: 'var(--good)' } }, icon('check', { size: 16, label: 'holds' }), ' yes')
        : r.ok(point) ? h('span', { style: { color: 'var(--warn)' } }, icon('alert-triangle', { size: 16, label: 'only at the point estimate' }), ' point only')
          : h('span', { class: 'muted' }, icon('x', { size: 16, label: 'does not hold' }), ' no'))))))), label);
}

export function qberList(analysis) {
  const row = (name, q) => [h('dt', null, name), h('dd', null, `${pct(q.point)}  [${pct(q.low)}, ${pct(q.high)}]  (N = ${q.N})`)];
  return h('dl', { class: 'kv' }, row(tm`$Q_Z$ (key basis)`, analysis.Q_Z), row(tm`$Q_X$`, analysis.Q_X),
    h('dt', null, tm`Witness $(\langle XX\rangle + \langle ZZ\rangle)/2$`), h('dd', null, `${num(analysis.witness.point)} (low ${num(analysis.witness.low)})`),
    analysis.fidelity_with_yy !== null ? [h('dt', null, 'Fidelity with YY'), h('dd', null, num(analysis.fidelity_with_yy))] : null);
}
