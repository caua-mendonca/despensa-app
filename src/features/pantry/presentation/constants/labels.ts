import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import type { ChipOption } from '@/shared/components/ChipSelect';
import type { ExpirationStatus } from '../../domain/entities/ExpirationStatus';
import {
  CATEGORIES,
  STORAGE_LOCATIONS,
  UNITS,
  type Category,
  type StorageLocation,
  type Unit,
} from '../../domain/entities/PantryItem';

type IconName = ComponentProps<typeof Ionicons>['name'];

export const CATEGORY_LABELS: Record<Category, string> = {
  produce: 'Hortifrúti',
  dairy: 'Laticínios',
  meat: 'Carnes',
  grains: 'Grãos e massas',
  bakery: 'Padaria',
  canned: 'Enlatados',
  frozen: 'Congelados',
  beverages: 'Bebidas',
  cleaning: 'Limpeza',
  other: 'Outros',
};

export const STORAGE_LOCATION_LABELS: Record<StorageLocation, string> = {
  pantry: 'Armário',
  fridge: 'Geladeira',
  freezer: 'Freezer',
};

export const STORAGE_LOCATION_ICONS: Record<StorageLocation, IconName> = {
  pantry: 'file-tray-stacked-outline',
  fridge: 'thermometer-outline',
  freezer: 'snow-outline',
};

export const UNIT_LABELS: Record<Unit, string> = {
  un: 'unidade(s)',
  kg: 'kg',
  g: 'g',
  l: 'L',
  ml: 'mL',
  pct: 'pacote(s)',
};

export const EXPIRATION_STATUS_LABELS: Record<ExpirationStatus, string> = {
  expired: 'Vencidos',
  expiring_soon: 'Vencendo',
  ok: 'Em dia',
};

export const categoryOptions: ChipOption<Category>[] = CATEGORIES.map((value) => ({
  value,
  label: CATEGORY_LABELS[value],
}));

export const storageLocationOptions: ChipOption<StorageLocation>[] = STORAGE_LOCATIONS.map(
  (value) => ({ value, label: STORAGE_LOCATION_LABELS[value] }),
);

export const unitOptions: ChipOption<Unit>[] = UNITS.map((value) => ({
  value,
  label: UNIT_LABELS[value],
}));

export const statusOptions: ChipOption<ExpirationStatus>[] = (
  ['expired', 'expiring_soon', 'ok'] as const
).map((value) => ({ value, label: EXPIRATION_STATUS_LABELS[value] }));

/** Texto amigável do prazo: "Venceu há 2 dias", "Vence hoje", "Vence em 5 dias". */
export function describeDaysUntilExpiration(days: number): string {
  if (days < -1) return `Venceu há ${Math.abs(days)} dias`;
  if (days === -1) return 'Venceu ontem';
  if (days === 0) return 'Vence hoje';
  if (days === 1) return 'Vence amanhã';
  return `Vence em ${days} dias`;
}

export function formatQuantity(quantity: number, unit: Unit): string {
  const formatted = Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(2).replace('.', ',');
  return `${formatted} ${UNIT_LABELS[unit]}`;
}
