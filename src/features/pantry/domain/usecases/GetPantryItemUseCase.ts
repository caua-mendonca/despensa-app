import { AppError } from '@/core/errors/AppError';
import { fail, ok, runCatching, type Result } from '@/core/errors/Result';
import type { PantryItem } from '../entities/PantryItem';
import type { PantryRepository } from '../repositories/PantryRepository';

export class GetPantryItemUseCase {
  constructor(private readonly repository: PantryRepository) {}

  async execute(userId: string, id: string): Promise<Result<PantryItem>> {
    const result = await runCatching(() => this.repository.getById(userId, id), 'DATABASE');
    if (!result.ok) return result;
    return result.value ? ok(result.value) : fail(new AppError('NOT_FOUND', 'Item não encontrado.'));
  }
}
