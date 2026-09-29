import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CNPJ_POR_EMPRESA, type NomeEmpresa } from '@/constants/empresas';
import { useOpcoesFiltro } from '@/hooks/useFinanceData';
import { useFiltrosStore } from '@/stores/useFiltrosStore';
import { colors, radius, spacing, typography } from '@/theme';

/**
 * Cada empresa (CNPJ) tem seus próprios clientes, fornecedores, projetos e contas correntes —
 * por isso é um botão fixo e sempre visível, não "mais um filtro" entre outros.
 */
export function EmpresaSwitcher() {
  const { data: opcoes } = useOpcoesFiltro();
  const empresaAtiva = useFiltrosStore((state) => state.filtros.empresa);
  const setFiltro = useFiltrosStore((state) => state.setFiltro);

  const empresas = opcoes?.empresas ?? [];
  const primeiraEmpresa = empresas[0];

  useEffect(() => {
    if (!empresaAtiva && primeiraEmpresa) {
      setFiltro('empresa', primeiraEmpresa);
    }
  }, [empresaAtiva, primeiraEmpresa, setFiltro]);

  if (empresas.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Empresa</Text>
      <View style={styles.pills}>
        {empresas.map((empresa) => {
          const ativa = empresa === empresaAtiva;
          return (
            <Pressable
              key={empresa}
              onPress={() => setFiltro('empresa', empresa)}
              style={[styles.pill, ativa && styles.pillAtiva]}
            >
              <Text style={[styles.pillLabel, ativa && styles.pillLabelAtiva]} numberOfLines={1}>
                {empresa}
              </Text>
              <Text style={[styles.pillCnpj, ativa && styles.pillCnpjAtivo]} numberOfLines={1}>
                {CNPJ_POR_EMPRESA[empresa as NomeEmpresa] ?? ''}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    flexWrap: 'wrap',
  },
  label: { ...typography.caption, color: colors.textSecondary },
  pills: { flexDirection: 'row', gap: 6 },
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  pillAtiva: { backgroundColor: colors.navy, borderColor: colors.navy },
  pillLabel: { ...typography.captionStrong, color: colors.textPrimary },
  pillLabelAtiva: { color: colors.textInverse },
  pillCnpj: { ...typography.caption, fontSize: 10, color: colors.textSecondary },
  pillCnpjAtivo: { color: 'rgba(255,255,255,0.7)' },
});
