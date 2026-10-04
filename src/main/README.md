[简体中文](README.zh-CN.md) · English is canonical.

# Main process

Owns app lifecycle, tray, transparent display window, IPC registration and OS effects. Services dispatch to platform adapters; Linux input shaping is isolated in platform/linux/inputShape.ts. Start at index.ts and ipc.ts. Renderer APIs are defined in shared/contracts.ts.

The locale IPC returns Electron's system locale and validates the renderer's resolved language before rebuilding tray labels. Locale preferences remain renderer-owned. Missing media metadata stays empty so the view supplies its localized fallback.

See [development](../../docs/development.md) and [repository map](../../INDEX.md).
