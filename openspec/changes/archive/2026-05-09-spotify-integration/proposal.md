## Why

Claude 情緒分析完成後，需要將輸出的情緒參數（valence、energy、tempo、genres、keywords）轉換成實際的 Spotify 歌曲推薦，這是系統對使用者的最終輸出。

## What Changes

- 實作 `SpotifyService`，處理 OAuth Client Credentials 取得 access_token
- 用 Claude 輸出的 keywords + genres 搜尋 Spotify 歌曲
- 取得 audio features 並計算與目標情緒的距離，排序取最接近的 8 首
- 格式化回應：title、artist、spotify_url、preview_url、reason
- `AnalyzeService` 改為串接 ClaudeService → SpotifyService → 回傳完整結果

## Capabilities

### New Capabilities

- `song-recommendation`: 接收情緒參數，搜尋 Spotify，回傳 8 首推薦歌曲

### Modified Capabilities

- `mood-analysis`: AnalyzeService 的 analyze() 回傳格式從情緒 JSON 改為完整的 tracks 陣列

## Impact

- `src/spotify/spotify.service.ts` — 新增 Spotify API 呼叫邏輯
- `src/analyze/analyze.service.ts` — 串接 SpotifyService
- 需要環境變數：`SPOTIFY_CLIENT_ID`、`SPOTIFY_CLIENT_SECRET`
- Response schema 符合 `docs/02_api_design.md`
