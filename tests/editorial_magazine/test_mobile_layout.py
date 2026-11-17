"""Behavior checks for editorial-magazine edition bootstrapping."""

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "skills/editorial-magazine/scripts/start_layout.py"


def run_start_layout(tmp_path, edition="mobile"):
    output = tmp_path / f"travel-{edition}.html"
    result = subprocess.run(
        [sys.executable, str(SCRIPT), "travel", str(output), "--edition", edition],
        capture_output=True,
        text=True,
        check=False,
    )
    return result, output


def test_mobile_edition_injects_three_by_four_reading_rules(tmp_path):
    result, output = run_start_layout(tmp_path)
    assert result.returncode == 0, result.stderr
    html = output.read_text(encoding="utf-8")
    assert '<style id="mobile-reading">' in html
    assert "--page-height: 1440px" in html
    assert "--page-width, 1080px" in html


def test_classic_edition_keeps_original_scene_layout(tmp_path):
    result, output = run_start_layout(tmp_path, "classic")
    assert result.returncode == 0, result.stderr
    html = output.read_text(encoding="utf-8")
    assert '<style id="mobile-reading">' not in html
    assert "var(--page-height,1920px)" in html


def test_start_layout_never_overwrites_an_existing_draft(tmp_path):
    output = tmp_path / "travel.html"
    output.write_text("keep me", encoding="utf-8")
    result = subprocess.run(
        [sys.executable, str(SCRIPT), "travel", str(output)],
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode != 0
    assert output.read_text(encoding="utf-8") == "keep me"
    assert "already exists" in result.stderr
