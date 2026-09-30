// Recebe um comprovante de pagamento/recebimento, grava o arquivo na pasta "comprovantes" do
// Google Drive (via Google Apps Script — contas de serviço não têm espaço no Meu Drive), registra
// a conciliação e, quando vinculado a um título, dá a baixa:
//   - conta a receber: grava a data na coluna I (DT PGTO) da planilha e marca como paga aqui;
//   - nota fiscal manual: marca como paga aqui;
//   - nota fiscal do Projetos Global: registra o pagamento lá (rota /api/integracao/financeiro/pagamentos,
//     com o comprovante) e, quando a solicitação fica paga, marca como paga aqui também.
//
// Segredos: GOOGLE_SERVICE_ACCOUNT_JSON, APPS_SCRIPT_URL, APPS_SCRIPT_TOKEN, PROJETOS_GLOBAL_SYNC_TOKEN

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  CONTAS_RECEBER_ABA,
  CONTAS_RECEBER_SPREADSHEET_ID,
  SCOPE_SHEETS_ESCRITA,
  obterTokenGoogle,
  urlValoresPlanilha,
} from '../_shared/google.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TAMANHO_MAXIMO_BYTES = 10 * 1024 * 1024;
// O Projetos roda no Netlify, que recusa requisições acima de ~6 MB; em base64 o arquivo cresce ~1/3.
const TAMANHO_MAXIMO_PROJETOS_BYTES = 4 * 1024 * 1024;
const DATA_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const PAGAMENTOS_URL = 'https://projetos-global.netlify.app/api/integracao/financeiro/pagamentos';

type Vinculo = { tipo: 'conta_receber'; linhaPlanilha: number } | { tipo: 'nota_fiscal'; id: string };

interface Entrada {
  tipo: 'recebimento' | 'pagamento';
  empresa?: string | null;
  dataPagamento: string;
  valor: number;
  descricao?: string | null;
  arquivo: { nome: string; mimeType: string; base64: string };
  vinculo?: Vinculo | null;
}

class ErroEntrada extends Error {
  constructor(mensagem: string, readonly status = 400) {
    super(mensagem);
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function formatarDataBR(iso: string): string {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

function validar(entrada: Entrada) {
  if (entrada.tipo !== 'recebimento' && entrada.tipo !== 'pagamento') throw new ErroEntrada('Tipo inválido.');
  if (!DATA_REGEX.test(entrada.dataPagamento ?? '')) throw new ErroEntrada('Data do pagamento inválida (use AAAA-MM-DD).');
  if (!Number.isFinite(entrada.valor) || entrada.valor <= 0) throw new ErroEntrada('Valor inválido.');
  if (!entrada.arquivo?.base64 || !entrada.arquivo?.nome) throw new ErroEntrada('Anexe o comprovante.');
  if ((entrada.arquivo.base64.length * 3) / 4 > TAMANHO_MAXIMO_BYTES) throw new ErroEntrada('Arquivo maior que 10 MB.');
  const v = entrada.vinculo;
  if (v?.tipo === 'conta_receber' && entrada.tipo !== 'recebimento') throw new ErroEntrada('Conta a receber só se vincula a recebimento.');
  if (v?.tipo === 'nota_fiscal' && entrada.tipo !== 'pagamento') throw new ErroEntrada('Nota fiscal só se vincula a pagamento.');
}

/** Registra o pagamento no Projetos Global. `null` = a rota ainda não foi publicada lá. */
async function registrarPagamentoNoProjetos(dados: {
  solicitacaoId: string;
  dataPagamento: string;
  valor: number;
  formaPagamento: string | null;
  observacao: string | null;
  arquivo: { nome: string; mimeType: string; base64: string };
}): Promise<{ situacao: string } | null> {
  const token = Deno.env.get('PROJETOS_GLOBAL_SYNC_TOKEN');
  if (!token) throw new Error('Integração com o Projetos Global não configurada (falta o segredo no backend).');

  const resposta = await fetch(PAGAMENTOS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      solicitacao_id: dados.solicitacaoId,
      data_pagamento: dados.dataPagamento,
      valor: dados.valor,
      forma_pagamento: dados.formaPagamento,
      observacao: dados.observacao,
      comprovante: { nome: dados.arquivo.nome, mime: dados.arquivo.mimeType, base64: dados.arquivo.base64 },
    }),
  });

  const texto = await resposta.text();
  let corpo: { ok?: boolean; situacao?: string; erro?: string; error?: string } | null = null;
  try {
    corpo = JSON.parse(texto);
  } catch {
    corpo = null;
  }
  // 404 sem JSON = a rota não existe (página padrão do Next.js); 404 com JSON = recusa da própria rota.
  if (resposta.status === 404 && !corpo) return null;
  if (!resposta.ok || !corpo?.ok) {
    throw new Error(`O Projetos Global recusou o pagamento: ${corpo?.erro ?? corpo?.error ?? `HTTP ${resposta.status}`}`);
  }
  return { situacao: corpo.situacao ?? '' };
}

async function enviarParaDrive(nome: string, mimeType: string, base64: string): Promise<{ id: string; url: string }> {
  const url = Deno.env.get('APPS_SCRIPT_URL');
  const token = Deno.env.get('APPS_SCRIPT_TOKEN');
  if (!url || !token) throw new Error('Envio para o Google Drive não configurado (faltam segredos no backend).');

  // Apps Script responde 302 para outro endereço; o fetch segue o redirecionamento sozinho.
  const resposta = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ token, nome, mimeType, base64 }),
  });
  const texto = await resposta.text();
  let dados: { id?: string; url?: string; error?: string };
  try {
    dados = JSON.parse(texto);
  } catch {
    throw new Error(`Resposta inesperada do Google Drive (HTTP ${resposta.status}).`);
  }
  if (dados.error || !dados.id || !dados.url) throw new Error(`Falha ao salvar no Google Drive: ${dados.error ?? 'sem id do arquivo'}`);
  return { id: dados.id, url: dados.url };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const local = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const { data: userData, error: userError } = await local.auth.getUser();
    if (userError || !userData?.user) return json({ error: 'Não autenticado.' }, 401);

    const entrada = (await req.json()) as Entrada;
    validar(entrada);

    let empresa = entrada.empresa ?? null;
    let tituloDescricao: string | null = null;
    let googleToken: string | null = null;
    let contaReceber: { linha_planilha: number; cliente: string; valor: number } | null = null;
    let notaFiscal: { id: string; origem: string; requestId: string | null; formaPagamento: string | null } | null = null;

    // 1) Confere o título ANTES de subir o arquivo, pra não deixar comprovante órfão no Drive.
    if (entrada.vinculo?.tipo === 'conta_receber') {
      const linha = entrada.vinculo.linhaPlanilha;
      const { data, error } = await local
        .from('contas_receber_sheets')
        .select('linha_planilha, cliente, valor, situacao, empresa, numero_documento, vencimento')
        .eq('linha_planilha', linha)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) throw new ErroEntrada('Conta a receber não encontrada — sincronize a planilha e tente de novo.', 409);
      if (data.situacao !== 'pendente') throw new ErroEntrada('Essa conta a receber não está mais pendente.', 409);

      // A linha guardada aqui é da última sincronização: se alguém inseriu/apagou linhas na
      // planilha desde então, gravar a data na linha errada seria grave. Confere antes.
      googleToken = await obterTokenGoogle(SCOPE_SHEETS_ESCRITA);
      const leitura = await fetch(
        `${urlValoresPlanilha(CONTAS_RECEBER_SPREADSHEET_ID, `'${CONTAS_RECEBER_ABA}'!B${linha}:I${linha}`)}?valueRenderOption=UNFORMATTED_VALUE`,
        { headers: { Authorization: `Bearer ${googleToken}` } }
      );
      if (!leitura.ok) throw new Error(`Falha ao conferir a planilha (HTTP ${leitura.status}): ${await leitura.text()}`);
      const linhaPlanilha: unknown[] = (await leitura.json()).values?.[0] ?? [];
      const clienteConfere = String(linhaPlanilha[1] ?? '').trim() === data.cliente.trim();
      const valorConfere = typeof linhaPlanilha[6] === 'number' && Math.abs(linhaPlanilha[6] - Number(data.valor)) < 0.01;
      const dtPgtoVazia = linhaPlanilha[7] === undefined || linhaPlanilha[7] === '';
      if (!clienteConfere || !valorConfere) {
        throw new ErroEntrada('A planilha mudou desde a última sincronização. Sincronize e escolha o título de novo.', 409);
      }
      if (!dtPgtoVazia) throw new ErroEntrada('Essa linha da planilha já tem DT PGTO preenchida.', 409);

      contaReceber = { linha_planilha: linha, cliente: data.cliente, valor: Number(data.valor) };
      empresa = empresa ?? data.empresa;
      tituloDescricao = [data.cliente, data.numero_documento ? `Nº ${data.numero_documento}` : null, `venc. ${formatarDataBR(data.vencimento)}`]
        .filter(Boolean)
        .join(' · ');
    } else if (entrada.vinculo?.tipo === 'nota_fiscal') {
      const { data, error } = await local
        .from('notas_fiscais')
        .select('id, origem, situacao, empresa, cliente_ou_fornecedor, numero_documento, projetos_global_request_id, forma_pagamento')
        .eq('id', entrada.vinculo.id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) throw new ErroEntrada('Nota fiscal não encontrada.', 409);
      if (data.situacao !== 'pendente') throw new ErroEntrada('Essa nota fiscal não está mais pendente.', 409);
      if (data.origem === 'projetos_global' && (entrada.arquivo.base64.length * 3) / 4 > TAMANHO_MAXIMO_PROJETOS_BYTES) {
        throw new ErroEntrada('Para NF do Projetos Global o comprovante pode ter no máximo 4 MB (limite do Projetos). Reduza o arquivo e tente de novo.');
      }

      notaFiscal = {
        id: data.id,
        origem: data.origem,
        requestId: data.projetos_global_request_id,
        formaPagamento: data.forma_pagamento,
      };
      empresa = empresa ?? data.empresa;
      tituloDescricao = [data.cliente_ou_fornecedor, data.numero_documento ? `NF ${data.numero_documento}` : null].filter(Boolean).join(' · ');
    }

    // 2) Arquivo no Drive.
    const nomeArquivo = `${entrada.dataPagamento} ${entrada.tipo} ${empresa ?? 'sem empresa'} - ${entrada.arquivo.nome}`.replace(/[\\/]/g, '-');
    const drive = await enviarParaDrive(nomeArquivo, entrada.arquivo.mimeType || 'application/octet-stream', entrada.arquivo.base64);

    // 3) Baixa. Se falhar daqui pra frente, o comprovante já está salvo: registra com status "erro".
    let baixaStatus: 'sem_vinculo' | 'ok' | 'pendente_origem' | 'erro' = 'sem_vinculo';
    let baixaErro: string | null = null;
    try {
      if (contaReceber && googleToken) {
        const escrita = await fetch(
          `${urlValoresPlanilha(CONTAS_RECEBER_SPREADSHEET_ID, `'${CONTAS_RECEBER_ABA}'!I${contaReceber.linha_planilha}`)}?valueInputOption=USER_ENTERED`,
          {
            method: 'PUT',
            headers: { Authorization: `Bearer ${googleToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ values: [[entrada.dataPagamento]] }),
          }
        );
        if (!escrita.ok) throw new Error(`Não foi possível gravar a DT PGTO na planilha (HTTP ${escrita.status}): ${await escrita.text()}`);

        const { error } = await local
          .from('contas_receber_sheets')
          .update({ situacao: 'paga', dt_pagamento: entrada.dataPagamento })
          .eq('linha_planilha', contaReceber.linha_planilha);
        if (error) throw new Error(`DT PGTO gravada na planilha, mas falhou ao atualizar o app: ${error.message}`);
        baixaStatus = 'ok';
      } else if (notaFiscal) {
        if (notaFiscal.origem === 'manual') {
          const { error } = await local
            .from('notas_fiscais')
            .update({ situacao: 'paga', updated_at: new Date().toISOString() })
            .eq('id', notaFiscal.id);
          if (error) throw new Error(`Falha ao marcar a nota como paga: ${error.message}`);
          baixaStatus = 'ok';
        } else if (!notaFiscal.requestId) {
          throw new Error('A nota não tem o número da solicitação do Projetos Global — sincronize e tente de novo.');
        } else {
          const registro = await registrarPagamentoNoProjetos({
            solicitacaoId: notaFiscal.requestId,
            dataPagamento: entrada.dataPagamento,
            valor: entrada.valor,
            formaPagamento: notaFiscal.formaPagamento,
            observacao: entrada.descricao?.trim() || null,
            arquivo: entrada.arquivo,
          });
          if (!registro) {
            baixaStatus = 'pendente_origem';
            baixaErro = 'O Projetos Global ainda não publicou a rota de pagamentos — o comprovante ficou vinculado aqui.';
          } else {
            // Pagamento parcial mantém a nota pendente; só quando o Projetos fecha como "pago" ela vira paga aqui.
            if (registro.situacao === 'pago') {
              const { error } = await local
                .from('notas_fiscais')
                .update({ situacao: 'paga', projetos_global_status: 'pago', updated_at: new Date().toISOString() })
                .eq('id', notaFiscal.id);
              if (error) throw new Error(`Pagamento registrado no Projetos, mas falhou ao atualizar o app: ${error.message}`);
            }
            baixaStatus = 'ok';
          }
        }
      }
    } catch (e) {
      baixaStatus = 'erro';
      baixaErro = e instanceof Error ? e.message : 'Falha na baixa.';
    }

    const { data: conciliacao, error: insertError } = await local
      .from('conciliacoes')
      .insert({
        tipo: entrada.tipo,
        empresa,
        data_pagamento: entrada.dataPagamento,
        valor: entrada.valor,
        descricao: entrada.descricao?.trim() || null,
        arquivo_nome: entrada.arquivo.nome,
        drive_file_id: drive.id,
        drive_url: drive.url,
        conta_receber_linha: contaReceber?.linha_planilha ?? null,
        nota_fiscal_id: notaFiscal?.id ?? null,
        titulo_descricao: tituloDescricao,
        baixa_status: baixaStatus,
        baixa_erro: baixaErro,
        criado_por: userData.user.id,
      })
      .select('id')
      .single();
    if (insertError) {
      return json({ error: `Comprovante salvo no Drive (${drive.url}), mas falhou ao registrar a conciliação: ${insertError.message}` }, 500);
    }

    return json({ id: conciliacao.id, driveUrl: drive.url, baixaStatus, baixaErro });
  } catch (e) {
    if (e instanceof ErroEntrada) return json({ error: e.message }, e.status);
    return json({ error: e instanceof Error ? e.message : 'Erro inesperado ao registrar o comprovante.' }, 500);
  }
});
