---
'koa-zod-router': major
---

Add support for Zod 4 and drop support for Zod 3 and Node.js versions older than 24.

- `zod` is now a peer dependency only (`^4.0.0`); install it alongside `koa-zod-router`.
- Validation option types use `ZodType<Output, Input>` instead of `ZodSchema<Output, ZodTypeDef, Input>`, and `zFile()` returns `ZodType<PersistentFile, PersistentFile>`.
- `exposeRequestErrors` and `exposeResponseErrors` still respond with `{ issues, name }` for each error. Zod 4 no longer serializes `issues` with `JSON.stringify`, so code that sends `ctx.invalid` errors directly should read `.issues` or use `z.treeifyError()` / `z.flattenError()`.
- Issue contents follow Zod 4 (for example, a missing required field reports `Invalid input: expected string, received undefined` instead of `Required`).
