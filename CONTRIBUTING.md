# Contributing

Contributions can improve a Skill, fix a bug, clarify documentation or add an example. Describe the task your change helps with and how you checked it.

## Start here

1. Fork and clone the repository, or use your existing checkout. Create a branch from the latest `develop`; open your contribution PR against `VisActor/skills:develop`.
2. Make the change. For Skill behavior changes, reproduce the task in Codex, Claude Code or another agent, then refresh the installed Skill and retest. Keep local outputs and logs as described in [local debugging](docs/debugging.md).
3. Run the checks relevant to your change below. Documentation-only changes need link, formatting and diff checks, not a model run or Python environment.
4. Commit and open a PR describing the change and verification results. Ordinary contributions do not change `.github/release-plan.json`; mark the PR's release plan **N/A**.

`main` is the stable branch. Releases are handled separately by maintainers.

VChart and VTable Skills are maintained in [VisActor/VChart](https://github.com/VisActor/VChart/tree/develop/skills/vchart-development-assistant) and [VisActor/VTable](https://github.com/VisActor/VTable/tree/develop/skills/vtable-development-assistant). Contribute changes there. For Chart Assistant runtime changes, open an issue with reproduction steps and the installed tag or commit so its maintainers can coordinate the update.

## Adding or updating a Skill

| Location | Contents |
| --- | --- |
| `skills/<skill-name>/` | Installable instructions, references, templates, assets and scripts |
| `tests/<skill_name>/` | Regressions for one Skill; use underscores for Python imports |
| `tests/test_*` | Shared tooling checks and Node.js integration tests |
| `cases/<skill-name>/<case-name>/` | Fixed Agent prompts, inputs and acceptance criteria; see the [case guide](cases/README.md) |
| `tests/browser/cases/<skill-name>/<case-id>/` | Browser test configuration, inputs and expectations; see the [browser guide](tests/browser/cases/README.md) |
| `examples/<skill-name>/<case-name>/` | Reviewed examples with prompts and results; see the [example guide](examples/README.md) |
| `.cache/skill-dev/` | Ignored local outputs, screenshots and logs |

Use a lowercase, hyphenated Skill directory name matching the `name` in its `SKILL.md` frontmatter. Each Skill must work when copied on its own, without imports from another Skill or repository maintenance directories. Keep tests and development outputs outside the installed Skill; browser runners and their dependencies belong under `tests/browser/`.

Update both root READMEs when capabilities, installation or requirements change. Add tests for stable behavior and regressions; do not add empty case directories or tests that merely repeat instruction text. Keep acceptance criteria separate from inputs given to an agent, and allow different correct visual results.

## Verify your change

Python checks require Python 3.12+ and [uv](https://docs.astral.sh/uv/):

```bash
uv sync --locked
```

Node.js checks use Node 24, matching CI. Browser checks also need npm dependencies and Chromium; follow the [browser setup guide](tests/browser/cases/README.md) before running them. These automated checks do not call a model.

### Select checks by scope

| Scope | Deterministic regressions | Task/browser coverage |
| --- | --- | --- |
| chart-storytelling | `uv run pytest tests/chart_storytelling -q`; `node --test tests/test_story_vseed.cjs` after browser dependency installation | [Fixed tasks](cases/README.md); HTML and Web-PPT smoke |
| unit-data-storytelling | `uv run pytest tests/unit_data_storytelling -q`; `node --test tests/unit_data_storytelling/*.test.mjs`; `uv run pytest tests/test_portable_install.py -q -k unit_story`; fixed-input edits use `uv run pytest tests/test_case_inputs.py -q -k unit-data-storytelling` | [NBA, Hong Kong summer, flight delays; population paused](cases/README.md#unit-data-storytelling); no fixed browser smoke; [maintenance context](docs/unit-data-storytelling/context-map.md) |
| editorial-magazine | `uv run pytest tests/editorial_magazine -q` | No fixed tasks or browser smoke yet; inspect outputs with an agent |
| life-chronicle | `uv run pytest tests/life_chronicle -q` | No fixed tasks or browser smoke yet; inspect outputs with an agent |
| person-poster | `uv run pytest tests/person_poster -q -m "not poster_browser"`; browser regressions use `-m poster_browser` after Python Chromium installation | [Fixed task](cases/person-poster/career-evidence/README.md); native-chart, HTML-only, PNG and failure smoke |
| chart-assistant | `node --test tests/test_chart_assistant.mjs` (Node 24) | Copied runtime, references, fixture validation and offline delivery contracts; real host acceptance remains separate |
| Standalone installation | `uv run pytest tests/test_portable_install.py -q` | Copied Skill execution without the source checkout |
| Shared test tooling | Relevant root tests, or `uv run pytest tests -q -m "not poster_browser"` for changes across modules | [Browser smoke guide](tests/browser/cases/README.md) |
| Release tooling | `uv run pytest tests/test_release.py tests/test_release_plan.py tests/test_release_packages.py -q`; `uv run ruff check .github/scripts tests/test_release.py tests/test_release_plan.py tests/test_release_packages.py` | Mocked GitHub API; no tags or Releases are created |

For Python changes, lint the affected paths, for example:

```bash
uv run ruff check skills/life-chronicle tests/life_chronicle
```

For broad changes, use `uv run ruff check skills tests .github/scripts` and `uv run pytest tests -q -m "not poster_browser"`. Run the relevant Node.js tests separately; pytest does not include them. Run browser checks when rendering or interaction behavior changes.

For Skill instruction changes, use a [fixed task](cases/README.md) or your own prompt and inputs in an agent. Review the generated result for data accuracy, task requirements and interactions. Record the agent, Skill revision, checks and remaining issues. Automated tests do not replace this review.

### Continuous integration

`Skills CI` runs on PRs and pushes to `main` and `develop`:

- **Lint and regressions** runs Ruff, Python tests excluding `poster_browser`, Chart Assistant's Node.js tests, and release packaging checks. Main PRs also preview any release plan.
- **Browser smoke (no model)** runs the unit-data-storytelling mechanism tests and browser regressions for stories, Web-PPT and person posters. It retains reports, logs, HTML and screenshots for seven days.

Neither job needs model credentials. Browser tests check scripts and templates; they do not evaluate Agent-generated work. See the [browser guide](tests/browser/cases/README.md) for commands and current cases.

## Commit and open a PR

Enable repository hooks in your checkout:

```bash
git config core.hooksPath .githooks
```

Hooks check staged whitespace and require a Conventional Commit subject, such as `fix: preserve chart labels during export` or `docs: clarify manual installation`. Python and Python-tooling changes also run Ruff and require `uv` on PATH. Do not bypass hooks; they do not replace the relevant tests.

Before committing, review the staged diff and run `git diff --cached --check`. Keep unrelated changes, generated outputs, credentials and private inputs out of the commit.

Use the [PR template](.github/pull_request_template.md) to describe:

- What changed and why.
- Checks run and their results. For Skill behavior changes, include Agent validation or state what remains unverified.
- Migration steps if existing users must change how they use the Skill.

Target `develop` and set the release plan to **N/A** for an ordinary contribution.

## Publishing Skills

Maintainers prepare releases separately from contribution PRs:

1. Create a release branch from the latest `origin/develop`.
2. Set an unused `skills-vMAJOR.MINOR.PATCH` version in `.github/release-plan.json` and add reviewed notes at `docs/releases/<tag>.md`.
3. Open a PR to `main`. Review CI, the complete release-body preview and generated packages.
4. Merge the approved PR with a **merge commit**. Successful main CI triggers publication automatically.
5. Check the published tag, Release and assets before advancing main again.

The release plan remains committed after publication. An unchanged or null version skips publication. Never move or reuse published tags.

The [publishing guide](docs/publishing.md) covers version selection, automatic preflight, publication checks and failure recovery. See the [release notes template](docs/releases/TEMPLATE.md) and [artifact contract](docs/release-artifacts.md) for the required files.
