## Why

目前 `POST /analyze` 回傳的推薦歌曲清單無法依使用者所在市場篩選，且每個 Spotify query 只搜尋 10 首候選，回傳歌曲知名度參差不齊。允許使用者指定市場偏好，並提高候選曲數量，能提供更符合當地文化與較高品質的推薦體驗。

## What Changes

- 新增 `market` 選填欄位至請求 body，讓使用者指定 Spotify 市場代碼（如 `TW`、`US`、`JP`），過濾在該市場上架的歌曲並引導 Claude 生成符合市場風格的搜尋 query
- 未傳入 `market` 時，維持現有行為（不限市場）
- 每個 Spotify query 的搜尋 limit 從 10 提高至 30，讓候選曲池更大，整體推薦品質更穩定

## Capabilities

### New Capabilities

- `song-filters`: 在 `POST /analyze` 加入 `market`（市場代碼）選填參數，讓 Spotify 搜尋限定特定市場，並引導 Claude query 方向

### Modified Capabilities

- `song-recommendation`: 每個 Spotify search query 的 limit 從 10 提高至 30；新增 `market` 參數支援

## Impact

- `src/analyze/dto/analyze-body.dto.ts`：新增 `market` 選填欄位
- `src/spotify/spotify.service.ts`：`searchByQuery` 與 `searchByQueries` 新增 `market?` 參數；limit 從 10 改為 30
- `src/claude/claude.service.ts`：`analyzeMood` 新增 `market?` 參數，有值時附加市場偏好提示
- `src/analyze/analyze.service.ts`：`analyze` 新增 `market?` 參數並傳遞至各下游呼叫
- Swagger 文件自動更新（透過 DTO 裝飾器）
- 不影響現有無篩選條件的呼叫（完全向後相容）
