[简体中文](README.zh-CN.md) · English is canonical.

# Tool configuration

Forge/Vite/Vitest, scoped TypeScript projects, Oxlint, Knip, Prettier and JSCPD configuration live here. Package scripts select their configuration files explicitly. `templates` owns Linux desktop/RPM packaging, and `entitlements.plist` owns macOS signing permissions.

Root `tsconfig.json` is the editor project entry; compiler options and scoped projects live here. Git/editor discovery files, `.node-version`, manifests and lockfiles remain at the repository root. `.github/workflows` remains GitHub's discovery location.

Paths consumed by npm tasks and analysis tools refer to the repository root. TypeScript `include`/`extends`, schemas and ignore-file paths are relative to their configuration files. Forge resolves resources from `projectRoot` rather than the configuration directory.

See [development](../docs/development.md) and the [repository map](../INDEX.md).
