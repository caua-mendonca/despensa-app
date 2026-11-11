import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing, typography } from '@/core/theme';

/** Exibida quando o `.env` com as credenciais do Supabase não foi configurado. */
export function MissingConfigScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Configuração pendente</Text>
      <Text style={styles.text}>
        Crie o arquivo <Text style={styles.code}>.env</Text> na raiz do projeto com as variáveis abaixo
        e reinicie o Expo (<Text style={styles.code}>npx expo start -c</Text>):
      </Text>
      <View style={styles.box}>
        <Text style={styles.code}>EXPO_PUBLIC_SUPABASE_URL=...</Text>
        <Text style={styles.code}>EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...</Text>
      </View>
      <Text style={styles.text}>Veja o passo a passo no README.md.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.md, backgroundColor: colors.background },
  title: { ...typography.title, color: colors.text },
  text: { ...typography.body, color: colors.textMuted },
  box: { backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md, gap: spacing.xs },
  code: { fontFamily: 'monospace', fontSize: 13, color: colors.text },
});
