## ADDED Requirements

### Requirement: 相同輸入命中快取
系統 SHALL 對相同的 text + image 輸入回傳快取結果，不重新呼叫 Claude 或 Spotify API。

#### Scenario: 快取命中
- **WHEN** 發送與前次完全相同的 text 輸入
- **THEN** 回傳 HTTP 200，回應時間明顯短於首次請求

#### Scenario: 快取未命中
- **WHEN** 第一次發送某個輸入
- **THEN** 呼叫 Claude + Spotify，結果存入快取後回傳

### Requirement: 快取有效期 24 小時
系統 SHALL 讓快取結果在 24 小時後自動失效。

#### Scenario: 快取過期
- **WHEN** 距離上次相同請求超過 24 小時
- **THEN** 重新呼叫 Claude + Spotify，更新快取

### Requirement: Redis 失敗時降級
系統 SHALL 在 Redis 連線失敗時跳過快取，直接呼叫 Claude + Spotify。

#### Scenario: Redis 不可用
- **WHEN** Redis 連線失敗
- **THEN** 略過 cache 查詢，正常呼叫 API 並回傳結果（不回傳錯誤）
