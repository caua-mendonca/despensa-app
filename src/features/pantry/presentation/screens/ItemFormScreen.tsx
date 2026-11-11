import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/core/theme';
import { Button } from '@/shared/components/Button';
import { ChipSelect } from '@/shared/components/ChipSelect';
import { DateField } from '@/shared/components/DateField';
import { EmptyState, ErrorBanner, LoadingView } from '@/shared/components/Feedback';
import { Screen } from '@/shared/components/Screen';
import { TextField } from '@/shared/components/TextField';
import { categoryOptions, storageLocationOptions, unitOptions } from '../constants/labels';
import { useItemFormViewModel } from '../viewmodels/useItemFormViewModel';

interface ItemFormScreenProps {
  /** Ausente = cadastro; presente = edição. */
  itemId?: string;
}

export function ItemFormScreen({ itemId }: ItemFormScreenProps) {
  const vm = useItemFormViewModel(itemId);

  if (vm.isLoading) return <LoadingView />;
  if (vm.notFound) {
    return (
      <EmptyState
        icon="search-outline"
        title="Item não encontrado"
        description="Ele pode ter sido excluído em outro aparelho."
        action={<Button title="Voltar" variant="secondary" onPress={() => router.back()} />}
      />
    );
  }

  const handleSubmit = async () => {
    if (await vm.submit()) router.back();
  };

  const handleDelete = () => {
    Alert.alert('Excluir item', `Deseja excluir "${vm.values.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          if (await vm.remove()) router.back();
        },
      },
    ]);
  };

  return (
    <Screen scroll>
      {vm.formError && <ErrorBanner message={vm.formError} />}

      <Button
        title={vm.values.barcode ? 'Escanear outro código' : 'Escanear código de barras / QR'}
        icon="scan-outline"
        variant="secondary"
        onPress={() => router.replace('/items/scan')}
      />
      {vm.lookupNotice && <Text style={styles.notice}>{vm.lookupNotice}</Text>}
      {vm.values.barcode !== '' && (
        <View style={styles.barcodeRow}>
          <Text style={styles.barcodeText}>Código: {vm.values.barcode}</Text>
          <Pressable onPress={() => vm.setField('barcode', '')} hitSlop={8}>
            <Text style={styles.barcodeClear}>Remover</Text>
          </Pressable>
        </View>
      )}

      <TextField
        label="Nome do item"
        value={vm.values.name}
        onChangeText={(text) => vm.setField('name', text)}
        error={vm.fieldErrors.name}
        placeholder="Ex.: Leite integral"
        autoCapitalize="sentences"
        maxLength={80}
      />

      <DateField
        label="Data de validade"
        value={vm.values.expirationDate}
        onChange={(date) => vm.setField('expirationDate', date)}
        error={vm.fieldErrors.expirationDate}
      />

      <TextField
        label="Quantidade"
        value={vm.values.quantity}
        onChangeText={(text) => vm.setField('quantity', text)}
        error={vm.fieldErrors.quantity}
        keyboardType="decimal-pad"
      />
      <ChipSelect
        label="Unidade"
        options={unitOptions}
        value={vm.values.unit}
        onChange={(unit) => unit && vm.setField('unit', unit)}
        error={vm.fieldErrors.unit}
      />

      <ChipSelect
        label="Onde está guardado"
        options={storageLocationOptions}
        value={vm.values.storageLocation}
        onChange={(location) => vm.setField('storageLocation', location)}
        error={vm.fieldErrors.storageLocation}
      />

      <ChipSelect
        label="Categoria"
        options={categoryOptions}
        value={vm.values.category}
        onChange={(category) => vm.setField('category', category)}
        error={vm.fieldErrors.category}
      />

      <TextField
        label="Observações (opcional)"
        value={vm.values.notes}
        onChangeText={(text) => vm.setField('notes', text)}
        error={vm.fieldErrors.notes}
        placeholder="Ex.: aberto em 10/09, usar no bolo"
        multiline
        maxLength={300}
        style={styles.notes}
      />

      <View style={styles.actions}>
        <Button
          title={vm.isEditing ? 'Salvar alterações' : 'Cadastrar item'}
          icon="checkmark"
          onPress={() => void handleSubmit()}
          loading={vm.isSubmitting}
        />
        {vm.isEditing && (
          <Button title="Excluir item" icon="trash-outline" variant="danger" onPress={handleDelete} disabled={vm.isSubmitting} />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  notes: { minHeight: 88, textAlignVertical: 'top' },
  barcodeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barcodeText: { color: colors.textMuted, fontSize: 14, flexShrink: 1 },
  notice: { color: colors.warning, fontSize: 14 },
  barcodeClear: { color: colors.danger, fontSize: 14, fontWeight: '600' },
  actions: { gap: spacing.sm, marginTop: spacing.md },
});
