"""Snapshot integrity and preservation contracts, independent of any story fixture."""

import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

SPEC = importlib.util.spec_from_file_location("run_tools", Path(__file__).with_name("run_tools.py"))
run_tools = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(run_tools)


class RunToolsTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.case, self.skill = self.root / "case", self.root / "skill"
        self.bundle, self.receipt = self.root / "workspace/input-bundle", self.root / "maintenance/receipt.json"
        (self.case / "inputs").mkdir(parents=True)
        self.skill.mkdir()
        (self.case / "prompt.md").write_text("A user task")
        (self.case / "inputs/data.csv").write_text("id,value\na,3\n")
        (self.case / "review.md").write_text("Private maintenance notes")
        (self.skill / "SKILL.md").write_text("Runtime guidance")

    def prepare(self):
        return run_tools.prepare(self.case, self.skill, self.bundle, self.receipt)

    def test_prepares_only_creator_inputs_without_modifying_sources(self):
        before = run_tools.inventory(self.case)
        self.prepare()
        self.assertEqual(run_tools.inventory(self.case), before)
        self.assertEqual(sorted(p.name for p in self.bundle.iterdir()),
                         ["RUN-INPUTS.json", "TASK.md", "inputs", "skill"])
        self.assertEqual(run_tools.verify(self.bundle, self.receipt)["files"], 3)

    def test_changed_input_blocks_archive_before_creating_output(self):
        self.prepare()
        (self.bundle / "inputs/data.csv").write_text("changed")
        artifact = self.root / "dist"
        artifact.mkdir()
        destination = self.root / "archive"
        with self.assertRaisesRegex(ValueError, "input files changed"):
            run_tools.archive(self.bundle, self.receipt, artifact, destination)
        self.assertFalse(destination.exists())

    def test_changed_manifest_cannot_hide_changed_input(self):
        self.prepare()
        (self.bundle / "inputs/data.csv").write_text("changed")
        manifest_path = self.bundle / "RUN-INPUTS.json"
        manifest = json.loads(manifest_path.read_text())
        manifest["files"] = [row for row in run_tools.inventory(self.bundle) if row["path"] != "RUN-INPUTS.json"]
        manifest_path.write_text(json.dumps(manifest))
        with self.assertRaisesRegex(ValueError, "manifest changed"):
            run_tools.verify(self.bundle, self.receipt)

    def test_extra_files_are_detected(self):
        self.prepare()
        (self.bundle / "new-analysis.md").write_text("Put research additions outside the frozen bundle")
        with self.assertRaisesRegex(ValueError, "added or removed"):
            run_tools.verify(self.bundle, self.receipt)

    def test_existing_destinations_and_receipts_are_not_overwritten(self):
        self.prepare()
        before = run_tools.inventory(self.bundle)
        with self.assertRaisesRegex(ValueError, "already exists"):
            self.prepare()
        self.assertEqual(run_tools.inventory(self.bundle), before)
        with self.assertRaisesRegex(ValueError, "already exists"):
            run_tools.prepare(self.case, self.skill, self.root / "other", self.receipt)
        self.assertFalse((self.root / "other").exists())

    def test_snapshot_rejects_symlinks_and_overlapping_destinations(self):
        (self.case / "inputs/link").symlink_to(self.skill / "SKILL.md")
        with self.assertRaisesRegex(ValueError, "symlinks"):
            self.prepare()
        (self.case / "inputs/link").unlink()
        with self.assertRaisesRegex(ValueError, "overlaps"):
            run_tools.prepare(self.case, self.skill, self.skill / "bundle", self.receipt)

    def test_archive_preserves_first_draft_and_can_be_verified_after_source_changes(self):
        self.prepare()
        artifact = self.root / "dist"
        artifact.mkdir()
        (artifact / "index.html").write_text("First draft")
        destination = self.root / "archive"
        run_tools.archive(self.bundle, self.receipt, artifact, destination)
        (artifact / "index.html").write_text("Later revision")
        self.assertEqual((destination / "artifact/index.html").read_text(), "First draft")
        self.assertEqual(run_tools.verify(destination / "input-bundle", destination / "INPUT-RECEIPT.json")["status"],
                         "inputs-unchanged")
        with self.assertRaisesRegex(ValueError, "already exists"):
            run_tools.archive(self.bundle, self.receipt, artifact, destination)


if __name__ == "__main__":
    unittest.main()
