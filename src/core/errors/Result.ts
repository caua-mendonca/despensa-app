import { AppError, type AppErrorCode } from './AppError';

export type Result<T> = { ok: true; value: T } | { ok: false; error: AppError };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });

export const fail = <T = never>(error: AppError): Result<T> => ({ ok: false, error });

/** Executa uma operação assíncrona e converte qualquer exceção em `Result`. */
export async function runCatching<T>(
  operation: () => Promise<T>,
  fallbackCode: AppErrorCode = 'UNKNOWN',
): Promise<Result<T>> {
  try {
    return ok(await operation());
  } catch (error) {
    return fail(AppError.from(error, fallbackCode));
  }
}
