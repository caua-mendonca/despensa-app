import { z } from 'zod';

import { AppError, type FieldErrors } from '@/core/errors/AppError';
import { fail, ok, type Result } from '@/core/errors/Result';

export const MIN_PASSWORD_LENGTH = 6;

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Informe um e-mail válido.')),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`),
});

export type Credentials = z.infer<typeof credentialsSchema>;

export function validateCredentials(input: Credentials): Result<Credentials> {
  const parsed = credentialsSchema.safeParse(input);
  if (parsed.success) return ok(parsed.data);

  const fieldErrors: FieldErrors = {};
  for (const issue of parsed.error.issues) {
    fieldErrors[String(issue.path[0])] ??= issue.message;
  }
  return fail(new AppError('VALIDATION', 'Verifique os campos destacados.', fieldErrors));
}
