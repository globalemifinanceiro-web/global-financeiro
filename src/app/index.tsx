import { useVideoPlayer, VideoView } from 'expo-video';
import { Redirect } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions } from 'react-native';
import { useSessionStore } from '@/stores/useSessionStore';
import { breakpoints, colors, radius, spacing, typography } from '@/theme';

const introSource = require('../../assets/brand/intro.mp4');
// O vídeo dura ~6.04s. Em vez de confiar só no evento "playToEnd" (que na prática não dispara de
// forma confiável em todo navegador/dispositivo, deixando a tela "presa" no último frame até um
// timeout longo), cortamos direto no tamanho real do vídeo — o corte fica sempre previsível.
const DURACAO_MAXIMA_MS = 6200;

// Proporção real do vídeo (416x752, retrato de celular) — usada para "emular" uma tela de
// celular quando o app abre num navegador de computador, em vez de esticar o vídeo pela janela.
const RAZAO_VIDEO = 416 / 752;
const LARGURA_TELA_CELULAR = 380;

export default function SplashRedirect() {
  const hidratado = useSessionStore((state) => state.hidratado);
  const usuario = useSessionStore((state) => state.usuario);
  const [introConcluida, setIntroConcluida] = useState(false);
  const finalizouRef = useRef(false);
  const { width: larguraJanela } = useWindowDimensions();

  const player = useVideoPlayer(introSource, (instance) => {
    instance.muted = true;
    instance.loop = false;
  });

  useEffect(() => {
    function concluir() {
      if (finalizouRef.current) return;
      finalizouRef.current = true;
      setIntroConcluida(true);
    }

    // No web, o play() chamado logo no mount às vezes coincide com o carregamento/"load" interno
    // que o VideoView ainda está fazendo no <video>, e a chamada se perde (o vídeo fica parado em
    // readyToPlay com currentTime 0 para sempre). Por isso tentamos tocar assim que montar E de
    // novo sempre que o player avisar que está pronto ("readyToPlay") — cobre os dois casos.
    player.play();
    const statusSubscription = player.addListener('statusChange', ({ status }) => {
      if (status === 'readyToPlay' && !player.playing) {
        player.play();
      }
    });

    const subscription = player.addListener('playToEnd', concluir);
    const timeout = setTimeout(concluir, DURACAO_MAXIMA_MS);

    return () => {
      subscription.remove();
      statusSubscription.remove();
      clearTimeout(timeout);
    };
  }, [player]);

  if (hidratado && introConcluida) {
    return <Redirect href={usuario ? '/dashboard' : '/login'} />;
  }

  const isDesktop = larguraJanela >= breakpoints.tablet;
  const videoStyle = isDesktop
    ? { width: LARGURA_TELA_CELULAR, height: LARGURA_TELA_CELULAR / RAZAO_VIDEO, borderRadius: radius.lg, overflow: 'hidden' as const }
    : styles.videoCheio;

  return (
    <Pressable style={styles.wrap} onPress={() => setIntroConcluida(true)}>
      <VideoView style={videoStyle} player={player} contentFit="cover" nativeControls={false} pointerEvents="none" />
      <Pressable style={styles.pularBotao} onPress={() => setIntroConcluida(true)}>
        <Text style={styles.pularTexto}>Pular ›</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  videoCheio: { width: '100%', height: '100%' },
  pularBotao: {
    position: 'absolute',
    bottom: spacing.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  pularTexto: {
    ...typography.captionStrong,
    color: colors.textInverse,
  },
});
