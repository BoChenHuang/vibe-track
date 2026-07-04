## Context

回傳歌曲數量「8」目前硬編碼在 `SELECT_SYSTEM_PROMPT`（`claude.service.ts`）。Claude 讀取這個固定數字決定要從候選中挑幾首。請求 DTO 沒有任何 limit 欄位。

## Goals / Non-Goals

**Goals:**
- 請求可傳入 `limit: 5 | 8 | 10`，預設 8，行為與現在相同
- Swagger 文件顯示可選值與預設值

**Non-Goals:**
- 不支援任意整數（只允許三個預設值）
- Cache key 不納入 limit（同一段文字/圖片不同 limit 可能命中舊快取，此為可接受的邊界情況）

## Decisions

### Decision 1: 允許值用 `@IsIn([5, 8, 10])` 驗證，不用 enum

**選擇**：`const TRACK_LIMITS = [5, 8, 10] as const`，搭配 `@IsIn(TRACK_LIMITS)`。

**備選**：TypeScript enum 或 string literal union。

**理由**：數字陣列 const 最簡潔，`@IsIn` 直接支援，Swagger 用 `enum: TRACK_LIMITS` 顯示可選值。不需要額外的 enum 檔案。

---

### Decision 2: `buildSelectSystemPrompt(limit)` 動態函式取代靜態常數

**選擇**：將 `SELECT_SYSTEM_PROMPT` 改為 `buildSelectSystemPrompt(limit: number): string`，在 `selectTracks()` 呼叫時傳入 limit。

**備選**：把 limit 注入 user message 而非 system prompt。

**理由**：system prompt 已有完整指示邏輯，在 system prompt 層面控制 limit 最直接，避免 user message 和 system prompt 產生衝突。

---

### Decision 3: `limit` 預設值在 DTO 層處理

**選擇**：`@ApiPropertyOptional({ default: 8 })`，controller 用 `body.limit ?? 8` 傳給 service。

**理由**：保持 service 和 claude 層不含業務預設值邏輯，預設值只在入口 DTO 定義一次。

## Risks / Trade-offs

- **Cache 不含 limit**：同樣 input + 不同 limit 可能返回快取中 8 首的結果。設計上接受，需在文件說明。
- **multipart string 轉型**：`limit` 以 multipart form 傳入時是字串，必須加 `@Type(() => Number)` 確保 class-transformer 轉型，否則 `@IsIn([5, 8, 10])` 會因為比較 `"8" !== 8` 而拒絕請求。
