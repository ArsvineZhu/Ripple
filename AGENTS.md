# Ripple working rules

- Use npm and the Node version in `.node-version`; keep `package-lock.json` synchronized.
- Preserve application identity, persisted storage keys and user-visible behavior during refactoring.
- Read the nearest source-scope README and AGENTS before changing its boundary.
- Keep generated `.vite`, `out`, dependencies and reports out of Git.
- Run `npm run check` and `npm test` before integration; package after changing startup, IPC or build paths.
- Update affected English and `.zh-CN.md` human documents in the same change; English is canonical. Keep agent instructions in technical English.
- Use one agent unless the user explicitly requests delegation.
- Track Objective, Decisions and Current Work; return to the authorized objective after investigation.
