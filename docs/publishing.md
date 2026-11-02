# Publishing Skills

This guide is for release maintainers. For ordinary contributions, see [CONTRIBUTING.md](../CONTRIBUTING.md).

Maintainers approve releases by merging reviewed release-branch → `main` PRs. PR preflight and post-merge publication are automatic; no Actions button or separate version input is needed. Default-branch installations can receive changes as soon as they reach `main`, before a Release is published.

The committed [`.github/release-plan.json`](../.github/release-plan.json) is the machine-readable source of release intent. The PR description summarizes it for reviewers; automation does not parse PR prose.

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

## Release procedure

1. Keep ordinary implementation PRs targeting `develop`. When ready to release, fetch the latest branches and create `codex/release-<version>` from `origin/develop`. Update `.github/release-plan.json` and commit `docs/releases/<tag>.md` on that release branch using [the release notes template](releases/TEMPLATE.md). Include changes, migration steps and known limitations; the release preparation does not need a separate PR into `develop`.
2. Open one release-branch → `main` PR. Fill in its release plan to match the committed JSON. Review the full cumulative diff and relevant real Agent results; CI does not evaluate model output quality.
3. **Skills CI automatically previews main PRs** using the candidate merge commit and the PR's base SHA. A changed non-null plan checks version availability, reads reviewed notes from Git and builds/verifies all ZIPs and the manifest. Inspect the full Release body in the Actions summary and download `skills-release-preview`. Missing/empty notes or an invalid/reserved version fail the check. Null or unchanged plans explicitly report a skip.
4. Merge only after reviewing the preview and CI. **This merge authorizes publication** for a changed non-null plan. `Publish Skills` starts after successful push-triggered Skills CI on `main`; it fixes the source to that CI run's SHA, checks that it is still current main, and rechecks the required jobs and version before any release writes.
5. Automation creates the exact tag and a draft Release, uploads/verifies all attachments, then publishes it. Inspect the Release and its source SHA. No manual workflow dispatch is needed.

The release workflow must exist on the default branch (`main`). It accepts only successful push CI from this repository's main, verifies the triggering run through GitHub, and never downloads executable artifacts or restores caches from PR runs. The PR preview has read-only repository permissions. Publication uses the built-in `GITHUB_TOKEN` with `contents: write` and `actions: read`; no personal token is needed.

For the normal merge-commit flow, the merge's first parent is the preceding main snapshot used for plan comparison. Use merge commits for release-branch → `main` promotions, preserving original commits; do not batch-push/rebase a release plan into main. Plans and notes are read from Git objects, not the local worktree. The PR preview uses a candidate SHA/CI link; publication rebuilds from the final main SHA and supplies its CI link. The reviewed notes and body-generation logic stay the same. See [release notes maintenance](releases/README.md) and [the artifact contract](release-artifacts.md).

After publication, bring the released main history back into develop through the normal branch-protection process, preferably with the next development integration. This keeps release documentation and maintenance fixes from drifting; it is not a prerequisite for the completed release. Never rewrite published commits.

## Failure and retry

The latest Skills CI for the final main SHA must succeed, including both **Lint and regressions** and **Browser smoke (no model)**. Failed or skipped CI does not publish. If main advances before publication, the stale release run stops instead of publishing another commit. Finish a release before promoting another main PR.

Release runs are serialized. An unused version is required; existing tags or Releases, including drafts and already successful runs, are never overwritten. Rerunning after successful publication stops at the existing-version check without further writes. The plan is not a retry queue: a later main merge with unchanged intent skips even if the earlier release failed.

Before rerunning a failed release, inspect the tag, draft/Release and assets: a timed-out write may have succeeded. If no remote state was created and main is still the same SHA, rerun the failed `Publish Skills` job. If a tag/draft exists, verify its SHA and rebuild from that exact commit in a fresh directory; complete it manually only after checking all attachments against the manifest, including the manifest asset itself. Never delete/move a tag or publish a partial draft to make a retry pass. Alternatively, explicitly review a new version in another release PR. If CI was cancelled by newer main work, investigate and prepare a fresh release plan rather than relying on unchanged intent to retry.

PR previews retain packages as `skills-release-preview`; publication retains local packages as `skills-release-artifacts`, both for seven days. These Actions artifacts are diagnostics, not formal release sources. Consumers use only published stable Releases with complete verified assets.

Run these commands from the repository root to verify locally without publishing:

```bash
uv run --locked ruff check .github/scripts tests/test_release.py tests/test_release_plan.py tests/test_release_packages.py
uv run --locked pytest tests/test_release.py tests/test_release_plan.py tests/test_release_packages.py -q
uv run --locked python .github/scripts/package_skills.py --commit HEAD --tag skills-v1.0.0 --output .cache/release-preview
```

Use a new output directory for each build. The local command treats the tag as manifest metadata and never creates a Git tag.
