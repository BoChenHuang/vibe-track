## 1. 建立 DTO 類別

- [x] 1.1 新增 `src/analyze/dto/track-result.dto.ts`：將 `TrackResult` interface 轉為 class，五個欄位各加 `@ApiProperty`（`preview_url` 加 `nullable: true`）
- [x] 1.2 新增 `src/analyze/dto/analyze-response.dto.ts`：class 含 `tracks: TrackResultDto[]`，加 `@ApiProperty({ type: [TrackResultDto] })`
- [x] 1.3 新增 `src/analyze/dto/analyze-body.dto.ts`：class 含 `@ApiPropertyOptional` 的 `text` 和 `@ApiProperty({ type: 'string', format: 'binary' })` 的 `image`，加注釋說明 `image` 僅供 Swagger 使用

## 2. 修改 AnalyzeService

- [x] 2.1 移除 `analyze.service.ts` 中的 `TrackResult` interface，改 import `TrackResultDto` from DTO 檔
- [x] 2.2 修改 `AnalyzeService.analyze()` 回傳型別為 `Promise<AnalyzeResponseDto>`，import `AnalyzeResponseDto`

## 3. 修改 AnalyzeController

- [x] 3.1 移除 `@ApiBody({ schema: {...} })` 內聯寫法，改為 `@ApiBody({ type: AnalyzeBodyDto })`，import `AnalyzeBodyDto`
- [x] 3.2 移除 `@ApiOkResponse({ schema: {...} })` 內聯寫法，改為 `@ApiOkResponse({ type: AnalyzeResponseDto, description: '...' })`，import `AnalyzeResponseDto`
- [x] 3.3 在 `analyze()` 方法簽名加入明確回傳型別 `Promise<AnalyzeResponseDto>`

## 4. 驗證

- [x] 4.1 執行 `npm run build`，確認無 TypeScript 型別錯誤
- [x] 4.2 啟動 `npm run start:dev`，curl `/api/docs-json` 確認 `/analyze` 的 requestBody 和 200 response schema 結構與重構前相同，再用 `lsof -ti :3000 | xargs kill -9` 關閉 server
