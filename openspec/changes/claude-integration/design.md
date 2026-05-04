## Context

`project-setup` 建立了空模組骨架。此 change 填入 Claude API 整合邏輯，讓 `POST /analyze` 可以接收輸入並回傳情緒分析結果。這是整個系統的第一個有效 endpoint，Week 1 Milestone。

## Goals / Non-Goals

**Goals:**
- `POST /analyze` 可接收 text 或 image（或兩者）
- ClaudeService 呼叫 Claude API 回傳固定 JSON 結構
- 輸入驗證：text ≤ 300 字、image 僅 JPG/PNG 且 ≤ 5MB
- 缺少輸入時回傳 422；格式錯誤回傳 400

**Non-Goals:**
- 呼叫 Spotify（留給 spotify-integration）
- Redis cache（留給 redis-protection）
- 儲存查詢歷史

## Decisions

**D1：Claude model 使用 `claude-sonnet-4-5`**
- 支援 vision（圖片輸入）
- 成本與能力平衡適中

**D2：圖片用 base64 編碼傳給 Claude**
- Claude API messages 格式要求：`{ type: "image", source: { type: "base64", media_type, data } }`
- multer 的 `memoryStorage` 直接取得 Buffer，轉 base64 不需寫檔

**D3：Prompt 要求只回傳 JSON，不加其他文字**
- System prompt 明確要求：「請只回傳 JSON，不要有任何其他文字」
- ClaudeService 用 `JSON.parse()` 解析回應，若失敗拋出 500

**D4：FileValidationPipe 在 Controller 層驗證**
- 使用 `@UsePipes` 或 `@UploadedFile` 搭配自訂 pipe
- 驗證 `mimetype`（image/jpeg、image/png）與 `size`（≤ 5MB）

**D5：text 與 image 至少一個的驗證**
- 在 `AnalyzeService` 層檢查，兩者都空時拋出 `UnprocessableEntityException`（422）

## Risks / Trade-offs

- [Claude 回傳非 JSON 格式] → try/catch JSON.parse，拋出 InternalServerErrorException
- [圖片過大造成記憶體壓力] → multer limits 設定為 5MB，超出直接拒絕

## Migration Plan

1. 在 `ClaudeService` 實作 `analyzeMood(text?, imageBuffer?, mimeType?)` 方法
2. 在 `AnalyzeController` 新增 `POST /analyze`，使用 `FileInterceptor`
3. 在 `AnalyzeService` 串接 ClaudeService，暫時直接回傳 Claude 輸出
4. 用 Postman 測試：text 輸入、圖片輸入、兩者同時、兩者都空
