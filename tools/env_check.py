"""Record the local toolchain and confirm the simulators used for local checks work.

This is an environment check, written before the hackathon build window. It is not part
of the project: it only prints library versions, lists the IBM fake backends that mirror
Qollab's IBM noise models, checks that the IonQ provider can be constructed without an
API token (local transpilation only; IonQ jobs run on Qollab), and runs one Bell pair on
two simulators.

Usage:
    .venv/bin/python tools/env_check.py --out results/env_check_YYYYMMDD.json
"""

from __future__ import annotations

import argparse
import importlib.metadata
import json
import platform
import sys
from datetime import UTC, datetime

# The IBM noise models offered in Qollab's Run dialog (Qollab docs, "Compute backends").
QOLLAB_IBM_DEVICES = ("Boston", "Kingston", "Pittsburgh", "Fez", "Marrakesh", "Aachen", "Miami", "Berlin")
PACKAGES = (
    "qiskit",
    "qiskit-aer",
    "qiskit-ibm-runtime",
    "qiskit-ionq",
    "numpy",
    "scipy",
    "matplotlib",
    "rustworkx",
)


def package_versions() -> dict[str, str]:
    return {name: importlib.metadata.version(name) for name in PACKAGES}


def bell_circuit():
    from qiskit import QuantumCircuit

    qc = QuantumCircuit(2, 2, name="bell")
    qc.h(0)
    qc.cx(0, 1)
    qc.measure([0, 1], [0, 1])
    return qc


def ibm_fake_backends() -> dict[str, dict]:
    from qiskit_ibm_runtime import fake_provider

    found = {}
    for device in QOLLAB_IBM_DEVICES:
        cls = getattr(fake_provider, f"Fake{device}", None)
        if cls is None:
            found[device] = {"available": False}
            continue
        backend = cls()
        found[device] = {"available": True, "class": cls.__name__, "num_qubits": backend.num_qubits}
    return found


def ionq_without_token() -> dict:
    from qiskit import transpile
    from qiskit_ionq import IonQProvider

    try:
        backend = IonQProvider().get_backend("ionq_simulator")
        isa = transpile(bell_circuit(), backend=backend, optimization_level=1)
    except Exception as exc:  # report the failure instead of hiding it
        return {"constructed": False, "error": f"{type(exc).__name__}: {exc}"}
    return {"constructed": True, "backend": backend.name, "transpiled_ops": dict(isa.count_ops())}


def run_bell(shots: int, seed: int) -> dict[str, dict]:
    from qiskit import transpile
    from qiskit.providers.basic_provider import BasicSimulator
    from qiskit_aer import AerSimulator
    from qiskit_ibm_runtime.fake_provider import FakeFez

    runs = {}
    basic = BasicSimulator()
    counts = (
        basic.run(transpile(bell_circuit(), basic), shots=shots, seed_simulator=seed).result().get_counts()
    )
    runs["BasicSimulator"] = {"shots": shots, "counts": counts}

    noisy = AerSimulator.from_backend(FakeFez())
    isa = transpile(bell_circuit(), backend=noisy, optimization_level=1, seed_transpiler=seed)
    counts = noisy.run(isa, shots=shots, seed_simulator=seed).result().get_counts()
    runs["Aer(FakeFez)"] = {"shots": shots, "counts": counts, "two_qubit_ops": isa.num_nonlocal_gates()}
    return runs


def main() -> int:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("--out", required=True, help="path of the JSON report to write")
    parser.add_argument("--shots", type=int, default=1000, help="shots per Bell run")
    parser.add_argument("--seed", type=int, default=20261009, help="simulator and transpiler seed")
    args = parser.parse_args()

    report = {
        "schema": "env_check/1",
        "created_utc": datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "python": sys.version.split()[0],
        "platform": platform.platform(),
        "packages": package_versions(),
        "ibm_fake_backends": ibm_fake_backends(),
        "ionq_provider_without_token": ionq_without_token(),
        "bell_runs": run_bell(args.shots, args.seed),
    }
    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump(report, fh, indent=2, sort_keys=True)
        fh.write("\n")
    print(json.dumps(report, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
