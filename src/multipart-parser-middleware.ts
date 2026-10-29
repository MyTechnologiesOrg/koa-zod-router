import { unlink } from 'node:fs';
import { DefaultContext, Next } from 'koa';
import formidable from 'formidable';
import { assertFormidableError } from './util';

// Uploads are temp files for the lifetime of the request. Handlers that want to
// keep one must move or copy it before the response finishes.
const removeUploadedFiles = (files: formidable.Files) => {
  Object.values(files)
    .flat()
    .forEach((file) => unlink(file.filepath, () => {}));
};

export const multipartParserMiddleware = (options?: formidable.Options, acceptFiles = true) => {
  return async (ctx: DefaultContext, next: Next) => {
    // A request body can only be read once, so skip if an earlier spec parsed it.
    if (!ctx.is('multipart') || ctx.request.files !== undefined) {
      await next();
      return;
    }

    // Without a files schema, drop file parts instead of writing them to disk.
    const form = formidable({ multiples: true, ...options, ...(!acceptFiles && { filter: () => false }) });

    try {
      await new Promise<void>((resolve, reject) => {
        form.parse(ctx.req, (err, fields, files) => {
          if (err) {
            reject(err);
            return;
          }

          ctx.request.body = fields;
          ctx.request.files = files;
          ctx.res.once('close', () => removeUploadedFiles(files));
          resolve();
        });
      });
      await next();
    } catch (err) {
      if (assertFormidableError(err)) {
        if (err.httpCode && err.httpCode >= 400 && err.httpCode < 500) {
          ctx.status = err.httpCode;
          ctx.app.emit('error', err, ctx);
          return;
        }
      }
      ctx.throw(500, err);
    }
  };
};
