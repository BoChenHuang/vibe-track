## ADDED Requirements

### Requirement: 每 IP 每分鐘限制 5 次請求
系統 SHALL 對每個來源 IP 限制每 60 秒內最多 5 次 `POST /analyze` 請求。

#### Scenario: 請求次數未超限
- **WHEN** 同一 IP 在 60 秒內發送第 5 次請求
- **THEN** 回傳 HTTP 200，正常處理

#### Scenario: 超過限制
- **WHEN** 同一 IP 在 60 秒內發送第 6 次請求
- **THEN** 回傳 HTTP 429

#### Scenario: 限制窗口重置
- **WHEN** 60 秒過後，同一 IP 再次發送請求
- **THEN** 計數重置，回傳 HTTP 200

### Requirement: Redis 失敗時降級
系統 SHALL 在 Redis 連線失敗時允許請求通過，而非拒絕所有請求。

#### Scenario: Redis 不可用
- **WHEN** Redis 連線失敗
- **THEN** Rate limit Guard 允許請求繼續，不回傳 429
