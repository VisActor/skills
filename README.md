# VisActor Skills

[English](README.md) | [简体中文](README.zh-CN.md)

VisActor Skills provides chart, dashboard, data story and poster tools for Claude Code, Codex, WorkBuddy, Doubao Work and other agents that support Skills.

[Website and examples](https://visactor.com/skills) · [Releases](https://github.com/VisActor/skills/releases) · [Contributing](CONTRIBUTING.md)

## Skills

| Skill | Tasks |
| --- | --- |
| [chart-assistant](skills/chart-assistant/SKILL.md) | Business charts, MBB analysis annotations, editable Feishu cards, transparent PNGs and document image insertion |
| [chart-storytelling](skills/chart-storytelling/SKILL.md) | Analysis reports, business briefings and data features, with chart scrollytelling and annotations, delivered as HTML stories or Web-PPT |
| [unit-data-storytelling](skills/unit-data-storytelling/SKILL.md) | Interactive stories that use dots or icons to represent records or fixed quantities and show how groups compare and change |
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

Each Skill can be installed separately and includes its instructions, references and scripts. The agent provides model access and runs the tools.

## Install

### Install through your agent (recommended)

Send your agent the Skill URL and an installation request:

```text
Please install the chart-storytelling Skill:
https://github.com/VisActor/skills/tree/main/skills/chart-storytelling

Download the complete Skill directory, including SKILL.md, references,
templates and scripts. Install it using a method supported by this app,
then check that the installed Skill can be discovered and invoked.
Tell me if any confirmation or import steps require my help.
```

For another Skill, open its entry in the table above and use the URL of the folder containing `SKILL.md`. After installation, start a new task and name the Skill you want to use.

If your agent cannot access GitHub or complete installation, use the manual import instructions below.

### Command-line installation: Codex / Claude Code

Run the command for the Skill you need in your project directory:

```bash
npx skills add VisActor/skills --skill chart-assistant
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

If the app asks for a folder, extract the ZIP and select the folder containing `SKILL.md`. Keep all bundled files.

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

To update a manually imported Skill, download its package from a newer Release and replace the installed copy through the app’s Skill management page.

### Runtime requirements

- A host agent with filesystem/shell tools and its own model access; command-line installation also requires Node.js and npm.
- A browser and network access to preview generated HTML and load external assets.

| Skill | Runtime requirements |
| --- | --- |
| chart-assistant | Node.js 18+; HTTPS access for PNGs; authorized host tools or lark-cli for document insertion; Chart Assistant ISV app for editable cards. DSL generation/validation needs no Feishu authorization or local renderer |
| chart-storytelling | Python 3.10+ (standard library) and Node.js for JavaScript checks; pinned VSeed, VChart, VTable and GSAP load from unpkg |
| unit-data-storytelling | Modern browser with ES modules; Node.js for module checks; optional Python 3.9+ (standard library) for the bundled preview/audit tool. Bundled examples use local assets without a required CDN or chart library |
| editorial-magazine | Python 3.10+, dependencies in its [requirements.txt](skills/editorial-magazine/requirements.txt), and Chromium/Chrome for PNG export; font CDN with system fallbacks |
| life-chronicle | Python 3.10+, dependencies in its [requirements.txt](skills/life-chronicle/requirements.txt), and Chromium/Chrome for PNG export; pinned VInfo and font CDN, see [environment setup](skills/life-chronicle/references/environment.md) |
| person-poster | Python 3.10+, Pillow, Python Playwright/Chromium; public VChart 2.1.7 CDN or a sourced local copy; see [requirements.txt](skills/person-poster/scripts/requirements.txt) and [environment setup](skills/person-poster/references/environment.md) for POSIX/PowerShell installation and capability limits |

Image search, generation and cutout capabilities come from the host; follow the selected Skill's asset requirements. Magazine templates contain placeholders to replace before delivery. See the owning repositories for VChart/VTable Skill requirements.

Person Poster checks data bindings, source comparisons and image usage records before delivery. Older work bundles need migration; see the [display contract](skills/person-poster/references/display-bindings.md), [evidence guide](skills/person-poster/references/evidence-checks.md) and [rendering guide](skills/person-poster/references/render-and-acceptance.md). These checks do not replace source verification or visual review.

## Use

After installation, ask your agent to use the selected Skill with your data. For example:

- “Use chart-storytelling to explain retention changes in this CSV to our growth lead as a shareable HTML story.”
- “Use editorial-magazine to turn this article and its sources into an editable HTML and PNG image series.”
- “Use life-chronicle to create a biography poster from these sourced events and photos, with editable timeline text.”

chart-storytelling generates HTML stories and Web-PPT with local scripts. Web-PPT runs in a browser; it is not a `.pptx` file. Image generation requires tools provided by the agent.

Generated JavaScript/HTML is executable code. Preview your own or reviewed artifacts locally; the test browser is not a sandbox for arbitrary untrusted submissions.

## Examples

The [example gallery](examples/README.md) includes data stories, Web-PPT, magazine layouts and posters, with prompts, inputs and results.

## Development and maintenance

Use `develop` for contributions and `main` for stable releases. See the [contribution guide](CONTRIBUTING.md) for development and release procedures.

### Repository layout

| Path | Contents |
| --- | --- |
| `skills/<skill-name>/` | Independently installable runtime: `SKILL.md`, references, templates/assets and scripts |
| `tests/<skill_name>/` | Skill-specific deterministic regressions; hyphens become underscores for Python imports |
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
npx skills add ./skills/unit-data-storytelling
npx skills add ./skills/editorial-magazine
npx skills add ./skills/life-chronicle
npx skills add ./skills/person-poster
```

Alternatively, copy the complete Skill directory into your agent's skill directory, including its references, templates and scripts. Do not copy only `SKILL.md`. See the [local debugging guide](docs/debugging.md) for Codex and Claude Code workspace setup. Refresh the installed copy after changing a Skill before retesting.

### Regression tests

The Python maintenance environment requires Python 3.12+ and [uv](https://docs.astral.sh/uv/):

```bash
uv sync --locked
uv run pytest tests -q -m "not poster_browser"
uv run ruff check skills tests
```

Fixed browser cases live under [tests/browser/cases/](tests/browser/cases/README.md), with configuration, inputs and acceptance criteria together. After the browser setup in that guide, run `uv run python tests/browser/scripts/smoke.py`, or select `--skill chart-storytelling` / `--case story-ppt`. These checks do not call a model.

### Agent testing

Run a [fixed task](cases/README.md) or your own prompt and data in Codex, Claude Code or another agent. Keep outputs, screenshots and logs in an ignored local workspace; see [local debugging](docs/debugging.md). Agent tasks do not run in CI.

Fixed tasks currently cover chart-storytelling and person-poster. Browser smoke covers stories, Web-PPT and person posters; detailed cases are in the [browser test guide](tests/browser/cases/README.md). Editorial-magazine, life-chronicle and chart-assistant have script regressions but no fixed Agent tasks or real-host browser smoke in this repository.

Check generated results for data accuracy, readability and interactions. Automated tests do not establish the quality of an Agent-generated work. Person Poster test results and remaining limitations are recorded in the [validation notes](docs/validation/person-poster-2026-10-28.md).

## Versioning

Skills in this repository share release tags in the form `skills-vMAJOR.MINOR.PATCH`. Patch versions contain compatible fixes; minor versions add Skills or capabilities; major versions cover incompatible changes. VChart and VTable Skills follow their own repositories’ versions.

Default installations follow `main`. To reproduce an issue, record the installed tag or commit SHA. Each [Release](https://github.com/VisActor/skills/releases) includes one ZIP per Skill and a `skills-manifest.json` with content fingerprints; see the [artifact format](docs/release-artifacts.md).

Maintainers declare the next version in `.github/release-plan.json`. Release PRs run an automatic preview; merging an approved plan into `main` triggers publication after CI passes. See the [release procedure](CONTRIBUTING.md#publishing-skills).

## Earlier VMind versions

The previous VMind SDK is no longer maintained. Its code and documentation remain in [historical releases](https://github.com/VisActor/skills/releases).

[MIT license](LICENSE)
