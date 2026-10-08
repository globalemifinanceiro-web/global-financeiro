// Busca no Projetos Global os orçamentos/propostas aprovados pela Diretoria (só o que mudou desde a
// última sincronização) e espelha em orcamentos_projetos. situacao "cancelado" = aprovação desfeita:
// sai daqui. Os links dos arquivos expiram em 1 hora, então o arquivo original e a cópia com os
// carimbos de assinatura são copiados para o bucket "orcamentos" do Financeiro.
//
// Segredo: PROJETOS_GLOBAL_SYNC_TOKEN

import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { empresaDoProjetos } from '../_shared/empresas.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_URL = 'https://projetos-global.netlify.app/api/integracao/financeiro/orcamentos';
const BUCKET = 'orcamentos';
const MARGEM_MS = 10 * 60 * 1000;

type ArquivoRota = { nome?: string; sha256?: string; url?: string | null } | null;
type Copia = { nome: string | null; sha256: string | null; path: string | null };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function nomeSeguro(nome: string): string {
  return nome.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '_').slice(0, 120);
}

/**
 * Copia o arquivo do Projetos para o bucket, se ainda não foi copiado (mesmo sha256). Se o link vier
 * vazio ou falhar, mantém a cópia que já existia — o arquivo não some por causa de uma falha pontual.
 */
async function copiarArquivo(local: SupabaseClient, id: string, arquivo: ArquivoRota, anterior: Copia): Promise<Copia> {
  if (!arquivo?.sha256) return anterior;
  if (anterior.sha256 === arquivo.sha256 && anterior.path) return anterior;
  if (!arquivo.url) return anterior;
  try {
    const resposta = await fetch(arquivo.url);
    if (!resposta.ok) return anterior;
    const conteudo = await resposta.arrayBuffer();
    const path = `${id}/${arquivo.sha256.slice(0, 16)}-${nomeSeguro(arquivo.nome ?? 'orcamento')}`;
    const { error } = await local.storage.from(BUCKET).upload(path, conteudo, {
      contentType: resposta.headers.get('content-type') ?? 'application/octet-stream',
      upsert: true,
    });
    if (error) return anterior;
    return { nome: arquivo.nome ?? null, sha256: arquivo.sha256, path };
  } catch {
    return anterior;
  }
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
      .from('orcamentos_projetos')
      .select('atualizado_em')
      .order('atualizado_em', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (ultimaError) throw new Error(ultimaError.message);

    const url = new URL(API_URL);
    if (ultima?.atualizado_em) url.searchParams.set('desde', new Date(new Date(ultima.atualizado_em).getTime() - MARGEM_MS).toISOString());

    const resposta = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (resposta.status === 401) return json({ error: 'O Projetos Global recusou a chave da integração (verifique FINANCEIRO_SYNC_TOKEN no Netlify do Projetos).' }, 502);
    if (resposta.status === 404) return json({ error: 'O Projetos Global ainda não publicou a rota de orçamentos.' }, 502);
    if (!resposta.ok) return json({ error: `Falha ao consultar o Projetos Global (HTTP ${resposta.status}).` }, 502);
    const corpo = await resposta.json();
    const orcamentos: any[] = Array.isArray(corpo?.orcamentos) ? corpo.orcamentos : [];

    const cancelados = orcamentos.filter((o) => o?.situacao === 'cancelado' && o?.id).map((o) => o.id as string);
    const aprovados = orcamentos.filter((o) => o?.situacao === 'aprovado' && o?.id && o?.aprovado_em);

    // Cópias já existentes, para não baixar de novo o que não mudou.
    const anteriores = new Map<string, { arquivo: Copia; assinado: Copia }>();
    if (aprovados.length > 0) {
      const { data, error } = await local
        .from('orcamentos_projetos')
        .select('id, arquivo_nome, arquivo_sha256, arquivo_path, assinado_nome, assinado_sha256, assinado_path')
        .in('id', aprovados.map((o) => o.id));
      if (error) throw new Error(error.message);
      for (const r of data ?? []) {
        anteriores.set(r.id, {
          arquivo: { nome: r.arquivo_nome, sha256: r.arquivo_sha256, path: r.arquivo_path },
          assinado: { nome: r.assinado_nome, sha256: r.assinado_sha256, path: r.assinado_path },
        });
      }
    }

    const vazio: Copia = { nome: null, sha256: null, path: null };
    const linhas = [];
    for (const o of aprovados) {
      const antes = anteriores.get(o.id) ?? { arquivo: vazio, assinado: vazio };
      const arquivo = await copiarArquivo(local, o.id, o.arquivo, antes.arquivo);
      const assinado = await copiarArquivo(local, o.id, o.documento_assinado, antes.assinado);
      const assinaturas: any[] = Array.isArray(o.assinaturas) ? o.assinaturas : [];
      const ultimaAprovacao = (etapa: string) =>
        [...assinaturas].reverse().find((a) => a?.etapa === etapa && (!a?.acao || a.acao === 'aprovar'));
      const gestor = ultimaAprovacao('Gestor');
      const diretoria = ultimaAprovacao('Diretoria');

      linhas.push({
        id: o.id,
        codigo: o.codigo ?? null,
        projeto_pcg: o.projeto?.pcg ?? null,
        projeto_cliente: o.projeto?.cliente ?? null,
        empresa: empresaDoProjetos(o.empresa?.cnpj, o.empresa?.nome),
        fornecedor: o.fornecedor?.nome ?? null,
        numero_documento: o.numero ?? null,
        emissao: o.emissao ?? null,
        validade: o.validade ?? null,
        valor_bruto: o.valor_bruto ?? null,
        desconto: o.desconto ?? null,
        valor: o.valor_liquido ?? o.valor_bruto ?? null,
        condicao_pagamento: o.condicao_pagamento ?? null,
        descricao: o.descricao ?? null,
        itens: Array.isArray(o.itens) ? o.itens : [],
        enviado_por: typeof o.enviado_por === 'string' ? o.enviado_por : (o.enviado_por?.nome ?? null),
        gestor_nome: gestor?.nome ?? null,
        gestor_em: gestor?.data ?? null,
        diretoria_nome: diretoria?.nome ?? null,
        aprovado_em: o.aprovado_em,
        atualizado_em: o.atualizado_em ?? o.aprovado_em,
        arquivo_nome: arquivo.nome,
        arquivo_sha256: arquivo.sha256,
        arquivo_path: arquivo.path,
        assinado_nome: assinado.nome,
        assinado_sha256: assinado.sha256,
        assinado_path: assinado.path,
        sincronizado_em: new Date().toISOString(),
      });
    }

    if (linhas.length > 0) {
      const { error } = await local.from('orcamentos_projetos').upsert(linhas, { onConflict: 'id' });
      if (error) return json({ error: `Falha ao gravar localmente: ${error.message}` }, 500);
    }

    if (cancelados.length > 0) {
      const { data: removidos, error } = await local.from('orcamentos_projetos').delete().in('id', cancelados).select('arquivo_path, assinado_path');
      if (error) return json({ error: `Falha ao remover orçamentos cancelados: ${error.message}` }, 500);
      const caminhos = (removidos ?? []).flatMap((r) => [r.arquivo_path, r.assinado_path]).filter(Boolean) as string[];
      if (caminhos.length > 0) await local.storage.from(BUCKET).remove(caminhos);
    }

    return json({ sincronizados: linhas.length, cancelados: cancelados.length });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Erro inesperado na sincronização.' }, 500);
  }
});
