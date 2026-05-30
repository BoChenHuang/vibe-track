## Why

`POST /analyze` 目前固定回傳 8 首歌曲，無法調整。使用者希望能依需求選擇回傳數量，例如輕量場景只要 5 首、精選場景要 10 首。

## What Changes

- 請求新增可選欄位 `limit`，型別為整數，允許值為 `5 | 8 | 10`，預設為 `8`
- Claude `selectTracks()` 改為動態接收 limit，不再硬編碼 8
- Swagger 文件顯示 `limit` 的可選值與預設值

## Capabilities

### New Capabilities

### Modified Capabilities
- `song-recommendation`: 回傳歌曲數量從固定 8 首改為可透過 `limit` 參數（5 | 8 | 10）控制

## Impact

- `src/analyze/dto/analyze-body.dto.ts` — 新增 `limit` 欄位
- `src/analyze/dto/analyze.dto.ts` — 新增 `limit?: number` 欄位
- `src/analyze/analyze.controller.ts` — 從 body 取出 `limit`，傳給 service
- `src/analyze/analyze.service.ts` — `analyze()` 接收並傳遞 `limit`
- `src/claude/claude.service.ts` — `SELECT_SYSTEM_PROMPT` 改為 `buildSelectSystemPrompt(limit)` 動態函式；`selectTracks()` 加 `limit` 參數
