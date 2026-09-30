// Lê a aba "à Receber" da planilha "Controle Contas à Receber" no Google Sheets (via conta de
// serviço do Google) e substitui por completo o espelho local em contas_receber_sheets. Regra de
// negócio (definida pelo usuário): coluna I (DT PGTO) vazia = pendente; com data = paga;
// com o texto "CANCELADA" = cancelada.
//
// Segredo necessário (supabase secrets set, neste projeto):
//   GOOGLE_SERVICE_ACCOUNT_JSON  — conteúdo integral do arquivo .json da conta de serviço

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SPREADSHEET_ID = '10jVzX0nBgAP74YCVCxVQb8uDlfvFZtyLBaPxD2hIsZM';
// B2:K — começa depois do cabeçalho (linha 1); colunas B..K = Empresa..Observação.
const RANGE = "'à Receber'!B2:K";
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly';

// Serial de data do Google Sheets: dias desde 30/12/1899.
const SERIAL_EPOCH_UTC_MS = Date.UTC(1899, 11, 30);

const EMPRESA_POR_NOME: Record<string, string> = {
  ENGENHARIA: 'Global Engenharia',
  MONTAGEM: 'Global Montagem',
  SERVICO: 'Global Serviço',
  SERVICOS: 'Global Serviço',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function stripAcentos(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function normalizarEmpresa(bruta: unknown): string | null {
  if (typeof bruta !== 'string') return null;
  const chave = stripAcentos(bruta).trim().toUpperCase();
  return EMPRESA_POR_NOME[chave] ?? null;
}

function serialParaIso(serial: number): string {
  return new Date(SERIAL_EPOCH_UTC_MS + Math.round(serial) * 86400000).toISOString().slice(0, 10);
}

function base64UrlFromBytes(bytes: Uint8Array): string {
  let binario = '';
  for (const byte of bytes) binario += String.fromCharCode(byte);
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlFromString(texto: string): string {
  return base64UrlFromBytes(new TextEncoder().encode(texto));
}

function pemParaDer(pem: string): ArrayBuffer {
  const limpo = pem.replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, '').replace(/\s+/g, '');
  const binario = atob(limpo);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes.buffer;
}

/** Fluxo OAuth2 de conta de serviço do Google (JWT assinado -> token de acesso). */
async function obterTokenGoogle(clientEmail: string, privateKeyPem: string, scope: string): Promise<string> {
  const agora = Math.floor(Date.now() / 1000);
  const header = base64UrlFromString(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64UrlFromString(
    JSON.stringify({ iss: clientEmail, scope, aud: 'https://oauth2.googleapis.com/token', exp: agora + 3600, iat: agora })
  );
  const entrada = `${header}.${claims}`;

  const chave = await crypto.subtle.importKey('pkcs8', pemParaDer(privateKeyPem), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  const assinatura = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', chave, new TextEncoder().encode(entrada));
  const jwt = `${entrada}.${base64UrlFromBytes(new Uint8Array(assinatura))}`;

  const resposta = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  });
  if (!resposta.ok) throw new Error(`Falha ao autenticar no Google (HTTP ${resposta.status}): ${await resposta.text()}`);
  const dados = await resposta.json();
  return dados.access_token as string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const saJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    if (!saJson) return json({ error: 'Integração com o Google Sheets não configurada (falta o segredo no backend).' }, 500);
    const sa = JSON.parse(saJson);

    const local = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const { data: userData, error: userError } = await local.auth.getUser();
    if (userError || !userData?.user) return json({ error: 'Não autenticado.' }, 401);

    const accessToken = await obterTokenGoogle(sa.client_email, sa.private_key, SCOPE);

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(RANGE)}?valueRenderOption=UNFORMATTED_VALUE`;
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
