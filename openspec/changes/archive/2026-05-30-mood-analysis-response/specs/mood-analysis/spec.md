## MODIFIED Requirements

### Requirement: Claude 回傳格式
Claude API SHALL 回傳以下固定 JSON 結構，不包含其他文字：

```json
{
  "queries": [
    "<2~3個英文詞的Spotify搜尋query>",
    "<2~3個英文詞的Spotify搜尋query>",
    "<2~3個英文詞的Spotify搜尋query>"
  ],
  "reason": "<中文說明整體情緒與推薦方向>",
  "label": "<主情緒英文標籤，如 Melancholic、Energetic、Calm>",
  "sub": "<次情緒英文短語，如 quietly nostalgic、softly restless>",
  "tags": [
    { "name": "<情緒英文名詞>", "primary": true },
    { "name": "<情緒英文名詞>", "primary": false }
  ]
}
```

#### Scenario: 回傳格式正確（含新欄位）
- **WHEN** Claude API 回應為合法 JSON
- **THEN** AnalyzeService 成功解析，取得 `queries`、`reason`、`label`、`sub`、`tags` 五個欄位

#### Scenario: 回傳格式錯誤
- **WHEN** Claude API 回應無法被 JSON.parse 解析
- **THEN** 回傳 HTTP 500

#### Scenario: tags 至少一個 primary
- **WHEN** Claude 回傳 tags 陣列
- **THEN** 陣列中至少一個元素的 `primary` 為 `true`
