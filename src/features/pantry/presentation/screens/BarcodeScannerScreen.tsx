import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useIsFocused } from 'expo-router';
import { ActivityIndicator, Linking, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/core/theme';
import { Button } from '@/shared/components/Button';
import { EmptyState, ErrorBanner } from '@/shared/components/Feedback';
import { useBarcodeScannerViewModel } from '../viewmodels/useBarcodeScannerViewModel';

export function BarcodeScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const isFocused = useIsFocused();
  const vm = useBarcodeScannerViewModel();

  if (!permission) return <View style={styles.dark} />;

  if (!permission.granted) {
    return (
      <EmptyState
        icon="camera-outline"
        title="Permita o acesso à câmera"
        description="A câmera é usada para ler o código de barras ou QR Code dos produtos."
        action={
          <View style={styles.actions}>
            <Button
              title={permission.canAskAgain ? 'Permitir câmera' : 'Abrir configurações'}
              icon="camera-outline"
              onPress={() => (permission.canAskAgain ? void requestPermission() : void Linking.openSettings())}
            />
            <Button
              title="Cadastrar manualmente"
              variant="secondary"
              onPress={() => router.replace('/items/new')}
            />
          </View>
        }
      />
    );
  }

  return (
    <View style={styles.dark}>
      {isFocused && (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'],
          }}
          onBarcodeScanned={vm.isProcessing ? undefined : ({ data }) => void vm.handleScanned(data)}
        />
      )}

      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.frame} />
        <Text style={styles.hint}>Aponte para o código de barras ou QR Code do produto</Text>
        {vm.isProcessing && (
          <View style={styles.processing}>
            <ActivityIndicator color={colors.textInverse} />
            <Text style={styles.processingText}>Identificando produto…</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        {vm.error && <ErrorBanner message={vm.error} />}
        <Button
          title="Cadastrar manualmente"
          icon="create-outline"
          variant="secondary"
          onPress={() => router.replace('/items/new')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dark: { flex: 1, backgroundColor: '#000' },
  actions: { gap: spacing.sm, alignSelf: 'stretch' },
  overlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  frame: {
    width: 260,
    height: 180,
    borderWidth: 3,
    borderColor: colors.textInverse,
    borderRadius: radius.lg,
    backgroundColor: 'transparent',
  },
  hint: {
    color: colors.textInverse,
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    textShadowColor: '#000',
    textShadowRadius: 4,
  },
  processing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: spacing.md,
    borderRadius: radius.md,
  },
  processingText: { color: colors.textInverse },
  footer: { position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: spacing.xl, gap: spacing.sm },
});
