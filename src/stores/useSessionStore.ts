import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import { supabase } from '@/services/supabase/client';
import type { PerfilAcesso } from '@/types/finance';

export interface SessaoUsuario {
  nome: string;
  email: string;
  perfil: PerfilAcesso;
}

interface SessionState {
  usuario: SessaoUsuario | null;
  hidratado: boolean;
  carregandoLogin: boolean;
  erroLogin: string | null;
  entrar: (email: string, senha: string) => Promise<boolean>;
  sair: () => Promise<void>;
}

function traduzErro(mensagem: string): string {
  if (mensagem.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (mensagem.includes('Email not confirmed')) return 'E-mail ainda não confirmado.';
  return 'Não foi possível entrar. Tente novamente.';
}

function sessaoParaUsuario(session: Session | null): SessaoUsuario | null {
  if (!session?.user) return null;
  return {
    nome: (session.user.user_metadata?.nome as string | undefined) ?? session.user.email ?? 'Usuário',
    email: session.user.email ?? '',
    // Ainda não existe uma tabela de perfis/permissões no Supabase — hoje há uma única conta
    // (globalemifinanceiro@gmail.com) e ela é tratada como administradora. Quando outras contas
    // forem criadas, substituir isso por uma consulta real de perfil/papel.
    perfil: 'admin',
  };
}

export const useSessionStore = create<SessionState>((set) => ({
  usuario: null,
  hidratado: false,
  carregandoLogin: false,
  erroLogin: null,

  entrar: async (email, senha) => {
    set({ carregandoLogin: true, erroLogin: null });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) {
      set({ carregandoLogin: false, erroLogin: traduzErro(error.message) });
      return false;
    }
    set({ usuario: sessaoParaUsuario(data.session), carregandoLogin: false });
    return true;
  },

  sair: async () => {
    await supabase.auth.signOut();
    set({ usuario: null });
  },
}));

supabase.auth.getSession().then(({ data }) => {
  useSessionStore.setState({ usuario: sessaoParaUsuario(data.session), hidratado: true });
});

supabase.auth.onAuthStateChange((_event, session) => {
  useSessionStore.setState({ usuario: sessaoParaUsuario(session) });
});

// Rede de segurança: se getSession() nunca responder (ex.: sem rede no primeiro load), a splash
// não pode travar para sempre — depois de 4s liberamos a navegação assumindo "sem sessão".
setTimeout(() => {
  if (!useSessionStore.getState().hidratado) {
    useSessionStore.setState({ hidratado: true });
  }
}, 4000);
