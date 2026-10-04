[简体中文](development.zh-CN.md) · English is canonical.

# Development

Use the exact Node LTS patch in `.node-version`, npm 11+, and `npm ci`. Node is shared by local tooling and CI. Electron bundles its own Node runtime; its pinned version must remain in the upstream supported stable range. Update Node, Electron and their compatible tooling together with the checks below. `package-lock.json` fixes dependency resolution; `allowScripts` approves the two dependency build scripts needed by bundling and Windows icon extraction.

Linux needs `dpkg`, `fakeroot`, `rpm` and build tools for installers. Its optional OS features use `playerctl`, `bluetoothctl`, `fuser` and `pactl`. Windows MSI creation needs WiX Toolset; macOS packaging needs Xcode Command Line Tools. Run platform-native makers on their matching host.

```sh
npm ci
npm start
npm run check
npm test
npm run make
```

## Tool ownership

Tool configuration is centralized in [.config](../.config/README.md); package scripts select each file explicitly.

| Command                   | Contract                                                                                                   |
| ------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `typecheck`               | Strict main/preload/renderer/tool TypeScript projects; Vite only transpiles                                |
| `lint`                    | Oxlint TS/React/Hooks correctness and import boundaries; warnings fail                                     |
| `format` / `format:check` | Prettier writes / checks two-space, LF, single-quote, semicolon, 100-column formatting                     |
| `deadcode`                | Knip entries, exports and dependencies; Forge constructors expose dynamically loaded makers/plugins        |
| `duplicates`              | JSCPD production TS/TSX, 100 tokens, 10 lines, maximum 3%; excludes assets/declarations/generated output   |
| `check`                   | All read-only static checks above                                                                          |
| `test`                    | Vitest contracts for existing data, navigation, modes, Windows commands, IPC validation and Linux geometry |

Oxlint's `react/set-state-in-effect` rule is disabled because OS telemetry and preference changes intentionally drive alert/view state in effects. Hooks rules and dependency checks remain enabled. Renderer imports cannot cross into Node, Electron or main/preload; shared code cannot depend on runtime services. TS compiler checks remain authoritative rather than enabling a second type-check engine.

Knip ignores only named OS executables; it does not ignore dependency packages. JSCPD exceptions must be local and justified by distinct semantics. Avoid abstracting unrelated platform behavior to satisfy a duplication percentage.

## Runtime architecture

Main services dispatch to platform adapters and own OS effects. Preload exposes one typed method per operation. Shared contracts carry serializable values. Renderer owns display, interaction and legacy localStorage keys; SettingsProvider is the shared preferences owner, feature hooks own polling and feature state, and the Island controller composes them.

Linux uses a full-display transparent XWayland window. Only X11 ShapeInput follows the animated Island rectangle; changing ShapeBounding can introduce black flashes. The X11 client is statically imported and bundled. Window display waits for the first confirmed input region. See [main](../src/main/README.md) and [renderer](../src/renderer/README.md).

Forge cleans `.vite` before starting and packaging so obsolete bundles cannot ship. Generated `.vite`, `out`, reports and `node_modules` are excluded from Git. Text attributes and editor settings use LF; fonts/icons are binary. Keep English/Chinese docs synchronized; [catalog](INDEX.md).
