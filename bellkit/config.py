"""Load and validate ``config/defaults.json``, the single source of default values."""

from __future__ import annotations

import json
from functools import lru_cache

from bellkit import paths


class ConfigError(ValueError):
    """Raised when the configuration file is inconsistent."""


@lru_cache(maxsize=1)
def load() -> dict:
    with open(paths.DEFAULTS, encoding="utf-8") as fh:
        cfg = json.load(fh)
    validate(cfg)
    return cfg


def validate(cfg: dict) -> None:
    ids = [s["id"] for s in cfg["settings"]]
    if len(ids) != len(set(ids)):
        raise ConfigError("setting ids must be unique")
    chsh = [s for s in cfg["settings"] if "chsh" in s["roles"]]
    if len(chsh) != 4:
        raise ConfigError("exactly four CHSH settings are required")
    signs = [s["chsh_sign"] for s in chsh]
    if sorted(signs) != [-1, 1, 1, 1]:
        raise ConfigError("CHSH signs must be (+1, +1, +1, -1)")
    for role in ("key", "bbm92_z", "bbm92_x"):
        if not any(role in s["roles"] for s in cfg["settings"]):
            raise ConfigError(f"missing setting with role {role!r}")
    for setting in cfg["settings"]:
        if (
            setting["alice"] not in cfg["angles_deg"]["alice"]
            or setting["bob"] not in cfg["angles_deg"]["bob"]
        ):
            raise ConfigError(f"setting {setting['id']} refers to an unknown angle")
    for section in (cfg["channels"]["strength"], cfg["eve"]["phi_deg"], cfg["chain"]["hops"]):
        if not section["min"] <= section["default"] <= section["max"]:
            raise ConfigError(f"default outside its range: {section}")
    profile_ids = [p["id"] for p in cfg["profiles"]] + [cfg["default_profile"]["id"]]
    if len(profile_ids) != len(set(profile_ids)):
        raise ConfigError("profile ids must be unique")
    if not 0 < cfg["confidence"]["delta"] < 1:
        raise ConfigError("delta must lie in (0, 1)")


def settings(cfg: dict) -> list[dict]:
    """The fixed measurement settings with their angles resolved (degrees)."""
    alice = cfg["angles_deg"]["alice"]
    bob = cfg["angles_deg"]["bob"]
    return [
        {**s, "alice_deg": float(alice[s["alice"]]), "bob_deg": float(bob[s["bob"]]), "bob_basis": s["bob"]}
        for s in cfg["settings"]
    ]


def resolve_profile(cfg: dict, backend_name: str, backend_type: str = "") -> dict:
    """Pick the first profile (in file order) whose match pattern occurs in the backend name.

    Profiles are listed most specific first: a local IBM noise model is named
    ``aer_simulator_from(fake_fez)`` and must hit the IBM profile before the ideal one. The
    backend's class name is matched too: Qollab's Braket local simulator is named "default"
    (class BraketLocalBackend).

    An unrecognised backend gets the explicit, conservative ``default_profile``; the UI
    names it so that the choice is visible.
    """
    name = f"{backend_name or ''} {backend_type or ''}".lower()
    for profile in cfg["profiles"]:
        if any(pattern in name for pattern in profile["match"]):
            return profile
    return cfg["default_profile"]
