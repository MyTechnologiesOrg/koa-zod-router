# ⚡ koa-zod-router ⚡

Inspired by koa-joi-router, this package aims to provide a similar feature-set while leveraging Zod and Typescript to create typesafe routes and middlewares with built in I/O validation.

![npm release](https://img.shields.io/npm/v/koa-zod-router?label=latest)
[![Coverage Status](https://coveralls.io/repos/github/JakeFenley/koa-zod-router/badge.svg?branch=main)](https://coveralls.io/github/JakeFenley/koa-zod-router?branch=main)
![downloads](https://img.shields.io/npm/dm/koa-zod-router)

[zod]: https://github.com/colinhacks/zod
[coercion]: https://zod.dev/api#coercion
[koa-bodyparser]: https://github.com/koajs/bodyparser
[formidable]: https://github.com/node-formidable/formidable
[@koa/router]: https://github.com/koajs/router

## 🔥 Features:

- Input/output validation and typesafety using [zod][]
- Body parsing using [koa-bodyparser][]
- Multipart parsing using [formidable][]
- Wraps [@koa/router][], providing the same API but with typesafety and validation.
- Custom validation error handling support
- RegExp path support
- CJS and ESM support

## 🚀 Install

This fork is installed from its git release tags rather than the npm registry:

```sh
npm install koa-zod-router@github:MyTechnologiesOrg/koa-zod-router#semver:^3 koa zod
```

Requires Node.js 24 or newer, [zod][] 4, and Koa 2. Version 2.x of this package supports Zod 3.

Every push to `main` creates a release, and the tag points at a commit that adds the built `dist/` on top of `main`. The version is calculated from [Conventional Commits](https://www.conventionalcommits.org/) since the previous tag: a `BREAKING CHANGE:` footer in the commit body makes a major release, `feat:` a minor, `fix:` a patch, and anything else a minor. The `feat!:` shorthand alone is not recognized, so a breaking commit needs the footer.

## 🚦 Quickstart

`index.ts:`

```js
import Koa from 'koa';
import zodRouter from 'koa-zod-router';
import { z } from 'zod';

const app = new Koa();

const router = zodRouter();

router.register({
  name: 'example',
  method: 'post',
  path: '/post/:id',
  handler: async (ctx, next) => {
    const { foo } = ctx.request.body;
    ctx.body = { hello: 'world' };

    await next();
  },
  validate: {
    params: z.object({ id: z.coerce.number() }),
    body: z.object({ foo: z.number() }),
    response: z.object({ hello: z.string() }),
  },
});

app.use(router.routes());

app.listen(3000, () => {
  console.log('app listening on http://localhost:3000');
});
```

### Importing/Exporting routes

Most likely you'll want to seperate your routes into seperate files, and register them somewhere in your app's initialization phase. To do this you can use the helper function createRouteSpec and specify the route's properties.

`get-user.ts:`

```js
import { createRouteSpec } from 'koa-zod-router';
import { z } from 'zod';

export const getUserRoute = createRouteSpec({
  method: 'get',
  path: '/user/:id',
  handler: (ctx) => {
    ctx.body = {
      /* payload here */
    };
  },
  validate: {
    params: z.object({ id: z.coerce.number() }),
    response: z.object({
      /* validation here */
    }),
  },
});
```

`index.ts:`

```js
import zodRouter from 'koa-zod-router';
import { getUserRoute } from './get-user.ts';

const router = zodRouter();
router.register(getUserRoute);
```

### Adding state to routes

zodRouter accepts a type parameter for adding types to `ctx.state`, as well as providing a helper function used creating routes and middlewares with state types.

`route-state.ts:`

```js
import { routerSpecFactory } from 'koa-zod-router';

export type UserState = {
  user: {
    username: string;
    email: string;
    id: number;
  };
};

export const specFactory = routerSpecFactory<UserState>();

```

`auth-middleware.ts:`

```js
import { z } from 'zod';
import { specFactory } from './route-state';

export const authMiddleware = specFactory.createUseSpec({
  handler: async (ctx, next) => {
    // ... validate the session token

    // setting state is now typesafe
    ctx.state.user = {
      username: 'johndoe',
      email: 'example@email.com',
      id: 1,
    };

    await next();
  },
  validate: {
    // validation fails if `x-session-token` is not set in the HTTP request headers
    headers: z.object({ 'x-session-token': z.string() }),
  },
});
```

`get-user.ts:`

```js
import { z } from 'zod';
import { specFactory } from './route-state';

export const getUserRoute = specFactory.createRouteSpec({
  method: 'get',
  path: '/user/:id',
  handler: async (ctx) => {
    //.. our route has access to the ctx.state.user types now
    ctx.state.user;
  },
  validate: {
    /* validation here */
  },
});
```

`index.ts:`

```js
import zodRouter from 'koa-zod-router';
import { UserState } from './router-state';
import { authMiddleware } from './auth-middleware';
import { getUserRoute } from './get-user';

const router = zodRouter<UserState>();

router.use(authMiddleware);
router.register(getUserRoute);
```

### Exposing validation errors to the client

By default validation errors will respond with either a generic 400 or 500 error depending on whether the validation fails from the sent fields in the request, or if there is an issue in the response body.

To enable ZodErrors being exposed to the client simply use the following config:

```js
const router = zodRouter({
  zodRouter: { exposeRequestErrors: true, exposeResponseErrors: true },
});
```

Each failing request parameter (or the response) is sent as `{ issues, name }`:

```json
{
  "error": {
    "error": false,
    "body": {
      "issues": [
        {
          "expected": "string",
          "code": "invalid_type",
          "path": ["foo"],
          "message": "Invalid input: expected string, received undefined"
        }
      ],
      "name": "ZodError"
    }
  }
}
```

### Route paths

Routes are matched by [@koa/router][] 15, which uses path-to-regexp v8 syntax:

- Named parameters: `/users/:id`
- Optional segments: `/users{/:id}` (replaces `/users/:id?`)
- Wildcards need a name: `/files/*path` or `/files{/*path}`
- Regex patterns inside parameters, such as `/users/:id(\\d+)`, are no longer supported. Validate the parameter with a `params` schema instead, for example `params: z.object({ id: z.coerce.number().int() })`.

RegExp paths still work, but their capture groups are on `ctx.captures` rather than `ctx.request.params`. See the [@koa/router migration guide](https://github.com/koajs/router/blob/master/FULL_MIGRATION_TO_V15%2B.md) for details.

### Validated request data

After validation succeeds, `ctx.request.body`, `ctx.request.query`, and `ctx.request.files` hold exactly the parsed output of their schemas. Keys the schema strips, such as unknown keys in a `z.object()`, are removed, so they can't reach your handler. Headers and route params keep values the schema doesn't cover, because other middleware relies on them.

If a `use` spec validates part of the body and later routes need the rest, use `z.looseObject()` in the `use` spec so other keys are kept.

### Type coercion

When dealing with route parameters, query strings, and headers the incoming data will be parsed as strings to begin with. From a validation standpoint this can potentially be painful to deal with when dealing with things like `Date` in javascript. Luckily [zod] has a built in [coercion] method attached to its primitive data types to solve this!

**convert a route parameter to a number:**

```js
router.register({
  path: '/users/:id',
  method: 'get',
  handler: async (ctx) => {
    console.log(typeof ctx.request.params.id);
    // 'number'
  },
  validate: {
    params: z.object({ id: z.coerce.number() }),
  },
});
```

### Dealing with dates

As mentioned above type coercion can be very useful in a lot of situations, especially when dealing with dates. Since `Date` cannot be passed directly into JSON we must convert both the data received and the data being sent back to the client. Avoid using `z.date()` in your schemas as these will result in validation errors. Instead use `z.coerce.date()` for input data, and `z.string()` (or your choice of primitive data-type) for output.

```js
router.register({
  path: '/date',
  method: 'post',
  handler: async (ctx) => {
    const { date } = ctx.request.body;
    console.log(date instanceof Date);
    // true
    ctx.body = {
      date: date.toISOString(),
    };
  },
  validate: {
    body: z.object({ date: z.coerce.date() }), // converts received string or number into date object
    response: z.object({ date: z.string() }),
  },
});
```

### Dealing with files

koa-zod-router uses [formidable] for any requests received with the `Content-Type` header set to `multipart/*`.

This functionality is disabled by default, to enable this functionality create an instance of zodRouter and pass in `{ zodRouter: { enableMultipart: true } }` as your config. Then to validate files utilize the helper function `zFile`.

```js
import zodRouter, { zFile } from 'koa-zod-router';

const fileRouter = zodRouter({ zodRouter: { enableMultipart: true } });

fileRouter.register({
  path: '/uploads',
  method: 'post',
  handler: async (ctx) => {
    const { file_one, multiple_files } = ctx.request.files;
    //...
  },
  validate: {
    body: z.object({ hello: z.string() }),
    files: z.object({
      file_one: zFile(),
      multiple_files: z.array(zFile()).or(zFile()),
    }),
  },
});
```

How uploads are handled:

- Multipart requests are parsed after a route's `pre` middleware, so checks such as authentication there run before anything is written to disk. A `use` spec only parses multipart requests when it validates `body` or `files`.
- Files are only saved for routes with a `files` schema. Other routes still receive the text fields in `ctx.request.body`.
- Uploaded files are temporary and are deleted once the response finishes. To keep a file, move or copy it from its `filepath` before the response is sent.

## Custom Validation Error Handling
`koa-zod-router` allows users to implement router-wide error handling or route specific error handling. 

### Router-wide error handling

By passing a function `validationErrorHandler` into `zodRouter` options you can execute an error handler that occurs immediately after the validation-middleware does it's thing.

```js
import { ValidationErrorHandler } from 'koa-zod-router';

const validationErrorHandler: ValidationErrorHandler = async (ctx, next) => {
  if (ctx.invalid.error) {
    ctx.status = 400;
    ctx.body = 'hello';
  } else {
    await next();
  }

  return;
};

const router = zodRouter({
  zodRouter: { exposeResponseErrors: true, validationErrorHandler },
});
```

### Route specific error handling
By enabling `continueOnError` you can bypass the default error handling done by the router's validation middleware and handle the errors the way you see fit.

When a request with invalid input continues, either with `continueOnError` or a `validationErrorHandler`, the `response` schema still applies to successful (2xx) responses. Error responses and redirects you send are not checked against it.

```js
import zodRouter from 'koa-zod-router';
import { z } from 'zod';

const router = zodRouter();

//... create a custom error handler

router.register({
  method: 'get',
  path: '/foo',
  handler: [
    // error handler
    async (ctx, next) => {
      // check if an error was thrown
      if (ctx.invalid.error) {
        // destructure all of the ZodErrors from ctx.invalid
        const { body, headers, query, params, files } = ctx.invalid;
        // Zod 4 does not serialize `issues` with JSON.stringify, so read it directly
        // or use z.treeifyError() / z.flattenError()
        ctx.status = 400;
        ctx.body = { body: body?.issues };
      } else {
        await next();
      }
    },
    async (ctx, next) => {
      // .. route handler
    },
  ],
  validate: {
    continueOnError: true,
    body: z.object({
      foo: z.string(),
    }),
  },
});
```

## API Reference

[Reference](https://github.com/JakeFenley/koa-zod-router/tree/main/docs/API.md)

## Feedback

Found a bug or have an idea?
Please let us know in [Issues section](https://github.com/MyTechnologiesOrg/koa-zod-router/issues).

Found a vulnerability or other security issue?
Please refer to [Security policy](https://github.com/MyTechnologiesOrg/koa-zod-router/blob/main/SECURITY.md).

## Attribution

This is a fork of [koa-zod-router](https://github.com/JakeFenley/koa-zod-router) by Jake Fenley, forked from version 2.3.0 (November 2025). This fork is maintained independently by My Technology, Inc. and is not affiliated with the original project.
