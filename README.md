# VisActor Skills

[English](README.md) | [简体中文](README.zh-CN.md)

Agent skills for the VisActor visualization ecosystem. Create data stories, dashboards, map experiences, chart editors and visual posters with independently installable Skills. VChart and VTable Skills are maintained in their respective library repositories.

## Skills

### Maintained in this repository

| Skill | Tasks |
| --- | --- |
| [chart-storytelling](skills/chart-storytelling/SKILL.md) | Analysis reports, business briefings and data features, with chart scrollytelling and annotations, delivered as HTML stories or Web-PPT |
| [editorial-magazine](skills/editorial-magazine/SKILL.md) | Magazine-style visual posts (杂志风图文): HTML / PNG series for news, biographies, outfits, travel, chronological stories and explainers |
| [life-chronicle](skills/life-chronicle/SKILL.md) | Biography posters with photo walls, center grids, photo rings and editable timelines |
| [person-poster](skills/person-poster/SKILL.md) | Person-led data posters with native VChart, editable HTML and high-resolution PNG |
| [visactor-light-dashboard](skills/visactor-light-dashboard/SKILL.md) | Compact business dashboards with metrics, filters and further analysis |
| [visactor-map2d-dashboard](skills/visactor-map2d-dashboard/SKILL.md) | Interactive 2D map dashboards linking regions, metrics and records |
| [visactor-chart-editor](skills/visactor-chart-editor/SKILL.md) | Self-service chart editing with field drag-and-drop and live data exploration |
| [visactor-map3d-dashboard](skills/visactor-map3d-dashboard/SKILL.md) | 3D globe dashboards for regional analysis and linked evidence |

### Related VisActor Skills

Chart and table Skills are maintained in their library repositories. Install them directly from the source:

| Skill | Tasks | Repository |
| --- | --- | --- |
| [VChart Skill](https://github.com/VisActor/VChart/blob/develop/skills/vchart-development-assistant/SKILL.md) | Chart generation, diagnosis, image replication and React integration | [VisActor/VChart](https://github.com/VisActor/VChart) |
| [VTable Skill](https://github.com/VisActor/VTable/blob/develop/skills/vtable-development-assistant/SKILL.md) | List tables, pivot tables/charts, interactions and diagnosis | [VisActor/VTable](https://github.com/VisActor/VTable) |

Each skill includes its instructions, local references, templates and scripts. No separate VisActor CLI, MCP server, model key or hosted VisActor API is required. The host agent supplies the model.

**VisActor Skills work in Claude Code, Codex, WorkBuddy, Doubao Work and other tools that support Agent Skills.** The host agent provides model access and tool execution. Ask your agent to help install a Skill through conversation, use the command line, or import a package manually.

## Install

### Recommended: ask your agent to install

Start a conversation in your agent tool and paste this prompt:

```text
Please install the chart-storytelling Skill:
https://github.com/VisActor/skills/tree/main/skills/chart-storytelling

Download the complete Skill directory, including SKILL.md, references,
templates and scripts. Install it using a method supported by this app,
then check that the installed Skill can be discovered and invoked.
Tell me if any confirmation or import steps require my help.
```

For another Skill in this repository, replace the name and the final `chart-storytelling` segment of the GitHub URL with a name from the “Maintained in this repository” list above. For example, use [visactor-light-dashboard](https://github.com/VisActor/skills/tree/main/skills/visactor-light-dashboard) for business dashboards. Once installed, start a new task and specify the Skill you want to use.

If your agent cannot access GitHub or complete installation, use the manual import instructions below.

### Command-line installation: Codex / Claude Code

Run these commands in the project where you want to use the Skills:

```bash
npx skills add VisActor/skills --skill chart-storytelling
npx skills add VisActor/skills --skill editorial-magazine
npx skills add VisActor/skills --skill life-chronicle
npx skills add VisActor/skills --skill person-poster
npx skills add VisActor/skills --skill visactor-light-dashboard
npx skills add VisActor/skills --skill visactor-map2d-dashboard
npx skills add VisActor/skills --skill visactor-chart-editor
npx skills add VisActor/skills --skill visactor-map3d-dashboard
```

For chart and table tasks, install the related Skills from their owning repositories:

```bash
npx skills add VisActor/VChart --skill vchart-development-assistant
npx skills add VisActor/VTable --skill vtable-development-assistant
```

If you previously installed `data-storytelling`, remove that installed copy and install `chart-storytelling` to use the renamed Skill.

Follow the installer's prompts to select Codex or Claude Code. You can install each Skill independently. More installation options are documented in the [Skills CLI reference](https://github.com/vercel-labs/skills#usage).

### Manual import: WorkBuddy / Doubao Work

Open [GitHub Releases](https://github.com/VisActor/skills/releases), choose the latest stable `skills-v*` release, and download the desired Skill ZIP from **Assets**, such as `chart-storytelling.zip` or `visactor-light-dashboard.zip`. Each ZIP contains one complete Skill. Choose the individual Skill asset, rather than the repository's **Source code (zip)** or just `SKILL.md`.

This installation path does not require `npx`. If the app asks for a folder, extract the ZIP into a folder with the same name and select the folder directly containing `SKILL.md`. Keep all bundled references, templates and scripts.

#### WorkBuddy

1. Open **专家·技能·连接器 → 技能** (Experts / Skills / Connectors → Skills) in the sidebar.
2. Choose **添加技能 → 上传技能** (Add Skill → Upload Skill), select the downloaded Skill package, and follow the import prompts.
3. Confirm that the Skill is enabled under **已安装** (Installed), then start a task with the Skill name and your data.

See the [official WorkBuddy Skills guide](https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Skills-Market) for the UI flow.

#### Doubao Work (豆包工作)

1. Open **技能·连接器·伙伴** (Skills / Connectors / Partners) and enter Skill management.
2. Use the local Skill import entry (**上传技能**, Upload Skill). Select the ZIP or the complete extracted Skill folder as requested by the file picker, then finish importing.
3. Start a work task, select the Skill through the Skill picker or name it explicitly in your request, and provide your task data.

Local Skill imports and explicit Skill selection are described in the [official Feishu feature overview](https://www.feishu.cn/content/article/7677519271848610746). Entry labels may differ between app versions; follow the current UI.

After importing, try: “Use chart-storytelling. Read its SKILL.md, confirm that its scripts and templates are accessible, and check the current environment against its runtime requirements.” Once available, provide your actual task. To update, download the Skill package from a newer stable Release and update the installed copy through the app's Skill management UI.

### Runtime requirements

- A host agent with filesystem/shell tools and its own model access; command-line installation also requires Node.js and npm.
- A browser and network access to preview generated HTML and load external assets.

| Skill | Runtime requirements |
| --- | --- |
| chart-storytelling | Python 3.10+ (standard library) and Node.js for JavaScript checks; pinned VSeed, VChart, VTable and GSAP load from unpkg |
| editorial-magazine | Python 3.10+, dependencies in its [requirements.txt](skills/editorial-magazine/requirements.txt), and Chromium/Chrome for PNG export; font CDN with system fallbacks |
| life-chronicle | Python 3.10+, dependencies in its [requirements.txt](skills/life-chronicle/requirements.txt), and Chromium/Chrome for PNG export; pinned VInfo and font CDN, see [environment setup](skills/life-chronicle/references/environment.md) |
| person-poster | Python 3.10+, Pillow, Python Playwright/Chromium; public VChart 2.1.7 CDN or a sourced local copy; see [requirements.txt](skills/person-poster/scripts/requirements.txt) and [environment setup](skills/person-poster/references/environment.md) for POSIX/PowerShell installation and capability limits |

Image search, generation and cutout capabilities come from the host; follow the selected Skill's asset requirements. Magazine templates contain placeholders to replace before delivery. See the owning repositories for VChart/VTable Skill requirements.

Person Poster uses `poster_workflow.py` for init, source replay, build, layout review and verified delivery. Formal delivery requires display bindings, saved source comparisons and per-bitmap usage evidence. Reading and contrast checks use the rendered page; failed output stays a labeled diagnostic in `draft/`. Legacy bundles need migration and re-review: see the [display contract](skills/person-poster/references/display-bindings.md), [evidence guide](skills/person-poster/references/evidence-checks.md) and [rendering guide](skills/person-poster/references/render-and-acceptance.md). These checks do not certify source truth, image rights, visual quality or the host’s final reply.

## Use

After installation, ask your agent to use the selected Skill with your data. For example:

- “Use chart-storytelling to explain retention changes in this CSV to our growth lead as a shareable HTML story.”
- “Use editorial-magazine to turn this article and its sources into an editable HTML and PNG image series.”
- “Use life-chronicle to create a biography poster from these sourced events and photos, with editable timeline text.”

Data-storytelling uses the current agent to author VSeed configurations and local scripts to assemble the output; it needs no hosted chart generation service. Images use host capabilities or the declared fallback. Web-PPT is a browser presentation, not a `.pptx` file.

Generated JavaScript/HTML is executable code. Preview your own or reviewed artifacts locally; the test browser is not a sandbox for arbitrary untrusted submissions.

## Examples

The [example gallery](examples/README.md) includes a CO₂ scrolling story, a Las Vegas Web-PPT, six editorial-magazine collections, four life-chronicle collections and five person-poster cases (including a real-photo cutout, HTML-only delivery and explicitly fictional AI artwork). Each case links its prompts and results and explains the available inputs and reproduction limits.

## Development and maintenance

This section is for contributors editing Skills or running local tests. The default branch, `main`, contains the user-facing stable version. Day-to-day development and contribution PRs use `develop`; release preparation is committed on a branch from the latest `develop` and reviewed in one PR directly to `main`. Start with [CONTRIBUTING.md](CONTRIBUTING.md).

### Repository layout

| Path | Contents |
| --- | --- |
| `skills/<skill-name>/` | Independently installable runtime: `SKILL.md`, references, templates/assets and scripts |
| `tests/<skill_name>/` | Skill-specific deterministic Python regressions; hyphens become underscores for Python imports |
| `tests/test_*` | Shared tooling/installation checks and Node.js browser/Story integration tests |
| `examples/<skill-name>/<case-name>/` | Curated examples with prompts, inputs, results and previews |
| `cases/<skill-name>/<case-name>/` | Fixed Agent prompts, inputs and acceptance guidance |
| `tests/browser/cases/<skill-name>/<case-id>/` | Fixed browser cases: configuration, inputs and expectations |
| `tests/browser/scripts/` | Browser smoke builds and checks; dependencies are pinned in `tests/browser/` |
| `.cache/skill-dev/<skill-name>/<run-name>/` | Ignored local workspaces, outputs, screenshots and logs |
| `docs/` | Contributor references; `docs/migration/` contains historical migration records |

Keep each runtime Skill self-contained. It must not depend on `tests/`, `cases/`, `examples/` or another Skill's local directory. See [contribution conventions](CONTRIBUTING.md#adding-or-updating-a-skill) for adding Skills and selecting checks.

### Install from a local checkout

From the root of your local repository, install the working copy of a Skill:

```bash
npx skills add ./skills/chart-storytelling
npx skills add ./skills/editorial-magazine
npx skills add ./skills/life-chronicle
npx skills add ./skills/person-poster
```

Alternatively, copy the complete Skill directory into your agent's skill directory, including its references, templates and scripts. Do not copy only `SKILL.md`. See the [local debugging guide](docs/debugging.md) for Codex and Claude Code workspace setup. Refresh the installed copy after changing a Skill before retesting.

### Regression tests

The Python maintenance environment requires Python 3.12+ and [uv](https://docs.astral.sh/uv/):

```bash
uv sync --locked
uv run pytest tests -q
uv run ruff check skills tests
```

Fixed browser cases live under [tests/browser/cases/](tests/browser/cases/README.md), with configuration, inputs and acceptance criteria together. After the browser setup in that guide, run `uv run python tests/browser/scripts/smoke.py`, or select `--skill chart-storytelling` / `--case story-ppt`. These checks do not call a model.

### Skill task debugging

Use Codex, Claude Code or another compatible mature agent to run a [fixed task](cases/README.md) or your own prompt and inputs. Follow [local debugging](docs/debugging.md) to prepare an ignored `.cache/skill-dev/<skill-name>/<run-name>/` workspace and retain artifacts, screenshots and available logs. This repository does not provide a model API harness or unified agent runner.

Fixed tasks cover chart-storytelling and person-poster. Browser smoke covers story HTML/Web-PPT and poster chart examples (including category colors, label bounds and missing values versus real zero), HTML-only delivery with and without charts, PNG delivery without charts, ancestor clipping rejection and failed export. Dense poster chart fixtures explicitly expect a failed 600px reading baseline while testing API/export behavior; separate Python browser regressions cover DOM/chart text at 600px reading width. Smoke also covers managed chart startup, display bindings, unbound text, occlusion and full-draft reading failures. The locked-layout Agent task checks failure handling; actual host results are recorded separately and do not certify listing readiness. Editorial-magazine and life-chronicle have script regressions, but no fixed tasks or browser smoke yet. Review generated results for data accuracy, task requirements and interactions; different correct visual designs are acceptable. Agent tasks are not run in CI.

Current Mac host results and open limitations: [Person Poster validation record](docs/validation/person-poster-2026-10-28.md).

## Versioning

Skills maintained here are versioned together at repository level. Each formal Skills release is identified by a Git tag covering the Skill instructions, references, templates and scripts. VChart and VTable Skill versions are managed by their respective repositories.

Ordinary edits are identified by Git commits; each Skill change does not require a release tag.

Formal Skills releases use `skills-vMAJOR.MINOR.PATCH`: patch versions contain compatible fixes, minor versions add Skills or compatible capabilities, and major versions cover removals, renames or incompatible usage changes.

Default installations follow `main`, so they can receive changes before a formal release. Maintainers declare release intent in `.github/release-plan.json`. Main PRs automatically preview changed release plans; merging a changed non-null version authorizes automatic publication after main CI passes. Null or unchanged plans do not publish. The plan is retained after publication, so later merges do not republish it. See the [release procedure](CONTRIBUTING.md#publishing-skills) and [published releases](https://github.com/VisActor/skills/releases).

Each formal Skills Release includes `skills-manifest.json` and one ZIP per Skill. Distributors can use the manifest's per-Skill content fingerprints to identify changes independently of repository versions. See the [artifact contract](docs/release-artifacts.md).

Use a release tag or commit SHA to identify the version when reporting an issue or reproducing a result; branch contents can change. Dependency versions such as VTable `1.26.8` identify the underlying library, not the Skill release. Historical VMind SDK tags remain unchanged and belong to the earlier SDK.

## Earlier VMind versions

The previous VMind SDK is no longer maintained. Its code and documentation remain in [historical releases](https://github.com/VisActor/skills/releases).

[MIT license](LICENSE)
