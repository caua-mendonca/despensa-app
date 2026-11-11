const MS_PER_DAY = 24 * 60 * 60 * 1000;
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (value: number) => String(value).padStart(2, '0');

/** Converte um `Date` para `YYYY-MM-DD` usando o fuso local do aparelho. */
export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Converte `YYYY-MM-DD` para um `Date` à meia-noite local. */
export function parseISODate(value: string): Date {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) throw new Error(`Data inválida: ${value}`);
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

export function isValidISODate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  return toISODate(parseISODate(value)) === value;
}

/** Diferença em dias de calendário (ignora horário e horário de verão). */
export function diffInCalendarDays(later: Date, earlier: Date): number {
  const laterUtc = Date.UTC(later.getFullYear(), later.getMonth(), later.getDate());
  const earlierUtc = Date.UTC(earlier.getFullYear(), earlier.getMonth(), earlier.getDate());
  return Math.round((laterUtc - earlierUtc) / MS_PER_DAY);
}

export function formatDateBR(isoDate: string): string {
  const date = parseISODate(isoDate);
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function formatDateTimeBR(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}
