import { supabase } from './client';
import { invocarFuncao } from './functions';
import { selecionarTodas } from './paginacao';
import type { OrcamentoProjetos } from '@/types/orcamento';
import { INICIO_ANO } from '@/utils/periodo';

interface OrcamentoRow {
  id: string;
  codigo: string | null;
  projeto_pcg: string | null;
  projeto_cliente: string | null;
  empresa: string | null;
  fornecedor: string | null;
  tipo_documento: string | null;
  numero_documento: string | null;
  emissao: string | null;
  vencimento: string | null;
  valor: number | null;
  forma_pagamento: string | null;
  categoria: string | null;
  descricao: string | null;
  enviado_por: string | null;
  enviado_em: string | null;
  gestor_nome: string | null;
  gestor_em: string | null;
  diretoria_nome: string | null;
  aprovado_em: string;
}

/** Orçamentos aprovados pela Diretoria no ano vigente, do mais recente para o mais antigo. */
export async function listarOrcamentosProjetos(): Promise<OrcamentoProjetos[]> {
  const linhas = await selecionarTodas<OrcamentoRow>((de, ate) =>
    supabase
      .from('orcamentos_projetos')
      .select('*')
      .gte('aprovado_em', INICIO_ANO)
      .order('aprovado_em', { ascending: false })
      .order('id', { ascending: true })
      .range(de, ate)
  );
  return linhas.map((row) => ({
    id: row.id,
    codigo: row.codigo,
    projetoPcg: row.projeto_pcg,
    projetoCliente: row.projeto_cliente,
    empresa: row.empresa,
    fornecedor: row.fornecedor,
    tipoDocumento: row.tipo_documento,
    numeroDocumento: row.numero_documento,
    emissao: row.emissao,
    vencimento: row.vencimento,
    valor: row.valor === null ? null : Number(row.valor),
    formaPagamento: row.forma_pagamento,
    categoria: row.categoria,
    descricao: row.descricao,
    enviadoPor: row.enviado_por,
    enviadoEm: row.enviado_em,
    gestorNome: row.gestor_nome,
    gestorEm: row.gestor_em,
    diretoriaNome: row.diretoria_nome,
    aprovadoEm: row.aprovado_em,
  }));
}

export interface PainelOrcamentos {
  orcamentos: OrcamentoProjetos[];
  /** Falha da última sincronização (os dados mostrados são os da anterior). */
  erroSincronizacao: string | null;
}

/** Sincroniza com o Projetos e devolve o espelho local — se a sincronização falhar, mostra o que já havia. */
export async function carregarPainelOrcamentos(): Promise<PainelOrcamentos> {
  let erroSincronizacao: string | null = null;
  try {
    await invocarFuncao<{ sincronizados: number }>('sync-orcamentos-projetos');
  } catch (e) {
    erroSincronizacao = e instanceof Error ? e.message : 'Falha ao sincronizar com o Projetos Global.';
  }
  return { orcamentos: await listarOrcamentosProjetos(), erroSincronizacao };
}
