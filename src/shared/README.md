[简体中文](README.zh-CN.md)

# Shared contracts

Shared defines serializable IPC and domain contracts, Zod schemas for persisted app state and quick-app targets, and pure input-geometry helpers. Main, preload and renderer consume these definitions; runtime services stay in their owning layers.

`contracts.ts` owns request, response, notice and assistant-stream shapes. `appState.ts` owns the persisted schema and fresh defaults. `i18n/` owns locale types, language resolution and bundled catalogs; renderer initializes i18next, while main uses the catalog for tray labels.

See the [developer guide](../../docs/development.md) and [repository map](../../INDEX.md).
