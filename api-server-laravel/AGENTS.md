# Repository Guidelines

## Project Structure & Modules
- `app/Http/Controllers` exposes HTTP endpoints; keep controllers thin and delegate to services.
- `app/Services` contains domain and persistence orchestration (e.g., device workers, status history logic).
- `app/Models` holds Eloquent models that mirror the MySQL schema used by the Express API.
- `app/Providers/AppServiceProvider` wires bootstrapping (e.g., automatic migrations, database setup).
- `routes/api.php` defines JSON routes; keep URIs and payloads aligned with the Express server in `README.md`.
- `database/migrations` and `database/seeders` define schema and seed data; use these instead of manual DB edits.
- `tests/Feature` and `tests/Unit` store HTTP-level and isolated tests respectively.
- `resources/` (CSS, JS, Blade views) plus `vite.config.js` and `tailwind` config are for optional UI around the API.

## Build, Test & Development
- `composer setup` – install PHP deps, create `.env` if missing, run migrations, and build assets.
- `composer dev` – run the API server, queue listener, Laravel Pail, and Vite dev server concurrently.
- `php artisan serve --port=4000` – start the HTTP API on port 4000.
- `composer test` – clear config and run the full Laravel test suite.
- `npm run dev` / `npm run build` – develop or build Vite/Tailwind assets.

## Coding Style & Naming
- Follow `.editorconfig`: LF line endings, 4-space indentation, spaces (no tabs), trimmed trailing whitespace.
- Use Laravel conventions: PSR-12, StudlyCase classes, camelCase methods/properties, snake_case DB columns.
- Prefer small, focused classes and methods that mirror domain language (e.g., `activateDevice`, `recordStatusHistory`).
- Run `./vendor/bin/pint` before committing to auto-format PHP code.

## Testing Guidelines
- Add tests under `tests/Feature` or `tests/Unit`; filenames end with `*Test.php` and test methods with `test_*`.
- Use Laravel’s HTTP testing helpers for API routes; keep tests independent of local MySQL (PHPUnit uses in-memory SQLite via `phpunit.xml`).
- Run `composer test` and ensure all tests pass before opening a PR.

## Commit & PR Guidelines
- Write concise, imperative commit messages (e.g., `Add device heartbeat timeout handling`).
- For PRs, include a summary, linked issues, any DB/migration changes, and affected routes.
- When changing API behavior, include example JSON requests/responses to show the new contract.

## Agent-Specific Notes
- Preserve route paths and payload shapes documented in `README.md` to maintain parity with the Express service.
- When changing persistence or background workers, update migrations, related services, and tests together.
