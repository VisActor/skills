# VisActor Skills 2.0.0

This release strengthens `person-poster` with evidence-bound authoring and
delivery checks. It is a major release because existing poster bundles require
migration before they can pass the current formal delivery workflow. Skill
installation names remain unchanged.

## New capabilities

- `person-poster` connects source evidence, verified values and displayed text
  and charts. A standard empty canvas and managed VChart runtime support new
  works without prescribing their composition.
- A unified review/export/verify/finish workflow records formal deliverables,
  diagnostic drafts and unresolved checks separately. Failed checks produce
  identified diagnostic output rather than a successful delivery receipt.
- Five curated person-poster examples include Marie Curie, Usain Bolt,
  Beethoven, Ada Lovelace and a fictional creator.
- `chart-storytelling` includes optional Codex display metadata and a default
  prompt highlighting chart scrollytelling and annotations.
- Bilingual installation guidance covers Claude Code, Codex, WorkBuddy and
  Doubao Work, with agent-assisted installation first.

## Fixes

- Poster contrast sampling uses native DPR 2, accounts for screenshot scale
  and crop origins, and normalizes glyph samples by CSS area. Insufficient
  samples remain failures with diagnostic crops; thresholds are not relaxed.
- Poster checks reject unbound displayed values, stale receipts, unsupported
  material-use claims and text occlusion. Source extraction supports HTML
  tables with colspan and explicit decimal syntax.
- `editorial-magazine` now displays as “杂志风图文”; its installation name remains
  `editorial-magazine`.

## Breaking changes and migration

Existing poster HTML remains readable, but old bundles and successful receipts
do not automatically satisfy the new formal delivery checks.

1. Preserve the original work. Do not run initialization over an existing
   bundle or rebuild a constrained edit from scratch.
2. Add `displayBindings` and a corresponding `display-map.json` connecting
   displayed values to verified records. Supply replayable source comparisons
   for the facts being delivered.
3. Review each bitmap's actual use and record `usageStatus`, `usageTerms` and
   supporting evidence. Do not mark unknown use as verified simply to pass.
4. Re-run review, export and verification with the updated Skill, then finish
   to obtain the current delivery list. Do not edit receipt version fields or
   reuse old successful review/contrast reports.

See the bundled person-poster manifest, evidence and display-binding references
for field definitions. Users who need the previous workflow can keep the
complete package from `skills-v1.2.0` while migrating. The other seven Skills do
not require this poster-bundle migration.

## Known limitations

- Automated regressions and browser smoke checks validate tooling behavior;
  they do not establish that every Agent-generated poster is correct or ready
  to publish. Actual source truth, image use, chart semantics and visual quality
  still require review.
- Recorded independent Agent trials have unresolved source/wording, material,
  readability and final-response issues. The full host/platform and task matrix
  has not been completed; this release does not claim marketplace acceptance
  or universal Agent-task success. See `docs/validation/person-poster-2026-10-28.md`
  and `docs/validation/person-poster-contrast-2026-10-29.md` in this snapshot.
- GitHub publication and AgentBuddy synchronization are separate. Downstream
  automation may update changed Skills after this stable Release is published;
  verify its sync receipt before treating the market entries as updated.
