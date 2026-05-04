## 1. FileValidationPipe

- [ ] 1.1 實作 `src/common/pipes/file-validation.pipe.ts`，驗證 `mimetype`（image/jpeg、image/png）與 `size`（≤ 5,242,880 bytes）
- [ ] 1.2 格式或大小不符時拋出 `BadRequestException`

## 2. AnalyzeDto

- [ ] 2.1 在 `src/analyze/dto/analyze.dto.ts` 新增 `text` 欄位（optional string, `@MaxLength(300)`）
- [ ] 2.2 安裝 `class-validator`、`class-transformer`，在 `main.ts` 啟用 `ValidationPipe`

## 3. ClaudeService

- [ ] 3.1 在 `ClaudeService` 注入 `ConfigService`，讀取 `CLAUDE_API_KEY`
- [ ] 3.2 實作 `analyzeMood(text?: string, imageBuffer?: Buffer, mimeType?: string): Promise<MoodParams>` 方法
- [ ] 3.3 依輸入類型建構 Claude messages：text-only / image-only / 兩者
- [ ] 3.4 圖片轉 base64：`imageBuffer.toString('base64')`
- [ ] 3.5 呼叫 `anthropic.messages.create()`，model 使用 `claude-sonnet-4-5`
- [ ] 3.6 `JSON.parse()` 解析回應，失敗時拋出 `InternalServerErrorException`

## 4. AnalyzeController & Service

- [ ] 4.1 在 `AnalyzeController` 新增 `POST /analyze`，使用 `@UseInterceptors(FileInterceptor('image'))`
- [ ] 4.2 套用 `FileValidationPipe` 於 `@UploadedFile()` 參數
- [ ] 4.3 在 `AnalyzeService.analyze()` 檢查 text 與 image 皆為空時拋出 `UnprocessableEntityException`
- [ ] 4.4 呼叫 `ClaudeService.analyzeMood()` 並回傳結果

## 5. 驗證

- [ ] 5.1 `POST /analyze` body `{ text: "夜晚孤獨" }` → 回傳 200 與情緒 JSON
- [ ] 5.2 上傳合法 JPG 圖片 → 回傳 200
- [ ] 5.3 text 與 image 皆為空 → 回傳 422
- [ ] 5.4 text 超過 300 字 → 回傳 400
- [ ] 5.5 上傳 GIF → 回傳 400
