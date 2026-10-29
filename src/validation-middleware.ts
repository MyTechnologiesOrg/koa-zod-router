import { DefaultContext, Next } from 'koa';
import { ZodError, ZodType } from 'zod';
import { ValidationOptions, RouterOpts, ZodValidationError, ZodRouterInvalid } from './types';
import { assertValidation, assertZodValidationError, noopMiddleware } from './util';

class ValidationError extends Error {
  constructor(error: {}) {
    super('VALIDATION_ERROR', { cause: error });
  }
}

const validate = async <T>(
  data: unknown,
  schema: ZodType<any, any> | undefined,
  requestParameter: string,
): Promise<ZodValidationError<T> | Record<string, any> | undefined> => {
  if (!schema) {
    return undefined;
  }

  const parsed = await schema.safeParseAsync(data);
  if (!parsed.success) {
    return {
      requestParameter,
      error: parsed.error,
    } as ZodValidationError<T>;
  }

  return parsed.data;
};

// Zod 4 makes ZodError#issues non-enumerable, so JSON.stringify drops it.
// Serialize explicitly to keep the `{ issues, name }` shape Zod 3 produced.
const serializeError = (error: ZodError) => ({ issues: error.issues, name: error.name });

// Only the per-scope ZodErrors; the `error` flag is for `ctx.invalid` and is always false in a 400 body.
const serializeInvalid = <H, P, Q, B, F>(invalid: ZodRouterInvalid<H, P, Q, B, F>) =>
  Object.fromEntries(
    Object.entries(invalid).flatMap(([key, value]) =>
      value instanceof ZodError ? [[key, serializeError(value)]] : [],
    ),
  );

const addParsedProps = (ctxProp: Record<string, any>, parsed?: Record<string, any> | ZodError<unknown>) => {
  if (parsed && !(parsed instanceof ZodError)) {
    Object.entries(parsed).forEach(([k, v]) => {
      ctxProp[k] = v;
    });
  }
};

// Like addParsedProps, but also deletes keys the schema stripped or transformed
// away so they can't reach handlers. Works in place because Koa caches the
// ctx.request.query object and its setter would stringify coerced values.
const replaceParsedProps = (ctxProp: Record<string, any>, parsed?: Record<string, any> | ZodError<unknown>) => {
  if (parsed && !(parsed instanceof ZodError)) {
    Object.keys(ctxProp).forEach((k) => {
      if (!Object.hasOwn(parsed, k)) {
        delete ctxProp[k];
      }
    });
  }
  addParsedProps(ctxProp, parsed);
};

export const validationMiddleware = <H, P, Q, B, F, R>(
  validation?: ValidationOptions<H, P, Q, B, F, R>,
  opts?: RouterOpts['zodRouter'],
) => {
  if (!assertValidation(validation)) {
    return noopMiddleware;
  }

  return async (ctx: DefaultContext, next: Next) => {
    const validated = await Promise.all([
      validate<H>(ctx.request.headers, validation.headers, 'headers'),
      validate<P>(ctx.request.params, validation.params, 'params'),
      validate<Q>(ctx.request.query, validation.query, 'query'),
      validate<B>(ctx.request.body, validation.body, 'body'),
      validate<F>(ctx.request.files, validation.files, 'files'),
    ]);

    const inputErrors = validated.reduce<ZodRouterInvalid<H, P, Q, B, F>>(
      (acc, curr) => {
        if (assertZodValidationError(curr)) {
          (acc[curr.requestParameter] as typeof curr.error) = curr.error;
        }

        return acc;
      },
      { error: false },
    );

    const hasInputErrors = Boolean(
      inputErrors.body || inputErrors.files || inputErrors.headers || inputErrors.params || inputErrors.query,
    );

    if (hasInputErrors && !validation.continueOnError && !opts?.validationErrorHandler) {
      if (opts?.exposeRequestErrors) {
        ctx.response.status = 400;
        ctx.type = 'json';
        ctx.body = { error: serializeInvalid(inputErrors) };
        ctx.app.emit('error', new ValidationError({ inputErrors }), ctx);
        return;
      } else {
        ctx.throw(400, 'VALIDATION_ERROR');
      }
    }

    if (hasInputErrors) {
      inputErrors.error = true;
      ctx.invalid = inputErrors;
    } else {
      ctx.invalid = { error: false };

      const [headers, params, query, body, files] = validated;

      // Headers and params are merged: other middleware relies on the full
      // header set, and params come from the route pattern, not the client.
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

    // After invalid input, the error handling may send its own error response or
    // redirect; only a successful response still has to match the schema.
    if (hasInputErrors && (ctx.status < 200 || ctx.status >= 300)) {
      return;
    }

    const output = await validate<R>(ctx.body, validation.response, 'response');

    if (!output) {
      return;
    }

    if (assertZodValidationError<R>(output)) {
      if (opts?.exposeResponseErrors) {
        ctx.status = 500;
        ctx.type = 'json';
        ctx.body = { error: { response: serializeError(output.error) } };
        ctx.app.emit('error', new ValidationError({ output }), ctx);
        return;
      }

      ctx.throw(500);
    } else {
      ctx.body = output;
    }
  };
};
