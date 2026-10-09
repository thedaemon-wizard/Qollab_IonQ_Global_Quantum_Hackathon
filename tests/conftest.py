"""Shared helpers: exact (infinite-shot) count distributions from Statevector."""

import pytest
from qiskit.quantum_info import Statevector

from bellkit import config


def exact_counts(qc):
    """Float 'counts' over the circuit's clbits, in Qiskit's key format (single register)."""
    meas = {}
    for inst in qc.data:
        if inst.operation.name == "measure":
            meas[qc.find_bit(inst.clbits[0]).index] = qc.find_bit(inst.qubits[0]).index
    bare = qc.remove_final_measurements(inplace=False)
    qargs = [meas[c] for c in sorted(meas)]
    probs = Statevector(bare).probabilities_dict(qargs=qargs)
    return {k: v for k, v in probs.items() if v > 1e-15}


@pytest.fixture(scope="session")
def cfg():
    return config.load()


@pytest.fixture(scope="session")
def settings(cfg):
    return config.settings(cfg)
