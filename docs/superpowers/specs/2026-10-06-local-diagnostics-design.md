# Local Diagnostics System

**Status:** Review draft
**Date:** 2026-10-06
**Readers:** Ripple Next maintainers

[简体中文](2026-10-06-local-diagnostics-design.zh-CN.md)

## Objective

Give maintainers enough local evidence to distinguish a hidden Island, a closed BrowserWindow, a failed renderer, an X11 input-shape failure, and an AI request that ended without rendering its answer. Keep diagnostics available after a renderer or native process exits.

The current Electron process can outlive its Island window. The application has no consistent file logger, and it does not record Electron renderer or child-process exit reasons. Diagnostics must cover those lifecycle boundaries without changing the Island's interaction or failure presentation.

## Decisions

- Use `electron-log` for file logging and its supported renderer-to-main transport.
- Use Electron `crashReporter` with `uploadToServer: false` to save native minidumps locally.
- Initialize both before creating renderer or other child processes.
- Keep all diagnostic data under `<userData>/diagnostics/`, separate from the SQLite database and API-key records.
- Add an action in Settings to open the diagnostics folder. Existing feature-owned inline error messages remain the UI for operational errors; diagnostics do not add a floating alert or popup.
- Do not reload a renderer, recreate a window, or restart the app as part of this diagnostics change.

Implementation references: [Electron `crashReporter`](https://www.electronjs.org/docs/latest/api/crash-reporter), [Electron `webContents`](https://www.electronjs.org/docs/latest/api/web-contents/), and [electron-log initialization](https://github.com/megahertz/electron-log/blob/master/docs/initialize.md).

## Ownership and lifecycle

`src/main/services/diagnostics.ts` owns the diagnostics directory, logger configuration, retention, safe error serialization, Electron crash reporter initialization, and the main-process event recorder. `src/main/index.ts` initializes it after setting the Ripple Next `userData` path and before `app.whenReady()` creates windows. It sets Electron's `crashDumps` path to `<userData>/diagnostics/crashes` before starting `crashReporter`.

Main, preload, and renderer use `electron-log`'s supported integration. The renderer bridge stays sandbox-compatible and does not expose raw `ipcRenderer` or a general-purpose IPC method. The existing `electronAPI` gains only `openDiagnosticsFolder()`; the main process opens the diagnostics directory and reports failures through the existing Settings notice route.

Register lifecycle listeners at window creation. Record startup, renderer bootstrap completion, window `ready-to-show`, `show`, `hide`, `focus`, `blur`, `unresponsive`, `responsive`, `closed`, load failure, renderer exit, and Electron child-process exit. Renderer-exit entries include the documented reason and exit code. Linux diagnostics record X11 input-shape initialization and readiness, along with the applied rectangle dimensions; they do not log pointer coordinates or every animation-frame update.

The renderer records `window.error`, `unhandledrejection`, and React root `onCaughtError`, `onUncaughtError`, and `onRecoverableError`. Main-process uncaught exceptions are observed without suppressing the runtime's fatal behavior. Unhandled rejections are recorded while retaining the runtime's configured fatal policy.

## Event data

Use timestamped, structured events with a process name, event name, severity, and an explicit allowlist of scalar fields. Log application, Electron, Chromium, Node, OS, architecture, window ID, `webContents` ID, process type, renderer-exit reason, and exit code where applicable.

For Island state transitions, record only current Tab ID, interaction mode, expanded/asked state, rendered answer character count, viewport dimensions, and input-region dimensions. Record changes and lifecycle boundaries only; do not poll state or log animation frames.

For AI requests, record request ID, start/end/cancel/error outcome, elapsed time, time to first delta, delta count, and final character count. Do not record model prompts, streamed content, API keys, authorization headers, provider response bodies, configured endpoint URLs, user settings, tasks, clipboard contents, or user-entered search data. General error records include error type and stack frames without the first stack line's free-form message. Feature-owned error details continue to appear in their current inline UI.

Crash minidumps are binary process snapshots and may contain fragments of in-memory data, including data not present in text logs. They remain local and are never uploaded or attached automatically. The Settings action only opens the folder; the user chooses whether to share its contents.

## Storage and retention

- Text logs: `<userData>/diagnostics/ripple-next.log`, with one rotated backup; configure a 5 MiB maximum for each file.
- Native crash reports: `<userData>/diagnostics/crashes/`, owned by Electron Crashpad.
- On startup, remove crash files older than 30 days and keep at most the 10 most recent reports. Do not parse Crashpad filenames or report contents; Electron documents their layout as an implementation detail.
- On Linux, create the diagnostics directory with owner-only permissions. Keep it separate from old Ripple directories; diagnostics initialization must not read, migrate, or delete application data.

## Failure behavior

Failure to initialize text logging is written to stderr and does not block app startup. Failure to initialize `crashReporter` is logged and does not block app startup. Failure to open the diagnostics folder uses the existing Settings inline error mechanism. A renderer exit is logged while the main process and tray retain their existing lifecycle behavior.

No new app-wide notification surface is introduced. Assistant, Search, Settings, and other feature errors remain rendered by their owning feature. Diagnostic recording provides the post-event trace for cases where the owning renderer view disappears.

## Acceptance criteria

1. Logs from main and renderer arrive in the same local diagnostics folder and rotate within the configured size.
2. Main-process, renderer, GPU/utility, and native crashes produce either a structured lifecycle record or a local minidump, as supported by Electron.
3. A renderer exit records its reason, exit code, window identifiers, and the latest Island/AI state breadcrumbs without logging request content.
4. AI start, first delta, completion, cancellation, and failure can be correlated by request ID and elapsed time.
5. Tests confirm safe error serialization, retention, and the typed Settings action; Linux X11 logs do not include pointer coordinates or high-frequency geometry events.
6. The diagnostics folder opens from Settings. Existing inline errors and normal startup behavior remain intact.
7. `pnpm check`, `pnpm test`, and Linux packaging pass. Windows/macOS package CI exercises initialization; physical-device crash validation is recorded separately.

## Out of scope

Remote telemetry, automatic report submission, crash-triggered window recovery, a new notification dialog, log export/upload UI, usage analytics, and changes to AI request behavior.
