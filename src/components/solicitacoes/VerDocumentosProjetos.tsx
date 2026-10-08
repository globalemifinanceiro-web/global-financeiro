import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { buscarDocumentosProjetos, type DocumentosProjetos } from '@/services/supabase/documentosProjetos';
import { colors, radius, spacing, typography } from '@/theme';

async function abrir(url: string) {
  if (Platform.OS === 'web') {
    window.open(url, '_blank');
    return;
  }
  const { openURL } = await import('expo-linking');
  await openURL(url);
}

/**
 * "Ver NF ›" de uma solicitação do Projetos Global: busca links novos na hora (expiram em 1 h) e
 * mostra a lista para abrir. A lista (em vez de abrir direto) evita o bloqueio de pop-up do
 * navegador, que barra janelas abertas depois de uma espera.
 */
export function VerDocumentosProjetos({ solicitacaoId, rotulo = 'Ver NF ›' }: { solicitacaoId: string; rotulo?: string }) {
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [documentos, setDocumentos] = useState<DocumentosProjetos | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    setAberto(true);
    setCarregando(true);
    setErro(null);
    try {
      setDocumentos(await buscarDocumentosProjetos(solicitacaoId));
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível buscar os documentos.');
    } finally {
      setCarregando(false);
    }
  }

  const lista = documentos
    ? [
        ...documentos.documentoAssinado.map((d) => ({ ...d, destaque: true })),
        ...documentos.anexos.map((d) => ({ ...d, destaque: false })),
      ]
    : [];

  return (
    <>
      <Pressable onPress={carregar} hitSlop={8}>
        <Text style={styles.link}>{rotulo}</Text>
      </Pressable>

      <Modal visible={aberto} transparent animationType="fade" onRequestClose={() => setAberto(false)}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.titulo}>Documentos da solicitação</Text>
            {carregando ? (
              <ActivityIndicator color={colors.blue} />
            ) : erro ? (
              <Text style={styles.erro}>{erro}</Text>
            ) : lista.length === 0 ? (
              <Text style={styles.nota}>Nenhum documento disponível para esta solicitação.</Text>
            ) : (
              <ScrollView style={styles.lista}>
                {lista.map((d, indice) => (
                  <Pressable key={`${d.url}-${indice}`} style={styles.item} onPress={() => abrir(d.url)}>
                    <Ionicons name={d.destaque ? 'ribbon-outline' : 'document-attach-outline'} size={18} color={colors.blue} />
                    <View style={styles.itemTexto}>
                      <Text style={styles.itemNome} numberOfLines={2}>
                        {d.nome}
                      </Text>
                      <Text style={styles.nota}>{d.destaque ? 'Documento assinado (Gestor e Diretoria)' : 'Anexo'}</Text>
                    </View>
                    <Ionicons name="open-outline" size={16} color={colors.textSecondary} />
                  </Pressable>
                ))}
              </ScrollView>
            )}
            <Text style={styles.nota}>Os links valem por 1 hora; depois, é só abrir esta lista de novo.</Text>
            <PrimaryButton label="Fechar" variant="ghost" onPress={() => setAberto(false)} />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  link: { ...typography.captionStrong, color: colors.blue },
  overlay: { flex: 1, backgroundColor: 'rgba(11,37,69,0.45)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  card: { width: '100%', maxWidth: 440, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  titulo: { ...typography.heading, color: colors.textPrimary },
  lista: { maxHeight: 320 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemTexto: { flex: 1, gap: 2 },
  itemNome: { ...typography.bodyStrong, color: colors.textPrimary },
  nota: { ...typography.caption, color: colors.textSecondary },
  erro: { ...typography.caption, color: colors.negative },
});
