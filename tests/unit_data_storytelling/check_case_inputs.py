"""Check supplied research data, not narrative/design answers. Run with uv run."""

import argparse
import csv
import datetime as dt
import gzip
import hashlib
import json
import math
import re
from collections import Counter, defaultdict
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


def check_population(folder):
    rows = read_csv(folder, "nbs-national-year.csv")
    unique(rows, ["year"], "NBS annual")
    require([int(r["year"]) for r in rows] == list(range(1978, 2026)), "NBS years")
    for r in rows:
        total = int(r["total_10k"])
        require(int(r["male_10k"]) + int(r["female_10k"]) == total, f"Sex total {r['year']}")
        require(int(r["urban_10k"]) + int(r["rural_10k"]) == total, f"Residence total {r['year']}")
        birth, death, natural = [
            float(r[k])
            for k in ("birth_rate_per_1000", "death_rate_per_1000", "natural_change_per_1000")
        ]
        require(abs(birth - death - natural) <= 0.011, f"NBS rounded rates {r['year']}")
    births = read_csv(folder, "nbs-births-deaths-year.csv")
    require([int(r["year"]) for r in births] == list(range(2021, 2026)), "Birth count coverage")
    for r in births:
        require(int(r["births_10k"]) > 0 and int(r["deaths_10k"]) > 0, "Birth/death values")

    ages = read_csv(folder, "wb-age-sex-year.csv")
    demo = read_csv(folder, "wb-demography-year.csv")
    unique(ages, ["year", "age_group", "sex"], "WB ages")
    unique(demo, ["year", "indicator_id"], "WB demography")
    groups = [f"{n}-{n + 4}" for n in range(0, 80, 5)] + ["80+"]
    require(
        {(int(r["year"]), r["age_group"], r["sex"]) for r in ages}
        == {(y, a, s) for y in range(1960, 2024) for a in groups for s in ("female", "male")},
        "WB age/sex coverage",
    )
    definitions = {m["id"] for m in read_json(folder / "indicator-metadata.json")}
    require(definitions == {r["indicator_id"] for r in ages + demo}, "WB indicator definitions")
    sums = defaultdict(float)
    for r in ages:
        value = float(r["population"])
        require(math.isfinite(value) and value >= 0, "WB population value")
        sums[r["year"], r["sex"]] += value
    values = {(r["year"], r["indicator_id"]): float(r["value"]) for r in demo}
    require(len(values) == 64 * 8, "WB demography coverage")
    for year in map(str, range(1960, 2024)):
        for sex, code in (("female", "SP.POP.TOTL.FE.IN"), ("male", "SP.POP.TOTL.MA.IN")):
            require(
                abs(sums[year, sex] - values[year, code]) <= 9,
                f"WB age sum exceeds rounding allowance: {year} {sex}",
            )
        require(
            abs(
                values[year, "SP.POP.TOTL.FE.IN"]
                + values[year, "SP.POP.TOTL.MA.IN"]
                - values[year, "SP.POP.TOTL"]
            )
            <= 1,
            "WB sex sum",
        )

    ages = read_csv(folder, "census2020-age-sex.csv")
    unique(ages, ["age_group"], "Census ages")
    total = next(r for r in ages if r["row_kind"] == "total")
    details = [r for r in ages if r["row_kind"] != "total"]
    require(len(details) == 21, "Census age groups")
    for r in ages:
        require(int(r["male"]) + int(r["female"]) == int(r["population"]), "Census age sex sum")
    for field in ("population", "male", "female"):
        require(sum(int(r[field]) for r in details) == int(total[field]), "Census age sum")

    national_marital = {}
    fields = ("population", "never_married", "married", "divorced", "widowed")
    for file, dim, total_label, expected in (
        ("census2020-marital-age-sex.csv", "age_group", "15+", 36),
        ("census2020-marital-region-sex.csv", "region", "全国", 96),
    ):
        rows = read_csv(folder, file)
        require(len(rows) == expected, f"{file}: count")
        unique(rows, [dim, "sex"], file)
        indexed = {(r[dim], r["sex"]): r for r in rows}
        for label in {r[dim] for r in rows}:
            for field in fields:
                require(
                    int(indexed[label, "all"][field])
                    == int(indexed[label, "male"][field]) + int(indexed[label, "female"][field]),
                    f"{file}: sex sum",
                )
        for r in rows:
            require(
                sum(int(r[f]) for f in fields[1:]) == int(r["population"]), f"{file}: marital sum"
            )
        for sex in ("all", "male", "female"):
            for field in fields:
                actual = int(indexed[total_label, sex][field])
                require(
                    sum(int(r[field]) for r in rows if r["sex"] == sex and r[dim] != total_label)
                    == actual,
                    f"{file}: aggregate sum",
                )
                key = (sex, field)
                require(
                    key not in national_marital or national_marital[key] == actual,
                    "Census marital tables disagree",
                )
                national_marital[key] = actual

    fert = read_csv(folder, "census2020-fertility-age.csv")
    unique(fert, ["age_group"], "Fertility ages")
    require(len(fert) == 8, "Fertility coverage")
    total = next(r for r in fert if r["row_kind"] == "total")
    for field in ("female_average", "births", "first_births", "second_births", "thirdplus_births"):
        require(
            sum(int(r[field]) for r in fert if r["row_kind"] != "total") == int(total[field]),
            f"Fertility age sums: {field}",
        )
    for r in fert:
        require(
            r["period_start"] == "2019-11-01" and r["period_end"] == "2020-10-31", "Birth period"
        )
        require(
            sum(int(r[k]) for k in ("first_births", "second_births", "thirdplus_births"))
            == int(r["births"]),
            "Birth order sum",
        )
        for count, rate in (
            ("births", "birth_rate_per_1000"),
            ("first_births", "first_rate_per_1000"),
            ("second_births", "second_rate_per_1000"),
            ("thirdplus_births", "thirdplus_rate_per_1000"),
        ):
            require(
                abs(1000 * int(r[count]) / int(r["female_average"]) - float(r[rate])) <= 0.006,
                f"Fertility rate: {r['age_group']} {rate}",
            )
    regions = read_csv(folder, "census2020-fertility-region.csv")
    unique(regions, ["region"], "Fertility regions")
    require(len(regions) == 32, "Fertility region count")
    national = next(r for r in regions if r["region"] == "全国")
    for r in fert:
        if r["row_kind"] != "total":
            require(
                float(r["birth_rate_per_1000"])
                == float(national[f"asfr_{r['age_group'].replace('-', '_')}_per_1000"]),
                "National age rates disagree across fertility tables",
            )
    for r in regions:
        require(0 < float(r["tfr_per_woman"]) < 10, "TFR unit check")

    hh = read_csv(folder, "census2020-household-size.csv")
    unique(hh, ["household_size"], "Household sizes")
    require(len(hh) == 11, "Household coverage")
    columns = (
        "households",
        "one_generation",
        "two_generations",
        "three_generations",
        "four_generations",
        "fiveplus_generations",
    )
    total = next(r for r in hh if r["row_kind"] == "total")
    for column in columns:
        require(
            sum(int(r[column] or 0) for r in hh if r["row_kind"] != "total") == int(total[column]),
            f"Household size sum: {column}",
        )
    for r in hh:
        # Blank cells remain blank in the dataset; here only the sum of reported cells is tested.
        require(
            sum(int(r[c]) for c in columns[1:] if r[c] != "") == int(r["households"]),
            "Reported household generation sum",
        )


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
        "china-population": check_population,
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
