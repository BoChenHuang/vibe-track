# VibeTrack 專案規劃總覽

## 專案簡介

輸入一段文字或上傳一張圖片，由系統分析氛圍後回傳一份推薦歌單。

**求職目標：** 後端工程師  
**開發時間：** 一個月（每週 16 小時，共約 64 小時）

---

## 核心功能（MVP）

- 支援文字輸入（上限 300 字）或圖片上傳（JPG / PNG，上限 5MB）
- 回傳 8 首推薦歌曲，每首包含：
  - 歌名、歌手
  - Spotify 連結
  - 30 秒試聽音檔（`preview_url`）
  - 一句推薦理由

---

## 技術選型

| 面向 | 技術 |
|------|------|
| 後端框架 | NestJS（TypeScript） |
| AI 分析 | Claude API（Vision + 文字） |
| 音樂資料 | Spotify Web API |
| 快取 / 限流 | Redis |
| 資料庫 | PostgreSQL + Prisma |
| 前端 | Vite + Tailwind CSS |
| 後端部署 | Railway 或 Fly.io |
| 前端部署 | Vercel |

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

## 防護機制

- **Rate Limiting**：每個 IP 每分鐘最多 5 次請求，使用 Redis 計數器實作
- **Redis 快取**：對輸入內容做 hash，相同輸入直接回傳快取結果，不重複呼叫 Claude API
- **費用上限**：在 Claude API 後台設定每月硬性消費上限
- **輸入限制**：文字上限 300 字、圖片上限 5MB（JPG / PNG）

---

## 文件索引

| 文件 | 說明 |
|------|------|
| `00_overview.md` | 本文件，專案總覽 |
| `01_schedule.md` | 四週開發計畫 |
| `02_api_design.md` | API 介面設計（待討論） |
| `03_nestjs_structure.md` | NestJS 專案結構（待討論） |
| `04_prompt_design.md` | Claude Prompt 設計（待討論） |
| `05_deployment.md` | 部署與環境變數設定（待討論） |
| `06_readme_template.md` | README 與履歷介紹（待討論） |

---

## Future Work（面試時可提）

- 使用者帳號系統（JWT 認證）
- 查詢歷史紀錄
- 個人化推薦（根據過去偏好調整）
- 手機 App（React Native / Flutter，後端 NestJS 不需更換）
