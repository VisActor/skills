# 飞书云文档与图表助手卡片交付

## 1. 交付模式

先判断用户要求的是哪一种：

- **已有卡片修改**：先读 [existing-card-replacement.md](existing-card-replacement.md)。替换会产生新 block，按当前完整 record 最小修改；创建后完整配置回读、目标变更及不变量验证通过，按防并发协议重读确认后删除旧卡片。
- **已有文档插卡**：调用方必须提供或能解析 `document_id`，并明确插入指定父 block/index，或追加到文档根节点。
- **新建文档再插卡**：只有用户明确要求创建新文档时执行；先创建 Docx，再把返回的 `document_id` 同时作为目标文档 ID 和根 `block_id` 创建卡片。

创建新文档、写入已有文档都是外部写操作。执行身份、目标目录和授权范围必须一致；不能为了绕过 403 在 user/bot 之间静默切换。

### 1.1 iDA 是否可以直接创建

可以，但前提是当前 iDA Agent 真正绑定了写卡工具。Skill 只提供 DSL 和 OpenAPI 契约，不会因为被加载就自动获得飞书权限或本地仓库脚本。

执行前必须发现并确认工具至少覆盖：

1. 新建模式需要 `POST /docx/v1/documents` 等价能力；已有文档插卡可省略。
2. 能原样提交 `document.block.children.create`，包括 `block_type: 40`、`add_ons.component_type_id` 和字符串 `record`；只支持富文本段落的普通文档工具不满足。
3. 能返回第11节所需的可信已验证写入结果，或在结果不足时以同一身份读取目标文档/新block；不要求模型重复读取工具已验证的信息。
4. 能使用用户或受控应用身份访问目标文档；不能让模型生成、保存或转述 token/app secret。

若任何一项缺失，iDA只交付可完成的DSL/record/request plan，明确说明“未执行写入”，不能声称已创建卡片。业务宿主若没有通用raw OpenAPI，推荐提供窄接口 `create_chart_assistant_card`，由服务端负责OAuth、组件ID、幂等、按输入模式校验与包装record、OpenAPI调用及必要回读，并返回已验证结果；输入可接受 `ILayerData[]`、commonOption或URL。

### 1.2 安装与可用性检查

创建可编辑飞书卡片前，确认目标用户在当前租户可使用 ISV 版「图表助手」。安装 Skill 不等于安装飞书应用，应用可用也不等于宿主已获得文档写入权限。

- 正式安装入口：[图表助手 · 飞书应用目录](https://app.feishu.cn/app/cli_a7276c5b36be5013)。点击「获取」并按页面完成安装；具体操作见 [图表助手使用指南](https://hcnrgmtieqau.feishu.cn/wiki/QEwewQRQTiwJiTkVaQfc4IYYnoe)。
- 已有本会话的安装确认或宿主的应用可用证据时直接继续；不能仅凭 Skill 已加载、文档可访问或旧内部版卡片存在判断 ISV 应用已可用。
- 未安装、未启用或当前用户不可用时，向用户提供上述链接；无安装权限时请用户联系企业管理员安装、启用并确认可用范围。不要自动替用户申请、安装或联系管理员。
- 没有应用状态查询工具且状态未知时，给出安装入口并请用户确认当前账号可用；不编造查询接口，也不把未知状态说成未安装。等待期间可完成 DSL/record，应用就绪后沿用原创建计划继续。仅生成、解释或校验配置不要求安装。
- 安装引导应在创建文档/卡片前完成，避免已知应用不可用仍创建空文档。安装确认后继续检查第 1.1 节的宿主工具与第 10 节的权限；不把所有 403 都归因于未安装。

用户提示示例：「在飞书文档中使用可编辑图表，需要先安装图表助手。请打开 [安装页面](https://app.feishu.cn/app/cli_a7276c5b36be5013) 获取应用；若无安装权限，请联系企业管理员安装并启用。完成后我会继续创建图表。」已确认可用时不重复提示。

## 2. 创建 Docx

原生 OpenAPI：

```http
POST /open-apis/docx/v1/documents
```

```ts
interface CreateDocumentRequest {
  title?: string;        // 纯文本，1～800 字符
  folder_token?: string; // 可选；省略或空值表示当前身份的根目录
}
```

响应中的关键字段：

```ts
interface CreateDocumentResult {
  document: {
    document_id: string;
    revision_id: number; // 新建文档通常为 1，以实际响应为准
    title: string;
  };
}
```

规则：

- 创建文档接口只设置标题和目录，不直接创建正文或图表卡片；卡片必须在第二次 block 请求中写入。
- `folder_token` 必须是文件夹 token，不能传 wiki node token。使用 tenant/app 身份时，只能指定该应用可写、且满足接口约束的文件夹。
- user 身份创建的文档归相应用户；bot/app 身份创建的文档归应用。若最终使用者必须能打开和编辑，宿主还要校验或授予文档 ACL；授权成功不等于 owner 已转移。
- 创建文档接口的应用频率上限当前为 3 QPS；同一文件夹不并发创建，遇到频控使用有界指数退避。
- 创建结果超时或不明确时，不按同一标题盲目重试。标题不唯一；应先使用宿主运行 ID、响应日志和目标目录核对是否已创建。
- 若宿主已有受管文档工具，可使用等价的 `create document` 能力；必须拿到 `document_id`、文档 URL、实际身份和 warnings 后再继续。

创建成功后，对文档根节点插入卡片：

```ts
const documentId = createResult.document.document_id;
const parentBlockId = documentId;
```

## 3. 创建图表助手卡片

使用 Docx `document.block.children.create`：

```http
POST /open-apis/docx/v1/documents/:document_id/blocks/:block_id/children
```

推荐查询参数：

```ts
{
  document_revision_id?: number; // -1 表示最新版本，默认 -1
  client_token?: string;         // 同一创建操作的稳定幂等标识
}
```

```ts
{
  index?: number;
  children: [{
    block_type: 40;
    add_ons: {
      component_type_id: string;
      record: string;
    };
  }];
}
```

`block_type` 固定为 40（文档小组件）；`record` 必须是 JSON 字符串，不是对象。对根节点追加时 `block_id = document_id`；指定位置时 `parent block_id` 与 `index` 必须成对确定。`children` 单次长度限制为 1～50；本场景通常只创建一个卡片。

`client_token` 应由宿主为一次逻辑创建生成并在重试中复用，避免网络超时后重复插卡。收到响应后保存返回的 `client_token`、`document_revision_id` 和新 block ID。

## 4. component type

所有新建卡片（包括替换旧卡时创建的候选卡）统一使用正式 ISV 组件：

```ts
const component_type_id = "blk_67add0469786801c34ce1a4e";
```

对应飞书应用 ID 为 `cli_a7276c5b36be5013`。不按内部/外部用户、租户、分享范围或数据源切换组件版本。宿主 manifest/config 必须指向该正式 ISV 应用及组件；若不一致，先修正宿主配置，不回退到内部版或测试组件。

应用安装、文档权限与数据源可访问性分别判断。统一 ISV 不会使私有 URL、Sheet/Base 或风神数据自动公开，也不保证目标运行时已注册对应来源插件；来源不支持或不可访问时说明限制，不通过切换内部版解决。已有卡片的原位编辑保留原实例；替换新建按 [替换协议](existing-card-replacement.md) 检查 ISV 来源兼容性并保留完整 record。

## 5. 三种 record 模式

三种模式共享以下 JSON-safe record 外壳：

```ts
interface ChartAssistantRecord {
  browserData?: ILayerData[];
  commonOption?: ICommonChartAssistantData & { component?: { size?: {width?:number;height?:number} } };
  url?: string;
  dataVersion?: string;
  theme?: string;
  canvasStyle?: ICanvasStyleConfig;
  autoSync?: boolean;
  option?: {
    loadContribute?: "view"|"edit";
    autoFitContainerByBounds?: boolean;       // 默认 true
    displayToolbarDefaultCollapsed?: boolean; // 默认 false
  };
  __auto_fit_mode?: "auto";
  __auto_fit_size_mode?: "auto"|"manual";
  __auto_fit_user_resized?: boolean;
  __auto_fit_pending?: boolean;
  __auto_fit_lock_after_apply?: boolean;
  __auto_fit_trigger?: "common_option"|"url_sync"|"browser_data_init";
}
```

`theme/canvasStyle` 用于没有可用 browserData、从 commonOption/url 首次重建时的编辑器外观。`loadContribute` 源码默认是 `edit`，但服务端批量建卡推荐显式写 `view`。

### A. 完整编辑态 `browserData`

当前代码路径支持直接恢复 `ILayerData[]`：

```ts
const recordObject = {
  browserData: layerData,
  autoSync: true, // 只有明确要求且来源有资格时
  __auto_fit_mode: "auto",
  __auto_fit_trigger: "browser_data_init",
  __auto_fit_size_mode: "auto",
  __auto_fit_user_resized: false,
  __auto_fit_pending: true,
  __auto_fit_lock_after_apply: true
};

const child = {
  block_type: 40,
  add_ons: {
    component_type_id,
    record: JSON.stringify(recordObject)
  }
};
```

适合已有完整 layout/modelSpec/marker/MBB 的编辑器保存态。`dataVersion` 默认省略；旧数据迁移时才加入真实版本。

### B. 外部首次建图 `commonOption`

```ts
const recordObject = {
  commonOption: {
    source: { appName: "Report", showSource: true, sourceName: "经营数据", pageUrl: "<source-page>" },
    elements: [{
      id: "chart-1",
      type: "chart",
      position: { x: 0, y: 0, width: 640, height: 360 },
      options: {
        chartType: "bar",
        data: { type: "standard", value: { columns: ["月份", "销售额"], data: [{ 月份: "1月", 销售额: 120 }] } },
        enableDataEdit: true,
        enableTypeChange: true
      }
    }]
  },
  option: {
    loadContribute: "view",
    displayToolbarDefaultCollapsed: false
  },
  __auto_fit_mode: "auto",
  __auto_fit_trigger: "common_option",
  __auto_fit_size_mode: "auto",
  __auto_fit_user_resized: false,
  __auto_fit_pending: true,
  __auto_fit_lock_after_apply: true
};
```

`loadContribute` 默认/推荐 `view`：正文打开时渲染；`edit` 会要求进入编辑视图完成加载，不适合批量服务端创建。`commonOption.component.size` 可影响文档卡片尺寸，但作为新图复制到其他位置且要求重新适配时可删除旧 size；替换已有卡片必须保留原尺寸。

### C. URL 导入

```ts
const recordObject = {
  url: "<supported-chart-assistant-or-aeolus-url>",
  option: { loadContribute: "view" },
  __auto_fit_mode: "auto",
  __auto_fit_trigger: "url_sync",
  __auto_fit_size_mode: "auto",
  __auto_fit_user_resized: false,
  __auto_fit_pending: true,
  __auto_fit_lock_after_apply: true
};
```

教程明确支持风神查询、图表助手 Common URL、分享链接和能返回兼容配置的链接。加载后必须检查最终 source 类型和同步资格；不能因为用了 `url` 就默认 `autoSync`。

## 6. 优先级

首次从 standard 数据建内置图使用 commonOption；受支持 URL 导入（包括风神可视化查询）使用 url 模式；已有 ILayerData/readback 写回使用 browserData。已有 record 同时包含非空 browserData 与 commonOption 时，恢复编辑态通常以 browserData 为准；新生成只选一种模式。这是协议生命周期区别，不是 iDA 特例。

## 7. 创建前检查

以下定义生成输入与执行工具的必要约束，不是模型在工具之外另跑一轮预检的清单。工具对最终提交按所选模式完成检查，已有同等覆盖直接复用；缺少覆盖时仅由调用端补一次对应检查。写后证据沿第11节复用，旧卡替换仍按专用协议处理。

- 新建文档时 title、folder、执行身份和最终访问者明确；已有文档时 document/parent/index 明确。

- commonOption 模式使用非空 elements、合法 position/options 及一个 chart 入口；browserData 模式保留完整非空 ILayerData[] 的 ID/rect/attribute；url 模式使用受支持的 URL，不要求预先存在 browserData。
- standard 保存字符串可解析，mapping 引用存在的字段；URL 模式的实际数据映射采用物化结果。
- modelSpec/专属字段遵从当前模板能力；执行工具返回的能力错误只修对应项。
- live URL/config 齐全，autoSync 意图明确；sourceBinding 是物化后核实项，不在 commonOption config 中生成。
- 不含 token、cookie、临时 OAuth、component instance ID、旧 block ID。
- 新建副本按目标宿主协议处理 comment/editorState；原卡替换仅按[替换协议](existing-card-replacement.md)显式去除已确认的会话缓存与空评论实例绑定，并记录字段名。其他认证数据、非空评论或未知宿主绑定拒绝，不套用通用清理。

## 8. `dataVersion`

```ts
// 新生成
JSON.stringify({
  browserData: layerData,
  __auto_fit_mode: "auto",
  __auto_fit_trigger: "browser_data_init",
  __auto_fit_size_mode: "auto",
  __auto_fit_user_resized: false,
  __auto_fit_pending: true,
  __auto_fit_lock_after_apply: true
})

// 只有确知是旧版保存数据
JSON.stringify({
  browserData: oldLayerData,
  dataVersion: actualOriginalVersion,
  __auto_fit_mode: "auto",
  __auto_fit_trigger: "browser_data_init",
  __auto_fit_size_mode: "auto",
  __auto_fit_user_resized: false,
  __auto_fit_pending: true,
  __auto_fit_lock_after_apply: true
})
```

缺失时运行时使用当前最新版。辅助脚本、教程 live record 里的历史版本只说明当时数据，不是新卡片默认值。

## 9. 卡片尺寸与运行时字段

Skill 新建卡片默认“首次贴合内容后固定”：写入 `__auto_fit_mode:"auto"`、`__auto_fit_size_mode:"auto"`、`__auto_fit_user_resized:false`、`__auto_fit_pending:true`、`__auto_fit_lock_after_apply:true`。`commonOption`、URL、独立 `browserData` 新卡分别写 `__auto_fit_trigger:"common_option"`、`"url_sync"`、`"browser_data_init"`。宿主首次按正文实际宽度完成布局，测量真实内容包围盒，计算高度并保留上下安全留白及必要的来源栏空间；适配成功后保存高度，切到 `__auto_fit_size_mode:"manual"`、`__auto_fit_user_resized:true`、`__auto_fit_pending:false`，消费标记为 `__auto_fit_lock_after_apply:false`。重开、编辑或同步后不再自动改变卡片高度。

内容尚未物化、测量无效或保存失败时，不提前固定；保留 pending 请求供后续重试。保留卡片内“恢复卡片自适应”的入口：用户恢复后取消一次性标记，继续按内容和宿主宽度适配。用户在首轮完成前手动固定时也取消该标记，尊重其当前尺寸。

用户明确指定固定高度时，使用自己的 `commonOption.component.size.height` 和直接固定状态 `__auto_fit_size_mode:"manual"`、`__auto_fit_user_resized:true`、`__auto_fit_pending:false`，不请求首轮自动测量。用户明确要求持续自适应时，使用自动状态并省略或设 `__auto_fit_lock_after_apply:false`。不要用 `option.autoFitContainerByBounds:false` 代替固定模式，否则会失去恢复入口。历史卡片没有一次性标记时不自动迁移。此行为须由支持该字段的宿主运行时执行；Skill 配置本身不代表线上首次适配已完成。其余自动适配状态不要在首次创建时生成：

```ts
{
  __auto_fit_applied?: boolean;
  __auto_fit_content_size?: {width?:number;height?:number};
  __auto_fit_container_size?: {width?:number;height?:number};
}
```

这些其余字段由浏览态在物化、测量和用户手动改尺寸时维护。复制 record 时保留原尺寸语义；从初始化配置创建新图时不要复制旧 `commonOption.component.size`，新卡使用自身确定的尺寸。已有卡片替换保留原 size 与尺寸模式。`record.url` 不进入 browserData 自动尺寸标记路径；URL 首次加载按 URL/commonOption 宿主流程处理。首次适配请求采用工具的已验证写入结果，结果不足时按第11节回读；打开卡片后的实际高度、固定状态和重开保持属于真实宿主验证，不以初始配置结果代替。

## 10. 权限

创建新文档需要 `docx:document:create` 或 `docx:document`；创建卡片需要 `docx:document:write_only` 或 `docx:document`。目标文件夹必须允许当前身份创建，目标文档必须允许当前身份编辑；若 URL-backed，还需要当前用户访问源数据。文件夹、文档和源数据权限分别校验。

典型错误：`1770039` 文件夹不存在、`1770040` 无文件夹权限、403 权限/授权过期、404 document/block 错误、429 或 `99991400` 限流。限流只做有界重试和退避；权限失败不能通过换身份或换 component ID 猜测绕过。

## 11. 写后 readback

回读响应也可能包含运行时新加的临时凭证，即使创建请求完全不含凭证。先在宿主内存中解析和检查，再将安全投影交给模型、日志或文件；不要把原始 GET 响应重定向到文件、`tee`、调试输出或附件后才脱敏。每一次重试/复查都执行相同过滤，不能只过滤首次回读。工具无法在输出前过滤时，停止该原始读取路径，使用受控的投影工具；不能为了取证先泄露完整响应。

新建配置验证的证据只记录文档/块身份、组件类型、revision、提交配置的比较结果及不含凭证的协议字段。`aeolusToken` 等会话缓存不属于用户提交配置，记录其字段名被排除即可，不记录值或带值的差异。未知新增字段需判断是否为认证/实例状态，不默默忽略后声称完整等价。已有卡片编辑仍按[完整记录与实例投影](existing-card-replacement.md#1-读取与计划)保留未知非认证字段；安全证据投影不是可直接写回的完整编辑记录。

普通新卡优先复用可信工具返回的已验证结果：结果应明确关联本次提交、实际文档/块身份、所选record模式的完整配置等价结果与必要协议字段；仅有成功标志、block ID或裸2xx不够。已有相应证据时不再额外GET。结果不足或不明确时，只对缺少的信息做一次目标回读；新建文档缺少身份/title/folder结果时读取基本信息，卡片缺少配置结果时读取单block。原生路径为：

```http
GET /open-apis/docx/v1/documents/:document_id
GET /open-apis/docx/v1/documents/:document_id/blocks/:block_id
```

工具的已验证结果或本次目标回读应提供对应的写入证据：

1. 新建文档的 `document_id`、title/folder和执行身份对应本次请求；卡片结果包含新block ID、`client_token`及文档revision。
2. 卡片 `block_type = 40`，component_type_id为正式ISV ID `blk_67add0469786801c34ce1a4e`；record可解析，所选模式存在且没有冲突。
3. 完整record与提交计划等价：browserData、commonOption或url及未知非认证字段按所选模式保留，编码变化按完整解码语义比较；theme/color/title/modelSpec/marker/MBB均属于该配置。宿主新增会话缓存仅记录排除字段名，无法确认的新增字段列为待核对项，不将凭证落盘。
4. source URL/config/autoSync及已有sourceBinding保留；未物化的新commonOption/url不要求预先产生sourceBinding，配置结果不证明同步成功。
5. 已有卡片更新只改授权目标，保留数据、映射、来源、其他标注、尺寸及未修改字段；实例投影只限替换协议明确允许且已记录的字段。

配置结果不证明正文渲染、继续编辑或实际自动同步通过，按实际证据说明范围。已有卡片替换仍按[替换协议](existing-card-replacement.md)完成候选完整性、删旧前父子关系/当前索引/版本与最终状态检查，普通新卡的结果复用不免除这些步骤。

## 12. 部分失败、更新与安全

- 文档创建成功但卡片创建失败：这是部分成功。返回 document ID/URL 和明确错误，复用同一文档及同一 `client_token` 重试插卡；未经用户授权不删除文档。
- 服务端更新已有卡片按 [替换协议](existing-card-replacement.md) 执行。仅取得可解析 record 不足以删除旧卡；需完成完整配置、目标变更及不变量校验，并在删除前重新检查旧/新卡、父节点、当前索引和文档版本。发现变化保留两卡并重新计划。
- 用占位符批量落图时，先严格校验每个 placeholder 与 record key；同一 parent 下从后往前替换以避免 index 偏移，最后校验剩余占位符和新增图表数量。

飞书文档的 add-on record 可能包含历史临时 token。读取教程/来源卡片时只提取协议字段，不复制、输出或提交任何凭证。生成 record 不放 `aeolusToken`、user access token、cookie、app secret 或签名。

## 13. 实现证据边界

内部 `chart-builder` 脚本验证了以下稳定行为：根节点追加使用 `block_id=document_id`；指定位置时 parent/index 成对；创建前校验 record 并补 `loadContribute:"view"`；`record` 进行 JSON stringify；支持 list/read 回读；更新采用先插新再删旧；批量占位符按 parent 分组、逆序替换并做数量校验。

该脚本当前主要接受 `commonOption`，且只操作已有文档，不能据此否定本 Skill 已由当前运行时代码确认的 `browserData`/`url` 模式，也不能把它误写成“会创建 Docx”。Reference 已包含所需协议；业务 Agent 使用本 Skill 不依赖访问内部仓库。
