# Devices datatable pagination plan

Goal: show only 5 devices per page in the Devices table with AJAX-driven pagination (no full-page reloads), keeping Express and Laravel APIs aligned.

Context
- Current `/devices` endpoint in both APIs returns the full list (no paging). UI calls `getDevices()` once on load and renders all rows.
- Device rows include `live_active` (computed server-side) plus `status` toggling via POST actions.

Implementation plan
1) Define pagination contract (shared)
- Accept `page` (default 1) and `pageSize` (default 5) query params on `/devices`.
- Respond with `{ items: Device[], meta: { page, pageSize, total } }` when pagination params are present; keep support for legacy array-only response when no pagination params are sent to avoid breaking any other callers.
- Always include `live_active` in `items`.

2) Express API updates
- Parse and validate `page`/`pageSize` in `deviceController.getListDevices`.
- Update `deviceService.listDevices` to use `findAndCountAll` with `limit`/`offset`, and return `{ items, meta }` when pagination is requested; otherwise return the full array as today.
- Keep ordering by `created_at DESC`. Add minimal unit/integration coverage if time permits.

3) Laravel API updates
- Mirror the contract in `DeviceController@index`: read query params, default to 1/5, validate bounds.
- In `DeviceService::listDevices`, use `skip()`/`take()` or `paginate()` equivalents to fetch page data and total count, and attach `live_active` per device.
- Preserve legacy array response when no pagination params are provided.

4) UI (React) updates
- Extend `getDevices` to accept `{ page, pageSize }` and normalize responses from either contract (array or `{ items, meta }`).
- In `App`, track `page`, `pageSize = 5`, `total`, `pageCount`; fetch devices via AJAX whenever page changes or after create/toggle (reset to page 1 on create).
- Render pagination controls (Prev/Next, page indicator, disabled states) below the Devices table; ensure table shows exactly 5 rows per request. Keep existing loading/error handling.

5) QA and validation
- Manual: seed/create >5 devices, confirm only 5 show per page, pagination fetches new data without reload, activation/deactivation still works and refreshes current page.
- Smoke on both backends (Express and Laravel) if available; confirm transactions view remains unaffected.
