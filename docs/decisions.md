# Decisions

D1–D7 were recorded on 2026-10-09, before the build window; D3 and D4 were updated and D8–D11
added during the window (2026-10-10), D12 and D13 on 2026-10-11.

Each entry states the decision, the evidence it rests on (checked on the date given), and what
would make us revisit it. Sources are in [references.md](references.md) unless linked here.

## D1 — The project runs on Qollab only; no external mirror during the build window

- **Decision.** The judged artifact is a Qollab JS project. We do not build or host a separate
  copy elsewhere during the window.
- **Evidence (2026-10-09).**
  - Public Pyodide 314.0.7 (CPython 3.14.2) ships NumPy, SciPy and Matplotlib but no Qiskit, and
    PyPI has no Emscripten wheel for Qiskit 2.5.2 or 2.6.0rc1. Qollab runs its own Pyodide builds.
  - Building Qiskit 2.5.2 for Pyodide is possible in principle but needs patches to its Rust
    dependency tree (a crate without an Emscripten platform module, a terminal crate with
    unsupported default features) and a newer Rust toolchain; a realistic estimate is 6–12 hours,
    and it would still not include Qiskit Aer (no Emscripten build exists; estimated 20–40+ hours).
  - Compiling Qiskit's Rust core directly to WebAssembly without Python is not viable: the core
    crates depend on PyO3, and the C API exposes no simulator.
- **Revisit if.** An official Emscripten wheel of Qiskit appears, or a static results page is
  wanted after submission.

## D2 — No PyVista / VTK.wasm

- **Decision.** 3D views use three.js, which Qollab already provides through its import map.
- **Evidence (2026-10-09).** Qollab's JS frame is sandboxed (`allow-scripts` only) with a CSP that
  allows scripts from cdn.jsdelivr.net but not unpkg.com and sets `worker-src 'none'`.
  pyvista-wasm 0.15.2 (pre-alpha) loads its loader from unpkg and unpacks a 22 MB archive in a Web
  Worker; the VTK.wasm module itself is 81–87 MB. There is no Pyodide wheel of the `vtk` package,
  and PyVista does not yet support Pyodide.
- **Revisit if.** A Pyodide `vtk` wheel exists and Qollab's CSP allows the loader.

## D3 — No JupyterLite; a guided tour inside the app instead

- **Decision.** The walkthrough is part of the app (a keyboard-accessible guided tour; five of its
  steps run the real circuits, or set them up on IonQ). An executed notebook (`notebooks/walkthrough.ipynb`, 2026-10-10) is in the repository for
  reading on GitHub; it is not part of the Qollab upload.
- **Evidence (2026-10-09).** JupyterLite kernels run in Web Workers (blocked by `worker-src
  'none'`), the app is several hundred files (Qollab allows 100 files of ≤ 2 MB), it expects
  browser storage and a same-origin frame (neither is available), nested frames to github.io are
  outside Qollab's `frame-src`, and public Pyodide has no Qiskit.

## D4 — IonQ path: one packed circuit per run, no dynamic circuits

- **Decision.** On IonQ backends, every measurement setting of a run is placed side by side in
  ONE circuit, each with its own classical register, plus a one-qubit "canary" register whose
  expected outcome checks the bit order. Local and IBM noise-model runs submit one circuit per
  setting in a single `backend.run` call. Results are read by position (see D9). All measurements are
  terminal; corrections (for example after entanglement swapping) are applied as a Pauli frame in
  classical post-processing.
- **Evidence.** Qollab's docs say IonQ backends accept one job per run and that the run's circuits
  may go into that single call; on 2026-10-09 a test project on Qollab found that a job with
  several circuits is rejected by the IonQ simulator ("Only job type ionq.circuit.v1 is
  supported"), while one circuit with several registers runs (counts keys are space-separated,
  last register leftmost). IonQ's OpenQASM 3 documentation: dynamic circuit execution is not
  supported on any IonQ target, including the simulator. On IonQ, Qiskit's Sampler wrapper returns
  all-zero shots silently, so counts are read with `backend.run(...).result().get_counts()`.
- **Consequence.** The packed circuit grows with the number of settings, so the IonQ profile has a
  qubit limit (`config/defaults.json`); a run that would exceed it is refused with a message
  before anything is submitted.
- **Shots (2026-10-11).** The IonQ profile defaults to 200 shots per setting. IonQ's noise-model
  simulation is shot-aware and runs one simulation per requested shot (IonQ docs, checked
  2026-10-11), and a 200-shot packed job took 22.8–26.9 s on Qollab (`results/qollab/`). The
  *Shots per setting* field accepts 100–100,000 on every backend, so more shots are one edit away;
  at 200 the DI-key bound does not survive the conservative end, which the README reports.

## D5 — Pin `qiskit==2.5.2`

- **Decision.** `requirements.txt` pins Qiskit 2.5.2.
- **Evidence.** Qollab installs `qiskit>=2.5.2,<3.0.0` when requirements.txt does not pin it, and
  Qiskit 2.6.0 is scheduled for 2026-10-15, during judging. Pinning keeps the judged run identical
  to the submitted one.
- **Revisit if.** Qollab removes the 2.5.2 wheel from its package index.

## D6 — The local environment mirrors Qollab's versions

- **Decision.** Local checks use Python 3.14 with qiskit 2.5.2, qiskit-aer 0.17.2,
  qiskit-ibm-runtime 0.50.0, qiskit-ionq 1.0.2 and the NumPy/SciPy/Matplotlib versions bundled with
  Pyodide 314.0.7 (see `requirements-dev.txt`). All eight IBM fake backends that Qollab offers are
  available locally (`results/env_check_20261009.json`).

## D7 — The 3D view needs WebGL 2 and says so when it is missing

- **Decision.** three.js r186 requires WebGL 2. When a WebGL 2 context cannot be created, the 3D
  view is replaced by its 2D equivalent (angle table and plots) with a visible explanation, rather
  than failing silently.
- **Evidence (2026-10-09).** WebGL context creation failed in two software-rendered desktop
  browsers we tried, while headless Chrome provided WebGL 2 through SwiftShader. Judges' browsers
  will usually have WebGL 2, but the project must stay usable without it.

## D8 — Vendored subsets instead of git submodules

- **Decision.** Third-party assets are copied in as small, licensed subsets (the Tabler icons the
  UI uses, the two Munich event files), not added as git submodules.
- **Evidence.** A Qollab project allows at most 100 files of at most 2 MB each, and the upload is
  a flat zip; a submodule would bring whole repositories that the app does not use.
  `THIRD_PARTY_NOTICES.md` lists every copied item with its licence.

## D9 — Run profiles are matched from the backend name, most specific first

- **Decision.** `config/defaults.json` lists run profiles (quantum hardware: refuse; IonQ
  simulator; IBM noise models; ideal simulators) and the first profile whose pattern occurs in the
  injected backend's name is used. Unknown names get a conservative default profile, and the UI
  shows which profile was chosen.
- **Evidence.** Qollab names the IBM noise-model backend `fake_fez` and so on, while a local
  `AerSimulator.from_backend(FakeFez)` is named `aer_simulator_from(fake_fez)`; with the ideal
  profile listed first the latter matched "aer_simulator" (found by a test during the window,
  2026-10-10).
  Qollab's Braket local simulator is named `default`, so the class name (`BraketLocalBackend`)
  is matched as well. On Qollab a 25-qubit packed circuit took over 50 s on this state-vector
  simulator, so Braket uses one circuit per setting; its results do not keep circuit names,
  so counts are read by position for every backend.

## D10 — The 3D view stays on WebGL 2; no WebGPU renderer

- **Decision.** The correlation-space view keeps three.js's `WebGLRenderer`. No WebGPU code path.
- **Evidence (2026-10-10, Chrome 152 on Linux with WebGPU switched on).** The Qollab page itself
  exposes `navigator.gpu` and a hardware adapter, but inside the project frame (sandboxed,
  `allow-scripts` only) a probe found `navigator.gpu` undefined, so no adapter can be requested
  (run in the pre-window throwaway test project, reused for this check on 2026-10-10).
  Qollab's import map provides `three` and `three/addons/` but not `three/webgpu`. WebGL 2 in the
  same frame runs on the GPU (ANGLE over Vulkan), and the scene is small (a few thousand
  triangles), so WebGPU would add a second code path without a visible gain.
- **Revisit if** Qollab exposes WebGPU in project frames and adds `three/webgpu` to its import map.

## D11 — The protocol animation lives inside the Bell Lab; no separate end-to-end page

- **Decision.** The Bell Lab's run card shows a protocol diagram (pair source → Alice and Bob →
  one job → sift and estimate → six certificates) that follows the five-stage replay: the
  current stage lights up, finished stages turn solid, and each box shows its numbers only once
  its stage is reached. We did not add a separate page that runs the experiments as a chain.
- **Evidence (2026-10-10).**
  - Before this change the replay had only the stepper cards, and the Overview and Repeater
    diagrams were static, so the order of the protocol was not visible as a picture.
  - The stages cannot be streamed live: the whole experiment is one `backend.run`, and the only
    time measured is that job's wall time. The diagram therefore replays the counts of the one
    job, and its caption says that the pacing (1.1 s per step) is not physical time.
  - A chain of experiments (Bell Lab, then Repeater) on one page would need several jobs per
    run, which breaks the one-IonQ-job rule (D4).
  - The diagram adds no computation: it reads the same report as the stepper, takes each
    certificate's outcome from the same function as the ladder table (`rungOutcome` in
    `ui/views/common.js`), and has no timers of its own; it moves only while the replay plays
    (`tests/test_ui_conformance.py`). Accessibility was measured again after the change
    ([results/a11y/](../results/a11y/README.md)).
- **Revisit if** Qollab lets a project read intermediate results while its job runs, or allows
  several jobs in one IonQ run.

## D12 — Formulas typeset as math in the docs, the write-up and the app

- **Decision** (2026-10-11). Markdown sources use GitHub math: `` $`…`$ `` inline (it keeps
  backslashes and `*` intact) and top-level ```` ```math ```` blocks. `scripts/make_writeup.py`
  turns both into the `$…$` and `$$…$$` that Qollab's write-up renders with KaTeX, and stops on
  an unpaired delimiter. In the app, `ui/core/tex.js` turns TeX in view text into native MathML
  with Temml 0.14.0 (imported at start-up from jsDelivr) in Latin Modern Math; the seven
  hand-built Method formulas use the same font. SVG text, `<option>`, ARIA labels, `announce()`
  messages, status lines and exports stay plain Unicode (the Lab's prediction box, a polite live
  region, keeps MathML term labels). The README figures use matplotlib mathtext.
- **Evidence.** Plain `$…$` on GitHub drops a backslash before punctuation (`\,`, `\%`), which
  changes formulas; Qollab's renderer does not understand the backtick form or math fences. The
  project frame's CSP allows scripts and fonts from cdn.jsdelivr.net and blocks `data:` fonts.
  With jsDelivr blocked the views show the same formulas as Unicode text (checked in the local
  harness); on Qollab the import and the font load (checked with the built-in simulator).
- **Revisit if** the app must run offline: vendor Temml and the font with their licences.

## D13 — Considered and not built (recorded 2026-10-11)

| Item | Status | Reason |
|---|---|---|
| A hosted mirror outside Qollab (for example a Hugging Face Space) | Not built | D1: the judged artifact is the Qollab project. |
| Fetching the Munich files from Zenodo at run time to check them | Not built | The app reads the shipped copies in `data/third_party/` (with their `NOTICE.md`), so it runs offline and the same numbers come out every time; the Zenodo CORS behaviour is noted in `references.md` §1. |
| A run seed taken from a public randomness beacon | Not built | Runs use the fixed seed in `config/defaults.json` so anyone can reproduce the counts; simulator outcomes are pseudo-random either way, so a beacon seed would add no physics. |
| CSV or log files of the recorded runs in `results/` | Not built | Results are kept as JSON, with the counts wherever they were exported (`results/`, `data/recorded_runs.json`); the app's CSV export goes to Qollab's run console. |
