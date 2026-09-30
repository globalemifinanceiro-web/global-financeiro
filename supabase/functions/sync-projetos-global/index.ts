// Busca, no Supabase do app Projetos Global, as solicitações já liberadas para o Financeiro
// (liberado_financeiro / pagamento_agendado / pago) e grava/atualiza a "nota fiscal" correspondente
// aqui no Financeiro. A empresa (CNPJ) nunca é definida por esta função — fica em branco até
// alguém classificar na Central de Pagamentos (o Projetos Global não separa por empresa).
//
// Segredos necessários (supabase secrets set, neste projeto):
//   PROJETOS_GLOBAL_SUPABASE_URL, PROJETOS_GLOBAL_SUPABASE_ANON_KEY,
//   PROJETOS_GLOBAL_SERVICE_EMAIL, PROJETOS_GLOBAL_SERVICE_PASSWORD

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STATUS_LIBERADOS = ['liberado_financeiro', 'pagamento_agendado', 'pago'];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const pgUrl = Deno.env.get('PROJETOS_GLOBAL_SUPABASE_URL');
    const pgAnonKey = Deno.env.get('PROJETOS_GLOBAL_SUPABASE_ANON_KEY');
    const pgEmail = Deno.env.get('PROJETOS_GLOBAL_SERVICE_EMAIL');
    const pgPassword = Deno.env.get('PROJETOS_GLOBAL_SERVICE_PASSWORD');
    if (!pgUrl || !pgAnonKey || !pgEmail || !pgPassword) {
      return json({ error: 'Integração com o Projetos Global não configurada (faltam segredos no backend).' }, 500);
    }

    // Cliente local: usa o token de quem chamou, respeitando as permissões normais do Financeiro.
    const local = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const { data: userData, error: userError } = await local.auth.getUser();
    if (userError || !userData?.user) return json({ error: 'Não autenticado.' }, 401);

    // Cliente do Projetos Global: entra como a conta de serviço (perfil só "Financeiro" lá).
    const remote = createClient(pgUrl, pgAnonKey);
    const { error: authError } = await remote.auth.signInWithPassword({ email: pgEmail, password: pgPassword });
    if (authError) return json({ error: `Falha ao autenticar no Projetos Global: ${authError.message}` }, 502);

    const { data: solicitacoes, error: queryError } = await remote
      .from('purchase_requests')
      .select(
        `id, title, amount, status, updated_at,
         suppliers ( name ),
         projects ( pcg_number, scope_name ),
         fiscal_documents ( number, due_date, issue_date, net_amount )`
      )
      .in('status', STATUS_LIBERADOS)
      .is('deleted_at', null);
    await remote.auth.signOut();

    if (queryError) return json({ error: `Falha ao consultar o Projetos Global: ${queryError.message}` }, 502);

    const linhas = (solicitacoes ?? []).map((r: any) => {
      const doc = Array.isArray(r.fiscal_documents) ? r.fiscal_documents[0] : r.fiscal_documents;
      const projeto = Array.isArray(r.projects) ? r.projects[0] : r.projects;
      const fornecedor = Array.isArray(r.suppliers) ? r.suppliers[0] : r.suppliers;
      return {
        projetos_global_request_id: r.id,
        origem: 'projetos_global',
        cliente_ou_fornecedor: fornecedor?.name ?? r.title,
        numero_documento: doc?.number ?? null,
        valor: doc?.net_amount ?? r.amount,
        vencimento: doc?.due_date ?? doc?.issue_date ?? new Date().toISOString().slice(0, 10),
        situacao: r.status === 'pago' ? 'paga' : 'pendente',
        projetos_global_status: r.status,
        projeto_pcg: projeto?.pcg_number ?? null,
        projeto_nome: projeto?.scope_name ?? null,
      };
    });

    // "empresa" fica de fora de propósito: no insert entra em branco, e no update o valor
    // já classificado por alguém aqui no Financeiro não é sobrescrito.
    if (linhas.length > 0) {
      const { error: upsertError } = await local
        .from('notas_fiscais')
        .upsert(linhas, { onConflict: 'projetos_global_request_id' });
      if (upsertError) return json({ error: `Falha ao gravar localmente: ${upsertError.message}` }, 500);
    }

    // Reconciliação: remove daqui o que não está mais liberado/pago no Projetos Global
    // (foi excluído, cancelado ou voltou para uma etapa anterior de aprovação).
    const idsAtivos = linhas.map((l) => l.projetos_global_request_id);
    let removida = local.from('notas_fiscais').delete({ count: 'exact' }).eq('origem', 'projetos_global');
    if (idsAtivos.length > 0) removida = removida.not('projetos_global_request_id', 'in', `(${idsAtivos.join(',')})`);
    const { error: deleteError, count } = await removida;
    if (deleteError) return json({ error: `Falha ao limpar registros antigos: ${deleteError.message}` }, 500);

    return json({ sincronizadas: linhas.length, removidas: count ?? 0 });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Erro inesperado na sincronização.' }, 500);
  }
});
