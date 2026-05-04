## Context

`claude-integration` 完成後，`POST /analyze` 可取得情緒參數 JSON。此 change 將情緒參數轉為 Spotify 搜尋，取回 8 首最符合情緒的歌曲，完成核心推薦流程。

## Goals / Non-Goals

**Goals:**
- SpotifyService 自動取得並刷新 access_token
- 用 keywords + genres 搜尋歌曲，取得 audio features，排序取 8 首
- 優先選有 preview_url 的歌曲
- 回傳符合 API design 的 tracks 陣列

**Non-Goals:**
- Redis cache（留給 redis-protection）
- 每首歌產生個別 reason（MVP 階段全用 Claude 的同一個 reason）

## Decisions

**D1：OAuth Client Credentials flow，token 快取在記憶體**
- Spotify access_token 有效 1 小時
- SpotifyService 內部保存 `{ token, expiresAt }`，過期前自動刷新
- 不需 Redis，單一 process 即可

**D2：搜尋策略**
- query string：`{keywords} genre:{genres[0]}`
- `GET /search?q=...&type=track&limit=20`
- 取回 20 首後用 audio features 過濾排序

**D3：距離計算**
- 對每首歌計算：`distance = |valence - target| + |energy - target| + |tempo/180 - target/180|`
- 按 distance 升序排序，取前 8

**D4：preview_url 優先**
- 過濾時優先保留有 preview_url 的歌曲
- 若有 preview 的少於 8 首，才補入沒有 preview 的

**D5：audio features API 批次查詢**
- `GET /audio-features?ids=id1,id2,...`（最多 100 個 id）
- 一次查完 20 首，避免多次請求

## Risks / Trade-offs

- [Spotify API 無 preview_url] → 允許 null，前端自行處理
- [audio features 回傳 null] → 過濾掉無 audio features 的歌曲

## Migration Plan

1. 實作 `SpotifyService.getAccessToken()`（含 token 快取）
2. 實作 `SpotifyService.searchTracks(keywords, genres)`
3. 實作 `SpotifyService.getAudioFeatures(trackIds)`
4. 實作 `SpotifyService.selectBestTracks(tracks, audioFeatures, moodParams)`
5. 在 `AnalyzeService` 串接：Claude → Spotify → 回傳 tracks
6. Postman 測試：`POST /analyze` 回傳 8 首歌，含 spotify_url
