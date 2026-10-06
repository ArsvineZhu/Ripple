# Local Diagnostics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add local structured logs and crash dumps that explain Island, renderer, X11, and AI lifecycle failures without changing feature-owned error presentation.

**Architecture:** `electron-log` owns file logging and renderer-to-main delivery; Electron `crashReporter` stores minidumps locally. A main-process diagnostics service owns initialization, retention, safe error summaries, lifecycle records, renderer context, and opening the diagnostics directory. Renderer state summaries travel as reserved events through electron-log's supported transport. The only new `electronAPI` method is the Settings action.

**Tech Stack:** Electron 44, electron-log, TypeScript, Vitest, pnpm.

**Spec:** [Local diagnostics system design](../specs/2026-10-06-local-diagnostics-design.md)

## Global Constraints

- Write diagnostics under `<userData>/diagnostics/`; do not read, migrate, or delete legacy Ripple data.
- Initialize logging and Crash Reporter after setting Ripple Next `userData` and before creating a window or child process.
- Start Crash Reporter with `uploadToServer: false`; keep native minidumps local and never attach or upload them automatically.
- Keep `ripple-next.log` and one rotated backup, each capped at 5 MiB; retain crash files for 30 days and at most 10 newest entries.
- Log allowlisted lifecycle metadata only. Exclude prompts, answers, keys, authorization headers, endpoint URLs, settings, tasks, clipboard data, and search input. Error summaries omit free-form messages.
- Keep operational errors in their owning feature's existing inline UI. Do not add a popup, automatic recovery, renderer reload, or telemetry.
- Preserve staged user changes in the current feature branch. Do not stage, reset, commit, publish, or install this work.
- Use Node and pnpm versions declared by the project. Run `pnpm check`, `pnpm test`, and `pnpm package` after the integration.

## Review Focus

- A non-`Error` rejection or an error whose message contains request data must produce a useful type/stack summary without recording that message. Test in Task 1 with `serializeDiagnosticError`.
- A missing or non-directory crash path must not prevent startup. Test in Task 1 with `pruneCrashReports` and initialization failure injection.
- A malformed renderer context event, unknown Tab ID, non-finite dimensions, or extra fields must not replace the last valid context. Test in Task 3 through the main-side log-event validator.
- A renderer exit immediately after an AI response must correlate with the latest Island state and AI request ID/counts without answer text. Test in Tasks 2 and 3.
- Logger or Crash Reporter initialization failure must be reported to stderr while the current startup path continues; fatal exception observation must not change Node's exit behavior. Test in Tasks 1 and 2.

## File Ownership Map

- `src/shared/diagnostics.ts`: strict renderer context schema and cross-process diagnostic types.
- `src/main/services/diagnostics.ts`: electron-log configuration, Crash Reporter setup, error serialization, crash-file retention, structured records, context cache, and folder opening.
- `src/main/index.ts`, `src/main/window.ts`, `src/main/services/processDiagnostics.ts`, `src/main/services/windowDiagnostics.ts`, `src/main/platform/linux/inputShape.ts`, `src/main/platform/windows/media.ts`: startup ordering and main/window/platform lifecycle instrumentation.
- `src/shared/contracts.ts`, `src/preload/index.ts`, `src/main/ipc.ts`: one narrow, typed Settings action; preserve sender validation.
- `src/renderer/lib/diagnostics.ts`, `src/renderer/index.tsx`, `src/renderer/Island.tsx`, `src/renderer/hooks/useAssistant.ts`: renderer exceptions, current Island breadcrumbs, and AI request timing/counts.
- `src/renderer/features/SettingsTab.tsx`, `src/shared/i18n/{en,zh-CN,zh-TW,ja}.ts`, `src/shared/contracts.ts`: diagnostics-folder control and its existing Settings-area inline failure.
- `tests/diagnostics.test.ts`, `tests/window-diagnostics.test.ts`, `tests/process-diagnostics.test.ts`, `tests/renderer-diagnostics.test.ts`, `tests/assistant-hook.test.ts`, `tests/ipc.test.ts`, `tests/i18n.test.ts`: focused behavior and boundary tests.
- `docs/development.md`, `docs/development.zh-CN.md`, and `docs/INDEX*.md`: local log/dump location, privacy handling, access action, and plan navigation.

---

### Task 1: Local logger, safe records, and crash retention

**Files:**

- Modify: `package.json`, `pnpm-lock.yaml`
- Create: `src/shared/diagnostics.ts`
- Create: `src/main/services/diagnostics.ts`
- Test: `tests/diagnostics.test.ts`

**Interfaces:**

- Export `RendererDiagnosticContext` with `tabId`, `mode`, `expanded`, `asked`, `answerCharacters`, `viewport` (`width`, `height`), and `inputRegion` (`width`, `height`). Use integer Tab IDs, `IslandMode`, and finite non-negative dimensions.
- Define `DiagnosticEvent` as a discriminated union for app startup, window lifecycle, renderer exit, child-process exit, Linux input-shape changes, and assistant-request phases. Keep event-specific fields enumerated; never pass free-form request or settings data.
- Export `serializeDiagnosticError(error: unknown): { type: string; frames: string[] }`; never return `Error.message`, a string rejection value, or the first stack line.
- Export `pruneCrashReports(directory: string, now: number): Promise<void>`; remove entries older than 30 days, then keep at most the 10 newest by filesystem modification time without interpreting Crashpad filenames or contents.
- Export `initializeDiagnostics(userDataPath: string): Promise<DiagnosticsService>` where `DiagnosticsService` exposes `record(event: DiagnosticEvent): void`, `recordError(source: DiagnosticErrorSource, error: unknown): void`, `setRendererContext(context: RendererDiagnosticContext): void`, `getRendererContext(): RendererDiagnosticContext | undefined`, and `openFolder(): Promise<void>`. `DiagnosticErrorSource` is a fixed union for application, window, Linux input, assistant, media, device, clipboard, overview, and diagnostics failures.

- [ ] **Step 1: Add `electron-log` and pin its resolved version in the lockfile**

Run: `pnpm add electron-log@latest --save-exact`

Expected: `electron-log` is a production dependency and `pnpm-lock.yaml` resolves it for the existing Node 22+ / Electron 44 toolchain.

- [ ] **Step 2: Write failing tests for safe error serialization, retention, and initialization**

In `tests/diagnostics.test.ts`, add tests named `serializeDiagnosticError omits the message and keeps stack frames`, `pruneCrashReports removes entries older than 30 days and keeps the 10 newest`, `pruneCrashReports treats an unavailable directory as non-fatal`, and `initializeDiagnostics keeps upload disabled and tolerates logger or crash-reporter setup errors`.

- [ ] **Step 3: Run the focused tests and confirm they fail for the missing APIs**

Run: `pnpm exec vitest run --config .config/vitest.config.mts tests/diagnostics.test.ts`

Expected: FAIL because the diagnostics service and helpers do not exist.

- [ ] **Step 4: Implement the types and diagnostics service**

Configure electron-log's main transport to `<userData>/diagnostics/ripple-next.log`, `maxSize = 5 * 1024 * 1024`, and the single `.old.log` backup. Initialize renderer transport through electron-log's documented bundled integration. Create the diagnostics directory with owner-only Linux permissions. Set `crashDumps` to `<userData>/diagnostics/crashes`, then start Crash Reporter with uploads disabled. Let logger, retention, and Crash Reporter setup errors reach stderr without rejecting app startup.

- [ ] **Step 5: Run the focused diagnostics tests**

Run: `pnpm exec vitest run --config .config/vitest.config.mts tests/diagnostics.test.ts`

Expected: PASS for message omission, 30-day/10-entry retention, disabled uploads, and non-blocking setup failures.

### Task 2: Main process, window, and Linux lifecycle records

**Files:**

- Modify: `src/main/index.ts`, `src/main/window.ts`, `src/main/platform/linux/inputShape.ts`, `src/main/platform/windows/media.ts`
- Create: `src/main/services/processDiagnostics.ts`, `src/main/services/windowDiagnostics.ts`
- Create: `tests/window-diagnostics.test.ts`, `tests/process-diagnostics.test.ts`
- Test: `tests/diagnostics.test.ts`

**Interfaces:**

- `initializeDiagnostics(userDataPath)` from Task 1 returns the shared `DiagnosticsService`.
- Change `createWindow` to accept `diagnostics: DiagnosticsService` and the existing optional load-error callback; update every caller in `src/main/index.ts`.
- Attach listeners before loading the renderer. Record documented window visibility/focus/readiness, `did-fail-load`, `unresponsive`/`responsive`, `render-process-gone`, and app `child-process-gone` events.

- [ ] **Step 1: Write failing tests for window lifecycle, renderer-exit context, and fatal error monitoring**

In `tests/window-diagnostics.test.ts`, cover `ready-to-show`, `show`, `hide`, `focus`, `blur`, `unresponsive`, `responsive`, `did-fail-load`, and `render-process-gone`; assert the exit record contains reason, exit code, window IDs, and the most recent valid context. In `tests/process-diagnostics.test.ts`, assert `installFatalErrorMonitor` logs a synthetic `uncaughtExceptionMonitor` event without adding `uncaughtException` or `unhandledRejection` handlers.

- [ ] **Step 2: Run the focused lifecycle tests and confirm they fail**

Run: `pnpm exec vitest run --config .config/vitest.config.mts tests/window-diagnostics.test.ts tests/process-diagnostics.test.ts`

Expected: FAIL because window diagnostics are not attached.

- [ ] **Step 3: Initialize diagnostics before `app.whenReady()` creates windows**

In `src/main/services/processDiagnostics.ts`, export `installFatalErrorMonitor(diagnostics: DiagnosticsService): () => void` and attach only `uncaughtExceptionMonitor`. In `src/main/index.ts`, initialize after the product `userData` path is set, record startup versions/platform/architecture, install the monitor, and register Electron child-process exit records. Keep existing app startup and exit behavior.

- [ ] **Step 4: Attach window and X11 input-shape lifecycle records**

Implement the event recorder in `src/main/services/windowDiagnostics.ts`, then attach it from `src/main/window.ts` before loading the renderer. Record window lifecycle and renderer termination details with the cached context. In `src/main/platform/linux/inputShape.ts`, record initialization/readiness/failure and the first confirmed input-region dimensions; omit pointer coordinates and animation-frame geometry. Route Windows media process failures through the diagnostics service and remove console traces that include track titles, stdout, or full errors.

- [ ] **Step 5: Run the focused lifecycle and input-shape tests**

Run: `pnpm exec vitest run --config .config/vitest.config.mts tests/diagnostics.test.ts tests/window-diagnostics.test.ts tests/process-diagnostics.test.ts`

Expected: PASS; renderer termination has a structured reason and current context, and logging does not change fatal exception behavior.

### Task 3: Renderer context and renderer/AI diagnostics

**Files:**

- Modify: `src/main/services/diagnostics.ts`, `src/renderer/index.tsx`, `src/renderer/Island.tsx`, `src/renderer/hooks/useAssistant.ts`
- Create: `src/renderer/lib/diagnostics.ts`, `tests/renderer-diagnostics.test.ts`, `tests/assistant-hook.test.ts`
- Test: `tests/diagnostics.test.ts`

**Interfaces:**

- Renderer diagnostics expose `recordRendererError(source, error): void` and `recordRendererContext(context): void`; context is sent as a reserved structured event through electron-log rather than a new `electronAPI` method.
- The main-side logger hook passes renderer context events through a strict schema before calling `DiagnosticsService.setRendererContext(context)`. The application currently has one Island renderer, so the service keeps one latest context snapshot.

- [ ] **Step 1: Write failing tests for renderer context, global errors, and assistant request records**

In `tests/diagnostics.test.ts`, verify a valid reserved renderer context event updates the cache while an unknown Tab ID/non-finite geometry/extra property leaves the last valid context intact. In `tests/renderer-diagnostics.test.ts`, assert global errors and non-Error rejections produce safe summaries. In `tests/assistant-hook.test.ts`, assert start/first-delta/done, cancellation, and failure share the request ID and include timing/counts without prompt or answer strings. Use the test suite's `.test.ts` pattern and a per-file happy-dom directive for renderer tests.

- [ ] **Step 2: Run the focused tests and confirm the new behavior fails**

Run: `pnpm exec vitest run --config .config/vitest.config.mts tests/diagnostics.test.ts tests/renderer-diagnostics.test.ts tests/assistant-hook.test.ts`

Expected: FAIL because renderer context event capture and diagnostics hooks do not exist.

- [ ] **Step 3: Implement strict context IPC and the renderer diagnostics wrapper**

In the renderer wrapper, use `electron-log/renderer`; serialize errors without message text and emit a reserved context event from a small renderer-side snapshot so state transitions and final AI counts update the main-process cache. In the main diagnostics service, accept the reserved event only after strict schema validation and associate it with the emitting app renderer.

- [ ] **Step 4: Record renderer exceptions, React root errors, Island state, and AI request metrics**

Register `window.error`, `unhandledrejection`, and React root `onCaughtError`, `onUncaughtError`, and `onRecoverableError`. Record current Tab, Island mode, expanded/asked state, answer character count at AI completion, viewport size, and input-region size on state/geometry transitions. In `useAssistant`, record request ID, start, first delta time, delta count, done/cancel/error, duration, and final character count; never pass the prompt or response text to the logger.

- [ ] **Step 5: Route existing app-owned renderer `console.warn/error` paths through the diagnostics wrapper**

Audit the renderer's operational error callsites, including device, clipboard, media, and overview hooks. Replace only app-owned operational logs with typed events; keep user-facing inline errors unchanged and omit free-form values.

- [ ] **Step 6: Run renderer and IPC tests**

Run: `pnpm exec vitest run --config .config/vitest.config.mts tests/diagnostics.test.ts tests/renderer-diagnostics.test.ts tests/assistant-hook.test.ts`

Expected: PASS, with validated context events and content-free AI diagnostic records.

### Task 4: Settings access to local diagnostics

**Files:**

- Modify: `src/shared/contracts.ts`, `src/main/ipc.ts`, `src/preload/index.ts`, `src/shared/i18n/en.ts`, `src/shared/i18n/zh-CN.ts`, `src/shared/i18n/zh-TW.ts`, `src/shared/i18n/ja.ts`, `src/renderer/features/SettingsTab.tsx`
- Test: `tests/ipc.test.ts`, `tests/i18n.test.ts`

**Interfaces:**

- Add `InvokeMap['open-diagnostics-folder']` with no arguments and `void` result; add `ElectronAPI.openDiagnosticsFolder(): Promise<void>`. This is the only new `electronAPI` method.
- Add `diagnosticsFolderOpenFailed` to `NoticeCode`, routed to the existing `settings` notice area.

- [ ] **Step 1: Write a failing IPC test for opening the folder and reporting a Settings-area failure**

Verify success delegates to `DiagnosticsService.openFolder()` and failure reports `diagnosticsFolderOpenFailed` in `settings` while preserving the IPC rejection.

- [ ] **Step 2: Run the focused IPC test and confirm the new channel fails**

Run: `pnpm exec vitest run --config .config/vitest.config.mts tests/ipc.test.ts`

Expected: FAIL because the typed channel and notice code do not exist.

- [ ] **Step 3: Add the Settings action and four locale messages**

Add one button in Settings that opens the diagnostics directory. Render failures through the existing `InlineNotices` mechanism in Settings; add the label and error message to all four bundled catalogs.

- [ ] **Step 4: Run IPC and locale-parity tests**

Run: `pnpm exec vitest run --config .config/vitest.config.mts tests/ipc.test.ts tests/i18n.test.ts`

Expected: PASS; the folder opens through the typed bridge, failures stay inline, and all locales have matching non-empty keys and interpolation variables.

### Task 5: Documentation and integration verification

**Files:**

- Modify: `docs/development.md`, `docs/development.zh-CN.md`, `docs/INDEX.md`, `docs/INDEX.zh-CN.md`
- Verify: app package and local diagnostics behavior

- [ ] **Step 1: Document the local diagnostics path, folder action, retention, and minidump privacy**

Update each development guide for its readers. Describe the local-only behavior and commands without copying or restaging the current user edits in these files.

- [ ] **Step 2: Add links to the English and Chinese plan in the documentation indexes**

Keep both relative links valid and label each in the corresponding language.

- [ ] **Step 3: Run the project static checks and tests**

Run: `pnpm check && pnpm test`

Expected: both commands exit successfully.

- [ ] **Step 4: Package the Linux application and inspect the resulting diagnostics behavior**

Run: `pnpm package`

Expected: package succeeds; a local run writes logs under Ripple Next `userData/diagnostics/`, Settings opens that directory, and an AI request logs lifecycle metadata without prompt/answer content. Confirm an app/window lifecycle record remains after closing the Island window.

- [ ] **Step 5: Confirm existing opt-in Windows/macOS packaging jobs can compile the new integration**

Use the repository's existing manually triggered packaging workflow if available. Do not add per-commit CI triggers or start a release from this task. Record unavailable platform execution as unverified.
