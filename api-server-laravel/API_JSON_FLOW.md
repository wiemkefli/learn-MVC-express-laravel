# JSON API Flow in `api-server-laravel`

This document explains, in detail, how this Laravel API server produces and consumes JSON for the UI, focusing on the `GET` and `POST` endpoints.

The main flow is:

1. An HTTP request hits a **route** (`routes/api.php` or `routes/web.php`).
2. The route forwards the request to a **controller** method.
3. The controller validates/reads input and calls a **service**.
4. The service talks to **Eloquent models** and other helpers.
5. The controller wraps the result with `response()->json(...)` and returns it to the client.

---

## 1. Routes: Which URLs Exist

### 1.1 API routes (`routes/api.php`)

`routes/api.php` defines the JSON API endpoints that your UI will call:

- `GET /api/devices`
  - Maps to `DeviceController@index`
  - Returns a JSON **array of devices**.
- `POST /api/devices`
  - Maps to `DeviceController@store`
  - Accepts JSON or form data and **creates a device**.
- `POST /api/devices/{id}/activate`
  - Maps to `DeviceController@activate`
  - Activates a device process and returns JSON with status.
- `POST /api/devices/{id}/deactivate`
  - Maps to `DeviceController@deactivate`
  - Deactivates a device process and returns JSON with status.
- `GET /api/transactions`
  - Maps to `TransactionController@index`
  - Returns a JSON **list of transactions**, with optional filters.

Laravel automatically prefixes these with `/api` because they live in `routes/api.php`.

### 1.2 Web routes (`routes/web.php`)

`routes/web.php` is mainly for browser-oriented pages, but there is also a JSON health check:

- `GET /health`
  - Returns `{"ok": true}` as JSON.

This is useful for the UI or monitoring tools to verify that the API server is alive.

---

## 2. Controllers: Turning HTTP Into JSON

Controllers receive the HTTP request (method, path, query/body parameters) and decide what to do, then return a `JsonResponse`.

### 2.1 `DeviceController` (`app/Http/Controllers/DeviceController.php`)

Constructor:
- Injects `DeviceService`:
  - `__construct(private readonly DeviceService $deviceService)`
  - This service contains the business logic for devices.

#### 2.1.1 `index()` – `GET /api/devices`

Flow:

1. The route `/api/devices` with `GET` hits `DeviceController@index`.
2. Inside a `try` block, it calls:
   - `$this->deviceService->listDevices()`
3. The service returns an **array** of device data (plain PHP arrays).
4. The controller wraps this array in a JSON response:
   - `return response()->json($this->deviceService->listDevices());`
5. If any exception is thrown, it falls into the `catch` and:
   - Returns a JSON error via `$this->errorResponse($e)`.

Resulting JSON structure (per device, simplified):

```json
{
  "id": "string-uuid",
  "name": "Main Gate",
  "device_type": "access_controller",
  "ip_address": "192.168.0.10",
  "status": "active",
  "metadata": { "...": "..." },
  "live_active": true
}
```

The full response is an **array of such objects**.

#### 2.1.2 `store()` – `POST /api/devices`

This endpoint **creates** a device.

Input:
- `name` (string, required)
- `device_type` (string, required; must be one of `access_controller`, `face_reader`, `anpr`)
- `ip_address` (string, required)
- `metadata` (optional; JSON object / array)

Flow:

1. Route `/api/devices` with `POST` hits `DeviceController@store`.
2. The method reads input from the request:
   - `$name = (string) $request->input('name', '');`
   - `$deviceType = (string) $request->input('device_type', '');`
   - `$ipAddress = (string) $request->input('ip_address', '');`
   - `$metadata = $request->input('metadata');`
3. It checks required fields:
   - If any of `name`, `device_type`, or `ip_address` is missing/empty, it throws an `HttpException` with status `400`.
4. If validation passes, it calls the service:
   - `$device = $this->deviceService->createDevice([...]);`
5. `createDevice` returns an Eloquent `Device` model instance.
6. The controller returns a JSON response with HTTP `201 Created`:
   - `return response()->json($device, Response::HTTP_CREATED);`
7. On any exception, it returns a JSON error via `$this->errorResponse($e)`.

Example request body (JSON):

```json
{
  "name": "Front Door Reader",
  "device_type": "face_reader",
  "ip_address": "10.0.0.5",
  "metadata": {
    "location": "Lobby",
    "vendor": "Acme"
  }
}
```

Example success response body:

```json
{
  "id": "generated-uuid",
  "name": "Front Door Reader",
  "device_type": "face_reader",
  "ip_address": "10.0.0.5",
  "status": "inactive",
  "metadata": {
    "location": "Lobby",
    "vendor": "Acme"
  },
  "created_at": "2025-12-03T14:30:00Z",
  "updated_at": "2025-12-03T14:30:00Z"
}
```

Example error (missing required field):

```json
{
  "error": "name, device_type, ip_address are required"
}
```

HTTP status: `400`.

#### 2.1.3 `activate()` – `POST /api/devices/{id}/activate`

This endpoint **activates** a device process.

Flow:

1. Route `/api/devices/{id}/activate` with `POST` hits `DeviceController@activate`.
2. It receives the `{id}` path parameter as `$id`.
3. It calls:
   - `$result = $this->deviceService->activateDevice($id);`
4. `activateDevice` delegates to `ProcessManager::startProcess($deviceId)` and returns an array (e.g. containing process information).
5. The controller merges `['ok' => true]` with `$result` and returns JSON:
   - `return response()->json(['ok' => true, ...$result]);`
6. On exception, it returns a JSON error via `$this->errorResponse($e)`.

Typical response shape:

```json
{
  "ok": true,
  "device_id": "device-uuid",
  "status": "active"
}
```

#### 2.1.4 `deactivate()` – `POST /api/devices/{id}/deactivate`

This is symmetric to `activate()`:

1. Route `/api/devices/{id}/deactivate` calls `DeviceController@deactivate`.
2. Calls `$this->deviceService->deactivateDevice($id);`
3. Returns:
   - `response()->json(['ok' => true, ...$result]);`
4. On error, uses `$this->errorResponse($e)` to send JSON error.

Example response:

```json
{
  "ok": true,
  "device_id": "device-uuid",
  "status": "inactive"
}
```

#### 2.1.5 Error handling in `DeviceController`

`DeviceController` has a shared private method:

- `private function errorResponse(Throwable $e): JsonResponse`

What it does:

1. Detects HTTP status:
   - If `$e` is an `HttpExceptionInterface`, it uses `$e->getStatusCode()`.
   - Otherwise, it uses `500 Internal Server Error`.
2. Gets an error message:
   - `$e->getMessage()` or `"Internal Server Error"` if empty.
3. Returns JSON:

```json
{
  "error": "Some error message"
}
```

with the chosen HTTP status code.

This ensures the UI always receives a **JSON** error, even for unexpected exceptions.

---

### 2.2 `TransactionController` (`app/Http/Controllers/TransactionController.php`)

Constructor:
- Injects `TransactionService`:
  - `__construct(private readonly TransactionService $transactionService)`

#### 2.2.1 `index()` – `GET /api/transactions`

This endpoint returns a list of transactions, optionally filtered.

Supported query parameters:
- `limit` (optional; max number of records, default 100)
- `device_id` (optional; filter by device)
- `event_type` (optional; filter by event type)

Flow:

1. `GET /api/transactions` hits `TransactionController@index`.
2. It builds a filter array from the query string:
   - `'limit' => $request->query('limit', 100)`
   - `'device_id' => $request->query('device_id')`
   - `'event_type' => $request->query('event_type')`
3. It calls:
   - `$transactions = $this->transactionService->listTransactions([...]);`
4. `listTransactions` returns an Eloquent `Collection` of `Transaction` models.
5. The controller returns:
   - `return response()->json($transactions);`
6. On exception, it calls `$this->errorResponse($e)` and returns a JSON error.

Example request:

`GET /api/transactions?device_id=device-uuid&event_type=access_granted&limit=50`

Example response item:

```json
{
  "transaction_id": "uuid",
  "device_id": "device-uuid",
  "username": "jane.doe",
  "event_type": "access_granted",
  "timestamp": "2025-12-03T14:31:00Z",
  "payload": {
    "door": "Front",
    "method": "face"
  },
  "created_at": "2025-12-03T14:31:00Z"
}
```

The full response is an **array of such objects**.

#### 2.2.2 Error handling in `TransactionController`

Identical pattern to `DeviceController`:

- Determines HTTP status from `HttpExceptionInterface` or defaults to `500`.
- Returns JSON:

```json
{
  "error": "Some error message"
}
```

---

## 3. Services: Business Logic Layer

Services encapsulate logic that should not live directly in controllers.

### 3.1 `DeviceService` (`app/Services/DeviceService.php`)

Dependencies:
- Injects `ProcessManager`:
  - Manages background processes for devices (start/stop and status).

Key methods:

#### 3.1.1 `createDevice(array $data): Device`

1. Reads `device_type` from `$data`.
2. Checks that it is one of:
   - `Device::TYPE_ACCESS_CONTROLLER` (`"access_controller"`)
   - `Device::TYPE_FACE_READER` (`"face_reader"`)
   - `Device::TYPE_ANPR` (`"anpr"`)
3. If invalid, throws `HttpException(400, 'Invalid device_type')`:
   - This flows back to the controller and becomes a JSON error.
4. Calls `Device::create([...])` with:
   - `id` – generated UUID (`Str::uuid()`).
   - `name`, `device_type`, `ip_address`.
   - `status` – initial value `Device::STATUS_INACTIVE` (`"inactive"`).
   - `metadata` – from `$data['metadata'] ?? null`.
5. Returns the created `Device` model.

#### 3.1.2 `listDevices(): array`

1. Asks `ProcessManager` for currently live active device IDs:
   - `$liveActiveIds = $this->processManager->liveActiveDeviceIds();`
2. Loads devices from the DB:
   - `Device::orderByDesc('created_at')->get()`
3. Transforms each `Device` model into an array and enriches with:
   - `'live_active' => in_array($device->id, $liveActiveIds, true)`
4. Returns an array of these arrays.

This is what the controller turns into JSON for `GET /api/devices`.

#### 3.1.3 `activateDevice(string $deviceId): array`

1. Calls `$this->processManager->startProcess($deviceId);`
2. Returns whatever array the process manager returns (e.g. status info).
3. The controller then wraps this inside `['ok' => true, ...$result]`.

#### 3.1.4 `deactivateDevice(string $deviceId): array`

Same pattern as `activateDevice`, but calls:

- `$this->processManager->stopProcess($deviceId);`

### 3.2 `TransactionService` (`app/Services/TransactionService.php`)

Key methods:

#### 3.2.1 `createTransaction(array $data): Transaction`

1. Calls `Transaction::create([...])` with:
   - `transaction_id` – UUID (`Str::uuid()`).
   - `device_id`, `username`, `event_type`.
   - `timestamp` – from `$data['timestamp']` or `now()`.
   - `payload` – from `$data['payload']` or `null`.
   - `created_at` – set to `now()`.
2. Returns the created `Transaction` model.

This can be used internally to record events coming from devices; if exposed as an API later, it would also serialize to JSON automatically via controllers.

#### 3.2.2 `listTransactions(array $filters = []): Collection`

1. Starts with `$query = Transaction::query();`
2. Applies filters:
   - If `device_id` is set, `where('device_id', $filters['device_id'])`.
   - If `event_type` is set, `where('event_type', $filters['event_type'])`.
3. Determines the `limit` (default `100`).
4. Orders by `timestamp` descending.
5. Applies `limit` and `get()` to fetch a `Collection` of models.
6. This collection is then passed directly to `response()->json(...)` in the controller.

---

## 4. Models: How Data Is Shaped

Models define the DB table, fillable fields, and casting rules that influence JSON output.

### 4.1 `Device` model (`app/Models/Device.php`)

Important points:

- `$table = 'devices'`
- `$fillable` includes:
  - `id`, `name`, `device_type`, `ip_address`, `status`, `metadata`
- `$casts`:
  - `'metadata' => 'array'` – when converted to JSON, this becomes a nested JSON object/array.
  - `created_at`, `updated_at` as `datetime` – formatted as ISO-ish timestamps in JSON.
- `public $incrementing = false;`
  - IDs are not auto-increment integers; they are UUID strings.

When you pass a `Device` instance to `response()->json()`, Laravel converts it using these rules.

### 4.2 `Transaction` model (`app/Models/Transaction.php`)

Important points:

- `$table = 'transactions'`
- `$primaryKey = 'transaction_id'`
- `$fillable` includes:
  - `transaction_id`, `device_id`, `username`, `event_type`, `timestamp`, `payload`, `created_at`
- `$casts`:
  - `'payload' => 'array'`
  - `'timestamp' => 'datetime'`
  - `'created_at' => 'datetime'`
- `public $incrementing = false;` and `public $timestamps = false;`

These settings control how each transaction row is turned into a JSON object in the responses from `GET /api/transactions`.

---

## 5. JSON Serialization: `response()->json(...)`

Laravel’s `response()->json()` helper:

- Accepts arrays, model instances, and collections.
- Converts them into JSON using:
  - Model `toArray()` / `jsonSerialize()` methods.
  - PHP array → JSON object/array.
- Sets the `Content-Type: application/json` header.
- Uses HTTP status code `200` by default, or a custom one if provided (e.g. `201` for creation).

Examples from this project:

- `response()->json($this->deviceService->listDevices());`
- `response()->json($device, Response::HTTP_CREATED);`
- `response()->json(['ok' => true, ...$result]);`
- `response()->json($transactions);`
- `response()->json(['error' => $message], $status);`
- `response()->json(['ok' => true]);` (health check)

---

## 6. End-to-End Examples

### 6.1 List devices (UI → API → UI)

1. UI sends `GET /api/devices`.
2. Laravel routes to `DeviceController@index`.
3. `index()` calls `DeviceService::listDevices()`.
4. Service loads devices, enriches with `live_active`, and returns an array.
5. Controller wraps it: `response()->json([...])`.
6. UI receives:

```json
[
  {
    "id": "uuid-1",
    "name": "Main Gate",
    "device_type": "access_controller",
    "ip_address": "192.168.0.10",
    "status": "active",
    "metadata": { "location": "Gate A" },
    "live_active": true,
    "created_at": "2025-12-03T14:30:00Z",
    "updated_at": "2025-12-03T14:32:00Z"
  },
  {
    "id": "uuid-2",
    "name": "Side Door",
    "device_type": "face_reader",
    "ip_address": "192.168.0.11",
    "status": "inactive",
    "metadata": null,
    "live_active": false,
    "created_at": "2025-12-03T13:00:00Z",
    "updated_at": "2025-12-03T13:00:00Z"
  }
]
```

### 6.2 Create a device

1. UI sends `POST /api/devices` with JSON body containing `name`, `device_type`, `ip_address`, etc.
2. Laravel routes to `DeviceController@store`.
3. `store()` validates required fields.
4. Calls `DeviceService::createDevice(...)`.
5. Service validates `device_type`, creates a `Device` model.
6. Controller returns `response()->json($device, 201)`.
7. UI receives the new device as JSON.

If validation fails at any point, the UI still gets a JSON body with an `"error"` field and an appropriate HTTP status.

### 6.3 Fetch transactions for a device

1. UI sends `GET /api/transactions?device_id=uuid-1&limit=20`.
2. Laravel routes to `TransactionController@index`.
3. `index()` builds filter array, calls `TransactionService::listTransactions(...)`.
4. Service applies filters, sorts, limits, fetches `Transaction` models.
5. Controller returns `response()->json($transactions)`.
6. UI receives an array of transaction objects, each shaped according to `Transaction` model’s fields and casts.

---

## 7. Summary

- **Routes** define which URLs and HTTP methods are available.
- **Controllers** translate HTTP into calls to services and always return JSON responses using `response()->json(...)`.
- **Services** contain business logic (validation, process management, filtering).
- **Models** define how database records map to PHP objects and how they serialize to JSON (including type casting).
- **Error handling** is centralized so that even failures are consistently reported as JSON objects with appropriate HTTP status codes.

This structure allows your UI to interact with the Laravel backend using standard JSON-based `GET` and `POST` requests, with predictable request and response shapes.

