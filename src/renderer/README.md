[简体中文](README.zh-CN.md)

# Renderer

Owns Island display and interaction. Island.tsx composes feature views and QuickView; useIslandController composes feature hooks. AppStateProvider loads and updates persisted state through the main-process service. SettingsProvider owns renderer-level language preference. Ripple Next starts with a new state format and does not read the former Ripple storage.

Internationalization initializes before rendering. The bundled shared catalogs define message keys; SettingsProvider owns the `language` preference and synchronizes the resolved language to the tray. Dates and numbers use the selected locale.

`styles/base.css` owns the transparent document, fonts and shared animation; `styles/tokens.css` owns theme/font tokens. Island, shared controls and feature views own their CSS Modules. Static presentation belongs in those modules; Motion parameters and runtime color/geometry values stay with their owners. OverlayProvider mounts Select menus inside the Island boundary, and useIslandInteraction owns movement, focus, hover and menu-open behavior.

Search URL templates and the system/IANA time-zone preference live in AppState. Clock and date formatting use `Intl`; search validation and open failures stay inside BrowserSearchTab. `InlineNotices` routes main-process failures to their owning feature without a floating Island overlay and reuses the existing fade-and-blur Motion transition. Settings range controls are styled in `SettingsTab.module.css`.

See [development](../../docs/development.md) and [repository map](../../INDEX.md).

Select controls use nonmodal radio menus: settings remain scrollable while a menu is open, and dismissing a menu inside Island does not toggle expansion. Clipboard history records visible text only; image-only and empty reads are skipped.
