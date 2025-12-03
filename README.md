# MVC Playground: Express + Laravel

This repository is a two-lane runway for exploring the same MVC ideas in two very different airframes: a Node.js/Express API and a PHP/Laravel API. The UI stays constant while you swap engines underneath, making it easy to compare routing, controllers, and data flow across frameworks. Think of it as a code tasting menu—same dish, two kitchens.

## What lives where

- `api-server-express/`: Node.js + Express API using Sequelize and MySQL.
- `api-server-laravel/`: Laravel API (PHP 8/Composer) with MySQL.
- `ui/`: React (CRA) frontend that proxies `/api` calls to whichever backend you choose.
- `docs/`: Screenshots and notes from earlier runs.

## Choose your backend (one at a time)

Shared prerequisites:
- MySQL 8.x reachable with credentials in `.env` (root-level for Express, `api-server-laravel/.env` for Laravel). Defaults: host `127.0.0.1`, user `root`, password `123456`, database `mdms_lite`.
- Install UI deps: `npm install --prefix ui`.

Option A: Express API
1. Install deps: `npm install --prefix api-server-express`.
2. Configure `./.env` (API_PORT defaults to `4000`; DB vars as above).
3. Run: `npm run dev --prefix api-server-express` (or `npm start` for plain Node). API available at `http://localhost:4000`.

Option B: Laravel API
1. Install deps inside `api-server-laravel/`: `composer install`.
2. Copy `.env.example` to `.env` if needed, set DB vars, then `php artisan key:generate`.
3. Run: `php artisan serve --host=127.0.0.1 --port=8000`. API available at `http://127.0.0.1:8000`.

## Wire the UI to your choice

- Update the proxy in `ui/package.json` **before starting the UI**:
  - Express: `"proxy": "http://localhost:4000"`
  - Laravel: `"proxy": "http://127.0.0.1:8000"`
- Start the UI after the chosen backend is running: `npm start --prefix ui` (served at `http://localhost:3000`).
- Stick to one backend at a time so the proxy and data stay in sync; swap the proxy and restart the UI when switching.

## Why this setup?

Running the same CRUD-style flows through two stacks side by side makes MVC trade-offs obvious: middleware vs. HTTP kernels, ORM ergonomics, and how each framework structures controllers/models/views. Use this repo to prototype patterns in one stack, then echo them in the other without rebuilding the UI each time.
