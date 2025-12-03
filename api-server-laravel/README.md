# api-server-laravel (Laravel port of api-server-express)

Laravel 12 backend that mirrors the existing Express service: same routes, MySQL schema, background worker simulation, and JSON responses.

## Setup
- Requirements: PHP 8.1+, Composer, MySQL reachable with the same creds as the Express app.
- Env defaults (see `.env`): `APP_PORT=4000`, `DB_CONNECTION=mysql`, `DB_HOST=127.0.0.1`, `DB_PORT=3306`, `DB_DATABASE=mdms_lite`, `DB_USERNAME=root`, `DB_PASSWORD=123456`.
- Install deps (already run here, but for completeness): `composer install` in `api-server-laravel`.

## Running
- Start the API: `php artisan serve --port=4000` (or rely on `APP_PORT`).
- On boot the app automatically creates the database if missing and runs migrations via `DatabaseBootstrapper` (in `AppServiceProvider`). You can also run `php artisan migrate --force` manually.
- Health check: `GET /health` -> `{ "ok": true }`.

## API routes (same shapes as Express)
- `GET /api/devices` → list devices ordered by `created_at` with `live_active` derived from recent worker heartbeats.
- `POST /api/devices` with `name`, `device_type` (`access_controller|face_reader|anpr`), `ip_address`, optional `metadata` → 201 with created device.
- `POST /api/devices/{id}/activate` → starts a worker, flips status to `active`, records status history, returns `{ ok: true, device, process, alreadyRunning }`.
- `POST /api/devices/{id}/deactivate` → stops the worker, marks status inactive, returns `{ ok: true, stopped: true }` or `{ ok: true, stopped: false, reason: 'not_running' }`.
- `GET /api/transactions?device_id=&event_type=&limit=100` → recent transactions ordered by `timestamp` desc.

## Background worker parity
- Activating a device spawns `php artisan mdms:device-worker {deviceId} {processId}` (Symfony Process). The worker generates random events per device type, writes transactions, and updates `device_processes.last_heartbeat_at`.
- Deactivation sets `device_processes.stopped_at`; the worker sees the flag and exits, after which `ProcessManager` ensures the device status is `inactive` and records a status history entry when needed.
- `live_active` is true only when a `device_processes` row has `stopped_at` NULL and a heartbeat within the last 10s.

## Data model
- Tables mirror the Express Sequelize models: `devices`, `device_processes`, `device_status_history`, `transactions` (see migrations under `database/migrations`).
- UUID primary keys, JSON `metadata`/`payload`, ENUM status/type fields, and the same indexes (device_type, event_type, timestamp, etc.).

## Notes
- Error responses are JSON (`{ "error": "..." }`) with HTTP codes similar to the Express handlers.
- No existing project files outside `api-server-laravel` were modified.
