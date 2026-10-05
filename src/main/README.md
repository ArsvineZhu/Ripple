[简体中文](README.zh-CN.md)

# Main process

Main owns the app lifecycle, tray, transparent window, IPC validation and system effects. `index.ts` sets Ripple Next's user-data directory and loads typed state and secure credential storage before opening the renderer.

Services own atomic state persistence, encrypted API keys, notices, AI requests, app discovery and launch, and autostart. Platform adapters contain Linux, macOS and Windows behavior. `ipc.ts` validates sender identity and payloads against [shared contracts](../shared/README.md).

On Linux, the window waits for renderer readiness and the first confirmed X11 `ShapeInput` region. Keep the X11 client statically bundled; input shaping uses `ShapeInput`.

See the [developer guide](../../docs/development.md) and [repository map](../../INDEX.md).
