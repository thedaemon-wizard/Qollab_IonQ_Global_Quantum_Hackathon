"""The only module that talks to a backend.

One call submits the whole plan as ONE job: a list of circuits for local simulators, or a
single packed circuit where the profile says so (IonQ through Qollab). Results are read
back per circuit, by position; the decoder takes it from there.
"""

from __future__ import annotations

import time

from qiskit import transpile

from bellkit.circuits import Plan


class RefusedBackend(RuntimeError):
    """The run profile forbids this backend (for example quantum hardware)."""


class PlanTooLarge(ValueError):
    """The plan needs more qubits than the profile allows."""


def check_plan(plan: Plan, profile: dict) -> None:
    if profile.get("refuse"):
        raise RefusedBackend(profile["refuse_reason"])
    if plan.total_qubits_largest > profile["max_qubits"]:
        raise PlanTooLarge(
            f"this run needs {plan.total_qubits_largest} qubits in one circuit, "
            f"but the '{profile['label']}' profile allows {profile['max_qubits']}"
        )


def _transpile(circuits: list, backend, profile: dict, seed: int | None) -> list:
    # One process, as in Pyodide; this also keeps local runs identical to Qollab runs.
    mode = profile["transpile"]
    if mode == "backend":
        return transpile(
            circuits,
            backend=backend,
            optimization_level=profile["opt_level"],
            seed_transpiler=seed,
            num_processes=1,
        )
    if mode == "basis":
        return transpile(
            circuits,
            basis_gates=profile["basis_gates"],
            optimization_level=profile["opt_level"],
            seed_transpiler=seed,
            num_processes=1,
        )
    raise ValueError(f"unknown transpile mode {mode!r}")


def circuit_stats(circuit) -> dict:
    return {
        "name": circuit.name,
        "num_qubits": circuit.num_qubits,
        "depth": circuit.depth(),
        "two_qubit_gates": circuit.num_nonlocal_gates(),
        "ops": {k: int(v) for k, v in circuit.count_ops().items()},
    }


def run_plan(backend, plan: Plan, profile: dict, shots: int, seed: int | None) -> dict:
    check_plan(plan, profile)
    compiled = _transpile(plan.circuits, backend, profile, seed)
    options = {"shots": int(shots)}
    if profile.get("seed_option") and seed is not None:
        options[profile["seed_option"]] = int(seed)
    start = time.time()
    payload = compiled if len(compiled) > 1 else compiled[0]
    result = backend.run(payload, **options).result()
    elapsed = time.time() - start
    # Read by position, not by name: the Braket provider does not keep circuit names.
    counts = [dict(result.get_counts(i)) for i in range(len(compiled))]
    return {
        "counts": counts,
        "compiled": [circuit_stats(c) for c in compiled],
        "logical": [circuit_stats(c) for c in plan.circuits],
        "seconds": round(elapsed, 3),
        "shots": int(shots),
        "options": {k: v for k, v in options.items() if k != "shots"},
    }
