[简体中文](INDEX.zh-CN.md) · English is canonical.

# Repository map

- [Documentation catalog](docs/INDEX.md): development, release and usage guidance.
- [Main process](src/main/README.md): lifecycle, tray, window, IPC and platform services.
- [Preload](src/preload/README.md): isolated renderer bridge.
- [Renderer](src/renderer/README.md): Island shell, feature views, hooks and settings owner.
- [Shared contracts](src/shared/README.md): IPC/domain types and input geometry.
- [Tool configuration](.config/README.md): build, analysis and test configuration.
- [Contribution policy](CONTRIBUTING.md): workflow and documentation synchronization.

`src/assets` contains bundled fonts/icons. `scripts` owns the development launcher. `.config` owns Forge/Vite and installer templates. `.vite`, `out`, reports and dependencies are generated and excluded from Git.
