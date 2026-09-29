import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CentralPagamentoItem } from '@/components/notasFiscais/CentralPagamentoItem';
import { NotaFiscalForm } from '@/components/notasFiscais/NotaFiscalForm';
import { Card } from '@/components/ui/Card';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';
import { CNPJ_POR_EMPRESA, EMPRESAS, type NomeEmpresa } from '@/constants/empresas';
import { useTodasNotasFiscais } from '@/hooks/useNotasFiscais';
import { colors, spacing, typography } from '@/theme';

export default function CentralPagamentosScreen() {
  const { data: notas, isLoading, isError, refetch } = useTodasNotasFiscais();
  const [formAberto, setFormAberto] = useState(false);

  return (
    <View style={styles.container}>
      <DemoBanner />

      <Card style={styles.intro}>
        <SectionHeader
          title="Central de Pagamentos"
          subtitle="Uma central por CNPJ — NFs, recibos e documentos já assinados, prontos para pagamento."
          right={<PrimaryButton label="Nova nota" onPress={() => setFormAberto(true)} />}
        />
        <Text style={styles.notaIdentificacao}>
          A nota entra na central do CNPJ escolhido no formulário — a identificação automática do CNPJ a partir do
          documento ainda depende de leitura por IA, não implementada.
        </Text>
      </Card>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState
          description="Confira se a tabela 'notas_fiscais' já foi criada no Supabase (ver supabase/migrations)."
          onRetry={() => refetch()}
        />
      ) : (
        <View style={styles.colunas}>
          {EMPRESAS.map((empresa) => {
            const itensDaEmpresa = (notas ?? []).filter((n) => n.empresa === empresa && n.situacao === 'pendente');
            return (
              <Card key={empresa} style={styles.coluna}>
                <View style={styles.cabecalhoColuna}>
                  <Text style={styles.tituloColuna}>{empresa}</Text>
                  <Text style={styles.cnpjColuna}>{CNPJ_POR_EMPRESA[empresa as NomeEmpresa]}</Text>
                </View>

                {itensDaEmpresa.length === 0 ? (
                  <EmptyState title="Nada pendente" description="Nenhuma nota aguardando pagamento neste CNPJ." />
                ) : (
                  itensDaEmpresa.map((nota) => <CentralPagamentoItem key={nota.id} nota={nota} />)
                )}
              </Card>
            );
          })}
        </View>
      )}

      <NotaFiscalForm visivel={formAberto} empresaPadrao={EMPRESAS[0]} onFechar={() => setFormAberto(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  intro: { gap: spacing.xs },
  notaIdentificacao: { ...typography.caption, color: colors.textSecondary },
  colunas: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  coluna: { flexGrow: 1, flexBasis: 320, gap: spacing.sm },
  cabecalhoColuna: { marginBottom: spacing.xs },
  tituloColuna: { ...typography.subheading, color: colors.textPrimary },
  cnpjColuna: { ...typography.caption, color: colors.textSecondary },
});
