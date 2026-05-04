## ADDED Requirements

### Requirement: 回傳 8 首推薦歌曲
系統 SHALL 根據情緒參數從 Spotify 搜尋並回傳恰好 8 首歌曲。

#### Scenario: 成功推薦
- **WHEN** 發送 `POST /analyze`，text 或圖片合法
- **THEN** 回傳 HTTP 200，`tracks` 陣列包含 8 個元素

#### Scenario: Spotify 搜尋結果不足 8 首
- **WHEN** Spotify 搜尋只回傳少於 8 首有效歌曲
- **THEN** 回傳現有全部歌曲（不補到 8 首）

### Requirement: 歌曲資訊格式
每首推薦歌曲 SHALL 包含 title、artist、spotify_url、preview_url（可為 null）、reason。

#### Scenario: 回傳格式正確
- **WHEN** 推薦成功
- **THEN** 每首歌都包含 `title`（string）、`artist`（string）、`spotify_url`（string）、`preview_url`（string | null）、`reason`（string）

### Requirement: 優先選有 preview 的歌曲
系統 SHALL 優先選擇有 `preview_url` 的歌曲加入推薦清單。

#### Scenario: 有足夠的 preview 歌曲
- **WHEN** 搜尋結果中有 8 首以上有 preview_url 的歌曲
- **THEN** 回傳的 8 首全部都有 preview_url

#### Scenario: preview 歌曲不足
- **WHEN** 有 preview_url 的歌曲少於 8 首
- **THEN** 先填滿有 preview 的，其餘用沒有 preview 的補足

### Requirement: Spotify access_token 自動刷新
系統 SHALL 在 token 過期前自動刷新，不因 token 失效而回傳錯誤。

#### Scenario: Token 過期
- **WHEN** 距離上次取得 token 已超過 1 小時
- **THEN** 系統自動取得新 token，請求正常完成

#### Scenario: Spotify API 失敗
- **WHEN** Spotify API 回傳非 2xx 狀態碼
- **THEN** 回傳 HTTP 500
