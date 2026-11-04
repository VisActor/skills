# Debug Skills locally

Use a mature agent such as Codex or Claude Code for Skill development. The host provides model access, tools and conversation management. Other compatible agents, including 豆包工作, can use their own Skill installation flow; dedicated setup instructions here cover Codex and Claude Code.

## Create a workspace

Start from this repository's root. Keep each experiment in its own ignored `.cache/skill-dev/<skill-name>/<run-name>/` directory:

```bash
mkdir -p .cache/skill-dev/chart-storytelling
debug_workspace="$(mktemp -d "$PWD/.cache/skill-dev/chart-storytelling/run.XXXXXX")"
mkdir -p "$debug_workspace/outputs" "$debug_workspace/screenshots" "$debug_workspace/logs"
cp -R cases/chart-storytelling/story-retention-html/inputs "$debug_workspace/inputs"
cp cases/chart-storytelling/story-retention-html/prompt.md "$debug_workspace/prompt.md"
```

For a fresh run of a [published example](../examples/README.md), copy the prompt and input files identified in its README into the same workspace structure. Give the agent only the task and inputs. Keep the original result and any acceptance criteria for review after the run. For your own task, supply its prompt and source files the same way.

Choose one host, installed and authenticated. For **Codex**:

```bash
mkdir -p "$debug_workspace/.agents/skills"
cp -R skills/chart-storytelling "$debug_workspace/.agents/skills/"
cd "$debug_workspace"
codex
```

For **Claude Code**, instead run this from the repository root after the shared setup:

```bash
mkdir -p "$debug_workspace/.claude/skills"
cp -R skills/chart-storytelling "$debug_workspace/.claude/skills/"
cd "$debug_workspace"
claude
```

You can open the workspace in the corresponding app. Install the complete Skill, including references, templates and scripts. See the [Codex Skill documentation](https://developers.openai.com/codex/skills/) and [Claude Code Skill documentation](https://code.claude.com/docs/en/skills) for host-specific discovery.

Ask the agent to use `chart-storytelling` to execute `prompt.md`, read inputs from `inputs/` and write generated files to `outputs/`. For another Skill, change the Skill name and supply its task and assets. See the root [runtime requirements](../README.md#install); install any required packages in a local environment under `.cache/`.

## Iterate and keep evidence

- Edit source instructions and scripts in `skills/<skill-name>/`. Refresh the installed copy before each retest, or create a fresh workspace. Changing only the installed copy will not update the repository source.
- When a task requires transforming its inputs, work on the workspace copies.
- Save generated artifacts under `outputs/`, screenshots under `screenshots/` and available session/tool logs under `logs/`. Host logs are not collected automatically by this repository; export them where supported and note missing evidence.
- Use `notes.md` to record the Skill commit and any local changes, host/model, task outcome, checks, failures and manual review. Keep a Skill snapshot or diff with the run when reproducing an uncommitted version.
- Open the output in a browser and exercise required interactions. For a fixed task, apply its acceptance criteria after generation. A rendered page alone does not establish data or visual correctness.
- `.cache/` is ignored by Git. Keep credentials and private material out of shared reports. Clean only workspaces you own; do not delete another session's files automatically.

Keep a reviewed example with its prompt and inputs in `examples/`. Create a [fixed task](../cases/README.md) when it needs its own acceptance criteria. Put deterministic regressions in `tests/`. Keep raw logs, draft outputs and experimental screenshots local.

## Automated checks

Use the [contribution guide](../CONTRIBUTING.md) to select script regressions and [browser smoke](../tests/browser/cases/README.md). These checks run without a model. Actual task execution and review use your chosen agent; there is no repository model API configuration or batch agent runner.
