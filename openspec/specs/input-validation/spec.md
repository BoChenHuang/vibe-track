## ADDED Requirements

### Requirement: 至少提供一種輸入
系統 SHALL 要求每次請求至少包含 text 或 image 其中之一。

#### Scenario: 兩者都未提供
- **WHEN** 發送 `POST /analyze`，body 中 text 與 image 皆為空
- **THEN** 回傳 HTTP 422，訊息說明至少需要提供一種輸入

### Requirement: 文字長度限制
系統 SHALL 拒絕超過 300 字元的文字輸入。

#### Scenario: 文字長度合法
- **WHEN** text 長度 ≤ 300 字元
- **THEN** 通過驗證，繼續處理

#### Scenario: 文字長度超限
- **WHEN** text 長度 > 300 字元
- **THEN** 回傳 HTTP 400

### Requirement: 圖片格式與大小限制
系統 SHALL 只接受 JPG（image/jpeg）或 PNG（image/png）格式，且大小不超過 5MB。

#### Scenario: 合法圖片
- **WHEN** 上傳 image/jpeg 格式且 ≤ 5MB 的檔案
- **THEN** 通過驗證

#### Scenario: 不支援的格式
- **WHEN** 上傳 image/gif 或其他非 JPG/PNG 格式
- **THEN** 回傳 HTTP 400

#### Scenario: 檔案過大
- **WHEN** 上傳超過 5MB 的圖片
- **THEN** 回傳 HTTP 400
