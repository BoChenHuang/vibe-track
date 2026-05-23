## 1. SpotifyService 更新

- [x] 1.1 在 `SpotifyTrack` interface 新增 `album_image_url: string | null`
- [x] 1.2 在 `searchByQuery` 回傳映射中加入 `album_image_url: item.album.images[0]?.url ?? null`

## 2. DTO 更新

- [x] 2.1 在 `TrackResultDto` 新增 `album_image_url: string | null`（含 `@ApiProperty`）

## 3. AnalyzeService 更新

- [x] 3.1 在 `analyze()` 回傳結果中加入 `album_image_url: candidates[s.index].album_image_url`

## 4. 驗證

- [x] 4.1 發送請求，確認回傳歌曲包含 `album_image_url` 欄位（有封面為 URL，無封面為 null）
