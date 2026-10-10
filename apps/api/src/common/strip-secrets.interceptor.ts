import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

const SECRET_KEYS = new Set(['passwordHash']);
const MAX_DEPTH = 12;

/** Removes secret fields in place from plain objects and arrays, however deeply nested. */
export function stripSecrets(value: unknown, depth = 0): void {
  if (depth > MAX_DEPTH || value === null || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) stripSecrets(item, depth + 1);
    return;
  }
  // Leave class instances alone: Date, Decimal, Buffer, StreamableFile.
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) return;

  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (SECRET_KEYS.has(key)) delete record[key];
    else stripSecrets(record[key], depth + 1);
  }
}

/** Person rows are embedded in many responses; this keeps their secrets out of all of them. */
@Injectable()
export class StripSecretsInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(tap((body) => stripSecrets(body)));
  }
}
