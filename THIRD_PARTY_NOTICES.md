# Third-party material

The code in this repository is MIT-licensed (see `LICENSE`). It uses or includes the following
third-party material.

## Included in this repository

| Item | Where | Licence | Notes |
|---|---|---|---|
| Tabler Icons 3.49.0, 81 outline icons | `ui/core/icons.js` | MIT, Copyright (c) 2020-2026 Paweł Kuna | Path data copied by `tools/vendor_icons.py` from the npm package `@tabler/icons@3.49.0`. https://tabler.io/icons |
| Munich event-ready Bell test data (two `*_pairs.csv` files) | `data/third_party/rosenfeld2017/` | CC BY 4.0 | W. Rosenfeld et al., Phys. Rev. Lett. 119, 010402 (2017); Zenodo record "Experimental data and archived website material for 'Event-Ready Bell Test Using Entangled Atoms Simultaneously Closing Detection and Locality Loopholes'", doi:10.5281/zenodo.22936124, Copyright (C) 2016 The Authors. Copied without modification; see the folder's `NOTICE.md`. |
| Published S, Q and key-rate values | `data/experiments.json` | values quoted with attribution; data records CC BY 4.0 where noted | Lu et al., Science 391, 592 (2026), Zenodo doi:10.5281/zenodo.17958512; Liu et al., Nature 652, 51 (2026), Zenodo doi:10.5281/zenodo.18218281; other values from the cited papers. |

Tabler Icons licence text (MIT):

> Permission is hereby granted, free of charge, to any person obtaining a copy of this software
> and associated documentation files (the "Software"), to deal in the Software without
> restriction, including without limitation the rights to use, copy, modify, merge, publish,
> distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the
> Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or
> substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
> BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
> NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
> DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Used at run time, not included

| Item | Licence | How it is used |
|---|---|---|
| Qiskit 2.5.2 | Apache-2.0 | Circuits, transpilation, local simulators (installed by Qollab from `requirements.txt`) |
| qiskit-aer 0.17.2, qiskit-ibm-runtime 0.50.0, qiskit-ionq 1.0.2 | Apache-2.0 | Backends provided by Qollab's runtime |
| NumPy, SciPy (Pyodide builds) | BSD-3-Clause | Provided by Pyodide |
| three.js r186 (0.186.1) and its examples (OrbitControls, ConvexGeometry, CSS2DRenderer) | MIT | Loaded through Qollab's import map (local harness: jsDelivr) |
| Temml 0.14.0 (Ron Kok) | MIT | Turns the TeX formulas of the views into MathML; imported at start-up from `https://cdn.jsdelivr.net/npm/temml@0.14.0/dist/temml.mjs` by `ui/core/tex.js`. Without it the formulas are shown as Unicode text. |
| Latin Modern Math 1.959 (GUST e-foundry) | GUST Font License | Math font for the formulas, from the Temml repository on jsDelivr (pinned commit), after any locally installed copy; declared in `main.css`. |

## Used only for development

pytest (MIT), ruff (MIT), mermaid-cli (MIT, renders the README diagrams), axe-core (MPL-2.0) and
Lighthouse (Apache-2.0) for accessibility checks. None of them is part of the uploaded project.
