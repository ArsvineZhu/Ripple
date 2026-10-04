[简体中文](release.zh-CN.md) · English is canonical.

# Release and runtime acceptance

Run `npm run check`, `npm test`, then `npm run make` on the target platform. CI's build matrix covers Windows x64 MSI, macOS x64/arm64 DMG and Linux x64 DEB/RPM/ZIP. Installers are named `Ripple-<OS>-v<version>` (macOS includes architecture). Build results live under `out/make`.

The application identity remains `ripple` / `Ripple`; the existing userData directory and localStorage keys remain compatible with 3.3.0. Version 3.4.0 is the TypeScript/governance migration. Preserve real user data while smoke testing; use a separate temporary profile for automated interaction. Never publish a development-only sandbox override in launchers or desktop entries.

Linux desktop entries and autostart use `--ozone-platform=x11`. DEB/RPM staging retains the root-owned SUID sandbox helper permissions. The RPM template explicitly uses staging paths and a temporary RPM database so both RPM 4 and RPM 6 builds work without modifying the host database.

## Acceptance

Check tray Show/Hide/Quit, startup, transparent Island rendering, outside clicks, hover/click modes, repeated expand/collapse, arrows/wheel/Ctrl-number navigation, all available tabs, themes, display/position selection, tab ordering/hiding/default selection, and saved settings after restart. Check tasks/workflows/quick apps, clipboard copy, AI configuration, overview/weather/battery and media controls. Media and hardware alerts require an active media source or corresponding device.

Native macOS and Windows media/device/autostart behavior needs a matching host. Passing package builds and adapter contracts establishes build compatibility, not native runtime verification. Record those results independently from Linux checks. AI provider requests require the user's own key; do not include keys or clipboard contents in logs.

An upgrade that leaves a previous process running can show old code; quit that process before launching the new binary. [Catalog](INDEX.md).
