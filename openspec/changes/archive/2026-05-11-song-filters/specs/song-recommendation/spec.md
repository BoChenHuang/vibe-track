## MODIFIED Requirements

### Requirement: 多 query 合併搜尋去重
系統 SHALL 對 3 組 query 各打一次 Spotify search（limit=10，受 Spotify dev 模式限制），合併並用 track ID 去重。若請求帶有 `market` 參數，每次 search 請求 SHALL 附加 `market` query parameter。

#### Scenario: 正常合併
- **WHEN** 3 組 query 各回傳結果
- **THEN** 合併後最多 30 首候選，同一首歌只出現一次

#### Scenario: 帶 market 參數的搜尋
- **WHEN** 請求包含 `market: "TW"`
- **THEN** 每次 Spotify search 帶 `market=TW`，回傳結果限定台灣上架的歌曲

#### Scenario: Spotify API 失敗（單一 query）
- **WHEN** 某一組 query 的 Spotify search 回傳非 2xx
- **THEN** 該組結果為空，繼續處理其他 query（graceful fallback）

## ADDED Requirements

### Requirement: Claude query 生成反映 market 偏好
若請求帶有 `market` 參數，系統 SHALL 在傳給 `analyzeMood` 的提示中附加市場偏好說明，讓 Claude 生成更符合該市場音樂風格的搜尋 query。

#### Scenario: 帶 market 的 query 生成
- **WHEN** 請求包含 `market: "JP"`
- **THEN** Claude 生成的 query 偏向日本音樂風格（如 j-pop、j-rock 相關詞彙）

#### Scenario: 不帶 market 的 query 生成
- **WHEN** 請求不含 `market`
- **THEN** Claude 生成行為與現有相同，不限風格方向
