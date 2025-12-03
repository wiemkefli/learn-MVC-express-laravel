Purpose

Minimal UI to operate the simulator: add devices, activate them, and view transactions. Served by Nginx (static). Communicates with backend via /api.

Tech & Constraints

Option A (current): Static HTML/JS (no toolchain) – quick demo

Option B (upgrade): Vite + React (recommended if time permits)

Network: All API calls go to relative path /api

MUST NOT: Embed backend credentials or hardcode absolute hosts

Folder Layout (authoritative)
ui/
  index.html   # single-page UI (Add Device, Devices table, Transactions table)


If upgrading to React later, replace the contents of ui/ with the built dist/ folder and keep Nginx config unchanged.

Required Behaviors

Add Device: POST /api/devices with { name, device_type, ip_address }

List Devices: GET /api/devices and render as table

Activate: POST /api/devices/:id/activate → then refresh device list

List Transactions: GET /api/transactions?size=10 every 3s and render newest first

Status badges: active (greenish), inactive (reddish)

API Integration (authoritative)

Base: const api = '/api'

All fetches must set content-type: application/json on POST

No additional headers required

Nginx Expectations

Serves ui/ at /

Proxies /api/* → backend container at http://elid_api:3000/api/

try_files $uri /index.html; enabled for SPA compatibility (kept even for static page)

Local smoke test (with docker-compose)

docker-compose up --build

Visit http://localhost:8080

Add a device → should appear in Devices as inactive

Click Activate → status flips to active

Transactions start showing in Recent Transactions

Accessibility & UX (minimum)

Tables readable on desktop

Basic labels/placeholders for inputs

Feedback on actions via table refresh (no popup needed)

Definition of Done

Can add devices, activate them, and observe transactions without reloading the page

Uses only /api relative path (works behind reverse proxy)

Layout is simple, responsive enough for default desktop width

Optional (React upgrade plan)

If instructed to “upgrade to React”, Codex should:

npm create vite@latest ui -- --template react

Build “Devices” page and “Transactions” page; move current logic into React components using Axios or fetch.

Set VITE_API_BASE=/api and use import.meta.env.VITE_API_BASE.

npm run build and copy dist/* into ui/ (this repo) for Nginx to serve (or mount dist in compose).

Top-level (for reference to Codex)

Compose command to bring everything up:

docker-compose up --build
# UI: http://localhost:8080
# API: http://localhost:8080/api
# MySQL (host): 127.0.0.1:3307  (DB elid / user elid / pass elidpass)

Guardrails (apply to both folders)

Don’t change public API shapes without updating both CODEX files

Don’t add external services or protocols

Keep /api path stable for reverse proxy

Keep DB schema exactly as specified (devices, transactions)