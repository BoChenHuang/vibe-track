## ADDED Requirements

### Requirement: 每 IP 每視窗限制請求次數
系統 SHALL 對每個來源 IP 限制在 `RATE_LIMIT_WINDOW_SEC`（預設 60）秒內最多 `RATE_LIMIT_MAX`（預設 5）次 `POST /analyze` 請求。

#### Scenario: 請求次數未超限
- **WHEN** 同一 IP 在視窗時間內發送第 `RATE_LIMIT_MAX` 次請求
- **THEN** 回傳 HTTP 200，正常處理

#### Scenario: 超過限制
- **WHEN** 同一 IP 在視窗時間內發送第 `RATE_LIMIT_MAX + 1` 次請求
- **THEN** 回傳 HTTP 429

#### Scenario: 限制窗口重置
- **WHEN** `RATE_LIMIT_WINDOW_SEC` 秒過後，同一 IP 再次發送請求
- **THEN** 計數重置，回傳 HTTP 200

### Requirement: Rate limit 參數可透過環境變數設定
系統 SHALL 從環境變數讀取 `RATE_LIMIT_MAX`（整數，最小值 1）與 `RATE_LIMIT_WINDOW_SEC`（整數，最小值 1）作為 rate limit 設定，兩者皆為選填，預設值分別為 5 與 60。

#### Scenario: 未設定環境變數時使用預設值
- **WHEN** 服務啟動時未設定 `RATE_LIMIT_MAX` 與 `RATE_LIMIT_WINDOW_SEC`
- **THEN** 系統使用 max=5、windowSec=60 的預設設定

#### Scenario: 透過環境變數覆蓋設定
- **WHEN** 服務啟動時設定 `RATE_LIMIT_MAX=5` 且 `RATE_LIMIT_WINDOW_SEC=3600`
- **THEN** 系統每小時最多允許同一 IP 5 次請求

#### Scenario: 無效的環境變數值
- **WHEN** 服務啟動時設定 `RATE_LIMIT_WINDOW_SEC=0` 或負整數
- **THEN** 服務啟動失敗，回報 Joi 驗證錯誤

### Requirement: Redis 失敗時降級
系統 SHALL 在 Redis 連線失敗時允許請求通過，而非拒絕所有請求。

#### Scenario: Redis 不可用
- **WHEN** Redis 連線失敗
- **THEN** Rate limit Guard 允許請求繼續，不回傳 429
