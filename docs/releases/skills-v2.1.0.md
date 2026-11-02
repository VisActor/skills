# VisActor Skills 2.1.0

This release adds Chart Assistant to the unified VisActor Skills distribution.
Its only development source remains `vchart-editor/packages/chart-assistant`;
this repository distributes a verified snapshot rather than a second
implementation.

## New capabilities

- Install `chart-assistant` from this repository to create business charts and
  MBB-style analysis annotations, deliver editable Feishu chart cards, export
  transparent PNGs, or insert static charts before or after document paragraphs.
- The initial distribution preserves all 102 upstream runtime files and their
  Git file modes. PNG delivery and editable-card support are existing upstream
  capabilities carried into this release; this migration does not rewrite their
  runtime behavior.
- Repository-level provenance records the source commit, complete file inventory
  and `visactor-skill-content-v1` fingerprint. Copied-install regressions check
  local references, shipped examples and offline delivery contracts.

## Fixes

No chart-runtime behavior fixes are introduced by this distribution migration.
The other eight Skills retain their runtime contents from `skills-v2.0.0`.

## Breaking changes and migration

No existing Skill is removed or renamed, and chart data/configuration formats
are unchanged.

Users of the standalone `VisActor/chart-assistant-skill` distribution must
explicitly switch their installation source to receive future updates:

```bash
npx skills add VisActor/skills --skill chart-assistant
```

Use the installer's prompts or the client's update/reinstall action, then verify
that the installed Skill's source is `VisActor/skills`. Existing installed copies
do not switch sources automatically. The standalone repository retains its
historical files and compatibility entry point.

For manual imports, download `chart-assistant.zip` from this Release and keep its
complete contents. Use that individual Skill asset, not the repository's
`Source code (zip)` or only `SKILL.md`.

Development and behavior fixes continue in the authoritative upstream project.
See `docs/upstreams/chart-assistant.md` and its provenance record for the refresh
and verification process.

## Known limitations

- Chart Assistant's scripts require Node.js 18 or later. PNG delivery requires
  HTTPS access to the product rendering service; the Skill does not bundle a
  local chart renderer. Feishu document insertion requires authorized host tools
  or `lark-cli` and access to the target document. Editable cards also require the
  Chart Assistant ISV application. Generating or validating chart configuration
  alone does not require Feishu authorization.
- Existing upstream acceptance includes actual Doubao Work PNG visual review,
  positioned image insertion with idempotent replay, and editable-card
  edit/save/reopen/export checks. This migration adds deterministic copied-install
  coverage, not a new model trial or a new real Feishu browser acceptance run.
  Automated checks do not certify every generated chart's semantic or visual
  correctness; inspect actual outputs before delivery.
- This migration changes Chart Assistant's GitHub distribution only. AgentBuddy
  and Aily retain their existing listings and are independently updated by the
  upstream release process; a GitHub Release does not trigger their updates.
  A published ZIP does not prove that an installed client or market entry has
  updated; verify each channel's delivery and listing result separately.
