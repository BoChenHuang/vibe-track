## 1. DTO 文件裝飾

- [x] 1.1 在 `src/analyze/dto/analyze.dto.ts` 的 `text` 欄位加入 `@ApiPropertyOptional`，設定 `maxLength: 300` 與 `example`

## 2. Controller 文件裝飾

- [x] 2.1 在 `AnalyzeController` class 層加入 `@ApiTags('analyze')`
- [x] 2.2 在 `analyze()` 方法加入 `@ApiOperation({ summary, description })`
- [x] 2.3 在 `analyze()` 方法加入 `@ApiConsumes('multipart/form-data')`
- [x] 2.4 在 `analyze()` 方法加入 `@ApiBody`，手動描述 `text`（string, optional）和 `image`（string, format: binary, optional）欄位
- [x] 2.5 在 `analyze()` 方法加入 `@ApiOkResponse`，描述包含 `tracks` 陣列的回應 schema（每個 track 含 `title`、`artist`、`spotify_url`、`preview_url`、`reason`）
- [x] 2.6 在 `analyze()` 方法加入 `@ApiUnprocessableEntityResponse`，描述缺少 text 和 image 時的 422 錯誤

## 3. 驗證

- [x] 3.1 啟動 dev server（`npm run start:dev`），開啟 `http://localhost:3000/api/docs`，確認 `/analyze` 端點出現在 `analyze` tag 下
- [x] 3.2 在 Swagger UI 中使用 text-only 請求執行 `/analyze`，確認回應 schema 正確顯示
- [x] 3.3 確認 422 錯誤回應在文件中有記錄
