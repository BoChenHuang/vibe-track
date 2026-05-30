## 1. DTO 層

- [x] 1.1 在 `src/analyze/dto/analyze-body.dto.ts` 新增 `limit` 欄位：`@ApiPropertyOptional({ enum: [5, 8, 10], default: 8 })`、`@IsOptional()`、`@Type(() => Number)`、`@IsIn([5, 8, 10])`
- [x] 1.2 在 `src/analyze/dto/analyze.dto.ts` 新增 `limit?: number` 欄位

## 2. Controller

- [x] 2.1 在 `src/analyze/analyze.controller.ts` 的 `analyze()` 方法中，從 `body` 取出 `limit`，傳給 `analyzeService.analyze()`

## 3. Service

- [x] 3.1 在 `src/analyze/analyze.service.ts` 的 `analyze()` 方法加入 `limit = 8` 參數，傳給 `claudeService.selectTracks()`

## 4. Claude Service

- [x] 4.1 在 `src/claude/claude.service.ts` 將 `SELECT_SYSTEM_PROMPT` 常數改為 `buildSelectSystemPrompt(limit: number): string` 函式，把兩處「8 首」替換為 `${limit} 首`
- [x] 4.2 更新 `selectTracks()` 簽名加入 `limit: number` 參數，呼叫 `buildSelectSystemPrompt(limit)` 取得 system prompt

## 5. 驗證

- [x] 5.1 `npx tsc --noEmit` 無型別錯誤
- [x] 5.2 `npm test` 現有測試通過
- [x] 5.3 啟動服務，`POST /analyze` 不帶 `limit` 回傳 8 首
- [x] 5.4 `POST /analyze` 帶 `limit=5` 回傳 ≤ 5 首
- [x] 5.5 `POST /analyze` 帶 `limit=7` 回傳 HTTP 400（validation error）
