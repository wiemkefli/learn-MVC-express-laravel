# Repository Guidelines

This document applies to the `ui/` React SPA that talks to the Laravel API.

## Project Structure & Module Organization
- `src/`: React components and logic; `App.js` is the main shell and `apiClient.js` wraps all `/api` calls.
- `public/`: Static HTML and assets served by Nginx.
- `scripts/`: Build, start, and test wrappers around `react-scripts`.
- `build/`: Production bundle created by `npm run build` (do not edit by hand).

## Build, Test, and Development Commands
- `npm start` – Run the dev server, auto-reloading on changes.
- `npm test` – Run Jest + React Testing Library in watch mode.
- `npm run build` – Produce an optimized production bundle in `build/`.
- `npm run eject` – One-way eject; only use after team discussion.

## Coding Style & Naming Conventions
- Use 2-space indentation, single quotes, and modern ES modules as in existing files.
- Components are `PascalCase` (`App`, `DeviceTable`); variables and functions are `camelCase`; constants like `DEVICE_TYPES` use `SCREAMING_SNAKE_CASE`.
- Rely on the bundled CRA ESLint config; fix all warnings before opening a PR.

## Testing Guidelines
- Use Jest and React Testing Library (`@testing-library/*`); place tests next to code as `*.test.js` (see `src/App.test.js`).
- For new features, add at least one happy-path test plus edge cases that touch API errors or empty states.
- Run `npm test` locally and ensure all tests pass before pushing.

## Commit & Pull Request Guidelines
- Current history is small; use concise, imperative subjects (e.g., `Add device pagination UI`).
- Group related changes per commit; avoid formatting-only noise mixed with behavior changes.
- PRs should include a short summary, linked issue or task ID when available, testing notes (commands run), and screenshots or GIFs for UI changes.

## Security & Configuration Tips
- Never hardcode backend hosts or credentials; always use relative `/api` URLs via `apiClient.js` and, if needed, `REACT_APP_API_BASE`.
- Do not commit `.env` files or secrets; prefer documented environment variables and local overrides.

