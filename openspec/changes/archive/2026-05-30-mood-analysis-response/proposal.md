## Why

目前 `POST /analyze` 只回傳推薦歌曲清單，但呼叫端完全看不到 Claude 分析了什麼情緒。加入結構化的情緒摘要欄位，讓前端或使用者能理解「為什麼推薦這些歌」，提升回應的可解釋性與使用者體驗。

## What Changes

- API 回應增加頂層 `mood` 欄位，結構為 `{ label, sub, tags }`：
  - `label`：主情緒標籤（例如 "Melancholic"、"Energetic"）
  - `sub`：次情緒描述（例如 "quietly nostalgic"）
  - `tags`：情緒標籤陣列，每個標籤 `{ name, primary }`，至少有一個 `primary: true`
- Claude 的 `analyzeMood()` 回傳格式新增 `label`、`sub`、`tags` 欄位（現有 valence/energy/tempo/genres/keywords/reason 不變）
- `AnalyzeResponseDto` 新增 `MoodDto` 型別
- 回應結構由 `{ tracks }` 變更為 `{ mood, tracks }`

## Capabilities

### New Capabilities
- `mood-label`: 結構化情緒摘要 — 定義 `mood` 欄位的格式（label、sub、tags）及其在 API 回應中的位置

### Modified Capabilities
- `mood-analysis`: Claude analyzeMood 回傳格式新增 `label`、`sub`、`tags` 欄位
- `song-recommendation`: API 回應格式從 `{ tracks }` 擴展為 `{ mood, tracks }`

## Impact

- `src/claude/claude.service.ts` — `analyzeMood()` prompt 指示及回傳 schema 需加入 label/sub/tags
- `src/analyze/analyze.service.ts` — 解析 Claude 回應時讀取新欄位；組裝最終回應時附加 `mood`
- `src/analyze/dto/analyze-response.dto.ts` — 加入 `MoodDto`、`MoodTagDto`，更新 `AnalyzeResponseDto`
- `src/analyze/dto/track-result.dto.ts` — 不異動
- Redis 快取：快取 key 不變（MD5 of input），快取 value 結構擴展（包含 `mood`）；TTL 維持 24 小時
