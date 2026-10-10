# Renderer rules

Keep OS access behind window.electronAPI. Own timers and mutable refs inside hooks; clean up subscriptions. Persisted state belongs to AppStateProvider and the main-process state service; do not access localStorage. Test navigation/mode changes and live-check Island animation and input shaping.

Use the Search page as the standard for data-empty feature pages: its target size from expandedTabSize, centered 20px medium-weight hint text, and no empty action strip. Restore each page's populated geometry when data is added.

Initialize bundled i18n before render; keep language preferences in SettingsProvider. Use feature/control CSS Modules and Island-scoped Select portals. Movement and open-menu guards belong to useIslandInteraction; preserve settings content and scroll during position commits.
