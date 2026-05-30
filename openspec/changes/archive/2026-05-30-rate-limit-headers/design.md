## Context

VibeTrack 目前的 rate limiting 使用 Redis 固定視窗計數器（`ratelimit:{ip}`），由 `RateLimitGuard` 透過 `CacheService.incrementAndCheck()` 執行，超限時拋出 `HttpException(429)`。

現有問題：
- `incrementAndCheck()` 只回傳 `boolean`（是否超限），沒有剩餘次數或 TTL 資訊。
- 429 回應只有裸訊息字串，沒有 `Retry-After` header 或結構化 body。
- 成功回應也沒有任何 rate limit headers。
- CORS 未啟用，`Access-Control-Expose-Headers` 不存在。

## Goals / Non-Goals

**Goals:**
- `CacheService.incrementAndCheck()` 回傳 `{ exceeded, remaining, resetAt }` 物件
- Guard 在每次請求（成功或失敗）前都能取得完整 rate limit 狀態
- 成功回應帶 `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- 429 回應帶 `Retry-After` header + 結構化 JSON body（`retry_after`, `limit`, `remaining`, `reset_at`）
- CORS expose headers 讓瀏覽器可讀取這些自訂 headers

**Non-Goals:**
- 不更改 rate limit 演算法（仍為固定視窗）
- 不新增任何 env var
- 不更動 API endpoint 或請求格式
- 不為其他 endpoint 加 rate limiting

## Decisions

### D1：`incrementAndCheck()` 改回傳物件，以 `redis.ttl()` 取得 resetAt

現況：只回傳 `boolean`。

方案選擇：
- **選用**：INCR → 若 count === 1 則 EXPIRE → TTL 取 resetAt。三步驟，有微小 race window，但對 rate limit 精度影響可忽略。
- 備選：Lua script 原子化操作。更精確，但增加維護複雜度，不值得。
- 備選：在 guard 自行計算 `now + windowSec`，不呼叫 TTL。只在第一次正確，後續請求 resetAt 會偏移。

回傳型別：
```typescript
interface RateLimitResult {
  exceeded: boolean;
  count: number;
  remaining: number;  // max(0, max - count)
  resetAt: number;    // Unix epoch 秒，UTC
}
```

Fail-open 保持不變：Redis 失敗時回傳 `{ exceeded: false, remaining: max, resetAt: now + windowSec }`。

### D2：rate limit 資訊透過 request 物件傳遞給 exception filter

Guard 在拋出 429 前，先將資訊掛到 `req.rateLimitInfo`（型別 assertion）。Exception filter 讀取後設定 `Retry-After` header 和 JSON body。

方案選擇：
- **選用**：`(req as Record<string, unknown>).rateLimitInfo = { ... }`。最少改動，不需要自訂 exception class。
- 備選：自訂 `RateLimitException extends HttpException`，在 exception 物件本身帶資料。乾淨但需要新建 class，對此規模過度設計。

### D3：Guard 在成功路徑也設定 X-RateLimit-* headers

Guard 在呼叫 `canActivate()` 時透過 `context.switchToHttp().getResponse()` 直接設定 headers，無需攔截器。

### D4：CORS 使用 `app.enableCors()` + `exposedHeaders`

在 `main.ts` 加 `app.enableCors({ origin: '*', exposedHeaders: [...] })`。`origin: '*'` 適用於目前無認證的公開 API；若未來需要限制 origin，可改為環境變數。

### D5：`GET /ratelimit` 使用 `redis.get()` + `redis.ttl()`，不呼叫 INCR

新增 `CacheService.getRateLimitStatus(ip, max, windowSec)` 方法：
- `redis.get(key)` 取現有計數（null → 0）
- `redis.ttl(key)` 取剩餘 TTL（負值表示 key 不存在，resetAt 設為 `now + windowSec`）
- 兩個 Redis 指令用 `Promise.all` 並行發送，減少延遲
- 回傳 `{ limit: max, remaining: max(0, max - count), resetAt }`

方案選擇：
- **選用**：純讀取（GET + TTL）。語意明確，不影響配額。
- 備選：reuse `incrementAndCheck()` 但傳入 max=Infinity。語意不清，容易誤用。
- 備選：Lua script 原子化。對純讀取沒有必要。

**新 Controller 架構**：

新增 `src/ratelimit/` 模組：
- `ratelimit.module.ts` — 引入 `CacheModule` 和 `ConfigModule`
- `ratelimit.controller.ts` — `GET /ratelimit`，從 headers 提取 IP（與 `RateLimitGuard` 相同邏輯），呼叫 `getRateLimitStatus()`，回傳 `{ limit, remaining, reset_at }`
- 在 `app.module.ts` 的 `imports` 加入 `RateLimitModule`

此端點**不掛 `RateLimitGuard`**——它本身就是查詢工具，不需要配額保護。

## Risks / Trade-offs

- **TTL race condition**：INCR 和 TTL 之間如果 key 剛好過期，TTL 會回傳 -2，`resetAt` 會退化為 `now + windowSec`。影響：前端顯示的倒數時間可能偏差最多 1 個視窗。可接受。
- **`req.rateLimitInfo` 型別不安全**：使用 `Record<string, unknown>` 的 assertion，無法在編譯期保證 exception filter 讀到的值一定存在。緩解：exception filter 加 optional chaining 判斷。
- **CORS `origin: '*'`**：對無認證 API 可接受；若未來加入用戶認證需改為白名單。

## Migration Plan

無 DB schema 變更，無需 migration。部署步驟：
1. 部署新版本
2. 舊版前端（未使用 headers）：行為不變
3. 新版前端：立即開始讀取 headers

無需 rollback 策略——新增 headers 為純增量，不破壞現有用戶端。
