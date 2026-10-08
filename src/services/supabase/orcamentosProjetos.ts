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
  numero_documento: string | null;
  emissao: string | null;
  validade: string | null;
  valor: number | null;
  condicao_pagamento: string | null;
  descricao: string | null;
  itens: unknown[] | null;
  enviado_por: string | null;
  gestor_nome: string | null;
  diretoria_nome: string | null;
  aprovado_em: string;
  arquivo_path: string | null;
  arquivo_nome: string | null;
  assinado_path: string | null;
  assinado_nome: string | null;
}

/** Orçamentos aprovados pela Diretoria no ano vigente, do mais recente para o mais antigo. */
export async function listarOrcamentosProjetos(): Promise<OrcamentoProjetos[]> {
  const linhas = await selecionarTodas<OrcamentoRow>((de, ate) =>
    supabase
      .from('orcamentos_projetos')
      .select(
        'id, codigo, projeto_pcg, projeto_cliente, empresa, fornecedor, numero_documento, emissao, validade, valor, condicao_pagamento, descricao, itens, enviado_por, gestor_nome, diretoria_nome, aprovado_em, arquivo_path, arquivo_nome, assinado_path, assinado_nome'
      )
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
    numeroDocumento: row.numero_documento,
    emissao: row.emissao,
    validade: row.validade,
    valor: row.valor === null ? null : Number(row.valor),
    condicaoPagamento: row.condicao_pagamento,
    descricao: row.descricao,
    quantidadeItens: Array.isArray(row.itens) ? row.itens.length : 0,
    enviadoPor: row.enviado_por,
    gestorNome: row.gestor_nome,
    diretoriaNome: row.diretoria_nome,
    aprovadoEm: row.aprovado_em,
    arquivoPath: row.arquivo_path,
    arquivoNome: row.arquivo_nome,
    assinadoPath: row.assinado_path,
    assinadoNome: row.assinado_nome,
  }));
}

/** URL assinada (5 min) da cópia do arquivo do orçamento guardada no Financeiro. */
export async function urlArquivoOrcamento(caminho: string, segundos = 300): Promise<string> {
  const { data, error } = await supabase.storage.from('orcamentos').createSignedUrl(caminho, segundos);
  if (error) throw new Error(error.message);
  return data.signedUrl;
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
