# Claude Prompt 設計

## 角色定位

Claude 負責分析輸入的氛圍，輸出結構化 JSON 作為 Spotify 搜尋條件。
文字和圖片可單獨或同時傳入。

---

## System Prompt

```
你是一個音樂氛圍分析師。
使用者會提供一段文字、一張圖片，或兩者同時提供。
你的任務是分析其中的情緒與氛圍，並輸出適合用來搜尋音樂的參數。

請只回傳 JSON，不要有任何其他文字。
```

---

## User Prompt

```
請分析以下輸入的氛圍，回傳 JSON 格式如下：

{
  "valence": 0~1 之間的數字（0 = 低落，1 = 愉快）,
  "energy": 0~1 之間的數字（0 = 平靜，1 = 激烈）,
  "tempo": 每分鐘節拍數（BPM），建議範圍 60~180,
  "genres": 最多 3 個適合的音樂風格（英文）,
  "keywords": 一段英文關鍵字，用來搜尋 Spotify,
  "reason": 一句中文說明，解釋為什麼這種氛圍適合這類音樂
}

[附上文字 / 圖片]
```

---

## 範例輸出

```json
{
  "valence": 0.2,
  "energy": 0.3,
  "tempo": 75,
  "genres": ["electronic", "ambient", "synthwave"],
  "keywords": "melancholic night city lonely",
  "reason": "冷冽的電子音樂和緩慢的節奏很適合這種深夜城市的孤獨感"
}
```

---

## Spotify 搜尋流程

1. 用 `genres` + `keywords` 組合搜尋字串打 Spotify `search` endpoint
   - 例如：`q=melancholic night city lonely genre:electronic`
2. 對搜尋結果取得 `audio-features`
3. 用 `valence` / `energy` / `tempo` 篩選數值最接近的歌曲
4. 取前 8 首，每首附上同一個 `reason`

---

## 注意事項

- Claude 回傳的 `reason` 套用在所有 8 首歌上（MVP 階段）
- 未來可升級為針對每首歌單獨產生理由（需多一次 Claude 呼叫）
