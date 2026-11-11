import { AppError } from '@/core/errors/AppError';
import { fail, ok, runCatching, type Result } from '@/core/errors/Result';
import type { Clock } from '@/core/utils/providers';
import type { PantryItem, PantryItemDraft } from '../entities/PantryItem';
import type { PantryRepository } from '../repositories/PantryRepository';
import { validatePantryItemInput } from '../validation/pantryItemSchema';

export class UpdatePantryItemUseCase {
  constructor(
    private readonly repository: PantryRepository,
    private readonly clock: Clock,
  ) {}

  async execute(userId: string, id: string, input: PantryItemDraft): Promise<Result<PantryItem>> {
    const validation = validatePantryItemInput(input);
    if (!validation.ok) return fail(validation.error);

    const current = await runCatching(() => this.repository.getById(userId, id), 'DATABASE');
    if (!current.ok) return fail(current.error);
    if (!current.value) return fail(new AppError('NOT_FOUND', 'Item não encontrado.'));

    const updated: PantryItem = {
      ...current.value,
      ...validation.value,
      updatedAt: this.clock.now().toISOString(),
      syncStatus: 'pending',
    };

    const saved = await runCatching(() => this.repository.save(updated), 'DATABASE');
    return saved.ok ? ok(updated) : fail(saved.error);
  }
}
