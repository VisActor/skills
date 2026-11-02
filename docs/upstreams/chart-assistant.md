# Chart Assistant upstream distribution

`vchart-editor/packages/chart-assistant` is the only development source. This repository owns the public distribution and unified release process, not a second implementation. A runtime change found here must be fixed upstream and re-exported after the upstream MR merges. VChart/VTable continue to use their existing upstream links; this controlled snapshot is an explicit exception.

## Refresh a committed snapshot

1. Fetch both repositories. Create a contribution branch from the latest `origin/develop` in `VisActor/skills`. Preserve released main history when integrating branches; do not roll back release plans or notes.
2. In the authoritative `vchart-editor` checkout, use its `scripts/chart-assistant/sync-public-skill.mjs --target-repo <absolute VisActor/skills checkout> --ref <merged upstream commit>`. The source commit must be an ancestor of the fetched upstream `origin/master`. The tool does not read uncommitted runtime bytes, commit, push or publish.
3. Review `skills/chart-assistant/` and `docs/upstreams/chart-assistant.json`. The latter records upstream repository/path/commit, whitelist hash, all file bytes/modes and the standard content fingerprint. Keep provenance outside the runtime directory. Do not edit either copy independently; the exporter rejects downstream divergence.
4. Run upstream portable validation against the copied directory, `node --test tests/test_chart_assistant.mjs`, and this repository's packaging checks. Open the normal contribution PR to `develop`; its release plan is N/A.

The initial snapshot contains 102 upstream whitelist files at commit `6411d31b5cf93aad48d50923331a17f08dddae5d`. The new release fingerprint includes Git modes; it is not the same algorithm as earlier upstream summary hashes. Byte/mode equality was checked per file. Tests and internal task evidence are not copied into the runtime. Existing JSON examples inside the Skill are runtime resources, not repository-level showcase results.

## Publish and downstream sync

After the contribution merges, follow [Publishing Skills](../../CONTRIBUTING.md#publishing-skills): create the release branch from updated develop, review the full diff against main, set an unused unified version and reviewed notes, and open a release PR to main. A new Skill warrants a minor release; the currently observed stable release is `skills-v2.0.0`, so check availability again before planning `skills-v2.1.0`. Do not set a per-Skill version or publish a release from this contribution PR.

Publication generates `chart-assistant.zip` and its entry in `skills-manifest.json` from all tracked regular files under this Skill, using the existing release packager. The `visactor-skill-content-v1` fingerprint in the provenance must match the release manifest. GitHub installs use `npx skills add VisActor/skills --skill chart-assistant` once the contribution reaches main; ZIP users wait for a formal Release containing that asset.

Market synchronization is managed by a separate release consumer. Coordinate that rollout before the first formal Release containing Chart Assistant and verify its delivery result; this repository does not configure market accounts, credentials or listing administration. A migration PR or GitHub Release alone does not prove successful market delivery.

Aily is a separate distribution channel using the same verified source content and its platform review process; it is not covered by the AgentBuddy automation. A Release, an AgentBuddy receipt and Aily listing approval are separate outcomes.

The legacy `VisActor/chart-assistant-skill` repository keeps historical files and old installs. Stop refreshing it after the unified entry is available; existing users must reinstall from the new source to receive future changes. Do not delete old files, rewrite history or claim the migration already changed installed copies.

## Verification boundaries

The initial upstream runtime had real Doubao Work PNG visual review, positioned-image insertion with idempotent replays, and editable-card edit/save/reopen/export acceptance. This contribution does not claim a new model task or real host test in this repository. Its deterministic checks exercise an independently copied runtime, references, example validation, CLI input errors and offline image-delivery contracts. They do not prove a production render, Feishu write, market permission or successful first automatic sync.
