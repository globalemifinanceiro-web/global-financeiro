import { supabase } from './client';
import { invocarFuncao } from './functions';
import type { NotaFiscal, NovaNotaFiscal, OrigemNF, SituacaoNF } from '@/types/notaFiscal';

const BUCKET = 'notas-fiscais';

interface NotaFiscalRow {
  id: string;
  empresa: string | null;
  cliente_ou_fornecedor: string;
  numero_documento: string | null;
  valor: number;
  vencimento: string;
  situacao: SituacaoNF;
  forma_pagamento: string | null;
  assinado: boolean;
  arquivo_path: string | null;
  arquivo_nome: string | null;
  observacoes: string | null;
  created_at: string;
  origem: OrigemNF;
  projetos_global_status: string | null;
  projeto_pcg: string | null;
  projeto_nome: string | null;
}

function paraNotaFiscal(row: NotaFiscalRow): NotaFiscal {
  return {
    id: row.id,
    empresa: row.empresa,
    clienteOuFornecedor: row.cliente_ou_fornecedor,
    numeroDocumento: row.numero_documento,
    valor: Number(row.valor),
    vencimento: row.vencimento,
    situacao: row.situacao,
    formaPagamento: row.forma_pagamento,
    assinado: row.assinado,
    arquivoPath: row.arquivo_path,
    arquivoNome: row.arquivo_nome,
    observacoes: row.observacoes,
    createdAt: row.created_at,
    origem: row.origem,
    projetosGlobalStatus: row.projetos_global_status,
    projetoPcg: row.projeto_pcg,
    projetoNome: row.projeto_nome,
  };
}

export async function listarNotasFiscais(empresa?: string): Promise<NotaFiscal[]> {
  let query = supabase.from('notas_fiscais').select('*').order('vencimento', { ascending: true });
  if (empresa) query = query.eq('empresa', empresa);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as NotaFiscalRow[]).map(paraNotaFiscal);
}

export async function criarNotaFiscal(nota: NovaNotaFiscal): Promise<NotaFiscal> {
  const { data, error } = await supabase
    .from('notas_fiscais')
    .insert({
      empresa: nota.empresa,
      cliente_ou_fornecedor: nota.clienteOuFornecedor,
      numero_documento: nota.numeroDocumento,
      valor: nota.valor,
      vencimento: nota.vencimento,
      situacao: nota.situacao ?? 'pendente',
      forma_pagamento: nota.formaPagamento,
      assinado: nota.assinado ?? false,
      arquivo_path: nota.arquivoPath,
      arquivo_nome: nota.arquivoNome,
      observacoes: nota.observacoes,
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return paraNotaFiscal(data as NotaFiscalRow);
}

export async function atualizarSituacaoNotaFiscal(id: string, situacao: SituacaoNF): Promise<void> {
  const { error } = await supabase.from('notas_fiscais').update({ situacao, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(error.message);
}

/** Classifica na empresa (CNPJ) certa uma nota vinda do Projetos Global. */
export async function atribuirEmpresaNotaFiscal(id: string, empresa: string): Promise<void> {
  const { error } = await supabase.from('notas_fiscais').update({ empresa, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(error.message);
}

/** Chama a Edge Function que busca as solicitações liberadas no Projetos Global e grava/remove aqui. */
export async function sincronizarProjetosGlobal(): Promise<{ sincronizadas: number; removidas: number }> {
  return invocarFuncao<{ sincronizadas: number; removidas: number }>('sync-projetos-global');
}

export async function excluirNotaFiscal(id: string, arquivoPath: string | null): Promise<void> {
  if (arquivoPath) {
    await supabase.storage.from(BUCKET).remove([arquivoPath]);
  }
  const { error } = await supabase.from('notas_fiscais').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/** Envia o arquivo anexado (PDF/imagem/doc) para o bucket privado e devolve o caminho salvo. */
export async function enviarArquivoNotaFiscal(uri: string, nomeOriginal: string, tipo: string | undefined): Promise<string> {
  const extensao = nomeOriginal.includes('.') ? nomeOriginal.split('.').pop() : undefined;
  const caminho = `${new Date().toISOString().slice(0, 10)}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extensao ? `.${extensao}` : ''}`;

  const resposta = await fetch(uri);
  const blob = await resposta.blob();

  const { error } = await supabase.storage.from(BUCKET).upload(caminho, blob, {
    contentType: tipo,
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return caminho;
}

/** URL assinada de curta duração para visualizar/baixar o anexo. */
export async function urlAssinadaNotaFiscal(caminho: string, segundos = 300): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(caminho, segundos);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
