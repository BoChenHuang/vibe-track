## ADDED Requirements

### Requirement: 請求接受 market 選填參數
`POST /analyze` 請求 body SHALL 接受選填欄位 `market`，合法值為以下市場代碼之一：`TW`、`US`、`JP`、`KR`、`HK`、`SG`、`GB`、`AU`、`CA`、`FR`、`DE`、`ES`、`BR`。未傳入時不限市場。傳入不在列表中的值 SHALL 回傳 HTTP 400。

#### Scenario: 傳入合法 market
- **WHEN** 請求 body 包含 `market: "TW"`
- **THEN** 回傳 HTTP 200，Spotify 搜尋限定台灣上架的歌曲，且 Claude query 偏向台灣流行音樂風格

#### Scenario: 未傳入 market
- **WHEN** 請求 body 不含 `market` 欄位
- **THEN** 回傳 HTTP 200，行為與現有相同（不限市場）
