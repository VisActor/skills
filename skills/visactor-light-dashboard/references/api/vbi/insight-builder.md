# insight-builder

[API 索引](index.md)

- [VBIInsightBuilder](insight-builder.md#vbiinsightbuilder)

类型引用沿用源码模块名，包的公开导出以索引为准：

```typescript
import type * as Y from 'yjs'
import type { VBIInsightBuilderInterface, VBIInsightDSL } from 'src/types'
import { UndoManager } from 'src/chart-builder/features'
```

## VBIInsightBuilder

源码：[packages/vbi/src/insight-builder/builder.ts](https://github.com/VisActor/VBI/blob/main/packages/vbi/src/insight-builder/builder.ts#L7)

包导出：`VBIInsightBuilder`

```typescript
export declare class VBIInsightBuilder implements VBIInsightBuilderInterface {
  doc: Y.Doc
  dsl: Y.Map<any>
  undoManager: UndoManager
  constructor(doc: Y.Doc, dsl?: Y.Map<any>)
  applyUpdate: (update: Uint8Array, transactionOrigin?: any) => void
  encodeStateAsUpdate: (targetStateVector?: Uint8Array) => Uint8Array<ArrayBufferLike>
  getUUID: () => string
  setContent: (content: string) => this
  build: () => VBIInsightDSL
  isEmpty: () => boolean
}
```
