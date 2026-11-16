# VisActor Skills 2.4.0

This release expands `creative-data-storytelling` with reusable visual examples,
shared reading transitions and optional single-file HTML delivery.

## New capabilities

- A searchable example catalogue connects narrative questions to independent
  previews, design explanations and implementation entry points. Chinese and
  English keywords help locate examples without reading every source file.
- New examples cover individual-to-group comparisons, overlapping constraints,
  object fit, record composition, cohort flows and several ways to introduce a
  story before its first data finding. Each example can be adapted independently;
  it does not prescribe the structure of an entire story.
- Shared reading-stage wiring coordinates scrolling, graphic transitions and
  prose changes. Optional inspection helpers expose rendered stage state for
  focused browser checks.
- An optional `scripts/pack.mjs` command bundles supported local HTML, scripts,
  styles, images, fonts and static data into one HTML file while preserving the
  editable source files.

## Fixes

- Prose and graphics can transition together while retaining control over when
  evidence and conclusions appear. Interrupted transitions and reverse reading
  continue from the current state.
- Example calculations and labels share their data and denominators, including
  cohort comparisons and object-fit examples with replacement datasets.
- Single-file packing retains supported SVG image references without rewriting
  ordinary navigation links. Missing, external or ambiguous resources fail with
  an actionable error instead of producing an incomplete file.
- Example inspection rejects malformed explanation markup instead of returning
  truncated or misleading design notes.
- Chart Assistant now declares its runtime and host requirements in Skill
  compatibility metadata. This documentation change was already on `main` but
  had not been included in a formal release; chart behavior is unchanged.

## Breaking changes and migration

The Skill name and installation command are unchanged. Replace the complete
installed Skill so its instructions, examples and runtime modules stay aligned:

```bash
npx skills add VisActor/skills --skill creative-data-storytelling
```

For a pinned snapshot, install from this release tag or download the complete
`creative-data-storytelling.zip` attachment. Existing installations do not update
automatically.

Bundled example source files have moved into individual example directories, and
design references have been consolidated. These are internal example paths, not
the Skill installation interface. If a work-in-progress imports files directly
from an older installed Skill, retain its copied resources or update those
imports using the new catalogue and implementation index. Existing standalone
stories with their own copied resources do not require regeneration.

## Known limitations

- The Skill targets desktop browser stories. Check the delivered layout, data
  semantics, forward and reverse reading, and interactions in an actual browser.
  Automated regressions do not establish narrative or visual quality.
- First-time single-file packing requires Node.js, npm and network access to
  install locked tool dependencies into a user cache. Subsequent runs can reuse
  that cache. Packing does not modify the installed Skill.
- The packer rejects unsupported inputs, including remote dependencies,
  unresolved dynamic resource paths, `srcset`, audio/video, iframes and multiple
  module entry points. Keep directory delivery for these cases. Verify the
  packed result separately; successful packing alone does not prove offline
  browser behavior.
- The source update includes recorded browser checks of examples and reading
  transitions. Fresh independent Agent generation and production-host acceptance
  were not repeated for this release preparation.
