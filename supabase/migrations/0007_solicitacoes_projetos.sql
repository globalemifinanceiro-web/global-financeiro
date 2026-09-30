-- Espelho das solicitações do Projetos Global em todas as etapas (lançada → Gestor → Diretor →
-- Financeiro → paga), para o alerta de solicitação nova e o acompanhamento "com quem está parado".
-- Alimentada pela Edge Function sync-solicitacoes-projetos (rota /api/integracao/financeiro/solicitacoes do Projetos).
-- Rode no SQL Editor do Supabase depois do 0006_contas_pagar_planilhas.sql.

create table if not exists public.solicitacoes_projetos (
  id uuid primary key,
  codigo integer,
  tipo text,
  titulo text not null,
  situacao text not null,
  valor numeric(14,2),
  empresa text,
  projeto_pcg text,
  projeto_cliente text,
  fornecedor text,
  lancado_por_nome text,
  lancado_em timestamptz,
  atualizado_em timestamptz not null,
  etapa_nome text,
  etapa_papel text,
  etapa_desde timestamptz,
  etapa_prazo timestamptz,
  responsaveis jsonb not null default '[]',
  historico jsonb not null default '[]',
  sincronizado_em timestamptz not null default now()
);

create index if not exists solicitacoes_projetos_situacao_idx on public.solicitacoes_projetos (situacao);
create index if not exists solicitacoes_projetos_atualizado_idx on public.solicitacoes_projetos (atualizado_em desc);

alter table public.solicitacoes_projetos enable row level security;

drop policy if exists "solicitacoes_projetos_select" on public.solicitacoes_projetos;
create policy "solicitacoes_projetos_select" on public.solicitacoes_projetos for select to authenticated using (true);
drop policy if exists "solicitacoes_projetos_insert" on public.solicitacoes_projetos;
create policy "solicitacoes_projetos_insert" on public.solicitacoes_projetos for insert to authenticated with check (true);
drop policy if exists "solicitacoes_projetos_update" on public.solicitacoes_projetos;
create policy "solicitacoes_projetos_update" on public.solicitacoes_projetos for update to authenticated using (true);
