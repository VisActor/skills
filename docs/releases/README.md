# Release notes

For each planned Skills release, copy [TEMPLATE.md](TEMPLATE.md) to
`docs/releases/skills-vMAJOR.MINOR.PATCH.md`. Replace the guidance with actual
changes, migration steps and known limitations. Write “None” where a section
does not apply. Commit the file together with `.github/release-plan.json` on a release branch
created from the latest `origin/develop`, then review both in one PR directly
to `main`. A separate release-preparation PR into develop is not required. Merging a changed
non-null plan authorizes publication after main CI passes. The plan is retained
after publication; subsequent merges with unchanged intent do not republish.
Tooling-only PRs need no version record; the template is not a release.

Both preflight and publication read the version file from the exact source
commit. Untracked files, local edits and notes for a different version cannot
satisfy this requirement. Missing, empty or non-regular files stop the run.
Content quality and completeness remain part of human PR review.

Skills CI automatically previews main PRs. Its summary shows the full Release
body before publication: reviewed notes, included Skills, source commit, CI
link and (after the first release) a
diff link from the previous published stable Skills release. The target tag in
that diff link becomes available when the release creates it. PR previews use
a candidate commit and CI link; automatic publication rebuilds
from the final main commit and supplies its CI link. Both use the same reviewed
notes and body-generation logic. Review a fresh preview when the PR changes.

Do not add a duplicate CHANGELOG.md or rely on GitHub-generated PR lists for
migration guidance. Published versions and their notes are immutable; document
corrections in a new version. The script cannot enforce that reviewers approved
the prose; follow the repository's PR review process.
