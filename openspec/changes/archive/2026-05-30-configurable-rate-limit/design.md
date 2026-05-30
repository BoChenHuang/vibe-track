## Context

`RateLimitGuard` 目前直接以常數 `5`（max）與 `60`（window 秒）實作固定視窗算法。這些值被硬編碼在 guard 本身，無法在不修改程式碼的情況下調整。Render 部署時正式環境需要更嚴格的限制（每小時 5 次），開發環境則維持寬鬆設定（每分鐘 5 次）。

## Goals / Non-Goals

**Goals:**
- 透過 `RATE_LIMIT_MAX` 與 `RATE_LIMIT_WINDOW_SEC` 環境變數控制 rate limit 參數
- 在 Joi schema 加入型別驗證與合理的預設值
- 將參數納入現有的型別化 config (`app.config.ts`)，讓 guard 依賴 ConfigService 而非硬編碼值

**Non-Goals:**
- 改變 rate limit 演算法（仍維持 Redis 固定視窗）
- 每個端點獨立設定 rate limit
- 動態在執行期變更 rate limit（只能透過重啟服務）

## Decisions

### 決策 1：使用現有 NestJS ConfigService，而非直接讀 `process.env`

`RateLimitGuard` 目前透過 `@Inject(CACHE_SERVICE)` 取得 Redis client。同樣地，注入 `ConfigService` 可保持一致性，並在 Joi 驗證層就攔截錯誤的環境變數值，不讓程式在執行期才爆炸。

替代方案：直接讀 `process.env.RATE_LIMIT_MAX`，程式碼更簡單，但失去型別安全與啟動時驗證的保障，不採用。

### 決策 2：預設值設為 `RATE_LIMIT_MAX=5`、`RATE_LIMIT_WINDOW_SEC=60`

維持現有行為，對已部署環境不造成任何破壞。正式環境只需在 Render dashboard 加上 `RATE_LIMIT_WINDOW_SEC=3600` 即可切換為每小時 5 次的限制。

### 決策 3：在 `app.config.ts` 以巢狀物件 `rateLimit` 揭露

與現有 config 結構一致（已有 `spotify`、`claude` 等巢狀欄位的模式）。Guard 注入 `ConfigService` 後讀取 `config.get<AppConfig>('app').rateLimit.max` 與 `...windowSec`。

## Risks / Trade-offs

- **設定錯誤的風險** → 若 `RATE_LIMIT_WINDOW_SEC` 被設為 0 或負數，Redis `EXPIRE` 行為不符預期。Joi 加入 `min(1)` 驗證可在啟動時阻擋。
- **單位混淆** → `WINDOW_SEC` 以秒為單位，`ioredis` 的 `expire` 也是秒，不需轉換，但應在 `.env.example` 加注釋說明。

## Migration Plan

1. 更新 `env.validation.ts` 加入兩個選填欄位，服務重啟後仍使用預設值，無 breaking change
2. 更新 `app.config.ts` 讀取新欄位
3. 更新 `RateLimitGuard` 注入 ConfigService
4. Render 環境變數設定 `RATE_LIMIT_WINDOW_SEC=3600`（正式上線時）
5. Rollback：移除環境變數即可回到預設值（60 秒）

## Open Questions

（無）
