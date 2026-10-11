# Review (2026-10-10, build window)

A structured review of the repository by four dimensions (physics and statistics, runtime on
Qollab and in browsers, accuracy of public text, tests and conformance). Each reported finding was
then checked independently by trying to refute it; only findings that survived are listed. No
HIGH findings survived. Three reported findings were refuted and are not listed.

| # | Severity | Area | Finding | Where | What was done |
|---|---|---|---|---|---|
| 1 | MEDIUM | physics | Canary threshold of 0.5 lets a wrong bit order through about half the time in the packed (IonQ) layout | `config/defaults.json`:125 | Fixed: threshold raised to 0.75 (a misread bit passes with probability below $`10^{-6}`$ at 100 shots); test reverses every packed key and checks the run stops. |
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
| 13 | LOW | physics | The $`S`$ interval is labelled 95% but is built as a 97.5% interval | `ui/widgets/gauge.js`:47 | Fixed: the gauge labels the $`S`$ interval at 97.5 % and explains that each certificate holds at 95 %. |
| 14 | LOW | physics | Wilson intervals labelled 98% instead of 97.5% | `ui/views/lab.js`:193 | Fixed: Wilson intervals labelled 97.5 %. |
| 15 | LOW | physics | Pauli-frame description swaps which repeater bits give the X and Z corrections | `README.md`:111 | Same as the Pauli-frame finding above. |
| 16 | LOW | physics | Purification without a rotation is called BBPSSW, but the BBPSSW twirl is missing | `ui/views/method.js`:77 | Fixed: the option and the Method text say "recurrence step of BBPSSW, without its random twirl". |
| 17 | LOW | physics | The conservative ladder exports a 'witness_fidelity_high' that is not an upper bound | `bellkit/analysis.py`:218 | Fixed: the conservative ladder reports no upper fidelity value. |
| 18 | LOW | physics | The YY setting gets no predicted correlator, so the table and CSV show a blank | `bellkit/models.py`:220 | Fixed: the exact model predicts the YY correlator; a test checks it against the circuit. |
| 19 | LOW | runtime | Confidence levels on the error-rate and $`S`$ intervals are mislabelled | `ui/views/lab.js`:193 | Same as the interval-label findings above. |
| 20 | LOW | runtime | 'allows undefined' size note on the refused (QPU) profile | `ui/views/common.js`:72 | Fixed: a refused (QPU) profile shows its refusal instead of a qubit limit. |
| 21 | LOW | runtime | Reset leaves the old error and the old report in place, and exports then disagree | `ui/views/lab.js`:284 | Fixed: Reset clears the error message and the last report, so exports are empty again. |
| 22 | LOW | runtime | Run markers outside the axis range disappear while their legend entries stay | `ui/views/certificates.js`:215 | Fixed: markers outside the axes are pinned to the edge and drawn hollow. |
| 23 | LOW | runtime | Noise-strength slider in the Certificates noise sweep has no effect | `ui/views/certificates.js`:171 | Fixed: the noise sweep shows only the noise-type selector (the sweep covers every strength). |
| 24 | LOW | runtime | 3D view leaks GPU buffers on every Bell run | `ui/widgets/corrset3d.js`:289 | Fixed: geometries and materials are disposed when the 3D points or surfaces are rebuilt. |
| 25 | LOW | claims | The $`S`$ interval is labelled 95 % but is computed as a 97.5 % Hoeffding interval | `ui/widgets/gauge.js`:47 | Same as the interval-label findings above. |
| 26 | LOW | claims | Tour says 'these settings cannot show' the $`v = 0.5`$ Werner state's entanglement, implying other settings could | `ui/views/tour_steps.js`:136 | Fixed: the tour says no CHSH test can show this entanglement (Werner states violate CHSH only above visibility $`1/\sqrt{2}`$). |
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

## Round 2 (2026-10-10, afternoon)

Three independent reviews of the state after the morning's work (correctness of numbers and
claims; the hackathon rules and disclosures; accessibility and documentation), each finding then
checked against the code, the data or the original source before it was fixed. Prefixes: C =
correctness, R = rules, A = accessibility, D = documentation.

| # | Severity | Finding | What was done |
|---|---|---|---|
| R1 | HIGH | Demo video not linked yet | Fixed: unlisted YouTube video linked in the README and write-up (opens without sign-in). |
| R2 | HIGH | Repository private; the write-up links a tag that does not exist yet | Open until submission: tag `v1.0-submission`, make the repository public, regenerate the write-up with images, check every link signed out. |
| A1 | HIGH | Tour box cut off at 400 % zoom (Reflow) | Fixed: box limited to the viewport and scrolls inside; checked at 320 × 256 px. |
| A2 | HIGH | Input borders 1.5:1 (non-text contrast) | Fixed: separate control-border colour, 3.4–4.0:1. |
| R3 | MEDIUM | Pre-window throwaway test project on Qollab not disclosed | Fixed: listed in "Pre-window material" (date, what it established, nothing reused). |
| R4 | MEDIUM | In-window commit times could look like pre-window coding | Fixed: window start in JST and UTC, GitHub event time of the pre-window push, commits described as batched snapshots, D9 dated "during the window". |
| R5 | MEDIUM | No accessibility statement in the write-up | Fixed: "Accessibility" section with the measured results. |
| R6 | MEDIUM | CC BY notice lacked the Zenodo record title and its copyright line | Fixed in `NOTICE.md` and `THIRD_PARTY_NOTICES.md` (checked against the Zenodo record). |
| R7 | MEDIUM | Recorded IonQ runs predate the final code | Checked: circuits and decoding unchanged since the captures; noted in Results; a new IonQ Forte Enterprise 1 run was made with the final upload. |
| C1 | MEDIUM | $`S`$ interval called "95 %" in the notebook and three UI labels, "97.5 %" in the README | Fixed: labels built from $`\delta`$ (97.5 % per interval, 95 % per claim). |
| C2 | MEDIUM | "Canary fraction of 1" wrong for the IBM Fez runs (0.9725) | Fixed. |
| C3 | MEDIUM | "IonQ accepts one circuit per job" broader than the evidence | Fixed: "on Qollab, the IonQ simulator…". |
| C4 | MEDIUM | Meiers 2026 presented as an $`S`$–$`Q`$ point | Fixed: described as $`S`$ only, preprint, no DI claim. |
| C5 | MEDIUM | decisions.md header did not mention D3 and D10 | Fixed. |
| A3 | MEDIUM | Correlation-space points kept dark-theme colours in light mode | Fixed: theme colour tokens, resolved again on a theme change. |
| A4 | MEDIUM | 3D points told apart by colour only | Fixed: same marker shape in 3D, the 2D slice and the legend. |
| A5 | MEDIUM | Focus dropped to the page when a focused button became disabled | Fixed: focus moves to the status line or the tour title first. |
| A6 | MEDIUM | Tour box not repositioned on resize | Fixed. |
| A7 | MEDIUM | Overflowing scroll boxes not keyboard-reachable in Safari | Fixed: focusable region while overflowing. |
| D1 | MEDIUM | Jargon used before it is defined | Fixed: glossary in the README and in the Method view; QBER spelled out in the UI. |
| D2 | MEDIUM | Write-up links point to a tag that does not exist | Same as R2. |
| D3 | MEDIUM | LaTeX in the write-up may not render on Qollab | Checked on Qollab's preview: 21 formulas, no errors (2026-10-10). Checked again after the formula change (2026-10-11): the pasted write-up shows 75 KaTeX formulas (3 display), no KaTeX error. |
| C6 | LOW | Two dates for the throwaway test project | Fixed: reused once in the window for the WebGPU check (D10). |
| C7 | LOW | No capture for the built-in simulator on Qollab | Fixed: the built-in run on Qollab gives the same seed and counts as the local reference row ($`S = 2.708`$), now stated. |
| C8 | LOW | Write-up script edge cases (CRLF, scheme links, missing marker) | Fixed: CRLF normalised, links with a scheme, `//` or `#` left alone, error when the marker is missing. |
| C9 | LOW | Every notebook rebuild changes cell ids and timestamps | Fixed: stable ids, execution timestamps removed. |
| C10 | LOW | TLM condition did not say which sign vectors | Fixed in the README and the Method view. |
| C11 | LOW | "More so for the swap" no longer true across backends | Fixed: compared within one backend. |
| C12 | LOW | Generated write-ups out of date | Regenerated before pasting. |
| C13 | LOW | Notebook intro overstated what the app shows | Fixed. |
| R8 | LOW | License section did not mention CC BY data | Fixed. |
| R9 | LOW | Pre-window table missed in-window edits to the requirements files | Fixed. |
| R10 | LOW | The earlier public demo is not linked | Fixed: linked after checking that its E91/CHSH option runs (author's decision). |
| R11 | LOW | "Use of AI" may not cover the AI-assisted review | Fixed: one sentence added (author's decision). |
| R12 | LOW | The "beyond tutorial" category is not named | Fixed: named in "Prior work and what is new here". |
| R13 | LOW | Uploaded README links break in Qollab's file view | Not changed: the Project Card uses the converted write-up with absolute links. |
| R14 | LOW | No "What didn't work" section | Fixed: added. |
| R15 | LOW | Tag time is self-asserted | Fixed: GitHub's event time of the first push cited. |
| A8 | LOW | `<pre>` with a name but no role | Fixed: `role="region"`. |
| A9 | LOW | Live regions unreliable; current stage not exposed | Partly fixed: `aria-current="step"` on the active stage; the busy indicator is unchanged. |
| A10 | LOW | Two bar pairs and two gauge zones differ by colour only | Not changed: the bars are labelled by position and listed in the counts table; the gauge zones are labelled by their tick values. |
| A11 | LOW | Header 8 px too wide at 320 px | Fixed. |
| A12 | LOW | Repeater charts without a data table | Fixed. |
| D4 | LOW | Notebook figure without a text alternative | Fixed: titles, legends on both panels, and a printed table of the crossing points. |
| D5 | LOW | Notebook: run location, raw rung names, five of six rungs | Fixed. |
| D6 | LOW | decisions.md intro out of date | Same as C5. |
| D7 | LOW | Architecture diagram shown twice; weak alt text | Alt text improved; the Mermaid source stays for GitHub (Qollab's write-up drops it). |

After the fixes: 254 tests pass; axe-core 4.14.0 reports 0 violations on all 8 views in both
schemes, and Lighthouse 13.5.0 scores accessibility 100 (`results/a11y/`).

## Round 3 (2026-10-11): formulas, documents and the demo video

Independent reviewers checked the typeset formulas, the documents and the demo video; a second
reviewer re-checked each finding before it was fixed.

| ID | Severity | Finding | Resolution |
|---|---|---|---|
| V1 | HIGH | Video: "your run lies between the two" over a plot whose "your run" was the eavesdropped run, inside the local square | A run without Eve (S ≈ 2.7) is made before the correlation-space shot |
| V2 | MEDIUM | Video: the two-link swap was credited to the IonQ Aria noise model while the screen showed other runs | The shot sets link noise to none, where the recorded IonQ Aria 1 run (S = 2.520) and its note show |
| V3 | MEDIUM | Repeater: "a job is already running" appeared for the view's own job, and the video cut before the purification result | The view tracks its own job (local busy flag); the status keeps the run's result. Checked on Qollab with the IonQ Aria 1 noise model on 2026-10-11: the chain status kept "Done in 22.887 s" (S = 2.590, conservative 2.171) and only the other control showed the one-job notice |
| M1 | MEDIUM | "The two entries share no code" no longer held (same small Temml helper and font declaration) | Disclosed in the README |
| M2 | MEDIUM | Unicode fallback printed `bigl`/`bigr` in the DI-key formula | Mapped; spacing after control words and `^\circ` fixed too; a render that throws falls back |
| M3 | MEDIUM | Upload bundle README linked the old video | Bundles rebuilt from HEAD before upload |
| L1 | LOW | Prediction box is an aria-live region with MathML labels, against "live messages stay plain" | Claim narrowed (D12, tex.js, accessibility record) |
| L2 | LOW | Accessibility record cited an after-run count not in its file and missed a 404 | Re-run recorded (`math_checks_20261011b.json`); the 404 is the harness's `/favicon.ico` |
| L3 | LOW | Lighthouse 100 not re-run after the formula change | Re-run: 100 / 100 in both schemes (`lighthouse_20261011_math.json`) |
| L4 | LOW | Notebook noise-sweep axis and title not typeset | mathtext |
| V4 | LOW | Video: Forte Enterprise row cut off; Overview flashed between scenes | Scroll adjusted; each scene opens on its own view |

The video was re-recorded in one colour scheme (light) with no still stretch longer than about
four seconds; the finished file has no decode errors, a constant 30 fps and played in Chrome in
real time with no stall or dropped frame.

## Round 4 (2026-10-11 afternoon): figure text, run console, Repeater

A detector measured every SVG label against its box in all views, before and after runs, at
widths from 1280 to 320 px, in light and dark, with the default font, a wider sans (DejaVu Sans)
and text at 110 %; an independent pass re-ran it on the result.

| ID | Severity | Finding | Resolution |
|---|---|---|---|
| F1 | HIGH | "DI randomness" ran past its box in the protocol diagram with a wider font (also "Entanglement", the Overview's "DI key (Acín 2007)", a chart's last x tick and band labels in the circuit drawing) | Labels are measured in the browser's own font and shrink to fit their box (never below 10 px; the certificate column shrinks together); boxes and bands are widened where there is room; 0 findings in all 3 fonts × 6 widths × 2 schemes |
| F2 | HIGH | Real data: at about 1,000 px the value column of the Munich cards was 14 px wide, so values printed one character per line | `.kv` columns `fit-content(55%) minmax(0, 1fr)`; the cards are 444 and 509 px tall instead of about 2,000 |
| F3 | MEDIUM | Repeater: after the link noise changed, the "Measured" card still showed the old run under the new settings | The heading names the noise it ran with; once the settings change the card is marked and says to run again |
| F4 | MEDIUM | `scripts/record_runs.py` stopped on `results/qollab/video_run_20261010.json` (a note, not counts) | Files without captured counts are skipped and listed; `data/recorded_runs.json` rebuilds unchanged |
| F5 | LOW | "CERTIFICATES · 5" read as a count of certificates | The group carries the stage mark in its corner like the other stages (5, ▶, ✓) |
| F6 | LOW | The console's percentages rounded ties to even, the page up | Both round ties up; `num()` also nudges decimal ties (0.9625 showed as 0.962 in one view and 0.963 in another) |
| F7 | LOW | The mouse wheel over the 3D correlation space zoomed it instead of scrolling the page | Wheel zoom off (the Zoom buttons remain); vertical swipes scroll on touch screens |
| F8 | LOW | Qiskit's text drawings fell back to a CJK monospace font on some systems, misaligning box-drawing characters | Monospace stack with DejaVu Sans Mono and Liberation Mono before the generic family |
| F9 | LOW | The shared-code disclosure named the Temml helper (each entry has its own) and missed the harness shim and the write-up converter | Corrected in the README |
| F10 | LOW | The independent re-check found lines crossing three labels: the dashed message arrow through "bases, sample" in the Repeater timeline (2–4 links), a source line through "link + noise" at 4 links, and the active arrowhead under "counts" at stage 4 | Edge and message labels carry a halo in the card colour and are drawn after every edge |

### Demo video: one continuous take (2026-10-11)

The video was cut from several recordings, so a judge could not follow every click. It is now
one unbroken screen recording on Qollab with the real mouse pointer: the project page, Code, Run
Project, Run with the free Built-in simulator (24q), then every step in the app in order, and the
run console at the end, which names the simulator and prints a line per result. The narration is
placed where each step happened in the take; nothing is cut. Checks of the finished file: no
decode errors, constant 30 fps, loudness about −16.8 LUFS, and real-time playback in Chrome with
no stall and no dropped frame. The runs it shows are in `results/qollab/video_take_20261011.json`.
