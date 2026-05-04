# NestJS 專案結構

## 模組結構

```
src/
├── app.module.ts
├── main.ts
│
├── analyze/              # 核心功能模組
│   ├── analyze.module.ts
│   ├── analyze.controller.ts
│   ├── analyze.service.ts
│   └── dto/
│       └── analyze.dto.ts
│
├── claude/               # Claude API 整合
│   ├── claude.module.ts
│   └── claude.service.ts
│
├── spotify/              # Spotify API 整合
│   ├── spotify.module.ts
│   └── spotify.service.ts
│
├── cache/                # Redis 快取
│   ├── cache.module.ts
│   └── cache.service.ts
│
├── database/             # 資料庫模組
│   ├── database.module.ts
│   └── prisma.service.ts
│
└── common/               # 共用工具
    ├── guards/
    │   └── rate-limit.guard.ts
    └── pipes/
        └── file-validation.pipe.ts
```

## 切法邏輯

- `analyze` 是唯一對外的模組，controller 在這裡，負責協調其他三個服務
- `claude` 專注串接 Claude API，不做其他事
- `spotify` 專注串接 Spotify API，不做其他事
- `cache` 負責 Redis 快取與 Rate Limiting 的底層操作
- `database` 封裝 Prisma，負責查詢紀錄的讀寫
- `common` 放跨模組共用的 guard 和 pipe

---

## 資料庫 Schema

```prisma
model Query {
  id         String   @id @default(uuid())
  session_id String
  input_type String   // "text" | "image" | "both"
  input_text String?
  created_at DateTime @default(now())
  tracks     Track[]
}

model Track {
  id          String @id @default(uuid())
  query_id    String
  query       Query  @relation(fields: [query_id], references: [id])
  title       String
  artist      String
  spotify_url String
  preview_url String?
  reason      String
}
```

## Session 識別機制

- 前端第一次訪問時產生 `session_id`，存入 `localStorage`
- 之後每次請求都在 header 帶上 `X-Session-ID`
- 換瀏覽器或清快取後歷史紀錄會消失（MVP 限制，未來可升級為帳號系統）
