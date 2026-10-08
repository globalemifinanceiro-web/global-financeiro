// Devolve links novos (válidos por 1 hora) do documento assinado e dos anexos de uma solicitação
// do Projetos Global — ou do arquivo de um orçamento aprovado (tipo: 'orcamento'). Os links expiram, então não são guardados na sincronização — são pedidos na
// hora em que alguém clica para ver a NF.
//
// Segredo: PROJETOS_GLOBAL_SYNC_TOKEN

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_URL = 'https://projetos-global.netlify.app/api/integracao/financeiro/notas';
const ORCAMENTOS_URL = 'https://projetos-global.netlify.app/api/integracao/financeiro/orcamentos';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

type Arquivo = { nome?: string; url?: string | null };

function comLink(arquivos: unknown): { nome: string; url: string }[] {
  if (!Array.isArray(arquivos)) return [];
  return (arquivos as Arquivo[])
    .filter((a) => typeof a?.url === 'string' && a.url)
    .map((a) => ({ nome: a.nome ?? 'Documento', url: a.url as string }));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const token = Deno.env.get('PROJETOS_GLOBAL_SYNC_TOKEN');
    if (!token) return json({ error: 'Integração com o Projetos Global não configurada (falta o segredo no backend).' }, 500);

    const local = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const { data: userData, error: userError } = await local.auth.getUser();
    if (userError || !userData?.user) return json({ error: 'Não autenticado.' }, 401);

    const { id, tipo } = (await req.json().catch(() => ({}))) as { id?: string; tipo?: 'nota' | 'orcamento' };
    if (!id) return json({ error: 'Informe a solicitação.' }, 400);

    if (tipo === 'orcamento') {
      const resposta = await fetch(ORCAMENTOS_URL, { headers: { Authorization: `Bearer ${token}` } });
      if (!resposta.ok) return json({ error: `Falha ao consultar o Projetos Global (HTTP ${resposta.status}).` }, 502);
      const corpo = await resposta.json();
      const orcamento = (Array.isArray(corpo?.orcamentos) ? corpo.orcamentos : []).find((o: { id?: string }) => o.id === id);
      if (!orcamento) return json({ error: 'Orçamento não encontrado entre os aprovados no Projetos Global.' }, 404);
      return json({ documentoAssinado: [], anexos: comLink(orcamento.arquivos) });
    }

    const resposta = await fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } });
    if (!resposta.ok) return json({ error: `Falha ao consultar o Projetos Global (HTTP ${resposta.status}).` }, 502);
    const corpo = await resposta.json();
    const nota = (Array.isArray(corpo?.notas) ? corpo.notas : []).find((n: { id?: string }) => n.id === id);
    if (!nota) {
      return json({ error: 'Os documentos só ficam disponíveis depois que a solicitação é liberada ao Financeiro.' }, 404);
    }

    return json({ documentoAssinado: comLink(nota.documento_assinado), anexos: comLink(nota.anexos) });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Erro inesperado ao buscar os documentos.' }, 500);
  }
});
