import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SelectField } from '@/components/ui/SelectField';
import { TextField } from '@/components/ui/TextField';
import { EMPRESAS } from '@/constants/empresas';
import { useCriarNotaFiscal } from '@/hooks/useNotasFiscais';
import { enviarArquivoNotaFiscal } from '@/services/supabase/notasFiscais';
import { colors, radius, spacing, typography } from '@/theme';
import { FORMAS_PAGAMENTO } from '@/types/notaFiscal';

interface ArquivoSelecionado {
  uri: string;
  nome: string;
  tipo?: string;
}

const DATA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function NotaFiscalForm({
  visivel,
  empresaPadrao,
  onFechar,
}: {
  visivel: boolean;
  empresaPadrao: string;
  onFechar: () => void;
}) {
  const criar = useCriarNotaFiscal();
  const [empresa, setEmpresa] = useState(empresaPadrao);
  const [cliente, setCliente] = useState('');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [valor, setValor] = useState('');
  const [vencimento, setVencimento] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<string | undefined>(undefined);
  const [assinado, setAssinado] = useState(false);
  const [observacoes, setObservacoes] = useState('');
  const [arquivo, setArquivo] = useState<ArquivoSelecionado | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function limpar() {
    setEmpresa(empresaPadrao);
    setCliente('');
    setNumeroDocumento('');
    setValor('');
    setVencimento('');
    setFormaPagamento(undefined);
    setAssinado(false);
    setObservacoes('');
    setArquivo(null);
    setErro(null);
  }

  async function escolherArquivo() {
    const resultado = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
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
    const item = resultado.assets[0];
    setArquivo({ uri: item.uri, nome: `foto-${Date.now()}.jpg`, tipo: 'image/jpeg' });
  }

  async function salvar() {
    setErro(null);

    const valorNumerico = Number(valor.replace(/\./g, '').replace(',', '.'));
    if (!cliente.trim()) return setErro('Informe o cliente ou fornecedor.');
    if (!valorNumerico || valorNumerico <= 0) return setErro('Informe um valor válido.');
    if (!DATA_REGEX.test(vencimento)) return setErro('Vencimento deve estar no formato AAAA-MM-DD.');

    setEnviando(true);
    try {
      let arquivoPath: string | null = null;
      let arquivoNome: string | null = null;
      if (arquivo) {
        arquivoPath = await enviarArquivoNotaFiscal(arquivo.uri, arquivo.nome, arquivo.tipo);
        arquivoNome = arquivo.nome;
      }

      await criar.mutateAsync({
        empresa,
        clienteOuFornecedor: cliente.trim(),
        numeroDocumento: numeroDocumento.trim() || null,
        valor: valorNumerico,
        vencimento,
        formaPagamento: formaPagamento ?? null,
        assinado,
        arquivoPath,
        arquivoNome,
        observacoes: observacoes.trim() || null,
      });

      limpar();
      onFechar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar a nota fiscal.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal visible={visivel} transparent animationType="slide" onRequestClose={onFechar}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.titulo}>Nova nota fiscal</Text>
            <Pressable onPress={onFechar}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.form}>
            <Text style={styles.nota}>
              A leitura automática do documento ainda não está disponível — escolha o CNPJ certo e preencha os dados
              abaixo; é isso que decide para qual central esta nota vai.
            </Text>

            <SelectField label="Empresa (CNPJ)" value={empresa} options={[...EMPRESAS]} onChange={(v) => v && setEmpresa(v)} />

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

            <TextField label="Cliente ou fornecedor" value={cliente} onChangeText={setCliente} placeholder="Nome" />
            <TextField label="Número do documento (opcional)" value={numeroDocumento} onChangeText={setNumeroDocumento} placeholder="Ex.: 12345" />
            <TextField label="Valor (R$)" value={valor} onChangeText={setValor} placeholder="0,00" keyboardType="decimal-pad" />
            <TextField label="Vencimento" value={vencimento} onChangeText={setVencimento} placeholder="AAAA-MM-DD" />
            <SelectField
              label="Forma de pagamento"
              value={formaPagamento}
              options={FORMAS_PAGAMENTO}
              onChange={setFormaPagamento}
              placeholder="Selecione"
            />

            <Pressable style={styles.checkboxRow} onPress={() => setAssinado((v) => !v)}>
              <Ionicons name={assinado ? 'checkbox' : 'square-outline'} size={20} color={assinado ? colors.positive : colors.textSecondary} />
              <Text style={styles.checkboxLabel}>Já chegou assinada pelos responsáveis</Text>
            </Pressable>

            <TextField label="Observações (opcional)" value={observacoes} onChangeText={setObservacoes} placeholder="Notas internas" />

            {erro ? <Text style={styles.erro}>{erro}</Text> : null}

            <PrimaryButton label={enviando ? 'Salvando...' : 'Salvar'} onPress={salvar} disabled={enviando} />
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
  nota: { ...typography.caption, color: colors.textSecondary },
  anexoRow: { flexDirection: 'row', gap: spacing.sm },
  anexoSelecionado: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  anexoNome: { ...typography.caption, color: colors.textPrimary, flexShrink: 1 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  checkboxLabel: { ...typography.body, color: colors.textPrimary },
  erro: { ...typography.caption, color: colors.negative },
});
