## 1. Swagger 文件

- [x] 1.1 安裝 `@nestjs/swagger`：`npm install @nestjs/swagger`
- [x] 1.2 在 `main.ts` 設定 SwaggerModule，mount 在 `/api`
- [x] 1.3 在 `AnalyzeController` 加上 `@ApiTags`、`@ApiOperation`、`@ApiResponse` 等裝飾器

## 2. render.yaml

- [x] 2.1 在專案根目錄建立 `render.yaml`
- [x] 2.2 設定 Web Service：buildCommand `npm install && npm run build`，startCommand `npm run start:prod`
- [x] 2.3 列出所有 envVars（不含實際值，只列 key）

## 3. 推送與部署

- [x] 3.1 確認 `.env` 已加入 `.gitignore`
- [x] 3.2 確認 `.env.example` 存在且列出所有必要變數
- [ ] 3.3 推送程式碼到 GitHub

## 4. Render 設定

- [ ] 4.1 在 Render 建立 Web Service，選擇 GitHub repo
- [ ] 4.2 在 Render 建立 Redis 服務，複製 `REDIS_URL`
- [ ] 4.3 在 Render Web Service 的 Environment 設定所有環境變數：
  - `CLAUDE_API_KEY`
  - `SPOTIFY_CLIENT_ID`
  - `SPOTIFY_CLIENT_SECRET`
  - `REDIS_URL`（來自 Render Redis）
  - `NODE_ENV=production`
- [ ] 4.4 等待 deploy 完成（通常 3~5 分鐘）

## 5. Keep-alive 設定

- [ ] 5.1 前往 cron-job.org 建立免費帳號
- [ ] 5.2 建立新 cron job：每 10 分鐘 GET `https://<your-app>.onrender.com/health`

## 6. 驗證

- [ ] 6.1 打 `GET https://<your-app>.onrender.com/health` → 回傳 `{ "status": "ok" }`
- [ ] 6.2 打 `POST https://<your-app>.onrender.com/analyze` text="夜晚孤獨" → 回傳 8 首歌
- [ ] 6.3 打 `GET https://<your-app>.onrender.com/api` → Swagger UI 正常顯示
