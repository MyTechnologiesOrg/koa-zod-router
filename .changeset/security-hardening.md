---
'koa-zod-router': major
---

Security fixes for request validation, response validation, and multipart uploads.

- After validation, `ctx.request.body`, `ctx.request.query`, and `ctx.request.files` hold exactly the parsed output. Keys the schema strips or transforms away are no longer left on the request. Headers and params still keep values the schema doesn't cover. A `use` spec that validates part of the body should use `z.looseObject()` if later routes need the other keys.
- The `response` schema now also applies when a request with invalid input continues through `continueOnError` or a `validationErrorHandler`. Only successful (2xx) responses are checked on that path, so custom error responses and redirects are unchanged.
- With `enableMultipart`, multipart requests are parsed inside each route's middleware after `pre`, instead of for every route on the router before any route middleware. A `use` spec only parses them when it validates `body` or `files`.
- File parts are only saved for routes with a `files` schema, and uploaded temp files are deleted when the response finishes. Move or copy files you want to keep before responding.
- Require `formidable` 2.1.5 or later (unguessable temp file names) and `@koa/router` 12.0.2 or later (fixes a `path-to-regexp` ReDoS).
