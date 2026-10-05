# Tooling rules

- Keep movable tool configuration here and wire explicit paths through package scripts or Forge configuration.
- Preserve root discovery anchors for Git, editors, pnpm and the Node toolchain.
- Resolve Forge resources from projectRoot; resolve TypeScript includes/extends relative to their project files.
- After changing configuration paths, run checks/tests and verify dev startup and packaging. Validate renderer/shared boundary rules still match real source files.
