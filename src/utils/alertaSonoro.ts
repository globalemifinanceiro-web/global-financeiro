import { Platform, Vibration } from 'react-native';

/**
 * Alerta "sonoro" multiplataforma. Na web, toca um bipe curto via Web Audio API (não precisa de
 * nenhum arquivo de áudio). No app nativo (iOS/Android), usa vibração — é o equivalente prático a
 * um alerta sonoro num celular e não depende de um arquivo .mp3 embutido no app.
 */
export function tocarAlertaSonoro(): void {
  if (Platform.OS === 'web') {
    try {
      const AudioContextRef = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextRef();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.35);
      oscillator.onended = () => ctx.close();
    } catch {
      // Ambiente sem suporte a Web Audio (ex.: SSR) — silenciosamente ignora, o alerta visual já basta.
    }
    return;
  }

  Vibration.vibrate([0, 200, 100, 200]);
}
