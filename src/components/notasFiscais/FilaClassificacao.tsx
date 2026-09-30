import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { EMPRESAS } from '@/constants/empresas';
import { useAtribuirEmpresaNotaFiscal } from '@/hooks/useNotasFiscais';
import type { NotaFiscal } from '@/types/notaFiscal';
import { formatBRL } from '@/utils/currency';
import { formatDateBR } from '@/utils/date';
import { colors, radius, spacing, typography } from '@/theme';

const STATUS_PG_LABEL: Record<string, string> = {
  liberado_financeiro: 'Liberado para pagamento',
  pagamento_agendado: 'Pagamento agendado',
  pago: 'Pago',
};

/** Itens vindos do Projetos Global que ainda não têm empresa (CNPJ) definida. */
export function FilaClassificacao({ notas }: { notas: NotaFiscal[] }) {
  const atribuir = useAtribuirEmpresaNotaFiscal();
  const pendentes = notas.filter((n) => n.origem === 'projetos_global' && !n.empresa);

  if (pendentes.length === 0) return null;

  return (
    <Card style={styles.card}>
      <Text style={styles.titulo}>Fila de classificação — Projetos Global</Text>
      <Text style={styles.subtitulo}>
        Chegaram do Projetos Global e ainda não foram associadas a um CNPJ. Escolha a empresa de cada uma para que
        entre na central de pagamentos correspondente.
      </Text>

      {pendentes.map((nota) => (
        <View key={nota.id} style={styles.item}>
          <View style={styles.info}>
            <Text style={styles.cliente} numberOfLines={1}>
              {nota.clienteOuFornecedor}
            </Text>
            <Text style={styles.meta}>
              {nota.projetoPcg ? `PCG ${nota.projetoPcg}` : null}
              {nota.projetoPcg && nota.projetoNome ? ' · ' : null}
              {nota.projetoNome}
            </Text>
            <Text style={styles.meta}>
              {formatBRL(nota.valor)} · Vence {formatDateBR(nota.vencimento)}
              {nota.projetosGlobalStatus ? ` · ${STATUS_PG_LABEL[nota.projetosGlobalStatus] ?? nota.projetosGlobalStatus}` : null}
            </Text>
          </View>
          <View style={styles.botoes}>
            {EMPRESAS.map((empresa) => (
              <PrimaryButton
                key={empresa}
                label={empresa}
                variant="ghost"
                onPress={() => atribuir.mutate({ id: nota.id, empresa })}
                disabled={atribuir.isPending}
              />
            ))}
          </View>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm, borderWidth: 1, borderColor: colors.blueSoft, borderRadius: radius.lg },
  titulo: { ...typography.subheading, color: colors.textPrimary },
  subtitulo: { ...typography.caption, color: colors.textSecondary },
  item: {
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  info: { gap: 2 },
  cliente: { ...typography.bodyStrong, color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary },
  botoes: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
});
