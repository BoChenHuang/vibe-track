## ADDED Requirements

### Requirement: 文字輸入情緒分析
系統 SHALL 接受純文字輸入，呼叫 Claude API 分析情緒，回傳結構化 JSON。

#### Scenario: 文字分析成功
- **WHEN** 發送 `POST /analyze`，body 包含 `text: "夜晚一個人走在空蕩蕩的街道"`
- **THEN** 回傳 HTTP 200，body 包含 `{ valence, energy, tempo, genres, keywords, reason }`

#### Scenario: 文字超過 300 字
- **WHEN** 發送 `POST /analyze`，`text` 超過 300 字元
- **THEN** 回傳 HTTP 400

### Requirement: 圖片輸入情緒分析
系統 SHALL 接受 JPG 或 PNG 圖片，以 base64 傳給 Claude Vision API 分析情緒。

#### Scenario: 圖片分析成功
- **WHEN** 發送 `POST /analyze`，附上合法 JPG 圖片（≤ 5MB）
- **THEN** 回傳 HTTP 200，body 包含完整情緒參數 JSON

#### Scenario: 圖片格式不符
- **WHEN** 上傳 GIF 或 PDF 格式的檔案
- **THEN** 回傳 HTTP 400，說明僅支援 JPG/PNG

#### Scenario: 圖片超過 5MB
- **WHEN** 上傳超過 5MB 的圖片
- **THEN** 回傳 HTTP 400

### Requirement: 文字與圖片同時輸入
系統 SHALL 支援同時提供 text 與 image，Claude 將兩者合併分析。

#### Scenario: 兩者同時提供
- **WHEN** 發送 `POST /analyze`，同時包含 text 與合法圖片
- **THEN** 回傳 HTTP 200，情緒分析綜合兩者內容

### Requirement: Claude 回傳格式
Claude API SHALL 回傳以下固定 JSON 結構，不包含其他文字：

```json
{
  "valence": 0.2,
  "energy": 0.3,
  "tempo": 75,
  "genres": ["electronic", "ambient"],
  "keywords": "melancholic night lonely",
  "reason": "冷冽的電子音樂適合這種深夜孤獨的氛圍"
}
```

#### Scenario: 回傳格式正確
- **WHEN** Claude API 回應為合法 JSON
- **THEN** AnalyzeService 成功解析並返回給 controller

#### Scenario: 回傳格式錯誤
- **WHEN** Claude API 回應無法被 JSON.parse 解析
- **THEN** 回傳 HTTP 500
