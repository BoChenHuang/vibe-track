## Why

目前 rate limit 的視窗時間（60 秒）與上限次數（5 次）皆為程式碼中的硬編碼常數，正式上線時需要改為較嚴格的限制（每小時 5 次），但每次調整都得修改程式碼並重新部署。透過環境變數控制，可在不改 code 的情況下針對不同環境套用不同限制。

## What Changes

- 新增兩個環境變數 `RATE_LIMIT_MAX`（最大請求數）與 `RATE_LIMIT_WINDOW_SEC`（視窗秒數），供 `RateLimitGuard` 讀取
- `env.validation.ts` 中加入對應的 Joi 驗證規則（選填，有預設值）
- `app.config.ts` 中將 rate limit 參數納入型別化 config
- `RateLimitGuard` 改為從 config 讀取，不再使用硬編碼常數
- 預設值維持開發友善設定（60 秒 / 5 次），正式環境透過環境變數設定為 3600 秒 / 5 次

## Capabilities

### New Capabilities

（無新增 capability，僅修改既有行為）

### Modified Capabilities

- `rate-limiting`：原本固定 60 秒視窗與 5 次上限，改為透過環境變數 `RATE_LIMIT_WINDOW_SEC` 與 `RATE_LIMIT_MAX` 控制，並新增相應的 Scenario 描述環境變數預設行為

## Impact

- `src/config/env.validation.ts` — 加入 `RATE_LIMIT_MAX`、`RATE_LIMIT_WINDOW_SEC` 驗證
- `src/config/app.config.ts` — 加入 `rateLimit.max`、`rateLimit.windowSec` 欄位
- `src/common/guards/rate-limit.guard.ts` — 改為注入 ConfigService 讀取參數
- `.env.example` — 加入兩個新的環境變數範例
- `CLAUDE.md` — 更新環境變數說明表格
