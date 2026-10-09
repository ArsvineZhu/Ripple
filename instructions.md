[简体中文](instructions.zh-CN.md)

# Using Ripple Next

Hover over the Island for Quick mode; click its non-interactive area to expand Large mode. Still is the compact idle state. Stealth hides it while inactive; Standby keeps Quick mode visible; Large Standby keeps the expanded view.

Navigate with arrow keys, horizontal wheel/trackpad gestures, or Ctrl+1 through Ctrl+8 in configured visible-tab order. The Now Playing tab appears when a media source is available. Settings can reorder or hide tabs and select the default tab.

The eight tabs are Browser Search, Workflows & Quick Apps, Overview, Now Playing, AI Assistant, Clipboard, Tasks and Settings. Workflows open their configured apps and URLs in order. Quick Apps can use an installed app, a custom command with one argument per line, or an HTTP(S) URL. On Linux, installed apps are selected from desktop entries; the desktop environment handles each entry's launch command and working directory.

Configure AI in Settings with an OpenAI-compatible Base URL, model name and API key. The key is stored by the operating system's secure storage and is not included in the app state file. AI output and user content remain in their original language.

Tasks, workflows, quick apps and preferences are saved by Ripple Next. Ripple Next uses a separate data directory and starts with fresh settings; it does not import the older Ripple profile. Clipboard history lasts only for the current session.

Settings control time format, startup, display, snap/free positioning, theme/colors/background, border, inactive/standby behavior, battery alerts, weather location/unit, language and mouse-leave delay. The leave delay waits 0–2000 ms before the Island collapses after the pointer leaves. Linux system features require the optional commands listed in the [developer guide](docs/development.md).

Settings → General → Language offers Follow system, 简体中文, English, 繁體中文 and 日本語. Selection applies immediately to the interface and tray and is remembered after restart. Switching language retains current settings and input drafts.

Use arrow keys and Enter inside a dropdown; Escape closes it and returns focus to its trigger. Tab navigation shortcuts apply outside interactive controls. Position Mode keeps the settings view open while the Island moves. Workflow input width is fixed to its form.

On Windows, installed quick apps use Start Menu shortcuts and Store app identifiers. Launch failures appear beside the clicked app or workflow; retrying clears the old message. Settings → Diagnostics opens local logs and crash reports. See [platform compatibility](docs/platform-compatibility.md) for Windows adaptation details.
