# Review (2026-10-10, build window)

A structured review of the repository by four dimensions (physics and statistics, runtime on
Qollab and in browsers, accuracy of public text, tests and conformance). Each reported finding was
then checked independently by trying to refute it; only findings that survived are listed. No
HIGH findings survived. Three reported findings were refuted and are not listed.

| # | Severity | Area | Finding | Where | What was done |
|---|---|---|---|---|---|
| 1 | MEDIUM | physics | Canary threshold of 0.5 lets a wrong bit order through about half the time in the packed (IonQ) layout | `config/defaults.json`:125 | Fixed: threshold raised to 0.75 (a misread bit passes with probability below 1e-6 at 100 shots); test reverses every packed key and checks the run stops. |
| 2 | MEDIUM | runtime | One-IonQ-job gate can be bypassed between the Bell Lab and Repeater views | `ui/views/repeater.js`:259 | Fixed: `submitRun` counts the IonQ job when it is submitted (and returns it for errors raised before submission); both views re-check Run whenever the job count or an in-flight job changes. |
| 3 | MEDIUM | runtime | Bell Lab Run button looks enabled but does nothing during replay or pause | `ui/views/lab.js`:163 | Fixed: Run is accepted during the replay and while paused (it starts a new job). |
| 4 | MEDIUM | runtime | Guided tour's runAndFinish can hang, block the tour, or report numbers from an earlier run | `ui/views/lab.js`:317 | Fixed: the tour waits for done or error, reports only the run it started, and says so when the run fails. |
| 5 | MEDIUM | runtime | Tour on one-job (IonQ/unknown) profiles shows results from a different experiment and an impossible repeater setup | `ui/views/tour_steps.js`:138 | Fixed: on one-job profiles the tour configures a two-link swap without added noise (25 qubits) and leaves the single job to the user. |
| 6 | MEDIUM | runtime | Shots and seed are not validated; bad values give misleading errors and spend the IonQ job | `ui/views/lab.js`:51 | Fixed: shots (100–100,000, whole number) and seed (whole number ≥ 0) are validated before anything is submitted; such errors do not use up the IonQ job. |
| 7 | MEDIUM | claims | Simulated runs are said to 'certify a DI key' and to confirm a Bell violation, which the repo's own limits rule out | `README.md`:163 | Fixed: README now says the asymptotic DI-key bound stays positive or turns negative at the conservative end, for simulated counts. |
| 8 | MEDIUM | claims | The built-in simulator row claims a Qollab run that the repo does not contain | `README.md`:147 | Fixed: the row is labelled as the local reference run. |
| 9 | MEDIUM | claims | Pauli-frame description swaps the X and Z corrections | `README.md`:110 | Fixed: README describes the frame as in the code (Z-basis bit: parity of the CNOT-target bits; X-basis bit: parity of the control bits). |
| 10 | MEDIUM | claims | All README images point to a tag, v1.0-submission, that does not exist | `README.md`:15 | Fixed: README uses relative image paths; `scripts/make_writeup.py` produces the Qollab write-up with absolute URLs at the submission tag. |
| 11 | MEDIUM | tests | Packed-layout (IonQ) canary cannot detect a reversed bit order, but README and the in-app note say the run stops | `bellkit/app.py`:140 | Same as the canary finding above. |
| 12 | MEDIUM | tests | shots and seed are never validated; an invalid seed uses up the session's single IonQ job without submitting one | `bellkit/app.py`:132 | Same as the shots/seed finding above. |
| 13 | LOW | physics | The S interval is labelled 95% but is built as a 97.5% interval | `ui/widgets/gauge.js`:47 | Fixed: the gauge labels the S interval at 97.5 % and explains that each certificate holds at 95 %. |
| 14 | LOW | physics | Wilson intervals labelled 98% instead of 97.5% | `ui/views/lab.js`:193 | Fixed: Wilson intervals labelled 97.5 %. |
| 15 | LOW | physics | Pauli-frame description swaps which repeater bits give the X and Z corrections | `README.md`:111 | Same as the Pauli-frame finding above. |
| 16 | LOW | physics | Purification without a rotation is called BBPSSW, but the BBPSSW twirl is missing | `ui/views/method.js`:77 | Fixed: the option and the Method text say "recurrence step of BBPSSW, without its random twirl". |
| 17 | LOW | physics | The conservative ladder exports a 'witness_fidelity_high' that is not an upper bound | `bellkit/analysis.py`:218 | Fixed: the conservative ladder reports no upper fidelity value. |
| 18 | LOW | physics | The YY setting gets no predicted correlator, so the table and CSV show a blank | `bellkit/models.py`:220 | Fixed: the exact model predicts the YY correlator; a test checks it against the circuit. |
| 19 | LOW | runtime | Confidence levels on the error-rate and S intervals are mislabelled | `ui/views/lab.js`:193 | Same as the interval-label findings above. |
| 20 | LOW | runtime | 'allows undefined' size note on the refused (QPU) profile | `ui/views/common.js`:72 | Fixed: a refused (QPU) profile shows its refusal instead of a qubit limit. |
| 21 | LOW | runtime | Reset leaves the old error and the old report in place, and exports then disagree | `ui/views/lab.js`:284 | Fixed: Reset clears the error message and the last report, so exports are empty again. |
| 22 | LOW | runtime | Run markers outside the axis range disappear while their legend entries stay | `ui/views/certificates.js`:215 | Fixed: markers outside the axes are pinned to the edge and drawn hollow. |
| 23 | LOW | runtime | Noise-strength slider in the Certificates noise sweep has no effect | `ui/views/certificates.js`:171 | Fixed: the noise sweep shows only the noise-type selector (the sweep covers every strength). |
| 24 | LOW | runtime | 3D view leaks GPU buffers on every Bell run | `ui/widgets/corrset3d.js`:289 | Fixed: geometries and materials are disposed when the 3D points or surfaces are rebuilt. |
| 25 | LOW | claims | The S interval is labelled 95 % but is computed as a 97.5 % Hoeffding interval | `ui/widgets/gauge.js`:47 | Same as the interval-label findings above. |
| 26 | LOW | claims | Tour says 'these settings cannot show' the v = 0.5 Werner state's entanglement, implying other settings could | `ui/views/tour_steps.js`:136 | Fixed: the tour says no CHSH test can show this entanglement (Werner states violate CHSH only above visibility 1/√2). |
| 27 | LOW | claims | decisions.md contradicts the code and the README on how results are read and what is recorded | `docs/decisions.md`:48 | Fixed: D4 now says results are read by position (D9). |
| 28 | LOW | claims | On IonQ the tour hands the user a two-link swap that is too large to run | `ui/views/tour_steps.js`:173 | Same as the tour/IonQ finding above. |
| 29 | LOW | claims | The recorded IBM Fez chain run shows seed null, although it ran seeded | `data/recorded_runs.json`:2679 | Fixed: `scripts/record_runs.py` records the configured seed for seeded profiles; recorded runs rebuilt. |
| 30 | LOW | claims | Kaniewski extractability is labelled a 'fidelity bound', contrary to the project's own notes | `ui/views/certificates.js`:229 | Fixed: labels say "extractability" in the ladder, the chart and its table. |
| 31 | LOW | claims | Verification section claims Hoeffding coverage is tested; only Wilson coverage is | `README.md`:198 | Fixed: a sampling test checks Hoeffding coverage; README wording updated. |
| 32 | LOW | tests | Packed-layout decoding of chain and purify (frame and post-selection bits at non-zero offsets) is untested | `tests/test_circuits_exact.py`:139 | Fixed: packed-layout tests for the chain (frame bits) and purification (keep bits) at non-zero offsets. |
| 33 | LOW | tests | The upload zip on disk is stale: pre-window README and 6 of 10 recorded runs | `dist/qollab_upload.zip`:1 | Process: the zip is rebuilt from the manifest before every upload. |
| 34 | LOW | tests | The literal-path test skips RECORDED_RUNS, and the view hides its absence | `tests/test_qollab_conformance.py`:72 | Fixed: the literal-path test includes RECORDED_RUNS. |
| 35 | LOW | tests | All six README images point at a tag that does not exist yet | `README.md`:15 | Same as the README-images finding above. |
| 36 | LOW | tests | Icon test misses icon names chosen by ternaries and lookup maps; icon() throws on unknown names | `tests/test_ui_conformance.py`:49 | Fixed: the icon test reads every name passed to `icon()`, including ternaries, view icons and the theme map. |
| 37 | LOW | tests | The skip link is a hash navigation, which the 'no hash routing' rule is meant to prevent; the test only scans JS | `index.html`:2 | Fixed: the skip link moves focus in JavaScript without changing the URL. |
| 38 | LOW | tests | D4 says results are read by circuit name; the code and D9 read them by position | `docs/decisions.md`:49 | Same as the decisions finding above. |
| 39 | LOW | tests | Assertions that cannot fail, and a path-dependent exclusion check | `tests/test_app.py`:35 | Fixed: tightened assertions (membership, conservative fields) and a path-independent exclusion check. |

Line numbers refer to the files before the fixes.
