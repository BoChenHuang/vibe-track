## MODIFIED Requirements

### Requirement: 歌曲資訊格式
每首推薦歌曲 SHALL 包含 title、artist、spotify_url、preview_url（可為 null）、album_image_url（可為 null）、reason（每首獨立中文推薦理由）。

#### Scenario: 回傳格式正確
- **WHEN** 推薦成功
- **THEN** 每首歌都包含 `title`（string）、`artist`（string）、`spotify_url`（string）、`preview_url`（string | null）、`album_image_url`（string | null）、`reason`（string，每首獨立）

#### Scenario: 專輯無封面
- **WHEN** Spotify 回傳的曲目 `album.images` 為空陣列
- **THEN** `album_image_url` 為 null

## ADDED Requirements

### Requirement: API 回應頂層包含 mood 欄位
系統 SHALL 在 `POST /analyze` 回應中，將 `mood` 欄位置於 `tracks` 之前，回應結構為 `{ mood, tracks }`。

#### Scenario: 成功推薦後回應結構
- **WHEN** 發送 `POST /analyze`，text 或圖片合法
- **THEN** 回傳 HTTP 200，body 頂層同時包含 `mood` 與 `tracks` 兩個欄位

#### Scenario: Swagger 文件反映新欄位
- **WHEN** 訪問 `GET /api/docs`
- **THEN** `POST /analyze` 回應 schema 包含 `mood` 欄位的完整型別定義（MoodDto）
