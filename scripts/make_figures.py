"""Draw the README figures from the recorded runs and the open data.

Usage: python scripts/make_figures.py   (writes docs/img/*.png)

Every number comes from bellkit (the same code the app runs) or from data/*.json, so the
figures and the app cannot disagree.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from bellkit import app, bounds  # noqa: E402

OUT = ROOT / "docs" / "img"
C = ["#0072B2", "#E69F00", "#009E73", "#CC79A7", "#D55E00", "#56B4E9"]
M = ["o", "s", "^", "D", "v", "P"]
plt.rcParams.update(
    {"font.size": 10, "axes.spines.top": False, "axes.spines.right": False, "figure.dpi": 150}
)


def recorded() -> list[dict]:
    return json.loads((ROOT / "data" / "recorded_runs.json").read_text(encoding="utf-8"))["runs"]


def short_name(label: str) -> str:
    for key, short in (
        ("BasicSimulator", "Local ideal"),
        ("Braket", "Braket local"),
        ("Aria 1", "IonQ Aria 1"),
        ("Forte 1", "IonQ Forte 1"),
        ("Fez", "IBM Fez"),
    ):
        if key in label:
            return short
    return label.split(",")[0]


def backends_figure() -> None:
    runs = [
        r
        for r in recorded()
        if r["experiment"]["module"] == "bell"
        and (r["request"].get("channel") or {}).get("kind") == "depolarizing"
        and abs(r["request"]["channel"]["strength"] - 0.05) < 1e-9
        and r["experiment"]["eve_phi_deg"] is None
    ]
    runs += [r for r in recorded() if r["experiment"]["module"] == "chain"]
    fig, ax = plt.subplots(figsize=(8.4, 4.0))
    labels = []
    for i, r in enumerate(runs):
        a = r["analysis"]["S"]
        lab = short_name(r["origin"]["device_label"])
        if r["experiment"]["module"] == "chain":
            ch = r["request"].get("channel") or {}
            noise = (
                "no added noise" if ch.get("kind", "none") == "none" else f"{100 * ch['strength']:.0f}% dep."
            )
            lab += f"\n{r['experiment']['hops']}-link swap\n{noise}"
        else:
            lab += "\nBell test\n5% dep."
        labels.append(lab)
        ax.errorbar(
            i,
            a["point"],
            yerr=[[a["point"] - a["low"]], [a["high"] - a["point"]]],
            fmt=M[i % len(M)],
            color=C[i % len(C)],
            capsize=4,
            ms=7,
            label=None,
        )
        ax.plot(i + 0.18, r["prediction"]["S_fixed"], marker="_", ms=16, mew=2.2, color="#555555")
    ax.axhline(2, color="#888888", ls="--", lw=1)
    ax.text(len(runs) - 0.5, 2.01, "local bound S = 2", ha="right", va="bottom", fontsize=8, color="#555555")
    ax.axhline(2 * 2**0.5, color="#888888", ls=":", lw=1)
    ax.text(len(runs) - 0.5, 2.835, "2√2", ha="right", va="bottom", fontsize=8, color="#555555")
    ax.set_xticks(range(len(runs)), labels, fontsize=8)
    ax.set_ylabel("CHSH value S")
    ax.set_ylim(1.8, 3.05)
    ax.set_title(
        "Runs on Qollab's simulators: S with 95% Hoeffding interval\n"
        "(grey bar: exact prediction without device noise)",
        fontsize=10,
    )
    fig.tight_layout()
    fig.savefig(OUT / "backends.png")
    plt.close(fig)


def rates_figure() -> None:
    th = bounds.thresholds()
    exp = json.loads(app.experiments_json())
    fig, ax = plt.subplots(figsize=(7.2, 3.8))
    curve = exp["di_zero_curve"]
    ax.plot(
        [p["Q"] for p in curve],
        [p["S"] for p in curve],
        color=C[2],
        lw=2,
        label="DI key rate = 0 (Acín et al. 2007)",
    )
    ax.plot([0, 0.1], [2 * 2**0.5, 2 * 2**0.5 * 0.8], color="#777777", ls="--", lw=1.2, label="Werner states")
    pts = [p for p in exp["points"] if p["Q"] is not None]
    for i, p in enumerate(pts):
        ax.errorbar(
            p["Q"],
            p["S"],
            xerr=p["Q_err"],
            yerr=p["S_err"],
            fmt=M[i % len(M)],
            color=C[i % len(C)],
            capsize=3,
            ms=6,
            label=p["label"],
        )
    for r in recorded():
        if (
            r["experiment"]["module"] == "bell"
            and r["experiment"]["eve_phi_deg"] is None
            and r["analysis"]["S"]["point"] > 2.3
        ):
            a = r["analysis"]
            ax.plot(a["Q_Z"]["point"], a["S"]["point"], marker="x", color="#333333", ms=6, ls="none")
    ax.plot(
        [], [], marker="x", color="#333333", ls="none", label="this lab's simulator runs (point estimates)"
    )
    ax.set_xlim(0, 0.1)
    ax.set_ylim(2.3, 2.9)
    ax.set_xlabel("QBER in the key basis")
    ax.set_ylabel("CHSH value S")
    ax.xaxis.set_major_formatter(matplotlib.ticker.PercentFormatter(1.0, decimals=0))
    ax.axvline(th["acin"]["Q_werner"], color=C[2], ls=":", lw=1)
    ax.legend(fontsize=7, loc="lower left", frameon=False)
    ax.set_title("Published DI-QKD experiments and the asymptotic DI-key boundary", fontsize=10)
    fig.tight_layout()
    fig.savefig(OUT / "di_boundary.png")
    plt.close(fig)


def rosenfeld_figure() -> None:
    data = json.loads(app.rosenfeld_json())
    fig, ax = plt.subplots(figsize=(7.2, 3.4))
    for i, r in enumerate(data["runs"]):
        xs = [p["events"] for p in r["running"]]
        ys = [p["S"] for p in r["running"]]
        ax.plot(
            xs,
            ys,
            color=C[i],
            lw=1.8,
            ls="-" if i == 0 else "--",
            label=f"{r['label']}: S = {r['pooled']['S']:.3f} ± {r['pooled']['se']:.3f}",
        )
        ax.axhspan(r["S_low"], r["pooled"]["S"] + r["hoeffding_halfwidth"], color=C[i], alpha=0.12)
    ax.axhline(2, color="#888888", ls="--", lw=1)
    ax.set_ylim(1.6, 2.9)
    ax.set_xlabel("events used (first 5,000 per heralded state)")
    ax.set_ylabel("running CHSH value S")
    ax.legend(fontsize=8, frameon=False, loc="upper right")
    ax.set_title(
        "Munich 2017 event-ready Bell test, re-analysed (bands: 95% Hoeffding interval)", fontsize=10
    )
    fig.tight_layout()
    fig.savefig(OUT / "rosenfeld.png")
    plt.close(fig)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    backends_figure()
    rates_figure()
    rosenfeld_figure()
    print("wrote", ", ".join(p.name for p in sorted(OUT.glob("*.png"))))


if __name__ == "__main__":
    main()
