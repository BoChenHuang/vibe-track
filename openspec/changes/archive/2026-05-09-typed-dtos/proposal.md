## Why

`AnalyzeController` 的 Swagger 文件直接以內聯 `schema` 物件撰寫在 decorator 中，缺乏對應的 TypeScript 類別，導致 IDE 無法推斷 controller 的回傳型別，且 Swagger schema 與程式碼實際型別各自維護、容易失同步。

## What Changes

- 新增 `TrackResultDto` class（取代 `analyze.service.ts` 中的 `TrackResult` interface），加入 `@ApiProperty` 裝飾器
- 新增 `AnalyzeResponseDto` class，包含 `tracks: TrackResultDto[]`，供 controller 回傳型別標注及 `@ApiOkResponse({ type: AnalyzeResponseDto })` 使用
- 新增 `AnalyzeBodyDto` class（含 `text` 和 `image` 欄位），取代 `@ApiBody({ schema: {...} })` 內聯寫法，改為 `@ApiBody({ type: AnalyzeBodyDto })`
- 修改 `AnalyzeController.analyze()` 加入明確回傳型別 `Promise<AnalyzeResponseDto>`
- 修改 `AnalyzeService.analyze()` 回傳型別從 `Promise<{ tracks: TrackResult[] }>` 改為 `Promise<AnalyzeResponseDto>`，移除 `TrackResult` 介面（改由 DTO class 提供）

## Capabilities

### New Capabilities
- `typed-response-dtos`: 為 analyze 端點的請求 body 與回應定義專屬的 DTO 類別，提供 TypeScript 型別推斷與 Swagger schema 共用的單一來源

### Modified Capabilities
<!-- 現有 swagger-analyze-endpoint spec 的 Swagger 文件可見性需求不變，僅為實作層級重構 -->

## Impact

- `src/analyze/dto/track-result.dto.ts` — 新增
- `src/analyze/dto/analyze-response.dto.ts` — 新增
- `src/analyze/dto/analyze-body.dto.ts` — 新增
- `src/analyze/analyze.service.ts` — 移除 `TrackResult` interface，改 import `TrackResultDto`；回傳型別改為 `AnalyzeResponseDto`
- `src/analyze/analyze.controller.ts` — `@ApiBody` 改用 class type，`@ApiOkResponse` 改用 class type，`analyze()` 加明確回傳型別
- Swagger UI 輸出不變（schema 欄位結構相同）
