import { runCatching, type Result } from '@/core/errors/Result';
import type { User } from '../entities/User';
import type { AuthRepository } from '../repositories/AuthRepository';
import { validateCredentials, type Credentials } from '../validation/credentialsSchema';

export class SignInUseCase {
  constructor(private readonly repository: AuthRepository) {}

  async execute(input: Credentials): Promise<Result<User>> {
    const validation = validateCredentials(input);
    if (!validation.ok) return validation;
    const { email, password } = validation.value;
    return runCatching(() => this.repository.signIn(email, password), 'AUTH');
  }
}
