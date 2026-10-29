# 浏览器冒烟测试

[English](README.md) | [简体中文](README.zh-CN.md)

使用固定输入检查 Skill 脚本、模板和生成页面，可在本地和 CI 中运行，不调用模型。

密集 Person-poster 图表用例明确声明 `readingBaselinePassed: false`：API/导出断言可通过，但实际 review 报告仍保留600px阅读失败。`reviewDisplayWidth: 1200` 仅请求补充诊断，不能替代基线。`tests/person_poster/test_readability.py` 单独检查600px下的 DOM/图表文本测量和小字拦截。运行时验收固定要求600px / 12px基线，包含标为装饰的可见文字。

## 测试内容

| Skill | 用例 | 检查内容 |
| --- | --- | --- |
| chart-storytelling | [story-html](chart-storytelling/story-html) | 组装 HTML 故事并渲染图表 |
| chart-storytelling | [story-ppt](chart-storytelling/story-ppt) | 组装 Web-PPT、渲染图表、前进及返回翻页 |

两个用例均检查图表画布非空、页面及资源错误、本地资源加载。PPT 翻页检查目标页面的位置和可见性。冒烟测试使用减少动态效果设置，不验收动画或叙事质量；截图用于排查问题，不做像素对比。

## 运行方式

在仓库根目录执行：

```bash
uv sync --locked
npm ci --prefix tests/browser --ignore-scripts
node tests/browser/node_modules/playwright/cli.js install chromium

uv run python tests/browser/scripts/smoke.py
uv run python tests/browser/scripts/smoke.py --skill chart-storytelling
uv run python tests/browser/scripts/smoke.py --case story-ppt
```

Linux 缺少浏览器系统依赖时，使用 `install --with-deps chromium`。

报告、日志、输入、生成文件和截图保存在 `.cache/`。可用 `--output-dir PATH` 指定新的输出目录。任一用例失败时，命令返回非零退出码。

## 用例文件

每个 `<skill>/<case>/` 目录包含 `config.json`（构建配置）、`inputs/`（固定输入）和 `expectations.json`（必须执行的检查）。新增用例放在对应 Skill 目录下，runner 自动发现。

## person-poster

- `poster-build-entry`：零图表的实际init/preflight/build入口、生成文字和运行就绪。
- `poster-managed-charts`：两张真实图表经init/build/review，动态加载同版本本地运行时，不预加载VChart标签或手写ready；Python浏览器回归另测数据同步及运行时/mount失败，不表示已验证公网CDN。
- `poster-text-occlusion`：无装饰标记且pointer-events禁用的后绘制卡片遮住绑定文字，布局须拒绝；Python浏览器回归另含未绑定文字、嵌套、裁切和可判定层叠情况。

- `poster-chart-matrix`：12 类关系的原生示例、真实数据传入、画布非空和 PNG 导出。
- `poster-html-only`：没有图表时不加载 VChart，review 和 complete 校验通过，不生成最终 PNG。
- `poster-charts-html-only`：包含原生图表的 HTML-only 交付，渲染与 complete 校验通过，不生成最终 PNG。
- `poster-no-charts-png`：没有图表时不加载 VChart，仍完成图片/字体就绪及 PNG 导出。
- `poster-ancestor-clipping`：ready 成功，但 review 拒绝被父容器裁切的必需内容，不生成最终 PNG。
- `poster-render-failure`：空挂载区域触发错误，ready 保持 false，导出返回失败且不产生 PNG。

成功海报用例从独立 Skill 副本执行 preflight、review 和 complete 校验，仅 PNG 交付执行 export。预期 PNG 存在性独立于 manifest.delivery 检查；预期布局失败必须有实际测量错误，不能把任意脚本崩溃视为通过。使用公开 npm 包的本地固定版本副本，不证明任意网络可访问 CDN。图表截图经人工检查，自动测试不判断视觉质量。

Python 生产链还需要与其版本匹配的 Chromium：

```bash
uv run python -m playwright install chromium
uv run python tests/browser/scripts/smoke.py --skill person-poster
```

Python 浏览器回归使用 `poster_browser` pytest 标记。CI 在安装 Python Chromium 后由现有 browser 任务执行；普通回归任务使用 `-m "not poster_browser"`。本地安装浏览器后可运行 `uv run pytest tests/person_poster -m poster_browser -q`。

- `poster-chart-visual-contract`：固定条形图验证排序/过滤后的实际类别颜色，核对未旋转标签、轴文字和图例的可见文字完整性、边界与交叠。覆盖长名称、50/25/25 堆叠、95/4/1 横条和合法单色。阅读尺度截图仍需实际查看，不代表通用 Canvas 可读性自动验收。

- `poster-missing-values`：完整分类轴 domain 保留缺失观测的位置；实际标签恰好有一个真实零值，缺失类别没有伪造数值。核验原生 spec、数据、柱体几何与可见标签。

人物海报API样例的PNG写入`draft/preview.png`，使用显式草稿导出和pre-export结构检查；`pngExpected`指诊断图片，不表示正式交付通过。完整生产export/verify/status链路由`tests/person_poster/test_workflow.py`验证。旧小字样例保留实际review失败，不能据此证明阅读质量通过。

Person Poster 展示用例覆盖映射一致、未绑定文字拒绝，以及同一固定基线下的全内容粗排阅读失败。输入映射随用例保存；这些确定性检查不证明真实来源或宿主遵守。
