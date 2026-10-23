import importlib.util
import json
import shutil
import subprocess
import sys
from pathlib import Path
from types import SimpleNamespace

import pytest

ROOT = Path(__file__).resolve().parents[1]


@pytest.fixture
def smoke(monkeypatch):
    monkeypatch.syspath_prepend(str(ROOT / "tests/browser/scripts"))
    spec = importlib.util.spec_from_file_location("smoke_runner", ROOT / "tests/browser/scripts/smoke.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@pytest.fixture
def catalog(tmp_path):
    directory = tmp_path / "chart-storytelling/custom-story"
    shutil.copytree(ROOT / "tests/browser/cases/chart-storytelling/story-html", directory)
    return tmp_path, directory


def test_new_case_directory_is_discovered_without_a_runner_allowlist(smoke, catalog):
    root, _ = catalog
    assert [(case["skill"], case["id"]) for case in smoke.load_cases(root)] == [
        ("chart-storytelling", "custom-story")
    ]


def test_explicit_case_selection_stays_within_selected_skill(smoke):
    with pytest.raises(ValueError, match="Unknown smoke cases"):
        smoke.select_cases(smoke.load_cases(), "chart-storytelling", ["removed-chart"])


def test_poster_cases_cover_native_html_only_and_failure(smoke):
    cases = smoke.select_cases(smoke.load_cases(), "person-poster", None)
    assert {case["id"] for case in cases} == {
        "poster-chart-matrix", "poster-html-only", "poster-render-failure",
        "poster-no-charts-png", "poster-charts-html-only", "poster-ancestor-clipping",
    }
    assert all(case["expectations"]["engine"] == "poster" for case in cases)


@pytest.mark.parametrize('field,value', [('pngExpected', 'false'), ('reviewFailureContains', 'error'),
                                        ('reviewFailureContains', [None])])
def test_invalid_poster_expectation_rejected(smoke, tmp_path, field, value):
    directory = tmp_path / 'person-poster/custom'
    shutil.copytree(ROOT / 'tests/browser/cases/person-poster/poster-html-only', directory)
    path = directory / 'expectations.json'
    expected = json.loads(path.read_text())
    expected[field] = value
    path.write_text(json.dumps(expected))
    with pytest.raises(ValueError, match=field):
        smoke.load_cases(tmp_path)


def test_poster_production_failure_is_not_reported_as_success(smoke, tmp_path, monkeypatch):
    case = smoke.select_cases(smoke.load_cases(), "person-poster", ["poster-html-only"])[0]
    monkeypatch.setattr(smoke, "build_poster", lambda *args: None)
    monkeypatch.setattr(smoke.subprocess, "run", lambda *args, **kwargs:
                        SimpleNamespace(returncode=0, stdout="browser passed", stderr=""))

    def failed_pipeline(*args):
        raise RuntimeError("PNG export failed")

    monkeypatch.setattr(smoke, "check_production_pipeline", failed_pipeline)
    result = smoke.run_case(case, tmp_path / "evidence")
    assert result["passed"] is False
    assert "PNG export failed" in (tmp_path / "evidence/poster-html-only/failure.log").read_text()


@pytest.mark.parametrize(
    "field, value, message",
    [
        ("body", "../outside.html", "simple filename"),
        ("target", "pdf", "Unsupported story target"),
        ("preset", "", "Missing story preset"),
    ],
)
def test_invalid_case_config_fails_before_browser_execution(smoke, catalog, field, value, message):
    root, directory = catalog
    path = directory / "config.json"
    config = json.loads(path.read_text())
    path.write_text(json.dumps({**config, field: value}))
    with pytest.raises(ValueError, match=message):
        smoke.load_cases(root)


def test_mismatched_acceptance_engine_is_rejected(smoke, catalog):
    root, directory = catalog
    path = directory / "expectations.json"
    expected = json.loads(path.read_text())
    path.write_text(json.dumps({**expected, "engine": "unsupported"}))
    with pytest.raises(ValueError, match="engine does not match Skill"):
        smoke.load_cases(root)


def test_nested_input_directories_fail_instead_of_being_silently_skipped(smoke, catalog):
    root, directory = catalog
    (directory / "inputs/nested").mkdir()
    with pytest.raises(ValueError, match="must be flat files"):
        smoke.load_cases(root)


def test_preparation_copies_owned_inputs_and_keeps_acceptance_outside_skill_workspace(
    smoke, catalog
):
    root, directory = catalog
    case = smoke.load_cases(root)[0]
    destination = root / "evidence"
    workspace = smoke.prepare_case(case, destination)
    assert (workspace / "inputs/plan.md").read_bytes() == (
        directory / "inputs/plan.md"
    ).read_bytes()
    assert (workspace / ".agents/skills/chart-storytelling/SKILL.md").is_file()
    assert not list(workspace.rglob("expectations.json"))
    assert json.loads((destination / "expectations.json").read_text()) == case["expectations"]


@pytest.mark.parametrize("step", ["generate", "browser"])
def test_failed_step_keeps_its_log_and_case_failure(smoke, catalog, monkeypatch, step):
    root, _ = catalog
    case = smoke.load_cases(root)[0]

    def build(workspace, config):
        if step == "generate":
            (workspace.parent / "generate.log").write_text("fixture failure")
            raise RuntimeError("fixture failure")

    monkeypatch.setattr(smoke, "build_story", build)
    monkeypatch.setattr(
        smoke.subprocess,
        "run",
        lambda *args, **kwargs: SimpleNamespace(returncode=1, stdout="", stderr="fixture failure"),
    )
    output = root / "evidence"
    assert smoke.run_case(case, output) == {"case": "custom-story", "passed": False}
    assert "fixture failure" in (output / "custom-story" / f"{step}.log").read_text()


@pytest.mark.parametrize("step", ["generate", "browser"])
def test_timeout_preserves_partial_step_output_and_case_failure(smoke, catalog, monkeypatch, step):
    root, _ = catalog
    case = smoke.load_cases(root)[0]

    def timeout(*args, **kwargs):
        raise subprocess.TimeoutExpired(
            "fixture", 120, output=b"partial output", stderr="partial error"
        )

    monkeypatch.setattr(smoke, "build_story", timeout if step == "generate" else lambda *args: None)
    monkeypatch.setattr(smoke.subprocess, "run", timeout)
    output = root / "evidence"
    assert smoke.run_case(case, output) == {"case": "custom-story", "passed": False}
    log = (output / "custom-story" / f"{step}.log").read_text()
    assert "partial output" in log and "partial error" in log and "timed out" in log


def test_list_needs_no_browser_or_credentials_and_creates_no_evidence(tmp_path):
    output = tmp_path / "evidence"
    result = subprocess.run(
        [
            sys.executable,
            str(ROOT / "tests/browser/scripts/smoke.py"),
            "--skill",
            "chart-storytelling",
            "--list",
            "--output-dir",
            str(output),
        ],
        capture_output=True,
        text=True,
        check=True,
    )
    assert {line.split()[0] for line in result.stdout.splitlines()} == {"story-html", "story-ppt"}
    assert not output.exists()
