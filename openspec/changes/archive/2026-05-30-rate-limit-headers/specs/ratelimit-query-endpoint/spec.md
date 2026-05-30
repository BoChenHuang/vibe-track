## ADDED Requirements

### Requirement: GET /ratelimit returns current quota without consuming it
系統 SHALL 提供 `GET /ratelimit` 端點，回傳當前 IP 的 rate limit 狀態：
- HTTP 200
- JSON body：`{ "limit": <integer>, "remaining": <integer>, "reset_at": <unix epoch seconds> }`
- 此端點 SHALL NOT 遞增任何計數器（不影響 `/analyze` 的可用次數）
- 限流維度與 `/analyze` 相同：依 `x-forwarded-for` header 或 `req.ip` 判斷 IP

#### Scenario: Query before any analyze call in current window
- **WHEN** 某 IP 在本視窗內尚未呼叫 `/analyze`，呼叫 `GET /ratelimit`
- **THEN** 回應 200，`remaining` 等於 `limit`，`reset_at` 約為 `now + windowSec`

#### Scenario: Query after some analyze calls
- **WHEN** 某 IP 已在本視窗內成功呼叫 `/analyze` 兩次後呼叫 `GET /ratelimit`
- **THEN** 回應 200，`remaining` 等於 `limit - 2`，`reset_at` 反映原始視窗的重置時間

#### Scenario: Query does not consume quota
- **WHEN** 某 IP 連續呼叫 `GET /ratelimit` 十次
- **THEN** 後續呼叫 `GET /ratelimit` 的 `remaining` 值不變（計數器未遞增）

#### Scenario: Query when already rate-limited
- **WHEN** 某 IP 已超過 `/analyze` 上限（`remaining = 0`），呼叫 `GET /ratelimit`
- **THEN** 回應 200，`remaining: 0`，`reset_at` 為視窗重置時間（仍回傳 200，非 429）

### Requirement: GET /ratelimit is consistent with /analyze rate limit dimension
`GET /ratelimit` 的 `remaining` 值 SHALL 與 `/analyze` 成功回應的 `X-RateLimit-Remaining` header 值一致（在相同 IP、相同時間點下）。

#### Scenario: Values match between endpoint and header
- **WHEN** 某 IP 呼叫 `POST /analyze` 成功後立即呼叫 `GET /ratelimit`
- **THEN** `GET /ratelimit` 的 `remaining` 等於上次 `POST /analyze` 回應的 `X-RateLimit-Remaining`

### Requirement: GET /ratelimit handles Redis failure gracefully
Redis 不可用時，`GET /ratelimit` SHALL 仍回傳 200 並提供 fallback 值：`remaining` 等於 `limit`，`reset_at` 約為 `now + windowSec`。

#### Scenario: Redis unavailable
- **WHEN** Redis 連線失敗，IP 呼叫 `GET /ratelimit`
- **THEN** 回應 200，`remaining` 等於 `limit`（不拋出 500）

### Requirement: GET /ratelimit CORS headers match /analyze
`GET /ratelimit` 回應 SHALL 被 CORS 設定的 `Access-Control-Expose-Headers` 涵蓋，使瀏覽器可讀取相關標頭（如有設定）。

#### Scenario: Browser cross-origin request to GET /ratelimit
- **WHEN** 瀏覽器前端跨來源呼叫 `GET /ratelimit`
- **THEN** 回應包含 `Access-Control-Allow-Origin`，瀏覽器 JS 可正常取得 body 中的值
