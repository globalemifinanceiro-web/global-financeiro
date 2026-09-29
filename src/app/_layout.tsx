import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * Desativa a tradução automática do navegador (Chrome/Google Translate). Ela embaralha os ícones
 * (viram glifos aleatórios que parecem emoji) e também nomes/textos reais — ex.: "Global Serviço"
 * virou "Global ova", "Dashboard" virou "Painel" — inaceitável num app financeiro.
 *
 * O jeito "certo" (`+html.tsx`) só funciona com `web.output: "static"`; usamos "single" (ver
 * histórico de por quê), então isso precisa ser feito em tempo de execução, não no HTML gerado.
 */
function useDesativarTraducaoAutomatica() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.documentElement.setAttribute('translate', 'no');
    document.documentElement.lang = 'pt-BR';
    if (!document.querySelector('meta[name="google"]')) {
      const meta = document.createElement('meta');
      meta.name = 'google';
      meta.content = 'notranslate';
      document.head.appendChild(meta);
    }
  }, []);
}

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1 } } }));
  useDesativarTraducaoAutomatica();

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
