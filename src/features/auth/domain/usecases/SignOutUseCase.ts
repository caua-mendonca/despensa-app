import { runCatching, type Result } from '@/core/errors/Result';
import type { AuthRepository } from '../repositories/AuthRepository';

export class SignOutUseCase {
  constructor(private readonly repository: AuthRepository) {}

  execute(): Promise<Result<void>> {
    return runCatching(() => this.repository.signOut(), 'AUTH');
  }
}
