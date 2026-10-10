// Steps of the guided tour. Actions call the same view methods as the buttons, so the circuits
// really run. On IonQ (one job per Qollab run) the tour only sets up the experiments and leaves
// the single job to the user.
import { tm } from '../core/tex.js';

function lab(ctx) {
  return ctx.router.instance('lab');
}

async function labRun(ctx, setup) {
  await lab(ctx).configure(setup);
  if (ctx.backend.profile.one_job_per_run) {
    return 'On IonQ backends a Qollab run allows one job, so the tour only sets up this experiment; press Run yourself when you want to spend the job.';
  }
  return lab(ctx).runAndFinish();
}

export const STEPS = [
  {
    view: 'overview',
    target: '#overview-backend',
    title: 'Welcome to the Bell-Test Lab',
    body: [
      'You will run a CHSH Bell test on the simulator you picked in Qollab and see which claims its counts support.',
      'Every step below runs real Qiskit circuits on that backend. Use Next, the arrow keys, or Escape to leave.',
    ],
  },
  {
    view: 'lab',
    target: '#lab-gauge',
    title: 'A perfect pair reaches Tsirelson’s bound',
    body: () => tm`No added noise, no eavesdropper: on an ideal simulator $S$ lands near $2\sqrt{2} \approx 2.83$, the largest value quantum mechanics allows; a noise-model backend pulls it lower. The bar is the 97.5% confidence interval for $S$ from the finite number of shots.`,
    action: (ctx) => labRun(ctx, { channel: { kind: 'none' }, eve: { enabled: false }, include_yy: false }),
  },
  {
    view: 'lab',
    target: '#lab-gauge',
    title: 'Entangled, yet no violation',
    body: () => tm`Depolarizing noise of strength 0.5 leaves a Werner state with visibility 0.5. It is still entangled (anything above 1/3 is), but $S$ drops to about 1.41 or below. No CHSH test can show this entanglement: Werner states violate CHSH only above visibility $1/\sqrt{2} \approx 0.71$.`,
    action: (ctx) => labRun(ctx, { channel: { kind: 'depolarizing', strength: 0.5 }, eve: { enabled: false } }),
  },
  {
    view: 'lab',
    target: '#lab-ladder',
    title: 'An eavesdropper who copies the key basis',
    body: () => tm`Eve couples a probe to Bob’s qubit with a full controlled rotation ($\varphi = 180^\circ$). In the exact model the key basis stays perfect ($Q_Z = 0$), but $Q_X$ jumps to 50% and $S$ falls to about 1.41. Every certificate fails, as it should.`,
    action: (ctx) => labRun(ctx, { channel: { kind: 'none' }, eve: { enabled: true, phi_deg: 180 } }),
  },
  {
    view: 'lab',
    target: '#lab-ladder',
    title: 'Realistic noise: which claims survive?',
    body: () => tm`For 5% depolarizing noise the exact model predicts $S \approx 2.69$ and $Q_Z \approx 2.5\,\%$ (a noise-model backend adds its own errors). At $Q_Z = 2.5\,\%$ the device-independent key needs $S$ above about 2.21. Compare the point estimate with the conservative column: a claim only really holds if it survives at the conservative end.`,
    action: (ctx) => labRun(ctx, { channel: { kind: 'depolarizing', strength: 0.05 }, eve: { enabled: false } }),
  },
  {
    view: 'certificates',
    target: '#cert-rates',
    title: 'Your run on the key-rate curves',
    body: 'Filled markers are your run at its point estimate, hollow ones at the conservative end. The DI key switches off at a lower error rate (7.1%) than BBM92 (11.0%): trusting fewer things costs key.',
  },
  {
    view: 'experiments',
    target: '#exp-rosenfeld',
    title: 'The same estimator on real atoms',
    body: () => tm`These are the open event files of the 2017 Munich loophole-free Bell test. Read with this lab’s estimator they give $S = 2.221 \pm 0.033$, as in the paper. The public June run gives 2.096, which does not clear 2 at 95% confidence under our i.i.d. Hoeffding bound.`,
  },
  {
    view: 'repeater',
    target: '#rep-controls',
    title: 'Two links joined by entanglement swapping',
    body: () => tm`A repeater in the middle makes a Bell measurement and sends two bits to Bob, who corrects his result in software. The noise of both links adds up: compare the measured $S$ with the link budget.`,
    action: async (ctx) => {
      const rep = ctx.router.instance('repeater');
      if (ctx.backend.profile.one_job_per_run) {
        // 2 links with link noise would need 49 qubits; without added noise they pack into 25.
        await rep.configure({ hops: 2, channel: { kind: 'none' } });
        return 'On IonQ backends the tour sets up a two-link swap without added noise (the device model provides the noise) and leaves the single job to you.';
      }
      await rep.configure({ hops: 2, channel: { kind: 'depolarizing', strength: 0.05 } });
      return rep.runChain();
    },
  },
  {
    view: 'space',
    target: '#space-slice',
    title: 'Where the correlations live',
    body: 'In this slice the local models fill the diamond, quantum mechanics the disc and everything that does not signal the square. Your run and the Munich data sit between the diamond and the disc: beyond any local model, inside quantum mechanics.',
  },
  {
    view: 'circuits',
    target: '#circ-drawing',
    title: 'The circuits behind it',
    body: 'Every setting is one small circuit; shaded bands mark the pair source, the noise ancillas, the basis choice and the measurements. Switch to Qiskit’s own text drawing to check them. That is the tour; the Method view lists every formula and source.',
  },
];
