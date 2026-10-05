[简体中文](README.zh-CN.md)

# Ripple Next

A cross-platform Dynamic Island desktop companion developed in [ArsvineZhu/Ripple-Next](https://github.com/ArsvineZhu/Ripple-Next), based on TopMyster's MIT-licensed Ripple project.

Ripple Next includes browser search, workflows, quick apps, time/weather/battery overview, media controls, AI chat through OpenAI-compatible endpoints, clipboard history, tasks and settings. Linux quick apps can launch installed desktop entries, URLs or custom commands with separate arguments.

The interface supports Simplified Chinese, English, Traditional Chinese and Japanese. It follows the system language by default and supports an immediate, persistent override in Settings.

Matching version tags are built and published by GitHub Actions; see the [release guide](docs/release.md).

## Develop

Use the Node version recorded in [.node-version](.node-version) and pnpm 12 or newer. Node 22.13+ is required by the current toolchain.

```sh
git clone https://github.com/ArsvineZhu/Ripple-Next.git
cd Ripple-Next
pnpm install --frozen-lockfile
pnpm start
```

See the [developer guide](docs/development.md) for prerequisites, checks and packaging, the [usage guide](instructions.md) for interactions, and the [repository map](INDEX.md) for architecture.

## License

[MIT](LICENSE). Original project attribution is retained.
