## Why

`POST /analyze` 回傳的歌曲資訊缺少專輯封面，前端無法顯示視覺化的推薦結果，降低展示效果。

## What Changes

- 從 Spotify Search API 回應中取出 `album.images[0].url` 作為封面圖片 URL
- `SpotifyTrack` interface 新增 `album_image_url: string | null`
- API 回應的每首歌新增 `album_image_url` 欄位

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `song-recommendation`: 每首推薦歌曲新增 `album_image_url` 欄位

## Impact

- `src/spotify/spotify.service.ts` — `SpotifyTrack` interface 與 `searchByQuery` 回傳映射
- `src/analyze/dto/track-result.dto.ts` — 新增 `album_image_url` 欄位
- `src/analyze/analyze.service.ts` — 回傳結果加入 `album_image_url`
