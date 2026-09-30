import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CentralPagamentoItem } from '@/components/notasFiscais/CentralPagamentoItem';
import { FilaClassificacao } from '@/components/notasFiscais/FilaClassificacao';
import { NotaFiscalForm } from '@/components/notasFiscais/NotaFiscalForm';
import { Card } from '@/components/ui/Card';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';
import { CNPJ_POR_EMPRESA, EMPRESAS, type NomeEmpresa } from '@/constants/empresas';
import { useSincronizarProjetosGlobal, useTodasNotasFiscais } from '@/hooks/useNotasFiscais';
import { colors, spacing, typography } from '@/theme';

export default function CentralPagamentosScreen() {
  const { data: notas, isLoading, isError, refetch } = useTodasNotasFiscais();
  const sincronizar = useSincronizarProjetosGlobal();
  const [formAberto, setFormAberto] = useState(false);
  const [mensagemSync, setMensagemSync] = useState<string | null>(null);

  async function handleSincronizar() {
    setMensagemSync(null);
    try {
      const resultado = await sincronizar.mutateAsync();
      const partes = [
        resultado.sincronizadas > 0
          ? `${resultado.sincronizadas} solicitação(ões) atualizada(s)`
          : 'nenhuma solicitação liberada no momento',
        resultado.removidas > 0 ? `${resultado.removidas} removida(s) (não estão mais liberadas lá)` : null,
      ].filter(Boolean);
      setMensagemSync(`${partes.join(' · ')} — Projetos Global.`);
    } catch (e) {
      setMensagemSync(e instanceof Error ? e.message : 'Não foi possível sincronizar com o Projetos Global.');
    }
  }

  return (
    <View style={styles.container}>
      <DemoBanner />

      <Card style={styles.intro}>
        <SectionHeader
          title="Central de Pagamentos"
          subtitle="Uma central por CNPJ — NFs, recibos e documentos já assinados, prontos para pagamento."
          right={
            <View style={styles.acoesHeader}>
              <PrimaryButton
                label={sincronizar.isPending ? 'Sincronizando...' : 'Sincronizar Projetos Global'}
                variant="ghost"
                onPress={handleSincronizar}
                disabled={sincronizar.isPending}
              />
              <PrimaryButton label="Nova nota" onPress={() => setFormAberto(true)} />
            </View>
          }
        />
        <Text style={styles.notaIdentificacao}>
          Notas criadas manualmente entram na central do CNPJ escolhido no formulário. As que vêm do Projetos Global
          chegam sem empresa definida — classifique-as na fila abaixo.
        </Text>
        {mensagemSync ? <Text style={styles.mensagemSync}>{mensagemSync}</Text> : null}
      </Card>

      {notas ? <FilaClassificacao notas={notas} /> : null}

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
  acoesHeader: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  notaIdentificacao: { ...typography.caption, color: colors.textSecondary },
  mensagemSync: { ...typography.caption, color: colors.blue },
  colunas: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  coluna: { flexGrow: 1, flexBasis: 320, gap: spacing.sm },
  cabecalhoColuna: { marginBottom: spacing.xs },
  tituloColuna: { ...typography.subheading, color: colors.textPrimary },
  cnpjColuna: { ...typography.caption, color: colors.textSecondary },
});
