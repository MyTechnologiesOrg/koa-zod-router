import * as KoaRouter from '@koa/router';
import KoaRouter__default, { LayerOptions, RouterOptions, RouterMiddleware, RouterParameterMiddleware } from '@koa/router';
import * as zod_v4_core from 'zod/v4/core';
import formidable from 'formidable';
import { Response, Middleware, Context, Request, DefaultState, DefaultContext } from 'koa';
import bodyParser from 'koa-bodyparser';
import { ZodError, ZodType, z } from 'zod';
import PersistentFile from 'formidable/PersistentFile';

type Method = 'acl' | 'bind' | 'checkout' | 'connect' | 'copy' | 'delete' | 'get' | 'head' | 'link' | 'lock' | 'm-search' | 'merge' | 'mkactivity' | 'mkcalendar' | 'mkcol' | 'move' | 'notify' | 'options' | 'patch' | 'post' | 'propfind' | 'proppatch' | 'purge' | 'put' | 'rebind' | 'report' | 'search' | 'source' | 'subscribe' | 'trace' | 'unbind' | 'unlink' | 'unlock' | 'unsubscribe';
interface ZodRouterInvalid<Headers, Params, Query, Body, Files> {
    body?: ZodError<Body>;
    headers?: ZodError<Headers>;
    params?: ZodError<Params>;
    query?: ZodError<Query>;
    files?: ZodError<Files>;
    error?: boolean;
}
type ZodValidationError<T> = {
    requestParameter: 'body' | 'headers' | 'params' | 'query' | 'files';
    error: ZodError<T>;
};
interface ZodContext<Headers, Params, Query, Body, Files> extends Context {
    request: {
        body: Body;
        headers: Headers;
        params: Params;
        query: Query;
        files: Files;
    } & Request;
    invalid: ZodRouterInvalid<Headers, Params, Query, Body, Files>;
}
type ValidationOptions<Headers, Params, Query, Body, Files, Response> = {
    continueOnError?: boolean;
    headers?: ZodType<Headers, any>;
    body?: ZodType<Body, any>;
    params?: ZodType<Params, any>;
    query?: ZodType<Query, any>;
    files?: ZodType<Files, any>;
    response?: ZodType<Response, any>;
};
type ZodMiddleware<S, H, P, Q, B, F, R = Response['ctx']> = Middleware<S, ZodContext<H, P, Q, B, F>, R> | Middleware<S, ZodContext<H, P, Q, B, F>, R>[];
type Spec<S, H, P, Q, B, F, R> = {
    name?: string;
    path: string | RegExp;
    handler: ZodMiddleware<S, H, P, Q, B, F, R>;
    pre?: ZodMiddleware<S, H, P, Q, B, F, R>;
    validate?: ValidationOptions<H, P, Q, B, F, R>;
    opts?: LayerOptions;
};
type RegisterSpec<S, H, P, Q, B, F, R> = {
    method: Method | Method[];
} & Spec<S, H, P, Q, B, F, R>;
type RouteSpec<S, H, P, Q, B, F, R> = {
    method?: Method | Method[];
} & Spec<S, H, P, Q, B, F, R>;
type UseSpec<S, H, P, Q, B, F, R> = {
    handler: ZodMiddleware<S, H, P, Q, B, F, R>;
    path?: string;
    pre?: ZodMiddleware<S, H, P, Q, B, F, R>;
    validate?: ValidationOptions<H, P, Q, B, F, R>;
};
declare function RouterMethodFn<S, H, P, Q, B, F, R>(path: string | RegExp, handler: ZodMiddleware<S, H, P, Q, B, F, R>, validationOptions?: ValidationOptions<H, P, Q, B, F, R>): KoaRouter__default;
declare function RouterMethodFn<S, H, P, Q, B, F, R>(spec: Spec<S, H, P, Q, B, F, R>): KoaRouter__default;
type RouterMethod = typeof RouterMethodFn;
type RouterMethods = {
    [key in Method]: RouterMethod;
};
type ZodRouter = ReturnType<typeof zodRouter>;
type ValidationErrorHandler<S = DefaultState> = ZodMiddleware<S, any, any, any, any, any, any>;
interface RouterOpts {
    bodyParser?: bodyParser.Options;
    formidable?: formidable.Options;
    koaRouter?: RouterOptions;
    zodRouter?: {
        enableMultipart?: boolean;
        exposeRequestErrors?: boolean;
        exposeResponseErrors?: boolean;
        validationErrorHandler?: ValidationErrorHandler;
    };
}

declare const zodRouter: <RouterState = DefaultState>(opts?: RouterOpts) => {
    readonly register: <H, P, Q, B, F, R>(spec: RegisterSpec<RouterState, H, P, Q, B, F, R> | RouteSpec<RouterState, H, P, Q, B, F, R>) => KoaRouter__default<RouterState, DefaultContext>;
    readonly use: {
        <State = RouterState, Context = DefaultContext>(...middleware: Array<RouterMiddleware<State, Context>>): KoaRouter__default<State, Context>;
        <State = RouterState, Context_1 = DefaultContext>(path: string | string[] | RegExp, ...middleware: Array<RouterMiddleware<State, Context_1>>): KoaRouter__default;
        <State = RouterState, Headers = ZodType<unknown, unknown, zod_v4_core.$ZodTypeInternals<unknown, unknown>>, Params = ZodType<unknown, unknown, zod_v4_core.$ZodTypeInternals<unknown, unknown>>, Query = ZodType<unknown, unknown, zod_v4_core.$ZodTypeInternals<unknown, unknown>>, Body = ZodType<unknown, unknown, zod_v4_core.$ZodTypeInternals<unknown, unknown>>, Files = ZodType<unknown, unknown, zod_v4_core.$ZodTypeInternals<unknown, unknown>>, Response = ZodType<unknown, unknown, zod_v4_core.$ZodTypeInternals<unknown, unknown>>>(spec: UseSpec<State, Headers, Params, Query, Body, Files, Response>): KoaRouter__default;
    };
    readonly router: KoaRouter__default<RouterState, DefaultContext>;
    readonly opts: KoaRouter.RouterOptions;
    readonly params: Record<string, RouterParameterMiddleware<RouterState, DefaultContext, unknown> | RouterParameterMiddleware<RouterState, DefaultContext, unknown>[]>;
    readonly stack: KoaRouter.Layer<RouterState, DefaultContext, unknown>[];
    readonly all: KoaRouter__default["all"];
    readonly allowedMethods: KoaRouter__default["allowedMethods"];
    readonly match: KoaRouter__default["match"];
    readonly methods: KoaRouter__default["methods"];
    readonly middleware: KoaRouter__default["middleware"];
    readonly param: KoaRouter__default["param"];
    readonly prefix: KoaRouter__default["prefix"];
    readonly redirect: KoaRouter__default["redirect"];
    readonly route: KoaRouter__default["route"];
    readonly routes: KoaRouter__default["routes"];
    readonly url: KoaRouter__default["url"];
    readonly acl: {
        <S, H, P_1, Q_1, B_1, F_1, R_1>(path: string | RegExp, handler: ZodMiddleware<S, H, P_1, Q_1, B_1, F_1, R_1>, validationOptions?: ValidationOptions<H, P_1, Q_1, B_1, F_1, R_1>): KoaRouter__default;
        <S, H_1, P_2, Q_2, B_2, F_2, R_2>(spec: Spec<S, H_1, P_2, Q_2, B_2, F_2, R_2>): KoaRouter__default;
    };
    readonly bind: {
        <S, H, P_1, Q_1, B_1, F_1, R_1>(path: string | RegExp, handler: ZodMiddleware<S, H, P_1, Q_1, B_1, F_1, R_1>, validationOptions?: ValidationOptions<H, P_1, Q_1, B_1, F_1, R_1>): KoaRouter__default;
        <S, H_1, P_2, Q_2, B_2, F_2, R_2>(spec: Spec<S, H_1, P_2, Q_2, B_2, F_2, R_2>): KoaRouter__default;
    };
    readonly checkout: {
        <S, H, P_1, Q_1, B_1, F_1, R_1>(path: string | RegExp, handler: ZodMiddleware<S, H, P_1, Q_1, B_1, F_1, R_1>, validationOptions?: ValidationOptions<H, P_1, Q_1, B_1, F_1, R_1>): KoaRouter__default;
        <S, H_1, P_2, Q_2, B_2, F_2, R_2>(spec: Spec<S, H_1, P_2, Q_2, B_2, F_2, R_2>): KoaRouter__default;
    };
    readonly connect: {
        <S, H, P_1, Q_1, B_1, F_1, R_1>(path: string | RegExp, handler: ZodMiddleware<S, H, P_1, Q_1, B_1, F_1, R_1>, validationOptions?: ValidationOptions<H, P_1, Q_1, B_1, F_1, R_1>): KoaRouter__default;
        <S, H_1, P_2, Q_2, B_2, F_2, R_2>(spec: Spec<S, H_1, P_2, Q_2, B_2, F_2, R_2>): KoaRouter__default;
    };
    readonly copy: {
        <S, H, P_1, Q_1, B_1, F_1, R_1>(path: string | RegExp, handler: ZodMiddleware<S, H, P_1, Q_1, B_1, F_1, R_1>, validationOptions?: ValidationOptions<H, P_1, Q_1, B_1, F_1, R_1>): KoaRouter__default;
        <S, H_1, P_2, Q_2, B_2, F_2, R_2>(spec: Spec<S, H_1, P_2, Q_2, B_2, F_2, R_2>): KoaRouter__default;
    };
    readonly delete: {
        <S, H, P_1, Q_1, B_1, F_1, R_1>(path: string | RegExp, handler: ZodMiddleware<S, H, P_1, Q_1, B_1, F_1, R_1>, validationOptions?: ValidationOptions<H, P_1, Q_1, B_1, F_1, R_1>): KoaRouter__default;
        <S, H_1, P_2, Q_2, B_2, F_2, R_2>(spec: Spec<S, H_1, P_2, Q_2, B_2, F_2, R_2>): KoaRouter__default;
    };
    readonly get: {
        <S, H, P_1, Q_1, B_1, F_1, R_1>(path: string | RegExp, handler: ZodMiddleware<S, H, P_1, Q_1, B_1, F_1, R_1>, validationOptions?: ValidationOptions<H, P_1, Q_1, B_1, F_1, R_1>): KoaRouter__default;
        <S, H_1, P_2, Q_2, B_2, F_2, R_2>(spec: Spec<S, H_1, P_2, Q_2, B_2, F_2, R_2>): KoaRouter__default;
    };
    readonly head: {
        <S, H, P_1, Q_1, B_1, F_1, R_1>(path: string | RegExp, handler: ZodMiddleware<S, H, P_1, Q_1, B_1, F_1, R_1>, validationOptions?: ValidationOptions<H, P_1, Q_1, B_1, F_1, R_1>): KoaRouter__default;
        <S, H_1, P_2, Q_2, B_2, F_2, R_2>(spec: Spec<S, H_1, P_2, Q_2, B_2, F_2, R_2>): KoaRouter__default;
    };
    readonly link: {
        <S, H, P_1, Q_1, B_1, F_1, R_1>(path: string | RegExp, handler: ZodMiddleware<S, H, P_1, Q_1, B_1, F_1, R_1>, validationOptions?: ValidationOptions<H, P_1, Q_1, B_1, F_1, R_1>): KoaRouter__default;
        <S, H_1, P_2, Q_2, B_2, F_2, R_2>(spec: Spec<S, H_1, P_2, Q_2, B_2, F_2, R_2>): KoaRouter__default;
    };
    readonly lock: {
        <S, H, P_1, Q_1, B_1, F_1, R_1>(path: string | RegExp, handler: ZodMiddleware<S, H, P_1, Q_1, B_1, F_1, R_1>, validationOptions?: ValidationOptions<H, P_1, Q_1, B_1, F_1, R_1>): KoaRouter__default;
        <S, H_1, P_2, Q_2, B_2, F_2, R_2>(spec: Spec<S, H_1, P_2, Q_2, B_2, F_2, R_2>): KoaRouter__default;
    };
    readonly "m-search": {
        <S, H, P_1, Q_1, B_1, F_1, R_1>(path: string | RegExp, handler: ZodMiddleware<S, H, P_1, Q_1, B_1, F_1, R_1>, validationOptions?: ValidationOptions<H, P_1, Q_1, B_1, F_1, R_1>): KoaRouter__default;
        <S, H_1, P_2, Q_2, B_2, F_2, R_2>(spec: Spec<S, H_1, P_2, Q_2, B_2, F_2, R_2>): KoaRouter__default;
    };
    readonly merge: {
        <S, H, P_1, Q_1, B_1, F_1, R_1>(path: string | RegExp, handler: ZodMiddleware<S, H, P_1, Q_1, B_1, F_1, R_1>, validationOptions?: ValidationOptions<H, P_1, Q_1, B_1, F_1, R_1>): KoaRouter__default;
        <S, H_1, P_2, Q_2, B_2, F_2, R_2>(spec: Spec<S, H_1, P_2, Q_2, B_2, F_2, R_2>): KoaRouter__default;
    };
    readonly mkactivity: {
        <S, H, P_1, Q_1, B_1, F_1, R_1>(path: string | RegExp, handler: ZodMiddleware<S, H, P_1, Q_1, B_1, F_1, R_1>, validationOptions?: ValidationOptions<H, P_1, Q_1, B_1, F_1, R_1>): KoaRouter__default;
        <S, H_1, P_2, Q_2, B_2, F_2, R_2>(spec: Spec<S, H_1, P_2, Q_2, B_2, F_2, R_2>): KoaRouter__default;
    };
    readonly mkcalendar: {
        <S, H, P_1, Q_1, B_1, F_1, R_1>(path: string | RegExp, handler: ZodMiddleware<S, H, P_1, Q_1, B_1, F_1, R_1>, validationOptions?: ValidationOptions<H, P_1, Q_1, B_1, F_1, R_1>): KoaRouter__default;
        <S, H_1, P_2, Q_2, B_2, F_2, R_2>(spec: Spec<S, H_1, P_2, Q_2, B_2, F_2, R_2>): KoaRouter__default;
    };
    readonly mkcol: {
        <S, H, P_1, Q_1, B_1, F_1, R_1>(path: string | RegExp, handler: ZodMiddleware<S, H, P_1, Q_1, B_1, F_1, R_1>, validationOptions?: ValidationOptions<H, P_1, Q_1, B_1, F_1, R_1>): KoaRouter__default;
        <S, H_1, P_2, Q_2, B_2, F_2, R_2>(spec: Spec<S, H_1, P_2, Q_2, B_2, F_2, R_2>): KoaRouter__default;
    };
    readonly move: {
        <S, H, P_1, Q_1, B_1, F_1, R_1>(path: string | RegExp, handler: ZodMiddleware<S, H, P_1, Q_1, B_1, F_1, R_1>, validationOptions?: ValidationOptions<H, P_1, Q_1, B_1, F_1, R_1>): KoaRouter__default;
        <S, H_1, P_2, Q_2, B_2, F_2, R_2>(spec: Spec<S, H_1, P_2, Q_2, B_2, F_2, R_2>): KoaRouter__default;
    };
    readonly notify: {
        <S, H, P_1, Q_1, B_1, F_1, R_1>(path: string | RegExp, handler: ZodMiddleware<S, H, P_1, Q_1, B_1, F_1, R_1>, validationOptions?: ValidationOptions<H, P_1, Q_1, B_1, F_1, R_1>): KoaRouter__default;
        <S, H_1, P_2, Q_2, B_2, F_2, R_2>(spec: Spec<S, H_1, P_2, Q_2, B_2, F_2, R_2>): KoaRouter__default;
    };
    readonly options: {
        <S, H, P_1, Q_1, B_1, F_1, R_1>(path: string | RegExp, handler: ZodMiddleware<S, H, P_1, Q_1, B_1, F_1, R_1>, validationOptions?: ValidationOptions<H, P_1, Q_1, B_1, F_1, R_1>): KoaRouter__default;
        <S, H_1, P_2, Q_2, B_2, F_2, R_2>(spec: Spec<S, H_1, P_2, Q_2, B_2, F_2, R_2>): KoaRouter__default;
    };
    readonly patch: {
        <S, H, P_1, Q_1, B_1, F_1, R_1>(path: string | RegExp, handler: ZodMiddleware<S, H, P_1, Q_1, B_1, F_1, R_1>, validationOptions?: ValidationOptions<H, P_1, Q_1, B_1, F_1, R_1>): KoaRouter__default;
        <S, H_1, P_2, Q_2, B_2, F_2, R_2>(spec: Spec<S, H_1, P_2, Q_2, B_2, F_2, R_2>): KoaRouter__default;
    };
    readonly post: {
        <S, H, P_1, Q_1, B_1, F_1, R_1>(path: string | RegExp, handler: ZodMiddleware<S, H, P_1, Q_1, B_1, F_1, R_1>, validationOptions?: ValidationOptions<H, P_1, Q_1, B_1, F_1, R_1>): KoaRouter__default;
        <S, H_1, P_2, Q_2, B_2, F_2, R_2>(spec: Spec<S, H_1, P_2, Q_2, B_2, F_2, R_2>): KoaRouter__default;
    };
    readonly propfind: {
        <S, H, P_1, Q_1, B_1, F_1, R_1>(path: string | RegExp, handler: ZodMiddleware<S, H, P_1, Q_1, B_1, F_1, R_1>, validationOptions?: ValidationOptions<H, P_1, Q_1, B_1, F_1, R_1>): KoaRouter__default;
        <S, H_1, P_2, Q_2, B_2, F_2, R_2>(spec: Spec<S, H_1, P_2, Q_2, B_2, F_2, R_2>): KoaRouter__default;
    };
    readonly proppatch: {
        <S, H, P_1, Q_1, B_1, F_1, R_1>(path: string | RegExp, handler: ZodMiddleware<S, H, P_1, Q_1, B_1, F_1, R_1>, validationOptions?: ValidationOptions<H, P_1, Q_1, B_1, F_1, R_1>): KoaRouter__default;
        <S, H_1, P_2, Q_2, B_2, F_2, R_2>(spec: Spec<S, H_1, P_2, Q_2, B_2, F_2, R_2>): KoaRouter__default;
    };
    readonly purge: {
        <S, H, P_1, Q_1, B_1, F_1, R_1>(path: string | RegExp, handler: ZodMiddleware<S, H, P_1, Q_1, B_1, F_1, R_1>, validationOptions?: ValidationOptions<H, P_1, Q_1, B_1, F_1, R_1>): KoaRouter__default;
        <S, H_1, P_2, Q_2, B_2, F_2, R_2>(spec: Spec<S, H_1, P_2, Q_2, B_2, F_2, R_2>): KoaRouter__default;
    };
    readonly put: {
        <S, H, P_1, Q_1, B_1, F_1, R_1>(path: string | RegExp, handler: ZodMiddleware<S, H, P_1, Q_1, B_1, F_1, R_1>, validationOptions?: ValidationOptions<H, P_1, Q_1, B_1, F_1, R_1>): KoaRouter__default;
        <S, H_1, P_2, Q_2, B_2, F_2, R_2>(spec: Spec<S, H_1, P_2, Q_2, B_2, F_2, R_2>): KoaRouter__default;
    };
    readonly rebind: {
        <S, H, P_1, Q_1, B_1, F_1, R_1>(path: string | RegExp, handler: ZodMiddleware<S, H, P_1, Q_1, B_1, F_1, R_1>, validationOptions?: ValidationOptions<H, P_1, Q_1, B_1, F_1, R_1>): KoaRouter__default;
        <S, H_1, P_2, Q_2, B_2, F_2, R_2>(spec: Spec<S, H_1, P_2, Q_2, B_2, F_2, R_2>): KoaRouter__default;
    };
    readonly report: {
        <S, H, P_1, Q_1, B_1, F_1, R_1>(path: string | RegExp, handler: ZodMiddleware<S, H, P_1, Q_1, B_1, F_1, R_1>, validationOptions?: ValidationOptions<H, P_1, Q_1, B_1, F_1, R_1>): KoaRouter__default;
        <S, H_1, P_2, Q_2, B_2, F_2, R_2>(spec: Spec<S, H_1, P_2, Q_2, B_2, F_2, R_2>): KoaRouter__default;
    };
    readonly search: {
        <S, H, P_1, Q_1, B_1, F_1, R_1>(path: string | RegExp, handler: ZodMiddleware<S, H, P_1, Q_1, B_1, F_1, R_1>, validationOptions?: ValidationOptions<H, P_1, Q_1, B_1, F_1, R_1>): KoaRouter__default;
        <S, H_1, P_2, Q_2, B_2, F_2, R_2>(spec: Spec<S, H_1, P_2, Q_2, B_2, F_2, R_2>): KoaRouter__default;
    };
    readonly source: {
        <S, H, P_1, Q_1, B_1, F_1, R_1>(path: string | RegExp, handler: ZodMiddleware<S, H, P_1, Q_1, B_1, F_1, R_1>, validationOptions?: ValidationOptions<H, P_1, Q_1, B_1, F_1, R_1>): KoaRouter__default;
        <S, H_1, P_2, Q_2, B_2, F_2, R_2>(spec: Spec<S, H_1, P_2, Q_2, B_2, F_2, R_2>): KoaRouter__default;
    };
    readonly subscribe: {
        <S, H, P_1, Q_1, B_1, F_1, R_1>(path: string | RegExp, handler: ZodMiddleware<S, H, P_1, Q_1, B_1, F_1, R_1>, validationOptions?: ValidationOptions<H, P_1, Q_1, B_1, F_1, R_1>): KoaRouter__default;
        <S, H_1, P_2, Q_2, B_2, F_2, R_2>(spec: Spec<S, H_1, P_2, Q_2, B_2, F_2, R_2>): KoaRouter__default;
    };
    readonly trace: {
        <S, H, P_1, Q_1, B_1, F_1, R_1>(path: string | RegExp, handler: ZodMiddleware<S, H, P_1, Q_1, B_1, F_1, R_1>, validationOptions?: ValidationOptions<H, P_1, Q_1, B_1, F_1, R_1>): KoaRouter__default;
        <S, H_1, P_2, Q_2, B_2, F_2, R_2>(spec: Spec<S, H_1, P_2, Q_2, B_2, F_2, R_2>): KoaRouter__default;
    };
    readonly unbind: {
        <S, H, P_1, Q_1, B_1, F_1, R_1>(path: string | RegExp, handler: ZodMiddleware<S, H, P_1, Q_1, B_1, F_1, R_1>, validationOptions?: ValidationOptions<H, P_1, Q_1, B_1, F_1, R_1>): KoaRouter__default;
        <S, H_1, P_2, Q_2, B_2, F_2, R_2>(spec: Spec<S, H_1, P_2, Q_2, B_2, F_2, R_2>): KoaRouter__default;
    };
    readonly unlink: {
        <S, H, P_1, Q_1, B_1, F_1, R_1>(path: string | RegExp, handler: ZodMiddleware<S, H, P_1, Q_1, B_1, F_1, R_1>, validationOptions?: ValidationOptions<H, P_1, Q_1, B_1, F_1, R_1>): KoaRouter__default;
        <S, H_1, P_2, Q_2, B_2, F_2, R_2>(spec: Spec<S, H_1, P_2, Q_2, B_2, F_2, R_2>): KoaRouter__default;
    };
    readonly unlock: {
        <S, H, P_1, Q_1, B_1, F_1, R_1>(path: string | RegExp, handler: ZodMiddleware<S, H, P_1, Q_1, B_1, F_1, R_1>, validationOptions?: ValidationOptions<H, P_1, Q_1, B_1, F_1, R_1>): KoaRouter__default;
        <S, H_1, P_2, Q_2, B_2, F_2, R_2>(spec: Spec<S, H_1, P_2, Q_2, B_2, F_2, R_2>): KoaRouter__default;
    };
    readonly unsubscribe: {
        <S, H, P_1, Q_1, B_1, F_1, R_1>(path: string | RegExp, handler: ZodMiddleware<S, H, P_1, Q_1, B_1, F_1, R_1>, validationOptions?: ValidationOptions<H, P_1, Q_1, B_1, F_1, R_1>): KoaRouter__default;
        <S, H_1, P_2, Q_2, B_2, F_2, R_2>(spec: Spec<S, H_1, P_2, Q_2, B_2, F_2, R_2>): KoaRouter__default;
    };
};

declare const zFile: () => z.ZodType<PersistentFile, PersistentFile>;
declare const createRouteSpec: <State extends DefaultState, H, P, Q, B, F, R>(spec: RouteSpec<State, H, P, Q, B, F, R>) => RouteSpec<State, H, P, Q, B, F, R>;
declare const createUseSpec: <S, H, P, Q, B, F, R>(spec: UseSpec<S, H, P, Q, B, F, R>) => UseSpec<S, H, P, Q, B, F, R>;
declare const routerSpecFactory: <State>() => {
    createUseSpec: <H, P, Q, B, F, R>(spec: UseSpec<State, H, P, Q, B, F, R>) => UseSpec<State, H, P, Q, B, F, R>;
    createRouteSpec: <H, P_1, Q_1, B_1, F_1, R_1>(spec: RouteSpec<State, H, P_1, Q_1, B_1, F_1, R_1>) => RouteSpec<State, H, P_1, Q_1, B_1, F_1, R_1>;
};

export { createRouteSpec, createUseSpec, zodRouter as default, routerSpecFactory, zFile, zodRouter };
export type { Method, RegisterSpec, RouteSpec, RouterMethod, RouterMethods, RouterOpts, Spec, UseSpec, ValidationErrorHandler, ValidationOptions, ZodContext, ZodMiddleware, ZodRouter, ZodRouterInvalid, ZodValidationError };
