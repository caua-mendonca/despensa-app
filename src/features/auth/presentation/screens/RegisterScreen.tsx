import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/core/theme';
import { Button } from '@/shared/components/Button';
import { ErrorBanner } from '@/shared/components/Feedback';
import { TextField } from '@/shared/components/TextField';
import { MIN_PASSWORD_LENGTH } from '../../domain/validation/credentialsSchema';
import { useRegisterViewModel } from '../viewmodels/useRegisterViewModel';
import { AuthScreenLayout } from './AuthScreenLayout';

export function RegisterScreen() {
  const vm = useRegisterViewModel();

  return (
    <AuthScreenLayout title="Criar conta" subtitle="Seus itens ficam salvos no aparelho e na nuvem.">
      {vm.formError && <ErrorBanner message={vm.formError} />}
      {vm.successMessage && (
        <View style={styles.success} accessibilityRole="alert">
          <Text style={styles.successText}>{vm.successMessage}</Text>
        </View>
      )}
      <TextField
        label="E-mail"
        value={vm.email}
        onChangeText={vm.setEmail}
        error={vm.fieldErrors.email}
        placeholder="voce@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <TextField
        label="Senha"
        value={vm.password}
        onChangeText={vm.setPassword}
        error={vm.fieldErrors.password}
        placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
        secureTextEntry
        autoComplete="new-password"
      />
      <TextField
        label="Confirmar senha"
        value={vm.confirmPassword}
        onChangeText={vm.setConfirmPassword}
        error={vm.fieldErrors.confirmPassword}
        placeholder="Repita a senha"
        secureTextEntry
        autoComplete="new-password"
        onSubmitEditing={() => void vm.submit()}
      />
      <Button title="Cadastrar" onPress={() => void vm.submit()} loading={vm.isSubmitting} />
      <Link href="/login" replace style={styles.link}>
        <Text>
          Já tem conta? <Text style={styles.linkStrong}>Entrar</Text>
        </Text>
      </Link>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  link: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.sm, fontSize: 15 },
  linkStrong: { color: colors.primary, fontWeight: '700' },
  success: { backgroundColor: colors.successLight, padding: spacing.md, borderRadius: radius.sm },
  successText: { ...typography.caption, color: colors.success },
});
