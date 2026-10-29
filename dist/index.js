"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  createRouteSpec: () => createRouteSpec,
  createUseSpec: () => createUseSpec,
  default: () => index_default,
  routerSpecFactory: () => routerSpecFactory,
  zFile: () => zFile,
  zodRouter: () => zod_router_default
});
module.exports = __toCommonJS(index_exports);

// src/zod-router.ts
var import_koa_bodyparser = __toESM(require("koa-bodyparser"));
var import_router = __toESM(require("@koa/router"));

// src/util.ts
var import_formidable = __toESM(require("formidable"));
var import_zod = require("zod");
var { FormidableError } = import_formidable.default.errors;
var flatten = (middlewares) => {
  const flattened = middlewares.reduce((acc, curr) => {
    if (!curr) {
      return acc;
    }
    if (Array.isArray(curr)) {
      return acc.concat(flatten(curr));
    }
    return acc.concat(curr);
  }, []);
  return flattened;
};
var prepareMiddleware = (input) => {
  return flatten(input);
};
async function noopMiddleware(_ctx, next) {
  await next();
}
var assertPath = (val) => {
  if (typeof val === "string") {
    return true;
  }
  if (val instanceof RegExp) {
    return true;
  }
  return false;
};
var assertValidation = (val) => {
  const props = ["headers", "body", "query", "params", "files", "response"];
  if (typeof val === "object") {
    for (const prop of props) {
      if (val[prop]) {
        return true;
      }
    }
  }
  return false;
};
var assertHandlers = (val) => {
  if (Array.isArray(val)) {
    for (const fn of val) {
      if (typeof fn !== "function") {
        return false;
      }
    }
  } else if (typeof val !== "function") {
    return false;
  }
  return true;
};
var assertUseSpec = (val) => {
  if (typeof val === "object" && val["handler"]) {
    return true;
  }
  return false;
};
var assertRouteFnSpec = (val) => {
  if (typeof val === "object" && val["handler"] && val["path"]) {
    return true;
  }
  return false;
};
var zFile = () => {
  return import_zod.z.instanceof(import_formidable.default.PersistentFile).or(import_zod.z.instanceof(import_formidable.default.VolatileFile));
};
var assertFormidableError = (val) => {
  if (val instanceof FormidableError) {
    return true;
  }
  return false;
};
var assertZodValidationError = (val) => {
  if (val?.error instanceof import_zod.ZodError) {
    return true;
  }
  return false;
};
var createRouteSpec = (spec) => {
  return spec;
};
var createUseSpec = (spec) => {
  return spec;
};
var routerSpecFactory = () => {
  const _createUseSpec = (spec) => {
    return createUseSpec(spec);
  };
  const _createRouteSpec = (spec) => {
    return createRouteSpec(spec);
  };
  return {
    createUseSpec: _createUseSpec,
    createRouteSpec: _createRouteSpec
  };
};
var methods = [
  "acl",
  "bind",
  "checkout",
  "connect",
  "copy",
  "delete",
  "get",
  "head",
  "link",
  "lock",
  "m-search",
  "merge",
  "mkactivity",
  "mkcalendar",
  "mkcol",
  "move",
  "notify",
  "options",
  "patch",
  "post",
  "propfind",
  "proppatch",
  "purge",
  "put",
  "rebind",
  "report",
  "search",
  "source",
  "subscribe",
  "trace",
  "unbind",
  "unlink",
  "unlock",
  "unsubscribe"
];

// src/validation-middleware.ts
var import_zod2 = require("zod");
var ValidationError = class extends Error {
  constructor(error) {
    super("VALIDATION_ERROR", { cause: error });
  }
};
var validate = async (data, schema, requestParameter) => {
  if (!schema) {
    return void 0;
  }
  const parsed = await schema.safeParseAsync(data);
  if (!parsed.success) {
    return {
      requestParameter,
      error: parsed.error
    };
  }
  return parsed.data;
};
var serializeError = (error) => ({ issues: error.issues, name: error.name });
var serializeInvalid = (invalid) => Object.fromEntries(
  Object.entries(invalid).map(([key, value]) => [key, value instanceof import_zod2.ZodError ? serializeError(value) : value])
);
var addParsedProps = (ctxProp, parsed) => {
  if (parsed && !(parsed instanceof import_zod2.ZodError)) {
    Object.entries(parsed).forEach(([k, v]) => {
      ctxProp[k] = v;
    });
  }
};
var replaceParsedProps = (ctxProp, parsed) => {
  if (parsed && !(parsed instanceof import_zod2.ZodError)) {
    Object.keys(ctxProp).forEach((k) => {
      if (!Object.hasOwn(parsed, k)) {
        delete ctxProp[k];
      }
    });
  }
  addParsedProps(ctxProp, parsed);
};
var validationMiddleware = (validation, opts) => {
  if (!assertValidation(validation)) {
    return noopMiddleware;
  }
  return async (ctx, next) => {
    const validated = await Promise.all([
      validate(ctx.request.headers, validation.headers, "headers"),
      validate(ctx.request.params, validation.params, "params"),
      validate(ctx.request.query, validation.query, "query"),
      validate(ctx.request.body, validation.body, "body"),
      validate(ctx.request.files, validation.files, "files")
    ]);
    const inputErrors = validated.reduce(
      (acc, curr) => {
        if (assertZodValidationError(curr)) {
          acc[curr.requestParameter] = curr.error;
        }
        return acc;
      },
      { error: false }
    );
    const hasInputErrors = Boolean(
      inputErrors.body || inputErrors.files || inputErrors.headers || inputErrors.params || inputErrors.query
    );
    if (hasInputErrors && !validation.continueOnError && !opts?.validationErrorHandler) {
      if (opts?.exposeRequestErrors) {
        ctx.response.status = 400;
        ctx.type = "json";
        ctx.body = { error: serializeInvalid(inputErrors) };
        ctx.app.emit("error", new ValidationError({ inputErrors }), ctx);
        return;
      } else {
        ctx.throw(400, "VALIDATION_ERROR");
      }
    }
    if (hasInputErrors) {
      inputErrors.error = true;
      ctx.invalid = inputErrors;
    } else {
      ctx.invalid = { error: false };
      const [headers, params, query, body, files] = validated;
      addParsedProps(ctx.request.headers, headers);
      addParsedProps(ctx.request.params, params);
      replaceParsedProps(ctx.request.query, query);
      if (validation.body) {
        ctx.request.body = body;
      }
      if (validation.files) {
        ctx.request.files = files;
      }
    }
    await next();
    if (hasInputErrors && (ctx.status < 200 || ctx.status >= 300)) {
      return;
    }
    const output = await validate(ctx.body, validation.response, "response");
    if (!output) {
      return;
    }
    if (assertZodValidationError(output)) {
      if (opts?.exposeResponseErrors) {
        ctx.status = 500;
        ctx.type = "json";
        ctx.body = { error: { response: serializeError(output.error) } };
        ctx.app.emit("error", new ValidationError({ output }), ctx);
        return;
      }
      ctx.throw(500);
    } else {
      ctx.body = output;
    }
  };
};

// src/multipart-parser-middleware.ts
var import_node_fs = require("fs");
var import_formidable2 = __toESM(require("formidable"));
var removeUploadedFiles = (files) => {
  Object.values(files).flat().forEach((file) => (0, import_node_fs.unlink)(file.filepath, () => {
  }));
};
var multipartParserMiddleware = (options, acceptFiles = true) => {
  return async (ctx, next) => {
    if (!ctx.is("multipart") || ctx.request.files !== void 0) {
      await next();
      return;
    }
    const form = (0, import_formidable2.default)({ multiples: true, ...options, ...!acceptFiles && { filter: () => false } });
    try {
      await new Promise((resolve, reject) => {
        form.parse(ctx.req, (err, fields, files) => {
          if (err) {
            reject(err);
            return;
          }
          ctx.request.body = fields;
          ctx.request.files = files;
          ctx.res.once("close", () => removeUploadedFiles(files));
          resolve();
        });
      });
      await next();
    } catch (err) {
      if (assertFormidableError(err)) {
        if (err.httpCode && err.httpCode >= 400 && err.httpCode < 500) {
          ctx.status = err.httpCode;
          ctx.app.emit("error", err, ctx);
          return;
        }
      }
      ctx.throw(500, err);
    }
  };
};

// src/zod-router.ts
var zodRouter = (opts) => {
  const _router = new import_router.default(opts?.koaRouter);
  _router.use((0, import_koa_bodyparser.default)(opts?.bodyParser));
  const specMiddleware = (spec, parseMultipart) => prepareMiddleware([
    spec.pre,
    opts?.zodRouter?.enableMultipart && parseMultipart ? multipartParserMiddleware(opts.formidable, Boolean(spec.validate?.files)) : void 0,
    validationMiddleware(spec.validate, opts?.zodRouter),
    opts?.zodRouter?.validationErrorHandler,
    spec.handler
  ]);
  function all() {
    return _router.all(...arguments);
  }
  function allowedMethods(options) {
    return _router.allowedMethods(options);
  }
  function match(path, method) {
    return _router.match(path, method);
  }
  function middleware() {
    return _router.middleware();
  }
  function param(path, middleware2) {
    return _router.param(path, middleware2);
  }
  function prefix(path) {
    return _router.prefix(path);
  }
  function redirect(source, destination, code) {
    return _router.redirect(source, destination, code);
  }
  function route(name) {
    return _router.route(name);
  }
  function routes() {
    return _router.routes();
  }
  function url(name, params, options) {
    return _router.url(name, params, options);
  }
  function use() {
    if (assertUseSpec(arguments[0])) {
      const spec = arguments[0];
      const middleware2 = specMiddleware(spec, Boolean(spec.validate?.body || spec.validate?.files));
      if (assertPath(spec.path)) {
        return _router.use(spec.path, ...middleware2);
      } else {
        return _router.use(...middleware2);
      }
    }
    return _router.use(...arguments);
  }
  function register(spec) {
    if (!spec.method) {
      throw new Error(`HTTP Method missing in spec ${spec.path}`);
    }
    const methodsParam = Array.isArray(spec.method) ? spec.method : [spec.method];
    const name = spec.name ? spec.name : null;
    _router.register(spec.path, methodsParam, specMiddleware(spec, true), {
      name,
      pathAsRegExp: spec.path instanceof RegExp
    });
    return _router;
  }
  const makeRouteMethods = () => methods.reduce((acc, method) => {
    acc[method] = (pathOrSpec, handler, validationOptions) => {
      if (assertPath(pathOrSpec) && assertHandlers(handler)) {
        register({
          method,
          path: pathOrSpec,
          handler,
          validate: validationOptions
        });
        return _router;
      }
      if (assertRouteFnSpec(pathOrSpec)) {
        register({
          ...pathOrSpec,
          method
        });
        return _router;
      }
      throw new Error("Invalid route arguments");
    };
    return acc;
  }, {});
  return {
    ...makeRouteMethods(),
    register,
    use,
    router: _router,
    opts: _router.opts,
    params: _router.params,
    stack: _router.stack,
    all,
    allowedMethods,
    match,
    methods: _router.methods,
    middleware,
    param,
    prefix,
    redirect,
    route,
    routes,
    url
  };
};
var zod_router_default = zodRouter;

// src/index.ts
var index_default = zod_router_default;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createRouteSpec,
  createUseSpec,
  routerSpecFactory,
  zFile,
  zodRouter
});
