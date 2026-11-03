# 已有飞书卡片：读取、编辑与替换

## 使用条件

用户希望修改文档中已存在的图表助手卡片。先读取当前卡片，不从首轮 commonOption 或历史生成提示重新制图。

- 有真实授权的小组件运行会话：可以通过客户端 `Record.setRecord` 原位保存；保存成功后回读。Skill 被加载不代表拥有该会话。
- 只有服务端 OpenAPI：采用本篇替换流程。用户须已接受新 block ID，以及旧卡评论、外部引用、历史不能保证迁移。会话内已批准替换时沿用授权，不为每次明确样式修改再问一次。
- 若仍要求同一 block ID，又没有原位通道，明确返回受限；不能把替换称为原位修改。

目前公开的文档块 PATCH 请求未提供 `add_ons.record` 修改字段，响应能返回 record 不等于请求可写。`Record.setRecord/applyTransaction` 是当前小组件客户端接口，不能构造为外部 HTTP 请求。

## 工具要求

同一身份至少具备以下已确认的服务端接口或等价工具：

```http
GET    /open-apis/docx/v1/documents/:document_id
GET    /open-apis/docx/v1/documents/:document_id/blocks/:block_id
POST   /open-apis/docx/v1/documents/:document_id/blocks/:parent_id/children
DELETE /open-apis/docx/v1/documents/:document_id/blocks/:parent_id/children/batch_delete
```

删除需要 `docx:document` scope；调用身份还须拥有目标文档编辑权限。权限不足时保留当前状态，不换身份猜测重试。工具只支持普通文本或仅支持新建 commonOption 时，不满足完整 record 替换要求。

纯 API 工具可按以下协议完成候选卡创建、完整配置回读和替换。渲染或视觉验收不作为替换前提，不为预览安装依赖；用户另行要求的视觉、编辑或同步行为验证按实际能力单独报告。

## 1. 读取与计划

1. 确定唯一 `document_id + old_block_id`。读取文档版本、旧 block 及其父 block 的 children；验证旧 block 恰好出现一次，类型为 40，component_type_id 可确认为图表助手组件，记录旧组件类型；旧组件类型不决定新卡类型。
2. 原始响应在宿主内存中按步骤6检查和投影后，才保存本次任务的编辑基线、父 ID、位置、文档 revision 和稳定请求 ID；基线仅移除步骤6允许的实例字段，其余完整保留，不是精简证据投影。模型输出、日志和临时文件同样不能先接收原始凭证。任务资料置于受限存储，不包含 access token；对外仅给摘要和必要 ID。重读旧/新卡也须先过滤，不因首次创建无凭证就信任后续响应。
3. 解析 `add_ons.record` JSON，再解码 browserData。数组、JSON 字符串和压缩保存态按真实编码读取。数据库引用必须由已有授权解析能力读取；不支持解析时拒绝，不能把引用当数组或重新生成空图。
4. browserData 为当前保存态，commonOption 用于原有 hydration，不能取代人工修改后的 browserData。只有初始化 commonOption 且无 browserData、无非空顶层 URL 的单图 standard 卡片，可直接编辑已验证的初始化属性；当前只开放 options.config.color 配色数组。存在 browserData 时禁止回退，URL 驱动卡片仍需可靠物化。
5. 在深拷贝上按用户意图修改支持的属性，完整比较变化。保留数据、映射、来源/同步、其他标注、未知扩展字段、原 dataVersion、commonOption、人工尺寸及自动适配状态。目标不唯一或需要未知 runtime identity 时返回候选/受限，不猜 key。
6. 创建独立实例时，先显式投影：顶层 aeolusToken 是宿主会话缓存，不复制；只有 commentData.comments 确认为空、无未知评论字段且 comment.id 为有效字符串时，去掉空评论实例绑定。记录 removedRuntimeFields 字段名，不保存认证值；其他认证字段、非空评论或未知绑定拒绝。其余完整 record 保留，不能将投影称为逐字节复制。

能力与写卡方式分别判断：允许替换不等于支持任意样式或标注。第一批本地执行器仅接受缺省格式版本或当前 `2.11.0`，支持单图中唯一稳定 id 普通文本点标注的 text、六位十六进制 color、1–200 fontSize；另支持步骤4限定的 standard commonOption 初始化配色数组；旧/未知版本和其他目标明确拒绝，不能靠删除 dataVersion 绕过。其他宿主按自身已验证的 runtime/DSL 能力判断。

## 2. 创建候选卡

先按 [安装与组件规则](feishu-doc-card.md#12-安装与可用性检查) 确认 ISV 应用可用。旧卡不是正式 ISV 组件时，检查完整 record 的来源和插件能力是否可在 ISV 中使用；无法确认兼容时保留旧卡并说明限制，不直接复制组件类型或删减 record 强行迁移。

创建前重读旧卡和父节点，与计划一致才能执行。在旧卡的当前索引处插入一个新 block，旧卡暂时移到新卡之后：

```ts
// 新卡统一使用正式 ISV 组件；component_id 是旧实例身份，不随新 block 复用。
const body = {
  index: oldIndex,
  children: [{
    block_type: 40,
    add_ons: {
      component_type_id: "blk_67add0469786801c34ce1a4e",
      record: JSON.stringify(editedFullRecord)
    }
  }]
};
```

使用本次创建独立、稳定的 `client_token`。写前记录待提交状态，响应后保存新 block ID 和文档版本。不要调用会重写 element ID、清除尺寸或只保留已知字段的新建初始化函数。

超时或响应无法确定时保留旧卡，先核对该次操作；不要换 client_token 重建。候选卡不是完成结果。

## 3. 验证候选卡

- GET 新 block，确认新旧 ID 不同、类型为 40、组件类型为正式 ISV ID `blk_67add0469786801c34ce1a4e`、父节点正确。
- 完整解析回读 record，与计划结果逐项比较；只比 title、数据行数或标注数量不够。编码不同可比较完整解码语义，不能跳过未知字段。
- 确认用户要求的目标属性已按计划修改，并对照旧 record 基线校验不变量：数据、映射、来源/同步配置、其他标注、尺寸及其他未授权修改的字段保持，只有已记录的实例投影字段被去除。记录新 block ID、已验证 record 指纹、目标变更及不变量检查结果。
- 本步骤验证配置写入结果，不要求打开正文或进入编辑器。实际渲染、重新打开可编辑和 URL 来源同步行为不由配置回读推断；用户明确要求时分别验证并报告。

任何一项配置或块关系校验失败都保留旧卡；报告候选卡 ID 和失败阶段，不自动删除候选卡或重复创建。

## 4. 删除旧卡并验证

仅在候选卡完整配置回读、目标变更及不变量验证都通过后执行：

1. 重读文档、旧/新 block 和父节点。确认旧卡内容仍与基线相同，新卡仍与验证时相同，父子关系和其余兄弟顺序符合预期。
2. 从这次父节点 children 中重新查找 `old_block_id`，确认唯一；删除请求为 `{start_index: oldIndex, end_index: oldIndex + 1}`。不要复用创建前的旧索引。
3. 传入该次读取的 `document_revision_id` 和独立的删除 `client_token`。写前记录待删除状态；失败不回滚宿主、不盲重试。
4. 再读父节点、新卡及旧卡删除状态，确认旧卡已被明确删除（不是仅移出原父节点）、新卡在原位置、其余兄弟未变、新 record 保持，才报告“替换完成”。旧卡读取超时或权限失败不能当作已删除。输出 old/new block ID，明确 block 身份变化。

版本参数用于指定操作版本，官方允许一定范围内的旧版本，**不是“只接受最新版本”的 CAS**。重读检查只能降低竞态风险，不能保证普通协作文档零丢更新。首期在可确认无并发编辑的受控文档执行；发现版本/内容变化保留两卡并重新计划，不把 dataVersion 或快照 hash 当服务端锁。

## 结果报告

| 当前状态 | 对用户的说明 |
| --- | --- |
| 计划或能力检查失败 | 未替换；旧卡保留 |
| 创建结果不确定 | 旧卡保留；待核对本次创建，禁止重复插入 |
| 新卡已回读，目标变更或不变量尚未检查完成 | 候选卡已创建，替换未完成；给新旧 ID 及待检查项 |
| 新卡验证失败或旧卡已变化 | 保留两卡，给具体差异/冲突 |
| 删除失败或结果不确定 | 新卡已验证，旧卡删除待核对；不报完成 |
| 删除后关系及新卡回读通过 | 替换完成；给新 block ID 及独立验证范围 |

## 官方依据

2026-09-07 核实：[创建块](https://open.feishu.cn/document/server-docs/docs/docs/docx-v1/document-block/create)、[删除块](https://open.feishu.cn/document/server-docs/docs/docs/docx-v1/document-block/batch_delete)、[更新块](https://open.feishu.cn/document/server-docs/docs/docs/docx-v1/document-block/patch)、[Record.setRecord](https://open.feishu.cn/document/client-docs/docs-add-on/05-api-doc/record/Record.setRecord)。以上为公开协议；本地脚本存在不等于豆包/iDA 已绑定工具或已完成真实文档验收。
