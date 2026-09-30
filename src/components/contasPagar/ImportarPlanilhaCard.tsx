import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SelectField } from '@/components/ui/SelectField';
import { CNPJ_POR_EMPRESA, EMPRESAS, type NomeEmpresa } from '@/constants/empresas';
import { useDesfazerImportacaoContasPagar, useImportacoesContasPagar, useImportarContasPagar } from '@/hooks/useContasPagarPlanilhas';
import type { ImportacaoContasPagar } from '@/services/supabase/contasPagarPlanilhas';
import { lerPlanilhaContasPagar, type LeituraPlanilha } from '@/services/importacao/planilhaContasPagar';
import { useFiltrosStore } from '@/stores/useFiltrosStore';
import { formatBRL } from '@/utils/currency';
import { formatDateTimeBR } from '@/utils/date';
import { MESES } from '@/utils/periodo';
import { colors, spacing, typography } from '@/theme';
import { AreaArquivo } from './AreaArquivo';
import type { ArquivoLido } from './arquivo';

function nomeMes(anoMes: string): string {
  const [ano, mes] = anoMes.split('-');
  return `${MESES[Number(mes) - 1].slice(0, 3).toLowerCase()}/${ano}`;
}

function descreverMeses(meses: string[]): string {
  if (meses.length === 0) return '—';
  if (meses.length <= 3) return meses.map(nomeMes).join(', ');
  return `${nomeMes(meses[0])} a ${nomeMes(meses[meses.length - 1])} (${meses.length} meses)`;
}

/** Arrastar/escolher a planilha mensal de contas a pagar de um CNPJ, conferir e importar. */
export function ImportarPlanilhaCard() {
  const empresaAtiva = useFiltrosStore((state) => state.filtros.empresa);
  const [empresa, setEmpresa] = useState<string | undefined>(empresaAtiva);
  const [arquivoNome, setArquivoNome] = useState<string | null>(null);
  const [leitura, setLeitura] = useState<LeituraPlanilha | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const importar = useImportarContasPagar();
  const desfazer = useDesfazerImportacaoContasPagar();
  const { data: importacoes } = useImportacoesContasPagar();

  async function executarDesfazer(importacao: ImportacaoContasPagar) {
    setErro(null);
    setSucesso(null);
    try {
      await desfazer.mutateAsync(importacao.id);
      setSucesso(`Importação de ${importacao.arquivoNome} desfeita (${importacao.empresa}).`);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível desfazer a importação.');
    }
  }

  function pedirDesfazer(importacao: ImportacaoContasPagar) {
    const mensagem =
      `Remover os ${importacao.linhas} lançamento(s) de ${importacao.arquivoNome} em ${importacao.empresa}? ` +
      'Os dados que essa importação substituiu não voltam — se precisar deles, importe a planilha anterior de novo.';
    // Alert.alert não funciona na versão web do React Native — lá usa o confirm() do navegador.
    if (Platform.OS === 'web') {
      if (window.confirm(mensagem)) executarDesfazer(importacao);
      return;
    }
    Alert.alert('Desfazer importação', mensagem, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Desfazer', style: 'destructive', onPress: () => executarDesfazer(importacao) },
    ]);
  }

  function aoEscolher(arquivo: ArquivoLido) {
    setErro(null);
    setSucesso(null);
    setLeitura(null);
    try {
      setLeitura(lerPlanilhaContasPagar(arquivo.conteudo));
      setArquivoNome(arquivo.nome);
    } catch (e) {
      setArquivoNome(null);
      setErro(e instanceof Error ? e.message : 'Não foi possível ler a planilha.');
    }
  }

  // A Omie informa o CNPJ da empresa em cada linha: se vier, confere com o CNPJ escolhido, para
  // não importar a planilha da Montagem por engano dentro da Engenharia.
  const cnpjEscolhido = empresa ? CNPJ_POR_EMPRESA[empresa as NomeEmpresa]?.replace(/\D/g, '') : undefined;
  const cnpjDiverge = !!leitura && !!cnpjEscolhido && leitura.cnpjsNoArquivo.length > 0 && !leitura.cnpjsNoArquivo.includes(cnpjEscolhido);

  async function confirmar() {
    if (!empresa || !leitura || !arquivoNome) return;
    setErro(null);
    try {
      await importar.mutateAsync({ empresa, arquivoNome, leitura });
      setSucesso(`${leitura.linhas.length} lançamento(s) de ${empresa} importados (${descreverMeses(leitura.meses)}).`);
      setLeitura(null);
      setArquivoNome(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível importar.');
    }
  }

  const total = leitura?.linhas.filter((l) => l.situacao !== 'cancelada').reduce((soma, l) => soma + l.valor, 0) ?? 0;
  const ultimas = (importacoes ?? []).filter((i) => !empresa || i.empresa === empresa).slice(0, 3);

  return (
    <Card style={styles.card}>
      <SectionHeader
        title="Atualizar contas a pagar"
        subtitle="Uma vez por mês, anexe a planilha de cada CNPJ. Os meses que vierem no arquivo substituem os que já estavam no app."
      />

      <SelectField label="Empresa (CNPJ)" value={empresa} options={[...EMPRESAS]} onChange={setEmpresa} placeholder="Selecione" />

      {empresa ? (
        <AreaArquivo onArquivo={aoEscolher} desabilitado={importar.isPending} />
      ) : (
        <Text style={styles.nota}>Escolha a empresa antes de anexar a planilha.</Text>
      )}

      {leitura && arquivoNome ? (
        <View style={styles.previa}>
          <Text style={styles.previaTitulo}>{arquivoNome}</Text>
          <Text style={styles.nota}>
            {leitura.linhas.length} lançamento(s) · {descreverMeses(leitura.meses)} · total {formatBRL(total)}
            {leitura.ignoradas > 0 ? ` · ${leitura.ignoradas} linha(s) ignorada(s) (totais ou de anos anteriores já quitadas)` : ''}
          </Text>
          <Text style={styles.nota}>
            Colunas usadas: {Object.values(leitura.colunas).join(', ')} (aba &ldquo;{leitura.aba}&rdquo;)
          </Text>
          {cnpjDiverge ? (
            <Text style={styles.erro}>
              O CNPJ da planilha ({leitura.cnpjsNoArquivo.join(', ')}) não é o de {empresa}. Confira a empresa escolhida.
            </Text>
          ) : null}
          <View style={styles.acoes}>
            <PrimaryButton
              label={importar.isPending ? 'Importando...' : `Importar para ${empresa}`}
              onPress={confirmar}
              disabled={importar.isPending || cnpjDiverge || leitura.linhas.length === 0}
            />
            <PrimaryButton
              label="Cancelar"
              variant="ghost"
              onPress={() => {
                setLeitura(null);
                setArquivoNome(null);
              }}
              disabled={importar.isPending}
            />
          </View>
        </View>
      ) : null}

      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
      {sucesso ? <Text style={styles.sucesso}>{sucesso}</Text> : null}

      {ultimas.length > 0 ? (
        <View style={styles.historico}>
          <Text style={styles.historicoTitulo}>Últimas importações{empresa ? ` — ${empresa}` : ''}</Text>
          {ultimas.map((i) => (
            <View key={i.id} style={styles.importacao}>
              <Text style={[styles.nota, styles.importacaoTexto]}>
                {formatDateTimeBR(i.createdAt)} · {i.arquivoNome} · {i.linhas} lançamento(s) · {descreverMeses(i.meses)}
                {empresa ? '' : ` · ${i.empresa}`}
              </Text>
              <Pressable onPress={() => pedirDesfazer(i)} disabled={desfazer.isPending} hitSlop={8}>
                <Text style={styles.desfazer}>{desfazer.isPending && desfazer.variables === i.id ? 'Desfazendo...' : 'Desfazer'}</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  nota: { ...typography.caption, color: colors.textSecondary },
  previa: { gap: 4, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  previaTitulo: { ...typography.bodyStrong, color: colors.textPrimary },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  erro: { ...typography.caption, color: colors.negative },
  sucesso: { ...typography.caption, color: colors.positive },
  historico: { gap: 2, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  historicoTitulo: { ...typography.captionStrong, color: colors.textPrimary },
  importacao: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  importacaoTexto: { flexShrink: 1 },
  desfazer: { ...typography.captionStrong, color: colors.negative },
});
