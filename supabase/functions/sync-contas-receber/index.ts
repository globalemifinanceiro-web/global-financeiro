// Lê a aba "à Receber" da planilha "Controle Contas à Receber" no Google Sheets (via conta de
// serviço do Google) e substitui por completo o espelho local em contas_receber_sheets. Regra de
// negócio (definida pelo usuário): coluna I (DT PGTO) vazia = pendente; com data = paga;
// com o texto "CANCELADA" = cancelada.
//
// Segredo necessário: GOOGLE_SERVICE_ACCOUNT_JSON (conteúdo integral do .json da conta de serviço)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  CONTAS_RECEBER_ABA,
  CONTAS_RECEBER_SPREADSHEET_ID,
  SCOPE_SHEETS_LEITURA,
  obterTokenGoogle,
  serialParaIso,
  stripAcentos,
  urlValoresPlanilha,
} from '../_shared/google.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// B2:K — começa depois do cabeçalho (linha 1); colunas B..K = Empresa..Observação.
const RANGE = `'${CONTAS_RECEBER_ABA}'!B2:K`;

const EMPRESA_POR_NOME: Record<string, string> = {
  ENGENHARIA: 'Global Engenharia',
  MONTAGEM: 'Global Montagem',
  SERVICO: 'Global Serviço',
  SERVICOS: 'Global Serviço',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function normalizarEmpresa(bruta: unknown): string | null {
  if (typeof bruta !== 'string') return null;
  const chave = stripAcentos(bruta).trim().toUpperCase();
  return EMPRESA_POR_NOME[chave] ?? null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const local = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const { data: userData, error: userError } = await local.auth.getUser();
    if (userError || !userData?.user) return json({ error: 'Não autenticado.' }, 401);

    const accessToken = await obterTokenGoogle(SCOPE_SHEETS_LEITURA);

    const url = `${urlValoresPlanilha(CONTAS_RECEBER_SPREADSHEET_ID, RANGE)}?valueRenderOption=UNFORMATTED_VALUE`;
    const planilhaResp = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!planilhaResp.ok) {
      return json({ error: `Falha ao ler a planilha (HTTP ${planilhaResp.status}): ${await planilhaResp.text()}` }, 502);
    }
    const planilhaDados = await planilhaResp.json();
    const linhasBrutas: unknown[][] = planilhaDados.values ?? [];

    const linhas = [];
    for (let i = 0; i < linhasBrutas.length; i++) {
      const row = linhasBrutas[i];
      const cliente = row[1];
      const vencimentoRaw = row[5];
      if (!cliente || typeof vencimentoRaw !== 'number') continue; // linha em branco ou sem vencimento

      const dtPgtoRaw = row[7];
      let situacao: 'pendente' | 'paga' | 'cancelada' = 'pendente';
      let dtPagamento: string | null = null;
      if (typeof dtPgtoRaw === 'number') {
        situacao = 'paga';
        dtPagamento = serialParaIso(dtPgtoRaw);
      } else if (typeof dtPgtoRaw === 'string' && stripAcentos(dtPgtoRaw).trim().toUpperCase().includes('CANCELADA')) {
        situacao = 'cancelada';
      }

      const valorRaw = row[6];
      linhas.push({
        linha_planilha: i + 2,
        empresa: normalizarEmpresa(row[0]),
        cliente: String(cliente),
        numero_documento: row[2] != null && row[2] !== '' ? String(row[2]) : null,
        tipo_documento: typeof row[3] === 'string' ? row[3] : null,
        emissao: typeof row[4] === 'number' ? serialParaIso(row[4]) : null,
        vencimento: serialParaIso(vencimentoRaw),
        valor: typeof valorRaw === 'number' ? valorRaw : Number(valorRaw) || 0,
        dt_pagamento: dtPagamento,
        situacao,
        observacao: typeof row[9] === 'string' && row[9] ? row[9] : null,
      });
    }

    // Substituição completa: a planilha é sempre a fonte da verdade, sem estado local a preservar.
    const { error: deleteError } = await local.from('contas_receber_sheets').delete().gte('linha_planilha', 0);
    if (deleteError) return json({ error: `Falha ao limpar dados antigos: ${deleteError.message}` }, 500);

    if (linhas.length > 0) {
      const { error: insertError } = await local.from('contas_receber_sheets').insert(linhas);
      if (insertError) return json({ error: `Falha ao gravar: ${insertError.message}` }, 500);
    }

    return json({ sincronizadas: linhas.length });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Erro inesperado na sincronização.' }, 500);
  }
});
