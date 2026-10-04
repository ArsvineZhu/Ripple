[简体中文](README.zh-CN.md) · English is canonical.

# Renderer

Owns Island display and interaction. Island.tsx composes feature views and QuickView; useIslandController composes feature hooks. SettingsProvider owns shared settings. The storage module preserves legacy keys and collection shapes. Assets and CSS preserve product appearance.

Internationalization initializes before rendering. The bundled shared catalogs define message keys; SettingsProvider owns the `language` preference and synchronizes the resolved language to the tray. Dates and numbers use the selected locale.

`styles/base.css` owns the transparent document, fonts and shared animation; `styles/tokens.css` owns theme/font tokens. Island, shared controls and feature views own their CSS Modules. Static presentation belongs in those modules; Motion parameters and runtime color/geometry values stay with their owners. OverlayProvider mounts Select menus inside the Island boundary, and useIslandInteraction owns movement, focus, hover and menu-open behavior.

See [development](../../docs/development.md) and [repository map](../../INDEX.md).
