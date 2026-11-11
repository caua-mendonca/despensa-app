import { Ionicons } from '@expo/vector-icons';
import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/core/theme';
import { Screen } from '@/shared/components/Screen';

interface AuthScreenLayoutProps {
  title: string;
  subtitle: string;
}

export function AuthScreenLayout({ title, subtitle, children }: PropsWithChildren<AuthScreenLayoutProps>) {
  return (
    <Screen scroll edges={['top', 'bottom']} contentStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.logo}>
          <Ionicons name="leaf" size={36} color={colors.textInverse} />
        </View>
        <Text style={styles.brand}>ValidaJá</Text>
        <Text style={styles.tagline}>Menos desperdício, mais economia.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        {children}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', gap: spacing.xl },
  header: { alignItems: 'center', gap: spacing.xs },
  logo: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  brand: { fontSize: 30, fontWeight: '800', color: colors.primaryDark },
  tagline: { ...typography.body, color: colors.textMuted },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { ...typography.title, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted, marginBottom: spacing.sm },
});
