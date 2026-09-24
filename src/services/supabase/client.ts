import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Global Financeiro] EXPO_PUBLIC_SUPABASE_URL/EXPO_PUBLIC_SUPABASE_ANON_KEY não configurados — ' +
      'o login não vai funcionar até essas variáveis serem definidas (veja .env.example).'
  );
}

/**
 * Cliente único do Supabase para o app. A URL e a chave "anon" não são segredo — só a service
 * role key (usada apenas no backend/Edge Functions) precisa ficar protegida.
 */
export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // No navegador a própria lib detecta sessão pela URL (fluxos de OAuth/magic link); no app
    // nativo isso não se aplica.
    detectSessionInUrl: Platform.OS === 'web',
  },
});
