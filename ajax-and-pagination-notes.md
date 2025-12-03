# AJAX and pagination in this project

This repo uses AJAX (asynchronous JavaScript requests) so the UI can talk to the backend and update the screen **without reloading the page**. The React UI sends HTTP requests with `fetch`, receives JSON back, and updates component state; React then re-renders the tables based on the new state.

## What is AJAX (here)?

In this project, “AJAX” means:

- JavaScript runs in the browser (React components).
- It calls the API using `fetch` to `/api/...` endpoints.
- While the request is in flight, the page remains usable; we can show loading states.
- When a JSON response arrives, we update React state (`useState`) and let React re-render only the parts of the page that changed (for example, a table body), not the entire HTML document.

All of this is wrapped in a small helper in `ui/src/apiClient.js`:

```js
async function request(path, { method = 'GET', body } = {}) {
  const options = { method, headers: {} };
  if (body) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, options);
  // error handling, then JSON parsing...
  return res.status === 204 ? null : res.json();
}
```

Every AJAX call in the UI goes through this `request` helper so headers, JSON parsing, and error handling stay consistent.

## Where AJAX is used

- **Devices table**
  - `getDevices({ page, pageSize })` issues `GET /api/devices?page=X&pageSize=Y` to retrieve a slice of devices for the current page.
  - `createDevice(payload)` sends `POST /api/devices` with a JSON body to add a new device.
  - `activateDevice(id)` and `deactivateDevice(id)` send `POST /api/devices/:id/activate` and `.../deactivate` to toggle a device.
- **Transactions table**
  - `getTransactions(limit)` calls `GET /api/transactions?limit=10` every 3 seconds to refresh the “Recent Transactions” table without reloading the page.
- **Base URL**
  - All requests are relative to `/api` (or `REACT_APP_API_BASE` if provided), so they work correctly when the app is served behind a reverse proxy (for example, Nginx in docker-compose).

## Devices pagination flow (AJAX + Laravel)

End-to-end flow when the user loads the Devices tab or changes pages:

1) **State setup (React)**
   - `ui/src/App.js` defines:
     - `page` – current page number (starts at `1`).
     - `totalDevices` – total number of devices reported by the backend.
     - `DEVICES_PAGE_SIZE` – fixed to `5`, so we always show 5 devices per page.

2) **Triggering the AJAX call**
   - On initial mount and whenever `page` changes, a `useEffect` hook calls `fetchDevices(page)`.
   - The Prev/Next buttons update `page`, which automatically triggers a new AJAX call via that effect.

3) **Client-side request**
   - `fetchDevices` uses the API client:
     ```js
     const { items, meta } = await getDevices({ page, pageSize: DEVICES_PAGE_SIZE });
     ```
   - `getDevices` builds the URL: `/api/devices?page={page}&pageSize=5` and calls `request(...)`.

4) **Laravel controller and service**
   - `api-server-laravel/app/Http/Controllers/DeviceController.php` reads the `page` and `pageSize` query params.
   - It validates them (must be positive integers, with an upper bound on `pageSize`) and passes them as a pagination array into `DeviceService::listDevices`.
   - `DeviceService::listDevices`:
     - Orders devices by `created_at DESC`.
     - Computes total count.
     - Applies `skip`/`take` based on `page` and `pageSize` to fetch only the rows for that page.
     - Adds the derived `live_active` flag per device.
     - Returns a JSON-friendly structure with `items` and `meta`.
   - If `page` / `pageSize` query params are **not** provided, `listDevices()` falls back to returning the full array of devices (legacy behaviour for other clients).

5) **Client-side response handling**
   - `getDevices` in `ui/src/apiClient.js` normalizes both shapes:
     - If the backend returns an **array**, it slices it locally into pages and constructs `meta` on the client.
     - If the backend returns an **object** with `{ items, meta }`, it uses that data directly.
   - `fetchDevices` then:
     - Calls `setDevices(items)` to update the table rows.
     - Calls `setTotalDevices(meta.total)` so the UI can compute how many pages there are.
     - Ensures the `page` state matches the `meta.page` value.

6) **Rendering the paginated table**
   - The Devices table shows only the `items` for the current page.
   - Pagination controls (`Prev` / `Next` and “Page X of Y”) are derived from `page` and `pageCount` (`Math.ceil(totalDevices / DEVICES_PAGE_SIZE)`).
   - Column widths are kept consistent across pages using:
     - A dedicated `devices-table` class with `table-layout: fixed` in `ui/src/App.css`.
     - A `<colgroup>` in the JSX that sets percentage widths per column.

7) **Refresh rules**
   - After creating a device:
     - The client either sets `page` back to `1` (which triggers a new AJAX call), or directly calls `fetchDevices(1)` if already on page 1.
   - After activating/deactivating a device:
     - The client re-fetches the current page via AJAX so the status and `live_active` indicator stay in sync.
   - Manual “Refresh” re-calls `fetchDevices(page)` and re-renders the current page.

## Why AJAX + pagination?

- **No full reloads** – Only the table data changes; headers, layout, and other UI elements stay in place.
- **Smaller responses** – Only 5 devices per request when using server-side pagination, which helps performance as the dataset grows.
- **Consistent user experience** – Navigating between pages feels instant because React only re-renders the table rows and page indicator.
- **Flexible backend contract** – The UI can consume either:
  - A paginated response (`items` + `meta`) from Laravel, or
  - An unpaginated array (legacy) and handle slicing on the client.

## Key files to review

- **UI / AJAX / pagination logic**
  - `ui/src/App.js` – React component, state (`page`, `totalDevices`), `fetchDevices`, and table rendering.
  - `ui/src/apiClient.js` – `request` helper, `getDevices`, `getTransactions`, and other AJAX functions.
  - `ui/src/App.css` – `devices-table`, `pagination`, and general layout styles.
- **Laravel pagination implementation**
  - `api-server-laravel/app/Http/Controllers/DeviceController.php` – reads query params, validates, and chooses paginated vs legacy response.
  - `api-server-laravel/app/Services/DeviceService.php` – encapsulates the actual pagination logic and live activity decoration.

## Extending/adjusting

- **Change page size**
  - Update `DEVICES_PAGE_SIZE` in `ui/src/App.js` to a new value.
  - Optionally change the default `pageSize` in the Laravel controller when no explicit `pageSize` is provided.
- **Add more pagination metadata**
  - Compute additional fields in `DeviceService::listDevices` (for example, `pageCount`, `hasNext`, `hasPrev`) and include them under `meta`.
  - Read and use those fields in `App.js` instead of recomputing them in the UI.
- **Reuse pattern for other endpoints**
  - Follow the same shape (`items` + `meta`) and query parameter approach for any future paginated listing (for example, a paginated transactions view). The `getDevices` normalization pattern in `apiClient.js` is a good starting point.
