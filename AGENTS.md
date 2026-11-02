# VisActor Skills maintenance

- Use `main` as the default, user-facing stable branch and `develop` for day-to-day maintenance. For a release, create a `codex/release-<version>` branch from the latest `origin/develop`, add the release plan and notes there, and open one PR directly to `main`. Start new contribution branches from the latest `origin/develop` and target PRs to `develop`.
- Runtime Skills live in `skills/<skill-name>/`, with a lowercase hyphenated directory matching the `SKILL.md` frontmatter name. Each Skill must work when copied independently without sibling Skill or maintenance-directory imports.
- Keep tests, fixed Agent tasks and generated reports outside Skill directories. Put Skill-specific Python regressions under `tests/<skill_name>/` (hyphens become underscores); shared tooling/packaging checks and current Node.js integrations live at the test root.
- Keep both root READMEs aligned with the maintained Skills, install commands and runtime requirements. Document externally maintained Skills as upstream links rather than copying them here.
- Document actual fixed-task and browser-smoke coverage; installing a Skill does not imply it has either. Use mature agents for task execution; do not add a model API harness or host-specific batch runners.
- Maintain fixed browser smoke cases under `tests/browser/cases/<skill>/<case>/`, with configuration, inputs and expectations together. Browser scripts and dependencies live under `tests/browser/`; do not embed case-specific inputs in the runner.
- Keep fixed Agent tasks under `cases/<skill-name>/<case-name>/`, with `prompt.md`, `inputs/`, input hashes in `fixtures.json` and a README containing acceptance points. Follow [the case guide](cases/README.md); allow multiple correct outputs instead of requiring page or pixel equality.
- Preserve user changes. Do not commit or publish unless requested.
- Use `uv run pytest` for Python tests and `uv run ruff check` for maintained Python tooling.
- Test stable behavior; do not snapshot large instruction documents. Generalize Skill fixes from observed failures; do not add runtime rules keyed to a case id, exact fixture, prompt string or evaluation path.
- For evaluation, expose only the selected skill and task inputs to the agent, never expected answers.
- Keep observable execution evidence locally, redact credentials and distinguish automated checks from human visual review.
- Do not restore the historical VMind SDK or depend on leftover local packages. Earlier versions remain in Git history and releases.

## Local development workspaces

- Use one ignored `.cache/skill-dev/<skill-name>/<run-name>/` directory per experiment. Follow [local debugging](docs/debugging.md); `.cache/` is already ignored.
- Keep copied inputs in `inputs/`, generated files in `outputs/`, screenshots in `screenshots/` and available session/tool logs in `logs/`. Record the Skill revision or local diff, host/model, checks and outcome in `notes.md`; note logs the host cannot export. Never put credentials in shared evidence.
- Edit source Skills under `skills/`, then refresh the installed copy before retesting. Copy fixed inputs into the run workspace; do not modify originals during a run. Keep acceptance guidance outside the generation workspace.
- Promote stable tasks to `cases/`, deterministic regressions to `tests/`, and reviewed showcase results to `examples/`. Keep drafts, raw logs and caches local.
- Clean only directories owned by the current task. Do not delete another session's files or historical evidence automatically.

## Showcase examples

- Keep curated examples under `examples/<skill-name>/<case-name>/`, outside runtime Skills and test tooling. Follow the [example guide](examples/README.md). Keep one README per example, written in the case's language; do not require separate translated copies.
- Keep example READMEs focused on the task, prompt, inputs, result, preview and usage requirements. Keep migration history, resource-adaptation details and internal verification records outside the public case descriptions; retain only data limitations that affect usage.
- Review the actual output before presenting it as a showcase. Keep raw session logs and caches local. Examples are not automatically regenerated or treated as CI snapshots.

## Versioning

- Version the Skills maintained here together at repository level. External Skills use their owning repositories' versions. Do not maintain separate version numbers for individual Skills.
- Ordinary Skill edits are identified by commits; a new release tag is not required for each edit.
- Mark each formal Skills release with a Git tag that identifies the complete repository snapshot, including Skill instructions, references, templates and scripts. Preserve published tags and historical VMind SDK tags; do not move or reuse them.
- Use a release tag or commit SHA to identify the Skill version when reporting or reproducing results. A branch name alone can change over time.
- Keep Skill release versions distinct from dependency versions such as VChart and VTable. Updating a library does not assign its version number to the Skill.
- Use stable `skills-vMAJOR.MINOR.PATCH` tags, starting at `skills-v1.0.0`. Use patch releases for compatible fixes, minor releases for new Skills or compatible capabilities, and major releases for removals, renames or incompatible usage changes.
- Every release-branch → `main` PR must state whether to publish a release, the planned version (or N/A), and release highlights/migration notes. Ordinary contribution PRs can mark the release plan N/A. The committed `.github/release-plan.json` is authoritative: a changed non-null version authorizes automatic publication after main CI; null or unchanged values skip. PR prose summarizes that plan. Default-branch installations can receive merged changes before publication.
- Follow [the release guide](CONTRIBUTING.md#publishing-skills): Skills CI automatically previews release plans in main PRs. After merge, `Publish Skills` reacts only to successful push CI from this repository's main, fixes its SHA, and revalidates before publication. Do not merge a release PR without authorization. Keep the plan file after publication; do not create a cleanup commit. Use merge commits for main promotions and do not advance main while a release is pending.
- Keep release tooling under `.github/scripts/`, with deterministic regressions under `tests/`. Do not add model calls to CI or the release workflow. Never overwrite a published version or bypass a failing release check.
- Follow [the release artifact contract](docs/release-artifacts.md): build each Skill from all tracked regular files under its own directory at the exact Git commit, publish one ZIP per Skill plus `skills-manifest.json`, and use the documented path/mode/content fingerprint. Do not hash local worktrees or include repository tags in per-Skill fingerprints.
- Upload and verify all assets on a draft Release before publishing it. Downstream systems consume only published stable Releases with complete verified manifests; market versions and successful-sync records remain downstream concerns. Never modify an existing published manifest or ZIP; ship a new version for corrections.
- For a planned release, commit reviewed notes at `docs/releases/<tag>.md` using [the template](docs/releases/TEMPLATE.md). Preflight must display the complete publication body from that exact Git snapshot; never substitute automatic PR lists for migration steps. Do not create version records for tooling-only PRs.
