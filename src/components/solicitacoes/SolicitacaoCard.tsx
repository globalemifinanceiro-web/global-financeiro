import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SolicitacaoProjetos } from '@/types/solicitacao';
import { formatBRL } from '@/utils/currency';
import { formatDateTimeBR } from '@/utils/date';
import { colors, radius, spacing, typography } from '@/theme';
import { comQuemEsta, diasParado } from './comQuemEsta';

export function SolicitacaoCard({ solicitacao: s, mostrarResponsavel }: { solicitacao: SolicitacaoProjetos; mostrarResponsavel: boolean }) {
  const [aberto, setAberto] = useState(false);
  const dias = diasParado(s);
  const atrasada = !!s.etapaPrazo && new Date(s.etapaPrazo) < new Date();

  return (
    <Pressable style={[styles.card, atrasada && mostrarResponsavel && styles.cardAtrasado]} onPress={() => setAberto((v) => !v)}>
      <Text style={styles.titulo} numberOfLines={2}>
        {s.codigo ? `#${s.codigo} · ` : ''}
        {s.titulo}
      </Text>
      <Text style={styles.meta}>
        {[s.projetoPcg ? `PCG ${s.projetoPcg}` : null, s.fornecedor, s.empresa].filter(Boolean).join(' · ')}
      </Text>
      {s.valor !== null ? <Text style={styles.valor}>{formatBRL(s.valor)}</Text> : null}
      {mostrarResponsavel ? (
        <Text style={[styles.parado, atrasada && styles.paradoAtrasado]}>
          Parada com: {comQuemEsta(s)} · há {dias} dia(s){atrasada ? ' · prazo vencido' : ''}
        </Text>
      ) : null}
      {s.lancadoPorNome ? <Text style={styles.meta}>Lançada por {s.lancadoPorNome}</Text> : null}

      {aberto ? (
        <View style={styles.historico}>
          <Text style={styles.historicoTitulo}>Histórico</Text>
          {s.historico.length === 0 ? (
            <Text style={styles.meta}>Sem eventos registrados.</Text>
          ) : (
            s.historico.map((evento, indice) => (
              <View key={`${evento.data}-${indice}`} style={styles.evento}>
                <Text style={styles.eventoTexto}>
                  {formatDateTimeBR(evento.data)} · {evento.acao}
                  {evento.nome ? ` · ${evento.nome}` : ''}
                  {evento.cargo ? ` (${evento.cargo})` : ''}
                </Text>
                {evento.comentario ? <Text style={styles.meta}>&ldquo;{evento.comentario}&rdquo;</Text> : null}
              </View>
            ))
          )}
        </View>
      ) : (
        <Text style={styles.link}>Ver histórico ›</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 3,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cardAtrasado: { borderColor: colors.negative },
  titulo: { ...typography.bodyStrong, color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary },
  valor: { ...typography.bodyStrong, color: colors.textPrimary },
  parado: { ...typography.captionStrong, color: colors.warning },
  paradoAtrasado: { color: colors.negative },
  link: { ...typography.captionStrong, color: colors.blue, marginTop: 2 },
  historico: { gap: 4, marginTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.xs },
  historicoTitulo: { ...typography.captionStrong, color: colors.textPrimary },
  evento: { gap: 1 },
  eventoTexto: { ...typography.caption, color: colors.textPrimary },
});
