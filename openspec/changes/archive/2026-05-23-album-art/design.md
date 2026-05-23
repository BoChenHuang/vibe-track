## Context

Spotify Search API 回應的每首曲目包含 `album.images` 陣列（多個尺寸），目前實作未取出此欄位。前端顯示推薦結果時缺少視覺元素。

## Goals / Non-Goals

**Goals:**
- 從 Spotify Search 回應取出 `album.images[0].url` 作為封面圖片
- 透過 API 回傳 `album_image_url`（可為 null）

**Non-Goals:**
- 圖片 proxy 或快取（直接使用 Spotify CDN URL）
- 多尺寸封面（只取最大尺寸 `images[0]`）

## Decisions

**唯一決定：取 `album.images[0]?.url`，若陣列為空則為 null**
- Spotify `images` 陣列依尺寸由大到小排列，`[0]` 是最大尺寸（通常 640x640）
- 無需額外 API 呼叫，Search 回應已包含此資料

## Risks / Trade-offs

- Spotify CDN URL 不保證永久有效，但對展示用途可接受
