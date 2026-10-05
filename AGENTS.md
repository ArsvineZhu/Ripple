# Ripple Next working rules

- Use pnpm 12+ and the Node version in `.node-version`; keep `pnpm-lock.yaml` synchronized.
- Follow the active product identity and persistence contract in the current feature plan.
- Read the nearest source-scope README and AGENTS before changing its boundary.
- Keep generated `.vite`, `out`, dependencies and reports out of Git.
- Run `pnpm check` and `pnpm test` before integration; package after changing startup, IPC or build paths.
- Update language-specific human documents for the readers affected by a change. Their structure and level of detail may differ; keep agent instructions in technical English.
- Use one agent unless the user explicitly requests delegation.
- Track Objective, Decisions and Current Work; return to the authorized objective after investigation.
