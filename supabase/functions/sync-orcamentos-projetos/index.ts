// Busca no Projetos Global os orçamentos/propostas aprovados pela Diretoria e espelha em
// orcamentos_projetos. A rota devolve todos os aprovados no momento, então a sincronização reconcilia:
// o que não veio mais (aprovação desfeita, reprovado, excluído) sai daqui.
//
// Segredo: PROJETOS_GLOBAL_SYNC_TOKEN

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { empresaDoProjetos } from '../_shared/empresas.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_URL = 'https://projetos-global.netlify.app/api/integracao/financeiro/orcamentos';

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

    const resposta = await fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } });
    if (resposta.status === 404) {
      return json({ error: 'O Projetos Global ainda não publicou a rota de orçamentos (/api/integracao/financeiro/orcamentos).' }, 502);
    }
    if (!resposta.ok) return json({ error: `Falha ao consultar o Projetos Global (HTTP ${resposta.status}).` }, 502);
    const corpo = await resposta.json();
    const orcamentos = Array.isArray(corpo?.orcamentos) ? corpo.orcamentos : [];

    const linhas = orcamentos
      .filter((o: any) => o?.id && o?.aprovado_em)
      .map((o: any) => ({
        id: o.id,
        codigo: o.codigo ?? null,
        projeto_pcg: o.projeto?.pcg ?? null,
        projeto_cliente: o.projeto?.cliente ?? null,
        empresa: empresaDoProjetos(o.empresa?.cnpj, o.empresa?.nome),
        fornecedor: o.fornecedor?.nome ?? null,
        tipo_documento: o.documento?.tipo ?? null,
        numero_documento: o.documento?.numero ?? null,
        emissao: o.documento?.emissao ?? null,
        vencimento: o.documento?.vencimento ?? null,
        valor: o.valores?.liquido ?? o.valores?.bruto ?? null,
        forma_pagamento: o.forma_pagamento_texto ?? null,
        categoria: o.categoria ?? null,
        descricao: o.descricao ?? null,
        enviado_por: o.enviado_por?.nome ?? null,
        enviado_em: o.enviado_em ?? null,
        gestor_nome: o.aprovacoes?.gestor?.nome ?? null,
        gestor_em: o.aprovacoes?.gestor?.data ?? null,
        diretoria_nome: o.aprovacoes?.diretoria?.nome ?? null,
        aprovado_em: o.aprovado_em,
        sincronizado_em: new Date().toISOString(),
      }));

    if (linhas.length > 0) {
      const { error } = await local.from('orcamentos_projetos').upsert(linhas, { onConflict: 'id' });
      if (error) return json({ error: `Falha ao gravar localmente: ${error.message}` }, 500);
    }

    const ids = linhas.map((l: { id: string }) => l.id);
    let remocao = local.from('orcamentos_projetos').delete({ count: 'exact' }).gte('aprovado_em', '1900-01-01');
    if (ids.length > 0) remocao = remocao.not('id', 'in', `(${ids.join(',')})`);
    const { error: deleteError, count } = await remocao;
    if (deleteError) return json({ error: `Falha ao limpar orçamentos antigos: ${deleteError.message}` }, 500);

    return json({ sincronizados: linhas.length, removidos: count ?? 0 });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Erro inesperado na sincronização.' }, 500);
  }
});
