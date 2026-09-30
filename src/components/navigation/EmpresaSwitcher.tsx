import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CNPJ_POR_EMPRESA, type NomeEmpresa } from '@/constants/empresas';
import { useOpcoesFiltro, useResumoFinanceiro } from '@/hooks/useFinanceData';
import { useFiltrosStore } from '@/stores/useFiltrosStore';
import { formatBRL } from '@/utils/currency';
import { MESES } from '@/utils/periodo';
import { colors, radius, spacing, typography } from '@/theme';

/**
 * Cada empresa (CNPJ) tem seus próprios clientes, fornecedores, projetos e contas correntes —
 * por isso é um botão fixo e sempre visível, não "mais um filtro" entre outros.
 * "Consolidado" limpa o filtro de empresa: as telas já somam todos os CNPJs juntos nesse caso.
 */
export function EmpresaSwitcher() {
  const { data: opcoes } = useOpcoesFiltro();
  const { data: resumo } = useResumoFinanceiro();
  const empresaAtiva = useFiltrosStore((state) => state.filtros.empresa);
  const mesFiltro = useFiltrosStore((state) => state.filtros.mes);
  const setFiltro = useFiltrosStore((state) => state.setFiltro);

  const empresas = opcoes?.empresas ?? [];
  const primeiraEmpresa = empresas[0];

  // Só define a empresa padrão UMA vez (primeiro carregamento). Sem essa trava, escolher
  // "Consolidado" (que também deixa filtros.empresa vazio) seria imediatamente revertido para a
  // primeira empresa por este mesmo efeito.
  const jaInicializou = useRef(false);
  useEffect(() => {
    if (!jaInicializou.current && !empresaAtiva && primeiraEmpresa) {
      jaInicializou.current = true;
      setFiltro('empresa', primeiraEmpresa);
    }
  }, [empresaAtiva, primeiraEmpresa, setFiltro]);

  if (empresas.length === 0) return null;

  const consolidadoAtivo = !empresaAtiva;

  return (
    <View style={styles.wrap}>
      <View style={styles.linha}>
        <Text style={styles.label}>Empresa</Text>
        <View style={styles.pills}>
          <Pressable
            onPress={() => setFiltro('empresa', undefined)}
            style={[styles.pill, styles.pillConsolidado, consolidadoAtivo && styles.pillAtiva]}
          >
            <Text style={[styles.pillLabel, consolidadoAtivo && styles.pillLabelAtiva]} numberOfLines={1}>
              Consolidado
            </Text>
            <Text style={[styles.pillCnpj, consolidadoAtivo && styles.pillCnpjAtivo]} numberOfLines={1}>
              Todos os CNPJs
            </Text>
          </Pressable>
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

      <View style={styles.faturamento}>
        <Text style={styles.faturamentoLabel}>
          Faturamento {mesFiltro ? `de ${MESES[mesFiltro - 1].toLowerCase()}` : 'do mês'}
          {consolidadoAtivo ? ' consolidado' : ` — ${empresaAtiva}`}
        </Text>
        <Text style={styles.faturamentoValor}>{resumo ? formatBRL(resumo.receitasDoMes) : '—'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  label: { ...typography.caption, color: colors.textSecondary },
  pills: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  pillConsolidado: { borderColor: colors.blue, borderStyle: 'dashed' },
  pillAtiva: { backgroundColor: colors.navy, borderColor: colors.navy, borderStyle: 'solid' },
  pillLabel: { ...typography.captionStrong, color: colors.textPrimary },
  pillLabelAtiva: { color: colors.textInverse },
  pillCnpj: { ...typography.caption, fontSize: 10, color: colors.textSecondary },
  pillCnpjAtivo: { color: 'rgba(255,255,255,0.7)' },
  faturamento: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    paddingTop: 2,
  },
  faturamentoLabel: { ...typography.caption, color: colors.textSecondary },
  faturamentoValor: { ...typography.bodyStrong, color: colors.positive },
});
