---
'koa-zod-router': major
---

Upgrade `@koa/router` from 12 (deprecated upstream) to 15.

- Route paths use path-to-regexp v8 syntax. Optional segments are written `/users{/:id}` instead of `/users/:id?`, wildcards need a name (`/files/*path`), and regex patterns inside parameters such as `/users/:id(\\d+)` throw when the route is registered. Validate parameters with a `params` schema instead.
- RegExp paths still match, but their capture groups are on `ctx.captures` instead of `ctx.request.params`.
- `@types/koa__router` is no longer a dependency; `@koa/router` 15 ships its own types. Import router types such as `Layer`, `RouterContext`, and `LayerOptions` from `@koa/router`. The `param()` wrapper now takes a `RouterParameterMiddleware`.
