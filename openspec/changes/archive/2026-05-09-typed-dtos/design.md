## Context

目前 analyze 功能的型別分散在兩處：
- `TrackResult` interface 定義在 `analyze.service.ts`（業務邏輯層）
- Swagger schema 以內聯 `schema: { type: 'object', properties: {...} }` 物件寫在 `analyze.controller.ts` 的 decorator 中

這造成：
1. IDE 無法從 controller 方法的回傳值直接推斷型別（需追溯到 service 再到 interface）
2. Swagger schema 與 TypeScript 型別不共用來源，任一修改都要兩邊同步
3. `@ApiBody({ schema: {...} })` 無法享受 NestJS Swagger plugin 的自動型別提取

## Goals / Non-Goals

**Goals:**
- 建立單一真實來源（DTO class）同時服務 TypeScript 型別系統和 Swagger schema
- 讓 `AnalyzeController.analyze()` 有明確的 TypeScript 回傳型別
- 讓 `@ApiBody` 和 `@ApiOkResponse` 改用 `type:` 而非 `schema:` 語法，使 NestJS Swagger plugin 可自動提取

**Non-Goals:**
- 修改 API 的對外行為或 Swagger UI 呈現的 schema 結構
- 為 `ClaudeService` 或 `SpotifyService` 的內部型別建立 DTO

## Decisions

### 1. `TrackResultDto` 從 interface 升級為 class

NestJS Swagger plugin 需要 class（不接受 interface）才能自動提取型別資訊。將 `TrackResult` 改為 `TrackResultDto` class，欄位加上 `@ApiProperty`，並匯出供 service 和 controller 共用。

**替代方案**：保留 interface，只在 Swagger 裝飾器加 `type: Object` 並用 `schema`。缺點是無法享受 plugin 自動提取，且型別仍然分離。

### 2. `AnalyzeBodyDto` 描述 multipart 請求欄位

建立 class 含 `text`（`@ApiPropertyOptional`）和 `image`（`@ApiProperty({ type: 'string', format: 'binary' })`）。`@ApiBody({ type: AnalyzeBodyDto })` 加上 `@ApiConsumes('multipart/form-data')` 讓 Swagger 正確顯示 file upload。

`image` 在執行期透過 `@UploadedFile` 注入，不出現在 `body: AnalyzeBodyDto` 中。`AnalyzeBodyDto` 僅作為 Swagger 文件的型別載體，不影響 NestJS 的參數解析邏輯。

### 3. `AnalyzeResponseDto` 包裝 tracks 陣列

建立 class 含 `tracks: TrackResultDto[]`，欄位用 `@ApiProperty({ type: [TrackResultDto] })`。`AnalyzeService.analyze()` 和 `AnalyzeController.analyze()` 的回傳型別改為 `Promise<AnalyzeResponseDto>`。

實際回傳的物件字面量仍由 TypeScript 結構相容（structural typing）驗證，不需要 `new AnalyzeResponseDto()`。

## Risks / Trade-offs

- [DTO class 比 interface 多一點 boilerplate] 每個欄位需要 `@ApiProperty` → Mitigation: 欄位數少（5 個），可接受
- [AnalyzeBodyDto.image 不會出現在 body 中] 可能讓讀者困惑 → Mitigation: 在 class 加一行注釋說明此欄位僅供 Swagger 使用
- [structural typing 依賴] 若 `AnalyzeResponseDto` 未來加入 class method，需改為 `new AnalyzeResponseDto()` → 目前為純資料類別，風險低
