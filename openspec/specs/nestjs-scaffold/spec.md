## ADDED Requirements

### Requirement: 專案可正常啟動
應用程式 SHALL 在執行 `npm run start:dev` 後成功啟動，監聽 port 3000。

#### Scenario: 正常啟動
- **WHEN** 執行 `npm run start:dev`
- **THEN** 應用程式啟動成功，console 顯示 `Application is running on: http://localhost:3000`

### Requirement: Health check endpoint
系統 SHALL 提供 `GET /health` endpoint，供部署平台確認服務存活。

#### Scenario: 服務正常時
- **WHEN** 發送 `GET /health`
- **THEN** 回傳 HTTP 200 與 `{ "status": "ok" }`

### Requirement: 環境變數設定
系統 SHALL 透過 `.env` 檔案讀取所有外部服務的設定，並在缺少必要變數時於啟動時拋出錯誤。

#### Scenario: 缺少必要環境變數
- **WHEN** `.env` 中未設定 `CLAUDE_API_KEY`
- **THEN** 應用程式啟動失敗並顯示明確錯誤訊息

#### Scenario: 環境變數正確
- **WHEN** 所有必要環境變數都已設定
- **THEN** 應用程式正常啟動

### Requirement: 模組骨架存在
系統 SHALL 包含 `analyze`、`claude`、`spotify`、`cache` 四個功能模組，及 `common/guards`、`common/pipes` 共用目錄。

#### Scenario: 模組可被 import
- **WHEN** `AppModule` 載入所有子模組
- **THEN** 應用程式啟動時不拋出 dependency injection 錯誤
