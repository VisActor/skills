import csv
import json
import pathlib

root = pathlib.Path(__file__).resolve().parents[1] / "result" / "data"
players = {p["player_id"]: p for p in csv.DictReader(open(root / "players.csv"))}
seasons = list(csv.DictReader(open(root / "player-seasons.csv")))
result = []
for start, end in [(2000, 2009), (2020, 2025)]:
    rows = [
        r
        for r in seasons
        if start <= int(r["season_end"]) - 1 <= end and "PF" in r["positions"].split("|")
    ]
    assert len({(r["player_id"], r["season_end"]) for r in rows}) == len(rows)
    ids = sorted({r["player_id"] for r in rows})
    people = []
    for pid in ids:
        p = players[pid]
        h = float(p["height_in"]) if p["height_in"] else None
        rs = [r for r in rows if r["player_id"] == pid]
        people.append(
            dict(
                id=pid,
                name=p["name"],
                height=h,
                minutes=sum(float(r["minutes"] or 0) for r in rs),
                seasons=len(rs),
                career_source_row=p["career_source_row"],
            )
        )
    known = [p for p in people if p["height"] is not None]
    total = sum(p["minutes"] for p in known)
    bins = []
    for h in sorted({p["height"] for p in known}):
        ps = [p for p in known if p["height"] == h]
        bins.append(
            dict(
                height=h,
                n=len(ps),
                people_pct=len(ps) / len(known) * 100,
                minutes=sum(p["minutes"] for p in ps),
                minute_pct=sum(p["minutes"] for p in ps) / total * 100,
            )
        )
    summary = dict(
        start=start,
        end=end,
        n=len(people),
        known=len(known),
        missing=len(people) - len(known),
        rows=len(rows),
        minutes=total,
        all_minutes=sum(p["minutes"] for p in people),
        mean=sum(p["height"] for p in known) / len(known),
        weighted_mean=sum(p["height"] * p["minutes"] for p in known) / total,
        bins=bins,
        people=people,
    )
    result.append(summary)
(root / "analysis.json").write_text(json.dumps(result, ensure_ascii=False, indent=2))
for r in result:
    print(json.dumps({k: v for k, v in r.items() if k != "people"}, ensure_ascii=False, indent=2))
    print(
        "groups",
        [
            (
                label,
                round(sum(b["people_pct"] for b in r["bins"] if low <= b["height"] <= high), 2),
                round(sum(b["minute_pct"] for b in r["bins"] if low <= b["height"] <= high), 2),
            )
            for label, low, high in [
                ("<=79", 0, 79),
                ("80-81", 80, 81),
                ("82-83", 82, 83),
                (">=84", 84, 100),
            ]
        ],
    )
