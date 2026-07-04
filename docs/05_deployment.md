# 部署與環境變數設定

## 平台選擇

| 面向 | 平台 |
|------|------|
| 後端（NestJS） | Render（免費方案） |
| Redis | Render（免費方案） |
| 前端 | Vercel（免費） |

---

## 冷啟動解決方案：Keep-alive

Render 免費方案閒置後會休眠，透過定時 ping 保持喚醒。

**做法：使用 cron-job.org**
1. 註冊 [cron-job.org](https://cron-job.org)（免費）
2. 新增一個定時任務，每 10 分鐘打一次 `GET /health`
3. 後端實作一個 `/health` endpoint 回傳 `{ status: "ok" }`

**或在 NestJS 內建排程：**
```typescript
import { Cron } from '@nestjs/schedule';

@Cron('0 */10 * * * *')
async keepAlive() {
  // ping self
}
```

---

## 環境變數

以下變數不可放進 Git，本地用 `.env` 管理，部署時在 Render / Vercel 後台填入。

| 變數 | 說明 |
|------|------|
| `CLAUDE_API_KEY` | Claude API 金鑰 |
| `SPOTIFY_CLIENT_ID` | Spotify 應用程式 ID |
| `SPOTIFY_CLIENT_SECRET` | Spotify 應用程式密鑰 |
| `REDIS_URL` | Redis 連線字串 |

---

## 部署流程

1. 將專案推上 GitHub
2. Render 連結 GitHub repo，自動偵測 NestJS 並部署
3. 在 Render 後台填入環境變數
4. Vercel 連結前端 repo，自動部署
5. 設定 cron-job.org 定時 ping `/health`
