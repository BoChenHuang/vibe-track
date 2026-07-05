## MODIFIED Requirements

### Requirement: 相同輸入命中快取
系統 SHALL 對相同的 text + image + limit + market 輸入回傳快取結果，不重新呼叫 Claude 或 Spotify API。

#### Scenario: 快取命中（所有參數相同）
- **WHEN** 發送與前次完全相同的 text、image、limit 和 market
- **THEN** 回傳 HTTP 200，回應時間明顯短於首次請求，且回傳歌曲數量等於請求的 limit

#### Scenario: limit 不同時快取未命中
- **WHEN** 相同 text/image 但 limit 與前次不同（例如從 8 改為 5）
- **THEN** 視為新請求，重新呼叫 Claude + Spotify，結果以新 key 存入快取

#### Scenario: market 不同時快取未命中
- **WHEN** 相同 text/image 但 market 與前次不同（例如從 TW 改為 US）
- **THEN** 視為新請求，重新呼叫 Claude + Spotify，結果以新 key 存入快取

#### Scenario: 快取未命中
- **WHEN** 第一次發送某個 (text, image, limit, market) 組合
- **THEN** 呼叫 Claude + Spotify，結果存入快取後回傳
