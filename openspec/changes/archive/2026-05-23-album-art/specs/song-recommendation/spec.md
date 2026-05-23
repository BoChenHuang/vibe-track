## MODIFIED Requirements

### Requirement: 歌曲資訊格式
每首推薦歌曲 SHALL 包含 title、artist、spotify_url、preview_url（可為 null）、album_image_url（可為 null）、reason（每首獨立中文推薦理由）。

#### Scenario: 回傳格式正確
- **WHEN** 推薦成功
- **THEN** 每首歌都包含 `title`（string）、`artist`（string）、`spotify_url`（string）、`preview_url`（string | null）、`album_image_url`（string | null）、`reason`（string，每首獨立）

#### Scenario: 專輯無封面
- **WHEN** Spotify 回傳的曲目 `album.images` 為空陣列
- **THEN** `album_image_url` 為 null
