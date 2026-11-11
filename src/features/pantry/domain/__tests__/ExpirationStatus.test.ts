import { daysUntilExpiration, getExpirationStatus } from '../entities/ExpirationStatus';

describe('ExpirationStatus', () => {
  // 15/09/2026 às 18h — o horário não deve influenciar o cálculo.
  const today = new Date(2026, 8, 15, 18, 30);

  it('calcula dias de calendário até o vencimento', () => {
    expect(daysUntilExpiration('2026-09-15', today)).toBe(0);
    expect(daysUntilExpiration('2026-09-16', today)).toBe(1);
    expect(daysUntilExpiration('2026-09-10', today)).toBe(-5);
    expect(daysUntilExpiration('2026-10-15', today)).toBe(30);
  });

  it.each([
    ['2026-09-14', 'expired'],
    ['2026-09-15', 'expiring_soon'],
    ['2026-09-18', 'expiring_soon'],
    ['2026-09-19', 'ok'],
  ] as const)('%s → %s', (date, expected) => {
    expect(getExpirationStatus(date, today)).toBe(expected);
  });

  it('respeita um limite customizado', () => {
    expect(getExpirationStatus('2026-09-22', today, 7)).toBe('expiring_soon');
  });
});
