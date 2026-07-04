## 1. 初始化專案

- [x] 1.1 在專案根目錄執行 `npx @nestjs/cli new . --skip-git --package-manager npm`
- [x] 1.2 確認 `npm run start:dev` 可正常啟動
- [x] 1.3 安裝相依套件：`npm install @nestjs/config @anthropic-ai/sdk ioredis multer @nestjs/platform-express`
- [x] 1.4 安裝 dev 套件：`npm install -D @types/multer`
- [x] 1.5 建立 `.env.example`，列出 `CLAUDE_API_KEY`、`SPOTIFY_CLIENT_ID`、`SPOTIFY_CLIENT_SECRET`、`REDIS_URL`

## 2. 設定 ConfigModule

- [x] 2.1 在 `app.module.ts` 引入 `ConfigModule.forRoot({ isGlobal: true, cache: true })`
- [x] 2.2 建立 `src/config/env.validation.ts`，用 Joi 或 class-validator 驗證必要環境變數

## 2.5 設定 Winston Logger

- [x] 2.5.1 安裝套件：`npm install winston nest-winston nestjs-cls`
- [x] 2.5.2 在 `app.module.ts` 引入 `ClsModule.forRoot({ middleware: { mount: true, generateId: true, idGenerator: () => crypto.randomUUID() } })`，自動為每個 request 產生 `requestId`
- [x] 2.5.3 建立 `src/logger/logger.module.ts`，使用 `WinstonModule.forRootAsync()` 注入 `ConfigService` 讀取 `LOG_LEVEL`
- [x] 2.5.4 在 winston transports 設定 `winston.format.combine(winston.format.timestamp(), winston.format.json())`
- [x] 2.5.5 新增 winston custom format，透過 `ClsService.getId()` 讀取 `requestId` 並附加到每條 log；`ClsService` 以 module-level singleton 方式存取
- [x] 2.5.6 在 `RequestLoggerInterceptor` 中讀取 `ClsService.getId()`，手動設定 response header `X-Request-Id`（`nestjs-cls` 無內建 setResponseHeader 選項）
- [x] 2.5.7 在 `main.ts` 呼叫 `app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER))`，讓 NestJS 框架 log 也走 winston
- [x] 2.5.8 在 `src/config/env.validation.ts` 的 schema 加入 `LOG_LEVEL`（optional，預設 `'info'`，允許值：`error | warn | info | http | verbose | debug`）
- [x] 2.5.9 更新 `.env.example`，加入 `LOG_LEVEL=info`
- [x] 2.5.10 驗證：啟動後打 `GET /health`，確認 console 輸出為 JSON 且含 `requestId` 欄位，response header 含 `X-Request-Id`

## 3. 建立功能模組骨架

- [x] 3.1 `nest g module analyze` 並建立空的 `analyze.controller.ts`、`analyze.service.ts`
- [x] 3.2 `nest g module claude` 並建立空的 `claude.service.ts`
- [x] 3.3 `nest g module spotify` 並建立空的 `spotify.service.ts`
- [x] 3.4 `nest g module cache` 並建立空的 `cache.service.ts`
- [x] 3.5 建立 `src/common/guards/rate-limit.guard.ts`（空佔位）
- [x] 3.6 建立 `src/common/pipes/file-validation.pipe.ts`（空佔位）

## 4. Health Check Endpoint

- [x] 4.1 在 `app.controller.ts` 新增 `@Get('health')` 回傳 `{ status: 'ok' }`

## 5. 驗證

- [x] 5.1 執行 `npm run start:dev`，確認無 DI 錯誤
- [x] 5.2 `GET http://localhost:3000/health` 回傳 `{ "status": "ok" }`
- [x] 5.3 確認 `src/` 目錄結構符合 design.md 規劃
