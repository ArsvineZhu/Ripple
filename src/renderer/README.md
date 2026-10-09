[简体中文](README.zh-CN.md)

# Renderer

Background settings accept image URLs or local file paths, including quoted Windows paths. `useBackgroundImage` checks decoding after input settles, ignores stale completions and safely quotes CSS URLs. Loading failures appear beside the background setting; main serves local images through the dedicated protocol.

Owns Island display and interaction. Island.tsx composes feature views and QuickView; useIslandController composes feature hooks. AppStateProvider loads and updates persisted state through the main-process service. SettingsProvider owns renderer-level language preference. Ripple Next starts with a new state format and does not read the former Ripple storage.

Internationalization initializes before rendering. The bundled shared catalogs define message keys; SettingsProvider owns the `language` preference and synchronizes the resolved language to the tray. Dates and numbers use the selected locale. Chinese and Japanese overview dates separate numbers, month/day units and weekdays with spaces.

`styles/base.css` owns the transparent document, fonts and shared animation; `styles/tokens.css` owns theme/font tokens. Island, shared controls and feature views own their CSS Modules. Static presentation belongs in those modules; Motion parameters and runtime color/geometry values stay with their owners. OverlayProvider mounts Select menus inside the Island boundary, and useIslandInteraction owns movement, focus, hover and menu-open behavior.

Search URL templates and the system/IANA time-zone preference live in AppState. Clock and date formatting use `Intl`; search validation and open failures stay inside BrowserSearchTab. `InlineNotices` routes main-process failures to their owning feature without a floating Island overlay and reuses the existing fade-and-blur Motion transition. Settings range controls are styled in `SettingsTab.module.css`; stacked fields retain their content height, while horizontal fields share the available width.

See [development](../../docs/development.md) and [repository map](../../INDEX.md).

Select controls use nonmodal radio menus: settings remain scrollable while a menu is open, and dismissing a menu inside Island does not toggle expansion. Clipboard history records visible text only; image-only and empty reads are skipped.

Quick-app and workflow launch failures render on their own item and clear on retry. Media actions render feedback inside their media view. `InlineNotices` supplies text without an independent alert card; settings place operational notices beside the affected setting. Clipboard reads/writes use the native bridge, while copy buttons retain their own success/failure state.

`ElasticScrollArea` preserves a stable content node and uses native vertical overflow, including system trackpad inertia. It observes content size without a permanent animation loop. `TabPanels` owns horizontal navigation: direction triggers one adjacent page per continuous wheel stream, with circular order, an interruptible transition, blur and synchronized size interpolation. Additional distance produces a bounded elastic displacement; it does not select or expose a third page. Native touchpad boundaries separate fresh gestures immediately; a 150 ms input gap is the fallback for other wheel sources. Nested horizontal controls keep their scrolling until they reach the boundary. Keyboard navigation uses the latest state for each repeat; feature pages have stable keys and inactive controls are inert.

The minute-only clock updates at minute boundaries and refreshes after focus or visibility returns. Device alerts and clipboard history remain active while Island is collapsed.

The overview battery badge has a rounded body and a small gray terminal. It fills to the battery percentage: green with white text while charging, white with black text otherwise. Its unfilled portion stays gray regardless of the Island theme. The number has no percent sign, and its trailing solid charging icon shares a centered row with it. Weather and battery share the header row's font size and vertical alignment; a charging value of 100 widens the badge instead of shrinking its number.

Battery and device alerts preserve an expanded page. Their dismissal only closes quick mode, so a startup charging notification cannot collapse a page the user opened in the meantime.

Horizontal elastic displacement follows one persistent spring. Wheel input and release change its target; fresh input during return preserves the surface's current position and velocity instead of stopping and resetting it.

Navigation animates a continuous circular page position. A new request retargets that position through the pages already entering, rather than replacing their contents or resetting progress. Native `onScrollGestureStart` boundaries allow a fresh touchpad gesture to interrupt an older momentum stream; the 150 ms gap remains the fallback for wheel sources without that boundary. Low-energy tails decay accumulated elastic pressure while they are still delivering events, allowing the edge to return before complete input silence.

Vertical input has priority: any Y component routes a diagonal stroke to native vertical scrolling and cancels a horizontal request from that stroke. The axis remains vertical through residual horizontal ticks until a fresh gesture boundary or quiet gap; only purely horizontal input can start page navigation.
