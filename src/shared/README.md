[简体中文](README.zh-CN.md) · English is canonical.

# Shared contracts

Owns serializable IPC/domain types and pure window-input geometry. Main, preload and renderer consume these contracts. It has no runtime service dependencies. Contract tests live in tests/contracts.test.ts.

`i18n` owns the supported language types, system-language resolution and all four plain message catalogs. English defines the key structure; translations must preserve keys and interpolation variables. Runtime i18next setup belongs to renderer, while main consumes only the pure resources for tray labels.

See [development](../../docs/development.md) and [repository map](../../INDEX.md).
