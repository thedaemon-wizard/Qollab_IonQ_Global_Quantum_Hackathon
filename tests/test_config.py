"""config/defaults.json is the single source of defaults; validation catches inconsistencies."""

import copy

import pytest

from bellkit import config


@pytest.fixture
def cfg():
    return copy.deepcopy(config.load())


def test_defaults_validate(cfg):
    config.validate(cfg)


@pytest.mark.parametrize(
    ("name", "expected"),
    [
        ("basic_simulator", "ideal"),
        ("aer_simulator_from(fake_fez)", "ibm_noise"),
        ("fake_fez", "ibm_noise"),
        ("ionq_simulator", "ionq_sim"),
        ("ionq_qpu.forte-1", "qpu"),
        ("braket_local_simulator", "braket"),
        ("something_new", None),
    ],
)
def test_profile_resolution(cfg, name, expected):
    profile = config.resolve_profile(cfg, name)
    assert profile["id"] == (expected or cfg["default_profile"]["id"])


def test_qpu_profile_refuses(cfg):
    assert config.resolve_profile(cfg, "ionq_qpu")["refuse"] is True


def test_chsh_sign_change_is_rejected(cfg):
    next(s for s in cfg["settings"] if s["id"] == "c11")["chsh_sign"] = 1
    with pytest.raises(config.ConfigError):
        config.validate(cfg)


def test_default_outside_range_is_rejected(cfg):
    cfg["channels"]["strength"]["default"] = 0.9
    with pytest.raises(config.ConfigError):
        config.validate(cfg)


def test_unknown_angle_is_rejected(cfg):
    cfg["settings"][0]["alice"] = "nowhere"
    with pytest.raises(config.ConfigError):
        config.validate(cfg)


def test_settings_resolve_angles(cfg):
    by_id = {s["id"]: s for s in config.settings(cfg)}
    assert by_id["c00"]["alice_deg"] == 45.0
    assert by_id["c11"]["alice_deg"] == -45.0
    assert by_id["x_x"]["bob_basis"] == "x"
