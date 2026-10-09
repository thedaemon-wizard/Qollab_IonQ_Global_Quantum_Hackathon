"""Golden values from Rosenfeld et al., PRL 119, 010402 (2017), main text and Supplement."""

import csv

import pytest

from bellkit import paths, rosenfeld

TOL = 1e-4


@pytest.fixture(scope="module")
def april():
    return rosenfeld.analyse_run("2016-04-15", 5000, 0.05, 50)


@pytest.fixture(scope="module")
def june():
    return rosenfeld.analyse_run("2016-06-14", 5000, 0.05, 50)


def test_row_counts():
    for run, (n, minus, plus) in {
        "2016-04-15": (10201, 5054, 5147),
        "2016-06-14": (10202, 5120, 5082),
    }.items():
        events = rosenfeld.read_events(rosenfeld.RUNS[run]["path"])
        assert len(events) == n
        assert sum(e[0] == "Psi-" for e in events) == minus
        assert sum(e[0] == "Psi+" for e in events) == plus


def test_table_s8_cell():
    """Psi-, settings (0, 0), first 5000: 168 up-up, 443 up-down, 536 down-up, 149 down-down."""
    counts = {}
    seen = 0
    with open(paths.ROSENFELD_APRIL, encoding="utf-8", newline="") as fh:
        rows = csv.DictReader(fh, delimiter="\t")
        for row in rows:
            if row["Bell-state"] != "Psi-":
                continue
            seen += 1
            if seen > 5000:
                break
            if row["setting lab 1"] == "0" and row["setting lab 2"] == "0":
                key = row["result lab 1"] + row["result lab 2"]
                counts[key] = counts.get(key, 0) + 1
    assert counts == {"00": 149, "01": 536, "10": 443, "11": 168}


def test_april_per_state_and_pooled(april):
    assert april["per_state"]["Psi-"]["S"] == pytest.approx(2.2399, abs=TOL)
    assert april["per_state"]["Psi-"]["se"] == pytest.approx(0.0468, abs=TOL)
    assert april["per_state"]["Psi+"]["S"] == pytest.approx(2.2039, abs=TOL)
    assert april["pooled"]["S"] == pytest.approx(2.2213, abs=TOL)
    assert april["pooled"]["se"] == pytest.approx(0.0332, abs=TOL)
    assert april["pooled"]["N"] == {"N00": 2539, "N01": 2461, "N10": 2502, "N11": 2498}
    e = april["pooled"]["E"]
    assert (e["E00"], e["E01"], e["E10"], e["E11"]) == pytest.approx(
        (0.5226, 0.6091, 0.6051, -0.4844), abs=TOL
    )


def test_april_hoeffding_and_certificates(april):
    assert april["hoeffding_halfwidth"] == pytest.approx(0.1087, abs=TOL)
    assert april["S_low"] == pytest.approx(2.1126, abs=TOL)
    c = april["conservative"]
    assert c["kaniewski_F"] == pytest.approx(0.5047, abs=TOL)
    assert c["pironio_Hmin"] == pytest.approx(0.0437, abs=TOL)
    assert c["local_HBE"] == pytest.approx(0.0852, abs=TOL)


def test_june_public_run_does_not_clear_two_at_delta(june):
    assert june["per_state"]["Psi-"]["S"] == pytest.approx(2.1337, abs=TOL)
    assert june["per_state"]["Psi+"]["S"] == pytest.approx(2.0571, abs=TOL)
    assert june["pooled"]["S"] == pytest.approx(2.0957, abs=TOL)
    assert june["pooled"]["se"] == pytest.approx(0.0340, abs=TOL)
    assert june["S_low"] == pytest.approx(1.9870, abs=TOL)
    assert june["conservative"]["bell_violation"] is False


def test_no_cut_values():
    events = rosenfeld.read_events(paths.ROSENFELD_APRIL)
    minus = rosenfeld.estimate([e for e in events if e[0] == "Psi-"])
    plus = rosenfeld.estimate([e for e in events if e[0] == "Psi+"])
    assert minus["S"] == pytest.approx(2.2462, abs=TOL)
    assert plus["S"] == pytest.approx(2.1977, abs=TOL)


def test_running_s_ends_at_pooled(april):
    last = april["running"][-1]
    assert last["events"] == 10000
    assert last["S"] == pytest.approx(april["pooled"]["S"], abs=1e-12)
