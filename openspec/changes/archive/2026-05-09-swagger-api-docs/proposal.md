## Why

`@nestjs/swagger` 已安裝且在 `main.ts` 設置了基本配置，但核心的 `/analyze` 端點和其 DTO 缺乏 Swagger 裝飾器，導致 API 文件不完整、無法在 Swagger UI 中測試完整功能。

## What Changes

- 在 `AnalyzeDto` 加入 `@ApiProperty` 裝飾器，讓 text 欄位出現在文件中
- 在 `AnalyzeController` 加入 `@ApiTags`、`@ApiOperation`、`@ApiConsumes`、`@ApiBody`、`@ApiOkResponse` 等裝飾器，完整描述 multipart/form-data 的文件上傳端點
- 定義 analyze 端點的回應 schema，包含 mood、tracks 等欄位
- 確認 Spotify service 回傳的 track 資料結構，並在 Swagger schema 中對應記錄

## Capabilities

### New Capabilities
- `swagger-analyze-endpoint`: 為 `/analyze` POST 端點加入完整的 Swagger 文件，涵蓋 multipart 上傳、請求 body schema 及回應 schema

### Modified Capabilities
<!-- 現有 spec 的需求未變動，僅為補充實作層級的文件裝飾 -->

## Impact

- `src/analyze/dto/analyze.dto.ts` — 新增 `@ApiProperty`
- `src/analyze/analyze.controller.ts` — 新增 Swagger 裝飾器
- Swagger UI (`/api/docs`) — analyze 端點將完整顯示並可測試
