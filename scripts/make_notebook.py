"""Build and execute notebooks/walkthrough.ipynb (read on GitHub; not uploaded to Qollab).

Usage: python scripts/make_notebook.py   (needs nbformat, nbclient, ipykernel; see requirements-dev.txt)

The kernel runs from the project root, as on Qollab, so the literal data paths resolve.
"""

import subprocess
import sys
from pathlib import Path

import nbformat
from nbclient import NotebookClient

ROOT = Path(__file__).resolve().parent.parent

INTRO = """# Bell-Test Lab: walkthrough

This notebook calls the same Python package that runs inside the Qollab project (`bellkit`).
Every number below is computed when the notebook is executed; the app shows the same ones.

Simulated counts and asymptotic formulas only: no quantum hardware and no security proof."""

SETUP = """import json
import sys

sys.path.insert(0, ".")
from qiskit.providers.basic_provider import BasicSimulator

from bellkit import app, bounds, config, models, rosenfeld
from bellkit.channels import PauliChannel
from bellkit.circuits import Experiment, build_plan, make_units, qubit_labels

cfg = config.load()
settings = config.settings(cfg)"""

RUN = """request = {'module': 'bell', 'channel': {'kind': 'depolarizing', 'strength': 0.05}}
rep = json.loads(app.run_json(BasicSimulator(), json.dumps(request)))
a = rep['analysis']
print(f"backend {rep['backend']['name']}, {rep['shots']} shots per setting, layout {rep['layout']}")
print(f"S   = {a['S']['point']:.3f}   95% interval [{a['S']['low']:.3f}, {a['S']['high']:.3f}]")
print(f"exact prediction S = {rep['prediction']['S_fixed']:.3f}")
print(f"Q_Z = {a['Q_Z']['point']:.2%}   Q_X = {a['Q_X']['point']:.2%}")"""

LADDER = """def show(v):
    return f"{v:.3f}" if isinstance(v, float) else str(v)

keys = ['bell_violation', 'rate_bbm92', 'kaniewski_extractability',
        'min_entropy_pironio', 'rate_di_acin']
for k in keys:
    p, c = a['ladder_point'][k], a['ladder_conservative'][k]
    print(f"{k:26s} point {show(p):>6}   conservative {show(c):>6}")"""

CIRCUIT = """exp = Experiment('bell', PauliChannel.from_kind('depolarizing', 0.05))
units = make_units(exp, settings, None)
plan = build_plan(units[:1], 'multi_circuit')
print(units[0].setting['id'], qubit_labels(units[0]))
print(plan.circuits[0].draw(output='text', fold=-1))"""

THRESHOLDS = """th = bounds.thresholds()
for name, v in th.items():
    if isinstance(v, dict):
        print(f"{name:10s}", {k: round(x, 4) for k, x in v.items()})
    else:
        print(f"{name:10s}", round(v, 4))"""

SWEEP = """import matplotlib.pyplot as plt

qs = [i / 100 for i in range(41)]
fig, axes = plt.subplots(1, 2, figsize=(10, 3.4))
for kind, ls in (('depolarizing', '-'), ('dephasing', '--'), ('bit_flip', ':'), ('y_flip', '-.')):
    preds = [models.predict(PauliChannel.from_kind(kind, q), settings) for q in qs]
    axes[0].plot(qs, [p['S_fixed'] for p in preds], ls, label=kind)
    rates = [max(0.0, bounds.di_rate_acin(p['S_fixed'], p['Q_Z']) or 0.0) for p in preds]
    axes[1].plot(qs, rates, ls, label=kind)
axes[0].axhline(2, color='grey', lw=1)
axes[0].set(xlabel='noise strength', ylabel='CHSH value S (exact model)')
axes[1].set(xlabel='noise strength', ylabel='DI key rate (Acín et al. 2007)')
axes[1].legend(fontsize=8)
plt.tight_layout()
plt.show()"""

CHAIN = """channel = PauliChannel.from_kind('depolarizing', 0.05)
for n in range(1, 5):
    p = models.predict(channel, settings, hops=n)
    print(f"{n} link(s): S = {p['S_fixed']:.3f}   Q_Z = {p['Q_Z']:.2%}")"""

MUNICH = """for run in rosenfeld.RUNS:
    r = rosenfeld.analyse_run(run, 5000, 0.05, 10)
    print(f"{r['label']}: S = {r['pooled']['S']:.4f} ± {r['pooled']['se']:.4f}, "
          f"Hoeffding lower end {r['S_low']:.4f}")"""

PACKED = """packed = build_plan(units, 'packed_single_circuit')
qc = packed.circuits[0]
print(qc.num_qubits, 'qubits,', len(qc.cregs), 'classical registers (canary first)')
print('clbit offset of each setting:', [offset for _, _, offset in packed.placements])"""

md = nbformat.v4.new_markdown_cell
code = nbformat.v4.new_code_cell
cells = [
    md(INTRO),
    code(SETUP),
    md(
        "## 1. One Bell run\nSix settings (Alice 0°, 90°, ±45°; Bob 0°, 90°) in one job, "
        "with 5% depolarizing noise on Bob's link, on Qiskit's BasicSimulator."
    ),
    code(RUN),
    md(
        "## 2. The certificate ladder\nEach claim at the point estimate and at the conservative end "
        "(S at its lower end, error rates at their upper ends)."
    ),
    code(LADDER),
    md("## 3. One of the circuits\nThe Pauli channel uses two ancilla qubits. Qiskit's own drawing:"),
    code(CIRCUIT),
    md("## 4. Thresholds, computed from the formulas"),
    code(THRESHOLDS),
    md("## 5. Noise sweep\nS and the device-independent key rate for each named channel (exact model)."),
    code(SWEEP),
    md("## 6. Entanglement swapping\nS against the number of links for 5% depolarizing noise per link."),
    code(CHAIN),
    md(
        "## 7. Real data: the Munich 2017 Bell test\n"
        "The first 5,000 events per heralded state, as in the paper "
        "(Rosenfeld et al. 2017, S = 2.221 ± 0.033 for the April run)."
    ),
    code(MUNICH),
    md(
        "## 8. The packed layout used for IonQ\nIonQ accepts one circuit per job, so the settings share "
        "one circuit, with a canary register that checks the bit order."
    ),
    code(PACKED),
]
nb = nbformat.v4.new_notebook(cells=cells)
nb.metadata["kernelspec"] = {"name": "python3", "display_name": "Python 3", "language": "python"}
client = NotebookClient(nb, timeout=600, kernel_name="python3", resources={"metadata": {"path": str(ROOT)}})
client.execute()
out = ROOT / "notebooks" / "walkthrough.ipynb"
nbformat.write(nb, out)
# Same code style as the rest of the repository (outputs are kept).
subprocess.run([sys.executable, "-m", "ruff", "format", "-q", str(out)], check=True)
print("wrote", out.relative_to(ROOT))
