"""Check supplied research data, not narrative/design answers. Run with uv run."""

import argparse
import csv
import datetime as dt
import gzip
import hashlib
import json
import math
import re
from collections import Counter
from pathlib import Path

CASES = Path(__file__).resolve().parents[2] / "cases" / "unit-data-storytelling"


def require(condition, message):
    if not condition:
        raise ValueError(message)


def read_json(path):
    return json.loads(path.read_text())


def read_csv(folder, name):
    return list(iter_csv(folder, name))


def iter_csv(folder, name):
    path = folder / name
    opener = gzip.open if name.endswith(".csv.gz") else open
    with opener(path, "rt", encoding="utf-8", newline="") as stream:
        yield from csv.DictReader(stream)


def unique(rows, keys, label):
    values = [tuple(row[key] for key in keys) for row in rows]
    require(len(values) == len(set(values)), f"{label}: duplicate {keys}")


def check_package(folder):
    manifest = read_json(folder / "manifest.json")
    sources = read_json(folder / "sources.json")
    source_ids = {source["id"] for source in sources}
    require(len(source_ids) == len(sources), f"{folder}: duplicate source ID")
    for source in sources:
        require(source["url"].startswith("https://"), f"Bad source URL: {source}")
        dt.datetime.fromisoformat(source["retrieved_at"])
        require(re.fullmatch(r"[a-f0-9]{64}", source["sha256"]), "Bad raw hash")
    names = {item["path"] for item in manifest["files"]}
    require(
        names == {p.name for p in folder.iterdir() if p.name != "manifest.json"},
        f"{folder}: missing or unregistered input file",
    )
    for item in manifest["files"]:
        path = folder / item["path"]
        require(path.parent == folder, "Manifest paths must remain in input folder")
        require(path.stat().st_size == item["bytes"], f"Input size changed: {path}")
        require(
            hashlib.sha256(path.read_bytes()).hexdigest() == item["sha256"],
            f"Input changed: {path}",
        )
        if not path.name.endswith((".csv", ".csv.gz")):
            continue
        row_count = 0
        for row in iter_csv(folder, path.name):
            row_count += 1
            require(
                None not in row and all(v is not None for v in row.values()),
                f"Malformed CSV: {path}",
            )
            for field, value in row.items():
                if field.endswith("source_id"):
                    require(value in source_ids, f"Unknown source {value}: {path}")
        require(row_count == item["rows"], f"Row count changed: {path}")
    return manifest


def check_hong_kong(folder):
    rows = read_csv(folder, "daily-temperature.csv")
    unique(rows, ["station_id", "date"], "daily temperature")
    start, end = dt.date(1961, 1, 1), dt.date(2025, 12, 31)
    expected = [str(start + dt.timedelta(days=i)) for i in range((end - start).days + 1)]
    require([r["date"] for r in rows] == expected, "Incomplete or unordered calendar")
    for r in rows:
        require(r["station_id"] == "HKO", "Unexpected station")
        low, mean, high = [float(r[key]) for key in ("tmin_c", "tmean_c", "tmax_c")]
        require(all(math.isfinite(v) for v in (low, mean, high)), "Invalid temperature")
        require(low <= mean <= high, f"Temperature order: {r['date']}")
        require(
            all(r[key] == "C" for key in ("tmin_quality", "tmean_quality", "tmax_quality")),
            f"Recheck documented completeness: {r['date']}",
        )
    oni = read_csv(folder, "enso-oni.csv")
    unique(oni, ["year", "season"], "ONI")
    seasons = "DJF JFM FMA MAM AMJ MJJ JJA JAS ASO SON OND NDJ".split()
    require(
        {(int(r["year"]), r["season"]) for r in oni}
        == {(y, s) for y in range(1961, 2026) for s in seasons},
        "ONI windows",
    )
    for r in oni:
        require(int(r["center_month"]) == seasons.index(r["season"]) + 1, "ONI center month")
        require(r["series"] == "ONI_ERSSTv6", "ONI version")
        require(all(math.isfinite(float(r[k])) for k in ("sst_c", "oni_c")), "ONI values")


def check_flights(folder):
    airports = read_csv(folder, "airports.csv")
    unique(airports, ["airport_code"], "Flight airports")
    airport_codes = {r["airport_code"] for r in airports}
    fields = read_csv(folder, "fields.csv")
    unique(fields, ["field"], "Flight field definitions")
    names = {r["field"] for r in fields}
    integer_fields = {r["field"] for r in fields if r["type"] == "integer"}
    clock_fields = {r["field"] for r in fields if r["type"] == "local_time"}
    identities, dates, carriers = set(), set(), set()
    counts = Counter()
    for r in iter_csv(folder, "flight-records.csv.gz"):
        identity = r["flight_id"]
        require(set(r) == names, f"Undocumented flight field: {identity}")
        expected_id = "_".join(
            r[k]
            for k in (
                "FlightDate",
                "Reporting_Airline",
                "Flight_Number_Reporting_Airline",
                "Origin",
                "Dest",
                "CRSDepTime",
            )
        )
        require(
            identity == expected_id and identity not in identities,
            f"Invalid or duplicate flight identity: {identity}",
        )
        identities.add(identity)
        dates.add(dt.date.fromisoformat(r["FlightDate"]))
        carriers.add(r["Reporting_Airline"])
        require(
            r["Origin"] in airport_codes and r["Dest"] in airport_codes,
            f"Unknown flight airport: {identity}",
        )
        for field in integer_fields:
            require(
                not r[field] or re.fullmatch(r"-?\d+", r[field]),
                f"Invalid integer {field}: {identity}",
            )
        for field in clock_fields:
            value = r[field]
            require(
                not value
                or (
                    re.fullmatch(r"\d{4}", value)
                    and (value == "2400" or (int(value[:2]) < 24 and int(value[2:]) < 60))
                ),
                f"Invalid local time {field}: {identity}",
            )
        require(
            r["Cancelled"] in ("0", "1") and r["Diverted"] in ("0", "1"),
            f"Invalid flight status: {identity}",
        )
        require(
            r["CancellationCode"] in ("", "A", "B", "C", "D"),
            f"Unknown cancellation code: {identity}",
        )
        cancelled, diverted = int(r["Cancelled"]), int(r["Diverted"])
        require(not (cancelled and diverted), f"Overlapping flight status: {identity}")
        counts["rows"] += 1
        counts["cancelled"] += cancelled
        counts["diverted"] += diverted
        paired = not (cancelled or diverted) and r["DepDelay"] != "" and r["ArrDelay"] != ""
        require(cancelled or diverted or paired, f"Completed flight lacks delays: {identity}")
        counts["paired"] += int(paired)
        elapsed = [r[k] for k in ("ArrDelay", "DepDelay", "ActualElapsedTime", "CRSElapsedTime")]
        status = "unavailable"
        if all(v != "" for v in elapsed):
            arr, dep, actual, planned = map(int, elapsed)
            status = "consistent" if arr - dep == actual - planned else "inconsistent"
        require(r["elapsed_consistency"] == status, f"Wrong elapsed quality flag: {identity}")
        counts[status] += 1
        if status == "inconsistent":
            require(
                r["FirstDepTime"] and int(r["TotalAddGTime"] or 0) > 0,
                f"Recheck documented gate-return anomaly: {identity}",
            )
        if paired:
            components = [r[k] for k in ("ActualElapsedTime", "TaxiOut", "TaxiIn", "AirTime")]
            require(all(v != "" for v in components), f"Missing elapsed component: {identity}")
            actual, taxi_out, taxi_in, air = map(int, components)
            require(actual == taxi_out + taxi_in + air, f"Elapsed components disagree: {identity}")
    require(dates == {dt.date(2025, 7, d) for d in range(1, 32)}, "Flight month coverage")
    require(len(carriers) == 14, "Flight reporting-carrier coverage")
    require(
        counts
        == {
            "rows": 631428,
            "cancelled": 15473,
            "diverted": 3144,
            "paired": 612811,
            "consistent": 612798,
            "inconsistent": 13,
            "unavailable": 18617,
        },
        f"Flight coverage changed: {dict(counts)}",
    )


def main():
    checks = {
        "hong-kong-summer": check_hong_kong,
        "flight-delays": check_flights,
    }
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--case", choices=checks, action="append", help="Check only selected cases")
    args = parser.parse_args()
    for case in args.case or checks:
        check = checks[case]
        folder = CASES / case / "inputs"
        manifest = check_package(folder)
        check(folder)
        print(
            f"PASS {case}: {sum(f.get('rows', 0) for f in manifest['files'])} CSV records; "
            "hashes, coverage, keys, sources and internal consistency"
        )


if __name__ == "__main__":
    main()
