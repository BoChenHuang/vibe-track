## Context

VibeTrack 是空白的 git 倉庫，尚無任何程式碼。需要在現有目錄 `/Users/huangbochen/project/vibe-track/` 初始化一個 NestJS 應用程式，並建立後續所有 phase 需要的模組骨架。

## Goals / Non-Goals

**Goals:**
- 建立可執行的 NestJS 應用程式（`npm run start:dev` 可跑）
- 建立 5 個空模組佔位，讓後續 change 能直接填入邏輯
- 設定 `ConfigModule` 並列出所有需要的環境變數
- 提供 `GET /health` endpoint
- 設定 Winston logger：JSON 格式輸出、每個 request 自動帶 `requestId`

**Non-Goals:**
- 實作任何業務邏輯（Claude、Spotify、Redis 留給後續 phase）
- 設定資料庫（已決定跳過歷史功能）

## Decisions

**D1：使用 npm 作為套件管理器**
- 使用者習慣，Render 原生支援

**D2：模組結構採功能導向（feature-based）**
```
src/
├── analyze/        ← 唯一對外的 Controller
├── claude/         ← Claude API 封裝
├── spotify/        ← Spotify API 封裝
├── cache/          ← Redis 封裝
├── config/         ← app.config.ts、env.validation.ts
├── logger/         ← WinstonModule 設定
└── common/
    ├── filters/     ← AllExceptionsFilter（全域 exception handler）
    ├── guards/      ← RateLimitGuard
    ├── interceptors/← RequestLoggerInterceptor（request/response log + X-Request-Id header）
    └── pipes/       ← FileValidationPipe
```
requestId 由 `nestjs-cls` ClsModule middleware 自動產生，不需要自訂 RequestIdMiddleware。
每個模組只暴露必要的 Service 給 `analyze` 使用，避免循環依賴。

**D3：ConfigModule 設為 global，isCache: true**
- 避免每個模組都需要 import ConfigModule
- 環境變數只讀取一次，提升效能
- `env.validation.ts` schema 涵蓋所有環境變數：`CLAUDE_API_KEY`（required）、`SPOTIFY_CLIENT_ID`（required）、`SPOTIFY_CLIENT_SECRET`（required）、`REDIS_URL`（required）、`LOG_LEVEL`（optional，預設 `info`，允許值 `error | warn | info | http | verbose | debug`）

**D4：`/health` endpoint 放在 AppController**
- 不屬於任何業務模組，放在根層級最合適

**D5：使用 `nest-winston` 整合 Winston**
- `nest-winston` 提供 `WinstonModule` 可直接替換 NestJS 預設 logger
- 透過 `app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER))` 讓框架本身的 log 也走 winston

**D6：使用 `nestjs-cls` 傳遞 requestId**
- `nestjs-cls` 提供 `ClsModule`、`ClsService` 可直接注入，NestJS-idiomatic
- 底層基於原生 `AsyncLocalStorage`，Node.js 16+ 穩定支援
- 優於 `cls-hooked`（後者基於舊版 `async_hooks`，在 Node.js 16+ 有相容性問題）
- `ClsModule.forRoot({ middleware: { mount: true } })` 自動掛載 middleware，無需手寫
- requestId 透過 `ClsService.getId()` 取得，winston custom format 讀取後附加到每條 log

## Risks / Trade-offs

- [模組骨架是空的] → 後續 change 需確認 import 路徑一致，避免重構成本

## Migration Plan

1. 在現有目錄執行 `nest new . --skip-git --package-manager npm`
2. 移除預設的 `app.service.ts` 業務邏輯，保留結構
3. 設定 `ConfigModule` 與 `env.validation.ts`（含 `LOG_LEVEL`）
4. 設定 `ClsModule`（nestjs-cls）與 `WinstonModule`（nest-winston），串接 requestId format
5. 依序建立 5 個模組
6. 設定 `AppController` 與 `/health` endpoint
7. 執行 `npm run start:dev` 確認啟動無誤且 log 輸出為 JSON
8. 打 `GET /health` 確認回傳 `{ status: "ok" }`，log 含 `requestId`
