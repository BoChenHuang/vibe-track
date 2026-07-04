## 1. Fix RequestLoggerInterceptor

- [x] 1.1 In `src/common/interceptors/request-logger.interceptor.ts`, remove the `input` variable declaration and its spread from the request-entry log (`→` line)
- [x] 1.2 Inside the `tap` callback, read `req.body` after `next.handle()` resolves and include it as `input` in the response log (`←` line) — alongside the existing `output`

## 2. Verify

- [x] 2.1 Start the server and send a `POST /analyze` with `text` and optional image; confirm the `→` log has no `input` field and the `←` log contains `input: { text: "..." }`
- [x] 2.2 Send a `POST /analyze` with only an image (no text fields); confirm `←` log omits `input`
- [x] 2.3 Run existing unit tests — `npm test` — and confirm no regressions
