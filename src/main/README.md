[简体中文](README.zh-CN.md)

# Main process

Main owns the app lifecycle, tray, transparent window, IPC validation and system effects. `index.ts` sets Ripple Next's user-data directory and loads typed state and secure credential storage before opening the renderer.

Services own atomic state persistence, encrypted API keys, notices, AI requests, app discovery and launch, and autostart. Platform adapters contain Linux, macOS and Windows behavior. `ipc.ts` validates sender identity and payloads against [shared contracts](../shared/README.md).

The bundled system prompt lives in `prompts/default-assistant.md`. Before each AI request, `prompts/injections.ts` resolves `{{product}}`, `{{developer}}`, `{{version}}`, `{{license}}`, `{{repository}}`, `{{issues}}`, `{{timezone}}` and `{{current_time}}`. Static metadata comes from `package.json`; `{{version}}` uses Electron's `app.getVersion()`. Time values follow the configured time zone, with `system` resolved from the operating system; `{{current_time}}` uses `YYYY-MM-DD HH:mm:ss`. Unknown variables remain unchanged, and user prompts are sent without template expansion.

On Linux, the window waits for renderer readiness and the first confirmed X11 `ShapeInput` region. Keep the X11 client statically bundled; input shaping uses `ShapeInput`.

See the [developer guide](../../docs/development.md) and [repository map](../../INDEX.md).
