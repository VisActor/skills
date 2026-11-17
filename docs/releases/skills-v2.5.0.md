# VisActor Skills 2.5.0

This release adds a mobile reading edition to `editorial-magazine` and clarifies
the scope and implementation guidance of `creative-data-storytelling`.

## New capabilities

- `editorial-magazine` offers a 3:4 mobile reading edition (1080 × 1440) for
  news, biographies, outfits, travel, chronological stories and explainers.
  Updated templates give each page more room for readable text and images.
- `scripts/start_layout.py` initializes a draft from the selected scene and
  edition. The classic 9:16 edition (1080 × 1920) remains available.

## Fixes

- `editorial-magazine` checks for missing images, empty pages, size mismatches
  and overflow during export. Updated image guidance and helpers cover cutout
  alignment, focus and portrait wrapping.
- `creative-data-storytelling` now describes how to organize evidence around
  reader questions and connect visual explanations. Its implementation entry
  points specifically to data-story visuals, reading transitions and
  interactions. The workflow, examples and runtime are unchanged.

## Breaking changes and migration

New `editorial-magazine` drafts and exports default to 1080 × 1440. To keep the
previous 1080 × 1920 layout, pass `--edition classic` when creating a draft and
`--page-size 1080 1920` when exporting it. Existing HTML files are unchanged;
pass the same size option when re-exporting an existing 9:16 file.

Skill names and installation commands are unchanged. Update the complete
installed Skill, or download its ZIP from this release for manual import.

## Known limitations

- Magazine templates ship with lightweight placeholders. Replace them with
  verified content and relevant images before delivery. PNG export needs a
  Chromium-compatible browser.
- This release did not repeat independent Agent generation or production host
  acceptance. The creative storytelling changes are documentation only.
