import { z } from 'zod';

import { AppError, type FieldErrors } from '@/core/errors/AppError';
import { fail, ok, type Result } from '@/core/errors/Result';
import { isValidISODate } from '@/core/utils/date';
import {
  CATEGORIES,
  STORAGE_LOCATIONS,
  UNITS,
  type PantryItemDraft,
  type PantryItemInput,
} from '../entities/PantryItem';

export const pantryItemInputSchema = z.object({
  name: z
    .string({ error: 'Informe o nome do item.' })
    .trim()
    .min(2, 'Informe o nome do item (mínimo 2 caracteres).')
    .max(80, 'O nome deve ter no máximo 80 caracteres.'),
  category: z.enum(CATEGORIES, { error: 'Selecione uma categoria.' }),
  storageLocation: z.enum(STORAGE_LOCATIONS, { error: 'Selecione onde o item está guardado.' }),
  quantity: z
    .number({ error: 'Informe uma quantidade válida.' })
    .positive('A quantidade deve ser maior que zero.')
    .max(99999, 'Quantidade muito alta.'),
  unit: z.enum(UNITS, { error: 'Selecione uma unidade.' }),
  expirationDate: z
    .string({ error: 'Informe a data de validade.' })
    .refine(isValidISODate, 'Informe uma data de validade válida.'),
  notes: z
    .string()
    .trim()
    .max(300, 'As observações devem ter no máximo 300 caracteres.')
    .nullable()
    .transform((value) => (value ? value : null)),
  barcode: z
    .string()
    .trim()
    .max(100, 'O código de barras deve ter no máximo 100 caracteres.')
    .nullable()
    .optional()
    .transform((value) => (value ? value : null)),
});

/** Valida e normaliza a entrada do usuário (trim, nulos, etc.). */
export function validatePantryItemInput(input: PantryItemDraft): Result<PantryItemInput> {
  const parsed = pantryItemInputSchema.safeParse(input);
  if (parsed.success) return ok(parsed.data);

  const fieldErrors: FieldErrors = {};
  for (const issue of parsed.error.issues) {
    const field = String(issue.path[0] ?? 'form');
    fieldErrors[field] ??= issue.message;
  }
  return fail(new AppError('VALIDATION', 'Verifique os campos destacados.', fieldErrors));
}
