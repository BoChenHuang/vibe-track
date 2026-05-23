## 1. CacheModule & Redis 連線

- [x] 1.1 在 `CacheModule` 建立 ioredis 連線，讀取 `REDIS_URL` 環境變數
- [x] 1.2 將 `ioredis` 實例透過 `CacheModule` export 給其他模組使用
- [x] 1.3 連線失敗時 log 錯誤，不 crash 應用

## 2. CacheService — Rate Limiting

- [x] 2.1 實作 `incrementAndCheck(ip: string): Promise<boolean>`
  - key：`ratelimit:{ip}`
  - Redis INCR，若結果為 1 則 EXPIRE 60
  - 若結果 > 5 回傳 `true`（已超限）
- [x] 2.2 Redis 失敗時捕捉 exception，回傳 `false`（允許通過）

## 3. RateLimitGuard

- [x] 3.1 實作 `src/common/guards/rate-limit.guard.ts`，注入 `CacheService`
- [x] 3.2 從 request 取得 IP（`req.ip` 或 `req.headers['x-forwarded-for']`）
- [x] 3.3 呼叫 `CacheService.incrementAndCheck(ip)`，超限時拋出 `HttpException(429)`

## 4. CacheService — Response Cache

- [x] 4.1 實作 `getCached(key: string): Promise<string | null>`
- [x] 4.2 實作 `setCached(key: string, value: string, ttlSeconds: number): Promise<void>`
- [x] 4.3 Redis 失敗時捕捉 exception，回傳 `null`（降級）

## 5. AnalyzeService 串接 Cache

- [x] 5.1 在 `AnalyzeService` 注入 `CacheService`
- [x] 5.2 計算 cache key：`md5(text ?? '' + imageBuffer)`
- [x] 5.3 analyze() 流程：
  1. 查 cache → 命中則直接回傳
  2. 未命中 → 呼叫 Claude + Spotify
  3. 將結果 JSON.stringify 後存入 cache（TTL 86400 秒）
  4. 回傳結果

## 6. Controller 套用 Guard

- [x] 6.1 在 `AnalyzeController` 的 `POST /analyze` 加上 `@UseGuards(RateLimitGuard)`

## 7. 驗證

- [x] 7.1 同樣 text 請求兩次，第二次回應時間 < 100ms（cache hit）
- [x] 7.2 同一 IP 快速發送 6 次請求，第 6 次回傳 429
- [x] 7.3 60 秒後再打，回傳 200（rate limit 重置）
