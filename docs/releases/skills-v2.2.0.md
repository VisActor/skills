# VisActor Skills 2.2.0

This release adds two Skills for interactive data storytelling, with runtime
helpers, local preview tools and examples with prompts, inputs and results.

## New capabilities

- `creative-data-storytelling` turns data, text archives and research findings
  into interactive visual stories. It guides research, narrative design,
  visualization, assets and implementation around a continuous scrolling stage.
- `unit-data-storytelling` builds stories from dots, icons, images or text units
  that represent individual records or fixed quantities. It supports grouping,
  comparison, composition and record sequences, including particle arrangements
  that regroup into data views as readers progress.
- Both Skills ship self-contained runtime modules, implementation references
  and local preview scripts. The example gallery includes historical measures,
  CO2 emissions, iPhone prices, Hong Kong temperatures, Minecraft players and
  NBA data.

Install either Skill with your agent or run:

```bash
npx skills add VisActor/skills --skill creative-data-storytelling
npx skills add VisActor/skills --skill unit-data-storytelling
```

For manual import, download the corresponding Skill ZIP from this Release.
Keep its complete contents together, including references, scripts and assets.

## Fixes

- Local preview regression coverage verifies that directory indexes stay inside
  the previewed artifact and that the new Skills can run from copied installs.
- Contributor documentation now separates ordinary contributions from release
  maintenance and provides checks for the two new Skills.

## Breaking changes and migration

None. Existing installations can continue using their selected Skill. Install
either new Skill separately to use its storytelling workflow.

## Known limitations

- Both new Skills target desktop browsers. Mobile layouts and reduced-motion
  adaptations require task-specific implementation and review.
- Image search and generation depend on tools available in the host agent.
  Data sources and external assets must be accessible in that environment.
- Automated coverage checks runtime mechanisms, local preview and independent
  installation. Fixed Agent acceptance tasks and automated browser smoke for
  these two Skills are not yet included. Review generated stories for evidence,
  readability and interactions in the target browser.
