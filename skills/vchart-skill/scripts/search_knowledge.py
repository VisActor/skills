#!/usr/bin/env python3
"""Search bundled VChart examples and diagnostic references without a service or model."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

SKILL_ROOT = Path(__file__).resolve().parents[1]
KINDS = {"example": "examples", "examples": "examples", "sop": "sops", "sops": "sops"}


def terms(text: str) -> set[str]:
    tokens = set(re.findall(r"[a-z0-9_]+", text.lower()))
    for phrase in re.findall(r"[\u4e00-\u9fff]+", text):
        tokens.update(phrase[i : i + 2] for i in range(max(1, len(phrase) - 1)))
    return tokens


def search(root: Path, kind: str, query: str, limit: int) -> list[dict]:
    groups = {"examples": ("examples",), "sops": ("components", "chart", "api")}
    directories = [root / "references" / name for name in groups[kind]]
    for directory in directories:
        if not directory.is_dir():
            raise FileNotFoundError(f"Missing bundled knowledge directory: {directory}")
    query_terms = terms(query)
    matches = []
    for file in sorted(file for directory in directories for file in directory.rglob("*.md")):
        content = file.read_text(encoding="utf-8")
        title = next(
            (line.lstrip("# ") for line in content.splitlines() if line.startswith("#")), file.stem
        )
        score = len(query_terms & terms(content)) + 3 * len(
            query_terms & terms(title + " " + file.stem)
        )
        if score:
            lines = [line for line in content.splitlines() if query_terms & terms(line)]
            matches.append(
                {
                    "path": file.relative_to(root).as_posix(),
                    "title": title,
                    "score": score,
                    "excerpt": "\n".join(lines)[:800],
                }
            )
    return sorted(matches, key=lambda item: (-item["score"], item["path"]))[:limit]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--kind", choices=KINDS, required=True)
    parser.add_argument("--query", required=True)
    parser.add_argument("--limit", type=int, default=3)
    parser.add_argument("--output")
    parser.add_argument("--compact", action="store_true")
    args = parser.parse_args()
    if not terms(args.query):
        parser.error("--query must contain searchable words")
    if args.limit <= 0:
        parser.error("--limit must be positive")
    if args.output is not None and not args.output.strip():
        parser.error("--output must not be empty")
    kind = KINDS[args.kind]
    try:
        result = {
            "kind": kind,
            "query": args.query,
            "results": search(SKILL_ROOT, kind, args.query, args.limit),
        }
        rendered = json.dumps(result, ensure_ascii=False, indent=None if args.compact else 2)
        if args.output:
            output = Path(args.output)
            output.parent.mkdir(parents=True, exist_ok=True)
            output.write_text(rendered + "\n", encoding="utf-8")
        print(rendered)
    except (OSError, UnicodeError) as error:
        parser.exit(1, f"Knowledge search failed: {error}\n")


if __name__ == "__main__":
    main()
