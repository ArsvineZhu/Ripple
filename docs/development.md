[简体中文](development.zh-CN.md)

# Development

Use Node `22.23.3` from [.node-version](../.node-version) and pnpm `12.9.1` from `package.json`. The current toolchain requires Node 22.13 or newer. Linux packaging needs `dpkg`, `fakeroot`, `rpm` and build tools. Optional system features use `playerctl`, `bluetoothctl`, `fuser` and `pactl`. Windows MSI creation needs WiX Toolset; macOS packaging needs Xcode Command Line Tools. Run native makers on their matching host.

```sh
pnpm install --frozen-lockfile
pnpm start
pnpm check
pnpm test
pnpm make
```

On Linux, development may need a matching Chromium sandbox helper owned by root with mode `4755`. If Ripple Next is installed from the same Electron build, set `CHROME_DEVEL_SANDBOX=/usr/lib/ripple-next/chrome-sandbox` when starting Forge.

## Tool ownership

Tool configuration is centralized in [.config](../.config/README.md); package scripts select each file explicitly.

| Command                   | Contract                                                                                                                                            |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `typecheck`               | Strict main/preload/renderer/tool TypeScript projects; Vite only transpiles                                                                         |
| `lint`                    | Oxlint TS/React/Hooks correctness and import boundaries; warnings fail                                                                              |
| `format` / `format:check` | Prettier writes / checks the configured two-space, LF, single-quote and 100-column style                                                            |
| `deadcode`                | Knip entries, exports and dependencies; Forge constructors expose dynamic makers/plugins                                                            |
| `duplicates`              | JSCPD scans production TS/TSX with the configured threshold                                                                                         |
| `check`                   | All read-only static checks above                                                                                                                   |
| `test`                    | Vitest covers state persistence, secure key storage, IPC, AI streaming, interaction transitions, localization, platform commands and Linux geometry |

Oxlint disables `react/set-state-in-effect` for intentional OS telemetry and preference effects. Renderer imports cannot cross into Node, Electron or main/preload; shared modules cannot depend on runtime services. TypeScript remains the type-checking authority.

## Runtime architecture

Main owns application lifecycle, tray, the transparent window, system effects and typed IPC. Services own state persistence, secure credentials, notifications, AI requests, app discovery/launch and autostart. Platform adapters own native differences. Preload exposes the typed `electronAPI`; shared Zod schemas validate persisted state and launch targets. Renderer owns views and interaction, with XState managing pointer departure, geometry re-entry, focus, menus and drag guards.

The state service stores settings, tasks, workflows, quick apps, and encrypted API-key ciphertext in `ripple-next.sqlite` under the Ripple Next user-data directory. Numbered schema migrations live in `src/main/database/migrations/`; named runtime statements live in `src/main/database/queries/` as `.sql` files. Keep SQL text in those resources and bind values from TypeScript. Renderer loads a state snapshot before rendering and sends typed patches; it does not use `localStorage` for settings or feature data. API keys use Electron `safeStorage` and are never returned to renderer. Linux refuses to save keys when OS-backed encryption is unavailable. Ripple Next does not read or migrate the old Ripple data directory. Enabling Linux autostart writes `ripple-next.desktop` and removes only the old `ripple.desktop` launch entry.

Vercel AI SDK's `streamText` and OpenAI-compatible provider implement streaming chat in main. The default system prompt is maintained in `src/main/prompts/default-assistant.md` and bundled with the main process. `xstate` and `@xstate/react` implement cancellable interaction delays and re-entry gates. Linux quick apps discover XDG desktop entries and launch them through `gio launch`; custom commands use `spawn` with an argument array and no shell.

The browser search URL template is persisted in settings and must contain `{query}`; direct HTTP(S) addresses still open as URLs. Clock and date formatting use the selected locale and either the system time zone or a saved IANA zone. Renderer errors are routed to their owning feature and rendered inline; `InlineNotices` uses the Island's existing Motion fade-and-blur transition. Long vertical panels use Smooth Scrollbar's bounce overscroll; the AI answer panel grows with its content up to the available screen height. Range controls use the settings CSS Module for themed tracks, thumbs and focus states.

Linux uses a full-display transparent XWayland window. Only X11 `ShapeInput` follows the animated Island rectangle; changing `ShapeBounding` can introduce black flashes. The X11 client remains statically imported and bundled. Background mode requests `_NET_WM_STATE_SKIP_TASKBAR` through the existing X11 client. The window is shown only after renderer readiness and confirmation of the first input region. See [main](../src/main/README.md), [preload](../src/preload/README.md) and [renderer](../src/renderer/README.md).

Forge cleans `.vite` before starting and packaging. Generated `.vite`, `out`, reports and `node_modules` are excluded from Git. The [documentation catalog](INDEX.md) links guides for each audience.
