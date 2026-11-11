export type AppErrorCode =
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'NETWORK'
  | 'AUTH'
  | 'DATABASE'
  | 'REMOTE'
  | 'UNKNOWN';

export type FieldErrors = Partial<Record<string, string>>;

/**
 * Erro de aplicação tipado. Todas as camadas convertem exceções de bibliotecas
 * (SQLite, Supabase, rede) para este formato antes de chegarem à UI.
 */
export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
    public readonly fieldErrors?: FieldErrors,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static from(error: unknown, fallbackCode: AppErrorCode = 'UNKNOWN'): AppError {
    if (error instanceof AppError) return error;
    const message = error instanceof Error ? error.message : 'Ocorreu um erro inesperado.';
    return new AppError(fallbackCode, message, undefined, error);
  }
}
