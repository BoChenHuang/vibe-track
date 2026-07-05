## 1. 實作修改

- [x] 1.1 修改 `buildCacheKey` 方法簽名，加入 `limit?: number` 和 `market?: string` 兩個參數（`src/analyze/analyze.service.ts` line ~115）
- [x] 1.2 在 `buildCacheKey` 的 MD5 計算中加入 `String(limit ?? 8)` 和 `market ?? ''` 兩個 `.update()` 呼叫
- [x] 1.3 更新 `analyze()` 中的 `buildCacheKey` 呼叫點（line ~39），傳入 `resolvedLimit` 和 `market`

## 2. 驗證

- [x] 2.1 確認 TypeScript 型別檢查通過（`npm run build`）
- [x] 2.2 手動測試：相同 text，`limit=5` 與 `limit=10` 分別回傳正確數量的歌曲
- [x] 2.3 手動測試：相同 text + limit，第二次請求命中 Redis 快取（回應時間明顯縮短）
- [x] 2.4 確認 Redis 中存在對應不同 limit 的兩個不同 key（`redis-cli keys 'cache:*'`）
