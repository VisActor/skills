# Person Poster：原生 VChart 迁移

2026-10-23，已实现并完成本地验证。新入口为 `skills/person-poster/SKILL.md`；实现阶段未提交、推送、发布或更新全局安装副本，后续经用户授权整理为面向 `develop` 的贡献 PR。用户要求源仓库 Skill 保持不动，源文件哈希与迁移前一致。

## 变更

- 人物素材、HTML/CSS 排版、事实核对、布局检查、review 与 PNG 导出流程迁入独立的 `person-poster`。
- 图表直接使用公开 `@visactor/vchart@2.1.7`，不再加载内部 SDK、内部 CDN 或兄弟 Skill。
- 原生 `charts/*.spec.json` 是唯一配置来源；manifest 使用 `charts[].spec`，HTML 内嵌同一配置。review 报告使用 `chartSpecMatches`。
- 小型 `scripts/render_charts.js` 只负责配置深拷贝、挂载尺寸检查、实例创建和异步渲染；失败释放已创建实例。它不转换配置，也不构成新的图表 DSL。
- 校验器检查 bundle 引用、路径、重复 ID、原生 spec 最小结构、动画关闭、本地数据与文件/内嵌一致性。移除了 jsonschema 和内部类型契约；不宣称完整 VChart 类型安全。
- 保留公开 CDN 和可追溯的同版本本地运行时两条路径。真实 CDN 浏览器加载已验证；固定 smoke 使用 npm 资产的本地副本，禁用其他远程资源。
- 维护依赖增加 Python Playwright 1.61.0，CI 单独安装对应 Chromium；不假定 Node Playwright 的浏览器安装能满足 Python 工具。

来源文件、提交和哈希见 [provenance](person-poster-provenance.json)。源包 `package.json` 声明 MIT；人物任务的图片单独记录作者、公共领域说明和来源。旧类型快照及其生成脚本不进入新 Skill。

## 图表能力

| 信息关系 | 原生实现 | 验证 |
| --- | --- | --- |
| 柱图、横条 | bar，方向/字段交换 | 标签、顺序、比例、零基线、零值和极值 |
| 分组柱图、分组横条 | bar、分类字段数组、seriesField、stack:false | 四个分项、两组类别与颜色 |
| 堆叠柱图、堆叠横条 | bar、seriesField、stack:true | 分项数值与几何比例、完整标签 |
| 折线、面积 | line / area | 时间顺序、数据与渲染 |
| 饼图 | pie | 组成、分类标签、数据与渲染 |
| 散点图 | scatter | 双数值字段与渲染 |
| 矩形树图 | treemap | children 层级、叶节点与标签 |
| 华夫图 | scatter 方形符号 + 显式单元数据 | 10 格、每格 10、7 格填充，无内部转换器 |

12 类关系由 14 份原生 JSON 示例覆盖，包含三种柱/条样式和一个零值/极值示例。历史 SDK 的自动纹理、排名徽章、图标填充等不是新 Skill 的兼容承诺。独立事实装饰可用 HTML/SVG；需要原生图表高级特性时查公开 API 并验证，不恢复内部配置协议。JSON 路线不支持函数回调序列化。

截图检查发现并修正了横条逆序、长标签裁切和分组柱图顶部读数空间。堆叠图标签放入各段；零值示例保留类别和 0 标签。没有通过硬编码审美规则或更改数据来通过校验。

## 验证记录

执行命令：

```bash
uv run pytest tests -q
uv run ruff check skills tests .github/scripts
node --test tests/test_browser_assets.mjs tests/test_browser_checks.mjs tests/test_story_vseed.cjs tests/test_person_poster_runtime.mjs
uv run python tests/browser/scripts/smoke.py --output-dir .cache/skill-dev/person-poster/smoke-final
```

- 生产脚本和原生 spec 的定向回归通过，包含带空格的独立安装目录、旧格式拒绝、字符串中的分号/引号/脚本结束符、数据一致性、符号链接越界、运行时缺失和失败释放。
- Node 集成：20 项通过。
- 全部 5 个固定浏览器用例通过：story-html、story-ppt、poster-chart-matrix、poster-html-only、poster-render-failure。
- Poster matrix：14 张图，文件/内嵌/实例数据一致；逐张画布非空；柱条的长度/数值比例和类别方向检查通过。保存局部截图并实际查看长名称、分组、堆叠及零值极值例。
- HTML-only 不加载 VChart，也成功执行 preflight/review/export/complete；失败例保持 ready:false，导出非零退出且不生成 PNG。
- Skill 元数据验证与相对链接检查通过。运行目录的内部包/地址/旧类型契约扫描无命中。
- 真实公共 CDN 使用浏览器加载并渲染柱图成功，返回 VChart 版本 2.1.7；证据在 `.cache/skill-dev/person-poster/migration/public-cdn.json`。

最终全仓 Python 回归：281 项测试、110 项子测试通过；ruff 与 git diff --check 通过。测试统计不是跨宿主质量保证。

## 真实人物任务

新增固定任务 [career-evidence](../../cases/person-poster/career-evidence/README.md)，提供 Henri Manuel 约 1920 年玛丽·居里肖像与诺贝尔奖官方份额。输入要求保留摄影边框，无需抠图。

- 以复制后的新 Skill 和输入在 `.cache/skill-dev/person-poster/career-evidence/` 完成一次同会话生成。
- 输出 1200×1500 CSS 的 HTML、原生 spec、数据/素材来源、事实核对及 2400×3000 PNG。
- 首轮布局检查发现奖项标题和单位相交；下移单位及图表后，review 技术检查通过。
- 实际查看 600px 阅读图，确认照片原貌、人物主视觉、三名获奖者的 50/25/25 份额、1911 年独享及口径说明可读。事实、技术和视觉结果分别保存在 `outputs/acceptance.json`。
- 这是同会话生成验证，不是独立盲测；没有检验抠图路径，不代表所有人物、字体和复杂图表都能稳定通过。未将本地产物自动发布为 showcase。

数据来源：[1903 年物理学奖](https://www.nobelprize.org/prizes/physics/1903/summary/)、[1911 年化学奖](https://www.nobelprize.org/prizes/chemistry/1911/summary/)。图片来源与公共领域说明：[Marie Curie c1920](https://commons.wikimedia.org/wiki/File:Marie_Curie_c1920.jpg)。

## 使用与兼容

本地安装：`npx skills add ./skills/person-poster`。复制时保留整个目录。晋级到 `main` 后可用 `npx skills add VisActor/skills --skill person-poster`；默认分支安装不依赖发布标签。

旧 `charts[].schema` 不能通过改名直接升级：必须转换旧字段为原生 VChart spec，重新生成内嵌数据、更新 manifest 并重新渲染。本次没有兼容 SDK 或历史成品批量迁移。

源目录按用户要求保持不动；源入口删除、同步脚本调整与正式维护切换不属于本次执行。`life-chronicle` 的既有内部依赖也未修改，应单独处理。

发布包从 Git 提交读取。实现阶段只验证了打包逻辑；贡献提交后需对精确提交构建并验证 ZIP 和 manifest。这属于本地打包验证，不创建标签或 Release。

## 相对计划的调整

- 用独立 `check-poster.mjs` 接入现有 runner，复用资源映射和 required-check 规则，避免扩大 story 专用检查器的分支。
- 增加小型原生渲染入口，使实际生成和测试共享初始化行为；不引入配置转换。
- 独立安装测试文件使用 `test_person_poster_portability.py`，避免与仓库根测试同名导致 pytest 导入冲突。
- 根据用户最新指令取消源目录切换；保留源 Skill 原样。

## 2026-10-23：验收与尺寸同步修复

在用户确认优化计划后，修复审查中复现的三个问题：

- 布局检查新增祖先容器逐轴裁切检测，报告必需元素、裁切祖先与轴；保留绝对定位逃逸场景，避免误报。复杂变换、clip-path 与 mask 的检测限制进入 review 警告，仍需人工查看。
- manifest 新增可选 `delivery`：缺省或 `html+png` 保持最终 PNG 必需；明确 `html` 时可省略 PNG 字段与文件，仍执行 review 和 complete。图表存在性与交付模式独立。
- 尺寸同步按根节点相对内容底边及报告中的安全距离计算。默认只扩展，主动裁短需明确参数及内容测量；重复执行保持文件不变。保留裁切样式，对不支持的 CSS 尺寸写法明确报错，不再通过改成 overflow:visible 掩盖问题。

新增浏览器 smoke 区分无图表 PNG、无图表 HTML-only、含图表 HTML-only 及预期布局失败。Python 浏览器回归使用 `poster_browser` 标记，接入现有 CI browser 任务，普通回归任务排除该标记；未新增工作流或运行依赖。

本次验证：337 项 Python 测试、110 项子测试通过；20 项 Node 测试通过；全部 8 个固定浏览器 smoke 通过；ruff 与 git diff --check 通过。基线失败日志保留了 29 个失败回归；修复后通过。真实浏览器连续测量/同步证据为 400 → 494 → 494px，后两次同步 `changed:false`。已查看裁切失败图、正常柱图阅读图和尺寸同步前后图：裁切例数字不可见且被拒绝；扩展后数值进入根节点背景并留出底部空间。

证据保存在本地 `.cache/skill-dev/person-poster/validation-hardening-20261023/`，含修改前后 Skill 副本、文件哈希、日志、产物和截图。上述为合成回归及其人工截图检查，未重新生成真实人物海报，也不构成人物题材质量或任意 CSS 遮挡的保证。此处为贡献提交前的验证记录；不包含发布或更新全局 Skill 安装。
