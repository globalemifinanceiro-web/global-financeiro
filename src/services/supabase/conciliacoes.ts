import { supabase } from './client';
import { invocarFuncao } from './functions';
import type { BaixaStatus, Conciliacao, NovoComprovante, ResultadoComprovante, TipoConciliacao, TituloPendente } from '@/types/conciliacao';

interface ConciliacaoRow {
  id: string;
  tipo: TipoConciliacao;
  empresa: string | null;
  data_pagamento: string;
  valor: number;
  descricao: string | null;
  arquivo_nome: string;
  drive_url: string;
  titulo_descricao: string | null;
  baixa_status: BaixaStatus;
  baixa_erro: string | null;
  created_at: string;
}

export async function listarConciliacoes(): Promise<Conciliacao[]> {
  const { data, error } = await supabase
    .from('conciliacoes')
    .select('id, tipo, empresa, data_pagamento, valor, descricao, arquivo_nome, drive_url, titulo_descricao, baixa_status, baixa_erro, created_at')
    .order('data_pagamento', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as ConciliacaoRow[]).map((row) => ({
    id: row.id,
    tipo: row.tipo,
    empresa: row.empresa,
    dataPagamento: row.data_pagamento,
    valor: Number(row.valor),
    descricao: row.descricao,
    arquivoNome: row.arquivo_nome,
    driveUrl: row.drive_url,
    tituloDescricao: row.titulo_descricao,
    baixaStatus: row.baixa_status,
    baixaErro: row.baixa_erro,
    createdAt: row.created_at,
  }));
}

/** Contas a receber pendentes (planilha) + notas fiscais pendentes, para vincular ao comprovante. */
export async function listarTitulosPendentes(): Promise<TituloPendente[]> {
  const [receber, notas] = await Promise.all([
    supabase
      .from('contas_receber_sheets')
      .select('linha_planilha, cliente, numero_documento, valor, vencimento, empresa')
      .eq('situacao', 'pendente')
      .order('vencimento', { ascending: true }),
    supabase
      .from('notas_fiscais')
      .select('id, cliente_ou_fornecedor, numero_documento, valor, vencimento, empresa, origem')
      .eq('situacao', 'pendente')
      .order('vencimento', { ascending: true }),
  ]);
  if (receber.error) throw new Error(receber.error.message);
  if (notas.error) throw new Error(notas.error.message);

  const titulosReceber: TituloPendente[] = (
    receber.data as { linha_planilha: number; cliente: string; numero_documento: string | null; valor: number; vencimento: string; empresa: string | null }[]
  ).map((r) => ({
    chave: `cr-${r.linha_planilha}`,
    vinculo: { tipo: 'conta_receber', linhaPlanilha: r.linha_planilha },
    tipo: 'recebimento',
    empresa: r.empresa,
    descricao: r.numero_documento ? `${r.cliente} · Nº ${r.numero_documento}` : r.cliente,
    valor: Number(r.valor),
    vencimento: r.vencimento,
    baixaNaOrigem: false,
  }));

  const titulosPagar: TituloPendente[] = (
    notas.data as {
      id: string;
      cliente_ou_fornecedor: string;
      numero_documento: string | null;
      valor: number;
      vencimento: string;
      empresa: string | null;
      origem: string;
    }[]
  ).map((n) => ({
    chave: `nf-${n.id}`,
    vinculo: { tipo: 'nota_fiscal', id: n.id },
    tipo: 'pagamento',
    empresa: n.empresa,
    descricao: n.numero_documento ? `${n.cliente_ou_fornecedor} · NF ${n.numero_documento}` : n.cliente_ou_fornecedor,
    valor: Number(n.valor),
    vencimento: n.vencimento,
    baixaNaOrigem: n.origem === 'projetos_global',
  }));

  return [...titulosReceber, ...titulosPagar];
}

async function arquivoParaBase64(uri: string): Promise<string> {
  const blob = await (await fetch(uri)).blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result));
    leitor.onerror = () => reject(new Error('Não foi possível ler o arquivo selecionado.'));
    leitor.readAsDataURL(blob);
  });
  return dataUrl.slice(dataUrl.indexOf(',') + 1);
}

export async function registrarComprovante(novo: NovoComprovante): Promise<ResultadoComprovante> {
  const base64 = await arquivoParaBase64(novo.arquivo.uri);
  return invocarFuncao<ResultadoComprovante>('registrar-comprovante', {
    tipo: novo.tipo,
    empresa: novo.empresa,
    dataPagamento: novo.dataPagamento,
    valor: novo.valor,
    descricao: novo.descricao,
    arquivo: { nome: novo.arquivo.nome, mimeType: novo.arquivo.mimeType ?? 'application/octet-stream', base64 },
    vinculo: novo.vinculo,
  });
}
