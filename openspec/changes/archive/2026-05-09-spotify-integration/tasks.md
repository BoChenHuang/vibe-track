## 1. SpotifyService — Token 管理

- [x] 1.1 在 `SpotifyService` 注入 `ConfigService`，讀取 `SPOTIFY_CLIENT_ID`、`SPOTIFY_CLIENT_SECRET`
- [x] 1.2 實作 `getAccessToken()`：POST `https://accounts.spotify.com/api/token`，grant_type=client_credentials
- [x] 1.3 內部保存 `{ token: string, expiresAt: number }`，每次呼叫前檢查是否過期

## 2. SpotifyService — 搜尋與過濾

- [x] 2.1 實作 `searchTracks(keywords: string, genres: string[]): Promise<SpotifyTrack[]>`
  - query：`{keywords} genre:{genres[0]}`
  - `GET https://api.spotify.com/v1/search?q=...&type=track&limit=10`（新 App 最大 limit 為 10）
- [x] 2.2 實作 `getAudioFeatures(trackIds: string[]): Promise<AudioFeature[]>`
  - `GET https://api.spotify.com/v1/audio-features?ids={ids.join(',')}`
  - 注意：Spotify 新 App 此端點回 403，遇到時 log warn 並回傳 []（graceful fallback）
- [x] 2.3 實作 `selectBestTracks(tracks, audioFeatures, moodParams)：SpotifyTrack[]`
  - 若有 audio features：計算 distance 排序，優先選有 preview_url 的，取前 8 首
  - 若無 audio features（403 fallback）：直接按 preview_url 優先取前 8 首

## 3. AnalyzeService 串接

- [x] 3.1 在 `AnalyzeModule` import `SpotifyModule`，export `SpotifyService`
- [x] 3.2 `AnalyzeService.analyze()` 流程：
  1. 呼叫 `ClaudeService.analyzeMood()` 取得情緒參數
  2. 呼叫 `SpotifyService.searchTracks()` 取得候選歌曲
  3. 呼叫 `SpotifyService.getAudioFeatures()` 取得音樂特徵
  4. 呼叫 `SpotifyService.selectBestTracks()` 取 8 首
  5. 格式化為 `{ tracks: [...] }` 回傳
- [x] 3.3 每首歌的 `reason` 使用 Claude 回傳的同一個 `reason` 字串

## 4. 驗證

- [x] 4.1 `POST /analyze` body `{ text: "開心的夏天" }` → 回傳 `{ tracks: [...] }`，陣列長度 ≤ 8
- [x] 4.2 確認每首歌都有 `title`、`artist`、`spotify_url`、`reason`
- [x] 4.3 確認 `spotify_url` 格式為 `https://open.spotify.com/track/...`
- [x] 4.4 多次呼叫確認 token 不重複請求（1 小時內）
