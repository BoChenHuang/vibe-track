## Context

`@nestjs/swagger` 已安裝（v11.4.2），`main.ts` 已有基本的 `DocumentBuilder` 配置並掛載在 `/api/docs`。`AppController` 已有 `@ApiTags`、`@ApiOperation`、`@ApiOkResponse` 裝飾器。

缺少的部分在 `/analyze` 端點：
- `AnalyzeController` 沒有任何 Swagger 裝飾器
- `AnalyzeDto` 的 `text` 欄位沒有 `@ApiProperty`
- 回應格式（`{ tracks: TrackResult[] }`）未在文件中反映

## Goals / Non-Goals

**Goals:**
- 讓 `/analyze` POST 端點在 Swagger UI 中可正確顯示並測試，包含 multipart/form-data 上傳
- 完整描述請求（text + image）和回應（tracks 陣列）的 schema
- 保持現有 `AppController` 已有的裝飾器不變

**Non-Goals:**
- 重構 API 路由或回應格式
- 加入 JWT / Bearer auth 到 Swagger（此版本不涉及認證）
- 為 Spotify service 或 Claude service 內部方法加文件

## Decisions

### 1. multipart/form-data 使用 `@ApiConsumes` + `@ApiBody`

`@nestjs/swagger` 對 `FileInterceptor` 無法自動推斷 multipart schema，需要明確加上：
- `@ApiConsumes('multipart/form-data')`
- `@ApiBody({ schema: { ... } })` 手動描述 `text`（string, optional）和 `image`（binary, optional）欄位

**替代方案**：建立獨立 DTO class 含 `@ApiProperty`。這在純 JSON 端點效果好，但 multipart 仍需 `@ApiConsumes`，且會增加不必要的 class。直接在 decorator 中描述 schema 更簡潔。

### 2. 回應 schema 使用內聯 schema 而非獨立 Response class

`TrackResult` 介面已定義在 `analyze.service.ts`。由於此版本僅補文件，使用 `@ApiOkResponse({ schema: { ... } })` 內聯描述，不額外建立 response DTO class，避免與既有介面重複。

### 3. `AnalyzeDto` 加入 `@ApiPropertyOptional`

`text` 是 optional string，使用 `@ApiPropertyOptional` 語義最清晰，並加上 `maxLength: 300` 與 `example`。

## Risks / Trade-offs

- [multipart schema 需手動維護] 若端點欄位新增，需同步更新 `@ApiBody` → Mitigation: 將 schema 與 DTO 欄位放在一起，code review 時容易發現
- [內聯 schema 無型別保護] 若 `TrackResult` 介面欄位改變，Swagger 文件不會自動更新 → Mitigation: `tasks.md` 中加入提醒，未來可考慮改為 response class
