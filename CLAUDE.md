# CLAUDE.md — VibeTrack

## 專案概覽

VibeTrack 是一個 NestJS REST API，透過 Claude AI 分析文字和/或圖片的情緒，並推薦符合情緒的 Spotify 歌曲。

**技術棧：** NestJS 11 · TypeScript · Redis (ioredis) · Winston · Swagger  
**部署目標：** Render（免費方案 Web Service + Redis）

---

## 架構

```
POST /analyze
    │
    ├─ RateLimitGuard        ← Redis 固定視窗：每個 IP 每 60 秒最多 5 次請求
    │
    ├─ AnalyzeService
    │   ├─ CacheService.getCached()      ← MD5(text+image) → Redis key，TTL 24 小時
    │   │
    │   ├─ ClaudeService.analyzeMood()   ← 回傳 Spotify 搜尋關鍵字 + 分析原因
    │   │
    │   ├─ SpotifyService.searchByQueries()  ← 並行 Spotify 搜尋
    │   │
    │   ├─ ClaudeService.selectTracks()  ← 從候選歌曲中挑選最佳結果
    │   │
    │   └─ CacheService.setCached()      ← 將結果寫入 Redis
    │
    └─ AnalyzeResponseDto    ← { tracks: TrackResultDto[] }
```

---

## 模組說明

| 模組 | 路徑 | 職責 |
|------|------|------|
| `AnalyzeModule` | `src/analyze/` | 主功能：controller、service、DTOs |
| `ClaudeModule` | `src/claude/` | Anthropic SDK 封裝 — 情緒分析與歌曲篩選 |
| `SpotifyModule` | `src/spotify/` | Spotify Client Credentials 驗證 + 搜尋 |
| `CacheModule` | `src/cache/` | Redis 客戶端（ioredis）、速率限制、回應快取 |
| `LoggerModule` | `src/logger/` | Winston + nest-winston 結構化日誌 |
| `ConfigModule` | `src/config/` | Joi 環境變數驗證、`appConfig` factory |

### 全域 Provider（註冊於 AppModule）

- `AllExceptionsFilter` — 捕捉所有未處理的例外，回傳一致的 JSON 錯誤格式
- `RequestLoggerInterceptor` — 記錄每筆請求/回應，附帶 correlation ID
- `ClsModule` — 非同步本地存儲，用於每次請求的 correlation ID（`crypto.randomUUID()`）

---

## 重要檔案

```
src/
├── main.ts                              # 啟動、Swagger 掛載於 /api/docs、port 讀取自 config
├── app.module.ts                        # 根模組接線
├── config/
│   ├── env.validation.ts                # Joi schema — 所有必要環境變數
│   └── app.config.ts                    # 型別化 config factory
├── analyze/
│   ├── analyze.controller.ts            # POST /analyze，multipart/form-data
│   ├── analyze.service.ts               # 流程協調：cache → Claude → Spotify → cache
│   └── dto/
│       ├── analyze-body.dto.ts          # Swagger 請求 body 定義
│       ├── analyze.dto.ts               # 內部請求 DTO（text、market）
│       ├── analyze-response.dto.ts      # 回應：{ tracks }
│       ├── track-result.dto.ts          # 單首歌曲格式
│       └── market.enum.ts               # Spotify market 代碼
├── claude/
│   └── claude.service.ts                # analyzeMood() + selectTracks()
├── spotify/
│   └── spotify.service.ts               # searchByQueries()、token 管理
├── cache/
│   ├── cache.module.ts                  # 提供 REDIS_CLIENT token
│   ├── cache.service.ts                 # incrementAndCheck()、getCached()、setCached()
│   └── cache.tokens.ts                  # REDIS_CLIENT 注入 token
└── common/
    ├── guards/rate-limit.guard.ts        # RateLimitGuard（使用 CacheService）
    ├── interceptors/request-logger.interceptor.ts
    ├── filters/all-exceptions.filter.ts
    └── pipes/file-validation.pipe.ts    # 圖片 MIME type + 大小驗證
```

---

## 環境變數

所有變數在啟動時透過 Joi 驗證（`src/config/env.validation.ts`），任一必要變數缺少時**服務不會啟動**。

| 變數 | 必要 | 說明 |
|------|------|------|
| `CLAUDE_API_KEY` | ✅ | Anthropic API 金鑰 |
| `SPOTIFY_CLIENT_ID` | ✅ | Spotify 應用程式 Client ID |
| `SPOTIFY_CLIENT_SECRET` | ✅ | Spotify 應用程式 Client Secret |
| `REDIS_URL` | ✅ | Redis 連線 URI |
| `PORT` | 預設 3000 | HTTP 監聽 port |
| `LOG_LEVEL` | 預設 `info` | Winston log 等級 |

本機開發請複製 `.env.example` 為 `.env`。

---

## API

### `POST /analyze`

Content-Type: `multipart/form-data`

| 欄位 | 類型 | 必要 | 說明 |
|------|------|------|------|
| `text` | string | text/image 擇一 | 情緒描述文字 |
| `image` | file | text/image 擇一 | 圖片檔（JPEG/PNG/WebP/GIF）|
| `market` | string | 否 | Spotify market 代碼（例如 `TW`、`US`）|

**回應：** `{ tracks: TrackResultDto[] }`  
每首歌曲：`{ id, title, artist, spotify_url, preview_url, popularity, reason }`

**速率限制：** 每個 IP 每 60 秒最多 5 次，超過回傳 429。

**快取：** `MD5(text + imageBuffer)` → Redis key，TTL 24 小時。

**Swagger 文件：** `GET /api/docs`

---

## 開發指令

```bash
# 安裝依賴
npm install

# 本機開發（watch mode）
npm run start:dev

# 建置
npm run build

# 執行 production build
npm run start:prod

# 測試
npm test
npm run test:cov    # 含覆蓋率報告
npm run test:e2e

# Lint + 格式化
npm run lint
npm run format
```

---

## 部署（Render）

- **Web Service：** Node 環境，build 指令 `npm install && npm run build`，start 指令 `npm run start:prod`
- **Redis：** Render 管理的 Redis（免費方案，25 MB 上限）
- **Keep-alive：** 使用 cron-job.org 每 10 分鐘 ping `GET /health`（Render 免費方案閒置 15 分鐘後會休眠）
- **Swagger：** `https://<service>.onrender.com/api/docs`

完整部署計畫見 `openspec/changes/deployment/`。

---

## openspec 變更流程

本專案使用 openspec 變更追蹤流程：

```
openspec/changes/<change-name>/   ← 進行中的變更
    .openspec.yaml
    proposal.md
    design.md
    specs/<capability>/spec.md
    tasks.md

openspec/changes/archive/         ← 已完成的變更
openspec/specs/                   ← 升格的永久規格
```

使用技能：`/opsx:propose`、`/opsx:apply`、`/opsx:verify`、`/opsx:archive`

**目前進行中的變更：** `deployment` — 部署至 Render + keep-alive 機制。

---

## 程式碼慣例

- **禁止 mutation** — 永遠回傳新物件
- **禁止 `any`** — 使用 `unknown` 並明確縮窄型別
- **禁止 `console.log`** — 使用注入的 Winston logger（`@Inject(WINSTON_MODULE_PROVIDER)`）
- **錯誤處理** — Redis 失敗採 fail-open（允許請求繼續）；Spotify/Claude 錯誤則向上拋出
- **DTOs** — 所有請求 DTO 使用 `class-validator` 裝飾器；`class-transformer` 負責序列化
- **注入 token** — 自訂 token 放在 `*.tokens.ts`（例如 `REDIS_CLIENT`）
