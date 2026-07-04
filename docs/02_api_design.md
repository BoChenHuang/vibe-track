# API 介面設計

## `POST /analyze`

### Request（multipart/form-data）

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `text` | string | 否 | 文字描述，上限 300 字 |
| `image` | file | 否 | JPG / PNG，上限 5MB |

文字和圖片可以單獨傳，也可以同時傳，兩個都沒傳才回傳錯誤。

### Response 200

```json
{
  "tracks": [
    {
      "title": "Nightcall",
      "artist": "Kavinsky",
      "spotify_url": "https://open.spotify.com/track/...",
      "preview_url": "https://p.scdn.co/mp3-preview/...",
      "reason": "這首歌冷冽的電子合成器很符合你照片裡深夜城市的氛圍"
    }
  ]
}
```

### Error Responses

| 狀態碼 | 情境 |
|--------|------|
| `400` | 輸入格式錯誤、文字超過 300 字、圖片格式或大小不符 |
| `422` | 文字和圖片都沒傳 |
| `429` | Rate Limit 超過限制 |
| `500` | Claude API 或 Spotify API 呼叫失敗 |
