## Why

骨架建好後，需要接入 Claude API 讓系統能分析使用者輸入的文字或圖片，輸出結構化的情緒參數（valence、energy、tempo、genres、keywords），供後續 Spotify 搜尋使用。

## What Changes

- 實作 `ClaudeService`，呼叫 Claude API 進行情緒分析
- 實作 `AnalyzeController` 的 `POST /analyze` endpoint，接收文字或圖片
- 實作 `AnalyzeDto` 驗證輸入（text maxLength 300、image JPG/PNG max 5MB、至少一個）
- 實作 `FileValidationPipe` 驗證上傳檔案格式與大小
- Claude 回傳固定 JSON 格式，解析後交給 AnalyzeService

## Capabilities

### New Capabilities

- `mood-analysis`: 接收 text/image 輸入，呼叫 Claude API，回傳情緒參數 JSON
- `input-validation`: DTO 與 Pipe 驗證使用者輸入格式

### Modified Capabilities

## Impact

- `src/claude/claude.service.ts` — 新增 Claude API 呼叫邏輯
- `src/analyze/analyze.controller.ts` — 新增 POST /analyze endpoint
- `src/analyze/analyze.service.ts` — 串接 ClaudeService
- `src/analyze/dto/analyze.dto.ts` — 新增輸入驗證
- `src/common/pipes/file-validation.pipe.ts` — 新增檔案驗證
- 需要環境變數：`CLAUDE_API_KEY`
