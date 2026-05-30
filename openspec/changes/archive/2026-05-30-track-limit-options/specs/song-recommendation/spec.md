## MODIFIED Requirements

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
