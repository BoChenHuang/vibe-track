## 1. DTO 更新

- [x] 1.1 在 `AnalyzeBodyDto` 新增 `market?: MarketCode`，加上 `@ApiPropertyOptional` 與 `@IsEnum(MarketCode)` 驗證；建立 `MarketCode` enum（TW/US/JP/KR/HK/SG/GB/AU/CA/FR/DE/ES/BR）

## 2. SpotifyService 更新

- [x] 2.1 維持 `searchByQuery` 的 limit=10（Spotify dev 模式上限為 10，無法提高）
- [x] 2.2 為 `searchByQuery` 與 `searchByQueries` 新增 `market?: string` 參數，當有值時附加 `&market=XX` 到 Spotify search URL

## 3. ClaudeService 更新

- [x] 3.1 為 `analyzeMood` 新增 `market?: string` 參數，當有值時在 user message 末尾附加市場偏好說明（例：`市場偏好：TW（台灣），請生成符合台灣流行音樂風格的搜尋 query`）

## 4. AnalyzeService 更新

- [x] 4.1 在 `analyze` 方法簽名新增 `market?: string` 參數
- [x] 4.2 將 `market` 傳入 `analyzeMood` 呼叫
- [x] 4.3 將 `market` 傳入 `searchByQueries` 呼叫

## 5. Controller 更新

- [x] 5.1 在 `AnalyzeController` 的 `POST /analyze` handler 從 DTO 取出 `market` 並傳入 `analyzeService.analyze`

## 6. Popularity 軟偏好（範疇外追加）

- [x] 6.1 `SpotifyTrack` interface 新增 `popularity: number` 欄位，Spotify 回應映射時取出（dev 模式回傳 null）
- [x] 6.2 `selectTracks` 候選清單加入 popularity 數值；`SELECT_SYSTEM_PROMPT` 加入軟偏好指示（dev 模式因 popularity 為 null 無效，待 Extended Quota 後自動生效）
- [x] 6.3 `TrackResultDto` 新增 `popularity: number | null` 欄位（dev 模式為 null）

## 7. 驗證

- [x] 7.1 啟動服務，發送帶 `market: "TW"` 的請求，確認回傳歌曲含台灣市場內容
- [x] 7.2 發送不帶 `market` 的請求，確認行為與現有相同
