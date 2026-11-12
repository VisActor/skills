"""Create an editable draft from a bundled scene template at the chosen density."""

import argparse
import re
from pathlib import Path

ASSETS = Path(__file__).resolve().parents[1] / "assets"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("template", choices=sorted(path.stem for path in ASSETS.glob("*.html")))
    parser.add_argument("output", type=Path)
    parser.add_argument("--edition", choices=("mobile", "classic"), default="mobile")
    args = parser.parse_args()
    draft = (ASSETS / f"{args.template}.html").read_text(encoding="utf-8")
    # Only the packaged demonstration copy has these paired editorial alternatives.
    draft = re.sub(
        r"<!-- mobile-sample: (.*?) -->(.*?)<!-- /mobile-sample -->",
        lambda match: match[1 if args.edition == "mobile" else 2],
        draft,
        flags=re.DOTALL,
    )
    if args.edition == "mobile":
        # Append after scene styles so that the draft also works offline and after export.
        css = (ASSETS / "mobile-reading.css").read_text(encoding="utf-8")
        insert_at = draft.rindex("</style>") + len("</style>")
        draft = (
            draft[:insert_at]
            + f'\n<style id="mobile-reading">\n{css}\n</style>'
            + draft[insert_at:]
        )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    try:
        with args.output.open("x", encoding="utf-8") as output:
            output.write(draft)
    except FileExistsError:
        parser.error(f"{args.output} already exists; choose a new draft path")


if __name__ == "__main__":
    main()
