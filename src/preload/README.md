[简体中文](README.zh-CN.md)

# Preload bridge

Preload exposes the isolated `electronAPI` through explicit `contextBridge` methods. It maps typed calls and events to named IPC channels from [shared contracts](../shared/README.md); renderer code never receives raw `ipcRenderer` access.

The bridge covers app-state bootstrap and patches, secure API-key save/removal, quick-app discovery and launch, AI stream events and cancellation, notices, locale, media, autostart, display and window input shape. API-key material is sent to main for storage and is absent from the bootstrap response.

Keep this bundle sandbox-compatible and keep each bridge method aligned with its shared request, response and event contract.

See the [developer guide](../../docs/development.md) and [repository map](../../INDEX.md).

The bridge also exposes `readClipboardText()` and `writeClipboardText(text)` so desktop clipboard operations use Electron's native API without browser focus/permission assumptions.

`onScrollGestureStart(callback)` delivers validated native touchpad start timestamps through `scroll-gesture-start` and returns an unsubscribe function. It exposes no raw input events or pointer/key data.
