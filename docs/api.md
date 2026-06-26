# VibeTrack API 規格文件

> 版本：當前  
> 基底 URL：`https://<your-service>.onrender.com`  
> 互動式文件：`GET /api/docs`（Swagger UI）

---

## 目錄

1. [概覽](#概覽)
2. [速率限制](#速率限制)
3. [通用錯誤格式](#通用錯誤格式)
4. [API 端點](#api-端點)
   - [POST /analyze](#post-analyze)
   - [GET /ratelimit](#get-ratelimit)
   - [GET /health](#get-health)
5. [使用情境範例](#使用情境範例)

---

## 概覽

VibeTrack 接受文字描述或圖片，透過 AI 分析其情緒，並從 Spotify 回傳符合情緒的歌曲推薦清單。

**Content-Type：** 所有請求使用 `multipart/form-data`。  
**回應格式：** `application/json`，UTF-8 編碼。  
**不需要認證：** 所有端點皆為公開存取，以 IP 為單位進行速率限制。

---

## 速率限制

每個 IP 在固定視窗內（預設 60 秒）最多可送出 5 次 `/analyze` 請求。

### Response Headers（每次 `/analyze` 請求都會附帶）

| Header | 型別 | 說明 |
|---|---|---|
| `X-RateLimit-Limit` | integer | 視窗內最大允許次數 |
| `X-RateLimit-Remaining` | integer | 本視窗剩餘可用次數 |
| `X-RateLimit-Reset` | integer | 視窗重置時間（Unix timestamp，秒） |

### 超過限制時（HTTP 429）

```json
{
  "error": "rate_limited",
  "message": "請求次數已達上限，請稍後再試。",
  "retry_after": 45,
  "limit": 5,
  "remaining": 0,
  "reset_at": 1717059600
}
```

同時附帶 `Retry-After: 45`（秒）Response Header。

> **前端建議：** 在送出 `/analyze` 之前，可先讀取上次回應中的 `X-RateLimit-Remaining`。若為 0，直接顯示「請等待 X 秒後再試」，不必真的送出請求。或主動呼叫 `GET /ratelimit` 查詢目前狀態。

---

## 通用錯誤格式

除速率限制外，所有錯誤回應的結構如下：

```json
{
  "statusCode": 422,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "path": "/analyze",
  "message": "At least one of text or image must be provided."
}
```

| 狀態碼 | 觸發情境 |
|---|---|
| `400` | 請求欄位格式錯誤（如 limit 不在 5/8/10 中） |
| `422` | text 與 image 皆未提供 |
| `429` | 超過速率限制 |
| `500` | 伺服器內部錯誤（Claude / Spotify 呼叫失敗等） |

---

## API 端點

---

### POST /analyze

分析情緒，回傳 Spotify 歌曲推薦。

**情境說明：**  
使用者在 App 輸入心情文字（例如「下雨天在家看書」）或上傳一張照片，點擊「為我選歌」後前端呼叫此端點。後端以 AI 分析情緒標籤，並透過 Spotify 搜尋與挑選最符合的歌單回傳。

**請求**

```
POST /analyze
Content-Type: multipart/form-data
```

| 欄位 | 型別 | 必填 | 說明 |
|---|---|---|---|
| `text` | string | text / image 至少一個 | 心情描述文字，最多 300 字 |
| `image` | file | text / image 至少一個 | 圖片（JPEG、PNG、WebP、GIF），上傳檔案 |
| `market` | string | 否 | Spotify 地區代碼，用於篩選當地可播放的曲目 |
| `limit` | number | 否 | 回傳歌曲數量，僅接受 `5`、`8`（預設）、`10` |

**支援的 `market` 代碼**

`TW`、`US`、`JP`、`KR`、`HK`、`SG`、`GB`、`AU`、`CA`、`FR`、`DE`、`ES`、`BR`

**成功回應 HTTP 200**

```json
{
  "mood": {
    "label": "Melancholic",
    "sub": "quietly nostalgic",
    "tags": [
      { "name": "Melancholic", "primary": true },
      { "name": "Reflective", "primary": false },
      { "name": "Calm", "primary": false }
    ]
  },
  "tracks": [
    {
      "id": "0BRjO6ga9RKCKjfDqeFgWV",
      "title": "The Night We Met",
      "artist": "Lord Huron",
      "spotify_url": "https://open.spotify.com/track/0BRjO6ga9RKCKjfDqeFgWV",
      "preview_url": "https://p.scdn.co/mp3-preview/abc123",
      "popularity": 72,
      "album_image_url": "https://i.scdn.co/image/ab67616d0000b273abc123",
      "reason": "Melancholic yet beautiful, matching the reflective mood"
    }
  ]
}
```

**回應欄位說明**

*`mood` 物件*

| 欄位 | 型別 | 說明 |
|---|---|---|
| `label` | string | 主要情緒標籤（英文） |
| `sub` | string | 情緒的細項描述短語 |
| `tags` | array | 情緒標籤陣列，`primary: true` 為主要標籤 |

*`tracks[]` 每首歌曲*

| 欄位 | 型別 | Nullable | 說明 |
|---|---|---|---|
| `id` | string | 否 | Spotify track ID |
| `title` | string | 否 | 歌曲名稱 |
| `artist` | string | 否 | 演出者名稱 |
| `spotify_url` | string | 否 | Spotify 歌曲頁面連結 |
| `preview_url` | string | 是 | 30 秒試聽 MP3 URL；Spotify 開發模式下可能為 null |
| `popularity` | number | 是 | Spotify 熱門度分數（0–100）；Spotify 開發模式下可能為 null |
| `album_image_url` | string | 是 | 專輯封面圖片（640×640）；無法取得時為 null |
| `reason` | string | 否 | AI 推薦原因說明 |

> **注意：** 相同輸入的結果會被快取 24 小時（以 text + 圖片 binary 的 MD5 為 key）。快取命中時回應速度明顯更快。

**錯誤情境**

| 狀態碼 | 觸發條件 | message |
|---|---|---|
| `422` | text 與 image 皆未提供 | `At least one of text or image must be provided.` |
| `400` | limit 值不在 5/8/10 | class-validator 錯誤訊息陣列 |
| `429` | IP 超過速率上限 | `請求次數已達上限，請稍後再試。` |

---

### GET /ratelimit

查詢目前 IP 的速率限制狀態。**此端點為唯讀，呼叫不會消耗配額。**

**情境說明：**  
前端在頁面載入時呼叫此端點，顯示使用者還有幾次可用次數（例如「今日剩餘 3/5 次」）。當剩餘次數為 0 時，可計算 `reset_at` 顯示倒數計時器，引導使用者等待視窗重置。

**請求**

```
GET /ratelimit
```

無需任何參數，伺服器依請求來源 IP 判斷。

**成功回應 HTTP 200**

```json
{
  "limit": 5,
  "remaining": 3,
  "reset_at": 1717059600
}
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `limit` | integer | 視窗內最大允許次數 |
| `remaining` | integer | 本視窗剩餘可用次數（0 = 已用盡） |
| `reset_at` | integer | 視窗重置的 Unix timestamp（秒），用於倒數計時 |

**倒數秒數計算範例（JavaScript）**

```js
const secondsUntilReset = status.reset_at - Math.floor(Date.now() / 1000);
```

---

### GET /health

服務存活確認。

**情境說明：**  
前端初始化時可呼叫此端點確認後端是否已喚醒（Render 免費方案閒置後會休眠，第一次請求冷啟動需數秒）。若回應正常，再顯示主介面；若無回應，顯示「服務啟動中，請稍候」。

**請求**

```
GET /health
```

**成功回應 HTTP 200**

```json
{
  "status": "ok"
}
```

---

## 使用情境範例

### 情境 1：頁面初始化

```js
// 1. 確認服務存活
const health = await fetch('/health');

// 2. 同時取得速率限制狀態以顯示剩餘次數
const rateStatus = await fetch('/ratelimit').then(r => r.json());
// → { limit: 5, remaining: 4, reset_at: 1717059600 }
```

### 情境 2：送出純文字分析

```js
const formData = new FormData();
formData.append('text', '下雨天窩在家裡喝咖啡，心情很放鬆');
formData.append('market', 'TW');
formData.append('limit', '8');

const response = await fetch('/analyze', {
  method: 'POST',
  body: formData,
});

// 讀取速率 header
const remaining = response.headers.get('X-RateLimit-Remaining');
const resetAt = response.headers.get('X-RateLimit-Reset');

const data = await response.json();
// data.mood.label  → "Relaxed"
// data.tracks[0].title → "Cafe Music"
```

### 情境 3：送出圖片分析

```js
const formData = new FormData();
formData.append('image', imageFile);  // File object from <input type="file">
formData.append('limit', '5');

const response = await fetch('/analyze', {
  method: 'POST',
  body: formData,
});
```

### 情境 4：速率限制處理

```js
const response = await fetch('/analyze', { method: 'POST', body: formData });

if (response.status === 429) {
  const error = await response.json();
  const waitSec = error.retry_after;
  showToast(`已達請求上限，請等待 ${waitSec} 秒後再試`);
  startCountdown(waitSec);
  return;
}
```

### 情境 5：文字 + 圖片同時送出

```js
const formData = new FormData();
formData.append('text', '這張照片讓我想起了夏天');
formData.append('image', imageFile);
formData.append('market', 'JP');

const response = await fetch('/analyze', {
  method: 'POST',
  body: formData,
});
```

---

## 快取行為

| 條件 | 行為 |
|---|---|
| 相同 text + image 在 24 小時內重複送出 | 直接回傳快取結果，速度更快 |
| text 或 image 任一不同 | 視為新請求，執行完整 AI 分析 |
| 快取命中 | **仍然消耗 Rate Limit 配額** |

---

*如需 Swagger 互動介面，請訪問 `GET /api/docs`。*
