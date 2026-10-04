[简体中文](README.zh-CN.md) · English is canonical.

# Ripple

A cross-platform Dynamic Island desktop companion, maintained in [ArsvineZhu/Ripple](https://github.com/ArsvineZhu/Ripple), based on TopMyster's MIT-licensed project.

Ripple provides browser search, workflows and quick apps, time/weather/battery overview, now playing, Groq/OpenRouter AI chat, clipboard history, tasks, and settings. Hover opens Quick mode; click opens Large mode. Still, stealth, standby, tab ordering, keyboard navigation, themes, positioning, display selection and platform alerts are retained.

Install packages from [this fork's releases](https://github.com/ArsvineZhu/Ripple/releases). Windows uses MSI, macOS uses DMG, and Linux uses DEB/RPM. Built artifacts can also be downloaded from successful Actions runs.

## Develop

Use the Node LTS version recorded in [.node-version](.node-version) and npm 11 or newer.

```sh
git clone https://github.com/ArsvineZhu/Ripple.git
cd Ripple
npm ci
npm start
```

See the [developer guide](docs/development.md) for prerequisites, checks and packaging, [usage guide](instructions.md) for interactions, and [repository map](INDEX.md) for architecture. Current release validation is described in the [release guide](docs/release.md).

## License

[MIT](LICENSE). Original authorship and license attribution are retained.
