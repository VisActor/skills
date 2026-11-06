# VisActor Skills 2.3.0

This release adds native KPI cards and business composition recipes to Chart
Assistant and improves stage continuity in creative data stories.

## New capabilities

- Chart Assistant supports single and multiple native KPI cards with values,
  units, supplied year-over-year and period-over-period changes, and completion
  rates. It documents responsive columns, group and individual card styles,
  direction colors, and character-level styles.
- Business composition recipes cover monthly KPIs, performance overviews,
  structure and source analysis, cohort retention, time references and event
  alignment, conversion and gap scenarios, metric small multiples, and ranking
  changes. Complete examples state units, denominators, observation windows,
  and data definitions.
- The Chart Assistant workflow reads references as needed and documents existing
  card readback, manual style preservation, source synchronization, and delivery
  verification.
- `creative-data-storytelling` adds an optional stage-exit layout helper and a
  sequence comparison example that switches between calendar dates and elapsed
  time while preserving each observation's identity and width.

## Fixes

- New editable cards fit their content once and then retain fixed dimensions by
  default. Explicit dimensions and continuous automatic sizing remain available;
  existing cards preserve their sizing state.
- `creative-data-storytelling` keeps the final graphic visible while the last
  paragraph is read. Its guidance now separates correctness, readability, and
  working interactions from narrative quality, and clarifies how to check
  continuity and layout using the actual visible content.

## Breaking changes and migration

None. Update the installed Skill to receive the new instructions, scripts, and
examples:

```bash
npx skills add VisActor/skills --skill chart-assistant
```

For manual import, download the individual Skill ZIP from this Release and
retain its complete contents. Existing installed copies do not update
automatically.

## Known limitations

- Native KPI and card sizing behavior requires a Chart Assistant host supporting
  the corresponding templates and protocol. Interaction features depend on the
  host. Business derived values are supplied by the input; the Skill does not
  calculate or infer them automatically.
- Chart Assistant scripts require Node.js 18 or later. PNG rendering requires
  HTTPS access; document insertion needs authorized host tools or `lark-cli`.
  Editable cards require the Chart Assistant ISV application.
- Creative data stories still require browser review of the delivered layout
  and reading path; automated checks do not assess narrative or visual quality.
  The optional stage-exit helper requires a sticky stage and a spacer in normal
  document flow, and does not intercept scrolling or force readers to wait.
- Distribution checks cover independent installation, references, shipped
  examples, offline delivery contracts, and complete packages. Fresh model and
  production-host acceptance were not repeated for this publication. Review
  generated charts for data accuracy, layout, and the requested behavior before
  delivery.
