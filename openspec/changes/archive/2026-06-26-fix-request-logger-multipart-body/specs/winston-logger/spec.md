## MODIFIED Requirements

### Requirement: 結構化 log 輸出
系統 SHALL 輸出結構化 log，包含 `timestamp`、`level`、`message`、`context` 資訊：
- **Console**：NestJS-like 彩色格式，額外欄位（input/output/stack）換行縮排顯示，方便開發期閱讀
- **File**：JSON 格式（每行一筆），供 ELK 等 log 分析工具消費

HTTP request 週期的 log 格式 SHALL 遵守以下規則：
- **Request 抵達時（`→`）**：記錄 `method`、`url`、`ip`。不包含 `input`（body 尚未解析）。
- **Response 完成時（`←`）**：記錄 `method`、`url`、`statusCode`、`duration`、`ip`；若 request body 非空則附加 `input`；若 response body 非空則附加 `output`。

#### Scenario: 正常 log 輸出（console）
- **WHEN** 應用程式執行任何 log 呼叫
- **THEN** console 輸出為帶色彩的 NestJS-like 格式，含 timestamp、level、context、message

#### Scenario: 正常 log 輸出（file）
- **WHEN** 應用程式執行任何 log 呼叫
- **THEN** file（`logs/app-YYYY-MM-DD.log`）輸出為合法的單行 JSON，含 `timestamp`、`level`、`message`

#### Scenario: 有 context 時
- **WHEN** logger 呼叫帶有 `context` 欄位
- **THEN** console 顯示 `[ContextName]`，file JSON 含 `context` 欄位值為對應的 class 名稱

#### Scenario: multipart/form-data 請求的 → log（request 抵達）
- **WHEN** 發送 `POST /analyze` multipart/form-data 請求（含 text 欄位）
- **THEN** `→ POST /analyze` log 立即輸出，不含 `input` 欄位

#### Scenario: multipart/form-data 請求的 ← log（response 完成）
- **WHEN** `POST /analyze` 請求成功完成
- **THEN** `← POST /analyze 200 <ms>ms` log 輸出，包含 `input`（如 `{ text: "..." }`）和 `output`（response body）

#### Scenario: 僅傳送圖片（無 text body）的請求
- **WHEN** 發送 `POST /analyze` 請求，body 只有圖片欄位，無其他文字欄位
- **THEN** `←` log 不包含 `input` 欄位（body 為空物件）
