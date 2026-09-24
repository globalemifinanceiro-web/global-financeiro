import type { PerfilAcesso } from '@/types/finance';

export type PainelId =
  | 'dashboard'
  | 'contas-a-pagar'
  | 'contas-a-receber'
  | 'fluxo-de-caixa'
  | 'projetos'
  | 'relatorios'
  | 'alertas'
  | 'perfil'
  | 'configuracoes'
  | 'integracoes';

/**
 * Matriz estática de permissões por perfil para o protótipo (v1, dados fictícios).
 * Quando o backend real existir, isso deve ser substituído por uma tabela de permissões
 * no Supabase + Row Level Security — a UI só precisa continuar consultando `podeAcessar`.
 */
const PERMISSOES: Record<PerfilAcesso, PainelId[]> = {
  admin: [
    'dashboard',
    'contas-a-pagar',
    'contas-a-receber',
    'fluxo-de-caixa',
    'projetos',
    'relatorios',
    'alertas',
    'perfil',
    'configuracoes',
    'integracoes',
  ],
  diretoria: ['dashboard', 'contas-a-pagar', 'contas-a-receber', 'fluxo-de-caixa', 'projetos', 'relatorios', 'alertas', 'perfil'],
  financeiro: [
    'dashboard',
    'contas-a-pagar',
    'contas-a-receber',
    'fluxo-de-caixa',
    'projetos',
    'relatorios',
    'alertas',
    'perfil',
    'integracoes',
  ],
  consulta: ['dashboard', 'relatorios', 'alertas', 'perfil'],
};

export function podeAcessar(perfil: PerfilAcesso, painel: PainelId): boolean {
  return PERMISSOES[perfil].includes(painel);
}

export function paineisPermitidos(perfil: PerfilAcesso): PainelId[] {
  return PERMISSOES[perfil];
}

export const LABEL_PERFIL: Record<PerfilAcesso, string> = {
  admin: 'Administrador',
  diretoria: 'Diretoria',
  financeiro: 'Financeiro',
  consulta: 'Consulta',
};
