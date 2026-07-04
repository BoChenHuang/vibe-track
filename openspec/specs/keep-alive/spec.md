## ADDED Requirements

### Requirement: Keep-alive 防止冷啟動
系統 SHALL 提供機制讓外部定期 ping，防止 Render free tier 休眠。

#### Scenario: Keep-alive ping 成功
- **WHEN** cron-job.org 每 10 分鐘發送 `GET /health`
- **THEN** 服務保持活躍，回傳 HTTP 200 `{ "status": "ok" }`

### Requirement: Production 環境正常運作
系統 SHALL 在 Render 上以 production 模式啟動，所有 API 功能正常。

#### Scenario: POST /analyze 在 production 可用
- **WHEN** 打 `POST https://vibe-track.onrender.com/analyze`，附上合法 text
- **THEN** 回傳 HTTP 200，包含 8 首歌曲推薦

#### Scenario: 環境變數缺少
- **WHEN** Render 上未設定必要環境變數
- **THEN** 服務啟動失敗，顯示明確錯誤訊息
