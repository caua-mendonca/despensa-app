import { useState } from 'react';

import { useContainer } from '@/core/di/ContainerProvider';
import type { FieldErrors } from '@/core/errors/AppError';

/**
 * Após o login, o listener de sessão atualiza a store e o `Stack.Protected`
 * redireciona automaticamente para a área autenticada.
 */
export function useLoginViewModel() {
  const { useCases } = useContainer();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    setFormError(null);
    const result = await useCases.signIn.execute({ email, password });
    setSubmitting(false);

    if (!result.ok) {
      setFieldErrors(result.error.fieldErrors ?? {});
      setFormError(result.error.code === 'VALIDATION' ? null : result.error.message);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    fieldErrors,
    formError,
    isSubmitting,
    submit,
  };
}
