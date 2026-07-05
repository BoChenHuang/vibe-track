## Context

`AnalyzeService.buildCacheKey(text, imageBuffer)` 產生的 MD5 不含請求參數 `limit` 和 `market`。
`limit`（允許值：5 / 8 / 10）控制回傳歌曲數量；`market` 控制 Spotify 地區篩選。
Claude 的 `selectTracks` 以 `limit` 為目標數量做語意選歌，相同 limit 值不同內容時 Claude 選出的歌曲集合不同，因此直接截斷快取結果無法保證語意正確性。

## Goals / Non-Goals

**Goals:**
- 相同 text/image 但不同 limit 或 market 的請求，分別產生獨立的 Redis key
- 每個 `(text, image, limit, market)` 組合的快取結果語意正確
- 不清空 Redis，舊 key 隨 TTL 自然過期

**Non-Goals:**
- 跨 limit 值共用快取（如「存 10 首，按需截斷」）— Claude 的選歌語意依 limit 不同，截斷無法保證最佳結果
- 變更 TTL 策略或快取層架構

## Decisions

### 決策：將 limit 和 market 納入 MD5 計算

**選項 A（採用）**：修改 `buildCacheKey` 簽名，加入 `limit` 和 `market` 兩個參數，更新 MD5 計算。

**選項 B（不採用）**：永遠快取 10 首，讀取時依 limit slice。
- 問題：Claude `selectTracks` 使用 limit 做語意決策；limit=5 的最佳 5 首不一定是 limit=10 的前 5 首。
- 額外複雜度：需要在 cache hit 路徑加入 slice 邏輯，且若第一次請求是 limit=5，快取只有 5 首，limit=10 的後續請求仍會 cache miss。

**選項 A 的成本**：limit 只有 3 個值，market 實際使用集中於少數地區，Redis key 數量最多增加約 3× per market，總記憶體影響可忽略（每筆 entry ~1–3 KB，Render 免費方案 25 MB 上限）。

## Risks / Trade-offs

- **舊快取失效**：部署後舊 key 格式不再被命中，等效於 cache 短暫降溫，在 TTL 24h 內既有 key 仍佔用少量 Redis 記憶體。→ 可接受，無需手動清空。
- **單一修改點**：變更只影響 `analyze.service.ts` 的 `buildCacheKey` 及其唯一呼叫點，影響範圍最小，回滾成本低。

## Migration Plan

1. 修改 `buildCacheKey`，新增 `limit?: number, market?: string` 參數
2. 更新唯一呼叫點傳入 `resolvedLimit` 和 `market`
3. 部署新版本至 Render（無需 Redis 操作）
4. 舊 key 在 24h TTL 後自動清除
