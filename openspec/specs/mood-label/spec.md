## ADDED Requirements

### Requirement: API 回應包含結構化情緒摘要欄位
系統 SHALL 在 `POST /analyze` 回應的頂層加入 `mood` 欄位，結構固定為 `{ label, sub, tags }`。

#### Scenario: 正常分析後回傳 mood
- **WHEN** `POST /analyze` 成功完成情緒分析與歌曲推薦
- **THEN** 回應包含 `mood` 頂層欄位，`label` 為非空字串，`sub` 為非空字串，`tags` 為非空陣列

#### Scenario: tags 陣列結構
- **WHEN** 回傳 `mood.tags`
- **THEN** 每個元素包含 `name`（string）與 `primary`（boolean），且至少一個元素的 `primary` 為 `true`

#### Scenario: mood 欄位來自快取
- **WHEN** 相同輸入命中 Redis 快取
- **THEN** 回應包含正確的 `mood` 欄位（與首次分析結果相同）
