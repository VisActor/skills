# VisActor Skills 1.1.0

This release adds `person-poster`. The runtime contents of `chart-storytelling`,
`editorial-magazine` and `life-chronicle` are unchanged from 1.0.0.

## New capabilities

- Create person-led data posters with native VChart specifications, editable
  HTML and high-resolution PNG output.
- Prepare subject images, check runtime dependencies, inspect layout, review
  chart evidence and validate the delivered bundle using bundled scripts.
- Choose HTML-only delivery with `manifest.delivery: "html"`; the default
  `html+png` delivery requires the final PNG.
- Install with `npx skills add VisActor/skills --skill person-poster`, or use
  the complete `person-poster.zip` from this Release.

## Fixes

- Person-poster validation detects text clipped by ancestor containers and
  reports rendering or export failures instead of accepting incomplete output.
- Dimension synchronization avoids increasing the canvas on repeated runs
  with unchanged content and rejects unsupported CSS dimension expressions.

## Breaking changes and migration

No changes are required for users of the three Skills released in 1.0.0.
For earlier person-poster prototypes using `charts[].schema`, convert each
chart to a native VChart `charts[].spec` and render it again; renaming a file
extension is not sufficient. PNG remains the default delivery format.

## Known limitations

- Person-poster requires Python 3.10+, Pillow and Python Playwright with
  Chromium. Chart rendering uses VChart 2.1.7 from its public CDN or a sourced
  local copy. Follow the Skill's environment instructions for setup.
- Image retrieval, generation and background removal depend on host tools;
  installing the Skill does not provide those services.
- Deterministic checks and browser smoke cover technical behavior, not factual
  accuracy or visual quality. The fixed Marie Curie task has one recorded
  same-session generation check, not an independent blind evaluation.
- Complex rotation, clip-path and mask effects still require visual review.
- AgentBuddy synchronization is a separate downstream workflow. This GitHub
  release does not itself create or update AgentBuddy entries.
