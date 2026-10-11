"""Rebuild full run reports from captured counts and write data/recorded_runs.json.

Usage: python scripts/record_runs.py

Inputs are the files in results/qollab/ (and results/local/): runs captured from the Qollab run
console (the app's own JSON export, reduced to the per-setting counts and run metadata). The
analysis is recomputed here with the same bellkit code the app runs, so a recorded run and a
live run are analysed identically. The output is what the "Backends & circuits" view shows
next to the runs of the current session.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from bellkit import app, config  # noqa: E402
from bellkit.stats import Table  # noqa: E402

SOURCES = sorted(
    [*(ROOT / "results" / "qollab").glob("*.json"), *(ROOT / "results" / "local").glob("*.json")]
)


def captured_utc(path: Path) -> str:
    m = re.search(r"_(\d{8}T\d{4}Z)\.json$", path.name)
    return m.group(1) if m else ""


def rebuild(run: dict, origin: dict) -> dict:
    cfg = config.load()
    exp = app.parse_request(run["request"], cfg)
    tables = {k: Table(*v) for k, v in run["tables"].items()}
    selection = run.get("selection") or {k: {"kept": t.total, "total": t.total} for k, t in tables.items()}
    profile = config.resolve_profile(cfg, run["backend"], run.get("backend_type", ""))
    meta = {
        "backend": {"name": run["backend"], "profile": profile["id"], "profile_label": profile["label"]},
        "layout": run["layout"],
        "shots": run["shots"],
        "seed": run["request"].get("seed", cfg["seed"]) if profile.get("seed_option") else None,
        "seconds": run["seconds"],
        "canary_fraction": run["canary"],
        "circuits": {
            "logical": [],
            "compiled": [
                {
                    "num_qubits": c["q"],
                    "depth": c["d"],
                    "two_qubit_gates": c["tq"],
                    "name": "",
                    "ops": c.get("ops", {}),
                }
                for c in run["compiled"]
            ],
        },
    }
    report = app.build_report(cfg, run["request"], exp, tables, selection, meta)
    report["origin"] = origin
    if run.get("S"):
        report["origin"]["S_as_reported_by_the_app"] = run["S"][0]
    return report


def main() -> int:
    runs = []
    for path in SOURCES:
        data = json.loads(path.read_text(encoding="utf-8"))
        items = data.get("runs", [data])
        if not all("request" in item for item in items):
            print(f"  skipped {path.name}: a note, not captured counts")
            continue
        for item in items:
            origin = {
                "where": "Qollab" if path.parent.name == "qollab" else "local",
                "device_label": data.get("qollab_backend_label", item["backend"]),
                "captured_utc": captured_utc(path),
                "source_file": path.relative_to(ROOT).as_posix(),
            }
            rep = rebuild(item, origin)
            reported = rep["origin"].get("S_as_reported_by_the_app")
            if reported is not None and abs(reported - rep["analysis"]["S"]["point"]) > 1e-9:
                raise SystemExit(f"{path.name}: recomputed S differs from the app's value")
            runs.append(rep)
    out = {
        "schema_version": 1,
        "note": (
            "Runs recorded on Qollab and locally; analysis recomputed from the captured counts "
            "by scripts/record_runs.py."
        ),
        "runs": runs,
    }
    (ROOT / "data" / "recorded_runs.json").write_text(json.dumps(out, indent=1) + "\n", encoding="utf-8")
    print(f"{len(runs)} runs -> data/recorded_runs.json")
    for r in runs:
        label = r["origin"]["device_label"][:40]
        print(f"  {label:40s} {r['experiment']['module']:6s} S={r['analysis']['S']['point']:.3f}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
