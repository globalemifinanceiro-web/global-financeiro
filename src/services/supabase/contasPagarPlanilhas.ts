import { supabase } from './client';
import { selecionarTodas } from './paginacao';
import type { LeituraPlanilha, SituacaoContaPagar } from '@/services/importacao/planilhaContasPagar';
import type { ContaFinanceira } from '@/types/finance';

interface ContaPagarDbRow {
  id: string;
  empresa: string;
  fornecedor: string;
  projeto: string | null;
  categoria: string | null;
  departamento: string | null;
  numero_documento: string | null;
  vencimento: string;
  valor: number;
  situacao: SituacaoContaPagar;
  dt_pagamento: string | null;
}

/** Contas a pagar importadas das planilhas, no formato das telas. Canceladas ficam de fora. */
export async function listarContasPagarPlanilhas(): Promise<ContaFinanceira[]> {
  const linhas = await selecionarTodas<ContaPagarDbRow>((de, ate) =>
    supabase
      .from('contas_pagar_planilhas')
      .select('id, empresa, fornecedor, projeto, categoria, departamento, numero_documento, vencimento, valor, situacao, dt_pagamento')
      .neq('situacao', 'cancelada')
      .order('vencimento', { ascending: true })
      .order('id', { ascending: true })
      .range(de, ate)
  );

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return linhas.map((row) => {
    const paga = row.situacao === 'paga';
    return {
      id: row.id,
      tipo: 'pagar',
      clienteOuFornecedor: row.fornecedor,
      projeto: row.projeto ?? '',
      categoria: row.categoria ?? 'Não informado',
      departamento: row.departamento ?? '',
      contaCorrente: '',
      empresa: row.empresa,
      numeroDocumento: row.numero_documento ?? '',
      vencimento: row.vencimento,
      dataLiquidacao: row.dt_pagamento ?? undefined,
      valorDocumento: Number(row.valor),
      valorLiquido: Number(row.valor),
      situacao: paga ? 'liquidado' : new Date(`${row.vencimento}T00:00:00`) < hoje ? 'vencido' : 'aberto',
    };
  });
}

export interface ImportacaoContasPagar {
  id: string;
  empresa: string;
  arquivoNome: string;
  linhas: number;
  meses: string[];
  createdAt: string;
}

/** Troca, numa transação só, os lançamentos da empresa nos meses presentes no arquivo. */
export async function importarContasPagar(empresa: string, arquivoNome: string, leitura: LeituraPlanilha): Promise<void> {
  const { error } = await supabase.rpc('importar_contas_pagar', {
    p_empresa: empresa,
    p_arquivo: arquivoNome,
    p_meses: leitura.meses,
    p_linhas: leitura.linhas,
  });
  if (error) throw new Error(error.message);
}

export async function listarImportacoesContasPagar(): Promise<ImportacaoContasPagar[]> {
  const { data, error } = await supabase
    .from('importacoes_contas_pagar')
    .select('id, empresa, arquivo_nome, linhas, meses, created_at')
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) throw new Error(error.message);
  return (data as { id: string; empresa: string; arquivo_nome: string; linhas: number; meses: string[]; created_at: string }[]).map((row) => ({
    id: row.id,
    empresa: row.empresa,
    arquivoNome: row.arquivo_nome,
    linhas: row.linhas,
    meses: row.meses,
    createdAt: row.created_at,
  }));
}
