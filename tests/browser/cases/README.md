# Browser smoke tests

[English](README.md) | [简体中文](README.zh-CN.md)

Use fixed inputs to check Skill scripts, templates and generated pages. These tests run locally and in CI without calling a model.

## What is tested

| Skill | Case | Checks |
| --- | --- | --- |
| chart-storytelling | [story-html](chart-storytelling/story-html) | Assemble an HTML story and render its chart |
| chart-storytelling | [story-ppt](chart-storytelling/story-ppt) | Assemble a Web-PPT, render its chart and navigate forward and back |

Both cases check for a nonblank chart canvas, page/resource errors and successful local asset loading. PPT navigation checks the target slide's position and visibility. Smoke uses reduced motion and does not assess animation or narrative quality. Screenshots are diagnostic evidence, not pixel-comparison targets.

## Run

From the repository root:

```bash
uv sync --locked
npm ci --prefix tests/browser --ignore-scripts
node tests/browser/node_modules/playwright/cli.js install chromium

uv run python tests/browser/scripts/smoke.py
uv run python tests/browser/scripts/smoke.py --skill chart-storytelling
uv run python tests/browser/scripts/smoke.py --case story-ppt
```

On Linux, use `install --with-deps chromium` if browser system libraries are missing.

Reports, logs, inputs, generated files and screenshots are saved under `.cache/`. Use `--output-dir PATH` to select a new output directory. Any failed case produces a nonzero exit code.

## Case files

Each `<skill>/<case>/` directory contains `config.json` (build settings), `inputs/` (fixed inputs) and `expectations.json` (required checks). Add cases under the corresponding Skill directory; the runner discovers them automatically.

## person-poster

- `poster-chart-matrix`: native examples for 12 relationships, rendered input data, nonblank charts and PNG export.
- `poster-html-only`: no VChart runtime; review and complete validation succeed without a final PNG.
- `poster-charts-html-only`: a native chart renders and passes complete validation without a final PNG.
- `poster-no-charts-png`: no VChart runtime; fonts/images and PNG export still complete.
- `poster-ancestor-clipping`: ready succeeds, but review rejects required content clipped by a parent; no final PNG is produced.
- `poster-render-failure`: an empty mount fails readiness and export without producing a PNG.

Successful poster cases run preflight, review and complete validation from a copied Skill; export runs only for PNG delivery. Expectations check final PNG existence independently of manifest.delivery. Expected layout failure requires a measured review error, not an arbitrary script crash. Pinned public npm assets are served locally; this does not prove CDN availability on every network. Automated checks do not certify visual quality. Install the Python production pipeline browser too:

```bash
uv run python -m playwright install chromium
uv run python tests/browser/scripts/smoke.py --skill person-poster
```

Python browser regressions use the `poster_browser` pytest marker. CI runs these in the browser job after installing Python Chromium; the lint/regression job uses `-m "not poster_browser"`. Locally run `uv run pytest tests/person_poster -m poster_browser -q` after browser installation.
