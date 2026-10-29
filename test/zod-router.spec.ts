import assert from 'assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'mocha';
import { createRouteSpec, methods, zFile } from '../src/util';
import { Layer, RouterContext } from '@koa/router';
import zodRouter from '../src/zod-router';
import { ValidationErrorHandler } from '../src/types';
import { createApp, request } from './test-utils';
import { z } from 'zod';

describe('zodRouter', () => {
  describe('wrapped methods', () => {
    it('should have functions for all http methods', () => {
      const router = zodRouter();

      for (const method of methods) {
        assert(typeof router[method] === 'function');
      }
    });

    it('register method should create a route with provided values and contain 3 middlewares', () => {
      const router = zodRouter({ koaRouter: { prefix: '/test' } });
      router.register({
        name: 'post-example',
        method: 'post',
        path: '/post',
        pre: async (_ctx, next) => {
          await next();
        },
        handler: [
          async (_ctx, next) => {
            await next();
          },
        ],
      });

      const route = router.route('post-example') as Layer;

      assert(route?.stack.length === 3);
      assert(route?.methods[0] === 'POST');
      assert(route?.opts.prefix === '/test');
      assert(route?.name === 'post-example');
    });

    it('register allows for multiple methods', async () => {
      const router = zodRouter();

      router.register({
        path: '/',
        method: ['patch', 'post'],
        handler: async (ctx) => {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const { test } = ctx.request.body;
          ctx.cookies.set('foo', 'bar');
          ctx.body = { success: Boolean(test) };
        },
        validate: {
          body: z.object({ test: z.string() }),
          response: z.object({ success: z.boolean() }),
        },
      });

      const app = createApp(router);

      await request(app)
        .patch('/')
        .send({ test: 'hello' })
        .then((res) => {
          assert(res.status === 200);
          assert(res.body.success === true);
        });

      await request(app)
        .post('/')
        .send({ test: 'hello' })
        .then((res) => {
          assert(res.status === 200);
          assert(res.body.success === true);
        });
    });

    it('register allows for multiple methods', async () => {
      const router = zodRouter();

      router.register({
        path: '/',
        method: ['patch', 'post'],
        handler: async (ctx) => {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const { test } = ctx.request.body;
          ctx.cookies.set('foo', 'bar');
          ctx.body = { success: Boolean(test) };
        },
        validate: {
          body: z.object({ test: z.string() }),
          response: z.object({ success: z.boolean() }),
        },
      });

      const app = createApp(router);

      await request(app)
        .patch('/')
        .send({ test: 'hello' })
        .then((res) => {
          assert(res.status === 200);
          assert(res.body.success === true);
        });

      await request(app)
        .post('/')
        .send({ test: 'hello' })
        .then((res) => {
          assert(res.status === 200);
          assert(res.body.success === true);
        });
    });

    it('register should throw when method is missing in spec', async () => {
      const router = zodRouter();

      const spec = createRouteSpec({
        path: '/',
        handler: () => {},
      });

      assert.throws(() => {
        router.register(spec);
      }, /HTTP Method missing in spec \//);
    });

    it('register should work as indended with createRouteSpec', async () => {
      const router = zodRouter();

      const spec = createRouteSpec({
        method: 'get',
        path: '/',
        handler: (ctx) => {
          ctx.body = { success: true };
        },
        validate: { response: z.object({ success: z.boolean() }) },
      });

      router.register(spec);

      const app = createApp(router);

      await request(app)
        .get('/')
        .then((res) => {
          assert(res.status === 200);
          assert(res.body.success === true);
        });
    });

    it('register should work as indended without validation-middleware', async () => {
      const router = zodRouter();

      const spec = createRouteSpec({
        method: 'get',
        path: '/',
        handler: async (ctx) => {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          ctx.cookies.set('foo', 'bar');
          ctx.body = { success: true };
        },
      });

      router.register(spec);

      const app = createApp(router);

      await request(app)
        .get('/')
        .then((res) => {
          assert(res.status === 200);
          assert(res.body.success === true);
        });
    });

    it('http method functions work with path or route spec as first arg', async () => {
      const router = zodRouter();

      router.get('/path', (ctx) => {
        ctx.body = { success: true };
      });

      router.get({
        path: '/spec',
        handler: (ctx) => {
          ctx.body = { success: true };
        },
      });

      const app = createApp(router);

      await request(app)
        .get('/path')
        .then((res) => {
          assert(res.status === 200);
          assert(res.body.success === true);
        });

      await request(app)
        .get('/spec')
        .then((res) => {
          assert(res.status === 200);
          assert(res.body.success === true);
        });
    });

    it('route method fn should throw when given invalid args', () => {
      const router = zodRouter();

      assert.throws(() => {
        // @ts-ignore
        router.get('/', 'str', () => {}, {});
      }, /Invalid route arguments/);
    });

    it('route method fn should retain http method called when method prop accidentally passed', async () => {
      const router = zodRouter();

      const spec = createRouteSpec({
        method: 'post',
        path: '/',
        handler: (ctx) => {
          ctx.body = 'hello';
        },
        validate: { response: z.string() },
      });

      router.get(spec);

      const app = createApp(router);

      await request(app)
        .get('/')
        .then((res) => {
          assert(res.status === 200);
          assert(res.text === 'hello');
        });

      await request(app)
        .post('/')
        .then((res) => {
          assert(res.status === 404);
        });
    });

    it('use should use koa-router implementation correctly', async () => {
      const router = zodRouter();

      router.use((ctx, next) => {
        ctx.state.hello = 'hi';
        next();
      });

      router.register({
        path: '/',
        method: 'get',
        handler: (ctx, next) => {
          ctx.body = { hello: ctx.state.hello };
          next();
        },
        validate: { response: z.object({ hello: z.string() }) },
      });

      const app = createApp(router);

      await request(app)
        .get('/')
        .then((res) => {
          assert(res.body.hello === 'hi');
        });
    });

    it('use with zod-router spec object passed', async () => {
      const router = zodRouter();

      router.use({
        handler: async (ctx, next) => {
          if (ctx.request.headers['x-session-token'] === 'test-token') {
            ctx.state.hello = ctx.request.headers['x-session-token'];
            await next();
          }
        },
        validate: {
          headers: z.object({ 'x-session-token': z.string() }),
        },
      });

      router.use({
        path: '/with-path',
        handler: async (ctx, next) => {
          if (ctx.request.headers['x-with-path'] === 'with-path') {
            ctx.state.withPath = ctx.request.headers['x-with-path'];
            await next();
          }
        },
        validate: {
          headers: z.object({ 'x-with-path': z.string() }),
        },
      });

      router.register({
        path: '/',
        method: 'get',
        handler: async (ctx, next) => {
          ctx.body = { hello: ctx.state.hello };
          await next();
        },
        validate: { response: z.object({ hello: z.string() }) },
      });

      router.register({
        path: '/with-path',
        method: 'get',
        handler: async (ctx, next) => {
          ctx.body = { withPath: ctx.state.withPath };
          await next();
        },
        validate: { response: z.object({ withPath: z.string() }) },
      });

      const app = createApp(router);

      await request(app)
        .get('/')
        .set('x-session-token', 'test-token')
        .then((res) => {
          assert(res.body.hello === 'test-token');
        });

      await request(app)
        .get('/')
        .then((res) => {
          assert(res.status === 400);
        });

      await request(app)
        .get('/with-path')
        .set('x-session-token', 'test-token')
        .set('x-with-path', 'with-path')
        .then((res) => {
          assert(res.body.withPath === 'with-path');
        });

      await request(app)
        .get('/with-path')
        .then((res) => {
          assert(res.status === 400);
        });
    });

    it('should support RegExp paths in method helpers and register', async () => {
      const router = zodRouter();

      router.use({
        path: '/re',
        handler: async (ctx, next) => {
          ctx.set('x-use', 'yes');
          await next();
        },
      });

      router.get(/^\/re\/method\/(\d+)$/, (ctx) => {
        // @koa/router 15 exposes RegExp capture groups only on ctx.captures
        const { captures } = ctx as unknown as RouterContext;
        ctx.body = { route: 'method', id: captures?.[0] };
      });

      router.register({
        method: 'post',
        path: /^\/re\/register$/,
        handler: (ctx) => {
          ctx.body = { route: 'register', hello: ctx.request.body.hello };
        },
        validate: { body: z.object({ hello: z.string() }) },
      });

      const app = createApp(router);

      const methodRes = await request(app).get('/re/method/42');
      assert(methodRes.status === 200);
      assert.deepStrictEqual(methodRes.body, { route: 'method', id: '42' });
      assert(methodRes.headers['x-use'] === 'yes');

      const registerRes = await request(app).post('/re/register').send({ hello: 'world' });
      assert(registerRes.status === 200);
      assert.deepStrictEqual(registerRes.body, { route: 'register', hello: 'world' });
      assert(registerRes.headers['x-use'] === 'yes');

      const missRes = await request(app).get('/re/method/abc');
      assert(missRes.status === 404);
    });
  });

  describe('delegated methods', () => {
    it('all should use koa-router implementation', () => {
      const router = zodRouter();

      router.all('example', '/test', () => {});

      const route = router.route('example') as Layer;
      assert(route?.methods.length > 1);
    });

    it('allowedMethods should use koa-router implementation', () => {
      const router = zodRouter();
      assert(typeof router.allowedMethods() === 'function');
    });

    it('match should use koa-router implementation', () => {
      const router = zodRouter();

      router.register({
        method: 'get',
        path: '/test',
        name: 'example',
        handler: () => {},
      });

      assert(router.match('/test', 'get')?.path.find((route) => route.name === 'example'));
    });

    it('middleware should use koa-router implementation', () => {
      const router = zodRouter();
      assert(typeof router.middleware() === 'function');
    });

    it('param should use koa-router implementation and router instance should match', () => {
      const router = zodRouter();
      assert.equal(
        router.param('/test', () => {}),
        router.router,
      );
    });

    it('prefix should use koa-router implementation', () => {
      const router = zodRouter();
      router.prefix('/test-prefix');

      router.register({
        method: 'get',
        path: '/test',
        name: 'example',
        handler: () => {},
      });

      const route = router.route('example') as Layer;
      assert(route?.opts.prefix === '/test-prefix');
    });

    it('redirect should use koa-router implementation correctly', async () => {
      const router = zodRouter();
      router.redirect('/', '/dest');

      router.get('/dest', (_ctx) => {});

      const app = createApp(router);

      await request(app)
        .get('/')
        .then((res) => {
          assert(res.status === 301);
        });
    });

    it('route should use koa-router implementation correctly', async () => {
      const router = zodRouter();

      router.get({
        name: 'test',
        path: '/',
        handler: () => {},
      });

      assert(router.route('test'));
      assert(!router.route('null'));
    });

    it('routes should use koa-router implementation correctly', () => {
      const router = zodRouter();
      const koaRouter = router.router;

      // @ts-ignore
      assert(router.routes().router.stack.length === 1);
      // @ts-ignore
      assert(koaRouter.routes().router.stack.length === 1);

      router.get({
        name: 'test',
        path: '/',
        handler: () => {},
      });

      // @ts-ignore
      assert(router.routes().router.stack.length === 2);
      // @ts-ignore
      assert(koaRouter.routes().router.stack.length === 2);
    });

    it('url should use koa-router implementation correctly', () => {
      const router = zodRouter();

      router.register({ name: 'users', method: 'get', path: '/users/:id', handler: () => {} });

      assert(router.url('users', 3) === '/users/3');
    });
  });

  describe('zod validation middleware', () => {
    it('should strip invalid fields from output', async () => {
      const router = zodRouter();
      const validation = z.object({ hello: z.string() }).or(z.object({ second: z.string() }));

      router.get(
        '/',
        (ctx) => {
          // @ts-ignore - purposefully ignore bad type
          ctx.body = { hello: 'world', invalid: 'should get stripped', second: 'should get stripped' };
        },
        {
          response: validation,
        },
      );

      router.get(
        '/second',
        (ctx) => {
          // @ts-ignore - purposefully ignore bad type
          ctx.body = { invalid: 'should get stripped', second: 'should be here' };
        },
        {
          response: validation,
        },
      );

      const app = createApp(router);
      await request(app)
        .get('/')
        .then((response) => {
          assert.equal(response.body.second, undefined);
          assert.equal(response.body.invalid, undefined);
          assert.equal(response.body.hello, 'world');
        });

      await request(app)
        .get('/second')
        .then((response) => {
          assert.equal(response.body.second, 'should be here');
          assert.equal(response.body.invalid, undefined);
        });
    });

    it('query params are validated', async () => {
      const router = zodRouter();

      router.get({
        path: '/',
        handler: (ctx) => {
          ctx.body = { test: ctx.request.query.test };
        },
        validate: {
          query: z.object({ test: z.string() }),
        },
      });

      const app = createApp(router);

      await request(app)
        .get('/?test=hello')
        .then((res) => {
          assert(res.status === 200);
          assert(res.body.test === 'hello');
        });

      await request(app)
        .get('/')
        .then((res) => {
          assert(res.status === 400);
          assert(res.body.success === undefined);
        });
    });

    it('request body is validated', async () => {
      const router = zodRouter();

      router.register({
        method: 'post',
        path: '/',
        handler: (ctx) => {
          ctx.body = { test: ctx.request.body.test };
        },
        validate: {
          body: z.object({
            test: z.string(),
          }),
        },
      });

      const app = createApp(router);

      await request(app)
        .post('/')
        .send({ test: 'hello' })
        .then((res) => {
          assert(res.status === 200);
          assert(res.body.test === 'hello');
        });

      await request(app)
        .post('/')
        .then((res) => {
          assert(res.status === 400);
          assert(res.body.success === undefined);
        });
    });

    it('path params are validated', async () => {
      const router = zodRouter();

      router.register({
        method: 'get',
        path: '/test/:id/:sku',
        handler: (ctx) => {
          ctx.body = { id: ctx.request.params.id, sku: ctx.request.params.sku };
        },
        validate: {
          params: z.object({
            id: z.coerce.number(),
            sku: z.string(),
          }),
        },
      });

      const app = createApp(router);

      await request(app)
        .get('/test/1/hello')
        .then((res) => {
          assert(res.status === 200);
          assert(res.body.id === 1 && res.body.sku === 'hello');
        });

      await request(app)
        .get('/test/string/hello')
        .then((res) => {
          assert(res.status === 400);
          assert(res.body.success === undefined);
        });
    });

    it('headers are validated', async () => {
      const router = zodRouter();

      router.register({
        method: 'patch',
        path: '/',
        handler: (ctx) => {
          ctx.body = { test: ctx.request.headers.test };
        },
        validate: {
          headers: z.object({
            test: z.string(),
          }),
        },
      });

      const app = createApp(router);

      await request(app)
        .patch('/')
        .set('test', 'hello')
        .then((res) => {
          assert(res.body.test === 'hello');
        });

      await request(app)
        .patch('/')
        .then((res) => {
          assert(res.body.test === undefined);
          assert(res.status === 400);
        });
    });

    it('files are validated', async () => {
      const router = zodRouter({ zodRouter: { enableMultipart: true } });

      router.register({
        method: 'patch',
        path: '/',
        handler: async (ctx) => {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          ctx.body = { test: ctx.request.files.test.toJSON().originalFilename };
        },
        validate: {
          files: z.object({
            test: zFile(),
          }),
        },
      });

      const app = createApp(router);

      await request(app)
        .patch('/')
        .set('Content-Type', 'multipart/form-data')
        .attach('test', 'package.json')
        .then((res) => {
          assert(res.body.test === 'package.json');
        });

      await request(app)
        .patch('/')
        .then((res) => {
          assert(res.body?.test === undefined);
          assert(res.status === 400);
        });
    });

    it('middleware copies coerced values from z.parse correctly', async () => {
      const router = zodRouter();

      router.register({
        path: '/',
        method: 'post',
        handler: async (ctx) => {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          ctx.body = {
            date: ctx.request.query.date.toISOString(),
            nested_date: ctx.request.body.depth_1.depth_2.date.toDateString(),
          };
        },
        validate: {
          body: z.object({
            depth_1: z.object({
              depth_2: z.object({
                date: z.coerce.date(),
              }),
            }),
          }),
          query: z.object({
            date: z.coerce.date(),
          }),
          response: z.object({
            nested_date: z.string(),
            date: z.string(),
          }),
        },
      });

      const app = createApp(router);

      const queryDate = new Date().toISOString();
      const bodyDate = new Date().toDateString();

      await request(app)
        .post(`/?date=${queryDate}`)
        .send({
          depth_1: {
            depth_2: {
              date: bodyDate,
            },
          },
        })
        .then((res) => {
          assert(res.body.nested_date === bodyDate);
          assert(res.body.date === queryDate);
        });
    });

    it('should remove body and query keys the schema strips', async () => {
      const router = zodRouter();

      router.post(
        '/',
        (ctx) => {
          ctx.body = { body: ctx.request.body, query: ctx.request.query };
        },
        {
          body: z.object({ name: z.string() }),
          query: z.object({ page: z.coerce.number() }),
        },
      );

      const app = createApp(router);

      const res = await request(app).post('/?page=2&isAdmin=true').send({ name: 'eve', role: 'admin' });

      assert.deepStrictEqual(res.body, { body: { name: 'eve' }, query: { page: 2 } });
    });

    it('should replace the body with the output of a transform', async () => {
      const router = zodRouter();

      router.post(
        '/',
        (ctx) => {
          ctx.body = ctx.request.body;
        },
        {
          body: z
            .object({ email: z.string(), password: z.string() })
            .transform(({ email, password }) => ({ email, passwordLength: password.length })),
        },
      );

      const app = createApp(router);

      const res = await request(app).post('/').send({ email: 'eve@example.com', password: 'hunter2' });

      assert.deepStrictEqual(res.body, { email: 'eve@example.com', passwordLength: 7 });
    });

    it('should accept bodies that are not objects', async () => {
      const router = zodRouter();

      router.post(
        '/',
        (ctx) => {
          ctx.body = { total: ctx.request.body.reduce((sum, n) => sum + n, 0) };
        },
        { body: z.array(z.coerce.number()) },
      );

      const app = createApp(router);

      const res = await request(app).post('/').send(['1', '2', 3]);

      assert.deepStrictEqual(res.body, { total: 6 });
    });

    it('should keep headers and params the schema does not cover', async () => {
      const router = zodRouter();

      router.get(
        '/:id/:slug',
        (ctx) => {
          const { slug } = ctx.request.params as Record<string, unknown>;
          ctx.body = { id: ctx.request.params.id, slug, accept: ctx.request.headers.accept };
        },
        {
          params: z.object({ id: z.coerce.number() }),
          headers: z.object({ 'x-test': z.string() }),
        },
      );

      const app = createApp(router);

      const res = await request(app).get('/1/hello').set('x-test', 'yes').set('accept', 'application/json');

      assert.deepStrictEqual(res.body, { id: 1, slug: 'hello', accept: 'application/json' });
    });
  });

  describe('options', () => {
    it('continueOnError: true - should call next middleware in chain and handle the error', async () => {
      const router = zodRouter();

      router.register({
        method: 'post',
        path: '/',
        handler: [
          async (ctx, next) => {
            if (ctx.invalid.error) {
              ctx.body = {
                error: {
                  body: ctx.invalid.body?.issues,
                  headers: ctx.invalid.headers?.issues,
                  query: ctx.invalid.query?.issues,
                },
              };
              ctx.status = 420;
            } else {
              await next();
            }
          },
          async (ctx) => {
            ctx.status = 455;
          },
        ],
        validate: {
          continueOnError: true,
          body: z.object({ test: z.array(z.boolean()) }),
          headers: z.object({ cookie: z.string() }),
          query: z.object({ query_test: z.coerce.date() }),
        },
      });

      const app = createApp(router);

      const res = await request(app)
        .post('/?query_test=whoops')
        .send({ test: [1, 2, 3] });

      assert(res.body?.error.body.length === 3);
      assert(res.body?.error.query.length === 1);
      assert(res.body?.error.headers.length === 1);
      assert(res.status === 420);
    });

    it('continueOnError: true - should still work with exposeRequestErrors enabled', async () => {
      const router = zodRouter({ zodRouter: { exposeRequestErrors: true } });

      router.register({
        method: 'post',
        path: '/',
        handler: [
          async (ctx, next) => {
            if (ctx.invalid.error) {
              ctx.body = {
                error: {
                  body: ctx.invalid.body?.issues,
                  headers: ctx.invalid.headers?.issues,
                  query: ctx.invalid.query?.issues,
                },
              };
              ctx.status = 420;
            } else {
              await next();
            }
          },
          async (ctx) => {
            ctx.status = 433;
          },
        ],
        validate: {
          continueOnError: true,
          body: z.object({ test: z.array(z.boolean()) }),
          headers: z.object({ cookie: z.string() }),
          query: z.object({ query_test: z.coerce.date() }),
        },
      });

      const app = createApp(router);

      const res = await request(app)
        .post('/?query_test=whoops')
        .send({ test: [1, 2] });

      assert(res.body?.error.body.length === 2);
      assert(res.body?.error.query.length === 1);
      assert(res.body?.error.headers.length === 1);
      assert(res.status === 420);
    });

    it('validationErrorHandler - should handle errors', async () => {
      const validationErrorHandler: ValidationErrorHandler = async (ctx, next) => {
        if (ctx.invalid.error) {
          ctx.status = 420;
          ctx.body = { error: 'test' };
        } else {
          await next();
        }

        return;
      };

      const router = zodRouter({
        zodRouter: { validationErrorHandler },
      });

      router.use(async (ctx, next) => {
        ctx.status = 500;
        await next();
      });

      router.post(
        '/',
        async (ctx, next) => {
          ctx.status = 200;
          ctx.body = 'hello';
          await next();
        },
        { body: z.object({ test: z.boolean() }) },
      );

      const app = createApp(router);

      const res = await request(app).post('/');

      assert(res.body.error === 'test');
      assert(res.status === 420);
    });

    it('validationErrorHandler - should work with other flags set', async () => {
      const validationErrorHandler: ValidationErrorHandler = async (ctx, next) => {
        if (ctx.invalid.error) {
          ctx.status = 420;
          ctx.body = { error: 'test' };
        } else {
          await next();
        }

        return;
      };

      const router = zodRouter({
        zodRouter: {
          validationErrorHandler,
          exposeRequestErrors: true,
          exposeResponseErrors: true,
          enableMultipart: true,
        },
      });

      router.use(async (ctx, next) => {
        ctx.status = 500;
        await next();
      });

      router.post(
        '/',
        async (ctx, next) => {
          ctx.status = 200;
          ctx.body = 'hello';
          await next();
        },
        { body: z.object({ test: z.boolean() }) },
      );

      const app = createApp(router);

      const res = await request(app).post('/');

      assert(res.body.error === 'test');
      assert(res.status === 420);
    });

    it('exposeResponseErrors: true - should send response validation errors in response body', async () => {
      const router = zodRouter({ zodRouter: { exposeResponseErrors: true } });

      router.post('/', (_ctx, _next) => {}, { response: z.object({ test: z.boolean() }) });

      const app = createApp(router);

      const res = await request(app).post('/');

      assert(res.body?.error?.response.issues.length === 1);
      assert(res.status === 500);
    });

    it('exposeResponseErrors: false - should not send response validation errors in response body', async () => {
      const router = zodRouter({ zodRouter: { exposeResponseErrors: false } });

      router.patch('/', [(_ctx, _next) => {}], { response: z.object({ test: z.boolean() }) });

      const app = createApp(router);

      const res = await request(app).patch('/');

      assert(res.body?.error?.issues === undefined);
      assert(res.status === 500);
    });

    it('exposeRequestErrors: true - should send request validation errors in response body', async () => {
      const router = zodRouter({ zodRouter: { exposeRequestErrors: true } });

      router.delete('/', (_ctx, _next) => {}, {
        query: z.object({ test: z.string() }),
        body: z.object({ hello: z.string(), foo: z.string() }),
        headers: z.object({ 'x-test-header': z.string() }),
      });

      const app = createApp(router);

      const res = await request(app).delete('/');

      assert(res.body?.error?.headers.issues.length === 1);
      assert(res.body?.error?.query.issues.length === 1);
      assert(res.body?.error?.body.issues.length === 2);
      assert.deepStrictEqual(Object.keys(res.body.error).sort(), ['body', 'headers', 'query']);
      assert(res.status === 400);
    });

    it('exposeRequestErrors: false - should not send request validation errors in response body', async () => {
      const router = zodRouter({ zodRouter: { exposeRequestErrors: false } });

      router.put('/', (_ctx, _next) => {}, { query: z.object({ test: z.string() }) });

      const app = createApp(router);

      const res = await request(app).put('/');

      assert(res.body?.error?.issues === undefined);
      assert(res.status === 400);
    });

    it('continueOnError: true - should apply the response schema to successful responses', async () => {
      const router = zodRouter();

      router.get(
        '/',
        (ctx) => {
          const user = { id: 1, passwordHash: 'secret' };
          ctx.body = user;
        },
        {
          continueOnError: true,
          query: z.object({ fields: z.enum(['basic', 'full']).optional() }),
          response: z.object({ id: z.number() }),
        },
      );

      const app = createApp(router);

      const res = await request(app).get('/?fields=invalid');

      assert(res.status === 200);
      assert.deepStrictEqual(res.body, { id: 1 });
    });

    it('validationErrorHandler - should apply the response schema when the request continues', async () => {
      const validationErrorHandler: ValidationErrorHandler = async (_ctx, next) => {
        await next();
      };

      const router = zodRouter({ zodRouter: { validationErrorHandler } });

      router.get(
        '/',
        (ctx) => {
          const user = { id: 1, passwordHash: 'secret' };
          ctx.body = user;
        },
        {
          query: z.object({ fields: z.enum(['basic', 'full']).optional() }),
          response: z.object({ id: z.number() }),
        },
      );

      const app = createApp(router);

      const res = await request(app).get('/?fields=invalid');

      assert(res.status === 200);
      assert.deepStrictEqual(res.body, { id: 1 });
    });

    it('validationErrorHandler - should not apply the response schema to error responses', async () => {
      const validationErrorHandler: ValidationErrorHandler = async (ctx, next) => {
        if (ctx.invalid.error) {
          ctx.status = 400;
          ctx.body = { error: 'bad input' };
        } else {
          await next();
        }
      };

      const router = zodRouter({ zodRouter: { validationErrorHandler } });

      router.get(
        '/',
        (ctx) => {
          ctx.body = { id: 1 };
        },
        {
          query: z.object({ fields: z.enum(['basic', 'full']).optional() }),
          response: z.object({ id: z.number() }),
        },
      );

      const app = createApp(router);

      const res = await request(app).get('/?fields=invalid');

      assert(res.status === 400);
      assert.deepStrictEqual(res.body, { error: 'bad input' });
    });
  });

  describe('multipart', () => {
    it('regular requests should work with multipart enables', async () => {
      const router = zodRouter();

      router.get({
        path: '/',
        handler: async (ctx) => {
          await new Promise((resolve) => setTimeout(resolve, 1000));

          ctx.body = { success: true };
        },
      });

      router.get({
        path: '/with-validation',
        handler: async (ctx) => {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          if (ctx.request.query.test) {
            ctx.body = { success: true };
          }
        },
        validate: {
          query: z.object({ test: z.string() }),
          response: z.object({ success: z.boolean() }),
        },
      });

      const app = createApp(router);

      await request(app)
        .get('/')
        .then((res) => {
          assert(res.status === 200);
          assert(res.body.success === true);
        });

      await request(app)
        .get('/with-validation?test=hello')
        .then((res) => {
          assert(res.status === 200);
          assert(res.body.success === true);
        });
    });

    it('should be able to receive multiple values for fields and files', async () => {
      const router = zodRouter({
        formidable: {
          uploadDir: '/tmp',
        },
        zodRouter: { enableMultipart: true },
      });

      router.register({
        path: '/test',
        method: 'put',
        handler: (ctx) => {
          ctx.status = 201;
          const { test_file } = ctx.request.files;

          ctx.body = {
            hello: ctx.request.body.hello.join(''),
            file_one: test_file[0],
            file_two: test_file[1],
          };
        },
        validate: { body: z.object({ hello: z.array(z.string()) }), files: z.object({ test_file: z.array(zFile()) }) },
      });

      const app = createApp(router);

      await request(app)
        .put('/test')
        .type('multipart/form-data')
        .field('hello', 'foo')
        .field('hello', 'bar')
        .attach('test_file', 'package.json')
        .attach('test_file', 'tsconfig.json')
        .then((res) => {
          assert(res.status === 201);
          assert(res.body.hello === 'foobar');
          assert(res.body.file_one.originalFilename === 'package.json');
          assert(res.body.file_two.originalFilename === 'tsconfig.json');
        });
    });

    it('response should contain FormidableError 4xx httpCode when client error occurs', async () => {
      const router = zodRouter({
        formidable: {
          uploadDir: '/tmp',
          maxFields: 2,
        },
        zodRouter: { enableMultipart: true },
      });

      router.register({
        path: '/test',
        method: 'put',
        handler: (ctx) => {
          ctx.status = 201;
        },
      });

      const app = createApp(router);

      await request(app)
        .put('/test')
        .type('multipart/form-data')
        .field('hello', 'foo')
        .field('hello2', 'bar')
        .field('hello3', 'uh oh')
        .then((res) => {
          assert(res.status === 413);
        });
    });

    it('response should contain 5xx httpCode when server error is thrown', async () => {
      const router = zodRouter({
        formidable: {
          uploadDir: '/tmp',
          enabledPlugins: [],
        },
        zodRouter: { enableMultipart: true },
      });

      router.register({
        path: '/test',
        method: 'put',
        handler: (ctx) => {
          ctx.status = 201;
        },
      });

      const app = createApp(router);

      await request(app)
        .put('/test')
        .type('multipart/form-data')
        .field('hello', 'foo')
        .then((res) => {
          assert(res.status === 500);
        });
    });

    it('should not save file parts for routes without a files schema', async () => {
      const uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'koa-zod-router-'));
      const router = zodRouter({ formidable: { uploadDir }, zodRouter: { enableMultipart: true } });

      router.post(
        '/',
        (ctx) => {
          ctx.body = { hello: ctx.request.body.hello, files: ctx.request.files };
        },
        { body: z.object({ hello: z.string() }) },
      );

      const app = createApp(router);

      const res = await request(app).post('/').field('hello', 'world').attach('test_file', 'package.json');

      assert(res.status === 200);
      assert.deepStrictEqual(res.body, { hello: 'world', files: {} });
      assert.deepStrictEqual(fs.readdirSync(uploadDir), []);
      fs.rmSync(uploadDir, { recursive: true });
    });

    it('should run pre before parsing multipart requests', async () => {
      const router = zodRouter({ zodRouter: { enableMultipart: true } });
      let filesSeenByPre: unknown = 'not called';

      router.register({
        method: 'post',
        path: '/',
        pre: async (ctx, next) => {
          filesSeenByPre = ctx.request.files;
          await next();
        },
        handler: (ctx) => {
          ctx.status = 201;
          ctx.body = { filename: ctx.request.files.test_file.toJSON().originalFilename };
        },
        validate: { files: z.object({ test_file: zFile() }) },
      });

      const app = createApp(router);

      const res = await request(app).post('/').attach('test_file', 'package.json');

      assert(filesSeenByPre === undefined);
      assert(res.status === 201);
      assert(res.body.filename === 'package.json');
    });

    it('should delete uploaded files after the response', async () => {
      const uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'koa-zod-router-'));
      const router = zodRouter({ formidable: { uploadDir }, zodRouter: { enableMultipart: true } });
      let filepath = '';

      router.register({
        method: 'post',
        path: '/',
        handler: (ctx) => {
          filepath = ctx.request.files.test_file.toJSON().filepath;
          ctx.body = { existed: fs.existsSync(filepath) };
        },
        validate: { files: z.object({ test_file: zFile() }) },
      });

      const app = createApp(router);

      const res = await request(app).post('/').attach('test_file', 'package.json');

      // Files are unlinked asynchronously once the response closes
      for (let i = 0; i < 100 && fs.existsSync(filepath); i++) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      assert(res.body.existed === true);
      assert(!fs.existsSync(filepath));
      assert.deepStrictEqual(fs.readdirSync(uploadDir), []);
      fs.rmSync(uploadDir, { recursive: true });
    });

    it('use specs that do not validate body or files should leave multipart parsing to the route', async () => {
      const router = zodRouter({ zodRouter: { enableMultipart: true } });

      router.use({
        handler: async (_ctx, next) => {
          await next();
        },
        validate: { headers: z.object({ 'x-api-key': z.string() }) },
      });

      router.register({
        method: 'post',
        path: '/',
        handler: (ctx) => {
          ctx.body = { filename: ctx.request.files.test_file.toJSON().originalFilename };
        },
        validate: { files: z.object({ test_file: zFile() }) },
      });

      const app = createApp(router);

      const res = await request(app).post('/').set('x-api-key', 'key').attach('test_file', 'package.json');

      assert(res.status === 200);
      assert(res.body.filename === 'package.json');
    });
  });
});
