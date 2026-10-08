// Busca, na API do Projetos Global, as notas fiscais já liberadas/pagas para o Financeiro e
// grava/atualiza/remove a "nota fiscal" correspondente aqui. Quando a API já informa a empresa
// (empresa.cnpj/nome), ela entra classificada direto; quando vem nula, fica na fila de
// classificação da Central de Pagamentos.
//
// Segredo necessário (supabase secrets set, neste projeto): PROJETOS_GLOBAL_SYNC_TOKEN

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { empresaDoProjetos } from '../_shared/empresas.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_URL = 'https://projetos-global.netlify.app/api/integracao/financeiro/notas';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const token = Deno.env.get('PROJETOS_GLOBAL_SYNC_TOKEN');
    if (!token) return json({ error: 'Integração com o Projetos Global não configurada (falta o segredo no backend).' }, 500);

    // Cliente local: usa o token de quem chamou, respeitando as permissões normais do Financeiro.
    const local = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const { data: userData, error: userError } = await local.auth.getUser();
    if (userError || !userData?.user) return json({ error: 'Não autenticado.' }, 401);

    const resposta = await fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } });
    if (resposta.status === 401) {
      return json({ error: 'O Projetos Global recusou a chave da integração (verifique FINANCEIRO_SYNC_TOKEN no Netlify do Projetos).' }, 502);
    }
    if (!resposta.ok) {
      return json({ error: `Falha ao consultar o Projetos Global (HTTP ${resposta.status}).` }, 502);
    }
    const corpo = await resposta.json();
    const notas = Array.isArray(corpo?.notas) ? corpo.notas : [];

    const linhas = notas.map((n: any) => ({
      projetos_global_request_id: n.id,
      origem: 'projetos_global',
      cliente_ou_fornecedor: n.fornecedor?.nome ?? 'Fornecedor não informado',
      numero_documento: n.documento?.numero ?? null,
      valor: n.documento?.valor_liquido ?? n.documento?.valor,
      vencimento: n.documento?.vencimento ?? new Date().toISOString().slice(0, 10),
      forma_pagamento: n.documento?.forma_pagamento_texto ?? null,
      situacao: n.situacao === 'pago' ? 'paga' : 'pendente',
      projetos_global_status: n.situacao ?? null,
      projeto_pcg: n.projeto?.pcg ?? null,
      projeto_nome: null,
      empresaApi: empresaDoProjetos(n.empresa?.cnpj, n.empresa?.nome),
    }));

    // "empresa" fica de fora do upsert de propósito: no insert entra em branco, e no update uma
    // classificação manual já feita aqui não é sobrescrita. Preenchemos a empresa que a API já
    // manda resolvida (quando não nula) num segundo passo, só em cima do que ainda estiver em
    // branco — a API nunca troca uma classificação humana já feita.
    if (linhas.length > 0) {
      const paraUpsert = linhas.map(({ empresaApi: _e, ...resto }) => resto);
      const { error: upsertError } = await local
        .from('notas_fiscais')
        .upsert(paraUpsert, { onConflict: 'projetos_global_request_id' });
      if (upsertError) return json({ error: `Falha ao gravar localmente: ${upsertError.message}` }, 500);

      for (const linha of linhas) {
        if (!linha.empresaApi) continue;
        const { error: classificaError } = await local
          .from('notas_fiscais')
          .update({ empresa: linha.empresaApi })
          .eq('projetos_global_request_id', linha.projetos_global_request_id)
          .is('empresa', null);
        if (classificaError) return json({ error: `Falha ao classificar empresa: ${classificaError.message}` }, 500);
      }
    }

    // Reconciliação: remove daqui o que não está mais liberado/pago no Projetos Global.
    const idsAtivos = linhas.map((l: { projetos_global_request_id: string }) => l.projetos_global_request_id);
    let removida = local.from('notas_fiscais').delete({ count: 'exact' }).eq('origem', 'projetos_global');
    if (idsAtivos.length > 0) removida = removida.not('projetos_global_request_id', 'in', `(${idsAtivos.join(',')})`);
    const { error: deleteError, count } = await removida;
    if (deleteError) return json({ error: `Falha ao limpar registros antigos: ${deleteError.message}` }, 500);

    return json({ sincronizadas: linhas.length, removidas: count ?? 0 });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Erro inesperado na sincronização.' }, 500);
  }
});
