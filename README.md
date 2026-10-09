# Bell-Test Lab (working title)

An entry for the **Qollab × IonQ Global Quantum Hackathon** (theme: *Quantum Unlocked*).

> **Status: pre-window scaffolding.** The project is built during the hackathon window
> (2026-10-09 19:00 ET – 2026-10-11 19:00 ET). This repository currently contains only the
> environment, tooling configuration and reference notes prepared before the window — see
> [Pre-window material](#pre-window-material).

## What it will do

An interactive lab that teaches how one Bell-test (CHSH) dataset supports three different
claims, and how those claims degrade with noise, an eavesdropper and distance:

- **Entanglement-based QKD (BBM92)** — sifted-key error rates in two bases and the asymptotic key fraction.
- **Device-independent bounds** — the key-rate bound of Acín et al. (2007) and the min-entropy bound of
  Pironio et al. (2010), both evaluated from the measured CHSH value.
- **Entanglement swapping across repeater hops** — how the CHSH value and error rates change with the
  number of links.

Everything runs on Qiskit simulators and noise models (Qollab's free simulators, including IonQ's).
The numbers it shows are simulated statistics, not experimental results and not security proofs.

## How to run

*To be written during the build window.*

## Pre-window material

The following existed before the build window started and is disclosed here, as the hackathon
terms require. Everything else in this repository was written during the window; the annotated
tag `pre-window` marks the boundary, so `git diff pre-window` shows exactly what was added.

| Item | What it is |
|---|---|
| `LICENSE`, `.gitignore`, `pyproject.toml` (ruff/pytest settings) | Repository scaffolding |
| `requirements-dev.txt`, `requirements-dev.lock` | Local Python 3.14 environment, pinned to the versions Qollab's runtime provides |
| `tools/env_check.py`, `results/env_check_20261009.json` | Environment check: library versions, IBM fake backends, IonQ provider construction, one Bell pair on two simulators |
| `docs/references.md` | Literature and software fact-check notes |
| `docs/decisions.md` | Design decisions taken before the window, with the evidence behind them |
| This README skeleton and the idea summary above | Project plan |

## What was added during the window

*Generated from `git log pre-window..` at submission time.*

## Use of AI

Generative-AI coding assistance was used to draft code, documentation and research notes.
All results were checked by the author.

## Attribution

This effort is supported by Qollab & IonQ.

## License

[MIT](LICENSE)
