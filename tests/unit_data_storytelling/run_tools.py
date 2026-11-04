"""Maintenance-only preparation, integrity check and first-draft archive. Standard library only."""

import argparse
import hashlib
import json
import shutil
import tempfile
from datetime import datetime, timezone
from pathlib import Path


def digest(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def inventory(root):
    if root.is_symlink() or not root.is_dir():
        raise ValueError(f"Expected a real directory: {root}")
    result = []
    for path in sorted(root.rglob("*")):
        if path.is_symlink():
            raise ValueError(f"Snapshot cannot contain symlinks: {path}")
        if path.is_file():
            result.append({"path": path.relative_to(root).as_posix(),
                           "bytes": path.stat().st_size, "sha256": digest(path)})
        elif not path.is_dir():
            raise ValueError(f"Snapshot cannot contain special files: {path}")
    return result


def new_destination(path, sources):
    path = Path(path).absolute()
    if path.exists() or path.is_symlink():
        raise ValueError(f"Destination already exists: {path}")
    path = path.resolve()
    if any(path.is_relative_to(source) or source.is_relative_to(path) for source in sources):
        raise ValueError(f"Destination overlaps a source: {path}")
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def write_json(path, data):
    with path.open("x", encoding="utf-8") as stream:
        json.dump(data, stream, ensure_ascii=False, indent=2)
        stream.write("\n")


def prepare(case, skill, bundle, receipt):
    case, skill = Path(case).resolve(strict=True), Path(skill).resolve(strict=True)
    task, inputs = case / "prompt.md", case / "inputs"
    if not task.is_file() or task.is_symlink() or not (skill / "SKILL.md").is_file():
        raise ValueError("Prepare requires case/prompt.md, case/inputs/ and skill/SKILL.md")
    task_hash, input_files, skill_files = digest(task), inventory(inputs), inventory(skill)
    bundle = new_destination(bundle, [case, skill])
    receipt = new_destination(receipt, [case, skill, bundle])
    with tempfile.TemporaryDirectory(prefix=".unit-inputs-", dir=bundle.parent) as temporary:
        snapshot = Path(temporary) / "bundle"
        snapshot.mkdir()
        shutil.copy2(task, snapshot / "TASK.md")
        shutil.copytree(inputs, snapshot / "inputs")
        shutil.copytree(skill, snapshot / "skill")
        if (digest(snapshot / "TASK.md") != task_hash or inventory(snapshot / "inputs") != input_files
                or inventory(snapshot / "skill") != skill_files):
            raise ValueError("Sources changed while preparing the bundle; retry from a stable source")
        manifest = {"case": case.name, "frozen_at": datetime.now(timezone.utc).isoformat(),
                    "files": inventory(snapshot)}
        write_json(snapshot / "RUN-INPUTS.json", manifest)
        pin = digest(snapshot / "RUN-INPUTS.json")
        if bundle.exists():
            raise ValueError(f"Destination appeared during preparation: {bundle}")
        snapshot.rename(bundle)
    write_json(receipt, {"bundle": str(bundle), "manifest_sha256": pin})
    return {"bundle": str(bundle), "receipt": str(receipt), "files": len(manifest["files"])}


def verify(bundle, receipt):
    bundle, receipt = Path(bundle).resolve(strict=True), Path(receipt).resolve(strict=True)
    expected = json.loads(receipt.read_text(encoding="utf-8"))
    manifest_path = bundle / "RUN-INPUTS.json"
    if manifest_path.is_symlink() or digest(manifest_path) != expected["manifest_sha256"]:
        raise ValueError("Frozen manifest changed; compare against the maintenance receipt")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    actual = [entry for entry in inventory(bundle) if entry["path"] != "RUN-INPUTS.json"]
    if actual != sorted(manifest["files"], key=lambda entry: entry["path"]):
        raise ValueError("Frozen input files changed, were added or removed")
    return {"bundle": str(bundle), "files": len(actual), "status": "inputs-unchanged"}


def archive(bundle, receipt, artifact, destination):
    verify(bundle, receipt)
    bundle, artifact = Path(bundle).resolve(strict=True), Path(artifact).resolve(strict=True)
    if artifact.is_relative_to(bundle) or bundle.is_relative_to(artifact):
        raise ValueError("Archive the delivered artifact directory separately from the frozen bundle")
    artifact_files = inventory(artifact)
    destination = new_destination(destination, [bundle, artifact, Path(receipt).resolve(strict=True)])
    with tempfile.TemporaryDirectory(prefix=".unit-archive-", dir=destination.parent) as temporary:
        snapshot = Path(temporary) / "archive"
        snapshot.mkdir()
        shutil.copytree(bundle, snapshot / "input-bundle")
        shutil.copytree(artifact, snapshot / "artifact")
        shutil.copy2(receipt, snapshot / "INPUT-RECEIPT.json")
        verify(snapshot / "input-bundle", snapshot / "INPUT-RECEIPT.json")
        if inventory(snapshot / "artifact") != artifact_files:
            raise ValueError("Artifact changed while archiving; retry after the author has stopped")
        write_json(snapshot / "ARCHIVE.json", {"archived_at": datetime.now(timezone.utc).isoformat(),
                   "artifact_files": artifact_files, "scope": "File snapshot only; no quality verdict"})
        if destination.exists():
            raise ValueError(f"Archive destination appeared: {destination}")
        snapshot.rename(destination)
    return {"archive": str(destination), "artifact_files": len(artifact_files)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    prepare_parser = commands.add_parser("prepare", help="Copy task, inputs and skill before dispatch")
    for name in ("case", "skill", "bundle"):
        prepare_parser.add_argument(name, type=Path)
    prepare_parser.add_argument("--receipt", type=Path, required=True, help="Maintenance receipt outside creator inputs")
    for name in ("verify", "archive"):
        command = commands.add_parser(name)
        command.add_argument("bundle", type=Path)
        command.add_argument("--receipt", type=Path, required=True)
        if name == "archive":
            command.add_argument("artifact", type=Path, help="Delivered output directory, not the whole workspace")
            command.add_argument("destination", type=Path)
    args = vars(parser.parse_args())
    operation = {"prepare": prepare, "verify": verify, "archive": archive}[args.pop("command")]
    try:
        print(json.dumps(operation(**args), ensure_ascii=False, indent=2))
    except (OSError, ValueError, KeyError, TypeError) as exc:
        parser.exit(1, f"Run management failed: {exc}\n")


if __name__ == "__main__":
    main()
