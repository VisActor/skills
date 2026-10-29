# VisActor Skills 1.2.0

This release adds four independently installable Skills for business dashboards,
interactive maps and self-service chart editing. The runtime contents of the four
Skills released in 1.1.0 are unchanged.

## New capabilities

- `visactor-light-dashboard`: compact business dashboards for business overviews,
  metric monitoring and further analysis, with filters and linked views.
- `visactor-map2d-dashboard`: interactive 2D maps linking geographic differences,
  events, metrics and records.
- `visactor-chart-editor`: self-service chart editing with field drag-and-drop,
  chart switching and live data exploration.
- `visactor-map3d-dashboard`: 3D globe dashboards for regional analysis and linked
  evidence when a globe or three-dimensional map is required.
- Each new Skill includes its own instructions, references and templates. Reviewed
  single-page examples are available under `examples/<skill-name>/`.
- Install any new Skill with `npx skills add VisActor/skills --skill <skill-name>`,
  or download its complete ZIP from this Release.

## Fixes

- The new Skills use an HTML parser for JSON script blocks in their optional
  server runtimes and include the HTML and URL handling fixes from develop.
- Repository installation instructions cover all eight maintained Skills.

## Breaking changes and migration

None. Existing Skills retain their names and runtime contents. The four new
Skills use the `visactor-` prefix in GitHub installation commands.

## Known limitations

- Skill instructions depend on the host agent for execution. Showcase examples
  are reviewed outputs, not evidence of automated Agent task coverage.
- Optional live-data server runtimes require their own Node.js environment and
  data-source configuration; these are separate from installing the Skill.
- GitHub publication and AgentBuddy synchronization are separate steps.
  AgentBuddy retains its existing names (`light-dashboard`, `map2d-dashboard`,
  `chart-editor`, `map3d-dashboard`) through explicit downstream mappings;
  market versions are independent of this repository tag. Check the downstream
  sync receipt before treating a GitHub Release as a market update.
