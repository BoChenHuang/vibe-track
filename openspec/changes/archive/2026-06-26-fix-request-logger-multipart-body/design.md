## Context

`RequestLoggerInterceptor` is a globally registered NestJS interceptor. Global interceptors execute before route-level interceptors in NestJS's execution pipeline. The `POST /analyze` endpoint uses `@UseInterceptors(FileInterceptor('image'))` at the route level — multer is invoked inside `FileInterceptor.intercept()`, which runs *after* the global interceptor has already started.

Current execution order for `POST /analyze`:

```
1. RequestLoggerInterceptor.intercept() starts
   └─ reads req.body → {} (multer hasn't run yet)
   └─ logs "→ POST /analyze" with empty input
   └─ calls next.handle()

2. FileInterceptor.intercept() starts
   └─ multer middleware runs
   └─ req.body = { text, market, limit }
   └─ req.file = <uploaded image>
   └─ calls next.handle()

3. Controller method runs
```

The response `tap` in step 1 fires *after* the full chain resolves, so by the time it executes, `req.body` is already populated.

## Goals / Non-Goals

**Goals:**
- Log request body fields (`text`, `market`, `limit`) for `POST /analyze` calls
- Preserve the immediate `→ METHOD URL` log line (arrival signal)
- Keep the single-file, minimal change scope

**Non-Goals:**
- Logging `req.file` content (binary data — too large, not useful in logs)
- Changing the log format for non-multipart endpoints
- Restructuring the interceptor pipeline or global/route order

## Decisions

### Decision: Read `req.body` in the response `tap`, not at intercept-entry time

The `tap` callback runs after `next.handle()` resolves — at which point `FileInterceptor` has completed and `req.body` is populated. Moving the `input` read there costs nothing and fixes the root cause without any architectural change.

**Alternatives considered:**

| Alternative | Why rejected |
|---|---|
| Convert `RequestLoggerInterceptor` to route-level and place it after `FileInterceptor` | Requires modifying the controller; loses the global arrival-signal for other routes |
| Register multer as Express middleware globally | Changes the application's request handling model; affects all routes |
| Use a separate `PostFileInterceptor` | Adds complexity for a one-line fix |

The `tap` approach is a 3-line change confined to one file with no observable side-effects.

### Decision: Merge `input` into the `←` response log line

Since `input` is now read at response time, it is most natural to include it alongside `output` in the `←` log. This gives a single log line with full request + response context for each call — useful for debugging.

## Risks / Trade-offs

- **`tap` fires only on success** — `tap` in RxJS does not fire on errors thrown inside the observable. Error cases are handled by `AllExceptionsFilter` which logs separately. This is acceptable; the `→` arrival line is always logged.
- **Log line timing** — `input` is now logged at response time rather than request time. For very slow requests this means a gap between arrival (`→`) and body (`←`). This is acceptable given the use case.

## Migration Plan

1. Edit `src/common/interceptors/request-logger.interceptor.ts` — move `input` read and `...(input ...)` spread into the `tap` callback.
2. No migration or restart strategy needed beyond a normal deploy.
