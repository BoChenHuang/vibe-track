## Why

本機功能全部完成後，需要將服務部署到公開可存取的 URL，作為 portfolio 展示用途，並解決 Render free tier 冷啟動問題。

## What Changes

- 將 NestJS 後端部署到 Render（free tier Web Service）
- 將 Redis 部署到 Render（free tier Redis）
- 設定所有必要環境變數
- 新增 keep-alive 機制防止 Render 冷啟動
- 撰寫 Swagger API 文件

## Capabilities

### New Capabilities

- `keep-alive`: 防止 Render free tier 因閒置而冷啟動的機制

### Modified Capabilities

## Impact

- 新增 `render.yaml`（Render 部署設定）
- 修改 `main.ts`，加入 Swagger 文件設定
- 設定 Render dashboard 的環境變數
