## ADDED Requirements

### Requirement: 回傳最多 8 首推薦歌曲
系統 SHALL 根據情緒參數從 Spotify 搜尋並回傳最多 8 首歌曲（由 Claude 二次篩選決定）。

#### Scenario: 成功推薦
- **WHEN** 發送 `POST /analyze`，text 或圖片合法
- **THEN** 回傳 HTTP 200，`tracks` 陣列包含 ≤ 8 個元素

#### Scenario: Spotify 搜尋結果不足 8 首
- **WHEN** 合併後候選歌曲少於 8 首
- **THEN** 回傳現有全部歌曲（不補到 8 首）

#### Scenario: Spotify 搜尋完全失敗
- **WHEN** 所有 query 搜尋均失敗
- **THEN** 回傳 `{ tracks: [] }`

### Requirement: 歌曲資訊格式
每首推薦歌曲 SHALL 包含 title、artist、spotify_url、preview_url（可為 null）、reason（每首獨立中文推薦理由）。

#### Scenario: 回傳格式正確
- **WHEN** 推薦成功
- **THEN** 每首歌都包含 `title`（string）、`artist`（string）、`spotify_url`（string）、`preview_url`（string | null）、`reason`（string，每首獨立）

### Requirement: Claude 產出 Spotify 搜尋 query
系統 SHALL 讓 Claude 根據情緒分析結果產出 3 組 Spotify 可辨識的搜尋 query。

#### Scenario: Query 格式正確
- **WHEN** Claude 分析情緒
- **THEN** 回傳 3 組英文 query，每組 2~3 個詞，涵蓋不同風格角度

### Requirement: 多 query 合併搜尋去重
系統 SHALL 對 3 組 query 各打一次 Spotify search（limit=10），合併並用 track ID 去重。

#### Scenario: 正常合併
- **WHEN** 3 組 query 各回傳結果
- **THEN** 合併後最多 30 首候選，同一首歌只出現一次

### Requirement: Spotify access_token 自動刷新
系統 SHALL 在 token 過期前自動刷新，不因 token 失效而回傳錯誤。

#### Scenario: Token 過期
- **WHEN** 距離上次取得 token 已超過 1 小時
- **THEN** 系統自動取得新 token，請求正常完成

#### Scenario: Spotify API 失敗（單一 query）
- **WHEN** 某一組 query 的 Spotify search 回傳非 2xx
- **THEN** 該組結果為空，繼續處理其他 query（graceful fallback）
