[简体中文](CONTRIBUTING.zh-CN.md) · English is canonical.

# Contributing

Use a semantic branch and coherent commits. Keep formatting-only changes separate from behavior changes. Explain the problem, resulting behavior and validation in a pull request.

The [developer guide](docs/development.md) owns commands and tool policy. Run `npm run check` and `npm test` before integration, and package the affected platform after changing startup, build or IPC paths.

Changes to behavior, scripts, configuration or important boundaries update the corresponding documentation. English is canonical; update each maintained `.zh-CN.md` translation in the same change. Agent instructions remain technical English. Source types/configuration own facts; documentation explains them rather than duplicating signatures.

Remove unused code and dependencies at their owner. A tool exception must identify the specific file/rule and explain its continuing purpose. Review duplicated logic for shared semantics before extracting it.
