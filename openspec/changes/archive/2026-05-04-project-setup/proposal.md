## Why

VibeTrack 後端目前是空白專案，需要建立 NestJS 應用程式骨架與模組結構，作為後續所有功能（Claude 整合、Spotify 整合、Redis 保護）的基礎。

## What Changes

- 初始化 NestJS 專案（TypeScript）
- 安裝所有必要相依套件（`@anthropic-ai/sdk`、`ioredis`、`multer`、`winston`、`nest-winston` 等）
- 建立 5 個功能模組：`analyze`、`claude`、`spotify`、`cache`、`common`
- 設定 `ConfigModule` 管理環境變數
- 新增 `.env.example` 列出所需環境變數（含 `LOG_LEVEL`）
- 在 env validation schema 加入 `LOG_LEVEL`（optional，預設 `info`，invalid value 啟動即失敗）
- 新增 `/health` endpoint 供 Render keep-alive 使用
- 設定 Winston logger，輸出 JSON 格式 log，每個 request 自動帶 `requestId`

## Capabilities

### New Capabilities

- `nestjs-scaffold`: NestJS 專案結構、模組骨架、環境變數設定、health check endpoint
- `winston-logger`: 結構化 JSON logging、requestId 追蹤（nestjs-cls）、`LOG_LEVEL` 環境變數控制（含 schema 驗證）

### Modified Capabilities

## Impact

- 建立 `src/` 目錄完整結構
- 新增 `package.json`、`tsconfig.json`、`.env.example`
- 所有後續 change 都依賴此骨架
