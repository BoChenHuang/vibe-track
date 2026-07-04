# Rate Limit Response Headers

## Requirement: Successful response includes rate limit headers
每次成功的 `POST /analyze` 回應（HTTP 200）SHALL 包含以下三個 headers：
- `X-RateLimit-Limit`：視窗內允許的請求總數（整數）
- `X-RateLimit-Remaining`：本次請求後視窗內剩餘次數（整數，最小值為 0）
- `X-RateLimit-Reset`：視窗重置的 Unix epoch 秒數（UTC 整數）

### Scenario: First request in a fresh window
- **WHEN** 某 IP 在視窗重置後發出第一筆 `POST /analyze` 請求並成功
- **THEN** 回應帶 `X-RateLimit-Limit: 5`、`X-RateLimit-Remaining: 4`、`X-RateLimit-Reset: <future timestamp>`

### Scenario: Subsequent request within window
- **WHEN** 某 IP 已在視窗內發出 3 次成功請求後再發第 4 次
- **THEN** 回應帶 `X-RateLimit-Remaining: 1`（limit - count）

## Requirement: Rate-limited response includes Retry-After header and structured body
當請求超過 rate limit 時，回應 SHALL：
- 回傳 HTTP 429 狀態碼
- 帶 `Retry-After` header，值為整數秒（距下次可呼叫的等待秒數）
- 回傳 JSON body 包含：
  - `error`: `"rate_limited"`
  - `message`: 人類可讀的中文提示
  - `retry_after`: 整數秒（同 header 值）
  - `limit`: 視窗內總限制次數
  - `remaining`: 固定為 `0`
  - `reset_at`: Unix epoch 秒（視窗重置時間，UTC）

### Scenario: Request exceeds rate limit
- **WHEN** 某 IP 在視窗內已達上限後再發送請求
- **THEN** 回應為 429，帶 `Retry-After: <seconds>` header，且 body 包含 `error: "rate_limited"` 及 `retry_after`, `limit`, `remaining: 0`, `reset_at`

### Scenario: retry_after matches time to reset
- **WHEN** 視窗還有 180 秒重置，IP 觸發 429
- **THEN** `retry_after` 值 ≤ 180（即 `reset_at - now`，允許 ±1 秒誤差）

## Requirement: CORS exposes rate limit headers to browser clients
CORS 設定 SHALL 將下列 headers 加入 `Access-Control-Expose-Headers`，使瀏覽器 JS 可透過 `response.headers.get()` 讀取：
- `Retry-After`
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

### Scenario: Browser reads rate limit headers after successful request
- **WHEN** 瀏覽器前端呼叫 `POST /analyze` 並成功
- **THEN** JS 可透過 `response.headers.get('X-RateLimit-Remaining')` 取得數值（非 null）

### Scenario: Browser reads Retry-After on 429
- **WHEN** 瀏覽器前端觸發 429
- **THEN** JS 可透過 `response.headers.get('Retry-After')` 取得等待秒數（非 null）

## Requirement: Redis failure does not break rate limit header delivery
當 Redis 發生錯誤（fail-open）時，系統 SHALL 仍回傳成功回應，並帶預設的 rate limit headers（`remaining` 設為 `limit` 值，`reset_at` 設為 `now + windowSec`）。

### Scenario: Redis unavailable on successful request
- **WHEN** Redis 連線失敗，且 IP 發出 `POST /analyze`
- **THEN** 請求仍成功（HTTP 200），回應帶 `X-RateLimit-Remaining` 等於 `X-RateLimit-Limit`
