import { router } from 'expo-router';
import { useRef, useState } from 'react';

import { useContainer } from '@/core/di/ContainerProvider';
import { useCurrentUser } from '@/features/auth/presentation/store/sessionStore';

/**
 * ViewModel do scanner. Recebe o código lido pela câmera, identifica o produto
 * e navega: item já cadastrado → edição; novo → cadastro pré-preenchido.
 */
export function useBarcodeScannerViewModel() {
  const { useCases } = useContainer();
  const user = useCurrentUser();
  const [isProcessing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locked = useRef(false); // evita processar a mesma leitura várias vezes

  const handleScanned = async (code: string) => {
    if (locked.current || !code.trim()) return;
    locked.current = true;
    setProcessing(true);
    setError(null);

    const result = await useCases.lookupProductByBarcode.execute(user.id, code);
    if (!result.ok) {
      setError(result.error.message);
      setProcessing(false);
      locked.current = false;
      return;
    }

    const lookup = result.value;
    if (lookup.kind === 'existing') {
      router.replace({ pathname: '/items/[id]', params: { id: lookup.item.id } });
      return;
    }

    const { suggestion } = lookup;
    router.replace({
      pathname: '/items/new',
      params: {
        barcode: suggestion.barcode,
        ...(suggestion.name ? { name: suggestion.name } : {}),
        ...(suggestion.category ? { category: suggestion.category } : {}),
        ...(lookup.source !== 'catalog' ? { lookup: lookup.source } : {}),
      },
    });
  };

  return { isProcessing, error, handleScanned, dismissError: () => setError(null) };
}
