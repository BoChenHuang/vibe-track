## Why

核心推薦功能完成後，每次請求都會呼叫 Claude API（有費用）。需要加上兩層保護：Rate Limiting 防止濫用，Response Cache 避免相同輸入重複付費。

## What Changes

- 實作 `RateLimitGuard`：每個 IP 每分鐘最多 5 次請求，超過回傳 429
- 實作 `CacheService`：對輸入內容做 md5 hash，命中快取直接回傳，不呼叫 Claude/Spotify
- 快取 TTL 24 小時
- 在 `POST /analyze` 套用 Guard 與 Cache

## Capabilities

### New Capabilities

- `rate-limiting`: 以 IP 為 key，限制每分鐘 5 次請求
- `response-cache`: 以輸入內容 hash 為 key，快取分析結果 24 小時

### Modified Capabilities

## Impact

- `src/common/guards/rate-limit.guard.ts` — 實作 Rate Limiting 邏輯
- `src/cache/cache.service.ts` — 實作 Response Cache 邏輯
- `src/analyze/analyze.controller.ts` — 套用 Guard
- `src/analyze/analyze.service.ts` — 套用 Cache
- 需要環境變數：`REDIS_URL`
