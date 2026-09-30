import { supabase } from './client';
import type { ContaFinanceira } from '@/types/finance';

export type SituacaoContaReceberSheet = 'pendente' | 'paga' | 'cancelada';

export interface ContaReceberSheetRow {
  id: string;
  clienteOuFornecedor: string;
  empresa: string | null;
  vencimento: string;
  valor: number;
  situacao: SituacaoContaReceberSheet;
}

interface ContaReceberSheetDbRow {
  id: string;
  cliente: string;
  empresa: string | null;
  numero_documento: string | null;
  tipo_documento: string | null;
  vencimento: string;
  valor: number;
  dt_pagamento: string | null;
  situacao: SituacaoContaReceberSheet;
}

function paraContaFinanceira(row: ContaReceberSheetDbRow): ContaFinanceira {
  return {
    id: row.id,
    tipo: 'receber',
    clienteOuFornecedor: row.cliente,
    projeto: '',
    categoria: row.tipo_documento ?? 'Não informado',
    departamento: '',
    contaCorrente: '',
    empresa: row.empresa ?? '',
    numeroDocumento: row.numero_documento ?? '',
    vencimento: row.vencimento,
    dataLiquidacao: row.dt_pagamento ?? undefined,
    valorDocumento: Number(row.valor),
    valorLiquido: Number(row.valor),
    // "vencido" é recalculado pelo chamador a partir da data (ver listarContasReceberSheets).
    situacao: row.situacao === 'paga' ? 'liquidado' : 'aberto',
  };
}

/**
 * Contas a receber da planilha (Google Sheets), mapeadas para o formato genérico usado pelas telas
 * de Dashboard/Contas a Receber. Itens cancelados são excluídos daqui de propósito — eles só entram
 * no resumo dedicado (`resumoContasReceberSheets`), não nas listas/KPIs de títulos em aberto.
 */
export async function listarContasReceberSheets(): Promise<ContaFinanceira[]> {
  const { data, error } = await supabase
    .from('contas_receber_sheets')
    .select('id, cliente, empresa, numero_documento, tipo_documento, vencimento, valor, dt_pagamento, situacao')
    .neq('situacao', 'cancelada')
    .order('vencimento', { ascending: true });
  if (error) throw new Error(error.message);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return (data as ContaReceberSheetDbRow[]).map((row) => {
    const conta = paraContaFinanceira(row);
    if (conta.situacao !== 'liquidado' && new Date(conta.vencimento + 'T00:00:00') < hoje) {
      conta.situacao = 'vencido';
    }
    return conta;
  });
}

export interface ResumoContasReceberSheets {
  totalPendente: number;
  totalPago: number;
  totalCancelado: number;
  quantidadePendente: number;
  quantidadePago: number;
  quantidadeCancelado: number;
}

/** Os 3 totais separados por situação (pendente/pago/cancelado), incluindo os cancelados. */
export async function resumoContasReceberSheets(): Promise<ResumoContasReceberSheets> {
  const { data, error } = await supabase.from('contas_receber_sheets').select('valor, situacao');
  if (error) throw new Error(error.message);

  const linhas = data as { valor: number; situacao: SituacaoContaReceberSheet }[];
  const somar = (situacao: SituacaoContaReceberSheet) =>
    linhas.filter((l) => l.situacao === situacao).reduce((total, l) => total + Number(l.valor), 0);
  const contar = (situacao: SituacaoContaReceberSheet) => linhas.filter((l) => l.situacao === situacao).length;

  return {
    totalPendente: somar('pendente'),
    totalPago: somar('paga'),
    totalCancelado: somar('cancelada'),
    quantidadePendente: contar('pendente'),
    quantidadePago: contar('paga'),
    quantidadeCancelado: contar('cancelada'),
  };
}

/** Itens pendentes (para o alerta de cobrança) — mesmo formato usado pelo pop-up de notas fiscais. */
export async function listarPendentesParaCobranca(): Promise<
  { id: string; clienteOuFornecedor: string; vencimento: string; valor: number; situacao: 'pendente' }[]
> {
  const { data, error } = await supabase
    .from('contas_receber_sheets')
    .select('id, cliente, vencimento, valor')
    .eq('situacao', 'pendente');
  if (error) throw new Error(error.message);
  return (data as { id: string; cliente: string; vencimento: string; valor: number }[]).map((row) => ({
    id: row.id,
    clienteOuFornecedor: row.cliente,
    vencimento: row.vencimento,
    valor: Number(row.valor),
    situacao: 'pendente' as const,
  }));
}

/** Chama a Edge Function que relê a planilha do Google Sheets e substitui os dados aqui. */
export async function sincronizarContasReceberSheets(): Promise<{ sincronizadas: number }> {
  const { data, error } = await supabase.functions.invoke('sync-contas-receber');
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data as { sincronizadas: number };
}
