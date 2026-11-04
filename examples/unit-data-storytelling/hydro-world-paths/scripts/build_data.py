"""Rebuild the published story's statistics from the included Hydro snapshot."""

import argparse
import csv
import json
from collections import Counter
from pathlib import Path

EXAMPLE = Path(__file__).resolve().parents[1]
ACTIVITIES = (
    "aviate", "place_stairs", "craft_tools", "place_glass",
    "craft_bread", "craft_compass", "craft_bookshelf",
)


def read_rows(path):
    with path.open(encoding="utf-8", newline="") as source:
        return list(csv.DictReader(source))


def relative_to_wings(stages, milestone):
    if milestone not in stages:
        return "absent"
    if stages[milestone] == stages["wings"]:
        raise ValueError(f"The published chart has no lane for simultaneous {milestone} and wings")
    return "before" if stages[milestone] < stages["wings"] else "after"


def build(inputs):
    total = 0
    paths = Counter()
    for row in read_rows(inputs / "paths.csv"):
        accounts = int(row["accounts"])
        total += accounts
        stages = {
            key: index
            for index, stage in enumerate(row["stages"].split(">"))
            for key in stage.split("+") if key != "-"
        }
        if "wings" in stages:
            paths[relative_to_wings(stages, "city"), relative_to_wings(stages, "seed")] += accounts

    wings = sum(paths.values())
    milestones = {r["key"]: int(r["accounts_with_record"]) for r in read_rows(inputs / "milestones.csv")}
    if wings != milestones["wings"]:
        raise ValueError("Weighted path total does not match the wings milestone count")

    rows = {
        r["stat_id"]: r for r in read_rows(inputs / "activities-by-milestone.csv")
        if r["milestone"] == "wings" and r["has_record"] == "1"
    }
    activity = {}
    for key in ACTIVITIES:
        row = rows[key]
        positive = int(row["accounts_with_record"])
        if int(row["accounts"]) != wings or not 0 <= positive <= wings:
            raise ValueError(f"Inconsistent wings-cohort count for {key}")
        activity[key] = {"positive": positive, "amount": int(row["sum_raw"])}
    return {
        "total": total,
        "wings": wings,
        "paths": [[city, seed, count] for (city, seed), count in sorted(paths.items())],
        "activity": activity,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=EXAMPLE / "result/assets/data.js")
    args = parser.parse_args()
    payload = json.dumps(build(EXAMPLE / "inputs"), separators=(",", ":"))
    args.output.write_text(f"window.HYDRO = {payload};\n", encoding="utf-8")
