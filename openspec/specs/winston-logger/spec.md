## ADDED Requirements

### Requirement: 結構化 log 輸出
系統 SHALL 輸出結構化 log，包含 `timestamp`、`level`、`message`、`context` 資訊：
- **Console**：NestJS-like 彩色格式，額外欄位（input/output/stack）換行縮排顯示，方便開發期閱讀
- **File**：JSON 格式（每行一筆），供 ELK 等 log 分析工具消費

#### Scenario: 正常 log 輸出（console）
- **WHEN** 應用程式執行任何 log 呼叫
- **THEN** console 輸出為帶色彩的 NestJS-like 格式，含 timestamp、level、context、message

#### Scenario: 正常 log 輸出（file）
- **WHEN** 應用程式執行任何 log 呼叫
- **THEN** file（`logs/app-YYYY-MM-DD.log`）輸出為合法的單行 JSON，含 `timestamp`、`level`、`message`

#### Scenario: 有 context 時
- **WHEN** logger 呼叫帶有 `context` 欄位
- **THEN** console 顯示 `[ContextName]`，file JSON 含 `context` 欄位值為對應的 class 名稱

### Requirement: requestId 追蹤
系統 SHALL 對每個 HTTP request 產生唯一的 `requestId`（UUID v4），並自動附加到該 request 週期內的所有 log。

#### Scenario: 正常 HTTP request
- **WHEN** 發送 `GET /health`
- **THEN** 對應的 log 行含 `requestId` 欄位（UUID v4 格式）
- **AND** response header 含 `X-Request-Id` 與 log 的 `requestId` 相同

#### Scenario: 不同 request 的 requestId 不同
- **WHEN** 連續發送兩個 `GET /health`
- **THEN** 兩次 request 的 log 各自帶有不同的 `requestId`

#### Scenario: 無 HTTP context 的 log（如啟動時）
- **WHEN** 應用程式啟動輸出初始化 log
- **THEN** log 輸出正常，`requestId` 欄位可缺席或為 `undefined`

### Requirement: Log level 環境變數設定
系統 SHALL 透過環境變數 `LOG_LEVEL` 控制輸出等級，預設為 `info`；允許值為 `error`、`warn`、`info`、`http`、`verbose`、`debug`。

#### Scenario: 預設 log level
- **WHEN** 未設定 `LOG_LEVEL` 環境變數
- **THEN** 應用程式正常啟動，`debug` 等級的 log 不會輸出，`info` 及以上正常輸出

#### Scenario: 設定 debug level
- **WHEN** `LOG_LEVEL=debug`
- **THEN** `debug` 等級的 log 正常輸出

#### Scenario: 設定無效的 LOG_LEVEL
- **WHEN** `LOG_LEVEL=invalid`
- **THEN** 應用程式啟動失敗並顯示明確錯誤訊息（由 env validation schema 攔截）

### Requirement: NestJS 內建 Logger 替換
系統 SHALL 以 winston 取代 NestJS 預設 logger，所有 NestJS 框架本身的 log（啟動訊息、路由註冊等）也走 winston 輸出。

#### Scenario: NestJS 啟動 log
- **WHEN** 執行 `npm run start:dev`
- **THEN** NestJS 框架輸出的啟動訊息（如 `Nest application successfully started`）以 NestJS-like 格式輸出於 console，並同步寫入 JSON 格式至 log file
