[简体中文](platform-compatibility.zh-CN.md)

# Platform compatibility and diagnostics

## Objective and decisions

Ripple Next is a cross-platform application. This work improves Windows adaptation, corrects macOS gaps, expands local diagnostics, and keeps feedback with the affected control. Preserve Ripple Next's SQLite and OS-backed credential contract.

Windows Shell activation succeeds when the OS accepts the request; Explorer's exit code does not describe the target application's result. Executable launches wait for the spawn event. These outcomes confirm the handoff, not the target application's subsequent health.

Launch errors belong to the clicked quick-app item or workflow row. Media actions show feedback in their media view; settings errors appear beside their setting. Shared notices provide text in their feature's layout without an independent bordered, rounded alert surface.

## Findings and corrections

| Area                  | Correction                                                                                                                                                                                                                             |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Windows packaged apps | Replace Explorer exit-code checks with native Shell activation through PowerShell `Start-Process`. Windows registers the screenshot's `OpenAI.Codex_2p2nqsd0c76g0!App` identifier as ChatGPT on this machine.                          |
| Windows discovery     | Use known folders and raw scripts; keep original `.lnk` files so Windows retains shortcut arguments and working directories. Provider failures remain observable. Cache writes are atomic and concurrent rebuilds share one operation. |
| Windows commands      | Normalize executable paths without changing URL arguments or switches. Await workflow launches and continue later targets after one fails.                                                                                             |
| Windows media         | Convert WinRT `IAsyncOperation<T>` to a Task with `AsTask`; local logs confirmed the old `GetAwaiter` call failed on COM objects. Reading and controls share the implementation.                                                       |
| Windows Bluetooth     | Replace slow PnP presence checks with connected classic/LE device queries through WinRT.                                                                                                                                               |
| Clipboard             | Use validated native Electron text read/write methods; browser clipboard permission checks failed while the companion lacked focus. Copy failures remain on the copy button.                                                           |
| Linux/macOS adapters  | Use argument arrays and bounded commands; preserve failures instead of returning false/empty success. Linux's no-player result remains normal. Correct macOS play/pause AppleScript.                                                   |
| Diagnostics           | Exclude multiline stderr from stack frames; record IPC operation/outcome/timing, native error codes and recovery. Walk dump subdirectories without deleting Crashpad metadata.                                                         |
| Cross-platform checks | Run CI checks/tests on Ubuntu, Windows and macOS; separate unavailable-encryption tests from the Linux plaintext-backend test.                                                                                                         |

## Diagnostic coverage

Dev startup uses Forge's start API through a native ESM import. Vite optimizes only `index.html` and ignores `.codegraph` and `out`; a dependency backup inside `.codegraph` had delayed renderer startup. Windows input is owned by main: compare the native cursor and Island bounds in DIP, preserve capture during dragging, and release it outside the Island.

Windows/macOS use the display work area and stay below the taskbar/Dock. Windows leaves an additional 2 DIP inset for auto-hide edges and fractional-scale rounding. Startup shows without activation; explicit focus requests still activate. Display changes synchronize on all platforms.

Windows input cleanup retains the original WebContents reference and runs once. Both application quit and window closure stop polling and remove the input listener without retrieving WebContents from a destroyed BrowserWindow.

macOS discovers bundles in system, shared and user Applications folders, including Utilities, without descending into app internals. Login-item registration now reaches the native API and checks the OS result. Media queries compile only the running player's dictionary, avoiding extra System Events permission and prompts to locate an uninstalled player.

Visible command errors exclude encoded scripts and raw command output. Windows execution uses `windowsHide`; native probes rejected `-WindowStyle Hidden` after observing unreliable exits/output on this host.

Windows MSI tooling also had an unused optional native EXE icon extractor that failed to build against the declared Node version. Its build is disabled because MSI configuration already supplies a bundled `.ico`. This run validates the packaged application; MSI compilation requires WiX on the build host.

Settings → Diagnostics opens `<userData>/diagnostics/`, normally `%APPDATA%\Ripple Next\diagnostics` on Windows. Main and renderer records share a session ID. Logs cover runtime versions, displays/scales, input/media backends, secure-storage availability, window/renderer/child-process lifecycle, suspend/resume, display changes, AI lifecycle and IPC operations.

IPC entries identify the channel, outcome and duration. Healthy polling records its first result. Identical failures are counted and limited to one record per minute, followed by recovery. Error metadata retains real stack frames, safe codes/signals and bounded causes; Windows failures include the native HRESULT.

Command output, IPC arguments/results, clipboard text, app names/targets, AI content, credentials and configured endpoint URLs are excluded. Logs rotate at 5 MiB. Startup retention removes `.dmp` files older than 30 days and keeps the newest 10 across Crashpad subdirectories, preserving metadata. Local minidumps have uploads disabled and may contain in-memory user data.

## Current work and validation

Windows touchpad capture reproduced a long momentum tail holding the elastic edge and fresh gestures arriving before a 150 ms quiet gap. Main now forwards `gestureScrollBegin` and `gestureFlingCancel` start boundaries, coalescing paired signals, through a validated timestamp-only preload event. Elastic pressure decays as input weakens, and a persistent spring preserves position and velocity during return and new input. Tab animation uses a continuous circular position, so a new same-direction request continues through the entering page rather than replacing it. Changes to main/preload require a full restart before validating the bridge; a renderer hot update alone does not install the main listener.

The macOS reports exposed shared interaction problems. Vertical scrolling now uses native overflow instead of smooth-scrollbar's inertia and overscroll plugin. Horizontal switching uses direction as intent, limits each continuous wheel stream to one circular neighbor, retains blur, interpolates size with the transition, and accepts reversal before completion. Long input produces at most 28 pixels of elastic displacement without exposing another page. Pages keep stable keys; repeating arrow keys uses functional state updates rather than a stale tab snapshot. Native touchpad starts define fresh gestures; other wheel sources use a 150 ms input gap, without an animation lock or a distance threshold.

Runtime validation also reproduced a startup charging notification dismissing a page opened by the user 1.5 seconds later. Battery and device notifications now preserve expanded mode when they appear or expire. Automated Electron checks cover native vertical scroll range, tiny horizontal intent, circular order, long-input bounds, blur/size progress, reversal, retained scroll position and normal shutdown. Physical macOS gesture and energy acceptance remains on the Mac host.

Energy corrections remove the scrolling library's continuous animation loop, update the minute-only clock at minute boundaries, and share one macOS capture-device registry read between camera and microphone. macOS/Linux retain hidden-window throttling. Device alerts and clipboard history continue while collapsed. The transparent window still occupies the work area; macOS Bluetooth and media still use bounded polling. These changes reduce confirmed redundant work, but a Mac measurement is required to assess idle energy and the operating system's energy warning. The driver's capture indicators remain best-effort.

Fresh dev runs show the Island within a few seconds. The user confirmed auto-hide taskbar activation was restored and terminal/focus interruptions were no longer observed in the current run. A 35-second native observation saw Ripple's query children without visible console windows or foreground activation.

On this Windows host, WebGL uses Intel Iris Xe through ANGLE/D3D11; GPU compositing and rasterization are enabled. A visible 165 Hz window sampled about 164–165 frame callbacks per second. This measures frame scheduling, not a guarantee for every animation. The Windows companion disables background throttling so visible animations continue when another application has focus; macOS and Linux retain hidden-window throttling. Diagnostics record hardware acceleration, compositing, rasterization and WebGL status, plus Windows capture/passthrough transitions without cursor coordinates.

Changes are implemented. Validation uses Node `22.23.3`, pnpm `12.9.1`, the full check/test commands, Windows packaging, native PowerShell/WinRT probes and a packaged-renderer smoke test of discovery, clipboard access, successful activation and a real missing-executable failure.

Linux/macOS source paths and platform-neutral tests were checked on Windows. Native-package and physical-device acceptance still run on their matching hosts. Windows camera/microphone registry records and macOS driver indicators remain best-effort probes rather than universal capture APIs.

macOS login items require a packaged, signed and notarized application for reliable registration. Current packaging supplies an ad-hoc signature; development builds report login-item registration as unavailable.

Reinstall dependencies with `pnpm install --frozen-lockfile` when changing hosts. Keep the lockfile; do not carry `node_modules` across OSes. Existing Linux desktop entries and Windows/macOS app identifiers remain bound to their platform; re-select installed quick apps on the destination OS. The database/state format remains unchanged.

## API references

- [Microsoft ShellExecuteEx](https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shellexecuteexa)
- [PowerShell Start-Process](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.management/start-process)
- [WinRT AsTask](https://learn.microsoft.com/en-us/dotnet/api/system.windowsruntimesystemextensions.astask)
- [Bluetooth connection selector](https://learn.microsoft.com/en-us/uwp/api/windows.devices.bluetooth.bluetoothdevice.getdeviceselectorfromconnectionstatus)
- [Electron window levels and inactive display](https://www.electronjs.org/docs/latest/api/browser-window)
- [Electron GPU status and login items](https://www.electronjs.org/docs/latest/api/app)
