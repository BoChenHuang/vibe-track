## 1. DTOs

- [x] 1.1 新增 `MoodTagDto`（`name: string`、`primary: boolean`）至 `src/analyze/dto/`
- [x] 1.2 新增 `MoodDto`（`label: string`、`sub: string`、`tags: MoodTagDto[]`）至 `src/analyze/dto/`
- [x] 1.3 更新 `AnalyzeResponseDto`：加入 `mood: MoodDto` 欄位，置於 `tracks` 之前；加上 Swagger `@ApiProperty` 裝飾器

## 2. Claude Service

- [x] 2.1 更新 `MoodParams` interface：新增 `label: string`、`sub: string`、`tags: { name: string; primary: boolean }[]`
- [x] 2.2 修改 `ANALYZE_SYSTEM_PROMPT`：在 JSON 結構中加入 `label`、`sub`、`tags` 欄位說明與格式範例（tags 至少一個 primary: true）
- [x] 2.3 `analyzeMood()` 回傳型別隨 `MoodParams` 自動更新，確認 `JSON.parse` 後型別正確

## 3. Analyze Service

- [x] 3.1 讀取 `moodParams.label`、`moodParams.sub`、`moodParams.tags`，組裝 `mood` 物件
- [x] 3.2 最終回傳值從 `{ tracks }` 改為 `{ mood, tracks }`
- [x] 3.3 快取 `getCached()` 讀取結果後，檢查是否包含 `mood` 欄位；若缺少（舊快取格式）則視為 cache miss，重新呼叫並更新快取

## 4. 驗證

- [x] 4.1 啟動本機服務，發送 `POST /analyze` 確認回應包含 `mood` 與 `tracks` 兩個頂層欄位
- [x] 4.2 確認 `mood.tags` 至少一個 `primary: true`
- [x] 4.3 確認 Swagger `/api/docs` 回應 schema 顯示 `MoodDto` 型別定義
- [x] 4.4 執行 `npm test` 確認現有測試通過
