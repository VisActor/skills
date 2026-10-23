"""Render per-Skill fixed browser cases through copied Skills, without a model."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import tempfile
from pathlib import Path

from person_poster_smoke import build_poster, check_production_pipeline
from story_smoke import build_story

ROOT = Path(__file__).resolve().parents[3]
SKILLS = sorted(path.parent.name for path in (ROOT / "skills").glob("*/SKILL.md"))
CASES = ROOT / "tests/browser/cases"
ENGINES = {"chart-storytelling": "story", "person-poster": "poster"}


def write_json(path: Path, value) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def filename(value: str) -> str:
    if not isinstance(value, str) or not value or Path(value).name != value or value in {".", ".."}:
        raise ValueError(f"Case file must be a simple filename: {value!r}")
    return value


def load_cases(root: Path = CASES) -> list[dict]:
    cases, ids = [], set()
    for config_path in sorted(root.glob("*/*/config.json")):
        directory = config_path.parent
        skill, case_id = directory.parent.name, directory.name
        if skill not in SKILLS or skill not in ENGINES:
            raise ValueError(f"Smoke case has no supported Skill: {directory}")
        if case_id in ids:
            raise ValueError(f"Duplicate smoke case id: {case_id}")
        ids.add(case_id)
        config = json.loads(config_path.read_text(encoding="utf-8"))
        expected = json.loads((directory / "expectations.json").read_text(encoding="utf-8"))
        if expected["engine"] != ENGINES[skill]:
            raise ValueError(f"Smoke engine does not match Skill: {directory}")
        required = expected.get("requiredChecks", [])
        if not isinstance(required, list) or not all(isinstance(name, str) for name in required):
            raise ValueError(f"requiredChecks must be a list of names: {directory}")
        input_files = sorted((directory / "inputs").iterdir())
        if any(not file.is_file() for file in input_files):
            raise ValueError(f"Smoke inputs must be flat files: {directory / 'inputs'}")
        inputs = {file.name: str(file) for file in input_files}
        if config["builder"] == "story" and skill == "chart-storytelling":
            if config["target"] not in {"html", "ppt"}:
                raise ValueError(f"Unsupported story target: {directory}")
            for name in [
                "plan.md",
                "dataset_map.json",
                "chart_specs.json",
                "page.json",
                filename(config["body"]),
            ]:
                if name not in inputs:
                    raise ValueError(f"Missing story input: {directory / 'inputs' / name}")
            if not config.get("preset"):
                raise ValueError(f"Missing story preset: {directory}")
            if expected.get("deck", False) != (config["target"] == "ppt"):
                raise ValueError(f"Deck expectations do not match story target: {directory}")
        elif config["builder"] == "poster" and skill == "person-poster":
            if not isinstance(expected.get('pngExpected'), bool):
                raise ValueError(f'pngExpected must be a boolean: {directory}')
            review_errors = expected.get('reviewFailureContains', [])
            if not isinstance(review_errors, list) or not all(isinstance(item, str) and item for item in review_errors):
                raise ValueError(f'reviewFailureContains must be an array of nonempty strings: {directory}')
            if (review_errors and expected.get('renderFailure')) or (
                (review_errors or expected.get('renderFailure')) and expected['pngExpected']
            ):
                raise ValueError(f'Conflicting poster failure expectations: {directory}')
            for name in ["bundle.json", "page.html"]:
                if name not in inputs:
                    raise ValueError(f"Missing poster input: {directory / 'inputs' / name}")
        else:
            raise ValueError(f"Unsupported builder for Skill: {directory}")
        filename(expected["html"])
        cases.append(
            {
                "id": case_id,
                "skill": skill,
                "directory": directory,
                "config": config,
                "expectations": expected,
                "inputs": list(inputs),
                "inputSources": inputs,
            }
        )
    if not cases:
        raise ValueError(f"No browser smoke cases found in {root}")
    return cases


def select_cases(cases: list[dict], skill: str | None, ids: list[str] | None) -> list[dict]:
    selected = [case for case in cases if not skill or case["skill"] == skill]
    if ids:
        unknown = set(ids) - {case["id"] for case in selected}
        if unknown:
            raise ValueError(f"Unknown smoke cases for selected Skill(s): {sorted(unknown)}")
        selected = [case for case in selected if case["id"] in ids]
    if not selected:
        raise ValueError("No browser smoke cases match the selection")
    return selected


def prepare_case(case: dict, directory: Path) -> Path:
    task = {key: case[key] for key in ["id", "skill", "inputs", "inputSources"]}
    workspace = directory / "workspace"
    shutil.copytree(
        ROOT / "skills" / case["skill"],
        workspace / ".agents/skills" / case["skill"],
        ignore=shutil.ignore_patterns("__pycache__", "*.pyc", "out"),
    )
    (workspace / "inputs").mkdir()
    (workspace / "outputs").mkdir()
    for name, source in case["inputSources"].items():
        shutil.copy2(source, workspace / "inputs" / name)
    write_json(directory / "metadata.json", {"task": task, "runner": "fixed-browser-smoke"})
    write_json(directory / "config.json", case["config"])
    write_json(directory / "expectations.json", case["expectations"])
    return workspace


def run_case(case: dict, output: Path) -> dict:
    directory = output / case["id"]
    workspace = prepare_case(case, directory)
    step = "generate"
    try:
        if case["skill"] == "person-poster":
            build_poster(case, workspace)
        else:
            build_story(workspace, case["config"])
        step = "browser"
        result = subprocess.run(
            [
                "node",
                str(ROOT / "tests/browser/scripts" / ("check-poster.mjs" if case["skill"] == "person-poster" else "check-browser.mjs")),
                str(directory),
                "--local-assets",
            ],
            capture_output=True,
            text=True,
            timeout=120,
        )
        (directory / "browser.log").write_text(result.stdout + result.stderr)
        passed = result.returncode == 0
        if passed and case["skill"] == "person-poster":
            step = "production"
            check_production_pipeline(workspace, case["expectations"])
    except (OSError, ValueError, RuntimeError, subprocess.TimeoutExpired) as error:
        if isinstance(error, (OSError, subprocess.TimeoutExpired)):
            partial = ""
            if isinstance(error, subprocess.TimeoutExpired):
                for stream in [error.stdout, error.stderr]:
                    partial += (
                        stream.decode("utf-8", errors="replace")
                        if isinstance(stream, bytes)
                        else stream or ""
                    )
            (directory / f"{step}.log").write_text(partial + "\n" + str(error))
        (directory / "failure.log").write_text(str(error))
        passed = False
    print(f"{case['id']}: {'passed' if passed else 'failed'} ({directory})", flush=True)
    return {"case": case["id"], "passed": passed}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--skill", choices=SKILLS)
    parser.add_argument("--case", action="append", dest="cases")
    parser.add_argument("--list", action="store_true", help="List cases without running a browser")
    parser.add_argument("--output-dir", type=Path, help="New evidence directory; must not exist")
    args = parser.parse_args()
    cases = select_cases(load_cases(), args.skill, args.cases)
    if args.list:
        for case in cases:
            print(f"{case['id']}\t{case['skill']}")
        return
    if args.output_dir:
        output = args.output_dir.resolve()
        output.mkdir(parents=True, exist_ok=False)
    else:
        (ROOT / ".cache").mkdir(exist_ok=True)
        output = Path(tempfile.mkdtemp(prefix="browser-smoke-", dir=ROOT / ".cache"))
    results = [run_case(case, output) for case in cases]
    write_json(output / "summary.json", {"checks": results, "modelCalls": 0})
    print(f"Evidence: {output}")
    raise SystemExit(0 if all(result["passed"] for result in results) else 1)


if __name__ == "__main__":
    main()
