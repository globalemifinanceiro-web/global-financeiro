import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useOpcoesFiltro } from '@/hooks/useFinanceData';
import { useFiltrosStore } from '@/stores/useFiltrosStore';
import { colors, radius, spacing, typography } from '@/theme';

/**
 * Cada empresa (CNPJ) tem seus próprios clientes, fornecedores, projetos e contas correntes —
 * por isso é um botão fixo e sempre visível, não "mais um filtro" entre outros.
 * Por enquanto mostra só o nome; quando os CNPJs forem confirmados, o número entra aqui também.
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
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  pillAtiva: { backgroundColor: colors.navy, borderColor: colors.navy },
  pillLabel: { ...typography.captionStrong, color: colors.textPrimary },
  pillLabelAtiva: { color: colors.textInverse },
});
