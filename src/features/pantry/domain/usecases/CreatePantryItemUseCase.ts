import { fail, ok, runCatching, type Result } from '@/core/errors/Result';
import type { Clock, IdGenerator } from '@/core/utils/providers';
import type { PantryItem, PantryItemDraft } from '../entities/PantryItem';
import type { PantryRepository } from '../repositories/PantryRepository';
import { validatePantryItemInput } from '../validation/pantryItemSchema';

export class CreatePantryItemUseCase {
  constructor(
    private readonly repository: PantryRepository,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(userId: string, input: PantryItemDraft): Promise<Result<PantryItem>> {
    const validation = validatePantryItemInput(input);
    if (!validation.ok) return fail(validation.error);

    const now = this.clock.now().toISOString();
    const item: PantryItem = {
      ...validation.value,
      id: this.idGenerator.generate(),
      userId,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      syncStatus: 'pending',
    };

    const saved = await runCatching(() => this.repository.save(item), 'DATABASE');
    return saved.ok ? ok(item) : fail(saved.error);
  }
}
