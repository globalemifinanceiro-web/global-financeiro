import { supabase } from './client';
import { invocarFuncao } from './functions';
import { selecionarTodas } from './paginacao';
import type { EventoHistorico, ResponsavelEtapa, SituacaoSolicitacao, SolicitacaoProjetos } from '@/types/solicitacao';
import { INICIO_ANO } from '@/utils/periodo';

interface SolicitacaoRow {
  id: string;
  codigo: number | null;
  titulo: string;
  situacao: SituacaoSolicitacao;
  valor: number | null;
  empresa: string | null;
  projeto_pcg: string | null;
  projeto_cliente: string | null;
  fornecedor: string | null;
  lancado_por_nome: string | null;
  lancado_em: string | null;
  atualizado_em: string;
  etapa_nome: string | null;
  etapa_papel: string | null;
  etapa_desde: string | null;
  etapa_prazo: string | null;
  responsaveis: ResponsavelEtapa[];
  historico: EventoHistorico[];
}

const ABERTAS = ['enviado', 'pendente_gestor', 'pendente_diretor', 'devolvido', 'liberado_financeiro', 'pagamento_agendado'];

/** Lançadas no ano vigente, mais as que ainda estão em andamento de qualquer ano. */
export async function listarSolicitacoesProjetos(): Promise<SolicitacaoProjetos[]> {
  const linhas = await selecionarTodas<SolicitacaoRow>((de, ate) =>
    supabase
      .from('solicitacoes_projetos')
      .select('*')
      .or(`lancado_em.gte.${INICIO_ANO},situacao.in.(${ABERTAS.join(',')})`)
      .order('atualizado_em', { ascending: false })
      .order('id', { ascending: true })
      .range(de, ate)
  );
  return linhas.map((row) => ({
    id: row.id,
    codigo: row.codigo,
    titulo: row.titulo,
    situacao: row.situacao,
    valor: row.valor === null ? null : Number(row.valor),
    empresa: row.empresa,
    projetoPcg: row.projeto_pcg,
    projetoCliente: row.projeto_cliente,
    fornecedor: row.fornecedor,
    lancadoPorNome: row.lancado_por_nome,
    lancadoEm: row.lancado_em,
    atualizadoEm: row.atualizado_em,
    etapaNome: row.etapa_nome,
    etapaPapel: row.etapa_papel,
    etapaDesde: row.etapa_desde,
    etapaPrazo: row.etapa_prazo,
    responsaveis: row.responsaveis ?? [],
    historico: row.historico ?? [],
  }));
}

export async function sincronizarSolicitacoesProjetos(): Promise<{ sincronizadas: number }> {
  return invocarFuncao<{ sincronizadas: number }>('sync-solicitacoes-projetos');
}

export interface PainelSolicitacoes {
  solicitacoes: SolicitacaoProjetos[];
  /** Falha da última sincronização (os dados mostrados são os da anterior). */
  erroSincronizacao: string | null;
}

/** Sincroniza com o Projetos e devolve o espelho local — se a sincronização falhar, mostra o que já havia. */
export async function carregarPainelSolicitacoes(): Promise<PainelSolicitacoes> {
  let erroSincronizacao: string | null = null;
  try {
    await sincronizarSolicitacoesProjetos();
  } catch (e) {
    erroSincronizacao = e instanceof Error ? e.message : 'Falha ao sincronizar com o Projetos Global.';
  }
  return { solicitacoes: await listarSolicitacoesProjetos(), erroSincronizacao };
}
