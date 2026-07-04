## 1. CacheService — 擴充 incrementAndCheck() 回傳值

- [x] 1.1 在 `src/cache/cache.service.ts` 新增並匯出 `RateLimitResult` interface（`exceeded`, `count`, `remaining`, `resetAt`）
- [x] 1.2 修改 `incrementAndCheck()` 回傳型別為 `Promise<RateLimitResult>`
- [x] 1.3 在 INCR 後呼叫 `redis.ttl(key)` 取得剩餘 TTL，計算 `resetAt = now + ttl`
- [x] 1.4 計算 `remaining = Math.max(0, max - count)`
- [x] 1.5 Fail-open 路徑改為回傳 `{ exceeded: false, count: 0, remaining: max, resetAt: now + windowSec }`

## 2. RateLimitGuard — 讀取新回傳值並設定回應 headers

- [x] 2.1 更新 guard 解構 `{ exceeded, remaining, resetAt }` 從 `incrementAndCheck()`
- [x] 2.2 在每次請求（無論是否超限）用 `response.setHeader()` 設定 `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- [x] 2.3 超限時，在拋出 exception 前將 `{ retryAfter, limit, remaining: 0, resetAt }` 掛到 `(req as Record<string, unknown>).rateLimitInfo`
- [x] 2.4 計算 `retryAfter = Math.max(0, resetAt - Math.floor(Date.now() / 1000))`

## 3. AllExceptionsFilter — 429 結構化回應

- [x] 3.1 在 filter 內新增 `RateLimitInfo` interface（`retryAfter`, `limit`, `remaining`, `resetAt`）
- [x] 3.2 在 `catch()` 方法中，status 為 429 時讀取 `req.rateLimitInfo`
- [x] 3.3 若 `rateLimitInfo` 存在，設定 `res.setHeader('Retry-After', info.retryAfter)` 並回傳結構化 JSON body（`error: "rate_limited"`, `message`, `retry_after`, `limit`, `remaining: 0`, `reset_at`）
- [x] 3.4 使用 `optional chaining` 保護讀取，避免 rateLimitInfo 不存在時 throw

## 4. main.ts — 啟用 CORS 並 expose headers

- [x] 4.1 在 `app.useGlobalPipes()` 後呼叫 `app.enableCors({ origin: '*', exposedHeaders: ['Retry-After', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'] })`

## 5. GET /ratelimit 端點

- [x] 5.1 在 `src/cache/cache.service.ts` 新增 `RateLimitStatus` interface（`limit`, `remaining`, `resetAt`）
- [x] 5.2 新增 `getRateLimitStatus(ip, max, windowSec): Promise<RateLimitStatus>` 方法，用 `Promise.all([redis.get(key), redis.ttl(key)])` 並行讀取，不呼叫 INCR
- [x] 5.3 建立 `src/ratelimit/ratelimit.controller.ts`，實作 `GET /ratelimit`：提取 IP（邏輯與 `RateLimitGuard` 相同）、呼叫 `getRateLimitStatus()`、回傳 `{ limit, remaining, reset_at }`
- [x] 5.4 建立 `src/ratelimit/ratelimit.module.ts`，引入 `CacheModule` 和 `ConfigModule`
- [x] 5.5 在 `src/app.module.ts` 的 `imports` 加入 `RateLimitModule`

## 6. 驗證

- [x] 6.1 執行 `npm run build` 確認 TypeScript 無錯誤（`incrementAndCheck` 呼叫端型別相容）
- [x] 6.2 啟動 dev server，發送 `POST /analyze`（未超限），確認回應帶 `X-RateLimit-*` headers
- [x] 6.3 耗盡 limit 後觸發 429，確認回應帶 `Retry-After` header 且 JSON body 含 `retry_after`, `reset_at`
- [x] 6.4 確認 CORS preflight（`OPTIONS`）回應包含 `Access-Control-Expose-Headers` 列出全部四個 header
- [x] 6.5 `GET /ratelimit`（未呼叫 `/analyze` 前）→ `remaining` 等於 `limit`
- [x] 6.6 呼叫 `POST /analyze` 兩次後，`GET /ratelimit` → `remaining` 等於 `limit - 2`
- [x] 6.7 連呼 `GET /ratelimit` 十次，確認 `/analyze` 的可用次數未被消耗
