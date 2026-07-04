## Why

`RequestLoggerInterceptor` is registered globally and runs before the route-level `FileInterceptor`, which means `req.body` has not yet been parsed by multer when the request-entry log is written — every `POST /analyze` call logs an empty `input` field. This makes the request log useless for debugging multipart API calls.

## What Changes

- Move `req.body` reading from the request-entry log to the response-phase tap, where multer has already parsed the multipart body.
- The `→ METHOD URL` line keeps being logged immediately (preserving the request-arrival signal) but `input` is now logged on the `←` response line alongside the output.
- No behaviour change to callers — only log content is affected.

## Capabilities

### New Capabilities
<!-- none — this is a pure internal logging fix -->

### Modified Capabilities
- `winston-logger`: The request log entry (`→`) no longer includes `input`; the response log entry (`←`) now includes both `input` and `output`.

## Impact

- **File**: `src/common/interceptors/request-logger.interceptor.ts`
- **No API changes** — log format is internal
- **No dependency changes**
