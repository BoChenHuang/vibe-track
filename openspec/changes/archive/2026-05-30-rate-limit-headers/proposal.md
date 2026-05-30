## Why

前端需要顯示兩個 UI 元素：使用量 pill（`剩餘/上限`，例如 `3/5`）以及超限後的倒數 toast（「請稍後再試 — retry in 19m 59s」）。目前後端 429 回應沒有任何 rate limit 中繼資料，前端無法取得剩餘次數或重試等待時間，必須靠猜測或靜態值。

此外，pill 若只靠 `/analyze` 回應餵資料，使用者關閉再重開頁面時會顯示不正確——在首次 `/analyze` 之前無資料，或本機存的舊值已過時（跨裝置、跨視窗尤其如此）。需要一支純讀取端點讓前端在頁面載入時取得正確的當前用量。

## What Changes

- 429 回應新增 `Retry-After` HTTP header（整數秒），以及包含 `error`, `retry_after`, `limit`, `remaining`, `reset_at` 的結構化 JSON body。
- 每次成功回應（200）新增 `X-RateLimit-Limit`、`X-RateLimit-Remaining`、`X-RateLimit-Reset` HTTP headers。
- CORS 設定加入 `Access-Control-Expose-Headers`，讓瀏覽器 JS 可讀取上述所有自訂 headers。
- `CacheService.incrementAndCheck()` 回傳值從 `boolean` 改為包含 `exceeded`, `remaining`, `resetAt` 的物件（**BREAKING** — 僅影響內部 guard，不影響 API 合約）。
- 新增 `GET /ratelimit` 端點：純讀取 Redis 計數器，不消耗額度，回傳 `{ limit, remaining, reset_at }`。
- `CacheService` 新增 `getRateLimitStatus()` 方法（`GET` + `TTL`，不呼叫 `INCR`）。

## Capabilities

### New Capabilities

- `rate-limit-response-headers`: HTTP rate limit headers 在每次請求的回應中，以及 429 時的結構化錯誤 body，讓前端能顯示使用量與倒數計時。
- `ratelimit-query-endpoint`: `GET /ratelimit` 端點，讓前端在頁面載入時查詢當前用量，不消耗任何 analyze 額度。

### Modified Capabilities

## Impact

- `src/cache/cache.service.ts` — `incrementAndCheck()` 回傳型別改變；新增 `getRateLimitStatus()` 方法
- `src/common/guards/rate-limit.guard.ts` — 讀取新回傳值、設定回應 headers
- `src/common/filters/all-exceptions.filter.ts` — 429 時加入 `Retry-After` header 及結構化 body
- `src/main.ts` — 啟用 CORS 並 expose headers
- `src/ratelimit/` — 新增 `RateLimitModule` + `RateLimitController`（`GET /ratelimit`）
