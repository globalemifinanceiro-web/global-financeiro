import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SelectField } from '@/components/ui/SelectField';
import { TextField } from '@/components/ui/TextField';
import { EMPRESAS } from '@/constants/empresas';
import { useRegistrarComprovante, useTitulosPendentes } from '@/hooks/useConciliacoes';
import type { ResultadoComprovante, TipoConciliacao, TituloPendente } from '@/types/conciliacao';
import { formatBRL } from '@/utils/currency';
import { formatDateBR } from '@/utils/date';
import { colors, radius, spacing, typography } from '@/theme';

interface ArquivoSelecionado {
  uri: string;
  nome: string;
  tipo?: string;
}

const DATA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function hojeIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function rotuloTitulo(t: TituloPendente): string {
  return [t.descricao, formatBRL(t.valor), `venc. ${formatDateBR(t.vencimento)}`, t.baixaNaOrigem ? 'Projetos Global' : null]
    .filter(Boolean)
    .join(' · ');
}

export function ComprovanteForm({
  visivel,
  onFechar,
  onSalvo,
}: {
  visivel: boolean;
  onFechar: () => void;
  onSalvo: (resultado: ResultadoComprovante) => void;
}) {
  const registrar = useRegistrarComprovante();
  const { data: titulos } = useTitulosPendentes();

  const [tipo, setTipo] = useState<TipoConciliacao>('recebimento');
  const [empresa, setEmpresa] = useState<string | undefined>(undefined);
  const [tituloRotulo, setTituloRotulo] = useState<string | undefined>(undefined);
  const [dataPagamento, setDataPagamento] = useState(hojeIso());
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [arquivo, setArquivo] = useState<ArquivoSelecionado | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // Rótulo -> título, só com os do tipo (e empresa) escolhidos. Rótulos repetidos ganham sufixo.
  const opcoes = useMemo(() => {
    const mapa = new Map<string, TituloPendente>();
    for (const t of titulos ?? []) {
      if (t.tipo !== tipo) continue;
      if (empresa && t.empresa && t.empresa !== empresa) continue;
      let rotulo = rotuloTitulo(t);
      for (let n = 2; mapa.has(rotulo); n++) rotulo = `${rotuloTitulo(t)} (${n})`;
      mapa.set(rotulo, t);
    }
    return mapa;
  }, [titulos, tipo, empresa]);

  const tituloSelecionado = tituloRotulo ? opcoes.get(tituloRotulo) : undefined;

  function limpar() {
    setTipo('recebimento');
    setEmpresa(undefined);
    setTituloRotulo(undefined);
    setDataPagamento(hojeIso());
    setValor('');
    setDescricao('');
    setArquivo(null);
    setErro(null);
  }

  function fechar() {
    limpar();
    onFechar();
  }

  function trocarTipo(novo: TipoConciliacao) {
    setTipo(novo);
    setTituloRotulo(undefined);
  }

  function escolherTitulo(rotulo: string | undefined) {
    setTituloRotulo(rotulo);
    const t = rotulo ? opcoes.get(rotulo) : undefined;
    if (!t) return;
    setValor(t.valor.toFixed(2).replace('.', ','));
    if (!empresa && t.empresa) setEmpresa(t.empresa);
  }

  async function escolherArquivo() {
    const resultado = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
    if (resultado.canceled || !resultado.assets?.[0]) return;
    const item = resultado.assets[0];
    setArquivo({ uri: item.uri, nome: item.name, tipo: item.mimeType });
  }

  async function tirarFoto() {
    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissao.granted) {
      setErro('Permissão de câmera negada.');
      return;
    }
    const resultado = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (resultado.canceled || !resultado.assets?.[0]) return;
    setArquivo({ uri: resultado.assets[0].uri, nome: `comprovante-${Date.now()}.jpg`, tipo: 'image/jpeg' });
  }

  async function salvar() {
    setErro(null);
    const valorNumerico = Number(valor.replace(/\./g, '').replace(',', '.'));
    if (!arquivo) return setErro('Anexe o comprovante.');
    if (!DATA_REGEX.test(dataPagamento)) return setErro('Data do pagamento deve estar no formato AAAA-MM-DD.');
    if (!valorNumerico || valorNumerico <= 0) return setErro('Informe um valor válido.');

    try {
      const resultado = await registrar.mutateAsync({
        tipo,
        empresa: empresa ?? null,
        dataPagamento,
        valor: valorNumerico,
        descricao: descricao.trim() || null,
        arquivo: { uri: arquivo.uri, nome: arquivo.nome, mimeType: arquivo.tipo },
        vinculo: tituloSelecionado?.vinculo ?? null,
      });
      limpar();
      onSalvo(resultado);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar o comprovante.');
    }
  }

  return (
    <Modal visible={visivel} transparent animationType="slide" onRequestClose={fechar}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.titulo}>Novo comprovante</Text>
            <Pressable onPress={fechar}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.form}>
            <View style={styles.tipoRow}>
              {(['recebimento', 'pagamento'] as const).map((opcao) => (
                <Pressable key={opcao} style={[styles.tipoPill, tipo === opcao && styles.tipoPillAtivo]} onPress={() => trocarTipo(opcao)}>
                  <Text style={[styles.tipoTexto, tipo === opcao && styles.tipoTextoAtivo]}>
                    {opcao === 'recebimento' ? 'Recebimento (cliente pagou)' : 'Pagamento (nós pagamos)'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <SelectField label="Empresa (CNPJ)" value={empresa} options={[...EMPRESAS]} onChange={setEmpresa} placeholder="Selecione" />

            <SelectField
              label={tipo === 'recebimento' ? 'Conta a receber correspondente' : 'Nota fiscal correspondente'}
              value={tituloRotulo}
              options={[...opcoes.keys()]}
              onChange={escolherTitulo}
              placeholder="Sem vínculo"
            />
            {tituloSelecionado ? (
              <Text style={styles.nota}>
                {tituloSelecionado.baixaNaOrigem
                  ? 'Essa nota vem do Projetos Global: ao salvar, o pagamento e o comprovante também são registrados lá (comprovante de até 4 MB).'
                  : tipo === 'recebimento'
                    ? 'Ao salvar, a data vai para a coluna DT PGTO da planilha e o título passa a constar como recebido.'
                    : 'Ao salvar, a nota fiscal passa a constar como paga.'}
              </Text>
            ) : null}

            <View style={styles.anexoRow}>
              <PrimaryButton label="Escolher arquivo" variant="ghost" onPress={escolherArquivo} />
              <PrimaryButton label="Tirar foto" variant="ghost" onPress={tirarFoto} />
            </View>
            {arquivo ? (
              <View style={styles.anexoSelecionado}>
                <Ionicons name="document-attach-outline" size={16} color={colors.blue} />
                <Text style={styles.anexoNome} numberOfLines={1}>
                  {arquivo.nome}
                </Text>
              </View>
            ) : null}

            <TextField label="Data do pagamento" value={dataPagamento} onChangeText={setDataPagamento} placeholder="AAAA-MM-DD" />
            <TextField label="Valor (R$)" value={valor} onChangeText={setValor} placeholder="0,00" keyboardType="decimal-pad" />
            <TextField label="Descrição (opcional)" value={descricao} onChangeText={setDescricao} placeholder="Ex.: Pix recebido do cliente" />

            {erro ? <Text style={styles.erro}>{erro}</Text> : null}

            <PrimaryButton label={registrar.isPending ? 'Enviando...' : 'Salvar comprovante'} onPress={salvar} disabled={registrar.isPending} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(11,37,69,0.45)', justifyContent: 'flex-end' },
  card: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: '90%',
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  titulo: { ...typography.heading, color: colors.textPrimary },
  form: { gap: spacing.md },
  tipoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tipoPill: {
    flexGrow: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  tipoPillAtivo: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  tipoTexto: { ...typography.body, color: colors.textSecondary },
  tipoTextoAtivo: { color: colors.blue, fontWeight: '600' },
  nota: { ...typography.caption, color: colors.textSecondary },
  anexoRow: { flexDirection: 'row', gap: spacing.sm },
  anexoSelecionado: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  anexoNome: { ...typography.caption, color: colors.textPrimary, flexShrink: 1 },
  erro: { ...typography.caption, color: colors.negative },
});
