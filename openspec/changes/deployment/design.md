## Context

所有功能在本機測試完成後，需要部署到 Render 讓外部可存取。Render free tier 在 15 分鐘無流量後會進入休眠，需要 keep-alive 機制維持存活。

## Goals / Non-Goals

**Goals:**
- 後端服務有公開 URL（`https://vibe-track.onrender.com`）
- Redis 連線正常
- 環境變數設定完整
- keep-alive 每 10 分鐘自動 ping /health
- Swagger 文件可在 `/api` 存取

**Non-Goals:**
- 自訂 domain
- HTTPS 憑證（Render 自動處理）
- CI/CD pipeline（手動 push 觸發部署即可）

## Decisions

**D1：使用 cron-job.org 做 keep-alive，不在 NestJS 內建排程**
- 避免 NestJS 自 ping 自己（Render 可能不允許 localhost loop）
- cron-job.org 免費，每 10 分鐘 GET /health

**D2：render.yaml 定義服務**
```yaml
services:
  - type: web
    name: vibe-track
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm run start:prod
    envVars:
      - key: NODE_ENV
        value: production
```

**D3：Swagger 文件用 @nestjs/swagger**
- 在 `main.ts` 設定，mount 在 `/api`
- 方便 portfolio 展示 API 介面

## Risks / Trade-offs

- [Render free tier 休眠] → cron-job.org keep-alive 緩解，但首次冷啟動仍需 ~30 秒
- [Redis free tier 限制] → Render Redis 有 25MB 上限，足夠 MVP 使用

## Migration Plan

1. 推送程式碼到 GitHub
2. 在 Render 建立 Web Service，連接 GitHub repo
3. 在 Render 建立 Redis 服務，取得 `REDIS_URL`
4. 設定所有環境變數
5. 部署成功後在 cron-job.org 建立每 10 分鐘的 ping 任務
6. 用 Postman 打 production URL 確認功能正常
