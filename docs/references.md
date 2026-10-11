# References and fact-check notes (checked 2026-10-09; updated 2026-10-12)

Dates in this file are Japan time (JST, UTC+9). The edit deadline was 2026-10-12 08:00 JST
(2026-10-11 19:00 ET); every check dated 2026-10-12 was made before it.

**How to read this.** Each entry has a label for its kind of source:

- **experiment**: laboratory data
- **theory**: proofs, bounds and proposals
- **review**
- **simulation**: another group's numerical study
- **press**: press releases and news, never used as a source of technical numbers
- **docs** or **software**

Everything this project computes from its own circuits is a **simulation**. It runs Qiskit circuits on local simulators (Qiskit Aer, BasicSimulator) or on IonQ cloud noise models. The only experimental inputs are published values (§3) and one open event dataset that we re-analyse (Rosenfeld 2017, §1).

- **A simulated CHSH value above 2 shows nothing about nature and closes no loophole.**
- **The device-independent (DI) bounds shown here are not security proofs.** Our DI key-rate and randomness numbers come from asymptotic formulas, mostly for collective (i.i.d.) attacks, evaluated at one end of a finite-sample confidence interval.
  - The interval for $`S`$ is a Hoeffding interval. The intervals for the QBERs are Wilson score intervals.
  - In the app's own runs, $`\delta = 0.05`$ is split $`\delta/2 + \delta/2`$ (Bonferroni) between $`S`$ and the QBERs. For the Rosenfeld data only $`S`$ is estimated, so the full $`\delta`$ goes to $`S`$.
  - These are i.i.d. plug-in bounds. They show how the bounds respond to noise. They are not finite-size or composable security proofs, and they certify neither a key nor randomness.
- **Simulator "measurement outcomes" are pseudo-random.** Aer uses `std::mt19937_64` and BasicSimulator uses NumPy `default_rng`. Both give the same output for the same seed; our environment check uses seed 20261009 by default.

Each entry says which text was actually read: the full text, the arXiv version of a paywalled paper, or the abstract only. "Not checked" marks anything a primary source did not confirm; §11 lists these points. Quotes are under 15 words. F-numbers refer to §9.

Conventions: outcomes are $`\pm 1`$, $`E_{xy} = \langle A_x B_y\rangle`$, and $`S = E_{00} + E_{01} + E_{10} - E_{11}`$.

## 1 Foundations (CHSH, Tsirelson, Werner, BBM92/Ekert, Shor–Preskill)

### Bell inequalities and quantum limits

- **CHSH 1969.** J. F. Clauser, M. A. Horne, A. Shimony, R. A. Holt, "Proposed Experiment to Test Local Hidden-Variable Theories", *Phys. Rev. Lett.* 23, 880–884 (1969). https://doi.org/10.1103/PhysRevLett.23.880. *Theory.*
  - **What it shows:** makes Bell's theorem testable without perfect correlations. It assumes deterministic local $`\pm 1`$ outcomes and a hidden-variable distribution that does not depend on the settings.
  - The paper gives a three-correlation form (Eq. 1a) and an angle-difference form (Eq. 1b). The four-term $`\lvert S\rvert \le 2`$ (F1) is the standard rewritten form, not a quotation.
  - The coincidence-rate version (Eq. 2) adds a fair-sampling-type assumption (footnote 8). This is the origin of the detection loophole.
  - **Numbers:** largest violation at polariser-angle differences of 22.5° and 67.5°. On the qubit Bloch sphere these are 45° and 135°.
  - **Read:** full text (APS scan).

- **Tsirelson 1980.** B. S. Cirel'son, "Quantum generalizations of Bell's inequality", *Lett. Math. Phys.* 4, 93–100 (1980). https://doi.org/10.1007/BF00417500. *Theory.*
  - **What it shows:** correlations of commuting observables bounded by $`\pm 1`$ are inner products of real unit vectors (Theorem 1).
  - A sum-of-squares identity on p. 95 gives $`\lvert S\rvert \le 2\sqrt{2}`$ in any dimension, compared with 2 classically (F2).
  - Proofs of the theorems are deferred to later work.
  - **Read:** scanned original, pp. 93–96.

- **Werner 1989.** R. F. Werner, "Quantum states with Einstein-Podolsky-Rosen correlations admitting a hidden-variable model", *Phys. Rev. A* 40, 4277–4281 (1989). https://doi.org/10.1103/PhysRevA.40.4277. *Theory.*
  - **What it shows:** entangled states can still have local hidden-variable models, so entanglement is not the same as Bell nonlocality.
  - For two qubits the relevant family is $`\rho_v = v\,\lvert\psi^-\rangle\langle\psi^-\rvert + (1-v)\,I/4`$. This lab uses the same family with $`\lvert\Phi^+\rangle`$ (F3); with $`\lvert\psi^-\rangle`$ the QBERs of F3 hold after Bob flips his bit.
  - The original model covers projective measurements up to $`v = 1/2`$. This value comes from Hirsch 2017, not from reading Werner's text.
  - **Caveat:** the $`S`$ and QBER formulas in F3 are standard derivations. They are not stated in this paper.
  - **Read:** abstract only (paywall).

- **Horodecki 1995.** R. Horodecki, P. Horodecki, M. Horodecki, "Violating Bell inequality by mixed spin-1/2 states: necessary and sufficient condition", *Phys. Lett. A* 200, 340–344 (1995). https://doi.org/10.1016/0375-9601(95)00214-N. *Theory.*
  - **What it shows:** the usual source for $`S_\text{max} = 2\sqrt{M(\rho)}`$ (F4).
  - **Read:** Crossref metadata and a secondary restatement only; the paper itself was not read. The Crossref record (checked 2026-10-12) gives the title without "spin-1/2"; we did not see the publisher's page.

- **Werner-state locality thresholds (F5).** *Theory.*
  - **Hirsch 2017.** F. Hirsch, M. T. Quintino, T. Vértesi, M. Navascués, N. Brunner, *Quantum* 1, 3 (2017). https://doi.org/10.22331/q-2017-04-25-3 · [arXiv:1609.06114](https://arxiv.org/abs/1609.06114).
    - Gives local models up to $`v \approx 0.6829`$ for projective measurements and $`v \approx 0.4553`$ for general measurements (POVMs). Both values have since been improved by the next two papers.
    - Read: arXiv v4.
  - **Designolle 2023.** S. Designolle et al., *Phys. Rev. Research* 5, 043059 (2023). https://doi.org/10.1103/PhysRevResearch.5.043059 · [arXiv:2302.04721](https://arxiv.org/abs/2302.04721).
    - For projective measurements: local for $`v \le 0.6875`$ and nonlocal for $`v \ge 0.6961`$ (0.69604 in the 2026 follow-up below). The nonlocality uses a Bell inequality with many settings, not CHSH.
    - Bounds on the Grothendieck constant: $`1.4367 \le K_G(3) \le 1.4546`$.
    - The follow-up S. Designolle, T. Vértesi, S. Pokutta, *Phys. Rev. A* 113, 022401 (2026), https://doi.org/10.1103/m5mn-c5dx · arXiv:2409.03739 (v4), lowers the upper threshold to about 0.69604.
    - Read: APS abstract and arXiv HTML. arXiv v4 (2026-10-05) adds an erratum on the multipartite results and a lemma; the two-qubit bounds 0.6875/0.6961 and $`1.4367 \le K_G(3) \le 1.4546`$ used here are unchanged (checked 2026-10-10).
  - **Renner 2024.** M. J. Renner, *Phys. Rev. Lett.* 132, 250202 (2024). https://doi.org/10.1103/PhysRevLett.132.250202 · [arXiv:2309.12290](https://arxiv.org/abs/2309.12290).
    - Gives a local model for all POVMs at $`v = 1/2`$.
    - Read: abstract only.

### Entanglement-based QKD

- **Ekert 1991.** A. K. Ekert, "Quantum cryptography based on Bell's theorem", *PRL* 67, 661–663 (1991). https://doi.org/10.1103/PhysRevLett.67.661. *Theory.*
  - **What it shows (E91):** a singlet source. Alice measures at Bloch azimuths $`0, \pi/4, \pi/2`$ and Bob at $`\pi/4, \pi/2, 3\pi/4`$. Two perfectly anticorrelated setting pairs give the key; the other pairs give $`S = -2\sqrt{2}`$.
  - Eavesdroppers who fix spin components can only reach $`\lvert S\rvert \le \sqrt{2}`$.
  - **Caveats:** the security argument is heuristic, and the fake-source case is only conjectured.
  - **Read:** full text (scan) and APS abstract.

- **BBM92.** C. H. Bennett, G. Brassard, N. D. Mermin, "Quantum cryptography without Bell's theorem", *PRL* 68, 557–559 (1992). https://doi.org/10.1103/PhysRevLett.68.557. *Theory.*
  - **What it shows:** an EPR-pair scheme argued to be secure without Bell's theorem, including when the source is substituted. It is equivalent to BB84.
  - **Caveats:**
    - The abstract's "prove" predates modern composable proofs.
    - The protocol details we use (two conjugate bases, sifting) come from standard knowledge. Not checked against the full text.
    - Any CHSH value we compute alongside BBM92 is a diagnostic only.
  - **Read:** abstract only.

- **Shor–Preskill 2000.** P. W. Shor, J. Preskill, "Simple Proof of Security of the BB84 Quantum Key Distribution Protocol", *PRL* 85, 441–444 (2000). https://doi.org/10.1103/PhysRevLett.85.441 · [arXiv:quant-ph/0003004](https://arxiv.org/abs/quant-ph/0003004). *Theory.*
  - **What it shows:** reduces a CSS-code entanglement-purification protocol to prepare-and-measure BB84.
  - **Numbers:**
    - Rate $`1 - 2H(\delta)`$ per code qubit, positive below "11%". The numerical root is 0.110028.
    - The Gilbert–Varshamov version has threshold 0.055014 (F6).
  - **Caveats:**
    - Asymptotic, one-way, Shannon-limit codes and a perfect single-photon source.
    - Not device-independent.
    - Does not account for sifting.
  - **Read:** arXiv v2.

- **Scarani 2009.** V. Scarani et al., "The security of practical quantum key distribution", *Rev. Mod. Phys.* 81, 1301 (2009). https://doi.org/10.1103/RevModPhys.81.1301 · [arXiv:0802.4155](https://arxiv.org/abs/0802.4155). *Review.*
  - **What it shows:** Appendix A gives the rate $`r = 1 - h(\varepsilon_z) - h(\varepsilon_x)`$ (F7).
  - **Numbers (QBER thresholds):**

    | Protocol / processing | Threshold |
    |---|---|
    | BB84, one-way | ≈ 11% |
    | Six-state | ≈ 12.61% |
    | With pre-processing | 12.4% or 12.9% |
    | Two-way | ≥ 20.0% |

  - **Caveat:** the BB84 worst case is phase-covariant cloning, not depolarising noise. The two give the same rate only because $`\varepsilon_y`$ is not monitored.
  - **Read:** arXiv v3, App. A.

### Loophole-free Bell tests (2015–2023)

These experiments closed the detection and locality loopholes together. They still assume free setting choices and that recorded outcomes are final (Kulikov 2026, §4, drops the assumption of perfect randomness: it starts from imperfect randomness from a physical source and amplifies it).

- **Hensen 2015.** B. Hensen et al., *Nature* 526, 682–686 (2015). https://doi.org/10.1038/nature15759 · [arXiv:1508.05949](https://arxiv.org/abs/1508.05949). *Experiment.*
  - **What it shows:** NV-centre spins 1280 m apart, heralded by entanglement swapping.
  - **Numbers:**
    - 245 trials in 220 h.
    - $`S = 2.42 \pm 0.20`$. The ± comes from an i.i.d. Gaussian analysis.
    - $`p = 0.019`$ in the conventional analysis and $`p \le 0.039`$ in the complete analysis. The latter is about $`1.76\sigma`$ one-sided, which is modest.
    - Heralding succeeded about $`6.4 \times 10^{-9}`$ per attempt.
  - **Read:** arXiv, and the published abstract via PubMed.
  - **Follow-up (Hensen 2016).** B. Hensen et al., "Loophole-free Bell test using electron spins in diamond: second experiment and additional analysis", *Sci. Rep.* 6, 30289 (2016). https://doi.org/10.1038/srep30289. A second run gives $`S = 2.35 \pm 0.18`$; combined with the first, $`S = 2.38 \pm 0.14`$. Read: Crossref record and abstract (2026-10-11).

- **Giustina 2015.** M. Giustina et al., *PRL* 115, 250401 (2015). https://doi.org/10.1103/PhysRevLett.115.250401 · [arXiv:1511.03190](https://arxiv.org/abs/1511.03190). *Experiment.*
  - **What it shows:** a photonic test of the CH–Eberhard inequality ($`J \le 0`$) with stations about 58 m apart.
  - **Numbers:**
    - $`J = 7.27 \times 10^{-6}`$ and $`p \le 3.74 \times 10^{-31}`$, without assuming i.i.d. trials.
    - Heralding efficiencies about 78.6% and 76.2%.
  - **Caveat:** the paper reports no CHSH $`S`$.
  - **Read:** arXiv v2.

- **Shalm 2015.** L. K. Shalm et al., *PRL* 115, 250402 (2015). https://doi.org/10.1103/PhysRevLett.115.250402 · [arXiv:1511.03189](https://arxiv.org/abs/1511.03189). *Experiment.*
  - **What it shows:** a CH-type test with Alice and Bob about 184.9 m apart.
  - **Numbers:**
    - $`p = 5.9 \times 10^{-9}`$, or $`2.3 \times 10^{-7}`$ when extra setting predictability is allowed.
    - Comes from a selected final 30-minute dataset.
  - **Caveats:**
    - The paper reports no CHSH $`S`$.
    - The arXiv body text and Fig. 3 give $`5.8 \times 10^{-9}`$. Table I and the abstracts give $`5.9 \times 10^{-9}`$, which is the value we use.
  - **Read:** latest arXiv version.

- **Rosenfeld 2017.** W. Rosenfeld et al., "Event-Ready Bell Test Using Entangled Atoms Simultaneously Closing Detection and Locality Loopholes", *PRL* 119, 010402 (2017). https://doi.org/10.1103/PhysRevLett.119.010402 · [arXiv:1611.04604](https://arxiv.org/abs/1611.04604). Event data: https://doi.org/10.5281/zenodo.22936124 (CC BY 4.0, published 2026-09-24). *Experiment, with open event data.*
  - **What it shows:** an event-ready Bell test between two atoms in separate labs. The data record holds the valid events of two runs: 15 April 2016 (10,201 events) and 14 June 2016 (10,202 events). We re-analyse both with the same estimator we use for simulated counts.
  - **Numbers (our re-analysis of the open data):**
    - The main-text $`S = 2.221 \pm 0.033`$ is the 15 April 2016 run, not the public 14 June run.
    - The paper uses 5,000 events per heralded state ($`\Psi^-`$ and $`\Psi^+`$). We take the first 5,000 of each in file order. That is our reading, and it reproduces the paper's Tables S8 and S10 count for count.
    - Pooled over both states: $`S = 2.2213 \pm 0.0332`$ (April; paper 2.221 ± 0.033) and $`S = 2.0957 \pm 0.0340`$ (June). The ± is an i.i.d. Gaussian standard error, as in the paper.
    - Per state, April: 2.2399 ($`\Psi^-`$) and 2.2039 ($`\Psi^+`$). Without the 5,000-event cut: 2.2462 and 2.1977.
    - Two-sided Hoeffding interval at $`\delta = 0.05`$, with all of $`\delta`$ on $`S`$: $`S_\text{low} = 2.1126`$ (April) and 1.9870 (June). At that confidence the June run does not exceed 2.
  - **Caveats:**
    - The paper's p-values come from martingale-based methods that do not assume i.i.d. trials. Our Hoeffding end does assume independent events.
    - The data have no key-basis setting pair, so no QBER or DI key rate can be computed from them. Only $`S`$-based quantities apply.
    - Lab 1 and lab 2 correspond to Alice and Bob only by convention.
    - For in-browser fetches, only the Zenodo API content URL sends an `Access-Control-Allow-Origin` header; the `?download=1` URL does not (checked 2026-10-09).
  - **Read:** arXiv v2 (main text and supplement) and the Zenodo record (README and both data files).

- **Storz 2023.** S. Storz et al., "Loophole-free Bell inequality violation with superconducting circuits", *Nature* 617, 265–270 (2023). https://doi.org/10.1038/s41586-023-05885-0. *Experiment.*
  - **What it shows:** a loophole-free CHSH-type test between two superconducting qubits connected by a cryogenic link spanning 30 m; the average $`S`$ over more than 1 million trials is 2.0747.
  - **Read:** Crossref abstract only (2026-10-11).

## 2 Device-independent bounds (Acín 2007, Pironio 2010, self-testing, finite-size/EAT, noisy preprocessing)

- **Acín 2007.** A. Acín et al., "Device-independent security of quantum cryptography against collective attacks", *PRL* 98, 230501 (2007). https://doi.org/10.1103/PhysRevLett.98.230501 · [arXiv:quant-ph/0702152](https://arxiv.org/abs/quant-ph/0702152). *Theory.*
  - **What it shows:**
    - Protocol: Alice has settings $`A_0, A_1, A_2`$ and Bob has $`B_1, B_2`$. The key comes from $`\{A_0, B_1\}`$ with $`Q = P(a_0 \neq b_1)`$; CHSH uses the other four settings.
    - For collective attacks with reverse reconciliation and symmetrised marginals, Eve's information depends only on $`S`$, and the bound is tight (F9).
  - **Numbers:**
    - With depolarising noise, the DI critical QBER is 7.1%, compared with 11% when devices are trusted.
    - Our recomputation: $`Q^{\ast} = 7.1492\%`$, $`S^{\ast} = 2.4240`$, visibility $`v^{\ast} = 0.8570`$.
  - **Caveats:**
    - Collective attacks and asymptotic key length only.
    - The paper notes that it does not cover general attacks.
    - It also notes that the detection loophole blocked application to the devices of the time.
  - **Read:** arXiv v2.

- **Pironio 2009.** S. Pironio et al., "Device-independent quantum key distribution secure against collective attacks", *New J. Phys.* 11, 045021 (2009). https://doi.org/10.1088/1367-2630/11/4/045021 · [arXiv:0903.4460](https://arxiv.org/abs/0903.4460). *Theory.*
  - **What it shows:** the full proof. Eq. 12 is F9 and Eq. 13 is F11. The devices are stated to be memoryless and i.i.d.
  - **Numbers:**
    - A CHSH violation needs detection efficiency $`\eta > 82.8\%`$.
    - A positive key needs $`\eta \approx 92.4\%`$ when no-clicks are mapped to $`-1`$ (Fig. 3). Our recomputation gives ≈ 92.3%.
    - There is no security if Eve knows Bob's setting with probability $`\ge \sqrt{2} - 1`$.
  - **Read:** arXiv v1.

- **Pironio 2010.** S. Pironio et al., "Random numbers certified by Bell's theorem", *Nature* 464, 1021–1024 (2010). https://doi.org/10.1038/nature09008 · [arXiv:0911.3427](https://arxiv.org/abs/0911.3427). *Theory plus proof-of-concept experiment.*
  - **What it shows:**
    - A finite-$`n`$ min-entropy bound that allows devices with memory (F14b).
    - The closed form we plot (arXiv appendix Eq. 6; F14) is the tight bound on Alice's **local** min-entropy $`H_\text{min}(A \mid X)`$. It is only a loose lower bound on the pair min-entropy, which needs an SDP (about 1.23 bits at the Tsirelson point).
  - **Numbers:**
    - Two ¹⁷¹Yb⁺ ions about 1 m apart; 3,016 events over about one month.
    - $`I = 2.414 \pm 0.058`$, where the ± assumes i.i.d. runs.
    - Certified: more than 42 bits of min-entropy at 99% confidence.
    - Our arithmetic for comparison: $`3{,}016 \times \text{F14}(2.414) \approx 613`$ bits. The difference shows how large the finite-statistics penalty is.
  - **Caveats:**
    - The locality loophole was open.
    - The bound holds against an adversary who measures side information before extraction. It is not proven universally composable.
  - **Read:** arXiv v3. The Nature version was not compared.

- **Kaniewski 2016.** J. Kaniewski, *PRL* 117, 070402 (2016). https://doi.org/10.1103/PhysRevLett.117.070402 · [arXiv:1604.08176](https://arxiv.org/abs/1604.08176). *Theory.*
  - **What it shows:** a self-testing bound that uses the CHSH value alone. It bounds the singlet *extractability*: the largest fidelity with a singlet-equivalent state that local channels (no shared randomness, no communication) can reach from the unknown state, in any dimension.
  - **Formula (Eq. 10):** extractability $`\ge 1/2 + (1/2)(S - \beta^{\ast})/(2\sqrt{2} - \beta^{\ast})`$, with $`\beta^{\ast} = (16 + 14\sqrt{2})/17 \approx 2.1058`$.
    - Non-trivial only for $`S > \beta^{\ast}`$.
    - Examples: 0.565 at $`S = 2.2`$ and 0.704 at $`S = 2.4`$.
  - **Caveats:**
    - We call this "extractability (local channels)". It is not the fidelity of the physical state.
    - The true DI threshold for non-trivial extractability lies somewhere in [2.05, 2.11] and is unresolved. Valcarce et al., *Quantum* 4, 246 (2020), https://doi.org/10.22331/q-2020-03-23-246 · [arXiv:1910.04606](https://arxiv.org/abs/1910.04606), give a state with trivial extractability at $`S \approx 2.05`$. Bhavsar, Wooltorton and Bae, *PRX Quantum* 6, 040356 (2025), https://doi.org/10.1103/1j5f-qjhx · [arXiv:2505.06833](https://arxiv.org/abs/2505.06833), still describe the tight bound for local channels as open.
    - The paper's statement is about expectation values. Our finite-sample value plugs in an i.i.d. Hoeffding end for $`S`$; it is not a composable proof.
  - **Read:** arXiv v3 (Eq. 10). Valcarce 2020 and Bhavsar 2025 were checked only for the threshold statement above. Their records were checked on 2026-10-12 in Crossref (authors, volume, article number, DOI) and on the arXiv abstract pages (Bhavsar: v3 of 12 Dec 2025 lists the same DOI).

- **Arnon-Friedman 2018.** R. Arnon-Friedman, F. Dupuis, O. Fawzi, R. Renner, T. Vidick, "Practical device-independent quantum cryptography via entropy accumulation", *Nat. Commun.* 9, 459 (2018). https://doi.org/10.1038/s41467-017-02307-4. *Theory.*
  - **What it shows:** the Entropy Accumulation Theorem (EAT; F15). It gives finite-$`n`$ DIQKD security against general, non-i.i.d. attacks, built on the single-round form of F9 (F10), with an explicit key length (Eq. 35).
  - **Numbers:**
    - Plotted with soundness $`10^{-5}`$ and completeness $`10^{-2}`$.
    - The asymptotic 7.1% is reached only near $`n \approx 10^{15}`$ rounds.
  - **Caveat:** Fig. 1 rounds the quantum CHSH winning probability to "approximately 86%". The exact value is $`\cos^2(\pi/8) = 85.36\%`$.
  - **Read:** open-access journal text (Europe PMC).

- **Arnon-Friedman 2019.** R. Arnon-Friedman, R. Renner, T. Vidick, "Simple and tight device-independent security proofs", *SIAM J. Comput.* 48, 181–225 (2019). https://doi.org/10.1137/18M1174726 · [arXiv:1607.01797](https://arxiv.org/abs/1607.01797). *Theory.*
  - **What it shows:** lists the DI assumptions explicitly (Sec. 2.4).
  - **Numbers:**
    - Curves for $`\bar{n} = 10^{7}`$ to $`10^{15}`$; finite-size effects matter up to about $`10^{10}`$.
    - Fig. 6 gives $`r \approx 87\%`$, 53% and 22% at $`Q = 0.5\%`$, 2.5% and 5%.
  - **Caveat:** the plots use an expected-rounds variant. A fixed number of rounds needs about 100 times more signals.
  - **Read:** arXiv v3.

- **Dupuis 2020.** F. Dupuis, O. Fawzi, R. Renner, "Entropy accumulation", *Commun. Math. Phys.* 379, 867–913 (2020). https://doi.org/10.1007/s00220-020-03839-5 · [arXiv:1607.01796](https://arxiv.org/abs/1607.01796). *Theory.*
  - **What it shows:** the mathematical proof of the EAT.
  - **Read:** abstract only.

- **Ho 2020.** M. Ho et al., "Noisy preprocessing facilitates a photonic realization of device-independent quantum key distribution", *PRL* 124, 230502 (2020). https://doi.org/10.1103/PhysRevLett.124.230502 · [arXiv:2005.13015](https://arxiv.org/abs/2005.13015). *Theory.*
  - **What it shows:** Bob flips raw-key bits at random before error correction (F12).
  - **Numbers:**
    - The paper reports detection-efficiency thresholds for SPDC sources: 92.7%, 90.9% and 83.2%.
    - It states no depolarising $`S`$ threshold.
    - Our reproduction gives $`Q^{\ast} = 8.0848\%`$ and $`S^{\ast} = 2.3711`$, which matches Woodhead 2021.
  - **Read:** arXiv v1 main text. The supplement was not read.

- **Woodhead 2021.** E. Woodhead, A. Acín, S. Pironio, "Device-independent quantum key distribution with asymmetric CHSH inequalities", *Quantum* 5, 443 (2021). https://doi.org/10.22331/q-2021-04-26-443 · [arXiv:2007.16146](https://arxiv.org/abs/2007.16146). *Theory.*
  - **Numbers:** Table 1 depolarising thresholds:
    - Standard CHSH: 7.1492%, or 8.0848% with preprocessing.
    - Asymmetric CHSH: up to 7.4177% and 8.3453%.
  - **Read:** arXiv v3.

- **Schwonnek 2021.** R. Schwonnek et al., "Device-independent quantum key distribution with random key basis", *Nat. Commun.* 12, 2880 (2021). https://doi.org/10.1038/s41467-021-23147-3 · [arXiv:2005.02691](https://arxiv.org/abs/2005.02691). *Theory.*
  - **What it shows:** a protocol that draws the key from both of Alice's bases (F13).
  - **Numbers (depolarising, asymptotic):**
    - Critical $`S`$ drops from 2.423 to 2.362, and critical QBER rises from 7.1% to 8.2%.
    - The random basis only helps for $`S \lesssim 2.5`$.
    - A positive finite key needs about $`10^{8}`$ to $`10^{10}`$ rounds.
  - **Caveat:** this is where the "2.362" threshold comes from. It does not apply to single-basis protocols.
  - **Read:** arXiv v2.

- **Statistics behind the confidence ends.** *Theory.*
  - **Hoeffding 1963.** W. Hoeffding, "Probability Inequalities for Sums of Bounded Random Variables", *J. Am. Stat. Assoc.* 58, 13–30 (1963). https://doi.org/10.1080/01621459.1963.10500830. Used for the interval on $`S`$. Read: Crossref record only.
  - **Wilson 1927.** E. B. Wilson, "Probable Inference, the Law of Succession, and Statistical Inference", *J. Am. Stat. Assoc.* 22, 209–212 (1927). https://doi.org/10.1080/01621459.1927.10502953. Used for the score intervals on the QBERs. Read: Crossref record only.

- **Zapatero 2023.** V. Zapatero et al., "Advances in device-independent quantum key distribution", *npj Quantum Inf.* 9, 10 (2023). https://doi.org/10.1038/s41534-023-00684-x · [arXiv:2208.12842](https://arxiv.org/abs/2208.12842). *Review.*
  - **Numbers:** detection-efficiency thresholds from 92.4% down to 80.3%, depending on the protocol.
  - **Read:** excerpts only. We use the primary papers for numbers.

## 3 Experiments: DI-QKD 2022 and 2026

| Experiment | Platform | Distance | $`S`$ | QBER | Key result | Regime |
|---|---|---|---|---|---|---|
| Nadlinger 2022 | ⁸⁸Sr⁺ ions | nodes ≈ 2 m apart | 2.677(6)ᵃ | 1.44(2)%ᵃ | 95,884 bits (95,628 net) | finite-size, general attacks, $`\varepsilon = 10^{-10}`$ |
| Zhang 2022 | ⁸⁷Rb atoms | labs 400 m apart, 700 m fibre | 2.578(75) | 7.8(9)% | 0.07 per event | asymptotic; no key extracted |
| Liu 2022 | photons | 20–220 m added fibre | —ᵇ | not reported | $`2.33 \times 10^{-4}`$ per pulse | asymptotic, collective attacks |
| Liu 2026 | ⁴⁰Ca⁺ ions | 10 km, spooled | 2.5758(59) | 3.60(6)% | 1,917 bits, $`\varepsilon = 10^{-5}`$ | finite-size |
| Liu 2026 | ⁴⁰Ca⁺ ions | 101 km, spooled | 2.494 ± 0.075ᶜ | 6.92 ± 1.13%ᶜ | 0.0974 per round | asymptotic, 2,799 rounds |
| Lu 2026 | ⁸⁷Rb atoms | 11 km, spooled, one lab | 2.612(31) | 2.85% | 0.112 bits/event (estimated) | finite-size, $`\varepsilon = 10^{-5}`$ |
| Lu 2026 | ⁸⁷Rb atoms | 100 km, spooled, one lab | 2.495 ± 0.103ᶜ | 7.16 ± 0.89%ᶜ | positive | asymptotic, different variant |
| Meiers 2026 | ⁴⁰Ca⁺ ion + photon | 25 km, spooled | 2.75 (+0.16/−0.15)ᵈ | ≈1.4%ᵉ | "69 bits" (model value) | no DI key-generation claim (window optimised on the same data) |

ᵃ From a separate characterisation run, not from the key run.
ᵇ Only a separate calibration run gives a CHSH value ($`\omega = 0.7559`$, $`S \approx 2.047`$).
ᶜ From the authors' deposited source data (CC BY 4.0): Liu 2026 `Fig_4d.xlsx` (https://doi.org/10.5281/zenodo.18218281) and Lu 2026 `Fig_5.xlsx` (https://doi.org/10.5281/zenodo.17958512). For Liu 2026 at 101 km, the arXiv v1 text gives $`S = 2.504(75)`$ and $`Q = 6.9(1.1)\%`$.
ᵈ Measured in a time window that was chosen using the same data.
ᵉ ≈1.4%, a model value computed from $`S`$, not measured.

- **Nadlinger 2022.** D. P. Nadlinger et al., "Experimental quantum key distribution certified by Bell's theorem", *Nature* 607, 682–686 (2022). https://doi.org/10.1038/s41586-022-04941-5 · [arXiv:2109.14600](https://arxiv.org/abs/2109.14600). *Experiment.*
  - **What it shows:** the first complete DI-QKD run that extracted a key. It used event-ready heralding, an EAT-based finite-size proof, real error correction and an extractor; $`1.5 \times 10^{6}`$ rounds in 7.9 h.
  - **Caveats:**
    - The key run only had to pass a threshold that was set in advance for $`S = 2.64`$ and $`Q = 1.8\%`$.
    - There was no space-like separation; security relies on isolating the nodes.
  - **Read:** arXiv v2 (the accepted version).

- **Zhang 2022.** W. Zhang et al. (11 authors, including W. Rosenfeld, who is absent from arXiv v1), "A device-independent quantum key distribution system for distant users", *Nature* 607, 687–691 (2022). https://doi.org/10.1038/s41586-022-04891-y · [arXiv:2110.00575](https://arxiv.org/abs/2110.00575). *Experiment.*
  - **What it shows:** the random-key-basis protocol run with 3,342 rounds.
  - **Caveats:**
    - Asymptotic only, with a Bayesian i.i.d. uncertainty.
    - Finite-size security was only simulated: at least $`1.75 \times 10^{5}`$ rounds would be needed, assuming collective attacks.
    - The arXiv journal reference "609" is a typo; the correct volume is 607.
    - Not checked: whether the paper claims space-like separation.
  - **Read:** arXiv v1.

- **Liu 2022.** W.-Z. Liu et al., "Toward a Photonic Demonstration of Device-Independent Quantum Key Distribution", *PRL* 129, 050502 (2022). https://doi.org/10.1103/PhysRevLett.129.050502 · [arXiv:2110.01480](https://arxiv.org/abs/2110.01480). *Experiment (proof-of-principle verification).*
  - **Numbers:**
    - Detection efficiencies of 87.2% and 87.8%, against a threshold of about 86.2% that assumes perfect error correction.
    - The threshold rises to 93.2% when the error-correction efficiency is 1.06.
  - **Caveats:**
    - No real-time random setting choice.
    - Collective attacks only, and no key was distilled.
    - Not resolved: we could not see how a statistical uncertainty of about 0.0015 fits inside an entropy margin of about $`2.6 \times 10^{-4}`$.
  - **Read:** arXiv v3.

- **Liu 2026.** W.-Z. Liu et al. (29 authors on arXiv v1, in Crossref and on the Nature page; checked 2026-10-10), "Long-lived remote ion-ion entanglement for scalable quantum repeaters", *Nature* 652, 51–57 (2026). https://doi.org/10.1038/s41586-026-10177-4 · [arXiv:2602.08472](https://arxiv.org/abs/2602.08472). Source data: https://doi.org/10.5281/zenodo.18218281 (CC BY 4.0). *Experiment.*
  - The arXiv v1 title differs from the journal title: "A building block of quantum repeaters for scalable quantum networks".
  - **What it shows:**
    - Over 10 km, entanglement stays coherent for 550 ms while generation takes 450 ms on average, giving a link efficiency of about 1.2 (F18).
    - The 10 km key took 386 h and used the protocol of Zhang X. 2023.
  - **Caveats:**
    - The fibre is spooled, the physical node separation is not stated, and the paper makes no locality claim.
    - The "5,000×" comparison sets 10 km of fibre against Oxford's roughly 2 m node separation.
    - Our own check (not the authors'): at 101 km, F9 gives 0.0865 at the deposited central values ($`S = 2.494`$, $`Q = 6.92\%`$). At $`(S - \sigma, Q + \sigma) = (2.419, 8.05\%)`$ it gives −0.0379. That point is a conservative corner, not a joint $`1\sigma`$ region. With the arXiv v1 values the same check gives 0.099 and −0.025. The 101 km rate is not statistically robust.
  - **Read:** arXiv v1, and the Fig. 4d source data (`Fig_4d.xlsx`) on Zenodo. The Nature version and supplement were not read.

- **Lu 2026.** B.-W. Lu et al., "Device-independent quantum key distribution over 100 km with single atoms", *Science* 391, 592–597 (2026). https://doi.org/10.1126/science.aec6243 · [arXiv:2602.09596](https://arxiv.org/abs/2602.09596). Source data: https://doi.org/10.5281/zenodo.17958512 (CC BY 4.0). *Experiment.*
  - **What it shows:** all nodes in one lab, with spooled fibre. At 11 km: $`1.208 \times 10^{6}`$ events over 624 h, and about 135.3 kbit of estimated extractable key.
  - **Settings:** in the main text Alice measures $`Z`$, $`(Z+X)/\sqrt{2}`$ and $`(Z-X)/\sqrt{2}`$, Bob measures $`Z`$ and $`X`$, and the key comes from the $`(Z, Z)`$ pair. These are the same roles as in this project, which follows Acín 2007's labelling (§2). Only the supplement's protocol description uses swapped labels.
  - **Fig. 5C rates and our comparison:**
    - The authors deposited $`S`$, $`Q`$, their Poissonian $`1\sigma`$ errors and the asymptotic rate for each distance (`Fig_5.xlsx`). These rates are for a protocol without sifting, with a test-round fraction $`\gamma = 10^{-3}`$.
    - Our $`(1 - \gamma)\cdot\text{F9}`$ at the deposited central values is 0.00079–0.00145 above every deposited rate: +0.00079 (11 km), +0.00088 (20 km), +0.00134 (50 km), +0.00114 (70 km) and +0.00145 (100 km).
    - The arXiv v1 supplement prints no closed-form rate, and we did not read the Science supplement, so the authors' exact formula is not known to us. We show our values as a comparison, not a reproduction.
    - At the conservative corner $`(S - \sigma, Q + \sigma)`$, F9 is negative at 70 km (−0.054) and 100 km (−0.066). That corner is not a joint $`1\sigma`$ region.
    - The 11 km finite-size rate of 0.112 bits/event ($`\varepsilon = 10^{-5}`$) is for the sifted protocol, whose asymptotic value is 0.275. The Fig. 5C value at 11 km (0.410) is for the variant without sifting. The gap is a protocol difference, not a units issue.
    - For reference, the sifted protocol's error-correction leakage is Eq. S43: $`(1 - \gamma_A/2)(1 - \gamma_B)\,h(q) + \gamma_A\gamma_B\,h(\omega)`$.
  - **Caveats:**
    - The 100 km rate is asymptotic only. Like every Fig. 5C rate, it is for the variant without sifting, not for the sifted protocol of the 11 km finite-size key.
    - The 100 km QBER of 7.16% is above the depolarising 7.1% threshold. A positive rate is still possible because $`S`$ and $`Q`$ are evaluated separately.
    - The locality loophole is explicitly not closed.
    - Not checked: whether error correction and privacy amplification were actually run.
  - **Read:** arXiv v1 and supplement, and the Fig. 5 source data on Zenodo.

- **Meiers 2026.** J. Meiers et al., "An asymmetric atom-photon architecture for device-independent quantum key distribution over 25 km", [arXiv:2609.25795](https://arxiv.org/abs/2609.25795) (2026). *Experiment; unrefereed preprint.*
  - **What it shows:**
    - Only 629 of 10,908 trials fall inside the optimised time window.
    - The "69 bits" is 154 key trials multiplied by an asymptotic rate from the Schwonnek model. That model's 2.362 threshold belongs to the random-key-basis protocol (F13).
    - The QBER of ≈1.4% is computed from $`S`$ with the depolarising-model relation; it is not measured.
  - **Caveats:**
    - 61.9% of readouts failed and were discarded, so the detection loophole is open.
    - Bob's basis choice is passive.
    - The authors explicitly make no device-independent key-generation claim, because the same dataset was used to optimise the time window.
    - Of all the papers here, this is the closest to our approach of evaluating a bound on data under a model.
  - **Read:** arXiv v2. On 2026-10-12 the arXiv abstract page lists v1 (22 Sep 2026) and v2 (23 Sep 2026) and no journal reference, so v2 is the latest version.

- **Zhang X. 2023.** X. Zhang, P. Zeng, T. Ye, H.-K. Lo, X. Ma, *PRL* 131, 140801 (2023). https://doi.org/10.1103/PhysRevLett.131.140801 · [arXiv:2111.13855](https://arxiv.org/abs/2111.13855). *Theory.*
  - **What it shows:** a finite-size DI analysis based on complementarity. According to its abstract, it covers general attacks.
  - **Read:** abstract only.

- **AAAS/EurekAlert! press release, 2026-02-05.** https://www.eurekalert.org/news-releases/1114834. *Press.*
  - Its wording is stronger than Lu 2026.
  - It omits that the fibre was spooled in one lab and that the 100 km rate is asymptotic.
  - We do not use it for numbers.

## 4 Certified randomness

The bound we evaluate is Pironio 2010 (see §2).

- **Bierhorst 2018.** P. Bierhorst et al., *Nature* 556, 223–226 (2018). https://doi.org/10.1038/s41586-018-0019-0 · [arXiv:1803.06219](https://arxiv.org/abs/1803.06219). *Experiment.*
  - **What it shows:** a loophole-free photonic test, with stations 187 m apart and a heralding efficiency of 75.5% (71.5% needed).
  - **Numbers:** 1024 bits within $`10^{-12}`$ of uniform, from 55,110,210 trials.
  - **Caveats:**
    - Covers classical side information only.
    - It consumed about $`1.1 \times 10^{8}`$ setting bits, so it is not randomness expansion.
    - The new data sets chose settings with Mersenne Twister, which the authors acknowledge is predictable.
  - **Read:** arXiv v1.

- **Liu Y. 2018.** Y. Liu et al., *Nature* 562, 548–551 (2018). https://doi.org/10.1038/s41586-018-0559-3 · [arXiv:1807.09611](https://arxiv.org/abs/1807.09611). *Experiment.*
  - **What it shows:** both loopholes closed, with security against quantum side information.
  - **Numbers:** $`6.2469 \times 10^{7}`$ bits in 96 h.
  - **Caveats:** settings are assumed free and i.i.d.; not expansion.
  - **Read:** arXiv v2.

- **Liu W.-Z. 2021.** W.-Z. Liu et al., *Nat. Phys.* 17, 448–451 (2021). https://doi.org/10.1038/s41567-020-01147-2 · [arXiv:1912.11159](https://arxiv.org/abs/1912.11159). *Experiment.*
  - **Numbers:**
    - Net gain of $`2.57 \times 10^{8}`$ bits, against quantum side information.
    - 13,527 bits/s is the gross rate, not the net rate.
  - **Caveat:** the headline run used shielding instead of space-like separation. A separate locality-closed run also showed a net gain.
  - **Read:** arXiv v2.

- **Shalm 2021.** L. K. Shalm et al., *Nat. Phys.* 17, 452–456 (2021). https://doi.org/10.1038/s41567-020-01153-4 · [arXiv:1912.11158](https://arxiv.org/abs/1912.11158). *Experiment.*
  - **Numbers:** 1,181,264,237 bits out for 953,301,640 bits in.
  - **Caveat:** classical side information only.
  - **Read:** arXiv v2.

- **Kavuri 2025.** G. A. Kavuri et al., "Traceable random numbers from a non-local quantum advantage", *Nature* 642, 916–921 (2025). https://doi.org/10.1038/s41586-025-09054-3 · [arXiv:2411.05247](https://arxiv.org/abs/2411.05247). *Experiment and public service (the CURBy beacon).*
  - **What it shows:** a loophole-free Bell test plus hash-chain logging of every processing step.
  - **Numbers:**
    - 7,434 of 7,454 runs completed in the first 40 days.
    - 512 bits per run, with soundness error $`\le 2^{-64}`$.
  - **Caveats:**
    - Classical side information only.
    - "Traceable" means the classical processing can be audited. It does not add quantum security.
  - **Read:** arXiv v1, and the abstract via PubMed.

- **Liu M. 2025.** M. Liu et al., "Certified randomness using a trapped-ion quantum processor", *Nature* 640, 343–348 (2025). https://doi.org/10.1038/s41586-025-08737-1 · [arXiv:2503.20498](https://arxiv.org/abs/2503.20498). *Experiment; computational certification, not a Bell test.*
  - **What it shows:** random-circuit sampling on a 56-qubit processor, checked against supercomputers.
  - **Numbers:** 71,313 bits of smooth min-entropy at soundness $`10^{-6}`$, at about 1 bit/s.
  - **Caveat:** relies on hardness conjectures and a restricted adversary model.
  - **Read:** arXiv v1 and the open-access Nature version.

- **Nai 2025** (included as a cautionary example). A. K. Nai et al., *Optics Express* 33, 44878 (2025). https://doi.org/10.1364/OE.569257 · [arXiv:2412.18285](https://arxiv.org/abs/2412.18285). *Experiment.*
  - **What it shows:** the paper calls itself "device-independent", but the random bits come from different photons than the ones in the CHSH test.
  - **Numbers:** 1.84 Mbps at $`S = 2.07`$, and 2.18 Mbps at $`S = 1.73`$.
  - **Caveats:**
    - Min-entropy stays high even when $`S < 2`$.
    - No loophole is closed.
  - **Read:** arXiv v2.

- **Kulikov 2026.** A. Kulikov, S. Storz, J. D. Schär, M. Sandfuchs, R. Wolf, F. Berterottière, C. Hellings, A. Wallraff, R. Renner, "Experimental randomness amplification", *Nature* 653, 1033–1038 (2026). https://doi.org/10.1038/s41586-026-10521-8 · [arXiv:2412.17931](https://arxiv.org/abs/2412.17931) (v1 title: "Device-Independent Randomness Amplification"). *Experiment.*
  - **What the abstract says:** existing Bell-test applications assume access to perfect randomness; this work amplifies imperfect randomness from a physical source, using a loophole-free Bell test with superconducting circuits.
  - **Read:** Crossref record and the arXiv v1 abstract only (2026-10-11).

- **Press.** We cite the papers rather than these releases:
  - NIST, 2025-06-11: https://www.nist.gov/news-events/news/2025/06/nist-and-partners-use-quantum-mechanics-make-factory-random-numbers
  - JPMorganChase, 2025-03-26: https://www.jpmorgan.com/technology/news/certified-randomness

- **Simulator RNGs.** *Software.*
  - Qiskit Aer 0.17.2: `rng.hpp` uses `std::mt19937_64`, seeded from `std::random_device` when no seed is given. https://github.com/Qiskit/qiskit-aer/blob/0.17.2/src/framework/rng.hpp
  - Qiskit 2.5.2 BasicSimulator: uses NumPy `default_rng`. https://github.com/Qiskit/qiskit/blob/2.5.2/qiskit/providers/basic_provider/basic_simulator.py
  - **Read:** source code at those tags.

## 5 Repeaters, entanglement swapping, IonQ networking context

- **Żukowski 1993.** M. Żukowski, A. Zeilinger, M. A. Horne, A. K. Ekert, "'Event-ready-detectors' Bell experiment via entanglement swapping", *PRL* 71, 4287–4290 (1993). https://doi.org/10.1103/PhysRevLett.71.4287. *Theory.*
  - **What it shows:** proposes entanglement swapping and gives it its name.
  - **Read:** APS abstract.

- **Pan 1998.** J.-W. Pan, D. Bouwmeester, H. Weinfurter, A. Zeilinger, *PRL* 80, 3891–3894 (1998). https://doi.org/10.1103/PhysRevLett.80.3891. *Experiment.*
  - **What it shows:** the first swapping experiment (photonic, post-selected).
  - **Read:** abstract only.

- **Briegel 1998.** H.-J. Briegel, W. Dür, J. I. Cirac, P. Zoller, "Quantum Repeaters: The Role of Imperfect Local Operations in Quantum Communication", *PRL* 81, 5932–5935 (1998). https://doi.org/10.1103/PhysRevLett.81.5932 · [arXiv:quant-ph/9803056](https://arxiv.org/abs/quant-ph/9803056). *Theory.*
  - **What it shows:**
    - Nested swapping plus purification, with polynomial overhead.
    - A formula for chain fidelity with imperfect one-qubit ($`p_1`$) and two-qubit ($`p_2`$) operations (F16).
  - **Read:** arXiv full text. The arXiv title differs from the journal title.

- **Dür 1999.** W. Dür, H.-J. Briegel, J. I. Cirac, P. Zoller, *PRA* 59, 169–181 (1999). https://doi.org/10.1103/PhysRevA.59.169 · [arXiv:quant-ph/9808065](https://arxiv.org/abs/quant-ph/9808065). *Theory.*
  - **What it shows:** chain fidelity (Eq. 19). Connecting segments in sequence or in parallel gives the same result.
  - **Read:** arXiv full text.

- **BBPSSW 1996.** C. H. Bennett, G. Brassard, S. Popescu, B. Schumacher, J. A. Smolin, W. K. Wootters, "Purification of Noisy Entanglement and Faithful Teleportation via Noisy Channels", *PRL* 76, 722–725 (1996). https://doi.org/10.1103/PhysRevLett.76.722. *Theory.*
  - **Used for:** the Repeater view's recurrence purification step (bilateral CNOT, keep the round when the second pair agrees), here without the random twirl.
  - **Read:** Crossref record only.

- **DEJMPS 1996.** D. Deutsch, A. Ekert, R. Jozsa, C. Macchiavello, S. Popescu, A. Sanpera, "Quantum Privacy Amplification and the Security of Quantum Cryptography over Noisy Channels", *PRL* 77, 2818–2821 (1996). https://doi.org/10.1103/PhysRevLett.77.2818. *Theory.*
  - **Used for:** the purification option that applies $`R_x(\pm\pi/2)`$ before the bilateral CNOT.
  - **Read:** Crossref record only.

- **Cui 2026.** Z.-B. Cui et al. (Tsinghua), *PRL* 137, 020803 (2026). https://doi.org/10.1103/9h14-sc8t · [arXiv:2510.20392](https://arxiv.org/abs/2510.20392). *Experiment.*
  - **Numbers:** 10 temporal modes, a 4.59× speed-up, and fidelity 95.9 ± 1.5% over 1.2 km.
  - **Read:** abstract and first page.

- **IonQ press release, 2026-04-14.** "IonQ Achieves Key Photonic Interconnect Milestone, Demonstrating Networked Quantum Systems Using Entanglement", https://www.ionq.com/news/ionq-achieves-key-photonic-interconnect-milestone-demonstrating-networked-quantum-systems-using-entanglement. *Press.*
  - **What it says:** IonQ states that it photonically interconnected two trapped-ion systems with AFRL.
  - **Caveats:**
    - The release gives no fidelity, rate, distance or verification method.
    - No paper had been published as of 2026-10-09.
    - "First" is IonQ's own claim.
  - **Read:** full release.

- **IonQ blogs, 2024-02-22 and 2024-10-03.** *Press.*
  - https://www.ionq.com/blog/enabling-networked-quantum-computing-with-ion-photon-entanglement
  - https://www.ionq.com/blog/achieving-remote-ion-ion-entanglement-paving-the-way-for-scalable-quantum
  - **What they say:** a roadmap of milestones. "Milestone 3" uses local SWAP gates; it is not entanglement swapping. The posts give no data.

- **Moore 2025.** I. D. Moore et al. (IonQ), "Electron juggling…", [arXiv:2510.27005](https://arxiv.org/abs/2510.27005). *Theory with simulation.*
  - **Numbers:**
    - Above 1,000 Bell pairs/s only in the idealised case, and not for Ba⁺ (for this ion–ion scheme; Hartung 2026 below reports about 1 kHz for a Ba⁺–SiV link, a different architecture).
    - 511–950 s⁻¹ once latencies are included.
  - **Read:** full PDF.

- **Hartung 2026.** L. Hartung et al. (39 authors), "Quantum Networking at the Speed of Quantum Computation: Kilohertz Entanglement in a Heterogeneous Quantum System", [arXiv:2610.10705](https://arxiv.org/abs/2610.10705) (2026-10-07). *Experiment; unrefereed preprint.* IonQ announced it on 2026-10-09 (https://www.ionq.com/news/ionq-demonstrates-world-first-quantum-memory-enhanced-interconnect-for-distributed-quantum-applications).
  - **What the abstract says:** a trapped ¹³⁸Ba⁺ ion is entangled with a silicon-vacancy (SiV⁻) centre in a diamond nanophotonic cavity; one detected photon heralds each pair. Including conversion losses, Bell pairs come at 1.03(1) kHz with fidelity 87.9(7)%, about four times the fastest photonic link between two trapped ions.
  - **What it is not:** an ion–SiV link, not ion–ion; no entanglement swapping is claimed in the abstract; the press release's "world-first" is IonQ's own wording. The distance between the nodes is not stated in the abstract, and a search of the arXiv text found none; the only length given is a delay fibre of about 15 m.
  - **Read:** abstract and press release (2026-10-10); arXiv text searched for a distance (2026-10-11).

- **PostQuantum.com, 2026-04-20.** https://postquantum.com/industry-news/ionq-photonic-interconnect-networked-quantum/. *Commentary.*
  - Confirms that the IonQ release gives no performance figures.
  - It attributes Cui 2026 to the wrong group.

- **IonQ docs (accessed 2026-10-09).** *Docs.*
  - **Noise models:** https://docs.ionq.com/features/simulation-with-noise-models
    - Qubit limits: 29 for ideal, forte-1 and forte-enterprise-1; 25 for Aria.
    - The published depolarising parameters cover only Aria and Forte jobs from before mid-September 2025. Documentation for the current Forte models is "in preparation".
    - Checked 2026-10-11: the Aria 1 and Aria 2 QPUs are retired, and their noise models remain available. Noise-model simulation is "shot-aware" and runs one simulation per requested shot, which is why this lab's IonQ profile defaults to 200 shots per setting.
    - IonQ disclaims predictive accuracy ("IonQ offers no specific guarantees of accuracy").
    - The documented channel is $`\rho \mapsto (1-r)\,\rho + r\,I/2`$ for one qubit and $`\rho \mapsto (1-r)\,\rho + r\,I/4`$ for two qubits. So $`r`$ is the same parameter as $`\lambda`$ in Aer's `depolarizing_error` (F8).
    - Read literally, the page's two-qubit Kraus list is not trace-preserving. Trace preservation needs all 15 non-identity two-qubit Pauli terms (our reading).
    - No separate SPAM, readout or crosstalk term is described. We say the documented model "omits SPAM"; we do not call it optimistic or pessimistic compared with hardware.
  - **OpenQASM 3:** https://docs.ionq.com/api-reference/v0.4/openqasm3
    - The simulator supports mid-circuit measurement.
    - Branching and loops are rejected on every target.
    - Each measurement needs its own classical bit.
  - **Native-gates page:** its prose and matrix disagree on GPi2.

- **qiskit-ionq** (README of the current release, 1.1.1; this project pins 1.0.2, the version Qollab documents). https://github.com/qiskit-community/qiskit-ionq. *Software.*
  - **What it says:** the simulator supports mid-circuit measurement, qubit reuse and reset.
  - **Caveat:** branching through this provider was not tested; this project does not use it (all measurements are terminal).

**Consequence for this project:** on IonQ targets, swapping corrections must be applied without classical feed-forward. That means either deferred measurement or a Pauli frame applied in post-processing. Post-selection is not equivalent.

## 6 Correlation-set geometry (formulas used by the 3D view)

- **Masanes 2003.** Ll. Masanes, "Necessary and sufficient condition for quantum-generated correlations", [arXiv:quant-ph/0309137](https://arxiv.org/abs/quant-ph/0309137) (2003), 5 pp. Preprint; we found no journal version. *Theory.*
  - **What it shows:**
    - The local set is given by 8 CHSH inequalities inside the cube.
    - The quantum set is given by 8 arcsin inequalities (F20). It is the convex hull of points $`(\sin p_1, \sin p_2, \sin p_3, -\sin(p_1+p_2+p_3))`$, which a maximally entangled two-qubit state can realise.
    - Fig. 1 shows the slice $`E_{00} = 1`$.
    - The coordinatewise map $`(2/\pi)\arcsin`$ sends the quantum set onto the local set.
  - **Caveats:**
    - Its convexity lemma partly relies on a numerical check.
    - The result is about correlators only.
    - The bibliography of Brunner et al. 2014 lists a *different* Masanes paper under "Masanes 2003". Cite the arXiv number instead.
  - **Read:** full text.

- **Supporting sources.** These were checked for the statements we use. Records marked with a date were checked in Crossref (or, for LOMI, on Math-Net.ru) on that date.
  - **Le et al. 2023.** T. P. Le, C. Meroni, B. Sturmfels, R. F. Werner, T. Ziegler, *Quantum* 7, 947 (2023). https://doi.org/10.22331/q-2023-03-16-947 · [arXiv:2111.06270](https://arxiv.org/abs/2111.06270) (v3 read). Used for the pushout map, the two-polynomial test, the Gram completion and the volume ratios.
    - It has a sign error on p. 13: it writes $`+2xyz`$ for $`c_{11} = -1`$, where $`-2xyz`$ is correct.
    - It cites Tsirelson's "Thm 2.2" where Thm 2.3 is meant.
  - **Goh et al. 2018**, "Geometry of the set of quantum correlations", *PRA* 97, 022104, https://doi.org/10.1103/PhysRevA.97.022104 (record checked 2026-10-11): the PR-plane slice, and the name "TLM" (Tsirelson–Landau–Masanes).
  - **Tsirelson 1985/1987.** B. S. Tsirel'son, "Quantum analogues of the Bell inequalities. The case of two spatially separated domains", *Zap. Nauchn. Sem. LOMI* 142, 174–194 (1985); English translation in *J. Sov. Math.* 36(4), 557–570 (1987), https://doi.org/10.1007/BF01663472 (records checked 2026-10-12: Crossref for the translation, Math-Net.ru for the original and its year). Theorem 2.2 gives a polynomial criterion, stated without proof.
  - **Landau 1988**, "Empirical two-point correlation functions", *Found. Phys.* 18, 449–460, https://doi.org/10.1007/BF00732549 (record checked 2026-10-12): the square-root form. The abstract states it as a necessary condition; only the abstract was read.
  - **Navascués–Pironio–Acín 2007**, *PRL* 98, 010401, https://doi.org/10.1103/PhysRevLett.98.010401 (record checked 2026-10-11): the level-1 Gram test and the test that accounts for marginals.
  - **Brunner et al. 2014**, "Bell nonlocality", *Rev. Mod. Phys.* 86, 419–478, https://doi.org/10.1103/RevModPhys.86.419 (record checked 2026-10-12).
  - **Werner–Wolf 2001**, *PRA* 64, 032112, https://doi.org/10.1103/PhysRevA.64.032112 (record checked 2026-10-11): 16 facets, made of 8 trivial and 8 CHSH.
  - **Fine 1982**, "Hidden Variables, Joint Probability, and the Bell Inequalities", *PRL* 48, 291–295, https://doi.org/10.1103/PhysRevLett.48.291 (record checked 2026-10-12): full text not read.
  - **Popescu–Rohrlich 1994**, *Found. Phys.* 24, 379–385, https://doi.org/10.1007/BF02058098 (record checked 2026-10-11): the paper does not use the term "PR box".
  - **Barrett et al. 2005**, *PRA* 71, 022101, https://doi.org/10.1103/PhysRevA.71.022101 (record checked 2026-10-11); **Sanyal** (the "samosa" nickname for the 3×3 elliptope); **Laurent–Mascarin–Telen** [arXiv:2605.02484](https://arxiv.org/abs/2605.02484).

- **What the 3D view shows:**
  - Projecting onto any three correlators fills the whole cube, so it shows nothing. The view therefore uses slices: $`E_{11} = t`$ (F21), the section $`E_{01} = E_{10}`$, or the PR plane (F22).
  - The slice at $`t = \pm 1`$ is an elliptope facet and is not typical. At $`t = 0`$ the local slice is a cuboctahedron.
  - Finite-shot estimates can land outside the quantum set, or outside the cube after readout mitigation. That is statistical noise, not "superquantum" behaviour.

## 7 Prior art and how this project differs

- **Qollab example projects (2026-03-07).** *Software.*
  - "Quantum Teleportation" (https://qollab.xyz/u/qollab/quantum-teleportation): coherent corrections on the IonQ simulator; checks only Z-basis populations.
  - "Scaled Entanglement" (https://qollab.xyz/u/qollab/scaled-entanglement): reports a GHZ "fidelity" based on populations, which is only an upper bound.

- **Qollab search, 2026-10-09** (before the build window opened at 23:00 UTC). No results for CHSH, QKD, E91 or BBM92. The search is fuzzy, so this does not prove absence.
- **Re-check, 2026-10-11.** Several public Qollab entries built during this hackathon also use CHSH or QKD. Projects built during the hackathon are not prior art and are not listed here.

- **Quantinuum pytket "Iterated entanglement swapping".** https://docs.quantinuum.com/tket/user-guide/examples/algorithms_and_protocols/entanglement_swapping.html. *Docs.*
  - Uses feed-forward swapping, repeated up to 10 times, with fidelity from tomography.
  - Reports no CHSH or key-rate results.

- **Waring 2025.** J.-B. Waring, C. Pere, S. Le Beux, "CHSH Violations Using Dynamic Circuits", IEEE QCE 2025, 2426–2432. https://doi.org/10.1109/QCE65121.2025.00263 · [arXiv:2504.18429](https://arxiv.org/abs/2504.18429). *Experiment on IBM hardware.*
  - Long-range Bell pairs scored by $`\max\lvert S\rvert`$.
  - With post-selection, $`\lvert S\rvert \approx 2.01`$ at 13 qubits, which is marginal.
  - The authors note that post-selection does not scale.

- **IBM CHSH tutorial.** https://quantum.cloud.ibm.com/docs/en/tutorials/chsh-inequality. *Docs.*
  - Stored output: 63 of 64 pairs violated CHSH, with a mean peak of 2.75.

- **Rathore 2026.** A. Rathore, K. Sutradhar, [arXiv:2609.01297](https://arxiv.org/abs/2609.01297). *Simulation; preprint.*
  - Its "key rates" are sifted throughput without privacy amplification.
  - Its E91 baseline is $`S = 2.12`$, with a 95% confidence interval of [1.94, 2.30].

- **GitHub (searched 2026-10-09; repositories not vetted).**
  - Single components: scottdhughes/e91-qkd-proof, kardashin/E91_protocol, fjiolla/bbm92-qkd-simulator, faraaz-13/simulating-a-quantum-repeater-for-long-distance-communication, gorkadabo1/quantum-communications, boriskiefer/entanglement_swapping_simulator.
  - Combinations of several components:
    - Normansrule/quantum-link-research (MIT): CHSH, swapping, a repeater chain, and E91 with an Acín/Pironio DI rate.
    - LPiperides/qkd-simulation (MIT): includes the Pironio 2009 rate.
    - Zytrus/rDIQKD_qiskit, Hazem-74/Quantum-info, GiuseppeViola/npa-mp-bff-diqkd.

**How this project differs.** We claim nothing new. CHSH, entanglement-based QKD, DI key rates and repeaters already appear together on GitHub. What we add is the teaching design. In the searches above we did not find a **Qollab** project that does all of the following:

- takes one Bell-test dataset up a ladder of claims: trusted-device entanglement, nonlocality, self-testing (extractability), DI randomness and a DI key, each at a stated finite-sample confidence end;
- runs the same estimator on simulated counts and on open experimental event data (Rosenfeld 2017);
- shows the DI randomness bound (F14) next to the DI key bound (F9);
- states the conditions behind every number (asymptotic, collective attacks, depolarising model or measured $`S`$ and $`Q`$);
- places simulated correlators in a 3D picture of the local, quantum and no-signalling sets.

The lab runs on whichever Qollab backend is selected, including IonQ's noise-model simulators. This is an educational presentation of known results.

## 8 Third-party software

| Name | Version | License | URL | Role |
|---|---|---|---|---|
| Qiskit | 2.5.2 | Apache-2.0 | https://github.com/Qiskit/qiskit | Runtime (Qollab installs it; pinned in `requirements.txt`) |
| Qiskit Aer | 0.17.2 | Apache-2.0 | https://github.com/Qiskit/qiskit-aer | Local checks; Qollab runs its IBM noise models on Aer |
| qiskit-ibm-runtime | 0.50.0 | Apache-2.0 | https://github.com/Qiskit/qiskit-ibm-runtime | Local checks (IBM fake backends) |
| qiskit-ionq | 1.0.2 (the version Qollab documents) | Apache-2.0 | https://github.com/qiskit-community/qiskit-ionq | Local transpilation only; IonQ jobs run on Qollab |
| NumPy | 2.4.6 | BSD-3-Clause AND 0BSD AND MIT AND Zlib AND CC0-1.0 | https://numpy.org | Runtime |
| SciPy | 1.18.0 | BSD-3-Clause | https://scipy.org | Tests and figures only |
| Matplotlib | 3.10.8 | Matplotlib (PSF-style) | https://matplotlib.org | Figures only |
| three.js | r186 (`three@0.186.1`, published on npm 2026-09-24) | MIT, © 2010–2026 three.js authors | https://github.com/mrdoob/three.js | Provided by Qollab's import map; not vendored |
| Tabler Icons | 3.49.0 (2026-10-05) | MIT, © 2020–2026 Paweł Kuna | https://github.com/tabler/tabler-icons | Icons: a small subset is vendored into the UI, with its licence notice |
| mermaid-cli | 12.0.0 | MIT | https://github.com/mermaid-js/mermaid-cli | Build tool: rendered the README's Mermaid diagram sources to PNG |

Licence strings were read from the installed package metadata (Python packages) and from the npm registry or the repositories (JavaScript), on 2026-10-09.

**Notes on these packages:**

- **three.js:**
  - Inside Qollab, `three` and `three/addons/` come from Qollab's own import map (jsDelivr). Outside Qollab, `three.module.js` imports `three.core.js`, so both files are needed.
  - `Clock` is deprecated (use `Timer`).
  - WebGL is still the default renderer.
  - Checked 2026-10-12: npm's `latest` tag for `three` is 0.186.1 (published 2026-09-24), the newest GitHub release is r186 (2026-09-24), and `build/three.core.js` of 0.186.1 on jsDelivr sets `REVISION = '186'`. There is no r187 release yet. The local harness loads `three@0.186.1` from jsDelivr.
- **Tabler Icons:** use `icons/outline/<name>.svg`. These names do not exist as files: `light`, `photon`, `circuit-loop` and `random`. `3d-cube-sphere` is only an alias.
- **Qiskit Aer docs:** the `depolarizing_error` definition was read on a docs page that shows version 0.17.1.

**Browser APIs and standards** (docs; read from primary sources):

- **MediaRecorder** (Chrome 47, Firefox 25, Safari 14.1) and **canvas `captureStream`** (Chrome 51, Firefox 43, Safari 11), per MDN BCD.
  - Firefox source accepts only VP8 for WebM; Chromium also accepts VP9 and AV1.
  - Feature-detect with `isTypeSupported`.
- **WCAG 2.2** (https://www.w3.org/TR/WCAG22/):
  - 2.5.8: targets at least 24×24 px (AA).
  - 1.4.3: contrast 4.5:1. 1.4.11: contrast 3:1.
  - 2.2.2: a pause control for auto-moving or auto-updating content (A).
  - 2.4.11: focus must not be entirely hidden (AA).
  - 2.3.3 is AAA.
- **WAI-ARIA 1.2** dialog role; **APG** Tabs and Modal Dialog patterns. APG has no non-modal dialog pattern.
- **MDN `<dialog>`:** a dialog opened with `show()` does not close on Esc by default.

## 9 Formula sheet

Notation: $`h(x) = -x\log_2 x - (1-x)\log_2(1-x)`$.

**Bell inequalities and noise**

- **F1. CHSH.** $`\lvert S\rvert \le 2`$.
  - Conditions: locality, measurement independence, $`\pm 1`$ outcomes, and no-clicks assigned an outcome rather than discarded.
  - Source: CHSH 1969 Eq. 1a, rewritten.
- **F2. Tsirelson.** $`\lvert S\rvert \le 2\sqrt{2} \approx 2.828`$.
  - Reached by $`\lvert\Phi^+\rangle`$ with $`A \in \{Z, X\}`$ and $`B \in \{(Z \pm X)/\sqrt{2}\}`$.
  - Source: Tsirelson 1980.
- **F3. Werner state.** $`\rho_v = v\,\lvert\Phi^+\rangle\langle\Phi^+\rvert + (1-v)\,I/4`$, as in the code. Werner's original uses $`\lvert\psi^-\rangle`$; for it the QBERs below hold after Bob flips his bit.
  - $`S_\text{max} = 2\sqrt{2}\,v`$, $`Q_Z = Q_X = (1-v)/2`$, so $`S = 2\sqrt{2}\,(1-2Q)`$.
  - $`S > 2`$ if and only if $`Q < 14.64\%`$.
  - Conditions: depolarising noise only, optimal settings, no loss.
  - Derived; not stated in Werner 1989.
  - Real sources are not Werner states. At Nadlinger's $`S = 2.677`$ this relation predicts $`Q \approx 2.7\%`$, against 1.44% measured. At Lu's 11 km $`S = 2.612`$ it predicts $`Q \approx 3.8\%`$, against 2.85%.
  - Likewise, a reported fidelity $`F`$ maps to $`S = 2\sqrt{2}\,(4F-1)/3`$ only under this model. Werner presets are therefore illustrative; a fit to real data needs at least two correlators (for example $`E_{ZZ}`$ and $`E_{XX}`$).
- **F4. Bell-diagonal noise, X–Z plane settings.** $`S_\text{max} = 2\sqrt{(1-2Q_Z)^2 + (1-2Q_X)^2}`$.
  - General form: $`S_\text{max} = 2\sqrt{t_1^2 + t_2^2}`$, with $`t_1, t_2`$ the two largest singular values of the correlation matrix (Horodecki 1995; the paper was not read, see §1).
- **F5. Werner-state thresholds.**
  - Separable if and only if $`v \le 1/3`$.
  - Local for all POVMs at $`v \le 1/2`$.
  - Projective measurements: local for $`v \le 0.6875`$ and nonlocal for $`v \ge 0.6961`$ (0.69604 in the 2026 follow-up).
  - CHSH violated if and only if $`v > 0.7071`$.

**Trusted-device QKD rates**

- **F6. Shor–Preskill.** $`r = 1 - 2h(\delta)`$, positive if and only if $`\delta < 0.110028`$.
  - Gilbert–Varshamov version: threshold 0.055014.
  - Rate is per code qubit; asymptotic.
- **F7. Asymmetric errors.** $`r = 1 - h(Q_Z) - h(Q_X)`$.
  - With real error correction, use $`f\,h(Q_Z)`$ with $`f \ge 1`$.
  - Source: Scarani 2009.
- **F8. Qiskit Aer depolarising noise.** The channel is $`\mathcal{E}(\rho) = (1-\lambda)\,\rho + \lambda\,\mathrm{Tr}(\rho)\,I/2^n`$.
  - Applied *after* the Bell pair is prepared:
    - A two-qubit error gives $`v = 1 - \lambda`$.
    - One-qubit errors on each half give $`v = (1-\lambda_A)(1-\lambda_B)`$.
    - A symmetric readout flip $`p`$ multiplies the correlators by $`(1-2p)`$ per side.
  - Noise inside the CNOT is not Werner noise.

**Device-independent key rates**

- **F9. DI key rate.** $`r \ge 1 - h(Q) - h\!\left(\dfrac{1+\sqrt{(S/2)^2-1}}{2}\right)`$, for $`2 < S \le 2\sqrt{2}`$.
  - Conditions: collective attacks, asymptotic, one-way reverse reconciliation, symmetrised marginals, a single key basis, free settings.
  - With F3: $`Q^{\ast} = 7.1492\%`$, $`S^{\ast} = 2.4240`$.
  - Rates at sample QBERs:

    | $`Q`$ | 1% | 2% | 5% | 7% |
    |---|---|---|---|---|
    | $`r`$ | 0.777 | 0.612 | 0.225 | 0.0146 |

  - Source: Pironio 2009 Eq. 12.
- **F10. Winning-probability form.** $`\omega = 1/2 + S/8`$. The entropy term is $`1 - h\bigl(1/2 + \tfrac{1}{2}\sqrt{16\,\omega(\omega-1)+3}\bigr)`$.
  - Classical limit $`\omega \le 0.75`$; quantum limit $`\omega \le 0.8536`$.
  - Source: Arnon-Friedman 2018 Eq. 2.
- **F11. Trusted-device comparison.** The Eve-information term becomes $`h\bigl(Q + S/(2\sqrt{2})\bigr)`$. With F3 this reduces to $`1 - 2h(Q)`$, giving the 11.00% threshold.
- **F12. Noisy preprocessing.** $`I_p(S) = h\!\left(\dfrac{1+\sqrt{(S/2)^2-1}}{2}\right) - h\!\left(\dfrac{1+\sqrt{1-p(1-p)(8-S^2)}}{2}\right)`$.
  - Rate: $`r \ge 1 - I_p(S) - H(\hat{B}_1 \mid A_0)`$.
  - As $`p \to 1/2`$: $`Q^{\ast} = 8.0848\%`$, $`S^{\ast} = 2.3711`$ (our derivation).
  - Source: Ho 2020.
- **F13. Random key basis.** $`K = \bigl(p^2 + (1-p)^2\bigr)\,r`$.
  - With depolarising noise: $`S > 2.362`$.
  - Applies to a different protocol. Source: Schwonnek 2021.

**DI randomness**

- **F14. Per-round bound (asymptotic).** $`H_\text{min}(A \mid X) \ge 1 - \log_2\bigl(1 + \sqrt{2 - S^2/4}\bigr)`$.

  | $`S`$ | 2.07 | 2.414 | 2.7 | $`2\sqrt{2}`$ |
  |---|---|---|---|---|
  | Bound (bits) | 0.0264 | 0.2034 | 0.4928 | 1 |

  - No-signalling-only version: $`-\log_2(3/2 - S/4)`$.
- **F14b. Finite-$`n`$ bound.** $`H_\text{min} \ge n\,f(\hat{I} - \varepsilon)`$ with probability $`1 - \delta`$, where $`\varepsilon = O\bigl(\sqrt{-\log\delta/(q^2 n)}\bigr)`$.
- **F15. EAT.** $`H_\text{min}^{\varepsilon} > n\,t - v\sqrt{n}`$.
  - Conditions: sequential rounds with a Markov condition, and an acceptance test fixed in advance.

**Repeaters**

- **F16. Swapping Werner links.** $`F = (1+3v)/4`$.
  - Ideal swapping of $`N`$ links: $`v_N = v^N`$.
  - Links with different visibilities: $`v = \prod_i v_i`$ (derived).
  - Imperfect operations: $`F_L = \tfrac{1}{4} + \tfrac{3}{4}\left[\dfrac{p_1 p_2 (4\eta^2-1)}{3}\right]^{L-1}\left[\dfrac{4F-1}{3}\right]^{L}`$ (Briegel 1998 Eq. 5).
- **F17. CHSH along a chain.** CHSH is violated only while the number of links is below $`\ln(1/\sqrt{2})/\ln v`$. For $`v = 0.95`$ that is at most 6 links (derived).
- **F18. Link efficiency.** $`\eta_\text{link} = R_\text{gen}/\Gamma_\text{dec}`$, with 0.83 as the critical value (cited by Liu 2026).

**Correlation-set geometry**

- **F19. No-signalling set and local polytope.**
  - No-signalling set: the cube $`[-1, 1]^4`$. The PR box is the point $`(1, 1, 1, -1)`$, with $`S = 4`$.
  - Local polytope $`L`$: $`\lvert E_{xy}\rvert \le 1`$, plus $`s \cdot E \le 2`$ for the 8 sign vectors whose entries multiply to $`-1`$. That gives 16 facets.
- **F20. Quantum set (TLM).** $`s \cdot \arcsin(E) \le \pi`$ for the same 8 sign vectors; equivalently, $`(2/\pi)\arcsin(E) \in L`$.
  - Equivalent forms: the Landau square-root inequality, or a Gram-matrix (positive semidefinite) completion.
  - When marginals are nonzero, the test is only necessary; use NPA's $`D_{xy}`$ instead.
- **F21. Slice at $`E_{11} = t`$** (derived). Write $`A = \arcsin E_{00}`$, $`B = \arcsin E_{01}`$, $`D = \arcsin t`$. Then $`\sin C_\text{lo} \le E_{10} \le \sin C_\text{hi}`$, where:
  - $`C_\text{hi} = \min(\pi/2, \pi+D-A-B, \pi+D+A+B, \pi-D-A+B, \pi-D+A-B)`$
  - $`C_\text{lo} = \max(-\pi/2, -\pi+D-A-B, -\pi+D+A+B, -\pi-D-A+B, -\pi-D+A-B)`$
  - The local slice uses the same expressions without $`\arcsin`$, with $`\pi \to 2`$ and $`\pi/2 \to 1`$.
- **F22. PR-plane slice.** With $`x = -E_{00}+E_{01}+E_{10}+E_{11}`$ and $`y = S`$:
  - Local: $`\lvert x\rvert, \lvert y\rvert \le 2`$.
  - Quantum: $`x^2 + y^2 \le 8`$.
  - No-signalling: $`\lvert x\rvert + \lvert y\rvert \le 4`$.
- **F23. Volume ratios.** $`V(L)/V(\mathrm{NS}) = 2/3`$, and $`V(Q)/V(\mathrm{NS}) = 3\pi^2/32 \approx 0.9253`$.
- **F24. Isotropic line.** $`E(v) = v\,(1, 1, 1, -1)/\sqrt{2}`$ lies in $`L`$ if and only if $`v \le 1/\sqrt{2}`$. This is about that one point, not about whether the state is local.

**Accessibility**

- **F25. WCAG contrast ratio.** $`(L_1 + 0.05)/(L_2 + 0.05)`$, with $`L = 0.2126R + 0.7152G + 0.0722B`$ on linearised channels.

## 10 Statements this project deliberately does not make

**About our own results**

- The rung names (Bell violation, DI key, …) label formulas evaluated on simulated counts. About simulated results we never claim a loophole-free Bell violation, a secure key or certified randomness. All simulated outcomes come from a seeded pseudo-random generator.
- DI numbers are not security proofs and not extractable bit counts. Finite-size DI keys need roughly $`10^{8}`$ to $`10^{15}`$ rounds; our runs use roughly $`10^{3}`$ to $`10^{5}`$ shots.
- A CHSH value computed on post-selected (purified) pairs is not a DI certificate. It assumes the herald is independent of the settings, as in event-ready schemes, and its statistics use the kept shots only.
- IonQ noise-model results are not predictions of real QPU behaviour.

**About thresholds**

- No DI threshold is universal.
  - For depolarising noise the threshold is $`S^{\ast} = 2.424`$, not "2.43".
  - The value 2.362 belongs to Schwonnek 2021, not to Ho 2020.
- $`S = 2\sqrt{2}\,(1-2Q)`$ holds only for depolarising noise.
- $`v^n`$ holds only for Werner links.
- The 11% threshold is asymptotic and assumes trusted devices.
- Acín 2007 and Pironio 2009 do not cover coherent (general) attacks.
- The closed-form randomness bound is a local min-entropy, not the pair min-entropy.
- Kaniewski's bound is an extractability (local channels), not the fidelity of the physical state. Its $`\beta^{\ast} \approx 2.106`$ is not the DI self-testing threshold, which lies somewhere in [2.05, 2.11] and is unresolved.
- $`S \le 2`$ does not mean a state is local or unentangled.

**About attribution**

- The four-term CHSH form is not quoted verbatim from CHSH 1969.
- The $`S`$ and QBER formulas are not from Werner 1989.
- The arcsin form is not from Tsirelson's LOMI 142 paper.
- Ekert 1991 is not a security proof, and BBM92 security does not rely on CHSH.

**About experiments**

- Giustina 2015 and Shalm 2015 report no CHSH $`S`$.
- Hensen 2015 is not "highly significant".
- None of the DI-QKD experiments closed the locality loophole.
- We never say "DI-QKD over 100 km" without adding "asymptotic, spooled fibre".
- Meiers 2026 did not produce a DI key.
- Zhang 2022 and Liu 2022 did not produce finite-size keys.
- Fibre length is not the same as node separation.
- Rosenfeld's $`S = 2.221 \pm 0.033`$ is the 15 April 2016 run, not the public 14 June run (2.096 ± 0.034).
- Our comparison with Lu's Fig. 5C rates is not a reproduction; the arXiv v1 supplement does not print the authors' exact formula.
- A rate at the $`(S - \sigma, Q + \sigma)`$ point is a conservative corner, not a joint $`1\sigma`$ region.

**About randomness**

- Liu M. 2025 and Nai 2025 are not device-independent.
- Bierhorst 2018, Shalm 2021 and Kavuri 2025 hold against classical side information only.
- Passing statistical test suites is not certification.

**About IonQ**

- We give no performance figures for the April 2026 demonstration.
- IonQ has not demonstrated entanglement swapping.
- "First" is IonQ's own claim.

**About this project**

- No claim to be "first" or "novel".
- No claim of WCAG conformance without a manual audit.

## 11 What was not checked

These points were not confirmed against a primary source. They are limits of this review, not open tasks; none of them changes a number the app computes unless the entry says so.

**Foundations**
- The full texts of Werner 1989, BBM92, Horodecki 1995, Renner 2024 and Pan 1998 were not read.
- Whether Bennett et al. 1993 should also be credited for swapping was not checked.

**Bibliographic details**
- The PRL received dates for Giustina 2015 and Shalm 2015 were not checked.

**DI bounds**
- Pironio 2009 gives a 92.4% threshold; our recomputation gives 92.3%. The difference was not resolved.
- The Ho 2020 supplement was not read.
- The Vazirani–Vidick 1.6% figure was not checked.
- For Pironio 2010, the Nature text was not compared with arXiv, and the later security analyses were not read.

**Experiments**
- Liu 2026: the attack model and the node separation were not checked in the Nature version or the supplement.
- Lu 2026: whether error correction and privacy amplification were run, and the formula behind the Fig. 5C rates, are not known to us (the Science supplement was not read).
- Zhang 2022: the locality statement was not checked.
- Liu 2022: the statistical margin was not resolved (§3).

**Randomness**
- Kavuri 2025 and Nai 2025 were not compared with their published versions.
- The random-number generator used by IonQ's cloud simulator was not checked.

**IonQ**
- Whether a technical paper backs the April 2026 release was not checked.
- Documentation for the current Forte noise models was not checked beyond IonQ's noise-model page (§5).
- Mid-circuit measurement without branching through qiskit-ionq 1.0.2 on Qollab was not tested; this project does not rely on it (all measurements are terminal).

**Repeaters**
- $`v_N = v^N`$ for equal links is checked for 1–3 links in `tests/test_circuits_exact.py`: `test_chain_with_pauli_frame` compares the circuits with the exact model, and `test_chain_spec_vectors` checks the model against $`2\sqrt{2}\,v^N`$. The product $`v = \prod_i v_i`$ for links with different visibilities is derived only; the app always uses the same channel on every link.

**Geometry**
- Masanes 2003: on 2026-10-12 its arXiv page lists one version (v1, 18 Sep 2003) and no journal reference; we found no journal version.
- The Landau 1988 body text and the Fine 1982 full text were not read.
- The membership tests are checked by `tests/test_geometry.py` (including the Monte Carlo volume ratios $`2/3`$ and $`3\pi^2/32`$). A Monte Carlo comparison of the arcsin test with the Landau and Gram-matrix forms was not re-run in this repository; the app uses only the arcsin test.

**Software**
- `depolarizing_error` was read on the Aer 0.17.1 docs page; the pinned version is 0.17.2.
- MediaRecorder support was taken from MDN's compatibility data, not tested in each browser (Safari included).

**Prior art**
- Re-checked 2026-10-11 (see §7): several in-window Qollab entries also use CHSH or QKD; they are not prior art.

**Not read in full**
- Kulikov 2026 and Storz 2023 (§1, §4): only their abstracts were read.
