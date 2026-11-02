# Contributing

Changes to Skills should protect a concrete user task or failure mode. Keep runtime instructions/resources under `skills/`, deterministic regressions under `tests/`, fixed Agent tasks under `cases/`, and curated results under `examples/`.

## Start here

Use `main` as the default, user-facing stable branch and `develop` for day-to-day maintenance. Prepare releases on a branch from the latest `origin/develop` and open one release PR directly to `main`. Create contribution branches from the latest `origin/develop` and target pull requests to `develop`.

VChart and VTable Skills are maintained in [VisActor/VChart](https://github.com/VisActor/VChart/tree/develop/skills/vchart-development-assistant) and [VisActor/VTable](https://github.com/VisActor/VTable/tree/develop/skills/vtable-development-assistant). Make changes to those Skills in their owning repositories.

1. Reproduce a task with a mature agent such as Codex or Claude Code. Follow [local debugging](docs/debugging.md) to create an ignored `.cache/skill-dev/<skill-name>/<run-name>/` workspace. Use your own prompt/assets or a [fixed task](cases/README.md).
2. Edit the Skill source, refresh the installed copy and retest. Inspect generated files and required interactions. Keep the prompt, inputs, host/model, available logs and screenshots locally; automated success does not replace semantic or visual review.
3. Run `uv sync --locked`, then the relevant regressions below. These checks need no model account.
4. For Python changes, run Ruff on the affected paths. Broaden verification when shared tooling or multiple Skills are affected.

### Adding or updating a Skill

- Use `skills/<skill-name>/SKILL.md` with a lowercase hyphenated directory matching the frontmatter `name`. Keep required references, assets, templates, scripts and optional dependency declarations in that directory.
- Skills must work when copied independently. Do not import maintenance files or resources from a sibling Skill. Keep tests, task cases and generated artifacts outside the installed Skill.
- Put Skill-specific Python regressions in `tests/<skill_name>/`, replacing hyphens with underscores. Shared installation/tooling tests and Node.js integrations live at the test root.
- Fixed Agent tasks belong in `cases/<skill-name>/<case-name>/`, with prompt, inputs and acceptance guidance together. Follow the [case guide](cases/README.md). Keep reviewer criteria outside the generation workspace; allow different correct outputs.
- Fixed browser cases belong in `tests/browser/cases/<skill-name>/<case-id>/`. Configuration, inputs and expectations stay together; scripts and locked browser dependencies live under `tests/browser/`.
- Curated user-facing examples belong in `examples/<skill-name>/<case-name>/`; follow the [example guide](examples/README.md). Review outputs before showcasing them; keep raw execution logs local.
- Update both root READMEs with the Skill's tasks, install command and requirements. Document actual test coverage; do not create empty catalogs just to mirror every installed Skill.

### Select checks by scope

| Scope | Deterministic regressions | Task/browser coverage |
| --- | --- | --- |
| chart-storytelling | `uv run pytest tests/chart_storytelling -q`; `node --test tests/test_story_vseed.cjs` after browser dependency installation | [Fixed tasks](cases/README.md); HTML and Web-PPT smoke |
| editorial-magazine | `uv run pytest tests/editorial_magazine -q` | No fixed tasks or browser smoke yet; inspect outputs with an agent |
| life-chronicle | `uv run pytest tests/life_chronicle -q` | No fixed tasks or browser smoke yet; inspect outputs with an agent |
| person-poster | `uv run pytest tests/person_poster -q -m "not poster_browser"`; browser regressions use `-m poster_browser` after Python Chromium installation | [Fixed task](cases/person-poster/career-evidence/README.md); native-chart, HTML-only, PNG and failure smoke |
| Packaging | `uv run pytest tests/test_portable_install.py -q` | Copied Skill execution without the source checkout |
| Shared test tooling | Relevant root tests, or `uv run pytest tests -q` for changes across modules | [Browser smoke guide](tests/browser/cases/README.md) |
| Release tooling | `uv run pytest tests/test_release.py tests/test_release_plan.py tests/test_release_packages.py -q`; `uv run ruff check .github/scripts tests/test_release.py tests/test_release_plan.py tests/test_release_packages.py` | Mocked GitHub API; no tags or Releases are created |

For example, lint `skills/life-chronicle tests/life_chronicle` when changing its Python helpers. Use `uv run ruff check skills tests` for changes spanning Skills or shared tooling. CI runs the full deterministic suite.

## Continuous integration

`Skills CI` runs on pull requests and pushes to `main`/`develop`, with two jobs:

- **Lint and regressions**: install locked Python dependencies, run Ruff and deterministic tests excluding the `poster_browser` marker, including copied Skill execution and fixed-input integrity checks. Build and verify release ZIPs/manifest from the checked-out Git commit using the same packager as publication; the CI-only label `skills-v0.0.0` creates no tag or Release.
- **Browser smoke (no model)**: run Python `poster_browser` regressions and use copied Skills to generate fixed HTML stories, Web-PPT and person posters; check chart rendering, slide navigation, delivery modes, layout/export failures and browser errors. Pinned npm packages serve CDN requests locally; unexpected external requests fail. Save JSON reports, logs, generated HTML and screenshots for seven days.

Neither job calls a model or needs model credentials. Browser smoke checks script/template integration. Execute fixed Agent tasks locally and review their results separately.

To run browser checks locally:

```bash
npm ci --prefix tests/browser --ignore-scripts
node tests/browser/node_modules/playwright/cli.js install chromium
uv run python -m playwright install chromium
uv run pytest tests/person_poster -m poster_browser -q
node --test tests/test_browser_assets.mjs tests/test_browser_checks.mjs tests/test_story_vseed.cjs tests/test_person_poster_runtime.mjs
uv run python tests/browser/scripts/smoke.py
# Select a Skill or a single fixed browser case
uv run python tests/browser/scripts/smoke.py --skill chart-storytelling
uv run python tests/browser/scripts/smoke.py --case story-ppt
```

On Linux, use `install --with-deps chromium` when system libraries are missing. Each smoke run creates a new evidence directory under `.cache/`; `--output-dir PATH` selects an explicit directory that must not exist yet.

## Publishing Skills

Maintainers approve releases by merging reviewed release-branch → `main` PRs. PR preflight and post-merge publication are automatic; no Actions button or separate version input is needed. Default-branch installations can receive changes as soon as they reach `main`, before a Release is published.

The committed [`.github/release-plan.json`](.github/release-plan.json) is the machine-readable source of release intent. The PR description summarizes it for reviewers; automation does not parse PR prose.

```json
{
  "version": "skills-v1.0.0"
}
```

Use `{"version": null}` for no release. A non-null version triggers publication only when it differs from the preceding main snapshot. The file is **not cleared or rewritten after publication**: subsequent merges retaining the same value skip publication. Set a new version for the next release; do not reset and reuse an already reserved version. Formatting-only JSON changes do not trigger publication.

Version all maintained Skills together using `skills-vMAJOR.MINOR.PATCH`:

| Change | Version increment |
| --- | --- |
| Compatible fixes to Skill instructions, scripts or templates | Patch, e.g. `skills-v1.0.1` |
| New Skills or compatible capabilities | Minor, e.g. `skills-v1.1.0` |
| Skill removals, renames or incompatible usage changes | Major, e.g. `skills-v2.0.0` |
| Documentation, showcase or maintenance-only changes | May merge without an immediate release |

When no stable-format Skills tag or Release exists, both preflight and publication require exactly `skills-v1.0.0`. A tag or draft left by an interrupted attempt reserves that version: inspect and complete it, or explicitly plan a higher version. Historical VMind SDK `v*` tags remain unchanged and do not participate in Skills version ordering. Prerelease/build suffixes are not accepted. The Python project version and CI-only packaging label `skills-v0.0.0` are not published Skills versions.

### Release procedure

1. Keep ordinary implementation PRs targeting `develop`. When ready to release, fetch the latest branches and create `codex/release-<version>` from `origin/develop`. Update `.github/release-plan.json` and commit `docs/releases/<tag>.md` on that release branch using [the release notes template](docs/releases/TEMPLATE.md). Include changes, migration steps and known limitations; the release preparation does not need a separate PR into `develop`.
2. Open one release-branch → `main` PR. Fill in its release plan to match the committed JSON. Review the full cumulative diff and relevant real Agent results; CI does not evaluate model output quality.
3. **Skills CI automatically previews main PRs** using the candidate merge commit and the PR's base SHA. A changed non-null plan checks version availability, reads reviewed notes from Git and builds/verifies all ZIPs and the manifest. Inspect the full Release body in the Actions summary and download `skills-release-preview`. Missing/empty notes or an invalid/reserved version fail the check. Null or unchanged plans explicitly report a skip.
4. Merge only after reviewing the preview and CI. **This merge authorizes publication** for a changed non-null plan. `Publish Skills` starts after successful push-triggered Skills CI on `main`; it fixes the source to that CI run's SHA, checks that it is still current main, and rechecks the required jobs and version before any release writes.
5. Automation creates the exact tag and a draft Release, uploads/verifies all attachments, then publishes it. Inspect the Release and its source SHA. No manual workflow dispatch is needed.

The release workflow must exist on the default branch (`main`). It accepts only successful push CI from this repository's main, verifies the triggering run through GitHub, and never downloads executable artifacts or restores caches from PR runs. The PR preview has read-only repository permissions. Publication uses the built-in `GITHUB_TOKEN` with `contents: write` and `actions: read`; no personal token is needed.

For the normal merge-commit flow, the merge's first parent is the preceding main snapshot used for plan comparison. Use merge commits for release-branch → `main` promotions, preserving original commits; do not batch-push/rebase a release plan into main. Plans and notes are read from Git objects, not the local worktree. The PR preview uses a candidate SHA/CI link; publication rebuilds from the final main SHA and supplies its CI link. The reviewed notes and body-generation logic stay the same. See [release notes maintenance](docs/releases/README.md) and [the artifact contract](docs/release-artifacts.md).

After publication, bring the released main history back into develop through the normal branch-protection process, preferably with the next development integration. This keeps release documentation and maintenance fixes from drifting; it is not a prerequisite for the completed release. Never rewrite published commits.

### Failure and retry

The latest Skills CI for the final main SHA must succeed, including both **Lint and regressions** and **Browser smoke (no model)**. Failed or skipped CI does not publish. If main advances before publication, the stale release run stops instead of publishing another commit. Finish a release before promoting another main PR.

Release runs are serialized. An unused version is required; existing tags or Releases, including drafts and already successful runs, are never overwritten. Rerunning after successful publication stops at the existing-version check without further writes. The plan is not a retry queue: a later main merge with unchanged intent skips even if the earlier release failed.

Before rerunning a failed release, inspect the tag, draft/Release and assets: a timed-out write may have succeeded. If no remote state was created and main is still the same SHA, rerun the failed `Publish Skills` job. If a tag/draft exists, verify its SHA and rebuild from that exact commit in a fresh directory; complete it manually only after checking all attachments against the manifest, including the manifest asset itself. Never delete/move a tag or publish a partial draft to make a retry pass. Alternatively, explicitly review a new version in another release PR. If CI was cancelled by newer main work, investigate and prepare a fresh release plan rather than relying on unchanged intent to retry.

PR previews retain packages as `skills-release-preview`; publication retains local packages as `skills-release-artifacts`, both for seven days. These Actions artifacts are diagnostics, not formal release sources. Consumers use only published stable Releases with complete verified assets.

Local verification does not publish:

```bash
uv run --locked ruff check .github/scripts tests/test_release.py tests/test_release_plan.py tests/test_release_packages.py
uv run --locked pytest tests/test_release.py tests/test_release_plan.py tests/test_release_packages.py -q
uv run --locked python .github/scripts/package_skills.py --commit HEAD --tag skills-v1.0.0 --output .cache/release-preview
```

Use a new output directory for each build. The local command treats the tag as manifest metadata and never creates a Git tag.

## Before committing

Enable repository hooks:

```bash
git config core.hooksPath .githooks
```

Hooks check staged whitespace, run Ruff for Python/tooling changes and require a Conventional Commit subject. Python checks require `uv` on PATH. Run relevant tests before committing; hooks do not run model tasks or the complete test suite.

Explain the task or defect, the behavior changed and why the selected checks protect it. Include commands, case ids and review outcomes; for agent runs, include the host/model and Skill revision. Report failures and skipped checks. Add cases for distinct behaviors, not just to increase the count. Keep credentials, private data and raw execution evidence out of commits.
