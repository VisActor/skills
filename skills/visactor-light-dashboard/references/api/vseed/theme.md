# theme

[API 索引](index.md)

- [RegisterTokenThemeOptions](theme.md#registertokenthemeoptions)
- [TokenThemeBase](theme.md#tokenthemebase)
- [TokenThemeDefinition](theme.md#tokenthemedefinition)
- [TokenThemeRegistry](theme.md#tokenthemeregistry)
- [createTokenThemeConfig](theme.md#createtokenthemeconfig)
- [darkTheme](theme.md#darktheme)
- [lightTheme](theme.md#lighttheme)
- [registerTokenTheme](theme.md#registertokentheme)
- [registerTokenThemes](theme.md#registertokenthemes)

类型引用沿用源码模块名，包的公开导出以索引为准：

```typescript
import type { CustomThemeConfig } from 'src/types'
import type { TokenThemeDefinition } from './tokenThemeSchema'
import { z } from 'zod'
```

## RegisterTokenThemeOptions

源码：[packages/vseed/src/theme/tokenTheme.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/theme/tokenTheme.ts#L15)

包导出：`RegisterTokenThemeOptions`

```typescript
export type RegisterTokenThemeOptions = {
  ensureRegisterAll?: boolean
}
```

## TokenThemeBase

源码：[packages/vseed/src/theme/tokenTheme.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/theme/tokenTheme.ts#L9)

包导出：`TokenThemeBase`

```typescript
export type TokenThemeBase = TokenThemeDefinition['baseTheme']
```

## TokenThemeDefinition

源码：[packages/vseed/src/theme/tokenThemeSchema.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/theme/tokenThemeSchema.ts#L73)

包导出：`TokenThemeDefinition`

```typescript
export type TokenThemeDefinition = z.infer<typeof zTokenThemeDefinition>
```

## TokenThemeRegistry

源码：[packages/vseed/src/theme/tokenTheme.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/theme/tokenTheme.ts#L13)

包导出：`TokenThemeRegistry`

```typescript
export type TokenThemeRegistry = Record<string, TokenThemeDefinition>
```

## createTokenThemeConfig

源码：[packages/vseed/src/theme/tokenTheme.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/theme/tokenTheme.ts#L329)

包导出：`createTokenThemeConfig`

```typescript
export declare const createTokenThemeConfig: (tokens: TokenThemeDefinition) => CustomThemeConfig
```

## darkTheme

源码：[packages/vseed/src/theme/dark/dark.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/theme/dark/dark.ts#L28)

包导出：`darkTheme`

```typescript
export declare const darkTheme: () => CustomThemeConfig
```

## lightTheme

源码：[packages/vseed/src/theme/light/light.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/theme/light/light.ts#L28)

包导出：`lightTheme`

```typescript
export declare const lightTheme: () => CustomThemeConfig
```

## registerTokenTheme

源码：[packages/vseed/src/theme/tokenTheme.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/theme/tokenTheme.ts#L353)

包导出：`registerTokenTheme`

```typescript
export declare const registerTokenTheme: (
  themeName: string,
  tokens: TokenThemeDefinition,
  options?: RegisterTokenThemeOptions,
) => void
```

## registerTokenThemes

源码：[packages/vseed/src/theme/tokenTheme.ts](https://github.com/VisActor/VBI/blob/main/packages/vseed/src/theme/tokenTheme.ts#L362)

包导出：`registerTokenThemes`

```typescript
export declare const registerTokenThemes: (themes: TokenThemeRegistry, options?: RegisterTokenThemeOptions) => void
```
