# README 模板

---

> 以下為 README 內容模板，開發完成後依實際情況填入。

---

# VibeTrack 🎵

上傳圖片或輸入文字，AI 幫你找到最對味的歌單。

🔗 **[Live Demo](https://your-demo-url.vercel.app)**

![Demo 截圖或 GIF]()

---

## 功能介紹

- 支援圖片上傳或文字輸入，也可同時使用
- Claude AI 分析輸入氛圍，萃取情緒、能量、節奏等特徵
- 根據分析結果從 Spotify 搜尋最匹配的歌曲
- 回傳 8 首推薦歌曲，附推薦理由與 30 秒試聽
- Rate Limiting + Redis 快取，防止濫用與重複呼叫

---

## 系統架構

```
前端 Demo
  └─▶ Rate Limiter（Redis）
        └─▶ 後端 API（NestJS）
              ├─▶ Redis 快取（命中直接回傳）
              ├─▶ Claude API（氛圍分析）
              └─▶ Spotify API（歌曲搜尋 + 試聽）
```

---

## 技術選型

| 面向 | 技術 | 原因 |
|------|------|------|
| 後端框架 | NestJS | 模組化架構清晰，TypeScript 原生支援 |
| AI 分析 | Claude API | Vision + 文字同時支援，結構化輸出穩定 |
| 音樂資料 | Spotify Web API | 提供 audio-features 數值，可精準篩選歌曲 |
| 快取 / 限流 | Redis | 快取相同輸入、計數器實作 Rate Limiting |
| 前端 | Vite + Tailwind CSS | 快速建立 Demo 介面 |
| 部署 | Render + Vercel | 免費、零設定 |

---

## 本地開發

### 前置需求

- Node.js 18+
- Redis
- Claude API Key
- Spotify API Client ID / Secret

### 安裝與啟動

```bash
# 安裝依賴
npm install

# 複製環境變數範本
cp .env.example .env
# 填入你的 API Key

# 啟動開發伺服器
npm run start:dev
```

### 環境變數

```env
CLAUDE_API_KEY=
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
REDIS_URL=
```

---

## API 文件

### `POST /analyze`

**Request（multipart/form-data）**

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `text` | string | 否 | 文字描述，上限 300 字 |
| `image` | file | 否 | JPG / PNG，上限 5MB |

文字和圖片可單獨或同時傳入，兩者都沒傳才回傳錯誤。

**Response 200**

```json
{
  "tracks": [
    {
      "title": "Nightcall",
      "artist": "Kavinsky",
      "spotify_url": "https://open.spotify.com/track/...",
      "preview_url": "https://p.scdn.co/mp3-preview/...",
      "reason": "冷冽的電子音樂和緩慢的節奏很適合這種深夜城市的孤獨感"
    }
  ]
}
```

---

## Future Work

- 使用者帳號系統（JWT 認證）
- 查詢歷史紀錄
- 個人化推薦（根據過去偏好調整）
- 手機 App（React Native / Flutter，後端不需更換）
- 針對每首歌單獨產生推薦理由
