## 1. Config 層更新

- [x] 1.1 在 `src/config/env.validation.ts` 加入 `RATE_LIMIT_MAX`（`Joi.number().integer().min(1).default(5)`）與 `RATE_LIMIT_WINDOW_SEC`（`Joi.number().integer().min(1).default(60)`）
- [x] 1.2 在 `src/config/app.config.ts` 的回傳型別與 factory 中加入 `rateLimit: { max: number; windowSec: number }` 欄位，讀取對應環境變數

## 2. Guard 更新

- [x] 2.1 在 `src/common/guards/rate-limit.guard.ts` 注入 `ConfigService`
- [x] 2.2 將硬編碼的 `5`（max）與 `60`（windowSec）替換為從 config 讀取的值

## 3. 文件更新

- [x] 3.1 在 `.env.example` 加入 `RATE_LIMIT_MAX=5` 與 `RATE_LIMIT_WINDOW_SEC=60`（附上說明正式環境建議值的注釋）
- [x] 3.2 更新 `CLAUDE.md` 環境變數表格，加入 `RATE_LIMIT_MAX` 與 `RATE_LIMIT_WINDOW_SEC` 兩列

## 4. 驗證

- [x] 4.1 執行現有測試確認無 regression（`npm test`）
- [x] 4.2 手動測試：啟動服務，確認設定 `RATE_LIMIT_WINDOW_SEC=3600` 時 rate limit 行為正確
