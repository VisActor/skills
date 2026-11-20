"""Check installation in an unrelated directory without the source checkout."""

import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def test_copied_skill_checks_examples_and_imports_runtime(tmp_path):
    installed = tmp_path / "creative story skill"
    shutil.copytree(ROOT / "skills/creative-data-storytelling", installed)
    for entry in ("assets/examples/index.html", "assets/stage-wiring/index.html"):
        audit = subprocess.run(
            [
                sys.executable,
                str(installed / "scripts/preview.py"),
                "audit",
                str(installed),
                "--entry",
                entry,
            ],
            cwd=tmp_path,
            capture_output=True,
            text=True,
            check=True,
        )
        assert json.loads(audit.stdout)["errors"] == []
    result = subprocess.run(
        [
            "node",
            "--input-type=module",
            "-e",
            """
import { readdir } from 'node:fs/promises';
for (const name of await readdir('./assets/runtime')) {
  if (name.endsWith('.mjs')) await import('./assets/runtime/' + name);
}
const { createValueFormat } = await import('./assets/runtime/format.mjs');
console.log(createValueFormat({ unit: 'cm', digits: 1 }).format(12.5));
""",
        ],
        cwd=installed,
        capture_output=True,
        text=True,
        check=True,
    )
    assert result.stdout.strip() == "12.5 cm"
