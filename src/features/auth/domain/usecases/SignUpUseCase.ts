import { AppError } from '@/core/errors/AppError';
import { fail, runCatching, type Result } from '@/core/errors/Result';
import type { AuthRepository, SignUpOutcome } from '../repositories/AuthRepository';
import { validateCredentials, type Credentials } from '../validation/credentialsSchema';

export interface SignUpInput extends Credentials {
  confirmPassword: string;
}

export class SignUpUseCase {
  constructor(private readonly repository: AuthRepository) {}

  async execute({ confirmPassword, ...credentials }: SignUpInput): Promise<Result<SignUpOutcome>> {
    const validation = validateCredentials(credentials);
    if (!validation.ok) return validation;

    if (confirmPassword !== credentials.password) {
      return fail(
        new AppError('VALIDATION', 'Verifique os campos destacados.', {
          confirmPassword: 'As senhas não conferem.',
        }),
      );
    }

    const { email, password } = validation.value;
    return runCatching(() => this.repository.signUp(email, password), 'AUTH');
  }
}
