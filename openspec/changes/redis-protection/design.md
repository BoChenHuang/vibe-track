## Context

`spotify-integration` 完成後，`POST /analyze` 每次都會呼叫 Claude + Spotify API，有成本與濫用風險。此 change 在 Redis 層加上保護，讓相同輸入不重複計費，並防止單一 IP 過度請求。

## Goals / Non-Goals

**Goals:**
- Rate Limiting：每 IP 每分鐘 5 次，超過 429
- Response Cache：相同輸入（text + image hash）快取 24 小時
- 連線失敗不 crash 應用（Redis 掛掉時降級處理）

**Non-Goals:**
- 使用者層級的 rate limit（僅 IP）
- 快取失效 API

## Decisions

**D1：使用 `ioredis` 直接操作 Redis，不透過 @nestjs/cache-manager**
- 需要原子操作（INCR + EXPIRE）實作 rate limiting，`cache-manager` 抽象層不夠靈活
- `CacheService` 封裝所有 Redis 操作，其他模組不直接用 ioredis

**D2：Rate Limiting 用 Redis INCR + EXPIRE 實作 sliding window**
- key：`ratelimit:{ip}`，TTL 60 秒
- 每次請求 INCR，若結果為 1 則設 EXPIRE 60
- 若 INCR 結果 > 5 則拒絕

**D3：Cache key 使用 md5(text + imageBuffer)**
- `crypto.createHash('md5').update(text + buffer).digest('hex')`
- 圖片用 Buffer 的原始 bytes，保證相同圖片同樣 hash
- key：`cache:{hash}`

**D4：Cache 在 AnalyzeService 層處理，Guard 在 Controller 層**
- Guard 優先：先過 rate limit，再查 cache，最後才呼叫 Claude/Spotify

**D5：Redis 連線失敗時降級**
- Rate limit 失敗：允許請求通過（不因 Redis 掛掉而拒絕所有請求）
- Cache 失敗：跳過快取，直接呼叫 Claude/Spotify

## Risks / Trade-offs

- [Redis 掛掉] → 降級策略確保服務可用，但失去保護
- [圖片 Buffer 造成 md5 慢] → 圖片最大 5MB，md5 在毫秒內完成，可接受

## Migration Plan

1. 在 `CacheModule` 建立 Redis 連線（ioredis），export `CacheService`
2. 實作 `CacheService.incrementRateLimit(ip)` 與 `CacheService.isRateLimited(ip)`
3. 實作 `CacheService.get(key)` 與 `CacheService.set(key, value, ttl)`
4. 實作 `RateLimitGuard`，注入 `CacheService`
5. 在 `AnalyzeController` 套用 `@UseGuards(RateLimitGuard)`
6. 在 `AnalyzeService.analyze()` 加入 cache check/set 邏輯
7. 測試：同請求打兩次，第二次明顯更快；連打 6 次，第 6 次 429
