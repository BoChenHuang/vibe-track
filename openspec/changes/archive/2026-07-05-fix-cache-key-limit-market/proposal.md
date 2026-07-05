## Why

`buildCacheKey` 目前只對 `text + imageBuffer` 計算 MD5，`limit`（5/8/10）和 `market` 完全不影響 key。相同內容但不同 `limit` 的請求會命中同一個 Redis key，回傳的歌曲數量永遠是第一次寫入快取時的結果；`market` 亦同理，可能回傳不符地區的歌曲。

## What Changes

- `buildCacheKey` 新增 `limit` 與 `market` 兩個參數，納入 MD5 計算
- `analyze()` 呼叫 `buildCacheKey` 時傳入 `resolvedLimit` 和 `market`
- 不同的 `(text, image, limit, market)` 組合將產生不同的 Redis key，各自獨立快取

## Capabilities

### New Capabilities
<!-- 無新能力，此變更為既有快取行為的修正 -->

### Modified Capabilities
- `response-cache`：快取命中條件由「相同 text + image」改為「相同 text + image + limit + market」

## Impact

- **修改檔案**：`src/analyze/analyze.service.ts`（僅 `buildCacheKey` 方法與呼叫點）
- **Redis**：既有 cache entries（舊 key 格式）不受影響，TTL 24 小時後自然過期；無需清空 Redis
- **API 行為**：`limit` 或 `market` 改變時不再命中舊快取，行為更符合使用者預期
- **無 breaking change**：介面與回應格式不變
