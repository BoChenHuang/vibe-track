## ADDED Requirements

### Requirement: 回傳最多 8 首推薦歌曲
系統 SHALL 根據情緒參數從 Spotify 搜尋並回傳歌曲，數量由請求的 `limit` 參數決定（允許值：5、8、10，預設 8）；由 Claude 二次篩選決定最終結果。

#### Scenario: 不傳 limit，預設回傳 8 首
- **WHEN** 發送 `POST /analyze`，未提供 `limit` 參數
- **THEN** 回傳 HTTP 200，`tracks` 陣列包含 ≤ 8 個元素

#### Scenario: 傳入 limit=5
- **WHEN** 發送 `POST /analyze`，`limit=5`
- **THEN** 回傳 HTTP 200，`tracks` 陣列包含 ≤ 5 個元素

#### Scenario: 傳入 limit=10
- **WHEN** 發送 `POST /analyze`，`limit=10`
- **THEN** 回傳 HTTP 200，`tracks` 陣列包含 ≤ 10 個元素

#### Scenario: Spotify 搜尋結果不足 limit 首
- **WHEN** 合併後候選歌曲少於 `limit` 首
- **THEN** 回傳現有全部歌曲（不補到 limit 首）

#### Scenario: Spotify 搜尋完全失敗
- **WHEN** 所有 query 搜尋均失敗
- **THEN** 回傳 `{ mood: ..., tracks: [] }`

#### Scenario: 傳入不允許的 limit 值
- **WHEN** 發送 `POST /analyze`，`limit=7`（不在允許值內）
- **THEN** 回傳 HTTP 422，說明 limit 必須為 5、8 或 10

### Requirement: 歌曲資訊格式
每首推薦歌曲 SHALL 包含 title、artist、spotify_url、preview_url（可為 null）、album_image_url（可為 null）、reason（每首獨立中文推薦理由）。

#### Scenario: 回傳格式正確
- **WHEN** 推薦成功
- **THEN** 每首歌都包含 `title`（string）、`artist`（string）、`spotify_url`（string）、`preview_url`（string | null）、`album_image_url`（string | null）、`reason`（string，每首獨立）

#### Scenario: 專輯無封面
- **WHEN** Spotify 回傳的曲目 `album.images` 為空陣列
- **THEN** `album_image_url` 為 null

### Requirement: Claude 產出 Spotify 搜尋 query
系統 SHALL 讓 Claude 根據情緒分析結果產出 3 組 Spotify 可辨識的搜尋 query。

#### Scenario: Query 格式正確
- **WHEN** Claude 分析情緒
- **THEN** 回傳 3 組英文 query，每組 2~3 個詞，涵蓋不同風格角度

### Requirement: 多 query 合併搜尋去重
系統 SHALL 對 3 組 query 各打一次 Spotify search（limit=10，受 Spotify dev 模式限制），合併並用 track ID 去重。若請求帶有 `market` 參數，每次 search 請求 SHALL 附加 `market` query parameter。

#### Scenario: 正常合併
- **WHEN** 3 組 query 各回傳結果
- **THEN** 合併後最多 30 首候選，同一首歌只出現一次

#### Scenario: 帶 market 參數的搜尋
- **WHEN** 請求包含 `market: "TW"`
- **THEN** 每次 Spotify search 帶 `market=TW`，回傳結果限定台灣上架的歌曲

### Requirement: Spotify access_token 自動刷新
系統 SHALL 在 token 過期前自動刷新，不因 token 失效而回傳錯誤。

#### Scenario: Token 過期
- **WHEN** 距離上次取得 token 已超過 1 小時
- **THEN** 系統自動取得新 token，請求正常完成

#### Scenario: Spotify API 失敗（單一 query）
- **WHEN** 某一組 query 的 Spotify search 回傳非 2xx
- **THEN** 該組結果為空，繼續處理其他 query（graceful fallback）

### Requirement: Claude query 生成反映 market 偏好
若請求帶有 `market` 參數，系統 SHALL 在傳給 `analyzeMood` 的提示中附加市場偏好說明，讓 Claude 生成更符合該市場音樂風格的搜尋 query。

#### Scenario: 帶 market 的 query 生成
- **WHEN** 請求包含 `market: "JP"`
- **THEN** Claude 生成的 query 偏向日本音樂風格（如 j-pop、j-rock 相關詞彙）

#### Scenario: 不帶 market 的 query 生成
- **WHEN** 請求不含 `market`
- **THEN** Claude 生成行為與現有相同，不限風格方向

### Requirement: API 回應頂層包含 mood 欄位
系統 SHALL 在 `POST /analyze` 回應中，將 `mood` 欄位置於 `tracks` 之前，回應結構為 `{ mood, tracks }`。

#### Scenario: 成功推薦後回應結構
- **WHEN** 發送 `POST /analyze`，text 或圖片合法
- **THEN** 回傳 HTTP 200，body 頂層同時包含 `mood` 與 `tracks` 兩個欄位

#### Scenario: Swagger 文件反映新欄位
- **WHEN** 訪問 `GET /api/docs`
- **THEN** `POST /analyze` 回應 schema 包含 `mood` 欄位的完整型別定義（MoodDto）
