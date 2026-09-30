// Busca no Projetos Global as solicitações em todas as etapas (lançada, com o Gestor, com o
// Diretor, liberada ao Financeiro, paga...) e grava/atualiza o espelho solicitacoes_projetos.
// Só pede o que mudou desde a última sincronização (?desde=), com uma margem de segurança.
//
// Segredo: PROJETOS_GLOBAL_SYNC_TOKEN (o mesmo da rota de notas).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { empresaDoProjetos } from '../_shared/empresas.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_URL = 'https://projetos-global.netlify.app/api/integracao/financeiro/solicitacoes';
const MARGEM_MS = 10 * 60 * 1000;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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

    const { data: ultima, error: ultimaError } = await local
      .from('solicitacoes_projetos')
      .select('atualizado_em')
      .order('atualizado_em', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (ultimaError) throw new Error(ultimaError.message);

    const url = new URL(API_URL);
    if (ultima?.atualizado_em) url.searchParams.set('desde', new Date(new Date(ultima.atualizado_em).getTime() - MARGEM_MS).toISOString());

    const resposta = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (resposta.status === 404) {
      return json({ error: 'O Projetos Global ainda não publicou a rota de solicitações (/api/integracao/financeiro/solicitacoes).' }, 502);
    }
    if (!resposta.ok) return json({ error: `Falha ao consultar o Projetos Global (HTTP ${resposta.status}).` }, 502);
    const corpo = await resposta.json();
    const solicitacoes = Array.isArray(corpo?.solicitacoes) ? corpo.solicitacoes : [];

    const linhas = solicitacoes.map((s: any) => ({
      id: s.id,
      codigo: s.codigo ?? null,
      tipo: s.tipo ?? null,
      titulo: s.titulo ?? 'Sem título',
      situacao: s.situacao,
      valor: s.valor ?? null,
      empresa: empresaDoProjetos(s.empresa?.cnpj, s.empresa?.nome),
      projeto_pcg: s.projeto?.pcg ?? null,
      projeto_cliente: s.projeto?.cliente ?? null,
      fornecedor: s.fornecedor?.nome ?? null,
      lancado_por_nome: s.lancado_por?.nome ?? null,
      lancado_em: s.lancado_em ?? null,
      atualizado_em: s.atualizado_em,
      etapa_nome: s.etapa_atual?.nome ?? null,
      etapa_papel: s.etapa_atual?.papel ?? null,
      etapa_desde: s.etapa_atual?.desde ?? null,
      etapa_prazo: s.etapa_atual?.prazo ?? null,
      responsaveis: Array.isArray(s.etapa_atual?.responsaveis) ? s.etapa_atual.responsaveis : [],
      historico: Array.isArray(s.historico) ? s.historico : [],
      sincronizado_em: new Date().toISOString(),
    }));

    if (linhas.length > 0) {
      const { error } = await local.from('solicitacoes_projetos').upsert(linhas, { onConflict: 'id' });
      if (error) return json({ error: `Falha ao gravar localmente: ${error.message}` }, 500);
    }

    return json({ sincronizadas: linhas.length });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Erro inesperado na sincronização.' }, 500);
  }
});
