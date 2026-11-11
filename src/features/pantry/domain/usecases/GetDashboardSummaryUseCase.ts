import { runCatching, type Result } from '@/core/errors/Result';
import type { Clock } from '@/core/utils/providers';
import { getExpirationStatus } from '../entities/ExpirationStatus';
import type { PantryItem } from '../entities/PantryItem';
import type { PantryRepository } from '../repositories/PantryRepository';

export interface DashboardSummary {
  total: number;
  expired: number;
  expiringSoon: number;
  ok: number;
  /** Itens vencidos ou vencendo, do mais urgente para o menos urgente. */
  attentionItems: PantryItem[];
}

export class GetDashboardSummaryUseCase {
  constructor(
    private readonly repository: PantryRepository,
    private readonly clock: Clock,
  ) {}

  execute(userId: string): Promise<Result<DashboardSummary>> {
    return runCatching(async () => {
      const items = await this.repository.list(userId);
      const today = this.clock.now();
      const summary: DashboardSummary = {
        total: items.length,
        expired: 0,
        expiringSoon: 0,
        ok: 0,
        attentionItems: [],
      };

      for (const item of items) {
        const status = getExpirationStatus(item.expirationDate, today);
        if (status === 'expired') summary.expired += 1;
        else if (status === 'expiring_soon') summary.expiringSoon += 1;
        else summary.ok += 1;

        if (status !== 'ok') summary.attentionItems.push(item);
      }

      summary.attentionItems.sort((a, b) => a.expirationDate.localeCompare(b.expirationDate));
      return summary;
    }, 'DATABASE');
  }
}
