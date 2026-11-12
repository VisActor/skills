# 静态交付与预览

按交付条件选择工具；只在需要打包、预览或控件样式时读本页。接口与接线从[实现索引](implementation.md)进入。

## 静态交付与工具选择

默认用 HTML、CSS、JavaScript 与 SVG／Canvas 完成静态作品。源码按数据、布局、控制等实际职责拆分，交付保留一个清楚的 HTML 入口与必要资源。动画和探索可在浏览器内完成，不要求后端或应用框架。

需要本地预览或排查交付资源时，直接执行 [preview.py](../scripts/preview.py)，无需读源码、安装依赖或另写服务。它只依赖 Python 3.9+ 标准库；按当前环境约定选择调用方式，使用 `uv` 的环境可将下方 `python3` 换成 `uv run --no-project python`。缺少 `uv` 不等于没有 Python；先确认可用解释器，已有可靠服务则继续使用。

```sh
python3 /path/to/skill/scripts/preview.py serve /path/to/output --entry index.html
# 已有服务、只需检查交付资源时：
python3 /path/to/skill/scripts/preview.py audit /path/to/output
```

`serve` 已包含一次 `audit`：检查入口及 HTML、CSS、JavaScript 中能静态识别的本地资源引用，列出缺失文件、外部依赖与未解析项。使用它输出的实际 URL 和资源结果继续浏览器检查，无需再起第二个服务或重复同一次资源核验；修改资源引用后再运行 `audit`。计算生成的地址和导入映射仍由浏览器核实。

服务仅监听本机，自动选择空闲端口，输出进程 ID；指定 `--port` 时，端口被占用就报错，不替换其他服务。它保持前台运行，结束预览时终止对应进程即可。工具不改变作品文件，也不证明数据、动画或视觉效果正确；这些按[阅读检查](quality.md)验收。

沿用项目已有可靠工具；新作品按能省下的实现工作选择依赖：

| 需要减轻的工作 | 可选工具与职责 |
| --- | --- |
| 重复布局、排版与控件样式 | 优先考虑 Tailwind CSS 工具类；主题变量统一外观，特殊构图保留少量 CSS。已有简洁样式也可直接沿用 |
| 尺度、分组、路径与布局计算 | 按需使用 [D3 模块](https://d3js.org/getting-started)，将计算结果交给 SVG／Canvas；库不决定作品构图 |
| 多对象、多阶段动画 | 使用 [GSAP](https://gsap.com/docs/v3/GSAP/) 或 [createPlayer](implementation-stage.md#自动完成的衔接动画)。同一呈现属性由一个动画控制器负责，保持既定的状态交接与中断行为 |
| 较多组件、交互状态或资源依赖 | 组件管理确有收益时选 React；需要模块构建与资源打包时选 Vite。两者职责不同，可以组合，也可分别使用 |

联网试作可直接通过 CDN 引入浏览器可用的 CSS 或 JavaScript，在地址中指定所用版本并说明联网要求，无需为此创建包管理或构建项目。离线交付将依赖和资源随作品提供。浏览器脚本中的导入须能解析；npm 包名的裸导入需要打包或配置模块地址。已有示例的相对 ES module 导入可通过静态 HTTP 服务运行；要求双击打开时按该条件组织资源并验证。单 HTML 交付可内联 CSS、脚本与必要资源，仍保留便于修订的源码。

### 使用 Tailwind 时

联网试作可在 HTML 中直接引入 [Play CDN](https://tailwindcss.com/docs/installation/play-cdn)，无需安装或构建。以下以 Tailwind 4 为例，将脚本和主题放在 `<head>` 中；色值仅示范主题变量，按作品艺术方向替换：

```html
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4.3.3"></script>
<style type="text/tailwindcss">
  @theme {
    --color-surface: #fffdf7;
    --color-ink: #193431;
    --color-accent: #234e45;
  }
</style>
```

正文即可组合布局、排版与状态样式：

```html
<label class="inline-flex flex-col gap-2 text-sm text-ink">
  <span>比较对象</span>
  <select id="compare-object"
    class="h-10 min-w-36 rounded-lg border border-ink/30 bg-surface px-3
           hover:border-accent focus-visible:outline-2 focus-visible:outline-accent">
    <option value="a">对象 A</option>
    <option value="b">对象 B</option>
  </select>
</label>
```

将 `change` 事件接到作品已有的选择与渲染入口。少量选项、多个控件以及选择状态的接法见[探索控件](implementation-stage.md#探索交接与控件)；颜色、间距与文字角色由作品统一配置，不逐个控件随意拼样式。

Play CDN 在浏览器中生成样式，官方将其定位为开发试作。需要正式发布或离线交付时，再用 [Tailwind CLI](https://tailwindcss.com/docs/installation/tailwind-cli) 提前生成 CSS，随 HTML 引用或内联；安装与编译按此需要引入，不要求 React 或 Vite。

类名使用源码中完整可见的字符串；动态数值、坐标和连续色值通过 CSS 变量、内联样式或图形属性传递，便于后续编译时完整生成样式，见[类名检测](https://tailwindcss.com/docs/detecting-classes-in-source-files)。

## 可选的机制演示

[示例总览](../assets/examples/index.html)只导航到各自独立的预览。制作作品时，从[表达与示例选择表](design.md#从追问选择表达)直接进入选中目录，无需读取总览源码。控件样式需要时再读相应 HTML 和共用的 `mechanism.css`。

需要在浏览器运行该演示时，使用项目已有静态服务；没有现成服务时，可在 `assets/` 目录运行 `uv run --no-project python -m http.server 4189 --bind 127.0.0.1`，再打开 `/examples/`，端口按实际占用调整。服务根须同时包含 `examples/` 和 `runtime/`，以便解析模块；阅读代码或制作作品无需启动该演示。
