import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { useContainer } from '@/core/di/ContainerProvider';
import type { FieldErrors } from '@/core/errors/AppError';
import { useCurrentUser } from '@/features/auth/presentation/store/sessionStore';
import {
  CATEGORIES,
  type Category,
  PantryItem,
  PantryItemDraft,
  StorageLocation,
  Unit,
} from '../../domain/entities/PantryItem';

export interface ItemFormValues {
  name: string;
  category: Category | null;
  storageLocation: StorageLocation | null;
  /** Texto digitado; aceita vírgula como separador decimal. */
  quantity: string;
  unit: Unit;
  expirationDate: string;
  notes: string;
  /** Código lido pela câmera (visão computacional); vazio se não houver. */
  barcode: string;
}

const EMPTY_FORM: ItemFormValues = {
  name: '',
  category: null,
  storageLocation: null,
  quantity: '1',
  unit: 'un',
  expirationDate: '',
  notes: '',
  barcode: '',
};

const toFormValues = (item: PantryItem): ItemFormValues => ({
  name: item.name,
  category: item.category,
  storageLocation: item.storageLocation,
  quantity: String(item.quantity).replace('.', ','),
  unit: item.unit,
  expirationDate: item.expirationDate,
  notes: item.notes ?? '',
  barcode: item.barcode ?? '',
});

const parseQuantity = (value: string): number | null => {
  const normalized = value.trim().replace(',', '.');
  return normalized === '' ? null : Number(normalized);
};

const toDraft = (values: ItemFormValues): PantryItemDraft => ({
  name: values.name,
  category: values.category,
  storageLocation: values.storageLocation,
  quantity: parseQuantity(values.quantity),
  unit: values.unit,
  expirationDate: values.expirationDate || null,
  notes: values.notes,
  barcode: values.barcode || null,
});

/**
 * ViewModel do formulário de item. Sem `itemId` cria um item; com `itemId` edita
 * (e permite excluir). Retorna `true` nas ações concluídas para a tela navegar.
 */
export function useItemFormViewModel(itemId?: string) {
  const { useCases } = useContainer();
  const user = useCurrentUser();
  const isEditing = Boolean(itemId);

  // Parâmetros enviados pelo scanner (visão computacional) para pré-preencher o cadastro.
  const params = useLocalSearchParams<{
    barcode?: string;
    name?: string;
    category?: string;
    lookup?: string;
  }>();
  const lookupNotice =
    !itemId && params.lookup === 'offline'
      ? 'Sem conexão com o catálogo de produtos. Informe o nome manualmente.'
      : !itemId && params.lookup === 'not-found'
        ? 'Código lido, mas o produto não está no catálogo. Informe o nome manualmente.'
        : null;
  const [values, setValues] = useState<ItemFormValues>(() => ({
    ...EMPTY_FORM,
    barcode: itemId ? '' : (params.barcode ?? ''),
    name: itemId ? '' : (params.name ?? ''),
    category:
      !itemId && params.category && (CATEGORIES as readonly string[]).includes(params.category)
        ? (params.category as Category)
        : null,
  }));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(isEditing);
  const [isSubmitting, setSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!itemId) return;
    let active = true;
    void useCases.getPantryItem.execute(user.id, itemId).then((result) => {
      if (!active) return;
      if (result.ok) setValues(toFormValues(result.value));
      else setNotFound(true);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [itemId, useCases, user.id]);

  const setField = <K extends keyof ItemFormValues>(field: K, value: ItemFormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  const submit = async (): Promise<boolean> => {
    setSubmitting(true);
    setFormError(null);
    const draft = toDraft(values);
    const result = itemId
      ? await useCases.updatePantryItem.execute(user.id, itemId, draft)
      : await useCases.createPantryItem.execute(user.id, draft);
    setSubmitting(false);

    if (result.ok) return true;
    setFieldErrors(result.error.fieldErrors ?? {});
    setFormError(result.error.message);
    return false;
  };

  const remove = async (): Promise<boolean> => {
    if (!itemId) return false;
    setSubmitting(true);
    const result = await useCases.deletePantryItem.execute(user.id, itemId);
    setSubmitting(false);
    if (!result.ok) setFormError(result.error.message);
    return result.ok;
  };

  return {
    isEditing,
    lookupNotice,
    values,
    setField,
    fieldErrors,
    formError,
    isLoading,
    isSubmitting,
    notFound,
    submit,
    remove,
  };
}
