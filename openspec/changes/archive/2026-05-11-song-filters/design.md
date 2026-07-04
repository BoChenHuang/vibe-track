## Context

目前 `POST /analyze` 流程：Claude 生成 3 組搜尋 query → Spotify Search API（各 limit=10）→ 合併去重（最多 30 首）→ Claude 選出 8 首。整個流程不接受市場偏好，且候選曲數量較少。

## Goals / Non-Goals

**Goals:**
- 新增 `market`（ISO 3166-1 alpha-2，如 `TW`、`US`、`JP`）選填參數，傳入 Spotify Search 的 `market` 參數並引導 Claude query 方向
- Spotify search limit 維持 10（受 dev 模式限制），待申請 Extended Quota 後可提高以擴大候選曲池
- 未傳入時行為與現有完全相同（向後相容）

**Non-Goals:**
- 熱門程度篩選（由提高 limit 自然改善，不開放獨立參數）
- 語言 100% 精準過濾（market 影響上架地區，非語言本身）
- 多市場同時指定
- 前端 UI

## Decisions

### 1. Market：直接傳入 Spotify Search API + 引導 Claude query

**決定**：`market` 值不做轉換，直接作為 Spotify Search API 的 `market` query parameter，同時附加到 `analyzeMood` 的 user message，讓 Claude 生成更符合該市場音樂風格的搜尋 query。

```
market=TW → Claude 傾向產生 mandopop / cantopop 相關 query
           → Spotify search 限定在台灣上架的歌曲
```

**理由**：不需維護語言→market 對應表，呼叫端直接傳正確市場代碼，行為透明。

### 2. Spotify search limit 維持 10（dev 模式限制）

**決定**：`searchByQuery` 的 limit 維持 10。實作時發現 Spotify dev 模式將 search limit 硬限在 10，傳入更高值會回傳 400 Invalid limit。需申請 Extended Quota 後才能提高。

### 3. 資料流整理

```
POST /analyze { text?, image?, market? }
  │
  ├─ ClaudeService.analyzeMood(text, image, market?)
  │    → { queries: string[], reason: string }
  │
  ├─ SpotifyService.searchByQueries(queries, market?)  [limit=10/query]
  │    → SpotifyTrack[]
  │
  └─ ClaudeService.selectTracks(candidates, reason)
       → TrackSelection[]
```

## Risks / Trade-offs

- **市場非等於語言**：`market=TW` 包含英語歌，非 100% 中文歌；文件應說明這是「市場偏好」而非語言過濾
- **popularity 欄位在 dev 模式為 null**：Spotify dev 模式不回傳 popularity，soft preference 功能無效；程式碼架構已就緒，待取得 Extended Quota 後自動生效
