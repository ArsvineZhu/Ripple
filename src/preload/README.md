[简体中文](README.zh-CN.md) · English is canonical.

# Preload bridge

Owns the isolated contextBridge API. index.ts maps explicit methods to named IPC channels and exposes platform identity. Shared contracts define the renderer-facing type; raw IPC objects stay inside preload.

See [development](../../docs/development.md) and [repository map](../../INDEX.md).
