import { diffInCalendarDays, parseISODate } from '@/core/utils/date';

export type ExpirationStatus = 'expired' | 'expiring_soon' | 'ok';

/** Quantidade de dias a partir da qual um item é considerado "vencendo". */
export const EXPIRING_SOON_THRESHOLD_DAYS = 3;

/** Dias até o vencimento: negativo = vencido há N dias, 0 = vence hoje. */
export function daysUntilExpiration(expirationDate: string, today: Date): number {
  return diffInCalendarDays(parseISODate(expirationDate), today);
}

export function getExpirationStatus(
  expirationDate: string,
  today: Date,
  thresholdDays: number = EXPIRING_SOON_THRESHOLD_DAYS,
): ExpirationStatus {
  const days = daysUntilExpiration(expirationDate, today);
  if (days < 0) return 'expired';
  if (days <= thresholdDays) return 'expiring_soon';
  return 'ok';
}
