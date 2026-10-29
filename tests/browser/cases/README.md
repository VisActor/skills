# Browser smoke tests

[English](README.md) | [简体中文](README.zh-CN.md)

Use fixed inputs to check Skill scripts, templates and generated pages. These tests run locally and in CI without calling a model.

Dense person-poster chart fixtures explicitly declare `readingBaselinePassed: false`: API/export assertions can pass while the real review report remains failed at 600px. `reviewDisplayWidth: 1200` requests supplemental diagnostics only; it cannot replace the baseline. `tests/person_poster/test_readability.py` separately checks 600px DOM/chart text measurement and small-text rejection. Runtime acceptance always requires the 600px / 12px baseline and includes text marked decorative.

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

- `poster-build-entry`: zero-chart public init/preflight/build flow, generated DOM values and runtime readiness.
- `poster-managed-charts`: two real charts through init/build/review with a dynamically loaded same-version local runtime, no preloaded VChart tag or handwritten readiness. Python browser tests additionally cover data refresh and runtime/mount failures; this does not prove CDN availability.
- `poster-text-occlusion`: a later opaque sibling with pointer events disabled covers bound text without a decorative marker; layout must reject it. Python browser regressions also cover unbound text, nested content, clipping and supported paint-order cases.

- `poster-chart-matrix`: native examples for 12 relationships, rendered input data, nonblank charts and PNG export.
- `poster-html-only`: no VChart runtime; review and pre-export validation succeed without a PNG.
- `poster-charts-html-only`: a native chart renders and passes complete validation without a final PNG.
- `poster-no-charts-png`: no VChart runtime; fonts/images and diagnostic PNG export are checked.
- `poster-ancestor-clipping`: ready succeeds, but review rejects required content clipped by a parent; no final PNG is produced.
- `poster-render-failure`: an empty mount fails readiness and export without producing a PNG.

Poster API cases run preflight, review and pre-export structural validation from a copied Skill. PNG cases use explicit draft export into `draft/preview.png`; `pngExpected` checks that diagnostic image, not a certified delivery. End-to-end production export/verify/status are covered by `tests/person_poster/test_workflow.py`. Expected layout failure requires a measured review error, not an arbitrary script crash. Pinned public npm assets are served locally; this does not prove CDN availability on every network. Automated checks do not certify visual quality. Install the Python production pipeline browser too:

```bash
uv run python -m playwright install chromium
uv run python tests/browser/scripts/smoke.py --skill person-poster
```

Python browser regressions use the `poster_browser` pytest marker. CI runs these in the browser job after installing Python Chromium; the lint/regression job uses `-m "not poster_browser"`. Locally run `uv run pytest tests/person_poster -m poster_browser -q` after browser installation.

- `poster-chart-visual-contract`: fixed bar fixtures check rendered category-to-fill mappings under reorder/filter, and visible text completeness, bounds and pairwise intersections for unrotated labels/axes/legends. Covers long names, 50/25/25 stacks, 95/4/1 direct bars and valid single-color charts. Reading-size screenshots still require visual review; this is not a general Canvas readability checker.

- `poster-missing-values`: the full category-axis domain preserves a missing observation slot; rendered labels contain exactly one real zero and no fabricated value for the missing category. Checks native specs, data, bar geometry and visible labels.

Person Poster display cases cover matching mapped values, unbound visible text rejection, and a full-draft reading failure using the same fixed baseline. The fixtures provide input mappings; these deterministic checks do not establish source truth or real-host compliance.
