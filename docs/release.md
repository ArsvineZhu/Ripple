[简体中文](release.zh-CN.md)

# Package and runtime acceptance

Run `pnpm check`, `pnpm test`, then `pnpm make` on the matching host. CI packages macOS x64/arm64 DMG, Windows x64 MSI and Linux x64 DEB/RPM/ZIP. Installers and Actions artifacts use the `RippleNext-<platform>` identity. Pushing a `v<version>` tag matching `package.json` runs the matrix and creates a GitHub Release with all package files. Branch and pull-request runs only build downloadable Actions artifacts.

The current beta notes are available in [English](releases/4.0.0-beta.1.en.md) and [简体中文](releases/4.0.0-beta.1.zh-CN.md). The product/package identity is `ripple-next` / `Ripple Next`, with macOS bundle ID `com.arsvinezhu.ripple-next`. Ripple Next stores state and encrypted API-key ciphertext in `ripple-next.sqlite` under its platform-specific user-data directory. Numbered schema changes are applied from `src/main/database/migrations/`; runtime SQL stays in `.sql` resources. The former Ripple data directory is not read or migrated. When Linux autostart is enabled, Ripple Next writes `ripple-next.desktop` and removes the old `ripple.desktop` autostart entry.

Linux desktop launch uses XDG application entries and `gio launch`; custom command targets use separate argv items without a shell. The X11 helper is statically bundled. Linux startup remains hidden until the renderer is ready and ShapeInput has been queried to confirm the Island region. Keep `--ozone-platform=x11` in Linux autostart entries. RPM staging retains the root-owned SUID sandbox helper.

## Runtime acceptance

Check tray Show/Hide/Quit, startup, transparent Island rendering, outside clicks, hover/click modes, repeated expand/collapse, arrow/wheel/Ctrl-number navigation, all tabs, themes, display/position selection, tab ordering/hiding/default selection and state after restart. Check installed Linux app discovery/launch, custom command arguments and working directory, URL targets, workflows, clipboard, AI Base URL/model/key and cancellation, overview/weather/battery, media controls and notices. Hardware/media alerts require their corresponding device or source.

For pointer leave, verify the configured 0–2000 ms delay, cancellation on re-entry/menu/focus/drag, and the geometry gate after the Island moves or shrinks under the pointer. Verify X11 input shaping and click-through at the viewport edges.

Native macOS and Windows media/device/autostart behavior requires a matching host. Record native runtime results separately from package builds. Do not include API keys or clipboard contents in logs. Pushing a matching `v<version>` tag starts the release workflow; versions containing a prerelease suffix such as `-beta.1` are published as GitHub prereleases. The workflow uses the matching English and Simplified Chinese release-note files when both exist, and GitHub-generated notes otherwise.
