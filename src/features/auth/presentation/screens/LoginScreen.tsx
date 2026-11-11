import { Link } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { colors, spacing } from '@/core/theme';
import { Button } from '@/shared/components/Button';
import { ErrorBanner } from '@/shared/components/Feedback';
import { TextField } from '@/shared/components/TextField';
import { useLoginViewModel } from '../viewmodels/useLoginViewModel';
import { AuthScreenLayout } from './AuthScreenLayout';

export function LoginScreen() {
  const vm = useLoginViewModel();

  return (
    <AuthScreenLayout title="Entrar" subtitle="Acesse sua despensa em qualquer aparelho.">
      {vm.formError && <ErrorBanner message={vm.formError} />}
      <TextField
        label="E-mail"
        value={vm.email}
        onChangeText={vm.setEmail}
        error={vm.fieldErrors.email}
        placeholder="voce@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
      />
      <TextField
        label="Senha"
        value={vm.password}
        onChangeText={vm.setPassword}
        error={vm.fieldErrors.password}
        placeholder="Sua senha"
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        onSubmitEditing={() => void vm.submit()}
      />
      <Button title="Entrar" onPress={() => void vm.submit()} loading={vm.isSubmitting} />
      <Link href="/register" replace style={styles.link}>
        <Text>
          Não tem conta? <Text style={styles.linkStrong}>Cadastre-se</Text>
        </Text>
      </Link>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  link: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.sm, fontSize: 15 },
  linkStrong: { color: colors.primary, fontWeight: '700' },
});
