import { useState } from 'react';

import { useContainer } from '@/core/di/ContainerProvider';
import type { FieldErrors } from '@/core/errors/AppError';

export function useRegisterViewModel() {
  const { useCases } = useContainer();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    setFormError(null);
    setSuccessMessage(null);
    const result = await useCases.signUp.execute({ email, password, confirmPassword });
    setSubmitting(false);

    if (!result.ok) {
      setFieldErrors(result.error.fieldErrors ?? {});
      setFormError(result.error.code === 'VALIDATION' ? null : result.error.message);
      return;
    }

    setFieldErrors({});
    // Se a confirmação de e-mail estiver desativada, a sessão já é criada e o
    // `Stack.Protected` leva o usuário direto para o app.
    if (result.value.needsEmailConfirmation) {
      setSuccessMessage('Conta criada! Confirme seu e-mail pelo link enviado e depois faça login.');
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    fieldErrors,
    formError,
    successMessage,
    isSubmitting,
    submit,
  };
}
