## Context

`claude-integration` 完成後，`POST /analyze` 可取得情緒參數 JSON。此 change 將情緒輸出轉為 Spotify 搜尋，取回最符合情緒的 8 首歌曲，完成核心推薦流程。

## Goals / Non-Goals

**Goals:**
- SpotifyService 自動取得並刷新 access_token
- Claude 根據情緒產出 3 組 Spotify 搜尋 query，合併候選後二次篩選
- 每首歌產出獨立中文推薦理由
- 回傳符合 API design 的 tracks 陣列

**Non-Goals:**
- Redis cache（留給 redis-protection）
- audio features 距離排序（受 Spotify API 限制，見下方說明）

## Spotify API 限制（實作過程發現）

- **limit 上限**：Spotify 新建立的 App 搜尋 limit 最大為 10（原設計 20），超過回 400
- **audio-features 端點**：新 App 呼叫 `GET /audio-features` 回傳 403 Forbidden，需向 Spotify 申請 Extended Access 才能解鎖

## Decisions

**D1：OAuth Client Credentials flow，token 快取在記憶體**
- Spotify access_token 有效 1 小時
- SpotifyService 內部保存 `{ token, expiresAt }`，過期前自動刷新
- 不需 Redis，單一 process 即可

**D2：搜尋策略**
- Claude analyzeMood 回傳 3 組 Spotify query（每組 2~3 個英文詞，涵蓋不同風格角度）
- 對 3 組 query 各打一次 `GET /search?q=...&type=track&limit=10`
- 合併結果並用 track ID 去重，最多 30 首候選

**D3：Claude 二次篩選**
- 將候選清單（title + artist）連同情緒背景送給 Claude
- Claude 選出最符合情緒的 8 首，並為每首產出獨立繁體中文推薦理由
- 取代原本依賴 audio features 的數值距離排序

**D4：preview_url**
- preview_url 允許 null，前端自行處理
- Claude 篩選時可酌情優先選有 preview 的歌曲，但不強制

## Risks / Trade-offs

- [audio features 無法存取] → 改用 Claude 語意篩選，需兩次 Claude API 呼叫
- [Spotify API 無 preview_url] → 允許 null，前端自行處理
- [兩次 Claude 呼叫增加延遲] → 接受，MVP 階段準確度優先於速度

## Migration Plan

1. 修改 Claude system prompt，改為輸出 `{ queries, reason }` 格式
2. 實作 `SpotifyService.getAccessToken()`（含 token 快取）
3. 實作 `SpotifyService.searchByQueries(queries)`（3 次搜尋 + 去重合併）
4. 實作 `ClaudeService.selectTracks(candidates, moodReason)`（二次篩選）
5. 在 `AnalyzeService` 串接：analyzeMood → searchByQueries → selectTracks → 回傳 tracks
