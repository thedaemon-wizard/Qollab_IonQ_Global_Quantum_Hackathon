// Method, limits, disclosure and references. Formulas are MathML (rendered natively by the
// browser and read by screen readers).
import { h } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { viewFrame } from '../core/router.js';
import { tm } from '../core/tex.js';
import { note } from '../widgets/controls.js';

function math(markup, label) {
  const m = document.createElementNS('http://www.w3.org/1998/Math/MathML', 'math');
  m.setAttribute('display', 'block');
  if (label) m.setAttribute('aria-label', label);
  m.innerHTML = markup;
  return h('div', { class: 'math-wrap', tabindex: '0', role: 'group', 'aria-label': label || 'formula' }, m);
}

const F = {
  chsh: '<mi>S</mi><mo>=</mo><msub><mi>E</mi><mn>00</mn></msub><mo>+</mo><msub><mi>E</mi><mn>01</mn></msub><mo>+</mo><msub><mi>E</mi><mn>10</mn></msub><mo>&#x2212;</mo><msub><mi>E</mi><mn>11</mn></msub><mo>,</mo><mspace width="1em"/><msub><mi>E</mi><mrow><mi>x</mi><mi>y</mi></mrow></msub><mo>=</mo><mfrac><mrow><msub><mi>N</mi><mtext>same</mtext></msub><mo>&#x2212;</mo><msub><mi>N</mi><mtext>diff</mtext></msub></mrow><mi>N</mi></mfrac>',
  hoeff: '<mi>t</mi><mo>=</mo><msqrt><mrow><mn>2</mn><mi>ln</mi><mo>&#x2061;</mo><mo>(</mo><mn>2</mn><mo>/</mo><msup><mi>&#x03B4;</mi><mo>&#x2032;</mo></msup><mo>)</mo><munder><mo>&#x2211;</mo><mi>k</mi></munder><mn>1</mn><mo>/</mo><msub><mi>N</mi><mi>k</mi></msub></mrow></msqrt><mo>,</mo><mspace width="1em"/><msup><mi>&#x03B4;</mi><mo>&#x2032;</mo></msup><mo>=</mo><mi>&#x03B4;</mi><mo>/</mo><mn>2</mn>',
  bbm92: '<msub><mi>r</mi><mtext>BBM92</mtext></msub><mo>=</mo><mn>1</mn><mo>&#x2212;</mo><mi>h</mi><mo>(</mo><msub><mi>Q</mi><mi>Z</mi></msub><mo>)</mo><mo>&#x2212;</mo><mi>h</mi><mo>(</mo><msub><mi>Q</mi><mi>X</mi></msub><mo>)</mo>',
  acin: '<msub><mi>r</mi><mtext>DI</mtext></msub><mo>=</mo><mn>1</mn><mo>&#x2212;</mo><mi>h</mi><mo>(</mo><mi>Q</mi><mo>)</mo><mo>&#x2212;</mo><mi>h</mi><mrow><mo>(</mo><mfrac><mrow><mn>1</mn><mo>+</mo><msqrt><mrow><msup><mrow><mo>(</mo><mi>S</mi><mo>/</mo><mn>2</mn><mo>)</mo></mrow><mn>2</mn></msup><mo>&#x2212;</mo><mn>1</mn></mrow></msqrt></mrow><mn>2</mn></mfrac><mo>)</mo></mrow>',
  pironio: '<msub><mi>H</mi><mtext>min</mtext></msub><mo>&#x2265;</mo><mn>1</mn><mo>&#x2212;</mo><msub><mi>log</mi><mn>2</mn></msub><mrow><mo>(</mo><mn>1</mn><mo>+</mo><msqrt><mrow><mn>2</mn><mo>&#x2212;</mo><msup><mi>S</mi><mn>2</mn></msup><mo>/</mo><mn>4</mn></mrow></msqrt><mo>)</mo></mrow>',
  kaniewski: '<mi>F</mi><mo>&#x2265;</mo><mfrac><mn>1</mn><mn>2</mn></mfrac><mo>+</mo><mfrac><mn>1</mn><mn>2</mn></mfrac><mfrac><mrow><mi>S</mi><mo>&#x2212;</mo><msup><mi>&#x03B2;</mi><mo>&#x2217;</mo></msup></mrow><mrow><mn>2</mn><msqrt><mn>2</mn></msqrt><mo>&#x2212;</mo><msup><mi>&#x03B2;</mi><mo>&#x2217;</mo></msup></mrow></mfrac><mo>,</mo><mspace width="1em"/><msup><mi>&#x03B2;</mi><mo>&#x2217;</mo></msup><mo>=</mo><mfrac><mrow><mn>16</mn><mo>+</mo><mn>14</mn><msqrt><mn>2</mn></msqrt></mrow><mn>17</mn></mfrac>',
  tlm: '<munder><mi>max</mi><mi>s</mi></munder><munder><mo>&#x2211;</mo><mrow><mi>x</mi><mi>y</mi></mrow></munder><msub><mi>s</mi><mrow><mi>x</mi><mi>y</mi></mrow></msub><mi>arcsin</mi><mo>&#x2061;</mo><msub><mi>E</mi><mrow><mi>x</mi><mi>y</mi></mrow></msub><mo>&#x2264;</mo><mi>&#x03C0;</mi>',
};

const REFS = [
  ['Clauser, Horne, Shimony, Holt, Phys. Rev. Lett. 23, 880 (1969)', '10.1103/PhysRevLett.23.880'],
  ['Cirel’son (Tsirelson), Lett. Math. Phys. 4, 93 (1980)', '10.1007/BF00417500'],
  ['Ekert, Phys. Rev. Lett. 67, 661 (1991)', '10.1103/PhysRevLett.67.661'],
  ['Bennett, Brassard, Mermin, Phys. Rev. Lett. 68, 557 (1992)', '10.1103/PhysRevLett.68.557'],
  ['Żukowski, Zeilinger, Horne, Ekert, Phys. Rev. Lett. 71, 4287 (1993)', '10.1103/PhysRevLett.71.4287'],
  ['Bennett et al. (BBPSSW), Phys. Rev. Lett. 76, 722 (1996)', '10.1103/PhysRevLett.76.722'],
  ['Deutsch et al. (DEJMPS), Phys. Rev. Lett. 77, 2818 (1996)', '10.1103/PhysRevLett.77.2818'],
  ['Briegel, Dür, Cirac, Zoller, Phys. Rev. Lett. 81, 5932 (1998)', '10.1103/PhysRevLett.81.5932'],
  ['Acín et al., Phys. Rev. Lett. 98, 230501 (2007)', '10.1103/PhysRevLett.98.230501'],
  ['Pironio et al., New J. Phys. 11, 045021 (2009)', '10.1088/1367-2630/11/4/045021'],
  ['Pironio et al., Nature 464, 1021 (2010)', '10.1038/nature09008'],
  ['Kaniewski, Phys. Rev. Lett. 117, 070402 (2016)', '10.1103/PhysRevLett.117.070402'],
  ['Masanes, arXiv:quant-ph/0309137 (2003)', null],
  ['Le, Meroni, Sturmfels, Werner, Ziegler, Quantum 7, 947 (2023)', '10.22331/q-2023-03-16-947'],
  ['Hoeffding, J. Am. Stat. Assoc. 58, 13 (1963)', '10.1080/01621459.1963.10500830'],
  ['Wilson, J. Am. Stat. Assoc. 22, 209 (1927)', '10.1080/01621459.1927.10502953'],
  ['Rosenfeld et al., Phys. Rev. Lett. 119, 010402 (2017); data: Zenodo', '10.1103/PhysRevLett.119.010402 · data 10.5281/zenodo.22936124'],
  ['Nadlinger et al., Nature 607, 682 (2022)', '10.1038/s41586-022-04941-5'],
  ['Zhang et al., Nature 607, 687 (2022)', '10.1038/s41586-022-04891-y'],
  ['Liu et al., Nature 652, 51 (2026); data: Zenodo', '10.1038/s41586-026-10177-4 · data 10.5281/zenodo.18218281'],
  ['Lu et al., Science 391, 592 (2026); data: Zenodo', '10.1126/science.aec6243 · data 10.5281/zenodo.17958512'],
  ['Meiers et al., arXiv:2609.25795 (2026), preprint', null],
];

export default {
  id: 'method',
  title: 'Method & sources',
  icon: 'book',
  create() {
    const { element, body } = viewFrame('method', 'Method, limits and sources', 'book',
      'How the numbers are made, what they do and do not show, and where every formula comes from. The full notes, with page-level checks, are in docs/references.md of the repository.');
    const sec = (title, iconName, ...content) => h('div', { class: 'card wide' }, h('h3', null, icon(iconName), title), ...content);
    const term = (t, d) => [h('dt', null, t), h('dd', null, d)];
    body.append(
      sec('Terms used in this lab', 'list-details',
        h('dl', { class: 'kv' },
          ...term(tm`QBER ($Q$, $Q_Z$, $Q_X$)`, tm`Quantum bit error rate: the fraction of rounds in which Alice’s and Bob’s bits differ when both measure in the same basis (Z = key basis $0^\circ/0^\circ$, X = $90^\circ/90^\circ$).`),
          ...term('Werner state', tm`The entangled pair mixed with white noise: visibility $v$ times $\lvert\Phi^+\rangle\langle\Phi^+\rvert$ plus $(1 - v)$ times the maximally mixed state. Depolarizing noise of strength $\lambda$ gives $v = 1 - \lambda$.`),
          ...term('DI (device-independent)', tm`A claim that needs no model of the devices, only the observed statistics (here: $S$ and $Q$), assuming i.i.d. rounds.`),
          ...term('BBM92', 'Entanglement-based key distribution (Bennett, Brassard, Mermin 1992) with trusted qubit measurements.'),
          ...term('i.i.d.', 'Independent and identically distributed rounds; all intervals and bounds here assume it.'),
          ...term(tm`$h(x)$`, tm`Binary entropy, $h(x) = -x\log_2 x - (1 - x)\log_2(1 - x)$.`),
          ...term('Pauli frame', 'Bit flips that a repeater’s Bell-measurement result requires, applied to Bob’s recorded bit in software instead of in the circuit.'),
          ...term('BBPSSW, DEJMPS', 'Two entanglement-purification protocols (1996): two noisy pairs in, at most one better pair out.'),
          ...term('TLM', 'Tsirelson–Landau–Masanes: the inequalities that decide whether four correlators are reachable by quantum mechanics.'))),
      sec('1. State, settings and the CHSH value', 'atom',
        h('p', null, tm`The source prepares $\lvert\Phi^+\rangle = (\lvert 00\rangle + \lvert 11\rangle)/\sqrt{2}$. A measurement along angle $\theta$ in the X–Z plane is $R_y(-\theta)$ followed by a Z measurement; bit 0 means outcome +1. Alice uses $0^\circ$ (key), $90^\circ$ and $\pm 45^\circ$; Bob uses $0^\circ$ and $90^\circ$. Six settings are measured; four give the CHSH value $S$ and two give the BBM92 error rates.`),
        math(F.chsh, 'S equals E00 plus E01 plus E10 minus E11, where E is the difference between same and different outcomes divided by the number of rounds')),
      sec('2. Noise and the eavesdropper', 'wave-sine',
        h('p', null, tm`Link noise is a Pauli channel on Bob’s qubit, $\rho \mapsto p_I\,\rho + p_X\,X\rho X + p_Y\,Y\rho Y + p_Z\,Z\rho Z$, built exactly from two ancilla qubits that are rotated and then control X and Z on Bob’s qubit. Depolarizing noise of strength $\lambda$ gives the Werner state with visibility $1 - \lambda$. The eavesdropper is a probe qubit coupled to Bob’s qubit by a controlled-$R_y(\varphi)$: $\varphi = 180^\circ$ is a full intercept of the Z value.`),
        h('p', null, tm`Every prediction shown next to a measurement comes from the exact channel model (Bell-diagonal weights), and the test suite checks the circuits against it to $10^{-9}$ using exact output distributions.`)),
      sec('3. Finite statistics', 'chart-histogram',
        h('p', null, tm`Rounds are treated as independent and identically distributed. $S$ gets a two-sided Hoeffding interval, the error rates get Wilson score intervals; the risk $\delta = 0.05$ is split equally between $S$ and the error rates. For the Munich data, where only $S$ is estimated, the whole $\delta$ goes to $S$.`),
        math(F.hoeff, 't equals the square root of 2 log of 2 over delta prime times the sum of 1 over N k'),
        h('p', null, tm`Each certificate is evaluated twice: at the point estimate, and at the conservative end ($S$ at its lower end, error rates at their upper ends).`)),
      sec('4. The certificates', 'certificate',
        h('p', null, 'BBM92 key rate, trusted devices (Shor–Preskill-type asymptotic bound):'), math(F.bbm92, 'r BBM92 equals 1 minus h of Q Z minus h of Q X'),
        h('p', null, tm`Device-independent key rate against collective attacks (Acín et al. 2007), using the key-basis error rate $Q$:`), math(F.acin, 'r DI equals 1 minus h of Q minus h of one plus square root of S over 2 squared minus 1, over 2'),
        h('p', null, 'Device-independent randomness (Pironio et al. 2010), bits of min-entropy per round:'), math(F.pironio, 'H min is at least 1 minus log base 2 of 1 plus square root of 2 minus S squared over 4'),
        h('p', null, tm`Self-testing (Kaniewski 2016): the extractability $F$ of a $\lvert\Phi^+\rangle$ with local channels:`), math(F.kaniewski, 'F is at least one half plus one half times S minus beta star over 2 root 2 minus beta star, with beta star equal to 16 plus 14 root 2 over 17'),
        h('p', null, tm`Entanglement witness with trusted measurements: the fidelity with $\lvert\Phi^+\rangle$ is at least $(\langle XX\rangle + \langle ZZ\rangle)/2$, and equals $(1 + \langle XX\rangle - \langle YY\rangle + \langle ZZ\rangle)/4$ when YY is also measured.`)),
      sec('5. Swapping, purification and geometry', 'route',
        h('p', null, tm`Repeaters perform Bell measurements (CNOT, then H) that are deferred to the end of the circuit; Bob’s recorded bit is corrected by the parity of the relevant repeater bits (a Pauli frame). This gives the same statistics as feed-forward and runs on IonQ targets, which do not execute mid-circuit feedback. Purification applies CNOTs between two pairs, measures the second pair in Z and keeps rounds where Alice’s and Bob’s results agree: the recurrence step of BBPSSW, without its random twirl, or of DEJMPS, which adds $R_x(\pm\pi/2)$ first.`),
        h('p', null, tm`A correlator vector (with every $\lvert E\rvert \le 1$) is local if it satisfies all eight CHSH inequalities, and quantum if it satisfies the Tsirelson–Landau–Masanes inequalities, taken over the eight sign vectors $s$ with $s_{00}\,s_{01}\,s_{10}\,s_{11} = -1$:`), math(F.tlm, 'the maximum over sign vectors s with product minus one of the sum of s times arcsine E is at most pi')),
      sec('Limits', 'alert-triangle',
        h('ul', null,
          h('li', null, 'A simulated CHSH value above 2 shows nothing about nature and closes no loophole.'),
          h('li', null, 'The key and randomness numbers are asymptotic formulas evaluated at finite-sample confidence ends. They are not finite-size or composable security proofs.'),
          h('li', null, 'Simulator outcomes come from pseudo-random number generators; nothing here is a quantum random number generator.'),
          h('li', null, 'IBM and IonQ noise models are models of devices, not the devices. The lab is meant for Qollab’s free simulators: a backend whose name or class contains “qpu” (as IonQ’s hardware does) is refused, and an unrecognised backend runs with a conservative default profile.'),
          h('li', null, 'Post-selected purification assumes the keep/discard decision is independent of the measurement settings.'),
          h('li', null, 'Published values are quoted as the authors give them; rates shown next to them are our recomputation and may use a different protocol than the authors’.'))),
      sec('Disclosure', 'info-circle',
        h('p', null, 'Generative-AI coding assistants drafted most of the code, documentation and research notes under the author’s direction; the author set the design, reviewed the changes, ran the tests and checked the cited sources. The reviews recorded in docs/review.md were also run with AI assistants; the author checked each finding before it was fixed.'),
        h('p', null, 'The author previously showed an E91/CHSH Werner-state model in a separate public demo; no code from it is used here. Similar simulations exist on GitHub (listed in docs/references.md); this lab’s focus is one estimator feeding a ladder of certificates, finite statistics, and the same formulas applied to open experimental data.'),
        h('p', null, 'This effort is supported by Qollab & IonQ. Code: MIT License, Copyright (c) 2026 Amon Koike (Quantum Daemons).'),
        h('p', null, 'Third-party: Qiskit (Apache-2.0); three.js (MIT, loaded through Qollab); Tabler Icons subset (MIT); Munich Bell-test event files (CC BY 4.0, Rosenfeld et al., Zenodo 10.5281/zenodo.22936124). Published values from Lu et al. and Liu et al. come from their CC BY 4.0 data records. Details in THIRD_PARTY_NOTICES.md.')),
      sec('References', 'books',
        note('', 'Links cannot open from inside this frame, so DOIs are given as text.'),
        h('ol', { class: 'small refs' }, REFS.map(([cite, doi]) => h('li', null, cite, doi ? h('span', { class: 'muted' }, ` — doi:${doi}`) : '')))),
    );
    return { element };
  },
};
