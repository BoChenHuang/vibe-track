## Context

目前 `POST /analyze` 回應只有 `{ tracks: [...] }`。Claude 在 `analyzeMood()` 內部產出 `reason`（情緒說明），但這份情緒資訊沒有暴露給 API 使用者。

本次變更目標是在同一次 Claude 呼叫中，讓 Claude 一次輸出情緒摘要（`label`、`sub`、`tags`）與搜尋 query，並將情緒摘要放入 API 回應的頂層 `mood` 欄位。

## Goals / Non-Goals

**Goals:**
- API 回應新增 `mood: { label, sub, tags }` 頂層欄位
- 不增加額外的 Claude API 呼叫（成本/延遲不增加）
- `mood` 納入 Redis 快取（與 tracks 共存）

**Non-Goals:**
- 不改變 `selectTracks()` 的行為
- 不對 mood 欄位做後處理或翻譯（直接用 Claude 輸出）
- 不支援 mood 欄位的查詢/過濾

## Decisions

### Decision 1: 在同一個 analyzeMood() 呼叫中擴展回傳欄位

**選擇**：修改 `ANALYZE_SYSTEM_PROMPT`，要求 Claude 在現有 JSON 中加入 `label`、`sub`、`tags`。

**備選**：新增獨立 Claude 呼叫專門取得情緒摘要。

**理由**：Claude 已在 `analyzeMood()` 中分析情緒，只是沒有結構化輸出情緒標籤。一次呼叫增加欄位不增加成本，也不影響延遲。拆成兩次呼叫只會讓速度變慢。

---

### Decision 2: `label` 使用英文，`sub` 使用英文短語，`tags` 為英文名詞

**選擇**：`label`/`sub`/`tags` 均使用英文，`reason` 維持中文。

**理由**：情緒標籤（"Melancholic"、"Energetic"）在前端作為 badge、icon mapping、CSS class 等用途時，英文更通用；`reason` 是給人讀的說明，保留中文符合原有設計。

---

### Decision 3: `tags` 中至少一個 `primary: true`

**選擇**：Claude 輸出的 tags 陣列至少有一個元素標記為 `primary: true`，代表最主要的情緒標籤。其餘為輔助標籤。

**理由**：讓呼叫端可以簡單取出主情緒而不需要自行判斷，同時保留完整標籤集合供需要細節的場景使用。

---

### Decision 4: 快取 value 結構直接包含 mood

**選擇**：快取存的完整回應從 `{ tracks }` 改為 `{ mood, tracks }`，TTL/key 不變。

**理由**：快取 key 是 MD5(input)，input 不變所以 key 不需要改。舊 key 的 value 格式不包含 `mood`，cache miss 後會自動重新呼叫 Claude 並快取新格式，不需要手動清除。

## Risks / Trade-offs

- **Claude 格式不穩定** → 如果 Claude 偶爾漏掉 `label`/`sub`/`tags` 欄位，`JSON.parse` 會成功但型別不完整。Mitigation：`AnalyzeService` 應對缺欄位的 `mood` 做 fallback（例如設為 `null`），避免 500 錯誤。
- **舊快取 value 無 mood 欄位** → 快取 hit 時取出的 value 可能是舊格式（無 `mood`）。Mitigation：`AnalyzeService` 在讀取快取後，如果 `mood` 不存在則視為 cache miss，重新呼叫並更新快取。（或接受暫時回傳 `mood: null`，等 TTL 到期自動更新，較簡單。）

## Open Questions

- `tags` 的數量上限？Claude 通常會給 3–5 個，目前不做限制，由 Claude 自由決定。
